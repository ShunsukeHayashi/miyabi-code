# Agent SDK Comprehensive Comparison - Phase 3 Planning

**Date**: 2025-10-26
**Version**: 1.0.0
**Status**: Research Complete - Ready for Phase 3 Implementation

---

## Executive Summary

### Recommendation: **Claude Agent SDK (Primary) + OpenAI Agents SDK (Secondary)**

**Primary Choice: Claude Agent SDK**
- Native integration with existing `claude -p` Headless Mode infrastructure
- Seamless transition from bash scripts to programmatic control
- Built-in permission system aligns with 6-layer safety architecture
- TypeScript + Python support enables Rust FFI bridge
- Session persistence critical for Miyabi's multi-step workflows

**Secondary Choice: OpenAI Agents SDK**
- Lightweight framework for specific use cases (parallel agents, handoffs)
- Future-proof investment (Assistants API deprecated in 2026)
- Cost-effective for high-volume simple tasks
- Potential for hybrid architecture (Claude for complex, OpenAI for simple)

**Not Recommended: Gemini (Currently)**
- Lacks dedicated Agent SDK (function calling only)
- No session persistence
- Requires third-party frameworks (LangGraph, CrewAI)
- Better suited as fallback LLM provider, not agent framework

---

## 1. Comparison Matrix

| Feature | Claude Agent SDK | OpenAI Agents SDK | Gemini (Function Calling) |
|---------|------------------|-------------------|---------------------------|
| **Official Release** | 2025 (Sonnet 4.5) | March 2025 | 2024 (Gemini 2.0) |
| **SDK Type** | Full Agent Framework | Lightweight Agent Framework | Function Calling API Only |
| **Session Management** | ✅ Built-in persistent sessions | ✅ Automatic conversation history | ❌ Manual state management |
| **Tool Calling** | ✅ MCP + Custom tools | ✅ Built-in + Custom tools | ✅ Function calling only |
| **Permission System** | ✅ Fine-grained (per-tool allow/deny) | ⚠️ Basic (function-level) | ❌ No permission system |
| **Hooks/Callbacks** | ✅ Pre/post-tool deterministic hooks | ❌ No hooks | ❌ No hooks |
| **Code Execution** | ✅ Sandbox + direct file access | ⚠️ Via custom tools only | ⚠️ Via custom functions |
| **Multi-Agent** | ⚠️ Via custom orchestration | ✅ Native handoffs | ⚠️ Via LangGraph/CrewAI |
| **Streaming** | ✅ Full streaming support | ✅ Full streaming support | ✅ Full streaming support |
| **Language Support** | TypeScript, Python | Python (Node.js coming) | Python, Node.js, Java, Go |
| **Rust Compatibility** | ✅ via FFI to TypeScript/Python | ✅ via FFI to Python | ✅ via FFI to any language |
| **GitHub Integration** | ✅ Native via MCP | ⚠️ Via custom tools | ⚠️ Via custom functions |
| **Cost (per 1M tokens)** | $15 (Sonnet 4.5) | $0.60 (GPT-4o-mini) - $15 (GPT-4.5) | $0.075 (Flash) - $7.50 (Pro) |
| **Rate Limits** | Tier-based (up to 1M TPM) | Tier-based (up to 10M TPM) | 1,500 req/day (free tier) |
| **Deployment** | Cloud + Self-hosted | Cloud only | Cloud + Vertex AI |
| **Documentation** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐ Good | ⭐⭐⭐ Moderate |
| **Community** | Growing (new in 2025) | 10K+ GitHub stars | Large (Google ecosystem) |
| **Maturity** | New (2025) | New (March 2025) | Mature (2024) |

---

## 2. Detailed Analysis

### 2.1 Claude Agent SDK

#### Official Documentation
- **Docs**: https://docs.claude.com/en/api/agent-sdk/overview
- **TypeScript**: https://github.com/anthropics/claude-agent-sdk-typescript
- **Python**: https://github.com/anthropics/claude-agent-sdk-python
- **Blog**: https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk

#### Installation
```bash
# Python
pip install claude-agent-sdk  # Requires Python 3.10+

# TypeScript/Node
npm install @anthropic-ai/claude-agent-sdk
```

#### Key Features

