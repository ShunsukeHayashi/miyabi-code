#!/usr/bin/env tsx
/**
 * Decision Point D1: Label Validation (SDK Version)
 *
 * Replaces: scripts/decision-trees/D1-label-check.sh
 * Purpose: Validate Miyabi label system compliance (type:*, priority:*)
 *
 * Exit codes:
 *   0 = Valid labels
 *   1 = Missing required labels → Escalate to PO
 *   2 = Invalid issue number / GitHub error
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface LabelCheckResult {
  valid: boolean;
  labels: string[];
  missingCategories: string[];
}

class LabelValidator {
  private logDir: string;
  private requiredCategories: string[];

  constructor() {
    this.logDir = '/tmp/miyabi-automation';
    this.requiredCategories = [
      'type:*',      // type:bug, type:feature, type:chore, etc.
      'priority:*'   // priority:high, priority:medium, priority:low
    ];

    // Ensure log directory exists
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Fetch labels from GitHub Issue using gh CLI
   */
  private fetchLabels(issueNumber: number): string[] {
    console.log(`Fetching labels for Issue #${issueNumber}...`);

    try {
      const output = execSync(`gh issue view ${issueNumber} --json labels -q '.labels[].name'`, {
        encoding: 'utf-8',
        stdio: 'pipe'
      });

      const labels = output
        .trim()
        .split('\n')
        .filter(label => label.length > 0);

      return labels;
    } catch (error: any) {
      throw new Error(`Failed to fetch Issue #${issueNumber}: ${error.message}`);
    }
  }

  /**
   * Validate labels against required categories
   */
  private validateLabels(labels: string[]): LabelCheckResult {
    const missingCategories: string[] = [];

    for (const category of this.requiredCategories) {
      const prefix = category.split(':')[0]; // Extract "type" from "type:*"

      // Check if any label contains the prefix pattern (handles emoji prefixes like "📚 type:docs")
      const hasCategory = labels.some(label => {
        // Simpler approach: check if label contains "prefix:" anywhere (case-insensitive)
        const pattern = `${prefix.toLowerCase()}:`;
        return label.toLowerCase().includes(pattern);
      });

      if (!hasCategory) {
        missingCategories.push(`${prefix}:`);
      }
    }

    return {
      valid: missingCategories.length === 0,
      labels,
      missingCategories
    };
  }

  /**
   * Escalate to ProductOwner if labels are invalid
   */
  private escalate(issueNumber: number, missingCategories: string[]): void {
    console.log('\n🚨 Escalating to ProductOwner...');

    const message = `Issue #${issueNumber} has invalid or missing labels. Missing categories: ${missingCategories.join(', ')}`;

    try {
      const escalateScript = path.join(__dirname, '../../primitives/escalate.sh');

      execSync(`"${escalateScript}" "PO" "${message}" "${issueNumber}"`, {
        encoding: 'utf-8',
        stdio: 'inherit'
      });
    } catch (error) {
      console.error(`Escalation failed: ${error}`);
    }
  }

  /**
   * Save label data for downstream scripts
   */
  private saveLabels(issueNumber: number, labels: string[]): void {
    const filePath = path.join(this.logDir, `labels-${issueNumber}.txt`);
    fs.writeFileSync(filePath, labels.join('\n'));
  }

  /**
   * Main execution
   */
  run(issueNumber: number): number {
    console.log('=====================================');
    console.log('Decision Point D1: Label Validation (SDK)');
    console.log('=====================================');
    console.log(`Issue: #${issueNumber}`);
    console.log(`Mode: Script (Confirmed Process)`);
    console.log(`Time: ${new Date().toISOString()}`);
    console.log('');

    try {
      // Step 1: Fetch labels from GitHub
      const labels = this.fetchLabels(issueNumber);

      console.log(`Found ${labels.length} label(s):`);
      labels.forEach(label => console.log(`  - ${label}`));
      console.log('');

      // Step 2: Validate labels
      const result = this.validateLabels(labels);

      // Step 3: Save labels for downstream use
      this.saveLabels(issueNumber, labels);

      // Step 4: Make decision
      console.log('=====================================');
      console.log('Validation Result');
      console.log('=====================================');

      if (result.valid) {
        console.log('✅ DECISION: PASS - Labels are valid');
        console.log('→ ACTION: Continue to D2 (Complexity Check)');
        console.log('');
        console.log('Valid labels:');
        result.labels.forEach(label => console.log(`  - ${label}`));
        return 0;
      } else {
        console.log('❌ DECISION: FAIL - Invalid or missing labels');
        console.log('→ ACTION: Escalate to ProductOwner');
        console.log('');
        console.log('Missing categories:');
        result.missingCategories.forEach(cat => console.log(`  - ${cat}`));
        console.log('');
        console.log('Available labels:');
        result.labels.forEach(label => console.log(`  - ${label}`));
        console.log('');

        this.escalate(issueNumber, result.missingCategories);
        return 1;
      }
    } catch (error: any) {
      console.error('');
      console.error('❌ ERROR: Label validation failed');
      console.error(error.message);
      console.error('');

      // Invalid issue number or GitHub error
      return 2;
    }
  }
}

// CLI Entry Point
if (require.main === module) {
  const issueNumber = parseInt(process.argv[2]);

  if (!issueNumber || isNaN(issueNumber)) {
    console.error('ERROR: Issue number required');
    console.error('Usage: tsx src/d1-label-check.ts <issue_number>');
    process.exit(2);
  }

  const validator = new LabelValidator();
  const exitCode = validator.run(issueNumber);
  process.exit(exitCode);
}

export { LabelValidator, LabelCheckResult };
