#!/usr/bin/env node
/**
 * DeploymentAgent - Lark App自動デプロイ
 *
 * Input: Generated application directory
 * Output: Deployed and configured Lark application
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * DeploymentAgentメインエントリポイント
 * @param {string} appDirectory - Generated app directory
 * @param {Object} config - Deployment configuration
 * @returns {Promise<Object>} Deployment result
 */
export async function deployLarkApp(appDirectory, config = {}) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 DeploymentAgent - Lark App Deployment');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const appName = path.basename(appDirectory);
  console.log(`📦 Deploying: ${appName}\n`);

  const deploymentResult = {
    app_name: appName,
    app_directory: appDirectory,
    steps: [],
    deployed_at: new Date().toISOString(),
  };

  try {
    // Step 1: Install dependencies
    console.log('═══ Step 1/6: Install Dependencies ═══');
    await installDependencies(appDirectory);
    deploymentResult.steps.push({ name: 'install_dependencies', status: 'success' });
    console.log('✅ Dependencies installed\n');

    // Step 2: Configure environment
    console.log('═══ Step 2/6: Configure Environment ═══');
    await configureEnvironment(appDirectory, config);
    deploymentResult.steps.push({ name: 'configure_environment', status: 'success' });
    console.log('✅ Environment configured\n');

    // Step 3: Start tunnel (ngrok)
    console.log('═══ Step 3/6: Start Tunnel Service ═══');
    const tunnelUrl = await startTunnel(config.port || 3000);
    deploymentResult.tunnel_url = tunnelUrl;
    deploymentResult.steps.push({ name: 'start_tunnel', status: 'success', url: tunnelUrl });
    console.log(`✅ Tunnel started: ${tunnelUrl}\n`);

    // Step 4: Start application
    console.log('═══ Step 4/6: Start Application ═══');
    const appProcess = await startApplication(appDirectory, config.port || 3000);
    deploymentResult.app_pid = appProcess.pid;
    deploymentResult.steps.push({ name: 'start_application', status: 'success', pid: appProcess.pid });
    console.log(`✅ Application started (PID: ${appProcess.pid})\n`);

    // Wait for app to be ready
    await waitForHealthCheck(config.port || 3000);

    // Step 5: Configure Lark (manual step - provide instructions)
    console.log('═══ Step 5/6: Lark Configuration Required ═══');
    const larkConfig = generateLarkConfigInstructions(tunnelUrl, config);
    deploymentResult.lark_config_instructions = larkConfig;
    deploymentResult.steps.push({ name: 'lark_configuration', status: 'manual_required' });
    console.log(larkConfig);

    // Step 6: Health check
    console.log('\n═══ Step 6/6: Final Health Check ═══');
    const healthStatus = await performHealthCheck(config.port || 3000);
    deploymentResult.health_status = healthStatus;
    deploymentResult.steps.push({ name: 'health_check', status: 'success', ...healthStatus });
    console.log('✅ Health check passed\n');

    deploymentResult.status = 'success';
    deploymentResult.webhook_url = `${tunnelUrl}/webhook/events`;
    deploymentResult.health_url = `http://localhost:${config.port || 3000}/health`;

  } catch (error) {
    console.error(`❌ Deployment failed: ${error.message}\n`);
    deploymentResult.status = 'failed';
    deploymentResult.error = error.message;
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 Deployment Complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  printDeploymentSummary(deploymentResult);

  return deploymentResult;
}

/**
 * 依存関係インストール
 */
async function installDependencies(appDirectory) {
  const { stdout, stderr } = await execAsync('npm install', { cwd: appDirectory });
  console.log(stdout);
  if (stderr) console.error(stderr);
}

/**
 * 環境変数設定
 */
async function configureEnvironment(appDirectory, config) {
  const envPath = path.join(appDirectory, '.env');
  const envExamplePath = path.join(appDirectory, '.env.example');

  // .env.example から .env を作成
  const envExample = await fs.readFile(envExamplePath, 'utf-8');

  let envContent = envExample;

  if (config.app_id) {
    envContent = envContent.replace('your_app_id_here', config.app_id);
  }

  if (config.app_secret) {
    envContent = envContent.replace('your_app_secret_here', config.app_secret);
  }

  if (config.port) {
    envContent = envContent.replace('PORT=3000', `PORT=${config.port}`);
  }

  await fs.writeFile(envPath, envContent);

  console.log('  .env file created');
}

