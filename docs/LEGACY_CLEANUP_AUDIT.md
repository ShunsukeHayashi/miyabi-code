# Legacy TypeScript & Documentation Audit Report

**作成日**: 2025-10-19
**ステータス**: Phase 1 - Audit Complete
**対象**: Issue #207 - Documentation & Legacy Cleanup

---

## 📋 監査結果サマリー

### TypeScript参照箇所

**合計**: 15ファイルでTypeScript/packages参照を検出

| ファイル | TypeScript参照数 | 優先度 |
|---------|-----------------|--------|
| `.claude/README.md` | 6 | 🔥 High |
| `.claude/QUICK_START.md` | 6 | 🔥 High |
| `.claude/agents/README.md` | 7 | 🔥 High |
| `.claude/RUST_MIGRATION_SUMMARY.md` | 10 | ⚠️ Medium |
| `.claude/prompts/worktree-agent-execution.md` | 7 | ⚠️ Medium |
| `.claude/commands/test.md` | 5 | ⚠️ Medium |
| その他9ファイル | 1-5 | 📝 Low |

### 更新が必要な主要ドキュメント

#### 🔥 High Priority（即座に更新推奨）

1. **`.claude/README.md`**
   - TypeScript/npm参照を削除
   - Cargo/Rust版に更新
   - Hooks (auto-format.sh, validate-typescript.sh) を削除または更新

2. **`.claude/QUICK_START.md`**
   - npm install → cargo build
   - npx miyabi → miyabi CLI

3. **`.claude/agents/README.md`**
   - packages/ 参照を crates/ に更新
   - TypeScript Agent → Rust Agent

#### ⚠️ Medium Priority（段階的更新）

4. **`.claude/RUST_MIGRATION_SUMMARY.md`**
   - 移行完了状況を更新
   - Phase 1-9の進捗を反映

5. **`.claude/prompts/worktree-agent-execution.md`**
   - Rust Edition対応
   - Cargo commands更新

6. **`.claude/commands/test.md`**
   - npm test → cargo test
   - typecheck更新

#### 📝 Low Priority（将来更新）

7. その他9ファイル
   - 参照が少ない
   - 段階的に更新

---

## 🏗️ Legacy TypeScript Assets

### 現状

```
packages/
├── coding-agents/          # TypeScript版Agent実装
│   ├── coordinator/        # ❌ 非推奨（Rust版に移行済み）
│   ├── codegen/           # ❌ 非推奨
│   ├── review/            # ❌ 非推奨
│   └── worktree/          # ❌ 非推奨（Rust版に移行済み）
├── miyabi-agent-sdk/      # ❌ 非推奨（Rust版に移行済み）
└── miyabi-cli/            # ❌ 非推奨（Rust版に移行済み）
```

### 推奨アクション

#### Option A: アーカイブ（推奨）

```bash
mkdir -p archive/typescript-legacy
mv packages/ archive/typescript-legacy/
git add archive/
git commit -m "chore: Archive legacy TypeScript packages"
```

#### Option B: 削除

```bash
rm -rf packages/
git commit -m "chore: Remove legacy TypeScript packages"
```

#### Option C: Deprecation Notice（段階的移行）

`packages/README.md` に以下を追加:

```markdown
# ⚠️ DEPRECATED - TypeScript Edition

This directory contains the legacy TypeScript implementation of Miyabi.

**Status**: Deprecated as of 2025-10-19

**Migration**: Please use the Rust Edition in `crates/` instead.

See [Rust Migration Guide](../docs/RUST_MIGRATION_GUIDE.md) for details.
```

---

## 📚 Updated Documentation Checklist

### Issue #203: Unify Agent Pipeline

- [x] `crates/miyabi-agents/src/orchestration.rs` 実装済み
- [x] `docs/ENTITY_RELATION_MODEL.md` に反映済み
- [ ] `.claude/agents/specs/coding/` 更新必要
- [ ] `.claude/agents/README.md` 更新必要

### Issue #204: Modularize Worktree Infrastructure

- [x] `crates/miyabi-worktree/` 実装済み
- [x] `crates/miyabi-worktree/README.md` 更新済み
- [ ] `.claude/prompts/worktree-agent-execution.md` 更新必要
- [ ] `docs/WORKTREE_PROTOCOL.md` 確認必要

### Issue #206: Consolidate Cross-Cutting Concerns

- [x] `docs/CORE_UTILITIES_GUIDE.md` 作成済み
- [ ] `.claude/agents/specs/coding/` に反映必要
- [ ] Agent実装例の更新必要

---

## 🎯 実行計画

### Phase 1: High Priority更新（推定: 1時間）

#### タスク1: .claude/README.md 更新
- [ ] TypeScript/npm参照削除
- [ ] Cargo/Rust版に更新
- [ ] Hooks削除または更新

#### タスク2: .claude/QUICK_START.md 更新
- [ ] npm → cargo
- [ ] npx miyabi → miyabi CLI

#### タスク3: .claude/agents/README.md 更新
- [ ] packages/ → crates/
- [ ] TypeScript → Rust

### Phase 2: Medium Priority更新（推定: 1-2時間）

#### タスク4-6: 残りのドキュメント更新
- [ ] RUST_MIGRATION_SUMMARY.md
- [ ] worktree-agent-execution.md
- [ ] test.md

### Phase 3: Legacy Cleanup（推定: 30分）

#### タスク7: packages/ アーカイブ
- [ ] archive/typescript-legacy/ 作成
- [ ] packages/ 移動
- [ ] Git commit

---

## 📝 Migration Guide Template

### For Contributors

```markdown
# Miyabi Rust Edition - Migration Guide

## Quick Reference

| Old (TypeScript) | New (Rust) |
|------------------|------------|
| `npm install` | `cargo build` |
| `npm test` | `cargo test` |
| `npx miyabi` | `miyabi` or `cargo run --bin miyabi` |
| `packages/` | `crates/` |
| `*.ts` | `*.rs` |

## Architecture Changes

- **Agent Pipeline**: `crates/miyabi-agents/src/orchestration.rs`
- **Worktree Management**: `crates/miyabi-worktree/`
- **Core Utilities**: `crates/miyabi-core/`
- **CLI**: `crates/miyabi-cli/`

## Documentation

- [Core Utilities Guide](./CORE_UTILITIES_GUIDE.md)
- [Worktree Protocol](./WORKTREE_PROTOCOL.md)
- [Entity Relation Model](./ENTITY_RELATION_MODEL.md)
```

---

## 🚀 次のステップ

### 即座に実行可能

1. `.claude/README.md` 更新開始
2. Legacy cleanup方針決定（Archive vs Delete）
3. Migration Guide作成

### 段階的実施

1. High Priority（3ファイル）→ Medium Priority（3ファイル）→ Low Priority（9ファイル）
2. packages/ アーカイブ
3. 全ドキュメントのリンクチェック

---

**作成者**: Claude Code (miyabi)
**最終更新**: 2025-10-19
**関連Issue**: #207 (Documentation & Legacy Cleanup)
