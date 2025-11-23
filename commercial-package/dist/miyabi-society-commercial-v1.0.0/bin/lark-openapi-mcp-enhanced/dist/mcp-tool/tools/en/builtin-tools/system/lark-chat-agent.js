"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.larkChatAgentTools = exports.larkAgentStatusTool = exports.larkAgentCreateTool = exports.larkChatAgentTool = void 0;
const zod_1 = require("zod");
const agent_1 = require("../../../../../agents/agent");
/**
 * Lark Chat Agent - Main conversational AI interface
 */
exports.larkChatAgentTool = {
    project: 'system',
    name: 'system.agent.chat',
    accessTokens: ['tenant'],
    description: '[Lark Chat Agent] - Intelligent conversational AI for Lark users',
    schema: {
        data: zod_1.z.object({
            user_message: zod_1.z.string().describe('User message to process'),
            chat_id: zod_1.z.string().describe('Lark chat ID'),
            user_id: zod_1.z.string().optional().describe('User ID for personalization'),
            conversation_id: zod_1.z.string().optional().describe('Conversation ID for context'),
            agent_name: zod_1.z.string().optional().describe('Specific agent to use (default: LarkAssistant)'),
            language: zod_1.z.enum(['en', 'ja', 'zh']).optional().describe('Response language'),
            context: zod_1.z.record(zod_1.z.any()).optional().describe('Additional context'),
        }),
    },
    customHandler: async (client, params) => {
        try {
            const { user_message, chat_id, user_id, conversation_id, agent_name = 'LarkAssistant', language = 'ja', context = {}, } = params.data;
            // Get or create agent
            const agent = await getOrCreateAgent(agent_name, language, client);
            // Prepare agent tools
            const agentTools = createAgentTools(client);
            // Add tools to agent
            for (const tool of agentTools) {
                agent.tools.set(tool.name, tool);
            }
            // Run agent
            const result = await agent_1.AgentRunner.run(agent, user_message, {
                chatId: chat_id,
                userId: user_id,
                conversationId: conversation_id,
                metadata: { ...context, larkClient: client },
            });
            // Send response to Lark if successful
            if (result.success) {
                await client.request({
                    method: 'POST',
                    url: '/open-apis/im/v1/messages',
                    params: { receive_id_type: 'chat_id' },
                    data: {
                        receive_id: chat_id,
                        msg_type: 'text',
                        content: JSON.stringify({ text: result.response }),
                    },
                });
            }
            return {
                content: [
                    {
                        type: 'text',
                        text: `Agent response sent: "${result.response.substring(0, 100)}${result.response.length > 100 ? '...' : ''}"`,
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
                        text: `Agent chat failed: ${error}`,
                    },
                ],
            };
        }
    },
};
/**
 * Create Agent - Dynamic agent creation tool
 */
exports.larkAgentCreateTool = {
    project: 'system',
    name: 'system.agent.create',
    accessTokens: ['tenant'],
    description: '[Lark Chat Agent] - Create custom agent with specific instructions',
    schema: {
        data: zod_1.z.object({
            agent_name: zod_1.z.string().describe('Name for the new agent'),
            instructions: zod_1.z.string().describe('Agent instructions and behavior'),
            chat_id: zod_1.z.string().describe('Chat ID to send confirmation'),
            language: zod_1.z.enum(['en', 'ja', 'zh']).optional().describe('Agent language'),
            tools: zod_1.z.array(zod_1.z.string()).optional().describe('Tool names to include'),
            temperature: zod_1.z.number().min(0).max(2).optional().describe('Response creativity (0-2)'),
            system_prompt: zod_1.z.string().optional().describe('Custom system prompt'),
        }),
    },
    customHandler: async (client, params) => {
        try {
            const { agent_name, instructions, chat_id, language = 'ja', tools = [], temperature = 0.7, system_prompt, } = params.data;
            // Create agent configuration
            const config = {
                name: agent_name,
                instructions,
                language,
                temperature,
                systemPrompt: system_prompt,
                tools: [],
            };
            // Create agent
            const agent = new agent_1.Agent(config);
            // Store agent (in real implementation, use persistent storage)
            agentStore.set(agent_name, agent);
            // Send confirmation
            const confirmationMessage = `✅ **エージェント作成完了**

🤖 **名前**: ${agent_name}
📝 **指示**: ${instructions}
🌐 **言語**: ${language}
🛠️ **ツール**: ${tools.length}個
🎯 **Temperature**: ${temperature}

エージェントが作成されました！「${agent_name}」として会話を開始できます。`;
            await client.request({
                method: 'POST',
                url: '/open-apis/im/v1/messages',
                params: { receive_id_type: 'chat_id' },
                data: {
                    receive_id: chat_id,
                    msg_type: 'text',
                    content: JSON.stringify({ text: confirmationMessage }),
                },
            });
            return {
                content: [
                    {
                        type: 'text',
                        text: `Agent "${agent_name}" created successfully`,
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
                        text: `Failed to create agent: ${error}`,
                    },
                ],
            };
        }
    },
};
/**
 * Agent Status - Check agent system status
 */
