/**
 * Miyabi ChatGPT App - MCP Server (Simplified for OAuth Test)
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readFileSync, existsSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { z } from "zod";
import { registerAuthTools } from "./auth-tools.js";
const __dirname = dirname(fileURLToPath(import.meta.url));
const TOKEN_FILE = join(__dirname, "..", ".github-token");
function loadPersistedToken() {
    try {
        if (existsSync(TOKEN_FILE)) {
            return readFileSync(TOKEN_FILE, "utf8").trim();
        }
    }
    catch { }
    return null;
}
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
const server = new McpServer({
    name: "miyabi-chatgpt-app",
    version: "1.1.0"
});
// Register GitHub Auth Tools
registerAuthTools(server, () => session.githubToken, (token) => {
    session.githubToken = token;
    persistToken(token);
});
// Simple tools without parameters
server.tool("get_project_status", "Get current project status", async () => {
    if (!session.owner || !session.repo) {
        return {
            content: [{ type: "text", text: "No project selected. Use switch_project first." }]
        };
    }
    return {
        content: [{ type: "text", text: `Current project: ${session.owner}/${session.repo}` }]
    };
});
// Tools with parameters using Zod
server.tool("list_repos", { filter: z.string().optional().describe("Filter repos by name") }, async (args) => {
    if (!session.githubToken) {
        return {
            content: [{ type: "text", text: "❌ GitHub認証が必要です。github_auth_start を使って認証を開始してください。" }]
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
                content: [{ type: "text", text: "❌ トークンが無効です。github_auth_start で再認証してください。" }]
            };
        }
        const repos = await response.json();
        let filtered = repos;
        if (args.filter) {
            filtered = repos.filter((r) => r.full_name.toLowerCase().includes(args.filter.toLowerCase()));
        }
        const repoList = filtered.slice(0, 10).map((r) => `- ${r.full_name}`).join("\n");
        return {
            content: [{ type: "text", text: `📦 Repositories:\n${repoList}` }]
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
            content: [{ type: "text", text: `Error: ${message}` }]
        };
    }
});
server.tool("switch_project", {
    owner: z.string().describe("Repository owner"),
    repo: z.string().describe("Repository name")
}, async (args) => {
    session.owner = args.owner;
    session.repo = args.repo;
    session.linkId = `link_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    return {
        content: [{ type: "text", text: `✅ Switched to ${args.owner}/${args.repo}` }]
    };
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Miyabi ChatGPT App MCP Server v1.1.0 running on stdio");
    console.error("GitHub Auth: " + (session.githubToken ? "Token present" : "Not authenticated"));
}
main().catch(console.error);
//# sourceMappingURL=index.js.map