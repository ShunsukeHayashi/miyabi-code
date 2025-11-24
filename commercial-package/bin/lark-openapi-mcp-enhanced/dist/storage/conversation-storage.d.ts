/**
 * Persistent Storage System for Agent Conversations
 * SQLite + Redis + File-based storage options
 */
import { ConversationMessage, RunContext } from '../agents/agent';
export interface StorageConfig {
    type: 'sqlite' | 'redis' | 'file' | 'memory';
    connectionString?: string;
    dataDir?: string;
    maxConversations?: number;
    retentionDays?: number;
    encryptionKey?: string;
}
export interface ConversationData {
    conversationId: string;
    userId?: string;
    chatId: string;
    agentName: string;
    messages: ConversationMessage[];
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    expiresAt?: Date;
}
export interface ConversationFilter {
    userId?: string;
    chatId?: string;
    agentName?: string;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
}
export interface StorageStats {
    totalConversations: number;
    totalMessages: number;
    oldestConversation: Date;
    newestConversation: Date;
    diskUsage?: number;
    memoryUsage?: number;
}
export declare abstract class ConversationStorage {
    protected config: StorageConfig;
    protected encryptionKey?: string;
    constructor(config: StorageConfig);
    abstract initialize(): Promise<void>;
    abstract saveConversation(conversation: ConversationData): Promise<void>;
    abstract getConversation(conversationId: string): Promise<ConversationData | null>;
    abstract updateConversation(conversationId: string, updates: Partial<ConversationData>): Promise<void>;
    abstract deleteConversation(conversationId: string): Promise<void>;
    abstract listConversations(filter?: ConversationFilter): Promise<ConversationData[]>;
    abstract getStats(): Promise<StorageStats>;
    abstract cleanup(): Promise<number>;
    abstract close(): Promise<void>;
    protected encrypt(data: string): string;
    protected decrypt(encryptedData: string): string;
    protected serializeConversation(conversation: ConversationData): string;
    protected deserializeConversation(data: string): ConversationData;
}
export declare class SQLiteConversationStorage extends ConversationStorage {
    private db;
    private dbPath;
    constructor(config: StorageConfig);
    initialize(): Promise<void>;
    private createTables;
    saveConversation(conversation: ConversationData): Promise<void>;
    getConversation(conversationId: string): Promise<ConversationData | null>;
    updateConversation(conversationId: string, updates: Partial<ConversationData>): Promise<void>;
    deleteConversation(conversationId: string): Promise<void>;
    listConversations(filter?: ConversationFilter): Promise<ConversationData[]>;
    getStats(): Promise<StorageStats>;
    cleanup(): Promise<number>;
    close(): Promise<void>;
    private getDiskUsage;
}
export declare class FileConversationStorage extends ConversationStorage {
    private dataDir;
    constructor(config: StorageConfig);
    initialize(): Promise<void>;
    private getFilePath;
    saveConversation(conversation: ConversationData): Promise<void>;
    getConversation(conversationId: string): Promise<ConversationData | null>;
    updateConversation(conversationId: string, updates: Partial<ConversationData>): Promise<void>;
    deleteConversation(conversationId: string): Promise<void>;
    listConversations(filter?: ConversationFilter): Promise<ConversationData[]>;
    getStats(): Promise<StorageStats>;
    cleanup(): Promise<number>;
    close(): Promise<void>;
    private matchesFilter;
    private calculateDiskUsage;
}
export declare class StorageFactory {
    static createStorage(config: StorageConfig): Promise<ConversationStorage>;
}
export declare class ConversationManager {
    private storage;
    constructor(storage: ConversationStorage);
    static create(config: StorageConfig): Promise<ConversationManager>;
    saveContext(context: RunContext): Promise<void>;
    loadContext(conversationId: string): Promise<RunContext | null>;
    addMessage(conversationId: string, message: ConversationMessage): Promise<void>;
    getConversationHistory(filter: ConversationFilter): Promise<ConversationData[]>;
    getStats(): Promise<StorageStats>;
    cleanup(): Promise<number>;
    close(): Promise<void>;
}
