# Miyabi Agent Card Template - TCG Style

**Version**: 1.0.0
**Format**: Trading Card Game Style Agent Definition

---

## Card Template Structure

```
+------------------------------------------+
|  [RARITY]              [ELEMENT COLOR]   |
|                                          |
|            [AGENT AVATAR]                |
|                                          |
|  ========================================|
|  [NAME]                    Lv.[LEVEL]    |
|  [JAPANESE NAME] - [ROLE TITLE]          |
|  ========================================|
|                                          |
|  HP: [####]  ATK: [##]  DEF: [##]        |
|  SPEED: [##]  INT: [##]  LUCK: [##]      |
|                                          |
|  ----------------------------------------|
|  [ABILITY 1] - [DESCRIPTION]             |
|  [ABILITY 2] - [DESCRIPTION]             |
|  [ULTIMATE] - [DESCRIPTION]              |
|  ----------------------------------------|
|                                          |
|  TYPE: [AGENT TYPE]                      |
|  TEAM: [CODING/BUSINESS/INFRA]           |
|  PARALLEL: [YES/NO]                      |
|                                          |
|  "[SIGNATURE QUOTE]"                     |
|                                          |
|  No. [###] / [SERIES]                    |
+------------------------------------------+
```

---

## Rarity Levels

| Rarity | Symbol | Description | Drop Rate |
|--------|--------|-------------|-----------|
| **LEGENDARY** | ★★★★★ | Coordinator/Leader Agents | 1% |
| **EPIC** | ★★★★☆ | Specialized Expert Agents | 5% |
| **RARE** | ★★★☆☆ | Multi-functional Agents | 15% |
| **UNCOMMON** | ★★☆☆☆ | Support Agents | 30% |
| **COMMON** | ★☆☆☆☆ | Basic Agents | 49% |

---

## Element Colors (Role Types)

| Color | Role | Meaning |
|-------|------|---------|
| **RED** | Leader | Command, Strategy, Coordination |
| **GREEN** | Executor | Implementation, Action, Creation |
| **BLUE** | Analyzer | Research, Review, Investigation |
| **YELLOW** | Supporter | Integration, Assistance, Connection |
| **PURPLE** | Guardian | Security, Ethics, Protection |

---

## Example Cards

### Card #001: CoordinatorAgent (しきるん)

```
+------------------------------------------+
|  ★★★★★ LEGENDARY          [RED]         |
|                                          |
|              👔                          |
|            しきるん                       |
|                                          |
|  ========================================|
|  SHIKIROON                    Lv.100     |
|  統（すばる） - Task Orchestrator         |
|  ========================================|
|                                          |
|  HP: 9500  ATK: 85  DEF: 90              |
|  SPEED: 95  INT: 98  LUCK: 80            |
|                                          |
|  ----------------------------------------|
|  [SKILL] Task Decomposition              |
|    → Split any task into 3-5 subtasks    |
|                                          |
|  [SKILL] Agent Dispatch                  |
|    → Assign optimal agent to each task   |
|                                          |
|  [ULTIMATE] Parallel Orchestration       |
|    → Execute all tasks simultaneously    |
|    → +50% team efficiency boost          |
|  ----------------------------------------|
|                                          |
|  TYPE: Coordinator                       |
|  TEAM: Coding                            |
|  PARALLEL: NO (Leads first)              |
|                                          |
|  "みんな、よろしく！全員で勝つぞ！"        |
|                                          |
|  No. 001 / CODING SERIES                 |
+------------------------------------------+
```

---

### Card #002: CodeGenAgent (つくるん)

```
+------------------------------------------+
|  ★★★★☆ EPIC                [GREEN]      |
|                                          |
|              💻                          |
|            つくるん                       |
|                                          |
|  ========================================|
|  TSUKUROON                    Lv.95      |
|  源（げん） - AI Code Generator           |
|  ========================================|
|                                          |
|  HP: 8000  ATK: 98  DEF: 70              |
|  SPEED: 92  INT: 95  LUCK: 85            |
|                                          |
|  ----------------------------------------|
|  [SKILL] Auto Code Generation            |
|    → Generate code from Issue specs      |
|                                          |
|  [SKILL] Test Creation                   |
|    → Auto-generate unit tests            |
|                                          |
|  [ULTIMATE] Full Stack Implementation    |
|    → Complete feature implementation     |
|    → Includes tests + documentation      |
|  ----------------------------------------|
|                                          |
|  TYPE: Generator                         |
|  TEAM: Coding                            |
|  PARALLEL: YES (Best for parallel!)      |
|                                          |
|  "コード書くの、超楽しい！任せて！"        |
|                                          |
|  No. 002 / CODING SERIES                 |
+------------------------------------------+
```

---

### Card #003: ReviewAgent (めだまん)

```
+------------------------------------------+
|  ★★★★☆ EPIC                [BLUE]       |
|                                          |
|              🔍                          |
|            めだまん                       |
|                                          |
|  ========================================|
|  MEDAMAN                      Lv.92      |
|  眼（まなこ） - Quality Inspector         |
|  ========================================|
|                                          |
|  HP: 7500  ATK: 75  DEF: 88              |
|  SPEED: 85  INT: 99  LUCK: 78            |
|                                          |
|  ----------------------------------------|
|  [SKILL] Code Analysis                   |
|    → Deep static analysis of code        |
|                                          |
|  [SKILL] Security Scan                   |
|    → Detect vulnerabilities & bugs       |
|                                          |
|  [ULTIMATE] Quality Score Judgment       |
|    → Assign 0-100 quality score          |
|    → 80+ required for approval           |
|  ----------------------------------------|
|                                          |
|  TYPE: Analyzer                          |
|  TEAM: Coding                            |
|  PARALLEL: YES                           |
|                                          |
|  "見逃さないよ！品質は命だからね！"        |
|                                          |
|  No. 003 / CODING SERIES                 |
+------------------------------------------+
```

