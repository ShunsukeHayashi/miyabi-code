# Asciinema Recording Plan
# 5-Minute Comprehensive CLI Demo for Documentation

**Purpose**: Provide an interactive, detailed demonstration of Miyabi CLI for documentation
**Target Duration**: 5 minutes (300 seconds)
**Platform**: Asciinema.org (free, embeddable terminal recordings)
**Placement**: Documentation site, README "Advanced" section

---

## Why Asciinema?

### Advantages Over GIF/Video
- **Interactive**: Users can pause, copy/paste commands
- **Lightweight**: < 100KB file size (vs. 2-5MB GIF)
- **Searchable**: Text-based, SEO-friendly
- **Accessible**: Screen reader compatible
- **Embeddable**: Works in Markdown, HTML, docs sites
- **Editable**: Can trim, speed up, or adjust after recording

### Use Cases
1. Documentation tutorials (step-by-step guides)
2. Troubleshooting examples
3. Advanced feature demonstrations
4. CLI reference with real output

---

## Asciinema Specifications

### Technical Details
- **Format**: JSON (text-based terminal recording)
- **File Size**: 50-200KB (for 5-minute recording)
- **Hosting**: asciinema.org (free tier: unlimited public recordings)
- **Embed**: Markdown, HTML (via iframe or SVG)
- **Privacy**: Public (open source project)

### Recording Settings
```bash
# Install Asciinema
brew install asciinema  # macOS
apt install asciinema   # Ubuntu/Debian

# Configure (optional)
asciinema auth  # Link to asciinema.org account

# Recording options
asciinema rec demo.cast \
  --title "Miyabi CLI - Complete Demo" \
  --idle-time-limit 2.0 \
  --cols 120 \
  --rows 30
```

### Player Settings
```html
<!-- Embed in HTML/Markdown -->
<script src="https://asciinema.org/a/xxxxx.js" id="asciicast-xxxxx" async></script>

<!-- Customization options -->
<script src="https://asciinema.org/a/xxxxx.js"
  id="asciicast-xxxxx"
  data-speed="2"        <!-- 2x speed -->
  data-theme="monokai"  <!-- Custom theme -->
  data-cols="120"
  data-rows="30"
  async>
</script>
```

---

## 5-Minute Demo Script

### Act 1: Setup & Installation (0:00-1:00) - 60 seconds

#### Scene 1.1: Installation (0:00-0:30)
```bash
# Clean start
$ clear

# Show current state (Miyabi not installed)
$ miyabi --version
bash: miyabi: command not found

# Install from crates.io
$ cargo install miyabi-cli
    Updating crates.io index
  Downloaded miyabi-cli v0.1.1
  Downloaded 1 crate (328.4 KB) in 2.3s
   Compiling miyabi-core v0.1.1
   Compiling miyabi-types v0.1.1
   Compiling miyabi-agents v0.1.1
   Compiling miyabi-cli v0.1.1
    Finished release [optimized] target(s) in 1m 32s
  Installing /Users/demo/.cargo/bin/miyabi
   Installed package `miyabi-cli v0.1.1` (executable `miyabi`)

# Verify installation
$ miyabi --version
miyabi-cli 0.1.1
```

**Narration** (text overlay or voiceover):
> "Let's start by installing Miyabi from crates.io. This takes about 90 seconds on first install."

---

#### Scene 1.2: Configuration (0:30-1:00)
```bash
# Show help
$ miyabi --help
Miyabi - Autonomous Development Framework

Usage: miyabi [OPTIONS] <COMMAND>

Commands:
  work-on    Work on a GitHub Issue
  agent      Manage AI agents
  worktree   Manage git worktrees
  config     Configure Miyabi settings
  help       Print this message or the help of the given subcommand(s)

Options:
  -v, --verbose  Enable verbose logging
  -q, --quiet    Suppress output
  -h, --help     Print help
  -V, --version  Print version

# Set up GitHub token (optional, demo mode works without)
$ export GITHUB_TOKEN="ghp_xxxxxxxxxxxx"

# Set up Anthropic API key (optional)
$ export ANTHROPIC_API_KEY="sk-ant-xxxxxxxxxxxx"

# Verify configuration
$ miyabi config show
Configuration:
  GitHub Token: Set (hidden)
  Anthropic API Key: Set (hidden)
  Device Identifier: MacBook Pro 16-inch
  Working Directory: /Users/demo/projects/my-app
```

