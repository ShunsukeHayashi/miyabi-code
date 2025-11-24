"use strict";
/**
 * Gemini API Client
 * Google Gemini APIとの連携クライアント
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiClient = void 0;
const axios_1 = __importDefault(require("axios"));
/**
 * Gemini APIクライアント
 */
class GeminiClient {
    constructor(config) {
        this.config = {
            model: 'gemini-1.5-flash',
            baseURL: 'https://generativelanguage.googleapis.com',
            maxRetries: 5, // Increased retries for rate limiting
            timeoutMs: 60000, // Increased timeout for rate limited requests
            ...config,
        };
        this.httpClient = axios_1.default.create({
            baseURL: this.config.baseURL,
            timeout: this.config.timeoutMs,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
    /**
     * テキスト生成リクエスト
     */
    async generateContent(prompt, options = {}) {
        var _a, _b, _c, _d, _e, _f, _g;
        const request = {
            contents: [
                {
                    parts: [
                        {
                            text: prompt,
                        },
                    ],
                },
            ],
            generationConfig: {
                temperature: options.temperature || 0.1,
                maxOutputTokens: options.maxOutputTokens || 8192,
                responseMimeType: options.responseFormat === 'json' ? 'application/json' : 'text/plain',
            },
            safetySettings: [
                {
                    category: 'HARM_CATEGORY_HARASSMENT',
                    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
                },
                {
                    category: 'HARM_CATEGORY_HATE_SPEECH',
                    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
                },
                {
                    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
                },
                {
                    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
                },
            ],
        };
        const url = `/v1beta/models/${this.config.model}:generateContent?key=${this.config.apiKey}`;
        let lastError = null;
        for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
            try {
                const response = await this.httpClient.post(url, request);
                if (!response.data.candidates || response.data.candidates.length === 0) {
                    throw new Error('No candidates returned from Gemini API');
                }
                const candidate = response.data.candidates[0];
                if (candidate.finishReason !== 'STOP') {
                    throw new Error(`Generation failed with reason: ${candidate.finishReason}`);
                }
                const content = (_a = candidate.content.parts[0]) === null || _a === void 0 ? void 0 : _a.text;
                if (!content) {
                    throw new Error('No text content in response');
                }
                return content;
            }
            catch (error) {
                lastError = error;
                // Handle authentication errors - don't retry
                if (((_b = error.response) === null || _b === void 0 ? void 0 : _b.status) === 401) {
                    throw new Error(`Authentication failed: ${((_e = (_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.error) === null || _e === void 0 ? void 0 : _e.message) || 'Invalid API key'}`);
                }
                // Handle API logic errors - don't retry
                if (error.message &&
                    (error.message.includes('No candidates returned') ||
                        error.message.includes('Generation failed with reason') ||
                        error.message.includes('No text content in response'))) {
                    throw error;
                }
                // Handle rate limit errors with longer backoff
                if (((_f = error.response) === null || _f === void 0 ? void 0 : _f.status) === 429 || ((_g = error.message) === null || _g === void 0 ? void 0 : _g.includes('rate limit'))) {
                    if (attempt < this.config.maxRetries - 1) {
                        const delay = Math.pow(2, attempt + 2) * 2000; // Longer exponential backoff for rate limits
                        console.log(`Rate limit hit, retrying in ${delay}ms...`);
                        await new Promise((resolve) => setTimeout(resolve, delay));
                    }
                    else {
                        throw new Error('Gemini API rate limit exceeded');
                    }
                }
                else if (attempt < this.config.maxRetries - 1) {
                    const delay = Math.pow(2, attempt + 1) * 1000; // Standard exponential backoff
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
            }
        }
        throw new Error(`Failed after ${this.config.maxRetries} attempts: ${lastError === null || lastError === void 0 ? void 0 : lastError.message}`);
    }
    /**
     * 構造化データ生成（JSONレスポンス）
     */
    async generateStructuredContent(prompt, schema, options = {}) {
        // スキーマ情報をプロンプトに追加
        const enhancedPrompt = `
${prompt}

重要：レスポンスは必ず有効なJSONフォーマットで返してください。以下のスキーマに従ってください：

スキーマ：
\`\`\`json
${JSON.stringify(schema, null, 2)}
\`\`\`

JSONレスポンス：
`;
        const content = await this.generateContent(enhancedPrompt, {
            ...options,
            responseFormat: 'json',
        });
        try {
            // JSONパース
            const parsed = JSON.parse(content);
            // 基本的なスキーマ検証
            this.validateSchema(parsed, schema);
            return parsed;
        }
        catch (error) {
            throw new Error(`Failed to parse JSON response: ${error}`);
        }
    }
    /**
     * バッチ処理用のマルチプロンプト生成
     */
    async generateBatch(prompts) {
        const results = await Promise.allSettled(prompts.map(async ({ id, prompt, options }) => {
            try {
                const result = await this.generateContent(prompt, options);
                return { id, result };
            }
            catch (error) {
                return { id, result: '', error: error.message };
            }
        }));
        return results.map((result, index) => {
            var _a;
            if (result.status === 'fulfilled') {
                return result.value;
            }
            else {
                return {
                    id: prompts[index].id,
                    result: '',
                    error: ((_a = result.reason) === null || _a === void 0 ? void 0 : _a.message) || 'Unknown error',
                };
            }
        });
    }
    /**
     * 基本的なスキーマ検証
     */
    validateSchema(data, schema) {
        // 必須フィールドの検証
        if (schema.required && Array.isArray(schema.required)) {
            for (const field of schema.required) {
                if (!(field in data)) {
                    throw new Error(`Required field '${field}' is missing`);
                }
            }
        }
        // プロパティの型検証（基本的なもの）
        if (schema.properties) {
            for (const [key, propSchema] of Object.entries(schema.properties)) {
                if (key in data) {
                    const value = data[key];
                    const expectedType = propSchema.type;
                    if (expectedType && !this.isValidType(value, expectedType)) {
                        throw new Error(`Field '${key}' has invalid type. Expected: ${expectedType}`);
                    }
                }
            }
        }
    }
    /**
     * 型検証ヘルパー
     */
    isValidType(value, expectedType) {
        switch (expectedType) {
            case 'string':
                return typeof value === 'string';
            case 'number':
                return typeof value === 'number';
            case 'boolean':
                return typeof value === 'boolean';
            case 'array':
                return Array.isArray(value);
            case 'object':
                return typeof value === 'object' && value !== null && !Array.isArray(value);
            default:
                return true;
        }
    }
    /**
     * API使用量統計の取得
     */
    getUsageStats() {
        // 実装予定：使用量統計の追跡
        return {
            totalRequests: 0,
            totalTokens: 0,
            averageResponseTime: 0,
        };
    }
    /**
     * ヘルスチェック
     */
    async healthCheck() {
        try {
            await this.generateContent('Hello', { maxOutputTokens: 10 });
            return true;
        }
        catch (_a) {
            return false;
        }
    }
}
exports.GeminiClient = GeminiClient;
