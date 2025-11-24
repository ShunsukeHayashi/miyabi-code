"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recallDeveloperDocument = void 0;
const axios_1 = __importDefault(require("axios"));
const constants_1 = require("../../../utils/constants");
const recallDeveloperDocument = async (query, options) => {
    try {
        const { domain, count = 3 } = options;
        // Get Feishu search API endpoint
        const searchEndpoint = `${domain}/document_portal/v1/recall`;
        const payload = {
            question: query,
        };
        // Send network request to Feishu search API
        const response = await axios_1.default.post(searchEndpoint, payload, {
            timeout: 10000,
            headers: { 'User-Agent': constants_1.USER_AGENT },
        });
        // Process search results
        let results = response.data.chunks || [];
        return results.slice(0, count);
    }
    catch (error) {
        throw error;
    }
};
exports.recallDeveloperDocument = recallDeveloperDocument;
