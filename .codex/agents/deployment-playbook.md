# DeploymentAgent (Codex Playbook)

Steps for orchestrating builds, tests, deployments, and health checks using the Rust DeploymentAgent.

## Role & Outcomes
- Build the project, execute full test suites, and deploy to staging/production environments.
- Perform automated health checks and prepare rollback instructions.
- Report deployment status back to GitHub Issues/PRs.

## Prerequisites
1. Environment setup:
   ```bash
   export $(grep -v '^#' .env | xargs)
   export GH_TOKEN="$GITHUB_TOKEN"
   gh auth status
   ```
2. Required CLIs installed and authenticated for target services (Firebase/Vercel/AWS). Document credentials in `.env` or secrets store.
3. Confirm branch state (clean `git status`) and CI prerequisites satisfied.

## Execution Steps
1. **Select Environment**
   - Staging (default auto-deploy) or Production (requires approval + change record).
   - Set metadata in deployment task JSON (`"environment": "staging"`).

2. **Run DeploymentAgent**
   ```bash
   cargo run --bin miyabi -- agent deployment --issue <ISSUE_NUMBER>
   ```
   - If CLI path missing, call `DeploymentAgent::execute` within a helper script, providing task metadata (environment, service, urls).

3. **Build & Test Verification**
   - Build step: `cargo build --release`
   - Test step: `cargo test --all`
   - DeploymentAgent logs stored in `.deployment/logs/<timestamp>.log`.
   - Abort and escalate on any failure.

4. **Service Deploy**
   - Example (Vercel):
     ```bash
     vercel deploy --prod --confirm
     ```
   - Example (Firebase functions):
     ```bash
     firebase deploy --only functions
     ```
   - Capture command outputs for audit trail.

5. **Health Check**
   ```bash
   curl -I https://staging.example.com/health
   ```
   - DeploymentAgent performs retries (configured in task metadata, default 3).
   - Record status codes and response times.

6. **Rollback Plan**
   - If health check fails:
     - Trigger rollback command (depends on platform).
     - Notify relevant labels (`🔴 state:blocked`, `🛑 state:failed`) and open incident issue if necessary.

7. **Report**
   - Post summary to issue/PR:
     ```markdown
     ## Deployment Report
     - Environment: Staging
     - Build: ✅ (`cargo build --release`)
     - Tests: ✅ (`cargo test --all`)
     - Deployment: ✅ (Vercel)
     - Health Check: ✅ 200 OK (https://staging.example.com/health)
     - Rollback: Not required
     ```
   - Adjust labels: for staging success, move to `✅ state:done` or keep `👀 state:reviewing` if awaiting approval.

## Success Criteria
- Build/test/deploy commands succeed.
- Health check returns success within configured retries.
- Deployment status + logs archived.
- Issue/PR updated with deployment summary and next actions.

## Escalation
- Build or test failure ➜ halt deployment, notify Guardian + DevOps.
- Health check failure ➜ rollback immediately, create incident issue, set `🔴 state:blocked`.
- Production deploy ➜ require explicit approval recorded in the issue before executing.