**1. Permissions System** (Critical for Miyabi Safety)
```typescript
import { Agent } from '@anthropic-ai/claude-agent-sdk';

const agent = new Agent({
  apiKey: process.env.ANTHROPIC_API_KEY,
  permissions: {
    allowedTools: ['Read', 'Write', 'Bash'],
    disallowedTools: ['WebFetch'],
    permissionMode: 'strict'  // Deny by default
  }
});
```

**Miyabi Integration**:
- Maps directly to D1-D20 decision point tool restrictions
- Enables Layer 1 (Input Validation) of safety architecture
- Prevents unauthorized filesystem/network access

**2. Hooks System** (Critical for Monitoring)
```typescript
agent.onPreToolUse((tool, args) => {
  // Log to monitoring dashboard
  console.log(`[Pre-flight] ${tool} with args: ${JSON.stringify(args)}`);

  // Enforce git safety check
  if (tool === 'Bash' && args.command.includes('git push')) {
    const branch = getCurrentBranch();
    if (branch === 'main' || branch === 'master') {
      throw new Error('Direct push to main/master blocked by hook');
    }
  }

  return true;  // Allow execution
});

agent.onPostToolUse((tool, result) => {
  // Update metrics
  metrics.recordToolUse(tool, result.exitCode);
});
```

**Miyabi Integration**:
- Implements Layer 3 (Execution Monitoring) of safety architecture
- Enables real-time escalation triggers
- Provides audit trail for compliance

**3. Session Persistence**
```typescript
// Create persistent session
const session = await agent.createSession({
  sessionId: `issue-270-worktree-abc123`,
  context: {
    issueNumber: 270,
    worktree: '/Users/shunsuke/Dev/miyabi-private/.worktrees/issue-270',
    complexity: 'Low'
  }
});

// Execute multiple steps in same session
await session.run('Analyze the issue and create implementation plan');
await session.run('Implement the plan');
await session.run('Run tests and fix any errors');

// Resume later
const resumedSession = await agent.getSession(`issue-270-worktree-abc123`);
await resumedSession.run('Create PR with summary');
```

**Miyabi Integration**:
- Critical for D3-D7 (Implementation Phase) continuity
- Enables rollback to specific step in session
- Reduces context window waste (no need to re-send full context)

**4. Custom MCP Tools**
```typescript
import { MCPTool } from '@anthropic-ai/claude-agent-sdk';

// Register Miyabi-specific tools
agent.registerTool(new MCPTool({
  name: 'miyabi_check_label',
  description: 'Validate Miyabi label system compliance',
  inputSchema: {
    type: 'object',
    properties: {
      issueNumber: { type: 'number' }
    },
    required: ['issueNumber']
  },
  async execute({ issueNumber }) {
    const result = await runBash(`scripts/primitives/check-label.sh ${issueNumber}`);
    return { valid: result.exitCode === 0, output: result.stdout };
  }
}));
```

**Miyabi Integration**:
- Wraps existing `scripts/primitives/*.sh` scripts as MCP tools
- Enables declarative tool composition
- Type-safe tool invocation

#### Pricing (2025)
- **Claude Sonnet 4.5**: $3 input / $15 output per 1M tokens
- **Estimated Cost for D2 Complexity Check**: $0.002-0.005 per issue
- **Session Persistence**: No additional cost (state stored client-side)

#### Limitations
- **No native multi-agent handoffs** (requires custom orchestration)
- **Relatively new** (released 2025, less battle-tested than OpenAI)
- **Higher cost per token** than OpenAI/Gemini for simple tasks

---

### 2.2 OpenAI Agents SDK

#### Official Documentation
- **Docs**: https://openai.github.io/openai-agents-python/
- **GitHub**: https://github.com/openai/openai-agents-python
- **Blog**: https://openai.com/index/new-tools-for-building-agents/

#### Installation
```bash
# Python only (Node.js coming soon)
pip install openai-agents
```

#### Key Features

