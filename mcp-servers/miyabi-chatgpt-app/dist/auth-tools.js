/**
 * GitHub Authentication MCP Tools
 *
 * Tools for GitHub OAuth Device Flow authentication
 */
import { startDeviceFlow, pollDeviceFlow, checkAuthStatus, getPendingAuth } from "./github-auth.js";
/**
 * Register GitHub authentication tools on the MCP server
 */
export function registerAuthTools(server, getToken, setToken) {
    // ============================================
    // GitHub Auth Start
    // ============================================
    server.tool("github_auth_start", {
        title: "Start GitHub Authentication",
        description: "Start GitHub OAuth authentication using Device Flow. Returns a code to enter at github.com/login/device",
        inputSchema: {
            type: "object",
            properties: {}
        }
    }, async () => {
        // Check if already authenticated
        const currentStatus = await checkAuthStatus(getToken());
        if (currentStatus.authenticated) {
            return {
                structuredContent: {
                    alreadyAuthenticated: true,
                    user: currentStatus.user
                },
                content: [{
                        type: "text",
                        text: `✅ Already authenticated as ${currentStatus.user}. Use github_auth_status to check details.`
                    }]
            };
        }
        // Check for pending authentication
        const pending = getPendingAuth();
        if (pending.pending) {
            return {
                structuredContent: {
                    pending: true,
                    userCode: pending.userCode,
                    verificationUri: pending.verificationUri,
                    expiresIn: pending.expiresIn
                },
                content: [{
                        type: "text",
                        text: `⏳ Authentication already in progress!\n\n` +
                            `1. Open: ${pending.verificationUri}\n` +
                            `2. Enter code: **${pending.userCode}**\n` +
                            `3. When done, use github_auth_poll to complete.`
                    }]
            };
        }
        try {
            const result = await startDeviceFlow();
            return {
                structuredContent: {
                    userCode: result.userCode,
                    verificationUri: result.verificationUri,
                    expiresIn: result.expiresIn,
                    interval: result.interval
                },
                content: [{
                        type: "text",
                        text: `🔐 **GitHub Authentication Started**\n\n` +
                            `1. Open: ${result.verificationUri}\n` +
                            `2. Enter code: **${result.userCode}**\n` +
                            `3. Click "Authorize"\n` +
                            `4. Say "完了" or use github_auth_poll to confirm\n\n` +
                            `⏱️ Code expires in ${Math.floor(result.expiresIn / 60)} minutes.`
                    }]
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            return {
                structuredContent: { error: message },
                content: [{ type: "text", text: `❌ Error: ${message}` }]
            };
        }
    });
    // ============================================
    // GitHub Auth Poll
    // ============================================
    server.tool("github_auth_poll", {
        title: "Check GitHub Authentication",
        description: "Check if GitHub authentication is complete. Call this after entering the code at GitHub.",
        inputSchema: {
            type: "object",
            properties: {}
        }
    }, async () => {
        const pending = getPendingAuth();
        if (!pending.pending) {
            // Check if already have token
            const currentStatus = await checkAuthStatus(getToken());
            if (currentStatus.authenticated) {
                return {
                    structuredContent: {
                        status: "complete",
                        user: currentStatus.user,
                        scopes: currentStatus.scopes
                    },
                    content: [{
                            type: "text",
                            text: `✅ Authenticated as **${currentStatus.user}**!`
                        }]
                };
            }
            return {
                structuredContent: { status: "no_pending" },
                content: [{
                        type: "text",
                        text: `No pending authentication. Use github_auth_start to begin.`
                    }]
            };
        }
        try {
            const result = await pollDeviceFlow();
            if (result.status === "pending") {
                return {
                    structuredContent: {
                        status: "pending",
                        userCode: pending.userCode,
                        verificationUri: pending.verificationUri
                    },
                    content: [{
                            type: "text",
                            text: `⏳ Waiting for authorization...\n\n` +
                                `Please enter code **${pending.userCode}** at ${pending.verificationUri}`
                        }]
                };
            }
            if (result.status === "complete" && result.token) {
                // Save token
                setToken(result.token);
                return {
                    structuredContent: {
                        status: "complete",
                        user: result.user,
                        authenticated: true
                    },
                    content: [{
                            type: "text",
                            text: `🎉 **GitHub Authentication Complete!**\n\n` +
                                `Welcome, **${result.user}**!\n\n` +
                                `You can now use:\n` +
                                `- list_repos - リポジトリ一覧\n` +
                                `- switch_project - プロジェクト切替\n` +
                                `- execute_agent - エージェント実行`
                        }]
                };
            }
            if (result.status === "expired") {
                return {
                    structuredContent: { status: "expired" },
                    content: [{
                            type: "text",
                            text: `⏰ Authentication expired. Use github_auth_start to try again.`
                        }]
                };
            }
            return {
                structuredContent: { status: "error", error: result.error },
                content: [{ type: "text", text: `❌ Error: ${result.error}` }]
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            return {
                structuredContent: { error: message },
                content: [{ type: "text", text: `❌ Error: ${message}` }]
            };
        }
    });
    // ============================================
    // GitHub Auth Status
    // ============================================
    server.tool("github_auth_status", {
        title: "GitHub Authentication Status",
        description: "Check current GitHub authentication status",
        inputSchema: {
            type: "object",
            properties: {}
        }
    }, async () => {
        const token = getToken();
        const status = await checkAuthStatus(token);
        const pending = getPendingAuth();
        if (status.authenticated) {
            return {
                structuredContent: {
                    authenticated: true,
                    user: status.user,
                    scopes: status.scopes
                },
                content: [{
                        type: "text",
                        text: `✅ **Authenticated**\n\n` +
                            `User: ${status.user}\n` +
                            `Scopes: ${status.scopes?.join(", ") || "N/A"}`
                    }]
            };
        }
        if (pending.pending) {
            return {
                structuredContent: {
                    authenticated: false,
                    pending: true,
                    userCode: pending.userCode,
                    expiresIn: pending.expiresIn
                },
                content: [{
                        type: "text",
                        text: `⏳ **Authentication Pending**\n\n` +
                            `Enter code **${pending.userCode}** at ${pending.verificationUri}\n` +
                            `Expires in ${pending.expiresIn} seconds.`
                    }]
            };
        }
        return {
            structuredContent: { authenticated: false },
            content: [{
                    type: "text",
                    text: `❌ **Not authenticated**\n\nUse github_auth_start to begin authentication.`
                }]
        };
    });
}
//# sourceMappingURL=auth-tools.js.map