#!/bin/bash
# Miyabi Security Audit Script
# Issue: #849 - Security Hardening & Audit
#
# Performs comprehensive security checks:
# - Dependency vulnerability scanning
# - Secrets detection
# - Code security analysis
# - Infrastructure security review

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
REPORT_DIR="${PROJECT_ROOT}/security-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[PASS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[FAIL]${NC} $1"; }

# Results tracking
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

record_result() {
    local status=$1
    local message=$2
    ((TOTAL_CHECKS++))
    case $status in
        pass) ((PASSED_CHECKS++)); log_success "$message" ;;
        fail) ((FAILED_CHECKS++)); log_error "$message" ;;
        warn) ((WARNINGS++)); log_warn "$message" ;;
    esac
}

# =============================================================================
# Initialization
# =============================================================================

initialize() {
    echo ""
    echo "========================================"
    echo "    Miyabi Security Audit"
    echo "========================================"
    echo ""
    log_info "Project: $PROJECT_ROOT"
    log_info "Timestamp: $TIMESTAMP"
    echo ""

    mkdir -p "$REPORT_DIR"
}

# =============================================================================
# Dependency Security Checks
# =============================================================================

check_rust_dependencies() {
    log_info "Checking Rust dependencies for vulnerabilities..."

    if ! command -v cargo-audit &> /dev/null; then
        log_warn "cargo-audit not installed. Installing..."
        cargo install cargo-audit 2>/dev/null || {
            record_result warn "cargo-audit installation failed"
            return
        }
    fi

    cd "$PROJECT_ROOT"
    if cargo audit --json > "$REPORT_DIR/cargo_audit_${TIMESTAMP}.json" 2>/dev/null; then
        local vuln_count=$(jq '.vulnerabilities.count // 0' "$REPORT_DIR/cargo_audit_${TIMESTAMP}.json" 2>/dev/null || echo "0")
        if [ "$vuln_count" -eq 0 ]; then
            record_result pass "No Rust dependency vulnerabilities found"
        else
            record_result fail "Found $vuln_count Rust dependency vulnerabilities"
        fi
    else
        record_result warn "cargo audit failed to run"
    fi
}

check_npm_dependencies() {
    log_info "Checking npm dependencies..."

    local package_files=$(find "$PROJECT_ROOT" -name "package.json" -not -path "*/node_modules/*" 2>/dev/null)

    if [ -z "$package_files" ]; then
        record_result pass "No npm packages to check"
        return
    fi

    for pkg_file in $package_files; do
        local pkg_dir=$(dirname "$pkg_file")
        if [ -d "$pkg_dir/node_modules" ]; then
            cd "$pkg_dir"
            local audit_output=$(npm audit --json 2>/dev/null || echo '{"vulnerabilities":{}}')
            local vuln_count=$(echo "$audit_output" | jq '.metadata.vulnerabilities.total // 0' 2>/dev/null || echo "0")

            if [ "$vuln_count" -eq 0 ]; then
                record_result pass "No npm vulnerabilities in $pkg_dir"
            else
                record_result warn "Found $vuln_count npm vulnerabilities in $pkg_dir"
            fi
        fi
    done
}

# =============================================================================
# Secrets Detection
# =============================================================================

check_secrets() {
    log_info "Scanning for hardcoded secrets..."

    local secret_patterns=(
        "password\s*=\s*['\"][^'\"]+['\"]"
        "api_key\s*=\s*['\"][^'\"]+['\"]"
        "secret\s*=\s*['\"][^'\"]+['\"]"
        "token\s*=\s*['\"][^'\"]+['\"]"
        "AKIA[0-9A-Z]{16}"
        "-----BEGIN (RSA |OPENSSH )?PRIVATE KEY-----"
        "ghp_[0-9a-zA-Z]{36}"
        "gho_[0-9a-zA-Z]{36}"
        "sk-[0-9a-zA-Z]{48}"
    )

    local findings=0
    local report_file="$REPORT_DIR/secrets_scan_${TIMESTAMP}.txt"

    echo "Secrets Scan Report - $(date)" > "$report_file"
    echo "==============================" >> "$report_file"

    for pattern in "${secret_patterns[@]}"; do
        local matches=$(grep -rEn "$pattern" "$PROJECT_ROOT" \
            --include="*.rs" --include="*.toml" --include="*.yaml" --include="*.yml" \
            --include="*.json" --include="*.ts" --include="*.js" \
            --exclude-dir=target --exclude-dir=node_modules --exclude-dir=.git \
            2>/dev/null | grep -v "test" | grep -v "example" | head -20 || true)

        if [ -n "$matches" ]; then
            echo "" >> "$report_file"
            echo "Pattern: $pattern" >> "$report_file"
            echo "$matches" >> "$report_file"
            ((findings++))
        fi
    done

    if [ $findings -eq 0 ]; then
        record_result pass "No hardcoded secrets detected"
    else
        record_result fail "Found potential hardcoded secrets (see $report_file)"
    fi
}

