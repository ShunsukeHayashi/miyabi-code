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
    copyPath: (worktreePath: string) => ipcRenderer.invoke('worktrees:copyPath', worktreePath),
    getGraph: () => ipcRenderer.invoke('worktrees:graph'),
  },

  // Agent methods
  agent: {
    startMonitoring: () => ipcRenderer.invoke('agent:startMonitoring'),
    stopMonitoring: () => ipcRenderer.invoke('agent:stopMonitoring'),
    getRunning: () => ipcRenderer.invoke('agent:getRunning'),
    getAll: () => ipcRenderer.invoke('agent:getAll'),
    get: (agentId: string) => ipcRenderer.invoke('agent:get', agentId),
    pause: (agentId: string) => ipcRenderer.invoke('agent:pause', agentId),
    cancel: (agentId: string) => ipcRenderer.invoke('agent:cancel', agentId),
  },

  // Project methods
  project: {
    open: (projectPath?: string) => ipcRenderer.invoke('project:open', projectPath),
    close: () => ipcRenderer.invoke('project:close'),
    current: () => ipcRenderer.invoke('project:current'),
    recent: () => ipcRenderer.invoke('project:recent'),
    execute: (command: string, args?: string[]) =>
      ipcRenderer.invoke('project:execute', command, args),
  },

  // File Watcher methods
  fileWatcher: {
    start: (projectPath: string, config?: any) =>
      ipcRenderer.invoke('fileWatcher:start', projectPath, config),
    stop: () => ipcRenderer.invoke('fileWatcher:stop'),
    status: () => ipcRenderer.invoke('fileWatcher:status'),
  },

  // CLI Executor methods
  cli: {
    execute: (command: string, args?: string[], options?: any) =>
      ipcRenderer.invoke('cli:execute', command, args, options),
    kill: (commandId: string) => ipcRenderer.invoke('cli:kill', commandId),
    running: () => ipcRenderer.invoke('cli:running'),
    check: () => ipcRenderer.invoke('cli:check'),
  },

  // System methods
  system: {
    getInfo: () => ipcRenderer.invoke('system:getInfo'),
  },

  // Dashboard methods
  dashboard: {
    getSnapshot: () => ipcRenderer.invoke('dashboard:getSnapshot'),
  },

  // GitHub methods
  github: {
    initialize: (token: string, repository: string) =>
      ipcRenderer.invoke('github:initialize', token, repository),
    syncIssues: () => ipcRenderer.invoke('github:syncIssues'),
    getIssues: (filter?: any) => ipcRenderer.invoke('github:getIssues', filter),
    getIssue: (issueNumber: number) => ipcRenderer.invoke('github:getIssue', issueNumber),
    getLabels: () => ipcRenderer.invoke('github:getLabels'),
    getMilestones: () => ipcRenderer.invoke('github:getMilestones'),
  },

  // History methods
  history: {
    recordTask: (task: any) => ipcRenderer.invoke('history:recordTask', task),
    getHistory: (options?: any) => ipcRenderer.invoke('history:getHistory', options),
    getStatistics: (days?: number) => ipcRenderer.invoke('history:getStatistics', days),
    getHealthHistory: (hours?: number) => ipcRenderer.invoke('history:getHealthHistory', hours),
    getCurrentHealth: () => ipcRenderer.invoke('history:getCurrentHealth'),
  },

  // Notification methods
  notification: {
    send: (options: any) => ipcRenderer.invoke('notification:send', options),
    getAll: () => ipcRenderer.invoke('notification:getAll'),
    getUnreadCount: () => ipcRenderer.invoke('notification:getUnreadCount'),
    markAsRead: (id: string) => ipcRenderer.invoke('notification:markAsRead', id),
    dismiss: (id: string) => ipcRenderer.invoke('notification:dismiss', id),
    markAllAsRead: () => ipcRenderer.invoke('notification:markAllAsRead'),
    clearAll: () => ipcRenderer.invoke('notification:clearAll'),
    getPreferences: () => ipcRenderer.invoke('notification:getPreferences'),
    updatePreferences: (updates: any) => ipcRenderer.invoke('notification:updatePreferences', updates),
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
      'agent:updated',
      'agent:log',
      'file:changed',
      'file:watcher-error',
      'cli:output',
      'project:opened',
      'project:closed',
      'notification:new',
      'notification:updated',
      'notification:clicked',
      'notification:action',
      'notification:cleared',
      'notification:preferencesChanged',
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
