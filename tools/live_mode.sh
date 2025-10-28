#!/bin/bash
# LIVE実況モード - リアルタイム開発進捗実況
# 作成日: 2025-10-28
# バージョン: v1.0.0

set -euo pipefail

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# 絵文字定義
ROCKET="🚀"
FIRE="🔥"
LIGHTNING="⚡"
STAR="⭐"
HEART="❤️"
BRAIN="🧠"
GEAR="⚙️"
CHECK="✅"
CROSS="❌"
WARNING="⚠️"
INFO="ℹ️"
MIC="🎤"
CAMERA="📹"
LIVE="🔴"

# 設定
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="/tmp/miyabi_live"
QUEUE_DIR="/tmp/voicevox_queue"
CONFIG_FILE="$LOG_DIR/live_config.json"

# デフォルト設定
DEFAULT_CONFIG='{
  "voice_enabled": true,
  "speaker_id": 3,
  "speed": 1.2,
  "update_interval": 5,
  "max_queue_size": 10,
  "announcements": {
    "test_start": "テスト開始なのだ！",
    "test_pass": "テスト成功！やったのだ！",
    "test_fail": "テスト失敗...でも次は頑張るのだ！",
    "build_start": "ビルド開始なのだ！",
    "build_success": "ビルド成功！完璧なのだ！",
    "build_fail": "ビルド失敗...デバッグが必要なのだ",
    "commit": "コミット完了！進歩したのだ！",
    "session_start": "セッション開始！頑張るのだ！",
    "session_end": "お疲れ様！また次回なのだ！"
  }
}'

# 初期化
init_live_mode() {
    echo -e "${LIVE}${WHITE} LIVE実況モード初期化中...${NC}"
    
    # ディレクトリ作成
    mkdir -p "$LOG_DIR"
    mkdir -p "$QUEUE_DIR"
    
    # 設定ファイル作成
    if [[ ! -f "$CONFIG_FILE" ]]; then
        echo "$DEFAULT_CONFIG" > "$CONFIG_FILE"
        echo -e "${INFO} 設定ファイルを作成しました: $CONFIG_FILE${NC}"
    fi
    
    # VOICEVOXワーカー起動確認
    if ! pgrep -f "voicevox_worker.sh" > /dev/null; then
        echo -e "${WARNING} VOICEVOXワーカーを起動します...${NC}"
        if [[ -f "tools/voicevox_worker.sh" ]]; then
            tools/voicevox_worker.sh &
        elif [[ -f "/tmp/voicevox_worker.sh" ]]; then
            /tmp/voicevox_worker.sh &
        else
            echo -e "${CROSS} VOICEVOXワーカーが見つかりません${NC}"
        fi
        sleep 2
    fi
    
    echo -e "${CHECK} LIVE実況モード準備完了！${NC}"
}

# 設定読み込み
load_config() {
    if [[ -f "$CONFIG_FILE" ]]; then
        jq -r '.voice_enabled' "$CONFIG_FILE" 2>/dev/null || echo "true"
    else
        echo "true"
    fi
}

# 音声アナウンス
announce() {
    local message="$1"
    local voice_enabled="${2:-$(load_config)}"
    
    if [[ "$voice_enabled" == "true" ]]; then
        local speaker_id=$(jq -r '.speaker_id' "$CONFIG_FILE" 2>/dev/null || echo "3")
        local speed=$(jq -r '.speed' "$CONFIG_FILE" 2>/dev/null || echo "1.2")
        
        if [[ -f "tools/voicevox_enqueue.sh" ]]; then
            tools/voicevox_enqueue.sh "$message" "$speaker_id" "$speed" >/dev/null 2>&1 &
        elif [[ -f "/tmp/voicevox_enqueue.sh" ]]; then
            /tmp/voicevox_enqueue.sh "$message" "$speaker_id" "$speed" >/dev/null 2>&1 &
        fi
    fi
    
    echo -e "${MIC} ${message}${NC}"
}

# Git状態監視
monitor_git_status() {
    local last_commit=""
    local last_branch=""
    
    while true; do
        local current_commit=$(git rev-parse HEAD 2>/dev/null || echo "")
        local current_branch=$(git branch --show-current 2>/dev/null || echo "")
        
        # コミット変更検知
        if [[ "$current_commit" != "$last_commit" && "$last_commit" != "" ]]; then
            local commit_msg=$(git log -1 --pretty=format:"%s" 2>/dev/null || echo "新しいコミット")
            announce "コミット検出！${commit_msg}"
            echo -e "${STAR} 新しいコミット: ${commit_msg}${NC}"
        fi
        
        # ブランチ変更検知
        if [[ "$current_branch" != "$last_branch" && "$last_branch" != "" ]]; then
            announce "ブランチ変更！${current_branch}に切り替え"
            echo -e "${GEAR} ブランチ変更: $last_branch → $current_branch${NC}"
        fi
        
        last_commit="$current_commit"
        last_branch="$current_branch"
        
        sleep 2
    done
}

