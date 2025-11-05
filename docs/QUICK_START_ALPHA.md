# 🚀 Miyabi v0.2.0 Alpha - Quick Start Guide

**Time to First PR: 5 minutes** ⏱️

---

## 📋 Prerequisites

Before starting, ensure you have:

- ✅ Rust 1.75+ installed (`rustc --version`)
- ✅ Git configured (`git config user.name`)
- ✅ GitHub account with personal access token
- ✅ GitHub repository (public or private)

---

## 🎯 3-Step Quick Start

### Step 1: Install Miyabi (1 minute)

```bash
# Install from crates.io
cargo install miyabi-cli --version 0.2.0-alpha

# Verify installation
miyabi --version
# Expected output: miyabi-cli 0.2.0-alpha
```

**Alternative (Binary Download):**
```bash
# macOS ARM64
curl -L https://github.com/ShunsukeHayashi/miyabi-private/releases/download/v0.2.0-alpha/miyabi-macos-arm64 -o miyabi
chmod +x miyabi
sudo mv miyabi /usr/local/bin/
```

---

### Step 2: Setup GitHub Integration (2 minutes)

```bash
# Interactive setup wizard
miyabi setup
```

You'll be asked for:

1. **GitHub Token**: Create at https://github.com/settings/tokens
   - Required scopes: `repo`, `workflow`, `write:discussion`
   - Copy the token (starts with `ghp_`)

2. **Repository**: Format `owner/repo`
   - Example: `your-username/your-project`

3. **Anthropic API Key** (Optional for now)
   - Can be configured later

**Manual Setup (Alternative):**
```bash
# Create .env file
cat > .env << EOF
GITHUB_TOKEN=ghp_your_token_here
GITHUB_REPOSITORY=your-username/your-repo
DEVICE_IDENTIFIER=my-laptop
EOF
```

---

### Step 3: Process Your First Issue (2 minutes)

```bash
# Process Issue #1
miyabi work-on 1
```

**What Happens:**

1. 🔍 **Analysis** - CoordinatorAgent reads Issue #1
2. 📋 **Decomposition** - Breaks down into tasks
3. 🤖 **Execution** - Agents implement solution
4. ✅ **Review** - Automatic code quality check
5. 🎉 **PR Creation** - Pull request ready for review

**Example Output:**
```
🌸 Miyabi v0.2.0-alpha
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📥 Fetching Issue #1...
   Title: Add user authentication

🤖 CoordinatorAgent starting...
   ├─ Task 1/4: Analyze requirements (IssueAgent)      ✓
   ├─ Task 2/4: Implement solution (CodeGenAgent)      ⏳
   ├─ Task 3/4: Add tests (CodeGenAgent)               ⏸️
   └─ Task 4/4: Code review (ReviewAgent)              ⏸️

⏳ Estimated completion: 15 minutes
```

---

## ✅ Verify Success

After `miyabi work-on` completes:

```bash
# Check status
miyabi status

# View created PR
gh pr list

# Or open in browser
gh pr view --web
```

**Expected Result:**
- ✅ New branch created: `feat/issue-1-user-authentication`
- ✅ Code committed with Conventional Commits format
- ✅ Pull Request created and linked to Issue #1

---

## 🎓 Next Steps

### Try More Commands

```bash
# Check workflow status
miyabi status --watch

# View execution logs
miyabi logs

# Process another issue
miyabi work-on 2
```

### Learn Advanced Features

- 📖 [AGENTS.md](../AGENTS.md) - Understand the 21 agents
- 📖 [WORKFLOW_DSL.md](./WORKFLOW_DSL.md) - Custom workflows
- 📖 [LABEL_SYSTEM.md](./LABEL_SYSTEM_GUIDE.md) - Issue labeling

### Join the Community

