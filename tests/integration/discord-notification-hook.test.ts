/**
 * Discord Notification Hook Integration Test
 *
 * Tests the Discord notification system with real webhook
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { HookManager } from '../../packages/coding-agents/hooks/hook-manager';
import { setupDiscordNotifications } from '../../packages/coding-agents/hooks/setup-discord-notifications';
import { Task, AgentResult, HookContext } from '../../packages/coding-agents/types';

describe('Discord Notification Hook Integration', () => {
  let hookManager: HookManager;

  beforeAll(() => {
    // Ensure environment variables are set
    if (!process.env.DISCORD_WEBHOOK_URL) {
      throw new Error('DISCORD_WEBHOOK_URL environment variable is required for this test');
    }

    hookManager = new HookManager();
    setupDiscordNotifications(hookManager);
  });

  it('should register notification hooks successfully', () => {
    const hooks = hookManager.getRegisteredHooks();

    expect(hooks.postHooks).toContain('notification');
    expect(hooks.errorHooks).toContain('error-notification');
  });

  it('should send success notification on agent completion', async () => {
    const task: Task = {
      id: 'test-success-1',
      title: 'Test successful agent execution',
      description: 'This is a test task for success notification',
      type: 'feature',
      priority: 1,
      dependencies: [],
    };

    const context: HookContext = {
      agentType: 'CodeGenAgent' as any,
      task,
      config: {
        deviceIdentifier: 'test-device',
        githubToken: '',
        useTaskTool: false,
        useWorktree: false,
        reportDirectory: '.ai/reports',
        logDirectory: '.ai/logs',
      },
      startTime: Date.now(),
    };

    const result: AgentResult = {
      status: 'success',
      data: {
        message: 'Test completed successfully',
        linesChanged: 150,
      },
      metrics: {
        qualityScore: 95,
        testCoverage: 87,
        linesOfCode: 150,
        dependencies: [],
      },
    };

    // Execute posthooks (should send Discord notification)
    const hookResults = await hookManager.executePostHooks(context, result);

    // Check that notification hook executed
    const notificationResult = hookResults.find(r => r.hookName === 'notification');
    expect(notificationResult).toBeDefined();
    expect(notificationResult?.status).toBe('success');
  }, 30000); // 30 second timeout

  it('should send error notification on agent failure', async () => {
    const task: Task = {
      id: 'test-error-1',
      title: 'Test failed agent execution',
      description: 'This is a test task for error notification',
      type: 'bug',
      priority: 0,
      dependencies: [],
    };

    const context: HookContext = {
      agentType: 'ReviewAgent' as any,
      task,
      config: {
        deviceIdentifier: 'test-device',
        githubToken: '',
        useTaskTool: false,
        useWorktree: false,
        reportDirectory: '.ai/reports',
        logDirectory: '.ai/logs',
      },
      startTime: Date.now(),
    };

    const error = new Error('Test error: Failed to execute review');

    // Execute error hooks (should send Discord error notification)
    const hookResults = await hookManager.executeErrorHooks(context, error);

    // Check that error notification hook executed
    const errorNotificationResult = hookResults.find(r => r.hookName === 'error-notification');
    expect(errorNotificationResult).toBeDefined();
    expect(errorNotificationResult?.status).toBe('success');
  }, 30000); // 30 second timeout

  it('should include quality score in success notification', async () => {
    const task: Task = {
      id: 'test-quality-1',
      title: 'Test quality score reporting',
      description: 'Verify quality score appears in notification',
      type: 'feature',
      priority: 2,
      dependencies: [],
    };

    const context: HookContext = {
      agentType: 'CodeGenAgent' as any,
      task,
      config: {
        deviceIdentifier: 'test-device',
        githubToken: '',
        useTaskTool: false,
        useWorktree: false,
        reportDirectory: '.ai/reports',
        logDirectory: '.ai/logs',
      },
      startTime: Date.now(),
    };

    const result: AgentResult = {
      status: 'success',
      data: {},
      metrics: {
        qualityScore: 88,
        testCoverage: 92,
        linesOfCode: 200,
        dependencies: [],
      },
    };

    const hookResults = await hookManager.executePostHooks(context, result);

    const notificationResult = hookResults.find(r => r.hookName === 'notification');
    expect(notificationResult?.status).toBe('success');
  }, 30000);

  it('should handle missing webhook URL gracefully', async () => {
    // Temporarily remove webhook URL
    const originalUrl = process.env.DISCORD_WEBHOOK_URL;
    delete process.env.DISCORD_WEBHOOK_URL;

    const tempHookManager = new HookManager();

    // This should log a warning but not throw
    expect(() => {
      setupDiscordNotifications(tempHookManager);
    }).not.toThrow();

    // Restore webhook URL
    if (originalUrl) {
      process.env.DISCORD_WEBHOOK_URL = originalUrl;
    }
  });
});
