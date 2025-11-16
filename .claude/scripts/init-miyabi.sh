#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Miyabi Orchestrator - Initialization"
echo "========================================"
echo ""

# Step 1: Environment validation
echo "1️⃣ Validating environment..."
bash ~/.claude/scripts/check-env.sh || exit 1
echo ""

# Step 2: SSH connections
echo "2️⃣ Checking SSH connections..."
bash ~/.claude/scripts/check-ssh.sh || exit 1
echo ""

# Step 3: Git status
echo "3️⃣ Checking git repository..."
cd ~/miyabi-private && git status | head -5
echo ""

# Step 4: Worktree list
echo "4️⃣ Active worktrees..."
git worktree list
echo ""

echo "✅ Initialization complete!"
echo "Ready for orchestration 🎭"
