#!/usr/bin/env node
/**
 * Miyabi GitHub MCP Server
 *
 * GitHub API integration for Miyabi Multi-Session Command Center
 * Provides issue, PR, label, and milestone management capabilities
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { Octokit } from "@octokit/rest";
// Environment configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const DEFAULT_OWNER = process.env.GITHUB_DEFAULT_OWNER || "";
const DEFAULT_REPO = process.env.GITHUB_DEFAULT_REPO || "";
if (!GITHUB_TOKEN) {
    console.error("Error: GITHUB_TOKEN environment variable is required");
    process.exit(1);
}
// Initialize Octokit
const octokit = new Octokit({
    auth: GITHUB_TOKEN,
});
// Create MCP server
const server = new Server({
    name: "miyabi-github-mcp",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
/**
 * Tool: github_list_issues
 * List issues from a repository
 */
async function listIssues(args) {
    const owner = args.owner || DEFAULT_OWNER;
    const repo = args.repo || DEFAULT_REPO;
    const state = args.state || "open";
    const labels = args.labels;
    const per_page = args.per_page || 30;
    const response = await octokit.issues.listForRepo({
        owner,
        repo,
        state,
        labels,
        per_page,
    });
    const issues = response.data.map((issue) => ({
        number: issue.number,
        title: issue.title,
        state: issue.state,
        labels: issue.labels.map((l) => l.name),
        assignees: issue.assignees?.map((a) => a.login) || [],
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        url: issue.html_url,
    }));
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(issues, null, 2),
            },
        ],
    };
}
/**
 * Tool: github_get_issue
 * Get detailed information about a specific issue
 */
async function getIssue(args) {
    const owner = args.owner || DEFAULT_OWNER;
    const repo = args.repo || DEFAULT_REPO;
    const issue_number = args.issue_number;
    if (!issue_number) {
        throw new Error("issue_number is required");
    }
    const response = await octokit.issues.get({
        owner,
        repo,
        issue_number,
    });
    const issue = {
        number: response.data.number,
        title: response.data.title,
        body: response.data.body,
        state: response.data.state,
        labels: response.data.labels.map((l) => l.name),
        assignees: response.data.assignees?.map((a) => a.login) || [],
        milestone: response.data.milestone?.title,
        created_at: response.data.created_at,
        updated_at: response.data.updated_at,
        closed_at: response.data.closed_at,
        url: response.data.html_url,
    };
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(issue, null, 2),
            },
        ],
    };
}
/**
 * Tool: github_create_issue
 * Create a new issue
 */
async function createIssue(args) {
    const owner = args.owner || DEFAULT_OWNER;
    const repo = args.repo || DEFAULT_REPO;
    const title = args.title;
    const body = args.body || "";
    const labels = args.labels || [];
    const assignees = args.assignees || [];
    if (!title) {
        throw new Error("title is required");
    }
    const response = await octokit.issues.create({
        owner,
        repo,
        title,
        body,
        labels,
        assignees,
    });
    return {
        content: [
            {
                type: "text",
                text: `Issue #${response.data.number} created successfully: ${response.data.html_url}`,
            },
        ],
    };
}
/**
 * Tool: github_update_issue
 * Update an existing issue
 */
async function updateIssue(args) {
    const owner = args.owner || DEFAULT_OWNER;
    const repo = args.repo || DEFAULT_REPO;
    const issue_number = args.issue_number;
    const title = args.title;
    const body = args.body;
    const state = args.state;
    const labels = args.labels;
    const assignees = args.assignees;
    if (!issue_number) {
        throw new Error("issue_number is required");
    }
    const updateData = { owner, repo, issue_number };
    if (title)
        updateData.title = title;
    if (body)
        updateData.body = body;
    if (state)
        updateData.state = state;
    if (labels)
        updateData.labels = labels;
    if (assignees)
        updateData.assignees = assignees;
    const response = await octokit.issues.update(updateData);
    return {
        content: [
            {
                type: "text",
                text: `Issue #${response.data.number} updated successfully`,
            },
        ],
    };
}
/**
 * Tool: github_add_comment
 * Add a comment to an issue or PR
 */
