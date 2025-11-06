# Codex改装プロジェクト - 要件定義書

**Version**: 1.0.0
**Date**: 2025-11-06
**Status**: Phase 1 - 設計整理
**Author**: カエデ (CodeGenAgent)

---

## 🎯 プロジェクト概要

### 目的

.codex ディレクトリを .claude ディレクトリの設計思想・機能に合わせて全面改装し、Claude Code の最新機能に対応した統一的な設定管理システムを構築する。

### 背景

- .claude ディレクトリは2025年11月に大幅にアップデート済み（Orchestra v1.1.0等）
- .codex ディレクトリは古い設計のまま残っており、機能重複・構造不整合が発生
- Claude Code の最新機能（サブエージェント管理、フック、ツール、プロンプト、コンテキスト）に対応する必要がある

---

## 📊 現状分析

### .claude ディレクトリ構造 (最新)

```
.claude/
├── CLAUDE.md                              # ⭐ メインコントロール文書
├── README.md                              # 概要
├── commands/                              # スラッシュコマンド (15+)
│   ├── INDEX.md
│   ├── agent-run.md
│   ├── create-issue.md
│   ├── orchestra.md
│   └── ... (15+ commands)
├── context/                               # コンテキストモジュール (15)
│   ├── INDEX.md
│   ├── core-rules.md
│   ├── agents.md
│   ├── architecture.md
│   ├── entity-relation.md
│   ├── labels.md
│   ├── worktree.md
│   └── ... (15 modules)
├── Skills/                                # スキル定義 (18)
│   ├── README.md
│   ├── agent-execution/
│   ├── rust-development/
│   ├── debugging-troubleshooting/
│   └── ... (18 skills)
├── agents/                                # 削除済み（.claude/context/agents.mdに統合）
├── ORCHESTRA_COMPLETE_GUIDE.md            # v1.1.0 (2025-11-06)
├── MIYABI_PARALLEL_ORCHESTRA.md
├── MIYABI_ORCHESTRA_INTEGRATION.md
├── TMUX_OPERATIONS.md
├── MCP_INTEGRATION_PROTOCOL.md
├── BENCHMARK_IMPLEMENTATION_CHECKLIST.md
└── orchestra-config.yaml                  # Master configuration
```

**特徴**:
- ✅ 明確な階層構造（commands, context, Skills）
- ✅ スラッシュコマンドとスキルの分離
- ✅ コンテキストモジュールの体系化
- ✅ CLAUDE.md による統一的なエントリーポイント
- ✅ 最新ワークフロー (Orchestra v1.1.0, sleep 0.5s)

### .codex ディレクトリ構造 (旧)

```
.codex/
├── README.md                              # 概要
├── INDEX.md                               # マスターインデックス
├── QUICK_START.md
├── TROUBLESHOOTING.md
├── agents.bak/                            # ⚠️ バックアップディレクトリ（混乱の元）
│   ├── AGENT_CHARACTERS.md
│   ├── README.md
│   ├── specs/business/                    # 14 business agents
│   ├── specs/coding/                      # 7 coding agents
│   └── prompts/                           # Agent prompts
├── Skills/                                # スキル定義 (18)
│   ├── README.md
│   ├── agent-execution/
│   └── ... (18 skills)
├── commands/                              # ⚠️ 構造が .claude と異なる
│   └── ... (9 commands)
├── hooks/                                 # ⚠️ 実装なし（将来用）
├── mcp-servers/                           # ⚠️ 実装なし（将来用）
├── prompts/                               # ⚠️ 混在（task-management等）
├── CODEX_DESIGN_PATTERNS.md
├── CODEX_PATTERN_APPLICATION_PLAN.md
├── MCP_INTEGRATION_PROTOCOL.md            # ⚠️ .claude と重複
├── BENCHMARK_IMPLEMENTATION_CHECKLIST.md  # ⚠️ .claude と重複
└── ... (多数のレガシードキュメント)
```

**問題点**:
- ❌ agents.bak/ ディレクトリが混乱を招く
- ❌ .claude と構造が異なる（commands, prompts, hooks の扱い）
- ❌ ドキュメントの重複（MCP_INTEGRATION_PROTOCOL.md等）
- ❌ 古いワークフロー情報が残っている
- ❌ hooks/, mcp-servers/ が未実装

---

## 🎯 改装要件

### 1. サブエージェント管理

**要件**:
- Claude Code の Task tool (subagent_type パラメータ) に対応
- .claude/agents/specs/ の21 Agent仕様を.codexでも参照可能に
- agents_store の永続化（実行履歴、ステータス、メタデータ）

**実装方針**:
- `.codex/agents/` ディレクトリを再構築
- `.claude/agents/specs/` へのシンボリックリンクまたは統一管理
- `agents_store.json` による永続化

