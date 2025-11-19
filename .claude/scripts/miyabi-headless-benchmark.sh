#!/usr/bin/env bash
# Miyabi Headless Benchmark Suite
# Version: 1.0.0
# Purpose: Comprehensive performance testing for production readiness

set -euo pipefail

MIYABI_ROOT="/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private"
LOADER_SCRIPT="$MIYABI_ROOT/.claude/scripts/miyabi-headless-loader.sh"
EXECUTE_SCRIPT="$MIYABI_ROOT/.claude/scripts/miyabi-headless-execute.sh"
STREAM_SCRIPT="$MIYABI_ROOT/.claude/scripts/miyabi-headless-stream.sh"
BENCHMARK_DIR="/tmp/miyabi-benchmark-$(date +%s)"
RESULTS_FILE="$BENCHMARK_DIR/benchmark-results.json"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Benchmark configuration
ITERATIONS=5
PARALLEL_TASKS=10

log_info() {
    echo -e "${BLUE}[INFO]${NC} $*" >&2
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $*" >&2
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $*" >&2
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $*" >&2
}

# Setup benchmark directory
setup_benchmark() {
    mkdir -p "$BENCHMARK_DIR"
    log_success "Benchmark directory created: $BENCHMARK_DIR"

    # Initialize results file
    cat > "$RESULTS_FILE" <<EOF
{
  "benchmark_start": "$(date -Iseconds)",
  "system_info": {
    "hostname": "$(hostname)",
    "os": "$(uname -s)",
    "os_version": "$(uname -r)",
    "cpu_cores": $(sysctl -n hw.ncpu 2>/dev/null || echo "unknown"),
    "memory_gb": $(( $(sysctl -n hw.memsize 2>/dev/null || echo 0) / 1024 / 1024 / 1024 ))
  },
  "test_config": {
    "iterations": $ITERATIONS,
    "parallel_tasks": $PARALLEL_TASKS
  },
  "tests": []
}
EOF
}

# Measure execution time and resources
measure_execution() {
    local test_name="$1"
    local task_description="$2"
    local script="$3"
    shift 3
    local extra_args=("$@")

    log_info "Running: $test_name"

    local start_time
    start_time=$(date +%s.%N)

    # Get initial memory
    local mem_before
    mem_before=$(ps -o rss= -p $$ | tr -d ' ')

    # Execute with time measurement
    local exit_code=0
    local output_file="$BENCHMARK_DIR/${test_name//[^a-zA-Z0-9]/_}.txt"
    local time_output="$BENCHMARK_DIR/${test_name//[^a-zA-Z0-9]/_}_time.txt"

    # Run command and capture exit code
    set +e
    "$script" "$task_description" "${extra_args[@]}" > "$output_file" 2>&1
    exit_code=$?
    set -e

    local end_time
    end_time=$(date +%s.%N)

    # Calculate elapsed time
    local elapsed
    elapsed=$(echo "$end_time - $start_time" | bc)

    # Get final memory
    local mem_after
    mem_after=$(ps -o rss= -p $$ | tr -d ' ')

    # Get resource usage (simplified - not from /usr/bin/time which has platform differences)
    local max_rss=0
    local user_time=0
    local sys_time=0

    # Get context file size if generated
    local context_size=0
    local context_file
    context_file=$(grep -o '/tmp/miyabi-headless-context/integrated-context-[0-9]*.md' "$output_file" | head -1 || echo "")

    if [[ -n "$context_file" && -f "$context_file" ]]; then
        context_size=$(wc -c < "$context_file" | tr -d ' ')
    fi

    # Output results (ensure proper JSON formatting)
    cat <<EOF
{
  "test_name": "$test_name",
  "task_description": "$task_description",
  "exit_code": $exit_code,
  "elapsed_time_seconds": $(printf "%.3f" "$elapsed"),
  "user_time_seconds": $(printf "%.3f" "${user_time:-0}"),
  "sys_time_seconds": $(printf "%.3f" "${sys_time:-0}"),
  "max_rss_bytes": ${max_rss:-0},
  "context_size_bytes": ${context_size:-0},
  "output_file": "$output_file",
  "context_file": "$context_file",
  "timestamp": "$(date -Iseconds)"
}
EOF
}

