# Demo Scenario - Agent Execution Walkthrough

**Demo Target**: Issue #270 - "Enable TypeScript strict mode"

**Duration**: 10 minutes (for recording, will be edited to 1 minute in final video)

**Last Updated**: 2025-10-24

---

## 🎯 Demo Objectives

1. Showcase end-to-end autonomous agent pipeline
2. Demonstrate real-time agent execution
3. Show tangible output (Pull Request creation)
4. Prove the "10 minutes to PR" promise

---

## 📋 Pre-Demo Setup

### Environment Preparation

**1. Clean Working Directory**
```bash
# Navigate to demo directory
cd ~/miyabi-demo/Miyabi

# Ensure clean git state
git status
# Should show: "working tree clean"

# Pull latest changes
git pull origin main

# Verify build
cargo build --release
./target/release/miyabi --version
```

**2. GitHub Authentication**
```bash
# Verify GitHub CLI authentication
gh auth status

# Test GitHub API access
gh repo view ShunsukeHayashi/Miyabi
```

**3. Create Demo Issue**
```bash
# Create Issue #270 (if not exists)
gh issue create \
  --title "Enable TypeScript strict mode" \
  --body "$(cat <<'EOF'
## 📋 Task Description

Update `tsconfig.json` to enable TypeScript strict mode for better type safety.

## 🎯 Acceptance Criteria

- [ ] `strict: true` in tsconfig.json
- [ ] All type errors resolved
- [ ] Tests passing
- [ ] No `any` types introduced

## 📝 Implementation Notes

Enable strict mode gradually:
1. Add `strict: true` to compiler options
2. Fix type errors one file at a time
3. Add explicit types where needed
4. Run `tsc --noEmit` to verify

**Priority**: P1 - High
**Estimated Time**: 2-3 hours
EOF
)"

# Verify issue created
gh issue view 270
```

**Expected Output**:
```
Enable TypeScript strict mode #270
Open • ShunsukeHayashi opened about X minutes ago • 0 comments

[Issue body appears here]
```

---

## 🚀 Demo Execution Steps

### Step 1: Initial Issue Analysis (Scene Setup)

**Terminal Command**:
```bash
# Show issue details
gh issue view 270
```

**Narration Talking Points**:
- "We have Issue #270: Enable TypeScript strict mode"
- "A typical 2-3 hour task for a human developer"
- "Let's see how Miyabi handles this autonomously"

**Recording Notes**:
- Split screen: Browser (GitHub Issue) + Terminal
- Camera on terminal ready to execute
- Pause for 5 seconds to show issue content

---

### Step 2: Execute Agent Pipeline

**Terminal Command**:
```bash
# Start agent execution
./target/release/miyabi work-on 270
```

**Expected Output Flow**:

