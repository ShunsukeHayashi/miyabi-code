# Miyabi Auto-Dev Mode - 完全自律型開発システム

**Version**: 1.0.0
**Status**: ✅ Production Ready
**Last Updated**: 2025-01-02

---

## 🎯 概要

Miyabi Auto-Dev Modeは、**Issue取得からPR作成まで完全自動化**する自律型開発システムです。

tmux統合により、複数のAgentを並行実行し、人間の介入なしに開発タスクを処理します。

### 主な機能

✅ **完全自動化ワークフロー**
- GitHub Issueの自動取得
- タスクの自動優先順位付け
- 複数Agentによる並行実装
- 自動テスト・レビュー
- PR自動作成・マージ

✅ **リアルタイム監視**
- 4分割ダッシュボード
- ログストリーミング
- リソースモニタリング
- VOICEVOX音声通知

✅ **高度な並行処理**
- Worktree分離による完全並列化
- デッドロック回避
- リトライ機構

---

## 🚀 クイックスタート

### 1. 前提条件

```bash
# tmuxインストール
brew install tmux

# Miyabi CLI ビルド
cd /Users/shunsuke/Dev/miyabi-private
cargo build --release

# 環境変数設定
cat > .env <<EOF
GITHUB_TOKEN=ghp_your_token_here
ANTHROPIC_API_KEY=sk-ant-your_key_here
OPENAI_API_KEY=sk-your_key_here
EOF
```

### 2. 起動

```bash
# 基本起動（4並列）
./scripts/miyabi-auto-dev.sh

# カスタム設定
./scripts/miyabi-auto-dev.sh 8 50 false
#                            ↑  ↑  ↑
#                            │  │  └─ Dry Run (true/false)
#                            │  └──── Max Issues (数値)
#                            └─────── Concurrency (Worker数)
```

### 3. 操作

起動後、以下のtmuxウィンドウが表示されます：

| Window | 名前 | 機能 |
|--------|------|------|
| 0 | Coordinator | Issue管理・タスク割り当て |
| 1-N | Worker-{1..N} | 並行実装 (N=Concurrency) |
| N+1 | Review | 品質チェック・テスト |
| N+2 | Deploy | PR作成・デプロイ |
| N+3 | Monitor | 4分割ダッシュボード |
| N+4 | VOICEVOX | 音声通知システム |

**キーバインド:**
- `Ctrl-b` + `n` - 次のウィンドウ
- `Ctrl-b` + `p` - 前のウィンドウ
- `Ctrl-b` + `0-9` - ウィンドウ番号で移動
- `Ctrl-b` + `d` - デタッチ（バックグラウンド実行継続）
- `Ctrl-b` + `:kill-session` - 全停止

---

## 📊 アーキテクチャ

