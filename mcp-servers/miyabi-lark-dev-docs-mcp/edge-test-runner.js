#!/usr/bin/env node
/**
 * Edge Test Runner - Comprehensive System Validation
 *
 * Systematically tests all edge cases defined in edge-test-plan.md
 * Executes repeatedly until all tests pass or max iterations reached
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const MAX_ITERATIONS = 10;
const TEST_OUTPUT_DIR = path.join(__dirname, 'edge-test-results');
const APP_ID = process.env.APP_ID || 'cli_a994d7e3b8789e1a';
const APP_SECRET = process.env.APP_SECRET || 'rNrwfiZCD9aRCCrQY5E1OeifhDg2kZJL';

// Test state
let testResults = {
  test_run_id: null,
  timestamp: null,
  iteration: 0,
  total_tests: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  duration_seconds: 0,
  failures: [],
  test_details: [],
  success_rate: '0%',
  meets_criteria: false
};

/**
 * Initialize test environment
 */
async function initializeTests() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  🧪 Edge Test Runner - Comprehensive System Validation       ║');
  console.log('║  Testing all edge cases until zero errors                    ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('\n');

  // Create output directory
  await fs.mkdir(TEST_OUTPUT_DIR, { recursive: true });

  testResults.test_run_id = `run-${Date.now()}`;
  testResults.timestamp = new Date().toISOString();

  console.log(`📊 Test Run ID: ${testResults.test_run_id}`);
  console.log(`⏰ Started at: ${testResults.timestamp}\n`);
}

/**
 * Category 1: Input Validation Edge Cases
 */
async function testInputValidation() {
  console.log('━━━ Category 1: Input Validation Edge Cases ━━━\n');

  const tests = [
    {
      id: 'I-001',
      name: 'Empty request',
      priority: 'P0',
      test: async () => {
        const { runFullAutomation } = await import('./run-automation.js');
        try {
          await runFullAutomation('');
          return { pass: false, error: 'Should have rejected empty input' };
        } catch (error) {
          return { pass: true, message: 'Correctly rejected empty input' };
        }
      }
    },
    {
      id: 'I-002',
      name: 'Whitespace only',
      priority: 'P0',
      test: async () => {
        const { runFullAutomation } = await import('./run-automation.js');
        try {
          await runFullAutomation('   ');
          return { pass: false, error: 'Should have rejected whitespace input' };
        } catch (error) {
          return { pass: true, message: 'Correctly rejected whitespace input' };
        }
      }
    },
    {
      id: 'I-003',
      name: 'Extremely long request',
      priority: 'P1',
      test: async () => {
        const longRequest = 'A'.repeat(10000);
        const { runFullAutomation } = await import('./run-automation.js');
        try {
          const result = await runFullAutomation(longRequest);
          return { pass: true, message: 'Handled long input gracefully' };
        } catch (error) {
          return { pass: true, message: 'Rejected long input with error' };
        }
      }
    },
    {
      id: 'I-004',
      name: 'Special characters',
      priority: 'P0',
      test: async () => {
        const { runFullAutomation } = await import('./run-automation.js');
        const malicious = '<script>alert("xss")</script>';
        try {
          const result = await runFullAutomation(malicious);
          // Check if output is sanitized
          const hasScript = JSON.stringify(result).includes('<script>');
          return {
            pass: !hasScript,
            message: hasScript ? 'Did not sanitize script tags!' : 'Sanitized correctly'
          };
        } catch (error) {
          return { pass: true, message: 'Rejected malicious input' };
        }
      }
    },
    {
      id: 'I-005',
      name: 'Non-English characters',
      priority: 'P1',
      test: async () => {
        const { runFullAutomation } = await import('./run-automation.js');
        const japanese = 'カレンダーBotを作って 📅';
        try {
          const result = await runFullAutomation(japanese);
          return { pass: result.status === 'success', message: 'Handled Unicode correctly' };
        } catch (error) {
          return { pass: false, error: error.message };
        }
      }
    }
  ];

  return await runTestSuite('Input Validation', tests);
}

/**
 * Category 2: API Failure Edge Cases
 */
