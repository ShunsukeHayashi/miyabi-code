---
name: Security Audit and Vulnerability Scanning
description: Comprehensive security auditing for Rust projects including dependency scanning, code analysis, secret detection, and vulnerability remediation. Use when checking for security issues, scanning for CVEs, or hardening applications.
allowed-tools: Bash, Read, Grep, Glob
---

# Security Audit and Vulnerability Scanning

Complete security analysis toolkit for identifying and fixing vulnerabilities in Rust applications.

## When to Use

- User requests "scan for security vulnerabilities"
- User asks "are there any CVEs in our dependencies?"
- User wants to "audit the codebase for security issues"
- Before production deployment
- After dependency updates
- When `🔐 security` label is applied to Issue
- Regular security audits (monthly/quarterly)

## Security Audit Workflow

### Step 1: Quick Security Scan

```bash
# Run all security checks
cargo audit
cargo clippy -- -W clippy::all
cargo deny check
cargo geiger

# Check for secrets
gitleaks detect --source . --verbose
```

## Security Tools

### 1. cargo-audit (CVE Scanning)

**Installation**:
```bash
cargo install cargo-audit
```

**Usage**:
```bash
# Basic audit
cargo audit

# Show detailed vulnerability info
cargo audit --verbose

# Generate JSON report
cargo audit --json > audit-report.json

# Fail on warnings
cargo audit --deny warnings

# Check specific advisory database
cargo audit --db /path/to/advisory-db
```

**Example Output**:
```
Crate:     openssl
Version:   0.10.30
Warning:   vulnerability
Title:     Buffer overflow in `X509_NAME_oneline`
Date:      2021-03-25
ID:        RUSTSEC-2021-0056
URL:       https://rustsec.org/advisories/RUSTSEC-2021-0056
Solution:  Upgrade to >= 0.10.55
```

**Fix**:
```bash
# Update dependency
cargo update -p openssl

# Or specify version in Cargo.toml
# openssl = "0.10.55"
```

### 2. cargo-deny (Policy Enforcement)

**Installation**:
```bash
cargo install cargo-deny
```

**Setup**:
```bash
# Generate config
cargo deny init

# Edit deny.toml
cat > deny.toml <<'EOF'
[advisories]
db-path = "~/.cargo/advisory-db"
db-urls = ["https://github.com/rustsec/advisory-db"]
vulnerability = "deny"
unmaintained = "warn"
yanked = "deny"
notice = "warn"

[licenses]
unlicensed = "deny"
allow = [
    "MIT",
    "Apache-2.0",
    "BSD-3-Clause",
]
deny = [
    "GPL-3.0",  # Copyleft licenses
]

[bans]
multiple-versions = "warn"
wildcards = "deny"  # Don't allow * versions
deny = [
    { name = "openssl", reason = "Use rustls instead" },
]

[sources]
unknown-registry = "deny"
unknown-git = "warn"
allow-org = { github = ["your-org"] }
EOF
```

**Usage**:
```bash
# Check all policies
cargo deny check

# Check only advisories
cargo deny check advisories

# Check only licenses
cargo deny check licenses

# Check for banned crates
cargo deny check bans

# Check sources
cargo deny check sources
```

### 3. cargo-geiger (Unsafe Code Detection)

**Installation**:
```bash
cargo install cargo-geiger
```

**Usage**:
```bash
# Scan for unsafe code
cargo geiger

# Show detailed report
cargo geiger --verbose

# Generate JSON report
cargo geiger --output-format Json > geiger-report.json

# Show only unsafe crates
cargo geiger --unsafe-only
```

**Example Output**:
```
Metric output format: x/y
  x = unsafe code used by the build
  y = total unsafe code in the crate

Functions  Expressions  Impls  Traits  Methods  Dependency

0/0        0/0          0/0    0/0     0/0      my-project
2/2        5/5          0/0    0/0     0/0      ├── tokio
0/0        0/0          0/0    0/0     0/0      ├── serde
```

**Action Items**:
- Review all `unsafe` blocks
- Ensure proper invariants documented
- Consider safe alternatives

### 4. gitleaks (Secret Detection)

**Installation**:
```bash
# macOS
brew install gitleaks

# Linux
wget https://github.com/gitleaks/gitleaks/releases/download/v8.18.0/gitleaks_8.18.0_linux_x64.tar.gz
tar -xzf gitleaks_8.18.0_linux_x64.tar.gz
sudo mv gitleaks /usr/local/bin/
```

**Usage**:
```bash
# Scan current directory
gitleaks detect --source . --verbose

# Scan git history
gitleaks detect --source . --log-opts="--all"

# Generate report
gitleaks detect --source . --report-format json --report-path gitleaks-report.json

# Scan specific files
gitleaks detect --source . --path="src/**/*.rs"
```

