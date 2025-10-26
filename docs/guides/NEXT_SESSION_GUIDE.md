# 次回セッション - クイックスタートガイド

**作成日**: 2025-10-18
**前回セッション**: [SESSION_REPORT_2025-10-18.md](./SESSION_REPORT_2025-10-18.md)

---

## 📌 前回までの達成事項

✅ **デザイン改善** - Jonathan Ive design 100/100達成
✅ **市場調査** - 競合分析・日本市場リサーチ完了
✅ **Lark統合** - MCP + Wiki + Agent統合・テスト完了
✅ **Discord自動化** - Hook-based通知システム実装・テスト完了
✅ **SuperWhisper統合** - 音声入力プロンプト作成（3バージョン）
✅ **テストスイート** - Discord + Larkテスト完備

---

## 🎯 次回セッションの推奨タスク

### 優先度 P0（すぐ実行可能）

#### 1. SuperWhisper実動作テスト 🎤
**目的**: 音声入力からMiyabi実行までのE2Eテスト

**準備済み**:
- ✅ プロンプト3バージョン作成済み（`docs/SUPERWHISPER_MIYABI_PROMPT.md`）
- ✅ キャラクター名マッピング完備（21 Agent）
- ✅ SuperWhisper → Claude Code統合手順

**実行手順**:
```bash
# 1. SuperWhisperでプロンプトを設定
# docs/SUPERWHISPER_MIYABI_PROMPT.md の「推奨版（バランス型）」をコピー

# 2. テスト音声入力例
"Issue270をつくるんで実装してコミットしてディスコードに通知して"

# 3. 期待される動作
# → Claude Codeが以下を実行:
#    - Issue #270作成
#    - CodeGenAgentで実装
#    - git commit
#    - Discord通知送信

# 4. 結果確認
git log -1
# Discord Webhookで通知確認
```

**成功基準**:
- [ ] 音声入力が正確に変換される
- [ ] Miyabiコマンドが正しく解釈される
- [ ] Agent実行が正常に完了する
- [ ] Discord通知が送信される

---

#### 2. Discord通知のCI/CD統合 🤖
**目的**: GitHub Actions統合で自動通知を実現

**準備済み**:
- ✅ Discord Webhook URL設定済み（`.env`）
- ✅ Hook-based通知システム実装済み
- ✅ `.miyabi.yml`設定ファイル準備済み

**実行手順**:
```bash
# 1. Discord通知を再有効化
# .miyabi.yml の enabled: false → true に変更

# 2. GitHub Secretsに追加
# Repository Settings → Secrets → Actions
# Name: DISCORD_WEBHOOK_URL
# Value: （.envから取得）

# 3. GitHub Actions workflow作成
# .github/workflows/agent-notification.yml

# 4. テスト実行
git push
# → GitHub Actionsが自動実行 → Discord通知
```

**実装例**:
```yaml
# .github/workflows/agent-notification.yml
name: Agent Execution Notification

on:
  issues:
    types: [opened, labeled]
  pull_request:
    types: [opened, closed]

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install dependencies
        run: npm install
      - name: Send Discord notification
        env:
          DISCORD_WEBHOOK_URL: ${{ secrets.DISCORD_WEBHOOK_URL }}
        run: npm run test:discord-notifications
```

---

### 優先度 P1（要調査）

#### 3. Lark API権限の追加取得 🔐
**目的**: アプリ情報取得API（404エラー）の解決

**現状**:
- ✅ Tenant Access Token取得: 成功
- ✅ Bot情報取得: 成功（Bot名: MCP Integration Tool）
- ⚠️ アプリ情報取得: 失敗（権限不足）

**実行手順**:
```bash
# 1. Lark Developer Consoleで権限確認
# https://open.feishu.cn/app

# 2. 必要な権限を追加
# - application:application.read
# - application:application.info

# 3. 権限有効化後、再テスト
cd integrations/lark-mcp
node test-lark-features.cjs
```

---

### 優先度 P2（企画フェーズ）

#### 4. 日本市場向けデモ動画作成 🎬
**目的**: Miyabiの実動作を視覚的にアピール

