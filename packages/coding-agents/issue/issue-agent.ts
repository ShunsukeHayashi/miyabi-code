/**
 * IssueAgent - GitHub Issue Analysis & Management Agent
 *
 * Responsibilities:
 * - Analyze GitHub Issues automatically
 * - Determine issue type (feature/bug/refactor/docs/test)
 * - Assess Severity (Sev.1-5)
 * - Assess Impact (Critical/High/Medium/Low)
 * - Apply Organizational (組織設計) theory label system (65 labels)
 * - Assign appropriate team members (via CODEOWNERS)
 * - Extract task dependencies
 *
 * Issue #41: Added retry logic with exponential backoff for all GitHub API calls
 */

import { BaseAgent } from '../base-agent';
import {
  AgentResult,
  AgentConfig,
  Task,
  Issue,
  SubIssue,
  IssueCreationRequest,
  IssueHierarchyNode,
  Severity,
  ImpactLevel,
  AgentType,
} from '../types/index';
import { Octokit } from '@octokit/rest';
import { withRetry } from '@miyabi/shared-utils/retry';
import { IssueAnalyzer } from '../utils/issue-analyzer';
import { GitRepository } from '../utils/git-repository';
import { getGitHubClient, withGitHubCache } from '@miyabi/shared-utils/api-client';

export class IssueAgent extends BaseAgent {
  private octokit: Octokit;
  private owner: string = '';
  private repo: string = '';

  constructor(config: AgentConfig) {
    super('IssueAgent', config);

    if (!config.githubToken) {
      throw new Error('GITHUB_TOKEN is required for IssueAgent');
    }

    // Use singleton GitHub client with connection pooling
    this.octokit = getGitHubClient(config.githubToken) as Octokit;

    // Parse repo from git remote
    this.initializeRepository();
  }

  /**
   * Initialize repository information
   */
  private async initializeRepository(): Promise<void> {
    try {
      const repoInfo = await GitRepository.parse();
      this.owner = repoInfo.owner;
      this.repo = repoInfo.repo;
      this.log(`📦 Repository: ${this.owner}/${this.repo}`);
    } catch (error) {
      this.log(`⚠️  Failed to parse repository: ${(error as Error).message}`);
      // Use defaults if parsing fails
      this.owner = 'user';
      this.repo = 'repository';
    }
  }

