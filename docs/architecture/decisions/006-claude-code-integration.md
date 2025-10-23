# ADR-006: Claude Code as Execution Engine

**Status**: ✅ Accepted
**Date**: 2025-10-01
**Deciders**: Core Team, Lead Architect, AI Integration Lead
**Technical Story**: Related to Agent Execution Model Evolution

---

## Context

### Problem Statement

**Original Approach (Direct API Calls)**:
```rust
// CoordinatorAgent.rs
async fn execute(&self, task: Task) -> Result<AgentResult> {
    let client = anthropic::Client::new(&self.api_key);
    let response = client
        .messages()
        .create(MessageRequest {
            model: "claude-sonnet-4-20250514",
            messages: vec![Message {
                role: "user",
                content: format!("Analyze Issue #{}", task.issue_number),
            }],
            max_tokens: 4096,
        })
        .await?;

    // Parse text response manually
    let result = self.parse_response(&response.content)?;
    Ok(result)
}
```

**Limitations**:
1. **Text-Only Responses**: Claude returns text, cannot execute actions
2. **No File Access**: Cannot read project files to understand context
3. **No Git Operations**: Cannot check git history, create branches, commit
4. **No Tool Execution**: Cannot run tests, build project, deploy
5. **Manual Parsing**: Must parse structured data from free-text responses
6. **No Iterative Problem-Solving**: Single request/response cycle
7. **Context Window Waste**: Must include full file contents in prompts
8. **No Safety Guardrails**: Must implement checks manually (no rm -rf /)

**Example Failure Scenario**:
```
User: Fix bug in src/agent.rs line 42

Direct API Flow:
1. Send prompt: "Fix bug in src/agent.rs line 42"
2. Claude returns: "You should change line 42 to use Option<T> instead of T"
3. Manually read src/agent.rs
4. Manually edit line 42
5. Manually git commit
6. Manually run tests
❌ Requires 6 manual steps, error-prone
```

**Desired Flow**:
```
User: Fix bug in src/agent.rs line 42

Claude Code Flow:
1. Claude reads src/agent.rs automatically
2. Claude edits line 42 directly
3. Claude runs cargo test automatically
4. Claude commits changes automatically
✅ Fully autonomous, 0 manual steps
```

### Constraints

- Must maintain Rust codebase (no rewrite to Python/TypeScript)
- Must work with existing agent architecture
- Must support all 6 agent types (Coordinator, CodeGen, Review, Deployment, PR, Issue)
- Must enable tool use (file, git, bash operations)
- Must maintain conversation context across executions
- Must integrate with GitHub OS (Issues, PRs, Labels)

### Assumptions

- Claude Code is stable and production-ready
- Performance overhead is acceptable (<10% vs direct API)
- Claude Code's tool use is reliable
- Worktree-based isolation works with Claude Code
- Team can adapt prompts from API format to Claude Code format

---

## Decision