### 2. フック (Hooks)

**要件**:
- `.claude/hooks/` の設計に合わせる
- イベント駆動型フック（tool_before, tool_after, session_start, session_end等）
- タイムアウト機能
- JSON設定ファイルによる管理

**実装方針**:
- `.codex/hooks/` ディレクトリを実装
- `hooks-config.json` によるフック設定管理
- イベント→コマンド→タイムアウトのJSON構造

### 3. ツール (Tools)

**要件**:
- Claude Code の標準ツール（Read, Write, Edit, Bash等）との統合
- MCP ツールの管理
- カスタムツールの定義

**実装方針**:
- `.codex/tools/` ディレクトリを新設
- MCP統合は `.codex/mcp-servers/` で管理
- ツール定義のYAML/JSON化

### 4. プロンプト (Prompts)

**要件**:
- Agent実行プロンプトの体系化
- Worktree実行プロンプトの整理
- コンテキストモジュールとの統合

**実装方針**:
- `.codex/prompts/` → `.codex/context/` に統合
- Agent prompts は `.codex/agents/prompts/` に配置
- プロンプトテンプレートのYAML化

### 5. コンテキスト (Context)

**要件**:
- .claude/context/ の15モジュールとの整合性
- Just-In-Time ロードの仕組み
- 優先度管理（⭐⭐⭐⭐⭐ 〜 ⭐）

**実装方針**:
- `.codex/context/` ディレクトリを .claude/context/ と同期
- `context_index.yaml` による管理
- 自動ロード機構の実装

---

## 📐 新ディレクトリ構造設計

### 提案構造

```
.codex/
├── CODEX.md                               # ⭐ NEW - メインエントリーポイント
├── README.md                              # 概要
├── INDEX.md                               # マスターインデックス（更新）
│
├── agents/                                # ⭐ 再構築
│   ├── README.md
│   ├── specs/                             # .claude/agents/specs/ から参照
│   │   ├── coding/                        # 7 coding agents
│   │   └── business/                      # 14 business agents
│   ├── prompts/                           # Agent実行プロンプト
│   │   ├── coding/
│   │   └── business/
│   └── agents_store.json                  # ⭐ NEW - 永続化データ
│
├── commands/                              # スラッシュコマンド（.claude準拠）
│   ├── INDEX.md
│   ├── agent-run.md
│   ├── create-issue.md
│   └── ... (15+ commands)
│
├── context/                               # ⭐ 新設（.claude/context/と同期）
│   ├── INDEX.md
│   ├── core-rules.md
│   ├── agents.md
│   ├── architecture.md
│   └── ... (15 modules)
│
├── hooks/                                 # ⭐ 実装
│   ├── README.md
│   ├── hooks-config.json                  # ⭐ NEW - フック設定
│   ├── auto-format.sh
│   ├── validate-typescript.sh
│   ├── log-commands.sh
│   └── agent-event.sh
│
├── tools/                                 # ⭐ 新設
│   ├── README.md
│   ├── tools-config.yaml                  # ⭐ NEW - ツール定義
│   └── custom/                            # カスタムツール実装
│
├── Skills/                                # 既存（維持）
│   ├── README.md
│   └── ... (18 skills)
│
├── mcp-servers/                           # MCP Server実装
│   ├── README.md
│   └── ... (5 servers)
│
├── schemas/                               # ⭐ 新設 - YAML/JSONスキーマ
│   ├── agents_store.schema.json
│   ├── hooks-config.schema.json
│   ├── tools-config.schema.yaml
│   └── context_index.schema.yaml
│
├── ORCHESTRA_COMPLETE_GUIDE.md            # .claude から同期
├── MCP_INTEGRATION_PROTOCOL.md            # .claude から同期
├── BENCHMARK_IMPLEMENTATION_CHECKLIST.md  # .claude から同期
│
└── archive/                               # ⚠️ レガシードキュメント移動
    ├── agents.bak/
    ├── CODEX_DESIGN_PATTERNS.md
    └── ... (移行後削除予定)
```

### 削除・統合対象

**削除**:
- `.codex/agents.bak/` → `.codex/archive/` へ移動後削除
- `.codex/prompts/` → `.codex/context/` または `.codex/agents/prompts/` へ統合
- 重複ドキュメント（MCP_INTEGRATION_PROTOCOL.md等） → .claude へのシンボリックリンクに変更

**統合**:
- CODEX_DESIGN_PATTERNS.md → CODEX.md へ統合
- CODEX_PATTERN_APPLICATION_PLAN.md → CODEX.md へ統合

---

## 🔄 .claude との差分分析

### 機能比較表

