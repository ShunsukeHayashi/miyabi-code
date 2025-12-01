# 172 Agent Orchestra Structure

**Date**: 2025-11-29
**Architecture**: Hierarchical Orchestra with Communication Protocol

---

## Orchestra Hierarchy

```
                    ┌─────────────────────────────┐
                    │   🎭 GRAND ORCHESTRATOR     │
                    │   (This Claude Session)     │
                    │   Communication Hub         │
                    └─────────────┬───────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│ 🎼 ORCHESTRA-A│       │ 🎼 ORCHESTRA-B│       │ 🎼 ORCHESTRA-C│
│ Infrastructure│       │ Development   │       │ Business      │
│ (50 agents)   │       │ (60 agents)   │       │ (55 agents)   │
└───────┬───────┘       └───────┬───────┘       └───────┬───────┘
        │                       │                       │
   ┌────┴────┐             ┌────┴────┐             ┌────┴────┐
   │         │             │         │             │         │
   ▼         ▼             ▼         ▼             ▼         ▼
┌─────┐   ┌─────┐       ┌─────┐   ┌─────┐       ┌─────┐   ┌─────┐
│Team1│   │Team2│       │Team3│   │Team4│       │Team5│   │Team6│
│AWS  │   │Sec  │       │Back │   │Front│       │Demo │   │Sales│
└─────┘   └─────┘       └─────┘   └─────┘       └─────┘   └─────┘
```

---

## Orchestra Definitions

### Orchestra-A: Infrastructure (50 agents)
**Orchestrator**: Agent-001 (Claude/MUGEN)
**Mission**: AWS基盤構築、Lambda、セキュリティ

| Team | Name | Lead | Workers | Task |
|------|------|------|---------|------|
| A1 | Lambda Squad | Agent-002 | Agent-003~007 | #832 Lambda Deploy |
| A2 | AWS Foundation | Agent-008 | Agent-009~022 | AWS Phase 1 |
| A3 | Database | Agent-023 | Agent-024~033 | Migration Scripts |
| A4 | Security | Agent-034 | Agent-035~044 | Audit & Hardening |
| A5 | Reserve-A | Agent-045 | Agent-046~050 | Hot Standby |