```bash
$ ./target/release/miyabi work-on 270

🎯 Miyabi Agent System v2.0.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[12:00:00.000] [CoordinatorAgent] 🎯 Starting orchestration for Issue #270
[12:00:00.234] [CoordinatorAgent] 📖 Fetching issue details from GitHub...
[12:00:01.456] [CoordinatorAgent] ✅ Issue fetched: "Enable TypeScript strict mode"

[12:00:01.789] [CoordinatorAgent] 🔍 Analyzing issue requirements...
[12:00:03.012] [CoordinatorAgent]    Requirements identified:
                                       - Update tsconfig.json
                                       - Enable strict mode
                                       - Fix type errors
                                       - Verify tests pass

[12:00:03.345] [CoordinatorAgent] 🧩 Decomposing into tasks...
[12:00:04.567] [CoordinatorAgent] ✅ Task decomposition complete:
                                       - Task 1: Update tsconfig.json
                                       - Task 2: Fix type errors
                                       - Task 3: Run tests

[12:00:04.890] [CoordinatorAgent] 🔗 Building task dependency graph...
[12:00:05.123] [CoordinatorAgent] ✅ DAG constructed:
                                       - Nodes: 3
                                       - Edges: 2
                                       - Levels: 3
                                       - Cycles: 0 (valid)

[12:00:05.456] [CoordinatorAgent] 🎭 Assigning agents to tasks...
[12:00:05.789] [CoordinatorAgent] ✅ Agent assignment complete:
                                       - Task 1 → CodeGenAgent
                                       - Task 2 → CodeGenAgent
                                       - Task 3 → CodeGenAgent

[12:00:06.012] [CoordinatorAgent] ⚡ Starting execution (concurrency: 1)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Executing Level 1/3 (1 task)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[12:00:06.345] [CodeGenAgent] 🏗️ Task 1: Update tsconfig.json
[12:00:06.678] [CodeGenAgent]    Reading current configuration...
[12:00:07.901] [CodeGenAgent]    Applying strict mode settings...
[12:00:08.234] [CodeGenAgent]    ✅ tsconfig.json updated

[12:00:08.567] [CodeGenAgent] 🔍 Analyzing codebase for type errors...
[12:00:10.890] [CodeGenAgent]    Found 12 type errors across 5 files
[12:00:11.123] [CodeGenAgent]    Generating fixes...

[12:00:35.456] [CodeGenAgent] ✅ Task 1 complete
                                  - Files modified: 6
                                  - Lines added: 45
                                  - Lines removed: 8
                                  - Type errors fixed: 12/12

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Executing Level 2/3 (1 task)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[12:01:35.789] [CodeGenAgent] 🧪 Task 2: Running tests...
[12:01:36.012] [CodeGenAgent]    $ npm test
[12:01:38.345] [CodeGenAgent]    Running 47 test suites...

[12:03:45.678] [CodeGenAgent] ✅ Task 2 complete
                                  - Tests run: 342
                                  - Passed: 342
                                  - Failed: 0
                                  - Coverage: 94.2%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Executing Level 3/3 (1 task)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[12:03:46.012] [ReviewAgent] 🔍 Running quality checks...
[12:03:46.345] [ReviewAgent]    Analyzing code quality...
[12:03:50.678] [ReviewAgent]    Running linters...
[12:04:20.901] [ReviewAgent]    Checking code coverage...
[12:04:25.234] [ReviewAgent]    Verifying best practices...

[12:05:30.567] [ReviewAgent] ✅ Quality assessment complete:

                                 📊 Quality Score: 98/100

                                 Code Quality:        ⭐⭐⭐⭐⭐ (Excellent)
                                 Type Safety:         ⭐⭐⭐⭐⭐ (Excellent)
                                 Test Coverage:       ⭐⭐⭐⭐⭐ (95%)
                                 Performance:         ⭐⭐⭐⭐⭐ (No issues)
                                 Security:            ⭐⭐⭐⭐⭐ (No vulnerabilities)
                                 Maintainability:     ⭐⭐⭐⭐⭐ (Score: 92)

                                 ✅ Ready for Pull Request

[12:05:31.890] [PRAgent] 📝 Creating Pull Request...
[12:05:32.123] [PRAgent]    Generating PR title and description...
[12:05:33.456] [PRAgent]    Analyzing commit history...
[12:05:34.789] [PRAgent]    Formatting with Conventional Commits...

[12:05:40.012] [PRAgent] ✅ Pull Request created:

                             🔗 PR #280: Enable TypeScript strict mode

                             URL: https://github.com/ShunsukeHayashi/Miyabi/pull/280

                             📋 Summary:
                             - Updated tsconfig.json with strict mode
                             - Fixed 12 type errors across 5 files
                             - All tests passing (342/342)
                             - Quality score: 98/100

                             ✅ Ready for review and merge

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ Execution Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏱️  Total Duration: 5m 40s
✅  Success Rate: 100%
📊  Quality Score: 98/100
🔗  PR: #280

🎉 Issue #270 resolved autonomously!
```

**Recording Notes**:
- Do NOT stop recording during execution
- Let the full output flow naturally
- Capture all agent transitions
- Highlight key moments with on-screen annotations in editing

---

### Step 3: Verify Pull Request Created

**Terminal Command**:
```bash
# View PR details
gh pr view 280
```

**Expected Output**:
```
Enable TypeScript strict mode #280
Open • miyabi-bot opened 1 minute ago • 0 comments

  Updated tsconfig.json with strict mode compilation and fixed all type errors

  ## Summary

  - Updated `tsconfig.json` to enable `strict: true`
  - Fixed 12 type errors across 5 files
  - All tests passing (342/342)
  - Code quality score: 98/100

  ## Changes

  - `tsconfig.json`: Enable strict mode
  - `src/types.ts`: Add explicit type annotations
  - `src/utils.ts`: Fix implicit any types
  - `src/api.ts`: Add return type annotations
  - `src/config.ts`: Fix optional property types

  ## Test Results

  ✅ All tests passing
  ✅ Type check: No errors
  ✅ Lint: No issues
  ✅ Coverage: 94.2%

  🤖 Generated with Miyabi Agent System
  Co-Authored-By: CodeGenAgent <noreply@miyabi.ai>
  Reviewed-By: ReviewAgent (Score: 98/100)

View this pull request on GitHub:
https://github.com/ShunsukeHayashi/Miyabi/pull/280
```