async function addComment(args) {
    const owner = args.owner || DEFAULT_OWNER;
    const repo = args.repo || DEFAULT_REPO;
    const issue_number = args.issue_number;
    const body = args.body;
    if (!issue_number || !body) {
        throw new Error("issue_number and body are required");
    }
    const response = await octokit.issues.createComment({
        owner,
        repo,
        issue_number,
        body,
    });
    return {
        content: [
            {
                type: "text",
                text: `Comment added successfully to issue #${issue_number}`,
            },
        ],
    };
}
/**
 * Tool: github_list_prs
 * List pull requests from a repository
 */
async function listPRs(args) {
    const owner = args.owner || DEFAULT_OWNER;
    const repo = args.repo || DEFAULT_REPO;
    const state = args.state || "open";
    const per_page = args.per_page || 30;
    const response = await octokit.pulls.list({
        owner,
        repo,
        state,
        per_page,
    });
    const prs = response.data.map((pr) => ({
        number: pr.number,
        title: pr.title,
        state: pr.state,
        draft: pr.draft,
        head: pr.head.ref,
        base: pr.base.ref,
        created_at: pr.created_at,
        updated_at: pr.updated_at,
        url: pr.html_url,
    }));
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(prs, null, 2),
            },
        ],
    };
}
/**
 * Tool: github_get_pr
 * Get detailed information about a specific PR
 */
async function getPR(args) {
    const owner = args.owner || DEFAULT_OWNER;
    const repo = args.repo || DEFAULT_REPO;
    const pull_number = args.pull_number;
    if (!pull_number) {
        throw new Error("pull_number is required");
    }
    const response = await octokit.pulls.get({
        owner,
        repo,
        pull_number,
    });
    const pr = {
        number: response.data.number,
        title: response.data.title,
        body: response.data.body,
        state: response.data.state,
        draft: response.data.draft,
        head: response.data.head.ref,
        base: response.data.base.ref,
        mergeable: response.data.mergeable,
        mergeable_state: response.data.mergeable_state,
        merged: response.data.merged,
        created_at: response.data.created_at,
        updated_at: response.data.updated_at,
        url: response.data.html_url,
    };
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(pr, null, 2),
            },
        ],
    };
}
/**
 * Tool: github_create_pr
 * Create a new pull request
 */
async function createPR(args) {
    const owner = args.owner || DEFAULT_OWNER;
    const repo = args.repo || DEFAULT_REPO;
    const title = args.title;
    const head = args.head;
    const base = args.base || "main";
    const body = args.body || "";
    const draft = args.draft || false;
    if (!title || !head) {
        throw new Error("title and head are required");
    }
    const response = await octokit.pulls.create({
        owner,
        repo,
        title,
        head,
        base,
        body,
        draft,
    });
    return {
        content: [
            {
                type: "text",
                text: `PR #${response.data.number} created successfully: ${response.data.html_url}`,
            },
        ],
    };
}
/**
 * Tool: github_merge_pr
 * Merge a pull request
 */
async function mergePR(args) {
    const owner = args.owner || DEFAULT_OWNER;
    const repo = args.repo || DEFAULT_REPO;
    const pull_number = args.pull_number;
    const merge_method = args.merge_method || "merge";
    if (!pull_number) {
        throw new Error("pull_number is required");
    }
    const response = await octokit.pulls.merge({
        owner,
        repo,
        pull_number,
        merge_method,
    });
    return {
        content: [
            {
                type: "text",
                text: `PR #${pull_number} merged successfully`,
            },
        ],
    };
}
/**
 * Tool: github_list_labels
 * List labels in a repository
 */
