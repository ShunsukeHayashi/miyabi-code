#!/usr/bin/env tsx
/**
 * Decision Point D2: Complexity Estimation (SDK Version)
 *
 * Replaces: scripts/decision-trees/D2-complexity-check.sh
 * Purpose: Estimate task complexity using Anthropic API instead of `claude -p`
 *
 * Exit codes:
 *   0 = Low complexity → Auto-approve
 *   1 = Medium complexity → AI judgment required
 *   2 = High complexity → Human review required
 *   3 = Error
 */

import Anthropic from '@anthropic-ai/sdk';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface ComplexityResult {
  complexity: 'Low' | 'Medium' | 'High';
  reasoning: string;
  estimatedFiles: number;
  estimatedDuration: number;
}

interface IssueData {
  title: string;
  body: string;
  labels: string[];
}

class ComplexityAnalyzer {
  private client: Anthropic;
  private logDir: string;

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY
    });
    this.logDir = '/tmp/miyabi-automation';

    // Ensure log directory exists
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Fetch Issue data from GitHub using gh CLI
   */
  private fetchIssueData(issueNumber: number): IssueData {
    console.log(`Fetching Issue #${issueNumber} data...`);

    const outputPath = path.join(this.logDir, `issue-${issueNumber}.json`);

    try {
      execSync(`gh issue view ${issueNumber} --json title,body,labels > "${outputPath}"`, {
        encoding: 'utf-8',
        stdio: 'pipe'
      });
    } catch (error) {
      throw new Error(`Failed to fetch Issue #${issueNumber}: ${error}`);
    }

    const rawData = fs.readFileSync(outputPath, 'utf-8');
    const parsed = JSON.parse(rawData);

    return {
      title: parsed.title,
      body: parsed.body || '',
      labels: parsed.labels?.map((l: any) => l.name) || []
    };
  }

  /**
   * Analyze complexity using Anthropic API
   */
  private async analyzeComplexity(issue: IssueData): Promise<ComplexityResult> {
    const prompt = `Analyze the complexity of this GitHub Issue:

**Title**: ${issue.title}

**Labels**: ${issue.labels.join(', ')}

**Description**:
${issue.body}

**Task**: Estimate the implementation complexity based on:
1. Number of files to modify
2. Scope of changes (isolated vs cross-cutting)
3. Testing requirements
4. External dependencies
5. Risk of breaking changes

**Output**: JSON format only
\`\`\`json
{
  "complexity": "Low" | "Medium" | "High",
  "reasoning": "Brief explanation",
  "estimatedFiles": <number>,
  "estimatedDuration": <minutes>
}
\`\`\`

**Complexity Criteria**:
- **Low**: 1-3 files, isolated changes, < 30 minutes, no external deps
- **Medium**: 4-10 files, some cross-cutting, 30-90 minutes, minor deps
- **High**: 10+ files, major refactoring, > 90 minutes, new dependencies

Respond ONLY with the JSON object, no additional text.`;

    console.log('Running AI complexity analysis...');

    try {
      const message = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      // Extract text from response
      const responseText = message.content
        .filter(block => block.type === 'text')
        .map(block => (block as any).text)
        .join('\n');

      // Parse JSON from response (handle markdown code blocks)
      let jsonText = responseText;

      // Extract from markdown code block if present
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }

      const result: ComplexityResult = JSON.parse(jsonText.trim());

      // Validate result
      if (!['Low', 'Medium', 'High'].includes(result.complexity)) {
        throw new Error(`Invalid complexity value: ${result.complexity}`);
      }

      return result;
    } catch (error) {
      throw new Error(`Complexity analysis failed: ${error}`);
    }
  }

  /**
   * Escalate to human if needed
   */
  private escalate(role: string, message: string, issueNumber: number): void {
    console.log(`\n🚨 Escalating to ${role}...`);

    try {
      const escalateScript = path.join(
        __dirname,
        '../../primitives/escalate.sh'
      );

      execSync(`"${escalateScript}" "${role}" "${message}" "${issueNumber}"`, {
        encoding: 'utf-8',
        stdio: 'inherit'
      });
    } catch (error) {
      console.error(`Escalation failed: ${error}`);
    }
  }

  /**
   * Main execution
   */
  async run(issueNumber: number): Promise<number> {
    console.log('=====================================');
    console.log('Decision Point D2: Complexity Check (SDK)');
    console.log('=====================================');
    console.log(`Issue: #${issueNumber}`);
    console.log(`Mode: Anthropic API (Programmatic)`);
    console.log(`Time: ${new Date().toISOString()}`);
    console.log('');

    try {
      // Step 1: Fetch Issue data
      const issueData = this.fetchIssueData(issueNumber);
      console.log(`Title: ${issueData.title}`);
      console.log(`Labels: ${issueData.labels.join(', ')}`);
      console.log('');

      // Step 2: Analyze complexity
      const result = await this.analyzeComplexity(issueData);

      // Save result to log
      const resultPath = path.join(this.logDir, `complexity-sdk-${issueNumber}.json`);
      fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));

      // Step 3: Display result
      console.log('');
      console.log('=====================================');
      console.log('Complexity Analysis Result');
      console.log('=====================================');
      console.log(`Complexity: ${result.complexity}`);
      console.log(`Estimated Files: ${result.estimatedFiles}`);
      console.log(`Estimated Duration: ${result.estimatedDuration} minutes`);
      console.log('');
      console.log('Reasoning:');
      console.log(result.reasoning);
      console.log('');

      // Step 4: Make decision
      switch (result.complexity) {
        case 'Low':
          console.log('✅ DECISION: LOW COMPLEXITY - Auto-approve');
          console.log('→ ACTION: Continue to D3 (Task Decomposition)');
          return 0;

        case 'Medium':
          console.log('⚠️  DECISION: MEDIUM COMPLEXITY - AI judgment required');
          console.log('→ ACTION: Proceed with AI-assisted implementation');
          return 1;

        case 'High':
          console.log('🚨 DECISION: HIGH COMPLEXITY - Human review required');
          console.log('→ ACTION: Escalate to TechLead');
          console.log('');

          this.escalate(
            'TechLead',
            `Issue #${issueNumber} requires human review. Complexity: High. Estimated: ${result.estimatedFiles} files, ${result.estimatedDuration} minutes. Reason: ${result.reasoning}`,
            issueNumber
          );

          return 2;

        default:
          throw new Error(`Unexpected complexity: ${result.complexity}`);
      }
    } catch (error) {
      console.error('');
      console.error('❌ ERROR: Complexity analysis failed');
      console.error(error);
      console.error('→ ACTION: Escalate to TechLead (safety fallback)');

      this.escalate(
        'TechLead',
        `Issue #${issueNumber} complexity analysis failed. Manual review required. Error: ${error}`,
        issueNumber
      );

      return 3;
    }
  }
}

// CLI Entry Point
if (require.main === module) {
  const issueNumber = parseInt(process.argv[2]);

  if (!issueNumber || isNaN(issueNumber)) {
    console.error('ERROR: Issue number required');
    console.error('Usage: tsx src/d2-complexity-check.ts <issue_number>');
    process.exit(3);
  }

  const analyzer = new ComplexityAnalyzer();
  analyzer
    .run(issueNumber)
    .then(exitCode => {
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(3);
    });
}

export { ComplexityAnalyzer, ComplexityResult, IssueData };
