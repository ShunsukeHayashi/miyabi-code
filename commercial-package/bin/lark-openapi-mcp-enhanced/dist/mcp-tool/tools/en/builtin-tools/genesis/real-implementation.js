"use strict";
/**
 * Real implementation helpers for Genesis tools
 * These functions make actual API calls to Lark
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLarkBase = createLarkBase;
exports.createTableView = createTableView;
exports.copyDashboard = copyDashboard;
exports.listWorkflows = listWorkflows;
exports.createSpreadsheetFilterView = createSpreadsheetFilterView;
exports.mapFieldType = mapFieldType;
exports.createStandardFields = createStandardFields;
/**
 * Create a Lark Base with tables and fields
 */
async function createLarkBase(client, params) {
    var _a, _b, _c;
    try {
        // Step 1: Create the base app
        const appResponse = await client.bitable.app.create({
            data: {
                name: params.name,
                folder_token: params.folderToken || '',
            },
        });
        if (!((_b = (_a = appResponse.data) === null || _a === void 0 ? void 0 : _a.app) === null || _b === void 0 ? void 0 : _b.app_token)) {
            throw new Error('Failed to create base app');
        }
        const appToken = appResponse.data.app.app_token;
        const tableIds = [];
        // Step 2: Create tables
        for (const table of params.tables) {
            const tableResponse = await client.bitable.appTable.create({
                path: { app_token: appToken },
                data: {
                    table: {
                        name: table.name,
                        fields: table.fields,
                    },
                },
            });
            if ((_c = tableResponse.data) === null || _c === void 0 ? void 0 : _c.table_id) {
                tableIds.push(tableResponse.data.table_id);
            }
        }
        return { baseToken: appToken, tableIds };
    }
    catch (error) {
        throw new Error(`Failed to create Lark Base: ${error.message}`);
    }
}
/**
 * Create a view for a table
 */
async function createTableView(client, params) {
    var _a, _b;
    try {
        const response = await client.bitable.appTableView.create({
            path: {
                app_token: params.appToken,
                table_id: params.tableId,
            },
            data: {
                view_name: params.viewName,
                view_type: params.viewType,
            },
        });
        if (!((_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.view) === null || _b === void 0 ? void 0 : _b.view_id)) {
            throw new Error('Failed to create view');
        }
        return { viewId: response.data.view.view_id };
    }
    catch (error) {
        throw new Error(`Failed to create view: ${error.message}`);
    }
}
/**
 * Copy a dashboard
 */
async function copyDashboard(client, params) {
    var _a;
    try {
        const response = await client.bitable.appDashboard.copy({
            path: {
                app_token: params.appToken,
                block_id: params.dashboardId,
            },
            data: {
                name: params.name,
            },
        });
        if (!((_a = response.data) === null || _a === void 0 ? void 0 : _a.block_id)) {
            throw new Error('Failed to copy dashboard');
        }
        return { dashboardId: response.data.block_id };
    }
    catch (error) {
        throw new Error(`Failed to copy dashboard: ${error.message}`);
    }
}
/**
 * List workflows (automation)
 */
async function listWorkflows(client, params) {
    var _a;
    try {
        const response = await client.bitable.appWorkflow.list({
            path: {
                app_token: params.appToken,
            },
            params: {
                page_size: params.pageSize || 20,
            },
        });
        return { workflows: ((_a = response.data) === null || _a === void 0 ? void 0 : _a.workflows) || [] };
    }
    catch (error) {
        throw new Error(`Failed to list workflows: ${error.message}`);
    }
}
/**
 * Create filter view for spreadsheet
 */
async function createSpreadsheetFilterView(client, params) {
    var _a, _b;
    try {
        const response = await client.sheets.spreadsheetSheetFilterView.create({
            path: {
                spreadsheet_token: params.spreadsheetToken,
                sheet_id: params.sheetId,
            },
            data: {
                filter_view_name: params.filterViewName,
                range: params.range,
            },
        });
        if (!((_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.filter_view) === null || _b === void 0 ? void 0 : _b.filter_view_id)) {
            throw new Error('Failed to create filter view');
        }
        return { filterViewId: response.data.filter_view.filter_view_id };
    }
    catch (error) {
        throw new Error(`Failed to create filter view: ${error.message}`);
    }
}
/**
 * Helper to convert Genesis field types to Lark field types
 */
function mapFieldType(genesisType) {
    const typeMap = {
        text: 1, // Text Multiline
        number: 2, // Number
        select: 3, // SingleSelect
        multiselect: 4, // MultiSelect
        date: 5, // DateTime
        checkbox: 7, // Checkbox
        user: 11, // User
        phone: 13, // PhoneNumber
        url: 15, // Url
        attachment: 17, // Attachment
        link: 18, // Link (one-way)
        formula: 20, // Formula
        duplex: 21, // DuplexLink (two-way)
        location: 22, // Location
        created: 1001, // CreatedTime
        modified: 1002, // ModifiedTime
        creator: 1003, // CreatedUser
        modifier: 1004, // ModifiedUser
        autonumber: 1005, // AutoSerial
    };
    return typeMap[genesisType.toLowerCase()] || 1; // Default to text
}
/**
 * Helper to create standard fields for a table
 */
function createStandardFields(tableName) {
    const baseFields = [
        {
            field_name: 'ID',
            type: 1005, // AutoSerial
            property: {},
        },
        {
            field_name: 'Name',
            type: 1, // Text
            property: {},
        },
        {
            field_name: 'Created Date',
            type: 1001, // CreatedTime
            property: {},
        },
        {
            field_name: 'Modified Date',
            type: 1002, // ModifiedTime
            property: {},
        },
        {
            field_name: 'Created By',
            type: 1003, // CreatedUser
            property: {},
        },
    ];
    // Add table-specific fields
    switch (tableName.toLowerCase()) {
        case 'tasks':
            return [
                ...baseFields,
                {
                    field_name: 'Status',
                    type: 3, // SingleSelect
                    property: {
                        options: [{ name: 'To Do' }, { name: 'In Progress' }, { name: 'Review' }, { name: 'Done' }],
                    },
                },
                {
                    field_name: 'Priority',
                    type: 3, // SingleSelect
                    property: {
                        options: [
                            { name: 'Low', color: 0 },
                            { name: 'Medium', color: 1 },
                            { name: 'High', color: 2 },
                            { name: 'Urgent', color: 3 },
                        ],
                    },
                },
                {
                    field_name: 'Assignee',
                    type: 11, // User
                    property: { multiple: false },
                },
                {
                    field_name: 'Due Date',
                    type: 5, // DateTime
                    property: {},
                },
            ];
        case 'projects':
            return [
                ...baseFields,
                {
                    field_name: 'Status',
                    type: 3, // SingleSelect
                    property: {
                        options: [{ name: 'Planning' }, { name: 'Active' }, { name: 'On Hold' }, { name: 'Completed' }],
                    },
                },
                {
                    field_name: 'Start Date',
                    type: 5, // DateTime
                    property: {},
                },
                {
                    field_name: 'End Date',
                    type: 5, // DateTime
                    property: {},
                },
                {
                    field_name: 'Project Lead',
                    type: 11, // User
                    property: { multiple: false },
                },
            ];
        default:
            return baseFields;
    }
}
