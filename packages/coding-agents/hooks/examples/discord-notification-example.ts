/**
 * Discord Notification Hook Example
 *
 * Demonstrates how to use Discord notifications with agents
 */

import { BaseAgent } from '../../base-agent';
import { Task, AgentResult, AgentConfig } from '../../types/index';
import { createHookManagerWithDiscordNotifications } from '../setup-discord-notifications';

class DiscordNotifyingAgent extends BaseAgent {
  private hookManager = createHookManagerWithDiscordNotifications();

  constructor(config: AgentConfig) {
    super('CodeGenAgent' as import('../../types/index.js').AgentType, config);
  }

  async execute(task: Task): Promise<AgentResult> {
    this.log('DiscordNotifyingAgent executing...');

    // Your agent logic here
    await this.doWork(task);

    return {
      status: 'success',
      data: {
        message: 'Task completed successfully',
        linesChanged: 150,
      },
      metrics: {
        qualityScore: 95,
        testCoverage: 87,
        linesOfCode: 150,
        dependencies: [],
      },
    };
  }

  /**
   * Override run method to integrate hooks
   */
  async run(task: Task): Promise<AgentResult> {
    this.currentTask = task;
    this.startTime = Date.now();

    const context = {
      agentType: this.agentType,
      task,
      config: this.config,
      startTime: this.startTime,
    };

    try {
      // Execute prehooks
      await this.hookManager.executePreHooks(context);

      // Main execution
      const result = await this.execute(task);

      // Execute posthooks (Discord notification will be sent here)
      await this.hookManager.executePostHooks(context, result);

      return result;
    } catch (error) {
      // Execute error hooks (Discord error notification will be sent here)
      await this.hookManager.executeErrorHooks(context, error as Error);

      throw error;
    }
  }

  private async doWork(_task: Task): Promise<void> {
    // Simulate work
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

// Usage
async function main() {
  console.log('🚀 Discord Notification Example\n');

  // Ensure DISCORD_WEBHOOK_URL is set
  if (!process.env.DISCORD_WEBHOOK_URL) {
    console.error('❌ DISCORD_WEBHOOK_URL environment variable is not set');
    console.log('\nSet it in your .env file or export it:');
    console.log('  export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."');
    process.exit(1);
  }

  const agent = new DiscordNotifyingAgent({
    deviceIdentifier: 'example-device',
    githubToken: process.env.GITHUB_TOKEN || '',
    useTaskTool: false,
    useWorktree: false,
    reportDirectory: '.ai/reports',
    logDirectory: '.ai/logs',
  });

  const task: Task = {
    id: 'example-discord-1',
    title: 'Implement user authentication',
    description: 'Add JWT-based authentication system',
    type: 'feature',
    priority: 1,
    dependencies: [],
  };

  console.log(`📋 Task: ${task.title}`);
  console.log(`🎯 Type: ${task.type}`);
  console.log(`⚡ Priority: P${task.priority}\n`);

  try {
    console.log('⏳ Executing agent...\n');
    const result = await agent.run(task);

    console.log('✅ Success!');
    console.log(`   Quality Score: ${result.metrics?.qualityScore}/100`);
    console.log(`   Lines Changed: ${result.data?.linesChanged}`);
    console.log('\n📢 Discord notification sent!');
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
    console.log('\n📢 Discord error notification sent!');
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { DiscordNotifyingAgent };
