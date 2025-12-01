#!/usr/bin/env node
/**
 * GitHub Read-only MCP Server for ChatGPT
 * Provides safe, read-only access to GitHub resources
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const { Octokit } = require('@octokit/rest');

class GitHubReadonlyServer {
  constructor() {
    this.server = new Server(
      {
        name: 'github-readonly-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.token = process.env.GITHUB_TOKEN;
    this.octokit = new Octokit({ auth: this.token || undefined });
    
    const repo = process.env.GITHUB_REPOSITORY || 'customer-cloud/miyabi-private';
    [this.owner, this.repo] = repo.split('/');

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'list_issues',
          description: 'List open issues in the repository',
          inputSchema: {
            type: 'object',
            properties: {
              state: {
                type: 'string',
                enum: ['open', 'closed', 'all'],
                default: 'open',
              },
              labels: {
                type: 'string',
                description: 'Comma-separated list of labels to filter by',
              },
              limit: {
                type: 'number',
                default: 20,
              },
            },
          },
        },
        {
          name: 'get_issue',
          description: 'Get details of a specific issue',
          inputSchema: {
            type: 'object',
            properties: {
              issue_number: {
                type: 'number',
                description: 'Issue number',
              },
            },
            required: ['issue_number'],
          },
        },
        {
          name: 'list_pull_requests',
          description: 'List pull requests in the repository',
          inputSchema: {
            type: 'object',
            properties: {
              state: {
                type: 'string',
                enum: ['open', 'closed', 'all'],
                default: 'open',
              },
              limit: {
                type: 'number',
                default: 20,
              },
            },
          },
        },
        {
          name: 'get_pull_request',
          description: 'Get details of a specific pull request',
          inputSchema: {
            type: 'object',
            properties: {
              pr_number: {
                type: 'number',
                description: 'PR number',
              },
            },
            required: ['pr_number'],
          },
        },
        {
          name: 'get_repository_info',
          description: 'Get repository information and statistics',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'list_branches',
          description: 'List branches in the repository',
          inputSchema: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                default: 30,
              },
            },
          },
        },
        {
          name: 'get_commit',
          description: 'Get details of a specific commit',
          inputSchema: {
            type: 'object',
            properties: {
              sha: {
                type: 'string',
                description: 'Commit SHA',
              },
            },
            required: ['sha'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'list_issues':
            return await this.listIssues(args);
          case 'get_issue':
            return await this.getIssue(args.issue_number);
          case 'list_pull_requests':
            return await this.listPullRequests(args);
          case 'get_pull_request':
            return await this.getPullRequest(args.pr_number);
          case 'get_repository_info':
            return await this.getRepositoryInfo();
          case 'list_branches':
            return await this.listBranches(args.limit);
          case 'get_commit':
            return await this.getCommit(args.sha);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    });
  }

  async listIssues(args) {
    const { data } = await this.octokit.issues.listForRepo({
      owner: this.owner,
      repo: this.repo,
      state: args.state || 'open',
      labels: args.labels,
      per_page: args.limit || 20,
    });

    const issues = data.map(i => ({
      number: i.number,
      title: i.title,
      state: i.state,
      labels: i.labels.map(l => l.name),
      created_at: i.created_at,
      updated_at: i.updated_at,
    }));

    return {
      content: [{ type: 'text', text: JSON.stringify({ issues, count: issues.length }, null, 2) }],
    };
  }

  async getIssue(issueNumber) {
    const { data } = await this.octokit.issues.get({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          number: data.number,
          title: data.title,
          state: data.state,
          body: data.body,
          labels: data.labels.map(l => l.name),
          assignees: data.assignees.map(a => a.login),
          created_at: data.created_at,
          updated_at: data.updated_at,
        }, null, 2),
      }],
    };
  }

  async listPullRequests(args) {
    const { data } = await this.octokit.pulls.list({
      owner: this.owner,
      repo: this.repo,
      state: args.state || 'open',
      per_page: args.limit || 20,
    });

    const prs = data.map(pr => ({
      number: pr.number,
      title: pr.title,
      state: pr.state,
      head: pr.head.ref,
      base: pr.base.ref,
      created_at: pr.created_at,
    }));

    return {
      content: [{ type: 'text', text: JSON.stringify({ pull_requests: prs, count: prs.length }, null, 2) }],
    };
  }

  async getPullRequest(prNumber) {
    const { data } = await this.octokit.pulls.get({
      owner: this.owner,
      repo: this.repo,
      pull_number: prNumber,
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          number: data.number,
          title: data.title,
          state: data.state,
          body: data.body,
          head: data.head.ref,
          base: data.base.ref,
          mergeable: data.mergeable,
          additions: data.additions,
          deletions: data.deletions,
          changed_files: data.changed_files,
        }, null, 2),
      }],
    };
  }

  async getRepositoryInfo() {
    const { data } = await this.octokit.repos.get({
      owner: this.owner,
      repo: this.repo,
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          name: data.name,
          full_name: data.full_name,
          description: data.description,
          language: data.language,
          default_branch: data.default_branch,
          open_issues_count: data.open_issues_count,
          stargazers_count: data.stargazers_count,
          forks_count: data.forks_count,
        }, null, 2),
      }],
    };
  }

  async listBranches(limit) {
    const { data } = await this.octokit.repos.listBranches({
      owner: this.owner,
      repo: this.repo,
      per_page: limit || 30,
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ branches: data.map(b => b.name), count: data.length }, null, 2),
      }],
    };
  }

  async getCommit(sha) {
    const { data } = await this.octokit.repos.getCommit({
      owner: this.owner,
      repo: this.repo,
      ref: sha,
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          sha: data.sha,
          message: data.commit.message,
          author: data.commit.author.name,
          date: data.commit.author.date,
          files_changed: data.files?.length || 0,
        }, null, 2),
      }],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('GitHub Read-only Server started');
  }
}

const server = new GitHubReadonlyServer();
server.run().catch(console.error);