async function listLabels(args) {
    const owner = args.owner || DEFAULT_OWNER;
    const repo = args.repo || DEFAULT_REPO;
    const response = await octokit.issues.listLabelsForRepo({
        owner,
        repo,
    });
    const labels = response.data.map((label) => ({
        name: label.name,
        description: label.description,
        color: label.color,
    }));
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(labels, null, 2),
            },
        ],
    };
}
/**
 * Tool: github_add_labels
 * Add labels to an issue or PR
 */
async function addLabels(args) {
    const owner = args.owner || DEFAULT_OWNER;
    const repo = args.repo || DEFAULT_REPO;
    const issue_number = args.issue_number;
    const labels = args.labels;
    if (!issue_number || !labels || !Array.isArray(labels)) {
        throw new Error("issue_number and labels (array) are required");
    }
    await octokit.issues.addLabels({
        owner,
        repo,
        issue_number,
        labels,
    });
    return {
        content: [
            {
                type: "text",
                text: `Labels added successfully to issue #${issue_number}`,
            },
        ],
    };
}
/**
 * Tool: github_list_milestones
 * List milestones in a repository
 */
async function listMilestones(args) {
    const owner = args.owner || DEFAULT_OWNER;
    const repo = args.repo || DEFAULT_REPO;
    const state = args.state || "open";
    const response = await octokit.issues.listMilestones({
        owner,
        repo,
        state,
    });
    const milestones = response.data.map((milestone) => ({
        number: milestone.number,
        title: milestone.title,
        description: milestone.description,
        state: milestone.state,
        open_issues: milestone.open_issues,
        closed_issues: milestone.closed_issues,
        due_on: milestone.due_on,
    }));
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(milestones, null, 2),
            },
        ],
    };
}
// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "github_list_issues",
                description: "List issues from a GitHub repository",
                inputSchema: {
                    type: "object",
                    properties: {
                        owner: { type: "string", description: "Repository owner (optional if default is set)" },
                        repo: { type: "string", description: "Repository name (optional if default is set)" },
                        state: { type: "string", enum: ["open", "closed", "all"], description: "Issue state (default: open)" },
                        labels: { type: "string", description: "Comma-separated label names to filter by" },
                        per_page: { type: "number", description: "Number of results per page (default: 30)" },
                    },
                },
            },
            {
                name: "github_get_issue",
                description: "Get detailed information about a specific issue",
                inputSchema: {
                    type: "object",
                    properties: {
                        owner: { type: "string", description: "Repository owner" },
                        repo: { type: "string", description: "Repository name" },
                        issue_number: { type: "number", description: "Issue number" },
                    },
                    required: ["issue_number"],
                },
            },
            {
                name: "github_create_issue",
                description: "Create a new issue",
                inputSchema: {
                    type: "object",
                    properties: {
                        owner: { type: "string", description: "Repository owner" },
                        repo: { type: "string", description: "Repository name" },
                        title: { type: "string", description: "Issue title" },
                        body: { type: "string", description: "Issue body" },
                        labels: { type: "array", items: { type: "string" }, description: "Labels to add" },
                        assignees: { type: "array", items: { type: "string" }, description: "Assignees (usernames)" },
                    },
                    required: ["title"],
                },
            },
            {
                name: "github_update_issue",
                description: "Update an existing issue",
                inputSchema: {
                    type: "object",
                    properties: {
                        owner: { type: "string", description: "Repository owner" },
                        repo: { type: "string", description: "Repository name" },
                        issue_number: { type: "number", description: "Issue number" },
                        title: { type: "string", description: "New title" },
                        body: { type: "string", description: "New body" },
                        state: { type: "string", enum: ["open", "closed"], description: "New state" },
                        labels: { type: "array", items: { type: "string" }, description: "New labels" },
                        assignees: { type: "array", items: { type: "string" }, description: "New assignees" },
                    },
                    required: ["issue_number"],
                },
            },
            {
                name: "github_add_comment",
                description: "Add a comment to an issue or PR",
                inputSchema: {
                    type: "object",
                    properties: {
                        owner: { type: "string", description: "Repository owner" },
                        repo: { type: "string", description: "Repository name" },
                        issue_number: { type: "number", description: "Issue or PR number" },
                        body: { type: "string", description: "Comment body" },
                    },
                    required: ["issue_number", "body"],
                },
            },
            {
                name: "github_list_prs",
                description: "List pull requests from a repository",
                inputSchema: {
                    type: "object",
                    properties: {
                        owner: { type: "string", description: "Repository owner" },
                        repo: { type: "string", description: "Repository name" },
                        state: { type: "string", enum: ["open", "closed", "all"], description: "PR state (default: open)" },
                        per_page: { type: "number", description: "Number of results per page (default: 30)" },
                    },
                },
            },
            {
                name: "github_get_pr",
                description: "Get detailed information about a specific PR",
                inputSchema: {
                    type: "object",
                    properties: {
                        owner: { type: "string", description: "Repository owner" },
                        repo: { type: "string", description: "Repository name" },
                        pull_number: { type: "number", description: "PR number" },
                    },
                    required: ["pull_number"],
                },
            },
            {
                name: "github_create_pr",
                description: "Create a new pull request",
                inputSchema: {
                    type: "object",
                    properties: {
                        owner: { type: "string", description: "Repository owner" },
                        repo: { type: "string", description: "Repository name" },
                        title: { type: "string", description: "PR title" },
                        head: { type: "string", description: "Source branch" },
                        base: { type: "string", description: "Target branch (default: main)" },
                        body: { type: "string", description: "PR body" },
                        draft: { type: "boolean", description: "Create as draft (default: false)" },
                    },
                    required: ["title", "head"],
                },
            },
            {
                name: "github_merge_pr",
                description: "Merge a pull request",
                inputSchema: {
                    type: "object",
                    properties: {
                        owner: { type: "string", description: "Repository owner" },
                        repo: { type: "string", description: "Repository name" },
                        pull_number: { type: "number", description: "PR number" },
                        merge_method: {
                            type: "string",
                            enum: ["merge", "squash", "rebase"],
                            description: "Merge method (default: merge)",
                        },
                    },
                    required: ["pull_number"],
                },
            },
            {
                name: "github_list_labels",
                description: "List labels in a repository",
                inputSchema: {
                    type: "object",
                    properties: {
                        owner: { type: "string", description: "Repository owner" },
                        repo: { type: "string", description: "Repository name" },
                    },
                },
            },
            {
                name: "github_add_labels",
                description: "Add labels to an issue or PR",
                inputSchema: {
                    type: "object",
                    properties: {
                        owner: { type: "string", description: "Repository owner" },
                        repo: { type: "string", description: "Repository name" },
                        issue_number: { type: "number", description: "Issue or PR number" },
                        labels: { type: "array", items: { type: "string" }, description: "Labels to add" },
                    },
                    required: ["issue_number", "labels"],
                },
            },
            {
                name: "github_list_milestones",
                description: "List milestones in a repository",
                inputSchema: {
                    type: "object",
                    properties: {
                        owner: { type: "string", description: "Repository owner" },
                        repo: { type: "string", description: "Repository name" },
                        state: { type: "string", enum: ["open", "closed", "all"], description: "Milestone state (default: open)" },
                    },
                },
            },
        ],
    };
});
// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            case "github_list_issues":
                return await listIssues(args);
            case "github_get_issue":
                return await getIssue(args);
            case "github_create_issue":
                return await createIssue(args);
            case "github_update_issue":
                return await updateIssue(args);
            case "github_add_comment":
                return await addComment(args);
            case "github_list_prs":
                return await listPRs(args);
            case "github_get_pr":
                return await getPR(args);
            case "github_create_pr":
                return await createPR(args);
            case "github_merge_pr":
                return await mergePR(args);
            case "github_list_labels":
                return await listLabels(args);
            case "github_add_labels":
                return await addLabels(args);
            case "github_list_milestones":
                return await listMilestones(args);
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${error.message}`,
                },
            ],
            isError: true,
        };
    }
});
// Start server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Miyabi GitHub MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map