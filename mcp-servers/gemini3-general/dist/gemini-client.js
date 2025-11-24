import { GoogleGenerativeAI } from '@google/generative-ai';
/**
 * General-purpose Gemini 3 API Client
 * Supports code generation, analysis, and general AI assistance
 */
export class Gemini3Client {
    genAI;
    config;
    model;
    constructor(config) {
        this.config = {
            model: 'gemini-3-pro-preview',
            thinkingLevel: 'high',
            temperature: 0.7,
            topP: 0.95,
            maxOutputTokens: 8192,
            ...config,
        };
        this.genAI = new GoogleGenerativeAI(this.config.apiKey);
        this.model = this.genAI.getGenerativeModel({
            model: this.config.model,
        });
    }
    /**
     * Generate content with structured output
     */
    async generateStructuredContent(prompt, responseSchema, options = {}) {
        const thinkingLevel = options.thinkingLevel || this.config.thinkingLevel;
        // Build tools array
        const tools = [];
        if (options.tools?.codeExecution) {
            tools.push({ codeExecution: {} });
        }
        if (options.tools?.googleSearch) {
            tools.push({ googleSearch: {} });
        }
        // Build content parts
        const parts = [
            { text: prompt },
            ...(options.contextParts || []),
        ];
        try {
            const result = await this.model.generateContent({
                contents: [{ role: 'user', parts }],
                tools: tools.length > 0 ? tools : undefined,
                generationConfig: {
                    temperature: this.config.temperature,
                    topP: this.config.topP,
                    maxOutputTokens: this.config.maxOutputTokens,
                    responseMimeType: 'application/json',
                    responseSchema: responseSchema,
                },
            });
            const response = await result.response;
            const text = response.text();
            return JSON.parse(text);
        }
        catch (error) {
            console.error('Gemini 3 API Error:', error);
            throw new Error(`Failed to generate structured content: ${error}`);
        }
    }
    /**
     * Generate content with text output
     */
    async generateContent(prompt, options = {}) {
        const thinkingLevel = options.thinkingLevel || this.config.thinkingLevel;
        // Build tools array
        const tools = [];
        if (options.tools?.codeExecution) {
            tools.push({ codeExecution: {} });
        }
        if (options.tools?.googleSearch) {
            tools.push({ googleSearch: {} });
        }
        // Build content parts
        const parts = [
            { text: prompt },
            ...(options.contextParts || []),
        ];
        try {
            const result = await this.model.generateContent({
                contents: [{ role: 'user', parts }],
                tools: tools.length > 0 ? tools : undefined,
                generationConfig: {
                    temperature: this.config.temperature,
                    topP: this.config.topP,
                    maxOutputTokens: this.config.maxOutputTokens,
                },
            });
            const response = await result.response;
            return response.text();
        }
        catch (error) {
            console.error('Gemini 3 API Error:', error);
            throw new Error(`Failed to generate content: ${error}`);
        }
    }
    /**
     * Get model information
     */
    getModelInfo() {
        return `${this.config.model} (thinking: ${this.config.thinkingLevel})`;
    }
}
//# sourceMappingURL=gemini-client.js.map