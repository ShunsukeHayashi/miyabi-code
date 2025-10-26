#!/bin/bash
# Create all 32 Stream Deck button scripts according to optimized layout

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🔧 Creating all 32 Stream Deck button scripts..."
echo ""

# === ROW 1: Basic Navigation & Control (01-08) ===

cat > "$SCRIPT_DIR/01-next.sh" << 'EOF'
#!/bin/bash
# Stream Deck Button 01: Next
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "Next"
EOF

cat > "$SCRIPT_DIR/02-continue.sh" << 'EOF'
#!/bin/bash
# Stream Deck Button 02: Continue
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "Continue"
EOF

cat > "$SCRIPT_DIR/03-fix.sh" << 'EOF'
#!/bin/bash
# Stream Deck Button 03: Fix & Test
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "Fix the build errors and make sure all tests pass"
EOF

cat > "$SCRIPT_DIR/04-help.sh" << 'EOF'
#!/bin/bash
# Stream Deck Button 04: Help
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "Help"
EOF

cat > "$SCRIPT_DIR/05-verify.sh" << 'EOF'
#!/bin/bash
# Stream Deck Button 05: Verify System
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "/verify"
EOF

cat > "$SCRIPT_DIR/06-test.sh" << 'EOF'
#!/bin/bash
# Stream Deck Button 06: Run Tests
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "/test"
EOF

cat > "$SCRIPT_DIR/07-review.sh" << 'EOF'
#!/bin/bash
# Stream Deck Button 07: Code Review
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "/review"
EOF

cat > "$SCRIPT_DIR/08-clippy.sh" << 'EOF'
#!/bin/bash
# Stream Deck Button 08: Clippy
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "Run cargo clippy --all and fix all warnings"
EOF

# === ROW 2: Git & Development Workflow (09-16) ===

cat > "$SCRIPT_DIR/09-git-status.sh" << 'EOF'
#!/bin/bash
# Stream Deck Button 09: Git Status
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "Show git status and explain the current state"
EOF

cat > "$SCRIPT_DIR/10-git-diff.sh" << 'EOF'
#!/bin/bash
# Stream Deck Button 10: Git Diff
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "Show git diff and summarize the changes"
EOF

cat > "$SCRIPT_DIR/11-git-add.sh" << 'EOF'
#!/bin/bash
# Stream Deck Button 11: Git Add
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "Stage all changes for commit (git add .)"
EOF

cat > "$SCRIPT_DIR/12-commit.sh" << 'EOF'
#!/bin/bash
# Stream Deck Button 12: Git Commit
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "Please create a git commit with all changes"
EOF

cat > "$SCRIPT_DIR/13-pr.sh" << 'EOF'
#!/bin/bash
# Stream Deck Button 13: Create PR
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "Please create a pull request for the current branch"
EOF

cat > "$SCRIPT_DIR/14-git-push.sh" << 'EOF'
#!/bin/bash
# Stream Deck Button 14: Git Push
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "Push the current branch to remote (git push)"
EOF

cat > "$SCRIPT_DIR/15-git-pull.sh" << 'EOF'
#!/bin/bash
# Stream Deck Button 15: Git Pull
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "Pull latest changes from remote (git pull)"
EOF

cat > "$SCRIPT_DIR/16-git-merge.sh" << 'EOF'
#!/bin/bash
# Stream Deck Button 16: Git Merge
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "Help me merge the current branch"
EOF

# === ROW 3: Agent Execution & Automation (17-24) ===

cat > "$SCRIPT_DIR/17-create-issue.sh" << 'EOF'
#!/bin/bash
# Stream Deck Button 17: Create Issue
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "/create-issue"
EOF

cat > "$SCRIPT_DIR/18-agent-run.sh" << 'EOF'
#!/bin/bash
# Stream Deck Button 18: Agent Run (latest Issue)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LATEST_ISSUE=$(gh issue list --label "🤖agent-execute" --limit 1 --json number --jq '.[0].number' 2>/dev/null)
if [ -n "$LATEST_ISSUE" ]; then
    "$SCRIPT_DIR/05-send-to-claude.sh" "/agent-run coordinator --issue $LATEST_ISSUE"
else
    "$SCRIPT_DIR/05-send-to-claude.sh" "Agent実行対象のIssueが見つかりませんでした。/create-issue でIssueを作成してください。"
fi
EOF

cat > "$SCRIPT_DIR/19-infinity-sprint.sh" << 'EOF'
#!/bin/bash
# Stream Deck Button 19: Infinity Sprint
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "/miyabi-infinity"
EOF

cat > "$SCRIPT_DIR/20-auto-mode.sh" << 'EOF'
#!/bin/bash
# Stream Deck Button 20: Full Auto Mode
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "/miyabi-auto"
EOF

cat > "$SCRIPT_DIR/21-todos.sh" << 'EOF'
#!/bin/bash
# Stream Deck Button 21: TODO to Issues
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "/miyabi-todos"
EOF

cat > "$SCRIPT_DIR/22-security-scan.sh" << 'EOF'
#!/bin/bash
# Stream Deck Button 22: Security Scan
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "/security-scan"
EOF

cat > "$SCRIPT_DIR/23-deploy.sh" << 'EOF'
#!/bin/bash
# Stream Deck Button 23: Deploy
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "/deploy"
EOF

cat > "$SCRIPT_DIR/24-docs-gen.sh" << 'EOF'
#!/bin/bash
# Stream Deck Button 24: Generate Docs
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "/generate-docs"
EOF

# === ROW 4: Voice & Notifications (25-32) ===

cat > "$SCRIPT_DIR/25-voice-on.sh" << 'EOF'
#!/bin/bash
# Stream Deck Button 25: Voice Command ON
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "/voicevox \"やぁやぁ！ずんだもんなのだ！音声システムが起動したのだ！\" 3 1.2"
EOF

cat > "$SCRIPT_DIR/26-zundamon-mode.sh" << 'EOF'
#!/bin/bash
# Stream Deck Button 26: Zundamon Reading Mode
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "/watch-sprint"
EOF

cat > "$SCRIPT_DIR/27-narrate.sh" << 'EOF'
#!/bin/bash
# Stream Deck Button 27: Narrate Progress
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "/narrate"
EOF

cat > "$SCRIPT_DIR/28-watch-sprint.sh" << 'EOF'
#!/bin/bash
# Stream Deck Button 28: Watch Sprint (Monitor)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "/watch-sprint"
EOF

cat > "$SCRIPT_DIR/29-daily-update.sh" << 'EOF'
#!/bin/bash
# Stream Deck Button 29: Daily Update Report
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "/daily-update"
EOF

cat > "$SCRIPT_DIR/30-session-end.sh" << 'EOF'
#!/bin/bash
# Stream Deck Button 30: Session End Notification
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "/session-end"
EOF

cat > "$SCRIPT_DIR/31-generate-lp.sh" << 'EOF'
#!/bin/bash
# Stream Deck Button 31: Generate Landing Page
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "/generate-lp"
EOF

cat > "$SCRIPT_DIR/32-build.sh" << 'EOF'
#!/bin/bash
# Stream Deck Button 32: Build All
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/05-send-to-claude.sh" "Build the entire project (cargo build --all)"
EOF

# Make all scripts executable
chmod +x "$SCRIPT_DIR"/[0-9][0-9]-*.sh

echo "✅ Created all 32 button scripts:"
echo ""
ls -1 "$SCRIPT_DIR"/[0-9][0-9]-*.sh | nl
echo ""
echo "📁 Location: $SCRIPT_DIR"
echo "🔧 Core script: 05-send-to-claude.sh"
