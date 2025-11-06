# 🎭 Miyabi Orchestra - tmuxによるClaude Code並列実行（Codex Integration）

**⚠️ 注意**: このドキュメントは参考情報として保持されていますが、最新の運用ガイドは以下を参照してください:
- **推奨**: [ORCHESTRA_COMPLETE_GUIDE.md](./ORCHESTRA_COMPLETE_GUIDE.md) - 標準化された運用手順 (v1.1.0)
- **哲学**: [MIYABI_PARALLEL_ORCHESTRA.md](./MIYABI_PARALLEL_ORCHESTRA.md) - 雅なる並列実行

**Based on**: Claude Code Company concept
**Adapted for**: Miyabi Project with 6 Agents (みつけるん, しきるん, カエデ, サクラ, ツバキ, ボタン)
**Version**: 2.0.0 - W1-W5 Complete Workflow Coverage
**Last Updated**: 2025-11-03 (古い情報を含む可能性があります)

---

## 📚 コンセプト：メインpaneと部下paneによるタスク分散

tmuxの1つのpaneを「Conductor（指揮者）」とし、司令塔の役割を持たせます。その他の複数のpaneは「Agent（楽団員）」として位置づけられ、それぞれが独立した`Claude Code`のインスタンスを実行します。Conductorから各Agentへタスクを指示し、Agentは作業結果やエラーをConductorに報告するという、オーケストラのようなワークフローを構築します。

---

## 🎯 Miyabi Orchestra 現在の構成

### Pane構成 (Orchestra v2.0)

```
Conductor (Main pane): pane 1  (%1)  ← あなた
Agent 0 (W1):          pane 10 (%10) ← みつけるん (IssueAgent)
Agent 1 (W2):          pane 11 (%11) ← しきるん (CoordinatorAgent)
Agent 2 (W3):          pane 2  (%2)  ← カエデ (CodeGenAgent)
Agent 3 (W4):          pane 5  (%5)  ← サクラ (ReviewAgent)
Agent 4 (W3):          pane 3  (%3)  ← ツバキ (PRAgent)
Agent 5 (W5):          pane 4  (%4)  ← ボタン (DeploymentAgent)
```

**W1-W5 Workflow Coverage**: 100% - Issue Triage → Task Decomposition → Implementation → Review → PR → Deployment

⚠️ **注意**: pane ID（`%1`, `%2`等）は環境依存です。実際のIDは以下のコマンドで確認してください：
```bash
tmux list-panes -F "#{pane_index}: #{pane_id}"
```

### ワーキングディレクトリ

```
/Users/shunsuke/Dev/miyabi-private
```

---

## 1. 基本的なセットアップ手順

### 1-1. tmux paneの作成

**既存のセットアップ**: Kamui tmux設定で5つのpaneが作成済み

確認コマンド：
```bash
tmux list-panes -F "#{pane_index}: #{pane_id} #{pane_current_command} #{pane_active}"
```

### 1-2. Claude Codeの並列起動

**全6 Agentに一括起動 (Orchestra v2.0)**:
```bash
tmux send-keys -t %10 "cd '/Users/shunsuke/Dev/miyabi-private' && cc" && sleep 0.5 && tmux send-keys -t %10 Enter & \
tmux send-keys -t %11 "cd '/Users/shunsuke/Dev/miyabi-private' && cc" && sleep 0.5 && tmux send-keys -t %11 Enter & \
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && cc" && sleep 0.5 && tmux send-keys -t %2 Enter & \
tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && cc" && sleep 0.5 && tmux send-keys -t %5 Enter & \
tmux send-keys -t %3 "cd '/Users/shunsuke/Dev/miyabi-private' && cc" && sleep 0.5 && tmux send-keys -t %3 Enter & \
tmux send-keys -t %4 "cd '/Users/shunsuke/Dev/miyabi-private' && cc" && sleep 0.5 && tmux send-keys -t %4 Enter & \
wait
```

**Note**: `cc`は`claude`コマンドのエイリアス。環境に応じて調整してください。

---

## 2. タスクの割り当てと報告（報連相）

### 2-1. 基本スタイル（Miyabi標準）

```bash
tmux send-keys -t %N "cd '/Users/shunsuke/Dev/miyabi-private' && [指示内容]" && sleep 0.5 && tmux send-keys -t %N Enter
```

### 2-2. タスク割り当てテンプレート

#### パターン1: 単純なタスク

```bash
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「カエデ」です。{タスク内容}。完了したら [カエデ] 完了 と発言してください。" && sleep 0.5 && tmux send-keys -t %2 Enter
```

#### パターン2: エラー報告機能付き

```bash
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「カエデ」です。{タスク内容}。エラー時は [カエデ] エラー: {詳細} と発言してください。完了したら [カエデ] 完了 と発言してください。" && sleep 0.5 && tmux send-keys -t %2 Enter
```

