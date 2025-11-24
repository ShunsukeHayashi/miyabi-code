import { McpTool } from '../../../../types';
export type ChatAgentToolName = 'system.chat.message' | 'system.chat.command' | 'system.chat.context';
/**
 * LLM Chat Agent - ユーザーとの対話を処理するメインエージェント
 */
export declare const systemChatMessageTool: McpTool;
/**
 * コマンド処理エージェント - 特定のコマンドを解析・実行
 */
export declare const systemChatCommandTool: McpTool;
/**
 * コンテキスト管理エージェント - 会話の文脈を管理
 */
export declare const systemChatContextTool: McpTool;
export declare const chatAgentTools: McpTool[];
