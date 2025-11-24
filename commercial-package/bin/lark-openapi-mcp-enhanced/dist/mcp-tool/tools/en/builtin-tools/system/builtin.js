"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemBuiltinTools = exports.larkSystemBuiltinTimeTool = exports.larkSystemBuiltinInfoTool = void 0;
const zod_1 = require("zod");
const bot_menu_handler_1 = require("./bot-menu-handler");
const chat_agent_1 = require("./chat-agent");
const lark_chat_agent_1 = require("./lark-chat-agent");
exports.larkSystemBuiltinInfoTool = {
    project: 'system',
    name: 'system.builtin.info',
    accessTokens: ['tenant', 'user'],
    description: '[Feishu/Lark] - System - Get system information for debugging',
    schema: {
        data: zod_1.z.object({
            include_version: zod_1.z.boolean().describe('Include version information').optional(),
            include_env: zod_1.z.boolean().describe('Include environment information').optional(),
        }),
    },
    customHandler: async (client, params) => {
        try {
            const info = {
                timestamp: new Date().toISOString(),
                node_version: process.version,
                platform: process.platform,
                arch: process.arch,
            };
            if (params.data.include_version) {
                info.package_version = require('../../../../../../package.json').version;
            }
            if (params.data.include_env) {
                info.env = {
                    NODE_ENV: process.env.NODE_ENV,
                    has_app_id: !!process.env.APP_ID,
                    has_app_secret: !!process.env.APP_SECRET,
                };
            }
            return {
                content: [
                    {
                        type: 'text',
                        text: `System Information: ${JSON.stringify(info, null, 2)}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                isError: true,
                content: [
                    {
                        type: 'text',
                        text: `Failed to get system info: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    },
};
exports.larkSystemBuiltinTimeTool = {
    project: 'system',
    name: 'system.builtin.time',
    accessTokens: ['tenant', 'user'],
    description: '[Feishu/Lark] - System - Get current time in various formats',
    schema: {
        data: zod_1.z.object({
            timezone: zod_1.z.string().describe('Timezone (e.g., "UTC", "Asia/Shanghai")').optional(),
            format: zod_1.z.enum(['iso', 'unix', 'readable']).describe('Time format').optional(),
        }),
    },
    customHandler: async (client, params) => {
        try {
            const now = new Date();
            const format = params.data.format || 'iso';
            let result = {
                requested_format: format,
            };
            switch (format) {
                case 'unix':
                    result.timestamp = Math.floor(now.getTime() / 1000);
                    break;
                case 'readable':
                    result.timestamp = now.toLocaleString();
                    break;
                case 'iso':
                default:
                    result.timestamp = now.toISOString();
                    break;
            }
            if (params.data.timezone) {
                try {
                    result.timezone_info = now.toLocaleString('en-US', { timeZone: params.data.timezone });
                }
                catch (error) {
                    result.timezone_error = 'Invalid timezone';
                }
            }
            return {
                content: [
                    {
                        type: 'text',
                        text: `Current Time: ${JSON.stringify(result, null, 2)}`,
                    },
                ],
            };
        }
        catch (error) {
            return {
                isError: true,
                content: [
                    {
                        type: 'text',
                        text: `Failed to get time: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    },
};
exports.systemBuiltinTools = [
    exports.larkSystemBuiltinInfoTool,
    exports.larkSystemBuiltinTimeTool,
    ...bot_menu_handler_1.systemBotMenuTools,
    ...chat_agent_1.chatAgentTools,
    ...lark_chat_agent_1.larkChatAgentTools,
];
