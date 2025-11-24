"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSSEServer = initSSEServer;
const express_1 = __importDefault(require("express"));
const sse_js_1 = require("@modelcontextprotocol/sdk/server/sse.js");
function initSSEServer(server, options) {
    const app = (0, express_1.default)();
    const transports = {};
    app.get('/sse', async (_, res) => {
        const transport = new sse_js_1.SSEServerTransport('/messages', res);
        transports[transport.sessionId] = transport;
        res.on('close', () => {
            delete transports[transport.sessionId];
        });
        await server.connect(transport);
    });
    app.post('/messages', async (req, res) => {
        const sessionId = req.query.sessionId;
        const transport = transports[sessionId];
        if (!transport) {
            res.status(400).send('No transport found for sessionId');
            return;
        }
        await transport.handlePostMessage(req, res);
    });
    app.listen(options.port, options.host, () => {
        console.log(`Server is running on port ${options.port}`);
        console.log(`SSE endpoint: http://${options.host}:${options.port}/sse`);
    });
}