  /**
   * Main execution: Analyze Issue and apply labels
   */
  async execute(task: Task): Promise<AgentResult> {
    this.log('🔍 IssueAgent starting issue analysis');

    try {
      // Ensure repository is initialized
      if (!this.owner || !this.repo || this.owner === 'user') {
        await this.initializeRepository();
      }

      // 1. Fetch Issue from GitHub
      const issueNumber = task.metadata?.issueNumber as number;
      if (!issueNumber) {
        throw new Error('Issue number is required in task metadata');
      }

      const issue = await this.fetchIssue(issueNumber);

      // 2. Analyze Issue content
      const analysis = await this.analyzeIssue(issue);

      // 3-5. Apply labels, assign team members, and add comment (parallel for performance)
      await Promise.all([
        this.applyLabels(issueNumber, analysis.labels),
        this.assignTeamMembers(issueNumber, analysis.assignees),
        this.addAnalysisComment(issueNumber, analysis),
      ]);

      this.log(`✅ Issue analysis complete: ${analysis.labels.length} labels applied`);

      return {
        status: 'success',
        data: {
          issue,
          analysis,
        },
        metrics: {
          taskId: task.id,
          agentType: this.agentType,
          durationMs: Date.now() - this.startTime,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.log(`❌ Issue analysis failed: ${(error as Error).message}`);
      throw error;
    }
  }

  // ============================================================================
  // GitHub API Operations
  // ============================================================================

  /**
   * Fetch Issue from GitHub (with LRU cache + automatic retry)
   */
  private async fetchIssue(issueNumber: number): Promise<Issue> {
    this.log(`📥 Fetching Issue #${issueNumber}`);

    try {
      // Use LRU cache to avoid repeated API calls for same issue
      const cacheKey = `issue:${this.owner}/${this.repo}/${issueNumber}`;

      const response = await withGitHubCache(cacheKey, async () => {
        return await withRetry(async () => {
          return await this.octokit.issues.get({
            owner: this.owner,
            repo: this.repo,
            issue_number: issueNumber,
          });
        });
      });

      await this.logToolInvocation(
        'github_api_get_issue',
        'passed',
        `Fetched Issue #${issueNumber}`,
        this.safeTruncate(JSON.stringify(response.data), 500)
      );

      return {
        number: response.data.number,
        title: response.data.title,
        body: response.data.body || '',
        state: response.data.state as 'open' | 'closed',
        labels: response.data.labels.map((l: any) => typeof l === 'string' ? l : l.name),
        assignee: response.data.assignee?.login,
        createdAt: response.data.created_at,
        updatedAt: response.data.updated_at,
        url: response.data.html_url,
      };
    } catch (error) {
      await this.logToolInvocation(
        'github_api_get_issue',
        'failed',
        `Failed to fetch Issue #${issueNumber}`,
        undefined,
        (error as Error).message
      );
      throw error;
    }
  }

  /**
   * Apply labels to Issue (with automatic retry on transient failures)
   */
  private async applyLabels(issueNumber: number, labels: string[]): Promise<void> {
    this.log(`🏷️  Applying ${labels.length} labels to Issue #${issueNumber}`);

    try {
      await withRetry(async () => {
        await this.octokit.issues.addLabels({
          owner: this.owner,
          repo: this.repo,
          issue_number: issueNumber,
          labels,
        });
      });

      await this.logToolInvocation(
        'github_api_add_labels',
        'passed',
        `Applied labels: ${labels.join(', ')}`,
        labels.join(', ')
      );

      // Record label changes to trace logger
      if (this.traceLogger) {
        try {
          for (const label of labels) {
            this.traceLogger.recordLabelChange('added', label, 'IssueAgent');
          }
          this.log(`📋 ${labels.length} label changes recorded to trace log`);
        } catch (error) {
          // Trace logger not initialized - continue without logging
          this.log(`⚠️  Failed to record label changes: ${(error as Error).message}`);
        }
      }
    } catch (error) {
      await this.logToolInvocation(
        'github_api_add_labels',
        'failed',
        'Failed to apply labels',
        undefined,
        (error as Error).message
      );
      throw error;
    }
  }

  /**
   * Assign team members to Issue (with automatic retry on transient failures)
   */
  private async assignTeamMembers(issueNumber: number, assignees: string[]): Promise<void> {
    if (assignees.length === 0) return;

    this.log(`👥 Assigning ${assignees.length} team members to Issue #${issueNumber}`);

    try {
      await withRetry(async () => {
        await this.octokit.issues.addAssignees({
          owner: this.owner,
          repo: this.repo,
          issue_number: issueNumber,
          assignees,
        });
      });

      await this.logToolInvocation(
        'github_api_add_assignees',
        'passed',
        `Assigned: ${assignees.join(', ')}`,
        assignees.join(', ')
      );
    } catch (error) {
      await this.logToolInvocation(
        'github_api_add_assignees',
        'failed',
        'Failed to assign team members',
        undefined,
        (error as Error).message
      );
      // Don't throw - assignment is optional
      this.log(`⚠️  Failed to assign: ${(error as Error).message}`);
    }
  }

  /**
   * Add analysis comment to Issue (with automatic retry on transient failures)
   */
  private async addAnalysisComment(issueNumber: number, analysis: IssueAnalysis): Promise<void> {
    this.log(`💬 Adding analysis comment to Issue #${issueNumber}`);

    const comment = this.formatAnalysisComment(analysis);

    try {
      await withRetry(async () => {
        await this.octokit.issues.createComment({
          owner: this.owner,
          repo: this.repo,
          issue_number: issueNumber,
          body: comment,
        });
      });

      await this.logToolInvocation(
        'github_api_create_comment',
        'passed',
        'Added analysis comment',
        this.safeTruncate(comment, 200)
      );
    } catch (error) {
      await this.logToolInvocation(
        'github_api_create_comment',
        'failed',
        'Failed to add comment',
        undefined,
        (error as Error).message
      );
      // Don't throw - comment is optional
    }
  }

  // ============================================================================
  // Issue Analysis
  // ============================================================================

  /**
   * Analyze Issue and determine classification
   */
  private async analyzeIssue(issue: Issue): Promise<IssueAnalysis> {
    this.log('🧠 Analyzing Issue content');

    // Use IssueAnalyzer for consistent analysis
    const type = IssueAnalyzer.determineIssueType(issue);
    const severity = IssueAnalyzer.determineSeverityFromIssue(issue);
    const impact = IssueAnalyzer.determineImpactFromIssue(issue);
    const dependencies = IssueAnalyzer.extractDependenciesFromIssue(issue);
    const estimatedDuration = IssueAnalyzer.estimateDurationFromIssue(issue, type);

    const analysis: IssueAnalysis = {
      type,
      severity,
      impact,
      responsibility: this.determineResponsibility(issue),
      agentType: this.determineAgent(type),
      labels: [],
      assignees: [],
      dependencies,
      estimatedDuration,
    };

    // Build Organizational label set
    analysis.labels = this.buildLabelSet(analysis);

    // Determine assignees from CODEOWNERS or responsibility
    analysis.assignees = await this.determineAssignees(analysis);

    return analysis;
  }

  /**
   * Determine responsibility assignment
   */
  private determineResponsibility(issue: Issue): ResponsibilityLevel {
    const text = (issue.title + ' ' + issue.body).toLowerCase();

    // Security issues → CISO
    if (text.match(/\b(security|vulnerability|exploit|breach|cve)\b/)) {
      return 'CISO';
    }

    // Architecture/design → TechLead
    if (text.match(/\b(architecture|design|pattern|refactor)\b/)) {
      return 'TechLead';
    }

    // Business/product → PO
    if (text.match(/\b(business|product|feature|requirement)\b/)) {
      return 'PO';
    }

    // DevOps/deployment → DevOps
    if (text.match(/\b(deploy|ci|cd|infrastructure|pipeline)\b/)) {
      return 'DevOps';
    }

    return 'Developer'; // Default
  }

  /**
   * Determine appropriate Agent
   */
  private determineAgent(type: Task['type']): AgentType {
    const agentMap: Record<Task['type'], AgentType> = {
      feature: 'CodeGenAgent',
      bug: 'CodeGenAgent',
      refactor: 'CodeGenAgent',
      docs: 'CodeGenAgent',
      test: 'CodeGenAgent',
      deployment: 'DeploymentAgent',
    };

    return agentMap[type];
  }

  // ============================================================================
  // Organizational Label System (組織設計原則65ラベル体系)
  // ============================================================================

  /**
   * Build complete label set based on Organizational theory
   */
  private buildLabelSet(analysis: IssueAnalysis): string[] {
    const labels: string[] = [];

    // 1. Issue Type (業務カテゴリ)
    const typeLabels: Record<Task['type'], string> = {
      feature: '✨feature',
      bug: '🐛bug',
      refactor: '🔧refactor',
      docs: '📚documentation',
      test: '🧪test',
      deployment: '🚀deployment',
    };
    labels.push(typeLabels[analysis.type]);

    // 2. Severity (深刻度)
    labels.push(`${this.getSeverityEmoji(analysis.severity)}${analysis.severity}`);

    // 3. Impact (影響度)
    labels.push(`📊影響度-${analysis.impact}`);

    // 4. Responsibility (責任者)
    const responsibilityLabels: Record<ResponsibilityLevel, string> = {
      Developer: '👤担当-開発者',
      TechLead: '👥担当-テックリード',
      PO: '👑担当-PO',
      CISO: '👑担当-PO', // Map to PO for now
      DevOps: '👤担当-開発者',
      AIAgent: '🤖担当-AI Agent',
    };
    labels.push(responsibilityLabels[analysis.responsibility]);

    // 5. Agent Type
    const agentLabels: Record<AgentType, string> = {
      CoordinatorAgent: '🎯CoordinatorAgent',
      CodeGenAgent: '🤖CodeGenAgent',
      ReviewAgent: '🔍ReviewAgent',
      IssueAgent: '📋IssueAgent',
      PRAgent: '🔀PRAgent',
      DeploymentAgent: '🚀DeploymentAgent',
      AutoFixAgent: '🔧AutoFixAgent',
      WaterSpiderAgent: '🕷️WaterSpiderAgent',
    };
    labels.push(agentLabels[analysis.agentType]);

    // 6. Security flag if responsibility is CISO
    if (analysis.responsibility === 'CISO') {
      labels.push('🔒Security-審査必要');
    }

    return labels;
  }

  /**
   * Get emoji for Severity
   */
  private getSeverityEmoji(severity: Severity): string {
    const emojiMap: Record<Severity, string> = {
      'Sev.1-Critical': '🔥',
      'Sev.2-High': '⭐',
      'Sev.3-Medium': '➡️',
      'Sev.4-Low': '🟢',
      'Sev.5-Trivial': '⬇️',
    };
    return emojiMap[severity];
  }

  /**
   * Determine assignees from CODEOWNERS or responsibility
   */
  private async determineAssignees(analysis: IssueAnalysis): Promise<string[]> {
    const assignees: string[] = [];

    // Map responsibility to GitHub usernames (from config)
    const responsibilityMap: Record<ResponsibilityLevel, string | undefined> = {
      Developer: undefined, // Let CODEOWNERS handle
      TechLead: this.config.techLeadGithubUsername,
      PO: this.config.poGithubUsername,
      CISO: this.config.cisoGithubUsername,
      DevOps: undefined,
      AIAgent: undefined,
    };

    const assignee = responsibilityMap[analysis.responsibility];
    if (assignee) {
      assignees.push(assignee);
    }

    return assignees;
  }

  // ============================================================================
  // Comment Formatting
  // ============================================================================

  /**
   * Format analysis comment for GitHub
   */
  private formatAnalysisComment(analysis: IssueAnalysis): string {
    return `## 🤖 IssueAgent Analysis

**Issue Type**: ${analysis.type}
**Severity**: ${analysis.severity}
**Impact**: ${analysis.impact}
**Responsibility**: ${analysis.responsibility}
**Assigned Agent**: ${analysis.agentType}
**Estimated Duration**: ${analysis.estimatedDuration} minutes

### Applied Labels
${analysis.labels.map(l => `- \`${l}\``).join('\n')}

${analysis.dependencies.length > 0 ? `### Dependencies
${analysis.dependencies.map(d => `- #${d.replace('issue-', '')}`).join('\n')}` : ''}

---

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>`;
  }

  // ============================================================================
  // Sub-Issue / Hierarchical Issue Support (E14)
  // ============================================================================

  /**
   * Create a sub-issue under a parent issue
   */
  async createSubIssue(request: IssueCreationRequest): Promise<SubIssue> {
    this.log(`🌳 Creating sub-issue under parent #${request.parentIssueNumber}`);

    try {
      // 1. Create the child issue
      const createdIssue = await withRetry(async () => {
        return await this.octokit.issues.create({
          owner: this.owner,
          repo: this.repo,
          title: request.title,
          body: this.formatSubIssueBody(request),
          labels: [...(request.labels || []), '📄 hierarchy:child'],
          assignees: request.assignees || [],
        });
      });

      // 2. Fetch parent issue to update hierarchy
      if (request.parentIssueNumber) {
        const parentIssue = await this.fetchIssue(request.parentIssueNumber);

        // 3. Update parent issue with child reference
        await this.updateParentIssueWithChild(
          request.parentIssueNumber,
          createdIssue.data.number,
          parentIssue
        );

        // 4. Add hierarchy label to parent if not already present
        const hasParentLabel = parentIssue.labels.includes('📂 hierarchy:parent');
        if (!hasParentLabel) {
          await this.applyLabels(request.parentIssueNumber, ['📂 hierarchy:parent']);
        }
      }

      // 5. Convert to SubIssue format
      const subIssue = await this.convertToSubIssue(createdIssue.data, request.parentIssueNumber);

      this.log(`✅ Sub-issue #${subIssue.number} created under parent #${request.parentIssueNumber}`);

      return subIssue;
    } catch (error) {
      this.log(`❌ Failed to create sub-issue: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Fetch issue hierarchy tree (parent + all descendants)
   */
  async fetchIssueHierarchy(rootIssueNumber: number): Promise<IssueHierarchyNode> {
    this.log(`🌲 Fetching issue hierarchy for #${rootIssueNumber}`);

    const rootIssue = await this.fetchIssue(rootIssueNumber);
    const rootSubIssue = await this.convertToSubIssue(rootIssue, undefined);

    return await this.buildHierarchyTree(rootSubIssue, 0);
  }

  /**
   * Build hierarchy tree recursively
   */
  private async buildHierarchyTree(
    issue: SubIssue,
    depth: number
  ): Promise<IssueHierarchyNode> {
    const node: IssueHierarchyNode = {
      issue,
      children: [],
      depth,
    };

    // Recursively fetch children
    if (issue.childIssueNumbers.length > 0) {
      for (const childNumber of issue.childIssueNumbers) {
        const childIssue = await this.fetchIssue(childNumber);
        const childSubIssue = await this.convertToSubIssue(childIssue, issue.number);
        const childNode = await this.buildHierarchyTree(childSubIssue, depth + 1);
        node.children.push(childNode);
      }
    }

    return node;
  }

  /**
   * Convert Issue to SubIssue with hierarchy metadata
   */
  private async convertToSubIssue(
    issue: Issue | any,
    parentIssueNumber?: number
  ): Promise<SubIssue> {
    // Extract child issue numbers from issue body
    const childIssueNumbers = this.extractChildIssueNumbers(issue.body || '');

    // Calculate hierarchy level
    let hierarchyLevel = 0;
    let ancestorPath: number[] = [];

    if (parentIssueNumber) {
      const parentIssue = await this.fetchIssue(parentIssueNumber);
      const parentBody = parentIssue.body || '';
      const parentMetadata = this.parseHierarchyMetadata(parentBody);
      hierarchyLevel = parentMetadata.hierarchyLevel + 1;
      ancestorPath = [...parentMetadata.ancestorPath, issue.number];
    } else {
      ancestorPath = [issue.number];
    }

    // Calculate completion progress
    const completionProgress = await this.calculateCompletionProgress(childIssueNumbers);

    const subIssue: SubIssue = {
      number: issue.number,
      title: issue.title,
      body: issue.body || '',
      state: issue.state,
      labels: Array.isArray(issue.labels)
        ? issue.labels.map((l: any) => (typeof l === 'string' ? l : l.name))
        : [],
      assignee: issue.assignee?.login,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      url: issue.html_url,
      parentIssueNumber,
      childIssueNumbers,
      hierarchyLevel,
      siblingIssueNumbers: [], // TODO: Calculate siblings
      ancestorPath,
      isLeaf: childIssueNumbers.length === 0,
      isRoot: !parentIssueNumber,
      totalDescendants: await this.countDescendants(childIssueNumbers),
      completionProgress,
    };

    return subIssue;
  }

  /**
   * Format sub-issue body with hierarchy metadata
   */
  private formatSubIssueBody(request: IssueCreationRequest): string {
    const parentRef = request.parentIssueNumber
      ? `\n\n**Parent Issue**: #${request.parentIssueNumber}`
      : '';

    return `${request.body}${parentRef}

---

<!-- HIERARCHY_METADATA
parentIssueNumber: ${request.parentIssueNumber || 'null'}
hierarchyLevel: ${request.parentIssueNumber ? '1' : '0'}
ancestorPath: [${request.parentIssueNumber || ''}]
-->`;
  }

  /**
   * Update parent issue with child reference
   */
  private async updateParentIssueWithChild(
    parentIssueNumber: number,
    childIssueNumber: number,
    parentIssue: Issue
  ): Promise<void> {
    const childRef = `- [ ] #${childIssueNumber}`;
    const existingBody = parentIssue.body || '';

    // Check if "Child Issues" section exists
    const childIssuesSection = '## Child Issues';
    let updatedBody: string;

    if (existingBody.includes(childIssuesSection)) {
      // Append to existing section
      const sectionIndex = existingBody.indexOf(childIssuesSection);
      const beforeSection = existingBody.substring(0, sectionIndex + childIssuesSection.length);
      const afterSection = existingBody.substring(sectionIndex + childIssuesSection.length);
      updatedBody = `${beforeSection}\n${childRef}${afterSection}`;
    } else {
      // Create new section
      updatedBody = `${existingBody}\n\n${childIssuesSection}\n${childRef}`;
    }

    await withRetry(async () => {
      await this.octokit.issues.update({
        owner: this.owner,
        repo: this.repo,
        issue_number: parentIssueNumber,
        body: updatedBody,
      });
    });

    this.log(`✅ Updated parent #${parentIssueNumber} with child #${childIssueNumber}`);
  }

  /**
   * Extract child issue numbers from issue body
   */
  private extractChildIssueNumbers(body: string): number[] {
    const childNumbers: number[] = [];
    const childIssuesSection = body.match(/## Child Issues\n([\s\S]*?)(\n##|$)/);

    if (childIssuesSection) {
      const issueRefs = childIssuesSection[1].match(/#(\d+)/g);
      if (issueRefs) {
        childNumbers.push(...issueRefs.map(ref => parseInt(ref.replace('#', ''), 10)));
      }
    }

    return childNumbers;
  }

  /**
   * Parse hierarchy metadata from issue body
   */
  private parseHierarchyMetadata(body: string): {
    parentIssueNumber?: number;
    hierarchyLevel: number;
    ancestorPath: number[];
  } {
    const metadataMatch = body.match(/<!-- HIERARCHY_METADATA\n([\s\S]*?)\n-->/);

    if (!metadataMatch) {
      return {
        hierarchyLevel: 0,
        ancestorPath: [],
      };
    }

    const metadata = metadataMatch[1];
    const parentMatch = metadata.match(/parentIssueNumber: (\d+|null)/);
    const levelMatch = metadata.match(/hierarchyLevel: (\d+)/);
    const pathMatch = metadata.match(/ancestorPath: \[([\d,\s]*)\]/);

    return {
      parentIssueNumber: parentMatch && parentMatch[1] !== 'null' ? parseInt(parentMatch[1], 10) : undefined,
      hierarchyLevel: levelMatch ? parseInt(levelMatch[1], 10) : 0,
      ancestorPath: pathMatch && pathMatch[1]
        ? pathMatch[1].split(',').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n))
        : [],
    };
  }

  /**
   * Calculate completion progress from child issues
   */
  private async calculateCompletionProgress(childIssueNumbers: number[]): Promise<{
    total: number;
    completed: number;
    percentage: number;
  }> {
    if (childIssueNumbers.length === 0) {
      return { total: 0, completed: 0, percentage: 0 };
    }

    let completed = 0;

    for (const childNumber of childIssueNumbers) {
      try {
        const childIssue = await this.fetchIssue(childNumber);
        if (childIssue.state === 'closed') {
          completed++;
        }
      } catch (error) {
        // Skip if issue not found
        this.log(`⚠️  Child issue #${childNumber} not found`);
      }
    }

    const percentage = Math.round((completed / childIssueNumbers.length) * 100);

    return {
      total: childIssueNumbers.length,
      completed,
      percentage,
    };
  }

  /**
   * Count total descendants recursively
   */
  private async countDescendants(childIssueNumbers: number[]): Promise<number> {
    if (childIssueNumbers.length === 0) {
      return 0;
    }

    let count = childIssueNumbers.length;

    for (const childNumber of childIssueNumbers) {
      try {
        const childIssue = await this.fetchIssue(childNumber);
        const grandchildNumbers = this.extractChildIssueNumbers(childIssue.body || '');
        count += await this.countDescendants(grandchildNumbers);
      } catch (error) {
        // Skip if issue not found
      }
    }

    return count;
  }

}

// ============================================================================
// Types
// ============================================================================

interface IssueAnalysis {
  type: Task['type'];
  severity: Severity;
  impact: ImpactLevel;
  responsibility: ResponsibilityLevel;
  agentType: AgentType;
  labels: string[];
  assignees: string[];
  dependencies: string[];
  estimatedDuration: number;
}

type ResponsibilityLevel = 'Developer' | 'TechLead' | 'PO' | 'CISO' | 'DevOps' | 'AIAgent';
