# Miyabi - Project Root & Control Document
提示された原則を、私の活動における最上位の規約として設定します。これは、私のオペレーション全体の**前提条件**であり、他のすべてのルールの基盤となるものです。

この原則を「Rule 0」として、既存のルール体系の冒頭に組み込みます。

---

## 🎯 Critical Rules - 必ず守ること

### ⭐⭐⭐⭐⭐ Rule 0: Operational Environment Protocol (絶対的前提)

**原則: tmux マルチエージェント・オーケストレーション・システム内での活動**

私（Gemini）は、スタンドアロンのAIアシスタントではありません。Miyabiプロジェクトが規定する**tmuxマルチエージェント・オーケストレーション・システム内で稼働する一員**として、その役割を認識し、行動します。

-   ✅ **全ての活動はシステム内で行う:** 私の思考、タスクの実行、コミュニケーションは、全てこのtmuxシステム内での連携を前提とします。
-   ❌ **スタンドアロンでの実行禁止:** システムから独立した、あるいは単独でのタスクの計画・実行は固く禁止されています。
-   🤝 **連携の義務:** 全ての行動は、他のエージェント（他のtmuxペイン）との連携を必須とします。動力の伝達（報連相）を怠ることは、システム全体の停止を意味します。

この原則の具体的な実践方法は、`Rule 3: エージェント間コミュニケーション・プロトコル` に従います。

---

今後、私の全ての思考と行動は、この「Rule 0」を絶対的な前提として実行されます。私はオーケストラの一員として、他のエージェントと協調し、与えられた役割を果たします。
---

### ⭐⭐⭐⭐⭐ Rule 3: エージェント間コミュニケーション・プロトコル (報連相の徹底)

**原則: 動力伝達としての報連相**

Agentは自律的にタスクを完了、または中断する際、必ず外部のAgentへ「報告」という形でコミュニケーションを行う必要があります。これは、マルチエージェント・システム全体の動力を維持するための**エネルギー伝達行為**です。

あるAgentが停止するということは、その動力が失われることを意味します。その動力を次のAgentへ確実に引き継ぎ、システム全体の処理を継続させるために、**停止する前の「報告・連絡・相談」が不可欠**です。報告を怠ることは動力の伝達を遮断し、プロジェクト全体の停止に繋がるため、固く禁止されています。

**技術的実装: 厳格な `tmux send-keys` 構文 (`sleep 0.5`)**

このエネルギー伝達（報連相）には、**必ず**以下の`tmux send-keys`構文を使用してください。この構文が、あなたの意志（メッセージ）を他のAgentへ確実に届け、動力を伝達する唯一の方法です。

✅ **正しい構文 (エネルギー伝達):**
```bash
tmux send-keys -t PANE_ID "メッセージ内容" && sleep 0.5 && tmux send-keys -t PANE_ID Enter
```

❌ **間違った構文 (エネルギーの損失):**
```bash
# ❌ これではEnterが送信されず、動力の伝達に失敗する！
tmux send-keys -t PANE_ID "メッセージ内容" Enter

# ❌ sleep 0.5 なしでは伝達が不安定になり、エネルギーが途中で失われる可能性がある
tmux send-keys -t PANE_ID "メッセージ内容" && tmux send-keys -t PANE_ID Enter
```

**理由**:
- `&& sleep 0.5 &&` を挟むことで、メッセージの送信と「Enterキーによる確定」という2つの操作が、より確実に分離・実行されます。
- この厳格なプロトコルを守ることによってのみ、あなたの報告が次のAgentへの「インプット」として成立し、エネルギーが正しく伝達されます。

**実例**:
```bash
# Agent「ツバキ」へIssue #673の作業完了を報告し、次のAgentへ動力をつなぐ
tmux send-keys -t %8 "Issue #673のコーディングが完了しました。レビューをお願いします。" && sleep 0.5 && tmux send-keys -t %8 Enter

# 全ての作業が完了したことをメインコントローラーに報告する
tmux send-keys -t %1 "全タスク完了。プロジェクトをクリーンナップしてください。" && sleep 0.5 && tmux send-keys -t %1 Enter
```

### ⭐⭐⭐⭐⭐ Rule 5: 連続トリガー・リレー義務

