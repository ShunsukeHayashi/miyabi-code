#!/usr/bin/env tsx
/**
 * Decision Point D8: Test Analysis (SDK Version)
 *
 * Replaces: scripts/primitives/run-tests.sh
 * Purpose: Execute cargo test, analyze failures, and categorize errors
 *
 * Exit codes:
 *   0 = All tests passed
 *   1 = Tests failed (runtime failures)
 *   2 = Compilation error (syntax/type errors)
 *   3 = Execution error (timeout, crash, etc.)
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface TestError {
  type: 'compilation' | 'test_failure' | 'panic' | 'timeout';
  code?: string; // e.g., "E0308"
  message: string;
  file?: string;
  line?: number;
  autoFixable: boolean;
}

interface TestResult {
  exitCode: number;
  passed: number;
  failed: number;
  errors: TestError[];
  duration: number;
  rawOutput: string;
}

class TestAnalyzer {
  private logDir: string;
  private timeout: number;

  constructor(timeout: number = 600) {
    this.logDir = '/tmp/miyabi-automation';
    this.timeout = timeout * 1000; // Convert to milliseconds

    // Ensure log directory exists
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Execute cargo test and capture output
   */
  private runCargoTest(packageName?: string): { output: string; exitCode: number; duration: number } {
    const startTime = Date.now();
    const command = packageName
      ? `cargo test --package ${packageName}`
      : 'cargo test --all';

    const logPath = path.join(this.logDir, 'test-output.log');

    console.log(`Running: ${command}`);
    console.log(`Timeout: ${this.timeout / 1000}s`);
    console.log('');

    try {
      const output = execSync(command, {
        encoding: 'utf-8',
        timeout: this.timeout,
        stdio: 'pipe',
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      });

      const duration = Date.now() - startTime;

      // Save output
      fs.writeFileSync(logPath, output);

      return { output, exitCode: 0, duration };
    } catch (error: any) {
      const duration = Date.now() - startTime;

      // execSync throws on non-zero exit code
      const output = (error.stdout || '') + (error.stderr || '');
      fs.writeFileSync(logPath, output);

      // Check if timeout
      if (error.killed && error.signal === 'SIGTERM') {
        return { output, exitCode: 3, duration };
      }

      // Get actual exit code
      const exitCode = error.status || 1;

      return { output, exitCode, duration };
    }
  }

  /**
   * Parse compilation errors from output
   */
  private parseCompilationErrors(output: string): TestError[] {
    const errors: TestError[] = [];
    const errorRegex = /error\[E(\d+)\]: ([^\n]+)/g;
    const locationRegex = /-->\s+(.+?):(\d+):(\d+)/;

    let match;
    while ((match = errorRegex.exec(output)) !== null) {
      const errorCode = `E${match[1]}`;
      const message = match[2];

      // Try to extract location
      const contextStart = match.index;
      const contextEnd = Math.min(contextStart + 500, output.length);
      const context = output.slice(contextStart, contextEnd);
      const locationMatch = context.match(locationRegex);

      const error: TestError = {
        type: 'compilation',
        code: errorCode,
        message,
        autoFixable: this.isAutoFixable(errorCode)
      };

      if (locationMatch) {
        error.file = locationMatch[1];
        error.line = parseInt(locationMatch[2], 10);
      }

      errors.push(error);
    }

    return errors;
  }

  /**
   * Parse test failures from output
   */
  private parseTestFailures(output: string): TestError[] {
    const errors: TestError[] = [];
    const failureRegex = /test\s+(\S+)\s+\.\.\.\s+FAILED/g;

    let match;
    while ((match = failureRegex.exec(output)) !== null) {
      const testName = match[1];

      errors.push({
        type: 'test_failure',
        message: `Test failed: ${testName}`,
        autoFixable: false
      });
    }

    return errors;
  }

  /**
   * Parse panic/runtime errors
   */
  private parsePanics(output: string): TestError[] {
    const errors: TestError[] = [];

    if (output.includes('thread') && output.includes('panicked at')) {
      const panicRegex = /thread '([^']+)' panicked at '([^']+)', ([^:]+):(\d+)/g;

      let match;
      while ((match = panicRegex.exec(output)) !== null) {
        errors.push({
          type: 'panic',
          message: match[2],
          file: match[3],
          line: parseInt(match[4], 10),
          autoFixable: false
        });
      }

      // If no structured panic found, add generic panic error
      if (errors.length === 0) {
        errors.push({
          type: 'panic',
          message: 'Runtime panic detected',
          autoFixable: false
        });
      }
    }

    return errors;
  }

  /**
   * Extract test counts from output
   */
  private extractTestCounts(output: string): { passed: number; failed: number } {
    // Match "test result: ok. 10 passed; 0 failed"
    const resultMatch = output.match(/test result: \w+\.\s+(\d+)\s+passed;\s+(\d+)\s+failed/);

    if (resultMatch) {
      return {
        passed: parseInt(resultMatch[1], 10),
        failed: parseInt(resultMatch[2], 10)
      };
    }

    // Fallback: count individual test results
    const passedCount = (output.match(/test\s+\S+\s+\.\.\.\s+ok/g) || []).length;
    const failedCount = (output.match(/test\s+\S+\s+\.\.\.\s+FAILED/g) || []).length;

    return { passed: passedCount, failed: failedCount };
  }

  /**
   * Determine if error code is auto-fixable
   */
  private isAutoFixable(errorCode: string): boolean {
    // Common auto-fixable error codes
    const autoFixableCodes = [
      'E0308', // Mismatched types
      'E0382', // Borrow of moved value
      'E0425', // Cannot find value
      'E0433', // Failed to resolve import
      'E0599', // No method found
    ];

    return autoFixableCodes.includes(errorCode);
  }

  /**
   * Analyze test output
   */
  private analyzeOutput(output: string, exitCode: number, duration: number): TestResult {
    const errors: TestError[] = [];

    // Check for compilation errors first (highest priority)
    const compilationErrors = this.parseCompilationErrors(output);
    errors.push(...compilationErrors);

    // If compilation failed, that's the primary issue
    if (compilationErrors.length > 0) {
      return {
        exitCode: 2,
        passed: 0,
        failed: 0,
        errors,
        duration,
        rawOutput: output
      };
    }

    // Parse test failures
    const testFailures = this.parseTestFailures(output);
    errors.push(...testFailures);

    // Parse panics
    const panics = this.parsePanics(output);
    errors.push(...panics);

    // Extract counts
    const counts = this.extractTestCounts(output);

    // Determine final exit code
    let finalExitCode = 0;
    if (errors.length > 0) {
      finalExitCode = 1; // Test failures or panics
    }

    // Timeout check
    if (exitCode === 3) {
      errors.push({
        type: 'timeout',
        message: `Test execution timed out after ${this.timeout / 1000}s`,
        autoFixable: false
      });
      finalExitCode = 3;
    }

    return {
      exitCode: finalExitCode,
      passed: counts.passed,
      failed: counts.failed,
      errors,
      duration,
      rawOutput: output
    };
  }

  /**
   * Display test result
   */
  private displayResult(result: TestResult): void {
    console.log('');
    console.log('=====================================');
    console.log('Test Analysis Result');
    console.log('=====================================');
    console.log(`Duration: ${(result.duration / 1000).toFixed(2)}s`);
    console.log(`Exit Code: ${result.exitCode}`);
    console.log('');

    if (result.exitCode === 0) {
      console.log('✅ All tests PASSED');
      console.log(`Tests passed: ${result.passed}`);
    } else if (result.exitCode === 2) {
      console.log('❌ COMPILATION ERRORS');
      console.log(`Errors found: ${result.errors.length}`);
      console.log('');
      console.log('Compilation Errors:');

      result.errors.forEach((error, index) => {
        console.log(`\n  ${index + 1}. [${error.code}] ${error.message}`);
        if (error.file) {
          console.log(`     Location: ${error.file}:${error.line}`);
        }
        console.log(`     Auto-fixable: ${error.autoFixable ? '✓' : '✗'}`);
      });
    } else if (result.exitCode === 1) {
      console.log('❌ TEST FAILURES');
      console.log(`Tests passed: ${result.passed}`);
      console.log(`Tests failed: ${result.failed}`);
      console.log('');
      console.log('Failures:');

      result.errors.forEach((error, index) => {
        console.log(`\n  ${index + 1}. [${error.type}] ${error.message}`);
        if (error.file) {
          console.log(`     Location: ${error.file}:${error.line}`);
        }
      });
    } else if (result.exitCode === 3) {
      console.log('❌ EXECUTION ERROR');
      console.log('');
      result.errors.forEach(error => {
        console.log(`  ${error.message}`);
      });
    }

    console.log('');
    console.log(`Full log: ${path.join(this.logDir, 'test-output.log')}`);
    console.log('');

    // Save JSON result
    const resultPath = path.join(this.logDir, 'test-analysis.json');
    fs.writeFileSync(
      resultPath,
      JSON.stringify(
        {
          exitCode: result.exitCode,
          passed: result.passed,
          failed: result.failed,
          errors: result.errors,
          duration: result.duration
        },
        null,
        2
      )
    );
    console.log(`JSON result: ${resultPath}`);
  }

  /**
   * Main execution
   */
  run(packageName?: string): number {
    console.log('=====================================');
    console.log('Miyabi Test Runner (SDK)');
    console.log('=====================================');
    console.log(`Package: ${packageName || 'All packages'}`);
    console.log(`Time: ${new Date().toISOString()}`);
    console.log('');

    try {
      // Run cargo test
      const { output, exitCode, duration } = this.runCargoTest(packageName);

      // Analyze output
      const result = this.analyzeOutput(output, exitCode, duration);

      // Display result
      this.displayResult(result);

      return result.exitCode;
    } catch (error) {
      console.error('');
      console.error('❌ FATAL ERROR: Test execution failed');
      console.error(error);
      return 3;
    }
  }
}

// CLI Entry Point
if (require.main === module) {
  const packageName = process.argv[2]; // Optional package name

  const analyzer = new TestAnalyzer();
  const exitCode = analyzer.run(packageName);
  process.exit(exitCode);
}

export { TestAnalyzer, TestResult, TestError };
