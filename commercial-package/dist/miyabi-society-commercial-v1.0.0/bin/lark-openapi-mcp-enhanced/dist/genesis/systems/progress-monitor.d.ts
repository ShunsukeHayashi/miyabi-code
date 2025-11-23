/**
 * Real-time Progress Monitoring System
 * 構築進捗のリアルタイム表示機能
 */
import { EventEmitter } from 'events';
export interface ProgressStep {
    id: string;
    name: string;
    description: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    progress: number;
    startTime?: Date;
    endTime?: Date;
    duration?: number;
    error?: string;
    details?: any;
    subSteps?: ProgressStep[];
}
export interface ProgressSession {
    id: string;
    projectName: string;
    description: string;
    status: 'initializing' | 'running' | 'completed' | 'failed' | 'cancelled';
    overallProgress: number;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    steps: ProgressStep[];
    metadata: {
        userId?: string;
        sessionType: 'template' | 'custom' | 'migration';
        estimatedDuration?: number;
        priority: 'low' | 'medium' | 'high';
        result?: any;
    };
    errors: string[];
    warnings: string[];
}
export interface ProgressEvent {
    type: 'step_start' | 'step_progress' | 'step_complete' | 'step_error' | 'session_complete' | 'session_error';
    sessionId: string;
    stepId?: string;
    data: any;
    timestamp: Date;
}
export interface ProgressListener {
    onProgressUpdate?: (event: ProgressEvent) => void;
    onSessionComplete?: (session: ProgressSession) => void;
    onError?: (error: string, sessionId: string) => void;
}
/**
 * Real-time Progress Monitor
 * リアルタイム進捗監視システム
 */
export declare class ProgressMonitor extends EventEmitter {
    private sessions;
    private progressListeners;
    private activeSessions;
    constructor();
    /**
     * イベントハンドラーの設定
     */
    private setupEventHandlers;
    /**
     * 新しい進捗セッションの作成
     */
    createSession(config: {
        projectName: string;
        description: string;
        steps: Omit<ProgressStep, 'status' | 'progress'>[];
        metadata?: Partial<ProgressSession['metadata']>;
    }): ProgressSession;
    /**
     * セッションの開始
     */
    startSession(sessionId: string): void;
    /**
     * ステップの開始
     */
    startStep(sessionId: string, stepId: string): void;
    /**
     * ステップの進捗更新
     */
    updateStepProgress(sessionId: string, stepId: string, progress: number, details?: any): void;
    /**
     * ステップの完了
     */
    completeStep(sessionId: string, stepId: string, details?: any): void;
    /**
     * ステップの失敗
     */
    failStep(sessionId: string, stepId: string, error: string, details?: any): void;
    /**
     * ステップのスキップ
     */
    skipStep(sessionId: string, stepId: string, reason?: string): void;
    /**
     * セッションの完了
     */
    completeSession(sessionId: string, result?: any): void;
    /**
     * セッションの失敗
     */
    failSession(sessionId: string, error: string): void;
    /**
     * セッションのキャンセル
     */
    cancelSession(sessionId: string, reason?: string): void;
    /**
     * セッションの取得
     */
    getSession(sessionId: string): ProgressSession | undefined;
    /**
     * アクティブセッションの取得
     */
    getActiveSessions(): ProgressSession[];
    /**
     * 全セッションの取得
     */
    getAllSessions(): ProgressSession[];
    /**
     * セッションの削除
     */
    deleteSession(sessionId: string): void;
    /**
     * リスナーの登録
     */
    addProgressListener(sessionId: string, listener: ProgressListener): void;
    /**
     * リスナーの削除
     */
    removeProgressListener(sessionId: string, listener: ProgressListener): void;
    /**
     * リスナーへの通知
     */
    private notifyListeners;
    /**
     * セッション完了の通知
     */
    private notifySessionComplete;
    /**
     * エラーの通知
     */
    private notifyError;
    /**
     * ステップの検索（再帰的）
     */
    private findStep;
    /**
     * 全体進捗の更新
     */
    private updateOverallProgress;
    /**
     * 全ステップ数のカウント
     */
    private countTotalSteps;
    /**
     * 完了ステップ数のカウント
     */
    private countCompletedSteps;
    /**
     * 統計情報の取得
     */
    getStatistics(): {
        totalSessions: number;
        activeSessions: number;
        completedSessions: number;
        failedSessions: number;
        averageDuration: number;
        successRate: number;
    };
    /**
     * セッションのクリーンアップ（古いセッションの削除）
     */
    cleanupOldSessions(maxAge?: number): void;
}