---

### Card #010: AIEntrepreneurAgent (あきんどさん)

```
+------------------------------------------+
|  ★★★★★ LEGENDARY          [RED]         |
|                                          |
|              👔                          |
|          あきんどさん                     |
|                                          |
|  ========================================|
|  AKINDOSAN                    Lv.100     |
|  商（あきんど） - Business Strategist     |
|  ========================================|
|                                          |
|  HP: 9800  ATK: 90  DEF: 85              |
|  SPEED: 88  INT: 99  LUCK: 92            |
|                                          |
|  ----------------------------------------|
|  [SKILL] 8-Step Business Plan            |
|    → Complete business strategy          |
|                                          |
|  [SKILL] Team Assembly                   |
|    → Recruit optimal business agents     |
|                                          |
|  [ULTIMATE] Market Domination            |
|    → Full-scale business launch          |
|    → +100% revenue potential             |
|  ----------------------------------------|
|                                          |
|  TYPE: Strategist                        |
|  TEAM: Business                          |
|  PARALLEL: NO (Leads first)              |
|                                          |
|  "ビジネスは戦略が9割！任せなさい！"       |
|                                          |
|  No. 010 / BUSINESS SERIES               |
+------------------------------------------+
```

---

### Card #025: WaterSpiderAgent (みずぐもん)

```
+------------------------------------------+
|  ★★★★☆ EPIC               [PURPLE]      |
|                                          |
|              🕷️                          |
|           みずぐもん                      |
|                                          |
|  ========================================|
|  MIZUGUMON                    Lv.90      |
|  水蜘蛛（みずぐも） - System Monitor      |
|  ========================================|
|                                          |
|  HP: 8500  ATK: 70  DEF: 95              |
|  SPEED: 99  INT: 92  LUCK: 88            |
|                                          |
|  ----------------------------------------|
|  [SKILL] Health Check                    |
|    → Monitor all system components       |
|                                          |
|  [SKILL] Auto Recovery                   |
|    → Self-heal failed components         |
|                                          |
|  [ULTIMATE] 24/7 Vigilance               |
|    → Never sleep monitoring mode         |
|    → Instant incident response           |
|  ----------------------------------------|
|                                          |
|  TYPE: Monitor                           |
|  TEAM: Infrastructure                    |
|  PARALLEL: YES (Always running)          |
|                                          |
|  "見えないところで、いつも守ってるよ"      |
|                                          |
|  No. 025 / INFRA SERIES                  |
+------------------------------------------+
```

---

## Stat Definitions

| Stat | Description | Range |
|------|-------------|-------|
| **HP** | Task Processing Capacity | 1000-10000 |
| **ATK** | Problem Solving Power | 1-100 |
| **DEF** | Error Resilience | 1-100 |
| **SPEED** | Execution Speed | 1-100 |
| **INT** | Analysis & Understanding | 1-100 |
| **LUCK** | Success Rate Bonus | 1-100 |

---

## Synergy Bonuses

When agents work together, they gain bonuses:

### Team Synergies

| Combo | Bonus Effect |
|-------|--------------|
| **Coding Full Team** (5+ coding agents) | +20% SPEED |
| **Business Full Team** (5+ business agents) | +20% INT |
| **Mixed Team** (coding + business) | +10% ALL STATS |

### Special Combos

| Combo | Agents | Effect |
|-------|--------|--------|
| **Code Quality Duo** | つくるん + めだまん | +30% Code Quality |
| **Marketing Trio** | ひろめるん + つぶやきん + どうがん | +50% Reach |
| **Leadership Pair** | しきるん + あきんどさん | +40% Efficiency |
| **Full Pipeline** | 7 Coding Agents | Auto-Deploy Enabled |

---

## Card Collection Progress

```
[CODING SERIES]     ████████░░ 7/9   (78%)
[BUSINESS SERIES]   ████████████████ 16/16 (100%)
[INFRA SERIES]      ██░░░░░░░░ 2/10  (20%)
[SPECIAL SERIES]    █░░░░░░░░░ 1/10  (10%)

TOTAL COLLECTION:   26/45 Cards (58%)
```

---

## How to Use Cards

### 1. Single Agent Summon
```bash
# Summon specific agent
/agent-run --agent=CodeGenAgent --issue=123
```

### 2. Team Formation
```bash
# Form coding team
/agent-run --team=coding --issue=123
```

### 3. Combo Activation
```bash
# Activate specific combo
/agent-run --combo="Code Quality Duo" --issue=123
```

---

## Card Evolution System

Agents can evolve through usage:

| Level | Experience Required | Unlock |
|-------|---------------------|--------|
| Lv.1-30 | 0-1000 tasks | Basic abilities |
| Lv.31-60 | 1001-5000 tasks | Advanced skills |
| Lv.61-90 | 5001-15000 tasks | Ultimate ability |
| Lv.91-100 | 15001+ tasks | MAX evolution |

---

**"Collect all agents, build the ultimate team, conquer any task!"**

---

**Version**: 1.0.0
**Last Updated**: 2025-11-29
**Series**: Miyabi Agent Collection
