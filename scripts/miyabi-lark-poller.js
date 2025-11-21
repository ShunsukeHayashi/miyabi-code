const http = require('http');
const https = require('https');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

// Configuration
const MAJIN_HOST = '54.92.67.11';
const MAJIN_PORT = 3001;
const POLL_INTERVAL = 3000; // 3 seconds

console.log(`
🖥️ Miyabi Mac Local Poller Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Polling: http://${MAJIN_HOST}:${MAJIN_PORT}/api/messages
⏱️ Interval: ${POLL_INTERVAL/1000}s
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

// Process message locally
async function processMessage(msg) {
  console.log(`\n📨 Processing: "${msg.text}"`);

  let response = '';

  try {
    if (msg.text.includes('git') || msg.text.includes('commit')) {
      const gitStatus = await execPromise('cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private && git status --short');
      const branch = await execPromise('cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private && git branch --show-current');
      response = `📊 Git Status (Mac Local)\n\n🌿 Branch: ${branch.stdout.trim()}\n\n📝 Changes:\n${gitStatus.stdout.trim() || 'No changes'}`;
    }
    else if (msg.text.includes('agent') || msg.text.includes('エージェント') || msg.text.includes('tmux')) {
      const tmuxSessions = await execPromise('tmux list-sessions 2>/dev/null || echo "No sessions"');
      response = `🤖 Agent Status (Mac Local)\n\n📺 tmux Sessions:\n${tmuxSessions.stdout.trim()}`;
    }
    else if (msg.text.includes('issue')) {
      const issues = await execPromise('cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private && gh issue list --limit 5 2>/dev/null || echo "gh not available"');
      response = `📋 Recent Issues\n\n${issues.stdout.trim()}`;
    }
    else if (msg.text.includes('build') || msg.text.includes('ビルド')) {
      response = `🔨 Build Task Received\n\nMac Localで「${msg.text}」を受信しました。\nビルドタスクを実行キューに追加します。`;
    }
    else {
      response = `📝 Mac Local 処理完了\n\n受信: 「${msg.text}」\n\nMac Local Orchestratorで処理しました。`;
    }
  } catch (error) {
    response = `❌ Mac Local エラー\n\n${error.message}`;
    console.error('Process error:', error.message);
  }

  return response;
}

// Send response back to MAJIN
function sendResponse(messageId, chatId, response) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ messageId, chatId, response });

    const options = {
      hostname: MAJIN_HOST,
      port: MAJIN_PORT,
      path: '/api/response',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (result.success) {
            console.log(`✅ Response sent for message ${messageId}`);
            resolve(result);
          } else {
            reject(new Error(result.error));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Poll for new messages
async function pollMessages() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: MAJIN_HOST,
      port: MAJIN_PORT,
      path: '/api/messages',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', async () => {
        try {
          const result = JSON.parse(body);
          if (result.messages && result.messages.length > 0) {
            console.log(`📥 Received ${result.messages.length} messages`);

            for (const msg of result.messages) {
              const response = await processMessage(msg);
              await sendResponse(msg.id, msg.chatId, response);
            }
          }
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (e) => {
      console.error('Poll error:', e.message);
      resolve(); // Continue polling even on error
    });

    req.end();
  });
}

// Main polling loop
async function startPolling() {
  while (true) {
    try {
      await pollMessages();
    } catch (error) {
      console.error('Polling error:', error.message);
    }
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
  }
}

// Start
startPolling();
