# Miyabi Context Index

**Last Updated**: 2025-10-24
**Version**: 2.0.0

## 📚 Context Module Directory

このディレクトリには、Miyabiプロジェクトの11個のContext Moduleが格納されています。
Claude Codeは必要に応じて、これらのモジュールを動的にロードします。

## 🗂️ Category List

| Module | File | Size | Priority | Description |
|--------|------|------|----------|-------------|
| **Core Rules** | `core-rules.md` | ~400 tokens | ⭐⭐⭐⭐⭐ | MCP First, Benchmark Protocol, Context7 |
| **Agents** | `agents.md` | ~300 tokens | ⭐⭐⭐⭐ | 21 Agents概要（7 Coding + 14 Business） |
| **Architecture** | `architecture.md` | ~400 tokens | ⭐⭐⭐⭐ | Cargo Workspace, Git Worktree, GitHub OS |
| **Development** | `development.md` | ~300 tokens | ⭐⭐⭐ | Rust/TypeScript規約、テスト、CI/CD |
| **Entity-Relation** | `entity-relation.md` | ~300 tokens | ⭐⭐⭐ | 12 Entities, 27 Relations, N1/N2/N3記法 |
| **Labels** | `labels.md` | ~200 tokens | ⭐⭐⭐ | 53 Label体系、10カテゴリ |
| **Worktree** | `worktree.md` | ~300 tokens | ⭐⭐⭐ | Worktreeライフサイクル、並列実行 |
| **Rust** | `rust.md` | ~300 tokens | ⭐⭐⭐ | Rust 2021 Edition開発ガイド |
| **TypeScript** | `typescript.md` | ~200 tokens | ⭐ | レガシーTypeScript参考 |
| **Protocols** | `protocols.md` | ~300 tokens | ⭐⭐ | タスク管理、報告プロトコル |
| **External Deps** | `external-deps.md` | ~200 tokens | ⭐⭐ | Context7、MCP Servers |

**Total Estimated Size**: ~3,000 tokens (個別読み込み時)

## 🎯 Usage Pattern

### Pattern 1: Agent開発タスク
```
必要なモジュール:
- core-rules.md (MCP確認)
- agents.md (Agent仕様)
- rust.md (Rust規約)
- development.md (テスト規約)
```

### Pattern 2: Issue処理タスク
```
必要なモジュール:
- core-rules.md (MCP確認)
- labels.md (Label体系)
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