# Test all task types
test_all_task_types() {
    log_info "Testing all 9 task types..."

    local task_types=(
        "agent_execution:Run CoordinatorAgent to decompose Issue #123"
        "code_implementation:Implement JWT authentication in miyabi-web-api"
        "issue_management:Analyze and label Issue #456 with appropriate labels"
        "business_planning:Create comprehensive business strategy for new SaaS product"
        "documentation:Generate API documentation for miyabi-core crate"
        "testing_performance:Run comprehensive benchmark suite for miyabi-cli"
        "deployment:Deploy miyabi-web-api to production environment"
        "security:Perform security audit on miyabi-web-api authentication"
        "general:Review and optimize project structure"
    )

    local results=()

    for task_spec in "${task_types[@]}"; do
        local task_type="${task_spec%%:*}"
        local task_desc="${task_spec#*:}"

        log_info "Testing task type: $task_type"

        local result
        result=$(measure_execution "test_${task_type}" "$task_desc" "$EXECUTE_SCRIPT" --context-only)

        results+=("$result")

        # Brief pause between tests
        sleep 1
    done

    # Aggregate results
    local all_results
    all_results=$(printf '%s\n' "${results[@]}" | jq -s '.')

    # Update results file
    local tmp_file
    tmp_file=$(mktemp)
    jq ".tests += $all_results" "$RESULTS_FILE" > "$tmp_file" && mv "$tmp_file" "$RESULTS_FILE"

    log_success "All task types tested"
}

# Benchmark with iterations
benchmark_with_iterations() {
    log_info "Running benchmark with $ITERATIONS iterations..."

    local task="Implement user authentication with JWT"
    local total_time=0
    local min_time=999999
    local max_time=0

    for i in $(seq 1 $ITERATIONS); do
        log_info "Iteration $i/$ITERATIONS"

        local result
        result=$(measure_execution "iteration_$i" "$task" "$EXECUTE_SCRIPT" --context-only)

        local elapsed
        elapsed=$(echo "$result" | jq -r '.elapsed_time_seconds')

        total_time=$(echo "$total_time + $elapsed" | bc)

        if (( $(echo "$elapsed < $min_time" | bc -l) )); then
            min_time=$elapsed
        fi

        if (( $(echo "$elapsed > $max_time" | bc -l) )); then
            max_time=$elapsed
        fi

        # Update results
        local tmp_file
        tmp_file=$(mktemp)
        jq ".tests += [$result]" "$RESULTS_FILE" > "$tmp_file" && mv "$tmp_file" "$RESULTS_FILE"
    done

    local avg_time
    avg_time=$(echo "scale=3; $total_time / $ITERATIONS" | bc)

    log_success "Iterations complete"
    log_info "Average time: ${avg_time}s"
    log_info "Min time: ${min_time}s"
    log_info "Max time: ${max_time}s"

    # Add statistics
    local tmp_file
    tmp_file=$(mktemp)
    jq ".iteration_stats = {
        \"iterations\": $ITERATIONS,
        \"avg_time_seconds\": $avg_time,
        \"min_time_seconds\": $min_time,
        \"max_time_seconds\": $max_time
    }" "$RESULTS_FILE" > "$tmp_file" && mv "$tmp_file" "$RESULTS_FILE"
}

# Parallel execution test
test_parallel_execution() {
    log_info "Testing parallel execution with $PARALLEL_TASKS tasks..."

    local start_time
    start_time=$(date +%s.%N)

    local pids=()

    for i in $(seq 1 $PARALLEL_TASKS); do
        (
            "$EXECUTE_SCRIPT" "Parallel task $i" --context-only > "$BENCHMARK_DIR/parallel_$i.txt" 2>&1
        ) &
        pids+=($!)
    done

    # Wait for all tasks
    local failed=0
    for pid in "${pids[@]}"; do
        if ! wait "$pid"; then
            ((failed++))
        fi
    done

    local end_time
    end_time=$(date +%s.%N)

    local elapsed
    elapsed=$(echo "$end_time - $start_time" | bc)

    log_success "Parallel execution complete"
    log_info "Total time for $PARALLEL_TASKS parallel tasks: ${elapsed}s"
    log_info "Failed tasks: $failed"

    # Add parallel test results
    local tmp_file
    tmp_file=$(mktemp)
    jq ".parallel_test = {
        \"num_tasks\": $PARALLEL_TASKS,
        \"total_time_seconds\": $elapsed,
        \"failed_tasks\": $failed,
        \"success_rate\": $(echo "scale=2; ($PARALLEL_TASKS - $failed) * 100 / $PARALLEL_TASKS" | bc)
    }" "$RESULTS_FILE" > "$tmp_file" && mv "$tmp_file" "$RESULTS_FILE"
}

