/**
 * Base Operations Specialist Agent
 * Specialized for Lark Base/Bitable operations
 */
import { Agent, AgentConfig } from '../agent';
export declare class BaseSpecialistAgent extends Agent {
    constructor(config?: Partial<AgentConfig>);
    private createSpecialistTools;
    /**
     * Execute MCP tool with error handling and structured response
     */
    private executeMcpTool;
    /**
     * Analyze Base operation complexity and recommend approach
     */
    analyzeOperation(operation: string, context: any): Promise<{
        complexity: 'simple' | 'moderate' | 'complex';
        estimatedTime: number;
        recommendations: string[];
        requiredTools: string[];
    }>;
}
/**
 * Create and register Base Specialist Agent
 */
export declare function createBaseSpecialist(): Promise<string>;