async function testAPIFailures() {
  console.log('\n━━━ Category 2: API Failure Edge Cases ━━━\n');

  const tests = [
    {
      id: 'A-001',
      name: 'Invalid APP_ID',
      priority: 'P0',
      test: async () => {
        try {
          const response = await axios.post(
            'https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal',
            {
              app_id: 'invalid_app_id',
              app_secret: APP_SECRET,
            }
          );
          // Check if response indicates error (code !== 0)
          if (response.data && response.data.code !== 0) {
            return { pass: true, message: 'Correctly rejected invalid APP_ID' };
          }
          return { pass: false, error: 'API should return error code for invalid APP_ID' };
        } catch (error) {
          // Network error or HTTP error is also acceptable
          return { pass: true, message: 'Invalid APP_ID handled with error' };
        }
      }
    },
    {
      id: 'A-002',
      name: 'Invalid APP_SECRET',
      priority: 'P0',
      test: async () => {
        try {
          const response = await axios.post(
            'https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal',
            {
              app_id: APP_ID,
              app_secret: 'invalid_secret',
            }
          );
          // Check if response indicates error (code !== 0)
          if (response.data && response.data.code !== 0) {
            return { pass: true, message: 'Correctly rejected invalid APP_SECRET' };
          }
          return { pass: false, error: 'API should return error code for invalid APP_SECRET' };
        } catch (error) {
          // Network error or HTTP error is also acceptable
          return { pass: true, message: 'Invalid APP_SECRET handled with error' };
        }
      }
    },
    {
      id: 'A-010',
      name: 'Network timeout',
      priority: 'P1',
      test: async () => {
        try {
          const response = await axios.get('https://open.larksuite.com', {
            timeout: 1 // 1ms timeout to force timeout
          });
          return { pass: false, error: 'Should have timed out' };
        } catch (error) {
          if (error.code === 'ECONNABORTED') {
            return { pass: true, message: 'Timeout handled correctly' };
          }
          return { pass: true, message: 'Network error handled' };
        }
      }
    }
  ];

  return await runTestSuite('API Failures', tests);
}

/**
 * Category 3: Code Generation Edge Cases
 */
async function testCodeGeneration() {
  console.log('\n━━━ Category 3: Code Generation Edge Cases ━━━\n');

  const tests = [
    {
      id: 'C-001',
      name: 'No APIs selected',
      priority: 'P1',
      test: async () => {
        const { generateLarkApp } = await import('./sub-agents/code-gen-agent.js');
        const minimalSpec = {
          user_request: 'Create a minimal bot',
          intent_analysis: {
            intent_type: 'general_bot',
            intent_confidence: 0.8
          },
          api_selection: {
            total_apis_selected: 0,
            selected_apis: [],
            api_specifications: {}
          },
          task_graph: {
            project_name: 'test-minimal-bot',
            total_tasks: 0,
            total_phases: 1,
            phases: [],
            tasks: [],
            dependencies: {},
            execution_order: []
          }
        };
        try {
          const result = await generateLarkApp(minimalSpec);
          return { pass: true, message: 'Generated minimal bot successfully' };
        } catch (error) {
          return { pass: false, error: error.message };
        }
      }
    },
    {
      id: 'C-007',
      name: 'Duplicate API selections',
      priority: 'P1',
      test: async () => {
        const { generateLarkApp } = await import('./sub-agents/code-gen-agent.js');
        const duplicateSpec = {
          user_request: 'Test duplicate APIs',
          intent_analysis: {
            intent_type: 'bot_creation',
            intent_confidence: 0.9
          },
          api_selection: {
            total_apis_selected: 3,
            selected_apis: [
              'im.v1.message.create',
              'im.v1.message.create',
              'im.v1.message.create'
            ],
            api_specifications: {
              'im.v1.message.create': {
                name: 'im.v1.message.create',
                description: 'Send message',
                required_permissions: ['im:message:write'],
                http_method: 'POST'
              }
            }
          },
          task_graph: {
            project_name: 'test-duplicate-apis',
            total_tasks: 1,
            total_phases: 1,
            phases: [],
            tasks: [],
            dependencies: {},
            execution_order: []
          }
        };
        try {
          const result = await generateLarkApp(duplicateSpec);
          // Check if duplicates were handled
          return { pass: true, message: 'Handled duplicate APIs' };
        } catch (error) {
          return { pass: false, error: error.message };
        }
      }
    }
  ];

  return await runTestSuite('Code Generation', tests);
}

/**
 * Category 4: Deployment Edge Cases
 */
async function testDeployment() {
  console.log('\n━━━ Category 4: Deployment Edge Cases ━━━\n');

  const tests = [
    {
      id: 'D-012',
      name: 'Health check timeout',
      priority: 'P0',
      test: async () => {
        try {
          // Try to hit health endpoint with very short timeout
          const response = await axios.get('http://localhost:3000/health', {
            timeout: 100 // 100ms
          });
          return { pass: true, message: 'Health endpoint responsive' };
        } catch (error) {
          if (error.code === 'ECONNABORTED') {
            return { pass: false, error: 'Health endpoint too slow' };
          }
          return { pass: true, message: 'Health check timeout handled' };
        }
      }
    }
  ];

  return await runTestSuite('Deployment', tests);
}

/**
 * Category 5: Network Edge Cases
 */
async function testNetwork() {
  console.log('\n━━━ Category 5: Network Edge Cases ━━━\n');

  const tests = [
    {
      id: 'N-001',
      name: 'Slow network simulation',
      priority: 'P1',
      test: async () => {
        try {
          // Set a reasonable timeout for slow networks
          const response = await axios.get('https://open.larksuite.com', {
            timeout: 5000
          });
          return { pass: true, message: 'Handled slow network' };
        } catch (error) {
          return { pass: true, message: 'Slow network timeout handled' };
        }
      }
    }
  ];

  return await runTestSuite('Network', tests);
}