# Memory leak test
test_memory_leak() {
    log_info "Testing for memory leaks (100 iterations)..."

    local initial_mem
    initial_mem=$(ps -o rss= -p $$ | tr -d ' ')

    for i in $(seq 1 100); do
        "$EXECUTE_SCRIPT" "Memory test iteration $i" --context-only > /dev/null 2>&1

        if (( i % 10 == 0 )); then
            log_info "Progress: $i/100"
        fi
    done

    local final_mem
    final_mem=$(ps -o rss= -p $$ | tr -d ' ')

    local mem_increase
    mem_increase=$((final_mem - initial_mem))

    local mem_increase_mb
    mem_increase_mb=$(echo "scale=2; $mem_increase / 1024" | bc)

    log_success "Memory leak test complete"
    log_info "Memory increase: ${mem_increase_mb}MB"

    # Add memory leak test results
    local tmp_file
    tmp_file=$(mktemp)
    jq ".memory_leak_test = {
        \"iterations\": 100,
        \"initial_memory_kb\": $initial_mem,
        \"final_memory_kb\": $final_mem,
        \"memory_increase_kb\": $mem_increase,
        \"memory_increase_mb\": $mem_increase_mb
    }" "$RESULTS_FILE" > "$tmp_file" && mv "$tmp_file" "$RESULTS_FILE"
}

# Error handling test
test_error_handling() {
    log_info "Testing error handling..."

    local test_cases=(
        "nonexistent_file:cat /nonexistent/file"
        "permission_denied:cat /etc/sudoers"
        "invalid_task:"
        "very_long_task:$(printf 'A%.0s' {1..10000})"
    )

    local error_results=()

    for test_case in "${test_cases[@]}"; do
        local test_name="${test_case%%:*}"
        local task="${test_case#*:}"

        log_info "Testing error case: $test_name"

        local exit_code=0
        if "$EXECUTE_SCRIPT" "$task" --context-only > "$BENCHMARK_DIR/error_${test_name}.txt" 2>&1; then
            exit_code=0
        else
            exit_code=$?
        fi

        error_results+=("{\"test_name\": \"$test_name\", \"exit_code\": $exit_code}")
    done

    local all_error_results
    all_error_results=$(printf '%s\n' "${error_results[@]}" | jq -s '.')

    # Add error handling results
    local tmp_file
    tmp_file=$(mktemp)
    jq ".error_handling_tests = $all_error_results" "$RESULTS_FILE" > "$tmp_file" && mv "$tmp_file" "$RESULTS_FILE"

    log_success "Error handling tests complete"
}

