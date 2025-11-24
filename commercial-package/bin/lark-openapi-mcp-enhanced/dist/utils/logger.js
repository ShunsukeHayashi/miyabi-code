"use strict";
/**
 * Lark MCP Enhanced - Unified Logging Implementation
 * Integrates with the standardized MCP logging system
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.console = exports.LarkMCPLogger = exports.requestLogger = exports.larkLogger = void 0;
const logging_config_1 = require("../../../logging-config");
// Create logger instance for Lark MCP Enhanced
exports.larkLogger = (0, logging_config_1.createMCPLogger)('lark-mcp-enhanced');
// Create request/response logger for MCP operations
exports.requestLogger = (0, logging_config_1.createRequestLogger)(exports.larkLogger);
/**
 * Specialized logging functions for Lark MCP operations
 */
class LarkMCPLogger {
    static logToolExecution(toolName, params, requestId) {
        exports.larkLogger.info('Lark tool execution started', {
            toolName,
            requestId,
            paramsCount: Object.keys(params).length,
            hasUserToken: !!params.userAccessToken
        });
    }
    static logToolSuccess(toolName, result, requestId, duration) {
        exports.larkLogger.info('Lark tool execution completed', {
            toolName,
            requestId,
            duration: `${duration}ms`,
            success: true,
            resultSize: JSON.stringify(result).length
        });
    }
    static logToolError(toolName, error, requestId, duration) {
        exports.larkLogger.error('Lark tool execution failed', {
            toolName,
            requestId,
            duration: `${duration}ms`,
            success: false
        }, error);
    }
    static logAPICall(endpoint, method, statusCode) {
        const context = {
            apiEndpoint: endpoint,
            httpMethod: method
        };
        if (statusCode) {
            context.statusCode = statusCode.toString();
        }
        if (statusCode && statusCode >= 400) {
            exports.larkLogger.warn('Lark API call returned error status', context);
        }
        else {
            exports.larkLogger.debug('Lark API call completed', context);
        }
    }
    static logGenesisOperation(operation, sessionId, stage) {
        exports.larkLogger.info('Genesis operation', {
            genesisOperation: operation,
            sessionId,
            stage
        });
    }
    static logRateLimit(clientId, requestsRemaining, resetTime) {
        if (requestsRemaining < 10) {
            exports.larkLogger.warn('Rate limit approaching', {
                securityEvent: 'rate_limit_warning',
                clientId,
                requestsRemaining,
                resetTime
            });
        }
    }
    static logPerformanceMetrics(metrics) {
        exports.larkLogger.info('Performance metrics', {
            metrics: {
                active_connections: metrics.activeConnections,
                memory_usage: metrics.memoryUsage,
                requests_per_minute: metrics.requestsPerMinute,
                average_response_time: `${metrics.averageResponseTime}ms`
            }
        });
    }
}
exports.LarkMCPLogger = LarkMCPLogger;
/**
 * Legacy console replacement for gradual migration
 */
exports.console = {
    log: (message, ...args) => {
        const fullMessage = [message, ...args].join(' ');
        exports.larkLogger.info(fullMessage);
    },
    error: (message, ...args) => {
        const fullMessage = [message, ...args].join(' ');
        exports.larkLogger.error(fullMessage);
    },
    warn: (message, ...args) => {
        const fullMessage = [message, ...args].join(' ');
        exports.larkLogger.warn(fullMessage);
    },
    info: (message, ...args) => {
        const fullMessage = [message, ...args].join(' ');
        exports.larkLogger.info(fullMessage);
    },
    debug: (message, ...args) => {
        const fullMessage = [message, ...args].join(' ');
        exports.larkLogger.debug(fullMessage);
    }
};
// Export default logger for direct use
exports.default = exports.larkLogger;
