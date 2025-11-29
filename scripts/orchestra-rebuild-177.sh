#!/bin/bash
# ============================================
# 🎭 177 Agents Orchestra 再構築スクリプト
# ============================================
# Version: 2.0.0
# Date: 2025-11-29
# Purpose: 効率化と再現性向上のための完全自動化
# ============================================

set -e

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ログ関数
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✅]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[⚠️]${NC} $1"; }
log_error() { echo -e "${RED}[❌]${NC} $1"; }

# ============================================
# 設定
# ============================================
SESSION_NAME="miyabi-orchestra"
WORKING_DIR="$HOME/miyabi-private"
CLAUDE_CMD="claude"

# Agent定義 (ペインID: 名前: 役割: ワークフロー)
declare -A AGENTS=(
    ["%1"]="Conductor:しきるん:全体調整:W0"
    ["%2"]="CodeGen:カエデ:コード実装:W3"
    ["%3"]="PR:ツバキ:PR作成:W3"
    ["%4"]="Deploy:ボタン:デプロイ:W5"
    ["%5"]="Review:サクラ:コードレビュー:W4"
    ["%10"]="Issue:みつけるん:Issue分析:W1"
    ["%11"]="Coordinator:しきるん2:タスク分解:W2"
)

# ============================================
# Phase 1: セッション確認・作成
# ============================================
phase1_setup_session() {
    log_info "Phase 1: セッション確認・作成"
    
    if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
        log_success "セッション '$SESSION_NAME' が存在します"
        PANE_COUNT=$(tmux list-panes -t "$SESSION_NAME" | wc -l)
        log_info "現在のペイン数: $PANE_COUNT"
    else
        log_warn "セッション作成中..."
        tmux new-session -d -s "$SESSION_NAME" -c "$WORKING_DIR"
        log_success "セッション '$SESSION_NAME' を作成しました"
    fi
}

# ============================================
# Phase 2: ペイン構成
# ============================================
phase2_create_panes() {
    log_info "Phase 2: ペイン構成 (7ペイン)"
    
    CURRENT_PANES=$(tmux list-panes -t "$SESSION_NAME" | wc -l)
    NEEDED_PANES=7
    
    if [ "$CURRENT_PANES" -lt "$NEEDED_PANES" ]; then
        PANES_TO_ADD=$((NEEDED_PANES - CURRENT_PANES))
        log_info "追加ペイン作成: $PANES_TO_ADD"
        
        for i in $(seq 1 $PANES_TO_ADD); do
            if [ $((i % 2)) -eq 1 ]; then
                tmux split-window -t "$SESSION_NAME" -h -c "$WORKING_DIR"
            else
                tmux split-window -t "$SESSION_NAME" -v -c "$WORKING_DIR"
            fi
            sleep 0.2
        done
        
        # レイアウト調整
        tmux select-layout -t "$SESSION_NAME" tiled
    fi
    
    log_success "ペイン構成完了"
    tmux list-panes -t "$SESSION_NAME" -F "#{pane_index}: #{pane_id}"
}

# ============================================
# Phase 3: Agent起動
# ============================================
phase3_start_agents() {
    log_info "Phase 3: Agent起動 (並列)"
    
    # ペインID取得
    PANE_IDS=($(tmux list-panes -t "$SESSION_NAME" -F "#{pane_id}"))
    
    for i in "${!PANE_IDS[@]}"; do
        PANE_ID="${PANE_IDS[$i]}"
        log_info "起動中: $PANE_ID"
        
        tmux send-keys -t "$PANE_ID" "cd '$WORKING_DIR' && $CLAUDE_CMD" 
        sleep 0.5
        tmux send-keys -t "$PANE_ID" Enter &
    done
    
    wait
    log_success "全Agent起動コマンド送信完了"
}

