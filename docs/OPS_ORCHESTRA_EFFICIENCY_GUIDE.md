# 🎭 177 Agents Orchestra - OPS効率化ガイド

**Version**: 2.0.0  
**Updated**: 2025-11-29  
**Purpose**: 再現性のある効率的なOrchestra運用

---

## 🚀 Quick Start

### 1. 完全再構築（初回 or リセット時）
```bash
./scripts/orchestra-rebuild-177.sh
```

### 2. 状態確認のみ
```bash
./scripts/orchestra-rebuild-177.sh --verify
```

### 3. Agentのみ再起動
```bash
./scripts/orchestra-rebuild-177.sh --restart
```

---

## 📊 Agent構成

| Pane | Agent | 役割 | Workflow | 責任範囲 |
|------|-------|------|----------|---------|
| %1 | **しきるん** | Conductor | W0 | 全体調整、タスク配分 |
| %2 | **カエデ** | CodeGen | W3 | コード実装、修正 |
| %3 | **ツバキ** | PR | W3 | PR作成、マージ |
| %4 | **ボタン** | Deploy | W5 | デプロイ、インフラ |
| %5 | **サクラ** | Review | W4 | コードレビュー |
| %6 | **みつけるん** | Issue | W1 | Issue分析、トリアージ |
| %7 | **まとめるん** | Summary | W6 | レポート、ドキュメント |

---

## ⚡ 効率化ポイント

### 1. PUSH型通信（必須）
```
❌ PULL禁止: Orchestratorがworkerに問い合わせる
✅ PUSH必須: Workerが自発的に%1に報告
```

### 2. P0.2プロトコル遵守
```bash
# 正しい形式
tmux send-keys -t %2 "タスク指示内容"
sleep 0.5  # ← 必須
tmux send-keys -t %2 Enter
```

### 3. 並列実行パターン
```bash
# バックグラウンド実行 + wait
tmux send-keys -t %2 "task1" && sleep 0.5 && tmux send-keys -t %2 Enter &
tmux send-keys -t %3 "task2" && sleep 0.5 && tmux send-keys -t %3 Enter &
tmux send-keys -t %4 "task3" && sleep 0.5 && tmux send-keys -t %4 Enter &
wait
```

---

## 📋 Daily OPS フロー

### 朝のスタートアップ
```bash
# 1. システム状態確認
./scripts/orchestra-rebuild-177.sh --verify

# 2. 全Agent起動（必要な場合）
./scripts/orchestra-rebuild-177.sh --restart

# 3. 今日のタスク確認
gh issue list --state open --limit 10
```

### タスク実行パターン
```bash
# Issue → カエデに割り当て
tmux send-keys -t %2 "Issue #XXX を実装してください。完了したら [カエデ] 実装完了 と%1に報告してください。"
sleep 0.5
tmux send-keys -t %2 Enter

# レビュー → サクラに割り当て
tmux send-keys -t %5 "PR #XXX をレビューしてください。完了したら [サクラ] レビュー完了 と%1に報告してください。"
sleep 0.5
tmux send-keys -t %5 Enter
```

### 夕方のクローズ
```bash
# 進捗レポート生成
tmux send-keys -t %7 "本日の作業サマリーを作成してください。"
sleep 0.5
tmux send-keys -t %7 Enter

# 状態保存
./scripts/orchestra-rebuild-177.sh --verify > ~/.ai/daily-report-$(date +%Y%m%d).txt
```

---

## 🔧 トラブルシューティング

### Agent応答なし
```bash
# 状態確認
tmux capture-pane -t %2 -p | tail -20

# 強制リスタート
tmux send-keys -t %2 C-c
sleep 1
tmux send-keys -t %2 "claude" && sleep 0.5 && tmux send-keys -t %2 Enter
```

### セッション破損
```bash
# セッション再作成
tmux kill-session -t miyabi-orchestra
./scripts/orchestra-rebuild-177.sh
```

### メモリ不足
```bash
# 不要なペインを閉じる
tmux kill-pane -t %7  # まとめるんを一時停止
```

---

## 📊 監視コマンド

### 全Agent状態一括確認
```bash
for pane in %1 %2 %3 %4 %5 %6 %7; do
    echo "=== $pane ==="
    tmux capture-pane -t $pane -p | tail -3
    echo ""
done
```

### リソース監視
```bash
# CPU/メモリ
top -bn1 | head -10

# tmuxプロセス
ps aux | grep tmux
```

---

## 🎯 KPI追跡

| メトリクス | 目標 | 測定方法 |
|-----------|------|---------|
| Agent稼働率 | 95%+ | --verify の成功率 |
| タスク完了時間 | -20% | Issue close時間 |
| 通信エラー率 | <5% | ログ分析 |
| 再起動頻度 | <1/日 | 手動カウント |

---

## 📁 関連ファイル

```
miyabi-private/
├── scripts/
│   └── orchestra-rebuild-177.sh    # 再構築スクリプト
├── .ai/
│   ├── orchestra-config-*.json     # 設定バックアップ
│   └── daily-report-*.txt          # 日次レポート
├── .claude/agents/
│   └── tmux_agents_control.md      # Agent制御リファレンス
└── .codex/commands/
    └── tmux-orchestra-start.md     # 起動手順
```

---

## 🔄 バージョン履歴

- **v2.0.0** (2025-11-29): 効率化・再現性向上版
- **v1.0.0** (2025-11-17): 初版

---

**Guardian**: Shunsuke  
**Operator**: Claude  
**Last Verified**: 2025-11-29