**Browser Recording**:
- Open PR URL in browser
- Show PR description
- Show file changes (diff view)
- Show test status (all green checkmarks)

---

### Step 4: Demo Conclusion

**Terminal Command**:
```bash
# Show execution summary
miyabi status
```

**Narration Talking Points**:
- "In just 5 minutes and 40 seconds..."
- "Miyabi analyzed the issue, generated code, ran tests, and created a PR"
- "Quality score: 98 out of 100"
- "Ready for human review and merge"
- "No manual coding required"

---

## 🎬 Recording Tips

### Camera Setup
- **Frame**: Terminal window centered, with slight padding
- **Font Size**: 16pt (readable in 1080p)
- **Resolution**: 1920x1080 minimum
- **Frame Rate**: 30fps

### Terminal Aesthetics
```bash
# Use a clean, modern theme
# Recommended: Dracula, Solarized Dark, or Nord

# Ensure prompt is simple:
export PS1="$ "

# Clear screen before starting
clear
```

### Timing Considerations
- **Real execution time**: 5-10 minutes
- **Edited time**: 1 minute (in final video)
- **Speed up sections**: Long builds, test runs (2-3x speed)
- **Normal speed sections**: Agent transitions, key outputs

### What to Capture
✅ **Keep**:
- Agent start messages
- Task decomposition output
- Quality scores
- PR creation confirmation

❌ **Speed up or skip**:
- Long build outputs
- Test execution details (show start and end only)
- Repetitive log lines

---

## 🎭 Alternative Demo Scenarios

### Scenario 2: Bug Fix Demo (Issue #240)
**Task**: "Fix Firebase authentication timeout"
**Duration**: 8 minutes
**Highlights**: Error debugging, integration testing

### Scenario 3: Feature Addition (Issue #276)
**Task**: "Add user profile endpoint"
**Duration**: 12 minutes
**Highlights**: API design, database migration, E2E tests

### Scenario 4: Refactoring (Issue #300)
**Task**: "Refactor agent coordination logic"
**Duration**: 15 minutes
**Highlights**: Code quality improvement, performance optimization

---

## 📊 Success Metrics to Highlight

**Speed**:
- Human estimate: 2-3 hours
- Miyabi execution: 5-10 minutes
- Speedup: 12-36x faster

**Quality**:
- Quality score: 95-100/100
- Test coverage: 90%+
- No regression errors

**Autonomy**:
- Human intervention: 0 minutes
- Approval required: Only for merge (security best practice)

---

## 🔧 Troubleshooting Demo Issues

**Issue**: Agent execution fails
**Backup Plan**:
- Use pre-recorded demo footage
- Show PR that was already created
- Narrate what would have happened

**Issue**: Tests fail during demo
**Solution**:
- Use simpler Issue (pure documentation update)
- Show error handling capability of ReviewAgent
- Demonstrate escalation flow

**Issue**: GitHub API rate limit hit
**Solution**:
- Use dedicated demo GitHub account with higher limits
- Pre-create authentication tokens
- Run demo during off-peak hours

---

## ✅ Demo Checklist

**Pre-Demo**:
- [ ] Clean working directory
- [ ] GitHub CLI authenticated
- [ ] Demo issue created (#270)
- [ ] Terminal font size increased (16pt)
- [ ] Notifications disabled (Do Not Disturb)
- [ ] Browser ready (GitHub repo open)
- [ ] Recording software tested

**During Demo**:
- [ ] Start screen recording
- [ ] Show issue on GitHub
- [ ] Execute `miyabi work-on 270`
- [ ] Do NOT interrupt execution
- [ ] Show PR creation confirmation
- [ ] Open PR in browser
- [ ] Stop recording

**Post-Demo**:
- [ ] Verify recording quality
- [ ] Check audio sync
- [ ] Backup recording file
- [ ] Clean up demo artifacts

---

## 🔗 Demo Assets

**Required Files**:
- `raw-footage/scene-03-agent-demo.mp4` (main execution recording)
- `raw-footage/scene-03-github-issue.mp4` (browser capture)
- `raw-footage/scene-03-pr-result.mp4` (PR verification)

**Optional Assets**:
- Agent flow diagram animation
- Statistics counter animation
- Background music for editing

---

**Version**: 1.0.0
**Created**: 2025-10-24
**Last Updated**: 2025-10-24
