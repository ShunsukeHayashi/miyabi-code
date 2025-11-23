---
title: "Context Modules - 17の知識の結晶"
created: 2025-11-20
updated: 2025-11-20
author: "Claude Code"
category: "architecture"
tags: ["miyabi", "context", "knowledge", "modules"]
status: "published"
aliases: ["Context Modules", "コンテキストモジュール"]
---

# Context Modules - 17の知識の結晶

> タスク実行に必要な知識を、パターンベースで動的にロードする

---

## 🎯 Context Modulesとは

**定義**: Claude Codeが必要に応じて動的にロードする、17個の知識モジュール

**特徴**:
- 📦 **モジュール化**: 独立した知識単位
- 🎯 **パターンベース**: タスクタイプ → モジュール の自動マッピング
- ⭐ **優先度付き**: 5段階の重要度
- 🔄 **Legacy管理**: 古い情報源の明示

---

## 📚 17個のモジュール一覧

### ⭐⭐⭐⭐⭐ Essential（最重要 - 2個）

#### 1. miyabi-definition.md ✨ NEW

**トークン**: ~800 tokens
**役割**: 全ての定義の根源

**内容**:
- 14 Entities（Issue, Task, Agent, PR, Label, etc.）
- 39 Relations（Issue処理、Agent実行、Label制御、etc.）
- 57 Labels（11カテゴリ）
- 5 Workflows（Issue処理、コード生成、デプロイ、etc.）

**いつ読む**: 全てのタスク実行前（最優先）

**関連**: [[miyabi-entity-relation-model|Entity-Relation Model詳細]]

---

#### 2. core-rules.md

**トークン**: ~400 tokens
**役割**: 三大原則の守護者

**内容**:
1. **MCP First Approach**
   - 全タスク実行前にMCPの活用可能性を確認

2. **Benchmark Implementation Protocol**
   - 公式ハーネス必須、独自実装禁止

3. **Context7 Usage**
   - 外部ライブラリ参照時は必ずContext7使用

**いつ読む**: 新しいタスク開始時（必須）

**関連**: [[mcp-integration-protocol|MCP統合プロトコル]]

---

### ⭐⭐⭐⭐ High Priority（高優先度 - 5個）

#### 3. agents.md

**トークン**: ~300 tokens
**役割**: 21 Agents概要

**内容**:
- Coding Agents（7個）
- Business Agents（14個）
- Agent協調プロトコル

**いつ読む**: Agent実行時

**関連**: [[2025-11-20-agents-system-guide|Agents System完全ガイド]]

---

#### 4. architecture.md

**トークン**: ~400 tokens
**役割**: システムの骨格

**内容**:
- Cargo Workspace構造
- Git Worktree並列実行
- GitHub as OS アーキテクチャ

**いつ読む**: アーキテクチャ理解時

**関連**: [[miyabi-architecture|Miyabiアーキテクチャ詳細]]

---

#### 5. development.md

**トークン**: ~300 tokens
**役割**: 開発規約

**内容**:
- Rust 2021 Edition規約
- TypeScript規約
- テスト規約
- CI/CD規約

**いつ読む**: コード実装時

---

#### 6. worktree.md

**トークン**: ~300 tokens
**役割**: 並列実行の秘密

**内容**:
- Worktree Lifecycle
- 並列実行プロトコル
- Worktree管理コマンド

**いつ読む**: 並列タスク実行時

**関連**: [[git-worktree-protocol|Git Worktree プロトコル]]

---

#### 7. rust.md

**トークン**: ~300 tokens
**役割**: Rust 2021 Edition開発ガイド

**内容**:
- Cargo規約
- コーディングスタイル
- エラーハンドリング
- テスト作成

**いつ読む**: Rustコード実装時

---

### ⭐⭐⭐ Medium Priority（中優先度 - 6個）

#### 8. entity-relation.md 🔄 Legacy

**トークン**: ~300 tokens
**役割**: Entity-Relationモデル（Legacy）

**状態**: **Superseded by miyabi-definition.md**

**移行先**: [[miyabi-definition]]

---

#### 9. labels.md 🔄 Legacy

**トークン**: ~200 tokens
**役割**: 57ラベル体系（Legacy）

**状態**: **Superseded by miyabi-definition.md**

**移行先**: [[miyabi-definition]]

---

#### 10. protocols.md

**トークン**: ~300 tokens
**役割**: タスク管理・報告プロトコル

**内容**:
- タスク分解プロトコル
- Agent間通信プロトコル
- 報告フォーマット

---

#### 11. external-deps.md

**トークン**: ~200 tokens
**役割**: 外部依存関係

**内容**:
- Context7統合
- MCP Servers一覧
- 外部ライブラリ参照方法

---

#### 12. infrastructure.md

**トークン**: ~300 tokens
**役割**: インフラストラクチャ

**内容**:
- AWS統合
- Firebase設定
- CI/CD パイプライン

---

#### 13. typescript.md ⭐

**トークン**: ~200 tokens
**役割**: TypeScript開発（レガシー参考）

**内容**:
- レガシーTypeScriptコード参照用
- 新規実装はRust優先

---

### ⭐⭐ Low Priority（低優先度 - 2個）

#### 14. lint-integration.md

**トークン**: ~100 tokens
**役割**: Lint統合

---

#### 15. omega-phases.md

**トークン**: ~200 tokens
**役割**: Omega Phase定義

---

### 🆕 NEW Modules（新規 - 2個）

#### 16. swml-framework.md

**トークン**: ~300 tokens
**役割**: SWML Framework統合

---

#### 17. DIAGRAMS.md

