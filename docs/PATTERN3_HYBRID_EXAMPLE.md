# Pattern 3: Hybrid Orchestration - OAuth 2.0 Implementation Example

**Pattern**: Hybrid Orchestration (Claude Code + Claude Code X)
**Feature**: OAuth 2.0 Authentication System
**Time**: 42 minutes (vs 60 min all-interactive)
**Savings**: 30%

---

## 🎯 Overview

This document provides a detailed walkthrough of implementing OAuth 2.0 authentication using Pattern 3 (Hybrid Orchestration), demonstrating how to combine interactive Claude Code sessions with parallel Claude Code X execution for optimal speed and quality.

---

## 📋 Feature Requirements

**Goal**: Implement complete OAuth 2.0 authentication system

**Features**:
1. OAuth configuration management
2. Database schema for user OAuth data
3. Token storage with Redis caching
4. Authorization code flow with PKCE
5. Token exchange and refresh logic
6. Multiple provider support (Google, GitHub, Discord)
7. CSRF protection with state parameter
8. Comprehensive error handling
9. Integration tests

**Non-functional Requirements**:
- Security: PKCE, state validation, secure token storage
- Performance: Redis caching for tokens
- Reliability: Proper error handling and retry logic
- Maintainability: Clear separation of concerns

---

## 🧩 Task Breakdown

### Phase 1: Planning (Interactive)
**Tool**: Claude Code
**Duration**: 5 minutes
**Tasks**: 1

**Purpose**: Understand requirements, break down into discrete tasks, identify task dependencies and criticality.

### Phase 2: Infrastructure (Parallel)
**Tool**: Claude Code X
**Duration**: 6 minutes
**Tasks**: 3 (parallel)

**Purpose**: Set up foundation components that have no dependencies on each other.

### Phase 3: Core Flow (Interactive)
**Tool**: Claude Code
**Duration**: 15 minutes
**Tasks**: 4 (critical path)

**Purpose**: Implement security-critical OAuth flow with PKCE and state validation.

### Phase 4: Providers (Parallel)
**Tool**: Claude Code X
**Duration**: 6 minutes
**Tasks**: 3 (parallel)

**Purpose**: Implement provider-specific integrations that follow same pattern.

### Phase 5: Testing & Review (Interactive)
**Tool**: Claude Code
**Duration**: 10 minutes
**Tasks**: 1

**Purpose**: Integration testing, code review, security audit.

---

## 📝 Detailed Implementation

### Phase 1: Planning with Claude Code (5 minutes)

```bash
claude
```

**Prompt**:
```
I need to implement OAuth 2.0 authentication for Miyabi. 

Requirements:
- Support multiple providers (Google, GitHub, Discord)
- PKCE for security
- Token storage with Redis
- State parameter for CSRF protection

Please break this down into discrete, independent tasks that can be:
1. Executed in parallel (simple infrastructure)
2. Executed interactively (critical security components)
3. Categorized by dependencies
```

**Claude Code Output**:

```markdown
## Task Breakdown

### Infrastructure Tasks (No dependencies, can parallelize):
1. **OAuth Config Struct** (Simple)
   - Create OAuth configuration in config.rs
   - Add client_id, client_secret, redirect_uri fields
   - No external dependencies

2. **Database Schema** (Simple)
   - Add users_oauth table migration
   - Fields: user_id, provider, provider_user_id, access_token, refresh_token, expires_at
   - Independent of OAuth flow logic

3. **Token Storage** (Simple)
   - Implement Redis-based token caching
   - Set/get/delete with TTL
   - Independent of OAuth providers

### Critical Path Tasks (Sequential, needs care):
4. **Authorization Flow** (Critical)
   - PKCE code challenge/verifier generation
   - State parameter generation and validation
   - Authorization URL construction
   - SECURITY CRITICAL: Needs careful review

5. **Token Exchange** (Critical)
   - Exchange authorization code for tokens
   - PKCE verifier validation
   - Token parsing and validation
   - SECURITY CRITICAL: Needs error handling

6. **Token Refresh** (Critical)
   - Refresh token flow
   - Handle expired tokens
   - Retry logic

7. **Error Handling** (Critical)
   - OAuth error responses
   - Network failures
   - Invalid tokens

### Provider Integration Tasks (Parallel, follow pattern):
8. **Google OAuth Provider** (Simple, follows pattern)
   - Use https://accounts.google.com/o/oauth2/v2/auth
   - People API integration

9. **GitHub OAuth Provider** (Simple, follows pattern)
   - Use https://github.com/login/oauth/authorize
   - User API integration

10. **Discord OAuth Provider** (Simple, follows pattern)
    - Use https://discord.com/api/oauth2/authorize
    - User API integration

### Final Task:
11. **Integration Tests** (Critical)
    - Test complete OAuth flows
    - Security validation
    - Error scenarios
```