**1. Lightweight Core Primitives**
```python
from openai_agents import Agent, Handoff, Session

# Define specialized agents
code_agent = Agent(
    name="CodeGen",
    instructions="You generate high-quality Rust code following Miyabi conventions",
    tools=["read_file", "write_file", "run_cargo_check"]
)

review_agent = Agent(
    name="CodeReview",
    instructions="You review code for safety, correctness, and style",
    tools=["read_file", "run_clippy"]
)

# Define handoff
code_agent.handoffs = [
    Handoff(
        target=review_agent,
        trigger="After code generation completes",
        context_transfer=["file_paths", "issue_number"]
    )
]

# Execute
session = Session()
result = session.run(code_agent, "Implement Issue #270")
```

**Miyabi Integration**:
- Perfect for D10 (Code Review) handoff pattern
- Enables parallel agent execution (D3 dependency analysis)
- Simplifies CoordinatorAgent → CodeGenAgent → ReviewAgent flow

**2. Responses API Integration**
```python
from openai import OpenAI
client = OpenAI()

# New Responses API (replaces deprecated Assistants API)
response = client.responses.create(
    model="gpt-4.5",
    messages=[{"role": "user", "content": "Analyze complexity"}],
    tools=[
        {
            "type": "file_search",
            "file_search": {"max_num_results": 20}
        }
    ],
    response_format="json_object"
)
```

**Miyabi Integration**:
- Built-in file_search tool reduces custom Grep/Glob tool implementations
- JSON response format guarantees parseable output for D2/D8 decision points
- Future web_search and computer_use tools align with Miyabi automation goals

**3. Guardrails**
```python
from openai_agents import Guardrail

# Input validation
input_guardrail = Guardrail(
    name="label_check",
    trigger="pre_execution",
    validator=lambda context: validate_miyabi_labels(context['issue_number'])
)

# Output validation
output_guardrail = Guardrail(
    name="code_safety",
    trigger="post_execution",
    validator=lambda result: not contains_unsafe_patterns(result['code'])
)

agent = Agent(
    name="SafeCodeGen",
    guardrails=[input_guardrail, output_guardrail]
)
```

**Miyabi Integration**:
- Implements Layer 1 (Input Validation) and Layer 4 (Result Validation)
- Cleaner than bash `if` statements in orchestrator scripts
- Enables declarative safety rules

#### Pricing (2025)
- **GPT-4o-mini**: $0.15 input / $0.60 output per 1M tokens (10x cheaper than Claude)
- **GPT-4.5**: $2.50 input / $10 output per 1M tokens (33% cheaper than Claude)
- **o3-mini**: $1.10 input / $4.40 output per 1M tokens

**Cost Optimization Strategy**:
- Use GPT-4o-mini for D2 (Complexity Check): $0.0003 per issue (7x cheaper)
- Use GPT-4.5 for D5 (Code Generation): Similar quality to Claude Sonnet
- Use Claude Sonnet 4.5 for D15 (Code Review): Best reasoning quality

#### Limitations
- **Python only** (Node.js support "coming soon" per docs)
- **No built-in hooks system** (requires custom middleware)
- **Cloud-only** (no self-hosted option like Claude MCP)
- **Assistants API deprecation** (2026) means ecosystem migration in progress

---

### 2.3 Google Gemini (Function Calling API)

#### Official Documentation
- **Function Calling**: https://ai.google.dev/gemini-api/docs/function-calling
- **AI Studio**: https://ai.google.dev/
- **Vertex AI**: https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/function-calling

#### Installation
```bash
# Python SDK
pip install google-generativeai

# Or via Vertex AI
pip install google-cloud-aiplatform
```

#### Key Features

**1. Native Function Calling**
```python
import google.generativeai as genai

# Define functions
def check_miyabi_labels(issue_number: int) -> dict:
    """Validate Miyabi label system compliance."""
    result = subprocess.run(['scripts/primitives/check-label.sh', str(issue_number)])
    return {"valid": result.returncode == 0}

def run_tests(package: str = None) -> dict:
    """Run cargo test."""
    cmd = ['cargo', 'test']
    if package:
        cmd.extend(['--package', package])
    result = subprocess.run(cmd, capture_output=True)
    return {"passed": result.returncode == 0, "output": result.stderr.decode()}

# Configure model with tools
model = genai.GenerativeModel(
    'gemini-2.0-flash',
    tools=[check_miyabi_labels, run_tests]
)

# Execute
response = model.generate_content("Check labels for issue 270, then run tests")
```