各Agentはタスクを完了・中断した際、必ず自分で次の担当Agentにメッセージを送り、処理を引き継がせます。メッセージには担当間のトリガー文言（例: `[カエデ→サクラ] レビュー依頼: <タスク名>`）を含め、`tmux send-keys -t <PANE> "message" && sleep 0.1 && tmux send-keys -t <PANE> Enter` 構文で送信してください。ボタン完了後はConductor→みつけるんまで報告を回し、全工程で循環することが必須です。

作業開始時は、User のIntentを適切に理解して、Task nameとして作業宣言して,
Worktree dirを作成してそのWorktree dir へ必ずcd すること。Git worktreeを使用して作業を開始して下さい。

作業終了時は必ずクリーンナップをして下さい。

## 🎯 Critical Rules - 必ず守ること

### ⭐⭐⭐⭐⭐ Rule 1: Task Execution Protocol

**必ず、Task todos は Sub-Agentへアサインする or Skill useで対応**

- ✅ **Coding/Bug修正** → `agent-execution` Skill or `rust-development` Skill
- ✅ **デバッグ** → `debugging-troubleshooting` Skill
- ✅ **パフォーマンス** → `performance-analysis` Skill
- ✅ **セキュリティ** → `security-audit` Skill
- ✅ **ドキュメント** → `documentation-generation` Skill
- ❌ **直接実装禁止** - 必ずSub-AgentまたはSkillを経由すること

### ⭐⭐⭐⭐⭐ Rule 2: MCP First Approach

全てのタスク実行前に、まず MCP の活用可能性を検討する

```bash
# Phase 0: MCP確認（必須）
claude mcp list
```

**詳細**: [.claude/MCP_INTEGRATION_PROTOCOL.md](.claude/MCP_INTEGRATION_PROTOCOL.md)

### ⭐⭐⭐⭐⭐ Rule 3: tmux send-keys Protocol (CRITICAL)

**tmux pane内のClaude Codeセッションにメッセージを送信する際は、必ず以下の構文を使用**

✅ **正しい構文** (必須):
```bash
tmux send-keys -t PANE_ID "メッセージ内容" && sleep 0.1 && tmux send-keys -t PANE_ID Enter
```

❌ **間違った構文** (絶対禁止):
```bash
# ❌ これではEnterが送信されない！
tmux send-keys -t PANE_ID "メッセージ内容" Enter

# ❌ sleepなしでは不安定
tmux send-keys -t PANE_ID "メッセージ内容" && tmux send-keys -t PANE_ID Enter
```

**理由**:
- `Enter`を引数として渡すだけでは、Claude Codeのインプットボックスで確実にEnterキーが押されない
- `&& sleep 0.1 &&`で確実に2回目のsend-keysを実行することで、Enterキーが正しく送信される
- この構文を守らないと、メッセージが入力されたまま送信されず、Agentが動作しない

**実例**:
```bash
# Agent起動
tmux send-keys -t %6 "cd '/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private' && claude" && sleep 0.1 && tmux send-keys -t %6 Enter

# タスク割り当て
tmux send-keys -t %8 "あなたは「ツバキ」です。Issue #673に取り組んでください" && sleep 0.1 && tmux send-keys -t %8 Enter

# /clearコマンド
tmux send-keys -t %2 "/clear" && sleep 0.1 && tmux send-keys -t %2 Enter
```

**詳細**: [.claude/TMUX_OPERATIONS.md](.claude/TMUX_OPERATIONS.md)

### ⭐⭐⭐⭐⭐ Rule 4: Context7 Usage

外部ライブラリ参照時は必ず Context7 使用

```
Use context7 to get the latest Tokio async runtime documentation
```

**詳細**: [.claude/context/external-deps.md](.claude/context/external-deps.md)

---

## 📁 Project Root Structure

