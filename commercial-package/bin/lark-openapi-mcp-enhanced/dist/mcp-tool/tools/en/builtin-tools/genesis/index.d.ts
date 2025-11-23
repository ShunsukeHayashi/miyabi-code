/**
 * Genesis System Tools
 * AI-powered Lark Base generation tools
 */
import { McpTool } from '../../../../types';
/**
 * Create Lark Base from requirements
 */
export declare const genesisCreateBase: McpTool;
/**
 * Analyze requirements and suggest base structure
 */
export declare const genesisAnalyzeRequirements: McpTool;
/**
 * Generate ER diagram for base structure
 */
export declare const genesisGenerateERDiagram: McpTool;
/**
 * Create custom view for Lark Base table
 */
export declare const genesisCreateView: McpTool;
/**
 * Create dashboard by copying existing one
 */
export declare const genesisCreateDashboard: McpTool;
/**
 * Create automation workflow
 */
export declare const genesisCreateAutomation: McpTool;
/**
 * Create filter view for spreadsheet
 */
export declare const genesisCreateFilterView: McpTool;
/**
 * List available Genesis templates
 */
export declare const genesisListTemplates: McpTool;
/**
 * Optimize existing base with AI
 */
export declare const genesisOptimizeBase: McpTool;
export declare const genesisTools: McpTool[];
export type GenesisToolName = 'genesis.builtin.create_base' | 'genesis.builtin.analyze_requirements' | 'genesis.builtin.generate_er_diagram' | 'genesis.builtin.optimize_base' | 'genesis.builtin.create_view' | 'genesis.builtin.create_dashboard' | 'genesis.builtin.create_automation' | 'genesis.builtin.create_filter_view' | 'genesis.builtin.list_templates';
