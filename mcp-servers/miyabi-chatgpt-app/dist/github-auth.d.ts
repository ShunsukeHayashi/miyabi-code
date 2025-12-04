/**
 * GitHub Device Flow Authentication for MCP
 *
 * Enables GitHub OAuth authentication via Device Flow (RFC 8628)
 * No browser redirect needed - user enters code manually
 */
interface DeviceFlowState {
    deviceCode: string | null;
    userCode: string | null;
    verificationUri: string | null;
    expiresAt: Date | null;
    interval: number;
}
export declare const deviceFlowState: DeviceFlowState;
/**
 * Start Device Flow authentication
 * Returns user code and verification URL
 */
export declare function startDeviceFlow(): Promise<{
    userCode: string;
    verificationUri: string;
    expiresIn: number;
    interval: number;
}>;
/**
 * Poll for authentication completion
 * Returns access token when user completes authentication
 */
export declare function pollDeviceFlow(): Promise<{
    status: "pending" | "complete" | "expired" | "error";
    token?: string;
    user?: string;
    error?: string;
}>;
/**
 * Check current authentication status
 */
export declare function checkAuthStatus(token: string | null): Promise<{
    authenticated: boolean;
    user?: string;
    scopes?: string[];
}>;
/**
 * Get pending authentication info
 */
export declare function getPendingAuth(): {
    pending: boolean;
    userCode?: string;
    verificationUri?: string;
    expiresIn?: number;
};
export {};
//# sourceMappingURL=github-auth.d.ts.map