# Feedback: `.claude` Directory Setup Missing in `miyabi init` and `miyabi setup`

**Date**: 2025-11-02
**Reporter**: Claude Code AI (via user feedback)
**Severity**: High
**Component**: CLI - `init` and `setup` commands
**Affects**: New project initialization

---

## 📋 Issue Summary

`miyabi init` コマンドと `miyabi setup` コマンドが `.claude` ディレクトリ構造と `CLAUDE.md` ファイルを作成しない問題があります。

これにより、**Claude Code がプロジェクトのエージェントとして正しく動作しない**状態になります。

---

## 🐛 Problem Description

### Current Behavior

1. **`miyabi init <project-name>`** を実行
2. プロジェクトディレクトリが作成される
3. `.miyabi.yml`, `.gitignore`, `README.md` などは作成される
4. **しかし `.claude/` ディレクトリは作成されない**
5. **`CLAUDE.md` も作成されない**

### Impact

- Claude Code が `.claude/` ディレクトリを参照できない
- Agent 仕様 (`agents/specs/`) が存在しない
- コンテキストモジュール (`context/`) が存在しない
- スラッシュコマンド (`commands/`) が使えない
- **結果: Claude Code がプロジェクト固有の Agent として機能しない**

---

## ✅ Expected Behavior

`miyabi init` および `miyabi setup` コマンドは、以下のディレクトリ構造を作成すべき：

```
project-name/
├── .claude/
│   ├── README.md                    # .claude ディレクトリの説明
│   ├── agents/
│   │   ├── README.md               # Agent システム概要
│   │   ├── specs/
│   │   │   ├── coding/
│   │   │   │   └── README.md
│   │   │   └── business/
│   │   │       └── README.md
│   │   └── prompts/
│   │       ├── coding/
│   │       │   └── example-prompt.md
│   │       └── business/
│   ├── commands/                    # カスタムスラッシュコマンド
│   ├── context/
│   │   ├── INDEX.md                # コンテキストインデックス
│   │   └── core-rules.md           # コアルール (Critical)
│   ├── skills/                      # スキル定義
│   └── templates/                   # テンプレート
├── CLAUDE.md                        # ⭐ プロジェクトコンテキスト (最重要)
├── .miyabi.yml
├── README.md
└── ...
```

---

## 📝 Detailed Analysis

### Code Location

**File**: `/Users/shunsuke/Dev/miyabi-private/crates/miyabi-cli/src/commands/init.rs`
**Function**: `InitCommand::create_project_structure()`

**Current Implementation** (Lines 240-269):
```rust
fn create_project_structure(&self, project_dir: &Path) -> Result<()> {
    // Create standard directories
    let dirs = vec![
        ".github/workflows",
        ".claude/agents/specs/coding",
        ".claude/agents/specs/business",
        ".claude/agents/prompts/coding",
        ".claude/agents/prompts/business",
        ".claude/commands",
        ".claude/prompts",
        ".claude/templates",
        "docs",
        "scripts",
        "logs",
        "reports",
    ];

    for dir in dirs {
        let dir_path = project_dir.join(dir);
        fs::create_dir_all(&dir_path)?;
    }

    // Create CLAUDE.md (project context file)
    self.create_claude_md(project_dir)?;

    // Create essential .claude files
    self.create_claude_files(project_dir)?;

    println!("  Created project structure");
    Ok(())
}
```

### Issues Found

#### 1. ✅ Directory Structure は OK
`.claude/` ディレクトリ構造は `create_project_structure()` で正しく作成されている。

#### 2. ✅ `CLAUDE.md` も OK
`create_claude_md()` で `CLAUDE.md` が作成されている。

#### 3. ✅ `.claude/README.md` も OK
`create_claude_files()` で `.claude/README.md` などが作成されている。

---

## 🔍 Root Cause Analysis

### Hypothesis 1: `miyabi init` は正しく実装されている

実際に `init.rs` のコードを確認したところ、`.claude/` ディレクトリと `CLAUDE.md` の作成は**実装されています**。

### Hypothesis 2: ユーザーが `miyabi setup` を使った可能性

**File**: `/Users/shunsuke/Dev/miyabi-private/crates/miyabi-cli/src/commands/setup.rs`