#### パターン3: Conductor報告機能付き（高度）

```bash
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「カエデ」- pane2です。{タスク内容}。エラー時は[カエデ]を付けてtmux send-keys -t %1でConductorに報告してください。" && sleep 0.5 && tmux send-keys -t %2 Enter
```

**Agentからの報告例**:
```bash
# Agent側で実行されるコマンド
tmux send-keys -t %1 '[カエデ] タスク完了しました' && sleep 0.5 && tmux send-keys -t %1 Enter
tmux send-keys -t %1 '[カエデ] エラーが発生: ファイルが見つかりません' && sleep 0.5 && tmux send-keys -t %1 Enter
```

### 2-3. 連鎖タスク（Agent間の協調）

```bash
# Step 1: カエデに実装依頼
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && Issue #270の実装をお願いします。完了したら [カエデ] Issue #270実装完了 と発言してください。" && sleep 0.5 && tmux send-keys -t %2 Enter

# Step 2: サクラにレビュー待機
tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && カエデが Issue #270実装完了 と発言したら、コードレビューを開始してください。完了したら [サクラ] レビュー完了 と発言してください。" && sleep 0.5 && tmux send-keys -t %5 Enter

# Step 3: ツバキにPR作成待機
tmux send-keys -t %3 "cd '/Users/shunsuke/Dev/miyabi-private' && サクラが レビュー完了 と発言したら、PR作成を開始してください。完了したら [ツバキ] PR作成完了 と発言してください。" && sleep 0.5 && tmux send-keys -t %3 Enter
```

---

## 3. トークン管理と状況確認

### 3-1. トークン管理（`/clear`コマンド）

**実行タイミングの目安**:
- タスクが完了した時
- エラーが頻発する時
- コンテキストを切り替えたい時
- 会話が長くなりすぎた時

**単一Agentのクリア**:
```bash
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && /clear" && sleep 0.5 && tmux send-keys -t %2 Enter
```

**全Agent一括クリア**:
```bash
for pane in %2 %5 %3 %4; do
    tmux send-keys -t $pane "cd '/Users/shunsuke/Dev/miyabi-private' && /clear" && sleep 0.5 && tmux send-keys -t $pane Enter
    sleep 0.5
done
```

### 3-2. 状況確認

**特定Agentの最新状況確認**:
```bash
# カエデの最新10行
tmux capture-pane -t %2 -p | tail -10
```

**全Agent一括状況確認**:
```bash
for pane in %2 %5 %3 %4; do
    echo "=== $pane ==="
    tmux capture-pane -t $pane -p | tail -5
    echo ""
done
```

**特定のメッセージを検索**:
```bash
# カエデの発言を検索
tmux capture-pane -t %2 -p | grep "\[カエデ\]"

# 全Agentのエラーメッセージを検索
for pane in %2 %5 %3 %4; do
    echo "=== $pane ==="
    tmux capture-pane -t $pane -p | grep -i "error"
    echo ""
done
```

---

## 4. ベストプラクティス

### 4-1. 明確な役割分担

**Agent役割定義**:

| Agent | Pane ID | 役割 | 主な担当 |
|-------|---------|------|---------|
| カエデ | %2 | CodeGen | コード実装 |
| サクラ | %5 | Review | コードレビュー |
| ツバキ | %3 | PR | Pull Request作成 |
| ボタン | %4 | Deploy | デプロイ実行 |

### 4-2. 効率的なコミュニケーション

**報告形式の統一**:
```
[Agent名] {ステータス}: {詳細}

例:
[カエデ] 完了: Issue #270の実装が完了しました
[サクラ] 進行中: コードレビューを実施中です（進捗50%）
[ツバキ] エラー: PR作成に失敗しました。GitHub APIエラー
[ボタン] 待機: ツバキのPR完了を待機中
```

### 4-3. トークン管理の徹底

**使用量確認**:
```bash
# Claude Code使用量確認（Conductorで実行）
ccusage
```

**定期的なクリア**:
```bash
# 大きなタスク完了後に全Agentをクリア
./scripts/miyabi-orchestra-reset.sh  # スクリプト化推奨
```

### 4-4. エラー対処フロー

1. **Agentの自己解決を促す**:
   ```bash
   tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && エラーが発生した場合、WebSearchツールで調査して解決してください。解決できない場合のみConductorに報告してください。" && sleep 0.5 && tmux send-keys -t %2 Enter
   ```

2. **具体的なエラー内容を共有**:
   - Agentからの報告に必ずエラーメッセージを含める
   - 必要に応じてスタックトレースも共有

3. **成功事例の横展開**:
   ```bash
   # カエデで成功した解決策をサクラにも共有
   tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && カエデが成功した方法: {解決策} を参考に、同様のタスクを実行してください。" && sleep 0.5 && tmux send-keys -t %5 Enter
   ```

---

## 5. 高度なテクニック

