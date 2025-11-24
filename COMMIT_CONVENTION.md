# Miyabi コミット規約ガイド

誰でも分かる、日本語コミットメッセージの書き方ガイドです。

---

## 目次

1. [基本ルール](#基本ルール)
2. [コミットの種類](#コミットの種類)
3. [スコープ（対象）の指定](#スコープ対象の指定)
4. [良い例・悪い例](#良い例悪い例)
5. [よく使うパターン集](#よく使うパターン集)
6. [コピペで使えるテンプレート](#コピペで使えるテンプレート)

---

## 基本ルール

### コミットメッセージの形式

```
種類(対象): やったこと
```

### 3つの要素

| 要素 | 必須？ | 説明 | 例 |
|------|--------|------|-----|
| 種類 | ✅ 必須 | 何をしたか | `feat`, `fix`, `docs` |
| 対象 | 任意 | どこを変えたか | `console`, `api`, `cli` |
| やったこと | ✅ 必須 | 具体的な内容 | `ログイン機能を追加` |

### 最もシンプルな例

```bash
git commit -m "fix: ログインできないバグを修正"
```

### 対象を含む例

```bash
git commit -m "feat(console): ダッシュボード画面を追加"
```

---

## コミットの種類

### 主要な種類（これだけ覚えればOK）

| 種類 | 意味 | いつ使う？ | 例 |
|------|------|-----------|-----|
| `feat` | **新機能** | 新しい機能を追加したとき | `feat: ユーザー登録機能を追加` |
| `fix` | **バグ修正** | 問題を直したとき | `fix: 画面が真っ白になるバグを修正` |
| `docs` | **ドキュメント** | 説明文だけ変えたとき | `docs: 使い方を追加` |

### その他の種類（必要に応じて）

| 種類 | 意味 | いつ使う？ | 例 |
|------|------|-----------|-----|
| `style` | **見た目の調整** | インデントや空白だけ直したとき | `style: コードの整形` |
| `refactor` | **整理整頓** | 動作を変えずにコードを整理 | `refactor: 重複コードを統合` |
| `perf` | **高速化** | 処理を速くしたとき | `perf: 検索を2倍高速化` |
| `test` | **テスト** | テストを追加・修正 | `test: ログイン機能のテスト追加` |
| `build` | **ビルド設定** | ビルド関連の変更 | `build: 依存ライブラリを更新` |
| `ci` | **CI/CD** | 自動化の設定変更 | `ci: デプロイ設定を追加` |
| `chore` | **雑務** | その他の細かい作業 | `chore: 不要ファイルを削除` |

---

## スコープ（対象）の指定

### どこを変えたか明示する

```bash
# フロントエンドを変えた
git commit -m "feat(console): 画面を追加"

# バックエンドAPIを変えた
git commit -m "fix(api): エラー処理を修正"

# コマンドラインツールを変えた
git commit -m "feat(cli): 新しいコマンドを追加"
```

### Miyabi プロジェクト スコープ完全一覧

#### フロントエンド / UI

| スコープ | 対象 | 説明 |
|---------|------|------|
| `console` | miyabi-console | WebダッシュボードUI |
| `web-ui` | miyabi-web-ui | Web UIコンポーネント |
| `tui` | miyabi-tui | ターミナルUI (Ratatui) |
| `desktop` | miyabi-desktop | デスクトップアプリ (Tauri) |

#### バックエンド / API

| スコープ | 対象 | 説明 |
|---------|------|------|
| `web-api` | miyabi-web-api | メインWebサーバーAPI |
| `business-api` | miyabi-business-api | ビジネスロジックAPI |
| `mcp-server` | miyabi-mcp-server | MCPサーバー |
| `webhook` | miyabi-webhook | Webhook処理 |

#### コアライブラリ

| スコープ | 対象 | 説明 |
|---------|------|------|
| `core` | miyabi-core | 共通コアライブラリ |
| `types` | miyabi-types | 型定義 |
| `workflow` | miyabi-workflow | ワークフロー基盤 |
| `dag` | miyabi-dag | DAG実行エンジン |
| `modes` | miyabi-modes | 実行モード管理 |
| `persistence` | miyabi-persistence | データ永続化 |

#### エージェント (Coding)

| スコープ | 対象 | 説明 |
|---------|------|------|
| `agent-core` | miyabi-agent-core | エージェント共通基盤 |
| `agent-codegen` | miyabi-agent-codegen | コード生成Agent |
| `agent-review` | miyabi-agent-review | コードレビューAgent |
| `agent-issue` | miyabi-agent-issue | Issue管理Agent |
| `agent-coordinator` | miyabi-agent-coordinator | タスク統括Agent |
| `agent-workflow` | miyabi-agent-workflow | PR/DeploymentAgent |
| `agent-integrations` | miyabi-agent-integrations | RefresherAgent等 |

#### エージェント (Business)

| スコープ | 対象 | 説明 |
|---------|------|------|
| `agent-business` | miyabi-agent-business | 14個のビジネスAgent |
| `agents` | miyabi-agents | エージェント統合 |

#### LLM統合

| スコープ | 対象 | 説明 |
|---------|------|------|
| `llm` | miyabi-llm | LLM統合基盤 |
| `llm-anthropic` | miyabi-llm-anthropic | Claude連携 |
| `llm-openai` | miyabi-llm-openai | OpenAI連携 |
| `llm-google` | miyabi-llm-google | Gemini連携 |
| `prompt-engine` | miyabi-prompt-engine | プロンプト管理 |

#### 外部連携

| スコープ | 対象 | 説明 |
|---------|------|------|
| `github` | miyabi-github | GitHub連携 |
| `telegram` | miyabi-telegram | Telegram Bot |
| `discord` | miyabi-discord-mcp-server | Discord連携 |
| `line-bot` | miyabi-line-bot | LINE Bot |
| `a2a` | miyabi-a2a | Agent間通信 |
| `approval` | miyabi-approval | 承認システム |

#### インフラ / ツール

| スコープ | 対象 | 説明 |
|---------|------|------|
| `cli` | miyabi-cli | コマンドラインツール |
| `aws-agent` | miyabi-aws-agent | AWSリソース管理 |
| `worktree` | miyabi-worktree | Git Worktree管理 |
| `tmux` | miyabi-tmux-orchestrator | tmuxセッション管理 |
| `orchestrator` | miyabi-orchestrator | オーケストレーション |
| `session-manager` | miyabi-session-manager | セッション管理 |
| `knowledge` | miyabi-knowledge | ナレッジベース |
| `voice-guide` | miyabi-voice-guide | VOICEVOX音声ガイド |

#### テスト / ベンチマーク

| スコープ | 対象 | 説明 |
|---------|------|------|
| `e2e-tests` | miyabi-e2e-tests | E2Eテスト |
| `benchmark` | miyabi-benchmark | パフォーマンス計測 |
| `tests` | - | テスト全般 |

#### その他

| スコープ | 対象 | 説明 |
|---------|------|------|
| `docs` | docs/ | ドキュメント |
| `deps` | Cargo.toml | 依存関係 |
| `ci` | .github/ | CI/CD設定 |
| `config` | - | 設定ファイル |

---

## 良い例・悪い例

### ✅ 良い例

```bash
# 具体的で分かりやすい
feat(console): ユーザープロフィール画面を追加
fix(api): ログイン時のパスワード検証エラーを修正
docs: インストール手順を日本語で追加
test(agents): CodeGenAgentの正常系テストを追加
chore(deps): tokioを1.40.0に更新
```

### ❌ 悪い例

```bash
# 曖昧すぎる
fix: バグ修正
feat: 新機能
update: 更新

# 内容が分からない
fix: 修正しました
chore: いろいろ変更

# 英語と日本語が混在
feat: add new feature を追加
```

---

## よく使うパターン集

### 新機能を追加したとき

```bash
feat(console): ダッシュボードにリアルタイムグラフを追加
feat(web-api): エージェント一覧APIを実装
feat(cli): miyabi runコマンドを追加
feat(agent-codegen): Issue自動実装機能を追加
feat(tui): ワークフロー可視化画面を追加
feat(telegram): コマンド通知機能を追加
feat(a2a): Agent間メッセージングを実装
```

### バグを修正したとき

```bash
fix(console): WebSocket接続が切れる問題を修正
fix(web-api): JWTトークン検証エラーを修正
fix(agent-review): コードレビュー結果が保存されない問題を解決
fix(github): PR作成時のラベル付与エラーを修正
fix(approval): Discord通知が送信されない問題を修正
```

### エージェント関連

```bash
feat(agent-coordinator): 並列タスク実行機能を追加
fix(agent-issue): ラベル推論の精度を改善
refactor(agent-business): 共通処理をagent-coreに移動
test(agent-codegen): コード生成の品質テストを追加
perf(agent-review): レビュー処理を30%高速化
```

### LLM統合

```bash
feat(llm-anthropic): Claude Sonnet 4対応を追加
fix(llm-google): Gemini APIレート制限処理を修正
feat(prompt-engine): テンポラルプロンプト機能を追加
refactor(llm): プロバイダー共通インターフェースを整理
```

### ドキュメントを更新したとき

```bash
docs: COMMIT_CONVENTIONを日本語化
docs: エージェント仕様書を更新
docs(console): ダッシュボードの使い方を追加
docs: Entity-Relationモデル図を更新
```

### 依存関係を更新したとき

```bash
chore(deps): tokioを1.40.0に更新
chore(deps): octocrabを0.48.0に更新
chore(deps): 全Cargo依存関係を最新化
chore(deps): セキュリティ脆弱性のあるパッケージを更新
```

### インフラ / CI

```bash
ci: GitHub Actionsでテスト自動化を追加
feat(worktree): 並列Worktree管理機能を追加
feat(tmux): エージェント別カラーテーマを設定
feat(voice-guide): 進捗ナレーション機能を追加
```

### リファクタリングしたとき

```bash
refactor(core): エラー型を統一
refactor(web-api): ルート構成を整理
refactor(workflow): DAG実行ロジックを最適化
refactor(agents): 共通トレイトをagent-coreに集約
```

### テストを追加したとき

```bash
test(e2e-tests): フルワークフローE2Eテストを追加
test(web-api): 認証APIのユニットテスト追加
test(agent-codegen): コード品質検証テストを追加
test(benchmark): LLM応答時間の計測を追加
```

### パフォーマンス改善したとき

```bash
perf(web-api): データベースクエリを最適化
perf(console): バンドルサイズを40%削減
perf(dag): 並列実行効率を改善
perf(llm): キャッシュ機構を導入
```

---

## コピペで使えるテンプレート

### 新機能

```bash
git commit -m "feat(対象): 〇〇機能を追加"
```

### バグ修正

```bash
git commit -m "fix(対象): 〇〇の問題を修正"
```

### ドキュメント

```bash
git commit -m "docs: 〇〇を追加"
```

### 依存関係更新

```bash
git commit -m "chore(deps): 〇〇を更新"
```

### Issue番号付き

```bash
git commit -m "fix(対象): 〇〇を修正

Closes #123"
```

---

## 詳細な説明を書きたいとき

### 複数行のコミットメッセージ

```bash
git commit -m "fix(api): セッションタイムアウトを修正

問題:
- 30分経過後にログアウトされる
- エラーメッセージが表示されない

対応:
- タイムアウト時間を2時間に延長
- 分かりやすいエラーメッセージを追加

Closes #456"
```

### Issue/PRを参照する

```bash
# Issueを閉じる
Closes #123

# 参照のみ
Refs #456

# 関連Issue
Related to #789
```

---

## 実際のコミット手順

### 1. 変更をステージング

```bash
git add .
```

### 2. コミット

```bash
# シンプルなコミット
git commit -m "feat(console): ダッシュボードを追加"

# テンプレートを使う（エディタが開く）
git commit
```

### 3. プッシュ

```bash
git push
```

---

## よくある質問

### Q: 英語と日本語どちらを使うべき？

**A: このプロジェクトでは日本語を推奨します。**

チームメンバー全員が理解できることが最優先です。

### Q: タイトルは何文字まで？

**A: 50文字以内を推奨。** 長くなる場合は本文に詳細を書きましょう。

### Q: スコープは必須？

**A: 任意です。** 変更対象が明確な場合は付けると分かりやすくなります。

### Q: 迷ったらどの種類を使う？

**A: 以下の順で判断:**
1. 新機能 → `feat`
2. バグ修正 → `fix`
3. ドキュメント → `docs`
4. それ以外 → `chore`

---

## まとめ

```
種類(対象): やったこと
```

1. **種類**を選ぶ（feat, fix, docs など）
2. **対象**を指定（任意: console, api など）
3. **やったこと**を具体的に書く

これだけ守れば、誰が見ても分かるコミット履歴になります！