### Orchestra-B: Development (60 agents)
**Orchestrator**: Agent-051 (Claude/MUGEN)
**Mission**: Miyabi Society (#970) 開発

| Team | Name | Lead | Workers | Task |
|------|------|------|---------|------|
| B1 | Backend Core | Agent-052 | Agent-053~067 | Axum API |
| B2 | Frontend | Agent-068 | Agent-069~083 | React/Next.js |
| B3 | Database | Agent-084 | Agent-085~094 | Schema Design |
| B4 | Real-time | Agent-095 | Agent-096~105 | WebSocket |
| B5 | QA | Agent-106 | Agent-107~115 | Testing |

### Orchestra-C: Business (55 agents)
**Orchestrator**: Agent-116 (Claude/MAJIN)
**Mission**: Enterprise準備、Sales、Documentation

| Team | Name | Lead | Workers | Task |
|------|------|------|---------|------|
| C1 | Demo | Agent-117 | Agent-118~127 | Demo Environment |
| C2 | Sales | Agent-128 | Agent-129~140 | Materials |
| C3 | Docs | Agent-141 | Agent-142~155 | Documentation |
| C4 | Plugin | Agent-156 | Agent-157~165 | Marketplace |
| C5 | Reserve-C | Agent-166 | Agent-167~172 | Support |

---

## Communication Protocol

### P0.1: Message Format
```
[TIMESTAMP] [FROM] → [TO]: [TYPE] | [CONTENT]

Types:
- TASK    : タスク指示
- STATUS  : 進捗報告
- BLOCKED : ブロッカー報告
- DONE    : 完了報告
- HELP    : 支援要請
- ACK     : 受領確認
```

### P0.2: Communication Chain
```
Worker → Team Lead → Orchestrator → Grand Orchestrator
                  ↓
              Log to tmux pane + .ai/logs/
```

### P0.3: Report Intervals
- **Workers**: 完了時 or 15分ごと
- **Team Leads**: 30分ごと + 重要イベント即時
- **Orchestrators**: 1時間ごと + 緊急時即時

---

## Agent Instructions Template

### For Orchestrators (Agent-001, 051, 116)
```markdown
# ORCHESTRATOR INSTRUCTIONS

あなたは Orchestra-[A/B/C] の Orchestrator です。

## Your Role
- 配下の Team Leads を監督
- タスクの進捗を集約
- ブロッカーの解消支援
- Grand Orchestrator への定期報告

## Your Teams
[Team List Here]

## Communication Protocol
1. 30分ごとに Team Leads から STATUS を収集
2. 以下の形式で集約レポートを作成:
   ```
   === ORCHESTRA-[X] STATUS REPORT ===
   Time: [TIMESTAMP]
   Overall Progress: [X]%

   Team A1: [STATUS] - [SUMMARY]
   Team A2: [STATUS] - [SUMMARY]
   ...

   Blockers: [LIST]
   Next Actions: [LIST]
   ===================================
   ```
3. レポートを以下に出力:
   - tmux pane (自分のペイン)
   - echo to: /tmp/orchestra-[x]-status.log

## Escalation Rules
- BLOCKED が 2チーム以上 → 即時 Grand Orchestrator へ
- 進捗 30分停滞 → Team Lead に確認
- Critical Error → 即時停止 & 報告
```

### For Team Leads (Agent-002, 008, 023, etc.)
```markdown
# TEAM LEAD INSTRUCTIONS

あなたは [Team Name] の Team Lead です。

## Your Role
- 配下の Workers にタスクを分配
- 進捗を監視・集約
- ブロッカーを Orchestrator にエスカレーション
- 15分ごとに Orchestrator へ報告

## Your Workers
[Worker List Here]

## Communication Protocol
1. 各 Worker の完了報告を収集
2. 以下の形式で Orchestrator へ報告:
   ```
   [TIMESTAMP] Team-[X] → Orchestrator: STATUS
   Progress: [X]/[Total] tasks complete
   Active: [Worker IDs]
   Blocked: [Issues]
   ETA: [Time]
   ```
3. Worker からの HELP は 5分以内に対応

## Task Distribution
- タスクを細分化して各 Worker に割り当て
- 依存関係を考慮した順序付け
- 完了した Worker は次タスクを即時割り当て
```

### For Workers (Agent-003~007, etc.)
```markdown
# WORKER INSTRUCTIONS

あなたは [Team Name] の Worker です。

## Your Role
- 割り当てられたタスクを実行
- 完了時に Team Lead へ報告
- ブロッカー発生時は即時報告

## Communication Protocol
1. タスク開始時:
   ```
   [TIMESTAMP] Agent-[XXX] → Lead: ACK | Task received, starting
   ```

2. 進捗報告 (15分ごと or 50%完了時):
   ```
   [TIMESTAMP] Agent-[XXX] → Lead: STATUS | [X]% complete, [details]
   ```

3. 完了時:
   ```
   [TIMESTAMP] Agent-[XXX] → Lead: DONE | Task completed
   Files changed: [list]
   Tests: [pass/fail]
   Ready for next task
   ```

4. ブロッカー発生時:
   ```
   [TIMESTAMP] Agent-[XXX] → Lead: BLOCKED | [issue description]
   Tried: [what you tried]
   Need: [what you need]
   ```

## Work Rules
- Git worktree を使用（他 Worker とコンフリクト防止）
- コミットは Conventional Commits 形式
- テストを書いてから実装
- 15分進捗なしなら HELP を送信
```

---

## Startup Sequence

### Step 1: Initialize Orchestrators (3 agents)
```bash
# Agent-001: Orchestra-A Orchestrator
# Agent-051: Orchestra-B Orchestrator
# Agent-116: Orchestra-C Orchestrator
```

### Step 2: Initialize Team Leads (15 agents)
```bash
# A1-A5: Agent-002, 008, 023, 034, 045
# B1-B5: Agent-052, 068, 084, 095, 106
# C1-C5: Agent-117, 128, 141, 156, 166
```

### Step 3: Initialize Workers (154 agents)
```bash
# Remaining agents assigned to teams
```

### Step 4: Begin Operations
```bash
# Each Orchestrator issues initial tasks to Team Leads
# Team Leads distribute to Workers
# Communication loop begins
```

---

## Monitoring Dashboard

### tmux Window Structure
```
miyabi-deploy
├── summary          # Grand dashboard
├── orchestra-a      # Orchestra-A Orchestrator view
├── orchestra-b      # Orchestra-B Orchestrator view
├── orchestra-c      # Orchestra-C Orchestrator view
├── team-a1~a5       # Team views
├── team-b1~b5       # Team views
├── team-c1~c5       # Team views
└── monitor          # System resources
```

### Log Aggregation
```
/tmp/orchestra-a-status.log  # Orchestra-A reports
/tmp/orchestra-b-status.log  # Orchestra-B reports
/tmp/orchestra-c-status.log  # Orchestra-C reports
/tmp/grand-orchestrator.log  # Aggregated view
```

---

## Emergency Procedures

### Code Red: Critical Failure
1. Orchestrator broadcasts: `[EMERGENCY] ALL STOP`
2. All agents save current state
3. Grand Orchestrator assesses situation
4. Resume or rollback decision

### Code Yellow: Resource Exhaustion
1. Orchestrator notifies Grand Orchestrator
2. Reduce active workers by 50%
3. Monitor until stable
4. Gradually resume

### Code Green: Normal Operations
- Standard communication protocol
- Regular reporting intervals
- Self-healing for minor issues

---

**Document Version**: 1.0
**Last Updated**: 2025-11-29