# ファイル変更監視
monitor_file_changes() {
    local watched_files=(
        "Cargo.toml"
        "Cargo.lock"
        ".miyabi.yml"
        "crates/"
    )
    
    echo -e "${CAMERA} ファイル変更監視開始...${NC}"
    
    # inotifywaitが利用可能な場合
    if command -v inotifywait >/dev/null 2>&1; then
        inotifywait -m -r -e modify,create,delete "${watched_files[@]}" 2>/dev/null | while read -r line; do
            local file=$(echo "$line" | cut -d' ' -f3)
            announce "ファイル変更検出！${file}"
            echo -e "${LIGHTNING} ファイル変更: $file${NC}"
        done
    else
        # フォールバック: 定期的なチェック
        local last_mtime=""
        while true; do
            local current_mtime=$(find "${watched_files[@]}" -type f -exec stat -c %Y {} \; 2>/dev/null | sort -n | tail -1 || echo "0")
            if [[ "$current_mtime" != "$last_mtime" && "$last_mtime" != "" ]]; then
                announce "ファイル変更検出！"
                echo -e "${LIGHTNING} ファイル変更を検出${NC}"
            fi
            last_mtime="$current_mtime"
            sleep 3
        done
    fi
}

# テスト実行監視
monitor_tests() {
    local last_test_count=0
    
    while true; do
        # テスト実行中かチェック
        if pgrep -f "cargo test" >/dev/null; then
            local current_test_count=$(find target/debug/deps -name "*.d" -newer /tmp/miyabi_live/last_test_check 2>/dev/null | wc -l)
            
            if [[ "$current_test_count" -gt "$last_test_count" ]]; then
                announce "テスト実行中！頑張るのだ！"
                echo -e "${BRAIN} テスト実行中... (${current_test_count}個)${NC}"
            fi
            
            last_test_count="$current_test_count"
            touch /tmp/miyabi_live/last_test_check
        fi
        
        sleep 5
    done
}

# ビルド監視
monitor_builds() {
    local last_build_time=""
    
    while true; do
        # ビルド実行中かチェック
        if pgrep -f "cargo build" >/dev/null; then
            local current_time=$(date +%s)
            
            if [[ "$last_build_time" == "" ]]; then
                announce "ビルド開始！コンパイル頑張るのだ！"
                echo -e "${GEAR} ビルド開始...${NC}"
            fi
            
            last_build_time="$current_time"
        else
            if [[ "$last_build_time" != "" ]]; then
                announce "ビルド完了！成功したのだ！"
                echo -e "${CHECK} ビルド完了${NC}"
                last_build_time=""
            fi
        fi
        
        sleep 3
    done
}

# システムリソース監視
monitor_resources() {
    while true; do
        # macOS用のCPU使用率取得
        if [[ "$OSTYPE" == "darwin"* ]]; then
            local cpu_usage=$(top -l 1 | grep "CPU usage" | awk '{print $3}' | cut -d'%' -f1)
            local memory_usage=$(vm_stat | grep "Pages active" | awk '{print $3}' | sed 's/\.//')
        else
            local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
            local memory_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
        fi
        
        # CPU使用率が高い場合
        if (( $(echo "$cpu_usage > 80" | bc -l 2>/dev/null || echo "0") )); then
            announce "CPU使用率が高いのだ！${cpu_usage}%"
            echo -e "${WARNING} 高CPU使用率: ${cpu_usage}%${NC}"
        fi
        
        # メモリ使用率が高い場合
        if (( $(echo "$memory_usage > 85" | bc -l 2>/dev/null || echo "0") )); then
            announce "メモリ使用率が高いのだ！${memory_usage}%"
            echo -e "${WARNING} 高メモリ使用率: ${memory_usage}%${NC}"
        fi
        
        sleep 10
    done
}

