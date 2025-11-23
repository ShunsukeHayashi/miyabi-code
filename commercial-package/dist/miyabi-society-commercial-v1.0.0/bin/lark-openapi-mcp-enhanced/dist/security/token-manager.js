"use strict";
/**
 * Enhanced Token Manager with Security Features
 *
 * This module provides secure token management with encryption, rotation,
 * and automatic refresh capabilities for the Lark OpenAPI MCP integration.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecureTokenManager = void 0;
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const events_1 = require("events");
class SecureTokenManager extends events_1.EventEmitter {
    constructor(config, rotationConfig) {
        super();
        this.config = config;
        this.rotationConfig = {
            enabled: true,
            rotationInterval: 90, // 90 minutes
            maxTokenAge: 24, // 24 hours
            backupCount: 5,
            ...rotationConfig,
        };
        this.credentialsPath = path_1.default.join(process.env.HOME || process.env.USERPROFILE || '.', '.lark-mcp', 'secure-credentials.json');
        this.currentTokens = new Map();
        // Initialize encryption key
        this.encryptionKey = this.deriveEncryptionKey();
        // Load existing tokens
        this.loadTokens();
        // Start automatic token rotation
        if (this.rotationConfig.enabled) {
            this.startTokenRotation();
        }
    }
    /**
     * Derive encryption key from app secret and system entropy
     */
    deriveEncryptionKey() {
        const salt = crypto_1.default.randomBytes(32);
        const baseKey = this.config.encryptionKey || this.config.appSecret;
        // Use PBKDF2 for key derivation
        return crypto_1.default.pbkdf2Sync(baseKey, salt, 100000, 32, 'sha256');
    }
    /**
     * Encrypt sensitive data using AES-256-GCM
     */
    encrypt(data) {
        const iv = crypto_1.default.randomBytes(16);
        const cipher = crypto_1.default.createCipher('aes-256-gcm', this.encryptionKey);
        cipher.setAAD(Buffer.from(this.config.appId)); // Additional authenticated data
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const tag = cipher.getAuthTag();
        return {
            encrypted,
            iv: iv.toString('hex'),
            tag: tag.toString('hex'),
        };
    }
    /**
     * Decrypt sensitive data
     */
    decrypt(encryptedData) {
        const decipher = crypto_1.default.createDecipher('aes-256-gcm', this.encryptionKey);
        decipher.setAAD(Buffer.from(this.config.appId));
        decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
        let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    /**
     * Generate secure hash for token validation
     */
    generateTokenHash(token) {
        return crypto_1.default
            .createHash('sha256')
            .update(token + this.config.appId)
            .digest('hex');
    }
    /**
     * Validate token integrity
     */
    validateTokenHash(token, hash) {
        return this.generateTokenHash(token) === hash;
    }
    /**
     * Store tokens securely with encryption
     */
    async storeTokens(tokens) {
        const tokensData = JSON.stringify(tokens);
        const encryptedData = this.encrypt(tokensData);
        const secureStorage = {
            encryptedTokens: JSON.stringify(encryptedData),
            tokenHash: this.generateTokenHash(tokensData),
            lastRotation: new Date().toISOString(),
            expiresAt: new Date(Date.now() + this.rotationConfig.maxTokenAge * 60 * 60 * 1000).toISOString(),
            version: '1.0',
        };
        // Ensure directory exists
        const dir = path_1.default.dirname(this.credentialsPath);
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true, mode: 0o700 });
        }
        // Write with secure permissions
        fs_1.default.writeFileSync(this.credentialsPath, JSON.stringify(secureStorage, null, 2), { mode: 0o600 });
        // Update in-memory cache
        for (const [key, value] of Object.entries(tokens)) {
            this.currentTokens.set(key, {
                value,
                expiresAt: new Date(Date.now() + (this.config.tokenExpiry || 7200) * 1000),
            });
        }
        this.emit('tokensStored', { keys: Object.keys(tokens), timestamp: new Date() });
    }
    /**
     * Load and decrypt tokens
     */
    loadTokens() {
        try {
            if (!fs_1.default.existsSync(this.credentialsPath)) {
                return;
            }
            const fileContent = fs_1.default.readFileSync(this.credentialsPath, 'utf8');
            const secureStorage = JSON.parse(fileContent);
            // Check if tokens are expired
            if (new Date() > new Date(secureStorage.expiresAt)) {
                this.emit('tokensExpired', { expiredAt: secureStorage.expiresAt });
                return;
            }
            // Decrypt tokens
            const encryptedData = JSON.parse(secureStorage.encryptedTokens);
            const decryptedData = this.decrypt(encryptedData);
            // Validate integrity
            if (!this.validateTokenHash(decryptedData, secureStorage.tokenHash)) {
                throw new Error('Token integrity validation failed');
            }
            const tokens = JSON.parse(decryptedData);
            // Load into memory
            for (const [key, value] of Object.entries(tokens)) {
                this.currentTokens.set(key, {
                    value: value,
                    expiresAt: new Date(secureStorage.expiresAt),
                });
            }
            this.emit('tokensLoaded', { keys: Object.keys(tokens), timestamp: new Date() });
        }
        catch (error) {
            this.emit('tokenLoadError', { error: error.message, timestamp: new Date() });
        }
    }
    /**
     * Get token with automatic refresh
     */
    async getToken(tokenType = 'userAccessToken') {
        const cachedToken = this.currentTokens.get(tokenType);
        if (cachedToken && new Date() < cachedToken.expiresAt) {
            return cachedToken.value;
        }
        // Token expired or not found, attempt refresh
        await this.refreshToken(tokenType);
        const refreshedToken = this.currentTokens.get(tokenType);
        return (refreshedToken === null || refreshedToken === void 0 ? void 0 : refreshedToken.value) || null;
    }
    /**
     * Refresh token using Lark API
     */
    async refreshToken(tokenType) {
        try {
            if (tokenType === 'tenantAccessToken') {
                // Refresh tenant access token
                const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        app_id: this.config.appId,
                        app_secret: this.config.appSecret,
                    }),
                });
                const data = await response.json();
                if (data.code === 0) {
                    await this.storeTokens({
                        [tokenType]: data.tenant_access_token,
                    });
                    this.emit('tokenRefreshed', { tokenType, timestamp: new Date() });
                }
                else {
                    throw new Error(`Token refresh failed: ${data.msg}`);
                }
            }
            else {
                // User access token refresh requires OAuth flow
                this.emit('userTokenRefreshRequired', { timestamp: new Date() });
            }
        }
        catch (error) {
            this.emit('tokenRefreshError', { tokenType, error: error.message, timestamp: new Date() });
        }
    }
    /**
     * Rotate tokens automatically
     */
    async rotateTokens() {
        try {
            await this.refreshToken('tenantAccessToken');
            // Create backup of current tokens
            await this.createTokenBackup();
            this.emit('tokensRotated', { timestamp: new Date() });
        }
        catch (error) {
            this.emit('tokenRotationError', { error: error.message, timestamp: new Date() });
        }
    }
    /**
     * Create backup of current tokens
     */
    async createTokenBackup() {
        const backupPath = `${this.credentialsPath}.backup.${Date.now()}`;
        if (fs_1.default.existsSync(this.credentialsPath)) {
            fs_1.default.copyFileSync(this.credentialsPath, backupPath);
            // Clean up old backups
            await this.cleanupOldBackups();
        }
    }
    /**
     * Clean up old backup files
     */
    async cleanupOldBackups() {
        const dir = path_1.default.dirname(this.credentialsPath);
        const files = fs_1.default.readdirSync(dir);
        const backupFiles = files
            .filter((file) => file.startsWith(path_1.default.basename(this.credentialsPath) + '.backup.'))
            .map((file) => ({
            name: file,
            path: path_1.default.join(dir, file),
            timestamp: parseInt(file.split('.').pop() || '0'),
        }))
            .sort((a, b) => b.timestamp - a.timestamp);
        // Keep only the specified number of backups
        const filesToDelete = backupFiles.slice(this.rotationConfig.backupCount);
        for (const file of filesToDelete) {
            fs_1.default.unlinkSync(file.path);
        }
    }
    /**
     * Start automatic token rotation
     */
    startTokenRotation() {
        const intervalMs = this.rotationConfig.rotationInterval * 60 * 1000;
        this.rotationTimer = setInterval(() => {
            this.rotateTokens();
        }, intervalMs);
        this.emit('tokenRotationStarted', {
            interval: this.rotationConfig.rotationInterval,
            timestamp: new Date(),
        });
    }
    /**
     * Stop automatic token rotation
     */
    stopTokenRotation() {
        if (this.rotationTimer) {
            clearInterval(this.rotationTimer);
            this.rotationTimer = undefined;
            this.emit('tokenRotationStopped', { timestamp: new Date() });
        }
    }
    /**
     * Revoke all tokens and clear storage
     */
    async revokeAllTokens() {
        try {
            // Clear in-memory tokens
            this.currentTokens.clear();
            // Remove secure storage file
            if (fs_1.default.existsSync(this.credentialsPath)) {
                fs_1.default.unlinkSync(this.credentialsPath);
            }
            // Stop rotation
            this.stopTokenRotation();
            this.emit('tokensRevoked', { timestamp: new Date() });
        }
        catch (error) {
            this.emit('tokenRevocationError', { error: error.message, timestamp: new Date() });
        }
    }
    /**
     * Get token usage statistics
     */
    getTokenStats() {
        const now = new Date();
        let expiredTokens = 0;
        let validTokens = 0;
        for (const [, tokenData] of this.currentTokens) {
            if (now > tokenData.expiresAt) {
                expiredTokens++;
            }
            else {
                validTokens++;
            }
        }
        return {
            totalTokens: this.currentTokens.size,
            expiredTokens,
            validTokens,
            lastRotation: fs_1.default.existsSync(this.credentialsPath) ? fs_1.default.statSync(this.credentialsPath).mtime : null,
        };
    }
    /**
     * Validate token security
     */
    validateTokenSecurity() {
        const issues = [];
        const recommendations = [];
        // Check file permissions
        if (fs_1.default.existsSync(this.credentialsPath)) {
            const stats = fs_1.default.statSync(this.credentialsPath);
            const mode = stats.mode & parseInt('777', 8);
            if (mode !== parseInt('600', 8)) {
                issues.push('Credentials file has overly permissive permissions');
                recommendations.push('Set file permissions to 600 (owner read/write only)');
            }
        }
        // Check encryption key strength
        if (!this.config.encryptionKey) {
            issues.push('No custom encryption key provided');
            recommendations.push('Provide a strong encryption key for enhanced security');
        }
        // Check token rotation settings
        if (!this.rotationConfig.enabled) {
            issues.push('Token rotation is disabled');
            recommendations.push('Enable automatic token rotation for better security');
        }
        return {
            isSecure: issues.length === 0,
            issues,
            recommendations,
        };
    }
}
exports.SecureTokenManager = SecureTokenManager;
exports.default = SecureTokenManager;
