# OpenAI Codex CLI 200並列実行環境 - 実現可能性分析

**Status**: 📊 Analysis Complete | **Created**: 2025-11-11 | **Priority**: P0

---

## 🎯 要件サマリー

**目標**: OpenAI Codex CLI を MUGEN/MAJIN 2台のEC2インスタンスで200並列実行（各100）
**用途**: Test task の実行
**制御方式**: ローカルPC → SSH → MUGEN/MAJIN → サブオーケストレーター

---

## 📊 リソース要件分析

### OpenAI Codex CLI の推定リソース要件（1インスタンス）

```
Minimum Requirements:
- CPU: 0.5 vCPU
- Memory: 512 MB
- Disk: 100 MB (キャッシュ含む)

Recommended Requirements:
- CPU: 1.0 vCPU
- Memory: 1 GB
- Disk: 200 MB
```

### 200並列実行時の総リソース要件

**最小構成**:
- **CPU**: 100 vCPU
- **Memory**: 100 GB
- **Disk**: 20 GB

**推奨構成**:
- **CPU**: 200 vCPU
- **Memory**: 200 GB
- **Disk**: 40 GB

---

## 🖥️ 現在の利用可能リソース

### MUGEN (無限)
```
CPU: 16 vCPU (利用可能: 14 vCPU)
Memory: 124 GB (利用可能: 100 GB)
Disk: 194 GB (利用可能: 137 GB)
```

**最大並列数（推奨構成）**:
- CPU制約: 14 Codex
- Memory制約: 100 Codex
- **実質最大: 14 Codex**

### MAJIN (魔神)
```
CPU: 8 vCPU (利用可能: 7 vCPU)
Memory: 30 GB (利用可能: 24 GB)
Disk: 194 GB (利用可能: 163 GB)
```

**最大並列数（推奨構成）**:
- CPU制約: 7 Codex
- Memory制約: 24 Codex
- **実質最大: 7 Codex**

### 合計キャパシティ

**現実的な最大並列数: 21 Codex** (MUGEN 14 + MAJIN 7)

---

## ⚠️ ギャップ分析

| 項目 | 要件 | 現状 | ギャップ | 評価 |
|------|------|------|---------|------|
| **並列数** | 200 | 21 | -179 | ❌ 大幅不足 |
| **CPU** | 200 vCPU | 24 vCPU | -176 vCPU | ❌ 9倍不足 |
| **Memory** | 200 GB | 154 GB | -46 GB | ⚠️ 23%不足 |
| **Disk** | 40 GB | 300 GB | +260 GB | ✅ 十分 |

**結論**: 🔴 **現在のインフラでは200並列実行は不可能**

---

## 🚀 実現パス: 3つの選択肢

### Option 1: 現実的スケール調整【推奨】

**並列数を現実的な数に調整**

```
MUGEN: 12 Codex (2 vCPU予約)
MAJIN: 6 Codex (2 vCPU予約)
─────────────────────────────
合計: 18 Codex 並列実行
```

**メリット**:
- ✅ 即座に実装可能
- ✅ 追加コストなし
- ✅ 安定稼働が期待できる

**デメリット**:
- ❌ 目標の200には遠く及ばない（9%）

**実装期間**: 2-3日
**追加コスト**: $0

---

### Option 2: 段階的スケールアップ【バランス重視】

**Phase 1**: 現状リソースで 18 Codex（即座）
**Phase 2**: 追加インスタンス 4台で 100 Codex（1週間）
**Phase 3**: さらに追加で 200 Codex（2週間）

**追加インスタンス構成例**:
```
4台 × r5.4xlarge (MUGEN同等)
= 64 vCPU × 4 = 256 vCPU
= 128 GB × 4 = 512 GB Memory

推定コスト: $2,937.60/月 (24/7稼働)
```

**Phase 2 実装 (合計100並列)**:
- MUGEN: 14 Codex
- MAJIN: 7 Codex
- New Instance 1: 26 Codex (r5.4xlarge)
- New Instance 2: 26 Codex (r5.4xlarge)
- New Instance 3: 27 Codex (r5.4xlarge)
- **合計: 100 Codex**

**Phase 3 実装 (合計200並列)**:
- 既存 100 Codex
- New Instance 4: 50 Codex (r5.8xlarge)
- New Instance 5: 50 Codex (r5.8xlarge)
- **合計: 200 Codex**

**メリット**:
- ✅ 目標達成可能
- ✅ 段階的な検証が可能
- ✅ 失敗時のリスク低減

**デメリット**:
- ⚠️ 月額$3,000-5,000の追加コスト
- ⚠️ インフラ管理の複雑化

**実装期間**: Phase 1: 2-3日, Phase 2: 1週間, Phase 3: 2週間
**追加コスト**: $2,937.60/月〜

---

### Option 3: クラウドネイティブ分散実行【本格実装】

**AWS Batch + Fargate/ECS を使用した完全分散システム**

**アーキテクチャ**:
```
ローカルPC (Master Orchestrator)
    ↓ AWS SDK/CLI
AWS Batch Job Definitions
    ↓
200 Fargate Tasks (各1 Codex)
    ↓
S3: タスク定義 & 結果保存
    ↓
CloudWatch: ログ集約 & 監視
```