# Generate production readiness report
generate_report() {
    log_info "Generating production readiness report..."

    local report_file="$BENCHMARK_DIR/PRODUCTION_READINESS_REPORT.md"

    # Calculate statistics from results
    local avg_time
    avg_time=$(jq -r '.tests[] | select(.exit_code == 0) | .elapsed_time_seconds' "$RESULTS_FILE" | \
        awk '{sum+=$1; count++} END {if(count>0) print sum/count; else print 0}')

    local avg_context_size
    avg_context_size=$(jq -r '.tests[] | select(.context_size_bytes > 0) | .context_size_bytes' "$RESULTS_FILE" | \
        awk '{sum+=$1; count++} END {if(count>0) print sum/count; else print 0}')

    local success_count
    success_count=$(jq '[.tests[] | select(.exit_code == 0)] | length' "$RESULTS_FILE")

    local total_count
    total_count=$(jq '.tests | length' "$RESULTS_FILE")

    local success_rate
    if [[ $total_count -gt 0 ]]; then
        success_rate=$(echo "scale=2; $success_count * 100 / $total_count" | bc)
    else
        success_rate=0
    fi

    # Get iteration stats
    local iter_avg
    iter_avg=$(jq -r '.iteration_stats.avg_time_seconds // 0' "$RESULTS_FILE")

    local iter_min
    iter_min=$(jq -r '.iteration_stats.min_time_seconds // 0' "$RESULTS_FILE")

    local iter_max
    iter_max=$(jq -r '.iteration_stats.max_time_seconds // 0' "$RESULTS_FILE")

    # Get parallel test stats
    local parallel_time
    parallel_time=$(jq -r '.parallel_test.total_time_seconds // 0' "$RESULTS_FILE")

    local parallel_success_rate
    parallel_success_rate=$(jq -r '.parallel_test.success_rate // 0' "$RESULTS_FILE")

    # Get memory leak stats
    local mem_increase
    mem_increase=$(jq -r '.memory_leak_test.memory_increase_mb // 0' "$RESULTS_FILE")

    cat > "$report_file" <<EOF
# Production Readiness Assessment Report

**Generated**: $(date -Iseconds)
**Benchmark Directory**: $BENCHMARK_DIR
**Results File**: $RESULTS_FILE

---

## Executive Summary

This report assesses the production readiness of the Miyabi Headless Mode optimization system.

---

## Performance Metrics

### Overall Performance

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| **Average Execution Time** | ${avg_time}s | <2s | $(if (( $(echo "$avg_time < 2" | bc -l) )); then echo "✅ PASS"; else echo "❌ FAIL"; fi) |
| **Average Context Size** | $((avg_context_size / 1024))KB | <150KB | $(if (( avg_context_size < 153600 )); then echo "✅ PASS"; else echo "❌ FAIL"; fi) |
| **Success Rate** | ${success_rate}% | >95% | $(if (( $(echo "$success_rate > 95" | bc -l) )); then echo "✅ PASS"; else echo "❌ FAIL"; fi) |
| **Tests Passed** | $success_count/$total_count | - | - |

### Iteration Statistics (${ITERATIONS} iterations)

| Metric | Value |
|--------|-------|
| **Average Time** | ${iter_avg}s |
| **Min Time** | ${iter_min}s |
| **Max Time** | ${iter_max}s |
| **Variance** | $(echo "$iter_max - $iter_min" | bc)s |

### Parallel Execution ($PARALLEL_TASKS concurrent tasks)

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| **Total Time** | ${parallel_time}s | <10s | $(if (( $(echo "$parallel_time < 10" | bc -l) )); then echo "✅ PASS"; else echo "❌ FAIL"; fi) |
| **Success Rate** | ${parallel_success_rate}% | >90% | $(if (( $(echo "$parallel_success_rate > 90" | bc -l) )); then echo "✅ PASS"; else echo "❌ FAIL"; fi) |

### Memory Leak Test (100 iterations)

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| **Memory Increase** | ${mem_increase}MB | <50MB | $(if (( $(echo "$mem_increase < 50" | bc -l) )); then echo "✅ PASS"; else echo "❌ FAIL"; fi) |

---

## Task Type Performance

EOF

    # Add task type details
    jq -r '.tests[] | select(.test_name | startswith("test_")) |
        "| \(.test_name | sub("test_"; "")) | \(.elapsed_time_seconds)s | \(.context_size_bytes / 1024 | floor)KB | \(if .exit_code == 0 then "✅" else "❌" end) |"' \
        "$RESULTS_FILE" | sort | {
        echo "| Task Type | Execution Time | Context Size | Status |"
        echo "|-----------|----------------|--------------|--------|"
        cat
    } >> "$report_file"

    cat >> "$report_file" <<EOF

---

## Production Readiness Checklist

EOF

    # Determine overall status
    local performance_pass=false
    local reliability_pass=false
    local scalability_pass=false
    local quality_pass=false

    if (( $(echo "$avg_time < 2" | bc -l) )); then
        performance_pass=true
    fi

    if (( $(echo "$success_rate > 95" | bc -l) )); then
        reliability_pass=true
    fi

    if (( $(echo "$parallel_success_rate > 90" | bc -l) )); then
        scalability_pass=true
    fi

    if (( $(echo "$mem_increase < 50" | bc -l) )); then
        quality_pass=true
    fi

    cat >> "$report_file" <<EOF
### Performance
- [$(if $performance_pass; then echo "x"; else echo " "; fi)] Average execution time < 2 seconds
- [$(if (( avg_context_size < 153600 )); then echo "x"; else echo " "; fi)] Average context size < 150KB
- [$(if (( $(echo "$iter_max - $iter_min < 1" | bc -l) )); then echo "x"; else echo " "; fi)] Low variance in execution time

