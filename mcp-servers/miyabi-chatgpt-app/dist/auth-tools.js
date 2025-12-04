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
    server.registerTool("github_auth_start", {
        description: "Start GitHub OAuth authentication using Device Flow. Returns a code to enter at github.com/login/device"
    }, async () => {
        // Check if already authenticated
        const currentStatus = await checkAuthStatus(getToken());
        if (currentStatus.authenticated) {
            return {
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
                content: [{ type: "text", text: `❌ Error: ${message}` }]
            };
        }
    });
    // ============================================
    // GitHub Auth Poll
    // ============================================
    server.registerTool("github_auth_poll", {
        description: "Check if GitHub authentication is complete. Call after user authorizes at github.com"
    }, async () => {
        try {
            const result = await pollDeviceFlow();
            if (result.status === "complete" && result.token) {
                setToken(result.token);
                return {
                    content: [{
                            type: "text",
                            text: `✅ **認証成功！**\n\n` +
                                `GitHub アカウント: ${result.user}\n` +
                                `Miyabi を使用する準備ができました。`
                        }]
                };
            }
            else if (result.status === "pending") {
                return {
                    content: [{
                            type: "text",
                            text: `⏳ まだ認証が完了していません。\n\n` +
                                `GitHub で認証を完了してから、もう一度 github_auth_poll を呼んでください。`
                        }]
                };
            }
            else {
                return {
                    content: [{
                            type: "text",
                            text: `❌ 認証に失敗しました: ${result.error}\n\n` +
                                `github_auth_start で再度開始してください。`
                        }]
                };
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            return {
                content: [{ type: "text", text: `❌ Error: ${message}` }]
            };
        }
    });
    // ============================================
    // GitHub Auth Status
    // ============================================
    server.registerTool("github_auth_status", {
        description: "Check current GitHub authentication status"
    }, async () => {
        const status = await checkAuthStatus(getToken());
        if (status.authenticated) {
            return {
                content: [{
                        type: "text",
                        text: `✅ **認証済み**\n\n` +
                            `GitHub User: ${status.user}\n` +
                            `Scopes: ${status.scopes?.join(", ") || "N/A"}`
                    }]
            };
        }
        else {
            return {
                content: [{
                        type: "text",
                        text: `❌ **未認証**\n\n` +
                            `github_auth_start を使用して GitHub 認証を開始してください。`
                    }]
            };
        }
    });
}
//# sourceMappingURL=auth-tools.js.map