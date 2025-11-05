import { ipcMain, Notification, BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { app } from 'electron';

/**
 * Notification types
 */
export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Notification options
 */
export interface NotificationOptions {
  title: string;
  body: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  silent?: boolean;
  actions?: NotificationAction[];
  data?: Record<string, any>;
  timeout?: number; // ms, 0 = no timeout
  sound?: boolean;
  badge?: boolean;
}

/**
 * Notification action
 */
export interface NotificationAction {
  type: string;
  text: string;
}

/**
 * Stored notification
 */
export interface StoredNotification extends NotificationOptions {
  id: string;
  timestamp: number;
  read: boolean;
  dismissed: boolean;
}

/**
 * Notification preferences
 */
export interface NotificationPreferences {
  enabled: boolean;
  sound: boolean;
  badge: boolean;
  nativeNotifications: boolean;
  types: {
    info: boolean;
    success: boolean;
    warning: boolean;
    error: boolean;
  };
  priorities: {
    low: boolean;
    normal: boolean;
    high: boolean;
    urgent: boolean;
  };
}

/**
 * Notification Service
 * Manages native OS notifications and in-app notification system
 */
class NotificationService {
  private notifications: Map<string, StoredNotification> = new Map();
  private preferences: NotificationPreferences = {
    enabled: true,
    sound: true,
    badge: true,
    nativeNotifications: true,
    types: {
      info: true,
      success: true,
      warning: true,
      error: true,
    },
    priorities: {
      low: true,
      normal: true,
      high: true,
      urgent: true,
    },
  };
  private preferencesPath: string;
  private maxNotifications = 100; // Keep last 100 notifications

  constructor() {
    const userDataPath = app.getPath('userData');
    this.preferencesPath = path.join(userDataPath, 'notification-preferences.json');
  }

  /**
   * Initialize notification service
   */
  async initialize(): Promise<void> {
    await this.loadPreferences();
    console.log('[Notifications] Service initialized');
  }

  /**
   * Load notification preferences from disk
   */
  private async loadPreferences(): Promise<void> {
    try {
      const data = await fs.readFile(this.preferencesPath, 'utf-8');
      this.preferences = JSON.parse(data);
      console.log('[Notifications] Preferences loaded');
    } catch (error) {
      // File doesn't exist or is invalid, use defaults
      console.log('[Notifications] Using default preferences');
      await this.savePreferences();
    }
  }

  /**
   * Save notification preferences to disk
   */
  private async savePreferences(): Promise<void> {
    try {
      await fs.writeFile(this.preferencesPath, JSON.stringify(this.preferences, null, 2));
      console.log('[Notifications] Preferences saved');
    } catch (error) {
      console.error('[Notifications] Error saving preferences:', error);
    }
  }

  /**
   * Get current preferences
   */
  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  /**
   * Update preferences
   */
  async updatePreferences(updates: Partial<NotificationPreferences>): Promise<void> {
    this.preferences = {
      ...this.preferences,
      ...updates,
    };
    await this.savePreferences();
    this.emitPreferencesChanged();
  }

  /**
   * Send notification
   */
  async send(options: NotificationOptions): Promise<string> {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const notification: StoredNotification = {
      id,
      timestamp: Date.now(),
      read: false,
      dismissed: false,
      type: options.type || 'info',
      priority: options.priority || 'normal',
      ...options,
    };

    // Check if notification should be shown based on preferences
    if (!this.shouldShowNotification(notification)) {
      return id;
    }

    // Store notification
    this.notifications.set(id, notification);
    this.trimNotifications();

    // Send native OS notification
    if (this.preferences.nativeNotifications && Notification.isSupported()) {
      this.sendNativeNotification(notification);
    }

    // Emit to renderer for in-app notification
    this.emitNotification(notification);

    return id;
  }

  /**
   * Check if notification should be shown based on preferences
   */
  private shouldShowNotification(notification: StoredNotification): boolean {
    if (!this.preferences.enabled) {
      return false;
    }

    const type = notification.type || 'info';
    const priority = notification.priority || 'normal';

    return (
      this.preferences.types[type] &&
      this.preferences.priorities[priority]
    );
  }

  /**
   * Send native OS notification
   */
  private sendNativeNotification(notification: StoredNotification): void {
    try {
      const nativeNotification = new Notification({
        title: notification.title,
        body: notification.body,
        silent: notification.silent || !this.preferences.sound,
        urgency: this.mapPriorityToUrgency(notification.priority || 'normal'),
        timeoutType: notification.timeout === 0 ? 'never' : 'default',
      });

      nativeNotification.on('click', () => {
        this.handleNotificationClick(notification.id);
      });

      nativeNotification.on('action', (event, index) => {
        if (notification.actions && notification.actions[index]) {
          this.handleNotificationAction(notification.id, notification.actions[index].type);
        }
      });

      nativeNotification.show();
    } catch (error) {
      console.error('[Notifications] Error showing native notification:', error);
    }
  }

  /**
   * Map priority to native urgency level
   */
  private mapPriorityToUrgency(priority: NotificationPriority): 'normal' | 'critical' | 'low' {
    switch (priority) {
      case 'urgent':
        return 'critical';
      case 'high':
        return 'critical';
      case 'normal':
        return 'normal';
      case 'low':
        return 'low';
      default:
        return 'normal';
    }
  }

  /**
   * Handle notification click
   */
  private handleNotificationClick(id: string): void {
    this.markAsRead(id);
    this.focusWindow();
    this.emitNotificationClicked(id);
  }

  /**
   * Handle notification action
   */
  private handleNotificationAction(id: string, actionType: string): void {
    this.markAsRead(id);
    this.emitNotificationAction(id, actionType);
  }

  /**
   * Focus main window
   */
  private focusWindow(): void {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      const mainWindow = windows[0];
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  }

  /**
   * Mark notification as read
   */
  markAsRead(id: string): void {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.read = true;
      this.emitNotificationUpdated(notification);
    }
  }

  /**
   * Mark notification as dismissed
   */
  dismiss(id: string): void {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.dismissed = true;
      this.emitNotificationUpdated(notification);
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    for (const notification of this.notifications.values()) {
      if (!notification.read) {
        notification.read = true;
        this.emitNotificationUpdated(notification);
      }
    }
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    this.notifications.clear();
    this.emitNotificationsCleared();
  }

  /**
   * Get all notifications
   */
  getAll(): StoredNotification[] {
    return Array.from(this.notifications.values())
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get unread count
   */
  getUnreadCount(): number {
    return Array.from(this.notifications.values())
      .filter(n => !n.read && !n.dismissed)
      .length;
  }

  /**
   * Trim notifications to max limit
   */
  private trimNotifications(): void {
    const notifications = Array.from(this.notifications.values())
      .sort((a, b) => b.timestamp - a.timestamp);

    if (notifications.length > this.maxNotifications) {
      const toRemove = notifications.slice(this.maxNotifications);
      for (const notification of toRemove) {
        this.notifications.delete(notification.id);
      }
    }
  }

  /**
   * Emit notification to renderer
   */
  private emitNotification(notification: StoredNotification): void {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('notification:new', notification);
    });
  }

  /**
   * Emit notification updated
   */
  private emitNotificationUpdated(notification: StoredNotification): void {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('notification:updated', notification);
    });
  }

  /**
   * Emit notification clicked
   */
  private emitNotificationClicked(id: string): void {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('notification:clicked', id);
    });
  }

  /**
   * Emit notification action
   */
  private emitNotificationAction(id: string, actionType: string): void {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('notification:action', { id, actionType });
    });
  }

  /**
   * Emit notifications cleared
   */
  private emitNotificationsCleared(): void {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('notification:cleared');
    });
  }

  /**
   * Emit preferences changed
   */
  private emitPreferencesChanged(): void {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('notification:preferencesChanged', this.preferences);
    });
  }

  /**
   * Convenience methods for common notification types
   */
  info(title: string, body: string, options?: Partial<NotificationOptions>): Promise<string> {
    return this.send({ title, body, type: 'info', ...options });
  }

  success(title: string, body: string, options?: Partial<NotificationOptions>): Promise<string> {
    return this.send({ title, body, type: 'success', ...options });
  }

  warning(title: string, body: string, options?: Partial<NotificationOptions>): Promise<string> {
    return this.send({ title, body, type: 'warning', ...options });
  }

  error(title: string, body: string, options?: Partial<NotificationOptions>): Promise<string> {
    return this.send({ title, body, type: 'error', priority: 'high', ...options });
  }
}

