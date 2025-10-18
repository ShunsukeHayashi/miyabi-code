/**
 * Discord Notification Hook Setup
 *
 * Automatically registers Discord notification hooks for all agents
 */

import { HookManager } from './hook-manager';
import { NotificationHook, ErrorNotificationHook } from './built-in/notification-hook';
import { logger } from '../ui/index';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

interface MiyabiConfig {
  hooks?: {
    notification?: {
      enabled?: boolean;
      discordWebhookUrl?: string;
      notifyOnSuccess?: boolean;
      notifyOnFailure?: boolean;
      mentionOnFailure?: string[];
    };
  };
}

/**
 * Load Miyabi configuration from .miyabi.yml
 */
function loadMiyabiConfig(): MiyabiConfig {
  const configPath = path.join(process.cwd(), '.miyabi.yml');

  try {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf8');
      return yaml.parse(content) as MiyabiConfig;
    }
  } catch (error) {
    logger.warning(`Failed to load .miyabi.yml: ${(error as Error).message}`);
  }

  return {};
}

/**
 * Setup Discord notification hooks from configuration
 */
export function setupDiscordNotifications(hookManager: HookManager): void {
  const config = loadMiyabiConfig();

  // Check if notification hooks are enabled
  if (!config.hooks?.notification?.enabled) {
    logger.info('Discord notification hooks are disabled in .miyabi.yml');
    return;
  }

  // Get Discord webhook URL from config or environment
  let webhookUrl = config.hooks.notification.discordWebhookUrl;

  // Support ${DISCORD_WEBHOOK_URL} placeholder
  if (webhookUrl?.includes('${DISCORD_WEBHOOK_URL}')) {
    webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  }

  if (!webhookUrl) {
    logger.warning('Discord webhook URL not configured. Skipping notification setup.');
    logger.info('Set DISCORD_WEBHOOK_URL environment variable or configure in .miyabi.yml');
    return;
  }

  // Create notification hook configuration
  const notificationConfig = {
    discordWebhookUrl: webhookUrl,
    notifyOnSuccess: config.hooks.notification.notifyOnSuccess ?? true,
    notifyOnFailure: config.hooks.notification.notifyOnFailure ?? true,
    mentionOnFailure: config.hooks.notification.mentionOnFailure || [],
  };

  // Register success notification hook
  const notificationHook = new NotificationHook(notificationConfig);
  hookManager.registerPostHook(notificationHook);

  // Register error notification hook
  const errorNotificationHook = new ErrorNotificationHook(notificationConfig);
  hookManager.registerErrorHook(errorNotificationHook);

  logger.success('✓ Discord notification hooks registered');
  logger.info(`  - Success notifications: ${notificationConfig.notifyOnSuccess ? 'enabled' : 'disabled'}`);
  logger.info(`  - Failure notifications: ${notificationConfig.notifyOnFailure ? 'enabled' : 'disabled'}`);
  logger.info(`  - Webhook: ${webhookUrl.substring(0, 50)}...`);
}

/**
 * Create a HookManager with Discord notifications enabled
 */
export function createHookManagerWithDiscordNotifications(): HookManager {
  const hookManager = new HookManager();
  setupDiscordNotifications(hookManager);
  return hookManager;
}
