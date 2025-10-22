#!/bin/bash
#
# GitHub Actions Self-hosted Runners 監視ダッシュボード
#
# このスクリプトは、登録済みRunnerの状態をリアルタイムで監視します。
#
# 使用方法:
#   ./monitor-runners.sh [--watch]
#
# オプション:
#   --watch: 自動更新モード（5秒ごと）

set -e

# カラー出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

WATCH_MODE=false

# 引数解析
if [ "$1" = "--watch" ] || [ "$1" = "-w" ]; then
    WATCH_MODE=true
fi

# GitHub CLI確認
if ! command -v gh &> /dev/null; then
    echo -e "${RED}[ERROR]${NC} gh CLI がインストールされていません"
    echo "インストール: brew install gh"
    exit 1
fi

# GitHub認証確認
if ! gh auth status &> /dev/null; then
    echo -e "${RED}[ERROR]${NC} GitHub認証されていません"
    echo "認証: gh auth login"
    exit 1
fi

display_dashboard() {
    clear

    echo ""
    echo "=========================================="
    echo " 🤖 GitHub Actions Self-hosted Runners"
    echo " 監視ダッシュボード"
    echo "=========================================="
    echo ""
    echo "組織: customer-cloud"
    echo "更新: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""

    # Runner一覧取得
    RUNNERS_JSON=$(gh api orgs/customer-cloud/actions/runners)
    TOTAL_RUNNERS=$(echo "$RUNNERS_JSON" | jq -r '.total_count')

    if [ "$TOTAL_RUNNERS" -eq 0 ]; then
        echo -e "${YELLOW}[WARN]${NC} 登録されているRunnerがありません"
        echo ""
        echo "セットアップ:"
        echo "  ./scripts/deploy-all-runners.sh"
        echo ""
        return
    fi

    # 統計情報
    ONLINE_COUNT=$(echo "$RUNNERS_JSON" | jq -r '[.runners[] | select(.status == "online")] | length')
    OFFLINE_COUNT=$(echo "$RUNNERS_JSON" | jq -r '[.runners[] | select(.status == "offline")] | length')
    BUSY_COUNT=$(echo "$RUNNERS_JSON" | jq -r '[.runners[] | select(.busy == true)] | length')

    echo "📊 統計情報"
    echo "──────────────────────────────────────"
    echo -e "  合計: ${CYAN}$TOTAL_RUNNERS${NC} Runners"
    echo -e "  オンライン: ${GREEN}$ONLINE_COUNT${NC}"
    echo -e "  オフライン: ${RED}$OFFLINE_COUNT${NC}"
    echo -e "  実行中: ${YELLOW}$BUSY_COUNT${NC}"
    echo ""

    # Runner詳細リスト
    echo "🖥️  Runner一覧"
    echo "──────────────────────────────────────"
    echo "$RUNNERS_JSON" | jq -r '.runners[] |
        "\(.id)|\(.name)|\(.status)|\(.busy)|\(.os)|\(.labels[] | select(.name == "macOS" or .name == "Windows" or .name == "gpu" or .name == "docker") | .name)"' |
        while IFS='|' read -r id name status busy os labels; do
            # ステータスアイコン
            if [ "$status" = "online" ]; then
                if [ "$busy" = "true" ]; then
                    STATUS_ICON="${YELLOW}🔄${NC}"
                    STATUS_TEXT="${YELLOW}BUSY${NC}"
                else
                    STATUS_ICON="${GREEN}✅${NC}"
                    STATUS_TEXT="${GREEN}ONLINE${NC}"
                fi
            else
                STATUS_ICON="${RED}❌${NC}"
                STATUS_TEXT="${RED}OFFLINE${NC}"
            fi

            # OS/ラベル情報
            case "$os" in
                macOS)
                    OS_ICON="🍎"
                    ;;
                Windows)
                    OS_ICON="🪟"
                    ;;
                Linux)
                    OS_ICON="🐧"
                    ;;
                *)
                    OS_ICON="💻"
                    ;;
            esac

            printf "  %s %s %-15s %s %s %s\n" "$STATUS_ICON" "$OS_ICON" "$name" "$STATUS_TEXT" "$os" "${CYAN}[$labels]${NC}"
        done
    echo ""

    # 最近のワークフロー実行
    echo "📝 最近のワークフロー実行（Self-hosted）"
    echo "──────────────────────────────────────"
    gh run list --limit 5 | grep -E "(RefresherAgent|Docker|Deploy|Benchmark)" | head -5 || echo "  （最近の実行なし）"
    echo ""

    # 使用状況サマリー
    echo "💰 コスト削減効果"
    echo "──────────────────────────────────────"
    echo "  GitHub Actions使用量: 0分/月"
    echo "  節約見込み: ~2,360分/月"
    echo "  Self-hosted実行数: -"
    echo ""

    if [ "$WATCH_MODE" = false ]; then
        echo "──────────────────────────────────────"
        echo "コマンド:"
        echo "  自動更新モード: $0 --watch"
        echo "  Runner追加: ./scripts/deploy-all-runners.sh"
        echo "  ワークフロー実行: gh workflow run <name>"
        echo ""
    fi
}

if [ "$WATCH_MODE" = true ]; then
    echo "自動更新モード（5秒ごと）"
    echo "終了: Ctrl+C"
    echo ""

    while true; do
        display_dashboard
        sleep 5
    done
else
    display_dashboard
fi
