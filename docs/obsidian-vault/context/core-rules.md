---
title: "Core Rules - 3 Critical Principles"
created: 2025-11-17
updated: 2025-11-17
author: "Miyabi Team"
category: "context"
tags: ["miyabi", "core-rules", "principles", "mcp", "benchmark", "context7"]
status: "published"
priority: "P0"
related:
  - "[[agents]]"
  - "[[miyabi-definition]]"
  - "[[development]]"
---

# Core Rules - 絶対に守るべき3つのルール

**Last Updated**: 2025-10-26
**Version**: 2.0.1

**Priority**: ⭐⭐⭐⭐⭐ (最重要 - 全タスク実行前に必読)

---

## 🔄 Rule 1: MCP First Approach

**"全てのタスク実行前に、まずMCPの活用可能性を検討する"**

### Phase 0: MCP確認フロー（必須）

```
タスク開始
    ↓
┌────────────────────┐
│ Phase 0: MCP確認   │ ← 【必須】全タスク実行前に実施
└────────────────────┘
    ↓
【Q1】既存MCPで実現可能か？
    ├─ Yes → 既存MCP活用 → 実装へ
    └─ No → Q2へ
    ↓
【Q2】新規MCP作成が有効か？
    ├─ Yes → 新規MCP作成 → 実装へ
    └─ No → 通常実装へ
```

### 確認コマンド

```bash
claude mcp list  # インストール済みMCP確認
```

### 利用可能なMCP

- `@modelcontextprotocol/server-github` - GitHub操作
- `@modelcontextprotocol/server-filesystem` - ファイル操作
- `context7` - 外部ライブラリドキュメント取得
- `miyabi-mcp-server` - Miyabi Agent実行

### 詳細ドキュメント

**完全仕様**: `.claude/MCP_INTEGRATION_PROTOCOL.md`

---

## 🚨 Rule 2: Benchmark Implementation Protocol

**"公式ハーネス必須 - 独自実装禁止"**

### 適用対象

SWE-bench Pro, AgentBench, HAL, Galileo等の公式ベンチマーク

### 実装前チェック（STOP & CHECK）

```bash
cat .claude/BENCHMARK_IMPLEMENTATION_CHECKLIST.md
```

### 必ず実行すること

1. **実装前の徹底調査（30分確保）**
   - 公式リポジトリのREADME.md熟読
   - 公式評価ハーネスの存在確認（`run_evaluation.py`等）
   - Docker要件の確認（`Dockerfile`, `docker-compose.yml`）
   - データセット形式の確認（入力・出力）

2. **公式プロトコル最優先**
   - 公式ハーネスが存在する場合は**必ず使用**（独自実装禁止）
   - Docker必須の場合は**必ず使用**（ローカル実行禁止）
   - 入出力形式は**公式形式に完全準拠**（独自形式禁止）

3. **ユーザー確認必須**
   - 実装方針を決定する前に**必ずユーザー様に確認**

### 絶対禁止事項

- ❌ **ショートカット禁止**: 「独自実装の方が速い」
- ❌ **勝手な判断禁止**: ユーザー確認なしで独自実装
- ❌ **虚偽表示禁止**: 独自実装を標準実装と偽る

### 過去の失敗例

**2025-10-22: SWE-bench Pro独自実装事件**
- 公式ハーネス無視 → 使い物にならない
- Docker要件無視 → 再現不可能
- **絶対に繰り返さない**

### 詳細ドキュメント

**チェックリスト**: `.claude/BENCHMARK_IMPLEMENTATION_CHECKLIST.md`

---

## 📚 Rule 3: Context7 Usage

**"外部ライブラリ参照時は必ずContext7使用"**

### 対象ライブラリ

- Rust: tokio, serde, anyhow, clap等
- TypeScript: Next.js, React, Vite等
- Python: FastAPI, SQLAlchemy等

### 使用方法

```
Use context7 to get the latest Tokio async runtime documentation
```

### 利点

- ✅ 最新ドキュメント取得
- ✅ 正確なAPI仕様確認
- ✅ ベストプラクティス学習
- ✅ 非推奨API回避

### 詳細ドキュメント

**外部依存関係管理**: [[external-deps|External Dependencies Context]]

---

## 🎯 Quick Decision Tree

```
新しいタスク開始
    ↓
MCP活用可能？
    ├─ Yes → MCP使用
    └─ No  → 次へ
    ↓
外部ライブラリ使用？
    ├─ Yes → Context7確認
    └─ No  → 次へ
    ↓
ベンチマーク実装？
    ├─ Yes → 公式ハーネス確認
    └─ No  → 通常実装
```

---

## 📋 Checklist

タスク開始前に必ず確認：

- [ ] MCP First Approach - MCP活用可能性を検討したか？
- [ ] Context7 - 外部ライブラリはContext7で確認したか？
- [ ] Benchmark Protocol - ベンチマーク実装は公式ハーネス使用か？

**全てYES → 実装開始OK**

---

## 📚 関連ドキュメント

### Context Modules
- [[agents|Agents Context]]
- [[architecture|Architecture Context]]
- [[development|Development Context]]
- [[miyabi-definition|Miyabi Definition]]

### Protocols
- `.claude/MCP_INTEGRATION_PROTOCOL.md`
- `.claude/BENCHMARK_IMPLEMENTATION_CHECKLIST.md`

### Guides
- [[QUICK_START_3STEPS|Quick Start Guide]]
- [[YOUR_CURRENT_SETUP|Setup Guide]]

---

**Version**: 2.0.1
**Priority**: P0 (Critical)
**Last Updated**: 2025-11-17
**Maintained By**: Miyabi Team

⭐ **これらのルールは全タスクで絶対遵守** ⭐

---

## 📚 Related Documents

- [[agents]]
- [[architecture]]
- [[development]]
- [[miyabi-definition]]
- [[QUICK_START_3STEPS]]
- [[YOUR_CURRENT_SETUP]]
