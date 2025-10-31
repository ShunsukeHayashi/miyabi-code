# Context7 MCP Server Setup

## 概要

Context7 MCP serverは、最新のバージョン固有のドキュメントとコード例を直接ソースから取得し、プロンプトに配置するMCPサーバーです。LLMの古い学習データに依存せず、常に最新のライブラリドキュメントを参照できます。

---

## ✅ セットアップ完了

### インストール済み

```bash
claude mcp add --transport http context7 https://mcp.context7.com/mcp
```

**ステータス**: ✓ Connected

**設定ファイル**: `/Users/shunsuke/.claude.json`

### 接続確認

```bash
claude mcp list
```

**出力**:
```
context7: https://mcp.context7.com/mcp (HTTP) - ✓ Connected
```

---

## 使い方

### 基本的な使用方法

プロンプトに `use context7` を追加するだけで、自動的に最新のドキュメントとコード例を取得します。

### 例 1: Tauri 2.0のイベントシステム

```
How do I emit custom events in Tauri 2.0? use context7
```

**Context7が取得する情報**:
- Tauri 2.0の最新APIドキュメント
- イベント発行の実際のコード例
- TypeScript型定義
- Rustバックエンドの実装例

### 例 2: React Flowのカスタムノード

```
Create a custom node with drag handles in React Flow v11. use context7
```

**Context7が取得する情報**:
- React Flow v11の最新ドキュメント
- カスタムノードの実装例
- TypeScript型定義
- ベストプラクティス

### 例 3: Tokioの非同期ストリーム処理

```
How to read stdout line-by-line with tokio::process::Command? use context7
```

**Context7が取得する情報**:
- Tokio最新版のプロセス管理API
- AsyncBufReadExtの使用例
- エラーハンドリングのパターン

---

## Miyabi Desktopでの活用例

### 1. リアルタイムログストリーミングの改善

**現在の実装の問題を解決**:

```
I'm implementing real-time log streaming in Tauri 2.0. The backend emits events via
app_handle.emit(), but the frontend doesn't receive them in real-time. How should I
properly handle stdout streaming with tokio and emit events line-by-line? use context7
```

**Context7が提供**:
- Tokio最新版の非同期I/O例
- Tauri 2.0のイベントシステムベストプラクティス
- バックグラウンドタスクの正しいライフタイム管理

### 2. React Flowのエラー修正

**React Flow undefined handle エラー**:

```
I'm getting "Couldn't create edge for source handle id: undefined" error in React Flow.
How do I properly handle connections with undefined handles? use context7
```

**Context7が提供**:
- React Flow v11の接続ハンドリング
- onConnectコールバックの正しい実装
- エッジ作成のベストプラクティス

### 3. Puppeteerでの自動化テスト

```
How do I use Puppeteer to test a Tauri desktop application? Are there any special
considerations for native app testing? use context7
```

**Context7が提供**:
- Puppeteer最新版のAPI
- デスクトップアプリテストの制限事項
- 代替アプローチ（Playwright、Tauri WebDriver）

---

## API制限とレート制限

### 無料ティア
- **制限**: 基本的なレート制限あり
- **用途**: 個人開発、プロトタイピング

### 有料ティア（オプション）
- **制限**: 高レート制限
- **追加機能**: プライベートリポジトリアクセス

### API Key設定（オプション）

より高いレート制限が必要な場合:

```bash
claude mcp add --transport http context7 https://mcp.context7.com/mcp \
  --header "CONTEXT7_API_KEY: YOUR_API_KEY"
```

**API Key取得**: https://context7.com/dashboard

---

## 対応ライブラリ例

Context7は以下のような主要ライブラリの最新ドキュメントに対応:

### Frontend
- React, Vue, Angular
- Next.js, Nuxt, SvelteKit
- React Flow, D3.js, Three.js
- Tailwind CSS, Material-UI

### Backend
- Node.js, Express, Fastify
- Rust: Tokio, Actix, Axum
- Python: FastAPI, Django