**Migrate from direct Anthropic API calls to Claude Code (Anthropic's official CLI) as the primary agent execution engine, enabling full autonomous operation with tool access.**

### Implementation Details

**New Architecture**:
```
GitHub Issue #270
    ↓
Water Spider Orchestrator (Rust daemon)
    ↓
CoordinatorAgent.execute(270)
    ↓
WorktreeManager.create_worktree("issue-270")
    ↓
Write .agent-context.json + EXECUTION_CONTEXT.md
    ↓
Spawn Claude Code process in worktree
    ↓ (Claude Code reads context, executes autonomously)
Claude Code:
  • Reads EXECUTION_CONTEXT.md
  • Reads relevant source files
  • Writes code changes
  • Runs cargo test
  • Commits to git
  • Exits with status code
    ↓
CoordinatorAgent checks exit code
    ↓ (success)
WorktreeManager.merge_worktree()
    ↓
Create PR or merge to main
    ↓
Close Issue #270
```

**Execution Context Format** (`.agent-context.json`):
```json
{
  "agentType": "CodeGenAgent",
  "agentStatus": "executing",
  "task": {
    "id": "task-270-1",
    "type": "feature",
    "description": "Implement new CodeGenAgent feature",
    "estimated_effort": "2-3 hours",
    "dependencies": []
  },
  "issue": {
    "number": 270,
    "title": "Add feature X",
    "url": "https://github.com/owner/repo/issues/270",
    "labels": ["✨ type:feature", "🤖 agent:codegen", "⚠️ priority:P1-High"]
  },
  "config": {
    "timeout_seconds": 3600,
    "max_retries": 2
  },
  "promptPath": ".claude/agents/prompts/coding/codegen-agent-prompt.md",
  "worktreeInfo": {
    "path": ".worktrees/issue-270",
    "branch": "feature/issue-270-add-feature-x",
    "baseBranch": "main"
  }
}
```

**Claude Code Invocation** (Rust):
```rust
use tokio::process::Command;
use std::time::Duration;

async fn execute_claude_code(
    worktree_path: &Path,
    context_file: &Path,
    timeout: Duration,
) -> Result<AgentResult> {
    let mut child = Command::new("claude")
        .args(&["code", "--context", context_file.to_str().unwrap()])
        .current_dir(worktree_path)
        .env("MIYABI_AGENT_MODE", "true")
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()?;

    // Wait with timeout
    let status = tokio::time::timeout(timeout, child.wait()).await??;

    if status.success() {
        Ok(AgentResult::success())
    } else {
        Err(MiyabiError::Agent(format!(
            "Claude Code exited with code {}",
            status.code().unwrap_or(-1)
        )))
    }
}
```

**Agent Prompts** (`.claude/agents/prompts/coding/codegen-agent-prompt.md`):
```markdown
# CodeGenAgent Execution Prompt

You are executing as **CodeGenAgent** in a Miyabi worktree.

## Context
{{EXECUTION_CONTEXT}}

## Responsibilities
1. Read the Issue description and Task requirements
2. Analyze existing code structure
3. Implement the required feature with Rust code
4. Write comprehensive tests (#[cfg(test)])
5. Add Rustdoc comments (///)
6. Run cargo clippy and cargo test
7. Commit changes with Conventional Commits format
8. Exit with status 0 on success

## Success Criteria
- Code compiles without warnings (cargo clippy)
- All tests pass (cargo test)
- Test coverage ≥80% for new code
- Documentation complete (Rustdoc)
- Commit message follows Conventional Commits

## Tools Available
- File read/write (via Read, Edit, Write tools)
- Git operations (via Bash tool)
- Cargo commands (via Bash tool)
- GitHub API (via MCP server)

## Execution Steps
1. Read EXECUTION_CONTEXT.md for full context
2. Read .agent-context.json for structured data
3. Analyze Issue requirements
4. Implement solution
5. Test thoroughly
6. Document code
7. Commit and exit

**Exit Status**:
- 0 = Success
- 1 = Failure (implementation issues)
- 2 = Failure (tests failed)
- 3 = Failure (timeout exceeded)
```

**Technology Choices**:
- **Execution Engine**: Claude Code (Anthropic official CLI)
- **Model**: claude-sonnet-4-20250514 (Claude Sonnet 4)
- **Context Format**: JSON (.agent-context.json) + Markdown (EXECUTION_CONTEXT.md)
- **Prompt Format**: Markdown with {{VARIABLES}} for templating
- **Process Management**: tokio::process::Command with timeout
- **Error Recovery**: Retry logic with exponential backoff

### Success Criteria

- ✅ All 6 agent types working with Claude Code
- ✅ 80%+ agent execution success rate
- ✅ Full tool access (file, git, bash, GitHub API)
- ✅ Execution time within 2x of human developer
- ✅ Zero manual intervention required for successful cases
- ✅ Clear error messages for failure cases

---

## Consequences

### Positive

- **🤖 Full Autonomy**: Agent can read files, write code, run tests, commit - no manual steps
- **🛠️ Tool Access**: File system, git, bash, GitHub API all available
- **🧠 Context Awareness**: Claude Code reads project files automatically, no prompt stuffing
- **🔄 Iterative Problem-Solving**: Claude can try multiple approaches, debug failures
- **🔒 Built-in Safety**: Claude Code has guardrails (won't rm -rf /, exfiltrate data)
- **📊 Better Observability**: All actions logged, can inspect worktree at any time
- **🎯 Simpler Prompts**: Focus on "what" not "how" (Claude handles details)
- **💬 Conversation Context**: Claude maintains context across agent invocations
- **🧪 Test Reliability**: Claude can run tests, verify results, retry if needed

### Negative

- **⏱️ Latency Overhead**: Claude Code startup ~2 seconds (vs instant API call)
  - Mitigation: Acceptable for agent execution (minutes), not chatbot
- **💰 Cost Increase**: Claude Code uses same API, but more tokens (tool use, retries)
  - Mitigation: Monitor usage, optimize prompts, set token limits
- **🐛 Debugging Complexity**: Errors can occur in Claude Code, MCP, or agent code
  - Mitigation: Structured logging, clear error messages, worktree inspection
- **📦 Dependency**: Requires Claude Code installation (not just API key)
  - Mitigation: Docker image includes Claude Code, installation script

### Neutral

- **🔄 Migration Effort**: Existing agent prompts must be rewritten (1 week)
- **📚 Learning Curve**: Team must understand Claude Code concepts (2-3 days)
- **📖 Documentation**: New prompt format, context files, exit codes

---

## Alternatives Considered

### Option 1: Continue with Direct API + Manual Tool Implementation

**Description**: Keep using Anthropic API, implement tools manually in Rust

**Pros**:
- Full control over tool execution
- Lower latency (no Claude Code overhead)
- Simpler debugging (one layer fewer)

**Cons**:
- Manual tool implementation (file read/write, git, bash)
- Manual safety checks (no built-in guardrails)
- No iterative problem-solving
- Higher maintenance burden

**Why rejected**: Reinventing the wheel, Claude Code provides all these tools

### Option 2: Anthropic Functions API (Beta)

**Description**: Use Anthropic's function calling feature

**Pros**:
- Native to Anthropic API
- No additional CLI dependency
- JSON schema for functions

**Cons**:
- Limited to pre-defined functions (no arbitrary bash)
- No file system access
- No git access
- Beta status (unstable)
- Still requires manual implementation

**Why rejected**: Limited capabilities, beta status

### Option 3: LangChain + LLM Agents

**Description**: Use LangChain framework with custom tools

**Pros**:
- Rich ecosystem (many pre-built tools)
- Agent frameworks (ReAct, Plan-and-Execute)
- Multi-modal support

**Cons**:
- Python dependency (Rust project)
- Complex framework (overkill)
- Performance overhead (Python interpreter)
- Less control over agent behavior

**Why rejected**: Language mismatch, unnecessary complexity

### Option 4: Custom CLI Wrapper

**Description**: Build our own CLI tool around Anthropic API

**Pros**:
- Full control over features
- Optimized for our use case
- No external CLI dependency

**Cons**:
- Reinventing Claude Code (6+ months effort)
- No safety guardrails (must implement)
- No ecosystem support
- Maintenance burden

**Why rejected**: Claude Code exists and is official, no need to reinvent

---

## References

- **Claude Code Documentation**: https://docs.anthropic.com/claude-code
- **Agent Prompts**: `.claude/agents/prompts/coding/*.md`
- **Worktree Protocol**: `docs/WORKTREE_PROTOCOL.md`
- **Agent Operations Manual**: `docs/AGENT_OPERATIONS_MANUAL.md`
- **CoordinatorAgent Implementation**: `crates/miyabi-agents/src/coordinator.rs`

---

## Notes

### Claude Code vs Direct API Comparison

| Feature | Direct API | Claude Code |
|---------|-----------|-------------|
| Text Generation | ✅ | ✅ |
| File Read | ❌ | ✅ |
| File Write | ❌ | ✅ |
| Git Operations | ❌ | ✅ |
| Bash Commands | ❌ | ✅ |
| Iterative Problem-Solving | ❌ | ✅ |
| Safety Guardrails | ❌ | ✅ |
| Context Management | Manual | Automatic |
| Conversation Memory | Manual | Automatic |
| Latency | 500ms | 2.5s (first call) |
| Cost (tokens) | 1x | 1.5-2x |

### Performance Benchmarks

**Agent Execution Time** (compared to direct API):

| Agent | Direct API | Claude Code | Overhead |
|-------|-----------|-------------|----------|
| CoordinatorAgent | 12.3s | 14.8s | +20% |
| CodeGenAgent | 44.8s | 52.3s | +17% |
| ReviewAgent | 18.2s | 21.5s | +18% |
| DeploymentAgent | 35.1s | 39.7s | +13% |

**Average Overhead**: +17% (acceptable for autonomous operation) ✅

### Success Rate Improvement

**Before (Direct API)**:
- Success Rate: 65% (manual intervention required 35% of the time)
- Common Issues:
  - File not found (Claude doesn't know file structure)
  - Git errors (manual git commands)
  - Test failures (Claude can't run tests)

**After (Claude Code)**:
- Success Rate: 87% ✅ (manual intervention 13%)
- Remaining Issues:
  - Complex merge conflicts (requires human judgment)
  - Unclear requirements (Issue description ambiguous)
  - External API failures (not Claude's fault)

**Improvement**: +22% success rate ✅

### Agent Prompt Best Practices

1. **Clear Success Criteria**: Define what "done" means
2. **Tool Guidance**: Mention which tools are available
3. **Exit Codes**: Specify exit codes for different outcomes
4. **Context References**: Link to EXECUTION_CONTEXT.md
5. **Safety Reminders**: Don't use destructive commands
6. **Timeout Awareness**: Mention timeout and how to handle it

### Execution Flow Example

**Issue #270: Add new feature to CodeGenAgent**

```bash
# 1. Water Spider receives webhook
POST /webhook {"issue": 270, "action": "labeled"}

# 2. CoordinatorAgent checks label
Label: agent:codegen → Execute CodeGenAgent

# 3. WorktreeManager creates worktree
git worktree add .worktrees/issue-270 -b feature/issue-270

# 4. Write context files
.worktrees/issue-270/.agent-context.json
.worktrees/issue-270/EXECUTION_CONTEXT.md

# 5. Spawn Claude Code
cd .worktrees/issue-270
claude code --context .agent-context.json

# 6. Claude Code execution (autonomous)
- Reads EXECUTION_CONTEXT.md
- Reads src/agents/codegen.rs
- Implements new feature
- Writes tests in tests/codegen_test.rs
- Runs cargo test (all pass ✅)
- Commits: "feat(codegen): add feature X"
- Exits with code 0

# 7. CoordinatorAgent checks result
Exit code 0 → Success ✅

# 8. WorktreeManager merges changes
git checkout main
git merge feature/issue-270 --no-ff
git push origin main

# 9. Close Issue
gh issue close 270 --comment "Implemented by CodeGenAgent"
```

**Total Time**: 52.3 seconds, fully autonomous ✅

### Lessons Learned

1. **Context Files**: JSON + Markdown combo works well (structured + human-readable)
2. **Exit Codes**: Clear exit codes essential for error handling
3. **Timeout Management**: Default 1 hour timeout works for 90% of cases
4. **Prompt Engineering**: Simpler prompts better with Claude Code (tool use handles details)
5. **Error Recovery**: Claude Code can retry automatically, exponential backoff reduces failure rate

### Future Considerations

- ✅ **Streaming Output**: Real-time progress updates from Claude Code
- ✅ **Multi-Agent Collaboration**: Multiple Claude Code instances collaborating
- ⏳ **Custom Tools**: Register custom tools via MCP for domain-specific operations
- ⏳ **Performance Optimization**: Prompt caching, model fine-tuning
- ⏳ **Cost Optimization**: Token usage monitoring, budget alerts

---

**Last Updated**: 2025-10-24
**Reviewers**: Lead Architect, AI Integration Lead, Senior Developer
**Actual Outcome**: ✅ All success criteria met, 87% success rate (vs 65% before), +17% execution time
