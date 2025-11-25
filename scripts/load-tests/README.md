# Miyabi Load Test Framework

Issue: #853 - Load Test & Performance Test

## Overview

This framework provides comprehensive load testing capabilities for the Miyabi 200-Agent experiment infrastructure. It simulates concurrent agent operations to validate system performance under various load conditions.

## Quick Start

```bash
# Run normal load test (200 agents, 4 hours)
./run_load_test.sh normal

# Run peak load test (400 agents, 2 hours)
./run_load_test.sh peak

# Run spike test (rapid increase/decrease)
./run_load_test.sh spike

# Run endurance test (200 agents, 24 hours)
./run_load_test.sh endurance
```

## Test Scenarios

### 1. Normal Load (200 agents, 4h)
Simulates standard production load with gradual ramp-up.
```bash
./run_load_test.sh normal
# or with Python directly:
python load_test.py --scenario normal
```

### 2. Peak Load (400 agents, 2h)
Tests system behavior at double the normal capacity.
```bash
./run_load_test.sh peak
# or:
python load_test.py --scenario peak --agents 400 --duration 7200
```

### 3. Spike Load
Simulates sudden traffic spikes at specific intervals.
```bash
./run_load_test.sh spike
```
- Spikes occur at 5, 10, and 15 minutes
- Load increases 3x during spikes

### 4. Endurance Test (24h)
Long-running test to identify memory leaks and stability issues.
```bash
./run_load_test.sh endurance --duration 86400
```

## Success Criteria

| Metric | Threshold |
|--------|-----------|
| CPU Usage | < 70% |
| Success Rate | > 99% |
| P95 Response Time | < 2.0s |

## Configuration Options

### Shell Script Options
```bash
./run_load_test.sh <scenario> [options]

Options:
  --url <url>        Target API URL (default: http://localhost:4000)
  --output <dir>     Output directory for results
  --agents <n>       Override number of agents
  --duration <s>     Override test duration in seconds
```

### Python Script Options
```bash
python load_test.py --scenario <scenario> [options]

Options:
  --scenario         normal|peak|spike|endurance
  --agents <n>       Override number of agents
  --duration <s>     Override duration in seconds
  --url <url>        Target API URL
  --output <dir>     Output directory
  --dry-run          Show configuration without running
```

## Output

### JSON Report
Each test run generates a JSON report with detailed metrics:
```json
{
  "scenario": "normal",
  "config": {...},
  "metrics": {
    "total_tasks": 2000,
    "successful_tasks": 1990,
    "failed_tasks": 10,
    "success_rate_percent": 99.5,
    "avg_response_time_ms": 150.5,
    "p95_response_time_ms": 450.2,
    "p99_response_time_ms": 890.1
  },
  "passed": true
}
```

### Summary Report
A markdown summary (SUMMARY.md) is generated after each test:
- Configuration details
- Pass/fail status for each criterion
- Overall test result

## Agent Types Simulated

The framework simulates 7 different agent types with varying processing times:

| Agent Type | Base Processing Time |
|------------|---------------------|
| CodeGenAgent | 5.0s |
| DeploymentAgent | 10.0s |
| ReviewAgent | 3.0s |
| PRAgent | 2.0s |
| IssueAgent | 1.0s |
| CoordinatorAgent | 0.5s |
| RefresherAgent | 0.2s |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| API_URL | Target API URL | http://localhost:4000 |
| OUTPUT_DIR | Results output directory | ./load-test-results |
| SKIP_API_CHECK | Skip API availability check | 0 |
| DRY_RUN | Show config without running | 0 |

## Requirements

- Python 3.8+
- aiohttp (`pip install aiohttp`)
- curl (for API health checks)

## CI/CD Integration

Add to GitHub Actions:
```yaml
- name: Run Load Test
  run: |
    cd scripts/load-tests
    ./run_load_test.sh normal --duration 300
  timeout-minutes: 10
```

## Troubleshooting

### API not available
```bash
# Skip API check for dry-run
SKIP_API_CHECK=1 ./run_load_test.sh normal

# Or check API manually
curl http://localhost:4000/health
```

### Missing dependencies
```bash
pip3 install aiohttp
```

### High error rate
- Check API logs for errors
- Verify network connectivity
- Reduce agent count: `--agents 100`

## Related Issues

- Issue #853: Load Test & Performance Test
- Issue #883: Phase 3 - 200-Agent Live Experiment
