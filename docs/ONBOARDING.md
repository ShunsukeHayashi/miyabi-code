# Miyabi Quick Start Guide

**Welcome to Miyabi** - 一つのコマンドで全てが完結する自律型開発フレームワーク

This guide will get you up and running with Miyabi in less than 3 minutes.

## Prerequisites

Before you begin, ensure you have:

- ✅ **Rust 1.75+** - Install from [rustup.rs](https://rustup.rs/)
- ✅ **Git 2.30+** - Check with `git --version`
- ✅ **GitHub Account** - Required for repository operations

## Installation

### Step 1: Install Miyabi CLI

```bash
cargo install miyabi-cli
```

This will install the `miyabi` binary to `~/.cargo/bin`.

### Step 2: Verify PATH

Miyabi will automatically check if `~/.cargo/bin` is in your PATH on first run. If you see a warning, add this to your shell configuration:

**For zsh (~/.zshrc):**
```bash
export PATH="$HOME/.cargo/bin:$PATH"
```

**For bash (~/.bashrc):**
```bash
export PATH="$HOME/.cargo/bin:$PATH"
```

**For fish (~/.config/fish/config.fish):**
```fish
set -gx PATH $HOME/.cargo/bin $PATH
```

Then restart your terminal or run:
```bash
source ~/.zshrc  # or ~/.bashrc
```

### Step 3: Setup GitHub Authentication

Miyabi needs GitHub access to create issues, PRs, and manage projects. Choose one of the following methods:

#### Option 1: GitHub CLI (Recommended)

```bash
gh auth login
```

Follow the interactive prompts to authenticate. Miyabi will automatically discover your token via `gh auth token`.

#### Option 2: Environment Variable

Generate a Personal Access Token (classic) at https://github.com/settings/tokens with `repo` scope, then:

```bash
export GITHUB_TOKEN=ghp_your_token_here

# For persistence, add to ~/.zshrc or ~/.bashrc
echo 'export GITHUB_TOKEN=ghp_your_token_here' >> ~/.zshrc
```

## Usage

### Navigate to Your Git Repository

**Important**: Miyabi must be run from within a Git repository (or any subdirectory).

```bash
cd /path/to/your/git/repo
```

Miyabi will automatically discover the repository root, even if you're in a subdirectory like `src/` or `docs/`.

### Initialize Miyabi in Your Project

For new projects:
```bash
miyabi init my-project
```

For existing projects:
```bash
cd my-existing-project
miyabi install
```

### Run Your First Agent

```bash
# Check project status
miyabi status

# Run CoordinatorAgent on an issue
miyabi agent coordinator --issue 123

# Run CodeGenAgent to implement a feature
miyabi agent codegen --issue 456
```

## Common Issues & Solutions

### Issue 1: `command not found: miyabi`

**Cause**: `~/.cargo/bin` is not in your PATH.

**Solution**:
1. Check if the binary exists: `ls ~/.cargo/bin/miyabi`
2. Add to PATH (see Step 2 above)
3. Restart your terminal

---

### Issue 2: Multiple miyabi versions detected

**Cause**: You have both Node.js version (v0.x) and Rust version (v1.x) installed.

**Solution**: Uninstall the old Node.js version:
```bash
npm uninstall -g miyabi
```

Then verify you're using the Rust version:
```bash
miyabi --version  # Should show 1.x.x
which miyabi      # Should show ~/.cargo/bin/miyabi
```

---

### Issue 3: `GitHub token not found`

**Cause**: No authentication method is configured.

**Solution**: Follow Step 3 above to set up GitHub authentication. Miyabi tries these sources in order:
1. `GITHUB_TOKEN` environment variable
2. `gh auth token` (GitHub CLI)
3. `~/.config/gh/hosts.yml`

---

### Issue 4: `Failed to create WorktreeManager`

**Cause**: You're not in a Git repository.

**Solution**: Navigate to a Git repository:
```bash
# Check if you're in a git repo
git status

# If not, initialize one
git init

# Or navigate to an existing repo
cd /path/to/your/repo
```

Miyabi automatically discovers the repository root, so you can run it from any subdirectory.

---

### Issue 5: `IO error: not a terminal` during setup

**Cause**: Running `miyabi setup` in a non-interactive environment (CI/CD, automated scripts).

**Solution**: Use the `--yes` flag to skip interactive prompts:
```bash
miyabi setup --yes
```

## Next Steps

Once you're up and running, explore these features:

1. **Agent System** - Explore the 21 built-in agents (7 Coding + 14 Business)
   ```bash
   miyabi agent coordinator --issue <number>
   miyabi agent codegen --issue <number>
   miyabi agent review --issue <number>
   ```

2. **Label System** - Learn about the 53-label taxonomy
   - See `docs/LABEL_SYSTEM_GUIDE.md`

3. **Worktree Parallel Execution** - Run multiple agents in parallel
   - See `docs/WORKTREE_PROTOCOL.md`

4. **GitHub OS Integration** - Leverage GitHub as your operating system
   - See `docs/GITHUB_OS_INTEGRATION.md`

## Getting Help

- **Documentation**: https://github.com/ShunsukeHayashi/Miyabi
- **Quick Start**: `.claude/QUICK_START.md`
- **Troubleshooting**: `.claude/TROUBLESHOOTING.md`
- **Report Issues**: https://github.com/ShunsukeHayashi/Miyabi/issues

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│ Miyabi CLI (Rust Edition)                   │
│ - Git root auto-discovery                   │
│ - GitHub token auto-detection               │
│ - PATH validation                           │
│ - Version conflict detection                │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ Agent System (21 Agents)                    │
│ - 🔧 Coding (7): Coordinator, CodeGen, etc. │
│ - 💼 Business (14): Marketing, Sales, etc.  │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ GitHub OS Integration                       │
│ - Issues: Task management                   │
│ - Projects V2: Data persistence             │
│ - Labels: State management (53 labels)      │
│ - Worktrees: Parallel execution             │
└─────────────────────────────────────────────┘
```

## Performance

Compared to the TypeScript version, the Rust edition offers:

- ⚡ **50%+ faster execution** - Compiled native code
- 💾 **30%+ less memory** - Zero-cost abstractions
- 📦 **Single binary** - No Node.js required
- 🔒 **Compile-time safety** - Fewer runtime errors

## Contributing

We welcome contributions! See `CONTRIBUTING.md` for guidelines.

## License

Apache-2.0 - See `LICENSE` for details.

---

**You're all set!** 🎉 Start building with Miyabi and enjoy autonomous development operations.

For more detailed information, see the full documentation at https://github.com/ShunsukeHayashi/Miyabi.
