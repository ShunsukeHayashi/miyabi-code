/**
 * Web Dashboard Interface
 * ブラウザベースの管理画面開発
 */
export interface DashboardConfig {
    port: number;
    host: string;
    enableAuth: boolean;
    staticPath?: string;
    apiPrefix: string;
    corsOrigins: string[];
}
export interface SessionStatus {
    id: string;
    name: string;
    status: 'active' | 'paused' | 'completed' | 'failed';
    progress: number;
    currentStep: string;
    startTime: number;
    lastActivity: number;
    userId: string;
    errors: string[];
}
export interface DashboardStats {
    totalSessions: number;
    activeSessions: number;
    completedSessions: number;
    failedSessions: number;
    averageCompletionTime: number;
    topErrors: Array<{
        error: string;
        count: number;
    }>;
    resourceUtilization: {
        cpu: number;
        memory: number;
        storage: number;
    };
}
/**
 * Genesis Dashboard Server
 * リアルタイム監視とセッション管理のWebインターフェース
 */
export declare class DashboardServer {
    private app;
    private server;
    private io;
    private config;
    private sessions;
    private clients;
    constructor(config: DashboardConfig);
    /**
     * ミドルウェアの設定
     */
    private setupMiddleware;
    /**
     * APIルートの設定
     */
    private setupRoutes;
    /**
     * WebSocketの設定
     */
    private setupWebSocket;
    /**
     * API ハンドラー
     */
    private handleGetStats;
    private handleGetSessions;
    private handleGetSession;
    private handleCreateSession;
    private handleUpdateSession;
    private handleDeleteSession;
    private handleStartSession;
    private handlePauseSession;
    private handleResumeSession;
    private handleCancelSession;
    private handleExecuteStep;
    private handleSubmitFeedback;
    private handleGetErrors;
    private handleRollback;
    private handleRecovery;
    private handleGetTemplates;
    private handleCreateTemplate;
    private handleHealthCheck;
    private handleGetVersion;
    /**
     * ユーティリティメソッド
     */
    private calculateStats;
    private sendStatsUpdate;
    private broadcastStatsUpdate;
    /**
     * セッション進捗の更新
     */
    updateSessionProgress(sessionId: string, progress: number, currentStep: string): void;
    /**
     * セッションエラーの追加
     */
    addSessionError(sessionId: string, error: string): void;
    /**
     * サーバーの開始
     */
    start(): Promise<void>;
    /**
     * サーバーの停止
     */
    stop(): Promise<void>;
    /**
     * 接続中のクライアント数取得
     */
    getConnectedClients(): number;
    /**
     * セッション数取得
     */
    getSessionCount(): number;
}
