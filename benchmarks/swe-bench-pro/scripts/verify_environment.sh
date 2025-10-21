#!/bin/bash
set -euo pipefail

# SWE-bench Pro環境検証スクリプト
# このスクリプトは、評価環境が正しくセットアップされているかを検証します。

echo "🔍 SWE-bench Pro環境検証を開始..."
echo ""

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 検証結果カウンター
PASSED=0
FAILED=0

# 検証関数
check_command() {
    local cmd=$1
    local name=$2

    if command -v "$cmd" &> /dev/null; then
        echo -e "${GREEN}✅ $name: インストール済み${NC}"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}❌ $name: 見つかりません${NC}"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# 1. Docker検証
echo "📦 1. Docker環境の検証..."
if check_command docker "Docker"; then
    DOCKER_VERSION=$(docker --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    echo "   バージョン: $DOCKER_VERSION"

    # Docker Compose検証
    if check_command docker-compose "Docker Compose" || docker compose version &> /dev/null; then
        echo -e "${GREEN}   Docker Compose利用可能${NC}"
    fi

    # Dockerイメージ確認
    echo "   公式イメージ確認中..."
    if docker image inspect scaleai/swebench-pro:latest &> /dev/null; then
        echo -e "${GREEN}   ✅ scaleai/swebench-pro:latest - 取得済み${NC}"
    else
        echo -e "${YELLOW}   ⚠️  scaleai/swebench-pro:latest - 未取得${NC}"
        echo "      取得コマンド: docker pull scaleai/swebench-pro:latest"
    fi
fi
echo ""

# 2. Modal検証
echo "🚀 2. Modal環境の検証..."
if check_command modal "Modal CLI"; then
    MODAL_VERSION=$(modal --version 2>&1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' || echo "不明")
    echo "   バージョン: $MODAL_VERSION"

    # Modal認証確認
    if [ -f "$HOME/.modal.toml" ]; then
        echo -e "${GREEN}   ✅ Modal認証情報: 設定済み${NC}"
        echo "      設定ファイル: $HOME/.modal.toml"
    else
        echo -e "${YELLOW}   ⚠️  Modal認証情報: 未設定${NC}"
        echo "      セットアップコマンド: modal setup"
        FAILED=$((FAILED + 1))
    fi
fi
echo ""

# 3. Python環境検証
echo "🐍 3. Python環境の検証..."
if check_command python3 "Python3"; then
    PYTHON_VERSION=$(python3 --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
    echo "   バージョン: $PYTHON_VERSION"

    # Python 3.8+確認
    PYTHON_MAJOR=$(echo "$PYTHON_VERSION" | cut -d. -f1)
    PYTHON_MINOR=$(echo "$PYTHON_VERSION" | cut -d. -f2)

    if [ "$PYTHON_MAJOR" -ge 3 ] && [ "$PYTHON_MINOR" -ge 8 ]; then
        echo -e "${GREEN}   ✅ Python 3.8+ 要件を満たしています${NC}"
    else
        echo -e "${RED}   ❌ Python 3.8+ が必要です（現在: $PYTHON_VERSION）${NC}"
        FAILED=$((FAILED + 1))
    fi

    # 必須パッケージ確認
    echo "   必須パッケージ確認中..."
    REQUIRED_PACKAGES=("datasets" "huggingface_hub")

    for pkg in "${REQUIRED_PACKAGES[@]}"; do
        if python3 -c "import $pkg" &> /dev/null; then
            echo -e "${GREEN}   ✅ $pkg: インストール済み${NC}"
        else
            echo -e "${YELLOW}   ⚠️  $pkg: 未インストール${NC}"
            echo "      インストールコマンド: pip install $pkg"
        fi
    done
fi
echo ""

# 4. Git環境検証
echo "🔧 4. Git環境の検証..."
if check_command git "Git"; then
    GIT_VERSION=$(git --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
    echo "   バージョン: $GIT_VERSION"
fi
echo ""

# 5. ディレクトリ構造検証
echo "📁 5. ディレクトリ構造の検証..."
REQUIRED_DIRS=(
    "benchmarks/swe-bench-pro/docker"
    "benchmarks/swe-bench-pro/scripts"
    "benchmarks/swe-bench-pro/configs"
    "benchmarks/swe-bench-pro/data"
    "benchmarks/swe-bench-pro/results"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✅ $dir - 存在${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${YELLOW}⚠️  $dir - 未作成${NC}"
        echo "   作成コマンド: mkdir -p $dir"
        mkdir -p "$dir" 2>/dev/null && echo -e "${GREEN}   → 作成完了${NC}" || true
    fi
done
echo ""

# 6. ストレージ容量確認
echo "💾 6. ストレージ容量の確認..."
AVAILABLE_GB=$(df -h . | awk 'NR==2 {print $4}' | sed 's/Gi//')
echo "   利用可能: $AVAILABLE_GB GB"

if [ "${AVAILABLE_GB%.*}" -ge 20 ]; then
    echo -e "${GREEN}✅ 十分なストレージ（20GB以上推奨）${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}⚠️  ストレージ不足の可能性（20GB以上推奨）${NC}"
fi
echo ""

# 7. メモリ確認（macOS/Linux対応）
echo "🧠 7. メモリ容量の確認..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    TOTAL_MEM_GB=$(sysctl -n hw.memsize | awk '{print int($1/1024/1024/1024)}')
else
    # Linux
    TOTAL_MEM_GB=$(free -g | awk 'NR==2 {print $2}')
fi

echo "   総メモリ: ${TOTAL_MEM_GB}GB"

if [ "$TOTAL_MEM_GB" -ge 16 ]; then
    echo -e "${GREEN}✅ 十分なメモリ（16GB以上推奨）${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}⚠️  メモリ不足の可能性（16GB以上推奨）${NC}"
fi
echo ""

# サマリー
echo "================================"
echo "📊 検証結果サマリー"
echo "================================"
echo -e "✅ 合格: ${GREEN}$PASSED${NC}"
echo -e "❌ 失敗: ${RED}$FAILED${NC}"
echo ""

if [ "$FAILED" -eq 0 ]; then
    echo -e "${GREEN}🎉 すべての検証に合格しました！${NC}"
    echo ""
    echo "次のステップ:"
    echo "  1. Docker イメージ取得: docker pull scaleai/swebench-pro:latest"
    echo "  2. データセットダウンロード: docker-compose run dataset-loader"
    echo "  3. 環境起動: docker-compose up -d swebench-pro"
    exit 0
else
    echo -e "${YELLOW}⚠️  一部の検証に失敗しました。上記のエラーを修正してください。${NC}"
    exit 1
fi
