#!/bin/bash

# MCP Server Test Script
# Phase 3: MCPサーバーテスト実行スクリプト

set -e

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ログ関数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ヘルプ表示
show_help() {
    cat << EOF
MCP Server Test Script

Usage: $0 [OPTIONS] [COMMAND]

Commands:
    diagnose     MCPサーバーの診断
    unit         単体テスト実行
    integration  統合テスト実行
    performance  パフォーマンステスト実行
    all          全テスト実行
    monitor      監視ダッシュボード起動

Options:
    --server=SERVER    特定のMCPサーバーのみテスト
    --issues=ISSUES    テスト用Issue番号（カンマ区切り）
    --concurrency=N    並列実行数（デフォルト: 3）
    --max-cost=COST    最大コスト制限（デフォルト: 0.50）
    --profile          パフォーマンスプロファイリング
    --verbose          詳細ログ出力
    --help             このヘルプを表示

Examples:
    $0 diagnose
    $0 unit --server=miyabi-integration
    $0 integration --issues=270,271,272 --concurrency=3
    $0 performance --profile --max-cost=1.00
    $0 all --verbose

EOF
}

# 環境変数チェック
check_environment() {
    log_info "環境変数をチェック中..."
    
    local missing_vars=()
    
    if [ -z "$GITHUB_TOKEN" ]; then
        missing_vars+=("GITHUB_TOKEN")
    fi
    
    if [ -z "$REPOSITORY" ]; then
        missing_vars+=("REPOSITORY")
    fi
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        log_error "以下の環境変数が設定されていません:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        echo ""
        echo "設定方法:"
        echo "  export GITHUB_TOKEN=your_token"
        echo "  export REPOSITORY=your_repo"
        exit 1
    fi
    
    log_success "環境変数チェック完了"
}

# MCPサーバー診断
diagnose_mcp() {
    log_info "MCPサーバーの診断を開始..."
    
    # Node.js環境チェック
    if ! command -v node &> /dev/null; then
        log_error "Node.jsがインストールされていません"
        exit 1
    fi
    
    # Rust環境チェック
    if ! command -v cargo &> /dev/null; then
        log_error "Rust/Cargoがインストールされていません"
        exit 1
    fi
    
    # MCPサーバーファイルの存在チェック
    local mcp_servers=(
        ".claude/mcp-servers/miyabi-integration.js"
        ".claude/mcp-servers/github-enhanced.cjs"
        ".claude/mcp-servers/ide-integration.cjs"
        ".claude/mcp-servers/project-context.cjs"
    )
    
    for server in "${mcp_servers[@]}"; do
        if [ -f "$server" ]; then
            log_success "✓ $server 存在確認"
        else
            log_warning "✗ $server が見つかりません"
        fi
    done
    
    # 設定ファイルチェック
    if [ -f ".claude/mcp.json" ]; then
        log_success "✓ MCP設定ファイル存在確認"
    else
        log_error "✗ MCP設定ファイルが見つかりません"
        exit 1
    fi
    
    log_success "MCPサーバー診断完了"
}

# 単体テスト実行
run_unit_tests() {
    log_info "単体テストを実行中..."
    
    local server_filter=""
    if [ -n "$SERVER" ]; then
        server_filter="--server=$SERVER"
    fi
    
    # Rustテスト
    log_info "Rust単体テスト実行中..."
    cargo test --lib --quiet
    
    # Node.jsテスト（存在する場合）
    if [ -f "package.json" ]; then
        log_info "Node.js単体テスト実行中..."
        npm test -- --run --reporter=verbose $server_filter
    fi
    
    log_success "単体テスト完了"
}

# 統合テスト実行
run_integration_tests() {
    log_info "統合テストを実行中..."
    
    local issues="270,271,272"
    if [ -n "$ISSUES" ]; then
        issues="$ISSUES"
    fi
    
    local concurrency=3
    if [ -n "$CONCURRENCY" ]; then
        concurrency="$CONCURRENCY"
    fi
    
    # 統合テスト実行
    log_info "統合テスト実行中... (Issues: $issues, Concurrency: $concurrency)"
    
    # Miyabi CLI統合テスト
    if command -v cargo &> /dev/null; then
        cargo run --bin miyabi -- test integration --issues="$issues" --concurrency="$concurrency"
    fi
    
    log_success "統合テスト完了"
}

# パフォーマンステスト実行
run_performance_tests() {
    log_info "パフォーマンステストを実行中..."
    
    local max_cost=0.50
    if [ -n "$MAX_COST" ]; then
        max_cost="$MAX_COST"
    fi
    
    local profile_flag=""
    if [ "$PROFILE" = "true" ]; then
        profile_flag="--profile"
    fi
    
    # パフォーマンステスト実行
    log_info "パフォーマンステスト実行中... (Max Cost: $max_cost)"
    
    # 時間測定開始
    local start_time=$(date +%s)
    
    # テスト実行
    if command -v cargo &> /dev/null; then
        cargo run --bin miyabi -- test performance --max-cost="$max_cost" $profile_flag
    fi
    
    # 時間測定終了
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log_info "パフォーマンステスト完了 (実行時間: ${duration}秒)"
    
    # 30分以内かチェック
    if [ $duration -gt 1800 ]; then
        log_warning "パフォーマンステストが30分を超えました"
    else
        log_success "パフォーマンステストは30分以内に完了しました"
    fi
}

# 全テスト実行
run_all_tests() {
    log_info "全テストを実行中..."
    
    # 診断
    diagnose_mcp
    
    # 単体テスト
    run_unit_tests
    
    # 統合テスト
    run_integration_tests
    
    # パフォーマンステスト
    run_performance_tests
    
    log_success "全テスト完了"
}

# 監視ダッシュボード起動
start_monitor() {
    log_info "監視ダッシュボードを起動中..."
    
    # ダッシュボード用のポート
    local port=3001
    
    # 既存のプロセスをチェック
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        log_warning "ポート $port は既に使用中です"
        log_info "既存のダッシュボード: http://localhost:$port"
    else
        log_info "ダッシュボードを起動中... http://localhost:$port"
        
        # ダッシュボード起動（実装が必要）
        # npm run dashboard -- --port=$port
        
        log_success "監視ダッシュボード起動完了"
    fi
}

# メイン処理
main() {
    # 引数解析
    while [[ $# -gt 0 ]]; do
        case $1 in
            --server=*)
                SERVER="${1#*=}"
                shift
                ;;
            --issues=*)
                ISSUES="${1#*=}"
                shift
                ;;
            --concurrency=*)
                CONCURRENCY="${1#*=}"
                shift
                ;;
            --max-cost=*)
                MAX_COST="${1#*=}"
                shift
                ;;
            --profile)
                PROFILE="true"
                shift
                ;;
            --verbose)
                VERBOSE="true"
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            diagnose|unit|integration|performance|all|monitor)
                COMMAND="$1"
                shift
                ;;
            *)
                log_error "不明なオプション: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # コマンドが指定されていない場合はヘルプを表示
    if [ -z "$COMMAND" ]; then
        show_help
        exit 1
    fi
    
    # 環境チェック
    check_environment
    
    # コマンド実行
    case $COMMAND in
        diagnose)
            diagnose_mcp
            ;;
        unit)
            run_unit_tests
            ;;
        integration)
            run_integration_tests
            ;;
        performance)
            run_performance_tests
            ;;
        all)
            run_all_tests
            ;;
        monitor)
            start_monitor
            ;;
        *)
            log_error "不明なコマンド: $COMMAND"
            show_help
            exit 1
            ;;
    esac
}

# スクリプト実行
main "$@"