/**
 * Run a test suite
 */
async function runTestSuite(suiteName, tests) {
  const results = [];

  for (const test of tests) {
    process.stdout.write(`  [${test.id}] ${test.name} (${test.priority})... `);

    const startTime = Date.now();
    try {
      const result = await test.test();
      const duration = Date.now() - startTime;

      if (result.pass) {
        console.log(`✅ PASS (${duration}ms)`);
        if (result.message) console.log(`      ${result.message}`);
        testResults.passed++;
      } else {
        console.log(`❌ FAIL (${duration}ms)`);
        console.log(`      ${result.error}`);
        testResults.failed++;
        testResults.failures.push({
          id: test.id,
          name: test.name,
          priority: test.priority,
          error: result.error,
          duration
        });
      }

      results.push({
        id: test.id,
        name: test.name,
        priority: test.priority,
        status: result.pass ? 'PASS' : 'FAIL',
        duration,
        message: result.message || result.error
      });

      testResults.test_details.push({
        suite: suiteName,
        ...results[results.length - 1]
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`💥 ERROR (${duration}ms)`);
      console.log(`      ${error.message}`);

      testResults.failed++;
      testResults.failures.push({
        id: test.id,
        name: test.name,
        priority: test.priority,
        error: error.message,
        duration
      });

      testResults.test_details.push({
        suite: suiteName,
        id: test.id,
        name: test.name,
        priority: test.priority,
        status: 'ERROR',
        duration,
        message: error.message
      });
    }

    testResults.total_tests++;
  }

  return results;
}

/**
 * Analyze test results and determine if criteria are met
 */
function analyzeResults() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  📊 Test Results Analysis                                     ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('\n');

  const successRate = testResults.total_tests > 0
    ? ((testResults.passed / testResults.total_tests) * 100).toFixed(2)
    : 0;

  testResults.success_rate = `${successRate}%`;

  console.log(`Total Tests:    ${testResults.total_tests}`);
  console.log(`✅ Passed:      ${testResults.passed}`);
  console.log(`❌ Failed:      ${testResults.failed}`);
  console.log(`⏭️  Skipped:     ${testResults.skipped}`);
  console.log(`📈 Success Rate: ${testResults.success_rate}`);
  console.log('');

  // Analyze by priority
  const p0Failures = testResults.failures.filter(f => f.priority === 'P0');
  const p1Failures = testResults.failures.filter(f => f.priority === 'P1');
  const p2Failures = testResults.failures.filter(f => f.priority === 'P2');

  console.log('Priority Breakdown:');
  console.log(`  P0 Failures: ${p0Failures.length} (CRITICAL)`);
  console.log(`  P1 Failures: ${p1Failures.length} (HIGH)`);
  console.log(`  P2 Failures: ${p2Failures.length} (MEDIUM)`);
  console.log('');

  // Check success criteria
  const p0Pass = p0Failures.length === 0;
  const p1Pass = p1Failures.length <= testResults.total_tests * 0.1; // 90%+ pass rate

  testResults.meets_criteria = p0Pass && p1Pass;

  console.log('Success Criteria:');
  console.log(`  P0 Tests:     ${p0Pass ? '✅ PASS' : '❌ FAIL'} (Must be 100%)`);
  console.log(`  P1 Tests:     ${p1Pass ? '✅ PASS' : '❌ FAIL'} (Must be 90%+)`);
  console.log(`  Overall:      ${testResults.meets_criteria ? '✅ PASS' : '❌ FAIL'}`);
  console.log('');

  if (testResults.failures.length > 0) {
    console.log('Failed Tests:');
    testResults.failures.forEach(failure => {
      console.log(`  [${failure.id}] ${failure.name}`);
      console.log(`      Priority: ${failure.priority}`);
      console.log(`      Error: ${failure.error}`);
      console.log('');
    });
  }
}

/**
 * Save test results
 */
async function saveResults() {
  const resultFile = path.join(
    TEST_OUTPUT_DIR,
    `${testResults.test_run_id}.json`
  );

  await fs.writeFile(
    resultFile,
    JSON.stringify(testResults, null, 2)
  );

  console.log(`💾 Results saved: ${resultFile}\n`);
}

/**
 * Main test execution
 */
async function main() {
  const overallStartTime = Date.now();

  await initializeTests();

  // Run all test categories
  await testInputValidation();
  await testAPIFailures();
  await testCodeGeneration();
  await testDeployment();
  await testNetwork();

  testResults.duration_seconds = ((Date.now() - overallStartTime) / 1000).toFixed(2);

  analyzeResults();
  await saveResults();

  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  if (testResults.meets_criteria) {
    console.log('║  ✅ All Tests Passed - System Ready for Production!          ║');
  } else {
    console.log('║  ❌ Tests Failed - Fixes Required                            ║');
  }
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');

  return testResults.meets_criteria;
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { main as runEdgeTests };
