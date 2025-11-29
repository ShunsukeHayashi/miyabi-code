#!/bin/bash
# ============================================
# 🎭 200 Agents Orchestra スケーリングスクリプト
# ============================================
# Version: 3.0.0
# Date: 2025-11-29
# Purpose: 200エージェントへの大規模スケーリング
# ============================================

set -e

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# ログ関数
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✅]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[⚠️]${NC} $1"; }
log_error() { echo -e "${RED}[❌]${NC} $1"; }
log_progress() { echo -e "${PURPLE}[📊]${NC} $1"; }

# ============================================
# 設定
# ============================================
WORKING_DIR="$HOME/miyabi-private"
CLAUDE_CMD="claude"
TOTAL_AGENTS=200
AGENTS_PER_SESSION=20
TOTAL_SESSIONS=$((TOTAL_AGENTS / AGENTS_PER_SESSION))

# Squad定義 (10 Squads × 20 Agents = 200 Agents)
declare -A SQUAD_ROLES=(
    ["squad-1"]="CodeGen:カエデ系:コード実装"
    ["squad-2"]="Review:サクラ系:コードレビュー"
    ["squad-3"]="PR:ツバキ系:PR管理"
    ["squad-4"]="Deploy:ボタン系:デプロイ"
    ["squad-5"]="Issue:みつけるん系:Issue分析"
    ["squad-6"]="Coordinator:しきるん系:調整"
    ["squad-7"]="Summary:まとめるん系:ドキュメント"
    ["squad-8"]="Test:テストくん系:テスト実行"
    ["squad-9"]="Infra:インフラくん系:インフラ管理"
    ["squad-10"]="Business:ビジネス系:ビジネスAgent"
)

# Agent名テンプレート
AGENT_NAMES_CODEGEN=("カエデ" "モミジ" "イチョウ" "サクラ" "ウメ" "マツ" "タケ" "スギ" "ヒノキ" "クスノキ" "ケヤキ" "ナラ" "カシ" "ブナ" "シラカバ" "ポプラ" "ヤナギ" "カツラ" "トチ" "ホオノキ")
AGENT_NAMES_REVIEW=("サクラ" "コスモス" "ヒマワリ" "バラ" "ユリ" "チューリップ" "カーネーション" "ガーベラ" "アジサイ" "ラベンダー" "マーガレット" "パンジー" "スミレ" "ダリア" "カンナ" "ベゴニア" "サルビア" "ペチュニア" "インパチェンス" "マリーゴールド")

# ============================================
# Phase 1: Squad Sessions作成
# ============================================
phase1_create_squads() {
    log_info "Phase 1: $TOTAL_SESSIONS Squad Sessions 作成"
    
    for i in $(seq 1 $TOTAL_SESSIONS); do
        SESSION_NAME="orchestra-squad-$i"
        
        if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
            log_warn "既存: $SESSION_NAME"
        else
            tmux new-session -d -s "$SESSION_NAME" -c "$WORKING_DIR"
            log_success "作成: $SESSION_NAME"
        fi
    done
    
    log_success "Phase 1 完了: $TOTAL_SESSIONS Squads"
}

# ============================================
# Phase 2: 各Squadに20ペイン作成
# ============================================
phase2_create_panes() {
    log_info "Phase 2: 各Squadに $AGENTS_PER_SESSION ペイン作成"
    
    for i in $(seq 1 $TOTAL_SESSIONS); do
        SESSION_NAME="orchestra-squad-$i"
        log_progress "設定中: $SESSION_NAME"
        
        # 現在のペイン数確認
        CURRENT_PANES=$(tmux list-panes -t "$SESSION_NAME" 2>/dev/null | wc -l)
        NEEDED=$AGENTS_PER_SESSION
        
        while [ "$CURRENT_PANES" -lt "$NEEDED" ]; do
            if [ $((CURRENT_PANES % 2)) -eq 0 ]; then
                tmux split-window -t "$SESSION_NAME" -h -c "$WORKING_DIR" 2>/dev/null || true
            else
                tmux split-window -t "$SESSION_NAME" -v -c "$WORKING_DIR" 2>/dev/null || true
            fi
            CURRENT_PANES=$((CURRENT_PANES + 1))
            
            # レイアウト調整 (5ペインごと)
            if [ $((CURRENT_PANES % 5)) -eq 0 ]; then
                tmux select-layout -t "$SESSION_NAME" tiled 2>/dev/null || true
            fi
        done
        
        # 最終レイアウト調整
        tmux select-layout -t "$SESSION_NAME" tiled 2>/dev/null || true
        log_success "$SESSION_NAME: $CURRENT_PANES ペイン"
    done
    
    log_success "Phase 2 完了: 合計 $((TOTAL_SESSIONS * AGENTS_PER_SESSION)) ペイン"
}

