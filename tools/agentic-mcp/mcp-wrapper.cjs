#!/usr/bin/env node
/**
 * MCP Wrapper for Agentic Orchestration System
 * Claude Code MCP Tool統合用エントリーポイント
 */

// MCP通信のため、console.logを抑制
const originalLog = console.log;
console.log = (...args) => {
  // JSONのみ出力（MCP通信）
  if (args[0] && typeof args[0] === 'string' && args[0].startsWith('{')) {
    originalLog(...args);
  } else {
    // その他は stderr へ
    console.error(...args);
  }
};

// 環境変数をロード
require('dotenv').config({ path: __dirname + '/.env' });

// server.jsを実行
require('./dist/server.js');
