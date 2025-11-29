#!/bin/bash
# ============================================
# 🎯 Codex Worker Army Roll Call
# Claude Code Coordinator + Codex Workers
# ============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

clear
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║        🎯 CODEX WORKER ARMY - ROLL CALL (点呼)             ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# === COORDINATORS (Claude Code) ===
echo -e "${MAGENTA}👑 COORDINATORS (Claude Code)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

COORD_COUNT=0
for session in orchestra-conductor orchestra-hub; do
    if tmux has-session -t "$session" 2>/dev/null; then
        echo -e "  ${GREEN}✅${NC} $session - 稼働中"
        ((COORD_COUNT++))
    else
        echo -e "  ${RED}❌${NC} $session - 停止"
    fi
done
echo ""

# === CODEX WORKERS ===
echo -e "${MAGENTA}🤖 CODEX WORKERS (実行部隊)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ディレクトリ存在確認
DIR_COUNT=0
for i in $(seq 1 100); do
    NUM=$(printf "%03d" $i)
    if [ -d "/home/agent-$NUM" ]; then
        ((DIR_COUNT++))
    fi
done

echo -e "  ${CYAN}エージェントディレクトリ:${NC} $DIR_COUNT/100"
echo ""

# Codex セッション確認
CODEX_RUNNING=0
for i in $(seq 1 100); do
    NUM=$(printf "%03d" $i)
    if tmux has-session -t "codex-worker-$NUM" 2>/dev/null; then
        ((CODEX_RUNNING++))
    fi
done

# プログレスバー
echo -n "  Codex稼働: ["
for i in $(seq 1 50); do
    if [ $i -le $((CODEX_RUNNING / 2)) ]; then
        echo -n "█"
    else
        echo -n "░"
    fi
done
echo "] $CODEX_RUNNING/100"
echo ""

# 設定ファイル確認
CONFIG_COUNT=0
for i in $(seq 1 100); do
    NUM=$(printf "%03d" $i)
    if [ -f "/home/agent-$NUM/codex-config.json" ]; then
        ((CONFIG_COUNT++))
    fi
done
echo -e "  ${BLUE}設定済み:${NC}    $CONFIG_COUNT/100"
echo ""

# === LEGACY SQUADS (旧Claude Code) ===
echo -e "${MAGENTA}🎭 LEGACY SQUADS (移行中)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

SQUAD_COUNT=0
for i in $(seq 1 10); do
    if tmux has-session -t "orchestra-squad-$i" 2>/dev/null; then
        ((SQUAD_COUNT++))
    fi
done
echo -e "  旧Squad: $SQUAD_COUNT/10 稼働中 (→ Codexに移行予定)"
echo ""

# === サマリー ===
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                      📊 総合サマリー                        ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BLUE}Coordinators (Claude Code):${NC}  $COORD_COUNT/2"
echo -e "  ${YELLOW}Codex Workers:${NC}               $CODEX_RUNNING/100 稼働"
echo -e "  ${GREEN}Agent Directories:${NC}           $DIR_COUNT/100"
echo -e "  ${CYAN}Config Files:${NC}                $CONFIG_COUNT/100"
echo ""

if [ "$CODEX_RUNNING" -eq 0 ]; then
    echo -e "${YELLOW}  ⚠️ Codexワーカー未起動${NC}"
    echo -e "${BLUE}  💡 起動コマンド: start-codex-workers${NC}"
elif [ "$CODEX_RUNNING" -eq 100 ]; then
    echo -e "${GREEN}  ╔═════════════════════════════════════╗${NC}"
    echo -e "${GREEN}  ║  🎉 全100匹 Codexワーカー稼働中！  ║${NC}"
    echo -e "${GREEN}  ╚═════════════════════════════════════╝${NC}"
else
    echo -e "${YELLOW}  ⚡ $CODEX_RUNNING/100 Codexワーカー稼働中${NC}"
fi
echo ""
