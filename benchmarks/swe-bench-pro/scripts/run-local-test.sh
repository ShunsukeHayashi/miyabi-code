#!/bin/bash
# ローカルSWE-bench Pro評価テストスクリプト
#
# 使用方法: ./scripts/run-local-test.sh [インスタンス数] [並列度]
# 例: ./scripts/run-local-test.sh 5 1

set -e

# デフォルト設定
INSTANCE_LIMIT="${1:-5}"
MAX_WORKERS="${2:-1}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_ID="miyabi-local-$(date +%Y%m%d-%H%M%S)"

echo "════════════════════════════════════════════════════════════"
echo "🧪 SWE-bench Pro ローカル評価テスト"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "設定:"
echo "  - インスタンス数: ${INSTANCE_LIMIT}"
echo "  - 並列度: ${MAX_WORKERS}"
echo "  - Run ID: ${RUN_ID}"
echo "  - プロジェクトルート: ${PROJECT_ROOT}"
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Phase 1: 環境チェック
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo "📋 Phase 1: 環境チェック"
echo ""

# Python 3.11+ チェック
if ! command -v python3.11 &> /dev/null; then
    echo "❌ Python 3.11が見つかりません"
    echo "  インストール: brew install python@3.11"
    exit 1
fi
PYTHON_VERSION=$(python3.11 --version | awk '{print $2}')
echo "  ✅ Python: ${PYTHON_VERSION}"

# Docker チェック
if ! command -v docker &> /dev/null; then
    echo "❌ Dockerが見つかりません"
    exit 1
fi
if ! docker info &> /dev/null; then
    echo "❌ Dockerが起動していません"
    exit 1
fi
echo "  ✅ Docker: 実行中"

# Cargo/Rust チェック
if ! command -v cargo &> /dev/null; then
    echo "❌ Rustが見つかりません"
    exit 1
fi
RUST_VERSION=$(cargo --version | awk '{print $2}')
echo "  ✅ Rust: ${RUST_VERSION}"

# ストレージチェック (macOS互換)
AVAILABLE_GB=$(df -g "${PROJECT_ROOT}" | awk 'NR==2 {print $4}')
if [ -n "${AVAILABLE_GB}" ] && [ "${AVAILABLE_GB}" -lt 50 ]; then
    echo "⚠️  警告: 空きストレージが ${AVAILABLE_GB}GB です（推奨: 120GB以上）"
fi
echo "  ℹ️  空きストレージ: ${AVAILABLE_GB}GB"

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Phase 2: SWE-bench 公式ハーネス確認・インストール
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo "📦 Phase 2: SWE-bench 公式ハーネス確認"
echo ""

if ! python3.11 -c "import swebench" &> /dev/null; then
    echo "⚠️  SWE-bench公式ハーネスがインストールされていません"
    echo ""
    read -p "今すぐインストールしますか？ [y/N]: " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📥 SWE-benchをインストール中..."
        TEMP_DIR=$(mktemp -d)
        git clone --depth 1 https://github.com/princeton-nlp/SWE-bench.git "${TEMP_DIR}/SWE-bench"
        cd "${TEMP_DIR}/SWE-bench"
        python3.11 -m pip install -e .
        cd "${PROJECT_ROOT}"
        rm -rf "${TEMP_DIR}"
        echo "  ✅ インストール完了"
    else
        echo "❌ SWE-bench公式ハーネスが必要です。以下でインストールしてください:"
        echo ""
        echo "  git clone https://github.com/princeton-nlp/SWE-bench.git"
        echo "  cd SWE-bench"
        echo "  python3.11 -m pip install -e ."
        echo ""
        exit 1
    fi
else
    echo "  ✅ SWE-bench公式ハーネス: インストール済み"
fi

# 公式ハーネス動作確認
if ! python3.11 -m swebench.harness.run_evaluation --help &> /dev/null; then
    echo "❌ 公式ハーネスが正しく動作しません"
    exit 1
fi
echo "  ✅ 公式ハーネス: 動作確認OK"

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Phase 3: データセット確認
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo "📊 Phase 3: データセット確認"
echo ""

DATASET_PATH="${PROJECT_ROOT}/data/swebench_pro.json"

if [ ! -f "${DATASET_PATH}" ]; then
    echo "⚠️  データセットが見つかりません: ${DATASET_PATH}"
    echo "📥 データセットをダウンロード中..."
    python3.11 "${PROJECT_ROOT}/scripts/download_dataset.py"
fi

if [ -f "${DATASET_PATH}" ]; then
    DATASET_SIZE=$(wc -l < "${DATASET_PATH}")
    echo "  ✅ データセット: ${DATASET_SIZE} 行"
else
    echo "❌ データセットのダウンロードに失敗しました"
    exit 1
fi

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Phase 4: Miyabi ビルド
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo "🔨 Phase 4: Miyabi ビルド"
echo ""

