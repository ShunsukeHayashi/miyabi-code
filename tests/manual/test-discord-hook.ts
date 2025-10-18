/**
 * Manual Discord Notification Hook Test
 *
 * Quick manual test for Discord notifications
 */

import { HookManager } from '../../packages/coding-agents/hooks/hook-manager';
import { setupDiscordNotifications } from '../../packages/coding-agents/hooks/setup-discord-notifications';
import { Task, AgentResult, HookContext } from '../../packages/coding-agents/types';

async function testDiscordNotification() {
  console.log('🧪 Discord Notification Hook Manual Test\n');

  // Check environment
  if (!process.env.DISCORD_WEBHOOK_URL) {
    console.error('❌ DISCORD_WEBHOOK_URL environment variable is not set');
    process.exit(1);
  }

  console.log('✓ Environment check passed');
  console.log(`  Webhook URL: ${process.env.DISCORD_WEBHOOK_URL.substring(0, 50)}...\n`);

  // Setup hook manager
  const hookManager = new HookManager();
  setupDiscordNotifications(hookManager);

  console.log('✓ Hook manager initialized\n');

  // Test Case 1: Success Notification
  console.log('📤 Test Case 1: Success Notification');
  console.log('-----------------------------------');

  const successTask: Task = {
    id: 'manual-test-1',
    title: 'Manual test - Success scenario',
    description: 'Testing Discord notification on success',
    type: 'feature',
    priority: 1,
    dependencies: [],
  };

  const successContext: HookContext = {
    agentType: 'CodeGenAgent' as any,
    task: successTask,
    config: {
      deviceIdentifier: 'manual-test-device',
      githubToken: '',
      useTaskTool: false,
      useWorktree: false,
      reportDirectory: '.ai/reports',
      logDirectory: '.ai/logs',
    },
    startTime: Date.now(),
  };

  const successResult: AgentResult = {
    status: 'success',
    data: {
      message: 'Manual test completed successfully',
      filesModified: ['src/test.ts', 'src/utils.ts'],
      linesChanged: 150,
    },
    metrics: {
      qualityScore: 95,
      testCoverage: 87,
      linesOfCode: 150,
      dependencies: [],
    },
  };

  try {
    await hookManager.executePostHooks(successContext, successResult);
    console.log('✅ Success notification sent!\n');
  } catch (error) {
    console.error('❌ Failed to send success notification:', (error as Error).message);
  }

  // Wait a bit before next test
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test Case 2: Error Notification
  console.log('📤 Test Case 2: Error Notification');
  console.log('-----------------------------------');

  const errorTask: Task = {
    id: 'manual-test-2',
    title: 'Manual test - Error scenario',
    description: 'Testing Discord notification on error',
    type: 'bug',
    priority: 0,
    dependencies: [],
  };

  const errorContext: HookContext = {
    agentType: 'ReviewAgent' as any,
    task: errorTask,
    config: {
      deviceIdentifier: 'manual-test-device',
      githubToken: '',
      useTaskTool: false,
      useWorktree: false,
      reportDirectory: '.ai/reports',
      logDirectory: '.ai/logs',
    },
    startTime: Date.now(),
  };

  const testError = new Error('Manual test error: Failed to complete review process');

  try {
    await hookManager.executeErrorHooks(errorContext, testError);
    console.log('✅ Error notification sent!\n');
  } catch (error) {
    console.error('❌ Failed to send error notification:', (error as Error).message);
  }

  console.log('\n🎉 All manual tests completed!');
  console.log('Check your Discord channel for the notifications.\n');
}

// Run test
testDiscordNotification().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
