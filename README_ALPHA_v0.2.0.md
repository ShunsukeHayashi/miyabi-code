# README Update for Miyabi v0.2.0 Alpha

## Changes Summary

### Version Update
- Current: v0.1.1 → Alpha: v0.2.0-alpha
- Release Date: November 12, 2025
- Focus: Core workflow automation

---

## Updated Sections

### 1. Version Badge Update (Line 28-37)

**BEFORE:**
```markdown
## 🦀 **NEW: Rust Edition v0.1.1 Released!**

**"Insanely Great" Onboarding Edition - Steve Jobs Approved ⭐**
```

**AFTER:**
```markdown
## 🦀 **NEW: Rust Edition v0.2.0 Alpha Released!**

**"Workflow Automation Edition" - Issue → Code → PR Automation ⭐**

[![GitHub Release](https://img.shields.io/github/v/release/ShunsukeHayashi/miyabi-private?include_prereleases&style=for-the-badge&logo=github&label=Rust%20Edition)](https://github.com/ShunsukeHayashi/miyabi-private/releases/tag/v0.2.0-alpha)
[![Rust](https://img.shields.io/badge/Rust-1.75+-orange?style=for-the-badge&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![crates.io](https://img.shields.io/badge/crates.io-v0.2.0--alpha-blue?style=for-the-badge&logo=rust)](https://crates.io/crates/miyabi-cli)

**🎯 Core Feature: `miyabi work-on <issue>` • 🤖 CoordinatorAgent Integration • 🔄 Workflow DSL • ✅ State Persistence**
```

### 2. Installation Section (Line 39-47)

**ADD ALPHA WARNING:**
```markdown
> ⚠️ **Alpha Release Notice**
>
> This is an alpha release (v0.2.0-alpha). Core features are functional but some advanced features are still in development.
>
> **What Works:**
> - ✅ Single issue processing with `miyabi work-on <issue-number>`
> - ✅ Auto PR creation via CoordinatorAgent
> - ✅ Workflow state persistence
> - ✅ Basic CLI interface
>
> **Coming in v0.3.0:**
> - ⏳ Parallel execution (`miyabi parallel`)
> - ⏳ Desktop UI
> - ⏳ Advanced workflow features
> - ⏳ Comprehensive test coverage

```bash
# Install from crates.io (Alpha release)
cargo install miyabi-cli --version 0.2.0-alpha

# Or download the binary (macOS ARM64)
curl -L https://github.com/ShunsukeHayashi/miyabi-private/releases/download/v0.2.0-alpha/miyabi-macos-arm64 -o miyabi
chmod +x miyabi
sudo mv miyabi /usr/local/bin/
```

### 3. Quick Start Section (Line 93-121)

**UPDATE COMMANDS:**
```markdown
## ✨ クイックスタート

### 🦀 Rust Edition v0.2.0 Alpha

```bash
# 1. インストール
cargo install miyabi-cli --version 0.2.0-alpha

# 2. セットアップ
miyabi setup  # Interactive configuration wizard

# 3. 使用開始 - これだけで完結！
miyabi work-on <issue-number>
```

**たった3ステップでIssueからPRまで自動化！**

### 📝 使用例

```bash
# Issue #123を処理
miyabi work-on 123

# What happens:
# 1. CoordinatorAgent が Issue を解析
# 2. 適切な Agent を起動してコードを生成
# 3. テスト実行 & レビュー
# 4. Pull Request 自動作成
```

### v0.2.0 Alpha の新機能 ✨:
- 🎯 **Core Feature**: `miyabi work-on` - ワンコマンドでIssue処理完結
- 🤖 **CoordinatorAgent統合** - 自動タスク分解 & DAG実行
- 🔄 **Workflow DSL Phase 1** - .then(), .branch(), .parallel() API
- 💾 **State Persistence** - sled による永続化
- 📊 **Progress Tracking** - リアルタイム進捗表示

### Alpha Release の制限事項 ⚠️:
- 単一Issue処理のみ (`miyabi parallel` は v0.3.0)
- Desktop UI未完成 (CLIのみ)
- 一部のテストが失敗 (非Critical)
- ドキュメント整備中
```

### 4. New Section: Alpha Release Roadmap

**ADD AFTER Quick Start:**
```markdown
---

