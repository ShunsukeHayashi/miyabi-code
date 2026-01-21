// Init command - Initialize miyabicode.json

import chalk from 'chalk';
import { existsSync, writeFileSync } from 'fs';

export async function init(configPath: string): Promise<void> {
  if (existsSync(configPath)) {
    console.log(chalk.yellow('ℹ'), `設定ファイルが既に存在します: ${configPath}`);
    return;
  }

  const defaultConfig = {
    name: 'my-miyabi-project',
    version: '0.1.0',
    llm: {
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
      maxTokens: 4096,
      temperature: 0.7
    },
    mcp: {
      enabled: ['miyabi-mcp-bundle'],
      progressiveDisclosure: true
    },
    tmux: {
      session: 'miyabi',
      target: 'agents.0'
    },
    github: {
      owner: 'your-username',
      repo: 'your-repo'
    },
    workflow: {
      branchNaming: 'conventional',
      commitFormat: 'conventional'
    }
  };

  writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
  console.log(chalk.green('✓'), `設定ファイルを作成しました: ${configPath}`);
  console.log('');
  console.log(chalk.gray('次のステップ:'));
  console.log('  1. miyabicode.json を編集して設定をカスタマイズ');
  console.log('  2. export ANTHROPIC_API_KEY=xxx でAPIキーを設定');
  console.log('  3. miyabi-code dev で開発モード開始');
}
