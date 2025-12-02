# Miyabi ChatGPT Connector - 標準テストプロンプト集

**Version**: 2025.12.02
**Purpose**: 各ツールの期待動作を定義し、UIからのテストを容易にする

---

## 🎯 使い方

1. ChatGPT UIから下記のプロンプトをそのまま入力
2. 期待される結果と実際の結果を比較
3. 差異があれば問題箇所を特定

---

## 🔧 診断ツール（最優先でテスト）

### 1. miyabi_connector_ping
```
Miyabiの接続状態を確認して
```
**期待される結果**:
- ✅ connector: ok
- ✅ mcp_server: ok
- ✅ tools_count: 67+
- ✅ version: 2025.12.02-rc2

**失敗時の原因**:
- 認証エラー → APIキー/Token確認
- タイムアウト → ネットワーク/CORS確認
- 500エラー → サーバーログ確認

---

### 2. miyabi_tools_self_check
```
Miyabiの全ツールの状態を診断して
```
**期待される結果**:
```json
{
  "summary": {
    "total_tools": 67,
    "functional": 45,
    "blocked": 22,
    "health_percent": 67.2
  }
}
```

---

### 3. miyabi_layer_diagnostics
```
Miyabiの4レイヤー診断を実行して
```
**期待される結果**:
- Layer 1 (MCP Server): ok
- Layer 2 (Connector): ok
- Layer 3 (UI Definition): ok
- Layer 4 (UX Flow): check_manually
- Issues: [具体的な問題リスト]

---

### 4. miyabi_suggest_fixes
```
Miyabiの設定問題と修正方法を教えて
```
**期待される結果**:
- GITHUB_TOKEN未設定の場合 → 修正コマンド提案
- 全て正常の場合 → "All systems configured!"

---

## 📊 ステータス系ツール

### get_project_status
```
Miyabiプロジェクトの現在の状態を教えて
```
**期待される結果**:
- Branch: main
- Crates: 58
- MCP Servers: 33

---

### system_resources
```
システムリソースの使用状況を確認して
```
**期待される結果**:
- CPU使用率
- メモリ使用率
- ディスク使用率

---

### git_status
```
gitの変更状態を確認して
```
**期待される結果**:
- 現在のブランチ
- Modified files
- Untracked files

---

### git_log
```
最近のコミット履歴を5件表示して
```
**期待される結果**:
- コミットハッシュ
- コミットメッセージ
- 5件のリスト

---

## 👥 エージェント系ツール

### list_agents
```
利用可能なMiyabiエージェントを一覧表示して
```
**期待される結果**:
- 21エージェントのリスト
- カテゴリ別表示（coding, business）

---

### show_agent_cards
```
エージェントのTCGカードを表示して
```
**期待される結果**:
- 7種類のTCGカード表示
- 各カードにステータス、スキル情報

---

### get_agent_status
```
現在実行中のエージェントを確認して
```
**期待される結果**:
- 実行中エージェントリスト
- または "No agents running"

---

## 📁 ファイル操作ツール

### list_files
```
プロジェクトルートのファイル一覧を表示して
```
**期待される結果**:
- ディレクトリ一覧
- ファイル一覧

---

### read_file
```
README.mdの内容を読んで
```
**期待される結果**:
- ファイル内容（最初の100行）

---

### search_code
```
"fn main"というパターンでコードを検索して
```
**期待される結果**:
- マッチしたファイル一覧
- 行番号とコンテキスト

---

## 🐙 GitHub連携ツール（要GITHUB_TOKEN）

### list_issues
```
オープン中のGitHub Issueを3件表示して
```
**期待される結果（正常時）**:
- Issue番号、タイトル、ラベル

**期待される結果（Token未設定時）**:
- エラー: "GITHUB_TOKEN not set"

---

### list_prs
```
オープン中のPull Requestを表示して
```
**期待される結果（正常時）**:
- PR番号、タイトル、ブランチ情報

---

## 🖥️ Tmux/セッション管理

### tmux_list_sessions
```
実行中のtmuxセッションを表示して
```
**期待される結果**:
- セッションリスト
- または "No tmux server running"

---

## 📝 Obsidian連携（要OBSIDIAN_VAULT設定）

### obsidian_search
```
"miyabi"に関するノートを検索して
```
**期待される結果（正常時）**:
- マッチしたノート一覧

**期待される結果（未設定時）**:
- エラーメッセージ

---

## 🚨 トラブルシューティングフロー

### Step 1: 基本接続確認
```
Miyabiの接続状態を確認して
```
→ NGなら認証/ネットワーク問題

### Step 2: 4レイヤー診断
```
Miyabiの4レイヤー診断を実行して
```
→ どのレイヤーで問題かを特定

### Step 3: 修正提案取得
```
Miyabiの設定問題と修正方法を教えて
```
→ 具体的な修正手順を取得

### Step 4: 修正適用後の再テスト
```
Miyabiの全ツールの状態を診断して
```
→ health_percentが改善したか確認

---

## 📋 カテゴリ別テスト結果テンプレート

```
| カテゴリ | テスト数 | Pass | Fail | Skip | 成功率 |
|---------|---------|------|------|------|--------|
| diagnostic | 4 | | | | |
| data | 18 | | | | |
| ui | 6 | | | | |
| action | 14 | | | | |
| agent | 5 | | | | |
| **合計** | **47** | | | | |
```

---

## 🔄 定期チェック推奨スケジュール

| 頻度 | テスト内容 |
|------|-----------|
| 毎回起動時 | miyabi_connector_ping |
| 日次 | miyabi_tools_self_check |
| 週次 | miyabi_layer_diagnostics + 全ツールテスト |
| 設定変更後 | miyabi_suggest_fixes |

---

*Last Updated: 2025-12-02*
