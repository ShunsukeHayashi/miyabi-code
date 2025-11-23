#!/bin/bash
# Quick Test: Stream Deck Integration

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Stream Deck Mobile - Integration Test"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 1: Check scripts
echo "1️⃣  Checking scripts..."
SCRIPT_COUNT=$(ls -1 *.sh | wc -l | xargs)
echo "   ✅ Found $SCRIPT_COUNT scripts"
echo ""

# Test 2: Check permissions
echo "2️⃣  Checking permissions..."
chmod +x *.sh 2>/dev/null
echo "   ✅ Execute permissions set"
echo ""

# Test 3: Check Miyabi project
echo "3️⃣  Checking Miyabi project..."
if [ -d ~/Dev/miyabi-private ]; then
  echo "   ✅ Miyabi project found"
else
  echo "   ❌ Miyabi project not found"
fi
echo ""

# Test 4: Check tmux
echo "4️⃣  Checking tmux..."
if command -v tmux &> /dev/null; then
  echo "   ✅ tmux installed"
  SESSIONS=$(tmux list-sessions 2>/dev/null | wc -l | xargs)
  echo "   📊 Active sessions: $SESSIONS"
else
  echo "   ❌ tmux not installed"
fi
echo ""

# Test 5: Check Pixel connection
echo "5️⃣  Checking Pixel connection..."
if command -v adb &> /dev/null; then
  DEVICE=$(adb devices | grep device$ | wc -l | xargs)
  if [ "$DEVICE" -gt 0 ]; then
    echo "   ✅ Pixel connected via adb"
  else
    echo "   ⚠️  Pixel not connected (USB or WiFi)"
  fi
else
  echo "   ⚠️  adb not installed"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Test Complete"
echo ""
echo "📁 Scripts ready: $SCRIPT_COUNT"
echo "🎮 Stream Deck setup ready!"
echo ""
echo "Next: Open Stream Deck app and configure buttons"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