exports.larkAgentStatusTool = {
    project: 'system',
    name: 'system.agent.status',
    accessTokens: ['tenant'],
    description: '[Lark Chat Agent] - Check agent system status and available agents',
    schema: {
        data: zod_1.z.object({
            chat_id: zod_1.z.string().describe('Chat ID to send status to'),
            detailed: zod_1.z.boolean().optional().describe('Include detailed status information'),
        }),
    },
    customHandler: async (client, params) => {
        try {
            const { chat_id, detailed = false } = params.data;
            const agentCount = agentStore.size;
            const conversationCount = Array.from(agentStore.values()).reduce((total, agent) => { var _a; return total + ((_a = agent.conversations) === null || _a === void 0 ? void 0 : _a.size) || 0; }, 0);
            let statusMessage = `🤖 **Agent System Status**

✅ **システム**: 稼働中
👥 **利用可能エージェント**: ${agentCount}個
💬 **アクティブ会話**: ${conversationCount}件
🛠️ **MCPツール**: 統合済み
🔗 **Lark API**: 接続中

**デフォルトエージェント**:
• LarkAssistant - 汎用AIアシスタント
• BaseExpert - Lark Base専門家
• MessageBot - メッセージング専門

新しいエージェントを作成するには「create agent」とお声がけください！`;
            if (detailed) {
                const agentList = Array.from(agentStore.entries())
                    .map(([name, agent]) => `• ${name}: ${agent.instructions.substring(0, 50)}...`)
                    .join('\n');
                statusMessage += `\n\n**詳細情報**:\n${agentList}`;
            }
            await client.request({
                method: 'POST',
                url: '/open-apis/im/v1/messages',
                params: { receive_id_type: 'chat_id' },
                data: {
                    receive_id: chat_id,
                    msg_type: 'text',
                    content: JSON.stringify({ text: statusMessage }),
                },
            });
            return {
                content: [
                    {
                        type: 'text',
                        text: `Agent status sent to chat ${chat_id}`,
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
                        text: `Failed to get agent status: ${error}`,
                    },
                ],
            };
        }
    },
};
// Agent storage (in real implementation, use database)
const agentStore = new Map();
/**
 * Get or create agent by name
 */
async function getOrCreateAgent(name, language, client) {
    let agent = agentStore.get(name);
    if (!agent) {
        const config = getDefaultAgentConfig(name, language);
        agent = new agent_1.Agent(config);
        agentStore.set(name, agent);
    }
    return agent;
}
/**
 * Get default agent configuration
 */
function getDefaultAgentConfig(name, language) {
    const configs = {
        LarkAssistant: {
            name: 'LarkAssistant',
            instructions: language === 'ja'
                ? 'あなたはLark MCPツールの専門アシスタントです。ユーザーのLark関連のタスクを効率的にサポートし、親切で分かりやすい回答を提供してください。'
                : 'You are a Lark MCP tools specialist assistant. Help users efficiently with Lark-related tasks and provide helpful, clear responses.',
            language: language,
            temperature: 0.7,
            tools: [],
        },
        BaseExpert: {
            name: 'BaseExpert',
            instructions: language === 'ja'
                ? 'あなたはLark Baseのエキスパートです。データベース操作、テーブル設計、レコード管理に特化して、技術的で正確なサポートを提供してください。'
                : 'You are a Lark Base expert. Specialize in database operations, table design, and record management with technical and accurate support.',
            language: language,
            temperature: 0.3,
            tools: [],
        },
        MessageBot: {
            name: 'MessageBot',
            instructions: language === 'ja'
                ? 'あなたはメッセージング専門のボットです。チャット管理、通知送信、コミュニケーション最適化に特化してサポートしてください。'
                : 'You are a messaging specialist bot. Focus on chat management, notification sending, and communication optimization.',
            language: language,
            temperature: 0.5,
            tools: [],
        },
    };
    return configs[name] || configs['LarkAssistant'];
}
/**
 * Create agent tools that integrate with MCP tools
 */
function createAgentTools(client) {
    return [
        {
            name: 'search_base_records',
            description: 'Search records in Lark Base tables',
            execute: async (params) => {
                // Call actual MCP tool
                return client.request({
                    method: 'POST',
                    url: '/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records/search',
                    data: params,
                });
            },
        },
        {
            name: 'send_message',
            description: 'Send messages in Lark',
            execute: async (params) => {
                return client.request({
                    method: 'POST',
                    url: '/open-apis/im/v1/messages',
                    params: { receive_id_type: 'chat_id' },
                    data: params,
                });
            },
        },
        {
            name: 'get_user_info',
            description: 'Get user information',
            execute: async (params) => {
                return client.request({
                    method: 'POST',
                    url: '/open-apis/contact/v3/users/batch_get_id',
                    data: params,
                });
            },
        },
        {
            name: 'search_documents',
            description: 'Search documents in Lark',
            execute: async (params) => {
                return client.request({
                    method: 'POST',
                    url: '/open-apis/drive/v1/files/search',
                    data: params,
                });
            },
        },
    ];
}
exports.larkChatAgentTools = [exports.larkChatAgentTool, exports.larkAgentCreateTool, exports.larkAgentStatusTool];
