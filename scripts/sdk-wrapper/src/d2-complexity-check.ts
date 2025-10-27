#!/usr/bin/env tsx
/**
 * Decision Point D2: Complexity Estimation (Multi-Provider SDK Version)
 *
 * Replaces: scripts/decision-trees/D2-complexity-check.sh
 * Purpose: Estimate task complexity using Anthropic or OpenAI API
 *
 * Supported Providers:
 *   - Anthropic (claude-sonnet-4)
 *   - OpenAI (gpt-4o or gpt-4-turbo)
 *
 * Environment Variables:
 *   - ANTHROPIC_API_KEY: Anthropic API key (priority)
 *   - OPENAI_API_KEY: OpenAI API key (fallback)
 *
 * Exit codes:
 *   0 = Low complexity → Auto-approve
 *   1 = Medium complexity → AI judgment required
 *   2 = High complexity → Human review required
 *   3 = Error
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

type Provider = 'anthropic' | 'openai';

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
  private provider: Provider;
  private anthropicClient?: Anthropic;
  private openaiClient?: OpenAI;
  private logDir: string;

  constructor() {
    this.logDir = '/tmp/miyabi-automation';

    // Ensure log directory exists
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    // Auto-detect provider based on available API keys
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (anthropicKey) {
      this.provider = 'anthropic';
      this.anthropicClient = new Anthropic({ apiKey: anthropicKey });
      console.log('✓ Using Anthropic API (claude-sonnet-4)');
    } else if (openaiKey) {
      this.provider = 'openai';
      this.openaiClient = new OpenAI({ apiKey: openaiKey });
      console.log('✓ Using OpenAI API (gpt-4o)');
    } else {
      throw new Error('No API key found. Set ANTHROPIC_API_KEY or OPENAI_API_KEY');
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
   * Build complexity analysis prompt
   */
  private buildPrompt(issue: IssueData): string {
    return `Analyze the complexity of this GitHub Issue:

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
  }

  /**
   * Analyze complexity using Anthropic API
   */
  private async analyzeWithAnthropic(issue: IssueData): Promise<ComplexityResult> {
    if (!this.anthropicClient) {
      throw new Error('Anthropic client not initialized');
    }

    const prompt = this.buildPrompt(issue);

    console.log('Running Anthropic complexity analysis...');

    const message = await this.anthropicClient.messages.create({
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

    return this.parseComplexityResponse(responseText);
  }

  /**
   * Analyze complexity using OpenAI API
   */
  private async analyzeWithOpenAI(issue: IssueData): Promise<ComplexityResult> {
    if (!this.openaiClient) {
      throw new Error('OpenAI client not initialized');
    }

    const prompt = this.buildPrompt(issue);

    console.log('Running OpenAI complexity analysis...');

    const completion = await this.openaiClient.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a technical project manager analyzing GitHub Issues for complexity estimation. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1024
    });

    const responseText = completion.choices[0]?.message?.content || '';

    if (!responseText) {
      throw new Error('Empty response from OpenAI API');
    }

    return this.parseComplexityResponse(responseText);
  }

  /**
   * Parse complexity response from either provider
   */
  private parseComplexityResponse(responseText: string): ComplexityResult {
    // Extract from markdown code block if present
    let jsonText = responseText;
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
  }

  /**
   * Analyze complexity using the selected provider
   */
  private async analyzeComplexity(issue: IssueData): Promise<ComplexityResult> {
    try {
      if (this.provider === 'anthropic') {
        return await this.analyzeWithAnthropic(issue);
      } else {
        return await this.analyzeWithOpenAI(issue);
      }
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
    console.log('Decision Point D2: Complexity Check');
    console.log('=====================================');
    console.log(`Issue: #${issueNumber}`);
    console.log(`Provider: ${this.provider.toUpperCase()}`);
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
      const resultPath = path.join(this.logDir, `complexity-${this.provider}-${issueNumber}.json`);
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
