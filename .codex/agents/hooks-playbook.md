# Hooks Integration (Codex Playbook)

Bridge the Claude hook system concepts into the Rust implementation so Codex can register pre/post/error behaviors around agent execution.

## Objectives
- Provide consistent lifecycle extension points for all agents.
- Reuse `tracing`, `miyabi-core`, and existing async infrastructure.
- Keep hooks declarative so orchestrators (Coordinator, Worktree pools) can inject them.

## Proposed Rust Pattern

1. **Define Trait**
   ```rust
   #[async_trait::async_trait]
   pub trait AgentHook: Send + Sync {
       async fn on_pre_execute(&self, task: &Task) -> Result<()>;
       async fn on_post_execute(&self, task: &Task, result: &AgentResult) -> Result<()>;
       async fn on_error(&self, task: &Task, error: &MiyabiError) -> Result<()>;
   }
   ```
   - Provide default no-op implementations for convenience.

2. **Extend BaseAgent**
   ```rust
   pub struct HookedAgent<A: BaseAgent> {
       agent: A,
       hooks: Vec<Box<dyn AgentHook>>,
   }
   ```
   - Wrap agent execution to call hooks at the appropriate times.

3. **Standard Hooks**
   - `EnvironmentCheckHook`: verify required env vars.
   - `GitStateHook`: assert clean working tree before modifications.
   - `MetricsHook`: record duration, success/failure.
   - `NotificationHook`: send Slack/Discord notifications (use `miyabi-core::notifications` when available).
   - `AuditHook`: append to `.ai/logs/<date>.md`.

4. **Registration API**
   ```rust
   impl<A: BaseAgent> HookedAgent<A> {
       pub fn register_hook<H: AgentHook + 'static>(&mut self, hook: H) {
           self.hooks.push(Box::new(hook));
       }
   }
   ```
   - Coordinator orchestrator should accept a hook registry when spawning agents.

## Usage Template
```rust
let mut coordinator = HookedAgent::new(CoordinatorAgent::new(config));
coordinator.register_hook(EnvironmentCheckHook::new(vec!["GITHUB_TOKEN"]));
coordinator.register_hook(ExecutionReportHook::new(".ai/logs"));

let result = coordinator.run(&task).await?;
```

## Operational Guidelines
- Hooks must be idempotent; repeated runs should not corrupt state.
- Heavy I/O (notifications, API calls) should occur after successful execution or inside `on_error`.
- Store hook configuration under `.codex/hooks/*.toml` if runtime customization is needed.
- When integrating with GitHub Actions or external systems, ensure secrets come from `.env` or GitHub secrets, never hardcode.

## Next Steps
1. Implement `HookedAgent` wrapper in Rust (new module under `miyabi-agents/src/hooks.rs`).
2. Provide a default hook set for each agent type mirroring the Claude list.
3. Document hook usage examples and add tests to cover pre/post/error flows.
