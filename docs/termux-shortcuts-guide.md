# 📱 Termux Shortcuts Complete Guide - Claude Code Integration Workflow

**Version**: 1.0.0  
**Last Updated**: 2025-11-17  
**Author**: Shunsuke  
**License**: MIT

---

## 📖 Table of Contents

1. [Overview](#overview)
2. [Test Results](#test-results)
3. [Shortcut Categories](#shortcut-categories)
4. [System Architecture](#system-architecture)
5. [Usage Guide](#usage-guide)
6. [Practical Examples](#practical-examples)
7. [Remote Execution](#remote-execution)
8. [Setup Instructions](#setup-instructions)
9. [Troubleshooting](#troubleshooting)
10. [Customization](#customization)
11. [References](#references)

---

## 🎯 Overview

A collection of **45 automated shortcuts** leveraging Claude Code CLI on Termux for AI-assisted development workflows.

### What is this?

An automation system integrated with Termux:Widget app that enables **one-tap AI-assisted development workflows**.

### What can it do?

- **One-tap AI Consultation**: Code quality checks, security scans, performance analysis
- **Git Operation Support**: Commit message generation, merge conflict resolution, diff analysis
- **Auto Documentation**: README, API docs, comments, changelogs
- **Remote Development**: Operate MUGEN server/MacBook via SSH
- **Project Monitoring**: Miyabi project progress tracking, automatic report generation

### 🌟 Key Features

1. **Asynchronous Execution**: Run in background, display results via notifications
2. **Termux Integration**: Utilize Termux API (notification, toast, vibrate)
3. **Result Persistence**: Automatically save all results to `~/.shortcuts/results/`
4. **Remote Support**: Execute Claude Code on MUGEN/MacBook via SSH
5. **E2E Tested**: All 45 shortcuts pass 100% tests

---

## 🧪 Test Results

**Execution Date**: 2025-11-15 21:54  
**Success Rate**: **100%** 🎉

```
Total Tests:   45 shortcuts
✓ Success:     45
✗ Failures:     0
⊘ Skipped:      0
```

Each shortcut verified for:
- File existence & readability
- Shebang (execution header) presence
- Bash syntax validation
- Dangerous command detection
- Dependency verification (ssh, tmux, claude, etc.)

---

## 📚 Shortcut Categories

### Category 1: Basic Information (01-04)
- 🕒 **current-time** - Get current time
- 🌤️ **weather-info** - Weather information
- 📊 **system-info** - System information summary
- 📁 **list-files** - File structure analysis

### Category 2: Code Quality (05-08)
- ✨ **code-quality** - Code quality check
- 🔒 **security-scan** - Security vulnerability scan
- ⚡ **performance** - Performance analysis
- 🎯 **complexity** - Complexity analysis

### Category 3: Git Operations (09-12)
- 💬 **commit-msg** - Commit message generation
- 🌿 **branch-status** - Branch status check
- 🔀 **merge-help** - Merge conflict resolution support
- 📊 **diff-analysis** - Code diff analysis

### Category 4: Documentation (13-16)
- 📝 **readme-gen** - README generation
- 📚 **api-docs** - API documentation generation
- 💭 **add-comments** - Comment suggestions
- 📋 **changelog** - Changelog generation

### Category 5: Testing (17-20)
- 🧪 **unit-test** - Unit test generation
- 📈 **test-coverage** - Test coverage analysis
- 🎬 **e2e-test** - E2E test scenario generation
- 🎲 **mock-data** - Mock data generation

### Category 6: Utilities (21-28)
- 📜 **log-analysis** - Log analysis
- 🔍 **error-diag** - Error diagnosis
- 📦 **dependencies** - Dependency check
- 🐛 **debug-assist** - Debug assistance
- 👀 **code-review** - Code review
- ♻️ **refactor** - Refactoring suggestions
- 🏗️ **architecture** - Architecture analysis
- 🚀 **optimize** - Optimization suggestions

### Category 7: Special Functions (95-99)
- ⚡ **realtime-analysis** - Realtime analysis
- 🚨 **emergency-check** - Emergency check
- 📤 **share-results** - Share results
- 📖 **view-results** - View results
- 🌸 **miyabi-analysis** - Miyabi project analysis

### Category 8: Miyabi-Specific Shortcuts
- 🎭 **maestro-status** - Maestro (Orchestrator Layer 2) status check
- 📊 **full-report** - Full report generation
- 🔄 **restart-monitors** - Restart monitors
- 🚀 **auto-push-toggle** - Auto-push ON/OFF toggle
- ⏭️ **push-next** - Push next task
- Other monitoring & automation shortcuts

---

## 🏗️ System Architecture

```
📱 Pixel Termux (Android)
    │
    ├─ Termux:Widget
    │   └─ ~/.shortcuts/*.sh (45 shortcuts)
    │       ├─ Claude Code CLI (local execution)
    │       ├─ SSH → MUGEN/MacBook (remote execution)
    │       └─ Termux API (notifications・vibrations)
    │
    ├─ Result Storage
    │   └─ ~/.shortcuts/results/*.txt
    │
    └─ Remote Environments
        ├─ MUGEN (AWS EC2): ~/miyabi-private
        └─ MacBook (Tailscale): tmux sessions
```

---

## 📖 Usage Guide

### Basic Usage

#### Method 1: Termux:Widget (Recommended)
1. Tap Termux:Widget on home screen
2. Select shortcut to execute
3. Runs in background
4. Notification upon completion
5. Results saved to `~/.shortcuts/results/`

#### Method 2: Command Line
```bash
# Direct execution
bash ~/.shortcuts/05-✨-code-quality.sh

# Execute in specific directory
cd ~/my-project && bash ~/.shortcuts/09-💬-commit-msg.sh

# View results immediately
bash ~/.shortcuts/03-📊-system-info.sh && cat ~/.shortcuts/results/system-info.txt
```

---

## 💡 Practical Examples

### Scenario 1: Morning Code Review Prep

```bash
# 1. Check system info
bash ~/.shortcuts/03-📊-system-info.sh

# 2. Check Git status
bash ~/.shortcuts/10-🌿-branch-status.sh

# 3. Code quality check
cd ~/project
bash ~/.shortcuts/05-✨-code-quality.sh

# 4. Security scan
bash ~/.shortcuts/06-🔒-security-scan.sh

# 5. View all results
cat ~/.shortcuts/results/*.txt
```

**Time Required**: ~30 seconds (background execution)

### Scenario 2: Pre-Commit Check

```bash
# 1. Stage changes
git add .

# 2. Diff analysis
bash ~/.shortcuts/12-📊-diff-analysis.sh

# 3. Generate commit message
bash ~/.shortcuts/09-💬-commit-msg.sh

# 4. Review generated message
cat ~/.shortcuts/results/commit-msg.txt

# 5. Commit
git commit -m "$(cat ~/.shortcuts/results/commit-msg.txt | head -1)"
```

### Scenario 3: Miyabi Project Monitoring

```bash
# 1. Miyabi analysis
bash ~/.shortcuts/99-🌸-miyabi-analysis.sh
# → Analyze latest 10 commits on MUGEN

# 2. Check Maestro status
bash ~/.shortcuts/🎭-maestro-status.sh
# → Check Orchestrator Layer 2 status on MacBook

# 3. Generate full report
bash ~/.shortcuts/📊-full-report.sh
# → Summarize overall progress

# 4. Enable auto-push
bash ~/.shortcuts/🚀-auto-push-toggle.sh
# → Automatically push next task every 2 minutes
```

---

## 🌐 Remote Execution Mechanism

### Execute Claude Code on MUGEN/MacBook

**Example: Miyabi Analysis Shortcut**
```bash
#!/data/data/com.termux/files/usr/bin/bash
# 99-🌸-miyabi-analysis.sh

# 1. Fetch git history from MUGEN
COMMITS=$(ssh mugen "cd ~/miyabi-private && git log --oneline -10")

# 2. AI analysis with Claude Code on Pixel
RESULT=$(claude -p "Analyze the following Miyabi project commit history.
Summarize what's happening in the project in 150 characters or less:

$COMMITS" --output-format json 2>&1 | jq -r '.result')

# 3. Save result
echo "$RESULT" > ~/.shortcuts/results/miyabi-analysis.txt

# 4. Display notification
termux-notification --title "🌸 Miyabi Analysis Complete" --content "$RESULT" --sound
```

**Execution Flow**:
```
[Pixel] Execute shortcut
   ↓ SSH
[MUGEN] Get git log
   ↓ Data transfer
[Pixel] Claude Code analysis
   ↓ Generate result
[Pixel] Notification + File save
```

---

## 📦 Setup Instructions

### Requirements

1. **Termux & Related Apps**
   - Termux (main app)
   - Termux:API (for notifications・vibrations)
   - Termux:Widget (for home screen widgets)

2. **Claude Code CLI**
   ```bash
   npm install -g @anthropic/claude-code
   # or
   curl -fsSL https://claude.ai/install.sh | sh
   ```

3. **Required Packages**
   ```bash
   pkg update && pkg upgrade
   pkg install termux-api openssh tmux jq git curl
   ```

4. **SSH Configuration (for remote development)**
   ```bash
   # Add to ~/.ssh/config
   Host mugen
       HostName 44.250.27.197
       User ubuntu
       IdentityFile ~/.ssh/your-key.pem
       ServerAliveInterval 60
   ```

### Installation Steps

```bash
# 1. Create shortcut directories
mkdir -p ~/.shortcuts
mkdir -p ~/.shortcuts/results
chmod 755 ~/.shortcuts

# 2. Download shortcuts (from GitHub repo)
# [Clone or download from repository]

# 3. Grant execution permissions
chmod +x ~/.shortcuts/*.sh

# 4. Verify functionality
bash ~/test-shortcuts-e2e.sh
```

---

## 🔧 Troubleshooting

### Issue 1: Notifications not displayed
```bash
# Solution:
pkg install termux-api
# Grant Termux notification permission in Android settings
```

### Issue 2: Claude Code not found
```bash
# Solution:
export PATH="$PATH:$HOME/.local/bin"
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.bashrc
```

### Issue 3: SSH connection error
```bash
# Solution:
chmod 600 ~/.ssh/your-key.pem
chmod 700 ~/.ssh
```

### Issue 4: Shortcuts not executing
```bash
# Solution:
chmod +x ~/.shortcuts/*.sh
```

---

## 🎨 Customization

### Shortcut Creation Template

```bash
#!/data/data/com.termux/files/usr/bin/bash
# Custom Shortcut: [Feature Description]

# 1. Start notification
termux-toast "⏳ [Task Name] Starting"
termux-notification --title "⏳ Claude Running" --content "[Description]..." &

# 2. Background execution
(
  # Execute task with Claude Code
  RESULT=$(claude -p "[Your Prompt]" --output-format json 2>&1 | jq -r '.result')

  # Save result
  echo "$RESULT" > ~/.shortcuts/results/custom-task.txt

  # Completion notification
  termux-notification \
    --title "✅ [Task Name] Complete" \
    --content "$(echo $RESULT | head -c 100)" \
    --sound \
    --vibrate "200,100,200"

  termux-toast "✅ Complete!"
) &
```

### Advanced Customization Examples

#### 1. Custom Prompt Optimization
```bash
# Optimize prompts for specific use cases
PROMPT="Analyze the following code for performance bottlenecks.
Focus on: 
1. Algorithm complexity
2. Memory usage
3. Network calls
Provide actionable recommendations."
```

#### 2. Alias Configuration
```bash
# Add to ~/.bashrc
alias cq='bash ~/.shortcuts/05-✨-code-quality.sh'
alias ss='bash ~/.shortcuts/06-🔒-security-scan.sh'
alias cm='bash ~/.shortcuts/09-💬-commit-msg.sh'
```

#### 3. Chain Multiple Shortcuts
```bash
#!/data/data/com.termux/files/usr/bin/bash
# Chain: Quality check + Security scan + Report

bash ~/.shortcuts/05-✨-code-quality.sh &
bash ~/.shortcuts/06-🔒-security-scan.sh &
wait
cat ~/.shortcuts/results/code-quality.txt ~/.shortcuts/results/security-scan.txt > ~/.shortcuts/results/combined-report.txt
termux-notification --title "✅ Combined Report Ready" --content "Quality + Security analysis complete"
```

---

## 📊 Full Shortcut Specifications

### Shortcut Naming Convention

Format: `[Number]-[Emoji]-[Name].sh`

Example: `05-✨-code-quality.sh`

### Standard Shortcut Structure

```bash
#!/data/data/com.termux/files/usr/bin/bash
# [Number]-[Emoji]-[Name].sh
# Purpose: [Description]

# Configuration
RESULT_FILE=~/.shortcuts/results/[name].txt
TITLE="[Task Title]"

# Notification function
notify() {
  termux-notification \
    --title "$1" \
    --content "$2" \
    --sound \
    --vibrate "200,100,200"
}

# Main execution
(
  # Task logic here
  RESULT=$(claude -p "[Prompt]" --output-format json 2>&1 | jq -r '.result')
  
  # Save & notify
  echo "$RESULT" > "$RESULT_FILE"
  notify "✅ $TITLE Complete" "$(echo $RESULT | head -c 100)"
) &
```

---

## 📚 References

- **Claude Code Official**: https://github.com/anthropics/claude-code
- **Termux Wiki**: https://wiki.termux.com/
- **Termux:API**: https://wiki.termux.com/wiki/Termux:API
- **Termux:Widget**: https://wiki.termux.com/wiki/Termux:Widget
- **Miyabi Project**: https://github.com/customer-cloud/miyabi-private

---

## 📄 License

MIT License

Copyright (c) 2025 Shunsuke

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

**Happy Coding with Claude! 🚀🌸**

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-11-17  
**Total Shortcuts**: 45  
**Test Success Rate**: 100%