cd "${PROJECT_ROOT}/../.."
echo "  ℹ️  ビルド中... (初回は5-10分かかります)"
cargo build --release --package miyabi-benchmark 2>&1 | grep -E "(Compiling|Finished|error)" || true

if [ ! -f "target/release/libmiyabi_benchmark.rlib" ]; then
    echo "❌ ビルドに失敗しました"
    exit 1
fi

echo "  ✅ Miyabi ビルド完了"
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Phase 5: Predictions 生成（プレースホルダー）
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo "🤖 Phase 5: Predictions 生成"
echo ""

OUTPUT_DIR="${PROJECT_ROOT}/output"
mkdir -p "${OUTPUT_DIR}"
PREDICTIONS_FILE="${OUTPUT_DIR}/predictions.jsonl"

echo "  ⚠️  注意: 現在はプレースホルダーのPredictionsを生成します"
echo "  ℹ️  実際のパッチ生成は未実装のため、空のパッチで動作確認します"
echo ""

# プレースホルダー Predictions 生成
cat > "${PREDICTIONS_FILE}" << 'EOF'
{"instance_id":"django__django-11039","model_name_or_path":"miyabi-v1.0.0","model_patch":""}
{"instance_id":"django__django-11815","model_name_or_path":"miyabi-v1.0.0","model_patch":""}
{"instance_id":"django__django-12453","model_name_or_path":"miyabi-v1.0.0","model_patch":""}
{"instance_id":"matplotlib__matplotlib-23964","model_name_or_path":"miyabi-v1.0.0","model_patch":""}
{"instance_id":"pytest-dev__pytest-5221","model_name_or_path":"miyabi-v1.0.0","model_patch":""}
EOF

PREDICTIONS_COUNT=$(wc -l < "${PREDICTIONS_FILE}")
echo "  ✅ Predictions 生成完了: ${PREDICTIONS_COUNT} 件"
echo "  📄 ファイル: ${PREDICTIONS_FILE}"
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Phase 6: 公式ハーネス実行
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo "🚀 Phase 6: SWE-bench 公式ハーネス実行"
echo ""
echo "  ⏱️  想定時間: ${PREDICTIONS_COUNT}インスタンス × 10分/件 = 約$((PREDICTIONS_COUNT * 10))分"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "公式ハーネス実行開始"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

START_TIME=$(date +%s)

# 公式ハーネス実行
python3.11 -m swebench.harness.run_evaluation \
    --predictions_path "${PREDICTIONS_FILE}" \
    --max_workers "${MAX_WORKERS}" \
    --run_id "${RUN_ID}" \
    2>&1 | tee "${OUTPUT_DIR}/evaluation.log"

HARNESS_EXIT_CODE=$?
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "公式ハーネス実行完了"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  ⏱️  実行時間: ${MINUTES}分${SECONDS}秒"

if [ $HARNESS_EXIT_CODE -ne 0 ]; then
    echo "  ❌ 公式ハーネスの実行に失敗しました (exit code: ${HARNESS_EXIT_CODE})"
    echo "  📄 ログ: ${OUTPUT_DIR}/evaluation.log"
    exit 1
fi

echo "  ✅ 公式ハーネス実行成功"
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Phase 7: 結果確認
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo "📊 Phase 7: 評価結果"
echo ""

RESULTS_DIR="evaluation_results/${RUN_ID}"

if [ -d "${RESULTS_DIR}" ]; then
    echo "  📂 結果ディレクトリ: ${RESULTS_DIR}"
    echo ""

    if [ -f "${RESULTS_DIR}/results.json" ]; then
        echo "  📄 results.json:"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        cat "${RESULTS_DIR}/results.json" | python3.11 -m json.tool 2>/dev/null || cat "${RESULTS_DIR}/results.json"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    else
        echo "  ⚠️  results.json が見つかりません"
    fi

    echo ""
    echo "  📁 生成されたファイル:"
    find "${RESULTS_DIR}" -type f | head -20
else
    echo "  ❌ 結果ディレクトリが見つかりません: ${RESULTS_DIR}"
fi

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Phase 8: サマリー
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo "════════════════════════════════════════════════════════════"
echo "✅ ローカル評価テスト完了"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📁 生成されたファイル:"
echo "  - Predictions: ${PREDICTIONS_FILE}"
echo "  - Evaluation Log: ${OUTPUT_DIR}/evaluation.log"
echo "  - Results: ${RESULTS_DIR}/"
echo ""
echo "📊 次のステップ:"
echo "  1. 結果を確認: cat ${RESULTS_DIR}/results.json"
echo "  2. ログを確認: cat ${OUTPUT_DIR}/evaluation.log"
echo "  3. より多くのインスタンスでテスト: ./scripts/run-local-test.sh 10 2"
echo ""
echo "════════════════════════════════════════════════════════════"
