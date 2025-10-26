# Phase 3 Production Deployment Checklist

**Version**: 1.0.0
**Date**: 2025-10-26
**Status**: Ready for Deployment ✅

---

## Pre-Deployment Checklist

### 1. Environment Setup

- [ ] **Node.js & npm Installed**
  ```bash
  node --version  # >= v18.0.0
  npm --version   # >= v9.0.0
  ```

- [ ] **Rust & Cargo Updated**
  ```bash
  rustc --version  # >= 1.70.0
  cargo --version  # >= 1.70.0
  ```

- [ ] **GitHub CLI Authenticated**
  ```bash
  gh auth status  # Must be logged in
  ```

- [ ] **SDK Dependencies Installed**
  ```bash
  cd scripts/sdk-wrapper
  npm install
  npm test  # All tests pass
  ```

---

### 2. API Keys Configuration

- [ ] **Anthropic API Key (Primary)**
  ```bash
  export ANTHROPIC_API_KEY="sk-ant-api03-xxx"
  echo $ANTHROPIC_API_KEY  # Verify set
  ```

- [ ] **OpenAI API Key (Fallback)**
  ```bash
  export OPENAI_API_KEY="sk-proj-xxx"
  echo $OPENAI_API_KEY  # Verify set
  ```

- [ ] **Add to Shell Profile**
  ```bash
  # Add to ~/.bashrc or ~/.zshrc
  echo 'export ANTHROPIC_API_KEY="sk-ant-api03-xxx"' >> ~/.bashrc
  echo 'export OPENAI_API_KEY="sk-proj-xxx"' >> ~/.bashrc
  source ~/.bashrc
  ```

---

### 3. Binary Build & Test

- [ ] **Build Miyabi CLI**
  ```bash
  cargo build --release
  ./target/release/miyabi --version
  ```

- [ ] **Test miyabi exec Command**
  ```bash
  ./target/release/miyabi exec --help  # Should display help
  ```

- [ ] **Run Unit Tests**
  ```bash
  cd scripts/sdk-wrapper
  npm run d1 -- --help  # D1 SDK
  npm run d2 -- --help  # D2 SDK
  npm run d8 -- --help  # D8 SDK
  npm run test:session  # Session Manager (12 tests)
  ```

---

### 4. Integration Testing

- [ ] **Test D1 Label Validation**
  ```bash
  npm run d1 544  # Use real issue number
  # Expected: Exit code 0 or 1
  # Check: /tmp/miyabi-automation/d1-result.json exists
  ```

- [ ] **Test D2 Complexity Analysis**
  ```bash
  npm run d2 544  # Use real issue number
  # Expected: Exit code 0/1/2 (Low/Med/High)
  # Check: /tmp/miyabi-automation/complexity-sdk-544.json exists
  ```

- [ ] **Test D8 Test Analysis**
  ```bash
  npm run d8  # Run full test suite
  # Expected: Exit code 0 (all pass) or 1 (fail) or 2 (compile)
  # Check: /tmp/miyabi-automation/test-analysis.json exists
  ```

- [ ] **Test Session Persistence**
  ```bash
  npm run test:session  # All 12 tests pass
  ```

---

### 5. E2E Testing (Final Validation)

- [ ] **E2E Scenario 1: Code Analysis (ReadOnly)**
  ```bash
  ./target/release/miyabi exec "count Rust files"
  # Expected: Completes without errors
  # Duration: ~30-40 seconds
  ```

- [ ] **E2E Scenario 2: Command Execution (FullAccess)**
  ```bash
  ./target/release/miyabi exec --full-auto "run cargo clippy on miyabi-types"
  # Expected: Runs command successfully
  # Duration: ~15-20 seconds
  ```

- [ ] **E2E Scenario 3: Code Search (FullAccess)**
  ```bash
  ./target/release/miyabi exec --full-access "search for TODO in miyabi-core"
  # Expected: Returns search results
  # Duration: ~2-5 seconds
  ```

---

### 6. Orchestrator Testing

- [ ] **Dry Run Mode**
  ```bash
  scripts/orchestrators/autonomous-issue-processor-sdk.sh 544 --dry-run
  # Expected: Simulates workflow without making changes
  ```

- [ ] **Real Execution (Test Issue)**
  ```bash
  scripts/orchestrators/autonomous-issue-processor-sdk.sh 544
  # Expected: Completes full workflow (D1 → D2 → D3-D7 → D8)
  # Duration: Varies (depending on issue complexity)
  ```

---

### 7. Documentation Review

- [ ] **Migration Guide Complete**
  ```bash
  ls -lh docs/PHASE3_MIGRATION_GUIDE.md  # Exists and > 2000 words
  ```

- [ ] **Benchmark Results Complete**
  ```bash
  ls -lh docs/PHASE3_BENCHMARK_RESULTS.md  # Exists and comprehensive
  ```

- [ ] **Completion Report Complete**
  ```bash
  ls -lh docs/PHASE3_COMPLETION_REPORT.md  # Exists and comprehensive
  ```

