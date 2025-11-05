import { spawn, ChildProcess } from 'child_process';
import { ipcMain, BrowserWindow } from 'electron';
import path from 'path';
import { app } from 'electron';

/**
 * CLI command execution result
 */
export interface CommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  duration: number;
}

/**
 * CLI command execution options
 */
export interface CommandOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  timeout?: number;
}

/**
 * Running command metadata
 */
interface RunningCommand {
  id: string;
  command: string;
  args: string[];
  process: ChildProcess;
  startTime: number;
  stdout: string[];
  stderr: string[];
}

/**
 * CLI Executor Service
 * Spawns and manages miyabi CLI commands
 */
class CLIExecutorService {
  private runningCommands: Map<string, RunningCommand> = new Map();
  private commandCounter = 0;

  /**
   * Execute a miyabi command
   */
  async execute(
    command: string,
    args: string[] = [],
    options: CommandOptions = {}
  ): Promise<CommandResult> {
    const startTime = Date.now();
    const commandId = this.generateCommandId();

    return new Promise((resolve) => {
      const {
        cwd = app.getPath('home'),
        env = process.env,
        timeout = 30000,
      } = options;

      // Find miyabi binary
      const miyabiBin = this.findMiyabiBinary();
      if (!miyabiBin) {
        resolve({
          success: false,
          stdout: '',
          stderr: 'Miyabi CLI not found. Please ensure miyabi is installed.',
          exitCode: 1,
          duration: Date.now() - startTime,
        });
        return;
      }

      console.log(`[CLI] Executing: ${command} ${args.join(' ')}`);

      // Spawn process
      const proc = spawn(miyabiBin, [command, ...args], {
        cwd,
        env: { ...env, RUST_LOG: 'info' },
        shell: false,
      });

      const metadata: RunningCommand = {
        id: commandId,
        command,
        args,
        process: proc,
        startTime,
        stdout: [],
        stderr: [],
      };

      this.runningCommands.set(commandId, metadata);

      // Setup timeout
      const timeoutHandle = setTimeout(() => {
        if (proc.pid) {
          console.warn(`[CLI] Command timeout after ${timeout}ms:`, command);
          proc.kill('SIGTERM');
        }
      }, timeout);

      // Collect stdout
      proc.stdout?.on('data', (data) => {
        const output = data.toString();
        metadata.stdout.push(output);
        this.emitCommandOutput(commandId, 'stdout', output);
      });

      // Collect stderr
      proc.stderr?.on('data', (data) => {
        const output = data.toString();
        metadata.stderr.push(output);
        this.emitCommandOutput(commandId, 'stderr', output);
      });

      // Handle exit
      proc.on('close', (exitCode) => {
        clearTimeout(timeoutHandle);
        this.runningCommands.delete(commandId);

        const duration = Date.now() - startTime;
        const result: CommandResult = {
          success: exitCode === 0,
          stdout: metadata.stdout.join(''),
          stderr: metadata.stderr.join(''),
          exitCode,
          duration,
        };

        console.log(
          `[CLI] Command ${exitCode === 0 ? 'succeeded' : 'failed'} (${duration}ms):`,
          command
        );

        resolve(result);
      });

      // Handle errors
      proc.on('error', (error) => {
        clearTimeout(timeoutHandle);
        this.runningCommands.delete(commandId);

        const duration = Date.now() - startTime;
        const result: CommandResult = {
          success: false,
          stdout: metadata.stdout.join(''),
          stderr: `Process error: ${error.message}\n${metadata.stderr.join('')}`,
          exitCode: null,
          duration,
        };

        console.error('[CLI] Command error:', error);
        resolve(result);
      });
    });
  }

  /**
   * Kill a running command
   */
  killCommand(commandId: string): boolean {
    const command = this.runningCommands.get(commandId);
    if (!command) {
      console.warn('[CLI] Command not found:', commandId);
      return false;
    }

    try {
      command.process.kill('SIGTERM');
      this.runningCommands.delete(commandId);
      console.log('[CLI] Command killed:', commandId);
      return true;
    } catch (error) {
      console.error('[CLI] Error killing command:', error);
      return false;
    }
  }

