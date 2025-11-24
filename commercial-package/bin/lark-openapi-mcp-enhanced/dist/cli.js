#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.program = void 0;
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
const commander_1 = require("commander");
const version_1 = require("./utils/version");
const mcp_server_1 = require("./mcp-server");
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const recall_1 = require("./mcp-tool/document-tool/recall");
const constants_1 = require("./utils/constants");
dotenv_1.default.config();
const program = new commander_1.Command();
exports.program = program;
program.name('lark-mcp').description('Feishu/Lark MCP Tool').version(version_1.currentVersion);
program
    .command('mcp')
    .description('Start Feishu/Lark MCP Service')
    .option('-a, --app-id <appId>', 'Feishu/Lark App ID')
    .option('-s, --app-secret <appSecret>', 'Feishu/Lark App Secret')
    .option('-d, --domain <domain>', 'Feishu/Lark Domain (default: "https://open.feishu.cn")')
    .option('-t, --tools <tools>', 'Allowed Tools List, separated by commas')
    .option('-c, --tool-name-case <toolNameCase>', 'Tool Name Case, snake or camel or kebab or dot (default: "snake")')
    .option('-l, --language <language>', 'Tools Language, zh or en (default: "en")')
    .option('-u, --user-access-token <userAccessToken>', 'User Access Token (beta)')
    .option('--token-mode <tokenMode>', 'Token Mode, auto or user_access_token or tenant_access_token (default: "auto")')
    .option('-m, --mode <mode>', 'Transport Mode, stdio or sse (default: "stdio")')
    .option('--host <host>', 'Host to listen (default: "localhost")')
    .option('-p, --port <port>', 'Port to listen in sse mode (default: "3000")')
    .option('--config <configPath>', 'Config file path (JSON)')
    .option('--disable-rate-limit', 'Disable rate limiting (not recommended for production)')
    .option('--rate-limit-requests <requests>', 'Maximum requests per minute (default: 50)', '50')
    .option('--rate-limit-writes <writes>', 'Maximum write operations per minute (default: 10)', '10')
    .action(async (options) => {
    let fileOptions = {};
    if (options.config) {
        try {
            const configContent = fs_1.default.readFileSync(options.config, 'utf-8');
            fileOptions = JSON.parse(configContent);
        }
        catch (err) {
            console.error('Failed to read config file:', err);
            process.exit(1);
        }
    }
    const mergedOptions = { ...constants_1.OAPI_MCP_DEFAULT_ARGS, ...constants_1.OAPI_MCP_ENV_ARGS, ...fileOptions, ...options };
    const { mcpServer } = (0, mcp_server_1.initMcpServer)(mergedOptions);
    if (mergedOptions.mode === 'stdio') {
        (0, mcp_server_1.initStdioServer)(mcpServer);
    }
    else if (mergedOptions.mode === 'sse') {
        (0, mcp_server_1.initSSEServer)(mcpServer, mergedOptions);
    }
    else {
        console.error('Invalid mode:', mergedOptions.mode);
        process.exit(1);
    }
});
program
    .command('recall-developer-documents')
    .description('Start Feishu/Lark Open Platform Recall MCP Service')
    .option('-d, --domain <domain>', 'Feishu Open Platform Domain', 'https://open.feishu.cn')
    .option('-m, --mode <mode>', 'Transport Mode, stdio or sse', 'stdio')
    .option('--host <host>', 'Host to listen', 'localhost')
    .option('-p, --port <port>', 'Port to listen in sse mode', '3001')
    .action((options) => {
    const server = new mcp_js_1.McpServer({
        id: 'lark-recall-mcp-server',
        name: 'Lark Recall MCP Service',
        version: version_1.currentVersion,
    });
    server.tool(recall_1.RecallTool.name, recall_1.RecallTool.description, recall_1.RecallTool.schema, (params) => recall_1.RecallTool.handler(params, options));
    if (options.mode === 'stdio') {
        (0, mcp_server_1.initStdioServer)(server);
    }
    else if (options.mode === 'sse') {
        (0, mcp_server_1.initSSEServer)(server, options);
    }
    else {
        console.error('Invalid mode:', options.mode);
        process.exit(1);
    }
});
if (process.argv.length === 2) {
    program.help();
}
program.parse(process.argv);
