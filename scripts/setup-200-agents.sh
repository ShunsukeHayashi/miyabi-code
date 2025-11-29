#!/bin/bash
# ============================================
# 🤖 200 Agents Setup Script
# 200匹のエージェント環境を構築
# ============================================

echo "🤖 200匹のエージェント環境を構築中..."

# MUGEN (001-100)
echo "📦 MUGEN エージェント (001-100) 作成中..."
for i in $(seq -w 1 100); do
    AGENT_DIR="/home/agent-$i"
    if [ ! -d "$AGENT_DIR" ]; then
        sudo mkdir -p "$AGENT_DIR"
        sudo chown ubuntu:ubuntu "$AGENT_DIR"
        echo "  ✅ agent-$i 作成"
    fi
done

echo ""
echo "✅ MUGEN側 100エージェント作成完了"
echo ""
echo "📊 結果:"
ls -d /home/agent-* 2>/dev/null | wc -l | xargs echo "作成済みエージェント数:"
