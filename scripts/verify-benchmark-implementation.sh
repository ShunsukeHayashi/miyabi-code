#!/bin/bash
# ベンチマーク実装検証スクリプト
#
# 目的: ベンチマーク実装が公式プロトコルに準拠しているか検証
# 使用: ./scripts/verify-benchmark-implementation.sh [benchmark-name]

set -e

BENCHMARK_NAME="${1:-unknown}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🔍 ベンチマーク実装検証: ${BENCHMARK_NAME}"
echo ""

# チェック項目
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

check_pass() {
    echo "  ✅ $1"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
}

check_fail() {
    echo "  ❌ $1"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
}

check_warn() {
    echo "  ⚠️  $1"
    CHECKS_WARNING=$((CHECKS_WARNING + 1))
}

# Phase 1: チェックリスト存在確認
echo "Phase 1: チェックリスト確認"
if [ -f "${PROJECT_ROOT}/.claude/BENCHMARK_IMPLEMENTATION_CHECKLIST.md" ]; then
    check_pass "チェックリスト存在"
else
    check_fail "チェックリスト不在"
fi
echo ""

# Phase 2: ドキュメント確認
echo "Phase 2: ドキュメント確認"

# README.mdに公式リポジトリへの言及があるか
if grep -q "https://github.com" "benchmarks/${BENCHMARK_NAME}/README.md" 2>/dev/null; then
    check_pass "公式リポジトリ記載あり"
else
    check_warn "公式リポジトリ記載なし"
fi

# Docker関連ファイルの存在
if [ -f "benchmarks/${BENCHMARK_NAME}/Dockerfile" ] || [ -f "benchmarks/${BENCHMARK_NAME}/docker-compose.yml" ]; then
    check_pass "Docker設定存在"
else
    check_warn "Docker設定なし（意図的でない場合は要確認）"
fi
echo ""

# Phase 3: 実装コード確認
echo "Phase 3: 実装コード確認"

# 公式ハーネス呼び出しの有無
if grep -r "run_evaluation" "crates/miyabi-benchmark/" 2>/dev/null | grep -q "${BENCHMARK_NAME}"; then
    check_pass "公式ハーネス使用の痕跡あり"
else
    check_warn "公式ハーネス使用の痕跡なし（独自実装の可能性）"
fi

# Docker呼び出しの有無
if grep -r "docker" "crates/miyabi-benchmark/" 2>/dev/null | grep -q "${BENCHMARK_NAME}"; then
    check_pass "Docker使用の痕跡あり"
else
    check_warn "Docker使用の痕跡なし"
fi
echo ""

# Phase 4: 結果サマリー
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "検証結果サマリー"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Pass:    ${CHECKS_PASSED}"
echo "  ❌ Fail:    ${CHECKS_FAILED}"
echo "  ⚠️  Warning: ${CHECKS_WARNING}"
echo ""

if [ ${CHECKS_FAILED} -gt 0 ]; then
    echo "🚨 検証失敗: ${CHECKS_FAILED} 項目が基準を満たしていません"
    echo ""
    echo "対応が必要な項目:"
    echo "  1. チェックリストの確認"
    echo "  2. 公式プロトコルとの照合"
    echo "  3. ドキュメントの整備"
    exit 1
fi

if [ ${CHECKS_WARNING} -gt 0 ]; then
    echo "⚠️  警告あり: ${CHECKS_WARNING} 項目を確認してください"
    echo ""
    echo "確認推奨項目:"
    echo "  - 公式ハーネスの使用を検討"
    echo "  - Docker統合の検討"
    echo "  - ドキュメントの充実"
    exit 2
fi

echo "✅ 検証成功: 全項目合格"
exit 0
