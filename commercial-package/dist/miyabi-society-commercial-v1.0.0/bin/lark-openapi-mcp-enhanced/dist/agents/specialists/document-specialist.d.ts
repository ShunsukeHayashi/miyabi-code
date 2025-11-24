/**
 * Document Management Specialist Agent
 * Specialized for Lark Docs/Drive operations
 */
import { Agent, AgentConfig } from '../agent';
export declare class DocumentSpecialistAgent extends Agent {
    constructor(config?: Partial<AgentConfig>);
    /**
     * Execute MCP tool with document-specific error handling
     */
    private executeMcpTool;
    /**
     * Analyze document operation and recommend optimization
     */
    analyzeDocumentOperation(operation: string, context: any): Promise<{
        complexity: 'simple' | 'moderate' | 'complex';
        estimatedTime: number;
        securityLevel: 'public' | 'internal' | 'confidential';
        recommendations: string[];
        requiredPermissions: string[];
    }>;
    /**
     * Validate document content for security and compliance
     */
    validateDocumentContent(content: string): {
        isValid: boolean;
        issues: string[];
        suggestions: string[];
    };
}
/**
 * Create and register Document Specialist Agent
 */
export declare function createDocumentSpecialist(): Promise<string>;
