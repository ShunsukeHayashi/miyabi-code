# MCP Server 詳細使い方ガイド 🇯🇵

**最終更新**: 2025-11-10
**対象**: Miyabi開発者全員
**難易度**: 初級〜上級

---

## 📖 目次

1. [MCPとは？](#mcpとは)
2. [セットアップ](#セットアップ)
3. [基本的な使い方](#基本的な使い方)
4. [Filesystem MCP Server](#filesystem-mcp-server)
5. [Miyabi Rust MCP Server](#miyabi-rust-mcp-server)
6. [その他のMCPサーバー](#その他のmcpサーバー)
7. [実践的な使用例](#実践的な使用例)
8. [トラブルシューティング](#トラブルシューティング)
9. [ベストプラクティス](#ベストプラクティス)

---

## MCPとは？

### Model Context Protocol (MCP)

MCPは、AI モデルに追加のツールや知識を提供するためのオープンプロトコルです。

**簡単に言うと**:
- Claude Code に新しい機能を追加できる
- ファイル操作、GitHub連携、データベースアクセスなどが可能に
- プラグインのようなもの

**Miyabiでの役割**:
```
Claude Code
    ↓
  MCP Server (filesystem, miyabi, github-enhanced, etc.)
    ↓
  実際のシステム (ファイル, GitHub, データベース, etc.)
```

---

## セットアップ

### 1. 必要なツールの確認

```bash
# Node.js のバージョン確認 (>= 16.0.0)
node --version

# npm/npx の確認
npx --version

# Rust/Cargo の確認 (Miyabi MCP用)
cargo --version
```

### 2. MCP設定ファイルの確認

```bash
# 設定ファイルを確認
cat .claude/mcp.json

# JSON形式が正しいか検証
cat .claude/mcp.json | jq .
```

### 3. MCP サーバーの起動確認

Claude Code を起動すると、自動的に有効なMCPサーバーがすべて起動します。

```bash
# Claude Code を起動
claude

# 別のターミナルで、MCPサーバーのプロセスを確認
ps aux | grep mcp
```

---

## 基本的な使い方

### MCPサーバーの状態確認

```bash
# すべてのMCPサーバーの状態を確認
node -e "
const config = require('./.claude/mcp.json');
console.log('MCP Servers:');
Object.entries(config.mcpServers).forEach(([key, value]) => {
  if (key === '//') return;
  const status = value.disabled ? '⏸️  DISABLED' : '✅ ENABLED';
  console.log(\`  \${status} - \${key}\`);
});
"
```

### MCPサーバーの有効化/無効化

`.claude/mcp.json` を編集:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "...",
      "disabled": false  // true に変更で無効化
    }
  }
}
```

変更後、Claude Code を再起動してください。

---

## Filesystem MCP Server

### 概要

ファイルシステムへの安全なアクセスを提供します。

**利用可能なツール (14個)**:
1. read_text_file - テキストファイル読み込み
2. write_file - ファイル書き込み
3. edit_file - ファイル編集
4. list_directory - ディレクトリ一覧
5. search_files - ファイル検索
6. その他9個

### 基本的な使い方

#### 1. ファイルを読む

```bash
# テストスクリプトで動作確認
node .claude/mcp-servers/test-filesystem.js
```

Claude Code 内での使用:
```
ユーザー: "README.mdを読んで要約して"
Claude: [filesystem MCPを使用してREADME.mdを読み込む]
```

#### 2. ディレクトリを調べる

```javascript
// 例: .claude/mcp-servers/example-filesystem-usage.js
// Example 4: Get File Metadata

const fileInfo = await sendRequest(serverProcess, {
  jsonrpc: '2.0',
  id: 5,
  method: 'tools/call',
  params: {
    name: 'get_file_info',
    arguments: { path: 'README.md' }
  }
});
```

#### 3. ファイルを検索

```javascript
// 例: Cargo.toml を検索
const searchResponse = await sendRequest(serverProcess, {
  jsonrpc: '2.0',
  id: 4,
  method: 'tools/call',
  params: {
    name: 'search_files',
    arguments: {
      path: 'crates',        // 検索範囲を限定
      pattern: 'Cargo.toml'  // 検索パターン
    }
  }
});
```

### よくある使用例

#### 📖 Example 1: プロジェクト情報を取得

```bash
# 実践例を実行
node .claude/mcp-servers/example-filesystem-usage.js
```

この例では以下を実行:
- Cargo.toml の最初の20行を読む
- crates/miyabi-cli のディレクトリ構造を取得
- crates/ 内の全 Cargo.toml を検索
- README.md のメタデータを取得
- 複数ファイルを一括読み込み

#### 📝 Example 2: 大きなファイルを部分的に読む

Claude Code で:
```
ユーザー: "CHANGELOG.md の最初の50行だけ読んで"
Claude: [read_text_file with head parameter を使用]
```

実装 (内部的には):
```javascript
{
  name: 'read_text_file',
  arguments: {
    path: 'CHANGELOG.md',
    head: 50  // 最初の50行のみ
  }
}
```

#### 🔍 Example 3: 特定のコードを探す

```
ユーザー: "crates/ 内で main.rs ファイルをすべて見つけて"
Claude: [search_files を使用]
```

### パフォーマンス最適化

```javascript
// ❌ 悪い例: 大きなディレクトリで検索
search_files({ path: '.', pattern: '*.rs' })  // 遅い！

// ✅ 良い例: スコープを限定
search_files({ path: 'crates/miyabi-cli', pattern: '*.rs' })

// ✅ 良い例: 複数ファイルを一括読み込み
read_multiple_files({
  paths: ['file1.rs', 'file2.rs', 'file3.rs']
})
```

---

## Miyabi Rust MCP Server

### 概要

Miyabi の Agent を MCP 経由で実行できます。

**設定**:
```json
{
  "miyabi": {
    "command": "cargo",
    "args": ["run", "--release", "--bin", "miyabi-mcp-server"],
    "env": {
      "GITHUB_TOKEN": "${GITHUB_TOKEN}",
      "REPO_OWNER": "ShunsukeHayashi",
      "REPO_NAME": "Miyabi",
      "RUST_LOG": "miyabi_mcp_server=info,miyabi_agents=debug"
    }
  }
}
```

### 使い方

#### 1. サーバーのビルド (初回のみ)

```bash
# Miyabi MCP Server をビルド
cargo build --release --bin miyabi-mcp-server

# ビルドされたバイナリを確認
ls -lh target/release/miyabi-mcp-server
```

#### 2. 動作確認

```bash
# サーバーを手動で起動して確認
cargo run --release --bin miyabi-mcp-server

# 別のターミナルで JSON-RPC リクエストを送信
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
  cargo run --release --bin miyabi-mcp-server
```

#### 3. Claude Code から使用

Claude Code を起動すると自動的に Miyabi MCP Server が起動します。

```
ユーザー: "Issue #123 を解決して"
Claude: [Miyabi MCP を使用して Agent を実行]
```

### 利用可能な機能

Miyabi MCP Server が提供する機能:
- Agent の実行
- Issue の取得と更新
- PR の作成
- ワークツリーの管理
- その他 Miyabi 固有の操作

---

## その他のMCPサーバー

### GitHub Enhanced

**用途**: GitHub Issue/PR の高度な操作

```json
{
  "github-enhanced": {
    "command": "node",
    "args": [".claude/mcp-servers/github-enhanced.cjs"],
    "env": {
      "GITHUB_TOKEN": "${GITHUB_TOKEN}",
      "REPOSITORY": "${REPOSITORY}"
    }
  }
}
```

**使用例**:
```
ユーザー: "open状態のIssueをすべてリストアップして"
Claude: [github-enhanced MCP を使用]
```

### Project Context

**用途**: プロジェクトのメタデータと依存関係

```json
{
  "project-context": {
    "command": "node",
    "args": [".claude/mcp-servers/project-context.cjs"]
  }
}
```

**使用例**:
```
ユーザー: "このプロジェクトの依存関係を教えて"
Claude: [project-context MCP を使用]
```

### IDE Integration

**用途**: VS Code 診断と Jupyter 実行

```json
{
  "ide-integration": {
    "command": "node",
    "args": [".claude/mcp-servers/ide-integration.cjs"]
  }
}
```

**使用例**:
```
ユーザー: "現在のファイルの型エラーを確認して"
Claude: [ide-integration MCP を使用]
```

### Lark Integration

**用途**: Lark メッセージング連携

```json
{
  "lark-integration": {
    "command": "node",
    "args": [".claude/mcp-servers/lark-integration.cjs"]
  }
}
```

**使用例**:
```
ユーザー: "Lark に進捗を報告して"
Claude: [lark-integration MCP を使用]
```

---

## 実践的な使用例

### シナリオ 1: 新機能の実装

```
ステップ 1: Issue を確認
ユーザー: "Issue #456 の内容を教えて"
Claude: [github-enhanced MCP で Issue を取得]

ステップ 2: 関連コードを検索
ユーザー: "この機能に関連するファイルを探して"
Claude: [filesystem MCP で search_files を使用]

ステップ 3: コードを読む
ユーザー: "見つかったファイルを読んで分析して"
Claude: [filesystem MCP で read_multiple_files を使用]

ステップ 4: Agent で実装
ユーザー: "この Issue を実装して"
Claude: [miyabi MCP で CodeGen Agent を実行]
```

### シナリオ 2: バグ修正

```
ステップ 1: エラーを調査
ユーザー: "エラーログを確認して"
Claude: [filesystem MCP で read_text_file を使用]

ステップ 2: 該当コードを探す
ユーザー: "このエラーが発生する箇所を探して"
Claude: [filesystem MCP で search_files を使用]

ステップ 3: デバッグ
ユーザー: "デバッグしてエラーを特定して"
Claude: [filesystem MCP と ide-integration MCP を併用]

ステップ 4: 修正
ユーザー: "バグを修正して"
Claude: [filesystem MCP で edit_file を使用]
```

### シナリオ 3: ドキュメント生成

```
ステップ 1: コードを分析
ユーザー: "crates/miyabi-cli のコードを分析して"
Claude: [filesystem MCP で directory_tree と read_multiple_files]

ステップ 2: ドキュメント作成
ユーザー: "API ドキュメントを生成して"
Claude: [filesystem MCP で write_file を使用]

ステップ 3: 確認
ユーザー: "生成されたドキュメントを確認して"
Claude: [filesystem MCP で read_text_file を使用]
```

---

## トラブルシューティング

### 問題 1: MCP サーバーが起動しない

**症状**:
```
Error: Failed to start MCP server: miyabi
```

**原因**:
- バイナリが存在しない
- 環境変数が設定されていない
- ポートが使用中

**解決方法**:

```bash
# 1. Miyabi MCP Server の存在確認
ls -l target/release/miyabi-mcp-server

# 2. なければビルド
cargo build --release --bin miyabi-mcp-server

# 3. 環境変数の確認
echo $GITHUB_TOKEN
echo $REPOSITORY

# 4. 設定を確認
cat .claude/mcp.json | jq '.mcpServers.miyabi'
```

### 問題 2: Filesystem MCP が遅い

**症状**:
- search_files が 30秒以上かかる
- タイムアウトエラー

**原因**:
- 検索範囲が広すぎる
- target/ や node_modules/ を含んでいる

**解決方法**:

```javascript
// ❌ 悪い例
search_files({ path: '.', pattern: '*.rs' })

// ✅ 良い例: スコープを限定
search_files({ path: 'crates/miyabi-cli', pattern: '*.rs' })

// ✅ 良い例: 除外パターンを使用
search_files({
  path: '.',
  pattern: '*.rs',
  excludePatterns: ['target', 'node_modules']
})
```

### 問題 3: JSON エラー

**症状**:
```
Error: Invalid JSON in .claude/mcp.json
```

**解決方法**:

```bash
# JSON の文法チェック
cat .claude/mcp.json | jq .

# エラーがあれば行番号が表示される
# 該当行を修正する

# バックアップから復元
cp .claude/mcp.json.backup .claude/mcp.json
```

### 問題 4: 権限エラー

**症状**:
```
Error: Permission denied: /some/path
```

**原因**:
- ファイルの権限が不足
- ディレクトリへのアクセスが制限されている

**解決方法**:

```bash
# ファイルの権限を確認
ls -l /some/path

# 必要に応じて権限を変更
chmod 644 /some/path/file
chmod 755 /some/path/directory

# または、allowed_directories を確認
# .claude/mcp.json の filesystem 設定を確認
```

---

## ベストプラクティス

### 1. MCP First Approach

**常に MCP の利用可能性をチェック**:

```bash
# Phase 0: MCP確認（必須）
claude mcp list
```

**理由**:
- MCP を使うと安全性が高い
- 操作が記録される
- エラーハンドリングが容易

### 2. スコープを限定する

**検索は必ず範囲を限定**:

```javascript
// ❌ 広すぎる
search_files({ path: '.', pattern: '*.md' })

// ✅ 適切なスコープ
search_files({ path: '.claude', pattern: '*.md' })
```

### 3. バッチ操作を活用

**複数ファイルは一括で読む**:

```javascript
// ❌ 個別に読む（遅い）
read_text_file({ path: 'file1.rs' })
read_text_file({ path: 'file2.rs' })
read_text_file({ path: 'file3.rs' })

// ✅ 一括で読む（速い）
read_multiple_files({
  paths: ['file1.rs', 'file2.rs', 'file3.rs']
})
```

### 4. メタデータを先に取得

**大きなファイルは情報を先に確認**:

```javascript
// ステップ 1: ファイル情報を取得
get_file_info({ path: 'large_file.log' })

// サイズを確認してから
// ステップ 2: 必要に応じて部分的に読む
read_text_file({
  path: 'large_file.log',
  head: 100  // 最初の100行のみ
})
```

### 5. エラーハンドリング

**常にエラーを想定**:

```javascript
try {
  const result = await sendRequest(server, request);
  if (result.error) {
    console.error('Error:', result.error);
    // エラー処理
  }
} catch (error) {
  console.error('Request failed:', error);
  // タイムアウトやネットワークエラーの処理
}
```

### 6. テストを活用

**定期的にテストを実行**:

```bash
# 週1回実行
node .claude/mcp-servers/test-filesystem.js

# 設定変更後は必ず実行
cat .claude/mcp.json | jq . && \
node .claude/mcp-servers/test-filesystem.js
```

---

## 高度な使い方

### カスタム MCP サーバーの作成

新しい MCP サーバーを作成する手順:

#### 1. サーバーファイルを作成

```javascript
// .claude/mcp-servers/my-custom-server.cjs
const { MCPServer } = require('@modelcontextprotocol/sdk');

const server = new MCPServer({
  name: 'my-custom-server',
  version: '1.0.0'
});

// ツールを定義
server.tool('my_tool', {
  description: 'My custom tool',
  parameters: {
    type: 'object',
    properties: {
      input: { type: 'string' }
    }
  },
  handler: async (params) => {
    // 処理を実装
    return {
      content: [
        { type: 'text', text: `Processed: ${params.input}` }
      ]
    };
  }
});

server.start();
```

#### 2. mcp.json に追加

```json
{
  "mcpServers": {
    "my-custom-server": {
      "command": "node",
      "args": [".claude/mcp-servers/my-custom-server.cjs"],
      "disabled": false,
      "description": "My custom MCP server"
    }
  }
}
```

#### 3. テストスクリプトを作成

```bash
# テストスクリプトを作成
cp .claude/mcp-servers/test-filesystem.js \
   .claude/mcp-servers/test-my-custom-server.js

# テストを実行
node .claude/mcp-servers/test-my-custom-server.js
```

---

## パフォーマンスチューニング

### タイムアウトの調整

```javascript
// test-filesystem.js 内
function sendRequest(server, request, timeoutMs = 5000) {
  // デフォルト5秒 → 必要に応じて変更
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, timeoutMs);
    // ...
  });
}

// 使用例: 長い処理には長めのタイムアウト
const result = await sendRequest(server, request, 30000); // 30秒
```

### キャッシュの活用

```javascript
// ファイル情報をキャッシュ
const fileCache = new Map();

async function getFileInfoCached(path) {
  if (fileCache.has(path)) {
    return fileCache.get(path);
  }

  const info = await getFileInfo(path);
  fileCache.set(path, info);
  return info;
}
```

---

## セキュリティ

### 重要な注意事項

1. **機密情報を含むファイルをコミットしない**
   ```bash
   # .env, credentials.json などはコミット禁止
   git status | grep -E '\.env|credentials'
   ```

2. **環境変数を使用**
   ```json
   {
     "env": {
       "API_KEY": "${API_KEY}",  // ✅ 環境変数
       "API_KEY": "hardcoded"     // ❌ ハードコード
     }
   }
   ```

3. **アクセス範囲を制限**
   ```json
   {
     "filesystem": {
       "command": "npx",
       "args": [
         "-y",
         "@modelcontextprotocol/server-filesystem",
         "."  // カレントディレクトリのみ
       ]
     }
   }
   ```

---

## まとめ

### チェックリスト

使い始める前に確認:
- [ ] Node.js と Cargo がインストールされている
- [ ] `.claude/mcp.json` が正しく設定されている
- [ ] 環境変数 (GITHUB_TOKEN など) が設定されている
- [ ] テストスクリプトが正常に動作する

### 次のステップ

1. **テストを実行**
   ```bash
   node .claude/mcp-servers/test-filesystem.js
   node .claude/mcp-servers/example-filesystem-usage.js
   ```

2. **Claude Code で試す**
   ```bash
   claude
   # MCP を使った操作を試す
   ```

3. **カスタムサーバーを作成**
   - プロジェクト固有の機能を追加
   - テストを書く
   - ドキュメントを作成

---

## 参考リンク

- **MCP 公式ドキュメント**: https://modelcontextprotocol.io/
- **Miyabi ドキュメント**: `docs/`
- **テストスクリプト**: `.claude/mcp-servers/test-*.js`
- **使用例**: `.claude/mcp-servers/example-*.js`

---

## サポート

質問や問題がある場合:
1. このガイドの「トラブルシューティング」を確認
2. テストスクリプトを実行して問題を特定
3. GitHub Issue を作成
4. Lark チャンネルで質問

---

**最終更新**: 2025-11-10
**バージョン**: 1.0.0
**メンテナー**: Miyabi Team
