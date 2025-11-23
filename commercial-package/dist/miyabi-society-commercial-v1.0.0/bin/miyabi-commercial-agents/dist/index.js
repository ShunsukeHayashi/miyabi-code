#!/usr/bin/env node
/**
 * Miyabi Commercial Agents - All-in-One MCP Server
 * 6つの商用Business Agents統合パッケージ（完全保護版）
 *
 * このファイルはバイナリ化され、ソースコードは完全に保護されます
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
// ライセンス検証 & セキュリティ
import { LicenseValidator, AntiDebug } from './license-validator.js';
// 6つの商用Agent
import { TsubuyakunAgent } from './agents/tsubuyakun-sns.js';
import { KakuchanAgent } from './agents/kakuchan-content.js';
import { DougakunAgent } from './agents/dougakun-youtube.js';
import { HiromeruAgent } from './agents/hiromeru-marketing.js';
import { KazoeruAgent } from './agents/kazoeru-analytics.js';
import { SasaeruAgent } from './agents/sasaeru-crm.js';
/**
 * アンチデバッグ保護（本番環境のみ）
 */
if (process.env.NODE_ENV === 'production') {
    AntiDebug.check();
}
/**
 * ライセンス検証（必須）
 */
const licenseValidator = new LicenseValidator();
let licenseInfo = null;
try {
    licenseInfo = await licenseValidator.validate();
    console.error(`✅ License validated: ${licenseInfo.tier} tier`);
    console.error(`   Machine ID: ${licenseInfo.machineId}`);
}
catch (error) {
    console.error(`❌ License validation failed: ${error.message}`);
    console.error('');
    console.error('Commercial agents require a valid license key.');
    console.error('Please set MIYABI_LICENSE_KEY environment variable.');
    console.error('');
    console.error('Format: MIYABI-COMMERCIAL-{TIER}-{HASH}');
    console.error('Example: MIYABI-COMMERCIAL-PRO-A1B2C3D4E5F6G7H8I9J0');
    console.error('');
    console.error('Contact: support@miyabi.tech for licensing');
    process.exit(1);
}
/**
 * Agent instances
 */
const tsubuyakun = new TsubuyakunAgent();
const kakuchan = new KakuchanAgent();
const dougakun = new DougakunAgent();
const hiromeru = new HiromeruAgent();
const kazoeru = new KazoeruAgent();
const sasaeru = new SasaeruAgent();
/**
 * MCP Server 初期化
 */