check_env_files() {
    log_info "Checking for committed .env files..."

    local env_files=$(find "$PROJECT_ROOT" -name ".env" -o -name ".env.local" -o -name ".env.production" 2>/dev/null | grep -v node_modules || true)

    if [ -z "$env_files" ]; then
        record_result pass "No .env files found in repository"
    else
        record_result fail "Found .env files: $env_files"
    fi
}

# =============================================================================
# Code Security Analysis
# =============================================================================

check_unsafe_rust() {
    log_info "Scanning for unsafe Rust code..."

    local unsafe_count=$(grep -rn "unsafe " "$PROJECT_ROOT/crates" --include="*.rs" 2>/dev/null | wc -l | tr -d ' ')

    if [ "$unsafe_count" -eq 0 ]; then
        record_result pass "No unsafe Rust code found"
    elif [ "$unsafe_count" -lt 10 ]; then
        record_result warn "Found $unsafe_count unsafe blocks (review recommended)"
    else
        record_result fail "Found $unsafe_count unsafe blocks (needs review)"
    fi
}

check_sql_injection() {
    log_info "Checking for potential SQL injection vulnerabilities..."

    local raw_sql=$(grep -rEn "(execute|query)\s*\(\s*format!" "$PROJECT_ROOT/crates" --include="*.rs" 2>/dev/null || true)

    if [ -z "$raw_sql" ]; then
        record_result pass "No raw SQL formatting found"
    else
        record_result warn "Found potential raw SQL formatting (review recommended)"
        echo "$raw_sql" >> "$REPORT_DIR/sql_injection_${TIMESTAMP}.txt"
    fi
}

check_command_injection() {
    log_info "Checking for potential command injection..."

    local cmd_exec=$(grep -rEn "(Command::new|std::process::Command)" "$PROJECT_ROOT/crates" --include="*.rs" 2>/dev/null || true)

    if [ -z "$cmd_exec" ]; then
        record_result pass "No shell command execution found"
    else
        local count=$(echo "$cmd_exec" | wc -l | tr -d ' ')
        record_result warn "Found $count command executions (review recommended)"
    fi
}

# =============================================================================
# Infrastructure Security
# =============================================================================

check_terraform_security() {
    log_info "Checking Terraform security configurations..."

    # Check for public S3 buckets
    local public_s3=$(grep -rn "acl\s*=\s*\"public" "$PROJECT_ROOT/infrastructure" --include="*.tf" 2>/dev/null || true)
    if [ -z "$public_s3" ]; then
        record_result pass "No public S3 buckets in Terraform"
    else
        record_result fail "Found public S3 bucket configurations"
    fi

    # Check for encryption
    local unencrypted=$(grep -rn "encrypt\s*=\s*false" "$PROJECT_ROOT/infrastructure" --include="*.tf" 2>/dev/null || true)
    if [ -z "$unencrypted" ]; then
        record_result pass "No unencrypted resources in Terraform"
    else
        record_result fail "Found unencrypted resource configurations"
    fi

    # Check for hardcoded credentials
    local hardcoded=$(grep -rEn "(password|secret|token)\s*=\s*\"[^$]" "$PROJECT_ROOT/infrastructure" --include="*.tf" 2>/dev/null || true)
    if [ -z "$hardcoded" ]; then
        record_result pass "No hardcoded credentials in Terraform"
    else
        record_result fail "Found hardcoded credentials in Terraform"
    fi
}

check_docker_security() {
    log_info "Checking Dockerfile security..."

    local dockerfiles=$(find "$PROJECT_ROOT" -name "Dockerfile*" 2>/dev/null || true)

    for dockerfile in $dockerfiles; do
        # Check for root user
        if grep -q "USER root" "$dockerfile" 2>/dev/null; then
            record_result warn "Dockerfile runs as root: $dockerfile"
        fi

        # Check for latest tag
        if grep -qE "FROM .+:latest" "$dockerfile" 2>/dev/null; then
            record_result warn "Dockerfile uses :latest tag: $dockerfile"
        fi
    done

    if [ -z "$dockerfiles" ]; then
        record_result pass "No Dockerfiles to check"
    fi
}