`setup.rs` の `SetupCommand::execute()` を確認したところ、`.claude/` ディレクトリの作成は **`initialize_agents()`** (Line 55) で行われています。

**問題**: `initialize_agents()` の実装 (Lines 335-361) を見ると：

```rust
async fn initialize_agents(&self) -> Result<()> {
    use std::fs;
    use std::path::Path;

    if !self.skip_prompts {
        let should_init = Confirm::new()
            .with_prompt("Initialize default agent configurations?")
            .default(true)
            .interact()
            .map_err(|e| CliError::GitConfig(format!("Failed to prompt: {}", e)))?;

        if !should_init {
            println!("  ⏭️  Skipping agent initialization");
            println!("  💡 You can configure agents later in .claude/agents/");
            return Ok(());
        }
    }

    // Create agent config directory
    let agent_dir = Path::new(".claude/agents/specs");
    fs::create_dir_all(agent_dir).map_err(|e| CliError::Io(e))?;

    println!("  ✓ Created agent configuration directory");
    println!("  💡 Agent configurations can be customized in .claude/agents/specs/");

    Ok(())
}
```

**問題発見**:
- `.claude/agents/specs` ディレクトリは作成される
- **しかし `.claude/README.md` や `.claude/context/INDEX.md` などのファイルは作成されない**
- **`CLAUDE.md` も作成されない**

---

## ✅ Solution

### For `miyabi init` Command

**Status**: ✅ Already implemented correctly

`init.rs` の実装は正しく、以下を作成します：
- `.claude/` ディレクトリ構造
- `CLAUDE.md`
- `.claude/README.md`
- `.claude/agents/README.md`
- その他の必須ファイル

**No action needed for `miyabi init`**.

### For `miyabi setup` Command ⚠️

**Status**: ❌ Incomplete implementation

`setup.rs` の `initialize_agents()` を拡張して、以下を作成する必要があります：

1. **`CLAUDE.md`** (プロジェクトルート)
2. **`.claude/README.md`**
3. **`.claude/context/INDEX.md`**
4. **`.claude/context/core-rules.md`**
5. **`.claude/agents/README.md`**

### Proposed Implementation

#### Option 1: `setup.rs` に `create_claude_files()` を追加

`init.rs` の `create_claude_md()` と `create_claude_files()` を `setup.rs` にも実装する。

**Pros**:
- `init` と `setup` で同じ結果が得られる

**Cons**:
- コードの重複

#### Option 2: 共通関数を `lib.rs` に抽出

`create_claude_md()` と `create_claude_files()` を共通ライブラリに抽出し、`init` と `setup` 両方から呼び出す。

