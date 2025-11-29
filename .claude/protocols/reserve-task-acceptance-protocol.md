# Reserve Task Acceptance Protocol

**Version**: 1.0.0
**Created**: 2025-11-29
**Team**: A5-Reserve
**Status**: Active

---

## 🎯 Executive Summary

**WHO**: A5-Reserve Team (Overflow Task Management Team)
**WHAT**: Protocol for accepting and managing overflow tasks from other teams
**WHY**: Ensure smooth inter-team collaboration and capacity management
**HOW**: Standardized triage, acceptance criteria, and SLA-based execution

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Task Acceptance Flow](#task-acceptance-flow)
3. [Acceptance Criteria](#acceptance-criteria)
4. [Capacity Management](#capacity-management)
5. [SLA Definitions](#sla-definitions)
6. [Communication Protocol](#communication-protocol)
7. [Rejection Protocol](#rejection-protocol)
8. [Escalation Path](#escalation-path)

---

## 🌐 Overview

### Purpose

The A5-Reserve team serves as a buffer for overflow tasks from A1-Alpha, A2-Beta, A3-Gamma, and A4-Delta teams. This protocol ensures:

- **Fair distribution** of workload across teams
- **Transparent capacity** management
- **Clear SLAs** for task execution
- **Quality maintenance** despite overflow conditions

### Scope

This protocol applies to:
- ✅ Overflow tasks from internal teams (A1-A4)
- ✅ Emergency tasks requiring immediate attention
- ✅ Cross-team dependencies blocking critical paths
- ❌ Regular scheduled work (should go to primary teams)
- ❌ External client requests (different protocol)

---

## 🔄 Task Acceptance Flow

```
📨 Incoming → 🔍 Triage → 🎯 Accept/Reject → ⏳ Queue → 🏗️ Execute → ✅ Done
```

### Step 1: Incoming Task

**Trigger**: Another team creates an issue with `📨 reserve:incoming` label

**Required Information**:
- Original team: `👥 team:a[1-4]-*` label
- Priority: `🔥 priority:P[0-3]-*` label
- Type: `✨ type:*` label
- Detailed description
- Acceptance criteria
- Deadline (if applicable)

**Auto-notification**: A5-Lead receives GitHub notification

### Step 2: Triage (Within 2 hours)

**Performed by**: A5-Lead or designated triage agent

**Evaluation Criteria**:
1. **Urgency**: Is this truly overflow or can it wait?
2. **Capacity**: Do we have bandwidth?
3. **Competency**: Do we have the right skills?
4. **Impact**: What's the business impact?
5. **Dependencies**: Are there blockers?

**Triage Decision Matrix**:

| Priority | Capacity | Urgency | Decision |
|----------|----------|---------|----------|
| P0 | Any | Critical | **ACCEPT** (auto) |
| P1 | Available | High | **ACCEPT** |
| P1 | Limited | High | **NEGOTIATE** |
| P1 | Full | High | **ESCALATE** |
| P2 | Available | Medium | **ACCEPT** |
| P2 | Limited/Full | Medium | **QUEUE** or **REJECT** |
| P3 | Available | Low | **QUEUE** |
| P3 | Limited/Full | Low | **REJECT** |

### Step 3: Accept or Reject

#### 3a. Accept Path

**Actions**:
1. Add `🎯 reserve:accepted` label
2. Remove `📨 reserve:incoming` label
3. Add `👥 team:a5-reserve` label
4. Assign to appropriate A5 team member
5. Update issue with:
   - Estimated start date
   - Estimated completion date
   - Assigned agent/engineer
6. Post acceptance comment:
   ```markdown
   ✅ **Task Accepted by A5-Reserve Team**

   - **Assigned to**: @agent-name / @engineer-name
   - **Estimated Start**: YYYY-MM-DD HH:MM
   - **Estimated Completion**: YYYY-MM-DD HH:MM
   - **SLA**: [P0: 4h | P1: 24h | P2: 3d | P3: 1w]

   We will keep you updated on progress.
   ```

#### 3b. Reject Path

**Actions**:
1. Add `❌ reserve:rejected` label
2. Remove `📨 reserve:incoming` label
3. Post rejection comment with:
   - Clear reason
   - Alternative suggestions
   - Escalation options

**Rejection Comment Template**:
```markdown
❌ **Task Rejected by A5-Reserve Team**

**Reason**: [Select one or more]
- ⚪ Insufficient capacity - team at full load
- ⚪ Out of scope - requires specialized skills not available
- ⚪ Insufficient information - please provide [specific details]
- ⚪ Not true overflow - should be handled by originating team
- ⚪ Dependencies unresolved - blocked by [issue links]

**Alternative Options**:
1. **Wait for capacity**: We can accept this task on [date] when capacity becomes available
2. **Reduce scope**: If we focus only on [core functionality], we can accept
3. **Escalate**: Contact @A5-Lead for priority override
4. **Delegate**: Suggest Team [X] as better fit due to [reason]

**Next Steps**: [Specific guidance for requesting team]
```

### Step 4: Queue Management

**For Accepted Tasks**:
- Add `⏳ reserve:queued` if not immediately starting
- Queue is FIFO within same priority level
- P0/P1 tasks jump queue
- Weekly queue review on Mondays

**For Queued Tasks**:
- Update ETA weekly
- Notify originating team of any delays
- Re-evaluate priority if business context changes

---

## ✅ Acceptance Criteria

### Must-Have Requirements

All incoming tasks MUST have:

1. **Clear Objective**: What needs to be accomplished?
2. **Acceptance Criteria**: How do we know it's done?
3. **Context**: Why is this needed?
4. **Priority Justification**: Why this priority level?
5. **Original Team**: Who's the primary owner?

### Quality Standards

Tasks must meet:

- **Completeness**: All required information provided
- **Clarity**: No ambiguity in requirements
- **Testability**: Clear way to verify completion
- **Scope Boundary**: What's in/out of scope

### Red Flags (Auto-Reject)

- ❌ Vague requirements: "Make it better"
- ❌ No deadline for P0/P1
- ❌ Duplicate of existing work
- ❌ Should be handled by specialized team (security, legal, etc.)

---

## 🟢 Capacity Management

### Capacity Levels

We operate at 3 capacity levels:

#### 🟢 Available (0-70% utilized)
- **Status**: Actively accepting new tasks
- **Label**: `🟢 capacity:available`
- **Response Time**: Same day triage
- **New Tasks**: Accepted if criteria met

#### 🟡 Limited (71-90% utilized)
- **Status**: Selective acceptance
- **Label**: `🟡 capacity:limited`
- **Response Time**: Within 2 hours triage
- **New Tasks**: Only P0/P1 accepted, others queued

#### 🔴 Full (91-100% utilized)
- **Status**: Critical tasks only
- **Label**: `🔴 capacity:full`
- **Response Time**: Within 1 hour triage
- **New Tasks**: Only P0 accepted, all others rejected with ETA

### Capacity Calculation

```
Capacity % = (Active Tasks * Avg Complexity) / (Team Members * Weekly Hours)
```

**Active Tasks**: Issues with `🏗️ state:implementing` or `👀 state:reviewing`

**Complexity Weights**:
- P0: 20 points
- P1: 10 points
- P2: 5 points
- P3: 2 points

**Weekly Capacity**: 40 hours per team member

**Example**:
- Team: 3 members = 120 hours/week
- Active: 2x P0 (40) + 3x P1 (30) + 5x P2 (25) = 95 points
- Capacity: 95 / 120 = 79% → 🟡 Limited

### Capacity Updates

- **Real-time**: Automatically updated on issue state change
- **Manual Review**: Every Monday 9:00 AM
- **Label Update**: GitHub Actions updates capacity label
- **Dashboard**: Visible on team dashboard

---

## ⏱️ SLA Definitions

### Response Time SLAs

| Priority | Triage | Accept/Reject Decision | First Update |
|----------|--------|------------------------|--------------|
| P0 | 30 min | 1 hour | 2 hours |
| P1 | 2 hours | 4 hours | 8 hours |
| P2 | 4 hours | 1 day | 2 days |
| P3 | 1 day | 3 days | 1 week |

### Completion Time SLAs

| Priority | Target | Maximum |
|----------|--------|---------|
| P0 | 4 hours | 8 hours |
| P1 | 24 hours | 48 hours |
| P2 | 3 days | 5 days |
| P3 | 1 week | 2 weeks |

**Note**: SLAs start from acceptance time, not incoming time

### SLA Breach Protocol

If SLA is at risk:

1. **24h before breach**: Post update with revised ETA
2. **At breach**: Escalate to A5-Lead
3. **4h after breach**: Escalate to CTO/Project Manager

---

## 💬 Communication Protocol

### Update Frequency

| Priority | Update Frequency | Format |
|----------|------------------|--------|
| P0 | Every 2 hours | Comment + @mention |
| P1 | Daily | Comment |
| P2 | Every 2 days | Comment |
| P3 | Weekly | Comment |

### Update Template

```markdown
📊 **Progress Update** - [YYYY-MM-DD HH:MM]

**Status**: [🔍 Analyzing | 🏗️ Implementing | 👀 Reviewing | ⚠️ Blocked]

**Progress**: [X]% complete

**Completed**:
- ✅ [Item 1]
- ✅ [Item 2]

**In Progress**:
- 🔄 [Item 3] - ETA: [date]

**Blockers**:
- ⚠️ [Blocker description] - Needs: [action]

**Next Steps**:
- [ ] [Next item]

**ETA**: [Revised if changed] - [On track | Delayed | At risk]
```

### Completion Notification

```markdown
✅ **Task Completed by A5-Reserve Team**

**Completion Date**: YYYY-MM-DD HH:MM
**Total Time**: Xh Ym
**SLA**: ✅ Met | ⚠️ Missed by [duration]

**Deliverables**:
- [Link to PR]
- [Link to deployment]
- [Link to documentation]

**Quality Score**: [XX]/100
- Code Quality: [X]/10
- Test Coverage: [X]/10
- Documentation: [X]/10

**Handoff Notes**:
[Any important information for the receiving team]

**Feedback Request**:
Please rate this work: [Link to feedback form]

---
Transferred back to: @original-team
cc: @stakeholders
```

---

## ❌ Rejection Protocol

### Valid Rejection Reasons

1. **Capacity Constraints**
   - Team at 🔴 Full capacity
   - No ETA for available capacity within acceptable timeframe

2. **Skill Mismatch**
   - Requires specialized expertise not available
   - Better suited for another team

3. **Insufficient Information**
   - Missing critical requirements
   - Ambiguous acceptance criteria
   - Needs subject matter expert clarification

4. **Scope Issues**
   - Out of team's mandate
   - Requires external dependencies (legal, security, etc.)
   - Too large for overflow handling

5. **Priority Conflict**
   - Not truly overflow (normal team capacity should handle)
   - Lower priority than current workload
   - Business justification unclear

### Rejection Process

1. **Document Reason**: Use rejection comment template
2. **Provide Alternatives**: Suggest next steps
3. **Offer Compromise**: If possible (e.g., partial scope)
4. **Set Follow-up**: When capacity may become available
5. **Label Update**:
   - Add `❌ reserve:rejected`
   - Add rejection reason label (if applicable)
   - Remove `📨 reserve:incoming`

### After Rejection

- Originating team decides next action
- Can escalate to A5-Lead for override
- Can revise scope and resubmit
- Can wait for capacity and resubmit

---

## 🚨 Escalation Path

### When to Escalate

**Automatic Escalation** (no decision needed):
- All P0 tasks (CTO notified immediately)
- SLA breach imminent or occurred
- Critical blocker encountered

**Manual Escalation** (judgement call):
- Originating team disagrees with rejection
- Scope significantly changed mid-task
- New high-priority task conflicts with current work
- Quality concerns on delivered work

### Escalation Hierarchy

```
Level 1: A5-Lead
    ↓ (if unresolved within 2h)
Level 2: CTO / Project Manager
    ↓ (if unresolved within 4h)
Level 3: Executive Team
```

### Escalation Contact

- **A5-Lead**: @a5-lead (GitHub) | a5-lead@miyabi.ai (Email)
- **CTO**: @cto (GitHub) | cto@miyabi.ai (Email)
- **Emergency**: #emergency Slack channel

### Escalation Template

```markdown
🚨 **ESCALATION** - [Issue #XXX]

**Escalation Level**: [1 | 2 | 3]
**Escalation Reason**: [Select one]
- ⚪ SLA Breach - [X]h overdue
- ⚪ Critical Blocker - [description]
- ⚪ Resource Conflict - [details]
- ⚪ Scope Dispute - [details]
- ⚪ Quality Concern - [details]

**Business Impact**: [High | Medium | Low]
**Affected Stakeholders**: @mentions

**Actions Taken So Far**:
1. [Action 1]
2. [Action 2]

**Requested Resolution**:
[Specific ask - e.g., priority override, additional resources, scope clarification]

**Deadline**: [If applicable]

---
Original Issue: #XXX
Originating Team: @team-name
A5 Assigned: @assignee-name
```

---

## 📊 Metrics & Reporting

### Key Metrics

We track:

1. **Acceptance Rate**: % of incoming tasks accepted
2. **SLA Compliance**: % of tasks meeting SLA
3. **Average Resolution Time**: By priority level
4. **Capacity Utilization**: Real-time %
5. **Quality Score**: Average across all completed tasks
6. **Rejection Reasons**: Distribution

### Weekly Report

Every Monday, A5-Lead publishes:

```markdown
# A5-Reserve Weekly Report - [Week of YYYY-MM-DD]

## 📊 Metrics

| Metric | This Week | Last Week | Trend |
|--------|-----------|-----------|-------|
| Tasks Accepted | X | Y | ↑/↓ |
| Tasks Rejected | X | Y | ↑/↓ |
| SLA Compliance | XX% | YY% | ↑/↓ |
| Avg Resolution | Xh Ym | Yh Zm | ↑/↓ |
| Capacity | XX% | YY% | ↑/↓ |
| Quality Score | XX/100 | YY/100 | ↑/↓ |

## 🎯 Completed Tasks

- [#XXX] [Title] - Team: A1 - Priority: P1 - Time: Xh - Quality: XX/100

## ⏳ In Progress

- [#XXX] [Title] - Team: A2 - Priority: P0 - ETA: YYYY-MM-DD

## 📈 Trends & Insights

[Key observations, bottlenecks, recommendations]

## 🔮 Next Week Forecast

**Capacity Projection**: XX%
**Incoming Pipeline**: X tasks
**Recommendations**: [Actions for next week]
```

---

## 🔄 Protocol Versioning

**Current Version**: 1.0.0
**Last Updated**: 2025-11-29
**Next Review**: 2025-12-06

### Version History

- **1.0.0** (2025-11-29): Initial protocol creation

### Amendment Process

1. Propose change via Issue with `📚 type:docs` + `protocol-amendment` labels
2. A5-Team review (3 day review period)
3. Approval by A5-Lead
4. Update version number (MAJOR.MINOR.PATCH)
5. Announce to all teams
6. Update date and version in this document

---

## 📚 Related Documents

- [Label System Guide](../../docs/LABEL_SYSTEM_GUIDE.md)
- [Agent Coordination Protocol](./agent-coordination-protocol.md)
- [GitHub Workflow Guide](../workflows/README.md)
- [Capacity Management Dashboard](https://dashboard.miyabi.ai/a5-reserve)

---

**Document Owner**: A5-Reserve Team
**Maintained by**: @a5-lead
**Questions**: Post in #a5-reserve Slack channel or create issue with `❓ question` label
