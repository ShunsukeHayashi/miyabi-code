#!/bin/bash
#
# VOICEVOX 完全自動セットアップスクリプト
#
# このスクリプトは、Miyabi起動時に自動的に実行され、
# VOICEVOXの全設定を自動で行います。
#
# Usage: source tools/voicevox_auto_setup.sh
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
VOICEVOX_ENGINE_URL="http://127.0.0.1:50021"
QUEUE_DIR="/tmp/voicevox_queue"
WORKER_PID_FILE="/tmp/voicevox_queue/worker.pid"
WORKER_LOG="/tmp/voicevox_queue/worker.log"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🎤 VOICEVOX 自動セットアップを開始します..."

# ========================================
# Step 1: Docker確認
# ========================================
check_docker() {
    echo -n "🐳 Docker確認中... "
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}✗${NC}"
        echo ""
        echo -e "${RED}❌ Dockerがインストールされていません${NC}"
        echo ""
        echo "VOICEVOXには2つのインストール方法があります："
        echo ""
        echo "【方法1】 Docker版（推奨）"
        echo "  1. Dockerをインストール: https://www.docker.com/products/docker-desktop"
        echo "  2. Miyabiを再起動"
        echo ""
        echo "【方法2】 音声ガイドを無効化"
        echo "  export MIYABI_VOICE_GUIDE=false"
        echo ""
        return 1
    fi
    echo -e "${GREEN}✓${NC}"
    return 0
}

# ========================================
# Step 2: VOICEVOX Engine起動確認・自動起動
# ========================================
check_voicevox_engine() {
    echo -n "🎙️  VOICEVOX Engine確認中... "

    # Already running?
    if curl -s "$VOICEVOX_ENGINE_URL/version" &> /dev/null; then
        local version=$(curl -s "$VOICEVOX_ENGINE_URL/version" 2>/dev/null)
        echo -e "${GREEN}✓${NC} (v$version)"
        return 0
    fi

    echo -e "${YELLOW}起動が必要${NC}"

    # Auto-start
    echo "🚀 VOICEVOX Engineを自動起動中..."

    docker run -d \
        --rm \
        --name voicevox_engine \
        -p 127.0.0.1:50021:50021 \
        voicevox/voicevox_engine:cpu-latest \
        > /dev/null 2>&1

    # Wait for startup (max 30 seconds)
    echo -n "   起動を待機中"
    for i in {1..30}; do
        sleep 1
        echo -n "."
        if curl -s "$VOICEVOX_ENGINE_URL/version" &> /dev/null; then
            local version=$(curl -s "$VOICEVOX_ENGINE_URL/version" 2>/dev/null)
            echo -e " ${GREEN}✓${NC} (v$version)"
            echo "   ✅ VOICEVOX Engine起動完了！"
            return 0
        fi
    done

    echo -e " ${RED}✗${NC}"
    echo -e "${RED}❌ VOICEVOX Engineの起動に失敗しました${NC}"
    echo "手動で起動してください："
    echo "  docker run -d --rm -p 127.0.0.1:50021:50021 voicevox/voicevox_engine:cpu-latest"
    return 1
}

# ========================================
# Step 3: キューディレクトリ作成
# ========================================
setup_queue_directory() {
    echo -n "📁 キューディレクトリ作成中... "
    mkdir -p "$QUEUE_DIR"
    echo -e "${GREEN}✓${NC}"
}

