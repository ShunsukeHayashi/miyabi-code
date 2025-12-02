#!/bin/bash
# launch-codex-workers.sh
# Miyabi Orchestra用 Codex Worker起動スクリプト v2.0
# 
# 使用法:
#   ./scripts/launch-codex-workers.sh [command] [options]
#
# コマンド:
#   all         全Worker起動
#   codegen     CodeGen Worker起動
#   review      Review Worker起動
#   pr          PR Worker起動
#   issue       Issue Worker起動
#   script      Script Worker起動
#   stop        全Worker停止
#   status      Worker状態確認
#   help        ヘルプ表示
#
# 環境変数:
#   MIYABI_ORCHESTRA_SESSION: tmuxセッション名 (default: miyabi-orchestra)
#   CODEX_MODE: codexの実行モード (default: danger-full-access)

set -euo pipefail

# =============================================================================
# 設定
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TEMPLATE_DIR="${PROJECT_ROOT}/.codex/worker-templates"

# tmuxセッション
ORCHESTRA_SESSION="${MIYABI_ORCHESTRA_SESSION:-miyabi-orchestra}"

# Codexモード (v0.63.0確認済み)
# -s は --sandbox の短縮形で、danger-full-access は全権限モード
CODEX_MODE="${CODEX_MODE:-danger-full-access}"

# カラー出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ペインID（動的取得）
declare -a PANE_IDS
ORCHESTRATOR_PANE=""
WORKER_1_PANE=""
WORKER_2_PANE=""
WORKER_3_PANE=""
WORKER_4_PANE=""
WORKER_5_PANE=""

# =============================================================================
# ユーティリティ関数
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_debug() {
    if [[ "${DEBUG:-false}" == "true" ]]; then
        echo -e "${CYAN}[DEBUG]${NC} $1"
    fi
}

# =============================================================================
# ペインID動的取得 (P0修正)
# =============================================================================