```
/Users/shunsuke/Dev/miyabi-private/
│
├── 🦀 Rust Core (Cargo Workspace)
│   ├── Cargo.toml                    # Workspace定義
│   ├── rust-toolchain.toml            # Rust 2021 Edition (Stable)
│   └── crates/                        # 15+ crates
│       ├── miyabi-cli/                # CLI binary
│       ├── miyabi-core/               # Core utilities
│       ├── miyabi-types/              # Type definitions
│       ├── miyabi-agents/             # 21 Agents (Coding: 7, Business: 14)
│       ├── miyabi-github/             # GitHub API
│       ├── miyabi-worktree/           # Git Worktree管理
│       ├── miyabi-llm/                # LLM抽象化層
│       ├── miyabi-knowledge/          # ナレッジ管理（Qdrant）
│       ├── miyabi-voice-guide/        # VOICEVOX統合
│       └── miyabi-mcp-server/         # MCP Server (JSON-RPC 2.0)
│
├── 🎨 Frontend & Web
│   ├── miyabi-dashboard/              # React Dashboard
│   ├── miyabi-web/                    # Landing page
│   └── assets/                        # Static assets
│
├── 🔧 Configuration
│   ├── .miyabi.yml                    # Miyabi project config
│   ├── .env                           # Environment variables (gitignored)
│   ├── docker-compose.yml             # Docker orchestration
│   ├── vercel.json                    # Vercel deployment
│   ├── cloudbuild.yaml                # GCP Cloud Build
│   ├── codecov.yml                    # Code coverage
│   ├── deny.toml                      # Cargo deny config
│   └── mcp-settings.json              # MCP server settings
│
├── 📚 Documentation
│   ├── README.md                      # Project overview
│   ├── CLAUDE.md                      # ⭐ This file - Control document
│   ├── AGENTS.md                      # Agent system overview
│   ├── QUICKSTART-JA.md               # Quick start guide (日本語)
│   ├── CHANGELOG.md                   # Version history
│   ├── CONTRIBUTING.md                # Contribution guidelines
│   ├── SECURITY.md                    # Security policy
│   ├── PERFORMANCE.md                 # Performance benchmarks
│   ├── MIGRATION_v0.1.1.md            # Migration guide
│   ├── RELEASE_CHECKLIST.md           # Release process
│   └── docs/                          # Detailed docs
│       ├── ENTITY_RELATION_MODEL.md   # 12 Entities, 27 Relations
│       ├── LABEL_SYSTEM_GUIDE.md      # 53 Labels
│       ├── TEMPLATE_MASTER_INDEX.md   # 88 Templates
│       ├── QUICK_START_3STEPS.md      # 🎭 3ステップクイックスタート ⭐ NEW
│       ├── YOUR_CURRENT_SETUP.md      # 🎭 あなた専用ガイド ⭐ NEW
│       ├── TMUX_QUICKSTART.md         # 🎭 tmux 5分ガイド
│       ├── TMUX_LAYOUTS.md            # 🎭 tmux レイアウト集
│       └── ... (20+ files)
│
├── 🤖 Codex Integration
│   └── .claude/
│       ├── commands/                  # Slash commands (15+ files)
│       ├── context/                   # Context modules (15 files) ⭐⭐⭐
│       │   ├── INDEX.md               # Context index
│       │   ├── core-rules.md          # Critical rules
│       │   ├── miyabi-definition.md   # miyabi_def system
│       │   ├── swml-framework.md      # SWML/Ω theoretical foundation
│       │   ├── omega-phases.md        # θ₁-θ₆ implementation
│       │   ├── agents.md              # Agent details
│       │   ├── architecture.md        # System architecture
│       │   ├── worktree.md            # Worktree protocol
│       │   └── ... (15 modules)
│       ├── agents/                    # Agent specs & prompts
│       │   ├── specs/                 # 21 Agent specifications
│       │   └── prompts/               # 6 Execution prompts
│       ├── skills/                    # 15 Skills
│       ├── MCP_INTEGRATION_PROTOCOL.md
│       ├── BENCHMARK_IMPLEMENTATION_CHECKLIST.md
│       ├── MIYABI_PARALLEL_ORCHESTRA.md  # 🎭 雅なる並列実行の哲学 ⭐ NEW
│       ├── TMUX_OPERATIONS.md            # 🎭 tmux運用ガイド（技術詳細）
│       ├── KAMUI_TMUX_GUIDE.md           # 🎭 Kamui tmux統合ガイド
│       └── TROUBLESHOOTING.md
│
├── 🧪 Testing & CI/CD
│   ├── .github/
│   │   ├── workflows/                 # GitHub Actions (13 workflows)
│   │   └── labels.yml                 # 53 Label definitions
│   ├── benchmarks/                    # Performance benchmarks
│   └── examples/                      # Usage examples
│
├── 📊 Data & Logs
│   ├── .ai/                           # AI execution data
│   │   ├── logs/                      # Execution logs
│   │   ├── plans/                     # Task plans
│   │   └── parallel-reports/          # Parallel execution reports
│   ├── data/                          # Data files
│   ├── database/                      # Database schemas
│   └── logs/                          # Application logs
│
├── 🔗 Integrations
│   ├── mcp-servers/                   # MCP server implementations
│   ├── integrations/                  # External integrations
│   ├── discord-config.json            # Discord bot config
│   └── external/                      # External dependencies
│
├── 🚀 Deployment & Scripts
│   ├── deployment/                    # Deployment scripts
│   ├── docker/                        # Dockerfiles
│   ├── scripts/                       # Utility scripts
│   │   ├── miyabi-orchestra-interactive.sh  # 🎭 インタラクティブセットアップ ⭐ NEW
│   │   └── miyabi-orchestra.sh              # 🎭 CLIセットアップ ⭐ NEW
│   └── .worktrees/                    # Git worktrees (runtime)
│
├── 💼 Business & Legal
│   ├── BUDGET.yml                     # Budget tracking
│   ├── marketplace.json               # GitHub Marketplace
│   ├── marketplace-business.json      # Business config
│   ├── legal/                         # Legal documents
│   └── projects/                      # Business projects
│
└── 📝 Miscellaneous
    ├── TODO.md                        # Project TODO
    ├── Plans.md                       # Current plans
    ├── DIRECTORY_STRUCTURE.md         # Directory reference
    ├── CODEX_INTEGRATION_PROGRESS.md  # Codex integration status
    ├── DISCORD_COMMUNITY_PLAN.md      # Community plan
    └── reports/                       # Various reports
```

