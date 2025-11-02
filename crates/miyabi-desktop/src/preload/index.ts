import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Application methods
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    getName: () => ipcRenderer.invoke('app:getName'),
    getPath: (name: 'home' | 'appData' | 'userData' | 'temp') =>
      ipcRenderer.invoke('app:getPath', name),
  },

  // Worktree methods
  worktree: {
    list: () => ipcRenderer.invoke('worktrees:list'),
    cleanup: (worktreePath: string) => ipcRenderer.invoke('worktrees:cleanup', worktreePath),
    open: (worktreePath: string) => ipcRenderer.invoke('worktrees:open', worktreePath),
    getGraph: () => ipcRenderer.invoke('worktrees:graph'),
  },

  // Agent methods
  agent: {
    getRunning: () => ipcRenderer.invoke('agent:getRunning'),
    pause: (agentId: string) => ipcRenderer.invoke('agent:pause', agentId),
    cancel: (agentId: string) => ipcRenderer.invoke('agent:cancel', agentId),
  },

  // Project methods
  project: {
    open: (projectPath: string) => ipcRenderer.invoke('project:open', projectPath),
    close: () => ipcRenderer.invoke('project:close'),
  },

  // System methods
  system: {
    getInfo: () => ipcRenderer.invoke('system:getInfo'),
  },

  // Dashboard methods
  dashboard: {
    getSnapshot: () => ipcRenderer.invoke('dashboard:getSnapshot'),
  },

  // Event listeners
  on: (channel: string, callback: (...args: any[]) => void) => {
    const validChannels = [
      'show-preferences',
      'open-project',
      'close-project',
      'worktree-changed',
      'agent-log',
      'agent-progress',
    ];

    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (_, ...args) => callback(...args));
    }
  },

  // Remove event listeners
  removeListener: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, callback);
  },
});

console.log('Miyabi Desktop - Preload script initialized');