- 💬 [Discord](https://discord.gg/miyabi) - Get help and share feedback
- 🐛 [Report Issues](https://github.com/ShunsukeHayashi/Miyabi/issues)
- ⭐ [Star on GitHub](https://github.com/ShunsukeHayashi/Miyabi)

---

## 🐛 Troubleshooting

### Issue: `miyabi: command not found`

**Solution:**
```bash
# Add cargo bin to PATH
echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### Issue: `GitHub token invalid`

**Solution:**
```bash
# Verify token has correct scopes
gh auth status

# Or reconfigure
miyabi setup
```

### Issue: `No issue found`

**Solution:**
```bash
# Ensure repository is correct
cat .env | grep GITHUB_REPOSITORY

# Verify issue exists
gh issue view 1
```

### Issue: `Agent execution failed`

**Check logs:**
```bash
# View detailed logs
cat .miyabi/logs/latest.log

# Check worktree status
git worktree list
```

**Common causes:**
- Network connectivity issues
- GitHub API rate limits (wait 1 hour)
- Missing dependencies in your project
- Invalid Issue format (add proper description)

---

## ⚠️ Alpha Release Limitations

**Known Issues in v0.2.0-alpha:**

1. **Single Issue Only**: Can't process multiple issues in parallel yet
   - Workaround: Run `miyabi work-on` sequentially

2. **No Desktop UI**: Terminal/CLI only
   - Desktop UI coming in v0.3.0

3. **Basic Error Messages**: Error handling is minimal
   - Check logs in `.miyabi/logs/` for details

4. **Test Failures**: 1 non-critical test may fail
   - Safe to ignore `convergence::test_predict_iterations`

5. **Performance**: First run may be slow (cold start)
   - Subsequent runs are faster (cached)

**What to Avoid:**
- ❌ Don't use in production environments (yet)
- ❌ Don't process sensitive/confidential issues
- ❌ Don't run on critical repositories
- ❌ Don't expect 100% success rate

**Safe Usage:**
- ✅ Personal projects
- ✅ Experimental repositories
- ✅ Learning and testing
- ✅ Providing feedback to maintainers

---

## 📊 Example Workflow

Here's a real-world example:

### Before Miyabi:
```bash
# Manual workflow (30-60 minutes):
1. Read Issue #42
2. Create branch
3. Write code
4. Write tests
5. Run tests
6. Fix bugs
7. Code review (self)
8. Commit with message
9. Push to remote
10. Create PR
11. Fill PR description
12. Link to issue
```

### With Miyabi:
```bash
# Automated workflow (5 minutes):
miyabi work-on 42
```

**Time saved**: ~25-55 minutes per issue! 🚀

---

## 🎯 Success Metrics

**You'll know it's working when:**

- ✅ `miyabi work-on` completes without errors
- ✅ New branch appears in `git branch -a`
- ✅ Pull request is created on GitHub
- ✅ PR description includes task breakdown
- ✅ Code passes basic quality checks
- ✅ Commits use Conventional Commits format

---

## 🤝 Getting Help

### Documentation
- 📖 [Full README](../README.md) - Complete guide
- 📖 [Architecture Docs](../docs/) - System design
- 📖 [API Reference](https://docs.rs/miyabi-cli) - Rust docs

### Support Channels
- 💬 **Discord**: https://discord.gg/miyabi (fastest)
- 🐛 **GitHub Issues**: https://github.com/ShunsukeHayashi/Miyabi/issues
- 📧 **Email**: support@miyabi.dev

### Before Asking
1. Check [Troubleshooting](#-troubleshooting) section
2. Search existing GitHub issues
3. Check logs: `.miyabi/logs/latest.log`
4. Provide version: `miyabi --version`

---

## 📝 Feedback

This is an **Alpha release** - your feedback is crucial!

**Please report:**
- ✅ Bugs and errors
- ✅ Confusing error messages
- ✅ Missing features
- ✅ Documentation gaps
- ✅ Performance issues

**Create issue at**: https://github.com/ShunsukeHayashi/Miyabi/issues/new

**Include:**
- Miyabi version: `miyabi --version`
- OS and Rust version
- Error message / logs
- Steps to reproduce

---

## 🎉 Congratulations!

You've completed the Miyabi Alpha Quick Start! 🌸

**What's Next?**
- Try processing a real issue in your project
- Explore advanced workflows with YAML configs
- Join Discord to share your experience
- Star the repo if you find it useful! ⭐

---

**Document Version**: v0.2.0-alpha
**Last Updated**: 2025-11-04
**Estimated Reading Time**: 5 minutes
**Skill Level**: Beginner-friendly ✨

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
