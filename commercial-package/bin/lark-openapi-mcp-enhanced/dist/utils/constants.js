"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAPI_MCP_ENV_ARGS = exports.OAPI_MCP_DEFAULT_ARGS = exports.USER_AGENT = void 0;
const version_1 = require("./version");
exports.USER_AGENT = `oapi-sdk-mcp/${version_1.currentVersion}`;
exports.OAPI_MCP_DEFAULT_ARGS = {
    domain: 'https://open.feishu.cn',
    toolNameCase: 'snake',
    language: 'en',
    tokenMode: 'auto',
    mode: 'stdio',
    host: 'localhost',
    port: '3000',
};
exports.OAPI_MCP_ENV_ARGS = {
    appId: process.env.APP_ID,
    appSecret: process.env.APP_SECRET,
    userAccessToken: process.env.USER_ACCESS_TOKEN,
    tokenMode: process.env.LARK_TOKEN_MODE,
    tools: process.env.LARK_TOOLS,
    domain: process.env.LARK_DOMAIN,
};