# ============================================
# Phase 3: 全Agentに Claude Code 起動
# ============================================
phase3_start_agents() {
    log_info "Phase 3: $TOTAL_AGENTS Agents 起動"
    
    STARTED=0
    
    for i in $(seq 1 $TOTAL_SESSIONS); do
        SESSION_NAME="orchestra-squad-$i"
        log_progress "起動中: $SESSION_NAME"
        
        # 全ペインにClaude Code起動
        PANE_IDS=($(tmux list-panes -t "$SESSION_NAME" -F "#{pane_id}"))
        
        for PANE_ID in "${PANE_IDS[@]}"; do
            tmux send-keys -t "$PANE_ID" "cd '$WORKING_DIR' && $CLAUDE_CMD"
            sleep 0.2
            tmux send-keys -t "$PANE_ID" Enter &
            STARTED=$((STARTED + 1))
            
            # 10エージェントごとに進捗表示
            if [ $((STARTED % 10)) -eq 0 ]; then
                log_progress "進捗: $STARTED / $TOTAL_AGENTS"
            fi
        done
        
        wait
    done
    
    log_success "Phase 3 完了: $STARTED Agents 起動"
}

# ============================================
# Phase 4: Agent初期化・ロール割り当て
# ============================================
phase4_initialize_agents() {
    log_info "Phase 4: Agent初期化 (60秒待機後)"
    sleep 60
    
    INITIALIZED=0
    
    for i in $(seq 1 $TOTAL_SESSIONS); do
        SESSION_NAME="orchestra-squad-$i"
        SQUAD_ROLE="${SQUAD_ROLES[squad-$i]}"
        ROLE_TYPE=$(echo "$SQUAD_ROLE" | cut -d: -f1)
        ROLE_NAME=$(echo "$SQUAD_ROLE" | cut -d: -f2)
        ROLE_DESC=$(echo "$SQUAD_ROLE" | cut -d: -f3)
        
        log_progress "初期化中: $SESSION_NAME ($ROLE_NAME)"
        
        PANE_IDS=($(tmux list-panes -t "$SESSION_NAME" -F "#{pane_id}"))
        AGENT_NUM=1
        
        for PANE_ID in "${PANE_IDS[@]}"; do
            AGENT_NAME="${ROLE_NAME}-${AGENT_NUM}"
            
            tmux send-keys -t "$PANE_ID" "あなたは「$AGENT_NAME」です。$ROLE_DESCを担当する${ROLE_TYPE}Agentです。[$AGENT_NAME] Squad-$i 準備OK！ と発言してください。"
            sleep 0.3
            tmux send-keys -t "$PANE_ID" Enter
            
            INITIALIZED=$((INITIALIZED + 1))
            AGENT_NUM=$((AGENT_NUM + 1))
        done
        
        log_success "$SESSION_NAME: $((AGENT_NUM - 1)) Agents 初期化"
    done
    
    log_success "Phase 4 完了: $INITIALIZED Agents 初期化"
}

# ============================================
# Phase 5: Conductor設定
# ============================================
phase5_setup_conductor() {
    log_info "Phase 5: Conductor (司令塔) 設定"
    
    # メインConductorセッション作成
    if ! tmux has-session -t "orchestra-conductor" 2>/dev/null; then
        tmux new-session -d -s "orchestra-conductor" -c "$WORKING_DIR"
    fi
    
    # Conductor初期化
    tmux send-keys -t "orchestra-conductor" "cd '$WORKING_DIR' && $CLAUDE_CMD"
    sleep 0.5
    tmux send-keys -t "orchestra-conductor" Enter
    sleep 30
    
    tmux send-keys -t "orchestra-conductor" "あなたは「総司令官」です。200 Agents Orchestraの最高指揮官として、10個のSquadを統括します。[総司令官] 200 Agents Orchestra 統括準備完了！ と発言してください。"
    sleep 0.5
    tmux send-keys -t "orchestra-conductor" Enter
    
    log_success "Phase 5 完了: Conductor 設定"
}

