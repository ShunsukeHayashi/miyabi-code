#!/bin/bash
# Stream Deck: Sync All
# Git pull + sync all repositories + update dependencies

osascript -e 'display notification "同期開始..." with title "🔄 Stream Deck"'

cd ~/Dev/miyabi-private

# Git operations
git fetch --all
git pull origin main

# Update dependencies
cargo update

# Sync submodules if any
git submodule update --init --recursive

osascript -e 'display notification "同期完了!" with title "✅ Stream Deck"'