  /**
   * Get list of running commands
   */
  getRunningCommands(): Array<{
    id: string;
    command: string;
    args: string[];
    duration: number;
  }> {
    const now = Date.now();
    return Array.from(this.runningCommands.values()).map((cmd) => ({
      id: cmd.id,
      command: cmd.command,
      args: cmd.args,
      duration: now - cmd.startTime,
    }));
  }

  /**
   * Check if miyabi CLI is available
   */
  async checkCLI(): Promise<{ available: boolean; version?: string; path?: string }> {
    const miyabiBin = this.findMiyabiBinary();
    if (!miyabiBin) {
      return { available: false };
    }

    try {
      const result = await this.execute('--version');
      if (result.success) {
        return {
          available: true,
          version: result.stdout.trim(),
          path: miyabiBin,
        };
      }
      return { available: false };
    } catch (error) {
      return { available: false };
    }
  }

  /**
   * Find miyabi binary in PATH
   */
  private findMiyabiBinary(): string | null {
    // Check common locations
    const possiblePaths = [
      path.join(app.getPath('home'), '.cargo', 'bin', 'miyabi'),
      '/usr/local/bin/miyabi',
      '/opt/homebrew/bin/miyabi',
      // Development build
      path.join(app.getPath('home'), 'Dev', 'miyabi-private', 'target', 'release', 'miyabi'),
    ];

    const { execSync } = require('child_process');

    // Try which/where command first
    try {
      const whichCmd = process.platform === 'win32' ? 'where' : 'which';
      const result = execSync(`${whichCmd} miyabi`, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
      if (result) return result.split('\n')[0];
    } catch {
      // Command not in PATH, continue checking
    }

    // Check possible paths
    for (const possiblePath of possiblePaths) {
      try {
        const fs = require('fs');
        if (fs.existsSync(possiblePath)) {
          return possiblePath;
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  /**
   * Generate unique command ID
   */
  private generateCommandId(): string {
    this.commandCounter++;
    return `cmd-${Date.now()}-${this.commandCounter}`;
  }

  /**
   * Emit command output to renderer
   */
  private emitCommandOutput(
    commandId: string,
    stream: 'stdout' | 'stderr',
    data: string
  ): void {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach((window) => {
      window.webContents.send('cli:output', {
        commandId,
        stream,
        data,
        timestamp: Date.now(),
      });
    });
  }
}

// Singleton instance
const cliExecutorService = new CLIExecutorService();

/**
 * Register IPC handlers for CLI executor
 */
export function registerCLIExecutorHandlers(): void {
  // Execute command
  ipcMain.handle(
    'cli:execute',
    async (_, command: string, args?: string[], options?: CommandOptions) => {
      try {
        const result = await cliExecutorService.execute(command, args, options);
        return { success: true, result };
      } catch (error) {
        console.error('[CLI IPC] Error executing command:', error);
        return { success: false, error: (error as Error).message };
      }
    }
  );

  // Kill command
  ipcMain.handle('cli:kill', async (_, commandId: string) => {
    try {
      const killed = cliExecutorService.killCommand(commandId);
      return { success: killed };
    } catch (error) {
      console.error('[CLI IPC] Error killing command:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Get running commands
  ipcMain.handle('cli:running', async () => {
    try {
      const commands = cliExecutorService.getRunningCommands();
      return { success: true, commands };
    } catch (error) {
      console.error('[CLI IPC] Error getting running commands:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Check CLI availability
  ipcMain.handle('cli:check', async () => {
    try {
      const status = await cliExecutorService.checkCLI();
      return { success: true, ...status };
    } catch (error) {
      console.error('[CLI IPC] Error checking CLI:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  console.log('[CLI] IPC handlers registered');
}

export default cliExecutorService;
