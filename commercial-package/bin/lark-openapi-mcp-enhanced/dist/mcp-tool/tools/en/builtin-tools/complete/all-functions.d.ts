/**
 * Complete set of all Lark/Feishu functions as MCP tools
 * This file provides comprehensive access to all API functions
 */
import { McpTool } from '../../../../types';
export declare const getUserInfo: McpTool;
export declare const createUser: McpTool;
export declare const createDepartment: McpTool;
export declare const createGroup: McpTool;
export declare const createApproval: McpTool;
export declare const createWikiSpace: McpTool;
export declare const bookMeetingRoom: McpTool;
export declare const createOKR: McpTool;
export declare const createEmployee: McpTool;
export declare const completeTools: McpTool[];
export type CompleteToolName = 'complete.user.get_info' | 'complete.user.create' | 'complete.department.create' | 'complete.group.create' | 'complete.approval.create_instance' | 'complete.wiki.create_space' | 'complete.meeting_room.book' | 'complete.okr.create' | 'complete.hr.create_employee';