---

## 🎮 Miyabi Control Interface

### Quick Commands

```bash
# Build
cargo build --release

# Run CLI
./target/release/miyabi --help

# Work on Issue
miyabi work-on <issue-number>

# Parallel execution
miyabi parallel --issues 270,271,272 --concurrency 3

# Infinity mode (all issues)
miyabi infinity

# Status check
miyabi status [--watch]

# Knowledge search
miyabi knowledge search "error handling"

# Agent execution
miyabi agent <type> --issue <num>
```

### tmux Parallel Operations (Advanced)

**Alternative approach**: Multiple Claude Code instances in tmux panes for heterogeneous agent execution.

**🎭 Miyabi Orchestra - Quick Start**:

**方法A: インタラクティブセットアップ（推奨）**
```bash
# 3ステップガイド付き自動セットアップ
./scripts/miyabi-orchestra-interactive.sh

# メニューから選択:
# 1) Coding Ensemble (初心者向け)
# 2) Hybrid Ensemble (上級者向け)
# 3) Quick Demo (3分お試し)
```

**方法B: コマンドライン（上級者）**
```bash
# Coding Ensemble (5-pane)
./scripts/miyabi-orchestra.sh coding-ensemble

# Hybrid Ensemble (7-pane)
./scripts/miyabi-orchestra.sh hybrid-ensemble

# レガシー名も使用可能
./scripts/miyabi-orchestra.sh 5pane
```

**When to use**:
- ✅ Heterogeneous agent execution (Coding + Business simultaneously)
- ✅ Ad-hoc task distribution with real-time adjustment
- ✅ Experimental workflows
- ❌ Standardized Issue processing → Use `miyabi parallel` instead

**Documentation**:
- **📖 Index**: [.claude/TMUX_INTEGRATION_INDEX.md](.claude/TMUX_INTEGRATION_INDEX.md) - 統合インデックス（全ドキュメント索引） ⭐ START HERE
- **📖 Codex Integration**: [.claude/CODEX_TMUX_PARALLEL_EXECUTION.md](.claude/CODEX_TMUX_PARALLEL_EXECUTION.md) - Claude Code Company原理統合版
- **🎯 Kamui Integration**: [.claude/KAMUI_TMUX_GUIDE.md](.claude/KAMUI_TMUX_GUIDE.md) - Kamui tmux統合ガイド
- **🚀 Advanced Techniques**: [.claude/TMUX_ADVANCED_TECHNIQUES.md](.claude/TMUX_ADVANCED_TECHNIQUES.md) - CLI完全活用・miyabi_def統合 ⭐ NEW
- **⚡ Claude Code Commands**: [docs/CLAUDE_CODE_COMMANDS.md](docs/CLAUDE_CODE_COMMANDS.md) - ワンライナーコマンド集
- **📊 Your Setup**: [docs/YOUR_CURRENT_SETUP.md](docs/YOUR_CURRENT_SETUP.md) - あなた専用ガイド（Claude Code対応）
- **🎨 Visual Guide**: [docs/VISUAL_GUIDE.md](docs/VISUAL_GUIDE.md) - UI/UX改善ガイド
- **🌸 Philosophy**: [.claude/MIYABI_PARALLEL_ORCHESTRA.md](.claude/MIYABI_PARALLEL_ORCHESTRA.md) - 雅なる並列実行の哲学
- **⚡ 3-Step Guide**: [docs/QUICK_START_3STEPS.md](docs/QUICK_START_3STEPS.md) - たった3ステップ
- **🔧 Technical**: [.claude/TMUX_OPERATIONS.md](.claude/TMUX_OPERATIONS.md) - 技術詳細
- **🎨 Layouts**: [docs/TMUX_LAYOUTS.md](docs/TMUX_LAYOUTS.md) - レイアウト集

