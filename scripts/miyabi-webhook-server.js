const http = require('http');
const { exec } = require('child_process');
const util = require('util');

const PORT = 3002;
const execPromise = util.promisify(exec);

// Process message content
async function processMessage(chatId, message, senderId) {
  console.log(`\n📨 Received from MAJIN:`);
  console.log(`  Chat: ${chatId}`);
  console.log(`  Message: ${message}`);
  console.log(`  Sender: ${senderId}`);

  let response = '';

  try {
    if (message.includes('git') || message.includes('commit')) {
      const gitStatus = await execPromise('cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private && git status --short');
      const branch = await execPromise('cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private && git branch --show-current');
      response = `📊 Git Status (Mac Local)\n\n` +
        `🌿 Branch: ${branch.stdout.trim()}\n\n` +
        `📝 Changes:\n${gitStatus.stdout.trim() || 'No changes'}`;
    }
    else if (message.includes('agent') || message.includes('エージェント')) {
      const tmuxSessions = await execPromise('tmux list-sessions 2>/dev/null || echo "No sessions"');
      response = `🤖 Agent Status (Mac Local)\n\n` +
        `📺 tmux Sessions:\n${tmuxSessions.stdout.trim()}`;
    }
    else if (message.includes('issue')) {
      const issues = await execPromise('cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private && gh issue list --limit 5 2>/dev/null || echo "gh not available"');
      response = `📋 Recent Issues\n\n${issues.stdout.trim()}`;
    }
    else {
      response = `📝 Mac Local 受信\n\n` +
        `「${message}」\n\n` +
        `Mac Local Orchestratorで処理します。`;
    }
  } catch (error) {
    response = `❌ Mac Local エラー\n\n${error.message}`;
    console.error('Error:', error.message);
  }

  return response;
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Content-Type', 'application/json');

  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'ok',
      service: 'Miyabi Mac Local Webhook',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // POST /lark/message
  if (req.method === 'POST' && req.url === '/lark/message') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const response = await processMessage(data.chatId, data.message, data.senderId);
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, response }));
      } catch (error) {
        res.writeHead(500);
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
    return;
  }

  // 404 for other routes
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`
🖥️ Miyabi Mac Local Webhook Server Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Port: ${PORT}
🔗 Endpoint: http://localhost:${PORT}/lark/message
🏥 Health: http://localhost:${PORT}/health

Waiting for messages from MAJIN...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
});
