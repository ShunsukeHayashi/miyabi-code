#!/bin/bash
# ============================================
# 🌸 Miyabi DevOPS 完全自動化システム
# gman スタイル - ユーザーフレンドリーインターフェース
# ============================================
#
# 使い方: miyabi-auto [mode]
#   mode: check|execute|infinity|guide
#
# 知識がなくても、このスクリプトに従うだけで
# 正しいDevOPSプロセスが実行されます。
# ============================================

set -e

# ============================================
# 🎨 カラーとスタイル定義
# ============================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# ============================================
# 📁 パス設定
# ============================================
REPO_ROOT="${MIYABI_ROOT:-$HOME/Dev/01-miyabi/_core/miyabi-private}"
MIYABI_BIN="${REPO_ROOT}/target/release/miyabi"
PRIORITY_SCRIPT="${REPO_ROOT}/scripts/miyabi-priority-check.sh"

# バイナリ存在確認
check_miyabi_binary() {
    if [ ! -f "$MIYABI_BIN" ]; then
        echo -e "${YELLOW}⚠️  miyabi バイナリが見つかりません${NC}"
        echo ""
        echo -e "  ビルドを実行します..."
        echo ""
        cd "$REPO_ROOT"
        cargo build --release --bin miyabi
        echo ""
        echo -e "${GREEN}✅ ビルド完了${NC}"
    fi
}

# ============================================
# 📋 gman スタイルヘッダー
# ============================================
print_header() {
    clear
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                                                                  ║${NC}"
    echo -e "${CYAN}║   ${WHITE}🌸 Miyabi DevOPS 完全自動化システム${CYAN}                           ║${NC}"
    echo -e "${CYAN}║                                                                  ║${NC}"
    echo -e "${CYAN}║   ${DIM}判断不要。シーケンスに従うだけ。${CYAN}                              ║${NC}"
    echo -e "${CYAN}║                                                                  ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# ============================================
# 📊 ステップ表示
# ============================================
print_step() {
    local step_num="$1"
    local step_name="$2"
    local status="$3"

    case "$status" in
        "current")
            echo -e "  ${RED}▶ STEP ${step_num}${NC}: ${BOLD}${step_name}${NC} ${RED}← 今ここ${NC}"
            ;;
        "done")
            echo -e "  ${GREEN}✓ STEP ${step_num}${NC}: ${DIM}${step_name}${NC}"
            ;;
        "pending")
            echo -e "  ${DIM}○ STEP ${step_num}${NC}: ${DIM}${step_name}${NC}"
            ;;
    esac
}

# ============================================
# 🎯 メインメニュー
# ============================================
show_main_menu() {
    print_header

    echo -e "  ${WHITE}何をしますか？${NC}"
    echo ""
    echo -e "  ${GREEN}1)${NC} 優先順位チェック    ${DIM}- 次にやるべきタスクを確認${NC}"
    echo -e "  ${GREEN}2)${NC} 自動実行            ${DIM}- 優先タスクを自動で処理${NC}"
    echo -e "  ${GREEN}3)${NC} 無限モード          ${DIM}- 全Issue自動処理（完全自動）${NC}"
    echo -e "  ${GREEN}4)${NC} ガイドモード        ${DIM}- 手順を一つずつ案内${NC}"
    echo -e "  ${GREEN}5)${NC} ステータス確認      ${DIM}- miyabi status${NC}"
    echo -e "  ${GREEN}q)${NC} 終了"
    echo ""
    echo -n "  選択 [1-5/q]: "

    read choice

    case "$choice" in
        1) run_priority_check ;;
        2) run_auto_execute ;;
        3) run_infinity_mode ;;
        4) run_guide_mode ;;
        5) run_status ;;
        q|Q) echo ""; exit 0 ;;
        *) show_main_menu ;;
    esac
}

