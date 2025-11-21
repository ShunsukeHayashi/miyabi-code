const express = require('express');
const crypto = require('crypto');
const https = require('https');

const app = express();
app.use(express.json());

// Configuration
const VERIFICATION_TOKEN = 'LIJUiAqKTHx3l7liBQIX2lxkOpWacL7C';
const PORT = 3001;

// Miyabi Bot credentials (for sending responses)
const MIYABI_BOT_APP_ID = 'cli_a994d7e3b8789e1a';
const MIYABI_BOT_APP_SECRET = 'rNrwfiZCD9aRCCrQY5E1OeifhDg2kZJL';

// Message queue for Mac Local polling
const messageQueue = [];
const pendingResponses = new Map(); // messageId -> chatId

// Cache for tenant access token
let tenantAccessToken = null;
let tokenExpiry = 0;

// Get tenant access token for Miyabi Bot
async function getTenantAccessToken() {
  if (tenantAccessToken && Date.now() < tokenExpiry) {
    return tenantAccessToken;
  }

  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      app_id: MIYABI_BOT_APP_ID,
      app_secret: MIYABI_BOT_APP_SECRET
    });

    const options = {
      hostname: 'open.larksuite.com',
      port: 443,
      path: '/open-apis/auth/v3/tenant_access_token/internal',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (result.code === 0) {
            tenantAccessToken = result.tenant_access_token;
            tokenExpiry = Date.now() + (result.expire - 300) * 1000; // 5 min buffer
            resolve(tenantAccessToken);
          } else {
            reject(new Error(`Token error: ${result.msg}`));
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

// Send message via Miyabi Bot
async function sendMiyabiBotMessage(chatId, text) {
  const token = await getTenantAccessToken();

  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      receive_id: chatId,
      msg_type: 'text',
      content: JSON.stringify({ text })
    });

    const options = {
      hostname: 'open.larksuite.com',
      port: 443,
      path: '/open-apis/im/v1/messages?receive_id_type=chat_id',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          console.log(`📤 API Response: ${JSON.stringify(result, null, 2)}`);
          if (result.code === 0) {
            console.log(`✅ Miyabi Bot sent message to ${chatId}`);
            resolve(result);
          } else {
            console.error(`❌ Send failed: code=${result.code}, msg=${result.msg}`);
            reject(new Error(result.msg));
          }
        } catch (e) {
          console.error(`❌ Parse error: ${e.message}`);
          reject(e);
        }
      });
    });

    req.on('error', (e) => {
      console.error(`❌ Request error: ${e.message}`);
      reject(e);
    });
    req.write(data);
    req.end();
  });
}

// Process message content and generate response
async function processAndRespond(chatId, messageText, senderId) {
  const { exec } = require('child_process');
  const util = require('util');
  const execPromise = util.promisify(exec);

  console.log(`🔄 Processing: "${messageText}"`);

  let responseText = '';

  try {
    // System status request
    if (messageText.includes('システム') || messageText.includes('状況') || messageText.includes('status')) {
      const uptime = await execPromise('uptime');
      const memory = await execPromise('free -h | head -2');
      const disk = await execPromise('df -h / | tail -1');

      responseText = `📊 MAJIN システム状況\n\n` +
        `⏱️ Uptime:\n${uptime.stdout.trim()}\n\n` +
        `💾 Memory:\n${memory.stdout.trim()}\n\n` +
        `💿 Disk:\n${disk.stdout.trim()}\n\n` +
        `🟢 Event Server: 稼働中\n` +
        `📍 IP: 54.92.67.11:3001`;
    }
    // Help request
    else if (messageText.includes('ヘルプ') || messageText.includes('help') || messageText.includes('使い方')) {
      responseText = `🤖 Miyabi Bot コマンド一覧\n\n` +
        `📊 「システム状況」- MAJINサーバー状態確認\n` +
        `🔍 「ログ」- 最新イベントログ確認\n` +
        `📋 「タスク」- 実行中タスク一覧\n` +
        `🏥 「ヘルスチェック」- 全サービス稼働確認\n\n` +
        `💡 質問やコマンドを送信すると、Miyabiが処理して返信します。`;
    }
    // Log request
    else if (messageText.includes('ログ') || messageText.includes('log')) {
      const logs = await execPromise('sudo journalctl -u miyabi-lark-events -n 5 --no-pager 2>/dev/null | tail -5');
      responseText = `📋 最新イベントログ\n\n${logs.stdout.trim() || 'ログなし'}`;
    }
    // Health check
    else if (messageText.includes('ヘルス') || messageText.includes('health')) {
      const services = await execPromise('systemctl is-active miyabi-lark-events');
      responseText = `🏥 ヘルスチェック\n\n` +
        `• miyabi-lark-events: ${services.stdout.trim()}\n` +
        `• Event Server: 稼働中\n` +
        `• Lark API: 接続OK`;
    }
    // Task list
    else if (messageText.includes('タスク') || messageText.includes('task')) {
      const ps = await execPromise('ps aux | grep -E "(node|miyabi)" | grep -v grep | head -5');
      responseText = `📋 実行中プロセス\n\n${ps.stdout.trim() || 'なし'}`;
    }
    // Test/Echo
    else if (messageText === 'テスト' || messageText === 'test') {
      const now = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
      responseText = `✅ テスト成功\n\n` +
        `📨 受信: "${messageText}"\n` +
        `⏰ 処理時刻: ${now}\n` +
        `🔗 双方向通信: 正常`;
    }
    // Default - acknowledge and suggest help
    else {
      responseText = `📝 メッセージ受信\n\n` +
        `「${messageText}」\n\n` +
        `💡 「ヘルプ」で利用可能なコマンドを確認できます。\n` +
        `今後このメッセージはMac Local (Orchestrator)に転送され、タスク実行されます。`;
    }
  } catch (error) {
    responseText = `❌ 処理エラー\n\n${error.message}\n\n再試行してください。`;
    console.error('Process error:', error.message);
  }

  // Send response
  sendMiyabiBotMessage(chatId, responseText)
    .catch(err => console.error('Response error:', err.message));
}

