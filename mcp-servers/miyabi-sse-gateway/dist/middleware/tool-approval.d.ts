import { Request, Response, NextFunction } from 'express';
export interface ToolPermission {
    toolName: string;
    description: string;
    category: 'read' | 'write' | 'delete' | 'execute';
    requiresApproval: boolean;
    isDestructive: boolean;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
}
export declare const TOOL_PERMISSIONS: Record<string, ToolPermission>;
export interface ToolApprovalRequest {
    toolName: string;
    action: string;
    parameters: Record<string, any>;
    timestamp: string;
    requestId: string;
}
export declare const toolApprovalMiddleware: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare function isToolAllowed(toolName: string): boolean;
export declare function getToolPermission(toolName: string): ToolPermission | null;
