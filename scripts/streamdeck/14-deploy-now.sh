#!/bin/bash
# Stream Deck: Deploy Now
# Execute deployment pipeline

osascript -e 'display notification "デプロイ開始..." with title "🚀 Stream Deck"'

cd ~/Dev/miyabi-private

# Run deployment script
./scripts/deploy.sh 2>&1 | tee /tmp/deploy.log

# Check result
if [ $? -eq 0 ]; then
  osascript -e 'display notification "デプロイ成功!" with title "✅ Stream Deck"'
else
  osascript -e 'display notification "デプロイ失敗 - ログを確認してください" with title "❌ Stream Deck"'
fi
