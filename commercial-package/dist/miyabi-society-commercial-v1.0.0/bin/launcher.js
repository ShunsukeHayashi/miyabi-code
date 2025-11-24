#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

const LICENSE = process.env.MIYABI_LICENSE_KEY;
if (!LICENSE || !LICENSE.startsWith('MIYABI-COMMERCIAL-')) {
    console.error('❌ Invalid license key');
    process.exit(1);
}

// Start main MCP server
const serverPath = path.join(__dirname, 'miyabi-mcp/dist/index.js');
const server = spawn('node', [serverPath], {
    stdio: ['inherit', 'inherit', 'inherit'],
    env: process.env
});

server.on('exit', (code) => process.exit(code));
