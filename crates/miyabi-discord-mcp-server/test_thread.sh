#!/bin/bash

# Test script for Discord thread retrieval
# Thread ID: 1429963898383110225

THREAD_ID="1429963898383110225"

echo "======================================"
echo "Testing Discord Thread Retrieval"
echo "Thread ID: $THREAD_ID"
echo "======================================"
echo ""

# Test 1: Get thread info
echo "Test 1: Getting thread info..."
echo "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"discord.thread.get\",\"params\":{\"thread_id\":\"$THREAD_ID\"}}" | cargo run --release --bin miyabi-discord-mcp-server -- --mode stdio 2>&1

echo ""
echo "======================================"
echo ""

# Test 2: Get thread messages (first 10)
echo "Test 2: Getting thread messages (limit 10)..."
echo "{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"discord.thread.getMessages\",\"params\":{\"thread_id\":\"$THREAD_ID\",\"limit\":10}}" | cargo run --release --bin miyabi-discord-mcp-server -- --mode stdio 2>&1

echo ""
echo "======================================"
echo "Tests completed!"
echo "======================================"
