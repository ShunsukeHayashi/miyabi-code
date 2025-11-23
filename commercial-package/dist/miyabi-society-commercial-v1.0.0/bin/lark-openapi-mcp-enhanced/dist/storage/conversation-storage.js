"use strict";
/**
 * Persistent Storage System for Agent Conversations
 * SQLite + Redis + File-based storage options
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationManager = exports.StorageFactory = exports.FileConversationStorage = exports.SQLiteConversationStorage = exports.ConversationStorage = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
// Abstract base class for storage implementations
class ConversationStorage {
    constructor(config) {
        this.config = config;
        this.encryptionKey = config.encryptionKey;
    }
    // Helper methods
    encrypt(data) {
        if (!this.encryptionKey)
            return data;
        // Generate a random IV for each encryption
        const iv = crypto.randomBytes(16);
        // Ensure the key is exactly 32 bytes for AES-256
        const key = crypto.createHash('sha256').update(this.encryptionKey).digest();
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        // Prepend IV to the encrypted data for use in decryption
        return iv.toString('hex') + ':' + encrypted;
    }
    decrypt(encryptedData) {
        if (!this.encryptionKey)
            return encryptedData;
        // Extract IV from the encrypted data
        const parts = encryptedData.split(':');
        if (parts.length !== 2) {
            throw new Error('Invalid encrypted data format');
        }
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        // Ensure the key is exactly 32 bytes for AES-256
        const key = crypto.createHash('sha256').update(this.encryptionKey).digest();
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    serializeConversation(conversation) {
        const data = JSON.stringify(conversation);
        return this.encrypt(data);
    }
    deserializeConversation(data) {
        const decrypted = this.decrypt(data);
        const conversation = JSON.parse(decrypted);
        // Convert date strings back to Date objects
        conversation.createdAt = new Date(conversation.createdAt);
        conversation.updatedAt = new Date(conversation.updatedAt);
        if (conversation.expiresAt) {
            conversation.expiresAt = new Date(conversation.expiresAt);
        }
        // Convert message timestamps
        conversation.messages.forEach((msg) => {
            msg.timestamp = new Date(msg.timestamp);
        });
        return conversation;
    }
}
exports.ConversationStorage = ConversationStorage;
// SQLite Implementation
class SQLiteConversationStorage extends ConversationStorage {
    constructor(config) {
        super(config);
        this.dbPath = config.connectionString || path.join(config.dataDir || './data', 'conversations.db');
    }
    async initialize() {
        // Ensure data directory exists
        const dataDir = path.dirname(this.dbPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        // Import sqlite3 dynamically
        let sqlite3;
        try {
            sqlite3 = require('sqlite3').verbose();
        }
        catch (error) {
            throw new Error('sqlite3 package not installed. Run: npm install sqlite3');
        }
        // Initialize database
        this.db = new sqlite3.Database(this.dbPath);
        // Create tables
        await this.createTables();
        console.log(`SQLite conversation storage initialized: ${this.dbPath}`);
    }
    async createTables() {
        const createConversationsTable = `
      CREATE TABLE IF NOT EXISTS conversations (
        conversation_id TEXT PRIMARY KEY,
        user_id TEXT,
        chat_id TEXT NOT NULL,
        agent_name TEXT NOT NULL,
        messages_data TEXT NOT NULL,
        metadata_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        message_count INTEGER DEFAULT 0,
        INDEX(user_id),
        INDEX(chat_id),
        INDEX(agent_name),
        INDEX(created_at),
        INDEX(expires_at)
      )
    `;
        return new Promise((resolve, reject) => {
            this.db.run(createConversationsTable, (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
    async saveConversation(conversation) {
        const sql = `
      INSERT OR REPLACE INTO conversations 
      (conversation_id, user_id, chat_id, agent_name, messages_data, metadata_data, 
       created_at, updated_at, expires_at, message_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
        const messagesData = this.serializeConversation(conversation);
        const metadataData = JSON.stringify(conversation.metadata);
        return new Promise((resolve, reject) => {
            var _a;
            this.db.run(sql, [
                conversation.conversationId,
                conversation.userId,
                conversation.chatId,
                conversation.agentName,
                messagesData,
                metadataData,
                conversation.createdAt.toISOString(),
                conversation.updatedAt.toISOString(),
                (_a = conversation.expiresAt) === null || _a === void 0 ? void 0 : _a.toISOString(),
                conversation.messages.length,
            ], (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
    async getConversation(conversationId) {
        const sql = 'SELECT * FROM conversations WHERE conversation_id = ?';
        return new Promise((resolve, reject) => {
            this.db.get(sql, [conversationId], (err, row) => {
                if (err) {
                    reject(err);
                }
                else if (!row) {
                    resolve(null);
                }
                else {
                    try {
                        const conversation = this.deserializeConversation(row.messages_data);
                        resolve(conversation);
                    }
                    catch (error) {
                        reject(new Error(`Failed to deserialize conversation: ${error}`));
                    }
                }
            });
        });
    }
    async updateConversation(conversationId, updates) {
        const existingConversation = await this.getConversation(conversationId);
        if (!existingConversation) {
            throw new Error(`Conversation ${conversationId} not found`);
        }
        const updatedConversation = { ...existingConversation, ...updates };
        updatedConversation.updatedAt = new Date();
        await this.saveConversation(updatedConversation);
    }
    async deleteConversation(conversationId) {
        const sql = 'DELETE FROM conversations WHERE conversation_id = ?';
        return new Promise((resolve, reject) => {
            this.db.run(sql, [conversationId], (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
    async listConversations(filter = {}) {
        let sql = 'SELECT * FROM conversations WHERE 1=1';
        const params = [];
        if (filter.userId) {
            sql += ' AND user_id = ?';
            params.push(filter.userId);
        }
        if (filter.chatId) {
            sql += ' AND chat_id = ?';
            params.push(filter.chatId);
        }
        if (filter.agentName) {
            sql += ' AND agent_name = ?';
            params.push(filter.agentName);
        }
        if (filter.fromDate) {
            sql += ' AND created_at >= ?';
            params.push(filter.fromDate.toISOString());
        }
        if (filter.toDate) {
            sql += ' AND created_at <= ?';
            params.push(filter.toDate.toISOString());
        }
        sql += ' ORDER BY updated_at DESC';
        if (filter.limit) {
            sql += ' LIMIT ?';
            params.push(filter.limit);
        }
        if (filter.offset) {
            sql += ' OFFSET ?';
            params.push(filter.offset);
        }
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                }
                else {
                    try {
                        const conversations = rows.map((row) => this.deserializeConversation(row.messages_data));
                        resolve(conversations);
                    }
                    catch (error) {
                        reject(new Error(`Failed to deserialize conversations: ${error}`));
                    }
                }
            });
        });
    }
    async getStats() {
        const sql = `
      SELECT 
        COUNT(*) as total_conversations,
        SUM(message_count) as total_messages,
        MIN(created_at) as oldest_conversation,
        MAX(created_at) as newest_conversation
      FROM conversations
    `;
        return new Promise((resolve, reject) => {
            this.db.get(sql, [], (err, row) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve({
                        totalConversations: row.total_conversations || 0,
                        totalMessages: row.total_messages || 0,
                        oldestConversation: row.oldest_conversation ? new Date(row.oldest_conversation) : new Date(),
                        newestConversation: row.newest_conversation ? new Date(row.newest_conversation) : new Date(),
                        diskUsage: this.getDiskUsage(),
                    });
                }
            });
        });
    }
    async cleanup() {
        const retentionDays = this.config.retentionDays || 30;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
        const sql = 'DELETE FROM conversations WHERE created_at < ? OR (expires_at IS NOT NULL AND expires_at < ?)';
        const now = new Date().toISOString();
        return new Promise((resolve, reject) => {
            this.db.run(sql, [cutoffDate.toISOString(), now], function (err) {
                if (err)
                    reject(err);
                else
                    resolve(this.changes);
            });
        });
    }
    async close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
    getDiskUsage() {
        try {
            const stats = fs.statSync(this.dbPath);
            return stats.size;
        }
        catch (error) {
            return 0;
        }
    }
}
exports.SQLiteConversationStorage = SQLiteConversationStorage;
// File-based Implementation (fallback)
class FileConversationStorage extends ConversationStorage {
    constructor(config) {
        super(config);
        this.dataDir = config.dataDir || './data/conversations';
    }
    async initialize() {
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
        console.log(`File-based conversation storage initialized: ${this.dataDir}`);
    }
    getFilePath(conversationId) {
        return path.join(this.dataDir, `${conversationId}.json`);
    }
    async saveConversation(conversation) {
        const filePath = this.getFilePath(conversation.conversationId);
        const data = this.serializeConversation(conversation);
        await fs.promises.writeFile(filePath, data, 'utf8');
    }
    async getConversation(conversationId) {
        const filePath = this.getFilePath(conversationId);
        try {
            const data = await fs.promises.readFile(filePath, 'utf8');
            return this.deserializeConversation(data);
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                return null;
            }
            throw error;
        }
    }
    async updateConversation(conversationId, updates) {
        const existingConversation = await this.getConversation(conversationId);
        if (!existingConversation) {
            throw new Error(`Conversation ${conversationId} not found`);
        }
        const updatedConversation = { ...existingConversation, ...updates };
        updatedConversation.updatedAt = new Date();
        await this.saveConversation(updatedConversation);
    }
    async deleteConversation(conversationId) {
        const filePath = this.getFilePath(conversationId);
        try {
            await fs.promises.unlink(filePath);
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    }
    async listConversations(filter = {}) {
        const files = await fs.promises.readdir(this.dataDir);
        const conversations = [];
        for (const file of files) {
            if (!file.endsWith('.json'))
                continue;
            try {
                const conversationId = path.basename(file, '.json');
                const conversation = await this.getConversation(conversationId);
                if (conversation && this.matchesFilter(conversation, filter)) {
                    conversations.push(conversation);
                }
            }
            catch (error) {
                console.warn(`Failed to load conversation from ${file}:`, error);
            }
        }
        // Sort by updated date
        conversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        // Apply limit and offset
        const start = filter.offset || 0;
        const end = filter.limit ? start + filter.limit : undefined;
        return conversations.slice(start, end);
    }
    async getStats() {
        const conversations = await this.listConversations();
        const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0);
        const dates = conversations.map((conv) => conv.createdAt);
        const oldestConversation = dates.length > 0 ? new Date(Math.min(...dates.map((d) => d.getTime()))) : new Date();
        const newestConversation = dates.length > 0 ? new Date(Math.max(...dates.map((d) => d.getTime()))) : new Date();
        return {
            totalConversations: conversations.length,
            totalMessages,
            oldestConversation,
            newestConversation,
            diskUsage: await this.calculateDiskUsage(),
        };
    }
    async cleanup() {
        const retentionDays = this.config.retentionDays || 30;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
        const conversations = await this.listConversations();
        let deletedCount = 0;
        for (const conversation of conversations) {
            const shouldDelete = conversation.createdAt < cutoffDate || (conversation.expiresAt && conversation.expiresAt < new Date());
            if (shouldDelete) {
                await this.deleteConversation(conversation.conversationId);
                deletedCount++;
            }
        }
        return deletedCount;
    }
    async close() {
        // No resources to close for file-based storage
    }
    matchesFilter(conversation, filter) {
        if (filter.userId && conversation.userId !== filter.userId)
            return false;
        if (filter.chatId && conversation.chatId !== filter.chatId)
            return false;
        if (filter.agentName && conversation.agentName !== filter.agentName)
            return false;
        if (filter.fromDate && conversation.createdAt < filter.fromDate)
            return false;
        if (filter.toDate && conversation.createdAt > filter.toDate)
            return false;
        return true;
    }
    async calculateDiskUsage() {
        try {
            const files = await fs.promises.readdir(this.dataDir);
            let totalSize = 0;
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(this.dataDir, file);
                    const stats = await fs.promises.stat(filePath);
                    totalSize += stats.size;
                }
            }
            return totalSize;
        }
        catch (error) {
            return 0;
        }
    }
}
exports.FileConversationStorage = FileConversationStorage;
// Storage Factory
class StorageFactory {
    static async createStorage(config) {
        let storage;
        switch (config.type) {
            case 'sqlite':
                storage = new SQLiteConversationStorage(config);
                break;
            case 'file':
                storage = new FileConversationStorage(config);
                break;
            case 'memory':
                // Fallback to file storage for memory type
                storage = new FileConversationStorage({ ...config, type: 'file' });
                break;
            default:
                throw new Error(`Unsupported storage type: ${config.type}`);
        }
        await storage.initialize();
        return storage;
    }
}
exports.StorageFactory = StorageFactory;
// Conversation Manager - High-level interface
class ConversationManager {
    constructor(storage) {
        this.storage = storage;
    }
    static async create(config) {
        const storage = await StorageFactory.createStorage(config);
        return new ConversationManager(storage);
    }
    async saveContext(context) {
        const conversation = {
            conversationId: context.conversationId,
            userId: context.userId,
            chatId: context.chatId,
            agentName: context.agent.name,
            messages: context.history,
            metadata: context.metadata,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        await this.storage.saveConversation(conversation);
    }
    async loadContext(conversationId) {
        const conversation = await this.storage.getConversation(conversationId);
        if (!conversation)
            return null;
        // Note: Agent instance needs to be provided separately
        return {
            agent: null, // Will be set by the caller
            conversationId: conversation.conversationId,
            userId: conversation.userId,
            chatId: conversation.chatId,
            history: conversation.messages,
            metadata: conversation.metadata,
        };
    }
    async addMessage(conversationId, message) {
        const conversation = await this.storage.getConversation(conversationId);
        if (!conversation) {
            throw new Error(`Conversation ${conversationId} not found`);
        }
        conversation.messages.push(message);
        conversation.updatedAt = new Date();
        await this.storage.saveConversation(conversation);
    }
    async getConversationHistory(filter) {
        return this.storage.listConversations(filter);
    }
    async getStats() {
        return this.storage.getStats();
    }
    async cleanup() {
        return this.storage.cleanup();
    }
    async close() {
        await this.storage.close();
    }
}
exports.ConversationManager = ConversationManager;
