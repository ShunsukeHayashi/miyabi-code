import chokidar, { FSWatcher } from 'chokidar';
import { ipcMain, BrowserWindow } from 'electron';
import path from 'path';

/**
 * File change event emitted to renderer
 */
export interface FileChangeEvent {
  type: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';
  path: string;
  timestamp: number;
}

/**
 * File watcher configuration
 */
interface WatcherConfig {
  ignored?: string[];
  persistent?: boolean;
  ignoreInitial?: boolean;
  awaitWriteFinish?: boolean | {
    stabilityThreshold?: number;
    pollInterval?: number;
  };
}

/**
 * File Watcher Service
 * Watches for file system changes in the Miyabi project directory
 */
class FileWatcherService {
  private watcher: FSWatcher | null = null;
  private watchedPath: string | null = null;
  private isWatching = false;

  /**
   * Start watching a directory
   */
  startWatching(projectPath: string, config?: WatcherConfig): void {
    if (this.isWatching) {
      console.warn('[FileWatcher] Already watching. Stop current watcher first.');
      return;
    }

    const defaultConfig: WatcherConfig = {
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/target/**',
        '**/dist/**',
        '**/dist-electron/**',
        '**/.next/**',
        '**/.cache/**',
        '**/*.log',
        '**/.DS_Store',
      ],
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100,
      },
    };

    const finalConfig = { ...defaultConfig, ...config };

    console.log('[FileWatcher] Starting watcher for:', projectPath);

    this.watcher = chokidar.watch(projectPath, finalConfig);
    this.watchedPath = projectPath;
    this.isWatching = true;

    // Setup event listeners
    this.watcher
      .on('add', (filePath) => this.handleFileChange('add', filePath))
      .on('change', (filePath) => this.handleFileChange('change', filePath))
      .on('unlink', (filePath) => this.handleFileChange('unlink', filePath))
      .on('addDir', (dirPath) => this.handleFileChange('addDir', dirPath))
      .on('unlinkDir', (dirPath) => this.handleFileChange('unlinkDir', dirPath))
      .on('error', (error) => this.handleError(error))
      .on('ready', () => {
        console.log('[FileWatcher] Ready and watching:', projectPath);
      });
  }

  /**
   * Stop watching
   */
  async stopWatching(): Promise<void> {
    if (!this.watcher || !this.isWatching) {
      console.warn('[FileWatcher] No active watcher to stop.');
      return;
    }

    console.log('[FileWatcher] Stopping watcher...');

    try {
      await this.watcher.close();
      this.watcher = null;
      this.watchedPath = null;
      this.isWatching = false;
      console.log('[FileWatcher] Watcher stopped successfully.');
    } catch (error) {
      console.error('[FileWatcher] Error stopping watcher:', error);
      throw error;
    }
  }

  /**
   * Get current watch status
   */
  getStatus(): { isWatching: boolean; watchedPath: string | null } {
    return {
      isWatching: this.isWatching,
      watchedPath: this.watchedPath,
    };
  }

  /**
   * Handle file change events
   */
  private handleFileChange(
    type: FileChangeEvent['type'],
    filePath: string
  ): void {
    const event: FileChangeEvent = {
      type,
      path: filePath,
      timestamp: Date.now(),
    };

    // Emit to all windows
    const windows = BrowserWindow.getAllWindows();
    windows.forEach((window) => {
      window.webContents.send('file:changed', event);
    });

    // Log for debugging (can be disabled in production)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[FileWatcher] ${type}:`, path.basename(filePath));
    }
  }

  /**
   * Handle watcher errors
   */
  private handleError(error: Error): void {
    console.error('[FileWatcher] Error:', error);

    // Emit error to all windows
    const windows = BrowserWindow.getAllWindows();
    windows.forEach((window) => {
      window.webContents.send('file:watcher-error', {
        message: error.message,
        timestamp: Date.now(),
      });
    });
  }
}

// Singleton instance
const fileWatcherService = new FileWatcherService();

/**
 * Register IPC handlers for file watcher
 */
export function registerFileWatcherHandlers(): void {
  // Start watching
  ipcMain.handle(
    'fileWatcher:start',
    async (_, projectPath: string, config?: WatcherConfig) => {
      try {
        fileWatcherService.startWatching(projectPath, config);
        return { success: true };
      } catch (error) {
        console.error('[FileWatcher IPC] Error starting watcher:', error);
        return { success: false, error: (error as Error).message };
      }
    }
  );

  // Stop watching
  ipcMain.handle('fileWatcher:stop', async () => {
    try {
      await fileWatcherService.stopWatching();
      return { success: true };
    } catch (error) {
      console.error('[FileWatcher IPC] Error stopping watcher:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Get status
  ipcMain.handle('fileWatcher:status', async () => {
    try {
      const status = fileWatcherService.getStatus();
      return { success: true, ...status };
    } catch (error) {
      console.error('[FileWatcher IPC] Error getting status:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  console.log('[FileWatcher] IPC handlers registered');
}

export default fileWatcherService;
