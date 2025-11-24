/**
 * LLM Agent System for Lark MCP Integration
 * OpenAI Agents パターンを参考にしたAgent実装
 */
export interface AgentConfig {
    name: string;
    instructions: string;
    tools?: AgentTool[];
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    language?: 'en' | 'ja' | 'zh';
}
export interface AgentTool {
    name: string;
    description: string;
    execute: (params: any) => Promise<any>;
    schema?: any;
}
export interface RunContext {
    agent: Agent;
    conversationId: string;
    userId?: string;
    chatId: string;
    history: ConversationMessage[];
    metadata: Record<string, any>;
}
export interface ConversationMessage {
    id: string;
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    timestamp: Date;
    toolCalls?: ToolCall[];
    metadata?: Record<string, any>;
}
export interface ToolCall {
    id: string;
    name: string;
    arguments: any;
    result?: any;
    error?: string;
}
export interface AgentResult {
    success: boolean;
    response: string;
    toolCalls?: ToolCall[];
    context: RunContext;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    error?: string;
}
/**
 * Core Agent Class
 */
export declare class Agent {
    readonly name: string;
    readonly instructions: string;
    readonly tools: Map<string, AgentTool>;
    readonly config: AgentConfig;
    private conversations;
    constructor(config: AgentConfig);
    /**
     * Process user message and generate response
     */
    processMessage(userMessage: string, context: Partial<RunContext>): Promise<AgentResult>;
    /**
     * Analyze user message to determine response strategy
     */
    private analyzeMessage;
    /**
     * Generate response based on strategy
     */
    private generateResponse;
    /**
     * Handle command execution
     */
    private handleCommand;
    /**
     * Handle task execution
     */
    private handleTask;
    /**
     * Handle question answering
     */
    private handleQuestion;
    /**
     * Handle general conversation
     */
    private handleConversation;
    private generateConversationId;
    private generateMessageId;
    private generateToolCallId;
    private extractCommand;
    private extractIntent;
    private getRequiredTools;
    private extractToolArguments;
    private formatCommandResponse;
    private executeSearchTask;
    private executeCreateTask;
    private executeShowTask;
    private executeMessageTask;
    private executeUserTask;
    private executeDocumentTask;
    private getKnowledgeResponse;
    private generateHelpfulResponse;
}
/**
 * Agent Runner - executes agents with context management
 */
export declare class AgentRunner {
    static run(agent: Agent, userMessage: string, context?: Partial<RunContext>): Promise<AgentResult>;
    static runWithLarkClient(agent: Agent, userMessage: string, chatId: string, larkClient: any, userId?: string): Promise<AgentResult>;
}
