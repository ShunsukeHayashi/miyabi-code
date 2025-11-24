"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bitableBuiltinTools = exports.searchEmergencyOrdersTool = exports.createEmergencyOrderViewTool = void 0;
const zod_1 = require("zod");
/**
 * 緊急発注アラートView作成用カスタムツール
 * View作成とフィルター・ソート設定を一括で行う
 */
exports.createEmergencyOrderViewTool = {
    project: 'bitable',
    name: 'bitable.builtin.createEmergencyOrderView',
    accessTokens: ['tenant', 'user'],
    description: '[Feishu/Lark]-Base-Create Emergency Order Alert View with filters and sorting',
    schema: {
        data: zod_1.z.object({
            app_token: zod_1.z.string().describe('Base app token'),
            table_id: zod_1.z.string().describe('Table ID'),
            view_name: zod_1.z.string().default('🚨緊急発注アラート').describe('View name'),
            filter_fields: zod_1.z.object({
                urgent_flag_field: zod_1.z.string().describe('Field ID for urgent order flag'),
                order_remaining_field: zod_1.z.string().describe('Field ID for order remaining'),
                stockout_prediction_field: zod_1.z.string().describe('Field ID for stockout prediction'),
                sales_30days_field: zod_1.z.string().describe('Field ID for 30 days sales'),
            }).optional().describe('Field IDs for filtering (if not provided, will try to auto-detect)'),
        }),
    },
    customHandler: async (client, params, options) => {
        var _a, _b, _c;
        const { app_token, table_id, view_name, filter_fields } = params.data;
        try {
            // Step 1: Get field information
            const fieldsResponse = await client.bitable.appTableField.list({
                path: { app_token, table_id },
                params: { page_size: 100 }
            });
            const fields = ((_a = fieldsResponse.data) === null || _a === void 0 ? void 0 : _a.items) || [];
            // Create field mapping
            const fieldMap = {};
            fields.forEach((field) => {
                fieldMap[field.field_name] = field.field_id;
            });
            // Auto-detect field IDs if not provided
            const urgentFlagFieldId = (filter_fields === null || filter_fields === void 0 ? void 0 : filter_fields.urgent_flag_field) ||
                fieldMap['緊急発注フラグ'] || fieldMap['Urgent Order Flag'] ||
                fieldMap['urgent_flag'] || '';
            const orderRemainingFieldId = (filter_fields === null || filter_fields === void 0 ? void 0 : filter_fields.order_remaining_field) ||
                fieldMap['発注残数'] || fieldMap['Order Remaining'] ||
                fieldMap['order_remaining'] || '';
            const stockoutPredictionFieldId = (filter_fields === null || filter_fields === void 0 ? void 0 : filter_fields.stockout_prediction_field) ||
                fieldMap['在庫切れ予測'] || fieldMap['Stockout Prediction'] ||
                fieldMap['stockout_days'] || '';
            const sales30DaysFieldId = (filter_fields === null || filter_fields === void 0 ? void 0 : filter_fields.sales_30days_field) ||
                fieldMap['30日販売数'] || fieldMap['30 Days Sales'] ||
                fieldMap['sales_30days'] || '';
            // Step 2: Create view
            const createResponse = await client.bitable.appTableView.create({
                path: { app_token, table_id },
                data: { view_name, view_type: 'grid' }
            });
            const viewId = (_c = (_b = createResponse.data) === null || _b === void 0 ? void 0 : _b.view) === null || _c === void 0 ? void 0 : _c.view_id;
            if (!viewId) {
                throw new Error('Failed to create view');
            }
            // Step 3: Update view with filters
            const filterConditions = [];
            if (urgentFlagFieldId) {
                filterConditions.push({
                    field_id: urgentFlagFieldId,
                    operator: 'is',
                    value: '🚩緊急'
                });
            }
            if (orderRemainingFieldId) {
                filterConditions.push({
                    field_id: orderRemainingFieldId,
                    operator: 'is',
                    value: '0'
                });
            }
            if (stockoutPredictionFieldId) {
                filterConditions.push({
                    field_id: stockoutPredictionFieldId,
                    operator: 'isLess',
                    value: '30'
                });
            }
            if (sales30DaysFieldId) {
                filterConditions.push({
                    field_id: sales30DaysFieldId,
                    operator: 'isGreater',
                    value: '0'
                });
            }
            // Update view with filters if any conditions exist
            if (filterConditions.length > 0) {
                try {
                    await client.bitable.appTableView.patch({
                        path: { app_token, table_id, view_id: viewId },
                        data: {
                            property: {
                                filter_info: {
                                    conjunction: 'and',
                                    conditions: filterConditions
                                }
                            }
                        }
                    });
                }
                catch (patchError) {
                    console.warn('Warning: Could not apply filters automatically. Manual configuration required.');
                }
            }
            // Return success with view information
            return {
                data: {
                    success: true,
                    view_id: viewId,
                    view_url: `https://f82jyx0mblu.jp.larksuite.com/base/${app_token}?table=${table_id}&view=${viewId}`,
                    detected_fields: {
                        urgent_flag: urgentFlagFieldId || 'not found',
                        order_remaining: orderRemainingFieldId || 'not found',
                        stockout_prediction: stockoutPredictionFieldId || 'not found',
                        sales_30days: sales30DaysFieldId || 'not found'
                    },
                    manual_steps_required: filterConditions.length === 0 ?
                        'Filters could not be applied automatically. Please configure manually in the UI.' :
                        'Filters applied. Please add sorting and conditional formatting manually.',
                    field_mapping: fieldMap
                }
            };
        }
        catch (error) {
            throw new Error(`Failed to create emergency order view: ${error.message}`);
        }
    }
};
/**
 * 緊急発注レコード検索ツール
 * 緊急発注が必要な商品を検索して返す
 */