**メリット**:
- ✅ 真の並列200実行
- ✅ スケール制限なし（1000+も可能）
- ✅ 使用時のみ課金（コスト最適）
- ✅ 自動スケーリング・自動復旧

**デメリット**:
- ❌ 実装複雑（3-4週間）
- ❌ AWS専門知識が必要
- ⚠️ 実行時のみだがコスト変動大

**実装期間**: 3-4週間
**追加コスト**: 変動（実行時のみ、推定$500-1000/月）

---

## 💡 推奨アプローチ

### 推奨: **Option 2 (段階的スケールアップ)**

**理由**:
1. **即座の成果**: Phase 1で18並列を今すぐ開始可能
2. **検証可能**: 少数並列で動作確認してからスケール
3. **柔軟性**: 各Phaseで効果測定し、継続判断可能
4. **コスト管理**: Phase 1は無料、Phase 2以降は必要に応じて

**実行プラン**:
```
Week 1: Phase 1実装（18 Codex）
  - サブオーケストレーター構築
  - VS Code設定同期
  - テスト実行・検証

Week 2: Phase 2準備（必要に応じて）
  - 効果測定レビュー
  - 追加インスタンス起動判断
  - Phase 2実装（100 Codex）

Week 3-4: Phase 3検討（必要に応じて）
  - 100並列の効果測定
  - 200並列の必要性再評価
  - Phase 3実装判断
```

---

## 📋 Phase 1 実装タスク（18 Codex並列）

### 1. インフラ準備

**MUGEN (12 Codex)**:
```bash
# SSH接続確認
ssh mugen "uname -a"

# OpenAI Codex CLIインストール
ssh mugen "npm install -g @openai/codex"

# 認証設定
ssh mugen "codex config set-key YOUR_API_KEY"
```

**MAJIN (6 Codex)**:
```bash
# SSH接続確認
ssh majin "uname -a"

# OpenAI Codex CLIインストール
ssh majin "npm install -g @openai/codex"

# 認証設定
ssh majin "codex config set-key YOUR_API_KEY"
```

### 2. VS Code設定同期

**ローカル → リモート設定コピー**:
```bash
# VS Code設定をバックアップ
rsync -avz ~/.vscode/extensions/ mugen:~/.vscode/extensions/
rsync -avz ~/.vscode/extensions/ majin:~/.vscode/extensions/

# settings.json, keybindings.json等
rsync -avz ~/Library/Application\ Support/Code/User/ mugen:~/.config/Code/User/
rsync -avz ~/Library/Application\ Support/Code/User/ majin:~/.config/Code/User/

# Git設定
rsync -avz ~/.gitconfig mugen:~/
rsync -avz ~/.gitconfig majin:~/
```

### 3. サブオーケストレーター構築

**tmux-based Orchestrator**:

`scripts/sub-orchestrator-mugen.sh`:
```bash
#!/bin/bash
# MUGEN Sub-Orchestrator: 12 Codex並列実行

SESSION="mugen-codex"
WORKDIR="$HOME/projects/miyabi-private"

# 既存セッション削除
tmux kill-session -t $SESSION 2>/dev/null

# 新規セッション作成（12 windows = 12 Codex）
tmux new-session -d -s $SESSION -n "Codex-1" -c $WORKDIR

for i in {2..12}; do
  tmux new-window -t $SESSION -n "Codex-$i" -c $WORKDIR
done

# 各windowでCodex起動
for i in {1..12}; do
  tmux send-keys -t $SESSION:$((i-1)) "codex --task-file tasks/test-task-$i.md" C-m
done

echo "MUGEN Sub-Orchestrator started: 12 Codex instances"
tmux attach -t $SESSION
```

`scripts/sub-orchestrator-majin.sh`:
```bash
#!/bin/bash
# MAJIN Sub-Orchestrator: 6 Codex並列実行

SESSION="majin-codex"
WORKDIR="$HOME/projects/miyabi-private"

# 既存セッション削除
tmux kill-session -t $SESSION 2>/dev/null

# 新規セッション作成（6 windows = 6 Codex）
tmux new-session -d -s $SESSION -n "Codex-1" -c $WORKDIR

for i in {2..6}; do
  tmux new-window -t $SESSION -n "Codex-$i" -c $WORKDIR
done

# 各windowでCodex起動
for i in {1..6}; do
  tmux send-keys -t $SESSION:$((i-1)) "codex --task-file tasks/test-task-$i.md" C-m
done

echo "MAJIN Sub-Orchestrator started: 6 Codex instances"
tmux attach -t $SESSION
```

### 4. マスターオーケストレーター（ローカルPC）

