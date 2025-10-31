# Chrome DevTools MCP Server Setup

## 概要

Chrome DevTools MCPは、AIコーディングエージェントが実行中のChromeブラウザを制御・検査するためのModel Context Protocol (MCP) サーバーです。E2Eテスト、デバッグ、パフォーマンス分析に最適です。

---

## ✅ セットアップ完了

### インストール済み

**設定ファイル**: `/Users/shunsuke/.claude.json`

```json
{
  "chrome-devtools": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "chrome-devtools-mcp@latest"],
    "env": {}
  }
}
```

**ステータス**: ✓ Connected

---

## 📋 利用可能な機能 (26+ ツール)

### 1. Input Automation (8ツール)

- **click**: 要素をクリック
- **drag**: 要素をドラッグ
- **fill**: フォームフィールドに入力
- **submit**: フォーム送信
- **keyboard**: キーボード入力
- **hover**: 要素にホバー
- **handle_dialog**: ダイアログ処理
- **upload_file**: ファイルアップロード

### 2. Navigation (6ツール)

- **navigate**: ページ遷移
- **wait_for**: 条件待機
- **go_back**: 戻る
- **go_forward**: 進む
- **reload**: リロード
- **close_tab**: タブを閉じる

### 3. Debugging (5ツール)

- **screenshot**: スクリーンショット撮影
- **capture_snapshot**: DOM スナップショット
- **get_console_logs**: コンソールログ取得
- **evaluate**: JavaScript実行
- **get_element_info**: 要素情報取得

### 4. Network & Performance (5ツール)

- **get_network_logs**: ネットワークリクエスト分析
- **block_url**: URL ブロック
- **set_throttling**: ネットワーク速度制限
- **start_tracing**: パフォーマンストレース開始
- **stop_tracing**: パフォーマンストレース終了

### 5. Emulation (2ツール)

- **emulate_device**: デバイスエミュレーション
- **resize_viewport**: ビューポートリサイズ

---

## 🚀 Miyabi Desktop E2E テストの使い方

### 基本的なテストシナリオ

#### シナリオ 1: エージェント実行のE2Eテスト

```
Test the Miyabi Desktop agent execution flow end-to-end:

1. Navigate to http://localhost:1420
2. Wait for the page to load completely
3. Click on the CoordinatorAgent card
4. Select Issue #270 from the dropdown
5. Click the "Execute Agent" button
6. Wait for the execution to complete
7. Take a screenshot of the result
8. Verify that the status shows "Success"
9. Capture console logs to check for errors
```

**Claude Codeが自動実行**:
- Chrome起動
- ページ遷移
- 要素クリック
- 実行待機
- スクリーンショット
- ログ確認

#### シナリオ 2: リアルタイムログストリーミングの検証

```
Verify that real-time log streaming works correctly:

1. Open http://localhost:1420 in Chrome
2. Open DevTools console
3. Click on CoordinatorAgent
4. Click Execute Agent
5. Monitor console logs for "[DEBUG] Received agent output" messages
6. Take screenshots during execution showing logs appearing in real-time
7. Capture network requests to verify event emission
8. Verify UI updates as logs appear
```

#### シナリオ 3: パフォーマンス分析

```
Analyze the performance of Miyabi Desktop:

1. Navigate to http://localhost:1420
2. Start performance tracing
3. Execute an agent (CoordinatorAgent with Issue #270)
4. Stop tracing when execution completes
5. Analyze the trace for:
   - Initial page load time
   - Agent execution response time
   - Event emission latency
   - UI rendering performance
6. Take screenshots of Performance tab results
```

---

## 設定オプション

### Headless モード

UIなしでテスト実行:

```json
{
  "chrome-devtools": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "chrome-devtools-mcp@latest", "--headless"],
    "env": {}
  }
}
```

### Isolated プロファイル

テスト用の一時プロファイル使用:

```json
{
  "chrome-devtools": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "chrome-devtools-mcp@latest", "--isolated"],
    "env": {}
  }
}
```

### カスタムビューポート

初期ウィンドウサイズ設定:

```json
{
  "chrome-devtools": {
    "type": "stdio",
    "command": "npx",
    "args": [
      "-y",
      "chrome-devtools-mcp@latest",
      "--viewport",
      "1920x1080"
    ],
    "env": {}
  }
}
```

---

## 実際のテストコマンド例

### テスト 1: ページ読み込みチェック

```
Open http://localhost:1420 in Chrome and verify that all UI elements load correctly:
- Agent cards are visible
- Issue dropdown is populated
- Execute button is enabled
- Settings panel is accessible
Take a screenshot showing the complete UI.
```

### テスト 2: エージェント実行フロー

```
Execute the full agent execution flow:
1. Navigate to localhost:1420
2. Click on しきるん (CoordinatorAgent) card
3. Wait for card to be selected (background color changes)
4. Select Issue #270 from dropdown
5. Click "Execute Agent" button
6. Wait for status to change from "Running" to "Success" or "Failed"
7. Take screenshots at each step
8. Capture console logs and network activity
9. Verify no JavaScript errors occurred
```

### テスト 3: エラーハンドリング検証