get_pane_ids() {
    local session="${1:-$ORCHESTRA_SESSION}"
    
    # セッション存在確認
    if ! tmux has-session -t "$session" 2>/dev/null; then
        log_error "Session '$session' not found"
        log_info "Available sessions:"
        tmux list-sessions 2>/dev/null || echo "  (none)"
        exit 1
    fi
    
    # ペインID取得
    mapfile -t PANE_IDS < <(tmux list-panes -t "$session" -F '#{pane_id}')
    
    local pane_count=${#PANE_IDS[@]}
    log_debug "Found $pane_count panes in session '$session'"
    
    if [[ $pane_count -lt 2 ]]; then
        log_error "Insufficient panes: need at least 2 (1 orchestrator + 1 worker)"
        exit 1
    fi
    
    # ペイン割り当て
    ORCHESTRATOR_PANE="${PANE_IDS[0]}"
    WORKER_1_PANE="${PANE_IDS[1]:-}"
    WORKER_2_PANE="${PANE_IDS[2]:-}"
    WORKER_3_PANE="${PANE_IDS[3]:-}"
    WORKER_4_PANE="${PANE_IDS[4]:-}"
    WORKER_5_PANE="${PANE_IDS[5]:-}"
    
    log_debug "Orchestrator: $ORCHESTRATOR_PANE"
    log_debug "Worker-1: $WORKER_1_PANE"
    log_debug "Worker-2: $WORKER_2_PANE"
    log_debug "Worker-3: $WORKER_3_PANE"
    log_debug "Worker-4: $WORKER_4_PANE"
    log_debug "Worker-5: $WORKER_5_PANE"
}

# =============================================================================
# テンプレートディレクトリ準備
# =============================================================================

ensure_template_dir() {
    mkdir -p "$TEMPLATE_DIR"
}

# =============================================================================
# Worker指示テンプレート生成 (P1修正: ヒアドキュメント使用)
# =============================================================================

generate_base_instruction() {
    local orchestrator_pane="$1"
    
    cat << EOF
【Miyabi Orchestra Worker Protocol v2.0】
あなたはMiyabi OrchestraのWorkerです。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 基本ルール (PUSH型報告プロトコル)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. PUSH型報告: 作業完了時に自発的にオーケストレーターへ報告
2. 報告先: tmux send-keys -t ${orchestrator_pane} '[WORKER報告] ...' Enter
3. ブロック時: すぐに報告して待機
4. ポーリング禁止: オーケストレーターを確認しに行かない

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📢 報告フォーマット
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- 開始時: [開始] タスク名
- 進捗時: [進捗] 50% - 状況
- 完了時: [完了] 結果: ...
- ブロック時: [ブロック] 理由: ...
- 終了時: [終了] セッション終了

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 フック関数（利用可能な場合）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# フック読み込み（存在する場合のみ）
[[ -f ~/.miyabi_hooks.sh ]] && source ~/.miyabi_hooks.sh

mts 'タスク名'        # 開始報告
mpr '50%' '状況'     # 進捗報告
mtc 'タスク' '結果'   # 完了報告
mbl '理由'           # ブロック報告
mse                   # 終了報告

EOF
}

generate_worker_instruction() {
    local role="$1"
    local role_jp="$2"
    local description="$3"
    local orchestrator_pane="$4"
    
    local base_instruction
    base_instruction=$(generate_base_instruction "$orchestrator_pane")
    
    cat << EOF
${base_instruction}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 あなたの役割: ${role} Worker (${role_jp})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${description}

タスク完了後は必ず報告してください。
作業を開始できる状態です。指示をお待ちしています。
EOF
}

# =============================================================================
# Worker起動関数 (P1修正: テンプレートファイル使用)
# =============================================================================

launch_worker() {
    local pane_id="$1"
    local role="$2"
    local role_jp="$3"
    local description="$4"
    
    if [[ -z "$pane_id" ]]; then
        log_warn "Pane for ${role} Worker not available, skipping..."
        return 1
    fi
    
    log_info "Launching ${role} Worker (${role_jp}) in pane ${pane_id}..."
    
    # テンプレートファイル生成
    ensure_template_dir
    local template_file="${TEMPLATE_DIR}/${role,,}-worker.txt"
    
    generate_worker_instruction "$role" "$role_jp" "$description" "$ORCHESTRATOR_PANE" > "$template_file"
    
    log_debug "Template saved to: $template_file"
    
    # 既存プロセス停止
    tmux send-keys -t "${pane_id}" C-c 2>/dev/null || true
    sleep 0.5
    
    # Codex起動（テンプレートファイルをcat経由で渡す）
    tmux send-keys -t "${pane_id}" \
        "codex -s ${CODEX_MODE} \"\$(cat ${template_file})\"" Enter
    
    log_success "${role} Worker launched in ${pane_id}!"
    return 0
}

# =============================================================================
# 個別Worker起動
# =============================================================================

launch_codegen() {
    launch_worker "$WORKER_1_PANE" "CodeGen" "つくるーん" \
        "- コード生成・実装を担当
- 品質の高いコードを書く
- テストも含めて実装
- Git worktreeを活用した並列開発"
}

launch_review() {
    launch_worker "$WORKER_2_PANE" "Review" "めだまん" \
        "- コードレビューを担当
- 品質・セキュリティ・パフォーマンスをチェック
- 改善提案を行う
- LGTM/要修正を明確に判定"
}

launch_pr() {
    launch_worker "$WORKER_3_PANE" "PR" "はこぶーん" \
        "- Pull Request作成を担当
- 適切なタイトル・説明を作成
- レビュアーへの情報提供
- GitHub連携"
}

launch_issue() {
    launch_worker "$WORKER_4_PANE" "Issue" "みつけるーん" \
        "- Issue管理を担当
- 問題の分析・整理
- タスク分解
- ラベル付け・優先度設定"
}

launch_script() {
    launch_worker "$WORKER_5_PANE" "Script" "スクリプター" \
        "- スクリプト検証を担当
- 実行可能性チェック
- 構文エラー検出
- シェルスクリプト・Python対応"
}

launch_all() {
    log_info "🚀 Launching all workers..."
    echo ""
    
    local launched=0
    local failed=0
    
    launch_codegen && ((launched++)) || ((failed++))
    sleep 1
    launch_review && ((launched++)) || ((failed++))
    sleep 1
    launch_pr && ((launched++)) || ((failed++))
    sleep 1
    launch_issue && ((launched++)) || ((failed++))
    sleep 1
    launch_script && ((launched++)) || ((failed++))
    
    echo ""
    log_success "All workers launched! (${launched} success, ${failed} skipped)"
}

# =============================================================================
# 緊急停止
# =============================================================================

stop_all_workers() {
    log_warn "🛑 Stopping all workers..."
    
    for pane in "$WORKER_1_PANE" "$WORKER_2_PANE" "$WORKER_3_PANE" "$WORKER_4_PANE" "$WORKER_5_PANE"; do
        if [[ -n "$pane" ]]; then
            tmux send-keys -t "${pane}" C-c 2>/dev/null || true
            log_debug "Sent C-c to $pane"
        fi
    done
    
    log_success "All workers stopped!"
}

# =============================================================================
# ステータス確認
# =============================================================================

show_status() {
    log_info "📊 Worker Status"
    echo ""
    
    printf "%-12s %-8s %-20s %s\n" "ROLE" "PANE" "COMMAND" "STATUS"
    printf "%s\n" "────────────────────────────────────────────────────────"
    
    local roles=("Orchestrator" "CodeGen" "Review" "PR" "Issue" "Script")
    local panes=("$ORCHESTRATOR_PANE" "$WORKER_1_PANE" "$WORKER_2_PANE" "$WORKER_3_PANE" "$WORKER_4_PANE" "$WORKER_5_PANE")
    
    for i in "${!roles[@]}"; do
        local role="${roles[$i]}"
        local pane="${panes[$i]}"
        
        if [[ -z "$pane" ]]; then
            printf "%-12s %-8s %-20s %s\n" "$role" "-" "-" "⚪ N/A"
            continue
        fi
        
        local cmd
        cmd=$(tmux display-message -t "$pane" -p '#{pane_current_command}' 2>/dev/null || echo "?")
        
        local status="⚪ Unknown"
        case "$cmd" in
            node|codex) status="🟢 Running" ;;
            zsh|bash)   status="🟡 Idle" ;;
            *)          status="⚪ $cmd" ;;
        esac
        
        printf "%-12s %-8s %-20s %s\n" "$role" "$pane" "$cmd" "$status"
    done
    echo ""
}

