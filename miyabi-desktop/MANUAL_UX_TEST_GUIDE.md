# Miyabi Desktop Manual UX Test Guide
## リアルタイムログストリーミング動作確認

---

## テスト目的

リアルタイムログストリーミング機能が正しく動作しているかを手動で確認します。

## 前提条件

1. **Tauri Desktop Appが起動している**
   - ターミナルで `pnpm tauri dev` が実行中
   - アプリケーションウィンドウが表示されている

2. **miyabiバイナリがビルド済み**
   ```bash
   cd /Users/shunsuke/Dev/miyabi-private
   cargo build --release --bin miyabi
   ```

3. **GitHub tokenが設定済み**
   - Settings パネルでGitHub tokenを設定
   - または環境変数 `GITHUB_TOKEN` が設定済み

---

## テスト手順

### ステップ 1: Tauri Dev Serverを起動

```bash
cd /Users/shunsuke/Dev/miyabi-private/miyabi-desktop
pnpm tauri dev
```

**確認事項**:
- ✅ Vite dev server が `localhost:1420` で起動
- ✅ Tauri アプリケーションウィンドウが開く
- ✅ コンパイルエラーがない

---

### ステップ 2: Chrome DevToolsを開く (macOS)

Tauriアプリウィンドウ内で **右クリック** → **Inspect Element**

または、アプリケーションメニューから:
- **View** → **Toggle Developer Tools**

**確認事項**:
- ✅ Developer Tools パネルが開く
- ✅ **Console** タブが表示される

---

### ステップ 3: Agent Execution Panelを開く

1. サイドバーの **Bot icon** (1番目のアイコン) をクリック
2. エージェント一覧が表示される

**確認事項**:
- ✅ 「エージェント」ヘッダーが表示される
- ✅ 使い方ガイドが表示される
- ✅ エージェントカード (しきるん, つくるん, etc.) が表示される
- ✅ Issueドロップダウンが表示される

---

### ステップ 4: CoordinatorAgentを選択

1. **しきるん (CoordinatorAgent)** カードをクリック
2. カードが強調表示される

**確認事項**:
- ✅ カードの背景色が変わる (選択状態)
- ✅ 右側の詳細パネルに「しきるん」の情報が表示される

---

### ステップ 5: Issue選択 (オプション)

**オプション A: Issue指定なし**
- ドロップダウンで "No Issue (Auto-select)" のまま