### 5-1. Broadcasting（全Agentへ同時配信）

**Kamui tmux synchronize-panes機能**:
```bash
# Step 1: 同期モードON
tmux setw synchronize-panes on

# Step 2: コマンド入力（全paneに同時送信）
# ※全Agentに同じ指示を送る場合のみ使用

# Step 3: 同期モードOFF
tmux setw synchronize-panes off
```

### 5-2. ダッシュボード自動更新

```bash
# 5秒ごとにダッシュボード更新
watch -n 5 ./scripts/miyabi-dashboard.sh
```

### 5-3. ログ記録

```bash
# 全Agentの出力をファイルに保存
for pane in %2 %5 %3 %4; do
    tmux capture-pane -t $pane -p > logs/agent-${pane}.log
done
```

---

## 6. 重要な注意事項

### ⚠️ 必ず守ること

1. **pane IDの確認**: 実行前に必ず`tmux list-panes`で確認
2. **Agentは/clearを直接実行できない**: 必ずConductorから指示
3. **基本スタイルの遵守**: `cd + 指示 && sleep 0.5 && Enter`形式を厳守
4. **ダブルクォートの使用**: シングルクォートではなくダブルクォート
5. **段階的な指示**: 複雑な指示は分割して与える

### 🔒 セキュリティ考慮事項

- `--dangerously-skip-permissions`は本番環境では使用しない
- 機密情報を含むタスクは慎重に扱う
- ログファイルのパーミッション管理

---

## 7. トラブルシューティング

### 問題1: Agentが反応しない

**確認**:
```bash
tmux capture-pane -t %2 -p | tail -20
```

**対処**:
```bash
# リセット
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && /clear" && sleep 0.5 && tmux send-keys -t %2 Enter
```

### 問題2: コマンドが文字列として表示される

**原因**: 改行を含むコマンド、または基本スタイルの不遵守

**解決**: このドキュメントの基本スタイルを使用

### 問題3: Enterで改行されてしまう

**原因**: sleep を挟まずに Enter を送信

**解決**: `&& sleep 0.5 && tmux send-keys -t %N Enter`形式を使用

---

## 8. 実践例: 大規模Issue処理

### シナリオ: Issue #270を4人のAgentで並列処理

```bash
# Phase 1: 初期化
echo "🎭 Miyabi Orchestra - Issue #270 並列処理開始"

# Phase 2: タスク割り当て
# カエデ: 実装
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「カエデ」です。Issue #270のRust実装をagent-executionスキルで行ってください。完了したら [カエデ] Issue #270実装完了 と発言してください。" && sleep 0.5 && tmux send-keys -t %2 Enter

# サクラ: レビュー待機
tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「サクラ」です。カエデが Issue #270実装完了 と発言したら、コードレビューを開始してください。完了したら [サクラ] レビュー完了 と発言してください。" && sleep 0.5 && tmux send-keys -t %5 Enter

# ツバキ: PR作成待機
tmux send-keys -t %3 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「ツバキ」です。サクラが レビュー完了 と発言したら、PR作成を開始してください。完了したら [ツバキ] PR作成完了 と発言してください。" && sleep 0.5 && tmux send-keys -t %3 Enter

# ボタン: デプロイ待機
tmux send-keys -t %4 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「ボタン」です。ツバキが PR作成完了 と発言したら、デプロイを開始してください。完了したら [ボタン] デプロイ完了 と発言してください。" && sleep 0.5 && tmux send-keys -t %4 Enter

# Phase 3: 監視
echo "📊 各Agentの状態を監視中..."
./scripts/miyabi-dashboard.sh

# Phase 4: 完了確認
for pane in %2 %5 %3 %4; do
    tmux capture-pane -t $pane -p | grep "完了"
done
```

---

## 9. 参考リンク

- **Claude Code CLI Reference**: https://docs.claude.com/en/docs/claude-code
- **tmux Documentation**: https://github.com/tmux/tmux/wiki
- **Miyabi Architecture**: `/Users/shunsuke/Dev/miyabi-private/.claude/context/architecture.md`
- **Miyabi Agents**: `/Users/shunsuke/Dev/miyabi-private/AGENTS.md`

---

## 📝 まとめ

この「Miyabi Orchestra」システムは、Claude Code Companyの原理を基に、Miyabiプロジェクト専用にカスタマイズされた並列実行フレームワークです。4人のAgent（カエデ、サクラ、ツバキ、ボタン）がConductorの指揮のもと、協調してタスクを処理します。

**基本原則**:
1. ✅ 基本スタイルの厳守
2. ✅ 明確な役割分担
3. ✅ 効率的な報告体制
4. ✅ 適切なトークン管理

---

**🎭 Miyabi Orchestra - 雅なる並列実行**

**Version**: 1.0.0
**Last Updated**: 2025-11-03
**Maintained by**: Miyabi Team
