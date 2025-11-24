"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.payrollV1Tools = exports.payrollV1DatasourceList = exports.payrollV1DatasourceRecordSave = exports.payrollV1DatasourceRecordQuery = exports.payrollV1CostAllocationReportList = exports.payrollV1CostAllocationPlanList = void 0;
const zod_1 = require("zod");
exports.payrollV1CostAllocationPlanList = {
    project: 'payroll',
    name: 'payroll.v1.costAllocationPlan.list',
    sdkName: 'payroll.v1.costAllocationPlan.list',
    path: '/open-apis/payroll/v1/cost_allocation_plans',
    httpMethod: 'GET',
    description: '[Feishu/Lark]-Payroll-cost plan-Get Cost Plans-Get Cost Plans',
    accessTokens: ['tenant'],
    schema: {
        params: zod_1.z.object({
            page_size: zod_1.z.number(),
            page_token: zod_1.z
                .string()
                .describe('Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups')
                .optional(),
            pay_period: zod_1.z.string(),
        }),
    },
};
exports.payrollV1CostAllocationReportList = {
    project: 'payroll',
    name: 'payroll.v1.costAllocationReport.list',
    sdkName: 'payroll.v1.costAllocationReport.list',
    path: '/open-apis/payroll/v1/cost_allocation_reports',
    httpMethod: 'GET',
    description: '[Feishu/Lark]-Payroll-cost report-Batch Get Cost Reports-Batch Get Cost Reports',
    accessTokens: ['tenant'],
    schema: {
        params: zod_1.z.object({
            page_size: zod_1.z.number().describe('paging size'),
            page_token: zod_1.z
                .string()
                .describe('Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups')
                .optional(),
            cost_allocation_plan_id: zod_1.z
                .string()
                .describe('Cost-sharing scheme ID, obtained through [Bulk query cost-sharing scheme] (/ssl: ttdoc/uAjLw4CM/ukTMukTMukTM/payroll-v1/cost_allocation_plan/list)'),
            pay_period: zod_1.z
                .string()
                .describe('During the period, the year and month corresponding to the cost allocation data are in the format yyyy-MM'),
            report_type: zod_1.z
                .number()
                .describe('report type Options:0(Default Default - By default, it indicates the type of report that has not been activated for Accrued and RealPay. After activating Accrued and RealPay, this type of report will not be able to be published),1(Accrued),2(Paid RealPay)'),
        }),
    },
};
exports.payrollV1DatasourceRecordQuery = {
    project: 'payroll',
    name: 'payroll.v1.datasourceRecord.query',
    sdkName: 'payroll.v1.datasourceRecord.query',
    path: '/open-apis/payroll/v1/datasource_records/query',
    httpMethod: 'POST',
    description: '[Feishu/Lark]-Payroll-datasource_record-query datasource records-1. Support through payroll_period (required), employment_id (optional) these two preset fields, batch query the data record list under the specified data source.2. The data source configuration information can be obtained from the  or "Feishu Personnel Background - Settings - Salary Data Settings - External Data Source Configuration" page',
    accessTokens: ['tenant', 'user'],
    schema: {
        data: zod_1.z.object({
            source_code: zod_1.z.string().describe('Data source code'),
            selected_fields: zod_1.z
                .array(zod_1.z.string())
                .describe('Specifies the data source field code for the query.1. If this field is not passed in, all data source fields are returned by default2. If passed in, in addition to returning the specified field, the system will return the value of emplyment_id, payroll_period fields by default')
                .optional(),
            field_filters: zod_1.z
                .array(zod_1.z.object({
                field_code: zod_1.z.string().describe('Field Encoding'),
                field_values: zod_1.z.array(zod_1.z.string()).describe('List of included field values').optional(),
            }))
                .describe('Query the list of conditions, and the relationship between multiple conditions, only supports the equivalent query of the two preset fields "employment_id" and "payroll_period":1. payroll_period- Required, up to 2 incoming.- Field type: field_type = 4 (date), format "yyyy-mm", example: "2024-01", note that it is not "yyyy-mm-dd"2. employment_id- Not required, up to 100 passes, field_type = 3 (text type).- This id is the basic information id of the employee in Feishu personnel, which can be obtained through ')
                .optional(),
        }),
        params: zod_1.z.object({
            page_size: zod_1.z.number(),
            page_token: zod_1.z
                .string()
                .describe('Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups')
                .optional(),
        }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.payrollV1DatasourceRecordSave = {
    project: 'payroll',
    name: 'payroll.v1.datasourceRecord.save',
    sdkName: 'payroll.v1.datasourceRecord.save',
    path: '/open-apis/payroll/v1/datasource_records/save',
    httpMethod: 'POST',
    description: '[Feishu/Lark]-Payroll-datasource_record-save datasource records-Refer to the data source configuration field format to save (create or update) data records in batches.1. The unique flag of the record is judged by the business primary key (employment_id + payroll_period)2. If there is no data record, 1 record will be inserted into this save.3. If a data record already exists, this save will overwrite and update the existing record (only the value of the incoming field is updated, and the value of the unpassed field is not updated). If the incoming data record has not changed, it will not be updated.4. If the update or insertion is successful, the number of records that have changed the data will be returned',
    accessTokens: ['tenant', 'user'],
    schema: {
        data: zod_1.z.object({
            source_code: zod_1.z
                .string()
                .describe('Data source code. External data source configuration information can be obtained from Or on the "Feishu Personnel Background - Settings - Salary Data Settings - External Data Source Configuration" page, get'),
            records: zod_1.z
                .array(zod_1.z.object({
                active_status: zod_1.z
                    .number()
                    .describe('The enable and deactivate status of the record. Description: After the data record is deactivated, it can still be saved and queried by the API, but it cannot be used for salary calculation. Options:1(active Enabled),2(in_active Deactivated)'),
                field_values: zod_1.z
                    .array(zod_1.z.object({
                    field_code: zod_1.z
                        .string()
                        .describe('Data source field code, please ensure that the field exists and is enabled. You can get it from the "Query External Data Source Settings" API or "Feishu Personnel Background - Settings - Salary Data Settings - External Data Source Configuration" page'),
                    value: zod_1.z
                        .string()
                        .describe('Field values, transmitted by string, are not allowed to enter empty strings, please ensure that the value of the field conforms to the type constraints.'),
                    field_type: zod_1.z
                        .number()
                        .describe('1. There is no need to pass this field, it is only for documentation.2. Field types can be obtained from datasources.fields.field_type in the return value of Query External Data Source Settings3. The format of the value passed by value must conform to the type constraints:- field_type = 1: Amount. eg: "12.23". Currently only RMB ¥is supported, and the accuracy beyond the setting will be rounded;- field_type = 2: numeric. eg: "12.23". Accuracies exceeding the setting are rounded.- field_type = 3: Text. eg: "I am a piece of text". The number of text characters cannot exceed 500, and the total number of characters in a recorded text cannot exceed 3000.- field_type = 4: Date. All custom fields except the payroll_period field preset by the system have the date format "yyy-mm-dd", example: "2024-01-01". But payroll_period represents the payroll period, accurate to the month, format "yyy-mm", example: "2024-01".- field_type = 5: percentage. Percentage "10" represents 10%, with a maximum of two decimal places, rounded')
                        .optional(),
                }))
                    .describe('List of recorded field values.1. Each record must be passed into the system preset fields "payroll_period", "employment_id".2. Other custom fields are passed in according to the request, and it is necessary to ensure that the written fields exist and are enabled in the configuration. The field code cannot be passed in repeatedly, and the value of the field must meet the constraints corresponding to the following types.3. Description of the two preset field values of "payroll_period" and "employment_id":- payroll_period. Represents the payroll period, accurate to the month, in the format "yyyy-mm" eg: "2024-01"- employment_id. This id is the basic information id of the employee in Feishu personnel, which can be obtained through '),
            }))
                .describe('List of records to be saved'),
        }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.payrollV1DatasourceList = {
    project: 'payroll',
    name: 'payroll.v1.datasource.list',
    sdkName: 'payroll.v1.datasource.list',
    path: '/open-apis/payroll/v1/datasources',
    httpMethod: 'GET',
    description: '[Feishu/Lark]-Payroll-datasource config-list datasource configs-Batch query Feishu personnel background: Settings - > Salary data settings - > External data source settings, the list of data source settings in',
    accessTokens: ['tenant', 'user'],
    schema: {
        params: zod_1.z.object({
            page_size: zod_1.z.number(),
            page_token: zod_1.z
                .string()
                .describe('Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups')
                .optional(),
        }),
        useUAT: zod_1.z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
    },
};
exports.payrollV1Tools = [
    exports.payrollV1CostAllocationPlanList,
    exports.payrollV1CostAllocationReportList,
    exports.payrollV1DatasourceRecordQuery,
    exports.payrollV1DatasourceRecordSave,
    exports.payrollV1DatasourceList,
];
