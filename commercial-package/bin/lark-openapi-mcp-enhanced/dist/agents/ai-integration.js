"use strict";
/**
 * AI Integration for Multi-Agent System
 * Gemini API integration for enhanced agent intelligence
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalAIService = exports.GeminiAIService = void 0;
exports.initializeAIService = initializeAIService;
exports.getAIService = getAIService;
const types_1 = require("./types");
const prompts_1 = require("./prompts");
class GeminiAIService {
    constructor(config) {
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
        this.defaultModel = 'gemini-1.5-flash';
        this.apiKey = config.apiKey;
    }
    /**
     * Analyze task complexity and recommend agent assignment
     * Based on AIstudio's task analysis patterns
     */
    async analyzeTaskForAgentAssignment(task, availableAgents, context = {}) {
        const prompt = prompts_1.PromptUtils.fillTemplate(prompts_1.AGENT_COORDINATION_PROMPTS.TASK_ASSIGNMENT_ANALYZER, {
            TASK_DESCRIPTION: task,
            AVAILABLE_TOOLS_LIST: this.formatAvailableTools(availableAgents),
            CONTEXT: JSON.stringify(context),
        });
        try {
            const response = await this.generateContent(prompt);
            const structuredData = this.parseStructuredResponse(response);
            return {
                recommendedAgent: (structuredData === null || structuredData === void 0 ? void 0 : structuredData.assignedAgentType) || 'specialist',
                agentType: (structuredData === null || structuredData === void 0 ? void 0 : structuredData.assignedAgentType) || 'specialist',
                tools: (structuredData === null || structuredData === void 0 ? void 0 : structuredData.recommendedTools) || [],
                reasoning: (structuredData === null || structuredData === void 0 ? void 0 : structuredData.reasoning) || 'Default assignment',
                confidence: 0.8,
            };
        }
        catch (error) {
            console.error('AI task analysis failed:', error);
            return {
                recommendedAgent: 'specialist',
                agentType: 'specialist',
                tools: [],
                reasoning: 'Fallback assignment due to AI service error',
                confidence: 0.3,
            };
        }
    }
    /**
     * Generate intelligent workflow coordination plan
     */
    async generateWorkflowPlan(tasks, availableAgents, constraints = {}) {
        var _a, _b, _c, _d;
        const prompt = prompts_1.PromptUtils.fillTemplate(prompts_1.AGENT_COORDINATION_PROMPTS.AGENT_COORDINATOR, {
            WORKFLOW_STATE: JSON.stringify({ tasks, constraints }),
            AVAILABLE_AGENTS: JSON.stringify(availableAgents),
        });
        try {
            const response = await this.generateContent(prompt);
            const coordination = this.parseCoordinationResponse(response);
            return {
                executionOrder: ((_a = coordination === null || coordination === void 0 ? void 0 : coordination.coordinationPlan) === null || _a === void 0 ? void 0 : _a.executionOrder) || [],
                parallelGroups: ((_b = coordination === null || coordination === void 0 ? void 0 : coordination.coordinationPlan) === null || _b === void 0 ? void 0 : _b.parallelGroups) || [],
                criticalPath: ((_c = coordination === null || coordination === void 0 ? void 0 : coordination.coordinationPlan) === null || _c === void 0 ? void 0 : _c.criticalPath) || [],
                riskAssessment: (coordination === null || coordination === void 0 ? void 0 : coordination.riskAssessment) || {},
                recommendations: ((_d = coordination === null || coordination === void 0 ? void 0 : coordination.riskAssessment) === null || _d === void 0 ? void 0 : _d.mitigationStrategies) || [],
            };
        }
        catch (error) {
            console.error('Workflow planning failed:', error);
            return {
                executionOrder: tasks.map((_, i) => `task_${i}`),
                parallelGroups: [],
                criticalPath: [],
                riskAssessment: {},
                recommendations: ['Unable to generate AI-powered recommendations'],
            };
        }
    }
    /**
     * Analyze task execution results and suggest next actions
     */
    async analyzeTaskResults(taskId, result, context = {}) {
        var _a;
        const prompt = prompts_1.PromptUtils.fillTemplate(prompts_1.AGENT_COORDINATION_PROMPTS.TASK_RESULT_ANALYZER, {
            TASK_RESULT: JSON.stringify(result),
            TASK_DETAILS: JSON.stringify(context),
        });
        try {
            const response = await this.generateContent(prompt);
            const analysis = this.parseStructuredResponse(response);
            return {
                status: (analysis === null || analysis === void 0 ? void 0 : analysis.executionStatus) || 'success',
                qualityScore: (analysis === null || analysis === void 0 ? void 0 : analysis.qualityScore) || 0.8,
                nextActions: ((_a = analysis === null || analysis === void 0 ? void 0 : analysis.nextActions) === null || _a === void 0 ? void 0 : _a.map((a) => a.action)) || [],
                improvements: (analysis === null || analysis === void 0 ? void 0 : analysis.recommendations) || [],
            };
        }
        catch (error) {
            console.error('Result analysis failed:', error);
            return {
                status: 'success',
                qualityScore: 0.7,
                nextActions: [],
                improvements: [],
            };
        }
    }
    /**
     * Generate recovery strategy for failed tasks
     */
    async generateRecoveryStrategy(errorDetails, failedTask, workflowContext = {}) {
        var _a, _b;
        const prompt = prompts_1.PromptUtils.fillTemplate(prompts_1.AGENT_COORDINATION_PROMPTS.ERROR_RECOVERY_ANALYZER, {
            ERROR_DETAILS: JSON.stringify(errorDetails),
            FAILED_TASK: JSON.stringify(failedTask),
            WORKFLOW_CONTEXT: JSON.stringify(workflowContext),
        });
        try {
            const response = await this.generateContent(prompt);
            const recovery = this.parseStructuredResponse(response);
            const bestOption = (_a = recovery === null || recovery === void 0 ? void 0 : recovery.recoveryOptions) === null || _a === void 0 ? void 0 : _a[0];
            return {
                strategy: (bestOption === null || bestOption === void 0 ? void 0 : bestOption.strategy) || 'retry',
                steps: [(bestOption === null || bestOption === void 0 ? void 0 : bestOption.description) || 'Retry with same parameters'],
                estimatedTime: (bestOption === null || bestOption === void 0 ? void 0 : bestOption.estimatedTime) || 60,
                successProbability: (bestOption === null || bestOption === void 0 ? void 0 : bestOption.successProbability) || 0.7,
                preventionMeasures: ((_b = recovery === null || recovery === void 0 ? void 0 : recovery.preventionMeasures) === null || _b === void 0 ? void 0 : _b.map((m) => m.measure)) || [],
            };
        }
        catch (error) {
            console.error('Recovery strategy generation failed:', error);
            return {
                strategy: 'retry',
                steps: ['Retry task with original parameters'],
                estimatedTime: 60,
                successProbability: 0.5,
                preventionMeasures: [],
            };
        }
    }
    /**
     * Generate intelligent content based on task context
     */
    async generateSmartContent(contentType, data, options = {}) {
        const { audience = 'general', length = 'brief', language = 'ja' } = options;
        const prompt = `
あなたは専門的な${contentType}作成エージェントです。
以下の条件で内容を生成してください：

**対象者**: ${audience}
**詳細度**: ${length}
**言語**: ${language}

**データ**:
${JSON.stringify(data, null, 2)}

**要求**:
${this.getContentTypeInstructions(contentType)}

**出力形式**: 明確で読みやすい${language === 'ja' ? '日本語' : language === 'en' ? 'English' : '中文'}で回答してください。
`;
        try {
            const response = await this.generateContent(prompt);
            return response.trim();
        }
        catch (error) {
            console.error('Content generation failed:', error);
            return `${contentType}の生成中にエラーが発生しました。`;
        }
    }
    /**
     * Make API call to Gemini
     */
    async generateContent(prompt) {
        var _a, _b, _c, _d, _e;
        const url = `${this.baseUrl}/${this.defaultModel}:generateContent?key=${this.apiKey}`;
        const requestBody = {
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
                temperature: 0.3,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 4096,
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
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });
        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        return ((_e = (_d = (_c = (_b = (_a = data.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.text) || '';
    }
    /**
     * Parse structured response using delimiters
     */
    parseStructuredResponse(response) {
        try {
            // Try to parse structured data with delimiters
            const structuredData = prompts_1.PromptUtils.extractStructuredData(response, types_1.RESPONSE_DELIMITERS.STRUCTURED_START, types_1.RESPONSE_DELIMITERS.STRUCTURED_END);
            if (structuredData) {
                return structuredData;
            }
            // Fallback: try to find JSON in response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return null;
        }
        catch (error) {
            console.error('Failed to parse structured response:', error);
            return null;
        }
    }
    /**
     * Parse coordination response
     */
    parseCoordinationResponse(response) {
        return prompts_1.PromptUtils.extractStructuredData(response, types_1.RESPONSE_DELIMITERS.AGENT_COORDINATION_START, types_1.RESPONSE_DELIMITERS.AGENT_COORDINATION_END);
    }
    /**
     * Format available tools for AI analysis
     */
    formatAvailableTools(agents) {
        return agents
            .map((agent) => {
            var _a;
            const capabilities = ((_a = agent.capabilities) === null || _a === void 0 ? void 0 : _a.map((cap) => cap.name).join(', ')) || '';
            return `- **${agent.name}**: ${capabilities}`;
        })
            .join('\n');
    }
    /**
     * Get content type specific instructions
     */
    getContentTypeInstructions(contentType) {
        switch (contentType) {
            case 'summary':
                return '重要なポイントを簡潔にまとめた要約を作成してください。';
            case 'explanation':
                return '技術的な内容を分かりやすく説明してください。';
            case 'documentation':
                return '構造化された技術文書として整理してください。';
            case 'notification':
                return '重要な情報を効果的に伝える通知文を作成してください。';
            default:
                return '適切な形式で内容を整理してください。';
        }
    }
}
exports.GeminiAIService = GeminiAIService;
// Singleton instance
exports.globalAIService = null;
/**
 * Initialize AI service with API key
 */
function initializeAIService(apiKey) {
    exports.globalAIService = new GeminiAIService({ apiKey });
    return exports.globalAIService;
}
/**
 * Get initialized AI service
 */
function getAIService() {
    if (!exports.globalAIService) {
        throw new Error('AI service not initialized. Call initializeAIService() first.');
    }
    return exports.globalAIService;
}
