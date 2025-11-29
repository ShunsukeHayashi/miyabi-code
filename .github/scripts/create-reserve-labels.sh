#!/bin/bash
# Reserve Task Management Labels Creation Script
# Created: 2025-11-29
# Purpose: Create labels for A5-Reserve team overflow task management

set -e

echo "🏷️  Creating Reserve Task Management Labels..."

# RESERVE Category
gh label create "📨 reserve:incoming" \
  --description "Incoming overflow task from other teams - awaiting triage" \
  --color "E4E4E4" \
  --force

gh label create "🎯 reserve:accepted" \
  --description "Task accepted by A5-Reserve team" \
  --color "00D9FF" \
  --force

gh label create "⏳ reserve:queued" \
  --description "Task queued - waiting for capacity" \
  --color "FBCA04" \
  --force

gh label create "❌ reserve:rejected" \
  --description "Task rejected - insufficient capacity or out of scope" \
  --color "D73A4A" \
  --force

gh label create "🔄 reserve:delegated" \
  --description "Task delegated to another team" \
  --color "8B88FF" \
  --force

# TEAM Category
gh label create "👥 team:a1-alpha" \
  --description "Task originated from Team A1-Alpha" \
  --color "1D76DB" \
  --force

gh label create "👥 team:a2-beta" \
  --description "Task originated from Team A2-Beta" \
  --color "2EA44F" \
  --force

gh label create "👥 team:a3-gamma" \
  --description "Task originated from Team A3-Gamma" \
  --color "FF79C6" \
  --force

gh label create "👥 team:a4-delta" \
  --description "Task originated from Team A4-Delta" \
  --color "FF4444" \
  --force

gh label create "👥 team:a5-reserve" \
  --description "Task owned by Team A5-Reserve" \
  --color "00FF88" \
  --force

gh label create "👥 team:external" \
  --description "Task from external organization" \
  --color "CFD3D7" \
  --force

# CAPACITY Category
gh label create "🟢 capacity:available" \
  --description "Team has available capacity" \
  --color "2EA44F" \
  --force

gh label create "🟡 capacity:limited" \
  --description "Team has limited capacity - selective acceptance" \
  --color "FBCA04" \
  --force

gh label create "🔴 capacity:full" \
  --description "Team at full capacity - rejecting new tasks" \
  --color "D73A4A" \
  --force

echo "✅ Reserve Task Management Labels created successfully!"
echo ""
echo "📊 Label Summary:"
echo "  - RESERVE Category: 5 labels"
echo "  - TEAM Category: 6 labels"
echo "  - CAPACITY Category: 3 labels"
echo "  - Total: 14 new labels"
echo ""
echo "🎯 Total Label System: 67 labels (53 existing + 14 new)"
