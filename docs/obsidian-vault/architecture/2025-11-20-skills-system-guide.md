---
title: "Skills System - 19の特殊能力"
created: 2025-11-20
updated: 2025-11-20
author: "Claude Code"
category: "architecture"
tags: ["miyabi", "skills", "automation", "claude-code"]
status: "published"
aliases: ["Skills", "スキルシステム"]
---

# Skills System - 19の特殊能力

> Claude Codeの能力を拡張する、自動発動型のスキルシステム

---

## 🎯 Skills とは

**定義**: Claude Codeが**自動的に発動**する専門能力

**特徴**:
- 🤖 **自動発動**: ユーザーの要求を解析して適切なSkillを選択
- 🎯 **専門特化**: 各Skillは特定のタスクに特化
- 🔧 **Tool制御**: 使用可能なToolを制限可能
- 📊 **透明性**: 実行プロセスが明確

**vs Slash Commands**:
- Slash Commands: 明示的に呼び出す（例: `/verify`）
- Skills: 自動的に発動（例: "Build the project" → rust-development Skill）

---

## 📚 19個のSkill一覧

### 🔧 Technical Skills（技術系 - 10個）

#### 1. rust-development

**発動トリガー**:
- "Build the project"
- "Run tests"
- "Check code quality"
- Before committing Rust code

**能力**:
```bash
cargo clean
cargo build --workspace --all-targets
cargo test --workspace --all-targets
cargo clippy --workspace --all-targets
cargo fmt --check
cargo doc --workspace --no-deps
```

**使用Tool**: Bash, Read, Grep, Glob

**関連**: [[rust-development-workflow|Rust開発ワークフロー]]

---

#### 2. agent-execution

**発動トリガー**:
- "Run coordinator agent on issue #270"
- "Process multiple issues in parallel"
- "Execute codegen agent"
- Managing concurrent development tasks

**能力**:
- 21 Agentsの実行
- Git Worktree分離
- 並列実行制御
- Agent割り当て

**Agent Types**:
- 🔴 **Leader**: CoordinatorAgent（逐次のみ）
- 🟢 **Execution**: CodeGen, Review, Deployment, PR, Issue（並列OK）
- 🟡 **Support**: Refresher（条件付き）

**使用Tool**: Bash, Read, Write, Edit, Grep, Glob

**関連**: [[agent-execution-protocol|Agent実行プロトコル]]

---

#### 3. issue-analysis

**発動トリガー**:
- "What labels should I use?"
- "Analyze this Issue"
- "Triage issue #270"
- After Issue creation

**能力**:
- 57ラベル体系からAI推論
- TYPE, PRIORITY, SEVERITY自動判定
- SPECIAL label検出
- HIERARCHY label割り当て

**Label Categories（11）**:
1. STATE（8）- Lifecycle
2. AGENT（6）- Agent割り当て
3. PRIORITY（4）- 優先度
4. TYPE（7）- Issue分類
5. SEVERITY（4）- 深刻度
6. PHASE（5）- プロジェクトフェーズ
7. SPECIAL（7）- 特殊操作
8. TRIGGER（4）- 自動化トリガー
9. QUALITY（4）- 品質スコア
10. COMMUNITY（4）- コミュニティ
11. HIERARCHY（4）- Issue階層

**使用Tool**: Read, Grep, Glob, WebFetch

**関連**: [[label-system-guide|Label System完全ガイド]]

---

#### 4. documentation-generation

**発動トリガー**:
- "Document this feature"
- "Update the architecture docs"
- "Explain how X works"
- After implementing new features

**能力**:
- Entity-Relation Model準拠ドキュメント生成
- 14 Entities自動識別
- 39 Relationships自動マッピング
- Mermaid図自動生成
- Rust + TypeScript dual documentation

**使用Tool**: Read, Write, Edit, Grep, Glob

**関連**: [[entity-relation-model|Entity-Relation Model]]

---

#### 5. git-workflow

**発動トリガー**:
- "Commit these changes"
- "Create a PR"
- "Merge this branch"
- After completing features

**能力**:
- Conventional Commits準拠コミット
- PR自動作成（Summary/Changes/Test Plan/Quality Report）
- ブランチ命名規則（feature/270-description）
- Merge戦略（squash/merge/rebase）
- Worktree対応

**Commit Types**:
```
feat, fix, docs, style, refactor, perf, test, chore, ci, build, revert
```

**使用Tool**: Bash, Read, Grep, Glob

**関連**: [[conventional-commits-guide|Conventional Commits ガイド]]

---

#### 6. project-setup

**発動トリガー**:
- "Create a new project"
- "Integrate Miyabi into this project"
- "Set up a new Rust workspace"

**能力**:
- Cargo workspace初期化
- GitHub統合（labels, workflows, templates）
- Miyabi framework統合（.miyabi.yml, .claude/）
- 環境変数設定
- Documentation生成

**Setup Modes**:
- New project
- Add Miyabi to existing
- Create microservice

**使用Tool**: Bash, Read, Write, Edit, Glob, Grep

---

