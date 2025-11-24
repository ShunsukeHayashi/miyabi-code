#!/usr/bin/env node
/**
 * Lark Event Handler for Miyabi Command Center
 * 
 * This script runs on MAJIN and:
 * 1. Receives Lark events via HTTP
 * 2. Parses commands from messages
 * 3. Executes commands on Mac Local tmux via SSH
 * 
 * Deploy to: MAJIN (54.92.67.11)
 * Service: miyabi-lark-events.service
 */

const http = require('http');
const crypto = require('crypto');
const { exec, spawn } = require('child_process');
const fs = require('fs');

// Configuration
const CONFIG = {
  port: 3001,
  macHost: 'miyabi-mac', // SSH config alias for Mac Local
  tmuxSession: 'miyabi-orchestrator',
  tmuxPane: '%13', // Claude Code Agent pane
  logFile: '/var/log/miyabi-lark-events.log',
  
  // Lark App credentials (load from env)
  appId: process.env.LARK_APP_ID,
  appSecret: process.env.LARK_APP_SECRET,
  verificationToken: process.env.LARK_VERIFICATION_TOKEN,
  encryptKey: process.env.LARK_ENCRYPT_KEY,
};

// Command mappings
const COMMANDS = {
  '状態': 'miyabi status',
  'ステータス': 'miyabi status',
  'status': 'miyabi status',
  'セッション': 'tmux list-sessions',
  'sessions': 'tmux list-sessions',
  'ログ': 'tail -20 ~/Dev/01-miyabi/_core/miyabi-private/logs/latest.log',
  'logs': 'tail -20 ~/Dev/01-miyabi/_core/miyabi-private/logs/latest.log',
  '承認': 'echo "APPROVED" >> /tmp/miyabi-approval',
  '却下': 'echo "REJECTED" >> /tmp/miyabi-approval',
  'approve': 'echo "APPROVED" >> /tmp/miyabi-approval',
  'reject': 'echo "REJECTED" >> /tmp/miyabi-approval',
};

// Logging
function log(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = JSON.stringify({ timestamp, level, message, ...data });
  console.log(logEntry);
  
  try {
    fs.appendFileSync(CONFIG.logFile, logEntry + '\n');
  } catch (e) {
    // Ignore file write errors
  }
}

// Decrypt Lark message if encrypted
function decryptMessage(encrypt) {
  if (!CONFIG.encryptKey || !encrypt) return null;
  
  try {
    const key = crypto.createHash('sha256').update(CONFIG.encryptKey).digest();
    const encryptBuffer = Buffer.from(encrypt, 'base64');
    const iv = encryptBuffer.slice(0, 16);
    const encrypted = encryptBuffer.slice(16);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return JSON.parse(decrypted.toString());
  } catch (e) {
    log('error', 'Decryption failed', { error: e.message });
    return null;
  }
}

// Send command to Mac Local tmux via SSH
function sendToTmux(command, callback) {
  // Escape special characters for tmux
  const escapedCommand = command.replace(/'/g, "'\\''");
  
  // Use SSH to send to Mac Local tmux
  const sshCommand = `ssh ${CONFIG.macHost} "tmux send-keys -t ${CONFIG.tmuxSession}:agent.1 '${escapedCommand}' Enter"`;
  
  log('info', 'Executing SSH command', { sshCommand });
  
  exec(sshCommand, { timeout: 30000 }, (error, stdout, stderr) => {
    if (error) {
      log('error', 'SSH command failed', { error: error.message, stderr });
      callback(error);
      return;
    }
    log('info', 'SSH command success', { stdout });
    callback(null, stdout);
  });
}

// Parse command from message text
function parseCommand(text) {
  if (!text) return null;
  
  const trimmed = text.trim();
  
  // Direct command mapping
  if (COMMANDS[trimmed]) {
    return { type: 'mapped', command: COMMANDS[trimmed], original: trimmed };
  }
  
  // Issue command pattern: "Issue #123 開始"
  const issueMatch = trimmed.match(/Issue\s*#?(\d+)\s*(開始|start|確認|check|完了|done)/i);
  if (issueMatch) {
    const issueNum = issueMatch[1];
    const action = issueMatch[2].toLowerCase();
    return { 
      type: 'issue', 
      command: `gh issue view ${issueNum} && echo "Action: ${action}"`,
      original: trimmed,
      issueNumber: issueNum,
      action: action
    };
  }
  
  // Claude command pattern: starts with "claude" or "@claude"
  const claudeMatch = trimmed.match(/^@?claude\s+(.+)/i);
  if (claudeMatch) {
    return { type: 'claude', command: claudeMatch[1], original: trimmed };
  }
  
  // Direct shell command pattern: starts with "$" or "!"
  if (trimmed.startsWith('$') || trimmed.startsWith('!')) {
    return { type: 'shell', command: trimmed.slice(1).trim(), original: trimmed };
  }
  
  // Default: send as-is to Claude Code
  return { type: 'natural', command: trimmed, original: trimmed };
}

// Handle Lark event
function handleEvent(event) {
  log('info', 'Received event', { eventType: event.header?.event_type });
  
  // URL verification challenge
  if (event.challenge) {
    return { challenge: event.challenge };
  }
  
  // Message event
  if (event.header?.event_type === 'im.message.receive_v1') {
    const message = event.event?.message;
    if (!message) return { status: 'no_message' };
    
    // Only handle text messages
    if (message.message_type !== 'text') {
      log('info', 'Ignoring non-text message', { type: message.message_type });
      return { status: 'ignored', reason: 'non_text' };
    }
    
    // Parse message content
    let content;
    try {
      content = JSON.parse(message.content);
    } catch (e) {
      log('error', 'Failed to parse message content', { content: message.content });
      return { status: 'error', reason: 'parse_failed' };
    }
    
    const text = content.text;
    const parsed = parseCommand(text);
    
    if (!parsed) {
      return { status: 'no_command' };
    }
    
    log('info', 'Parsed command', { parsed });
    
    // Execute command
    sendToTmux(parsed.command, (error, result) => {
      if (error) {
        log('error', 'Command execution failed', { error: error.message });
      } else {
        log('info', 'Command executed', { result });
      }
    });
    
    return { status: 'processing', command: parsed };
  }
  
  return { status: 'unknown_event' };
}

// HTTP Server
const server = http.createServer((req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }
  
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    try {
      let event = JSON.parse(body);
      
      // Handle encrypted messages
      if (event.encrypt) {
        event = decryptMessage(event.encrypt) || event;
      }
      
      const result = handleEvent(event);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (e) {
      log('error', 'Request processing failed', { error: e.message, body });
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid request' }));
    }
  });
});

server.listen(CONFIG.port, () => {
  log('info', `Miyabi Lark Event Handler started on port ${CONFIG.port}`);
  log('info', 'Configuration', { 
    macHost: CONFIG.macHost,
    tmuxSession: CONFIG.tmuxSession,
    tmuxPane: CONFIG.tmuxPane
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  log('info', 'Received SIGTERM, shutting down');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  log('info', 'Received SIGINT, shutting down');
  server.close(() => process.exit(0));
});