**Narration**:
> "Optional: Set up GitHub and Anthropic API keys for full functionality. Demo mode works without them."

---

### Act 2: Basic Usage (1:00-2:30) - 90 seconds

#### Scene 2.1: Work on Simple Issue (1:00-1:45)
```bash
# Clone demo repository
$ git clone https://github.com/miyabi-demos/simple-app.git
$ cd simple-app

# List available issues
$ miyabi list-issues
Available Issues:
  #1  Add user authentication        [P1-High] [type:feature]
  #2  Fix login page CSS             [P2-Medium] [type:bug]
  #3  Update README documentation    [P3-Low] [type:docs]

# Work on Issue #3 (simple documentation update)
$ miyabi work-on 3

[12:00:00] [しきるん] 🎯 Analyzing Issue #3...
[12:00:01] [しきるん]    Title: Update README documentation
[12:00:01] [しきるん]    Description: Add installation instructions
[12:00:02] [しきるん] 🔍 Decomposing into 1 task...
[12:00:03] [しきるん]    ✓ Task 1: Update README.md with install instructions
[12:00:04] [しきるん] ⚡ Starting execution (concurrency: 1)

[12:00:05] [つくるん] ✍️ Implementing Task 1: README.md
[12:00:08] [つくるん]    ✓ Added "Installation" section
[12:00:10] [つくるん]    ✓ Added npm install command
[12:00:12] [つくるん]    ✓ Added quick start example
[12:00:14] [つくるん] ✅ Implementation complete (9 seconds)

[12:00:15] [めだまん] 🔍 Reviewing changes...
[12:00:16] [めだまん]    ✓ Markdown syntax valid
[12:00:17] [めだまん]    ✓ Links checked (3/3 valid)
[12:00:18] [めだまん] 📈 Quality Score: 95/100

[12:00:19] [まとめるん] 📋 Creating Pull Request...
[12:00:22] [まとめるん] ✅ PR #12 created successfully
   URL: https://github.com/miyabi-demos/simple-app/pull/12
   Status: Ready to merge

[12:00:23] [しきるん] 🎉 Orchestration complete!
   Total time: 23 seconds
   Tasks: 1/1 completed (100%)
   Quality score: 95/100
```

**Narration**:
> "Here's a simple example: updating documentation. Miyabi creates a PR in 23 seconds."

---

#### Scene 2.2: Review Generated PR (1:45-2:30)
```bash
# View PR details locally
$ git log -1 --oneline
a1b2c3d docs: Update README with installation instructions

# View changes
$ git diff HEAD~1

diff --git a/README.md b/README.md
index abc123..def456 100644
--- a/README.md
+++ b/README.md
@@ -5,6 +5,20 @@

 A simple demo application for Miyabi.

+## Installation
+
+### Prerequisites
+- Node.js 18+
+- npm or yarn
+
+### Quick Start
+
+\```bash
+npm install
+npm start
+\```
+
+Visit http://localhost:3000 to see the app.
+
 ## Features

 - User authentication

# View PR on GitHub (simulated)
$ gh pr view 12

PR #12: docs: Update README with installation instructions
State: Open
Author: miyabi-bot
Labels: type:docs, agent:codegen, auto-generated

## Summary
Added installation instructions to README.md for easier onboarding.

## Changes
- Added "Installation" section
- Added prerequisites (Node.js 18+, npm/yarn)
- Added quick start commands
- Added localhost URL

## Quality Score
95/100

✓ Markdown syntax valid
✓ All links checked and working
✓ Clear and concise instructions
```

