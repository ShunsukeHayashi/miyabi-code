# GitHub Discussions Categories Configuration

**Purpose**: This document defines the 6 discussion categories for the Miyabi project, following the GitHub OS Integration architecture.

**Setup Instructions**: These categories must be configured manually in GitHub repository settings under **Discussions**.

---

## 📋 Category Definitions

### 1. 💡 Ideas

**Slug**: `ideas`
**Description**: Share ideas for new features, improvements, or innovative approaches
**Format**: Open-ended
**Auto-Labeling**: `enhancement`, `good-first-issue` (if applicable)

**Purpose**:
- Community-driven feature proposals
- Innovation and brainstorming
- Votable feature requests

**Automation**:
- Add `promote-to-issue` label → Auto-creates Issue
- High upvotes (10+) → Auto-suggest promotion
- Weekly digest of top ideas

**Template**:
```markdown
## Idea Summary
[One sentence description]

## Problem Statement
[What problem does this solve?]

## Proposed Solution
[How would this work?]

## Benefits
- [Benefit 1]
- [Benefit 2]

## Implementation Complexity
- [ ] Low (1-2 days)
- [ ] Medium (3-7 days)
- [ ] High (2+ weeks)

## Related Issues/PRs
[Link any related issues]
```

---

### 2. ❓ Q&A

**Slug**: `q-and-a`
**Description**: Ask questions about usage, troubleshooting, or best practices
**Format**: Question/Answer (with accepted answers)
**Auto-Labeling**: `question`, `help-wanted`

**Purpose**:
- User support and troubleshooting
- Knowledge base building
- FAQ generation

**Automation**:
- Mark as answered → Add `answered` label
- Unanswered for 7 days → Notify maintainers
- High-quality answers → Featured in docs

**Template**:
```markdown
## Question
[Clear, specific question]

## Context
- **Miyabi Version**: [e.g., v1.0.0]
- **Environment**: [e.g., Termux on Android, macOS, Ubuntu]
- **Rust Version**: [e.g., 1.75.0]

## What I've Tried
[Steps already attempted]

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Relevant Logs/Errors
```bash
[Paste error messages or logs]
```
```

---

### 3. 🎯 Show and Tell

**Slug**: `show-and-tell`
**Description**: Showcase your projects, workflows, or creative uses of Miyabi
**Format**: Open-ended
**Auto-Labeling**: `showcase`, `community`

**Purpose**:
- Community engagement
- Success stories
- Inspiration for others

**Automation**:
- High engagement → Featured on GitHub Pages
- External links → Auto-archive for blog
- Monthly "Best of Show" compilation

**Template**:
```markdown
## Project Overview
[Brief description]

## What I Built
[Details of your project]

## Tech Stack
- Miyabi Agents: [Which agents used?]
- Other Tools: [Git, GitHub Actions, etc.]

## Challenges & Solutions
[What problems did you solve?]

## Screenshots/Demos
[Add images, GIFs, or video links]

## Repository/Live Demo
[Links if available]

## Lessons Learned
[What would you do differently?]
```

---

### 4. 📣 Announcements

**Slug**: `announcements`
**Description**: Official project updates, releases, and important news
**Format**: Announcement (maintainers only can create)
**Auto-Labeling**: `announcement`, `official`

**Purpose**:
- Release announcements (v1.0.0, v2.0.0, etc.)
- Breaking changes notifications
- Roadmap updates
- Security advisories

**Automation**:
- New release → Auto-create announcement
- High importance → Cross-post to Slack/Discord
- Changelog integration

**Template**:
```markdown
## 🎉 [Release/Update Title]

**Version**: [e.g., v1.0.0]
**Date**: [YYYY-MM-DD]
**Type**: [Major Release / Minor Update / Patch / Security Advisory]

## What's New

### ✨ Features
- [Feature 1]
- [Feature 2]

### 🐛 Bug Fixes
- [Fix 1]
- [Fix 2]

### ⚠️ Breaking Changes
- [Change 1 - Migration Guide Link]

### 📚 Documentation
- [New guide / Updated docs]

## Migration Guide

[If applicable - step-by-step migration instructions]

## Upgrade Instructions

```bash
# For CLI users
cargo install miyabi-cli --force

# For library users
cargo update -p miyabi-agents
```

## Contributors

Special thanks to:
- @username1
- @username2

## Full Changelog

[Link to CHANGELOG.md or GitHub Release]
```

---

### 5. 🛠️ Development

**Slug**: `development`
**Description**: Discuss architecture, design decisions, and contribution guidelines
**Format**: Open-ended
**Auto-Labeling**: `discussion`, `architecture`

**Purpose**:
- Technical design discussions
- RFC (Request for Comments)
- Contributor coordination
- Code review processes

**Automation**:
- Consensus reached → Auto-create tracking issue
- Long discussions (20+ comments) → Auto-summarize with AI
- Linked PRs → Auto-update status

**Template**:
```markdown
## Discussion Topic
[Clear topic statement]

## Background/Motivation
[Why is this discussion needed?]

## Current State
[What exists today?]

## Proposed Changes
[What are we considering?]

### Option A
**Pros**:
- [Pro 1]

**Cons**:
- [Con 1]

### Option B
**Pros**:
- [Pro 1]

**Cons**:
- [Con 1]

## Implementation Impact
- **Crates Affected**: [e.g., miyabi-agents, miyabi-cli]
- **Breaking Changes**: [Yes/No - Details]
- **Migration Effort**: [Low/Medium/High]

## Decision Criteria
- [Criterion 1]
- [Criterion 2]

## Related Issues/PRs
[Links]

## Timeline
[When do we need to decide?]
```