**Common Secrets Detected**:
- API keys
- AWS credentials
- GitHub tokens
- Private keys (RSA, SSH)
- Database passwords
- JWT tokens

**Remediation**:
1. Remove secret from code
2. Invalidate/rotate the secret
3. Add to `.gitignore`
4. Use environment variables instead
5. Rewrite git history if needed (use BFG Repo-Cleaner)

### 5. cargo-supply-chain (Dependency Analysis)

**Installation**:
```bash
cargo install cargo-supply-chain
```

**Usage**:
```bash
# Analyze dependencies
cargo supply-chain

# Show publishers
cargo supply-chain publishers

# Show crate sources
cargo supply-chain sources

# Check for suspicious patterns
cargo supply-chain audit
```

## Security Categories

### 1. Dependency Vulnerabilities

**Check**:
```bash
cargo audit
cargo deny check advisories
```

**Fix Strategies**:

| Severity | Action |
|----------|--------|
| **Critical** | Immediate upgrade or replacement |
| **High** | Upgrade within 24 hours |
| **Medium** | Upgrade within 1 week |
| **Low** | Upgrade in next sprint |

**Example Fix**:
```bash
# Update specific crate
cargo update -p vulnerable-crate

# Or update all dependencies
cargo update

# Check for breaking changes
cargo test
```

### 2. Code Security Issues

**Scan with Clippy**:
```bash
# Security-focused lints
cargo clippy -- \
  -W clippy::unwrap_used \
  -W clippy::expect_used \
  -W clippy::panic \
  -W clippy::integer_arithmetic \
  -W clippy::indexing_slicing \
  -W clippy::as_conversions \
  -W clippy::cast_lossless \
  -W clippy::mem_forget
```

**Common Issues**:

| Issue | Risk | Fix |
|-------|------|-----|
| `unwrap()` on `Option/Result` | Panic on error | Use `?` or pattern matching |
| Integer overflow | Logic errors, crashes | Use checked arithmetic |
| Buffer indexing | Panic on out-of-bounds | Use `.get()` |
| Memory leaks | Resource exhaustion | Proper `Drop` impl |
| SQL injection | Data breach | Use parameterized queries |

**Example Fixes**:

```rust
// ❌ Dangerous: Can panic
let value = map.get(&key).unwrap();

// ✅ Safe: Handle error
let value = map.get(&key).ok_or(MyError::KeyNotFound)?;

// ❌ Dangerous: Integer overflow
let result = a + b;

// ✅ Safe: Checked arithmetic
let result = a.checked_add(b).ok_or(MyError::Overflow)?;

// ❌ Dangerous: Direct indexing
let item = vec[index];

// ✅ Safe: Bounds checking
let item = vec.get(index).ok_or(MyError::IndexOutOfBounds)?;
```

### 3. Input Validation

**Always validate external input**:

```rust
use validator::Validate;

#[derive(Validate)]
struct UserInput {
    #[validate(length(min = 1, max = 100))]
    username: String,

    #[validate(email)]
    email: String,

    #[validate(range(min = 18, max = 120))]
    age: u8,

    #[validate(url)]
    website: Option<String>,
}

fn process_input(input: UserInput) -> Result<()> {
    // Validate before processing
    input.validate()?;

    // Safe to use
    Ok(())
}
```

**Sanitize user input**:

```rust
use ammonia::clean;

fn sanitize_html(input: &str) -> String {
    // Remove XSS vectors
    clean(input)
}

fn sanitize_sql(input: &str) -> Result<String> {
    // Use parameterized queries instead
    // Never concatenate user input into SQL
    sqlx::query("SELECT * FROM users WHERE id = $1")
        .bind(input)
        .fetch_one(&pool)
        .await
}
```

### 4. Cryptography

**Use vetted cryptography libraries**:

```toml
[dependencies]
# ✅ Good: Well-audited
ring = "0.17"
rustls = "0.21"
argon2 = "0.5"
chacha20poly1305 = "0.10"

# ❌ Bad: Roll your own crypto
# custom-crypto = "0.1"
```

**Secure password hashing**:

```rust
use argon2::{
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2
};
use rand_core::OsRng;

fn hash_password(password: &str) -> Result<String> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(password.as_bytes(), &salt)?
        .to_string();

    Ok(password_hash)
}

fn verify_password(password: &str, hash: &str) -> Result<bool> {
    let parsed_hash = PasswordHash::new(hash)?;
    Ok(Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .is_ok())
}
```

**Never use**:
- MD5
- SHA-1
- Plain text passwords
- ECB mode encryption
- Weak random number generators

### 5. Secret Management

**Never commit secrets**:

```bash
# .gitignore
.env
.env.local
*.key
*.pem
credentials.json
secrets.yaml
```

