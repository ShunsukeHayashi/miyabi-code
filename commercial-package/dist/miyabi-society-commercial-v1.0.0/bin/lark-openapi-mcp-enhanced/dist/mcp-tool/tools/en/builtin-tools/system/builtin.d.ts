import { McpTool } from '../../../../types';
import { SystemBotMenuToolName } from './bot-menu-handler';
import { ChatAgentToolName } from './chat-agent';
import { LarkChatAgentToolName } from './lark-chat-agent';
export type systemBuiltinToolName = 'system.builtin.info' | 'system.builtin.time' | SystemBotMenuToolName | ChatAgentToolName | LarkChatAgentToolName;
export declare const larkSystemBuiltinInfoTool: McpTool;
export declare const larkSystemBuiltinTimeTool: McpTool;
export declare const systemBuiltinTools: McpTool[];
