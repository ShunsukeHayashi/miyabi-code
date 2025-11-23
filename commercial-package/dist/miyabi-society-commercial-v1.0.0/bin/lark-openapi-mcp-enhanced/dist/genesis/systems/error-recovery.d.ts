/**
 * Error Recovery & Rollback System
 * 失敗時の復旧とロールバック機能
 */
export interface Checkpoint {
    id: string;
    name: string;
    description: string;
    timestamp: number;
    sessionId: string;
    stepId?: string;
    state: {
        session: any;
        generatedArtifacts: any[];
        larkResources: LarkResource[];
        systemState: any;
    };
    metadata: {
        version: string;
        checksumState: string;
        size: number;
        dependencies: string[];
    };
}
export interface LarkResource {
    type: 'base' | 'table' | 'field' | 'view' | 'automation' | 'permission';
    id: string;
    parentId?: string;
    name: string;
    configuration: any;
    created: boolean;
    createdAt?: number;
}
export interface RecoveryPlan {
    id: string;
    errorId: string;
    strategy: 'retry' | 'rollback' | 'repair' | 'skip' | 'manual';
    description: string;
    actions: RecoveryAction[];
    estimatedTime: number;
    riskLevel: 'low' | 'medium' | 'high';
    affectedResources: string[];
    prerequisites: string[];
}
export interface RecoveryAction {
    id: string;
    type: 'delete_resource' | 'restore_state' | 'retry_operation' | 'repair_data' | 'notify_user' | 'create_fallback';
    description: string;
    parameters: any;
    order: number;
    critical: boolean;
    rollbackable: boolean;
}
export interface ErrorContext {
    id: string;
    sessionId: string;
    stepId?: string;
    errorType: 'api_error' | 'validation_error' | 'timeout' | 'permission_error' | 'rate_limit' | 'network_error' | 'system_error';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    stackTrace?: string;
    timestamp: number;
    context: {
        operation: string;
        parameters: any;
        environment: any;
        userContext: any;
    };
    impact: {
        affectedResources: string[];
        dataLoss: boolean;
        serviceInterruption: boolean;
        userImpact: 'none' | 'minimal' | 'moderate' | 'severe';
    };
    recovery: {
        automated: boolean;
        attempted: boolean;
        successful?: boolean;
        planId?: string;
        retryCount: number;
    };
}
export interface RollbackResult {
    success: boolean;
    checkpointId: string;
    restoredState: any;
    deletedResources: LarkResource[];
    errors: string[];
    warnings: string[];
    timeline: Array<{
        timestamp: number;
        action: string;
        result: 'success' | 'failed' | 'skipped';
        details?: string;
    }>;
}
/**
 * Error Recovery & Rollback System
 * 自動復旧とロールバック機能を提供
 */
export declare class ErrorRecoverySystem {
    private static checkpoints;
    private static errorLog;
    private static recoveryPlans;
    /**
     * チェックポイントの作成
     */
    static createCheckpoint(sessionId: string, name: string, description: string, state: any, stepId?: string): Promise<{
        success: boolean;
        checkpointId?: string;
        error?: string;
    }>;
    /**
     * エラーの記録と分析
     */
    static recordError(sessionId: string, error: Error, context: {
        operation: string;
        parameters: any;
        stepId?: string;
    }): ErrorContext;
    /**
     * 自動復旧の実行
     */
    static executeAutoRecovery(errorContext: ErrorContext): Promise<{
        success: boolean;
        recoveryPlan?: RecoveryPlan;
        result?: any;
        errors: string[];
    }>;
    /**
     * ロールバックの実行
     */
    static executeRollback(sessionId: string, checkpointId: string, options?: {
        cleanupResources?: boolean;
        preserveUserData?: boolean;
        notifyUsers?: boolean;
    }): Promise<RollbackResult>;
    /**
     * エラーの分類
     */
    private static classifyError;
    /**
     * 重要度の評価
     */
    private static assessSeverity;
    /**
     * 影響度の評価
     */
    private static assessImpact;
    /**
     * 復旧計画の生成
     */
    private static generateRecoveryPlan;
    /**
     * 復旧計画の実行
     */
    private static executeRecoveryPlan;
    /**
     * 復旧アクションの実行
     */
    private static executeRecoveryAction;
    /**
     * システム状態の収集
     */
    private static collectSystemState;
    /**
     * Larkリソースの収集
     */
    private static collectLarkResources;
    /**
     * チェックサムの計算
     */
    private static calculateChecksum;
    /**
     * オブジェクトの深いクローン
     */
    private static deepClone;
    /**
     * 依存関係の抽出
     */
    private static extractDependencies;
    /**
     * 古いチェックポイントのクリーンアップ
     */
    private static cleanupOldCheckpoints;
    /**
     * その他のヘルパーメソッド
     */
    private static getEnvironmentInfo;
    private static getUserContext;
    private static extractAffectedResources;
    private static assessUserImpact;
    private static findLastStableCheckpoint;
    private static retryOperation;
    private static restoreFromCheckpoint;
    private static repairData;
    private static notifyUser;
    private static deleteResource;
    private static createFallback;
    private static collectGeneratedArtifacts;
    private static collectCurrentState;
    private static cleanupLarkResources;
    private static restoreSystemState;
    private static verifyRollbackIntegrity;
    private static notifyRollbackCompletion;
    private static addTimelineEntry;
}