# ============================================
# 1️⃣ 優先順位チェック
# ============================================
run_priority_check() {
    print_header

    echo -e "  ${WHITE}🔍 優先順位をチェック中...${NC}"
    echo ""

    # 優先順位チェック実行
    result=$("$PRIORITY_SCRIPT" --json 2>/dev/null || echo '{"current_step": 99}')
    step=$(echo "$result" | jq -r '.current_step')
    action=$(echo "$result" | jq -r '.action_required')

    # ステップ表示
    echo -e "  ${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    for i in {1..8}; do
        case $i in
            1) name="承認済みPRマージ" ;;
            2) name="CIエラー修正" ;;
            3) name="P0 Critical Issue" ;;
            4) name="レビュー待ちPR" ;;
            5) name="P1 High Issue" ;;
            6) name="P2 Medium Issue" ;;
            7) name="P3 Low Issue" ;;
            8) name="技術的負債解消" ;;
        esac

        if [ "$i" -lt "$step" ]; then
            print_step "$i" "$name" "done"
        elif [ "$i" -eq "$step" ]; then
            print_step "$i" "$name" "current"
        else
            print_step "$i" "$name" "pending"
        fi
    done

    echo ""
    echo -e "  ${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    # 次のアクション提示
    if [ "$step" -eq 8 ]; then
        echo -e "  ${GREEN}✅ すべての優先タスクが完了しています！${NC}"
        echo ""
        echo -e "  技術的負債解消または新機能開発に取り組めます。"
    else
        echo -e "  ${YELLOW}💡 次のアクション:${NC}"
        echo ""
        show_next_action "$step"
    fi

    echo ""
    echo -n "  [Enter] メインメニューに戻る "
    read
    show_main_menu
}

# ============================================
# 次のアクション表示（Rust CLI統合）
# ============================================
show_next_action() {
    local step="$1"

    case "$step" in
        1)
            echo -e "  ${CYAN}承認済みPRをマージしてください:${NC}"
            echo ""
            echo -e "    ${WHITE}# 自動マージ${NC}"
            echo -e "    gh pr list --state open --search \"review:approved\" --json number --jq '.[].number' | while read pr; do"
            echo -e "        gh pr merge \$pr --merge"
            echo -e "    done"
            echo ""
            echo -e "    ${WHITE}# または miyabi infinity で自動処理${NC}"
            echo -e "    miyabi infinity --priority approved-prs"
            ;;
        2)
            echo -e "  ${CYAN}CIエラーを修正してください:${NC}"
            echo ""
            echo -e "    ${WHITE}# エラー確認${NC}"
            echo -e "    gh run list --status failure"
            echo ""
            echo -e "    ${WHITE}# デバッグスキル使用${NC}"
            echo -e "    /skill debugging-troubleshooting"
            ;;
        3|5|6|7)
            local label
            case "$step" in
                3) label="priority/critical" ;;
                5) label="priority/high" ;;
                6) label="priority/medium" ;;
                7) label="priority/low" ;;
            esac

            echo -e "  ${CYAN}Issueに取り組んでください:${NC}"
            echo ""
            echo -e "    ${WHITE}# Issue確認${NC}"
            echo -e "    gh issue list --state open --label \"$label\""
            echo ""
            echo -e "    ${WHITE}# miyabi CLIで作業開始（推奨）${NC}"
            echo -e "    issue=\$(gh issue list --state open --label \"$label\" --json number --jq '.[0].number')"
            echo -e "    miyabi work-on \$issue"
            echo ""
            echo -e "    ${WHITE}# または Agent直接実行${NC}"
            echo -e "    miyabi agent coordinator --issue \$issue"
            ;;
        4)
            echo -e "  ${CYAN}PRをレビューしてください:${NC}"
            echo ""
            echo -e "    ${WHITE}# PR一覧${NC}"
            echo -e "    gh pr list --state open --search \"review:required\""
            echo ""
            echo -e "    ${WHITE}# レビュー実行${NC}"
            echo -e "    gh pr view <pr_number>"
            echo -e "    gh pr review <pr_number> --approve"
            echo ""
            echo -e "    ${WHITE}# または ReviewAgent使用${NC}"
            echo -e "    miyabi agent review --pr <pr_number>"
            ;;
    esac
}

