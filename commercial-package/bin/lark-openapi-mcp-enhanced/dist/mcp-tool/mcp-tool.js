"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LarkMcpTool = void 0;
const node_sdk_1 = require("@larksuiteoapi/node-sdk");
const types_1 = require("./types");
const tools_1 = require("./tools");
const filter_tools_1 = require("./utils/filter-tools");
const handler_1 = require("./utils/handler");
const case_transf_1 = require("./utils/case-transf");
const get_should_use_uat_1 = require("./utils/get-should-use-uat");
const rate_limited_http_1 = require("../utils/rate-limited-http");
/**
 * Feishu/Lark MCP
 */
class LarkMcpTool {
    /**
     * Feishu/Lark MCP
     * @param options Feishu/Lark Client Options
     */
    constructor(options) {
        var _a, _b, _c, _d, _e;
        // Lark Client
        this.client = null;
        // Token Mode
        this.tokenMode = types_1.TokenMode.AUTO;
        // All Tools
        this.allTools = [];
        // Initialize rate-limited HTTP instance
        this.rateLimitedHttp = (0, rate_limited_http_1.createRateLimitedHttpInstance)({
            enableRateLimit: ((_a = options.rateLimiting) === null || _a === void 0 ? void 0 : _a.enabled) !== false,
            rateLimits: (_b = options.rateLimiting) === null || _b === void 0 ? void 0 : _b.rateLimits,
            logger: (_c = options.rateLimiting) === null || _c === void 0 ? void 0 : _c.logger,
        });
        if (options.client) {
            this.client = options.client;
        }
        else if (options.appId && options.appSecret) {
            this.client = new node_sdk_1.Client({
                appId: options.appId,
                appSecret: options.appSecret,
                // Use rate-limited HTTP instance
                httpInstance: this.rateLimitedHttp.getAxiosInstance(),
                ...options,
            });
        }
        this.tokenMode = options.tokenMode || types_1.TokenMode.AUTO;
        const isZH = ((_d = options.toolsOptions) === null || _d === void 0 ? void 0 : _d.language) === 'zh';
        const filterOptions = {
            allowTools: ((_e = options.toolsOptions) === null || _e === void 0 ? void 0 : _e.allowTools) || [], // Empty array to enable all tools
            tokenMode: this.tokenMode,
            ...options.toolsOptions,
        };
        // Enable both English and Chinese tools for maximum coverage
        const allToolsCombined = [...tools_1.AllTools, ...tools_1.AllToolsZh];
        // Remove duplicates by tool name (keep first occurrence)
        const uniqueTools = allToolsCombined.filter((tool, index, arr) => arr.findIndex(t => t.name === tool.name) === index);
        this.allTools = (0, filter_tools_1.filterTools)(uniqueTools, filterOptions);
    }
    /**
     * Update User Access Token
     * @param userAccessToken User Access Token
     */
    updateUserAccessToken(userAccessToken) {
        this.userAccessToken = userAccessToken;
    }
    /**
     * Get MCP Tools
     * @returns MCP Tool Definition Array
     */
    getTools() {
        return this.allTools;
    }
    /**
     * Get rate limiting metrics
     * @returns Rate limiting metrics for all tiers
     */
    getRateLimitMetrics() {
        return this.rateLimitedHttp.getRateLimitMetrics();
    }
    /**
     * Reset rate limiters
     */
    resetRateLimiters() {
        this.rateLimitedHttp.resetRateLimiters();
    }
    /**
     * Enable or disable rate limiting
     * @param enabled Whether to enable rate limiting
     */
    setRateLimitEnabled(enabled) {
        this.rateLimitedHttp.setRateLimitEnabled(enabled);
    }
    /**
     * Register Tools to MCP Server
     * @param server MCP Server Instance
     */
    registerMcpServer(server, options) {
        for (const tool of this.allTools) {
            server.tool((0, case_transf_1.caseTransf)(tool.name, options === null || options === void 0 ? void 0 : options.toolNameCase), tool.description, tool.schema, (params) => {
                try {
                    if (!this.client) {
                        return {
                            isError: true,
                            content: [{ type: 'text', text: 'Client not initialized' }],
                        };
                    }
                    const handler = tool.customHandler || handler_1.larkOapiHandler;
                    if (this.tokenMode == types_1.TokenMode.USER_ACCESS_TOKEN && !this.userAccessToken) {
                        return {
                            isError: true,
                            content: [{ type: 'text', text: 'Invalid UserAccessToken' }],
                        };
                    }
                    const shouldUseUAT = (0, get_should_use_uat_1.getShouldUseUAT)(this.tokenMode, this.userAccessToken, params === null || params === void 0 ? void 0 : params.useUAT);
                    return handler(this.client, { ...params, useUAT: shouldUseUAT }, { userAccessToken: this.userAccessToken, tool });
                }
                catch (error) {
                    return {
                        isError: true,
                        content: [{ type: 'text', text: `Error: ${JSON.stringify(error === null || error === void 0 ? void 0 : error.message)}` }],
                    };
                }
            });
        }
    }
}
exports.LarkMcpTool = LarkMcpTool;
