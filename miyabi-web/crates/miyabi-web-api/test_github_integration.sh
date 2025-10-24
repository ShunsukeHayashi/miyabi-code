#!/bin/bash
# GitHub Integration Test Script
# This script simulates a LINE webhook message to test GitHub Issue creation

curl -X POST http://localhost:8080/api/line/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "U1234567890abcdef1234567890abcdef",
    "events": [
      {
        "type": "message",
        "replyToken": "test-reply-token-github-integration",
        "source": {
          "type": "user",
          "userId": "U-test-user-github"
        },
        "message": {
          "type": "text",
          "id": "test-msg-github-001",
          "text": "ログイン画面のバグを直してほしい。ユーザー名が入力できない。"
        },
        "timestamp": 1698000000000
      }
    ]
  }'