```
Test error handling:
1. Open localhost:1420
2. Select an agent
3. Manually trigger a network error (block API requests)
4. Click Execute Agent
5. Verify that:
   - Error message is displayed to user
   - Status changes to "Failed"
   - Console logs show detailed error
   - UI remains responsive
6. Capture screenshots of error states
```

### テスト 4: パフォーマンス測定

```
Measure performance metrics:
1. Navigate to localhost:1420
2. Start performance tracing
3. Interact with UI (click agent, select issue, execute)
4. Stop tracing after 30 seconds
5. Analyze:
   - Largest Contentful Paint (LCP)
   - First Input Delay (FID)
   - Cumulative Layout Shift (CLS)
   - Event emission latency
6. Report performance insights
```

---

## トラブルシューティング

### 問題 1: Chrome DevTools MCPが接続できない

**症状**:
```
chrome-devtools: npx -y chrome-devtools-mcp@latest - ✗ Failed to connect
```

**解決方法**:
1. Node.js バージョン確認: `node --version` (v20.19以上必要)
2. Chrome安定版がインストールされているか確認
3. npxキャッシュをクリア: `npx clear-cache`
4. 再度接続: `claude mcp list`

### 問題 2: ブラウザが起動しない

**症状**: テストコマンドを実行してもChromeが起動しない

**解決方法**:
- MCP toolを明示的に使用するコマンドを実行
- 例: "Open http://localhost:1420 in Chrome"
- ブラウザは接続だけでは起動しない（tool実行時に起動）

### 問題 3: 要素が見つからない

**症状**: "Element not found" エラー

**解決方法**:
1. ページの読み込みを待機: "Wait for page to load completely"
2. セレクターを明確に: "Click on the button with text 'Execute Agent'"
3. スクリーンショットで確認: "Take a screenshot and show me"

---

## セキュリティ注意事項

⚠️ **重要**: Chrome DevTools MCPはブラウザのコンテンツを完全に公開します。

### ベストプラクティス

1. **機密データを使用しない**
   - テスト環境でのみ使用
   - 本番環境の認証情報を入力しない

2. **Isolated モード推奨**
   ```json
   {
     "args": ["-y", "chrome-devtools-mcp@latest", "--isolated"]
   }
   ```
   - 一時プロファイル使用
   - 自動クリーンアップ

3. **ヘッドレスモードの制限**
   - デバッグ時は通常モードを使用
   - CI/CDではヘッドレス推奨

---

## E2Eテスト vs 手動テスト

### E2Eテスト (Chrome DevTools MCP)

**利点**:
- ✅ 完全自動化
- ✅ 再現性が高い
- ✅ CI/CD統合可能
- ✅ パフォーマンス測定

**制限**:
- ❌ Tauri ネイティブアプリは部分的サポート
- ❌ IPC イベントの完全な検証は困難

### 手動テスト (MANUAL_UX_TEST_GUIDE.md)

**利点**:
- ✅ Tauri ネイティブアプリ完全サポート
- ✅ DevTools直接アクセス
- ✅ リアルタイムデバッグ

**制限**:
- ❌ 手動実行が必要
- ❌ 時間がかかる

### 推奨アプローチ

1. **開発中**: 手動テスト
2. **CI/CD**: E2Eテスト (Chrome DevTools MCP)
3. **リグレッション**: E2Eテスト自動化

---

## 統合ワークフロー例

### ワークフロー: コミット前の自動チェック

```bash
# 1. コード変更
git add .

# 2. E2Eテストを自動実行 (Claude Code経由)
claude
> Run E2E tests for Miyabi Desktop:
> 1. Navigate to localhost:1420
> 2. Test all agent executions
> 3. Verify UI updates
> 4. Check console for errors
> 5. Take screenshots of success/failure
> 6. Report results

# 3. テスト通過後にコミット
git commit -m "feat: improve real-time log streaming"
```

---

## 次のステップ

### 1. 基本的なE2Eテストを実行

```
Open http://localhost:1420 in Chrome and take a screenshot showing the main UI
```

### 2. エージェント実行テスト

```
Test the CoordinatorAgent execution with Issue #270 end-to-end and report any issues found
```

### 3. パフォーマンス測定

```
Measure the performance of Miyabi Desktop agent execution and provide optimization suggestions
```

---

## 関連リンク

- **GitHub Repository**: https://github.com/ChromeDevTools/chrome-devtools-mcp
- **Chrome DevTools Protocol**: https://chromedevtools.github.io/devtools-protocol/
- **MCP Documentation**: https://modelcontextprotocol.io

---

## まとめ

Chrome DevTools MCP serverを使用することで:

✅ **完全自動化**: 手動テスト不要
✅ **包括的**: 26+ ツールで全機能をカバー
✅ **信頼性**: 再現可能なテスト実行
✅ **洞察**: パフォーマンス分析・デバッグ

**使用方法**: 自然言語でテストシナリオを記述するだけ！

```
Test the entire agent execution flow and verify that real-time logs appear correctly
```

---

**Last Updated**: 2025-10-31
**Version**: 1.0.0
**Status**: ✓ Connected and Ready