# ============================================
# Phase 6: 状態確認
# ============================================
phase6_verify() {
    log_info "Phase 6: 状態確認"
    
    echo ""
    echo "============================================"
    echo "🎭 200 Agents Orchestra 状態"
    echo "============================================"
    
    TOTAL_PANES=0
    
    # Conductor
    if tmux has-session -t "orchestra-conductor" 2>/dev/null; then
        echo -e "${GREEN}✅${NC} orchestra-conductor: Active"
    fi
    
    # Squads
    for i in $(seq 1 $TOTAL_SESSIONS); do
        SESSION_NAME="orchestra-squad-$i"
        SQUAD_ROLE="${SQUAD_ROLES[squad-$i]}"
        
        if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
            PANE_COUNT=$(tmux list-panes -t "$SESSION_NAME" | wc -l)
            TOTAL_PANES=$((TOTAL_PANES + PANE_COUNT))
            echo -e "${GREEN}✅${NC} $SESSION_NAME: $PANE_COUNT agents ($SQUAD_ROLE)"
        else
            echo -e "${RED}❌${NC} $SESSION_NAME: Not found"
        fi
    done
    
    echo "============================================"
    echo "📊 合計: $TOTAL_PANES / $TOTAL_AGENTS Agents"
    echo "============================================"
}

# ============================================
# Phase 7: 設定保存
# ============================================
phase7_save_config() {
    log_info "Phase 7: 設定保存"
    
    CONFIG_FILE="$WORKING_DIR/.ai/orchestra-200-config-$(date +%Y%m%d-%H%M%S).json"
    
    cat > "$CONFIG_FILE" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "version": "3.0.0",
  "total_agents": $TOTAL_AGENTS,
  "total_sessions": $TOTAL_SESSIONS,
  "agents_per_session": $AGENTS_PER_SESSION,
  "squads": {
    "squad-1": {"role": "CodeGen", "name": "カエデ系", "desc": "コード実装"},
    "squad-2": {"role": "Review", "name": "サクラ系", "desc": "コードレビュー"},
    "squad-3": {"role": "PR", "name": "ツバキ系", "desc": "PR管理"},
    "squad-4": {"role": "Deploy", "name": "ボタン系", "desc": "デプロイ"},
    "squad-5": {"role": "Issue", "name": "みつけるん系", "desc": "Issue分析"},
    "squad-6": {"role": "Coordinator", "name": "しきるん系", "desc": "調整"},
    "squad-7": {"role": "Summary", "name": "まとめるん系", "desc": "ドキュメント"},
    "squad-8": {"role": "Test", "name": "テストくん系", "desc": "テスト実行"},
    "squad-9": {"role": "Infra", "name": "インフラくん系", "desc": "インフラ管理"},
    "squad-10": {"role": "Business", "name": "ビジネス系", "desc": "ビジネスAgent"}
  },
  "conductor": "orchestra-conductor",
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
    echo "🚀 200 Agents Orchestra スケーリング"
    echo "============================================"
    echo "Target: $TOTAL_AGENTS Agents"
    echo "Sessions: $TOTAL_SESSIONS Squads"
    echo "Agents/Session: $AGENTS_PER_SESSION"
    echo "============================================"
    echo ""
    
    phase1_create_squads
    phase2_create_panes
    phase3_start_agents
    phase4_initialize_agents
    phase5_setup_conductor
    phase6_verify
    phase7_save_config
    
    echo ""
    log_success "🎉 200 Agents Orchestra スケーリング完了！"
    echo ""
    echo "============================================"
    echo "📖 使用方法:"
    echo "  tmux attach -t orchestra-conductor  # 司令塔"
    echo "  tmux attach -t orchestra-squad-1    # Squad 1"
    echo ""
    echo "📊 状態確認:"
    echo "  ./scripts/orchestra-scale-200.sh --verify"
    echo "============================================"
}

# Quick verify
quick_verify() {
    echo "=== 200 Agents Orchestra Quick Status ==="
    tmux list-sessions -F "#{session_name}: #{session_windows} windows" | grep -E "^orchestra"
    echo ""
    TOTAL=$(tmux list-sessions -F "#{session_name}" | grep -E "^orchestra-squad" | while read s; do tmux list-panes -t "$s" | wc -l; done | paste -sd+ | bc)
    echo "Total Agents: $TOTAL / $TOTAL_AGENTS"
}

# 引数処理
case "${1:-}" in
    --verify)
        phase6_verify
        ;;
    --quick)
        quick_verify
        ;;
    --restart)
        phase3_start_agents
        phase4_initialize_agents
        phase6_verify
        ;;
    --conductor-only)
        phase5_setup_conductor
        ;;
    *)
        main
        ;;
esac