#### 7. debugging-troubleshooting

**発動トリガー**:
- "This code isn't working"
- "Why is this test failing?"
- "Debug this error"

**能力**:
- 体系的エラー診断（6タイプ）
- Backtrace分析（RUST_BACKTRACE）
- Debugger使用（rust-lldb, VS Code）
- Common panic remediation
- Test debugging（pretty_assertions, insta）

**Error Types**:
1. Compilation
2. Test failure
3. Runtime panic
4. Logic error
5. Performance issue
6. Integration error

**使用Tool**: Bash, Read, Grep, Glob

---

#### 8. performance-analysis

**発動トリガー**:
- "This is slow"
- "Why is memory usage so high?"
- "Optimize this function"

**能力**:
- CPU profiling（flamegraph, perf）
- Benchmarking（criterion）
- Memory profiling（valgrind, heaptrack）
- Binary size分析（cargo-bloat）
- Async profiling（tokio-console）
- Profile-Guided Optimization（PGO）

**使用Tool**: Bash, Read, Grep, Glob

---

#### 9. security-audit

**発動トリガー**:
- "Scan for security vulnerabilities"
- "Are there any CVEs?"
- "Audit the codebase"

**能力**:
- 依存関係脆弱性スキャン（cargo-audit）
- Policy enforcement（cargo-deny）
- Unsafe code検出（cargo-geiger）
- Secret検出（gitleaks）
- Supply chain分析（cargo-supply-chain）

**使用Tool**: Bash, Read, Grep, Glob

**関連**: [[security-best-practices|セキュリティベストプラクティス]]

---

#### 10. dependency-management

**発動トリガー**:
- "Update dependencies"
- "Why is there a version conflict?"
- "Add a new dependency"

**能力**:
- 依存関係追加（cargo add, npm install）
- 依存関係更新（cargo update, npm update）
- 依存ツリー分析（cargo tree）
- バージョン競合解決
- Workspace依存管理

**Update Strategy**:
- Patch: 週次
- Minor: 月次
- Major: 四半期

**使用Tool**: Bash, Read, Write, Edit, Grep, Glob

---

### 💼 Business Skills（ビジネス系 - 5個）

#### 11. business-strategy-planning

**発動トリガー**:
- "Create a business plan"
- "Define our product strategy"
- "Identify target customers"

**能力**:
- 自己分析（SelfAnalysisAgent）
- Product concept設計（ProductConceptAgent）
- Persona開発（PersonaAgent）
- 8-phase business plan（AIEntrepreneurAgent）

**Business Agents**:
- じぶんるん
- つくるそん
- ぺるそん
- あきんどさん

**使用Tool**: Read, Write, WebFetch, Bash

**関連**: [[8-phase-business-plan|8フェーズビジネスプラン]]

---

#### 12. market-research-analysis

**発動トリガー**:
- "Analyze the market"
- "Who are our competitors?"
- "Validate this business idea"

**能力**:
- TAM/SAM/SOM計算
- 競合分析（20+ companies in 3 tiers）
- 5大トレンド識別
- Customer needs assessment
- SWOT分析

**Business Agent**: しらべるん（MarketResearchAgent）

**使用Tool**: WebFetch, Read, Write, Bash

**関連**: [[market-analysis-framework|市場分析フレームワーク]]

---

#### 13. content-marketing-strategy

**発動トリガー**:
- "Create content strategy"
- "How to grow on social media?"
- "Start a YouTube channel"

**能力**:
- 6ヶ月コンテンツカレンダー（90+ pieces）
- マルチプラットフォームSNS戦略
- YouTube最適化（13 workflows）
- Blog/Video/Podcast生成
- Editorial calendar管理

**Business Agents**:
- かくちゃん
- つぶやくん
- どうがるん

**使用Tool**: WebFetch, Read, Write, Bash

---

#### 14. sales-crm-management

**発動トリガー**:
- "Build our sales process"
- "How to reduce churn?"
- "Increase customer LTV"

**能力**:
- Sales funnel設計（Awareness → Purchase → LTV）
- B2B sales playbook（BANT qualification）
- CRM setup（pipeline stages）
- Customer health scoring（0-100 points）
- Churn prevention & win-back

**Business Agents**:
- うるくん
- かんりるん
- じょうごるん

**使用Tool**: Read, Write, WebFetch, Bash

**関連**: [[sales-funnel-optimization|Sales Funnel最適化]]

---

#### 15. growth-analytics-dashboard

**発動トリガー**:
- "Analyze our growth metrics"
- "What's our CAC/LTV?"
- "Build a KPI dashboard"

**能力**:
- KPIフレームワーク（20+ metrics, 5 categories）
- Dashboard設計（Executive/Product/Marketing/Sales）
- Cohort分析（retention + revenue）
- A/B testing framework
- PDCA cycle（4-week sprints）
- Predictive analytics

**Business Agent**: すうじるん（AnalyticsAgent）

**使用Tool**: Read, Write, WebFetch, Bash

**関連**: [[kpi-dashboard-design|KPIダッシュボード設計]]

---