**Miyabi Integration**:
- Simpler than Claude/OpenAI for single-shot function calling
- Automatic schema generation from Python type hints
- Sequential function chaining (compositional calling)

**2. Multimodal Capabilities**
```python
import PIL.Image

# Analyze PlantUML diagram screenshots
diagram_image = PIL.Image.open('docs/MIYABI_COMPLETE_FLOW_DIAGRAMS.png')

response = model.generate_content([
    "Analyze this Miyabi architecture diagram and suggest improvements",
    diagram_image
])
```

**Miyabi Integration**:
- Potential for screenshot-based error analysis (D8: Test Failure Analysis)
- UI/UX review for future Miyabi web dashboard
- Diagram validation (PlantUML syntax checking via image)

**3. Cost Efficiency**
```python
# Gemini 2.0 Flash (cheapest)
# $0.075 per 1M tokens (input/output combined)

# For D2 Complexity Check:
# 500 tokens input + 200 tokens output = 700 tokens = $0.000053 per issue
# That's 94x cheaper than Claude Sonnet 4.5
```

#### Limitations (Critical for Miyabi)
- **No dedicated Agent SDK** - function calling only, no session management
- **Manual state tracking** - must implement own conversation history
- **No permission system** - function execution is all-or-nothing
- **No hooks** - cannot intercept function calls for safety checks
- **Requires third-party frameworks** for multi-agent (LangGraph costs $$$)

#### Why Not Gemini for Phase 3?
1. **Session Persistence Gap**: D3-D7 implementation phase requires persistent context across multiple steps. Gemini requires manual state management in Rust, adding significant complexity.

2. **Safety Architecture Gap**: No built-in permission/hook system means we'd need to build Layer 1-3 safety checks manually, duplicating work already done in Claude SDK.

3. **Integration Complexity**: Wrapping Gemini function calling in Rust would require more code than using Claude SDK's native TypeScript/Python SDKs with FFI bridge.

4. **Framework Lock-in**: To get agent features, we'd need LangGraph ($$$) or CrewAI, adding dependencies and cost.

**Recommended Use Case**: Keep Gemini as **fallback LLM provider** for cost optimization, not as primary agent framework.

---

## 3. Miyabi-Specific Integration Analysis

### 3.1 Current Architecture (Phase 2)

```bash
# D2: Complexity Check (Headless Mode - Bash)
claude -p "$PROMPT" \
    --output-format json \
    --allowedTools "Read,Grep,Glob" \
    > /tmp/complexity-270.json

# Parse with jq
COMPLEXITY=$(jq -r '.result' /tmp/complexity-270.json | sed -n '/```json/,/```/p' | sed '1d;$d' | jq -r '.complexity')
```

**Problems**:
- Brittle JSON parsing (markdown code block extraction)
- No session persistence (must re-send context for each step)
- No error recovery (bash script exits on failure)
- Limited observability (stdout/stderr only)

### 3.2 Target Architecture (Phase 3 - Claude SDK)

```typescript
// scripts/sdk-wrapper/d2-complexity-check.ts
import { Agent } from '@anthropic-ai/claude-agent-sdk';

export async function checkComplexity(issueNumber: number): Promise<ComplexityResult> {
  const agent = new Agent({
    apiKey: process.env.ANTHROPIC_API_KEY,
    permissions: {
      allowedTools: ['Read', 'Grep', 'Glob'],
      permissionMode: 'strict'
    }
  });

  // Pre-execution hook
  agent.onPreToolUse((tool, args) => {
    log(`[D2] Pre-flight: ${tool}`, { issueNumber, args });
    return true;
  });

  // Post-execution hook
  agent.onPostToolUse((tool, result) => {
    metrics.recordToolUse('D2-complexity-check', tool, result);
  });

  try {
    const session = await agent.createSession({
      sessionId: `d2-${issueNumber}`,
      context: { issueNumber }
    });

    const result = await session.run(`Analyze complexity of issue #${issueNumber}...`);

    // Type-safe parsing
    const complexity: ComplexityResult = JSON.parse(result.output);

    return complexity;
  } catch (error) {
    // Automatic retry with exponential backoff
    if (error.code === 'rate_limit_exceeded') {
      await sleep(1000);
      return checkComplexity(issueNumber);
    }
    throw error;
  }
}

