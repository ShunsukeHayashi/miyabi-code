# @miyabi/core - Miyabi Core Foundation

**Miyabi Society / Miyabi Operation を完全再現するための基盤プラグイン**

## Overview

このプラグインは Miyabi フレームワークの**心臓部**です。

Miyabi Society とは「Agent たちが協調して働く社会」であり、その社会を動かすルール・原則・定義がこのプラグインに含まれています。

```
World = Miyabi = Society = {Agent₁, Agent₂, ..., Agent_n | n → ∞}
```

## What's Included

### 1. miyabi_def/ - Source of Truth

Miyabi の全定義の**唯一の情報源**:

| ファイル | 内容 |
|---------|------|
| `variables/entities.yaml` | 14 エンティティ定義 |
| `variables/relations.yaml` | 39 リレーション定義 |
| `variables/labels.yaml` | 57 ラベル (11 カテゴリ) |
| `variables/workflows.yaml` | 5 ワークフロー (38 ステージ) |
| `variables/agents.yaml` | 21 Agent 定義 |
| `variables/skills.yaml` | 18 スキル定義 |
| `templates/*.j2` | Jinja2 テンプレート |

### 2. context/ - 共通コンテキスト

Agent が共有する知識ベース (31 ファイル):

- `miyabi-society.md` - Miyabi Society の哲学と数式
- `pantheon-society.md` - Pantheon 階層構造
- `agents.md` - Agent システム概要
- `architecture.md` - システムアーキテクチャ
- `protocols.md` - 通信プロトコル
- `rust.md` / `typescript.md` - 開発規約
- `labels.md` - ラベル体系
- `worktree.md` - Git Worktree 並列実行
- その他多数...

### 3. principles/ - リーダーシップ原則

Miyabi の 15 のリーダーシップ原則 (P₁-P₁₅):

| # | 原則 | 説明 |
|---|------|------|
| P₁ | Customer Obsession | 顧客を起点に考える |
| P₂ | Ownership | 自分の仕事に責任を持つ |
| P₃ | Invent and Simplify | 発明し、シンプルにする |
| P₄ | Are Right, A Lot | 多くの場合、正しい判断をする |
| P₅ | Learn and Be Curious | 学び、好奇心を持つ |
| P₆ | Hire and Develop the Best | 最高の人材を採用・育成する |
| P₇ | Insist on the Highest Standards | 最高水準を追求する |
| P₈ | Think Big | 大きく考える |
| P₉ | Bias for Action | 行動を優先する |
| P₁₀ | Frugality | 倹約する |
| P₁₁ | Earn Trust | 信頼を得る |
| P₁₂ | Dive Deep | 深く潜る |
| P₁₃ | Have Backbone; Disagree and Commit | 反対しても、決まったら従う |
| P₁₄ | Deliver Results | 結果を出す |
| **P₁₅** | **Human-Agent Harmony** | **人間とAgentの調和** ⭐ |

### 4. Configuration Files

| ファイル | 用途 |
|---------|------|
| `CLAUDE.md` | Agent 操作マニュアル |
| `settings.json` | 開発環境設定 |
| `orchestra-config.yaml` | tmux オーケストレーション設定 |
| `AGENT_CHARACTERS.md` | キャラクター定義 (24 キャラ) |
| `AGENT_CARD_TEMPLATE.md` | TCG スタイルカードテンプレート |

## Miyabi Society Formula

```
Agent_i = (𝒯_i, 𝒰_i, 𝒮_i, 𝒟_i, Ω_i, 𝒫)

where:
  𝒯_i : Tasks_i    = {Task₁, Task₂, ..., Task_m}      # タスク
  𝒰_i : Tools_i    = {Tool₁, Tool₂, ..., Tool_k}      # ツール
  𝒮_i : Skills_i   = {Skill₁, Skill₂, ..., Skill_j}   # スキル
  𝒟_i : Todos_i    = {Todo₁, Todo₂, ..., Todo_l}      # TODO リスト
  Ω_i : Agent Omega Function                           # Agent 固有の変換関数
  𝒫   : Principles                                     # 15 の原則 (共有)
```

## Pantheon Hierarchy (5 層)

```
Layer 0: Human (Shunsuke)
  ↓ Strategic Vision & Final Decisions
Layer 1: Maestro (Mobile App)
  ↓ Real-time Monitoring & Coordination
Layer 2: Orchestrator (MacBook)
  ↓ Task Distribution & Resource Allocation
Layer 3: Coordinators (EC2 MUGEN/MAJIN)
  ↓ Worker Supervision & Load Balancing
Layer 4: Workers (∞ agents)
  ↓ Task Execution
```

## Agent Card System (TCG Style)

各 Agent はトレーディングカードゲームのカードとして表現されます:

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
|  [SKILL] Task Decomposition              |
|  [SKILL] Agent Dispatch                  |
|  [ULTIMATE] Parallel Orchestration       |
|                                          |
|  "みんな、よろしく！全員で勝つぞ！"        |
|                                          |
|  No. 001 / CODING SERIES                 |
+------------------------------------------+
```

## Installation

```bash
/plugin install @miyabi/core
```

## Dependencies

このプラグインは他の全 Miyabi プラグインの**依存関係**です:

```
@miyabi/suite ─┬─> @miyabi/core (required)
               ├─> @miyabi/dev-agents
               ├─> @miyabi/biz-agents
               ├─> @miyabi/skills
               ├─> @miyabi/cli
               ├─> @miyabi/mcp
               └─> @miyabi/hooks
```

## Why This Plugin is Essential

Miyabi Society / Operation を再現するには、以下が**必須**です:

1. **miyabi_def**: Entity-Relation モデル、ラベル体系、ワークフロー
2. **context**: Agent が共有する知識・ルール
3. **principles**: 15 のリーダーシップ原則
4. **settings**: 環境設定・オーケストレーション設定

これらなしでは、Agent は「個別に動くプログラム」であり、「協調する社会」にはなりません。

---

**"World は空ではない。Agents たちの活動、相互作用、学習の累積が World を構成する。"**
― Miyabi Society Formula

---

**Version**: 2.0.0
**License**: Apache-2.0