# ============================================
# 2️⃣ 自動実行モード
# ============================================
run_auto_execute() {
    print_header
    check_miyabi_binary

    echo -e "  ${WHITE}🚀 自動実行モード${NC}"
    echo ""

    # 優先順位チェック
    result=$("$PRIORITY_SCRIPT" --json 2>/dev/null || echo '{"current_step": 99}')
    step=$(echo "$result" | jq -r '.current_step')

    case "$step" in
        1)
            echo -e "  ${CYAN}承認済みPRを自動マージ中...${NC}"
            echo ""
            gh pr list --state open --search "review:approved" --json number --jq '.[].number' | while read pr; do
                echo -e "  マージ中: PR #$pr"
                gh pr merge "$pr" --merge
            done
            echo ""
            echo -e "  ${GREEN}✅ PRマージ完了${NC}"
            ;;
        2)
            echo -e "  ${YELLOW}⚠️ CIエラーは手動修正が必要です${NC}"
            echo ""
            echo -e "  エラー一覧:"
            gh run list --status failure --limit 5
            echo ""
            echo -e "  ${CYAN}→ /skill debugging-troubleshooting を使用してください${NC}"
            ;;
        3|5|6|7)
            local label
            case "$step" in
                3) label="priority/critical" ;;
                5) label="priority/high" ;;
                6) label="priority/medium" ;;
                7) label="priority/low" ;;
            esac

            issue=$(gh issue list --state open --label "$label" --json number --jq '.[0].number')

            if [ -n "$issue" ]; then
                echo -e "  Issue #$issue を処理中..."
                echo ""
                echo -e "  ${WHITE}miyabi work-on $issue${NC}"
                echo ""

                "$MIYABI_BIN" work-on "$issue"
            else
                echo -e "  ${YELLOW}対象Issueが見つかりません${NC}"
            fi
            ;;
        4)
            echo -e "  ${YELLOW}⚠️ PRレビューは手動確認が必要です${NC}"
            echo ""
            gh pr list --state open --search "review:required"
            echo ""
            echo -e "  ${CYAN}→ miyabi agent review --pr <number> を使用してください${NC}"
            ;;
        8)
            echo -e "  ${GREEN}✅ すべての優先タスク完了！${NC}"
            echo ""
            echo -e "  技術的負債解消に取り組みますか？"
            echo ""
            echo -e "  推奨コマンド:"
            echo -e "    /security-scan"
            echo -e "    /skill performance-analysis"
            echo -e "    /generate-docs"
            ;;
        *)
            echo -e "  ${RED}❌ エラーが発生しました${NC}"
            ;;
    esac

    echo ""
    echo -n "  [Enter] メインメニューに戻る "
    read
    show_main_menu
}

# ============================================
# 3️⃣ 無限モード
# ============================================
run_infinity_mode() {
    print_header
    check_miyabi_binary

    echo -e "  ${WHITE}♾️ 無限モード${NC}"
    echo ""
    echo -e "  ${DIM}すべてのIssueを優先順位に従って自動処理します${NC}"
    echo ""
    echo -e "  ${YELLOW}⚠️ 警告: この操作は自動でPR作成・マージを行います${NC}"
    echo ""
    echo -n "  続行しますか？ [y/N]: "

    read confirm

    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        echo ""
        echo -e "  ${CYAN}miyabi infinity を起動中...${NC}"
        echo ""
        "$MIYABI_BIN" infinity
    fi

    echo ""
    echo -n "  [Enter] メインメニューに戻る "
    read
    show_main_menu
}

