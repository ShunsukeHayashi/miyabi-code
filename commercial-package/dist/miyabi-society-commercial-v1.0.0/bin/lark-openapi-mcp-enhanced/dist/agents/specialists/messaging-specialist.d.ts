/**
 * Messaging Specialist Agent
 * Specialized for Lark IM/Chat operations
 */
import { Agent, AgentConfig } from '../agent';
export declare class MessagingSpecialistAgent extends Agent {
    constructor(config?: Partial<AgentConfig>);
    /**
     * Execute MCP tool with messaging-specific error handling
     */
    private executeMcpTool;
    /**
     * Analyze message for appropriate delivery method
     */
    analyzeMessageContent(content: string, context: any): Promise<{
        urgency: 'low' | 'medium' | 'high' | 'urgent';
        messageType: 'text' | 'rich' | 'notification';
        recommendations: string[];
        estimatedDelivery: number;
    }>;
    /**
     * Format message content based on type and context
     */
    formatMessage(content: string, type: 'text' | 'rich' | 'notification', context: any): any;
}
/**
 * Create and register Messaging Specialist Agent
 */
export declare function createMessagingSpecialist(): Promise<string>;
