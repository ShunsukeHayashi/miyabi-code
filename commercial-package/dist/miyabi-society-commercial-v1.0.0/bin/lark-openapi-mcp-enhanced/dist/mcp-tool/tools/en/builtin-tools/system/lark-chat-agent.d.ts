import { McpTool } from '../../../../types';
export type LarkChatAgentToolName = 'system.agent.chat' | 'system.agent.create' | 'system.agent.status';
/**
 * Lark Chat Agent - Main conversational AI interface
 */
export declare const larkChatAgentTool: McpTool;
/**
 * Create Agent - Dynamic agent creation tool
 */
export declare const larkAgentCreateTool: McpTool;
/**
 * Agent Status - Check agent system status
 */
export declare const larkAgentStatusTool: McpTool;
export declare const larkChatAgentTools: McpTool[];
