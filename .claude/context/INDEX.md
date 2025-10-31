# Miyabi Context Index

**Last Updated**: 2025-10-24
**Version**: 2.0.0

## 📚 Context Module Directory

このディレクトリには、Miyabiプロジェクトの11個のContext Moduleが格納されています。
Claude Codeは必要に応じて、これらのモジュールを動的にロードします。

## 🗂️ Category List

| Module | File | Size | Priority | Description |
|--------|------|------|----------|-------------|
| **Miyabi Definition** | `miyabi-definition.md` | ~800 tokens | ⭐⭐⭐⭐⭐ | ✨ **NEW** - miyabi_def統合（14 Entities, 39 Relations, 57 Labels, 5 Workflows） |
| **Core Rules** | `core-rules.md` | ~400 tokens | ⭐⭐⭐⭐⭐ | MCP First, Benchmark Protocol, Context7 |
| **Agents** | `agents.md` | ~300 tokens | ⭐⭐⭐⭐ | 21 Agents概要（7 Coding + 14 Business） |
| **Architecture** | `architecture.md` | ~400 tokens | ⭐⭐⭐⭐ | Cargo Workspace, Git Worktree, GitHub OS |
| **Development** | `development.md` | ~300 tokens | ⭐⭐⭐ | Rust/TypeScript規約、テスト、CI/CD |
| **Entity-Relation** | `entity-relation.md` | ~300 tokens | ⭐⭐ | 🔄 Legacy - Superseded by miyabi-definition.md |
| **Labels** | `labels.md` | ~200 tokens | ⭐⭐ | 🔄 Legacy - Superseded by miyabi-definition.md |
| **Worktree** | `worktree.md` | ~300 tokens | ⭐⭐⭐ | Worktreeライフサイクル、並列実行 |
| **Rust** | `rust.md` | ~300 tokens | ⭐⭐⭐ | Rust 2021 Edition開発ガイド |
| **TypeScript** | `typescript.md` | ~200 tokens | ⭐ | レガシーTypeScript参考 |
| **Protocols** | `protocols.md` | ~300 tokens | ⭐⭐ | タスク管理、報告プロトコル |
| **External Deps** | `external-deps.md` | ~200 tokens | ⭐⭐ | Context7、MCP Servers |

**Total Estimated Size**: ~3,800 tokens (個別読み込み時)

**Note**: ✨ `miyabi-definition.md` is the **new primary source** for Entity-Relation Model and Label System. Legacy files remain for backward compatibility.

## 🎯 Usage Pattern

### Pattern 0: 🆕 Miyabi Definition Lookup（最優先）
```
任意のタスクでまず確認すべきモジュール:
- miyabi-definition.md (Entity, Relation, Label, Workflow定義の完全版)

具体例:
- Entity属性確認: miyabi_def/variables/entities.yaml参照
- Relation実装確認: miyabi_def/variables/relations.yaml参照
- Label割り当て: miyabi_def/variables/labels.yaml参照
- Workflow stage確認: miyabi_def/variables/workflows.yaml参照
```

### Pattern 1: Agent開発タスク
```
必要なモジュール:
- miyabi-definition.md ✨ NEW (Agent定義、Entity仕様)
- core-rules.md (MCP確認)
- agents.md (Agent概要)
- rust.md (Rust規約)
- development.md (テスト規約)
```

### Pattern 2: Issue処理タスク
```
必要なモジュール:
- miyabi-definition.md ✨ NEW (Label体系、Workflow定義)
- core-rules.md (MCP確認)
- worktree.md (並列実行)
- protocols.md (報告プロトコル)
```

### Pattern 3: ベンチマーク実装タスク
```
必要なモジュール:
- core-rules.md (Benchmark Protocol)
- external-deps.md (Context7)
- development.md (CI/CD)
```

### Pattern 4: 🆕 定義ファイル生成タスク
```
必要なモジュール:
- miyabi-definition.md (miyabi_defシステム全体)

実行手順:
1. cd /Users/shunsuke/Dev/miyabi-private/miyabi_def
2. source .venv/bin/activate
3. python generate.py
4. ls -lh generated/
```

## 📖 Related Documentation

**Detailed Docs** (既存ドキュメント):
- Entity-Relation: `docs/ENTITY_RELATION_MODEL.md`
- Templates: `docs/TEMPLATE_MASTER_INDEX.md`
- Labels: `docs/LABEL_SYSTEM_GUIDE.md`
- MCP Protocol: `.claude/MCP_INTEGRATION_PROTOCOL.md`
- Benchmark Checklist: `.claude/BENCHMARK_IMPLEMENTATION_CHECKLIST.md`

**Agent Specs**: `.claude/agents/specs/coding/*.md` | `.claude/agents/specs/business/*.md`
**Agent Prompts**: `.claude/agents/prompts/coding/*.md`

## 🔄 Update Policy

Context Moduleは以下の場合に更新:
- 新機能追加時（Agent追加、新プロトコル等）
- 重大なアーキテクチャ変更時
- ベストプラクティス更新時

## 🚀 Quick Commands

```bash
# すべてのContext Module確認
ls -lh .claude/context/

# 特定モジュール表示
cat .claude/context/core-rules.md

# トークン数推定
wc -w .claude/context/*.md
```

---

**Note**: このIndexファイル自体も約200トークンです。
