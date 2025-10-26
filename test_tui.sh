#!/bin/bash
# Miyabi TUI Test Script
# このスクリプトは別のターミナルウィンドウで実行してください

set -e

echo "========================================="
echo "  Miyabi TUI Test Script"
echo "========================================="
echo ""

# Check if binary exists
if [ ! -f "./target/release/miyabi" ]; then
    echo "❌ Binary not found: ./target/release/miyabi"
    echo "Building now..."
    cargo build --package miyabi-cli --bin miyabi --features tui --release
fi

echo "✅ Binary found: ./target/release/miyabi"
echo ""

# Check API Key
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "⚠️  ANTHROPIC_API_KEY is not set"
    echo ""
    echo "Test Case 1: Running TUI without API Key (エラーハンドリングテスト)"
    echo ""
    echo "Expected behavior:"
    echo "  1. TUI starts successfully"
    echo "  2. Welcome message is displayed"
    echo "  3. When you send a message, error is shown"
    echo "  4. Exit with Ctrl+C"
    echo ""
    echo "Press Enter to start..."
    read

    ./target/release/miyabi chat --tui
else
    echo "✅ ANTHROPIC_API_KEY is set"
    echo ""
    echo "Test Case 2: Running TUI with API Key (LLM統合テスト)"
    echo ""
    echo "Expected behavior:"
    echo "  1. TUI starts successfully"
    echo "  2. Send a message: 'Hello, how are you?'"
    echo "  3. State changes to 'Processing...'"
    echo "  4. Claude response is displayed"
    echo "  5. Try another message"
    echo "  6. Exit with Ctrl+C"
    echo ""
    echo "Press Enter to start..."
    read

    ./target/release/miyabi chat --tui
fi
