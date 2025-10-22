#!/bin/bash
#
# GitHub Actions ワークフローを self-hosted runners に移行するスクリプト
#
# 使用方法:
#   ./migrate-workflows-to-self-hosted.sh [--dry-run]
#
# オプション:
#   --dry-run: 実際には変更せず、変更内容のみ表示

set -e

# カラー出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Dry-runモードチェック
DRY_RUN=false
if [[ "$1" == "--dry-run" ]]; then
    DRY_RUN=true
    echo_warn "Dry-run mode: 実際の変更は行いません"
fi

# プロジェクトルート確認
if [[ ! -d ".github/workflows" ]]; then
    echo_error ".github/workflows ディレクトリが見つかりません"
    echo_error "プロジェクトルートで実行してください"
    exit 1
fi

echo ""
echo "=========================================="
echo "  GitHub Actions Workflow Migration"
echo "  to Self-Hosted Runners"
echo "=========================================="
echo ""

# Priority 1ワークフロー定義（連想配列を使わない）
WORKFLOWS=(
    "security-audit.yml:miyabi-light"
    "integrated-system-ci.yml:miyabi-light"
    "codeql.yml:miyabi-light"
    "cargo-insta-review.yml:miyabi-light"
)

# バックアップディレクトリ作成
BACKUP_DIR=".github/workflows/.backup-$(date +%Y%m%d-%H%M%S)"
if [[ "$DRY_RUN" == "false" ]]; then
    mkdir -p "$BACKUP_DIR"
    echo_info "バックアップディレクトリ: $BACKUP_DIR"
fi

# 各ワークフローを処理
for entry in "${WORKFLOWS[@]}"; do
    workflow="${entry%%:*}"
    RUNNER_LABEL="${entry##*:}"
    WORKFLOW_PATH=".github/workflows/$workflow"

    echo ""
    echo_step "処理中: $workflow → Runner: $RUNNER_LABEL"

    # ファイル存在確認
    if [[ ! -f "$WORKFLOW_PATH" ]]; then
        echo_warn "ファイルが見つかりません: $WORKFLOW_PATH"
        continue
    fi

    # バックアップ
    if [[ "$DRY_RUN" == "false" ]]; then
        cp "$WORKFLOW_PATH" "$BACKUP_DIR/$workflow"
        echo_info "バックアップ作成: $BACKUP_DIR/$workflow"
    fi

    # 変更内容を表示
    echo_info "変更内容:"

    # ubuntu-latest を self-hosted に置換
    if grep -q "runs-on: ubuntu-latest" "$WORKFLOW_PATH"; then
        echo "  runs-on: ubuntu-latest"
        echo "  → runs-on: [self-hosted, macOS, arm64, $RUNNER_LABEL]"

        if [[ "$DRY_RUN" == "false" ]]; then
            # macOS/Linuxで動作する sed コマンド
            if [[ "$OSTYPE" == "darwin"* ]]; then
                # macOS
                sed -i '' "s/runs-on: ubuntu-latest/runs-on: [self-hosted, macOS, arm64, $RUNNER_LABEL]/g" "$WORKFLOW_PATH"
            else
                # Linux
                sed -i "s/runs-on: ubuntu-latest/runs-on: [self-hosted, macOS, arm64, $RUNNER_LABEL]/g" "$WORKFLOW_PATH"
            fi
            echo_info "✅ 変更完了"
        else
            echo_warn "[Dry-run] 変更はスキップされました"
        fi
    else
        echo_warn "ubuntu-latest が見つかりません（既に移行済み?）"
    fi

    # ${{ vars.RUNNER_TYPE }} を self-hosted に置換
    if grep -q "\${{ vars.RUNNER_TYPE \|\| 'ubuntu-latest' }}" "$WORKFLOW_PATH"; then
        echo "  runs-on: \${{ vars.RUNNER_TYPE || 'ubuntu-latest' }}"
        echo "  → runs-on: [self-hosted, macOS, arm64, $RUNNER_LABEL]"

        if [[ "$DRY_RUN" == "false" ]]; then
            if [[ "$OSTYPE" == "darwin"* ]]; then
                # macOS
                sed -i '' "s/runs-on: \${{ vars.RUNNER_TYPE || 'ubuntu-latest' }}/runs-on: [self-hosted, macOS, arm64, $RUNNER_LABEL]/g" "$WORKFLOW_PATH"
            else
                # Linux
                sed -i "s/runs-on: \${{ vars.RUNNER_TYPE || 'ubuntu-latest' }}/runs-on: [self-hosted, macOS, arm64, $RUNNER_LABEL]/g" "$WORKFLOW_PATH"
            fi
            echo_info "✅ 変更完了"
        else
            echo_warn "[Dry-run] 変更はスキップされました"
        fi
    fi
done

echo ""
echo "=========================================="
if [[ "$DRY_RUN" == "false" ]]; then
    echo_info "✅ 移行完了！"
    echo ""
    echo "バックアップ: $BACKUP_DIR"
    echo ""
    echo "次のステップ:"
    echo "  1. 変更内容を確認: git diff .github/workflows"
    echo "  2. テスト実行: git push"
    echo "  3. GitHub Actionsで実行確認"
    echo "  4. 問題があればロールバック: cp $BACKUP_DIR/* .github/workflows/"
else
    echo_info "✅ Dry-run完了（実際の変更なし）"
    echo ""
    echo "実際に移行する場合:"
    echo "  ./migrate-workflows-to-self-hosted.sh"
fi
echo "=========================================="
echo ""

# 変更ファイル一覧表示
if [[ "$DRY_RUN" == "false" ]]; then
    echo_info "変更されたファイル:"
    for entry in "${WORKFLOWS[@]}"; do
        workflow="${entry%%:*}"
        if [[ -f ".github/workflows/$workflow" ]]; then
            echo "  - .github/workflows/$workflow"
        fi
    done
fi

echo ""
