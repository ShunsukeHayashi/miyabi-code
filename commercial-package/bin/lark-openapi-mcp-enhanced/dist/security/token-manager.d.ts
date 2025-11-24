/**
 * Enhanced Token Manager with Security Features
 *
 * This module provides secure token management with encryption, rotation,
 * and automatic refresh capabilities for the Lark OpenAPI MCP integration.
 */
import { EventEmitter } from 'events';
export interface TokenConfig {
    appId: string;
    appSecret: string;
    userAccessToken?: string;
    encryptionKey?: string;
    refreshInterval?: number;
    tokenExpiry?: number;
}
export interface SecureTokenStorage {
    encryptedTokens: string;
    tokenHash: string;
    lastRotation: string;
    expiresAt: string;
    version: string;
}
export interface TokenRotationConfig {
    enabled: boolean;
    rotationInterval: number;
    maxTokenAge: number;
    backupCount: number;
}
export declare class SecureTokenManager extends EventEmitter {
    private config;
    private rotationConfig;
    private credentialsPath;
    private encryptionKey;
    private rotationTimer?;
    private currentTokens;
    constructor(config: TokenConfig, rotationConfig?: Partial<TokenRotationConfig>);
    /**
     * Derive encryption key from app secret and system entropy
     */
    private deriveEncryptionKey;
    /**
     * Encrypt sensitive data using AES-256-GCM
     */
    private encrypt;
    /**
     * Decrypt sensitive data
     */
    private decrypt;
    /**
     * Generate secure hash for token validation
     */
    private generateTokenHash;
    /**
     * Validate token integrity
     */
    private validateTokenHash;
    /**
     * Store tokens securely with encryption
     */
    storeTokens(tokens: {
        [key: string]: string;
    }): Promise<void>;
    /**
     * Load and decrypt tokens
     */
    private loadTokens;
    /**
     * Get token with automatic refresh
     */
    getToken(tokenType?: 'userAccessToken' | 'tenantAccessToken'): Promise<string | null>;
    /**
     * Refresh token using Lark API
     */
    refreshToken(tokenType: 'userAccessToken' | 'tenantAccessToken'): Promise<void>;
    /**
     * Rotate tokens automatically
     */
    private rotateTokens;
    /**
     * Create backup of current tokens
     */
    private createTokenBackup;
    /**
     * Clean up old backup files
     */
    private cleanupOldBackups;
    /**
     * Start automatic token rotation
     */
    private startTokenRotation;
    /**
     * Stop automatic token rotation
     */
    stopTokenRotation(): void;
    /**
     * Revoke all tokens and clear storage
     */
    revokeAllTokens(): Promise<void>;
    /**
     * Get token usage statistics
     */
    getTokenStats(): {
        totalTokens: number;
        expiredTokens: number;
        validTokens: number;
        lastRotation: Date | null;
    };
    /**
     * Validate token security
     */
    validateTokenSecurity(): {
        isSecure: boolean;
        issues: string[];
        recommendations: string[];
    };
}
export default SecureTokenManager;