### Desktop & Mobile
- Tauri 2.0
- Electron
- React Native

### AI & ML
- LangChain, LlamaIndex
- OpenAI SDK
- Anthropic SDK

---

## トラブルシューティング

### 問題 1: Context7が接続できない

**症状**:
```
context7: https://mcp.context7.com/mcp (HTTP) - ✗ Failed to connect
```

**解決方法**:
1. インターネット接続を確認
2. ファイアウォール設定を確認
3. Claude Codeを再起動

### 問題 2: ドキュメントが古い

**症状**: 取得したコード例が動作しない

**解決方法**:
1. ライブラリのバージョンを明示的に指定:
   ```
   How to use Tauri 2.0.0 events API? use context7
   ```
2. 最新バージョンを確認:
   ```
   What is the latest version of Tauri? use context7
   ```

### 問題 3: レート制限エラー

**症状**:
```
Rate limit exceeded
```

**解決方法**:
1. 少し待ってから再試行
2. API Keyを取得して設定
3. より具体的なクエリにして回数を減らす

---

## ベストプラクティス

### 1. 具体的なバージョンを指定

❌ 悪い例:
```
How to use Tauri events? use context7
```

✅ 良い例:
```
How to use Tauri 2.0 events API? use context7
```

### 2. 明確なユースケースを記述

❌ 悪い例:
```
Tell me about React Flow. use context7
```

✅ 良い例:
```
How to create a custom node with drag handles in React Flow v11? use context7
```

### 3. コードの文脈を提供

✅ 最良:
```
I'm implementing real-time log streaming in Tauri 2.0. My backend uses
tokio::process::Command to spawn a process and reads stdout with BufReader.
How do I emit each line as a Tauri event in real-time? use context7
```

---

## Context7 vs 通常のLLM検索

### 通常のLLM検索
- ❌ 学習データの日付に依存（古い可能性）
- ❌ バージョン固有の情報が不正確
- ❌ 非推奨APIを推奨する可能性

### Context7使用時
- ✅ 常に最新のドキュメントから取得
- ✅ 正確なバージョン固有の情報
- ✅ 公式の推奨パターンに基づく

---

## 統合ワークフロー例

### ワークフロー: 新機能実装

1. **Context7でベストプラクティスを確認**
   ```
   What is the recommended way to implement file upload in Tauri 2.0? use context7
   ```

2. **実装**
   - Context7が提供したコード例をベースに実装
   - 最新APIを使用することを保証

3. **エラーが発生した場合**
   ```
   I'm getting "X is not a function" error when using Tauri dialog API.
   What changed in Tauri 2.0? use context7
   ```

4. **テスト**
   ```
   How to write integration tests for Tauri commands? use context7
   ```

---

## 次のステップ

### 1. 実際に使ってみる

Miyabi Desktopの実装で質問:

```
How do I properly handle tokio task lifetimes when emitting Tauri events
from a background process? use context7
```

### 2. 複雑な実装を相談

```
I need to stream agent execution logs in real-time from a Rust backend
to a React frontend in Tauri 2.0. Show me the complete implementation
with proper error handling. use context7
```

### 3. パフォーマンス最適化

```
What are the best practices for optimizing event emission performance
in Tauri 2.0 when dealing with high-frequency updates? use context7
```

---

## 関連リンク

- **Context7 公式サイト**: https://context7.com
- **GitHub Repository**: https://github.com/upstash/context7-mcp
- **MCP Documentation**: https://modelcontextprotocol.io
- **Upstash (Provider)**: https://upstash.com

---

## まとめ

Context7 MCP serverを使用することで:

✅ **常に最新**: 古い学習データに依存しない
✅ **正確**: バージョン固有の正しい情報
✅ **効率的**: プロンプトに直接ドキュメントを配置
✅ **生産的**: 実装時間を大幅に短縮

**使用方法**: プロンプトに `use context7` を追加するだけ！

---

**Last Updated**: 2025-10-31
**Version**: 1.0.0
**Status**: ✓ Connected and Ready