const server = new Server({
    name: 'miyabi-commercial-agents',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
/**
 * 機能制限チェックヘルパー
 */
function requireFeature(featureName) {
    if (!licenseValidator.canUseFeature(featureName)) {
        throw new Error(`Feature '${featureName}' requires ${featureName.includes('advanced') ? 'PRO' : 'ENTERPRISE'} tier or higher. ` +
            `Current tier: ${licenseValidator.getTier()}`);
    }
}
/**
 * ツール一覧
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tier = licenseValidator.getTier();
    return {
        tools: [
            // つぶやくん - SNS Strategy (All tiers)
            {
                name: 'tsubuyakun_generate_sns_strategy',
                description: `[${tier}] Generate optimized SNS strategy for any platform`,
                inputSchema: {
                    type: 'object',
                    properties: {
                        platform: {
                            type: 'string',
                            enum: ['twitter', 'instagram', 'youtube', 'tiktok', 'linkedin'],
                            description: 'Target social media platform',
                        },
                        audience: {
                            type: 'string',
                            description: 'Target audience description',
                        },
                        goals: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Campaign objectives',
                        },
                        current_followers: {
                            type: 'number',
                            description: 'Current follower count (optional)',
                        },
                        budget: {
                            type: 'number',
                            description: 'Monthly budget in USD (optional)',
                        },
                    },
                    required: ['platform', 'audience', 'goals'],
                },
            },
            // 書くちゃん - Content Creation (All tiers)
            {
                name: 'kakuchan_generate_content',
                description: `[${tier}] Generate high-quality content with SEO optimization`,
                inputSchema: {
                    type: 'object',
                    properties: {
                        type: {
                            type: 'string',
                            enum: ['blog', 'email', 'social', 'video-script', 'whitepaper'],
                            description: 'Content type',
                        },
                        topic: {
                            type: 'string',
                            description: 'Content topic',
                        },
                        target_audience: {
                            type: 'string',
                            description: 'Target audience',
                        },
                        tone: {
                            type: 'string',
                            enum: ['professional', 'casual', 'technical', 'friendly'],
                            description: 'Writing tone',
                        },
                        length: {
                            type: 'number',
                            description: 'Desired word count (optional)',
                        },
                        keywords: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'SEO keywords (optional)',
                        },
                    },
                    required: ['type', 'topic', 'target_audience', 'tone'],
                },
            },
            // 動画くん - YouTube (PRO+)
            {
                name: 'dougakun_optimize_youtube',
                description: `[${tier}] ${tier === 'STARTER' ? '[PRO+ ONLY] ' : ''}Optimize YouTube channel strategy`,
                inputSchema: {
                    type: 'object',
                    properties: {
                        channel_name: {
                            type: 'string',
                            description: 'YouTube channel name',
                        },
                        niche: {
                            type: 'string',
                            description: 'Channel niche/category',
                        },
                        current_subscribers: {
                            type: 'number',
                            description: 'Current subscriber count (optional)',
                        },
                        upload_frequency: {
                            type: 'string',
                            description: 'Upload frequency (optional)',
                        },
                        goals: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Channel goals',
                        },
                    },
                    required: ['channel_name', 'niche', 'goals'],
                },
            },
            // 広める - Marketing (PRO+)
            {
                name: 'hiromeru_create_marketing_plan',
                description: `[${tier}] ${tier === 'STARTER' ? '[PRO+ ONLY] ' : ''}Create comprehensive marketing campaign plan`,
                inputSchema: {
                    type: 'object',
                    properties: {
                        product: {
                            type: 'string',
                            description: 'Product/service name',
                        },
                        target_market: {
                            type: 'string',
                            description: 'Target market description',
                        },
                        budget: {
                            type: 'number',
                            description: 'Total campaign budget',
                        },
                        duration_months: {
                            type: 'number',
                            description: 'Campaign duration in months',
                        },
                        objectives: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Campaign objectives',
                        },
                    },
                    required: ['product', 'target_market', 'budget', 'duration_months', 'objectives'],
                },
            },
            // 数える - Analytics (PRO+)
            {
                name: 'kazoeru_analyze_data',
                description: `[${tier}] ${tier === 'STARTER' ? '[PRO+ ONLY] ' : ''}Advanced data analytics and insights`,
                inputSchema: {
                    type: 'object',
                    properties: {
                        data_source: {
                            type: 'string',
                            description: 'Data source identifier',
                        },
                        metrics: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Metrics to analyze',
                        },
                        time_period: {
                            type: 'string',
                            description: 'Analysis time period',
                        },
                        goals: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Analysis goals (optional)',
                        },
                    },
                    required: ['data_source', 'metrics', 'time_period'],
                },
            },
            // 支える - CRM (ENTERPRISE)
            {
                name: 'sasaeru_optimize_crm',
                description: `[${tier}] ${tier !== 'ENTERPRISE' ? '[ENTERPRISE ONLY] ' : ''}CRM and customer success optimization`,
                inputSchema: {
                    type: 'object',
                    properties: {
                        company_name: {
                            type: 'string',
                            description: 'Customer company name',
                        },
                        industry: {
                            type: 'string',
                            description: 'Customer industry',
                        },
                        size: {
                            type: 'string',
                            enum: ['small', 'medium', 'large', 'enterprise'],
                            description: 'Company size',
                        },
                        stage: {
                            type: 'string',
                            enum: ['lead', 'opportunity', 'customer', 'advocate'],
                            description: 'Customer stage',
                        },
                    },
                    required: ['company_name', 'industry', 'size', 'stage'],
                },
            },
        ],
    };
});
/**
 * ツール実行
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        // つぶやくん - SNS Strategy
        if (name === 'tsubuyakun_generate_sns_strategy') {
            const strategy = await tsubuyakun.generateStrategy(args);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(strategy, null, 2),
                    },
                ],
            };
        }
        // 書くちゃん - Content Creation
        if (name === 'kakuchan_generate_content') {
            const content = await kakuchan.generateContent(args);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(content, null, 2),
                    },
                ],
            };
        }
        // 動画くん - YouTube (PRO+)
        if (name === 'dougakun_optimize_youtube') {
            requireFeature('youtube_optimization');
            const strategy = await dougakun.optimizeYouTubeChannel(args);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(strategy, null, 2),
                    },
                ],
            };
        }
        // 広める - Marketing (PRO+)
        if (name === 'hiromeru_create_marketing_plan') {
            requireFeature('marketing_automation');
            const plan = await hiromeru.createMarketingPlan(args);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(plan, null, 2),
                    },
                ],
            };
        }
        // 数える - Analytics (PRO+)
        if (name === 'kazoeru_analyze_data') {
            requireFeature('advanced_analytics');
            const report = await kazoeru.analyzeData(args);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(report, null, 2),
                    },
                ],
            };
        }
        // 支える - CRM (ENTERPRISE)
        if (name === 'sasaeru_optimize_crm') {
            requireFeature('crm_integration');
            const strategy = await sasaeru.optimizeCRM(args);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(strategy, null, 2),
                    },
                ],
            };
        }
        throw new Error(`Unknown tool: ${name}`);
    }
    catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: ${error.message}`,
                },
            ],
            isError: true,
        };
    }
});
/**
 * サーバー起動
 */
console.error('🚀 Miyabi Commercial Agents Server');
console.error(`   License: ${licenseInfo.tier} tier`);
console.error(`   Version: 1.0.0`);
console.error(`   Agents: 6 (つぶやくん, 書くちゃん, 動画くん, 広める, 数える, 支える)`);
console.error('');
const transport = new StdioServerTransport();
await server.connect(transport);
//# sourceMappingURL=index.js.map