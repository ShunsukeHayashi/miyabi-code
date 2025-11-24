import { BuiltinToolName } from './en/builtin-tools';
import { ToolName as GenToolName, ProjectName as GenProjectName } from './en/gen-tools';
import { CUSTOM_WORKFLOW_TOOLS } from './custom-workflows';
export type CustomWorkflowToolName = typeof CUSTOM_WORKFLOW_TOOLS[keyof typeof CUSTOM_WORKFLOW_TOOLS];
export type ToolName = GenToolName | BuiltinToolName | CustomWorkflowToolName;
export type ProjectName = GenProjectName | 'custom_workflows';
export declare const CustomWorkflowTools: any[];
export declare const AllTools: any[];
export declare const AllToolsZh: any[];
