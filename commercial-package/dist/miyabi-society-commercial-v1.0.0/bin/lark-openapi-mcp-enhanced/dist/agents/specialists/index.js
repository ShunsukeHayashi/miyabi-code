"use strict";
/**
 * Agent Specialization for Different Domains
 * Domain-specific agents based on Lark MCP tool categories
 */
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SPECIALIST_DOMAINS = void 0;
__exportStar(require("./base-specialist"), exports);
__exportStar(require("./messaging-specialist"), exports);
__exportStar(require("./document-specialist"), exports);
__exportStar(require("./calendar-specialist"), exports);
__exportStar(require("./coordinator-agent"), exports);
// Export all specialist types
exports.SPECIALIST_DOMAINS = {
    BASE: 'base_operations',
    MESSAGING: 'messaging',
    DOCUMENT: 'document_management',
    CALENDAR: 'calendar_management',
    SYSTEM: 'system_management',
    COORDINATOR: 'workflow_coordination',
};
