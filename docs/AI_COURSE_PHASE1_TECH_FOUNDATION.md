# AI Course Phase 1 - Technical Foundations

**Project**: Miyabi Dashboard - AI Course Integration
**Scope**: Phase 1 (Weeks 1-4)
**Purpose**: Define LLM stack, async worker architecture, and security sandbox baseline.

---

## 1) LLM Stack Definition

### Goals
- Support course generation, assessments, and analytics without vendor lock-in.
- Provide predictable latency and cost controls for production.
- Allow local development without external API dependence.

### Architecture
- **LLM abstraction**: `miyabi-llm` crate as the single integration layer.
- **Primary providers**:
  - **Claude (Anthropic)** for high-reasoning tasks (course design, feedback).
  - **OpenAI** as optional fallback for availability/cost tuning.
  - **Local (Ollama / GPT-OSS-20B)** for dev/offline runs.
- **Embeddings**:
  - **Qdrant** as vector DB (per ADR-004).
  - **Ollama** embeddings for dev, **OpenAI** embeddings for production quality.

### Model Routing (initial)
- **Course outline generation**: Claude Sonnet (primary), OpenAI (fallback).
- **Assessment item generation**: Claude (primary), OpenAI (fallback).
- **Grading feedback**: Claude (primary), local only for dev.
- **Semantic search**: Ollama embeddings (dev), OpenAI embeddings (prod), Qdrant storage.

### Config and Env
```
MIYABI_LLM_PROVIDER=anthropic|openai|ollama
MIYABI_LLM_FALLBACK_CHAIN=anthropic,openai,ollama
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...
OLLAMA_BASE_URL=http://localhost:11434
MIYABI_EMBEDDING_PROVIDER=ollama|openai
QDRANT_URL=http://localhost:6333
```

### Observability and Guardrails
- Request/response logging with redaction for PII.
- Per-request cost tracking (token accounting per provider).
- Circuit breaker on provider errors to auto-fallback.
- Model/version pinning in config (avoid silent behavior changes).

---

## 2) Async Worker Architecture

### Goals
- Handle long-running tasks (generation, grading, media processing).
- Ensure durable jobs with retries and idempotency.
- Stream progress to UI without blocking API requests.

### Components
- **API layer** (Next.js): accepts requests, validates, enqueues jobs.
- **Job store** (PostgreSQL): durable source of truth.
- **Queue** (Redis): fast ready queue with priority lanes.
- **Worker service** (Rust + Tokio): executes jobs and writes logs.
- **Artifacts** (S3): stores generated files, rubrics, exports.
- **Event stream** (WebSocket/SSE): progress updates to UI.

### Job Model (PostgreSQL)
```
job_id (uuid)
kind (course_generate | assessment_generate | grade | media_process)
status (queued | running | succeeded | failed | canceled)
priority (p0..p3)
payload (jsonb)
attempts (int)
max_attempts (int)
lease_expires_at (timestamp)
created_at, updated_at
idempotency_key (text)
```

### Execution Flow
1. API validates request and writes job to Postgres.
2. Job id is pushed to Redis ready queue by priority.
3. Worker pulls job, claims lease in Postgres, and executes handler.
4. Progress is written to `job_logs` and streamed to UI.
5. On success, artifacts stored in S3 and job marked `succeeded`.
6. On failure, retry with backoff until `max_attempts`.

### Concurrency and Scaling
- Separate queues for CPU-heavy and IO-heavy tasks.
- Worker concurrency limits by job type.
- Rate limit LLM calls per provider to control cost.

### Failure Modes
- At-least-once execution with idempotency keys.
- Lease expiration and re-queue on worker crash.
- Dead-letter queue for repeated failures.

---

## 3) Security Sandbox Specification (Phase 1 Baseline)

### Threat Model
- Untrusted course content and user-uploaded files.
- AI-generated code execution for grading.
- Potential prompt injection and data exfiltration.

### Sandbox Requirements
- **Isolation**: run all code execution in a container sandbox.
- **No network egress** by default.
- **Resource limits**: CPU, memory, disk, and execution time.
- **Readonly base image** with a writable ephemeral workspace.
- **No root**: run as non-privileged user.
- **Seccomp/AppArmor** profile to limit syscalls.
- **Audit logs** for executed commands and file access.

### Proposed Runtime (Phase 1)
- **Docker container** with:
  - read-only filesystem
  - tmpfs workspace
  - `--network=none`
  - explicit CPU/memory limits
- **Optional Phase 2**: gVisor or Firecracker for stronger isolation.

### File Upload Safety
- Signed URL uploads to S3.
- Virus scanning on ingestion (e.g., ClamAV lambda or service).
- MIME and extension validation; size limits enforced server-side.

### LLM Safety
- PII redaction on prompts and logs.
- Prompt injection detection for user-supplied content.
- Policy rules for disallowed outputs (unsafe code, secrets).

---

## Open Questions
- Which provider should be the default for production (Claude vs OpenAI)?
- Do we require gVisor/Firecracker in Phase 1, or accept Docker-only?
- Should we introduce a dedicated job orchestration tool later (Temporal)?

