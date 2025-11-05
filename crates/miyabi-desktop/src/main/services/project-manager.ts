import { ipcMain, dialog, BrowserWindow } from 'electron';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import fileWatcherService from './file-watcher';
import cliExecutorService from './cli-executor';

/**
 * Miyabi project metadata
 */
export interface MiyabiProject {
  name: string;
  path: string;
  miyabiYml: string | null;
  gitRoot: string | null;
  lastOpened: number;
  recentFiles: string[];
}

/**
 * Project validation result
 */
interface ProjectValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  project?: MiyabiProject;
}

/**
 * Project Manager Service
 * Manages Miyabi project state and operations
 */
class ProjectManagerService {
  private currentProject: MiyabiProject | null = null;
  private recentProjects: MiyabiProject[] = [];
  private readonly maxRecentProjects = 10;

  /**
   * Open a project by path
   */
  async openProject(projectPath: string): Promise<ProjectValidation> {
    console.log('[ProjectManager] Opening project:', projectPath);

    // Validate project
    const validation = await this.validateProject(projectPath);
    if (!validation.valid || !validation.project) {
      return validation;
    }

    // Close current project if any
    if (this.currentProject) {
      await this.closeProject();
    }

    // Set as current project
    this.currentProject = validation.project;
    this.addToRecentProjects(validation.project);

    // Start file watcher
    try {
      fileWatcherService.startWatching(projectPath);
    } catch (error) {
      console.error('[ProjectManager] Error starting file watcher:', error);
      validation.warnings.push('Failed to start file watcher');
    }

    // Emit project opened event
    this.emitProjectEvent('opened', validation.project);

    console.log('[ProjectManager] Project opened successfully:', validation.project.name);
    return validation;
  }

  /**
   * Close current project
   */
  async closeProject(): Promise<void> {
    if (!this.currentProject) {
      console.warn('[ProjectManager] No project to close');
      return;
    }

    console.log('[ProjectManager] Closing project:', this.currentProject.name);

    // Stop file watcher
    try {
      await fileWatcherService.stopWatching();
    } catch (error) {
      console.error('[ProjectManager] Error stopping file watcher:', error);
    }

    const closedProject = this.currentProject;
    this.currentProject = null;

    // Emit project closed event
    this.emitProjectEvent('closed', closedProject);

    console.log('[ProjectManager] Project closed successfully');
  }

  /**
   * Get current project
   */
  getCurrentProject(): MiyabiProject | null {
    return this.currentProject;
  }

  /**
   * Get recent projects
   */
  getRecentProjects(): MiyabiProject[] {
    return this.recentProjects;
  }

  /**
   * Open project picker dialog
   */
  async pickProject(): Promise<string | null> {
    const result = await dialog.showOpenDialog({
      title: 'Open Miyabi Project',
      defaultPath: app.getPath('home'),
      properties: ['openDirectory', 'createDirectory'],
      message: 'Select a Miyabi project directory',
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0] || null;
  }

  /**
   * Validate project directory
   */
  private async validateProject(projectPath: string): Promise<ProjectValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if directory exists
    if (!fs.existsSync(projectPath)) {
      errors.push('Directory does not exist');
      return { valid: false, errors, warnings };
    }

    // Check if it's a directory
    const stats = fs.statSync(projectPath);
    if (!stats.isDirectory()) {
      errors.push('Path is not a directory');
      return { valid: false, errors, warnings };
    }

    // Find .miyabi.yml
    const miyabiYmlPath = path.join(projectPath, '.miyabi.yml');
    const miyabiYml = fs.existsSync(miyabiYmlPath) ? miyabiYmlPath : null;
    if (!miyabiYml) {
      warnings.push('.miyabi.yml not found (optional)');
    }

    // Find git root
    let gitRoot: string | null = null;
    let currentPath = projectPath;
    while (currentPath !== path.dirname(currentPath)) {
      if (fs.existsSync(path.join(currentPath, '.git'))) {
        gitRoot = currentPath;
        break;
      }
      currentPath = path.dirname(currentPath);
    }

    if (!gitRoot) {
      warnings.push('Not a git repository');
    }

    // Extract project name
    const name = path.basename(projectPath);

    const project: MiyabiProject = {
      name,
      path: projectPath,
      miyabiYml,
      gitRoot,
      lastOpened: Date.now(),
      recentFiles: [],
    };

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      project,
    };
  }

  /**
   * Add project to recent projects list
   */
  private addToRecentProjects(project: MiyabiProject): void {
    // Remove if already exists
    this.recentProjects = this.recentProjects.filter(
      (p) => p.path !== project.path
    );

    // Add to beginning
    this.recentProjects.unshift(project);

    // Keep only max recent projects
    if (this.recentProjects.length > this.maxRecentProjects) {
      this.recentProjects = this.recentProjects.slice(0, this.maxRecentProjects);
    }

    // TODO: Persist to storage
  }

  /**
   * Emit project event to renderer
   */
  private emitProjectEvent(event: 'opened' | 'closed', project: MiyabiProject): void {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach((window) => {
      window.webContents.send(`project:${event}`, project);
    });
  }

  /**
   * Execute miyabi command in project context
   */
  async executeCommand(command: string, args: string[] = []): Promise<any> {
    if (!this.currentProject) {
      throw new Error('No project is currently open');
    }

    return await cliExecutorService.execute(command, args, {
      cwd: this.currentProject.path,
    });
  }
}

// Singleton instance
const projectManagerService = new ProjectManagerService();

/**
 * Register IPC handlers for project manager
 */
export function registerProjectManagerHandlers(): void {
  // Open project
  ipcMain.handle('project:open', async (_, projectPath?: string) => {
    try {
      let pathToOpen: string | null = projectPath || null;
      if (!pathToOpen) {
        pathToOpen = await projectManagerService.pickProject();
        if (!pathToOpen) {
          return { success: false, cancelled: true };
        }
      }

      const result = await projectManagerService.openProject(pathToOpen);
      return { success: result.valid, ...result };
    } catch (error) {
      console.error('[ProjectManager IPC] Error opening project:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Close project
  ipcMain.handle('project:close', async () => {
    try {
      await projectManagerService.closeProject();
      return { success: true };
    } catch (error) {
      console.error('[ProjectManager IPC] Error closing project:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Get current project
  ipcMain.handle('project:current', async () => {
    try {
      const project = projectManagerService.getCurrentProject();
      return { success: true, project };
    } catch (error) {
      console.error('[ProjectManager IPC] Error getting current project:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Get recent projects
  ipcMain.handle('project:recent', async () => {
    try {
      const projects = projectManagerService.getRecentProjects();
      return { success: true, projects };
    } catch (error) {
      console.error('[ProjectManager IPC] Error getting recent projects:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Execute command in project context
  ipcMain.handle('project:execute', async (_, command: string, args?: string[]) => {
    try {
      const result = await projectManagerService.executeCommand(command, args);
      return { success: true, result };
    } catch (error) {
      console.error('[ProjectManager IPC] Error executing command:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  console.log('[ProjectManager] IPC handlers registered');
}

export default projectManagerService;
