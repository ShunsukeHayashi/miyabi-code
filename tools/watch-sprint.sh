#!/bin/bash
#
# Infinity Sprint ログ監視 + VoiceVox音声通知
#
# Infinity Sprintのログをリアルタイム監視し、
# 特定イベント発生時にVOICEVOXで音声通知を行います。

set -e

# プロジェクトルート
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# VOICEVOX enqueue script
VOICEVOX_ENQUEUE="$PROJECT_ROOT/tools/voicevox_enqueue.sh"

if [[ ! -f "$VOICEVOX_ENQUEUE" ]]; then
  echo "❌ voicevox_enqueue.sh が見つかりません: $VOICEVOX_ENQUEUE"
  exit 1
fi

# 最新のログファイルを取得
LOG_FILE=$(ls -t .ai/logs/infinity-sprint-*.md 2>/dev/null | head -n 1)

if [[ -z "$LOG_FILE" ]]; then
  echo "❌ Infinity Sprintログファイルが見つかりません (.ai/logs/infinity-sprint-*.md)"
  echo ""
  echo "💡 Infinity Sprintを開始してください："
  echo "   miyabi loop start"
  exit 1
fi

echo "📊 監視開始: $LOG_FILE"
echo "🔊 VoiceVox音声通知: 有効"
echo "🎤 話者: ${VOICEVOX_SPEAKER:-3} (ずんだもん)"
echo ""
echo "⏸️  停止するには: Ctrl+C または pkill -f 'tail -f.*infinity-sprint'"
echo ""

# VOICEVOX話者ID（デフォルト: ずんだもん）
SPEAKER=${VOICEVOX_SPEAKER:-3}
SPEED=${VOICEVOX_SPEED:-1.2}

# 音声通知関数
say_voicevox() {
  local text="$1"
  local speaker="${2:-$SPEAKER}"
  local speed="${3:-$SPEED}"

  "$VOICEVOX_ENQUEUE" "$text" "$speaker" "$speed" > /dev/null 2>&1
  echo "🎤 [$(date '+%H:%M:%S')] $text"
}

# ログファイルを監視
tail -f "$LOG_FILE" | while IFS= read -r line; do
  # "Sprint N" という行を検知
  if [[ "$line" =~ Sprint[[:space:]]+[0-9]+ ]]; then
    say_voicevox "スプリントが始まるのだ！" "$SPEAKER" 1.3
  fi

  # "Success" という行を検知
  if [[ "$line" =~ :.*Success ]]; then
    say_voicevox "やったのだ！タスクが完了したのだ！" "$SPEAKER" 1.2
  fi

  # "Failed" という行を検知
  if [[ "$line" =~ :.*Failed ]]; then
    say_voicevox "失敗したのだ！でも諦めないのだ！" "$SPEAKER" 1.0
  fi

  # "Error" という行を検知
  if [[ "$line" =~ Error:|ERROR ]]; then
    say_voicevox "エラーが発生したのだ！確認するのだ！" "$SPEAKER" 1.0
  fi

  # "All tasks completed" を検知
  if [[ "$line" =~ All.*tasks.*completed ]]; then
    say_voicevox "全部終わったのだ！お疲れ様なのだ！" "$SPEAKER" 1.4
  fi

  # "PR created" を検知
  if [[ "$line" =~ PR.*created|Pull.*Request.*created ]]; then
    say_voicevox "プルリクエストが作成されたのだ！" "$SPEAKER" 1.3
  fi

  # "Merged" を検知
  if [[ "$line" =~ Merged|マージ ]]; then
    say_voicevox "マージされたのだ！素晴らしいのだ！" "$SPEAKER" 1.3
  fi
done
