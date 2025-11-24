"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.oapiHttpInstance = void 0;
const axios_1 = __importDefault(require("axios"));
const constants_1 = require("./constants");
exports.oapiHttpInstance = axios_1.default.create();
exports.oapiHttpInstance.interceptors.request.use((request) => {
    if (request.headers) {
        request.headers['User-Agent'] = constants_1.USER_AGENT;
    }
    return request;
}, undefined, { synchronous: true });
exports.oapiHttpInstance.interceptors.response.use((response) => response.data);
