# 🔔 Event Routing Matrix - GitHub OS Event Bus

**Issue**: #5 - Phase B: Webhooks - Event Bus
**作成日**: 2025-10-15
**バージョン**: 1.0

---

## 📋 概要

GitHub Webhooks経由で受信したイベントを適切なAgentにルーティングする「Event Bus」の完全な設定ドキュメントです。

### アーキテクチャ

```
GitHub Webhook Event
        ↓
webhook-handler.yml (GitHub Actions)
        ↓
webhook-router.ts (TypeScript Router)
        ↓
Event Routing Matrix (本ドキュメント)
        ↓
Agent Auto-Start (CoordinatorAgent, IssueAgent, ReviewAgent, etc.)
```

---

## 🎯 Event Routing Matrix

### Priority Levels

| Priority | SLA | Use Case |
|----------|-----|----------|
| **🔥 Critical** | < 1 min | Agent execution requests, critical failures |
| **⚡ High** | < 5 min | New issues, PRs, reviews |
| **⚠️ Medium** | < 30 min | Deployments, merges |
| **📝 Low** | Best effort | Reopens, non-critical updates |

---

## 📊 Complete Routing Table

### Issues Events

| GitHub Event | Action | Target Agent | Priority | Action Description |
|--------------|--------|--------------|----------|-------------------|
| `issues.opened` | - | **IssueAgent** | ⚡ High | Analyze and auto-label issue |
| `issues.labeled` | `🤖agent-execute` | **CoordinatorAgent** | 🔥 Critical | Execute autonomous task |
| `issues.labeled` | Other labels | **IssueAgent** | ⚠️ Medium | Update state based on label |
| `issues.assigned` | - | **IssueAgent** | ⚡ High | Transition to implementing state |
| `issues.closed` | - | **IssueAgent** | ⚠️ Medium | Transition to done state |
| `issues.reopened` | - | **IssueAgent** | 📝 Low | Re-analyze and update state |
| `issues.milestoned` | - | **IssueAgent** | 📝 Low | Update phase tracking |

**Implementation**: `.github/workflows/webhook-handler.yml` (Lines 46-60)

---

### Pull Request Events

| GitHub Event | Action | Target Agent | Priority | Action Description |
|--------------|--------|--------------|----------|-------------------|
| `pull_request.opened` | Draft=false | **ReviewAgent** | ⚡ High | Run quality checks |
| `pull_request.opened` | Draft=true | *None* | - | Skip auto-review |
| `pull_request.ready_for_review` | - | **ReviewAgent** | ⚡ High | Run quality checks and request review |
| `pull_request.review_requested` | - | **ReviewAgent** | ⚡ High | Perform automated review |
| `pull_request.synchronize` | - | **ReviewAgent** | ⚠️ Medium | Re-run quality checks |
| `pull_request.closed` | Merged=true, base=main | **DeploymentAgent** | 🔥 Critical | Deploy to production |
| `pull_request.closed` | Merged=true, base≠main | **DeploymentAgent** | ⚠️ Medium | Deploy to staging |
| `pull_request.closed` | Merged=false | *None* | - | No action |

**Implementation**: `.github/workflows/webhook-handler.yml` (Lines 78-90, 134-148)

---

### Comment Events

| GitHub Event | Action | Target Agent | Priority | Action Description |
|--------------|--------|--------------|----------|-------------------|
| `issue_comment.created` | `/agent analyze` | **IssueAgent** | 🔥 Critical | Analyze Issue and suggest labels |
| `issue_comment.created` | `/agent execute` | **CoordinatorAgent** | 🔥 Critical | Start autonomous execution |
| `issue_comment.created` | `/agent review` | **ReviewAgent** | 🔥 Critical | Request code review |
| `issue_comment.created` | `/agent status` | **CoordinatorAgent** | ⚡ High | Fetch current status |
| `issue_comment.created` | `/agent help` | *Bot* | ⚡ High | Show available commands |
| `issue_comment.created` | Other text | *None* | - | No action |

**Implementation**: `.github/workflows/webhook-handler.yml` (Lines 92-132)

