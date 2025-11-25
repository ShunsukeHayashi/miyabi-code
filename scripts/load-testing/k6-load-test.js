// Miyabi API Load Testing Script (k6)
// Phase 4.1: Load Testing & Performance Validation
// Issue: #988

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const healthCheckDuration = new Trend('health_check_duration');
const dashboardDuration = new Trend('dashboard_duration');
const agentsDuration = new Trend('agents_duration');
const requestCount = new Counter('request_count');

// Configuration from environment
const BASE_URL = __ENV.API_URL || 'http://localhost:4000/api/v1';
const JWT_TOKEN = __ENV.JWT_TOKEN || '';

// Test scenarios
export const options = {
  scenarios: {
    // Scenario 1: Normal Load (baseline)
    normal_load: {
      executor: 'constant-vus',
      vus: 50,
      duration: '5m',
      startTime: '0s',
      tags: { scenario: 'normal' },
    },
    // Scenario 2: Peak Load (2x normal)
    peak_load: {
      executor: 'constant-vus',
      vus: 100,
      duration: '5m',
      startTime: '6m',
      tags: { scenario: 'peak' },
    },
    // Scenario 3: Stress Test (gradual increase)
    stress_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },
        { duration: '5m', target: 200 },
        { duration: '2m', target: 300 },
        { duration: '5m', target: 300 },
        { duration: '2m', target: 0 },
      ],
      startTime: '12m',
      tags: { scenario: 'stress' },
    },
    // Scenario 4: Spike Test (sudden burst)
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 500 },
        { duration: '1m', target: 500 },
        { duration: '10s', target: 0 },
      ],
      startTime: '28m',
      tags: { scenario: 'spike' },
    },
    // Scenario 5: Soak Test (extended duration)
    soak_test: {
      executor: 'constant-vus',
      vus: 50,
      duration: '30m',
      startTime: '30m',
      tags: { scenario: 'soak' },
    },
  },
  thresholds: {
    // Performance thresholds
    http_req_duration: ['p(95)<200', 'p(99)<500'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.01'],
    // Endpoint-specific thresholds
    health_check_duration: ['p(95)<50'],
    dashboard_duration: ['p(95)<200'],
    agents_duration: ['p(95)<150'],
  },
};

// Request headers
function getHeaders() {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (JWT_TOKEN) {
    headers['Authorization'] = `Bearer ${JWT_TOKEN}`;
  }
  return headers;
}

// Health check endpoint
function testHealthCheck() {
  const startTime = Date.now();
  const res = http.get(`${BASE_URL}/health`, { headers: getHeaders() });
  healthCheckDuration.add(Date.now() - startTime);
  requestCount.add(1);

  const success = check(res, {
    'health check status is 200': (r) => r.status === 200,
    'health check response has status': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.status === 'ok' || body.status === 'healthy';
      } catch (e) {
        return false;
      }
    },
  });

  errorRate.add(!success);
  return res;
}

// Dashboard summary endpoint
function testDashboardSummary() {
  const startTime = Date.now();
  const res = http.get(`${BASE_URL}/dashboard/summary`, { headers: getHeaders() });
  dashboardDuration.add(Date.now() - startTime);
  requestCount.add(1);

  const success = check(res, {
    'dashboard status is 200 or 401': (r) => r.status === 200 || r.status === 401,
  });

  errorRate.add(!success);
  return res;
}

// Agents list endpoint
function testAgentsList() {
  const startTime = Date.now();
  const res = http.get(`${BASE_URL}/agents`, { headers: getHeaders() });
  agentsDuration.add(Date.now() - startTime);
  requestCount.add(1);

  const success = check(res, {
    'agents status is 200': (r) => r.status === 200,
    'agents returns array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body) || (body.agents && Array.isArray(body.agents));
      } catch (e) {
        return false;
      }
    },
  });

  errorRate.add(!success);
  return res;
}

// Infrastructure status endpoint
function testInfrastructureStatus() {
  const res = http.get(`${BASE_URL}/infrastructure/status`, { headers: getHeaders() });
  requestCount.add(1);

  const success = check(res, {
    'infrastructure status is 200': (r) => r.status === 200,
  });

  errorRate.add(!success);
  return res;
}

// Activity events endpoint
function testActivityEvents() {
  const res = http.get(`${BASE_URL}/activity/events`, { headers: getHeaders() });
  requestCount.add(1);

  const success = check(res, {
    'activity events status is 200': (r) => r.status === 200,
  });

  errorRate.add(!success);
  return res;
}

// Main test function
export default function () {
  group('Health Check', () => {
    testHealthCheck();
    sleep(0.1);
  });

  group('Dashboard', () => {
    testDashboardSummary();
    sleep(0.2);
  });

  group('Agents', () => {
    testAgentsList();
    sleep(0.2);
  });

  group('Infrastructure', () => {
    testInfrastructureStatus();
    sleep(0.2);
  });

  group('Activity', () => {
    testActivityEvents();
    sleep(0.2);
  });

  // Random sleep between iterations (0.5-1.5s)
  sleep(Math.random() + 0.5);
}

// Setup function (runs once before test)
export function setup() {
  console.log(`Starting load test against: ${BASE_URL}`);

  // Verify API is reachable
  const res = http.get(`${BASE_URL}/health`);
  if (res.status !== 200) {
    throw new Error(`API not reachable: ${res.status}`);
  }

  console.log('API health check passed, starting load test...');
  return { startTime: Date.now() };
}

// Teardown function (runs once after test)
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`Load test completed in ${duration.toFixed(2)} seconds`);
}

// Handle summary
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data, null, 2),
    'summary.html': htmlReport(data),
  };
}

// Text summary helper
function textSummary(data, opts) {
  const { metrics, root_group } = data;
  let output = '\n=== Miyabi API Load Test Summary ===\n\n';

  output += `Total Requests: ${metrics.http_reqs?.values?.count || 0}\n`;
  output += `Failed Requests: ${metrics.http_req_failed?.values?.rate?.toFixed(4) || 0}\n`;
  output += `Error Rate: ${(metrics.errors?.values?.rate * 100 || 0).toFixed(2)}%\n\n`;

  output += `Response Times (p95):\n`;
  output += `  - Health Check: ${metrics.health_check_duration?.values?.['p(95)']?.toFixed(2) || 'N/A'}ms\n`;
  output += `  - Dashboard: ${metrics.dashboard_duration?.values?.['p(95)']?.toFixed(2) || 'N/A'}ms\n`;
  output += `  - Agents: ${metrics.agents_duration?.values?.['p(95)']?.toFixed(2) || 'N/A'}ms\n`;

  return output;
}

// HTML report helper
function htmlReport(data) {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Miyabi API Load Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    .metric { margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 4px; }
    .pass { color: green; }
    .fail { color: red; }
  </style>
</head>
<body>
  <h1>Miyabi API Load Test Report</h1>
  <div class="metric">
    <strong>Total Requests:</strong> ${data.metrics.http_reqs?.values?.count || 0}
  </div>
  <div class="metric">
    <strong>Error Rate:</strong> ${((data.metrics.errors?.values?.rate || 0) * 100).toFixed(2)}%
  </div>
  <div class="metric">
    <strong>P95 Response Time:</strong> ${data.metrics.http_req_duration?.values?.['p(95)']?.toFixed(2) || 'N/A'}ms
  </div>
  <div class="metric">
    <strong>P99 Response Time:</strong> ${data.metrics.http_req_duration?.values?.['p(99)']?.toFixed(2) || 'N/A'}ms
  </div>
</body>
</html>
  `;
}
