#!/usr/bin/env node
/**
 * Chrome Debug Mode Launcher
 * デバッグモードでChromeを起動し、既存セッション（ログイン状態）を維持
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const CHROME_PATHS = {
  darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  linux: '/usr/bin/google-chrome',
  win32: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
};

const DEBUGGING_PORT = 9222;
const USER_DATA_DIR = `/tmp/chrome-debug-miyabi`;

async function launchChrome() {
  const platform = process.platform;
  const chromePath = CHROME_PATHS[platform];

  if (!chromePath) {
    console.error(`❌ Unsupported platform: ${platform}`);
    process.exit(1);
  }

  const command = `"${chromePath}" --remote-debugging-port=${DEBUGGING_PORT} --user-data-dir="${USER_DATA_DIR}" &`;

  console.log('🚀 Chromeをデバッグモードで起動中...\n');
  console.log(`📍 Chrome Path: ${chromePath}`);
  console.log(`🔌 Debugging Port: ${DEBUGGING_PORT}`);
  console.log(`💾 User Data Dir: ${USER_DATA_DIR}\n`);

  try {
    await execAsync(command);
    console.log('✅ Chrome起動成功！');
    console.log(`\n💡 次のステップ:`);
    console.log(`1. Chromeで https://open.larksuite.com にアクセス`);
    console.log(`2. Larkアカウントでログイン`);
    console.log(`3. MCPサーバーを起動: npm start\n`);
  } catch (error) {
    console.error('❌ Chrome起動失敗:', error.message);
    process.exit(1);
  }
}

launchChrome();