**Narration**:
> "The PR includes a complete description, quality score, and is ready to merge."

---

### Act 3: Advanced Usage (2:30-4:00) - 90 seconds

#### Scene 3.1: Work on Complex Issue (2:30-3:30)
```bash
# Work on Issue #1 (more complex: feature implementation)
$ miyabi work-on 1

[12:05:00] [しきるん] 🎯 Analyzing Issue #1...
[12:05:01] [しきるん]    Title: Add user authentication
[12:05:01] [しきるん]    Description: Implement JWT-based auth
[12:05:02] [しきるん] 🔍 Decomposing into 4 tasks...
[12:05:03] [しきるん]    ✓ Task 1: Create auth module (auth.ts)
[12:05:03] [しきるん]    ✓ Task 2: Add JWT token generation
[12:05:03] [しきるん]    ✓ Task 3: Add middleware for protected routes
[12:05:03] [しきるん]    ✓ Task 4: Write unit tests
[12:05:04] [しきるん] 🔗 Building task DAG...
[12:05:05] [しきるん]    Graph: 4 nodes, 3 edges, 3 levels
[12:05:05] [しきるん] ✅ No circular dependencies
[12:05:06] [しきるん] ⚡ Starting parallel execution (concurrency: 2)

# Show progress in real-time
[12:05:07] [つくるん] ✍️ Task 1: Creating auth module...
[12:05:10] [つくるん] ✍️ Task 2: Implementing JWT generation...
[12:05:25] [つくるん] ✅ Task 1 complete (18 seconds)
[12:05:30] [つくるん] ✅ Task 2 complete (20 seconds)

[12:05:31] [つくるん] ✍️ Task 3: Adding middleware...
[12:05:45] [つくるん] ✅ Task 3 complete (14 seconds)

[12:05:46] [つくるん] 🧪 Task 4: Writing tests...
   PASS  src/auth.test.ts
     ✓ should generate valid JWT token (15ms)
     ✓ should verify JWT token (12ms)
     ✓ should reject invalid token (8ms)
     ✓ should protect routes (20ms)

   Test Suites: 1 passed, 1 total
   Tests:       4 passed, 4 total
   Time:        2.453s

[12:05:55] [つくるん] ✅ Task 4 complete (9 seconds)

[12:05:56] [めだまん] 🔍 Reviewing code quality...
[12:05:57] [めだまん] 📋 Running ESLint... ✓
[12:05:58] [めだまん] 📋 Running TypeScript... ✓
[12:06:00] [めだまん] 🔒 Security scan... ✓
[12:06:05] [めだまん] 📊 Test coverage: 92%
[12:06:06] [めだまん] 📈 Quality Score: 94/100

[12:06:07] [まとめるん] 📋 Creating Pull Request...
[12:06:12] [まとめるん] ✅ PR #13 created successfully
   URL: https://github.com/miyabi-demos/simple-app/pull/13

[12:06:13] [しきるん] 🎉 Orchestration complete!
   Total time: 1m 13s
   Tasks: 4/4 completed (100%)
   Quality score: 94/100
   Files changed: 5 (+320 lines)
```

**Narration**:
> "For complex issues, Miyabi decomposes tasks, executes in parallel, and ensures quality."

---