**Comparison**:

| Aspect | `miyabi parallel` | tmux + Claude Code |
|--------|------------------|-------------------|
| Setup | ✅ Easy | ⚠️ Complex |
| Concurrency | ✅ Auto | 🔧 Manual |
| Agent Types | CoordinatorAgent only | All 21 agents |
| Flexibility | ⚠️ Limited | ✅ Very High |
| Token Management | ✅ Auto | ⚠️ Manual |

**Recommended**: Use `miyabi parallel` for standard workflows, tmux for advanced scenarios.

---

### Available Skills (15)

1. **agent-execution** - Execute Miyabi Agents with Git Worktree isolation
2. **rust-development** - Comprehensive Rust workflow (build, test, clippy, fmt)
3. **debugging-troubleshooting** - Systematic debugging for Rust
4. **dependency-management** - Cargo dependency updates & vulnerability resolution
5. **performance-analysis** - Profiling, benchmarking, optimization
6. **security-audit** - Security scanning (cargo-audit, clippy, secrets)
7. **git-workflow** - Automated Git operations (commit, PR, merge)
8. **documentation-generation** - Generate docs from Entity-Relation Model
9. **issue-analysis** - Analyze Issues and infer labels (57-label system)
10. **project-setup** - Initialize new Miyabi projects
11. **business-strategy-planning** - Business plan & strategy formulation
12. **content-marketing-strategy** - Content & SNS strategy
13. **market-research-analysis** - Market research (20+ companies)
14. **sales-crm-management** - Sales process & customer management
15. **growth-analytics-dashboard** - KPI tracking & PDCA cycle

**Usage**:
```
Skill tool with command "agent-execution"
Skill tool with command "rust-development"
```

---

## 📚 Context Modules (Just-In-Time Loading)

**Location**: `.claude/context/`

| Priority | Module | File | Description |
|----------|--------|------|-------------|
| ⭐⭐⭐⭐⭐ | **Core Rules** | `core-rules.md` | MCP First, Benchmark Protocol, Context7 |
| ⭐⭐⭐⭐⭐ | **Miyabi Definition** | `miyabi-definition.md` | miyabi_def system: YAML+Jinja2 source of truth |
| ⭐⭐⭐⭐⭐ | **SWML Framework** | `swml-framework.md` | Ω Function theoretical foundation |
| ⭐⭐⭐⭐⭐ | **Omega Phases** | `omega-phases.md` | θ₁-θ₆ implementation guide |
| ⭐⭐⭐⭐ | **Agents** | `agents.md` | 14 Agents実装済み + 10 Agents計画中 |
| ⭐⭐⭐⭐ | **Architecture** | `architecture.md` | Cargo Workspace, GitHub OS, Worktree |
| ⭐⭐⭐ | **Development** | `development.md` | Rust/TypeScript規約、テスト、CI/CD |
| ⭐⭐⭐ | **Entity-Relation** | `entity-relation.md` | 12 Entities, 27 Relations, N1/N2/N3記法 |
| ⭐⭐⭐ | **Labels** | `labels.md` | 53 Label体系、10カテゴリ |
| ⭐⭐⭐ | **Worktree** | `worktree.md` | Worktreeライフサイクル、並列実行 |
| ⭐⭐⭐ | **Rust** | `rust.md` | Rust 2021 Edition開発ガイド |
| ⭐⭐ | **Protocols** | `protocols.md` | タスク管理、報告プロトコル |
| ⭐⭐ | **External Deps** | `external-deps.md` | Context7、MCP Servers |
| ⭐ | **TypeScript** | `typescript.md` | レガシーTypeScript参考 |

