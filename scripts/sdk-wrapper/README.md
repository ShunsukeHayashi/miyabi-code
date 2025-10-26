# Miyabi SDK Wrapper - TypeScript Agent Integration

**Created**: 2025-10-26
**Version**: 1.0.0 (Week 1 Prototype)
**Status**: 🚧 Testing Phase

---

## Overview

This directory contains TypeScript implementations of Miyabi decision points using the Anthropic API SDK, replacing bash `claude -p` subprocess calls with programmatic API integration.

### Goals

1. **Type Safety**: Replace brittle JSON parsing with TypeScript types
2. **Error Handling**: Built-in retry logic and structured error handling
3. **Performance**: Direct API calls vs subprocess overhead
4. **Maintainability**: Clean TypeScript code vs bash script complexity

---

## Prerequisites

### 1. Node.js & npm
```bash
node --version  # v18+ required
npm --version
```

### 2. Anthropic API Key

Set your API key as an environment variable:

```bash
export ANTHROPIC_API_KEY="sk-ant-api03-xxx"
```

**Permanent Setup** (add to `~/.zshrc` or `~/.bashrc`):
```bash
echo 'export ANTHROPIC_API_KEY="sk-ant-api03-xxx"' >> ~/.zshrc
source ~/.zshrc
```

**Project-Local .env** (not committed to git):
```bash
# Create .env file
echo 'ANTHROPIC_API_KEY=sk-ant-api03-xxx' > .env

# Load in shell
source .env
```

### 3. GitHub CLI

```bash
gh --version  # Required for fetching Issue data
gh auth status
```

---

## Installation

```bash
cd /Users/shunsuke/Dev/miyabi-private/scripts/sdk-wrapper
npm install
```

### Dependencies

- `@anthropic-ai/sdk` - Anthropic API client
- `@anthropic-ai/claude-agent-sdk` - Agent framework (future use)
- `typescript` - TypeScript compiler
- `tsx` - TypeScript executor (faster than ts-node)
- `@types/node` - Node.js type definitions

---

## Usage

### D2: Complexity Check

**SDK Version** (TypeScript + Anthropic API):
```bash
# Set API key
export ANTHROPIC_API_KEY="sk-ant-api03-xxx"

# Run D2 complexity check on Issue #544
npm run d2 544

# Or directly with tsx
tsx src/d2-complexity-check.ts 544
```

**Bash Version** (Original):
```bash
scripts/decision-trees/D2-complexity-check.sh 544
```

### Exit Codes

| Code | Meaning | Action |
|------|---------|--------|
| 0 | Low complexity | Auto-approve, continue to D3 |
| 1 | Medium complexity | AI-assisted implementation |
| 2 | High complexity | Escalate to TechLead |
| 3 | Error | Escalate to TechLead (safety fallback) |

---

## Implementation Details

### D2: Complexity Check

**File**: `src/d2-complexity-check.ts`

**Key Improvements over Bash**:

1. **Type-Safe JSON Parsing**
   ```typescript
   // Before (bash)
   COMPLEXITY=$(echo "$RESULT" | sed -n '/```json/,/```/p' | sed '1d;$d' | jq -r '.complexity')

   // After (TypeScript)
   const result: ComplexityResult = JSON.parse(jsonText.trim());
   ```

2. **Structured Error Handling**
   ```typescript
   try {
     const result = await analyzeComplexity(issueData);
     // Success path
   } catch (error) {
     // Auto-escalation with detailed error message
     this.escalate('TechLead', `Analysis failed: ${error}`, issueNumber);
     return 3;
   }
   ```

3. **Session Logging**
   ```typescript
   // Automatic logging to /tmp/miyabi-automation/
   fs.writeFileSync(
     path.join(this.logDir, `complexity-sdk-${issueNumber}.json`),
     JSON.stringify(result, null, 2)
   );
   ```

---

## Testing

### Manual Test

```bash
# Test on a real issue
npm run d2 544

# Check logs
cat /tmp/miyabi-automation/complexity-sdk-544.json
cat /tmp/miyabi-automation/issue-544.json
```

### Compare SDK vs Bash