**Decision**: 
- Tasks 1-3: Claude Code X (parallel)
- Tasks 4-7: Claude Code (interactive, critical)
- Tasks 8-10: Claude Code X (parallel)
- Task 11: Claude Code (interactive, testing)

---

### Phase 2: Infrastructure Setup with Claude Code X (6 minutes)

**Execute 3 parallel tasks**:

```bash
# Task 1: OAuth Config
/claude-code-x exec "Create OAuth configuration struct in crates/miyabi-core/src/config.rs

Add OAuthConfig struct with:
- google_client_id: String
- google_client_secret: String
- github_client_id: String
- github_client_secret: String
- discord_client_id: String
- discord_client_secret: String
- redirect_uri: String

Implement:
- Deserialize from environment variables
- Validation (non-empty fields)
- Default redirect_uri = http://localhost:8080/auth/callback

Add to Config struct as oauth: OAuthConfig
Include comprehensive rustdoc comments"

# Task 2: Database Schema
/claude-code-x exec "Create database migration for OAuth support

File: migrations/2025_10_27_oauth_support.sql

Create users_oauth table:
- id: SERIAL PRIMARY KEY
- user_id: INTEGER REFERENCES users(id) ON DELETE CASCADE
- provider: VARCHAR(50) NOT NULL (google, github, discord)
- provider_user_id: VARCHAR(255) NOT NULL
- access_token: TEXT NOT NULL
- refresh_token: TEXT
- expires_at: TIMESTAMP
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

Add unique constraint on (provider, provider_user_id)
Add index on user_id for fast lookups"

# Task 3: Token Storage
/claude-code-x exec "Implement Redis-based OAuth token storage

File: crates/miyabi-core/src/oauth/token_storage.rs

Create TokenStorage struct with Redis client

Implement methods:
- store_tokens(user_id, provider, access_token, refresh_token, ttl)
- get_access_token(user_id, provider) -> Option<String>
- get_refresh_token(user_id, provider) -> Option<String>
- delete_tokens(user_id, provider)
- update_access_token(user_id, provider, new_token, ttl)

Use Redis keys format: oauth:{user_id}:{provider}:{token_type}
Set TTL based on token expiry
Include error handling for Redis failures
Add comprehensive unit tests"

# Monitor progress
/claude-code-x sessions
```

**Expected Output** (6 minutes later):
```
✅ Session claude-code-x-20251027-100000-abc123 completed
   Task: OAuth Config struct
   Duration: 2m14s
   Files: crates/miyabi-core/src/config.rs

✅ Session claude-code-x-20251027-100015-def456 completed
   Task: Database migration
   Duration: 1m53s
   Files: migrations/2025_10_27_oauth_support.sql

✅ Session claude-code-x-20251027-100030-ghi789 completed
   Task: Token storage
   Duration: 2m47s
   Files: crates/miyabi-core/src/oauth/token_storage.rs
```

---

### Phase 3: Core OAuth Flow with Claude Code (15 minutes)

**Interactive implementation of critical security components**:

```bash
claude
```

**Task 4: Authorization Flow**:

**Prompt**:
```
Implement OAuth authorization flow in crates/miyabi-core/src/oauth/auth_flow.rs

Requirements:
1. PKCE code challenge generation:
   - Generate 128-byte random code_verifier
   - Create SHA256 hash as code_challenge
   - Use base64url encoding (no padding)

2. State parameter:
   - Generate cryptographically random state
   - Store in Redis with 10-minute TTL
   - Include CSRF token validation

3. Authorization URL construction:
   - Support all 3 providers (Google, GitHub, Discord)
   - Include: client_id, redirect_uri, response_type=code, scope, state, code_challenge, code_challenge_method=S256

4. Security:
   - Use ring crate for crypto operations
   - Validate all inputs
   - Proper error types

Please implement with comprehensive error handling and tests.
```

