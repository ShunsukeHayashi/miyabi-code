/**
 * Gemini API Client
 * Google Gemini APIとの連携クライアント
 */
export interface GeminiConfig {
    apiKey: string;
    model?: string;
    baseURL?: string;
    maxRetries?: number;
    timeoutMs?: number;
}
export interface GeminiRequest {
    contents: Array<{
        parts: Array<{
            text: string;
        }>;
    }>;
    generationConfig?: {
        temperature?: number;
        topK?: number;
        topP?: number;
        maxOutputTokens?: number;
        responseMimeType?: string;
    };
    safetySettings?: Array<{
        category: string;
        threshold: string;
    }>;
}
export interface GeminiResponse {
    candidates: Array<{
        content: {
            parts: Array<{
                text: string;
            }>;
        };
        finishReason: string;
        safetyRatings: Array<{
            category: string;
            probability: string;
        }>;
    }>;
    usageMetadata: {
        promptTokenCount: number;
        candidatesTokenCount: number;
        totalTokenCount: number;
    };
}
/**
 * Gemini APIクライアント
 */
export declare class GeminiClient {
    private config;
    private httpClient;
    constructor(config: GeminiConfig);
    /**
     * テキスト生成リクエスト
     */
    generateContent(prompt: string, options?: {
        temperature?: number;
        maxOutputTokens?: number;
        responseFormat?: 'text' | 'json';
    }): Promise<string>;
    /**
     * 構造化データ生成（JSONレスポンス）
     */
    generateStructuredContent(prompt: string, schema: any, options?: {
        temperature?: number;
        maxOutputTokens?: number;
    }): Promise<any>;
    /**
     * バッチ処理用のマルチプロンプト生成
     */
    generateBatch(prompts: Array<{
        id: string;
        prompt: string;
        options?: any;
    }>): Promise<Array<{
        id: string;
        result: string;
        error?: string;
    }>>;
    /**
     * 基本的なスキーマ検証
     */
    private validateSchema;
    /**
     * 型検証ヘルパー
     */
    private isValidType;
    /**
     * API使用量統計の取得
     */
    getUsageStats(): {
        totalRequests: number;
        totalTokens: number;
        averageResponseTime: number;
    };
    /**
     * ヘルスチェック
     */
    healthCheck(): Promise<boolean>;
}
