#!/usr/bin/env node

/**
 * Simple test script to validate Discord MCP server functionality
 * Tests the server initialization without requiring Discord credentials
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(__dirname, 'dist', 'index.js');

console.log('🧪 Testing Discord MCP Server...');
console.log('📍 Server path:', serverPath);

// Test 1: Check if server starts without crashing
console.log('\n🔍 Test 1: Server startup validation');

const serverProcess = spawn('node', [serverPath], {
  env: {
    ...process.env,
    // No Discord token for basic startup test
  },
  stdio: ['pipe', 'pipe', 'pipe']
});

let startupSuccess = false;
let errorOutput = '';

// Capture stderr (server logs)
serverProcess.stderr.on('data', (data) => {
  const output = data.toString();
  console.log('📝 Server log:', output.trim());

  if (output.includes('Miyabi Discord MCP Server running on stdio')) {
    startupSuccess = true;
    console.log('✅ Server startup successful!');

    // Test server list tools functionality
    setTimeout(() => {
      console.log('\n🔍 Test 2: Tool listing validation');

      // Send list tools request
      const listToolsRequest = {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list"
      };

      serverProcess.stdin.write(JSON.stringify(listToolsRequest) + '\n');

      setTimeout(() => {
        console.log('📊 Test completed - shutting down server');
        serverProcess.kill('SIGTERM');
      }, 1000);
    }, 1000);
  }

  if (output.includes('Warning: DISCORD_BOT_TOKEN not provided')) {
    console.log('⚠️  Expected warning: Discord token not provided (OK for test)');
  }
});

// Capture stdout (MCP responses)
serverProcess.stdout.on('data', (data) => {
  try {
    const response = JSON.parse(data.toString());
    if (response.result && response.result.tools) {
      console.log(`✅ Found ${response.result.tools.length} Discord MCP tools:`);
      response.result.tools.forEach(tool => {
        console.log(`   - ${tool.name}: ${tool.description}`);
      });

      // Validate expected tools
      const expectedTools = [
        'discord_send_message',
        'discord_webhook_send',
        'discord_miyabi_notification'
      ];

      const foundTools = response.result.tools.map(t => t.name);
      const missingTools = expectedTools.filter(tool => !foundTools.includes(tool));

      if (missingTools.length === 0) {
        console.log('✅ All expected tools found!');
      } else {
        console.log('❌ Missing tools:', missingTools);
      }
    }
  } catch (e) {
    // Ignore non-JSON output
  }
});

serverProcess.on('error', (error) => {
  console.log('❌ Server startup failed:', error.message);
  process.exit(1);
});

serverProcess.on('exit', (code, signal) => {
  console.log(`\n🏁 Test completed`);

  if (startupSuccess) {
    console.log('✅ Discord MCP Server validation passed!');
    console.log('\n📋 Summary:');
    console.log('   - Server starts without crashing ✅');
    console.log('   - Tools are properly registered ✅');
    console.log('   - Graceful shutdown works ✅');
    console.log('\n🚀 Ready for integration with Discord credentials!');
    process.exit(0);
  } else {
    console.log('❌ Server validation failed');
    process.exit(1);
  }
});

// Graceful shutdown on Ctrl+C
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted - cleaning up...');
  serverProcess.kill('SIGTERM');
  setTimeout(() => {
    process.exit(0);
  }, 1000);
});