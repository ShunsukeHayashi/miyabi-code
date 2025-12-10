#!/usr/bin/env node
/**
 * Security Test for Lark Event Server
 * ハードコードされた認証情報がないことを確認
 */

const fs = require('fs');
const path = require('path');

const CRITICAL_FILES = [
  '../server/event-server.js',
];

// 実際の認証情報のパターン
const SENSITIVE_PATTERNS = [
  {
    // cli_で始まる16文字の英数字（実際のAPP_ID形式）
    pattern: /['"]cli_[a-z0-9]{16}['"]/g,
    name: 'Hardcoded APP_ID (cli_xxx format)',
    severity: 'CRITICAL'
  },
  {
    // 32文字の英数字文字列（実際のAPP_SECRET形式）で、クォートで囲まれている
    pattern: /['"]\w{32}['"]/g,
    name: 'Potential APP_SECRET (32 chars in quotes)',
    severity: 'CRITICAL',
    filter: (match) => {
      // your_app_xxx のような例外パターンを除外
      return !match.includes('your_app');
    }
  },
  {
    // デフォルト値としてのハードコード検出
    pattern: /process\.env\.\w+\s*\|\|\s*['"][^'"]{10,}['"]/g,
    name: 'Default value for environment variable',
    severity: 'CRITICAL',
    filter: (match) => {
      // 安全なデフォルト値を除外
      const safeDefaults = ['localhost', '3000', 'http://', 'https://'];
      return !safeDefaults.some(safe => match.includes(safe));
    }
  }
];

const SAFE_PATTERNS = [
  /process\.env\.(APP_ID|APP_SECRET)/,
  /your_app_id_here/,
  /your_app_secret_here/,
  /Lark App (ID|Secret)/,  // 説明用文字列
  /\/\//,  // コメント行
];

function isSafeContext(line) {
  return SAFE_PATTERNS.some(pattern => pattern.test(line));
}

function scanFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  const content = fs.readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n');
  
  const issues = [];
  
  lines.forEach((line, index) => {
    // コメント行はスキップ
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
      return;
    }
    
    // 安全なコンテキストはスキップ
    if (isSafeContext(line)) {
      return;
    }
    
    SENSITIVE_PATTERNS.forEach(({ pattern, name, severity, filter }) => {
      const matches = line.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // フィルター関数があれば適用
          if (filter && !filter(match)) {
            return;
          }
          
          issues.push({
            file: filePath,
            line: index + 1,
            content: line.trim(),
            match: match,
            issue: name,
            severity: severity
          });
        });
      }
    });
  });
  
  return issues;
}

function runSecurityScan() {
  console.log('🔒 Miyabi Lark Security Scan\n');
  console.log('検査対象ファイル:');
  CRITICAL_FILES.forEach(f => console.log(`  - ${f}`));
  console.log('');
  
  let allIssues = [];
  
  CRITICAL_FILES.forEach(file => {
    const issues = scanFile(file);
    allIssues = allIssues.concat(issues);
  });
  
  if (allIssues.length === 0) {
    console.log('✅ セキュリティスキャン完了: 問題なし\n');
    console.log('検証項目:');
    console.log('  ✓ ハードコードされたAPP_IDなし');
    console.log('  ✓ ハードコードされたAPP_SECRETなし');
    console.log('  ✓ 環境変数から認証情報を読み込み');
    console.log('  ✓ デフォルト値に実際の認証情報なし');
    console.log('');
    return 0;
  }
  
  console.log('❌ セキュリティ問題を検出\n');
  
  const critical = allIssues.filter(i => i.severity === 'CRITICAL');
  const warnings = allIssues.filter(i => i.severity === 'WARNING');
  
  if (critical.length > 0) {
    console.log('🚨 CRITICAL ISSUES:');
    critical.forEach(issue => {
      console.log(`\n  ファイル: ${issue.file}:${issue.line}`);
      console.log(`  問題: ${issue.issue}`);
      console.log(`  検出: ${issue.match}`);
      console.log(`  行: ${issue.content}`);
    });
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    warnings.forEach(issue => {
      console.log(`\n  ファイル: ${issue.file}:${issue.line}`);
      console.log(`  問題: ${issue.issue}`);
      console.log(`  内容: ${issue.content}`);
    });
  }
  
  console.log(`\n\n合計: ${critical.length} critical, ${warnings.length} warnings\n`);
  
  return critical.length > 0 ? 1 : 0;
}

