/**
 * Real implementation helpers for Genesis tools
 * These functions make actual API calls to Lark
 */
import * as lark from '@larksuiteoapi/node-sdk';
/**
 * Create a Lark Base with tables and fields
 */
export declare function createLarkBase(client: lark.Client, params: {
    name: string;
    folderToken?: string;
    tables: Array<{
        name: string;
        fields: Array<{
            field_name: string;
            type: number;
            property?: any;
        }>;
    }>;
}): Promise<{
    baseToken: string;
    tableIds: string[];
}>;
/**
 * Create a view for a table
 */
export declare function createTableView(client: lark.Client, params: {
    appToken: string;
    tableId: string;
    viewName: string;
    viewType?: 'grid' | 'kanban' | 'gallery' | 'gantt' | 'form';
}): Promise<{
    viewId: string;
}>;
/**
 * Copy a dashboard
 */
export declare function copyDashboard(client: lark.Client, params: {
    appToken: string;
    dashboardId: string;
    name: string;
}): Promise<{
    dashboardId: string;
}>;
/**
 * List workflows (automation)
 */
export declare function listWorkflows(client: lark.Client, params: {
    appToken: string;
    pageSize?: number;
}): Promise<{
    workflows: any[];
}>;
/**
 * Create filter view for spreadsheet
 */
export declare function createSpreadsheetFilterView(client: lark.Client, params: {
    spreadsheetToken: string;
    sheetId: string;
    filterViewName: string;
    range: string;
    filterConditions: any[];
}): Promise<{
    filterViewId: string;
}>;
/**
 * Helper to convert Genesis field types to Lark field types
 */
export declare function mapFieldType(genesisType: string): number;
/**
 * Helper to create standard fields for a table
 */
export declare function createStandardFields(tableName: string): any[];