**Pros**:
- DRY (Don't Repeat Yourself)
- メンテナンスが容易

**Cons**:
- リファクタリングが必要

---

## 🎯 Recommendation

### Immediate Fix (Short-term)

**For `setup.rs`**:

1. `Step 5: Initializing Agent configurations` を拡張
2. 以下のファイルを作成：
   - `CLAUDE.md` (ルート)
   - `.claude/README.md`
   - `.claude/context/INDEX.md`
   - `.claude/context/core-rules.md`
   - `.claude/agents/README.md`

**Code Change** (in `setup.rs`):

```rust
async fn initialize_agents(&self) -> Result<()> {
    // ... existing code ...

    // Create agent config directory
    let agent_dir = Path::new(".claude/agents/specs");
    fs::create_dir_all(agent_dir).map_err(|e| CliError::Io(e))?;

    // NEW: Create context directory
    let context_dir = Path::new(".claude/context");
    fs::create_dir_all(context_dir).map_err(|e| CliError::Io(e))?;

    // NEW: Create CLAUDE.md
    self.create_claude_md()?;

    // NEW: Create .claude/README.md
    self.create_claude_readme()?;

    // NEW: Create .claude/context/INDEX.md
    self.create_context_index()?;

    // NEW: Create .claude/context/core-rules.md
    self.create_core_rules()?;

    // NEW: Create .claude/agents/README.md
    self.create_agents_readme()?;

    println!("  ✓ Created agent configuration directory");
    println!("  ✓ Created CLAUDE.md");
    println!("  ✓ Created .claude context files");
    println!("  💡 Agent configurations can be customized in .claude/agents/specs/");

    Ok(())
}
```

### Long-term Fix (Refactoring)

1. `crates/miyabi-cli/src/project_setup.rs` を作成
2. 共通の `ProjectSetupHelper` 構造体を実装
3. `init` と `setup` から共通ロジックを呼び出す

---

## 📊 Testing Plan

### Test Case 1: `miyabi init`
```bash
# 1. 新しいプロジェクトを作成
miyabi init test-project-init

# 2. ディレクトリ構造を確認
cd test-project-init
tree -L 3 .claude

# 3. 必須ファイルの存在確認
test -f CLAUDE.md && echo "✅ CLAUDE.md exists"
test -f .claude/README.md && echo "✅ .claude/README.md exists"
test -f .claude/context/INDEX.md && echo "✅ .claude/context/INDEX.md exists"
test -f .claude/context/core-rules.md && echo "✅ .claude/context/core-rules.md exists"
test -f .claude/agents/README.md && echo "✅ .claude/agents/README.md exists"
```

### Test Case 2: `miyabi setup` (既存プロジェクト)
```bash
# 1. 既存のプロジェクトディレクトリ
cd /path/to/existing-project

# 2. miyabi setup を実行
miyabi setup

# 3. .claude ディレクトリが作成されたか確認
test -d .claude && echo "✅ .claude directory exists"

# 4. 必須ファイルの存在確認
test -f CLAUDE.md && echo "✅ CLAUDE.md exists"
test -f .claude/README.md && echo "✅ .claude/README.md exists"
test -f .claude/context/INDEX.md && echo "✅ .claude/context/INDEX.md exists"
```

---

## 🔗 Related Issues

- None (New issue)

---

## 📚 References

### Code Files
- `crates/miyabi-cli/src/commands/init.rs` (Lines 1-1648)
- `crates/miyabi-cli/src/commands/setup.rs` (Lines 1-392)

### Documentation
- `CLAUDE.md` - Project context file specification
- `.claude/README.md` - .claude directory documentation
- `.claude/context/INDEX.md` - Context modules index

---

## 🎉 Workaround (User Applied)

ユーザーは以下の方法でカムイプロジェクトに `.claude/` ディレクトリを手動で作成しました：

```bash
# 1. ディレクトリ構造を作成
mkdir -p /Users/shunsuke/Dev/kamui/.claude/agents/specs/coding
mkdir -p /Users/shunsuke/Dev/kamui/.claude/agents/specs/business
mkdir -p /Users/shunsuke/Dev/kamui/.claude/agents/prompts/coding
mkdir -p /Users/shunsuke/Dev/kamui/.claude/agents/prompts/business
mkdir -p /Users/shunsuke/Dev/kamui/.claude/commands
mkdir -p /Users/shunsuke/Dev/kamui/.claude/context
mkdir -p /Users/shunsuke/Dev/kamui/.claude/skills
mkdir -p /Users/shunsuke/Dev/kamui/.claude/templates

# 2. Claude Code AI が以下のファイルを作成:
# - CLAUDE.md
# - .claude/README.md
# - .claude/agents/README.md
# - .claude/context/INDEX.md
# - .claude/context/core-rules.md
```

**結果**: カムイプロジェクトは現在正常に動作しています。

---

## 🏷️ Labels

- `type:bug` - 機能の欠落
- `component:cli` - CLI コマンド
- `priority:P1-High` - 新規プロジェクトの使用体験に影響
- `area:onboarding` - 初期セットアップ

---

## 📝 Action Items

- [ ] `setup.rs` の `initialize_agents()` を拡張して必須ファイルを作成
- [ ] テストケースを追加 (`tests/e2e_setup.rs`)
- [ ] ドキュメントを更新 (`.claude/` ディレクトリの重要性を強調)
- [ ] リリースノートに修正を記載

---

**Priority**: P1-High
**Effort**: 2-3 hours (implementation + testing)
**Impact**: すべての新規ユーザーに影響

**Reporter**: Claude Code AI (Feedback from Kamui project setup)
**Date**: 2025-11-02
