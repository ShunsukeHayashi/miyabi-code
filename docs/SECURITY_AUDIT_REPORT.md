# Security Audit Report

**Date**: 2025-10-23
**Tool**: cargo-audit v0.21.2
**Advisory Database**: 858 security advisories
**Total Dependencies**: 538 crates

## Summary

- **🔴 Critical Vulnerabilities**: 0
- **🟠 High Vulnerabilities**: 3
- **🟡 Medium Vulnerabilities**: 2
- **⚠️ Unmaintained Warnings**: 6

## High Priority Vulnerabilities

### 1. sqlx 0.7.4 - Binary Protocol Misinterpretation
- **ID**: RUSTSEC-2024-0363
- **Severity**: High
- **Affected**: `miyabi-web-api`
- **Solution**: Upgrade to `sqlx >= 0.8.1`
- **Impact**: Data integrity issues in database communication
- **Action**: 🔴 **CRITICAL - Update immediately**

### 2. rustls 0.20.9 - Infinite Loop DoS
- **ID**: RUSTSEC-2024-0336
- **Severity**: 7.5 (High)
- **Affected**: `miyabi-discord-mcp-server`
- **Solution**: Upgrade to `rustls >= 0.23.5`
- **Impact**: Denial of Service via network input
- **Action**: 🟠 **HIGH - Update soon** (discord-mcp-server is excluded from main workspace)

### 3. tungstenite 0.18.0 - DoS Attack
- **ID**: RUSTSEC-2023-0065
- **Severity**: 7.5 (High)
- **Affected**: `miyabi-discord-mcp-server`
- **Solution**: Upgrade to `tungstenite >= 0.20.1`
- **Impact**: Remote attackers can cause denial of service
- **Action**: 🟠 **HIGH - Update soon**

## Medium Priority Vulnerabilities

### 4. rsa 0.9.8 - Marvin Attack
- **ID**: RUSTSEC-2023-0071
- **Severity**: 5.9 (Medium)
- **Affected**: `miyabi-web-api` (via sqlx-mysql)
- **Solution**: ⚠️ No fixed upgrade available
- **Impact**: Potential key recovery through timing sidechannels
- **Action**: 🟡 **MEDIUM - Monitor for updates**

### 5. ring 0.16.20 - AES Panic
- **ID**: RUSTSEC-2025-0009
- **Affected**: `miyabi-discord-mcp-server`
- **Solution**: Upgrade to `ring >= 0.17.12`
- **Action**: 🟡 **MEDIUM - Update when convenient**

## Unmaintained Dependencies (Warnings)

1. **dotenv 0.15.0** - Use `dotenvy` instead
2. **instant 0.1.13** - Unmaintained
3. **net2 0.2.39** - Use `socket2` instead
4. **paste 1.0.15** - No longer maintained
5. **proc-macro-error 1.0.4** - Unmaintained
6. **ring 0.16.20** - Unmaintained (upgrade to 0.17+)

## Remediation Plan

### Phase 1: Critical (Immediate)
```bash
# Update miyabi-web-api dependencies
cd crates/miyabi-web-api
cargo update -p sqlx
# Manually update Cargo.toml: sqlx = "0.8"
```

### Phase 2: High Priority (This Week)
```bash
# discord-mcp-server is already excluded from main workspace
# Update separately when needed
cd crates/miyabi-discord-mcp-server
cargo update -p rustls -p tungstenite -p ring
```

### Phase 3: Medium Priority (This Month)
- Monitor for rsa updates
- Consider alternative crypto libraries if needed

### Phase 4: Maintenance (Ongoing)
- Replace unmaintained dependencies:
  - dotenv → dotenvy
  - net2 → socket2
  - instant → (check for alternatives)

## Testing After Updates

```bash
# Run full test suite
cargo test --workspace --exclude miyabi-discord-mcp-server

# Re-run security audit
cargo audit

# Check for regressions
cargo clippy --workspace --exclude miyabi-discord-mcp-server -- -D warnings
```

## Notes

- `miyabi-discord-mcp-server` is excluded from main workspace due to dependency conflicts
- Priority is on `miyabi-web-api` and core crates
- Regular security audits recommended (weekly)

---

**Generated**: 2025-10-23  
**Auditor**: Claude Code (AI Assistant)  
**Status**: Action Required