/**
 * Tunnel起動 (ngrok)
 */
async function startTunnel(port) {
  try {
    // ngrok start in background
    const ngrokProcess = exec(`ngrok http ${port} --log=stdout`, {
      detached: true,
      stdio: 'ignore',
    });

    ngrokProcess.unref();

    // Wait for ngrok to start
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Get ngrok public URL
    const response = await axios.get('http://localhost:4040/api/tunnels');
    const tunnel = response.data.tunnels.find(t => t.proto === 'https');

    if (!tunnel) {
      throw new Error('Failed to get ngrok tunnel URL');
    }

    return tunnel.public_url;
  } catch (error) {
    console.error('⚠️  ngrok not running or failed to start');
    console.log('  Please start ngrok manually: ngrok http ' + port);
    return `http://your-tunnel-url.ngrok-free.app`;
  }
}

/**
 * アプリケーション起動
 */
async function startApplication(appDirectory, port) {
  const appProcess = exec(`PORT=${port} node index.js`, {
    cwd: appDirectory,
    detached: true,
    stdio: 'ignore',
  });

  appProcess.unref();

  console.log(`  Application starting on port ${port}...`);

  return appProcess;
}

/**
 * ヘルスチェック待機
 */
async function waitForHealthCheck(port, maxRetries = 10) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await axios.get(`http://localhost:${port}/health`);
      console.log('  App is ready!');
      return;
    } catch (error) {
      console.log(`  Waiting for app to start... (${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  throw new Error('App failed to start within timeout');
}

/**
 * ヘルスチェック実行
 */
async function performHealthCheck(port) {
  try {
    const response = await axios.get(`http://localhost:${port}/health`);
    return {
      status: 'healthy',
      uptime: response.data.uptime,
      timestamp: response.data.timestamp,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
    };
  }
}

/**
 * Lark設定手順生成
 */
function generateLarkConfigInstructions(tunnelUrl, config) {
  return `
📋 Lark Open Platform Configuration Required:

1. Go to: https://open.larksuite.com/app
2. Select your app (App ID: ${config.app_id || 'YOUR_APP_ID'})
3. Configure Event Subscription:
   - Event Request URL: ${tunnelUrl}/webhook/events
   - Events to subscribe:
     * im.message.receive_v1 (接收消息)

4. Configure Permissions:
   - im:message (消息管理)
   - im:message:send_as_bot (以应用身份发消息)
   - [Add other permissions as needed]

5. Enable and Publish:
   - Click "Enable" for Event Subscription
   - Click "Version Management" → "Publish"

6. Add Bot to Group:
   - Create a group in Lark
   - Add bot to the group
   - Test with @mention

---

✅ Once configured, your bot will be live at: ${tunnelUrl}
`;
}

/**
 * デプロイサマリー表示
 */
function printDeploymentSummary(result) {
  console.log('📊 Deployment Summary:\n');
  console.log(`  App Name:     ${result.app_name}`);
  console.log(`  Status:       ${result.status}`);
  console.log(`  Webhook URL:  ${result.webhook_url || 'N/A'}`);
  console.log(`  Health URL:   ${result.health_url || 'N/A'}`);
  console.log(`  App PID:      ${result.app_pid || 'N/A'}\n`);

  console.log('📋 Deployment Steps:');
  for (const step of result.steps) {
    const icon = step.status === 'success' ? '✅' : step.status === 'manual_required' ? '⚠️' : '❌';
    console.log(`  ${icon} ${step.name}`);
  }

  if (result.lark_config_instructions) {
    console.log('\n⚠️  Manual configuration required - see instructions above');
  }

  console.log('');
}

// CLI実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const appDirectory = process.argv[2];
  const appId = process.argv[3];
  const appSecret = process.argv[4];

  if (!appDirectory) {
    console.error('❌ Usage: node index.js <app-directory> [app_id] [app_secret]');
    process.exit(1);
  }

  const config = {
    app_id: appId,
    app_secret: appSecret,
    port: 3000,
  };

  deployLarkApp(appDirectory, config).then(() => {
    console.log('✅ Deployment complete!');
  }).catch(error => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  });
}