## 🗺️ Alpha Roadmap

### v0.2.0-alpha (Current - Nov 12, 2025)
**Focus: Core Workflow Automation**

✅ **Implemented:**
- CoordinatorAgent Issue decomposition
- WorkflowBuilder DSL (`.then()`, `.branch()`, `.parallel()`)
- State persistence with sled/SQLite
- Conditional branching with Rhai expressions
- CLI command `miyabi work-on`

⏳ **Known Limitations:**
- No parallel issue execution yet
- Desktop UI in development
- Limited error handling
- Basic documentation only

### v0.3.0 (Planned - Jan 2026)
**Focus: Parallel Execution & Desktop UI**

- 🚀 `miyabi parallel --issues 1,2,3` - Multi-issue processing
- 🖥️ Desktop UI Beta - Real-time monitoring
- 🎨 Enhanced error messages
- 📚 Comprehensive documentation
- ✅ 100% test coverage

### v1.0.0 GA (Planned - Apr 2026)
**Focus: Production Ready**

- 💼 Enterprise features (RBAC, audit logs)
- 🔌 Integrations (Slack, Jira, Linear)
- 🌐 Multi-repository support
- 🏆 Production-grade stability
- 📖 Complete API documentation

---
```

### 5. Update Feature Highlights

**ADD SECTION:**
```markdown
## 🎯 Alpha Release Highlights

### What You Can Do Today

#### 1. Automated Issue Processing
```bash
miyabi work-on 42
```
Automatically:
- Analyzes GitHub Issue #42
- Decomposes into tasks (analysis → implementation → testing → review)
- Executes tasks via AI agents
- Creates Pull Request

#### 2. Workflow State Tracking
```bash
# Check workflow status
miyabi status --watch

# View execution history
miyabi logs
```

#### 3. Manual Workflow Control
```bash
# Custom workflow (coming soon)
miyabi workflow run --file my-workflow.yaml
```

### What's Not Ready Yet

- ❌ Parallel execution of multiple issues
- ❌ Desktop UI (terminal only for now)
- ❌ Advanced workflow templates
- ❌ Team collaboration features

We're actively working on these features for v0.3.0!

---
```

### 6. FAQ Section

**ADD NEW SECTION:**
```markdown
## ❓ Alpha Release FAQ

### Q: Is this production-ready?
**A:** No. v0.2.0-alpha is for early testing and feedback. Use in non-critical environments only.

### Q: What's the minimum to get started?
**A:** Three things:
1. Install: `cargo install miyabi-cli --version 0.2.0-alpha`
2. Setup: `miyabi setup` (configure GitHub token)
3. Run: `miyabi work-on <issue-number>`

### Q: What if I encounter bugs?
**A:** Please report issues at: https://github.com/ShunsukeHayashi/Miyabi/issues
- Include: Miyabi version, OS, error message, steps to reproduce

### Q: Can I use this for my team?
**A:** Alpha is best for individual developers. Team features coming in v1.0.0 GA.

### Q: How do I upgrade from v0.1.1?
**A:**
```bash
cargo install miyabi-cli --version 0.2.0-alpha --force
miyabi setup  # Reconfigure if needed
```

### Q: Where's the Desktop UI?
**A:** Desktop UI is in development. Expected in v0.3.0 (Jan 2026). CLI fully functional for now.

---
```

---

## Implementation Checklist

- [ ] Update version badges (L28-37)
- [ ] Add Alpha warning notice (L39-47)
- [ ] Update Quick Start commands (L93-121)
- [ ] Add Alpha Roadmap section
- [ ] Add Feature Highlights section
- [ ] Add FAQ section
- [ ] Update release notes link
- [ ] Update download URLs for v0.2.0-alpha

---

## Notes for Maintainer

- This README is designed for Alpha v0.2.0 (Nov 12, 2025)
- Focus on **core value**: `miyabi work-on <issue>` works end-to-end
- Be transparent about limitations
- Guide users toward successful first experience
- Set expectations for v0.3.0 and v1.0.0

---

**Document Owner**: Alpha Release Team
**Last Updated**: 2025-11-04
**Status**: Draft - Ready for Review