exports.searchEmergencyOrdersTool = {
    project: 'bitable',
    name: 'bitable.builtin.searchEmergencyOrders',
    accessTokens: ['tenant', 'user'],
    description: '[Feishu/Lark]-Base-Search for products requiring emergency orders',
    schema: {
        data: zod_1.z.object({
            app_token: zod_1.z.string().describe('Base app token'),
            table_id: zod_1.z.string().describe('Table ID'),
            limit: zod_1.z.number().default(50).describe('Maximum number of records to return'),
        }),
    },
    customHandler: async (client, params, options) => {
        var _a, _b;
        const { app_token, table_id, limit } = params.data;
        try {
            // Get field information first
            const fieldsResponse = await client.bitable.appTableField.list({
                path: { app_token, table_id },
                params: { page_size: 100 }
            });
            const fields = ((_a = fieldsResponse.data) === null || _a === void 0 ? void 0 : _a.items) || [];
            const fieldMap = {};
            fields.forEach((field) => {
                fieldMap[field.field_name] = field.field_id;
            });
            // Build search conditions
            const conditions = [];
            const urgentFieldId = fieldMap['緊急発注フラグ'] || fieldMap['Urgent Order Flag'];
            if (urgentFieldId) {
                conditions.push({
                    field_name: urgentFieldId, // Changed from field_id to field_name
                    operator: 'is',
                    value: ['🚩緊急']
                });
            }
            const stockoutFieldId = fieldMap['在庫切れ予測'] || fieldMap['Stockout Prediction'];
            if (stockoutFieldId) {
                conditions.push({
                    field_name: stockoutFieldId, // Changed from field_id to field_name
                    operator: 'isLess',
                    value: ['30']
                });
            }
            // Search records
            const searchResponse = await client.bitable.appTableRecord.search({
                path: { app_token, table_id },
                data: {
                    filter: conditions.length > 0 ? {
                        conjunction: 'and',
                        conditions
                    } : undefined,
                    automatic_fields: false
                }
            });
            const records = ((_b = searchResponse.data) === null || _b === void 0 ? void 0 : _b.items) || [];
            return {
                data: {
                    total: records.length,
                    urgent_products: records.map((record) => ({
                        record_id: record.record_id,
                        fields: record.fields
                    })),
                    search_conditions: conditions,
                    message: `Found ${records.length} products requiring emergency orders`
                }
            };
        }
        catch (error) {
            throw new Error(`Failed to search emergency orders: ${error.message}`);
        }
    }
};
// Export tools
exports.bitableBuiltinTools = [
    exports.createEmergencyOrderViewTool,
    exports.searchEmergencyOrdersTool
];
