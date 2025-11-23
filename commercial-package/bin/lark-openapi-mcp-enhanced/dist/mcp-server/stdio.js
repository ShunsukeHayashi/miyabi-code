"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initStdioServer = initStdioServer;
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
function initStdioServer(server) {
    const transport = new stdio_js_1.StdioServerTransport();
    server.connect(transport).catch((error) => {
        console.error('MCP Connect Error:', error);
        process.exit(1);
    });
}
