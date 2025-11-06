# Codex改装プロジェクト - 差分洗い出しレポート

**Version**: 1.0.0
**Date**: 2025-11-06
**Status**: Phase 1 - 差分分析完了
**Author**: カエデ (CodeGenAgent)

---

## 📊 Executive Summary

### 統計サマリー

| Metric | .claude | .codex | Difference |
|--------|---------|--------|------------|
| **総行数** | 120,061行 | 106,434行 | -13,627行 |
| **MDファイル数** | 134 files | 246 files | +112 files |
| **主要ディレクトリ数** | 9 dirs | 12 dirs | +3 dirs |
| **コンテキストモジュール** | 15 modules | 15 modules | 同じ (内容に差分あり) |
| **Skills** | 18 skills | 18 skills | 同じ |
| **Commands** | 32 commands | 28 commands | -4 commands |
| **Agent Specs** | 24 specs | 24 specs | 同じ (重複構造あり) |

### 主要な問題点

1. ⚠️ **.codex/agents.bak/** - 混乱を招くバックアップディレクトリ（完全に重複）
2. ⚠️ **.codex/context.bak/** - これも重複バックアップディレクトリ
3. ⚠️ 重複ファイル - 15個のファイルが.claudeと.codex両方に存在
4. ⚠️ 古いドキュメント - レガシー設計文書が.codexルートに散在
5. ❌ 未実装ディレクトリ - .codex/hooks/, .codex/mcp-servers/ が空

---

## 🔍 ディレクトリ構造比較

### .claude ディレクトリ構造（最新）

```
.claude/                                    # 132 files, 120,061 lines
├── CLAUDE.md ❌                            # ❗ .codexにはない
├── README.md ✅
├── INDEX.md ✅
│
├── commands/                               # 32 slash commands
│   ├── INDEX.md
│   ├── orchestra.md ❌                     # ❗ .codexにはない
│   ├── tmux-orchestra-start.md ❌          # ❗ .codexにはない
│   ├── test-mcp.md ❌                      # ❗ .codexにはない
│   ├── codex-monitor.md ❌                 # ❗ .codexにはない
│   └── ... (32 commands)
│
├── context/                                # 15 context modules
│   ├── INDEX.md
│   ├── core-rules.md
│   ├── miyabi-definition.md
│   ├── swml-framework.md
│   ├── omega-phases.md
│   └── ... (15 modules)
│
├── Skills/                                 # 18 skills
│   ├── README.md
│   ├── agent-execution/
│   ├── rust-development/
│   └── ... (18 skills)
│
├── agents/                                 # Agent仕様・プロンプト
│   ├── README.md
│   ├── AGENT_CHARACTERS.md
│   ├── WORKFLOW_INDEX.md
│   ├── specs/                              # 24 Agent specs
│   │   ├── coding/                         # 7 + 4 = 11 coding agents
│   │   ├── business/                       # 14 business agents
│   │   └── lark/                           # 1 lark agent
│   ├── prompts/                            # Agent実行プロンプト
│   │   ├── coding/
│   │   ├── business/
│   │   └── lark/
│   ├── lark/                               # Lark統合
│   └── examples/
│
├── guides/                                 # 運用ガイド ❌
│   ├── BENCHMARK_IMPLEMENTATION.md ❌      # ❗ .codexにはない
│   ├── HOOKS_IMPLEMENTATION.md ❌          # ❗ .codexにはない
│   ├── MCP_INTEGRATION_PROTOCOL.md         # ⚠️ .codexルートにもあるが古い
│   ├── TMUX_AI_AGENT_CONTROL.md ❌         # ❗ .codexにはない
│   └── TROUBLESHOOTING.md                  # ⚠️ .codexルートにもある
│
├── hooks/                                  # Hooks実装 ❌
│   └── README.md
│
├── mcp-servers/                            # MCP Server実装 ✅
│   └── ... (node_modules含む)
│
├── archive/                                # アーカイブ ✅
│   ├── CODEX_DESIGN_PATTERNS.md
│   ├── CODEX_PATTERN_APPLICATION_PLAN.md
│   └── ... (レガシードキュメント)
│
├── ORCHESTRA_COMPLETE_GUIDE.md ✅
├── MIYABI_PARALLEL_ORCHESTRA.md ✅
├── MIYABI_ORCHESTRA_INTEGRATION.md ✅
├── TMUX_OPERATIONS.md ✅
├── TMUX_INTEGRATION_INDEX.md ✅
└── ... (その他運用ドキュメント)
```

### .codex ディレクトリ構造（旧）

```
.codex/                                     # 246 files, 106,434 lines
├── CODEX.md ❌                             # ❗ .claudeにはない
├── README.md ✅
├── INDEX.md ✅
│
├── commands/                               # 28 slash commands
│   ├── INDEX.md
│   ├── orchestra.md ❌                     # ❗ 存在しない（追加必要）
│   ├── tmux-orchestra-start.md ❌          # ❗ 存在しない（追加必要）
│   ├── test-mcp.md ❌                      # ❗ 存在しない（追加必要）
│   ├── codex-monitor.md ❌                 # ❗ 存在しない（追加必要）
│   └── ... (28 commands)
│
├── context/                                # 15 context modules
│   ├── INDEX.md
│   ├── core-rules.md                       # ⚠️ 内容が古い
│   ├── miyabi-definition.md                # ⚠️ 内容が古い
│   └── ... (15 modules)
│
├── context.bak/                            # ⚠️ 重複バックアップ（削除対象）
│   └── ... (context/と同じ内容)
│
├── Skills/                                 # 18 skills
│   └── ... (18 skills - .claudeと同じ)
│
├── agents/                                 # ⚠️ .claude/agents/と同じ構造
│   ├── README.md
│   ├── specs/
│   ├── prompts/
│   └── lark/
│
├── agents.bak/                             # ⚠️ 完全重複（削除対象）
│   └── ... (agents/と完全に同じ内容)
│
├── docs/                                   # AI CLI関連ドキュメント ❌
│   ├── AI_CLI_COMPARISON.md
│   ├── AI_CLI_COMPLETE_GUIDE.md
│   └── AI_CLI_INTEGRATION_TEST_PLAN.md
│
├── prompts/                                # ⚠️ 混在（整理必要）
│   ├── task-management-protocol.md
│   └── worktree-agent-execution.md
│
├── templates/                              # テンプレート ❌
│   └── reporting-protocol.md
│
├── hooks/ ❌                               # ⚠️ 存在するが空（実装必要）
├── mcp-servers/ ❌                         # ⚠️ 存在しない（作成必要）
│
├── MCP_INTEGRATION_PROTOCOL.md             # ⚠️ .claude/guides/にもある（統合必要）
├── BENCHMARK_IMPLEMENTATION_CHECKLIST.md   # ⚠️ .claude/guides/にもある（統合必要）
├── TROUBLESHOOTING.md                      # ⚠️ .claude/guides/にもある（統合必要）
│
├── CODEX_DESIGN_PATTERNS.md                # ⚠️ レガシー（archive行き）
├── CODEX_PATTERN_APPLICATION_PLAN.md       # ⚠️ レガシー（archive行き）
├── CODEX_SESSION_README.md                 # ⚠️ レガシー（archive行き）
├── HOOKS_IMPLEMENTATION_GUIDE.md           # ⚠️ レガシー（.claude/guides/に統合）
└── ... (多数のレガシードキュメント)
```

---

## 📋 ファイル単位の詳細比較

### Category 1: 重複ファイル（両方に存在）

#### 1.1 完全一致（同期済み）

| File | .claude | .codex | Status |
|------|---------|--------|--------|
| Skills/* | ✅ 18 skills | ✅ 18 skills | ✅ 同期済み |
| agents/AGENT_CHARACTERS.md | ✅ | ✅ | ✅ 同期済み |
| agents/README.md | ✅ | ✅ | ✅ 同期済み |
| agents/specs/coding/*.md | ✅ 11 files | ✅ 11 files | ✅ 同期済み |
| agents/specs/business/*.md | ✅ 14 files | ✅ 14 files | ✅ 同期済み |
| agents/prompts/coding/*.md | ✅ 9 files | ✅ 9 files | ✅ 同期済み |
| agents/prompts/business/*.md | ✅ 20 files | ✅ 20 files | ✅ 同期済み |

**総計**: 87 files (同期済み)

#### 1.2 内容に差分あり（更新必要）

| File | .claude | .codex | 差分内容 | Action |
|------|---------|--------|---------|--------|
| context/core-rules.md | ✅ 最新 | ⚠️ 古い | MCP First, Benchmark Protocol | → .claudeから同期 |
| context/miyabi-definition.md | ✅ 最新 | ⚠️ 古い | miyabi_def v2.0 | → .claudeから同期 |
| context/swml-framework.md | ✅ 最新 | ⚠️ 古い | Ω Function実装 | → .claudeから同期 |
| context/omega-phases.md | ✅ 最新 | ⚠️ 古い | θ₁-θ₆フェーズ | → .claudeから同期 |
| context/agents.md | ✅ 最新 | ⚠️ 古い | 21 Agents完成 | → .claudeから同期 |
| context/worktree.md | ✅ 最新 | ⚠️ 古い | Worktreeライフサイクル | → .claudeから同期 |
| context/protocols.md | ✅ 最新 | ⚠️ 古い | Agent間通信プロトコル | → .claudeから同期 |
| context/INDEX.md | ✅ 最新 | ⚠️ 古い | 15モジュール索引 | → .claudeから同期 |
| commands/INDEX.md | ✅ 32 commands | ⚠️ 28 commands | 4コマンド不足 | → .claudeから同期 |
| README.md | ✅ 最新 | ⚠️ 古い | Orchestra v1.1.0記載 | → .claudeから同期 |

**総計**: 10 files (更新必要)

### Category 2: .claudeのみに存在（追加必要）

#### 2.1 メインエントリーポイント

| File | Description | Action |
|------|-------------|--------|
| CLAUDE.md | メインコントロール文書 | → .codexに **CODEX.md** として作成 |

#### 2.2 Commands (4個)

| File | Description | Action |
|------|-------------|--------|
| commands/orchestra.md | Orchestra v1.1.0起動 | → .codexに追加 |
| commands/tmux-orchestra-start.md | tmux Orchestra手動起動 | → .codexに追加 |
| commands/test-mcp.md | MCP動作確認 | → .codexに追加 |
| commands/codex-monitor.md | Codex監視 | → .codexに追加 |

#### 2.3 Guides (7個)

| File | Description | Action |
|------|-------------|--------|
| guides/BENCHMARK_IMPLEMENTATION.md | Benchmark実装ガイド | → .codex/guides/新設 |
| guides/HOOKS_IMPLEMENTATION.md | Hooks実装ガイド | → .codex/guides/新設 |
| guides/MCP_INTEGRATION_PROTOCOL.md | MCP統合プロトコル | → .codexルートから移動 |
| guides/LABEL_USAGE.md | Label使用ガイド | → .codex/guides/新設 |
| guides/SWML_CONVERGENCE.md | SWML収束理論 | → .codex/guides/新設 |
| guides/SWML_QUALITY_METRICS.md | SWML品質メトリクス | → .codex/guides/新設 |
| guides/TMUX_AI_AGENT_CONTROL.md | tmux Agent制御 | → .codex/guides/新設 |

#### 2.4 tmux関連ドキュメント (5個)

| File | Description | Action |
|------|-------------|--------|
| ORCHESTRA_COMPLETE_GUIDE.md | Orchestra v1.1.0完全ガイド | → .codexに追加 |
| MIYABI_PARALLEL_ORCHESTRA.md | 並列実行の哲学 | → .codexに追加 |
| MIYABI_ORCHESTRA_INTEGRATION.md | Orchestra統合ガイド | → .codexに追加 |
| TMUX_OPERATIONS.md | tmux技術詳細 | → .codexに追加 |
| TMUX_INTEGRATION_INDEX.md | tmux統合インデックス | → .codexに追加 |

#### 2.5 その他重要ファイル (5個)

| File | Description | Action |
|------|-------------|--------|
| CODEX_TMUX_PARALLEL_EXECUTION.md | Codex Company並列実行 | → .codexに追加 |
| KAMUI_TMUX_GUIDE.md | Kamui tmux統合 | → .codexに追加 |
| TMUX_A2A_HYBRID_ARCHITECTURE.md | Agent間通信アーキテクチャ | → .codexに追加 |
| TMUX_ADVANCED_TECHNIQUES.md | tmux上級テクニック | → .codexに追加 |
| SESSION_END_HOOKS_GUIDE.md | セッション終了フック | → .codexに追加 |

**総計**: 22 files (追加必要)

### Category 3: .codexのみに存在（処理必要）

#### 3.1 削除対象（重複）

| File/Directory | Description | Reason | Action |
|----------------|-------------|--------|--------|
| agents.bak/ | Agent仕様バックアップ | agents/と完全重複 | → 削除 |
| context.bak/ | コンテキストバックアップ | context/と完全重複 | → 削除 |
| CODEX_DESIGN_PATTERNS.md | レガシー設計文書 | 既に.claude/archiveへ移動済み | → archive/へ移動後削除 |
| CODEX_PATTERN_APPLICATION_PLAN.md | レガシー適用計画 | 既に.claude/archiveへ移動済み | → archive/へ移動後削除 |
| CODEX_SESSION_README.md | レガシーセッション管理 | 既に.claude/archiveへ移動済み | → archive/へ移動後削除 |
| NEXT_PHASE_PLANNING.md | 旧フェーズ計画 | 既に完了 | → archive/へ移動後削除 |
| OPTIMIZATION_PLAN.md | 旧最適化計画 | 既に実施済み | → archive/へ移動後削除 |
| PATTERN3_CHECKLIST.md | Pattern3チェックリスト | 古いパターン | → archive/へ移動後削除 |
| RUST_MIGRATION_CHECKLIST.md | Rust移行チェックリスト | 既に完了 | → archive/へ移動後削除 |
| RUST_MIGRATION_SUMMARY.md | Rust移行サマリー | 既に完了 | → archive/へ移動後削除 |
| TEST_INSTRUCTIONS_FOR_CODEX.md | 旧テスト手順 | 既に.claude/archiveへ移動済み | → archive/へ移動後削除 |
| TEST_INSTRUCTIONS_FOR_GEMINI.md | 旧テスト手順 | 既に.claude/archiveへ移動済み | → archive/へ移動後削除 |

**総計**: 2 directories + 10 files (削除対象)

#### 3.2 統合対象（プロンプト・テンプレート）

| File | Description | Action |
|------|-------------|--------|
| prompts/task-management-protocol.md | タスク管理プロトコル | → .codex/context/protocols.mdへ統合 |
| prompts/worktree-agent-execution.md | Worktree Agent実行 | → .codex/context/worktree.mdへ統合 |
| templates/reporting-protocol.md | 報告プロトコルテンプレート | → .codex/context/protocols.mdへ統合 |

**統合後**: prompts/ と templates/ ディレクトリは削除

#### 3.3 保持対象（.codex固有）

| File/Directory | Description | Action |
|----------------|-------------|--------|
| CODEX.md | Codexメインエントリー | → 維持（CLAUDE.mdから派生） |
| docs/AI_CLI_*.md | AI CLI統合ドキュメント | → 維持（Codex固有情報） |
| gemini-instructions.md | Gemini特有手順 | → 維持（Codex固有情報） |
| instructions.md | Codex一般手順 | → 維持（更新） |
| settings*.json | Codex設定ファイル | → 維持 |
| mcp-config.json | MCP設定 | → 維持 |
| mcp.json | MCP設定（レガシー？） | → 統合検討 |

---

## 🔧 統合・削除・移行計画

### フェーズ2: 基盤実装（実装順序）

#### Step 1: 構造整理（クリーンアップ）

**目的**: 重複と古いファイルを削除し、クリーンな状態にする

```bash
# 1.1 重複ディレクトリ削除
rm -rf .codex/agents.bak/
rm -rf .codex/context.bak/

# 1.2 レガシードキュメント移動
mkdir -p .codex/archive
mv .codex/CODEX_DESIGN_PATTERNS.md .codex/archive/
mv .codex/CODEX_PATTERN_APPLICATION_PLAN.md .codex/archive/
mv .codex/CODEX_SESSION_README.md .codex/archive/
mv .codex/NEXT_PHASE_PLANNING.md .codex/archive/
mv .codex/OPTIMIZATION_PLAN.md .codex/archive/
mv .codex/PATTERN3_CHECKLIST.md .codex/archive/
mv .codex/RUST_MIGRATION_CHECKLIST.md .codex/archive/
mv .codex/RUST_MIGRATION_SUMMARY.md .codex/archive/
mv .codex/TEST_INSTRUCTIONS_FOR_CODEX.md .codex/archive/
mv .codex/TEST_INSTRUCTIONS_FOR_GEMINI.md .codex/archive/

# 1.3 統合対象移動（一時）
mkdir -p .codex/.temp-integration
mv .codex/prompts/task-management-protocol.md .codex/.temp-integration/
mv .codex/prompts/worktree-agent-execution.md .codex/.temp-integration/
mv .codex/templates/reporting-protocol.md .codex/.temp-integration/
```

**期待される結果**:
- agents.bak/, context.bak/ 削除
- レガシードキュメント10個が archive/ へ移動
- prompts/, templates/ が空になり削除準備完了

#### Step 2: 新規ディレクトリ作成

**目的**: 必要な新規ディレクトリを作成

```bash
# 2.1 guides/ 作成
mkdir -p .codex/guides

# 2.2 hooks/ 整備（既存だが空）
mkdir -p .codex/hooks

# 2.3 schemas/ 新設
mkdir -p .codex/schemas

# 2.4 tools/ 新設
mkdir -p .codex/tools
mkdir -p .codex/tools/custom

# 2.5 mcp-servers/ 作成（.claudeからコピー）
# Note: node_modulesは大きいので、package.jsonのみコピーして後で npm install
mkdir -p .codex/mcp-servers
```

**期待される結果**:
- guides/, hooks/, schemas/, tools/, mcp-servers/ が作成される
- ディレクトリ構造が.claude準拠になる

#### Step 3: .claudeからファイル同期

**目的**: .claudeの最新ファイルを.codexにコピー

```bash
# 3.1 Context modules更新（差分あり10個）
cp .claude/context/core-rules.md .codex/context/
cp .claude/context/miyabi-definition.md .codex/context/
cp .claude/context/swml-framework.md .codex/context/
cp .claude/context/omega-phases.md .codex/context/
cp .claude/context/agents.md .codex/context/
cp .claude/context/worktree.md .codex/context/
cp .claude/context/protocols.md .codex/context/
cp .claude/context/INDEX.md .codex/context/
cp .claude/README.md .codex/
cp .claude/commands/INDEX.md .codex/commands/

# 3.2 Commands追加（4個）
cp .claude/commands/orchestra.md .codex/commands/
cp .claude/commands/tmux-orchestra-start.md .codex/commands/
cp .claude/commands/test-mcp.md .codex/commands/
cp .claude/commands/codex-monitor.md .codex/commands/

# 3.3 Guides追加（7個）
cp -r .claude/guides/* .codex/guides/

# 3.4 tmux関連ドキュメント追加（5個）
cp .claude/ORCHESTRA_COMPLETE_GUIDE.md .codex/
cp .claude/MIYABI_PARALLEL_ORCHESTRA.md .codex/
cp .claude/MIYABI_ORCHESTRA_INTEGRATION.md .codex/
cp .claude/TMUX_OPERATIONS.md .codex/
cp .claude/TMUX_INTEGRATION_INDEX.md .codex/

# 3.5 その他重要ファイル追加（5個）
cp .claude/CODEX_TMUX_PARALLEL_EXECUTION.md .codex/
cp .claude/KAMUI_TMUX_GUIDE.md .codex/
cp .claude/TMUX_A2A_HYBRID_ARCHITECTURE.md .codex/
cp .claude/TMUX_ADVANCED_TECHNIQUES.md .codex/
cp .claude/SESSION_END_HOOKS_GUIDE.md .codex/
```

**期待される結果**:
- Context modules 10個が最新版に更新
- Commands 4個が追加（総計32個）
- Guides 7個が追加
- tmux関連15個のドキュメントが追加

#### Step 4: CODEX.md作成

**目的**: .codex/CODEX.md を .claude/CLAUDE.md から派生して作成

```bash
# 4.1 CLAUDE.mdをベースにCODEX.mdを作成
cp .claude/CLAUDE.md .codex/CODEX.md

# 4.2 編集（手動）
# - タイトルを "Miyabi - Codex Operating Manual" に変更
# - .claude固有の参照を .codex に置き換え
# - Codex固有のセクション追加
```

**期待される内容**:
```markdown
# Miyabi - Codex Operating Manual v4.0

**Last Updated**: 2025-11-06 | **Format**: Codex Instruction Manual | **Target**: Codex Agents

---

## 🎯 Executive Summary

**WHO**: あなたは Miyabi tmux マルチエージェント・オーケストレーション内の一員です
**WHAT**: GitHub Issue を自動処理する自律型開発フレームワーク
**HOW**: Rust-based Agents + Git Worktree + tmux による並列実行

[... 以下.claude/CLAUDE.mdの内容を基に、Codex向けにカスタマイズ ...]
```

#### Step 5: データ構造ファイル配置

**目的**: Phase 1で設計したJSON/YAMLスキーマを配置

```bash
# 5.1 スキーマファイル作成（DATA_STRUCTURES.mdから抽出）
# agents_store.schema.json
# hooks-config.schema.json
# tools-config.schema.yaml
# context_index.schema.yaml

# これらは既にDATA_STRUCTURES.mdで設計済み
# 実際のファイルとして.codex/schemas/に配置
```

#### Step 6: プロンプト・テンプレート統合

**目的**: .codex/.temp-integration/の内容を既存ファイルへ統合

```bash
# 6.1 task-management-protocol.md → context/protocols.md へ統合（手動マージ）
# 6.2 worktree-agent-execution.md → context/worktree.md へ統合（手動マージ）
# 6.3 reporting-protocol.md → context/protocols.md へ統合（手動マージ）

# 6.4 統合完了後、.temp-integrationとprompts/, templates/削除
rm -rf .codex/.temp-integration
rm -rf .codex/prompts
rm -rf .codex/templates
```

#### Step 7: Hooks実装

**目的**: .codex/hooks/にhooksを実装

```bash
# 7.1 hooks-config.jsonサンプル作成（DATA_STRUCTURES.mdから）
# 7.2 サンプルhooksスクリプト作成
touch .codex/hooks/auto-format.sh
touch .codex/hooks/validate-typescript.sh
touch .codex/hooks/log-commands.sh
touch .codex/hooks/agent-event.sh
chmod +x .codex/hooks/*.sh

# 7.3 README.md更新
```

#### Step 8: Tools設定

**目的**: .codex/tools/にツール設定を配置

```bash
# 8.1 tools-config.yaml作成（DATA_STRUCTURES.mdから）
# 8.2 README.md作成
```

#### Step 9: MCP統合

**目的**: .codex/mcp-servers/を.claude/mcp-servers/から同期

```bash
# 9.1 package.jsonコピー
cp .claude/mcp-servers/package.json .codex/mcp-servers/
cp .claude/mcp-servers/package-lock.json .codex/mcp-servers/

# 9.2 依存関係インストール
cd .codex/mcp-servers && npm install

# 9.3 mcp-config.json統合
# .codexルートのmcp-config.jsonと.claude/mcp-config.jsonをマージ
```

#### Step 10: INDEX.md更新

**目的**: .codex/INDEX.mdを最新構造に合わせて更新

```bash
# 10.1 新規ディレクトリ（guides/, hooks/, schemas/, tools/）を反映
# 10.2 削除ディレクトリ（agents.bak/, context.bak/, prompts/, templates/）を削除
# 10.3 新規ファイル22個を追加
```

---

## 📊 実装チェックリスト

### Phase 2 タスク一覧

#### Step 1: 構造整理
- [ ] agents.bak/ 削除
- [ ] context.bak/ 削除
- [ ] レガシードキュメント10個を archive/ へ移動
- [ ] prompts/, templates/ の内容を .temp-integration へ移動

#### Step 2: 新規ディレクトリ作成
- [ ] .codex/guides/ 作成
- [ ] .codex/hooks/ 整備
- [ ] .codex/schemas/ 作成
- [ ] .codex/tools/ 作成
- [ ] .codex/mcp-servers/ 作成

#### Step 3: .claudeからファイル同期
- [ ] Context modules 10個更新
- [ ] Commands 4個追加
- [ ] Guides 7個追加
- [ ] tmux関連5個追加
- [ ] その他重要ファイル5個追加

#### Step 4: CODEX.md作成
- [ ] CLAUDE.mdをベースに作成
- [ ] Codex向けにカスタマイズ
- [ ] 参照パスを.codexに置き換え

#### Step 5: データ構造ファイル配置
- [ ] agents_store.schema.json 作成
- [ ] hooks-config.schema.json 作成
- [ ] tools-config.schema.yaml 作成
- [ ] context_index.schema.yaml 作成

#### Step 6: プロンプト・テンプレート統合
- [ ] task-management-protocol.md → context/protocols.md
- [ ] worktree-agent-execution.md → context/worktree.md
- [ ] reporting-protocol.md → context/protocols.md
- [ ] .temp-integration/, prompts/, templates/ 削除

#### Step 7: Hooks実装
- [ ] hooks-config.json作成
- [ ] auto-format.sh作成
- [ ] validate-typescript.sh作成
- [ ] log-commands.sh作成
- [ ] agent-event.sh作成
- [ ] hooks/README.md更新

#### Step 8: Tools設定
- [ ] tools-config.yaml作成
- [ ] tools/README.md作成
- [ ] tools/custom/ 準備

#### Step 9: MCP統合
- [ ] package.json コピー
- [ ] npm install 実行
- [ ] mcp-config.json マージ

#### Step 10: INDEX.md更新
- [ ] 新規ディレクトリ反映
- [ ] 削除ディレクトリ削除
- [ ] 新規ファイル22個追加

---

## 📈 予想される効果

### Before (現状)

```
.codex/
├── 246 files, 106,434 lines
├── 重複ディレクトリ: 2個 (agents.bak/, context.bak/)
├── レガシードキュメント: 10個
├── 古いContext: 10個
├── 欠落Commands: 4個
├── 欠落Guides: 7個
├── 欠落tmuxドキュメント: 10個
├── 未実装Hooks: hooks/ は空
├── 未実装Tools: tools/ 存在しない
└── 混在Prompts: prompts/, templates/ に分散
```

### After (Phase 2完了後)

```
.codex/
├── ~180 files, ~125,000 lines（最新化 + 整理）
├── 重複削除: agents.bak/, context.bak/ 削除
├── アーカイブ: 10個のレガシーが archive/ へ
├── 最新Context: 10個更新 + 2個追加
├── 完全Commands: 32個（.claude準拠）
├── 完全Guides: 7個新設
├── 完全tmuxドキュメント: 10個追加
├── 実装Hooks: hooks-config.json + 4 scripts
├── 実装Tools: tools-config.yaml + custom/
├── 統合Prompts: context/ へ統合、prompts/ 削除
├── スキーマ: schemas/ に4ファイル
└── MCP統合: mcp-servers/ 完全同期
```

### 効果

| Metric | Before | After | 改善率 |
|--------|--------|-------|--------|
| **重複ファイル** | 87 files (agents.bak/, context.bak/) | 0 files | -100% |
| **レガシードキュメント** | 10 files | 0 files (全てarchive/) | -100% |
| **古いContext** | 10/15 modules | 0/15 modules | +100%同期 |
| **Commands** | 28 commands | 32 commands | +14.3% |
| **Guides** | 0 guides | 7 guides | +∞ |
| **tmuxドキュメント** | 0 files | 15 files | +∞ |
| **Hooks実装** | 0% | 100% | +∞ |
| **Tools実装** | 0% | 100% | +∞ |
| **構造整合性** | 70% | 100% | +30% |

---

## 🚨 リスク・注意事項

### リスク1: ファイル削除時のバックアップ

**問題**: agents.bak/, context.bak/削除時、誤って必要なファイルを削除する可能性

**対策**:
```bash
# 削除前に必ずバックアップ
tar -czf .codex-backup-$(date +%Y%m%d).tar.gz .codex/agents.bak .codex/context.bak
```

### リスク2: Context統合時の内容衝突

**問題**: prompts/task-management-protocol.md を context/protocols.md へ統合時、既存内容と衝突

**対策**:
- 手動マージ必須
- 差分確認: `diff prompts/task-management-protocol.md context/protocols.md`
- Git commitで履歴保持

### リスク3: MCP設定の互換性

**問題**: .codex/mcp-config.json と .claude/mcp-config.json の設定衝突

**対策**:
- マージ前に両方の内容を確認
- 重複キーは.claude優先
- テスト実行: `claude mcp list`

### リスク4: Hooks実装の動作確認

**問題**: 新規作成したhooksが正しく動作しない

**対策**:
- 各hooksスクリプトに単体テスト追加
- hooks-config.json の timeout 設定を適切に
- 実行権限確認: `chmod +x .codex/hooks/*.sh`

---

## 📝 次のステップ

### Phase 2 実装開始

**準備**:
1. ✅ CODEX_OVERHAUL_REQUIREMENTS.md 完成
2. ✅ DATA_STRUCTURES.md 完成
3. ✅ DIFF_ANALYSIS_REPORT.md 完成（このファイル）

**実行順序**:
1. **Step 1-2**: 構造整理 + 新規ディレクトリ作成（30分）
2. **Step 3**: .claudeからファイル同期（1時間）
3. **Step 4**: CODEX.md作成（1時間）
4. **Step 5**: データ構造ファイル配置（30分）
5. **Step 6**: プロンプト・テンプレート統合（1時間）
6. **Step 7-8**: Hooks + Tools実装（2時間）
7. **Step 9**: MCP統合（30分）
8. **Step 10**: INDEX.md更新（30分）

**総所要時間**: 約7時間

**実装方法**:
```bash
# Phase 2開始
git checkout -b feat/codex-overhaul-phase2

# Step 1-10を順次実行
# 各Stepごとにcommit

# Phase 2完了後
git commit -m "feat(codex): Phase 2 基盤実装完了"
```

---

## 🎯 成功基準

Phase 2が成功したとみなす基準:

### 機能面
- [ ] ✅ .codex構造が.claude準拠（9ディレクトリ）
- [ ] ✅ 重複ファイル0個
- [ ] ✅ レガシードキュメント0個（全てarchive/）
- [ ] ✅ Context modules 15個全て最新
- [ ] ✅ Commands 32個完備
- [ ] ✅ Guides 7個完備
- [ ] ✅ Hooks実装完了（config + 4 scripts）
- [ ] ✅ Tools実装完了（config + custom/）
- [ ] ✅ MCP統合完了（mcp-servers/ + config）
- [ ] ✅ スキーマ4個配置

### 品質面
- [ ] ✅ 全ファイルがMarkdown linter通過
- [ ] ✅ JSON/YAML ファイルが ajv validation 通過
- [ ] ✅ Hooks が動作確認済み
- [ ] ✅ INDEX.md が最新構造反映

### ドキュメント面
- [ ] ✅ CODEX.md が完成（CLAUDE.md準拠）
- [ ] ✅ 各ディレクトリに README.md 存在
- [ ] ✅ 差分分析レポート最新（このファイル）

---

## 🔗 関連ドキュメント

### Phase 1 成果物
- [CODEX_OVERHAUL_REQUIREMENTS.md](./CODEX_OVERHAUL_REQUIREMENTS.md) - 要件定義書
- [DATA_STRUCTURES.md](./DATA_STRUCTURES.md) - データ構造設計
- [DIFF_ANALYSIS_REPORT.md](./DIFF_ANALYSIS_REPORT.md) - このファイル

### 参照ドキュメント
- [.claude/CLAUDE.md](../../.claude/CLAUDE.md) - メインコントロール文書
- [.claude/context/INDEX.md](../../.claude/context/INDEX.md) - コンテキストモジュール索引
- [.claude/commands/INDEX.md](../../.claude/commands/INDEX.md) - スラッシュコマンド索引

---

**Status**: ✅ Phase 1差分分析完了
**Next**: Phase 2基盤実装開始
**Agent**: カエデ (CodeGenAgent)
**Date**: 2025-11-06
