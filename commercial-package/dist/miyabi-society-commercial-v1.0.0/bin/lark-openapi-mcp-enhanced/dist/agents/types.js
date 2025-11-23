"use strict";
/**
 * Agent Communication Protocol Types
 * Based on AIstudio patterns with enhanced multi-agent capabilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESPONSE_DELIMITERS = void 0;
// Delimiter-based parsing support
exports.RESPONSE_DELIMITERS = {
    STRUCTURED_START: '{{STRUCTURED_RESPONSE_START}}',
    STRUCTURED_END: '{{STRUCTURED_RESPONSE_END}}',
    TASK_ASSIGNMENT_START: '{{TASK_ASSIGNMENT_START}}',
    TASK_ASSIGNMENT_END: '{{TASK_ASSIGNMENT_END}}',
    AGENT_COORDINATION_START: '{{AGENT_COORDINATION_START}}',
    AGENT_COORDINATION_END: '{{AGENT_COORDINATION_END}}',
};
