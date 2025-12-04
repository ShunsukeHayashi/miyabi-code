#!/usr/bin/env node
/**
 * Test script for GitHub Device Flow authentication
 * Run: node test-auth.mjs
 */

import { spawn } from 'child_process';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Start MCP server as child process
const server = spawn('node', ['dist/index.js'], {
  cwd: process.cwd(),
  stdio: ['pipe', 'pipe', 'inherit']
});

let buffer = '';

server.stdout.on('data', (data) => {
  buffer += data.toString();
  
  // Try to parse complete JSON-RPC messages
  const lines = buffer.split('\n');
  buffer = lines.pop() || ''; // Keep incomplete line
  
  for (const line of lines) {
    if (line.trim()) {
      try {
        const msg = JSON.parse(line);
        handleResponse(msg);
      } catch (e) {
        // Not JSON, might be log output
        console.log('[LOG]', line);
      }
    }
  }
});

function sendRequest(method, params = {}, id = Date.now()) {
  const request = {
    jsonrpc: '2.0',
    method,
    params,
    id
  };
  server.stdin.write(JSON.stringify(request) + '\n');
}

function handleResponse(msg) {
  if (msg.result) {
    console.log('\n✅ Response:');
    if (msg.result.content) {
      for (const item of msg.result.content) {
        if (item.text) console.log(item.text);
      }
    }
    if (msg.result.structuredContent) {
      console.log('\n📊 Data:', JSON.stringify(msg.result.structuredContent, null, 2));
    }
  } else if (msg.error) {
    console.log('\n❌ Error:', msg.error);
  }
  showMenu();
}

function showMenu() {
  console.log('\n' + '='.repeat(50));
  console.log('🔐 GitHub Auth Test Menu');
  console.log('='.repeat(50));
  console.log('1. Check auth status (github_auth_status)');
  console.log('2. Start authentication (github_auth_start)');
  console.log('3. Poll for completion (github_auth_poll)');
  console.log('4. List repositories');
  console.log('5. Exit');
  console.log('='.repeat(50));
  
  rl.question('Select option: ', (answer) => {
    switch (answer.trim()) {
      case '1':
        sendRequest('tools/call', { name: 'github_auth_status', arguments: {} });
        break;
      case '2':
        sendRequest('tools/call', { name: 'github_auth_start', arguments: {} });
        break;
      case '3':
        sendRequest('tools/call', { name: 'github_auth_poll', arguments: {} });
        break;
      case '4':
        sendRequest('tools/call', { name: 'list_repos', arguments: {} });
        break;
      case '5':
        console.log('👋 Bye!');
        server.kill();
        process.exit(0);
        break;
      default:
        console.log('Invalid option');
        showMenu();
    }
  });
}

// Initialize MCP connection
setTimeout(() => {
  console.log('🚀 Initializing MCP connection...');
  sendRequest('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test-client', version: '1.0.0' }
  });
  
  setTimeout(() => {
    sendRequest('notifications/initialized', {});
    showMenu();
  }, 500);
}, 100);

process.on('SIGINT', () => {
  server.kill();
  process.exit(0);
});