**Supported Commands**:
```bash
/agent analyze        # Analyze Issue
/agent execute        # Start autonomous execution
/agent review         # Request code review
/agent status         # Check current status
/agent help           # Show available commands
```

---

### Push Events

| GitHub Event | Action | Target Agent | Priority | Action Description |
|--------------|--------|--------------|----------|-------------------|
| `push` | branch=main | **DeploymentAgent** | 🔥 Critical | Deploy to production |
| `push` | branch=feat/* | **ReviewAgent** | ⚠️ Medium | Run CI checks |
| `push` | branch=fix/* | **ReviewAgent** | ⚠️ Medium | Run CI checks |
| `push` | Other branches | *None* | - | No action |

**Implementation**: `.github/workflows/webhook-event-router.yml` (Lines 65-74)

---

### Workflow Run Events

| GitHub Event | Action | Target Agent | Priority | Action Description |
|--------------|--------|--------------|----------|-------------------|
| `workflow_run.completed` | conclusion=failure, name=agent-runner | **Guardian** | 🔥 Critical | Escalate critical workflow failure |
| `workflow_run.completed` | conclusion=failure, name=economic-circuit-breaker | **Guardian** | 🔥 Critical | Escalate critical workflow failure |
| `workflow_run.completed` | conclusion=failure, Other workflows | *None* | ⚠️ Medium | Log failure |
| `workflow_run.completed` | conclusion=success | *None* | - | No action |

**Implementation**: `.github/workflows/webhook-handler.yml` (Lines 149-186)

**Escalation Process**:
1. Detect critical workflow failure
2. Create Sev.1-Critical Issue
3. Assign to Guardian (repository owner)
4. Include workflow logs and run URL

---

## 🔧 Routing Rules (TypeScript)

### Rule Structure

```typescript
interface RoutingRule {
  condition: (payload: EventPayload) => boolean;
  agent: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  action: string;
}
```

### Example Rules

```typescript
// Critical: Agent execution request
{
  condition: (p) =>
    p.type === 'issue' &&
    p.action === 'labeled' &&
    p.labels?.includes('🤖agent-execute'),
  agent: 'CoordinatorAgent',
  priority: 'critical',
  action: 'Execute autonomous task',
}

// High: New issue
{
  condition: (p) =>
    p.type === 'issue' &&
    p.action === 'opened',
  agent: 'IssueAgent',
  priority: 'high',
  action: 'Analyze and auto-label issue',
}

// High: PR ready for review
{
  condition: (p) =>
    p.type === 'pr' &&
    p.action === 'ready_for_review',
  agent: 'ReviewAgent',
  priority: 'high',
  action: 'Run quality checks and request review',
}
```

**Implementation**: `scripts/cicd/webhook-router.ts` (Lines 91-179)

---

## 🤖 Agent Mapping

### Agent Responsibilities

| Agent | Events | Responsibilities |
|-------|--------|------------------|
| **CoordinatorAgent** | issues.labeled (`🤖agent-execute`), issue_comment (`/agent execute`, `/agent status`) | - Task decomposition<br>- DAG construction<br>- Specialist assignment<br>- Status reporting |
| **IssueAgent** | issues.opened, issues.assigned, issues.closed, issues.reopened | - Issue analysis<br>- Auto-labeling<br>- State transitions<br>- Label AI inference |
| **ReviewAgent** | pull_request.opened, pull_request.ready_for_review, pull_request.review_requested | - Quality checks<br>- Code review<br>- Quality score (0-100)<br>- Review comments |
| **PRAgent** | (Manual trigger) | - PR creation<br>- Conventional Commits<br>- PR description generation |
| **DeploymentAgent** | pull_request.closed (merged to main), push (main branch) | - Firebase/Vercel deploy<br>- Health checks<br>- Rollback on failure |
| **Guardian** | workflow_run.completed (critical failures) | - Manual review<br>- Critical issue resolution<br>- System recovery |

---

## 📈 Retry & Error Handling

### Retry Configuration

```typescript
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000,      // 1 second
  maxDelayMs: 10000,          // 10 seconds
  backoffMultiplier: 2,       // Exponential backoff
};
```

### Retry Schedule

| Attempt | Delay |
|---------|-------|
| 1 | 0ms (immediate) |
| 2 | 1000ms (1s) |
| 3 | 2000ms (2s) |
| 4 | 4000ms (4s) |

**Implementation**: `scripts/cicd/webhook-router.ts` (Lines 229-265)

### Error Scenarios

| Error Type | Handling |
|------------|----------|
| GitHub API rate limit | Retry with exponential backoff |
| Network timeout | Retry up to 3 times |
| Agent workflow not found | Log warning, continue |
| Permission denied | Log error, escalate to Guardian |
| Unknown error | Log error, retry |

---

## 🔒 Security

### Webhook Signature Verification (Planned)

```typescript
import crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}
```

**Status**: Prepared (not yet enforced)
**File**: `scripts/cicd/webhook-security.ts` (planned)

---

## 📊 Metrics & Monitoring

### Key Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| **Routing Success Rate** | % of events successfully routed | > 99% |
| **Average Routing Time** | Time from event to agent trigger | < 5s |
| **Retry Rate** | % of events requiring retries | < 5% |
| **Critical Event SLA** | Time to trigger critical events | < 1 min |
| **Agent Execution Rate** | % of routed events that execute | > 90% |

### Logging

All events are logged with:
- Event type and action
- Target agent
- Priority level
- Routing decision
- Success/failure status
- Retry attempts

**Log Location**: GitHub Actions workflow logs

---

## 🧪 Testing

### Manual Testing

```bash
# Test Issue opened event
gh workflow run webhook-event-router.yml \
  -f EVENT_TYPE=issue \
  -f EVENT_ACTION=opened \
  -f ISSUE_NUMBER=270

# Test PR opened event
gh workflow run webhook-event-router.yml \
  -f EVENT_TYPE=pr \
  -f EVENT_ACTION=opened \
  -f PR_NUMBER=45

# Test comment command
COMMENT_BODY="/agent execute" \
ISSUE_NUMBER=270 \
npx tsx scripts/cicd/webhook-router.ts comment 270 username
```

### Automated Tests

**File**: `tests/webhook-router.test.ts`

```typescript
describe('WebhookEventRouter', () => {
  it('routes issue.opened to IssueAgent', () => {
    // Test implementation
  });

  it('routes issue.labeled (🤖agent-execute) to CoordinatorAgent', () => {
    // Test implementation
  });

  it('routes /agent commands correctly', () => {
    // Test implementation
  });

  it('retries on failure with exponential backoff', () => {
    // Test implementation
  });
});
```

---

## 🔗 Related Resources

### Implementation Files

- `.github/workflows/webhook-handler.yml` - Main webhook handler
- `.github/workflows/webhook-event-router.yml` - TypeScript integration
- `scripts/cicd/webhook-router.ts` - Routing logic
- `tests/webhook-router.test.ts` - Automated tests

### Documentation

- [GitHub OS Integration Status](./GITHUB_OS_INTEGRATION_STATUS.md) - Overall progress
- [GitHub OS Integration Plan](./architecture/GITHUB_OS_INTEGRATION_PLAN.md) - Full plan
- [Agent Triggers](./AGENT_TRIGGERS.md) - Agent trigger configuration

### GitHub Resources

- [GitHub Webhooks Documentation](https://docs.github.com/en/webhooks)
- [GitHub Actions Events](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows)
- [Webhook Signature Verification](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries)

---

## 📝 Changelog

### v1.0 (2025-10-15)

- ✅ Initial Event Routing Matrix
- ✅ 18 routing rules implemented
- ✅ 6 agent types supported
- ✅ Retry mechanism with exponential backoff
- ✅ Comment command parsing
- ✅ Critical workflow failure escalation

---

**作成日**: 2025-10-15
**最終更新**: 2025-10-15
**バージョン**: 1.0

🔔 **Event Routing Matrix - Complete Documentation**
