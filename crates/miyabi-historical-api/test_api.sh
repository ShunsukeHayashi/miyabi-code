#!/bin/bash
# Test script for miyabi-historical-api
#
# Usage:
#   1. Set ANTHROPIC_API_KEY environment variable
#   2. Start the server: cargo run --bin miyabi-historical-api
#   3. Run this script in another terminal: ./test_api.sh

set -e

API_URL="${API_URL:-http://localhost:3000}"

echo "Testing Miyabi Historical API at $API_URL"
echo "=========================================="
echo ""

# Test 1: Chat with Oda Nobunaga
echo "Test 1: Chat with Oda Nobunaga (織田信長)"
echo "-------------------------------------------"
curl -X POST "$API_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "figure": "oda_nobunaga",
    "message": "新規事業の判断に迷っています。どうすればよいでしょうか？",
    "user_id": "test_user_001"
  }' \
  -w "\nHTTP Status: %{http_code}\n" | jq '.'

echo ""
echo ""

# Test 2: Chat with Sakamoto Ryoma
echo "Test 2: Chat with Sakamoto Ryoma (坂本龍馬)"
echo "-------------------------------------------"
curl -X POST "$API_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "figure": "sakamoto_ryoma",
    "message": "組織を変革するにはどうすればよいですか？",
    "user_id": "test_user_002"
  }' \
  -w "\nHTTP Status: %{http_code}\n" | jq '.'

echo ""
echo ""

# Test 3: Chat with Tokugawa Ieyasu
echo "Test 3: Chat with Tokugawa Ieyasu (徳川家康)"
echo "-------------------------------------------"
curl -X POST "$API_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "figure": "tokugawa_ieyasu",
    "message": "長期的な成功のための戦略を教えてください",
    "user_id": "test_user_003"
  }' \
  -w "\nHTTP Status: %{http_code}\n" | jq '.'

echo ""
echo ""

# Test 4: Invalid figure name (should return 400)
echo "Test 4: Invalid figure name (should return 400)"
echo "-------------------------------------------"
curl -X POST "$API_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "figure": "invalid_person",
    "message": "test",
    "user_id": "test_user_004"
  }' \
  -w "\nHTTP Status: %{http_code}\n" | jq '.'

echo ""
echo ""
echo "=========================================="
echo "All tests completed!"