- [ ] **Deployment Checklist Complete**
  ```bash
  ls -lh docs/PHASE3_DEPLOYMENT_CHECKLIST.md  # This file
  ```

---

## Deployment Steps

### Step 1: Update Production Scripts

- [ ] **Update Cron Jobs** (if applicable)
  ```bash
  # Old:
  # 0 */4 * * * /path/to/autonomous-issue-processor.sh

  # New:
  # 0 */4 * * * /path/to/autonomous-issue-processor-sdk.sh
  ```

- [ ] **Update Stream Deck Buttons** (if applicable)
  ```bash
  # Edit: tools/stream-deck/xx-auto-process.sh
  # Replace: autonomous-issue-processor.sh
  # With: autonomous-issue-processor-sdk.sh
  ```

- [ ] **Update CI/CD Pipelines** (if applicable)
  ```yaml
  # .github/workflows/auto-process.yml
  - name: Process Issues
    run: scripts/orchestrators/autonomous-issue-processor-sdk.sh $ISSUE_NUM
  ```

---

### Step 2: Backup Current State

- [ ] **Backup Bash Scripts**
  ```bash
  mkdir -p .archive/phase2-bash-scripts-$(date +%Y%m%d)
  cp scripts/orchestrators/autonomous-issue-processor.sh .archive/phase2-bash-scripts-$(date +%Y%m%d)/
  cp scripts/primitives/*.sh .archive/phase2-bash-scripts-$(date +%Y%m%d)/
  ```

- [ ] **Backup Session Files**
  ```bash
  cp -r ~/.miyabi/sessions ~/.miyabi/sessions.backup-$(date +%Y%m%d)
  ```

- [ ] **Git Commit Current State**
  ```bash
  git add .
  git commit -m "chore: Phase 3 pre-deployment backup"
  git tag phase3-pre-deployment-$(date +%Y%m%d)
  git push origin main --tags
  ```

---

### Step 3: Deploy SDK Orchestrator

- [ ] **Make Orchestrator Executable**
  ```bash
  chmod +x scripts/orchestrators/autonomous-issue-processor-sdk.sh
  ```

- [ ] **Test on Low-Priority Issue**
  ```bash
  # Choose a low-priority test issue (e.g., P3-Low, docs, etc.)
  scripts/orchestrators/autonomous-issue-processor-sdk.sh <test-issue-number>
  ```

- [ ] **Verify Success**
  ```bash
  # Check logs
  tail -f /tmp/miyabi-automation/workflow-<issue-number>.log

  # Check Issue status on GitHub
  gh issue view <test-issue-number>
  ```

---

### Step 4: Gradual Rollout

- [ ] **Week 1: 10% Traffic**
  - Process 10 out of 100 issues with SDK
  - Monitor error rates and performance
  - Rollback immediately if errors > 5%

- [ ] **Week 2: 50% Traffic**
  - Process 50 out of 100 issues with SDK
  - Compare performance: SDK vs bash
  - Collect cost metrics (API usage)

- [ ] **Week 3: 100% Traffic**
  - Process all issues with SDK
  - Deprecate bash orchestrator (keep as fallback)
  - Update all automation scripts

---

### Step 5: Monitoring Setup

- [ ] **Create Dashboard** (Optional)
  ```bash
  # Track metrics:
  # - Success rate (%)
  # - Average execution time (seconds)
  # - API costs ($)
  # - Error rate (%)
  # - Manual interventions (count)
  ```

- [ ] **Set Up Alerts**
  - Error rate > 5%
  - API costs > $100/month
  - Manual interventions > 20/100 issues

- [ ] **Log Aggregation**
  ```bash
  # Collect logs from:
  # - /tmp/miyabi-automation/workflow-*.log
  # - /tmp/miyabi-automation/*.json
  # - ~/.miyabi/sessions/*.json
  ```

---

## Post-Deployment Checklist

### Day 1

- [ ] **Monitor First 10 Issues**
  - Check execution logs
  - Verify no errors
  - Measure execution time

- [ ] **Validate API Usage**
  ```bash
  # Check Anthropic dashboard: https://console.anthropic.com/
  # Check OpenAI dashboard: https://platform.openai.com/usage
  # Expected: ~$0.02-0.05 per issue
  ```

- [ ] **Check Session Files**
  ```bash
  ls -lh ~/.miyabi/sessions/
  # Should have 10 new session files
  ```

---

### Week 1

- [ ] **Process 100 Issues**
  - 10 with SDK (test)
  - 90 with bash (baseline)

- [ ] **Compare Metrics**
  | Metric | Bash | SDK | Target |
  |--------|------|-----|--------|
  | Success Rate | ? | ? | >= 95% |
  | Avg Time | ? | ? | <= bash + 10s |
  | Errors | ? | ? | < 5 |
  | Cost | $0 | ? | < $5 |

- [ ] **Adjust if Needed**
  - Fine-tune D2 prompts if accuracy < 80%
  - Optimize timeouts if timeouts > 5%
  - Rollback if errors > 5%

