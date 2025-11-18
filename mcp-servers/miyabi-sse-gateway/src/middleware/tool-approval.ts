// Tool Approval Middleware
// Manages permissions and approval requirements for MCP tools
import { Request, Response, NextFunction } from 'express';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/tool-approval.log' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

export interface ToolPermission {
  toolName: string;
  description: string;
  category: 'read' | 'write' | 'delete' | 'execute';
  requiresApproval: boolean;
  isDestructive: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

// Define all available tools and their permissions
export const TOOL_PERMISSIONS: Record<string, ToolPermission> = {
  // Tmux - Read operations (safe)
  'tmux_list_sessions': {
    toolName: 'tmux_list_sessions',
    description: 'List all tmux sessions',
    category: 'read',
    requiresApproval: false,
    isDestructive: false,
    riskLevel: 'low'
  },
  'tmux_list_windows': {
    toolName: 'tmux_list_windows',
    description: 'List windows in a session',
    category: 'read',
    requiresApproval: false,
    isDestructive: false,
    riskLevel: 'low'
  },
  'tmux_list_panes': {
    toolName: 'tmux_list_panes',
    description: 'List panes in a window',
    category: 'read',
    requiresApproval: false,
    isDestructive: false,
    riskLevel: 'low'
  },

  // Tmux - Write operations (moderate risk)
  'tmux_create_session': {
    toolName: 'tmux_create_session',
    description: 'Create new tmux session',
    category: 'write',
    requiresApproval: true,
    isDestructive: false,
    riskLevel: 'medium'
  },
  'tmux_create_window': {
    toolName: 'tmux_create_window',
    description: 'Create new window in session',
    category: 'write',
    requiresApproval: true,
    isDestructive: false,
    riskLevel: 'medium'
  },
  'tmux_split_window': {
    toolName: 'tmux_split_window',
    description: 'Split window into panes',
    category: 'write',
    requiresApproval: true,
    isDestructive: false,
    riskLevel: 'medium'
  },
  'tmux_send_keys': {
    toolName: 'tmux_send_keys',
    description: 'Send keys to tmux pane',
    category: 'execute',
    requiresApproval: true,
    isDestructive: false,
    riskLevel: 'high'
  },

  // Tmux - Delete operations (high risk)
  'tmux_kill_session': {
    toolName: 'tmux_kill_session',
    description: 'Kill tmux session',
    category: 'delete',
    requiresApproval: true,
    isDestructive: true,
    riskLevel: 'high'
  },
  'tmux_kill_window': {
    toolName: 'tmux_kill_window',
    description: 'Kill tmux window',
    category: 'delete',
    requiresApproval: true,
    isDestructive: true,
    riskLevel: 'high'
  },
  'tmux_kill_pane': {
    toolName: 'tmux_kill_pane',
    description: 'Kill tmux pane',
    category: 'delete',
    requiresApproval: true,
    isDestructive: true,
    riskLevel: 'medium'
  },

  // Rules - Read operations
  'rules_list_agents': {
    toolName: 'rules_list_agents',
    description: 'List all Miyabi agents',
    category: 'read',
    requiresApproval: false,
    isDestructive: false,
    riskLevel: 'low'
  },
  'rules_get_agent_status': {
    toolName: 'rules_get_agent_status',
    description: 'Get agent status',
    category: 'read',
    requiresApproval: false,
    isDestructive: false,
    riskLevel: 'low'
  },

  // Rules - Execute operations
  'rules_validate_agent': {
    toolName: 'rules_validate_agent',
    description: 'Validate agent configuration',
    category: 'execute',
    requiresApproval: true,
    isDestructive: false,
    riskLevel: 'medium'
  },
  'rules_execute_workflow': {
    toolName: 'rules_execute_workflow',
    description: 'Execute Miyabi workflow',
    category: 'execute',
    requiresApproval: true,
    isDestructive: false,
    riskLevel: 'high'
  },
  'rules_check_rules': {
    toolName: 'rules_check_rules',
    description: 'Check rule compliance',
    category: 'read',
    requiresApproval: false,
    isDestructive: false,
    riskLevel: 'low'
  }
};

export interface ToolApprovalRequest {
  toolName: string;
  action: string;
  parameters: Record<string, any>;
  timestamp: string;
  requestId: string;
}

export const toolApprovalMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract tool information from request
    const { tool, command, action } = req.body;
    const toolName = tool || extractToolFromCommand(command) || action;