```
┌──────────────────────────────────────────────────────────┐
│                  Miyabi Auto-Dev System                  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────┐     │
│  │  Window 0: Coordinator Agent                  │     │
│  │  - GitHub Issue取得                           │     │
│  │  - 優先順位付け (P0/P1/P2)                    │     │
│  │  - Worker割り当て                             │     │
│  │  - 進捗追跡                                   │     │
│  └────────────────────────────────────────────────┘     │
│                      ↓ Task Queue                       │
│  ┌──────────┬──────────┬──────────┬──────────┐         │
│  │Worker-1  │Worker-2  │Worker-3  │Worker-4  │         │
│  │CodeGen   │Review    │Issue     │Deploy    │         │
│  └──────────┴──────────┴──────────┴──────────┘         │
│                      ↓ Results                          │
│  ┌────────────────────────────────────────────────┐     │
│  │  Window N+1: Review & Test                    │     │
│  │  [Clippy]  │  [Test Runner]                   │     │
│  └────────────────────────────────────────────────┘     │
│                      ↓ Pass/Fail                        │
│  ┌────────────────────────────────────────────────┐     │
│  │  Window N+2: Deploy & PR                      │     │
│  │  [PR List] │  [Deploy Log]                    │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
│  ┌────────────────────────────────────────────────┐     │
│  │  Window N+3: Monitor Dashboard (4-pane)       │     │
│  │  [Git]     │  [Issues]                        │     │
│  │  [htop]    │  [Logs]                          │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 🔧 設定

### Concurrency (並行数)

推奨値：
- **2-4**: 小規模プロジェクト / ローカル開発
- **4-8**: 中規模プロジェクト / CI/CD環境
- **8-16**: 大規模プロジェクト / 専用サーバー

制限：
- 最大16並列（リソース制約）
- GitHub API rate limit考慮

### Max Issues (処理Issue数)

- `999` (default): 無制限
- `10`: テスト用
- `50`: 中規模バッチ

### Dry Run

```bash
./scripts/miyabi-auto-dev.sh 4 10 true
```

- 実際の変更なし
- ログ出力のみ
- デバッグ用

---

## 📝 ログ

全ての実行ログは `.ai/logs/` に保存されます：

```bash
.ai/logs/
├── 2025-01-02.log              # メインログ
├── worker-1.log                # Worker #1ログ
├── worker-2.log                # Worker #2ログ
├── review.log                  # レビューログ
├── deploy.log                  # デプロイログ
└── parallel-reports/
    └── infinity-report.json    # 実行サマリー
```

---

## 🎤 VOICEVOX統合

音声通知が有効な場合、以下のイベントで通知：

- ✅ Worker起動時
- ✅ タスク完了時
- ✅ エラー発生時
- ✅ PR作成時

設定：
```bash
# .envに追加
VOICEVOX_ENABLED=true
VOICEVOX_SPEAKER_ID=3  # ずんだもん
```

---

## 🔍 トラブルシューティング

### セッションが起動しない

```bash
# 既存セッション確認
tmux ls

# 強制終了
tmux kill-session -t miyabi-auto-dev
```

### Workerが動作しない

```bash
# Workerログ確認
tail -f .ai/logs/worker-1.log

# Coordinator確認
tmux attach -t miyabi-auto-dev
# Ctrl-b 0 でCoordinatorウィンドウへ
```

### GitHub API rate limit

```bash
# 現在のレート確認
gh api rate_limit

# 対策：Concurrency削減
./scripts/miyabi-auto-dev.sh 2
```

---

## 🚦 ベストプラクティス

### 1. 段階的スケールアップ

```bash
# Phase 1: 2並列でテスト
./scripts/miyabi-auto-dev.sh 2 5 false

# Phase 2: 4並列で本番
./scripts/miyabi-auto-dev.sh 4 999 false
```

### 2. 定期的なモニタリング

- **毎時**: Monitorウィンドウ確認
- **毎日**: ログレビュー
- **毎週**: パフォーマンス分析

### 3. リソース管理

```bash
# CPU使用率確認（Monitor window, pane 3）
# メモリ確認（htop）
# ディスク使用率
df -h
```

---

## 📈 パフォーマンス指標

| Metric | Target | Current |
|--------|--------|---------|
| Issue処理速度 | 10 issues/hour | TBD |
| 並行実行数 | 4 workers | 4 |
| テスト成功率 | >95% | TBD |
| PR作成成功率 | >90% | TBD |

---

## 🔗 関連ドキュメント

- [Miyabi AGENTS.md](../AGENTS.md) - Agent仕様
- [Miyabi QUICKSTART-JA.md](../QUICKSTART-JA.md) - クイックスタート
- [Entity-Relation Model](./ENTITY_RELATION_MODEL.md) - システム設計
- [Label System Guide](./LABEL_SYSTEM_GUIDE.md) - ラベル体系

---

## ✨ 今後の拡張

- [ ] Webダッシュボード追加
- [ ] Slack/Discord通知統合
- [ ] メトリクス自動収集
- [ ] A/Bテスト自動実行
- [ ] セルフヒーリング機能

---

**Miyabi - 完全自律型AI開発プラットフォーム** 🤖