# ============================================
# 4️⃣ ガイドモード（ステップバイステップ）
# ============================================
run_guide_mode() {
    print_header

    echo -e "  ${WHITE}📖 ガイドモード - ステップバイステップ案内${NC}"
    echo ""

    # 優先順位チェック
    result=$("$PRIORITY_SCRIPT" --json 2>/dev/null || echo '{"current_step": 99}')
    step=$(echo "$result" | jq -r '.current_step')

    echo -e "  ${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    case "$step" in
        1)
            echo -e "  ${RED}📋 STEP 1: 承認済みPRマージ${NC}"
            echo ""
            echo -e "  ${DIM}なぜ最優先？${NC}"
            echo -e "  → 承認済みコードは品質チェック済み"
            echo -e "  → マージしないとmainが古いまま"
            echo -e "  → 他の作業がコンフリクトしやすくなる"
            echo ""
            echo -e "  ${WHITE}実行手順:${NC}"
            echo ""
            echo -e "  ${GREEN}1.${NC} PRを確認:"
            echo -e "     gh pr list --state open --search \"review:approved\""
            echo ""
            echo -e "  ${GREEN}2.${NC} マージ実行:"
            echo -e "     gh pr merge <pr_number> --merge"
            echo ""
            echo -e "  ${GREEN}3.${NC} mainを最新化:"
            echo -e "     git checkout main && git pull origin main"
            ;;
        2)
            echo -e "  ${RED}📋 STEP 2: CIエラー修正${NC}"
            echo ""
            echo -e "  ${DIM}なぜ優先？${NC}"
            echo -e "  → CIが壊れていると新しいPRがマージできない"
            echo -e "  → チーム全体の作業が止まる"
            echo ""
            echo -e "  ${WHITE}実行手順:${NC}"
            echo ""
            echo -e "  ${GREEN}1.${NC} エラー確認:"
            echo -e "     gh run list --status failure"
            echo ""
            echo -e "  ${GREEN}2.${NC} ログ確認:"
            echo -e "     gh run view <run_id> --log"
            echo ""
            echo -e "  ${GREEN}3.${NC} デバッグ:"
            echo -e "     /skill debugging-troubleshooting"
            ;;
        3|5|6|7)
            local priority_name
            case "$step" in
                3) priority_name="P0 Critical" ;;
                5) priority_name="P1 High" ;;
                6) priority_name="P2 Medium" ;;
                7) priority_name="P3 Low" ;;
            esac

            echo -e "  ${RED}📋 STEP $step: $priority_name Issue対応${NC}"
            echo ""
            echo -e "  ${WHITE}実行手順:${NC}"
            echo ""
            echo -e "  ${GREEN}1.${NC} Issue確認:"
            echo -e "     miyabi status"
            echo ""
            echo -e "  ${GREEN}2.${NC} 作業開始 (Rust CLI使用):"
            echo -e "     miyabi work-on <issue_number>"
            echo ""
            echo -e "  ${GREEN}3.${NC} Agent実行:"
            echo -e "     miyabi agent coordinator --issue <issue_number>"
            echo ""
            echo -e "  ${GREEN}4.${NC} PR作成:"
            echo -e "     miyabi agent pr --issue <issue_number>"
            ;;
        4)
            echo -e "  ${YELLOW}📋 STEP 4: レビュー待ちPR${NC}"
            echo ""
            echo -e "  ${WHITE}実行手順:${NC}"
            echo ""
            echo -e "  ${GREEN}1.${NC} PR一覧:"
            echo -e "     gh pr list --state open --search \"review:required\""
            echo ""
            echo -e "  ${GREEN}2.${NC} レビュー実行:"
            echo -e "     miyabi agent review --pr <pr_number>"
            echo ""
            echo -e "  ${GREEN}3.${NC} 承認/コメント:"
            echo -e "     gh pr review <pr_number> --approve"
            ;;
        8)
            echo -e "  ${GREEN}📋 STEP 8: 技術的負債解消${NC}"
            echo ""
            echo -e "  ${DIM}おめでとうございます！すべての優先タスクが完了しました。${NC}"
            echo ""
            echo -e "  ${WHITE}推奨アクション:${NC}"
            echo ""
            echo -e "  ${GREEN}1.${NC} セキュリティスキャン:"
            echo -e "     /security-scan"
            echo ""
            echo -e "  ${GREEN}2.${NC} パフォーマンス分析:"
            echo -e "     /skill performance-analysis"
            echo ""
            echo -e "  ${GREEN}3.${NC} ドキュメント生成:"
            echo -e "     /generate-docs"
            echo ""
            echo -e "  ${GREEN}4.${NC} 依存関係更新:"
            echo -e "     /skill dependency-management"
            ;;
    esac

    echo ""
    echo -e "  ${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -n "  [Enter] メインメニューに戻る "
    read
    show_main_menu
}

# ============================================
# 5️⃣ ステータス確認
# ============================================
run_status() {
    print_header
    check_miyabi_binary

    echo -e "  ${WHITE}📊 Miyabi ステータス${NC}"
    echo ""

    "$MIYABI_BIN" status

    echo ""
    echo -n "  [Enter] メインメニューに戻る "
    read
    show_main_menu
}

# ============================================
# メイン処理
# ============================================
main() {
    # 引数による直接実行
    case "${1:-}" in
        check)
            check_miyabi_binary
            "$PRIORITY_SCRIPT" --verbose
            ;;
        execute)
            run_auto_execute
            ;;
        infinity)
            run_infinity_mode
            ;;
        guide)
            run_guide_mode
            ;;
        "")
            show_main_menu
            ;;
        *)
            echo "Usage: $0 [check|execute|infinity|guide]"
            exit 1
            ;;
    esac
}

main "$@"