    if (!toolName) {
      // No tool specified, allow request to proceed
      return next();
    }

    const permission = TOOL_PERMISSIONS[toolName];

    // Unknown tool - log and block
    if (!permission) {
      logger.warn('Unknown tool requested', {
        tool: toolName,
        ip: req.ip,
        path: req.path,
        body: req.body,
        timestamp: new Date().toISOString()
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: 'Unknown or unauthorized tool',
        tool: toolName
      });
    }

    // Log all tool requests
    logger.info('Tool request', {
      tool: toolName,
      category: permission.category,
      requiresApproval: permission.requiresApproval,
      isDestructive: permission.isDestructive,
      riskLevel: permission.riskLevel,
      ip: req.ip,
      path: req.path,
      timestamp: new Date().toISOString()
    });

    // Check if approval is required
    if (permission.requiresApproval) {
      const approvalRequest: ToolApprovalRequest = {
        toolName,
        action: permission.category,
        parameters: req.body,
        timestamp: new Date().toISOString(),
        requestId: generateRequestId()
      };

      logger.warn('Tool requires approval', {
        ...approvalRequest,
        description: permission.description,
        isDestructive: permission.isDestructive,
        riskLevel: permission.riskLevel,
        ip: req.ip
      });

      // Set approval headers for client to handle
      res.setHeader('X-Approval-Required', 'true');
      res.setHeader('X-Tool-Name', toolName);
      res.setHeader('X-Tool-Category', permission.category);
      res.setHeader('X-Risk-Level', permission.riskLevel);
      res.setHeader('X-Is-Destructive', permission.isDestructive.toString());
      res.setHeader('X-Request-Id', approvalRequest.requestId);

      // For destructive operations, require explicit confirmation
      if (permission.isDestructive) {
        const confirmationToken = req.headers['x-confirmation-token'];

        if (!confirmationToken || confirmationToken !== approvalRequest.requestId) {
          logger.warn('Destructive operation blocked - missing confirmation', {
            tool: toolName,
            requestId: approvalRequest.requestId,
            ip: req.ip
          });

          return res.status(403).json({
            error: 'Confirmation Required',
            message: 'This is a destructive operation that requires explicit confirmation',
            tool: toolName,
            description: permission.description,
            requestId: approvalRequest.requestId,
            instructions: 'Resend request with X-Confirmation-Token header set to requestId'
          });
        }

        logger.info('Destructive operation approved', {
          tool: toolName,
          requestId: approvalRequest.requestId,
          ip: req.ip
        });
      }
    }

    // Tool approved or doesn't require approval
    next();
  } catch (error) {
    logger.error('Error in tool approval middleware', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ip: req.ip,
      path: req.path
    });

    // Fail closed - reject request on error
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Tool approval check failed'
    });
  }
};

// Helper function to extract tool name from command
function extractToolFromCommand(command: string | undefined): string | null {
  if (!command) return null;

  const lowerCommand = command.toLowerCase();

  // Tmux commands
  if (lowerCommand.includes('list-sessions') || lowerCommand.includes('ls')) {
    return 'tmux_list_sessions';
  }
  if (lowerCommand.includes('list-windows') || lowerCommand.includes('lsw')) {
    return 'tmux_list_windows';
  }
  if (lowerCommand.includes('new-session') || lowerCommand.includes('new ')) {
    return 'tmux_create_session';
  }
  if (lowerCommand.includes('kill-session')) {
    return 'tmux_kill_session';
  }
  if (lowerCommand.includes('send-keys')) {
    return 'tmux_send_keys';
  }

  return null;
}

// Generate unique request ID for approval tracking
function generateRequestId(): string {
  return `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Export utility function to check if a tool is allowed
export function isToolAllowed(toolName: string): boolean {
  return toolName in TOOL_PERMISSIONS;
}

// Export utility function to get tool permission details
export function getToolPermission(toolName: string): ToolPermission | null {
  return TOOL_PERMISSIONS[toolName] || null;
}