**コンテンツ案**:
1. **オープニング** (10秒)
   - "一つのコマンドで全てが完結する自律型開発フレームワーク"
   - Miyabiロゴ

2. **デモシナリオ** (90秒)
   - Issue作成（音声入力でSuperWhisper使用）
   - Agent自動実行（CoordinatorAgent → CodeGenAgent）
   - コード生成・テスト・レビュー
   - PR自動作成
   - Discord通知

3. **結果表示** (20秒)
   - 実行時間: 3分
   - 品質スコア: 95/100
   - 自動生成されたコード

**使用ツール**:
- OBS Studio（画面録画）
- DaVinci Resolve（編集）
- SuperWhisper（音声入力デモ）

---

#### 5. WebUIダッシュボード開発開始 💻
**目的**: Agent実行状況の可視化（日本市場要件）

**機能要件**:
- [ ] Agent実行履歴表示
- [ ] リアルタイムステータス更新
- [ ] 品質スコアグラフ
- [ ] Discord通知ログ
- [ ] Lark Base連携

**技術スタック案**:
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Rust (Axum) + WebSocket
- **Database**: GitHub Projects V2 API
- **Deployment**: Vercel (Frontend) + Cloud Run (Backend)

**Phase 1実装**:
```bash
# 1. Next.jsプロジェクト作成
npx create-next-app@latest miyabi-dashboard --typescript --tailwind --app

# 2. GitHub API統合
npm install @octokit/rest

# 3. WebSocket接続
npm install socket.io-client

# 4. デプロイ
vercel deploy
```

---

## 🔧 現在の設定状態

### Discord通知
- **Webhook URL**: `.env`に保存済み
- **状態**: 無効化（`.miyabi.yml: enabled: false`）
- **再有効化方法**: `.miyabi.yml`の`enabled: false` → `true`に変更

### Lark統合
- **App ID**: `cli_a8d2fdb1f1f8d02d`
- **Bot名**: MCP Integration Tool
- **Wiki Space ID**: `7324483648537755682`
- **状態**: Token認証成功、Bot機能動作確認済み
- **注意**: 一部APIは権限追加が必要

### SuperWhisper
- **プロンプト**: `docs/SUPERWHISPER_MIYABI_PROMPT.md`（3バージョン）
- **状態**: プロンプト作成済み、実動作テスト未実施
- **キャラクター名マッピング**: 完備（21 Agent）

---

## 📊 前回セッション統計

- **コミット数**: 26コミット
- **コード行数**: 約5,000行追加
- **ドキュメント**: 5ファイル作成（約4,000行）
- **テスト**: 10テスト実行、成功率90%
- **デザインスコア**: 100/100（Jonathan Ive design）
- **市場規模**: TAM $3.24B, SAM $600M

---

## 🚀 クイックコマンド

### Discord通知再有効化
```bash
# .miyabi.ymlを編集
sed -i '' 's/enabled: false/enabled: true/' .miyabi.yml

# テスト送信
npm run test:discord-notifications
```

### Larkテスト実行
```bash
cd integrations/lark-mcp
node test-lark-features.cjs
```

### SuperWhisperプロンプト確認
```bash
cat docs/SUPERWHISPER_MIYABI_PROMPT.md | head -50
```

### 前回セッションレポート確認
```bash
cat docs/SESSION_REPORT_2025-10-18.md
```

---

## 💡 Tips

**効率的な作業フロー**:
1. 朝一番に本ガイドを確認
2. 優先度P0タスクから着手
3. 作業完了後にDiscord通知でチームに共有
4. セッション終了時にSESSION_REPORT更新

**トラブルシューティング**:
- Discord通知が届かない → `.env`のWebhook URL確認
- Lark APIエラー → Token有効期限（7200秒）確認
- Agent実行失敗 → `.ai/logs/`でログ確認

---

**次回セッション開始時のコマンド**:
```bash
# 1. 最新状態に更新
git pull origin main

# 2. 本ガイドを確認
cat docs/NEXT_SESSION_GUIDE.md

# 3. 優先タスクを選択して開始
# 例: SuperWhisperテスト
cat docs/SUPERWHISPER_MIYABI_PROMPT.md
```

---

**作成者**: Claude Code
**最終更新**: 2025-10-18