# ========================================
# Step 4: Worker起動確認・自動起動
# ========================================
check_worker() {
    echo -n "👷 Workerプロセス確認中... "

    # Check if worker is running
    if [ -f "$WORKER_PID_FILE" ]; then
        local pid=$(cat "$WORKER_PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            echo -e "${GREEN}✓${NC} (PID: $pid)"
            return 0
        fi
    fi

    echo -e "${YELLOW}起動が必要${NC}"

    # Auto-start worker
    echo "🚀 Workerを自動起動中..."

    cd "$PROJECT_ROOT"

    if [ ! -f "tools/voicevox_worker.sh" ]; then
        echo -e "${RED}❌ tools/voicevox_worker.sh が見つかりません${NC}"
        return 1
    fi

    # Start worker in background (macOS compatible)
    # Use subshell with nohup for portability
    (nohup ./tools/voicevox_worker.sh >> "$WORKER_LOG" 2>&1 </dev/null &)

    # Wait a moment for worker to start
    sleep 1

    # Find the actual worker PID
    local worker_pid=$(pgrep -f "voicevox_worker.sh" | head -1)

    if [ -z "$worker_pid" ]; then
        echo -e "${RED}❌ Workerの起動に失敗しました（プロセスが見つかりません）${NC}"
        return 1
    fi

    # Save PID
    echo "$worker_pid" > "$WORKER_PID_FILE"

    # Verify worker is running
    if ps -p "$worker_pid" > /dev/null 2>&1; then
        echo -e "   ${GREEN}✓${NC} Worker起動完了！ (PID: $worker_pid)"
        return 0
    else
        echo -e "${RED}❌ Workerの起動に失敗しました${NC}"
        return 1
    fi
}

# ========================================
# Step 5: 動作確認テスト
# ========================================
test_voice_system() {
    echo "🧪 音声システムテスト中..."

    cd "$PROJECT_ROOT"

    if [ ! -f "tools/voicevox_enqueue.sh" ]; then
        echo -e "${RED}❌ tools/voicevox_enqueue.sh が見つかりません${NC}"
        return 1
    fi

    # Send test message
    ./tools/voicevox_enqueue.sh "セットアップ完了なのだ！" 3 1.2 > /dev/null 2>&1

    # Wait for processing
    sleep 3

    # Check worker log
    if grep -q "セットアップ完了なのだ！" "$WORKER_LOG" 2>/dev/null; then
        echo -e "   ${GREEN}✓${NC} テストメッセージ処理成功！"
        return 0
    else
        echo -e "${YELLOW}⚠${NC}  テストメッセージが処理されませんでした"
        echo "   （音声は後で再生される可能性があります）"
        return 0  # Non-fatal
    fi
}

# ========================================
# Step 6: セットアップ完了通知
# ========================================
show_success_message() {
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════${NC}"
    echo -e "${GREEN}🎉 VOICEVOX セットアップ完了！${NC}"
    echo -e "${GREEN}═══════════════════════════════════════${NC}"
    echo ""
    echo "ずんだもんが音声でガイドします 🎤"
    echo ""
    echo "音声ガイドを無効化する場合："
    echo "  export MIYABI_VOICE_GUIDE=false"
    echo ""
}

show_failure_message() {
    echo ""
    echo -e "${YELLOW}═══════════════════════════════════════${NC}"
    echo -e "${YELLOW}⚠️  VOICEVOX セットアップ未完了${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════${NC}"
    echo ""
    echo "Miyabiは音声なしで動作します。"
    echo ""
    echo "音声ガイドを有効化するには："
    echo "  1. Dockerをインストール"
    echo "  2. Miyabiを再起動"
    echo ""
    echo "または、音声ガイドを無効化："
    echo "  export MIYABI_VOICE_GUIDE=false"
    echo ""
}

# ========================================
# Main Setup Flow
# ========================================
main() {
    # Silent mode check (for automated scripts)
    if [ "$MIYABI_VOICE_GUIDE" = "false" ]; then
        return 0  # Skip setup if disabled
    fi

    echo ""

    # Run all checks
    if ! check_docker; then
        show_failure_message
        return 1
    fi

    if ! check_voicevox_engine; then
        show_failure_message
        return 1
    fi

    setup_queue_directory

    if ! check_worker; then
        show_failure_message
        return 1
    fi

    test_voice_system

    show_success_message

    return 0
}

# Run setup
main

# Export status for caller
export VOICEVOX_SETUP_COMPLETE=$?
