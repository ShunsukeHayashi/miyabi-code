#!/usr/bin/env node

/**
 * MCP Filesystem Server Test
 *
 * Tests the @modelcontextprotocol/server-filesystem MCP server
 * to verify it's working correctly.
 *
 * Usage: node .claude/mcp-servers/test-filesystem.js
 */

const { spawn } = require('child_process');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`  ${title}`, 'bright');
  log('='.repeat(60), 'cyan');
}

/**
 * Send JSON-RPC request to MCP server
 */
function sendRequest(server, request, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, timeoutMs);

    let responseData = '';

    const onData = (data) => {
      responseData += data.toString();

      // Try to parse JSON-RPC response
      try {
        const lines = responseData.split('\n').filter(line => line.trim());
        for (const line of lines) {
          const response = JSON.parse(line);
          if (response.id === request.id) {
            clearTimeout(timeout);
            server.stdout.off('data', onData);
            resolve(response);
            return;
          }
        }
      } catch (e) {
        // Continue collecting data
      }
    };

    server.stdout.on('data', onData);
    server.stdin.write(JSON.stringify(request) + '\n');
  });
}

/**
 * Main test function
 */
async function runTests() {
  logSection('MCP Filesystem Server Test');

  log('\nStarting MCP server...', 'yellow');

  // Spawn the MCP server
  const serverProcess = spawn('npx', [
    '-y',
    '@modelcontextprotocol/server-filesystem',
    process.cwd()
  ], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // Handle server stderr
  serverProcess.stderr.on('data', (data) => {
    log(`[Server Error] ${data.toString().trim()}`, 'red');
  });

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 2000));
  log('✓ Server started', 'green');

  try {
    // Test 1: Initialize
    logSection('Test 1: Initialize Connection');
    const initResponse = await sendRequest(serverProcess, {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'test-client',
          version: '1.0.0'
        }
      }
    });

    if (initResponse.result) {
      log('✓ Initialize successful', 'green');
      log(`  Server: ${initResponse.result.serverInfo.name} v${initResponse.result.serverInfo.version}`, 'blue');
      log(`  Capabilities: ${JSON.stringify(initResponse.result.capabilities, null, 2)}`, 'blue');
    } else {
      throw new Error('Initialize failed: ' + JSON.stringify(initResponse.error));
    }

    // Test 2: List available tools
    logSection('Test 2: List Available Tools');
    const toolsResponse = await sendRequest(serverProcess, {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    });

    if (toolsResponse.result) {
      log('✓ Tools list successful', 'green');
      log(`  Available tools (${toolsResponse.result.tools.length}):`, 'blue');
      toolsResponse.result.tools.forEach(tool => {
        log(`    - ${tool.name}: ${tool.description}`, 'cyan');
      });
    } else {
      throw new Error('Tools list failed: ' + JSON.stringify(toolsResponse.error));
    }

    // Test 3: Read a file
    logSection('Test 3: Read File (README.md)');
    const readResponse = await sendRequest(serverProcess, {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'read_file',
        arguments: {
          path: 'README.md'
        }
      }
    });

    if (readResponse.result) {
      log('✓ Read file successful', 'green');
      const content = readResponse.result.content[0].text;
      const preview = content.substring(0, 200).replace(/\n/g, ' ');
      log(`  Preview: ${preview}...`, 'blue');
      log(`  Total length: ${content.length} characters`, 'blue');
    } else {
      throw new Error('Read file failed: ' + JSON.stringify(readResponse.error));
    }

    // Test 4: List directory
    logSection('Test 4: List Directory');
    const listResponse = await sendRequest(serverProcess, {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'list_directory',
        arguments: {
          path: '.claude'
        }
      }
    });

    if (listResponse.result) {
      log('✓ List directory successful', 'green');
      const output = listResponse.result.content[0].text;
      const lines = output.split('\n').filter(line => line.trim());
      log(`  Entries in .claude/ (${lines.length}):`, 'blue');
      lines.slice(0, 10).forEach(line => {
        log(`    ${line}`, 'cyan');
      });
      if (lines.length > 10) {
        log(`    ... and ${lines.length - 10} more`, 'cyan');
      }
    } else {
      throw new Error('List directory failed: ' + JSON.stringify(listResponse.error));
    }

    // Test 5: Search files (with longer timeout for recursive search)
    logSection('Test 5: Search Files (*.md in .claude/)');
    const searchResponse = await sendRequest(serverProcess, {
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'search_files',
        arguments: {
          path: '.claude',
          pattern: '*.md'
        }
      }
    }, 10000); // 10 second timeout for search

    if (searchResponse.result) {
      log('✓ Search files successful', 'green');
      const files = searchResponse.result.content[0].text.split('\n').filter(f => f.trim());
      log(`  Found ${files.length} markdown files:`, 'blue');
      files.slice(0, 10).forEach(file => {
        log(`    - ${file}`, 'cyan');
      });
      if (files.length > 10) {
        log(`    ... and ${files.length - 10} more`, 'cyan');
      }
    } else {
      throw new Error('Search files failed: ' + JSON.stringify(searchResponse.error));
    }

    logSection('Test Summary');
    log('✓ All tests passed!', 'green');
    log('\nThe filesystem MCP server is working correctly.', 'bright');

  } catch (error) {
    logSection('Test Failed');
    log(`✗ Error: ${error.message}`, 'red');
    log(error.stack, 'red');
    process.exit(1);
  } finally {
    // Clean up
    log('\nShutting down server...', 'yellow');
    serverProcess.kill();
    log('✓ Server stopped', 'green');
  }
}

// Run tests
runTests().catch(error => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
