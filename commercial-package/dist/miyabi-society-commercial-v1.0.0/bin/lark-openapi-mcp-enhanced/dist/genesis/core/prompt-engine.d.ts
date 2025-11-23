/**
 * Genesis Prompt Engine - 7段階コマンドスタック処理システム
 * 要求仕様からLark Baseの自動設計・構築を行う中核エンジン
 */
export interface CommandStackLevel {
    id: string;
    name: string;
    description: string;
    prompt: string;
    dependencies?: string[];
    outputSchema: any;
}
export interface ExecutionContext {
    requirements: string;
    currentLevel: number;
    results: Record<string, any>;
    metadata: {
        projectId: string;
        timestamp: number;
        version: string;
    };
}
export interface PromptEngineConfig {
    geminiApiKey: string;
    maxRetries: number;
    timeoutMs: number;
    enableLogging: boolean;
    rateLimitDelay?: number;
}
/**
 * 7段階コマンドスタック定義
 */
export declare const COMMAND_STACK: CommandStackLevel[];
/**
 * Genesis Prompt Engine
 * 7段階のコマンドスタックを順次実行し、要求仕様からLark Base設計まで自動化
 */
export declare class GenesisPromptEngine {
    private config;
    private geminiClient;
    constructor(config: PromptEngineConfig);
    /**
     * 7段階コマンドスタックを順次実行
     */
    executeCommandStack(requirements: string): Promise<ExecutionContext>;
    /**
     * 単一コマンドの実行
     */
    private executeCommand;
    /**
     * Gemini API呼び出し
     */
    private callGeminiAPI;
    /**
     * レスポンス検証
     */
    private validateResponse;
    /**
     * ログ出力
     */
    private log;
    /**
     * 特定のコマンドのみ実行
     */
    executeSpecificCommand(commandId: string, context: ExecutionContext): Promise<any>;
    /**
     * 実行状況の取得
     */
    getExecutionStatus(context: ExecutionContext): any;
}