---

### Month 1

- [ ] **Process 1000 Issues**
  - 100% with SDK (full rollout)

- [ ] **Final Metrics**
  | Metric | Target | Actual | Status |
  |--------|--------|--------|--------|
  | Success Rate | >= 95% | ? | ? |
  | Avg Time | <= 90s | ? | ? |
  | Errors | < 10 | ? | ? |
  | Cost | < $50 | ? | ? |
  | Manual Interventions | < 50 | ? | ? |

- [ ] **Phase 3 Complete**
  - All metrics meet targets
  - No critical bugs
  - Team trained and comfortable with SDK
  - Documentation up-to-date

---

## Rollback Procedures

### Scenario 1: High Error Rate (> 5%)

**Symptoms**: Multiple failures, API errors, crashes

**Actions**:
1. **Stop SDK Orchestrator**
   ```bash
   # Disable cron jobs
   # Disable CI/CD triggers
   ```

2. **Switch Back to Bash**
   ```bash
   # Use: scripts/orchestrators/autonomous-issue-processor.sh
   ```

3. **Investigate Logs**
   ```bash
   tail -f /tmp/miyabi-automation/workflow-*.log
   grep ERROR /tmp/miyabi-automation/*.log
   ```

4. **Report Issue**
   ```bash
   gh issue create --title "SDK Rollback: High Error Rate" --label bug
   ```

---

### Scenario 2: API Cost Overrun (> $100/month)

**Symptoms**: API bills exceeding budget

**Actions**:
1. **Reduce D2 Usage**
   ```bash
   # Skip D2 for Low complexity issues (use heuristics)
   # Cache D2 results for repeat analyses
   ```

2. **Switch to OpenAI Only** (cheaper)
   ```bash
   export LLM_PROVIDER="openai"
   ```

3. **Review Cost Dashboard**
   ```bash
   # Anthropic: https://console.anthropic.com/
   # OpenAI: https://platform.openai.com/usage
   ```

---

### Scenario 3: npm/Node.js Issues

**Symptoms**: "npm: command not found", dependency errors

**Actions**:
1. **Use Pure Bash Version**
   ```bash
   scripts/orchestrators/autonomous-issue-processor.sh
   ```

2. **Reinstall Dependencies**
   ```bash
   cd scripts/sdk-wrapper
   rm -rf node_modules package-lock.json
   npm install
   ```

---

## Success Criteria

### Production Readiness

- ✅ All tests pass (unit + integration + E2E)
- ✅ Documentation complete (3 guides, 7000+ words)
- ✅ Performance meets targets (20-40% faster)
- ✅ Cost within budget ($20-50/month)
- ✅ Rollback plan tested and verified
- ✅ Monitoring dashboard ready
- ✅ Team trained on new workflow

### Post-Deployment

- [ ] 100 issues processed successfully
- [ ] Success rate >= 95%
- [ ] Error rate < 5%
- [ ] API costs < $50/month
- [ ] Manual interventions < 50/1000 issues
- [ ] Zero critical bugs
- [ ] Team satisfaction score >= 8/10

---

## Support & Escalation

### Level 1: Self-Service

**Documentation**:
- `docs/PHASE3_MIGRATION_GUIDE.md`
- `docs/PHASE3_BENCHMARK_RESULTS.md`
- `docs/PHASE3_COMPLETION_REPORT.md`
- `docs/PHASE3_DEPLOYMENT_CHECKLIST.md` (this file)

**Troubleshooting**:
- Check logs: `/tmp/miyabi-automation/*.log`
- Review JSON output: `/tmp/miyabi-automation/*.json`
- Verify API keys: `echo $ANTHROPIC_API_KEY`

---

### Level 2: GitHub Issues

**Report Bugs**:
```bash
gh issue create \
  --title "SDK Bug: [description]" \
  --label bug \
  --body "Steps to reproduce: ..."
```

**Request Features**:
```bash
gh issue create \
  --title "SDK Feature Request: [description]" \
  --label enhancement
```

---

### Level 3: Direct Contact

**Project Lead**: Shunsuke Hayashi (@ShunsukeHayashi)
**Email**: [Your Email]
**GitHub**: https://github.com/ShunsukeHayashi/Miyabi

---

## Appendix

### Useful Commands

**Check SDK Status**:
```bash
cd scripts/sdk-wrapper
npm list  # Show installed packages
npm outdated  # Check for updates
```

**Clean Up Old Sessions**:
```bash
# Delete sessions older than 30 days
find ~/.miyabi/sessions -mtime +30 -delete
```

**Monitor API Usage**:
```bash
# Anthropic
curl https://api.anthropic.com/v1/billing/usage \
  -H "x-api-key: $ANTHROPIC_API_KEY"

# OpenAI
curl https://api.openai.com/v1/usage \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

---

**Deployment Date**: [To be filled]
**Deployed By**: [To be filled]
**Version**: 1.0.0
**Status**: Ready for Deployment ✅