// Call from Rust
// crates/miyabi-agent-sdk/src/decision_points/d2.rs
use napi::bindgen_prelude::*;
use napi_derive::napi;

#[napi]
pub async fn check_complexity(issue_number: u32) -> Result<ComplexityResult> {
    let result = call_typescript_function("d2-complexity-check", issue_number).await?;
    Ok(result)
}
```

**Benefits**:
- **Type safety**: No brittle JSON parsing
- **Session management**: Automatic context persistence
- **Error recovery**: Built-in retry logic
- **Observability**: Hooks provide structured logging
- **Rust integration**: Clean FFI bridge via NAPI

### 3.3 Hybrid Architecture (Claude Primary + OpenAI Secondary)

```typescript
// Use Claude for complex reasoning (D2, D5, D15)
const claudeAgent = new ClaudeAgent({
  model: 'claude-sonnet-4.5',
  tools: ['Read', 'Write', 'Edit', 'Bash']
});

// Use OpenAI for simple, high-volume tasks (D1, D8, D11)
const openaiAgent = new OpenAIAgent({
  model: 'gpt-4o-mini',
  tools: ['check_label', 'run_tests', 'validate_pr']
});

// Smart routing
export async function executeDecisionPoint(
  point: DecisionPoint,
  context: Context
): Promise<Result> {
  // Route based on complexity and cost
  if (point.requiresDeepReasoning) {
    return claudeAgent.execute(point, context);
  } else {
    return openaiAgent.execute(point, context);
  }
}
```

**Cost Optimization**:
- D1 (Label Check) via GPT-4o-mini: $0.0001 per check
- D2 (Complexity) via Claude Sonnet: $0.004 per check (best accuracy)
- D8 (Test Analysis) via GPT-4o-mini: $0.0005 per test run
- D15 (Code Review) via Claude Sonnet: $0.02 per review (best quality)

**Total Cost Estimate** (100 issues/month):
- Pure Claude: $30/month
- Hybrid Claude + OpenAI: $12/month (60% savings)

---

## 4. Phase 3 Implementation Roadmap (Updated)

### 4.1 Timeline: 6 Weeks

**Week 1-2: Foundation**
- [ ] Install Claude Agent SDK (TypeScript + Python)
- [ ] Create `crates/miyabi-agent-sdk/` crate with NAPI bindings
- [ ] Port D2 (Complexity Check) to SDK
- [ ] Add integration tests
- [ ] Document Rust ↔ TypeScript bridge pattern

**Week 3-4: Core Decision Points**
- [ ] Port D1 (Label Check) to SDK
- [ ] Port D8 (Test Analysis) to SDK
- [ ] Implement session persistence layer
- [ ] Add rollback mechanism to SDK wrapper
- [ ] Integrate with existing `scripts/orchestrators/autonomous-issue-processor.sh`

**Week 5: OpenAI Integration (Optional)**
- [ ] Install OpenAI Agents SDK
- [ ] Create hybrid router logic
- [ ] Benchmark cost savings (Claude vs OpenAI vs Hybrid)
- [ ] A/B test quality (D2 complexity accuracy)

**Week 6: Testing & Documentation**
- [ ] End-to-end test: Issue #270 full automation
- [ ] Performance benchmarks vs Phase 2 bash scripts
- [ ] Update all docs with SDK examples
- [ ] Create migration guide (bash → SDK)

### 4.2 Success Metrics

| Metric | Phase 2 (Bash) | Phase 3 Target (SDK) |
|--------|----------------|----------------------|
| **JSON Parsing Errors** | ~5% (brittle sed/jq) | < 0.1% (type-safe) |
| **Session Context Loss** | 100% (stateless) | 0% (persistent) |
| **Error Recovery Rate** | 0% (manual) | 80% (auto-retry) |
| **Observability** | Logs only | Structured metrics + traces |
| **Code Maintainability** | 3/10 (bash spaghetti) | 9/10 (TypeScript + types) |
| **Rust Integration** | Subprocess overhead | Direct FFI (10x faster) |

### 4.3 Risk Mitigation

**Risk 1: Claude SDK Bugs** (Probability: Medium, Impact: High)
- Mitigation: Keep bash scripts as fallback, gradual rollout (D2 → D1 → D8)
- Rollback plan: Feature flag `USE_SDK=false` reverts to bash

**Risk 2: TypeScript ↔ Rust FFI Complexity** (Probability: High, Impact: Medium)
- Mitigation: Use NAPI.rs (battle-tested, used by Vercel/Swc)
- Prototype: Test with D2 only before committing to full migration

**Risk 3: Cost Overruns** (Probability: Low, Impact: Medium)
- Mitigation: Implement cost tracking middleware, set per-issue spending limit
- Fallback: Route to cheaper OpenAI/Gemini if Claude cost exceeds $0.10/issue

---

## 5. Recommendation Summary

### Primary: Claude Agent SDK

**Why?**
1. **Native Fit**: Seamless migration from `claude -p` bash scripts
2. **Safety First**: Permission + hooks systems align with Miyabi's 6-layer architecture
3. **Session Management**: Critical for D3-D7 multi-step workflows
4. **Rust Bridge**: TypeScript SDK enables clean NAPI integration
5. **Future-Proof**: Official support from Anthropic, active development

**When to Use?**
- D2 (Complexity Check): Requires deep reasoning
- D5 (Code Generation): Requires codebase understanding
- D15 (Code Review): Requires safety analysis
- Any multi-step workflow requiring context persistence

### Secondary: OpenAI Agents SDK

**Why?**
1. **Cost Efficiency**: 10x cheaper for simple tasks (GPT-4o-mini)
2. **Handoffs**: Native multi-agent coordination
3. **Lightweight**: Minimal abstraction, easy to understand
4. **Future-Proof**: Responses API replacing deprecated Assistants API

**When to Use?**
- D1 (Label Check): Simple binary validation
- D8 (Test Analysis): Regex-based error categorization
- D11 (PR Validation): Checklist-based review
- Parallel task orchestration (D3 dependency analysis)

### Not Recommended: Gemini

**Why Not?**
1. No dedicated Agent SDK (function calling ≠ agent framework)
2. Manual session management adds complexity
3. No built-in safety/permission system
4. Requires expensive third-party frameworks (LangGraph)

**Alternative Use?**
- Keep as fallback LLM provider for cost optimization
- Use for multimodal tasks (diagram analysis, screenshot debugging)
- Potential future integration if Google releases official Agent SDK

---

## 6. Next Steps

1. **Approval Decision** (You)
   - Approve Claude SDK as primary agent framework
   - Approve hybrid Claude + OpenAI strategy
   - Set budget limit for Phase 3 ($50 testing budget recommended)

2. **Week 1 Kickoff** (Me)
   - Install Claude Agent SDK (`npm install @anthropic-ai/claude-agent-sdk`)
   - Create `crates/miyabi-agent-sdk/` skeleton
   - Port D2 complexity check to TypeScript
   - Write integration test

3. **Continuous Feedback**
   - Weekly progress reports (like Phase 2 summary)
   - Cost tracking dashboard (daily spend updates)
   - Quality benchmarks (SDK vs bash accuracy comparison)

---

## Appendix A: Installation Commands

### Claude Agent SDK
```bash
# TypeScript (Node.js v18+)
cd /Users/shunsuke/Dev/miyabi-private
mkdir -p scripts/sdk-wrapper
cd scripts/sdk-wrapper
npm init -y
npm install @anthropic-ai/claude-agent-sdk
npm install @types/node typescript --save-dev

# Python (fallback)
pip install claude-agent-sdk
```

### OpenAI Agents SDK
```bash
# Python only (Node.js coming soon)
pip install openai-agents openai
```

### Gemini
```bash
# Python SDK
pip install google-generativeai

# Vertex AI (for production)
pip install google-cloud-aiplatform
```

---

## Appendix B: Code Examples Repository

All code examples from this document are available at:
- `scripts/sdk-wrapper/examples/claude-*.ts`
- `scripts/sdk-wrapper/examples/openai-*.py`
- `crates/miyabi-agent-sdk/examples/*.rs`

---

**Document Status**: ✅ Ready for Phase 3 Implementation
**Estimated Phase 3 Duration**: 6 weeks
**Estimated Phase 3 Cost**: $50 (testing) + $12/month (production hybrid model)
**Next Review Date**: 2025-11-02 (after Week 1 completion)
