---
name: Feature - GitHub Repository Creation
about: Add repository creation to `miyabi init` command
title: 'feat: Add GitHub repository creation to `miyabi init` command'
labels: 'type:feature, priority:P2-Medium, agent:codegen'
assignees: ''
---

## 📋 Feature Request

Add GitHub repository creation functionality to the `miyabi init` command.

## 🎯 Background

Currently, `miyabi init` creates a local Git repository but does not create a corresponding GitHub repository. Users must manually:
1. Create a GitHub repository via web UI or `gh repo create`
2. Add the remote origin
3. Push the initial commit

This breaks the "one command for everything" philosophy of Miyabi.

## 💡 Proposed Solution

Extend `miyabi init` to optionally create a GitHub repository and push the initial commit.

### Command Syntax

```bash
# Create local project only (current behavior)
miyabi init my-project

# Create local + GitHub repository (new)
miyabi init my-project --github

# Create private GitHub repository
miyabi init my-project --github --private

# Shorthand
miyabi init my-project -g -p
```

### Implementation Plan

#### Phase 1: Add GitHub API support to miyabi-github crate

**File**: `crates/miyabi-github/src/repos.rs` (new)

```rust
use octocrab::Octocrab;
use miyabi_types::MiyabiError;

pub struct RepoManager {
    octocrab: Octocrab,
}

impl RepoManager {
    pub async fn create_repository(
        &self,
        name: String,
        private: bool,
        description: Option<String>,
    ) -> Result<String, MiyabiError> {
        // Call GitHub API: POST /user/repos
        // Return repository URL
    }
}
```

**Octocrab API Reference**:
```rust
octocrab.repos(owner, repo)
    .create()
    .name(name)
    .private(is_private)
    .description(description)
    .send()
    .await?
```

#### Phase 2: Extend miyabi-cli InitCommand

**File**: `crates/miyabi-cli/src/commands/init.rs`

Add new steps:
1. Check if `--github` flag is set
2. If yes, validate GitHub token (use `miyabi_github::auth::discover_token`)
3. Create GitHub repository via `RepoManager::create_repository`
4. Add remote origin automatically
5. Push initial commit

**Updated Command Flow**:
```
1. Validate project name
2. Create project directory
3. Initialize git repository
4. Create project structure
5. Create config files
6. [NEW] If --github:
   a. Discover GitHub token
   b. Create GitHub repository
   c. Add remote origin
   d. Push initial commit
7. Print success message
```

#### Phase 3: Update CLI arguments

**File**: `crates/miyabi-cli/src/main.rs`

```rust
#[derive(Subcommand)]
enum Commands {
    Init {
        name: String,
        #[arg(short, long)]
        private: bool,
        /// Create GitHub repository (requires GITHUB_TOKEN)
        #[arg(short = 'g', long)]
        github: bool,
    },
    // ...
}
```

## 🎯 Acceptance Criteria

- [ ] `miyabi init my-project --github` creates a GitHub repository
- [ ] `miyabi init my-project --github --private` creates a private repository
- [ ] Command validates GitHub token before repository creation
- [ ] Initial commit is automatically pushed to GitHub
- [ ] Error handling for GitHub API failures (network, auth, duplicate repo)
- [ ] Works with both `GITHUB_TOKEN` env var and `gh` CLI token
- [ ] Documentation updated (README.md, --help output)
- [ ] Integration tests added

## 🔧 Technical Details

### Dependencies

**Add to `Cargo.toml`** (workspace):
```toml
[workspace.dependencies]
octocrab = "0.47"  # Already included
```

### GitHub API Endpoint

```
POST /user/repos
{
  "name": "my-project",
  "private": true,
  "description": "Miyabi autonomous development project",
  "auto_init": false  # We already have local commits
}
```

### Error Cases

1. **No GitHub token**: Print helpful error message
   ```
   Error: GitHub token not found

   To create a GitHub repository, set GITHUB_TOKEN:
     export GITHUB_TOKEN=ghp_xxx

   Or log in with GitHub CLI:
     gh auth login
   ```

2. **Repository already exists**: Print error and suggest alternative name

3. **Network error**: Retry with exponential backoff

## 📚 Related Files

- `crates/miyabi-github/src/` - GitHub API integration
- `crates/miyabi-cli/src/commands/init.rs` - Init command implementation
- `crates/miyabi-types/src/` - Type definitions
- `docs/CLI_USAGE.md` - CLI documentation

## 🚀 Benefits

1. **One-command initialization**: True "one command for everything"
2. **Reduced friction**: No manual GitHub setup
3. **Consistency**: Ensures proper remote configuration
4. **Beginner-friendly**: Lower barrier to entry

## 🏷️ Labels

- `type:feature` - New feature
- `priority:P2-Medium` - Not urgent, but valuable
- `agent:codegen` - Can be implemented by CodeGenAgent
- `phase:planning` - Needs design review

## 📝 Notes

- The `--private` flag (line 11 in init.rs) is already reserved for this purpose
- GitHub API rate limit: 5000 requests/hour for authenticated users
- Consider adding `--org` flag for organization repositories in the future

---

**Created by**: Claude Code
**Date**: 2025-10-18
**Original Context**: ai-partner-app repository creation request