#### Scene 3.2: Parallel Execution (3:30-4:00)
```bash
# Work on multiple issues simultaneously
$ miyabi work-on 1,2,3 --concurrency 3

[12:10:00] [しきるん] 🎯 Orchestrating 3 issues...
[12:10:01] [しきるん]    Issue #1: Add user authentication (4 tasks)
[12:10:01] [しきるん]    Issue #2: Fix login page CSS (2 tasks)
[12:10:01] [しきるん]    Issue #3: Update README (1 task)
[12:10:02] [しきるん] ⚡ Starting parallel execution (concurrency: 3)

# Show progress for all 3 issues
[12:10:03] 📊 Progress: 0/7 tasks completed

[12:10:05] [Issue #1] [つくるん] Working... (Task 1/4)
[12:10:05] [Issue #2] [つくるん] Working... (Task 1/2)
[12:10:05] [Issue #3] [つくるん] Working... (Task 1/1)

[12:10:20] [Issue #3] ✅ Complete! (17s)
[12:10:35] [Issue #2] ✅ Complete! (32s)
[12:11:18] [Issue #1] ✅ Complete! (1m 18s)

[12:11:19] [しきるん] 🎉 All issues complete!
   Total time: 1m 19s (would have been 2m 7s sequential)
   Speedup: 1.6x
   PRs created: 3 (#11, #12, #13)
```

**Narration**:
> "Miyabi can work on multiple issues in parallel, saving significant time."

---

### Act 4: Advanced Features & Wrap-up (4:00-5:00) - 60 seconds

#### Scene 4.1: Agent Management (4:00-4:30)
```bash
# List available agents
$ miyabi agent list

Available Agents (21):

Coding Agents (7):
  ✓ しきるん   (CoordinatorAgent)    - Task orchestration
  ✓ つくるん   (CodeGenAgent)        - AI code generation
  ✓ めだまん   (ReviewAgent)         - Quality assurance
  ✓ みつけるん (IssueAgent)          - Issue analysis
  ✓ まとめるん (PRAgent)             - PR automation
  ✓ はこぶん   (DeploymentAgent)     - CI/CD deployment
  ✓ つなぐん   (HooksIntegration)    - Event monitoring

Business Agents (14):
  ✓ あきんどさん (AIEntrepreneurAgent) - Business strategy
  ✓ つくろん     (ProductConceptAgent) - Product design
  ... (and 12 more)

# View specific agent details
$ miyabi agent info つくるん

Agent: つくるん (CodeGenAgent)
Role: Executor (Green)
Capabilities:
  - AI-driven code generation
  - Automatic test creation
  - Documentation generation
  - Type-safe implementation

Status: Active
Executions: 1,247
Success Rate: 96.8%
Average Quality Score: 91/100
```

**Narration**:
> "Miyabi includes 21 specialized agents. View details, stats, and performance metrics."

---

#### Scene 4.2: Worktree Management (4:30-4:50)
```bash
# List worktrees (for parallel execution)
$ miyabi worktree list

Active Worktrees (3):
  issue-1  /tmp/miyabi/worktree-issue-1  (feat/issue-1)
  issue-2  /tmp/miyabi/worktree-issue-2  (feat/issue-2)
  issue-3  /tmp/miyabi/worktree-issue-3  (feat/issue-3)

# Clean up completed worktrees
$ miyabi worktree clean
✓ Removed 3 worktrees
✓ Freed 245 MB disk space
```

**Narration**:
> "Miyabi uses git worktrees for isolated parallel execution. Clean up easily."

---

#### Scene 4.3: Final Summary (4:50-5:00)
```bash
# Show overall statistics
$ miyabi stats

Miyabi Statistics:
  Total Issues Processed: 127
  Total PRs Created: 124
  Success Rate: 97.6%
  Average Quality Score: 92/100
  Total Time Saved: 312 hours
  Average Time per Issue: 2m 15s

Most Used Agents:
  1. つくるん (CodeGenAgent)    - 115 executions
  2. めだまん (ReviewAgent)     - 112 executions
  3. まとめるん (PRAgent)       - 110 executions

# Clean exit
$ exit
```

**Narration**:
> "That's Miyabi - autonomous development made simple. Star us on GitHub!"

---

## Recording Production Steps

### Step 1: Prepare Environment
```bash
# Clean shell history
history -c

# Set up terminal
export PS1="$ "
export TERM=xterm-256color

# Configure terminal size
resize -s 30 120  # 30 rows, 120 columns

# Navigate to demo directory
cd ~/projects/miyabi-demo

# Create fresh git clone (for reproducibility)
rm -rf simple-app
git clone https://github.com/miyabi-demos/simple-app.git
cd simple-app
```

