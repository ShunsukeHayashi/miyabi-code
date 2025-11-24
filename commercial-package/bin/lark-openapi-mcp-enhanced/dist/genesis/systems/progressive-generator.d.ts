/**
 * Progressive Generation System
 * 段階的設計進行とユーザーフィードバック機能
 */
export interface GenerationStep {
    id: string;
    name: string;
    description: string;
    order: number;
    dependencies: string[];
    estimatedTime: number;
    inputs: StepInput[];
    outputs: StepOutput[];
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
    result?: any;
    userFeedback?: UserFeedback;
    validationRules?: ValidationRule[];
}
export interface StepInput {
    name: string;
    type: 'text' | 'json' | 'file' | 'selection' | 'boolean';
    required: boolean;
    description: string;
    options?: string[];
    defaultValue?: any;
    validation?: {
        pattern?: string;
        minLength?: number;
        maxLength?: number;
        min?: number;
        max?: number;
    };
}
export interface StepOutput {
    name: string;
    type: 'text' | 'json' | 'file' | 'diagram' | 'report';
    description: string;
    previewable: boolean;
    editable: boolean;
}
export interface UserFeedback {
    rating: 1 | 2 | 3 | 4 | 5;
    comments: string;
    modifications: Array<{
        field: string;
        oldValue: any;
        newValue: any;
        reason: string;
    }>;
    approved: boolean;
    requestRevision: boolean;
    revisionNotes?: string;
    timestamp: number;
    userId: string;
}
export interface ValidationRule {
    id: string;
    description: string;
    type: 'syntax' | 'semantic' | 'business' | 'performance';
    severity: 'error' | 'warning' | 'info';
    validator: (data: any) => ValidationResult;
}
export interface ValidationResult {
    valid: boolean;
    issues: Array<{
        severity: 'error' | 'warning' | 'info';
        message: string;
        field?: string;
        suggestion?: string;
    }>;
}
export interface ProgressiveSession {
    id: string;
    name: string;
    description: string;
    userId: string;
    requirements: string;
    steps: GenerationStep[];
    currentStepIndex: number;
    overallProgress: number;
    status: 'not_started' | 'in_progress' | 'paused' | 'completed' | 'cancelled';
    createdAt: number;
    updatedAt: number;
    completedAt?: number;
    settings: {
        autoAdvance: boolean;
        requireApproval: boolean;
        enableValidation: boolean;
        saveHistory: boolean;
    };
    history: Array<{
        stepId: string;
        action: 'started' | 'completed' | 'feedback_received' | 'revision_requested';
        timestamp: number;
        data?: any;
    }>;
}
export interface FeedbackRequest {
    sessionId: string;
    stepId: string;
    title: string;
    description: string;
    data: any;
    questions: Array<{
        id: string;
        type: 'rating' | 'text' | 'choice' | 'boolean';
        question: string;
        options?: string[];
        required: boolean;
    }>;
    timeout?: number;
}
export interface IterationResult {
    improved: boolean;
    changes: Array<{
        type: 'addition' | 'modification' | 'removal';
        description: string;
        impact: 'low' | 'medium' | 'high';
    }>;
    newResult: any;
    confidenceScore: number;
}
/**
 * Progressive Generation System
 * ユーザーとの対話を通じて段階的にシステムを生成
 */
export declare class ProgressiveGenerator {
    private static readonly DEFAULT_STEPS;
    /**
     * 新しいプログレッシブセッションを開始
     */
    static startSession(userId: string, name: string, requirements: string, options?: {
        autoAdvance?: boolean;
        requireApproval?: boolean;
        enableValidation?: boolean;
        customSteps?: GenerationStep[];
    }): ProgressiveSession;
    /**
     * セッションの次のステップを実行
     */
    static executeNextStep(session: ProgressiveSession, stepInputs?: Record<string, any>): Promise<{
        success: boolean;
        session: ProgressiveSession;
        stepResult?: any;
        feedbackRequest?: FeedbackRequest;
        errors: string[];
    }>;
    /**
     * ユーザーフィードバックの処理
     */
    static processFeedback(session: ProgressiveSession, stepId: string, feedback: UserFeedback): Promise<{
        success: boolean;
        session: ProgressiveSession;
        needsRevision: boolean;
        revisionResult?: IterationResult;
    }>;
    /**
     * セッションの進捗を更新
     */
    private static updateProgress;
    /**
     * 依存関係チェック
     */
    private static checkDependencies;
    /**
     * ステップ入力の検証
     */
    private static validateStepInputs;
    /**
     * ステップの実行
     */
    private static executeStep;
    /**
     * モックステップ結果の生成
     */
    private static generateMockStepResult;
    /**
     * 検証の実行
     */
    private static runValidations;
    /**
     * フィードバック要求の生成
     */
    private static generateFeedbackRequest;
    /**
     * リビジョンの実行
     */
    private static executeRevision;
    /**
     * 履歴に記録
     */
    private static addHistory;
    /**
     * セッションの一時停止
     */
    static pauseSession(session: ProgressiveSession): ProgressiveSession;
    /**
     * セッションの再開
     */
    static resumeSession(session: ProgressiveSession): ProgressiveSession;
    /**
     * セッションのキャンセル
     */
    static cancelSession(session: ProgressiveSession): ProgressiveSession;
    /**
     * セッション状況の取得
     */
    static getSessionStatus(session: ProgressiveSession): {
        currentStep: GenerationStep | null;
        nextStep: GenerationStep | null;
        completedSteps: number;
        totalSteps: number;
        estimatedTimeRemaining: number;
        canProceed: boolean;
    };
    /**
     * セッションサマリーの生成
     */
    static generateSessionSummary(session: ProgressiveSession): {
        overview: string;
        achievements: string[];
        issues: string[];
        recommendations: string[];
        nextSteps: string[];
    };
}