# ============================================
# Phase 4: Agent初期化・ロール割り当て
# ============================================
phase4_initialize_agents() {
    log_info "Phase 4: Agent初期化 (30秒待機後)"
    sleep 30
    
    PANE_IDS=($(tmux list-panes -t "$SESSION_NAME" -F "#{pane_id}"))
    AGENT_NAMES=("しきるん" "カエデ" "ツバキ" "ボタン" "サクラ" "みつけるん" "まとめるん")
    
    for i in "${!PANE_IDS[@]}"; do
        if [ $i -lt ${#AGENT_NAMES[@]} ]; then
            PANE_ID="${PANE_IDS[$i]}"
            AGENT_NAME="${AGENT_NAMES[$i]}"
            
            log_info "初期化中: $AGENT_NAME ($PANE_ID)"
            
            tmux send-keys -t "$PANE_ID" "あなたは「$AGENT_NAME」です。[$AGENT_NAME] 準備OK！ と発言してください。"
            sleep 0.5
            tmux send-keys -t "$PANE_ID" Enter
            sleep 2
        fi
    done
    
    log_success "Agent初期化完了"
}

# ============================================
# Phase 5: 状態確認
# ============================================
phase5_verify() {
    log_info "Phase 5: 状態確認"
    
    echo ""
    echo "============================================"
    echo "🎭 177 Agents Orchestra 状態"
    echo "============================================"
    
    PANE_IDS=($(tmux list-panes -t "$SESSION_NAME" -F "#{pane_id}"))
    AGENT_NAMES=("しきるん" "カエデ" "ツバキ" "ボタン" "サクラ" "みつけるん" "まとめるん")
    
    for i in "${!PANE_IDS[@]}"; do
        PANE_ID="${PANE_IDS[$i]}"
        AGENT_NAME="${AGENT_NAMES[$i]:-Agent-$i}"
        
        # 最後の出力を取得
        LAST_OUTPUT=$(tmux capture-pane -t "$PANE_ID" -p | tail -3 | head -1)
        
        if echo "$LAST_OUTPUT" | grep -q "準備OK"; then
            echo -e "${GREEN}✅${NC} $AGENT_NAME ($PANE_ID): Ready"
        else
            echo -e "${YELLOW}⏳${NC} $AGENT_NAME ($PANE_ID): Initializing..."
        fi
    done
    
    echo "============================================"
}

# ============================================
# Phase 6: OPS効率化設定保存
# ============================================
phase6_save_config() {
    log_info "Phase 6: OPS設定保存"
    
    CONFIG_FILE="$WORKING_DIR/.ai/orchestra-config-$(date +%Y%m%d).json"
    
    cat > "$CONFIG_FILE" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "session": "$SESSION_NAME",
  "panes": [
$(tmux list-panes -t "$SESSION_NAME" -F '    {"id": "#{pane_id}", "index": #{pane_index}, "active": #{pane_active}}' | paste -sd ',' -)
  ],
  "agents": {
    "conductor": {"pane": "%1", "name": "しきるん", "role": "Coordinator"},
    "codegen": {"pane": "%2", "name": "カエデ", "role": "CodeGen"},
    "pr": {"pane": "%3", "name": "ツバキ", "role": "PR"},
    "deploy": {"pane": "%4", "name": "ボタン", "role": "Deploy"},
    "review": {"pane": "%5", "name": "サクラ", "role": "Review"},
    "issue": {"pane": "%6", "name": "みつけるん", "role": "Issue"},
    "summary": {"pane": "%7", "name": "まとめるん", "role": "Summary"}
  },
  "working_dir": "$WORKING_DIR",
  "status": "initialized"
}
EOF
    
    log_success "設定保存: $CONFIG_FILE"
}

# ============================================
# メイン実行
# ============================================
main() {
    echo ""
    echo "============================================"
    echo "🚀 177 Agents Orchestra 再構築"
    echo "============================================"
    echo ""
    
    phase1_setup_session
    phase2_create_panes
    phase3_start_agents
    phase4_initialize_agents
    phase5_verify
    phase6_save_config
    
    echo ""
    log_success "🎉 Orchestra 再構築完了！"
    echo ""
    echo "============================================"
    echo "📖 使用方法:"
    echo "  tmux attach -t $SESSION_NAME"
    echo ""
    echo "📋 Quick Reference:"
    echo "  .claude/agents/tmux_agents_control.md"
    echo "============================================"
}

# 引数処理
case "${1:-}" in
    --verify)
        phase5_verify
        ;;
    --restart)
        phase3_start_agents
        phase4_initialize_agents
        phase5_verify
        ;;
    *)
        main
        ;;
esac