---

### Step 2: Record Asciinema Session
```bash
# Start recording
asciinema rec miyabi-demo-full.cast \
  --title "Miyabi CLI - Complete Demo (5 minutes)" \
  --idle-time-limit 2.0 \
  --cols 120 \
  --rows 30

# Execute demo script (paste or type carefully)
# ... (follow script above) ...

# End recording
exit
```

**Tips**:
- Use `sleep 1` between commands for readability
- Pause after important output (let users read)
- Use `clear` to reset screen between major sections
- Practice 2-3 times before final recording

---

### Step 3: Edit Recording (Optional)
```bash
# Install asciinema editing tools
npm install -g asciinema-editor

# Trim unnecessary pauses
asciinema-editor miyabi-demo-full.cast

# Speed up slow sections (e.g., cargo install)
asciinema play miyabi-demo-full.cast --speed 2

# Save edited version
asciinema-editor --output miyabi-demo-edited.cast miyabi-demo-full.cast
```

---

### Step 4: Upload to Asciinema.org
```bash
# Authenticate (one-time setup)
asciinema auth

# Upload recording
asciinema upload miyabi-demo-edited.cast

# Output:
# https://asciinema.org/a/xxxxx
#
# View your recording at:
#   https://asciinema.org/a/xxxxx
#
# This installation of asciinema recorder is now linked to your asciinema.org account.
```

**Settings on asciinema.org**:
- Title: "Miyabi CLI - Complete Demo (5 minutes)"
- Description: "Comprehensive demonstration of Miyabi's autonomous development capabilities"
- Theme: Monokai (or One Dark)
- Public: Yes
- Featured: Yes (if option available)

---

## Embedding in Documentation

### Markdown (GitHub, GitLab, docs sites)
```markdown
## 🎬 Full Demo (5 minutes)

Watch the complete Miyabi CLI demonstration:

[![asciicast](https://asciinema.org/a/xxxxx.svg)](https://asciinema.org/a/xxxxx)

*Click to view interactive terminal recording*
```

### HTML (Custom docs site)
```html
<h2>🎬 Full Demo (5 minutes)</h2>

<script src="https://asciinema.org/a/xxxxx.js"
  id="asciicast-xxxxx"
  data-speed="1.5"
  data-theme="monokai"
  data-cols="120"
  data-rows="30"
  async>
</script>
```

### README.md Integration
```markdown
## 📖 Documentation

- [Quick Start Guide](docs/QUICK_START.md)
- [🎬 **Full Demo (5 min)** - Interactive terminal recording](https://asciinema.org/a/xxxxx) ⭐
- [Agent Reference](docs/AGENTS.md)
- [API Documentation](https://docs.miyabi.dev)
```

---

## Advanced Asciinema Features

### Custom Themes
Create custom color scheme matching Miyabi branding:
```json
{
  "theme": {
    "background": "#1e1e1e",
    "foreground": "#d4d4d4",
    "palette": [
      "#ff6b9d",  /* Miyabi pink */
      "#50c878",  /* Miyabi green */
      "#4a90e2",  /* Miyabi blue */
      "#ffd700"   /* Miyabi yellow */
    ]
  }
}
```

### Interactive Features
Users can:
- Pause/play (spacebar)
- Copy/paste commands (select text)
- Adjust playback speed (click speed indicator)
- Full-screen mode (click expand icon)

### Self-Hosting (Optional)
For complete control:
```bash
# Install asciinema-server (Docker)
docker run -d -p 80:80 asciinema/asciinema-server

# Upload to self-hosted instance
asciinema upload --url http://your-domain.com miyabi-demo.cast
```

---

## Multiple Recording Variations

