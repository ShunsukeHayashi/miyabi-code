#!/bin/bash
# Miyabi TUI Test Script
# このスクリプトは別のターミナルウィンドウで実行してください

set -e

echo "========================================="
echo "  Miyabi TUI Test Script"
echo "========================================="
echo ""

# Check if binary exists
if [ ! -f "./target/release/miyabi-tui" ]; then
    echo "❌ Binary not found: ./target/release/miyabi-tui"
    echo "Building now..."
    cargo build --package miyabi-tui --release
fi

echo "✅ Binary found: ./target/release/miyabi-tui"
echo ""

# Check API Keys
if [ -z "$OPENAI_API_KEY" ] && [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "⚠️  No API keys set (OPENAI_API_KEY, ANTHROPIC_API_KEY)"
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

    ./target/release/miyabi-tui
elif [ -n "$OPENAI_API_KEY" ]; then
    echo "✅ OPENAI_API_KEY is set (Provider: OpenAI GPT-4o)"
    echo ""
    echo "Test Case 2: Running TUI with OpenAI (Streaming テスト)"
    echo ""
    echo "Expected behavior:"
    echo "  1. TUI starts successfully"
    echo "  2. Send a message: 'Hello, how are you?'"
    echo "  3. State changes to 'Streaming...'"
    echo "  4. OpenAI response streams in real-time"
    echo "  5. Try another message"
    echo "  6. Exit with Ctrl+C"
    echo ""
    echo "Press Enter to start..."
    read

    ./target/release/miyabi-tui
else
    echo "✅ ANTHROPIC_API_KEY is set (Provider: Anthropic Claude)"
    echo ""
    echo "Test Case 3: Running TUI with Anthropic (Streaming テスト)"
    echo ""
    echo "Expected behavior:"
    echo "  1. TUI starts successfully"
    echo "  2. Send a message: 'Hello, how are you?'"
    echo "  3. State changes to 'Streaming...'"
    echo "  4. Claude response streams in real-time"
    echo "  5. Try another message"
    echo "  6. Exit with Ctrl+C"
    echo ""
    echo "Press Enter to start..."
    read

    ./target/release/miyabi-tui
fi