`scripts/master-orchestrator.sh`:
```bash
#!/bin/bash
# Master Orchestrator: ローカルPCからMUGEN/MAJINを制御

echo "🎯 Master Orchestrator - 18 Codex並列実行制御"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# MUGEN Sub-Orchestrator起動
echo "▶ Starting MUGEN Sub-Orchestrator (12 Codex)..."
ssh mugen "cd ~/projects/miyabi-private && ./scripts/sub-orchestrator-mugen.sh"

# MAJIN Sub-Orchestrator起動
echo "▶ Starting MAJIN Sub-Orchestrator (6 Codex)..."
ssh majin "cd ~/projects/miyabi-private && ./scripts/sub-orchestrator-majin.sh"

echo ""
echo "✅ All Sub-Orchestrators started"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Total Codex instances: 18"
echo "  - MUGEN: 12 Codex"
echo "  - MAJIN: 6 Codex"
echo ""
echo "Monitoring:"
echo "  ssh mugen 'tmux attach -t mugen-codex'"
echo "  ssh majin 'tmux attach -t majin-codex'"
```

### 5. モニタリング & ログ収集

**リアルタイム監視スクリプト**:

`scripts/monitor-18-codex.sh`:
```bash
#!/bin/bash
# 18 Codex並列実行のリアルタイム監視

watch -n 5 '
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🖥️  MUGEN (12 Codex)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ssh mugen "tmux list-windows -t mugen-codex -F \"#{window_index}: #{window_name} - #{pane_current_command}\""
echo ""
echo "CPU: $(ssh mugen "top -bn1 | grep Cpu | awk \"{print \$2}\"")%"
echo "Memory: $(ssh mugen "free -h | grep Mem | awk \"{print \$3\"/\"\$2}\")"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🖥️  MAJIN (6 Codex)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ssh majin "tmux list-windows -t majin-codex -F \"#{window_index}: #{window_name} - #{pane_current_command}\""
echo ""
echo "CPU: $(ssh majin "top -bn1 | grep Cpu | awk \"{print \$2}\"")%"
echo "Memory: $(ssh majin "free -h | grep Mem | awk \"{print \$3\"/\"\$2}\")"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Total: 18 Codex | Last updated: $(date)"
'
```

---

## 📈 期待される成果（Phase 1: 18並列）

**パフォーマンス**:
- タスク処理速度: 単一実行比 **18倍**
- 並列効率: 推定 **85-90%** (オーバーヘッド考慮)
- 実質スループット: **15-16倍の高速化**

**リソース使用率**:
- MUGEN CPU: 70-80% (14 vCPU中 12 vCPU使用)
- MAJIN CPU: 75-85% (7 vCPU中 6 vCPU使用)
- 両マシンともメモリ余裕あり（100GB+, 24GB+）

---

## 🔄 Next Steps

### Immediate (今すぐ)

1. ✅ **要件分析完了** - このドキュメント
2. ⏭️ **Option選択** - ユーザー承認待ち
3. ⏭️ **Phase 1実装開始** - 承認後即座に

### Week 1 (Option 2 Phase 1選択時)

1. MUGEN/MAJINへCodex CLIインストール
2. VS Code設定同期
3. サブオーケストレーター構築
4. 18並列テスト実行
5. 効果測定・レポート作成

### Week 2+ (Phase 2以降検討時)

1. Phase 1効果測定レビュー
2. 追加インスタンス必要性判断
3. Phase 2実装（100並列）

---

## 📊 コスト試算

### Phase 1 (18並列)
- 追加コスト: **$0**（既存インフラ活用）
- 実装工数: 2-3日

### Phase 2 (100並列)
- 追加インスタンス: 3台 × r5.4xlarge
- 月額コスト: **$2,203.20** (24/7稼働)
- 実装工数: 1週間

### Phase 3 (200並列)
- 追加インスタンス: 合計5台
- 月額コスト: **$3,672.00** (24/7稼働)
- 実装工数: 2週間

---

## ✅ 成功基準

### Phase 1 (18並列)
- ✅ 18 Codex全てが正常起動
- ✅ test taskが全Codexで並列実行
- ✅ CPU使用率が70-85%で安定
- ✅ エラー率 < 5%
- ✅ ローカルからのリモート制御が機能

### Phase 2 (100並列) ※実施する場合
- ✅ 100 Codex全てが正常起動
- ✅ 並列効率 > 80%
- ✅ エラー率 < 3%

### Phase 3 (200並列) ※実施する場合
- ✅ 200 Codex全てが正常起動
- ✅ 並列効率 > 75%
- ✅ エラー率 < 2%

---

## 📞 Next Action Required

**ユーザー決定事項**:

1. **Option選択**: どのOptionで進めるか？
   - [ ] Option 1: 18並列で進める（推奨、即座、無料）
   - [ ] Option 2: 段階的スケールアップ（100→200、$3K-5K/月）
   - [ ] Option 3: AWS Batch分散実行（本格実装、3-4週間）

2. **Phase 1実装承認**:
   - [ ] 承認 → 即座に実装開始
   - [ ] 保留 → 追加情報・調整が必要

3. **OpenAI API Key提供**:
   - [ ] API Key準備済み
   - [ ] API Key未準備（取得方法案内必要）

---

**Status**: 🟡 Awaiting User Decision
**Owner**: Master Orchestrator (Local PC)
**Created**: 2025-11-11
**Next Review**: Upon user decision

