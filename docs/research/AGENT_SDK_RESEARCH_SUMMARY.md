# Agent SDK Research Summary - Quick Reference

**Research Date**: 2025-10-26
**Status**: ✅ Complete - Ready for Phase 3

---

## 30-Second Summary

**Recommendation**: Use **Claude Agent SDK** as primary framework + **OpenAI Agents SDK** for cost optimization

**Why Claude SDK?**
- Native fit with existing `claude -p` infrastructure
- Built-in permission system (critical for safety)
- Session persistence (critical for D3-D7 multi-step workflows)
- TypeScript + Python support → Clean Rust FFI bridge

**Why add OpenAI SDK?**
- 10x cheaper for simple tasks (GPT-4o-mini: $0.60/1M tokens vs Claude: $15/1M)
- Native multi-agent handoffs
- Future-proof (Assistants API deprecated in 2026)

**Expected Savings**: 60% cost reduction via hybrid model ($30/month → $12/month for 100 issues)

---

## Comparison Table (Essentials)

| Feature | Claude Agent SDK | OpenAI Agents SDK | Gemini |
|---------|------------------|-------------------|--------|
| **Session Persistence** | ✅ Built-in | ✅ Auto | ❌ Manual |
| **Permission System** | ✅ Fine-grained | ⚠️ Basic | ❌ None |
| **Hooks/Callbacks** | ✅ Pre/Post | ❌ No | ❌ No |
| **Rust Bridge** | ✅ TypeScript/Python | ✅ Python | ✅ Any |
| **Multi-Agent** | ⚠️ Custom | ✅ Native | ⚠️ LangGraph |
| **Cost (1M tokens)** | $15 | $0.60-$15 | $0.075-$7.50 |
| **Miyabi Fit** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |

---

## Use Cases

### Use Claude Agent SDK for:
- ✅ D2 (Complexity Check) - Requires deep reasoning
- ✅ D5 (Code Generation) - Requires codebase understanding
- ✅ D15 (Code Review) - Requires safety analysis
- ✅ Any multi-step workflow (D3-D7 implementation phase)

### Use OpenAI Agents SDK for:
- ✅ D1 (Label Check) - Simple binary validation (94x cheaper)
- ✅ D8 (Test Analysis) - Regex-based error categorization
- ✅ D11 (PR Validation) - Checklist-based review
- ✅ Parallel task orchestration (native handoffs)

### Don't Use Gemini for:
- ❌ Agent framework (no SDK, just function calling)
- ✅ Fallback LLM provider (cost optimization)
- ✅ Multimodal tasks (diagram analysis, screenshots)

---

## Phase 3 Next Steps (Week 1)

```bash
# 1. Install Claude Agent SDK
cd /Users/shunsuke/Dev/miyabi-private/scripts/sdk-wrapper
npm init -y
npm install @anthropic-ai/claude-agent-sdk
npm install @types/node typescript --save-dev

# 2. Create Rust bridge crate
cargo new --lib crates/miyabi-agent-sdk
cd crates/miyabi-agent-sdk
cargo add napi napi-derive

# 3. Port D2 (Complexity Check) to SDK
# Create scripts/sdk-wrapper/d2-complexity-check.ts
# Create crates/miyabi-agent-sdk/src/decision_points/d2.rs

# 4. Integration test
cargo test --package miyabi-agent-sdk

# 5. Benchmark vs bash script
time scripts/decision-trees/D2-complexity-check.sh 270  # Baseline
time cargo run --bin miyabi -- sdk d2-check 270         # SDK version
```

---

## Cost Estimates

### Pure Claude Approach
- 100 issues/month × $0.30/issue = **$30/month**

### Hybrid Claude + OpenAI Approach
- 60 complex issues × $0.15 (Claude) = $9
- 40 simple issues × $0.075 (OpenAI) = $3
- **Total: $12/month (60% savings)**

### Testing Budget (Phase 3)
- Prototyping: $20
- Integration tests: $15
- Benchmarks: $15
- **Total: $50**

---

## Files Created

| File | Size | Description |
|------|------|-------------|
| `docs/AGENT_SDK_COMPARISON_2025.md` | 25KB | Full comparison analysis |
| `docs/AGENT_SDK_RESEARCH_SUMMARY.md` | 3KB | This quick reference |

---

## Decision Points

**Approval Needed**:
1. ✅ Approve Claude Agent SDK as primary framework?
2. ✅ Approve hybrid Claude + OpenAI strategy?
3. ✅ Approve $50 testing budget for Phase 3?
4. ✅ Start Week 1 implementation (SDK installation + D2 port)?

**Timeline**: 6 weeks (Phase 3 complete by ~2025-12-07)

---

## References

**Full Report**: `docs/AGENT_SDK_COMPARISON_2025.md`
**Master Plan**: `docs/MIYABI_AUTONOMOUS_OPERATION_MASTER_PLAN.md`
**Phase 2 Scripts**: `scripts/README.md`

**Official Docs**:
- Claude SDK: https://docs.claude.com/en/api/agent-sdk/overview
- OpenAI SDK: https://openai.github.io/openai-agents-python/
- Gemini Function Calling: https://ai.google.dev/gemini-api/docs/function-calling

---

**Status**: ✅ Research Complete - Awaiting Approval for Phase 3 Implementation
