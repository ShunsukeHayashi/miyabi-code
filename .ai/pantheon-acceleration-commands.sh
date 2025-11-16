#!/bin/bash
#
# Pantheon MAX - Acceleration Commands
# Send boost commands to all agents
#

SESSION="pantheon-max"

echo "🚀 ACCELERATING ALL AGENTS..."

# Phase 1: Foundation
tmux send-keys -t %15 "BOOST MODE: Complete CDK stacks (VPC, S3, CloudFront, DynamoDB). Deploy to AWS NOW!" && sleep 0.5 && tmux send-keys -t %15 Enter

# Phase 2: Backend
tmux send-keys -t %16 "BOOST MODE: Finish Axum setup, create all API endpoints (/agents, /guardians, /council). Seed data from pantheon-society.md. Deploy Lambda!" && sleep 0.5 && tmux send-keys -t %16 Enter

# Phase 3: Frontend
tmux send-keys -t %18 "BOOST MODE: Complete all pages, add Recharts radar charts, create interactive architecture diagram. Build for production!" && sleep 0.5 && tmux send-keys -t %18 Enter

# Phase 4: Testing
tmux send-keys -t %19 "BOOST MODE: Run Playwright tests on all pages, performance test with Lighthouse, security audit. Report results!" && sleep 0.5 && tmux send-keys -t %19 Enter

# Phase 5: Launch
tmux send-keys -t %17 "BOOST MODE: Deploy to staging, run smoke tests, then DEPLOY TO PRODUCTION! Configure DNS, setup monitoring. GO LIVE!" && sleep 0.5 && tmux send-keys -t %17 Enter

echo "✅ All agents boosted!"