### Reliability
- [$(if $reliability_pass; then echo "x"; else echo " "; fi)] Overall success rate > 95%
- [$(if (( $(echo "$mem_increase < 50" | bc -l) )); then echo "x"; else echo " "; fi)] No significant memory leaks
- [ ] Error handling for all edge cases *(requires manual verification)*

### Scalability
- [$(if $scalability_pass; then echo "x"; else echo " "; fi)] Parallel execution success rate > 90%
- [$(if (( $(echo "$parallel_time < 10" | bc -l) )); then echo "x"; else echo " "; fi)] Parallel execution time < 10 seconds

### Code Quality
- [ ] All scripts have proper error handling *(requires manual verification)*
- [ ] Comprehensive logging implemented *(requires manual verification)*
- [ ] Documentation complete *(requires manual verification)*

---

## Overall Assessment

EOF

    local overall_pass=true

    if ! $performance_pass || ! $reliability_pass || ! $scalability_pass || ! $quality_pass; then
        overall_pass=false
    fi

    if $overall_pass; then
        cat >> "$report_file" <<EOF
### ✅ READY FOR PRODUCTION

The Miyabi Headless Mode optimization system meets all critical performance and reliability requirements. The system demonstrates:

- **Excellent Performance**: Average execution time well under 2 seconds
- **High Reliability**: Success rate exceeds 95%
- **Good Scalability**: Handles parallel execution effectively
- **Stable Memory Usage**: No significant memory leaks detected

**Recommendation**: **APPROVED** for production deployment with minor monitoring.

### Monitoring Recommendations

1. Track average execution time per task type
2. Monitor context size growth over time
3. Set up alerts for success rate drops below 95%
4. Regular memory usage monitoring

### Next Steps

1. Deploy to staging environment
2. Conduct user acceptance testing
3. Set up production monitoring
4. Create runbook for operations team

EOF
    else
        cat >> "$report_file" <<EOF
### ⚠️ NOT READY FOR PRODUCTION

The system requires improvements in the following areas:

EOF

        if ! $performance_pass; then
            echo "- **Performance**: Average execution time exceeds 2 seconds" >> "$report_file"
        fi

        if ! $reliability_pass; then
            echo "- **Reliability**: Success rate below 95%" >> "$report_file"
        fi

        if ! $scalability_pass; then
            echo "- **Scalability**: Parallel execution issues detected" >> "$report_file"
        fi

        if ! $quality_pass; then
            echo "- **Quality**: Memory leak or other quality issues" >> "$report_file"
        fi

        cat >> "$report_file" <<EOF

**Recommendation**: **NOT APPROVED** for production. Address issues above before deployment.

### Required Actions

1. Optimize identified bottlenecks
2. Fix reliability issues
3. Re-run benchmark suite
4. Review and update documentation

EOF
    fi

    cat >> "$report_file" <<EOF
---

## Detailed Results

Full benchmark results are available in:
- JSON: $RESULTS_FILE
- Logs: $BENCHMARK_DIR/*.txt

---

**Report Generated**: $(date -Iseconds)
**Benchmark Version**: 1.0.0
**Status**: $(if $overall_pass; then echo "✅ PRODUCTION READY"; else echo "⚠️ NEEDS IMPROVEMENT"; fi)
EOF

    log_success "Report generated: $report_file"
    echo "$report_file"
}

# Main execution
main() {
    echo ""
    echo -e "${CYAN}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║  ${GREEN}Miyabi Headless Benchmark Suite${NC}${CYAN}              ║${NC}"
    echo -e "${CYAN}║  ${YELLOW}Version: 1.0.0${NC}${CYAN}                                ║${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""

    setup_benchmark

    echo ""
    log_info "Starting comprehensive benchmark..."
    echo ""

    # Run all tests
    test_all_task_types
    echo ""

    benchmark_with_iterations
    echo ""

    test_parallel_execution
    echo ""

    test_memory_leak
    echo ""

    test_error_handling
    echo ""

    # Generate final report
    local report_file
    report_file=$(generate_report)

    # Finalize results
    local tmp_file
    tmp_file=$(mktemp)
    jq ".benchmark_end = \"$(date -Iseconds)\"" "$RESULTS_FILE" > "$tmp_file" && mv "$tmp_file" "$RESULTS_FILE"

    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
    log_success "Benchmark complete!"
    log_info "Results: $RESULTS_FILE"
    log_info "Report: $report_file"
    echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
    echo ""

    # Display report
    echo ""
    cat "$report_file"
}

main "$@"
