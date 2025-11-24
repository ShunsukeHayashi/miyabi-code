"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.initMcpServer = initMcpServer;
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const noop_1 = require("../../utils/noop");
const version_1 = require("../../utils/version");
const larkmcp = __importStar(require("../../mcp-tool"));
const http_instance_1 = require("../../utils/http-instance");
const genesis_prompts_1 = require("../genesis-prompts");
const complete_prompts_1 = require("../complete-prompts");
const resources_1 = require("../resources");
function initMcpServer(options) {
    var _a;
    const { appId, appSecret, userAccessToken } = options;
    if (!appId || !appSecret) {
        console.error('Error: Missing App Credentials, please provide APP_ID and APP_SECRET or specify them via command line arguments');
        process.exit(1);
    }
    let allowTools = Array.isArray(options.tools) ? options.tools : ((_a = options.tools) === null || _a === void 0 ? void 0 : _a.split(',')) || [];
    for (const [presetName, presetTools] of Object.entries(larkmcp.presetTools)) {
        if (allowTools.includes(presetName)) {
            allowTools = [...presetTools, ...allowTools];
        }
    }
    // Unique
    allowTools = Array.from(new Set(allowTools));
    // Create MCP Server
    const mcpServer = new mcp_js_1.McpServer({ id: 'lark-mcp-server', name: 'Feishu/Lark MCP Server', version: version_1.currentVersion });
    // Configure rate limiting
    const rateLimitingConfig = {
        enabled: !options.disableRateLimit,
        logger: { warn: noop_1.noop, error: noop_1.noop, debug: noop_1.noop, info: noop_1.noop, trace: noop_1.noop },
    };
    // Parse rate limiting values
    if (options.rateLimitRequests || options.rateLimitWrites) {
        const requestsPerMinute = parseInt(options.rateLimitRequests || '50');
        const writesPerMinute = parseInt(options.rateLimitWrites || '10');
        rateLimitingConfig.rateLimits = {
            default: {
                capacity: requestsPerMinute * 2,
                tokensPerInterval: requestsPerMinute,
                intervalMs: 60000,
                maxWaitTimeMs: 5000,
            },
            read: {
                capacity: requestsPerMinute * 2,
                tokensPerInterval: requestsPerMinute,
                intervalMs: 60000,
                maxWaitTimeMs: 2000,
            },
            write: {
                capacity: writesPerMinute * 2,
                tokensPerInterval: writesPerMinute,
                intervalMs: 60000,
                maxWaitTimeMs: 10000,
            },
            admin: {
                capacity: Math.max(2, Math.floor(writesPerMinute / 5)),
                tokensPerInterval: Math.max(1, Math.floor(writesPerMinute / 10)),
                intervalMs: 60000,
                maxWaitTimeMs: 30000,
            },
        };
    }
    const larkClient = new larkmcp.LarkMcpTool({
        appId,
        appSecret,
        logger: { warn: noop_1.noop, error: noop_1.noop, debug: noop_1.noop, info: noop_1.noop, trace: noop_1.noop },
        httpInstance: http_instance_1.oapiHttpInstance,
        domain: options.domain,
        toolsOptions: allowTools.length
            ? { allowTools: allowTools, language: options.language }
            : { language: options.language },
        tokenMode: options.tokenMode,
        rateLimiting: rateLimitingConfig,
    });
    if (userAccessToken) {
        larkClient.updateUserAccessToken(userAccessToken);
    }
    larkClient.registerMcpServer(mcpServer, { toolNameCase: options.toolNameCase });
    // Register Genesis prompts
    (0, genesis_prompts_1.registerGenesisPrompts)(mcpServer);
    // Register complete prompts for all functions
    (0, complete_prompts_1.registerCompletePrompts)(mcpServer);
    // Register resources
    (0, resources_1.registerResources)(mcpServer);
    return { mcpServer, larkClient };
}
