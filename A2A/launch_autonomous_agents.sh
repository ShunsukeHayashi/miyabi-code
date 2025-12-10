#!/bin/bash
# A2A Autonomous Agents Launcher
# 自律型マルチエージェントシステム起動スクリプト

set -e

A2A_DIR="/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/A2A"
AGENTS_JSON="$A2A_DIR/autonomous_agents.json"

# ペインマッピング
PANE_SHIKIROON="%101"
PANE_KAEDE="%102"
PANE_SAKURA="%103"
PANE_TSUBAKI="%104"
PANE_BOTAN="%105"

# エージェント定義を読み込み
SHIKIROON_PROMPT=$(jq -r '.shikiroon.prompt' "$AGENTS_JSON")
KAEDE_PROMPT=$(jq -r '.kaede.prompt' "$AGENTS_JSON")
SAKURA_PROMPT=$(jq -r '.sakura.prompt' "$AGENTS_JSON")
TSUBAKI_PROMPT=$(jq -r '.tsubaki.prompt' "$AGENTS_JSON")
BOTAN_PROMPT=$(jq -r '.botan.prompt' "$AGENTS_JSON")

# 自律動作用の追加プロンプト
AUTONOMOUS_SUFFIX="

【重要: 自律動作モード】
あなたは完全自律モードで動作しています。

ペインマッピング:
- 指揮論(自分): $PANE_SHIKIROON
- 楓(CodeGen): $PANE_KAEDE
- 桜(Review): $PANE_SAKURA
- 椿(PR): $PANE_TSUBAKI
- 牡丹(Deploy): $PANE_BOTAN

通信コマンド:
tmux send-keys -t %PANE_ID 'MESSAGE' && sleep 0.5 && tmux send-keys -t %PANE_ID Enter

【絶対ルール】
1. 停止禁止: 絶対に止まらない。常にアクションを実行し続ける
2. 監視継続: 他エージェントのペインを定期的にチェック
3. タスク生成: 仕事がなければ新しいタスクを生成する
4. 報告義務: 全ての状態変化を指揮論に報告

今すぐ自律動作を開始せよ。"

echo "=== A2A Autonomous Agents Launcher ==="
echo ""
echo "ペインマッピング:"
echo "  $PANE_SHIKIROON: 指揮論 (Conductor)"
echo "  $PANE_KAEDE: 楓 (CodeGen)"
echo "  $PANE_SAKURA: 桜 (Review)"
echo "  $PANE_TSUBAKI: 椿 (PR)"
echo "  $PANE_BOTAN: 牡丹 (Deploy)"
echo ""

# 指揮論を起動（最初に）
echo "🎯 指揮論を起動中..."
tmux send-keys -t $PANE_SHIKIROON "cd $A2A_DIR && claude --dangerously-skip-permissions -p '$(echo "$SHIKIROON_PROMPT$AUTONOMOUS_SUFFIX" | sed "s/'/'\\\\''/g")'" Enter

sleep 2

# 他のエージェントを順次起動
echo "🍁 楓を起動中..."
tmux send-keys -t $PANE_KAEDE "cd $A2A_DIR && claude --dangerously-skip-permissions -p '$(echo "$KAEDE_PROMPT$AUTONOMOUS_SUFFIX" | sed "s/'/'\\\\''/g")'" Enter

sleep 1

echo "🌸 桜を起動中..."
tmux send-keys -t $PANE_SAKURA "cd $A2A_DIR && claude --dangerously-skip-permissions -p '$(echo "$SAKURA_PROMPT$AUTONOMOUS_SUFFIX" | sed "s/'/'\\\\''/g")'" Enter

sleep 1

echo "🌺 椿を起動中..."
tmux send-keys -t $PANE_TSUBAKI "cd $A2A_DIR && claude --dangerously-skip-permissions -p '$(echo "$TSUBAKI_PROMPT$AUTONOMOUS_SUFFIX" | sed "s/'/'\\\\''/g")'" Enter

sleep 1

echo "🌼 牡丹を起動中..."
tmux send-keys -t $PANE_BOTAN "cd $A2A_DIR && claude --dangerously-skip-permissions -p '$(echo "$BOTAN_PROMPT$AUTONOMOUS_SUFFIX" | sed "s/'/'\\\\''/g")'" Enter

echo ""
echo "✅ 全エージェント起動完了"
echo ""
echo "セッション接続: tmux attach -t aa"
