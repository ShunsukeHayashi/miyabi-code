# AI Agent Control Guide - Complete Autonomous UI Operation

**Purpose**: Enable AI agents (ChatGPT, GPT-4, etc.) to fully understand and autonomously control the Miyabi Web UI on behalf of users.

**Problem Solved**: When users visit a website and think "How do I use this?", they often leave in confusion. This metadata system allows AI agents to understand the entire UI and operate it automatically based on user intent.

**Date**: 2025-10-23
**Version**: 1.0.0

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [User Intent → UI Operation Flow](#user-intent--ui-operation-flow)
3. [Metadata Attributes Reference](#metadata-attributes-reference)
4. [Complete Operation Examples](#complete-operation-examples)
5. [Error Handling & Retry Logic](#error-handling--retry-logic)
6. [AI Agent Implementation Guide](#ai-agent-implementation-guide)

---

## 🎯 System Overview

### What is this system?

**The Problem**:
- Users visit a web app and struggle to understand how to use it
- Users think "Where do I click?", "What happens next?", "How do I achieve my goal?"
- This confusion leads to user abandonment and poor UX

**The Solution**:
- **AI agents read metadata** embedded invisibly in every UI element
- **AI agents understand user intent** ("I want to see my repositories")
- **AI agents autonomously operate the UI** to fulfill the user's goal
- **No human intervention needed** - AI handles everything

**Key Principle**:
> "Instead of users learning the UI, the AI learns the UI and operates it for users."

---

## 🔄 User Intent → UI Operation Flow

### Example 1: "I want to log in to Miyabi"

**User Intent (Natural Language)**:
```
User: "Log me into Miyabi using GitHub"
```

**AI Agent Processing**:
```
STEP 1: Parse Intent
  - Goal: Authenticate user via GitHub OAuth
  - Current Page: Unknown (need to navigate to /login)

STEP 2: Query Metadata
  - Find element with data-ai-target="github-login-button"
  - Read data-ai-instructions for step-by-step guidance

STEP 3: Execute Actions
  - Navigate to /login if not already there
  - Click [data-ai-target="github-login-button"]
  - Wait for redirect (data-ai-wait-condition="wait-for-redirect-to-github-oauth")
  - Monitor URL change (data-ai-success-criteria="URL changes from /login to GitHub OAuth page")

STEP 4: Handle Callback
  - After GitHub OAuth completes, wait for callback
  - Extract token from URL query parameter (?token=xxx)
  - Store token in localStorage as 'miyabi_token'
  - Navigate to /dashboard

STEP 5: Verify Success
  - Check if URL is /dashboard
  - Verify user is authenticated (check localStorage has token)
  - Report to user: "Successfully logged in!"
```

**Metadata Used**:
```html
<button
  data-ai-role="button"
  data-ai-action="click"
  data-ai-target="github-login-button"
  data-ai-description="Initiate GitHub OAuth authentication flow"
  data-ai-context="login-page"
  data-ai-expected-result="redirect"
  data-ai-navigation-target="/api/v1/auth/github"
  data-ai-instructions="STEP 1: Click this button to initiate GitHub OAuth. STEP 2: Wait for redirect to GitHub login page. STEP 3: Complete GitHub authentication. STEP 4: Wait for callback redirect with token parameter."
  data-ai-next-actions="After redirect completes, check URL for ?token= parameter. If token exists, store in localStorage as miyabi_token and navigate to /dashboard"
  data-ai-wait-condition="wait-for-redirect-to-github-oauth"
  data-ai-success-criteria="URL changes from /login to GitHub OAuth page (github.com/login/oauth/authorize)"
  data-ai-error-handling="If redirect fails after 5 seconds, retry click. If redirect fails 3 times, show error toast and remain on login page"
  data-ai-retry-policy="retry-3-times-with-2s-delay"
  data-ai-priority="1"
  data-ai-workflow-id="github-oauth-login"
  data-ai-workflow-step="1"
>
  Sign in with GitHub
</button>
```

---

### Example 2: "I want to execute an agent on Issue #5"

**User Intent (Natural Language)**:
```
User: "Run the agent on Issue #5"
```

**AI Agent Processing**:
```
STEP 1: Parse Intent
  - Goal: Execute CoordinatorAgent on Issue #5
  - Prerequisites: User must be logged in, repository must be connected

STEP 2: Navigate to Issues Page
  - Find navigation link with data-ai-navigation-target="/dashboard/repositories/[id]/issues"
  - Click navigation link
  - Wait for page load

STEP 3: Find Issue #5
  - Query all elements with data-ai-role="link" and data-ai-context="issues-list"
  - Filter by issue number (parse from data-ai-description)
  - Identify element with data-ai-target="issue-title-link-5"

STEP 4: Open Issue Detail (Optional)
  - If user wants to see issue details first, click issue title link
  - If user wants to execute immediately, proceed to Step 5

STEP 5: Click Agent Execute Button
  - Find element with data-ai-target="agent-execute-button-issue-5"
  - Read data-ai-instructions: "Show agent execution confirmation dialog"
  - Click button
  - Wait for modal (data-ai-expected-result="show-modal")

STEP 6: Confirm Execution
  - Find element with data-ai-target="agent-execute-confirm-5"
  - Read data-ai-description: "Confirm agent execution and trigger API"
  - Click confirm button
  - Wait for API call (data-ai-expected-result="trigger-api")
  - Monitor for success toast (data-ai-success-criteria="Toast notification appears with 'Agent実行開始' message")

STEP 7: Verify Success
  - Check toast message: "Issue #5 のAgent実行を開始しました"
  - Report to user: "Agent execution started for Issue #5!"
```

**Metadata Used** (Agent Execute Button):
```html
<button
  data-ai-role="button"
  data-ai-action="click"
  data-ai-target="agent-execute-button-issue-5"
  data-ai-description="Show agent execution confirmation dialog for Issue #5"
  data-ai-context="issues-list"
  data-ai-expected-result="show-modal"
  data-ai-related-elements="agent-execute-dialog-5"
  data-ai-instructions="STEP 1: Click to open confirmation dialog. STEP 2: Wait for dialog to appear. STEP 3: Confirm execution by clicking confirm button."
  data-ai-next-actions="After modal opens, find and click [data-ai-target='agent-execute-confirm-5'] to trigger API call"
  data-ai-wait-condition="wait-for-modal-open"
  data-ai-success-criteria="AlertDialog appears with title 'Agent実行の確認'"
  data-ai-priority="2"
  data-ai-workflow-id="agent-execution"
  data-ai-workflow-step="1"
>
  Agent実行
</button>
```

---

## 📖 Metadata Attributes Reference

### Basic Attributes (Required)

| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `data-ai-role` | string | Element role (button, input, link, etc.) | `"button"` |
| `data-ai-target` | string | Unique identifier for AI targeting | `"github-login-button"` |
| `data-ai-description` | string | Human-readable description of what this element does | `"Initiate GitHub OAuth authentication"` |
| `data-ai-context` | string | Where this element lives (page/section context) | `"login-page"` |

### Action Attributes

| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `data-ai-action` | string | Primary action (click, type, navigate, etc.) | `"click"` |
| `data-ai-expected-result` | string | What happens after action | `"redirect"` |
| `data-ai-navigation-target` | string | Navigation destination URL | `"/dashboard"` |
| `data-ai-api-endpoint` | string | API endpoint if action triggers API call | `"/agents/execute"` |

### Autonomous Control Attributes (Extended)

| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `data-ai-instructions` | string | Step-by-step instructions for AI agent | `"STEP 1: Click button. STEP 2: Wait for redirect."` |
| `data-ai-prerequisites` | string | Required conditions before executing | `"User must be logged in"` |
| `data-ai-next-actions` | string | Recommended next steps after this action | `"Navigate to /dashboard"` |
| `data-ai-dependencies` | string (comma-separated) | Element IDs that must exist/be in certain state | `"nav-link-dashboard,user-avatar"` |
| `data-ai-wait-condition` | string | What to wait for after action | `"wait-for-redirect"` |
| `data-ai-success-criteria` | string | How to verify action succeeded | `"URL changes to /dashboard"` |
| `data-ai-error-handling` | string | Instructions for handling errors | `"If redirect fails, retry 3 times"` |
| `data-ai-retry-policy` | string | Retry strategy | `"retry-3-times-with-2s-delay"` |

### Workflow Attributes

| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `data-ai-workflow-id` | string | Workflow identifier | `"github-oauth-login"` |
| `data-ai-workflow-step` | number | Step number in workflow | `"1"` |
| `data-ai-priority` | number | Priority level (1=highest, 5=lowest) | `"1"` |
| `data-ai-selector` | string | CSS selector for AI to find this element | `"[data-ai-target='github-login-button']"` |
| `data-ai-related-elements` | string (comma-separated) | Related element IDs | `"logout-confirm-dialog"` |

---

## 🔧 Complete Operation Examples

### Example 3: Multi-Step Workflow - "Connect a Repository"

**User Intent**:
```
User: "Connect my GitHub repository 'Miyabi'"
```

**AI Agent Execution**:
```
WORKFLOW: repository-connection
PRIORITY: 2
EXPECTED DURATION: 30 seconds

--- STEP 1: Navigate to Repositories Page ---
Target: [data-ai-target="nav-link-repositories"]
Action: click
Wait: wait-for-page-load
Success: URL is /dashboard/repositories

--- STEP 2: Click "Connect Repository" Button ---
Target: [data-ai-target="connect-repository-button"]
Action: click
Wait: wait-for-modal-open
Success: Modal with title "リポジトリを接続" appears

--- STEP 3: Search for Repository ---
Target: [data-ai-target="repository-search-input"]
Action: type "Miyabi"
Wait: wait-for-search-results
Success: List of repositories with "Miyabi" in name appears

--- STEP 4: Select Repository ---
Target: [data-ai-target="repository-item-Miyabi"]
Action: click
Wait: wait-for-selection-confirmation
Success: Repository "Miyabi" is highlighted/selected

--- STEP 5: Confirm Connection ---
Target: [data-ai-target="repository-connect-confirm"]
Action: click
Wait: wait-for-api-call
Success: Toast notification "リポジトリを接続しました" appears

--- STEP 6: Verify Connection ---
Check: Repository "Miyabi" appears in connected list
Navigate: /dashboard/repositories
Verify: [data-ai-target="repository-card-Miyabi"] exists

RESULT: ✅ Repository "Miyabi" successfully connected
```

**Complete Metadata Chain** (All 6 Steps):
```html
<!-- Step 1: Navigation Link -->
<Link
  data-ai-role="link"
  data-ai-target="nav-link-repositories"
  data-ai-action="navigate"
  data-ai-description="Navigate to Repositories page"
  data-ai-expected-result="navigate-to-page"
  data-ai-navigation-target="/dashboard/repositories"
  data-ai-workflow-id="repository-connection"
  data-ai-workflow-step="1"
  data-ai-priority="2"
>
  Repositories
</Link>

<!-- Step 2: Connect Button -->
<button
  data-ai-role="button"
  data-ai-target="connect-repository-button"
  data-ai-action="click"
  data-ai-description="Open repository connection modal"
  data-ai-expected-result="show-modal"
  data-ai-workflow-id="repository-connection"
  data-ai-workflow-step="2"
  data-ai-next-actions="After modal opens, search for repository name in input field"
>
  Connect Repository
</button>

<!-- Step 3: Search Input -->
<input
  data-ai-role="input"
  data-ai-target="repository-search-input"
  data-ai-action="type"
  data-ai-description="Search for GitHub repository by name"
  data-ai-workflow-id="repository-connection"
  data-ai-workflow-step="3"
  data-ai-next-actions="After typing, wait for search results to appear, then select desired repository"
  data-ai-validation="string, min-length: 1"
/>

<!-- Step 4: Repository Item (Dynamic) -->
<div
  data-ai-role="list-item"
  data-ai-target="repository-item-Miyabi"
  data-ai-action="click"
  data-ai-description="Select repository 'Miyabi' for connection"
  data-ai-workflow-id="repository-connection"
  data-ai-workflow-step="4"
/>

<!-- Step 5: Confirm Button -->
<button
  data-ai-role="button"
  data-ai-target="repository-connect-confirm"
  data-ai-action="click"
  data-ai-description="Confirm repository connection and trigger API"
  data-ai-expected-result="trigger-api"
  data-ai-api-endpoint="/repositories/connect"
  data-ai-workflow-id="repository-connection"
  data-ai-workflow-step="5"
  data-ai-success-criteria="Toast notification appears with 'リポジトリを接続しました'"
/>
```

---

## ⚠️ Error Handling & Retry Logic

### Common Error Scenarios

#### 1. Element Not Found
```
ERROR: Element [data-ai-target="github-login-button"] not found

HANDLING:
- Wait 2 seconds for page to fully load
- Retry selector query
- If still not found after 3 retries, check if:
  - User is already on correct page (check URL)
  - Element is hidden (check display/visibility styles)
  - Element ID has changed (use fallback selector)

RECOVERY:
- Use aria-label as fallback selector
- Navigate to parent page and retry
- Report to user: "Unable to find login button. Please reload the page."
```

#### 2. Action Failed (Click/Type)
```
ERROR: Click action on [data-ai-target="logout-button-desktop"] failed

HANDLING:
- Check if element is disabled (data-ai-state="disabled")
- Check if element is covered by modal/overlay
- Wait for element to become clickable
- Retry with JavaScript click() if DOM click failed

RECOVERY:
- Retry up to 3 times with 2 second delay (data-ai-retry-policy)
- If all retries fail, report to user: "Unable to perform logout. Please try manually."
```

#### 3. Unexpected Result
```
ERROR: Expected result "redirect" but got "show-modal"

HANDLING:
- Read data-ai-expected-result attribute
- Compare with actual result
- Check if there's an error modal/toast
- Read error message from UI

RECOVERY:
- If error modal appears, read error text
- Report to user with actual error message
- Suggest alternative action from data-ai-next-actions
```

---

## 👨‍💻 AI Agent Implementation Guide

### For GPT-4 / ChatGPT Agents

#### Step 1: Page Analysis
```python
def analyze_page():
    """
    Query all elements with data-ai-* attributes
    """
    elements = document.querySelectorAll('[data-ai-target]')
    metadata_map = {}

    for element in elements:
        target = element.getAttribute('data-ai-target')
        metadata_map[target] = {
            'role': element.getAttribute('data-ai-role'),
            'action': element.getAttribute('data-ai-action'),
            'description': element.getAttribute('data-ai-description'),
            'context': element.getAttribute('data-ai-context'),
            'instructions': element.getAttribute('data-ai-instructions'),
            'next_actions': element.getAttribute('data-ai-next-actions'),
            'expected_result': element.getAttribute('data-ai-expected-result'),
            'workflow_id': element.getAttribute('data-ai-workflow-id'),
            'workflow_step': element.getAttribute('data-ai-workflow-step'),
            'priority': element.getAttribute('data-ai-priority'),
            # ... all other attributes
        }

    return metadata_map
```

#### Step 2: Intent Parsing
```python
def parse_user_intent(user_input):
    """
    Parse natural language intent into actionable goals
    """
    examples = {
        "log in": {
            "goal": "authenticate",
            "workflow": "github-oauth-login",
            "entry_point": "github-login-button"
        },
        "show my repositories": {
            "goal": "view_repositories",
            "workflow": "navigate-to-repositories",
            "entry_point": "nav-link-repositories"
        },
        "run agent on issue 5": {
            "goal": "execute_agent",
            "workflow": "agent-execution",
            "params": {"issue_number": 5},
            "entry_point": "agent-execute-button-issue-5"
        }
    }

    # Use GPT-4 to match user input to closest intent
    matched_intent = match_intent(user_input, examples)
    return matched_intent
```

#### Step 3: Workflow Execution
```python
def execute_workflow(workflow_id, metadata_map):
    """
    Execute multi-step workflow based on metadata
    """
    # Get all elements in this workflow
    workflow_steps = [
        (target, meta) for target, meta in metadata_map.items()
        if meta['workflow_id'] == workflow_id
    ]

    # Sort by workflow_step
    workflow_steps.sort(key=lambda x: int(x[1]['workflow_step']))

    # Execute each step
    for target, meta in workflow_steps:
        print(f"Executing Step {meta['workflow_step']}: {meta['description']}")

        # Read instructions
        instructions = parse_instructions(meta['instructions'])

        # Execute action
        result = execute_action(
            target=target,
            action=meta['action'],
            instructions=instructions
        )

        # Verify success
        if not verify_success(result, meta['success_criteria']):
            handle_error(meta['error_handling'], meta['retry_policy'])

        # Wait for expected result
        wait_for_condition(meta['wait_condition'])

        # Read next actions
        next_actions = parse_next_actions(meta['next_actions'])
        print(f"Next actions: {next_actions}")
```

#### Step 4: Success Verification
```python
def verify_success(result, success_criteria):
    """
    Verify action succeeded based on success criteria
    """
    criteria_checks = {
        "URL changes to /dashboard": lambda: window.location.pathname == '/dashboard',
        "Toast notification appears": lambda: document.querySelector('.toast-message') is not None,
        "Modal opens with title X": lambda: check_modal_title(X),
        # ... add more criteria checks
    }

    check_function = criteria_checks.get(success_criteria)
    if check_function:
        return check_function()
    else:
        # Fallback: check if result matches expected_result attribute
        return result == meta['expected_result']
```

---

## 🎯 Real-World Use Cases

### Use Case 1: Onboarding Flow
```
User: "I'm new, show me how to get started"

AI Agent:
1. Navigate to /login (if not logged in)
2. Guide user through GitHub OAuth
3. Navigate to /dashboard/repositories
4. Show "Connect Repository" modal
5. Explain each step with metadata descriptions
6. Wait for user to complete actions
7. Navigate to first connected repository
8. Show "Execute Agent" button
9. Explain agent functionality
```

### Use Case 2: Quick Issue Execution
```
User: "Run agent on all open issues"

AI Agent:
1. Navigate to /dashboard/repositories
2. For each connected repository:
   a. Navigate to issues page
   b. Filter by "open" state
   c. For each open issue:
      - Click "Agent実行" button
      - Confirm in dialog
      - Wait for API success
   d. Report progress to user
3. Final report: "Executed agent on 15 open issues"
```

### Use Case 3: Status Check
```
User: "What's the status of my agents?"

AI Agent:
1. Navigate to /dashboard
2. Read summary cards metadata:
   - [data-ai-target="summary-card-active-executions"]
   - [data-ai-target="summary-card-completed-today"]
   - [data-ai-target="summary-card-failed"]
3. Extract numeric values from card content
4. Report to user: "You have 3 active executions, 5 completed today, 0 failures"
```

---

## 📚 Best Practices for AI Agents

### 1. Always Read Metadata First
```javascript
// ❌ BAD: Click without understanding
document.querySelector('button').click();

// ✅ GOOD: Read metadata, understand, then execute
const button = document.querySelector('[data-ai-target="github-login-button"]');
const instructions = button.getAttribute('data-ai-instructions');
const expectedResult = button.getAttribute('data-ai-expected-result');

console.log(`About to: ${instructions}`);
button.click();
wait_for(expectedResult);
```

### 2. Follow Workflow Order
```javascript
// ✅ GOOD: Execute steps in order
const workflowSteps = getWorkflowSteps('github-oauth-login');
for (const step of workflowSteps) {
    await executeStep(step);
}
```

### 3. Verify Success Before Proceeding
```javascript
// ✅ GOOD: Verify each step
const result = await clickButton('github-login-button');
const successCriteria = button.getAttribute('data-ai-success-criteria');
if (!verifySuccess(result, successCriteria)) {
    throw new Error(`Step failed: ${successCriteria} not met`);
}
```

### 4. Handle Errors Gracefully
```javascript
// ✅ GOOD: Follow error handling instructions
const errorHandling = button.getAttribute('data-ai-error-handling');
const retryPolicy = button.getAttribute('data-ai-retry-policy');

try {
    await clickButton('github-login-button');
} catch (error) {
    handleError(error, errorHandling, retryPolicy);
}
```

---

## 🏁 Conclusion

This metadata system enables **complete autonomous control** of the Miyabi Web UI by AI agents. Users no longer need to understand "how to use the website" - the AI understands it for them and operates it automatically based on their intent.

**Key Benefits**:
- ✅ Zero user confusion - AI handles all navigation and operations
- ✅ Faster task completion - AI executes workflows instantly
- ✅ Error-proof - AI follows success criteria and retry logic
- ✅ Accessible - Users can use natural language commands
- ✅ Future-proof - New UI elements automatically work with AI agents

**Next Steps**:
1. Apply metadata to remaining pages (Dashboard, Issues, Repositories)
2. Implement AI agent examples (GPT-4 API integration)
3. Create natural language command interpreter
4. Add voice command support ("Hey Miyabi, run agent on issue 5")

---

**Document Status**: ✅ Complete
**Last Updated**: 2025-10-23
**Author**: Claude Code (AI Assistant)
**Version**: 1.0.0
