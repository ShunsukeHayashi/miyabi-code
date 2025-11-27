# 🎴 Miyabi Agent TCG Cards - Complete Guide

## ✨ What We Built

A complete **Trading Card Game (TCG) system** for visualizing Miyabi's 21 AI agents as collectible cards in ChatGPT!

### Features

- **🎴 Beautiful TCG Card Design**
  - Rarity badges (N, R, SR, SSR, UR)
  - Attribute colors and emojis (Fire 🔥, Light ✨, etc.)
  - Holographic effects on hover
  - Evolution stages with stars ⭐
  - Real-time stats (ATK, DEF, SPD, INT)

- **🏆 Achievement Tracking**
  - Tasks completed counter
  - Success rate percentage
  - Consecutive successes streak

- **⚡ Interactive Experience**
  - Click cards to see detailed view
  - Hover for holographic effects
  - Smooth animations and transitions
  - Responsive grid layout

- **🎯 Complete Agent Data**
  - 21 agents with full stats
  - Skills with rarities and descriptions
  - Japanese and English names
  - Evolution history

## 📂 Files Created

### React Components
- `openai-apps/miyabi-app/src/components/AgentTCGCard.tsx` - Main TCG card widget
- `openai-apps/miyabi-app/src/components/AgentSelectorWidget.tsx` - Agent selector UI

### Backend
- `openai-apps/miyabi-app/server/main.py` - Added `show_agent_cards` tool
- `openai-apps/miyabi-app/server/a2a_client.py` - A2A Bridge client

### Configuration
- `openai-apps/miyabi-app/vite.config.ts` - Added widget build targets
- `.claude/agents/AGENT_CARD_DATA.json` - Agent card data (21 agents)

## 🚀 Deployment

### Server Status
- **Endpoint**: https://792e1c41e9bd.ngrok-free.app/mcp
- **Location**: EC2 MUGEN (44.250.27.197:8000)
- **Status**: ✅ Running with 6 tools

### Available Tools

1. **execute_agent** - Execute Miyabi agents
2. **create_issue** - Create GitHub issues
3. **list_issues** - List GitHub issues
4. **get_project_status** - Show project status
5. **list_agents** - Show agent selector widget
6. **show_agent_cards** - **NEW!** Display TCG trading cards 🎴

## 🎮 How to Use in ChatGPT

### Method 1: Direct Tool Call

In ChatGPT with the Miyabi MCP integration:

```
Show me the Miyabi agent cards!
```

or

```
Display agent TCG cards
```

### Method 2: Explore Specific Agents

```
Show me details about the CoordinatorAgent card
```

```
What are the stats for CodeGenAgent?
```

### Method 3: Browse Collection

The TCG card widget shows:
- All 21 agents in a grid
- Filterable by clicking on cards
- Detailed stats and skills on click

## 🎯 Agent Card Data Structure

Each agent card includes:

```json
{
  "id": "coordinator-agent-001",
  "name_jp": "しきるん",
  "name_en": "Shikiroon",
  "agent_type": "CoordinatorAgent",
  "rarity": "SR",
  "attribute": "Fire",
  "level": 42,
  "experience": 38250,
  "required_exp": 54000,
  "stats": {
    "ATK": 850,
    "DEF": 720,
    "SPD": 920,
    "INT": 880
  },
  "achievements": {
    "tasks_completed": 1425,
    "success_rate": 94.2,
    "consecutive_successes": 28
  },
  "evolution_stage": 2,
  "skills": [
    {
      "id": "parallel-boost-lv3",
      "name": "パラレルブーストLv3",
      "description": "同時に5つのタスクを処理可能",
      "rarity": "SR"
    }
  ],
  "holographic_effect": "diamond",
  "description": "DAGベースで並列タスクを統括する指揮官"
}
```

## 🎨 Visual Design

### Rarity Colors
- **N** (Normal): Gray #808080
- **R** (Rare): Blue #4a9eff
- **SR** (Super Rare): Purple #9d4eff
- **SSR** (Super Super Rare): Gold #ffb800
- **UR** (Ultra Rare): Red #ff4444

### Attributes
- 🔥 Fire: #ff4500
- 💧 Water: #1e90ff
- 🌍 Earth: #8b4513
- 💨 Wind: #90ee90
- ✨ Light: #ffd700
- 🌑 Dark: #483d8b
- ⚡ Electric: #ffff00

## 📊 All 21 Agents

### Coding Agents (7)
1. **CoordinatorAgent** (しきるん) - SR, Fire 🔥
2. **CodeGenAgent** (つくるん) - SSR, Light ✨
3. **ReviewAgent** (みてるん) - R, Water 💧
4. **IssueAgent** (かいけつん) - SR, Earth 🌍
5. **PRAgent** (まとめるん) - R, Wind 💨
6. **DeploymentAgent** (はこぶん) - SSR, Electric ⚡
7. **RefresherAgent** (さいしんくん) - R, Light ✨

### Business Agents (14)
8. **AIEntrepreneurAgent** - SSR, Light ✨
9. **SelfAnalysisAgent** - R, Water 💧
10. **MarketResearchAgent** - SR, Earth 🌍
...and more!

## 🔧 Technical Details

### Widget Loading
Widgets are built with Vite and served as standalone modules:
```
assets/agent-tcg-card.CrHD7MwT.js
```

### MCP Protocol
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "show_agent_cards",
    "arguments": {}
  }
}
```

### Response Format
```json
{
  "content": [
    {
      "type": "text",
      "text": "⭐ MIYABI AGENTS TCG - 21 Collectible Agent Cards"
    },
    {
      "type": "resource",
      "resource": {
        "uri": "data:text/html;base64,<!DOCTYPE html>...",
        "mimeType": "text/html"
      }
    }
  ],
  "isError": false
}
```

## 🎯 Next Steps

### Potential Enhancements
- [ ] Add card filtering by rarity/attribute
- [ ] Implement card evolution animations
- [ ] Add comparison mode (compare 2 cards)
- [ ] Create card deck builder
- [ ] Add achievement unlocks
- [ ] Implement trading/collection system
- [ ] Add card stats history graph
- [ ] Create battle simulation mode

### Future Ideas
- **Card Packs**: Open random card packs
- **Achievements**: Unlock special cards
- **Events**: Limited-time event cards
- **Battles**: Agent vs Agent simulations
- **Rankings**: Global agent leaderboard

## 📝 Credits

**Created**: 2025-11-27
**By**: Claude Code + Miyabi Framework
**Technology**: React + TypeScript + Vite + FastAPI + MCP Protocol

---

**Ready to collect all 21 Miyabi Agents?** 🎴✨

Try it now in ChatGPT with the Miyabi MCP integration!
