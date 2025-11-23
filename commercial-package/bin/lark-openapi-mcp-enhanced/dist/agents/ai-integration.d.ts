/**
 * AI Integration for Multi-Agent System
 * Gemini API integration for enhanced agent intelligence
 */
export interface AIServiceConfig {
    apiKey: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
}
export interface AIAnalysisResult {
    analysis: string;
    confidence: number;
    recommendations: string[];
    structuredData?: any;
}
export declare class GeminiAIService {
    private apiKey;
    private baseUrl;
    private defaultModel;
    constructor(config: AIServiceConfig);
    /**
     * Analyze task complexity and recommend agent assignment
     * Based on AIstudio's task analysis patterns
     */
    analyzeTaskForAgentAssignment(task: string, availableAgents: any[], context?: any): Promise<{
        recommendedAgent: string;
        agentType: string;
        tools: string[];
        reasoning: string;
        confidence: number;
    }>;
    /**
     * Generate intelligent workflow coordination plan
     */
    generateWorkflowPlan(tasks: any[], availableAgents: any[], constraints?: any): Promise<{
        executionOrder: string[];
        parallelGroups: string[][];
        criticalPath: string[];
        riskAssessment: any;
        recommendations: string[];
    }>;
    /**
     * Analyze task execution results and suggest next actions
     */
    analyzeTaskResults(taskId: string, result: any, context?: any): Promise<{
        status: 'success' | 'partial_success' | 'failure';
        qualityScore: number;
        nextActions: string[];
        improvements: string[];
    }>;
    /**
     * Generate recovery strategy for failed tasks
     */
    generateRecoveryStrategy(errorDetails: any, failedTask: any, workflowContext?: any): Promise<{
        strategy: 'retry' | 'revert' | 'bypass' | 'manual' | 'abort';
        steps: string[];
        estimatedTime: number;
        successProbability: number;
        preventionMeasures: string[];
    }>;
    /**
     * Generate intelligent content based on task context
     */
    generateSmartContent(contentType: 'summary' | 'explanation' | 'documentation' | 'notification', data: any, options?: {
        audience?: 'technical' | 'business' | 'general';
        length?: 'brief' | 'detailed' | 'comprehensive';
        language?: 'en' | 'ja' | 'zh';
    }): Promise<string>;
    /**
     * Make API call to Gemini
     */
    private generateContent;
    /**
     * Parse structured response using delimiters
     */
    private parseStructuredResponse;
    /**
     * Parse coordination response
     */
    private parseCoordinationResponse;
    /**
     * Format available tools for AI analysis
     */
    private formatAvailableTools;
    /**
     * Get content type specific instructions
     */
    private getContentTypeInstructions;
}
export declare let globalAIService: GeminiAIService | null;
/**
 * Initialize AI service with API key
 */
export declare function initializeAIService(apiKey: string): GeminiAIService;
/**
 * Get initialized AI service
 */
export declare function getAIService(): GeminiAIService;
