/**
 * Structured Communication Prompts with Delimiter-Based Parsing
 * Based on AIstudio's agenticOrchestrationPrompts.ts patterns
 */
export declare const AGENT_COORDINATION_PROMPTS: {
    /**
     * Task Analysis and Agent Assignment System Prompt
     * Based on AIstudio's AGENT_ASSIGNMENT_SYSTEM_PROMPT
     */
    TASK_ASSIGNMENT_ANALYZER: string;
    /**
     * Agent Coordination System Prompt
     */
    AGENT_COORDINATOR: string;
    /**
     * Task Execution Result Analysis
     */
    TASK_RESULT_ANALYZER: string;
    /**
     * Error Recovery System Prompt
     */
    ERROR_RECOVERY_ANALYZER: string;
};
/**
 * Tool-specific prompts for different Lark operations
 */
export declare const TOOL_OPERATION_PROMPTS: {
    /**
     * Bitable/Base operations
     */
    BASE_OPERATIONS: string;
    /**
     * Messaging operations
     */
    MESSAGING_OPERATIONS: string;
    /**
     * Document management operations
     */
    DOCUMENT_OPERATIONS: string;
};
/**
 * Utility functions for prompt processing
 */
export declare const PromptUtils: {
    /**
     * Replace placeholders in prompt templates
     */
    fillTemplate(template: string, variables: Record<string, any>): string;
    /**
     * Extract structured data from delimited response
     */
    extractStructuredData(response: string, startDelimiter: string, endDelimiter: string): any | null;
    /**
     * Validate required fields in structured response
     */
    validateStructuredResponse(data: any, requiredFields: string[]): boolean;
};