**トークン**: ~200 tokens
**役割**: PlantUML/Mermaid図の管理

**内容**:
- agents.puml
- architecture.puml
- entity-relation.puml
- protocols.puml
- worktree.puml

**関連**: [[diagram-gallery|ダイアグラムギャラリー]]

---

## 🎯 使用パターン（6パターン）

### Pattern 0: Miyabi Definition Lookup（最優先）

```
任意のタスク → miyabi-definition.md を確認

例:
- Entity属性確認
- Relation実装確認
- Label割り当て
- Workflow stage確認
```

---

### Pattern 1: Agent開発タスク

```
必要なモジュール:
✅ miyabi-definition.md ✨
✅ core-rules.md
✅ agents.md
✅ rust.md
✅ development.md

実行例:
"CoordinatorAgentを実装する"
  ↓
5つのモジュールをロード
  ↓
実装開始
```

---

### Pattern 2: Issue処理タスク

```
必要なモジュール:
✅ miyabi-definition.md ✨
✅ core-rules.md
✅ worktree.md
✅ protocols.md

実行例:
"Issue #270を処理する"
  ↓
4つのモジュールをロード
  ↓
処理開始
```

---

### Pattern 3: ベンチマーク実装タスク

```
必要なモジュール:
✅ core-rules.md
✅ external-deps.md
✅ development.md

実行例:
"新しいベンチマークを追加する"
  ↓
3つのモジュールをロード
  ↓
公式ハーネス使用を確認
  ↓
実装開始
```

---

### Pattern 4: 定義ファイル生成タスク

```
必要なモジュール:
✅ miyabi-definition.md

実行手順:
1. cd /Users/shunsuke/Dev/miyabi-private/miyabi_def
2. source .venv/bin/activate
3. python generate.py
4. ls -lh generated/
```

---

### Pattern 5: AIfactory統合タスク

```
必要なモジュール:
✅ aifactory-integration.md ✨
✅ core-rules.md
✅ agents.md
✅ development.md

実行例:
"AIfactory Business Agentを実装する"
  ↓
4つのモジュールをロード
  ↓
実装開始
```

---

### Pattern 6: Pantheon Society構築タスク

```
必要なモジュール:
✅ pantheon-society.md 🌍
✅ core-rules.md
✅ agents.md
✅ architecture.md

実行例:
"Historical Agentを実装する"
  ↓
4つのモジュールをロード
  ↓
実装開始
```

---

## 🔄 モジュール更新ポリシー

### 更新タイミング

Context Moduleは以下の場合に更新:

1. **新機能追加時**
   - Agent追加
   - 新プロトコル導入
   - 新ツール統合

2. **重大なアーキテクチャ変更時**
   - Workspace構造変更
   - Worktree戦略変更
   - Entity-Relationモデル変更

3. **ベストプラクティス更新時**
   - 新しいコーディング規約
   - 新しいテストパターン
   - 新しいCI/CD手法

---

## 📊 トークン使用量

### 総トークン数

```
Essential (2):     ~1,200 tokens
High Priority (5): ~1,700 tokens
Medium Priority (6): ~1,600 tokens
Low Priority (2):  ~300 tokens
NEW (2):           ~500 tokens

Total: ~5,300 tokens（個別読み込み時）
```

### 効率的な読み込み

**パターンベース**: 必要なモジュールのみロード
- Agent開発: ~2,000 tokens
- Issue処理: ~1,500 tokens
- ベンチマーク: ~1,000 tokens

**vs 全モジュールロード**: ~5,300 tokens

**削減率**: 60-80%

---

## 🔗 関連ドキュメント

### 詳細ドキュメント

- [[miyabi-entity-relation-model|Entity-Relation Model詳細]]
- [[label-system-guide|Label System完全ガイド]]
- [[template-master-index|Template Master Index]]

### 統合プロトコル

- [[mcp-integration-protocol|MCP統合プロトコル]]
- [[benchmark-implementation-checklist|Benchmark実装チェックリスト]]

### 並列実行

- [[miyabi-parallel-orchestra|Miyabi並列オーケストラ]]
- [[tmux-operations|tmux操作ガイド]]

---

## 🎓 ベストプラクティス

### 1. パターンベースロード

```
❌ Bad: 全モジュールを常にロード
✅ Good: タスクタイプに応じて必要なモジュールのみロード
```

### 2. miyabi-definition.md優先

```
❌ Bad: entity-relation.md や labels.md を参照
✅ Good: miyabi-definition.md を参照（最新・完全版）
```

### 3. Core Rules確認

```
✅ 全タスク実行前に core-rules.md を確認
  - MCP First?
  - Benchmark Protocol?
  - Context7?
```

---

## 📈 更新履歴

### v3.1.0 (2025-11-12)

- ✨ NEW: miyabi-definition.md（14 Entities, 39 Relations, 57 Labels, 5 Workflows）
- 🔄 Legacy: entity-relation.md, labels.md をSuperseded扱い
- 🆕 NEW: aifactory-integration.md, pantheon-society.md 追加
- 📊 Pattern 6個に拡張

### v3.0.0 (2025-10-31)

- ✨ Orchestrator Pattern統合
- 🎯 Sub-Agent分離
- 📊 Context Index追加

### v2.0.0 (2025-10-15)

- 📚 17個に拡張
- ⭐ Priority System導入

### v1.0.0 (2025-10-01)

- 🎉 初版リリース
- 📦 10個のモジュール

---

**作成日**: 2025-11-20
**最終更新**: 2025-11-20
**バージョン**: 3.1.0
**ステータス**: ✅ Published

#miyabi #context #knowledge #modules

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>
