/**
 * Miyabi ChatGPT App - MCP Server
 *
 * ChatGPT Apps SDK integration for Miyabi
 * Provides project management, agent execution, and dashboard widgets
 *
 * NEW: GitHub Device Flow authentication for MCP-based onboarding
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readFileSync, existsSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { registerAuthTools } from "./auth-tools.js";
const __dirname = dirname(fileURLToPath(import.meta.url));
// Token persistence path
const TOKEN_FILE = join(__dirname, "..", ".github-token");
// Load persisted token
function loadPersistedToken() {
    try {
        if (existsSync(TOKEN_FILE)) {
            return readFileSync(TOKEN_FILE, "utf8").trim();
        }
    }
    catch {
        // Ignore errors
    }
    return null;
}
// Save token to file
function persistToken(token) {
    try {
        writeFileSync(TOKEN_FILE, token, { mode: 0o600 });
    }
    catch (error) {
        console.error("Failed to persist token:", error);
    }
}
const session = {
    linkId: null,
    owner: null,
    repo: null,
    githubToken: process.env.GITHUB_TOKEN || loadPersistedToken()
};
// Widget HTML/JS loader
function loadWidget(name) {
    const webDistPath = join(__dirname, "..", "web", "dist");
    const jsPath = join(webDistPath, `${name}.js`);
    const cssPath = join(webDistPath, `${name}.css`);
    return {
        html: `<div id="miyabi-root"></div>`,
        js: existsSync(jsPath) ? readFileSync(jsPath, "utf8") : "",
        css: existsSync(cssPath) ? readFileSync(cssPath, "utf8") : ""
    };
}
// Create MCP Server
const server = new McpServer({
    name: "miyabi-chatgpt-app",
    version: "1.1.0"
});
// ============================================
// Register GitHub Auth Tools (Device Flow)
// ============================================
registerAuthTools(server, () => session.githubToken, (token) => {
    session.githubToken = token;
    persistToken(token);
});
// ============================================
// Widget Templates (Resources)
// ============================================
// Project Selector Widget
server.resource("project-selector", "ui://widget/project-selector.html", async () => {
    const widget = loadWidget("widget");
    return {
        contents: [{
                uri: "ui://widget/project-selector.html",
                mimeType: "text/html+skybridge",
                text: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; }
    ${widget.css}
  </style>
</head>
<body>
  ${widget.html}
  <script type="module">${widget.js}</script>
</body>
</html>
        `.trim(),
                _meta: {
                    "openai/widgetPrefersBorder": true,
                    "openai/widgetDomain": "https://miyabi-world.com",
                    "openai/widgetCSP": {
                        connect_domains: [
                            "https://api.github.com",
                            "https://mcp.miyabi-world.com"
                        ],
                        resource_domains: ["https://*.oaistatic.com"]
                    },
                    "openai/widgetDescription": "Miyabi project selector and dashboard"
                }
            }]
    };
});
// Dashboard Widget
server.resource("dashboard", "ui://widget/dashboard.html", async () => {
    const widget = loadWidget("widget");
    return {
        contents: [{
                uri: "ui://widget/dashboard.html",
                mimeType: "text/html+skybridge",
                text: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; }
    ${widget.css}
  </style>
</head>
<body>
  ${widget.html}
  <script type="module">${widget.js}</script>
</body>
</html>
        `.trim(),
                _meta: {
                    "openai/widgetPrefersBorder": true,
                    "openai/widgetDomain": "https://miyabi-world.com",
                    "openai/widgetCSP": {
                        connect_domains: [
                            "https://api.github.com",
                            "https://mcp.miyabi-world.com"
                        ]
                    }
                }
            }]
    };
});
// ============================================
// Tools
// ============================================
// List GitHub Repositories
server.tool("list_repos", {
    title: "List GitHub Repositories",
    description: "List available GitHub repositories for the authenticated user",
    inputSchema: {
        type: "object",
        properties: {
            filter: {
                type: "string",
                description: "Filter repos by name"
            }
        }
    }
}, async (args) => {
    if (!session.githubToken) {
        return {
            structuredContent: {
                error: "not_authenticated",
                message: "GitHub authentication required"
            },
            content: [{
                    type: "text",
                    text: "❌ GitHub認証が必要です。\n\n`github_auth_start` を使って認証を開始してください。"
                }]
        };
    }
    try {
        const response = await fetch("https://api.github.com/user/repos?per_page=50&sort=updated", {
            headers: {
                Authorization: `Bearer ${session.githubToken}`,
                Accept: "application/vnd.github.v3+json"
            }
        });
        if (response.status === 401) {
            session.githubToken = null;
            return {
                structuredContent: { error: "token_expired" },
                content: [{
                        type: "text",
                        text: "❌ トークンが無効です。`github_auth_start` で再認証してください。"
                    }]
            };
        }
        const repos = await response.json();
        let filtered = repos;
        if (args.filter) {
            filtered = repos.filter((r) => r.full_name.toLowerCase().includes(args.filter.toLowerCase()));
        }
        return {
            structuredContent: {
                repos: filtered.slice(0, 20).map((r) => ({
                    id: r.id,
                    name: r.name,
                    fullName: r.full_name,
                    owner: r.owner.login,
                    description: r.description,
                    updatedAt: r.updated_at,
                    language: r.language,
                    stars: r.stargazers_count
                })),
                total: filtered.length,
                currentProject: session.repo ? `${session.owner}/${session.repo}` : null
            },
            content: [{
                    type: "text",
                    text: `Found ${filtered.length} repositories. Select one to switch projects.`
                }]
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
            structuredContent: { error: message },
            content: [{ type: "text", text: `Error: ${message}` }]
        };
    }
});
// Switch Project
server.tool("switch_project", {
    title: "Switch Project",
    description: "Switch to a different GitHub repository",
    inputSchema: {
        type: "object",
        properties: {
            owner: { type: "string", description: "Repository owner" },
            repo: { type: "string", description: "Repository name" }
        },
        required: ["owner", "repo"]
    }
}, async (args) => {
    const { owner, repo } = args;
    session.owner = owner;
    session.repo = repo;
    session.linkId = `link_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    return {
        structuredContent: {
            success: true,
            project: `${owner}/${repo}`,
            linkId: session.linkId
        },
        content: [{
                type: "text",
                text: `Switched to ${owner}/${repo}. You can now use Miyabi agents on this project.`
            }]
    };
});
// Get Project Status
server.tool("get_project_status", {
    title: "Get Project Status",
    description: "Get current project status including issues, PRs, and recent activity",
    inputSchema: {
        type: "object",
        properties: {}
    }
}, async () => {
    if (!session.owner || !session.repo) {
        return {
            structuredContent: { error: "No project selected" },
            content: [{ type: "text", text: "Please select a project first using list_repos." }]
        };
    }
    try {
        const headers = {
            Authorization: `Bearer ${session.githubToken}`,
            Accept: "application/vnd.github.v3+json"
        };
        const [issuesRes, prsRes, repoRes] = await Promise.all([
            fetch(`https://api.github.com/repos/${session.owner}/${session.repo}/issues?state=open&per_page=10`, { headers }),
            fetch(`https://api.github.com/repos/${session.owner}/${session.repo}/pulls?state=open&per_page=10`, { headers }),
            fetch(`https://api.github.com/repos/${session.owner}/${session.repo}`, { headers })
        ]);
        const issues = await issuesRes.json();
        const prs = await prsRes.json();
        const repo = await repoRes.json();
        const actualIssues = issues.filter((i) => !i.pull_request);
        return {
            structuredContent: {
                project: `${session.owner}/${session.repo}`,
                stats: {
                    openIssues: repo.open_issues_count,
                    stars: repo.stargazers_count,
                    forks: repo.forks_count,
                    language: repo.language
                },
                issues: actualIssues.slice(0, 5).map((i) => ({
                    number: i.number,
                    title: i.title,
                    state: i.state,
                    labels: i.labels.map((l) => l.name),
                    createdAt: i.created_at
                })),
                pullRequests: prs.slice(0, 5).map((pr) => ({
                    number: pr.number,
                    title: pr.title,
                    state: pr.state,
                    draft: pr.draft,
                    createdAt: pr.created_at
                }))
            },
            content: [{
                    type: "text",
                    text: `Project ${session.owner}/${session.repo}: ${actualIssues.length} open issues, ${prs.length} open PRs`
                }]
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
            structuredContent: { error: message },
            content: [{ type: "text", text: `Error: ${message}` }]
        };
    }
});
// Execute Agent
server.tool("execute_agent", {
    title: "Execute Miyabi Agent",
    description: "Execute a Miyabi agent (codegen, review, issue, pr, deployment)",
    inputSchema: {
        type: "object",
        properties: {
            agent: {
                type: "string",
                enum: ["codegen", "review", "issue", "pr", "deployment", "coordinator"],
                description: "Agent type to execute"
            },
            issueNumber: {
                type: "number",
                description: "Issue number to work on"
            },
            instructions: {
                type: "string",
                description: "Additional instructions for the agent"
            }
        },
        required: ["agent"]
    }
}, async (args) => {
    if (!session.owner || !session.repo) {
        return {
            structuredContent: { error: "No project selected" },
            content: [{ type: "text", text: "Please select a project first." }]
        };
    }
    const agentInfo = {
        codegen: { name: "CodeGenAgent", description: "AI-driven code generation" },
        review: { name: "ReviewAgent", description: "Code quality review and security audit" },
        issue: { name: "IssueAgent", description: "Issue analysis and label management" },
        pr: { name: "PRAgent", description: "Pull request creation and management" },
        deployment: { name: "DeploymentAgent", description: "CI/CD deployment automation" },
        coordinator: { name: "CoordinatorAgent", description: "Task coordination and orchestration" }
    };
    const agent = agentInfo[args.agent];
    if (!agent) {
        return {
            structuredContent: { error: `Unknown agent: ${args.agent}` },
            content: [{ type: "text", text: `Unknown agent type: ${args.agent}` }]
        };
    }
    const executionId = `exec_${Date.now()}`;
    return {
        structuredContent: {
            executionId,
            agent: agent.name,
            status: "started",
            project: `${session.owner}/${session.repo}`,
            issueNumber: args.issueNumber,
            startedAt: new Date().toISOString()
        },
        content: [{
                type: "text",
                text: `Started ${agent.name}: ${agent.description}. Execution ID: ${executionId}`
            }]
    };
});
// List Files
server.tool("list_files", {
    title: "List Repository Files",
    description: "List files in the current repository",
    inputSchema: {
        type: "object",
        properties: {
            path: {
                type: "string",
                description: "Directory path (default: root)"
            }
        }
    }
}, async (args) => {
    if (!session.owner || !session.repo) {
        return {
            structuredContent: { error: "No project selected" },
            content: [{ type: "text", text: "Please select a project first." }]
        };
    }
    const path = args.path || "";
    try {
        const response = await fetch(`https://api.github.com/repos/${session.owner}/${session.repo}/contents/${path}`, {
            headers: {
                Authorization: `Bearer ${session.githubToken}`,
                Accept: "application/vnd.github.v3+json"
            }
        });
        const contents = await response.json();
        if (!Array.isArray(contents)) {
            return {
                structuredContent: { error: "Path is not a directory" },
                content: [{ type: "text", text: "The specified path is not a directory." }]
            };
        }
        return {
            structuredContent: {
                path: path || "/",
                files: contents.map((f) => ({
                    name: f.name,
                    type: f.type,
                    size: f.size,
                    path: f.path
                }))
            },
            content: [{
                    type: "text",
                    text: `Found ${contents.length} items in ${path || "root"}`
                }]
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
            structuredContent: { error: message },
            content: [{ type: "text", text: `Error: ${message}` }]
        };
    }
});
// ============================================
// Start Server
// ============================================
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Miyabi ChatGPT App MCP Server v1.1.0 running on stdio");
    console.error("GitHub Auth: " + (session.githubToken ? "Token present" : "Not authenticated"));
}
main().catch(console.error);
//# sourceMappingURL=index.js.map