## 🎬 自動発動の仕組み

### 発動プロセス

```
1. ユーザー要求を解析
   "Build the project and run all tests"
      ↓
2. キーワードマッチング
   "build", "test" → rust-development Skill
      ↓
3. Skill発動
   rust-development/SKILL.md をロード
      ↓
4. Tool制限確認
   allowed-tools: Bash, Read, Grep, Glob
      ↓
5. 実行
   cargo build && cargo test
      ↓
6. 結果報告
   "✅ Build successful, All tests passed"
```

---

### 発動例

#### 例1: 単一Skill発動

```
User: "Check the code quality and run clippy"
  ↓
Claude Code: [rust-development Skill発動]
  ↓
実行:
  cargo clippy --workspace --all-targets
  ↓
結果:
  "✅ Clippy: 0 warnings, 0 errors"
```

---

#### 例2: 複数Skill連鎖

```
User: "Process issues #270, #271, #272 in parallel"
  ↓
Claude Code:
  [agent-execution Skill発動]
    ↓
  [git-workflow Skill発動（Worktree作成）]
    ↓
  [rust-development Skill発動（各Worktreeでbuild/test）]
    ↓
実行:
  .worktrees/issue-270/ でCodeGen実行
  .worktrees/issue-271/ でCodeGen実行
  .worktrees/issue-272/ でCodeGen実行
  ↓
結果:
  "✅ 3 issues processed, 3 PRs created"
```

---

#### 例3: Business Skill発動

```
User: "Analyze the market for our new SaaS product"
  ↓
Claude Code: [market-research-analysis Skill発動]
  ↓
実行:
  1. TAM/SAM/SOM計算
  2. 競合20社分析
  3. トレンド5つ識別
  4. SWOT分析
  ↓
結果:
  "📊 Market Analysis Report generated:
   - TAM: $10B, SAM: $1B, SOM: $100M
   - Top 5 competitors identified
   - 5 major trends analyzed"
```

---

## 📊 Skill統計情報

### カテゴリ別分布

| カテゴリ | Skills数 | 頻度 |
|---------|---------|------|
| **Technical** | 10 | Very High |
| **Business** | 5 | High |
| **Integration** | 4 | Medium |

### 使用頻度ランキング

| Rank | Skill | 頻度 | ユースケース |
|------|-------|------|-------------|
| 1 | rust-development | Very High | 日常開発 |
| 2 | git-workflow | Very High | 日常開発 |
| 3 | agent-execution | High | 自律開発 |
| 4 | issue-analysis | High | Issue triage |
| 5 | debugging-troubleshooting | High | 問題解決 |
| 6 | growth-analytics-dashboard | Very High | データ駆動意思決定 |
| 7 | content-marketing-strategy | High | ブランド構築 |
| 8 | sales-crm-management | High | 収益成長 |

---

## 🔧 Skill開発ガイド

### 新しいSkillを作る時

**条件**:
- タスクが**複雑**（複数Tool呼び出し必要）
- タスクが**頻繁**に実行される
- **ドメイン固有知識**が必要
- **構造化ワークフロー**が有効

---

### Skill構造

```markdown
---
name: Skill Name
description: 明確な説明 + 発動トリガー
allowed-tools: Tool1, Tool2, Tool3
---

# Skill Name

## When to Use

[ユースケース一覧]

## Workflow

[ステップバイステップ]

## Examples

[具体例]

## Related Files

[関連ファイルへのリンク]
```

---

### ベストプラクティス

1. **Focused Description**
   - 機能 + 発動トリガー の両方記載

2. **Tool Restrictions**
   - セキュリティ重要Skillは `allowed-tools` 使用

3. **Clear Examples**
   - 入力/出力の具体例提供

4. **Troubleshooting**
   - よくある問題と解決方法

5. **Related Skills**
   - 補完的なSkillへのリンク

---

## 🎓 Miyabi統合

### Core Concepts連携

Skills は以下のMiyabi Core Conceptsと統合:

- **Agent System**: 21 Agentsの実行を管理
- **Label System**: 57ラベル体系を理解
- **Entity-Relation Model**: 14 Entities, 39 Relationsを認識
- **Worktree Protocol**: 並列実行をサポート
- **Rust-First**: Rust実装を優先

---

## 🔗 関連ドキュメント

### System Architecture

- [[2025-11-20-claude-directory-index|.claude/ ディレクトリ全体像]]
- [[miyabi-architecture|Miyabiアーキテクチャ]]
- [[agent-system-overview|Agent System概要]]

### Individual Skills

- [[rust-development-workflow|Rust開発ワークフロー]]
- [[agent-execution-protocol|Agent実行プロトコル]]
- [[label-system-guide|Label System完全ガイド]]

### Development Guides

- [[skill-development-guide|Skill開発ガイド]]
- [[custom-skill-creation|カスタムSkill作成]]

---

**作成日**: 2025-11-20
**最終更新**: 2025-11-20
**バージョン**: 1.0.0
**ステータス**: ✅ Published

#miyabi #skills #automation #claude-code

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>
