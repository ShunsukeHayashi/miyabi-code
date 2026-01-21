#!/usr/bin/env node
/**
 * MiyabiCode CLI
 * AI Coding Agent for Miyabi Agent Society
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig } from './config/config.js';
import { handleError } from './utils/errors.js';
import { generateDefaultConfig } from './config/config.js';

const program = new Command();

program
  .name('miyabi-code')
  .description('AI Coding Agent for Miyabi Agent Society')
  .version('0.1.0');

// ============================================
// Commands
// ============================================

// init command
program
  .command('init')
  .description('Initialize miyabicode.json configuration')
  .option('-n, --name <name>', 'Project name')
  .action(async (options) => {
    try {
      const { writeFile } = await import('node:fs/promises');
      const { resolve } = await import('node:path');

      const projectName = options.name || process.cwd().split('/').pop() || 'my-project';
      const config = generateDefaultConfig(projectName);
      const configPath = resolve(process.cwd(), 'miyabicode.json');

      await writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');

      console.log(chalk.green('✅'), `Created miyabicode.json for "${projectName}"`);
      console.log(chalk.gray('   Edit the configuration and run: miyabi-code run'));
    } catch (error) {
      handleError(error);
    }
  });

// run command
program
  .command('run')
  .description('Run MiyabiCode agent')
  .option('-c, --config <path>', 'Path to miyabicode.json')
  .option('-a, --agent <agent>', 'Agent to use (conductor, codegen, review, pr, deploy, workflow)')
  .option('-p, --prompt <text>', 'Prompt for the agent')
  .action(async (options) => {
    try {
      const config = await loadConfig({ configPath: options.config });
      console.log(chalk.blue('🤖 MiyabiCode'), `- ${config.name}`);
      console.log(chalk.gray('   Loading configuration...'));

      // TODO: Implement agent execution
      console.log(chalk.yellow('⚠️'), 'Agent execution not yet implemented');
      console.log(chalk.gray('   This is a placeholder for Issue #53 (P9-1)'));
    } catch (error) {
      handleError(error);
    }
  });

// send command
program
  .command('send')
  .description('Send message to tmux agent')
  .option('-t, --target <target>', 'tmux target (e.g., agents.0 or %0)')
  .option('-m, --message <text>', 'Message to send')
  .action(async (_options) => {
    try {
      // TODO: Implement tmux send (Issue #55 P9-2)
      console.log(chalk.yellow('⚠️'), 'tmux send not yet implemented');
      console.log(chalk.gray('   This is a placeholder for Issue #55 (P9-2)'));
    } catch (error) {
      handleError(error);
    }
  });

// status command
program
  .command('status')
  .description('Show MiyabiCode status')
  .action(async () => {
    try {
      console.log(chalk.blue('📊 MiyabiCode Status'));
      console.log('');
      console.log(chalk.gray('Project:'), process.cwd());
      console.log(chalk.gray('Config:'), 'miyabicode.json');
      console.log('');
      console.log(chalk.yellow('⚠️'), 'Full status not yet implemented');
    } catch (error) {
      handleError(error);
    }
  });

// ============================================
// Main Entry Point
// ============================================

program.parseAsync(process.argv).catch((error) => {
  handleError(error);
});