// Singleton instance
const notificationService = new NotificationService();

/**
 * Register IPC handlers for notification service
 */
export function registerNotificationHandlers(): void {
  // Initialize on startup
  notificationService.initialize();

  // Send notification
  ipcMain.handle('notification:send', async (_, options: NotificationOptions) => {
    try {
      const id = await notificationService.send(options);
      return { success: true, id };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Get all notifications
  ipcMain.handle('notification:getAll', async () => {
    try {
      const notifications = notificationService.getAll();
      return { success: true, notifications };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Get unread count
  ipcMain.handle('notification:getUnreadCount', async () => {
    try {
      const count = notificationService.getUnreadCount();
      return { success: true, count };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Mark as read
  ipcMain.handle('notification:markAsRead', async (_, id: string) => {
    try {
      notificationService.markAsRead(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Dismiss notification
  ipcMain.handle('notification:dismiss', async (_, id: string) => {
    try {
      notificationService.dismiss(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Mark all as read
  ipcMain.handle('notification:markAllAsRead', async () => {
    try {
      notificationService.markAllAsRead();
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Clear all
  ipcMain.handle('notification:clearAll', async () => {
    try {
      notificationService.clearAll();
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Get preferences
  ipcMain.handle('notification:getPreferences', async () => {
    try {
      const preferences = notificationService.getPreferences();
      return { success: true, preferences };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Update preferences
  ipcMain.handle('notification:updatePreferences', async (_, updates: Partial<NotificationPreferences>) => {
    try {
      await notificationService.updatePreferences(updates);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  console.log('[Notifications] IPC handlers registered');
}

export default notificationService;
