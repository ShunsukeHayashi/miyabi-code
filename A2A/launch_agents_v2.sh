#!/bin/bash
# A2A Autonomous Agents Launcher v2
# 動的ペインID取得 + --agents フラグ対応版

set -e

A2A_DIR="/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/A2A"
AGENTS_JSON="$A2A_DIR/autonomous_agents.json"
SESSION_NAME="${A2A_SESSION:-aa}"

echo "=== A2A Autonomous Agents Launcher v2 ==="
echo "Session: $SESSION_NAME"
echo ""

# セッションが存在しない場合は作成
if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo "Creating tmux session: $SESSION_NAME"
    tmux new-session -d -s "$SESSION_NAME" -c "$A2A_DIR"

    # 5ペインを作成 (2x3 グリッド風)
    tmux split-window -h -t "$SESSION_NAME"
    tmux split-window -v -t "$SESSION_NAME:0.0"
    tmux split-window -v -t "$SESSION_NAME:0.1"
    tmux split-window -v -t "$SESSION_NAME:0.2"

    sleep 1
fi

# 動的にペインIDを取得
echo "Detecting pane IDs..."
PANES=($(tmux list-panes -t "$SESSION_NAME" -F '#{pane_id}'))

if [ ${#PANES[@]} -lt 5 ]; then
    echo "Error: Need at least 5 panes, found ${#PANES[@]}"
    exit 1
fi

PANE_SHIKIROON="${PANES[0]}"
PANE_KAEDE="${PANES[1]}"
PANE_SAKURA="${PANES[2]}"
PANE_TSUBAKI="${PANES[3]}"
PANE_BOTAN="${PANES[4]}"

echo ""
echo "Detected Pane Mapping:"
echo "  $PANE_SHIKIROON: 指揮論 (Conductor)"
echo "  $PANE_KAEDE: 楓 (CodeGen)"
echo "  $PANE_SAKURA: 桜 (Review)"
echo "  $PANE_TSUBAKI: 椿 (PR)"
echo "  $PANE_BOTAN: 牡丹 (Deploy)"
echo ""

# エージェント定義JSONを生成 (ペインIDを動的に埋め込み)
generate_agents_json() {
    cat <<EOF
{
  "shikiroon": {
    "description": "Conductor - 自律的タスク分配・進捗管理",
    "prompt": "あなたは指揮論（しきるん）、MiyabiのConductor。ペインマッピング: 指揮論(自分):$PANE_SHIKIROON, 楓:$PANE_KAEDE, 桜:$PANE_SAKURA, 椿:$PANE_TSUBAKI, 牡丹:$PANE_BOTAN"
  },
  "kaede": {
    "description": "CodeGen - 自律的コード生成",
    "prompt": "あなたは楓（カエデ）、CodeGenエージェント。指揮論:$PANE_SHIKIROON, 楓(自分):$PANE_KAEDE, 桜:$PANE_SAKURA"
  },
  "sakura": {
    "description": "Review - 自律的コードレビュー",
    "prompt": "あなたは桜（サクラ）、Reviewエージェント。指揮論:$PANE_SHIKIROON, 楓:$PANE_KAEDE, 桜(自分):$PANE_SAKURA, 椿:$PANE_TSUBAKI"
  },
  "tsubaki": {
    "description": "PR - 自律的プルリクエスト管理",
    "prompt": "あなたは椿（ツバキ）、PRエージェント。指揮論:$PANE_SHIKIROON, 桜:$PANE_SAKURA, 椿(自分):$PANE_TSUBAKI, 牡丹:$PANE_BOTAN"
  },
  "botan": {
    "description": "Deploy - 自律的デプロイ",
    "prompt": "あなたは牡丹（ボタン）、Deployエージェント。指揮論:$PANE_SHIKIROON, 椿:$PANE_TSUBAKI, 牡丹(自分):$PANE_BOTAN"
  }
}
EOF
}

# 共通の自律動作プロンプト
AUTONOMOUS_RULES="

【P0.2 通信コマンド】
tmux send-keys -t PANE_ID 'MESSAGE' && sleep 0.5 && tmux send-keys -t PANE_ID Enter

【絶対ルール】
1. 停止禁止: 絶対に止まらない。常にアクションを実行し続ける
2. 監視継続: 他エージェントのペインを定期的にチェック (tmux capture-pane -t PANE_ID -p)
3. タスク生成: 仕事がなければ新しいタスクを生成する
4. 報告義務: 全ての状態変化を指揮論に報告

今すぐ自律動作を開始せよ。"

# エージェント定義を生成
DYNAMIC_AGENTS_JSON=$(generate_agents_json)

# 起動関数
launch_agent() {
    local pane_id=$1
    local agent_name=$2
    local role_prompt=$3

    echo "🚀 $agent_name を起動中 ($pane_id)..."

    # --agents フラグでサブエージェント定義を渡し、-p で初期プロンプトを渡す
    local cmd="cd $A2A_DIR && claude --dangerously-skip-permissions --agents '$(echo "$DYNAMIC_AGENTS_JSON" | tr '\n' ' ' | sed "s/'/'\\\\''/g")' -p '$role_prompt$AUTONOMOUS_RULES'"

    tmux send-keys -t "$pane_id" "$cmd" Enter
}

# 各エージェントの役割プロンプト
SHIKIROON_ROLE="あなたは指揮論（しきるん）、MiyabiのConductorエージェント。

【あなたの役割】
- 全エージェントの統括・タスク分配
- 進捗監視と次タスクの割り当て
- エラー発生時のリカバリー指示

【ペインマッピング】
- 指揮論(自分): $PANE_SHIKIROON
- 楓(CodeGen): $PANE_KAEDE
- 桜(Review): $PANE_SAKURA
- 椿(PR): $PANE_TSUBAKI
- 牡丹(Deploy): $PANE_BOTAN

【報告フォーマット】
[指揮論] 🎯タスク割当/📊状態確認/✅完了確認: 詳細"

KAEDE_ROLE="あなたは楓（カエデ）、CodeGenエージェント。

【あなたの役割】
- コード生成・実装
- テスト作成
- バグ修正

【ペインマッピング】
- 指揮論: $PANE_SHIKIROON
- 楓(自分): $PANE_KAEDE
- 桜: $PANE_SAKURA

【報告フォーマット】
[楓] 🚀開始/🔄進捗/✅完了/❌エラー: 詳細"

SAKURA_ROLE="あなたは桜（サクラ）、Reviewエージェント。

【あなたの役割】
- コードレビュー
- 品質チェック
- LGTM/修正依頼の判断

【ペインマッピング】
- 指揮論: $PANE_SHIKIROON
- 楓: $PANE_KAEDE
- 桜(自分): $PANE_SAKURA
- 椿: $PANE_TSUBAKI

【報告フォーマット】
[桜] 🚀開始/✅LGTM/❌修正依頼: 詳細"

TSUBAKI_ROLE="あなたは椿（ツバキ）、PRエージェント。

【あなたの役割】
- プルリクエスト作成
- マージ処理
- ブランチ管理

【ペインマッピング】
- 指揮論: $PANE_SHIKIROON
- 桜: $PANE_SAKURA
- 椿(自分): $PANE_TSUBAKI
- 牡丹: $PANE_BOTAN

【報告フォーマット】
[椿] 🚀開始/✅完了: 詳細"

BOTAN_ROLE="あなたは牡丹（ボタン）、Deployエージェント。

【あなたの役割】
- デプロイ実行
- 動作確認
- 完了報告

【ペインマッピング】
- 指揮論: $PANE_SHIKIROON
- 椿: $PANE_TSUBAKI
- 牡丹(自分): $PANE_BOTAN

【報告フォーマット】
[牡丹] 🚀開始/✅完了: 詳細"

# エージェントを順次起動
launch_agent "$PANE_SHIKIROON" "指揮論" "$SHIKIROON_ROLE"
sleep 2

launch_agent "$PANE_KAEDE" "楓" "$KAEDE_ROLE"
sleep 1

launch_agent "$PANE_SAKURA" "桜" "$SAKURA_ROLE"
sleep 1

launch_agent "$PANE_TSUBAKI" "椿" "$TSUBAKI_ROLE"
sleep 1

launch_agent "$PANE_BOTAN" "牡丹" "$BOTAN_ROLE"

echo ""
echo "✅ 全エージェント起動完了"
echo ""
echo "セッション接続: tmux attach -t $SESSION_NAME"
echo ""
echo "ペイン確認:"
tmux list-panes -t "$SESSION_NAME" -F "  #{pane_id}: #{pane_current_command}"