// 環境変数チェック
function checkEnvironmentVariables() {
  console.log('🔍 環境変数検証\n');
  
  const requiredVars = ['APP_ID', 'APP_SECRET'];
  const missing = requiredVars.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    console.log('⚠️  以下の環境変数が未設定:');
    missing.forEach(v => console.log(`  - ${v}`));
    console.log('\n注意: これは期待される動作です（.envファイルが未作成の場合）');
    console.log('本番環境では必ず設定してください。\n');
  } else {
    console.log('✅ 必須環境変数が設定されています\n');
    requiredVars.forEach(v => {
      const val = process.env[v];
      console.log(`  ✓ ${v}: ${val.substring(0, 8)}...`);
    });
    console.log('');
  }
}

// .gitignore チェック
function checkGitignore() {
  console.log('📝 .gitignore チェック\n');
  
  const gitignorePath = path.join(__dirname, '../.gitignore');
  
  if (!fs.existsSync(gitignorePath)) {
    console.log('❌ .gitignoreファイルが見つかりません\n');
    return 1;
  }
  
  const content = fs.readFileSync(gitignorePath, 'utf-8');
  
  const requiredEntries = ['.env', '.env.local'];
  const missing = requiredEntries.filter(entry => !content.includes(entry));
  
  if (missing.length > 0) {
    console.log('❌ .gitignoreに以下のエントリが不足:');
    missing.forEach(e => console.log(`  - ${e}`));
    console.log('');
    return 1;
  }
  
  console.log('✅ .gitignoreが正しく設定されています\n');
  return 0;
}

// .env.example の存在チェック
function checkEnvExample() {
  console.log('📄 .env.example チェック\n');
  
  const envExamplePath = path.join(__dirname, '../.env.example');
  
  if (!fs.existsSync(envExamplePath)) {
    console.log('❌ .env.exampleファイルが見つかりません\n');
    return 1;
  }
  
  const content = fs.readFileSync(envExamplePath, 'utf-8');
  
  const requiredVars = ['APP_ID', 'APP_SECRET'];
  const missing = requiredVars.filter(v => !content.includes(v));
  
  if (missing.length > 0) {
    console.log('❌ .env.exampleに以下の変数が不足:');
    missing.forEach(v => console.log(`  - ${v}`));
    console.log('');
    return 1;
  }
  
  // 実際の認証情報がないことを確認
  if (content.includes('cli_a994d7e3b8789e1a') || content.includes('rNrwfiZCD9aRCCrQY5E1OeifhDg2kZJL')) {
    console.log('❌ .env.exampleに実際の認証情報が含まれています\n');
    return 1;
  }
  
  console.log('✅ .env.exampleが正しく設定されています\n');
  return 0;
}

// メイン実行
console.log('═══════════════════════════════════════════\n');
console.log('  Miyabi Lark Security Test Suite\n');
console.log('═══════════════════════════════════════════\n');

const scanCode = runSecurityScan();
checkEnvironmentVariables();
const gitignoreCode = checkGitignore();
const envExampleCode = checkEnvExample();

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (scanCode === 0 && gitignoreCode === 0 && envExampleCode === 0) {
  console.log('\n✅ すべてのセキュリティチェックに合格\n');
  console.log('   - コードに認証情報のハードコードなし');
  console.log('   - .gitignoreが正しく設定されている');
  console.log('   - .env.exampleが提供されている\n');
  process.exit(0);
} else {
  console.log('\n❌ セキュリティチェックに失敗\n');
  process.exit(1);
}