| 機能 | .claude | .codex (現状) | .codex (改装後) |
|------|---------|--------------|---------------|
| メインエントリーポイント | ✅ CLAUDE.md | ❌ なし | ✅ CODEX.md |
| コンテキストモジュール | ✅ 15 modules | ❌ なし | ✅ 15 modules (同期) |
| スラッシュコマンド | ✅ 15+ commands | ⚠️ 9 commands | ✅ 15+ commands (同期) |
| スキル | ✅ 18 skills | ✅ 18 skills | ✅ 18 skills (維持) |
| Agent仕様 | ✅ 21 specs | ⚠️ 21 specs (agents.bak/) | ✅ 21 specs (統合) |
| フック | ✅ 設計済み | ❌ 未実装 | ✅ 実装 |
| ツール管理 | ✅ あり | ❌ なし | ✅ 新設 |
| 永続化 (agents_store) | ❌ なし | ❌ なし | ✅ 実装 |
| YAML/JSONスキーマ | ✅ あり | ❌ なし | ✅ 新設 |
| Orchestra統合 | ✅ v1.1.0 | ❌ 古い | ✅ v1.1.0同期 |

### 設計思想の違い

**.claude の設計思想**:
- **統一的**: CLAUDE.md を頂点とした階層構造
- **モジュール化**: context/, commands/, Skills/ の明確な分離
- **最新ワークフロー**: Orchestra v1.1.0, sleep 0.5s, MCP統合
- **ドキュメント駆動**: 全機能がドキュメントで定義

**.codex の設計思想（旧）**:
- **分散的**: 複数のエントリーポイント（README.md, INDEX.md, QUICK_START.md）
- **未整理**: agents.bak/, prompts/, hooks/ の混在
- **レガシー**: 古いワークフロー情報が残存
- **実装不足**: hooks/, mcp-servers/ が未実装

**.codex の設計思想（改装後）**:
- **統一的**: CODEX.md を頂点とした .claude 準拠の構造
- **モジュール化**: .claude と同等の分離・整理
- **最新ワークフロー**: .claude から同期
- **拡張性**: hooks, tools, schemas による柔軟な拡張

---

## 📊 優先順位付け

### フェーズ1: 設計整理 (現在)

**タスク**:
1. ✅ 要件反映ドキュメント作成 (このファイル)
2. ⏳ データ構造設計
3. ⏳ 差分洗い出しレポート作成

**成果物**:
- CODEX_OVERHAUL_REQUIREMENTS.md (このファイル)
- DATA_STRUCTURES.md (agents_store, hooks-config, tools-config)
- DIFF_ANALYSIS_REPORT.md (.claude vs .codex 詳細比較)

### フェーズ2: 基盤実装

**タスク**:
1. CODEX.md 作成
2. .codex/context/ 新設
3. .codex/hooks/ 実装
4. .codex/tools/ 新設
5. .codex/schemas/ 新設

### フェーズ3: 統合・移行

**タスク**:
1. agents.bak/ → agents/ 統合
2. prompts/ 整理
3. 重複ドキュメント削除
4. .claude との同期機構実装

### フェーズ4: テスト・検証

**タスク**:
1. 全機能動作確認
2. ドキュメント整合性チェック
3. パフォーマンステスト
4. ユーザー受入テスト

---

## 🔗 関連ドキュメント

### .claude 参照

- [CLAUDE.md](../../.claude/CLAUDE.md) - メインコントロール文書
- [ORCHESTRA_COMPLETE_GUIDE.md](../../.claude/ORCHESTRA_COMPLETE_GUIDE.md) - v1.1.0
- [context/INDEX.md](../../.claude/context/INDEX.md) - コンテキストモジュール一覧
- [commands/INDEX.md](../../.claude/commands/INDEX.md) - スラッシュコマンド一覧

### .codex 現状

- [INDEX.md](../INDEX.md) - 現在のマスターインデックス
- [README.md](../README.md) - 現在の概要
- [Skills/README.md](../Skills/README.md) - スキル一覧

---

## 📝 次のステップ

### フェーズ1 残タスク

1. **データ構造設計** (DATA_STRUCTURES.md)
   - agents_store.json の構造設計
   - hooks-config.json の構造設計
   - tools-config.yaml の構造設計
   - context_index.yaml の構造設計

2. **差分洗い出しレポート** (DIFF_ANALYSIS_REPORT.md)
   - .claude vs .codex の詳細比較
   - ファイル単位の差分リスト
   - 統合・削除・移行の具体的計画

---

**Status**: ✅ 要件定義書作成完了
**Next**: DATA_STRUCTURES.md 作成
**Agent**: カエデ (CodeGenAgent)
**Date**: 2025-11-06