# =============================================================================
# GitHub Security
# =============================================================================

check_github_actions() {
    log_info "Checking GitHub Actions security..."

    local workflows=$(find "$PROJECT_ROOT/.github/workflows" -name "*.yml" -o -name "*.yaml" 2>/dev/null || true)

    if [ -z "$workflows" ]; then
        record_result pass "No GitHub workflows to check"
        return
    fi

    for workflow in $workflows; do
        # Check for secrets in logs
        if grep -qE "echo.*\\\$\{\{.*secrets\." "$workflow" 2>/dev/null; then
            record_result fail "Potential secret leak in workflow: $workflow"
        fi

        # Check for shell injection
        if grep -qE "run:.*\\\$\{\{.*github\." "$workflow" 2>/dev/null; then
            record_result warn "Potential shell injection in workflow: $workflow"
        fi
    done

    record_result pass "GitHub Actions basic security checks passed"
}

# =============================================================================
# Report Generation
# =============================================================================

generate_report() {
    local report_file="$REPORT_DIR/security_audit_${TIMESTAMP}.md"

    cat > "$report_file" << EOF
# Miyabi Security Audit Report

**Date**: $(date)
**Project**: $PROJECT_ROOT

## Summary

| Metric | Count |
|--------|-------|
| Total Checks | $TOTAL_CHECKS |
| Passed | $PASSED_CHECKS |
| Failed | $FAILED_CHECKS |
| Warnings | $WARNINGS |

## Score

$(calculate_score)

## Recommendations

$(generate_recommendations)

## Files Generated

$(ls -la "$REPORT_DIR"/*_${TIMESTAMP}* 2>/dev/null || echo "No detailed reports generated")

---
Generated by Miyabi Security Audit Script
EOF

    echo ""
    log_info "Report generated: $report_file"
}

calculate_score() {
    if [ $TOTAL_CHECKS -eq 0 ]; then
        echo "N/A"
        return
    fi

    local score=$(echo "scale=0; ($PASSED_CHECKS * 100) / $TOTAL_CHECKS" | bc 2>/dev/null || echo "0")

    if [ "$score" -ge 90 ]; then
        echo "**A** ($score/100) - Excellent"
    elif [ "$score" -ge 80 ]; then
        echo "**B** ($score/100) - Good"
    elif [ "$score" -ge 70 ]; then
        echo "**C** ($score/100) - Acceptable"
    elif [ "$score" -ge 60 ]; then
        echo "**D** ($score/100) - Needs Improvement"
    else
        echo "**F** ($score/100) - Critical Issues"
    fi
}

generate_recommendations() {
    if [ $FAILED_CHECKS -gt 0 ]; then
        echo "- Address $FAILED_CHECKS critical security issues immediately"
    fi
    if [ $WARNINGS -gt 0 ]; then
        echo "- Review $WARNINGS warnings for potential improvements"
    fi
    if [ $PASSED_CHECKS -eq $TOTAL_CHECKS ]; then
        echo "- All security checks passed. Continue monitoring."
    fi
    echo "- Run this audit regularly as part of CI/CD"
    echo "- Consider additional penetration testing for production"
}

print_summary() {
    echo ""
    echo "========================================"
    echo "    Security Audit Summary"
    echo "========================================"
    echo ""
    echo -e "Total Checks: $TOTAL_CHECKS"
    echo -e "${GREEN}Passed: $PASSED_CHECKS${NC}"
    echo -e "${RED}Failed: $FAILED_CHECKS${NC}"
    echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
    echo ""

    if [ $FAILED_CHECKS -eq 0 ]; then
        echo -e "${GREEN}✓ Security audit PASSED${NC}"
        return 0
    else
        echo -e "${RED}✗ Security audit FAILED${NC}"
        return 1
    fi
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    initialize

    # Dependency checks
    check_rust_dependencies
    check_npm_dependencies

    # Secrets detection
    check_secrets
    check_env_files

    # Code security
    check_unsafe_rust
    check_sql_injection
    check_command_injection

    # Infrastructure
    check_terraform_security
    check_docker_security

    # GitHub
    check_github_actions

    # Generate report
    generate_report
    print_summary
}

# Handle Ctrl+C
trap 'log_warn "Audit interrupted"; exit 130' INT

main "$@"