**Interactive Session** (10 minutes):
- Claude Code implements `auth_flow.rs`
- User reviews security-critical crypto operations
- User asks: "Is the code_verifier entropy sufficient?"
- Claude Code explains: "Yes, 128 bytes = 1024 bits of entropy, exceeds PKCE spec (43-128 chars)"
- User: "Add comment explaining this"
- Claude Code updates code with security rationale comments
- Tests run: `cargo test oauth::auth_flow` ✅ Pass

**Task 5-7: Token Exchange, Refresh, Error Handling** (5 minutes):

**Prompt**:
```
Now implement token exchange, refresh, and error handling in the same file.

Token Exchange:
- POST to provider token endpoint with:
  - code, code_verifier, client_id, client_secret, redirect_uri, grant_type=authorization_code
- Parse JSON response: access_token, refresh_token, expires_in
- Validate token format (JWT for some providers)
- Store in Redis and database

Token Refresh:
- POST with refresh_token, grant_type=refresh_token
- Update stored tokens
- Handle refresh_token rotation

Error Handling:
- Network errors (retry with backoff)
- Invalid_grant (user needs to re-auth)
- Invalid_token (clear cache, re-auth)
- Rate limiting (exponential backoff)

Use reqwest for HTTP, serde for JSON, implement proper error types.
```

**Result**: Complete OAuth core implementation with security best practices.

---

### Phase 4: Provider Implementations with Claude Code X (6 minutes)

**Execute 3 parallel provider integrations**:

```bash
# All 3 providers follow same pattern, perfect for parallelization

# Task 8: Google OAuth
/claude-code-x exec "Implement Google OAuth provider

File: crates/miyabi-core/src/oauth/providers/google.rs

Implement GoogleOAuthProvider struct:
- authorization_url = https://accounts.google.com/o/oauth2/v2/auth
- token_url = https://oauth2.googleapis.com/token
- user_info_url = https://www.googleapis.com/oauth2/v2/userinfo
- scopes = openid profile email

Implement methods:
- get_auth_url(state, code_challenge) -> String
- exchange_code(code, code_verifier) -> Result<Tokens>
- get_user_info(access_token) -> Result<UserInfo>

Parse Google user info:
- id, email, name, picture

Include unit tests with mock HTTP responses"

# Task 9: GitHub OAuth
/claude-code-x exec "Implement GitHub OAuth provider

File: crates/miyabi-core/src/oauth/providers/github.rs

Implement GitHubOAuthProvider struct:
- authorization_url = https://github.com/login/oauth/authorize
- token_url = https://github.com/login/oauth/access_token
- user_info_url = https://api.github.com/user
- scopes = read:user user:email

Implement methods:
- get_auth_url(state, code_challenge) -> String
- exchange_code(code, code_verifier) -> Result<Tokens>
- get_user_info(access_token) -> Result<UserInfo>

Parse GitHub user info:
- id, login, name, avatar_url, email

Include unit tests with mock HTTP responses"

# Task 10: Discord OAuth
/claude-code-x exec "Implement Discord OAuth provider

File: crates/miyabi-core/src/oauth/providers/discord.rs

Implement DiscordOAuthProvider struct:
- authorization_url = https://discord.com/api/oauth2/authorize
- token_url = https://discord.com/api/oauth2/token
- user_info_url = https://discord.com/api/users/@me
- scopes = identify email

Implement methods:
- get_auth_url(state, code_challenge) -> String
- exchange_code(code, code_verifier) -> Result<Tokens>
- get_user_info(access_token) -> Result<UserInfo>

Parse Discord user info:
- id, username, discriminator, avatar, email

Include unit tests with mock HTTP responses"

# Check progress
/claude-code-x sessions
```

**Expected Output** (6 minutes later):
```
✅ All 3 provider sessions completed
   Total duration: ~6 minutes (parallel)
   Files created: 3
   Tests: 15 total (5 per provider)
```

---

### Phase 5: Testing & Review with Claude Code (10 minutes)

```bash
claude
```

**Prompt**:
```
Let's review and test the complete OAuth implementation.

1. Create integration tests in tests/oauth_integration_test.rs:
   - Test complete authorization flow (mock HTTP)
   - Test token exchange
   - Test token refresh
   - Test error scenarios (invalid_grant, network failure)
   - Test all 3 providers

2. Security review:
   - Verify PKCE implementation
   - Verify state validation
   - Check token storage encryption
   - Verify no token leakage in logs

3. Run full test suite:
   - cargo test --package miyabi-core oauth
   - cargo clippy --package miyabi-core
   - cargo build --release

4. Create example usage in examples/oauth_example.rs
```