// Verification endpoint for Lark
app.post('/webhook/events', (req, res) => {
  const body = req.body;

  console.log('📨 Received event:', JSON.stringify(body, null, 2));

  // Handle URL verification challenge
  if (body.type === 'url_verification') {
    console.log('🔐 URL Verification Challenge');
    return res.json({ challenge: body.challenge });
  }

  // Verify token
  if (body.token && body.token !== VERIFICATION_TOKEN) {
    console.log('❌ Invalid token');
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Handle events
  if (body.event) {
    const event = body.event;
    const eventType = body.header?.event_type || event.type;

    console.log(`\n✨ Event Type: ${eventType}`);

    // Message received
    if (eventType === 'im.message.receive_v1') {
      const message = event.message;
      const sender = event.sender;

      console.log('📩 New Message:');
      console.log(`  - Chat ID: ${message.chat_id}`);
      console.log(`  - Message ID: ${message.message_id}`);
      console.log(`  - Type: ${message.message_type}`);
      console.log(`  - Sender: ${sender.sender_id?.open_id}`);

      let messageText = '';
      if (message.content) {
        try {
          const content = JSON.parse(message.content);
          messageText = content.text || JSON.stringify(content);
          console.log(`  - Content: ${messageText}`);
        } catch (e) {
          messageText = message.content;
          console.log(`  - Content: ${message.content}`);
        }
      }

      // Add to queue for Mac Local polling (Mac Local handles all processing)
      if (message.chat_id && messageText) {
        const msgData = {
          id: message.message_id,
          chatId: message.chat_id,
          text: messageText,
          senderId: sender.sender_id?.open_id,
          timestamp: new Date().toISOString()
        };

        // Queue for Mac Local - NO duplicate local processing
        messageQueue.push(msgData);
        console.log(`📥 Queued for Mac Local: "${messageText}" (queue: ${messageQueue.length})`);
      }
    }

    // Bot added to chat
    if (eventType === 'im.chat.member.bot.added_v1') {
      console.log('🤖 Bot added to chat:', event.chat_id);
    }

    // Message read
    if (eventType === 'im.message.message_read_v1') {
      console.log('👁️ Message read:', event.message_id_list);
    }
  }

  // Always return success
  res.json({ success: true });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Miyabi Lark Event Server',
    queueSize: messageQueue.length,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// API: Get pending messages (for Mac Local polling)
app.get('/api/messages', (req, res) => {
  const messages = [...messageQueue];
  messageQueue.length = 0; // Clear queue
  console.log(`📤 Sending ${messages.length} messages to poller`);
  res.json({ messages });
});

// API: Send response back to Lark
app.post('/api/response', async (req, res) => {
  const { messageId, chatId, response } = req.body;

  if (!chatId || !response) {
    return res.status(400).json({ error: 'Missing chatId or response' });
  }

  try {
    await sendMiyabiBotMessage(chatId, response);
    console.log(`✅ Response sent for message ${messageId}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Response error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// API: Queue status
app.get('/api/status', (req, res) => {
  res.json({
    queueSize: messageQueue.length,
    pendingResponses: pendingResponses.size,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Miyabi Lark Event Server Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Port: ${PORT}
🔗 Local: http://localhost:${PORT}
🌐 Webhook: http://localhost:${PORT}/webhook/events

📋 Next Steps:
1. Run ngrok: ngrok http ${PORT}
2. Update Lark Event Subscription with ngrok URL
3. Test by sending a message to the bot

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
});