---

### 6. 🐛 Bug Reports (Community Triage)

**Slug**: `bug-triage`
**Description**: Report and discuss potential bugs before creating issues
**Format**: Open-ended
**Auto-Labeling**: `bug`, `needs-triage`

**Purpose**:
- Community-driven bug verification
- Reduce duplicate issues
- Collaborative troubleshooting
- Severity assessment

**Automation**:
- Confirmed bug (3+ confirmations) → Auto-create Issue with `type:bug`
- Cannot reproduce → Label as `cannot-reproduce`
- Duplicate detected → Auto-link to existing issue

**Template**:
```markdown
## Bug Description
[Clear, concise description]

## Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Environment
- **Miyabi Version**: [e.g., v1.0.0]
- **OS**: [e.g., Termux Android 13, macOS 14.0, Ubuntu 22.04]
- **Rust Version**: [e.g., 1.75.0]
- **Installation Method**: [cargo install, built from source, etc.]

## Logs/Error Messages
```bash
[Paste full error output]
```

## Reproducible Example
[Minimal code/configuration to reproduce]

## Severity Assessment
- [ ] **Critical** - Blocks all functionality
- [ ] **High** - Major feature broken
- [ ] **Medium** - Workaround exists
- [ ] **Low** - Minor inconvenience

## Possible Root Cause
[If you have insights]

## Community Confirmation
**Can others reproduce this?**
- [ ] Yes, I can reproduce (add comment)
- [ ] No, cannot reproduce (add comment with your environment)
```

---

## 🤖 Automation Rules

### Idea → Issue Promotion

**Trigger**: Label `promote-to-issue` added to discussion in `ideas` category

**Action**:
1. Create new Issue with:
   - Title: `[From Discussion] {original title}`
   - Body: Discussion content + link to original discussion
   - Labels: `type:feature`, `state:pending`, `source:discussion`
2. Comment on discussion: "Promoted to Issue #N"
3. Remove `promote-to-issue` label

**Workflow**: `.github/workflows/discussions-automation.yml`

### Bug → Issue Promotion

**Trigger**: Label `confirmed-bug` added to discussion in `bug-triage` category

**Action**:
1. Create new Issue with:
   - Title: `[Bug] {original title}`
   - Body: Bug report content + link to discussion
   - Labels: `type:bug`, `severity:Sev.2-High`, `state:pending`
2. Comment on discussion: "Confirmed and tracked in Issue #N"

### Auto-Labeling on Creation

**Trigger**: New discussion created

**Rules**:
- Contains "how to" / "?" → `question`
- Contains "help" / "stuck" → `help-wanted`
- Contains "bug" / "error" → `bug`
- Contains "improve" / "enhance" → `enhancement`

### Answer Rate Monitoring

**Schedule**: Daily at 09:00 UTC

**Action**:
- Calculate answer rate by category
- Alert if <40% in any category
- Generate weekly engagement report

---

## 📊 Success Metrics

**Tracked in `.github/workflows/discussions-automation.yml` (workflow_dispatch)**

### Key Metrics
- **Total Discussions**: Count by category
- **Answer Rate**: % of Q&A answered
- **Avg Response Time**: Time to first response
- **Promotion Rate**: % of ideas promoted to issues
- **Community Engagement**: Comments per discussion

### Targets
- ✅ Answer Rate: ≥80%
- ✅ Avg Response Time: <24 hours
- ✅ Promotion Rate: 10-20% (quality filter)
- ✅ Avg Comments: ≥3 per discussion

---

## 🔧 Setup Instructions

### Step 1: Enable Discussions

1. Go to repository **Settings**
2. Scroll to **Features**
3. Check ✅ **Discussions**

### Step 2: Create Categories

1. Navigate to **Discussions** tab
2. Click **Edit categories** (⚙️ icon)
3. Create each of the 6 categories above:
   - Set **Name**, **Description**, and **Format**
   - For **Announcements**: Enable "Maintainers only can create"

### Step 3: Configure Labels

Ensure these labels exist in `.github/labels.yml`:
```yaml
- name: "promote-to-issue"
  description: "Promote this discussion to an issue"
  color: "0E8A16"

- name: "confirmed-bug"
  description: "Bug confirmed by community"
  color: "D73A4A"

- name: "source:discussion"
  description: "Originated from GitHub Discussions"
  color: "FBCA04"

- name: "showcase"
  description: "Community showcase"
  color: "BFD4F2"
```

### Step 4: Deploy Automation

The automation workflow is already created at:
`.github/workflows/discussions-automation.yml`

It will activate automatically on:
- `discussion` events (created, answered, labeled)
- Manual trigger for statistics

---

## 📚 Related Documentation

- [ENTITY_RELATION_MODEL.md](../docs/ENTITY_RELATION_MODEL.md) - Discussion Entity (E13)
- [LABEL_SYSTEM_GUIDE.md](../docs/LABEL_SYSTEM_GUIDE.md) - Community Labels
- [GITHUB_OS_INTEGRATION.md](../docs/GITHUB_OS_INTEGRATION.md) - Discussions as Message Queue

---

**Status**: Phase 2-1 Complete
**Next**: Phase 2-2 - GitHub Packages (GHCR) Integration
