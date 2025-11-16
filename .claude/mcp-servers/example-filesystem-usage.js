#!/usr/bin/env node

/**
 * MCP Filesystem Server - Usage Examples
 *
 * Demonstrates practical usage patterns for the filesystem MCP server.
 * Run: node .claude/mcp-servers/example-filesystem-usage.js
 */

const { spawn } = require('child_process');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function sendRequest(server, request, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, timeoutMs);

    let responseData = '';

    const onData = (data) => {
      responseData += data.toString();
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

async function runExamples() {
  log('\n' + '='.repeat(60), 'cyan');
  log('  MCP Filesystem Server - Practical Examples', 'bright');
  log('='.repeat(60) + '\n', 'cyan');

  // Start MCP server
  const serverProcess = spawn('npx', [
    '-y',
    '@modelcontextprotocol/server-filesystem',
    process.cwd()
  ], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  serverProcess.stderr.on('data', () => {});

  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    // Initialize
    await sendRequest(serverProcess, {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'example-client', version: '1.0.0' }
      }
    });

    // Example 1: Read project metadata
    log('Example 1: Read Project Metadata', 'yellow');
    log('─'.repeat(60), 'cyan');

    const cargoToml = await sendRequest(serverProcess, {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'read_text_file',
        arguments: { path: 'Cargo.toml', head: 20 }
      }
    });

    if (cargoToml.result) {
      const content = cargoToml.result.content[0].text;
      log('✓ Read Cargo.toml (first 20 lines):', 'green');
      content.split('\n').slice(0, 5).forEach(line => {
        log(`  ${line}`, 'blue');
      });
      log('  ...', 'blue');
    }

    // Example 2: Analyze directory structure
    log('\nExample 2: Analyze Directory Structure', 'yellow');
    log('─'.repeat(60), 'cyan');

    const tree = await sendRequest(serverProcess, {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'directory_tree',
        arguments: { path: 'crates/miyabi-cli' }
      }
    });

    if (tree.result) {
      const treeData = JSON.parse(tree.result.content[0].text);
      log('✓ Directory tree for crates/miyabi-cli:', 'green');
      log(`  Root: ${treeData.name}`, 'blue');
      if (treeData.children) {
        treeData.children.slice(0, 5).forEach(child => {
          const icon = child.type === 'directory' ? '📁' : '📄';
          log(`    ${icon} ${child.name}`, 'cyan');
        });
        if (treeData.children.length > 5) {
          log(`    ... and ${treeData.children.length - 5} more`, 'cyan');
        }
      }
    }

    // Example 3: Search for specific files
    log('\nExample 3: Search for Configuration Files', 'yellow');
    log('─'.repeat(60), 'cyan');

    const configFiles = await sendRequest(serverProcess, {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'search_files',
        arguments: {
          path: 'crates',
          pattern: 'Cargo.toml'
        }
      }
    }, 15000);

    if (configFiles.result) {
      const files = configFiles.result.content[0].text.split('\n').filter(f => f.trim());
      log(`✓ Found ${files.length} Cargo.toml files:`, 'green');
      files.slice(0, 8).forEach(file => {
        log(`  - ${file}`, 'cyan');
      });
      if (files.length > 8) {
        log(`  ... and ${files.length - 8} more`, 'cyan');
      }
    }

    // Example 4: Get file metadata
    log('\nExample 4: Get File Metadata', 'yellow');
    log('─'.repeat(60), 'cyan');

    const fileInfo = await sendRequest(serverProcess, {
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'get_file_info',
        arguments: { path: 'README.md' }
      }
    });

    if (fileInfo.result) {
      const infoText = fileInfo.result.content[0].text;
      log('✓ README.md metadata:', 'green');
      infoText.split('\n').forEach(line => {
        if (line.trim()) {
          log(`  ${line}`, 'blue');
        }
      });
    }

    // Example 5: Read multiple files at once
    log('\nExample 5: Batch Read Files', 'yellow');
    log('─'.repeat(60), 'cyan');

    const multipleFiles = await sendRequest(serverProcess, {
      jsonrpc: '2.0',
      id: 6,
      method: 'tools/call',
      params: {
        name: 'read_multiple_files',
        arguments: {
          paths: [
            'CLAUDE.md',
            'AGENTS.md',
            'QUICKSTART-JA.md'
          ]
        }
      }
    });

    if (multipleFiles.result) {
      log('✓ Read 3 files in one request:', 'green');
      multipleFiles.result.content.forEach((item, idx) => {
        if (item.type === 'text') {
          const lines = item.text.split('\n');
          const firstLine = lines[0] || '';
          log(`  [${idx + 1}] ${firstLine.substring(0, 50)}...`, 'blue');
        }
      });
    }

    log('\n' + '='.repeat(60), 'cyan');
    log('  All Examples Completed Successfully!', 'green');
    log('='.repeat(60) + '\n', 'cyan');

    log('Key Takeaways:', 'yellow');
    log('  • Use read_text_file with head/tail for large files', 'blue');
    log('  • directory_tree provides structured navigation', 'blue');
    log('  • search_files is powerful but can be slow on large dirs', 'blue');
    log('  • get_file_info avoids reading full content', 'blue');
    log('  • read_multiple_files batches operations efficiently\n', 'blue');

  } catch (error) {
    log(`\n✗ Error: ${error.message}`, 'red');
    console.error(error);
  } finally {
    serverProcess.kill();
  }
}

runExamples().catch(console.error);