# =============================================================================
# ヘルプ
# =============================================================================

show_help() {
    cat << 'EOF'
🔥 Miyabi Orchestra Codex Worker Launcher v2.0

使用法:
    ./scripts/launch-codex-workers.sh [command]

コマンド:
    all         全Worker起動 (5 workers)
    codegen     CodeGen Worker起動 (つくるーん)
    review      Review Worker起動 (めだまん)
    pr          PR Worker起動 (はこぶーん)
    issue       Issue Worker起動 (みつけるーん)
    script      Script Worker起動 (スクリプター)
    stop        全Worker停止 (C-c送信)
    status      Worker状態確認
    help        このヘルプを表示

環境変数:
    MIYABI_ORCHESTRA_SESSION  tmuxセッション名 (default: miyabi-orchestra)
    CODEX_MODE               codex実行モード (default: danger-full-access)
    DEBUG                    デバッグ出力 (true/false)

例:
    ./scripts/launch-codex-workers.sh all              # 全Worker起動
    ./scripts/launch-codex-workers.sh codegen          # CodeGenのみ起動
    ./scripts/launch-codex-workers.sh stop             # 全Worker停止
    DEBUG=true ./scripts/launch-codex-workers.sh all   # デバッグモード

ペイン構成:
    ┌─────────────────────────────────────────────────────┐
    │  Pane 0: 🎼 ORCHESTRATOR (報告受信)                  │
    ├─────────────────────────────────────────────────────┤
    │  Pane 1: ⚙️ WORKER-1 (CodeGen/つくるーん)            │
    │  Pane 2: ⚙️ WORKER-2 (Review/めだまん)               │
    │  Pane 3: ⚙️ WORKER-3 (PR/はこぶーん)                 │
    │  Pane 4: ⚙️ WORKER-4 (Issue/みつけるーん)            │
    │  Pane 5: ⚙️ WORKER-5 (Script/スクリプター)           │
    └─────────────────────────────────────────────────────┘

⚠️  注意: danger-full-accessモードは全ての承認をスキップします
    信頼できる環境でのみ使用してください。
EOF
}

# =============================================================================
# メイン
# =============================================================================

main() {
    local command="${1:-help}"
    
    # ペインID取得（help以外）
    if [[ "$command" != "help" && "$command" != "--help" && "$command" != "-h" ]]; then
        get_pane_ids
    fi
    
    case "$command" in
        all)
            launch_all
            ;;
        codegen)
            launch_codegen
            ;;
        review)
            launch_review
            ;;
        pr)
            launch_pr
            ;;
        issue)
            launch_issue
            ;;
        script)
            launch_script
            ;;
        stop)
            stop_all_workers
            ;;
        status)
            show_status
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "Unknown command: $command"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

main "$@"