**Interactive Session** (10 minutes):
- Create integration tests
- User reviews security checklist
- Run tests: ✅ 25/25 pass
- Run clippy: ✅ 0 warnings
- Build succeeds
- User asks: "What about PKCE in Discord? They don't support it"
- Claude Code: "Good catch! Discord doesn't require PKCE, but we can still include it harmlessly. Updated provider logic to make it optional."
- Final commit

---

## ⏱️ Time Breakdown

| Phase | Method | Time | Tasks | Files | Tests |
|-------|--------|------|-------|-------|-------|
| **1. Planning** | Interactive | 5 min | 1 | 0 | 0 |
| **2. Infrastructure** | Claude Code X (parallel) | 6 min | 3 | 3 | 8 |
| **3. Core Flow** | Interactive (critical) | 15 min | 4 | 1 | 10 |
| **4. Providers** | Claude Code X (parallel) | 6 min | 3 | 3 | 15 |
| **5. Testing** | Interactive (review) | 10 min | 1 | 2 | 25 |
| **Total** | **Hybrid** | **42 min** | **12** | **9** | **58** |

**Comparison**:
- **All Interactive (Pattern 1)**: ~60 minutes (sequential)
- **Hybrid (Pattern 3)**: ~42 minutes (parallel + interactive)
- **Savings**: 18 minutes (30%)

---

## 📊 Benefits Analysis

### Speed Benefits
- **Infrastructure**: 6 min parallel vs 9 min sequential (33% faster)
- **Providers**: 6 min parallel vs 15 min sequential (60% faster)
- **Total**: 42 min vs 60 min (30% faster)

### Quality Benefits
- **Critical code** (PKCE, token exchange) gets interactive attention
- **Security review** by user in Phase 3 and 5
- **Simple code** (config, providers) executed reliably in parallel
- **No compromise** on code quality

### Resource Benefits
- **User attention** focused on critical 25 minutes (planning + core + review)
- **Background execution** for 12 minutes (infrastructure + providers)
- **Can multitask** during Claude Code X execution

---

## 🎯 Key Takeaways

### When Pattern 3 Works Best
✅ **Ideal For**:
- Large features with clear task boundaries
- Mix of critical and simple components
- Features that can be broken into phases
- Independent infrastructure + core logic split

❌ **Not Ideal For**:
- Small features (<30 min total)
- All tasks are tightly coupled
- Everything is security-critical
- Unclear requirements (needs all-interactive exploration)

### Critical Success Factors
1. **Good Planning** (Phase 1): Accurate task breakdown is essential
2. **Clear Dependencies**: Know what can run in parallel
3. **Trust in Claude Code X**: For well-defined, independent tasks
4. **User Involvement**: For critical paths and final review

### Pattern 3 Formula
```
Time Savings = (Sequential Time - Hybrid Time) / Sequential Time

Where:
- Sequential Time = Sum of all tasks executed one-by-one
- Hybrid Time = Plan + max(Parallel Batch) + Critical Path + Review

Typical Savings: 25-40% depending on task composition
```

---

## 🚀 Next Steps

After completing OAuth implementation:

1. **Deploy to Staging**:
   ```bash
   claude
   > "Deploy OAuth changes to staging, create deployment checklist"
   ```

2. **Monitor Metrics**:
   - OAuth success rate
   - Token refresh rate
   - Error types and frequency

3. **Iterate**:
   - Add more providers (Microsoft, Apple)
   - Implement OAuth for mobile apps
   - Add OAuth scope management UI

---

## 📚 Related Documentation

- [Optimal Miyabi Workflow](OPTIMAL_MIYABI_WORKFLOW_WITH_CODEX_CLAUDE.md) - Full workflow guide
- [Claude Code X Implementation](CLAUDE_CODE_X_IMPLEMENTATION_GUIDE.md) - Technical details
- [Benchmark Report](../.ai/logs/claude-code-vs-codex-x-benchmark.md) - Performance data

---

**Author**: Claude Code (Sonnet 4.5)
**Date**: 2025-10-27
**Example Type**: Practical Demonstration
**Status**: ✅ Ready for Production Use
