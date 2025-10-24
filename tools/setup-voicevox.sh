#!/bin/bash

# VOICEVOX自動セットアップスクリプト
# 使い方: ./tools/setup-voicevox.sh

set -e

echo "🎤 VOICEVOX自動セットアップ"
echo ""

# スクリプトパス検証
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

ENQUEUE_SCRIPT="$SCRIPT_DIR/voicevox_enqueue.sh"
WORKER_SCRIPT="$SCRIPT_DIR/voicevox_worker.sh"

if [ ! -f "$ENQUEUE_SCRIPT" ] || [ ! -f "$WORKER_SCRIPT" ]; then
  echo "❌ VOICEVOXスクリプトが見つかりません"
  echo "   $ENQUEUE_SCRIPT"
  echo "   $WORKER_SCRIPT"
  exit 1
fi

echo "✅ VOICEVOXスクリプト確認完了"
echo ""

# /tmp/へシンボリックリンク作成（後方互換性）
echo "🔗 シンボリックリンク作成..."
ln -sf "$ENQUEUE_SCRIPT" /tmp/voicevox_enqueue.sh
ln -sf "$WORKER_SCRIPT" /tmp/voicevox_worker.sh
chmod +x /tmp/voicevox_enqueue.sh /tmp/voicevox_worker.sh
echo "✅ /tmp/voicevox_*.sh → tools/voicevox_*.sh"
echo ""

# キューディレクトリ作成
echo "📁 キューディレクトリ作成..."
mkdir -p /tmp/voicevox_queue
echo "✅ /tmp/voicevox_queue"
echo ""

# VOICEVOX Engine確認
echo "🔍 VOICEVOX Engine確認..."
if curl -s http://127.0.0.1:50021/version > /dev/null 2>&1; then
  VOICEVOX_VERSION=$(curl -s http://127.0.0.1:50021/version)
  echo "✅ VOICEVOX Engine起動中 (version: $VOICEVOX_VERSION)"
else
  echo "⚠️  VOICEVOX Engine未起動"
  echo ""
  echo "📖 起動方法:"
  echo "   Docker版:"
  echo "     docker run --rm -p '127.0.0.1:50021:50021' voicevox/voicevox_engine:cpu-latest"
  echo ""
  echo "   ローカル版:"
  echo "     cd ~/voicevox_engine"
  echo "     python run.py --enable_mock"
  echo ""
  echo "   Engineを起動後、このスクリプトを再実行してください。"
  exit 0
fi
echo ""

# ワーカー起動確認
echo "🔍 VOICEVOXワーカー確認..."
if pgrep -f "voicevox_worker.sh" > /dev/null; then
  WORKER_PID=$(pgrep -f "voicevox_worker.sh")
  echo "✅ ワーカー起動中 (PID: $WORKER_PID)"
else
  echo "🚀 ワーカーを起動します..."
  "$WORKER_SCRIPT" &
  sleep 2

  if pgrep -f "voicevox_worker.sh" > /dev/null; then
    WORKER_PID=$(pgrep -f "voicevox_worker.sh")
    echo "✅ ワーカー起動完了 (PID: $WORKER_PID)"
  else
    echo "❌ ワーカー起動失敗"
    echo "   ログ: /tmp/voicevox_queue/worker.log"
    exit 1
  fi
fi
echo ""

# 動作テスト
echo "🧪 動作テスト..."
"$ENQUEUE_SCRIPT" "セットアップが完了したのだ！" 3 1.2
sleep 1
echo ""

# 完了メッセージ
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ VOICEVOXセットアップ完了"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 ステータス:"
echo "   Engine: http://127.0.0.1:50021"
echo "   ワーカーPID: $(cat /tmp/voicevox_queue/worker.lock 2>/dev/null || echo 'N/A')"
echo "   ログ: /tmp/voicevox_queue/worker.log"
echo ""
echo "🎤 使い方:"
echo "   tools/voicevox_enqueue.sh \"テキスト\" [speaker] [speed]"
echo "   /voicevox  # Claude Codeコマンド"
echo ""
echo "💡 リアルタイムログ確認:"
echo "   tail -f /tmp/voicevox_queue/worker.log"
echo ""
