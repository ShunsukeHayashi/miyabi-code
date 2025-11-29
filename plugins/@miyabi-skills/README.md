# Miyabi Skills Plugin

**Version**: 2.0.0
**Category**: Development Workflows
**License**: Apache-2.0

22の開発スキルセットを提供する Claude Code プラグイン。Rust開発、TDD、Git、セキュリティ、パフォーマンス分析など、包括的な開発ワークフローを実現します。

## Installation

```bash
# マーケットプレイス追加
/plugin marketplace add customer-cloud/miyabi-private

# プラグインインストール
/plugin install miyabi-skills@miyabi-official-plugins

# Claude Code 再起動
```

## Skills Overview

### 全22スキル一覧

| # | Skill | カテゴリ | 説明 |
|---|-------|---------|------|
| 1 | **agent-execution** | Automation | Agent実行・Issue自動処理 |
| 2 | **business-strategy-planning** | Business | 8フェーズビジネス戦略立案 |
| 3 | **claude-code-x** | Automation | Claude Code並列実行 |
| 4 | **content-marketing-strategy** | Marketing | 6ヶ月コンテンツカレンダー |
| 5 | **context-eng** | AI | コンテキストエンジニアリング |
| 6 | **debugging-troubleshooting** | Development | 系統的エラー診断 |
| 7 | **dependency-management** | Development | Rust/Node依存関係管理 |
| 8 | **documentation-generation** | Documentation | 14エンティティドキュメント生成 |
| 9 | **git-workflow** | Git | Conventional Commits準拠 |
| 10 | **growth-analytics-dashboard** | Analytics | KPIフレームワーク |
| 11 | **issue-analysis** | GitHub | 57ラベル体系Issue分析 |
| 12 | **market-research-analysis** | Business | TAM/SAM/SOM算出 |
| 13 | **paper2agent** | AI | 論文→Agent変換 |
| 14 | **performance-analysis** | Development | CPU/メモリプロファイリング |
| 15 | **project-setup** | Setup | Cargoワークスペース初期化 |
| 16 | **rust-development** | Development | Rust開発フルワークフロー |
| 17 | **sales-crm-management** | Sales | セールスファネル設計 |
| 18 | **security-audit** | Security | 脆弱性スキャン・秘密管理 |
| 19 | **tdd-workflow** | Testing | Red-Green-Refactorサイクル |
| 20 | **tmux-iterm-integration** | DevOps | マルチエージェントオーケストレーション |
| 21 | **voicevox** | Content | Git→音声ガイド変換 |

---

## Skill Details

### 1. agent-execution

**説明**: Miyabi Agent (Coordinator, CodeGen, Review, Deployment, PR, Issue) をGit Worktree分離で並列実行

**起動コマンド**:
```
skill: "agent-execution"
```

**主要機能**:
- Issue自動処理パイプライン
- Git Worktree分離による並列実行
- Agent間連携・オーケストレーション

---

### 2. rust-development

**説明**: Rust開発の包括的ワークフロー (build, test, clippy, fmt)

**起動コマンド**:
```
skill: "rust-development"
```

**ワークフロー**:
```bash
# 1. ビルド
cargo build --all-targets

# 2. Clippy (32 lints)
cargo clippy --all-targets -- -D warnings

# 3. テスト
cargo test --all-targets

# 4. フォーマット
cargo fmt --check
```

**Clippy Lints (32個)**:
- `clippy::unwrap_used`
- `clippy::expect_used`
- `clippy::panic`
- `clippy::todo`
- `clippy::unimplemented`
- ... (詳細は .claude/context/rust.md)

---

### 3. tdd-workflow

**説明**: Test-Driven Development (Red-Green-Refactor) サイクル

**起動コマンド**:
```
skill: "tdd-workflow"
```

**サイクル**:
```
┌─────────────────────────────────────────────┐
│              TDD Cycle                       │
├─────────────────────────────────────────────┤
│                                              │
│   ┌─────────┐                               │
│   │  RED    │ ← 失敗するテストを書く         │
│   │ (Write) │                               │
│   └────┬────┘                               │
│        │                                     │
│        ▼                                     │
│   ┌─────────┐                               │
│   │  GREEN  │ ← テストを通す最小限の実装     │
│   │ (Pass)  │                               │
│   └────┬────┘                               │
│        │                                     │
│        ▼                                     │
│   ┌─────────┐                               │
│   │REFACTOR │ ← コードを改善                │
│   │ (Clean) │                               │
│   └────┬────┘                               │
│        │                                     │
│        └──────────────→ (繰り返し)           │
│                                              │
└─────────────────────────────────────────────┘
```

---

### 4. git-workflow

**説明**: Conventional Commits準拠のGitワークフロー

**起動コマンド**:
```
skill: "git-workflow"
```

**Conventional Commits形式**:
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント
- `style`: フォーマット
- `refactor`: リファクタリング
- `test`: テスト
- `chore`: 雑務

---

### 5. security-audit

**説明**: セキュリティ脆弱性スキャン・unsafe検出・秘密管理

**起動コマンド**:
```
skill: "security-audit"
```

**チェック項目**:
```bash
# 依存関係脆弱性
cargo audit

# unsafe使用検出
cargo clippy -- -D clippy::undocumented_unsafe_blocks

# 秘密情報検出
gitleaks detect

# OWASP Top 10チェック
```

---

### 6. performance-analysis

**説明**: CPU/メモリプロファイリング・ベンチマーク

**起動コマンド**:
```
skill: "performance-analysis"
```