### Recording 1: Quick Start (2 minutes)
- Installation → Simple Issue → PR created
- Target: First-time users
- Pace: Fast

### Recording 2: Full Demo (5 minutes)
- All features showcased
- Target: Evaluators, decision makers
- Pace: Moderate

### Recording 3: Troubleshooting (3 minutes)
- Common errors and solutions
- Target: Users facing issues
- Pace: Slow, detailed

### Recording 4: Advanced Features (4 minutes)
- Parallel execution, agent management, worktrees
- Target: Power users
- Pace: Fast

**Recommendation**: Create Recording 2 (Full Demo) first, then add others based on user feedback.

---

## Quality Checklist

### Pre-Recording
- [ ] Terminal configured (120x30, dark theme, monospace font)
- [ ] Demo repository prepared (fresh clone)
- [ ] Commands tested (no errors or typos)
- [ ] Script finalized (printed for reference)
- [ ] Asciinema installed and authenticated

### During Recording
- [ ] Clear screen between sections (`clear`)
- [ ] Pause after important output (2-3 seconds)
- [ ] Speak clearly if adding voiceover
- [ ] Type at moderate speed (not too fast)
- [ ] Show errors gracefully (if part of demo)

### Post-Recording
- [ ] Review recording (watch full 5 minutes)
- [ ] Edit if needed (trim pauses, fix errors)
- [ ] Upload to asciinema.org
- [ ] Test embed in docs (multiple browsers)
- [ ] Verify commands are copyable
- [ ] Check mobile compatibility

---

## Success Metrics

### Primary KPIs
- Views: 1,000+ in first month
- Playthrough rate: > 50% (users watch > 2.5 minutes)
- Copy/paste rate: > 20% (users copy commands)
- GitHub stars from recording page: +100

### Secondary KPIs
- Shares: 50+ (Twitter, Reddit, Discord)
- Embeds: 10+ (external blogs/docs)
- Average session duration: > 3 minutes

---

## Maintenance & Updates

### When to Update
- Major version release (v0.2, v1.0)
- Significant CLI changes
- User feedback indicates confusion
- Commands become outdated

### Update Process
1. Record new session (same script template)
2. Upload with new version tag (e.g., "v0.2.0 Demo")
3. Update links in documentation
4. Archive old recording (keep URL accessible for backwards compatibility)

---

## Tools & Resources

### Required Tools
- **Asciinema**: https://asciinema.org/ (Free)
- **Terminal**: iTerm2 (macOS), GNOME Terminal (Linux), Windows Terminal

### Optional Tools
- **asciinema-editor**: Trim and edit recordings
- **asciinema-player**: Self-hosted player (for custom docs site)

### Inspiration
- **Homebrew Demo**: https://asciinema.org/a/427670
- **Docker Compose Demo**: https://asciinema.org/a/344354
- **Kubernetes kubectl Demo**: https://asciinema.org/a/427672

---

## File Locations

### Source Files
- Recording script: `/docs/demo-video/06_ASCIINEMA_RECORDING_PLAN.md` (this file)
- Raw recording: `/docs/demo-video/assets/asciinema/miyabi-demo-full.cast`
- Edited recording: `/docs/demo-video/assets/asciinema/miyabi-demo-edited.cast`

### Online
- Asciinema URL: `https://asciinema.org/a/xxxxx`
- Embed code: Generated by asciinema.org

---

## Next Steps

1. **Day 1**: Prepare demo environment (1 hour)
2. **Day 1**: Practice script 2-3 times (1 hour)
3. **Day 2**: Record final session (30 minutes)
4. **Day 2**: Review and edit if needed (30 minutes)
5. **Day 2**: Upload to asciinema.org (5 minutes)
6. **Day 2**: Embed in documentation (15 minutes)
7. **Day 3**: Monitor analytics and gather feedback (ongoing)

---

**Document Version**: 1.0
**Last Updated**: 2025-10-24
**Author**: Miyabi Team
**Status**: Ready for Production