**オプション B: Issue指定あり**
1. Issueドロップダウンをクリック
2. 任意のIssue (例: #270) を選択

**確認事項**:
- ✅ Issueが選択される (選択した場合)
- ✅ Issue番号とタイトルが表示される

---

### ステップ 6: Execute Agentボタンをクリック

1. 右側パネルの **Execute Agent** ボタンをクリック
2. **同時に3箇所を監視**:
   - **Tauri App UI** - 実行ステータスとログ表示
   - **Chrome DevTools Console** - フロントエンドデバッグログ
   - **ターミナル (pnpm tauri dev実行中)** - バックエンドデバッグログ

---

### ステップ 7: リアルタイムログを確認

#### 7-1. Chrome DevTools Console で確認

**期待されるログ (順番に表示)**:

```
[DEBUG] Setting up output listener for execution: <uuid>
[DEBUG] Output listener setup complete
[DEBUG] Received agent output: <log line 1>
[DEBUG] Received agent output: <log line 2>
[DEBUG] Received agent output: <log line 3>
...
```

**確認事項**:
- ✅ `[DEBUG] Setting up output listener` が表示される
- ✅ `[DEBUG] Received agent output` が **複数回** 表示される
- ✅ ログが **1行ずつ順次** 表示される (NOT まとめて)

#### 7-2. ターミナル (Backend) で確認

**期待されるログ**:

```
[DEBUG] Emitting stdout: <log line 1>
[DEBUG] Emitting stdout: <log line 2>
[DEBUG] Emitting stdout: <log line 3>
...
[DEBUG] stdout handler completed
[DEBUG] stderr handler completed
```

**確認事項**:
- ✅ `[DEBUG] Emitting stdout:` が表示される
- ✅ `[DEBUG] stdout handler completed` が最後に表示される
- ✅ エラーがない場合、`stderr` ログは少ない

#### 7-3. Tauri App UI で確認

**実行中**:
- ✅ ステータスが "Running" (ローディングアイコン)
- ✅ ログが **リアルタイムで** 1行ずつ追加される
- ✅ 自動スクロールで最新ログが見える

**実行完了後**:
- ✅ ステータスが "Success" (緑チェックマーク) or "Failed" (赤X)
- ✅ 実行時間が表示される (例: "59.60s")
- ✅ アクションボタンが表示される:
   - "GitHubを開く"
   - "詳細ログ"
   - "Pull Requests"
   - "Issue #XXX" (Issue選択時のみ)

---

### ステップ 8: ログ内容を検証

1. **UI表示ログ** をスクロールして確認
2. **Chrome Console** のログと比較
3. **ターミナル** のログと比較

**確認事項**:
- ✅ 3箇所のログ内容が一致している
- ✅ ログが時系列順に表示される
- ✅ ログの欠落がない

---

## 成功条件

### ✅ テスト合格

以下が **全て** 確認できた場合、テスト合格:

1. ✅ Chrome Console に `[DEBUG] Setting up output listener` が表示
2. ✅ Chrome Console に `[DEBUG] Received agent output` が **複数回** 表示
3. ✅ ターミナルに `[DEBUG] Emitting stdout:` が表示
4. ✅ ターミナルに `[DEBUG] stdout handler completed` が表示
5. ✅ UI で **実行中に** ログが順次追加される (NOT 完了後に一括表示)
6. ✅ UI で自動スクロールが動作する
7. ✅ 実行完了後、ステータスとアクションボタンが表示される

### ❌ テスト失敗

以下のいずれかに該当する場合、テスト失敗:

1. ❌ Chrome Console に `[DEBUG]` ログが一切表示されない
2. ❌ `[DEBUG] Received agent output` が表示されない
3. ❌ ターミナルに `[DEBUG] Emitting stdout:` が表示されない
4. ❌ UI でログが **実行完了後に一括で** 表示される
5. ❌ UI でログが一切表示されない
6. ❌ エージェント実行が失敗する (Exit code: 101 など)

---

## トラブルシューティング

### 問題 1: Execute Agentボタンがクリックできない

**原因**:
- エージェントが選択されていない
- 別のエージェントが実行中

**解決方法**:
1. エージェントカードを再度クリック
2. 既存の実行が完了するまで待つ

---

### 問題 2: [DEBUG] ログが表示されない

**原因**:
- コードの修正が反映されていない
- Tauri dev server が古いバージョンを実行している

**解決方法**:
1. Tauri dev server を再起動:
   ```bash
   # Ctrl+C で停止
   pnpm tauri dev
   ```
2. ブラウザキャッシュをクリア (Cmd+Shift+R)

---

### 問題 3: Agent execution failed (Exit code: 101)

**原因**:
- `miyabi` バイナリが存在しない
- `target/release/miyabi` が古いバージョン

**解決方法**:
1. バイナリを再ビルド:
   ```bash
   cd /Users/shunsuke/Dev/miyabi-private
   cargo build --release --bin miyabi
   ```
2. 再度Execute

---

### 問題 4: ログが実行完了後に一括表示される

**原因**:
- Backend task handles が await されていない
- Event emission のタイミング問題

**確認方法**:
1. ターミナルで `[DEBUG] Emitting stdout:` が **実行中に** 表示されるか確認
2. 表示されている → Backend OK, Frontend問題
3. 表示されていない → Backend問題

**解決方法 (Backend問題の場合)**:
- `agent.rs:255-262` でtask handlesのawaitを確認
- `eprintln!` の出力がリダイレクトされていないか確認

**解決方法 (Frontend問題の場合)**:
- `AgentExecutionPanel.tsx:109-125` でlistenerセットアップを確認
- Tauri event名が正しいか確認: `agent-output-{executionId}`

---

## 追加テストシナリオ

### テスト A: 複数回実行

1. 同じエージェントを3回連続で実行
2. 毎回ログが正しく表示されるか確認

**確認事項**:
- ✅ 前回の実行ログがクリアされる
- ✅ 新しい execution ID が生成される
- ✅ ログが正しく表示される

---

### テスト B: 異なるエージェント

1. CoordinatorAgent を実行
2. 完了後、CodeGenAgent を実行
3. 両方のログが正しく表示されるか確認

**確認事項**:
- ✅ 各エージェントで異なるログが表示される
- ✅ ログが混在しない

---

### テスト C: Issue指定あり vs なし

1. Issue指定なしでCoordinatorAgentを実行
2. Issue #270を指定してCoordinatorAgentを実行
3. 両方のログを比較

**確認事項**:
- ✅ Issue指定時はログに `--issue 270` が含まれる
- ✅ 完了後、"Issue #270" ボタンが表示される (Issue指定時のみ)

---

### テスト D: 失敗ケース

1. 存在しないIssue番号を指定 (例: #99999)
2. エージェントを実行
3. エラーログが正しく表示されるか確認

**確認事項**:
- ✅ ステータスが "Failed" になる
- ✅ エラーログが表示される
- ✅ Exit codeが表示される

---

## テスト結果記録テンプレート

```
## リアルタイムログストリーミング - 手動テスト結果

**テスト日時**: 2025-10-31 XX:XX
**テスター**: [Your Name]
**環境**:
- OS: macOS
- Node.js: vX.X.X
- Rust: 1.XX.X
- Tauri: 2.X.X

---

### ステップ 7-1: Chrome Console

- [ ] `[DEBUG] Setting up output listener` 表示
- [ ] `[DEBUG] Received agent output` 複数回表示
- [ ] ログが順次表示 (NOT まとめて)

**スクリーンショット**:
[Console screenshot]

---

### ステップ 7-2: ターミナル Backend

- [ ] `[DEBUG] Emitting stdout:` 表示
- [ ] `[DEBUG] stdout handler completed` 表示
- [ ] エラーなし

**ログ抜粋**:
```
[出力内容をペースト]
```

---

### ステップ 7-3: Tauri App UI

- [ ] 実行中にログが順次追加
- [ ] 自動スクロール動作
- [ ] 完了後、ステータス表示
- [ ] アクションボタン表示

**スクリーンショット**:
[UI screenshot]

---

### 総合評価

- [ ] ✅ **合格** - 全ての確認事項をクリア
- [ ] ❌ **不合格** - 問題あり

**問題点**:
[問題があれば記述]

**備考**:
[その他の気づき]
```

---

## 参考資料

- **Implementation Files**:
  - Backend: `miyabi-desktop/src-tauri/src/agent.rs` (L212-285)
  - Frontend: `miyabi-desktop/src/components/AgentExecutionPanel.tsx` (L109-125)

- **Debug Log Locations**:
  - Backend: `agent.rs:222` - `eprintln!("[DEBUG] Emitting stdout: {}", line)`
  - Frontend: `AgentExecutionPanel.tsx:114` - `console.log('[DEBUG] Received agent output:', line)`

- **Tauri Event Name**: `agent-output-{executionId}`

---

**Last Updated**: 2025-10-31
**Version**: 1.0.0