**Use environment variables**:

```rust
use std::env;

fn get_api_key() -> Result<String> {
    env::var("API_KEY")
        .map_err(|_| MyError::MissingApiKey)
}
```

**Use secret management services**:
- AWS Secrets Manager
- HashiCorp Vault
- Azure Key Vault
- Google Secret Manager

### 6. Authentication & Authorization

**Secure JWT handling**:

```rust
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};

#[derive(Serialize, Deserialize)]
struct Claims {
    sub: String,
    exp: usize,
    role: String,
}

fn create_token(user_id: &str, role: &str) -> Result<String> {
    let expiration = SystemTime::now()
        .duration_since(UNIX_EPOCH)?
        .as_secs() + 3600;  // 1 hour

    let claims = Claims {
        sub: user_id.to_string(),
        exp: expiration as usize,
        role: role.to_string(),
    };

    let secret = env::var("JWT_SECRET")?;
    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes())
    )?;

    Ok(token)
}
```

**Check authorization**:

```rust
fn check_permission(user: &User, resource: &Resource, action: Action) -> Result<()> {
    if !user.can_access(resource, action) {
        return Err(MyError::Unauthorized);
    }
    Ok(())
}
```

## Security Best Practices

### 1. Least Privilege

```rust
// ❌ Too permissive
fn process_file(path: &str) {
    std::fs::write(path, data).unwrap();  // Can write anywhere
}

// ✅ Restricted
fn process_file(path: &Path, allowed_dir: &Path) -> Result<()> {
    // Ensure path is within allowed directory
    let canonical = path.canonicalize()?;
    if !canonical.starts_with(allowed_dir) {
        return Err(MyError::Unauthorized);
    }

    std::fs::write(canonical, data)?;
    Ok(())
}
```

### 2. Defense in Depth

```rust
// Multiple layers of security
async fn process_request(req: Request) -> Result<Response> {
    // Layer 1: Rate limiting
    rate_limiter.check(&req.ip())?;

    // Layer 2: Authentication
    let user = authenticate(&req)?;

    // Layer 3: Authorization
    authorize(&user, &req.resource)?;

    // Layer 4: Input validation
    validate_input(&req.body)?;

    // Layer 5: Sanitization
    let safe_input = sanitize(&req.body);

    // Process request
    let result = process(safe_input).await?;

    Ok(result)
}
```

### 3. Fail Secure

```rust
// ❌ Fails open (insecure)
fn check_access_bad(user: &User) -> bool {
    match db.check_permission(user) {
        Ok(allowed) => allowed,
        Err(_) => true,  // Default to allowing! ❌
    }
}

// ✅ Fails closed (secure)
fn check_access_good(user: &User) -> Result<bool> {
    db.check_permission(user)  // Propagate error
}
```

## Security Audit Checklist

Before deployment:

- [ ] `cargo audit` passes with 0 vulnerabilities
- [ ] `cargo deny check` passes all policies
- [ ] `cargo geiger` shows minimal unsafe code
- [ ] `gitleaks detect` finds no secrets
- [ ] All `unwrap()`/`expect()` reviewed or removed
- [ ] Input validation implemented
- [ ] Authentication/authorization implemented
- [ ] Secrets stored in environment variables
- [ ] HTTPS/TLS enabled
- [ ] Rate limiting implemented
- [ ] Logging (but not sensitive data)
- [ ] Error messages don't leak info
- [ ] Dependencies up to date
- [ ] Security tests written

## Continuous Security

### GitHub Actions Workflow

```yaml
name: Security Audit

on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: '0 0 * * *'  # Daily

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Install security tools
        run: |
          cargo install cargo-audit
          cargo install cargo-deny
          cargo install cargo-geiger

      - name: Cargo Audit
        run: cargo audit

      - name: Cargo Deny
        run: cargo deny check

      - name: Cargo Geiger
        run: cargo geiger

      - name: GitLeaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Incident Response

If a vulnerability is discovered:

1. **Assess severity** (Critical/High/Medium/Low)
2. **Isolate affected systems**
3. **Apply patch or mitigation**
4. **Update dependencies** (`cargo update`)
5. **Run security audit** (`cargo audit`)
6. **Test thoroughly**
7. **Deploy fix**
8. **Document incident**
9. **Review security practices**
10. **Notify stakeholders** (if data breach)

## Related Files

- **Deny Config**: `deny.toml`
- **Git Ignore**: `.gitignore`
- **Security Policy**: `SECURITY.md`
- **Audit Reports**: `.security/audit-reports/`

## Related Skills

- **Dependency Management**: For updating vulnerable dependencies
- **Debugging & Troubleshooting**: For investigating security issues
- **Rust Development**: For implementing security fixes
