# Environment Setup for LLM Providers

Miyabi relies on multiple LLM vendors. Set the following environment variables (e.g., in `.env` or shell profile) before running agents or tests.

| Variable | Required? | Used by | Notes |
|----------|-----------|--------|-------|
| `ANTHROPIC_API_KEY` | 🚨 Critical | CoordinatorAgent, ReviewAgent, business agents fallback | Claude-based workflows. Without this key the system falls back to GPT-OSS but many features degrade. |
| `GROQ_API_KEY` | ⚠️ Recommended | Business agents, test utilities | High-speed inference for structured plans. If unset, business agents return `LLMError::MissingApiKey("GROQ_API_KEY")`. |
| `OPENAI_API_KEY` | Optional | Legacy CLI tools, sdk-wrapper | Use as alternative provider when Anthropic unavailable. |
| `GOOGLE_API_KEY` / `GEMINI_API_KEY` | Optional | Google/Gemini integrations | Only required when enabling Google LLM adapters. |
| `GITHUB_TOKEN` | 🚨 Critical | `miyabi-cli`, GitHub automation | Personal access token with repo scope for issue/PR operations. |
| `MIYABI_WORKFLOW_STATE_DIR` | Optional | Workflow persistence | Defaults to `~/.miyabi/workflows`; set to relocate sled DB. |

## Quick start

1. Copy the sample file and edit values:
   ```bash
   cp .env.sample .env
   # edit .env with your keys
   ```
2. For shell sessions:
   ```bash
   export ANTHROPIC_API_KEY="sk-ant-..."
   export GROQ_API_KEY="groq_..."
   ```
3. For CI, inject secrets via secure store (Vault, GitHub Actions secrets). Never commit real keys.

## Fallback behaviour

- If `ANTHROPIC_API_KEY` is missing, CoordinatorAgent automatically falls back to GPT-OSS, producing slower or lower fidelity plans. A warning is logged.
- Business agents throw `LLMError::MissingApiKey("GROQ_API_KEY")` when the Groq key is absent. Tests should capture this branch and either skip or mock the dependency.
- Scripts that probe providers (e.g., `scripts/test_llm_providers.sh`) automatically skip providers without configured keys and print guidance.

## Testing without real keys

- Use mocks/dry-run modes when available (`miyabi.sh agent ... --mode manual`).
- For unit tests that require keys, prefer injecting dummy responses or using the fallback GPT-OSS provider.

Refer to this document whenever adding new provider integrations.