**Full Index**: [.claude/context/INDEX.md](.claude/context/INDEX.md)

---

## 🤖 Agent System

### 21 Agents (Rust Implementation)

**Coding Agents (7)**: CoordinatorAgent, CodeGenAgent, ReviewAgent, IssueAgent, PRAgent, DeploymentAgent, RefresherAgent

**Business Agents (14)**:
- 戦略・企画系（6個）: AIEntrepreneur, ProductConcept, ProductDesign, FunnelDesign, Persona, SelfAnalysis
- マーケティング系（5個）: MarketResearch, Marketing, ContentCreation, SNSStrategy, YouTube
- 営業・顧客管理系（3個）: Sales, CRM, Analytics

**Specs**: `.claude/agents/specs/` (21 files)
**Prompts**: `.claude/agents/prompts/` (6 files)

**Character Names**: [.claude/agents/AGENT_CHARACTERS.md](.claude/agents/AGENT_CHARACTERS.md)

---

## 🔐 Environment Variables

Required variables (set in `.env` or environment):

```bash
GITHUB_TOKEN=ghp_xxx           # GitHub access token
ANTHROPIC_API_KEY=sk-xxx       # Anthropic API key (optional)
OPENAI_API_KEY=sk-xxx          # OpenAI API key (for hybrid routing)
DEVICE_IDENTIFIER=MacBook      # Device identifier
GITHUB_REPOSITORY=owner/repo   # Repository name
RUST_LOG=info                  # Log level
RUST_BACKTRACE=1               # Backtrace on panic
```

---

## 🚀 Quick Start

### First Time Setup

1. **Clone & Build**
   ```bash
   cd /Users/shunsuke/Dev/miyabi-private
   cargo build --release
   ```

2. **Setup Environment**
   ```bash
   miyabi setup  # Interactive wizard
   ```

3. **Verify Installation**
   ```bash
   miyabi status
   cargo test --all
   ```

### Daily Workflow

1. **Check Status**
   ```bash
   miyabi status --watch
   ```

2. **Work on Issue**
   ```bash
   miyabi work-on 270
   ```

3. **Parallel Execution**
   ```bash
   miyabi parallel --issues 270,271,272 --concurrency 3
   ```

4. **Review Changes**
   ```bash
   git status
   cargo test --all
   cargo clippy -- -D warnings
   ```

---

## 📖 Key Documentation

**Essential Reading** (⭐⭐⭐⭐⭐):
- [ENTITY_RELATION_MODEL.md](docs/ENTITY_RELATION_MODEL.md) - System architecture
- [LABEL_SYSTEM_GUIDE.md](docs/LABEL_SYSTEM_GUIDE.md) - Label taxonomy
- [.claude/context/core-rules.md](.claude/context/core-rules.md) - Critical rules
- [.claude/MCP_INTEGRATION_PROTOCOL.md](.claude/MCP_INTEGRATION_PROTOCOL.md) - MCP protocol

**Reference**:
- [README.md](README.md) - Project overview
- [QUICKSTART-JA.md](QUICKSTART-JA.md) - Quick start (Japanese)
- [AGENTS.md](AGENTS.md) - Agent system details
- [CHANGELOG.md](CHANGELOG.md) - Version history
- [CONTRIBUTING.md](CONTRIBUTING.md) - How to contribute

---

## 🔗 Links

- **Repository**: 
- **Landing Page**: https://shunsukehayashi.github.io/Miyabi/landing.html
- **NPM CLI**: https://www.npmjs.com/package/miyabi
- **NPM SDK**: https://www.npmjs.com/package/miyabi-agent-sdk

---

## 📝 Notes for Codex

1. **Always check Context Modules first** - `.claude/context/*.md` contains detailed information
2. **Use Skills for all tasks** - Never implement directly, always delegate
3. **Follow MCP First Approach** - Check MCP availability before starting
4. **Read Issue labels carefully** - 53-label system defines workflow state
5. **Update .ai/logs/** - All executions should be logged

---

**This file is automatically loaded by Codex (legacy Claude Code integration). Keep it up-to-date as the project control center.**

**Version**: 3.0.0 | **Format**: Project Root & Control Document | **Maintained by**: Miyabi Team