```bash
# Run both versions on the same issue
time scripts/decision-trees/D2-complexity-check.sh 544
time npm run d2 544

# Compare results
diff /tmp/miyabi-automation/complexity-544.json /tmp/miyabi-automation/complexity-sdk-544.json
```

### Expected Output

```
=====================================
Decision Point D2: Complexity Check (SDK)
=====================================
Issue: #544
Mode: Anthropic API (Programmatic)
Time: 2025-10-26T04:46:59.314Z

Fetching Issue #544 data...
Title: Epic: プロジェクト構造リファクタリング（Phase 4）
Labels: enhancement, ⚠️ priority:P1-High, 📚 type:docs

Running AI complexity analysis...

=====================================
Complexity Analysis Result
=====================================
Complexity: High
Estimated Files: 15
Estimated Duration: 180 minutes

Reasoning:
This is a major refactoring epic that affects project structure...

🚨 DECISION: HIGH COMPLEXITY - Human review required
→ ACTION: Escalate to TechLead
```

---

## Troubleshooting

### Error: "Could not resolve authentication method"

```bash
# Check if API key is set
echo $ANTHROPIC_API_KEY

# Set it temporarily
export ANTHROPIC_API_KEY="sk-ant-api03-xxx"

# Or add to .env file
echo 'ANTHROPIC_API_KEY=sk-ant-api03-xxx' > .env
source .env
```

### Error: "Failed to fetch Issue #X"

```bash
# Check GitHub CLI authentication
gh auth status

# Re-authenticate if needed
gh auth login
```

### TypeScript Compilation Errors

```bash
# Rebuild TypeScript
npm run build

# Check for type errors
npx tsc --noEmit
```

---

## Roadmap

### Week 1 (Current - 2025-10-26)
- [x] SDK environment setup
- [x] D2 complexity check TypeScript implementation
- [ ] Benchmarking vs bash version
- [ ] Cost tracking
- [ ] Documentation

### Week 2-3
- [ ] D1 (Label Check) SDK implementation
- [ ] D8 (Test Analysis) SDK implementation
- [ ] Session persistence layer
- [ ] Integration with autonomous-issue-processor.sh

### Week 4-5
- [ ] Rust FFI bridge (NAPI)
- [ ] OpenAI Agents SDK integration
- [ ] Hybrid routing logic (Claude vs OpenAI)

### Week 6
- [ ] End-to-end testing (Issue #270)
- [ ] Performance benchmarks
- [ ] Migration guide (bash → SDK)

---

## Cost Tracking

### Current Usage

**Model**: `claude-sonnet-4-20250514`
**Pricing**: $3 input / $15 output per 1M tokens

**D2 Complexity Check**:
- Input tokens: ~500 (prompt + issue data)
- Output tokens: ~200 (JSON response)
- **Cost per check**: ~$0.004

**Estimated Monthly Cost** (100 issues):
- D2 only: $0.40
- Full pipeline (D1 + D2 + D8): ~$1.20

**vs Bash Version**:
- Same cost (both use Claude API)
- But SDK version has better error handling and retry logic

---

## Files

```
scripts/sdk-wrapper/
├── package.json          # npm configuration
├── tsconfig.json         # TypeScript configuration
├── README.md            # This file
├── .env                 # Environment variables (gitignored)
├── src/
│   └── d2-complexity-check.ts   # D2 implementation
└── node_modules/        # Dependencies
```

---

## Next Steps

**To Complete Week 1**:
1. Set `ANTHROPIC_API_KEY` environment variable
2. Run test on Issue #544
3. Compare performance vs bash version
4. Document findings in Phase 3 progress report

**Commands**:
```bash
# 1. Set API key
export ANTHROPIC_API_KEY="sk-ant-api03-xxx"

# 2. Run SDK version
npm run d2 544

# 3. Run bash version for comparison
scripts/decision-trees/D2-complexity-check.sh 544

# 4. Check results
cat /tmp/miyabi-automation/complexity-sdk-544.json
cat /tmp/miyabi-automation/complexity-544.json
```

---

**Status**: ⚠️ Waiting for `ANTHROPIC_API_KEY` to complete testing
**Next Review**: 2025-11-02 (Week 2 kickoff)