**ツール**:
```bash
# ベンチマーク
cargo bench

# フレームグラフ
cargo flamegraph

# メモリプロファイル
cargo instruments -t "Allocations"
```

---

### 7. debugging-troubleshooting

**説明**: 系統的エラー診断・デバッグワークフロー

**起動コマンド**:
```
skill: "debugging-troubleshooting"
```

**診断フロー**:
1. エラーメッセージ解析
2. 再現手順の特定
3. 最小再現ケースの作成
4. 二分探索によるコミット特定
5. 根本原因の特定
6. 修正・テスト

---

### 8. issue-analysis

**説明**: GitHub Issue分析・57ラベル体系によるラベル推論

**起動コマンド**:
```
skill: "issue-analysis"
```

**57ラベル体系 (11カテゴリ)**:

| カテゴリ | ラベル例 |
|---------|---------|
| Type | feature, bug, enhancement, docs |
| Priority | critical, high, medium, low |
| Status | open, in-progress, review, done |
| Component | frontend, backend, infra, cli |
| Effort | xs, s, m, l, xl |
| Severity | sev1-critical, sev2-high, sev3-medium |
| Sprint | sprint-1, sprint-2, backlog |
| Agent | agent:codegen, agent:review |
| Phase | phase:planning, phase:implementation |
| Release | release:v1.0, release:v2.0 |
| Special | needs-triage, help-wanted, good-first-issue |

---

### 9. documentation-generation

**説明**: 14エンティティ・39関係モデルに基づくドキュメント生成

**起動コマンド**:
```
skill: "documentation-generation"
```

**Entity-Relation Model**:
- 14 Entities (Agent, Task, Issue, PR, etc.)
- 39 Relationships
- 自動アーキテクチャ図生成

---

### 10. dependency-management

**説明**: Rust/Node.js依存関係管理・競合解決

**起動コマンド**:
```
skill: "dependency-management"
```

**機能**:
```bash
# Rust依存更新
cargo update

# 依存ツリー確認
cargo tree

# Node依存更新
npm update

# 脆弱性チェック
npm audit
```

---

### 11. project-setup

**説明**: Cargoワークスペース・GitHub統合・Miyabiフレームワーク初期化

**起動コマンド**:
```
skill: "project-setup"
```

**セットアップ内容**:
- Cargo.toml (ワークスペース設定)
- .github/workflows (CI/CD)
- .claude/ (Agent設定)
- 基本crate構造

---

### 12. context-eng

**説明**: 非構造化情報→AI解釈可能な構造化形式への変換

**起動コマンド**:
```
skill: "context-eng"
```

**変換フロー**:
```
非構造化ソース → 解析 → 構造化 → AI最適化形式
```

---

### 13. business-strategy-planning

**説明**: 自己分析・プロダクトコンセプト・ペルソナ・8フェーズビジネスプラン

**起動コマンド**:
```
skill: "business-strategy-planning"
```

---

### 14. content-marketing-strategy

**説明**: 6ヶ月コンテンツカレンダー・マルチプラットフォームSNS戦略

**起動コマンド**:
```
skill: "content-marketing-strategy"
```

---

### 15. growth-analytics-dashboard

**説明**: KPIフレームワーク・ダッシュボード設計・コホート分析

**起動コマンド**:
```
skill: "growth-analytics-dashboard"
```

---

### 16. market-research-analysis

**説明**: TAM/SAM/SOM算出・競合分析・市場トレンド特定

**起動コマンド**:
```
skill: "market-research-analysis"
```

---

### 17. sales-crm-management

**説明**: セールスファネル設計・B2Bプレイブック・CRM設計

**起動コマンド**:
```
skill: "sales-crm-management"
```

---

### 18. tmux-iterm-integration

**説明**: Miyabi tmuxマルチエージェントオーケストレーション・iTerm2統合

**起動コマンド**:
```
skill: "tmux-iterm-integration"
```

**機能**:
- Agent別カラーテーマ
- 状態監視
- 自動プロファイル切り替え

---

### 19. voicevox

**説明**: Git commits→開発進捗音声ガイド (VOICEVOX Engine)

**起動コマンド**:
```
skill: "voicevox"
```

**ワークフロー**:
```
Git Commits → 要約生成 → VOICEVOX → 音声ファイル
```

---

### 20. claude-code-x

**説明**: Claude Code並列バックグラウンド実行 (最大5セッション)

**起動コマンド**:
```
skill: "claude-code-x"
```

---

### 21. paper2agent

**説明**: 学術論文→Agent仕様変換

**起動コマンド**:
```
skill: "paper2agent"
```

---

## Usage

### Skill起動方法

Claude Code内で:

```
skill: "skill-name"
```

または:

```bash
/skill skill-name
```

### 例

```
skill: "rust-development"
→ Rust開発ワークフローが展開

skill: "tdd-workflow"
→ TDDサイクルガイダンスが展開

skill: "security-audit"
→ セキュリティスキャンが開始
```

---

## Skill File Structure

```
plugins/miyabi-skills/skills/
├── agent-execution/
│   └── SKILL.md
├── business-strategy-planning/
│   └── SKILL.md
├── claude-code-x/
│   └── SKILL.md
├── rust-development/
│   └── SKILL.md
├── tdd-workflow/
│   └── SKILL.md
└── ... (22 skills)
```

---

## Related Plugins

- [miyabi-coding-agents](../miyabi-coding-agents/) - コーディングAgent
- [miyabi-commands](../miyabi-commands/) - スラッシュコマンド

---

**Author**: Shunsuke Hayashi
**Created**: 2025-11-29
**Version**: 2.0.0
