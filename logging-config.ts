/**
 * Unified MCP Logging Configuration
 * Provides standardized logging for all MCP servers
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: any;
}

export interface MCPLogger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext, error?: Error): void;
  error(message: string, context?: LogContext, error?: Error): void;
}

export function createMCPLogger(namespace: string): MCPLogger {
  const formatMessage = (level: LogLevel, message: string, context?: LogContext) => {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] [${namespace}] ${message}${contextStr}`;
  };

  return {
    debug: (message: string, context?: LogContext) => {
      if (process.env.DEBUG || process.env.LOG_LEVEL === 'debug') {
        console.log(formatMessage('debug', message, context));
      }
    },
    info: (message: string, context?: LogContext) => {
      console.log(formatMessage('info', message, context));
    },
    warn: (message: string, context?: LogContext, error?: Error) => {
      console.warn(formatMessage('warn', message, context));
      if (error) console.warn(error);
    },
    error: (message: string, context?: LogContext, error?: Error) => {
      console.error(formatMessage('error', message, context));
      if (error) console.error(error);
    }
  };
}

export function createRequestLogger(logger: MCPLogger) {
  return {
    logRequest: (method: string, params: any) => {
      logger.debug('MCP Request', { method, params });
    },
    logResponse: (result: any, duration: number) => {
      logger.debug('MCP Response', { duration: `${duration}ms` });
    },
    logError: (error: Error) => {
      logger.error('MCP Error', {}, error);
    }
  };
}
