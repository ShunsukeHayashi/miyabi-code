/**
 * GitHub Device Flow Authentication for MCP
 *
 * Enables GitHub OAuth authentication via Device Flow (RFC 8628)
 * No browser redirect needed - user enters code manually
 */
export const deviceFlowState = {
    deviceCode: null,
    userCode: null,
    verificationUri: null,
    expiresAt: null,
    interval: 5
};
// GitHub OAuth App Client ID
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || "Ov23liiMr5kSJLGJFNyn";
/**
 * Start Device Flow authentication
 * Returns user code and verification URL
 */
export async function startDeviceFlow() {
    const response = await fetch("https://github.com/login/device/code", {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
            client_id: GITHUB_CLIENT_ID,
            scope: "repo user read:org"
        })
    });
    if (!response.ok) {
        throw new Error(`Device Flow start failed: ${response.status}`);
    }
    const data = await response.json();
    // Store state
    deviceFlowState.deviceCode = data.device_code;
    deviceFlowState.userCode = data.user_code;
    deviceFlowState.verificationUri = data.verification_uri;
    deviceFlowState.expiresAt = new Date(Date.now() + data.expires_in * 1000);
    deviceFlowState.interval = data.interval || 5;
    return {
        userCode: data.user_code,
        verificationUri: data.verification_uri,
        expiresIn: data.expires_in,
        interval: data.interval || 5
    };
}
/**
 * Poll for authentication completion
 * Returns access token when user completes authentication
 */
export async function pollDeviceFlow() {
    if (!deviceFlowState.deviceCode) {
        return { status: "error", error: "No active authentication. Call github_auth_start first." };
    }
    // Check expiration
    if (deviceFlowState.expiresAt && new Date() > deviceFlowState.expiresAt) {
        clearDeviceFlowState();
        return { status: "expired", error: "Authentication expired. Please start again." };
    }
    try {
        const response = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                client_id: GITHUB_CLIENT_ID,
                device_code: deviceFlowState.deviceCode,
                grant_type: "urn:ietf:params:oauth:grant-type:device_code"
            })
        });
        const data = await response.json();
        if (data.error === "authorization_pending") {
            return { status: "pending" };
        }
        if (data.error === "slow_down") {
            deviceFlowState.interval = (deviceFlowState.interval || 5) + 5;
            return { status: "pending" };
        }
        if (data.error === "expired_token") {
            clearDeviceFlowState();
            return { status: "expired", error: "Authentication expired" };
        }
        if (data.error) {
            return { status: "error", error: data.error_description || data.error };
        }
        if (data.access_token) {
            // Get user info
            const userResponse = await fetch("https://api.github.com/user", {
                headers: {
                    Authorization: `Bearer ${data.access_token}`,
                    Accept: "application/vnd.github.v3+json"
                }
            });
            const user = await userResponse.json();
            clearDeviceFlowState();
            return {
                status: "complete",
                token: data.access_token,
                user: user.login
            };
        }
        return { status: "error", error: "Unknown response" };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return { status: "error", error: message };
    }
}
/**
 * Check current authentication status
 */
export async function checkAuthStatus(token) {
    if (!token) {
        return { authenticated: false };
    }
    try {
        const response = await fetch("https://api.github.com/user", {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github.v3+json"
            }
        });
        if (!response.ok) {
            return { authenticated: false };
        }
        const user = await response.json();
        const scopeHeader = response.headers.get("X-OAuth-Scopes");
        const scopes = scopeHeader ? scopeHeader.split(", ") : [];
        return {
            authenticated: true,
            user: user.login,
            scopes
        };
    }
    catch {
        return { authenticated: false };
    }
}
/**
 * Get pending authentication info
 */
export function getPendingAuth() {
    if (!deviceFlowState.deviceCode || !deviceFlowState.expiresAt) {
        return { pending: false };
    }
    const now = new Date();
    if (now > deviceFlowState.expiresAt) {
        clearDeviceFlowState();
        return { pending: false };
    }
    return {
        pending: true,
        userCode: deviceFlowState.userCode || undefined,
        verificationUri: deviceFlowState.verificationUri || undefined,
        expiresIn: Math.floor((deviceFlowState.expiresAt.getTime() - now.getTime()) / 1000)
    };
}
function clearDeviceFlowState() {
    deviceFlowState.deviceCode = null;
    deviceFlowState.userCode = null;
    deviceFlowState.verificationUri = null;
    deviceFlowState.expiresAt = null;
    deviceFlowState.interval = 5;
}
//# sourceMappingURL=github-auth.js.map