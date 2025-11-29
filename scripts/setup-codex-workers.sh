#!/bin/bash
# ============================================
# 🎯 Codex Worker Army Setup
# Claude Code = Coordinator/Orchestrator
# Codex = Worker Agents (実行部隊)
# ============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     🎯 Codex Worker Army Architecture Setup                 ║${NC}"
echo -e "${CYAN}║                                                              ║${NC}"
echo -e "${CYAN}║   Claude Code = Coordinator/Orchestrator (管理・指揮)       ║${NC}"
echo -e "${CYAN}║   Codex       = Worker Agents (実行部隊)                    ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 1. 各エージェントディレクトリにCodex設定を配置
echo -e "${YELLOW}[1/3]${NC} エージェントディレクトリにCodex設定を配置中..."

for i in $(seq 1 100); do
    NUM=$(printf "%03d" $i)
    AGENT_DIR="/home/agent-$NUM"
    
    if [ -d "$AGENT_DIR" ]; then
        # Codex用の設定ファイルを作成
        cat > "$AGENT_DIR/codex-config.json" << EOF
{
  "agent_id": "agent-$NUM",
  "role": "worker",
  "type": "codex",
  "coordinator": "orchestra-hub",
  "capabilities": ["code_execution", "file_operations", "testing"],
  "max_concurrent_tasks": 3,
  "report_to": "orchestra-conductor"
}
EOF
        
        # 起動スクリプト
        cat > "$AGENT_DIR/start-codex.sh" << 'WORKER_SCRIPT'
#!/bin/bash
AGENT_ID=$(basename $(pwd))
echo "🤖 Starting Codex Worker: $AGENT_ID"
cd /home/ubuntu/miyabi-private
codex --model o4-mini --approval-mode full-auto
WORKER_SCRIPT
        chmod +x "$AGENT_DIR/start-codex.sh"
    fi
done

echo -e "    ${GREEN}✅ 100エージェントにCodex設定完了${NC}"

# 2. Orchestrator Hub 設定更新
echo -e "${YELLOW}[2/3]${NC} Orchestra Hub (Claude Code Coordinator) 設定中..."

cat > /home/ubuntu/miyabi-private/.claude/coordinator-config.json << 'COORD_CONFIG'
{
  "role": "coordinator",
  "name": "Orchestra Conductor",
  "type": "claude-code",
  "responsibilities": [
    "task_distribution",
    "worker_management", 
    "progress_monitoring",
    "result_aggregation",
    "error_handling"
  ],
  "workers": {
    "type": "codex",
    "count": 100,
    "location": "/home/agent-*/",
    "communication": "tmux"
  },
  "squads": {
    "count": 10,
    "agents_per_squad": 10
  }
}
COORD_CONFIG

echo -e "    ${GREEN}✅ Coordinator設定完了${NC}"

# 3. ワーカー起動スクリプト
echo -e "${YELLOW}[3/3]${NC} Codexワーカー一括起動スクリプト作成中..."

cat > /home/ubuntu/miyabi-private/scripts/start-codex-workers.sh << 'START_SCRIPT'
#!/bin/bash
# Codex Worker 一括起動

echo "🚀 Codex Workers 起動中..."

STARTED=0
for i in $(seq 1 100); do
    NUM=$(printf "%03d" $i)
    SESSION_NAME="codex-worker-$NUM"
    AGENT_DIR="/home/agent-$NUM"
    
    # 既存セッションがなければ作成
    if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
        tmux new-session -d -s "$SESSION_NAME" -c "$AGENT_DIR"
        tmux send-keys -t "$SESSION_NAME" "cd /home/ubuntu/miyabi-private && codex --model o4-mini --approval-mode full-auto" Enter
        ((STARTED++))
        
        # 10匹ごとに表示
        if [ $((STARTED % 10)) -eq 0 ]; then
            echo "  ✅ $STARTED/100 workers started"
        fi
    fi
done

echo ""
echo "🎉 $STARTED Codex workers 起動完了！"
START_SCRIPT
chmod +x /home/ubuntu/miyabi-private/scripts/start-codex-workers.sh

echo -e "    ${GREEN}✅ 起動スクリプト作成完了${NC}"

# 完了
echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}  ✅ Codex Worker Army セットアップ完了！${NC}"
echo ""
echo -e "  ${CYAN}アーキテクチャ:${NC}"
echo -e "    ┌─────────────────────────────────────┐"
echo -e "    │  ${BLUE}Claude Code${NC} (Coordinator)         │"
echo -e "    │    └─ orchestra-conductor           │"
echo -e "    │    └─ orchestra-hub                 │"
echo -e "    └─────────────────────────────────────┘"
echo -e "                    ↓ 指示"
echo -e "    ┌─────────────────────────────────────┐"
echo -e "    │  ${YELLOW}Codex Workers${NC} (実行部隊)          │"
echo -e "    │    └─ agent-001 〜 agent-100        │"
echo -e "    │    └─ 各ワーカー: o4-mini full-auto │"
echo -e "    └─────────────────────────────────────┘"
echo ""
echo -e "  ${BLUE}💡 コマンド:${NC}"
echo -e "     start-codex-workers  - 全ワーカー起動"
echo -e "     roll-call            - 生存確認"
echo ""