# 進捗レポート生成
generate_progress_report() {
    local report_file="$LOG_DIR/progress_report_$(date +%Y%m%d_%H%M%S).md"
    
    # macOS用のリソース情報取得
    local cpu_info=""
    local memory_info=""
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        cpu_info=$(top -l 1 | grep "CPU usage" | awk '{print $3}' || echo "不明")
        memory_info=$(vm_stat | grep "Pages active" | awk '{print $3}' | sed 's/\.//' || echo "不明")
    else
        cpu_info=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' || echo "不明")
        memory_info=$(free | grep Mem | awk '{printf "%.1f%%", $3/$2 * 100.0}' 2>/dev/null || echo "不明")
    fi
    
    cat > "$report_file" << EOF
# LIVE実況レポート - $(date)

## 📊 システム状況
- **時刻**: $(date)
- **ブランチ**: $(git branch --show-current 2>/dev/null || echo "不明")
- **最新コミット**: $(git log -1 --pretty=format:"%h - %s" 2>/dev/null || echo "不明")

## 🧪 テスト状況
- **実行中**: $(pgrep -f "cargo test" >/dev/null && echo "はい" || echo "いいえ")
- **ビルド中**: $(pgrep -f "cargo build" >/dev/null && echo "はい" || echo "いいえ")

## 📈 リソース使用率
- **CPU**: $cpu_info
- **メモリ**: $memory_info

## 🎤 音声キュー状況
- **待機中**: $(ls -1 "$QUEUE_DIR"/*.json 2>/dev/null | wc -l)

## 📝 最近の変更
\`\`\`
$(git log --oneline -5 2>/dev/null || echo "Git情報なし")
\`\`\`
EOF

    echo -e "${INFO} 進捗レポート生成: $report_file${NC}"
}

# メイン実行関数
run_live_mode() {
    local mode="${1:-full}"
    
    echo -e "${LIVE}${WHITE} ===============================================${NC}"
    echo -e "${LIVE}${WHITE}           🎤 LIVE実況モード開始 🎤${NC}"
    echo -e "${LIVE}${WHITE} ===============================================${NC}"
    echo ""
    
    announce "LIVE実況モード開始！みんなで頑張るのだ！"
    
    # バックグラウンドプロセス開始
    case "$mode" in
        "git")
            echo -e "${INFO} Git監視モード${NC}"
            monitor_git_status
            ;;
        "files")
            echo -e "${INFO} ファイル監視モード${NC}"
            monitor_file_changes
            ;;
        "tests")
            echo -e "${INFO} テスト監視モード${NC}"
            monitor_tests
            ;;
        "build")
            echo -e "${INFO} ビルド監視モード${NC}"
            monitor_builds
            ;;
        "resources")
            echo -e "${INFO} リソース監視モード${NC}"
            monitor_resources
            ;;
        "full"|*)
            echo -e "${INFO} フル監視モード${NC}"
            monitor_git_status &
            monitor_file_changes &
            monitor_tests &
            monitor_builds &
            monitor_resources &
            
            # 進捗レポート定期生成
            while true; do
                sleep 300  # 5分ごと
                generate_progress_report
            done
            ;;
    esac
}

# ヘルプ表示
show_help() {
    cat << EOF
${LIVE}${WHITE} LIVE実況モード - リアルタイム開発進捗実況${NC}

${CYAN}使用方法:${NC}
  $0 [モード] [オプション]

${CYAN}モード:${NC}
  full       フル監視モード (デフォルト)
  git        Git変更監視のみ
  files      ファイル変更監視のみ
  tests      テスト実行監視のみ
  build      ビルド監視のみ
  resources  システムリソース監視のみ

${CYAN}オプション:${NC}
  --help, -h     このヘルプを表示
  --config      設定ファイルの場所を表示
  --report      進捗レポートを生成
  --announce    カスタムアナウンス

${CYAN}例:${NC}
  $0                    # フル監視モード
  $0 git               # Git監視のみ
  $0 --announce "テスト完了！"
  $0 --report          # 進捗レポート生成

${CYAN}設定ファイル:${NC}
  $CONFIG_FILE

${CYAN}ログディレクトリ:${NC}
  $LOG_DIR
EOF
}

# メイン処理
main() {
    # 初期化
    init_live_mode
    
    # 引数処理
    case "${1:-}" in
        "--help"|"-h")
            show_help
            exit 0
            ;;
        "--config")
            echo "設定ファイル: $CONFIG_FILE"
            if [[ -f "$CONFIG_FILE" ]]; then
                cat "$CONFIG_FILE"
            else
                echo "設定ファイルが存在しません"
            fi
            exit 0
            ;;
        "--report")
            generate_progress_report
            exit 0
            ;;
        "--announce")
            if [[ -n "${2:-}" ]]; then
                announce "$2"
            else
                echo "アナウンスメッセージを指定してください"
                exit 1
            fi
            exit 0
            ;;
        *)
            run_live_mode "$1"
            ;;
    esac
}

# シグナルハンドリング
trap 'echo -e "\n${INFO} LIVE実況モード終了${NC}"; exit 0' INT TERM

# メイン実行
main "$@"
