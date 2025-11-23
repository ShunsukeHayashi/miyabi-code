"use strict";
/**
 * Commonly used tools in MCP
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.presetTools = exports.presetBusinessSuiteToolNames = exports.presetBusinessAnalyticsToolNames = exports.presetApprovalAutomationToolNames = exports.presetHRAutomationToolNames = exports.presetCompleteToolNames = exports.defaultToolNames = exports.presetGenesisToolNames = exports.presetCalendarToolNames = exports.presetTaskToolNames = exports.presetDocToolNames = exports.presetBaseRecordBatchToolNames = exports.presetBaseToolNames = exports.presetBaseCommonToolNames = exports.presetImToolNames = exports.presetContactToolNames = exports.presetLightToolNames = exports.PresetName = void 0;
var PresetName;
(function (PresetName) {
    /**
     * Default preset including IM, Bitable, Doc and Contact tools
     */
    PresetName["LIGHT"] = "preset.light";
    /**
     * Default preset including IM, Bitable, Doc and Contact tools
     */
    PresetName["DEFAULT"] = "preset.default";
    /**
     * IM related tools for chat and message operations
     */
    PresetName["IM_DEFAULT"] = "preset.im.default";
    /**
     * Base preset for base operations
     */
    PresetName["BASE_DEFAULT"] = "preset.base.default";
    /**
     * Base tools with batch operations
     */
    PresetName["BASE_BATCH"] = "preset.base.batch";
    /**
     * Document related tools for content and permission operations
     */
    PresetName["DOC_DEFAULT"] = "preset.doc.default";
    /**
     * Task management related tools
     */
    PresetName["TASK_DEFAULT"] = "preset.task.default";
    /**
     * Calendar event management tools
     */
    PresetName["CALENDAR_DEFAULT"] = "preset.calendar.default";
    /**
     * Genesis AI-powered base generation tools
     */
    PresetName["GENESIS_DEFAULT"] = "preset.genesis.default";
    /**
     * Complete set of all Lark functions
     */
    PresetName["COMPLETE_ALL"] = "preset.complete.all";
    // Custom Workflow Presets
    /**
     * HR automation and employee lifecycle management
     */
    PresetName["HR_AUTOMATION"] = "preset.hr.automation";
    /**
     * Approval workflow and process automation
     */
    PresetName["APPROVAL_AUTOMATION"] = "preset.approval.automation";
    /**
     * Business intelligence and analytics automation
     */
    PresetName["BUSINESS_ANALYTICS"] = "preset.business.analytics";
    /**
     * Complete business automation suite with custom workflows
     */
    PresetName["BUSINESS_SUITE"] = "preset.business.suite";
})(PresetName || (exports.PresetName = PresetName = {}));
// Common tool names used across multiple presets
const COMMON_TOOLS = {
    MESSAGE_LIST: 'im.v1.message.list',
    MESSAGE_CREATE: 'im.v1.message.create',
    CHAT_SEARCH: 'im.v1.chat.search',
    USER_BATCH_GET_ID: 'contact.v3.user.batchGetId',
    DOCUMENT_RAW_CONTENT: 'docx.v1.document.rawContent',
    DOCUMENT_IMPORT: 'docx.builtin.import',
    DOCUMENT_SEARCH: 'docx.builtin.search',
    RECORD_SEARCH: 'bitable.v1.appTableRecord.search',
    RECORD_BATCH_CREATE: 'bitable.v1.appTableRecord.batchCreate',
};
exports.presetLightToolNames = [
    COMMON_TOOLS.MESSAGE_LIST,
    COMMON_TOOLS.MESSAGE_CREATE,
    COMMON_TOOLS.CHAT_SEARCH,
    COMMON_TOOLS.USER_BATCH_GET_ID,
    COMMON_TOOLS.DOCUMENT_RAW_CONTENT,
    COMMON_TOOLS.DOCUMENT_IMPORT,
    COMMON_TOOLS.DOCUMENT_SEARCH,
    COMMON_TOOLS.RECORD_SEARCH,
    COMMON_TOOLS.RECORD_BATCH_CREATE,
];
exports.presetContactToolNames = [COMMON_TOOLS.USER_BATCH_GET_ID];
exports.presetImToolNames = [
    'im.v1.chat.create',
    'im.v1.chat.list',
    'im.v1.chatMembers.get',
    COMMON_TOOLS.MESSAGE_CREATE,
    COMMON_TOOLS.MESSAGE_LIST,
];
exports.presetBaseCommonToolNames = [
    'bitable.v1.app.create',
    'bitable.v1.appTable.create',
    'bitable.v1.appTable.list',
    'bitable.v1.appTableField.list',
    'bitable.v1.appTableField.create',
    COMMON_TOOLS.RECORD_SEARCH,
    'bitable.v1.appTableView.create',
    'bitable.v1.appTableView.patch',
];
exports.presetBaseToolNames = [
    ...exports.presetBaseCommonToolNames,
    'bitable.v1.appTableRecord.create',
    'bitable.v1.appTableRecord.update',
    'bitable.builtin.createEmergencyOrderView',
    'bitable.builtin.searchEmergencyOrders',
];
exports.presetBaseRecordBatchToolNames = [
    ...exports.presetBaseCommonToolNames,
    COMMON_TOOLS.RECORD_BATCH_CREATE,
    'bitable.v1.appTableRecord.batchUpdate',
];
exports.presetDocToolNames = [
    COMMON_TOOLS.DOCUMENT_RAW_CONTENT,
    COMMON_TOOLS.DOCUMENT_IMPORT,
    COMMON_TOOLS.DOCUMENT_SEARCH,
    'drive.v1.permissionMember.create',
];
exports.presetTaskToolNames = [
    'task.v2.task.create',
    'task.v2.task.patch',
    'task.v2.task.addMembers',
    'task.v2.task.addReminders',
];
exports.presetCalendarToolNames = [
    'calendar.v4.calendarEvent.create',
    'calendar.v4.calendarEvent.patch',
    'calendar.v4.calendarEvent.get',
    'calendar.v4.freebusy.list',
    'calendar.v4.calendar.primary',
];
exports.presetGenesisToolNames = [
    'genesis.builtin.create_base',
    'genesis.builtin.analyze_requirements',
    'genesis.builtin.generate_er_diagram',
    'genesis.builtin.optimize_base',
    'genesis.builtin.create_view',
    'genesis.builtin.create_dashboard',
    'genesis.builtin.create_automation',
    'genesis.builtin.create_filter_view',
    'genesis.builtin.list_templates',
    ...exports.presetBaseCommonToolNames, // Include base tools for Genesis to work with
    'bitable.v1.appTableView.create', // For creating views
    'bitable.v1.appDashboard.copy', // For copying dashboards
    'bitable.v1.appWorkflow.list', // For listing workflows
    'sheets.v3.spreadsheetSheetFilterView.create', // For creating filter views
];
exports.defaultToolNames = [
    ...exports.presetImToolNames,
    ...exports.presetBaseToolNames,
    ...exports.presetDocToolNames,
    ...exports.presetContactToolNames,
];
exports.presetCompleteToolNames = [
    // Complete function tools
    'complete.user.get_info',
    'complete.user.create',
    'complete.department.create',
    'complete.group.create',
    'complete.approval.create_instance',
    'complete.meeting_room.book',
    'complete.okr.create',
    'complete.hr.create_employee',
    // Include all other presets for comprehensive access
    ...exports.defaultToolNames,
    ...exports.presetGenesisToolNames,
    ...exports.presetTaskToolNames,
    ...exports.presetCalendarToolNames,
];
// Custom Workflow Preset Definitions
exports.presetHRAutomationToolNames = [
    // Custom HR workflow
    'employee.onboarding.complete',
    // Supporting HR tools
    'corehr.v1.employee.create',
    'corehr.v1.employee.update',
    'hire.v1.application.update',
    'contact.v3.user.batchGetId',
    'contact.v3.user.list',
    // Access management
    'drive.v1.permissionMember.create',
    'drive.v1.permissionMember.list',
    'bitable.v1.appRole.create',
    'bitable.v1.appRoleMember.create',
    // Communication
    'im.v1.message.create',
    'im.v1.chatMembers.create',
    // Data management
    'bitable.v1.appTableRecord.create',
    'bitable.v1.appTableRecord.search',
    'bitable.v1.appTableRecord.update',
];
exports.presetApprovalAutomationToolNames = [
    // Custom approval workflow
    'approval.smart_router.process',
    // Approval system tools
    'approval.v4.instance.create',
    'approval.v4.instance.approve',
    'approval.v4.instance.reject',
    'approval.v4.instance.cancel',
    // User management for routing
    'contact.v3.user.list',
    'contact.v3.user.batchGetId',
    'contact.v3.department.list',
    // Notifications
    'im.v1.message.create',
    'im.v1.chat.create',
    // Data tracking
    'bitable.v1.appTableRecord.create',
    'bitable.v1.appTableRecord.search',
    'bitable.v1.appTableRecord.update',
];
exports.presetBusinessAnalyticsToolNames = [
    // Custom BI workflow
    'business.intelligence.suite.analyze',
    // Data analysis tools
    'bitable.v1.appTableRecord.search',
    'bitable.v1.appTable.list',
    'search.v2.dataSearch',
    // AI and analytics
    'aily.v1.analysis.generate',
    'aily.v1.content.generate',
    // Report generation
    'docx.v1.document.create',
    'docx.v1.document.update',
    'sheets.v3.spreadsheet.create',
    // Distribution
    'im.v1.message.create',
    'drive.v1.permissionMember.create',
];
exports.presetBusinessSuiteToolNames = [
    // All custom workflows
    'employee.onboarding.complete',
    'approval.smart_router.process',
    'business.intelligence.suite.analyze',
    // Comprehensive supporting tools
    ...exports.presetHRAutomationToolNames.filter(tool => !tool.includes('employee.onboarding')),
    ...exports.presetApprovalAutomationToolNames.filter(tool => !tool.includes('approval.smart_router')),
    ...exports.presetBusinessAnalyticsToolNames.filter(tool => !tool.includes('business.intelligence')),
    // Additional enterprise tools
    'admin.v1.audit.log',
    'security_and_compliance.v1.policy.check',
    'tenant.v2.tenant.get',
    'performance.v1.review.create',
    'okr.v1.objective.create',
    'task.v2.task.create',
    'calendar.v4.calendarEvent.create',
];
exports.presetTools = {
    [PresetName.LIGHT]: exports.presetLightToolNames,
    [PresetName.DEFAULT]: exports.defaultToolNames,
    [PresetName.IM_DEFAULT]: exports.presetImToolNames,
    [PresetName.BASE_DEFAULT]: exports.presetBaseToolNames,
    [PresetName.BASE_BATCH]: exports.presetBaseRecordBatchToolNames,
    [PresetName.DOC_DEFAULT]: exports.presetDocToolNames,
    [PresetName.TASK_DEFAULT]: exports.presetTaskToolNames,
    [PresetName.CALENDAR_DEFAULT]: exports.presetCalendarToolNames,
    [PresetName.GENESIS_DEFAULT]: exports.presetGenesisToolNames,
    [PresetName.COMPLETE_ALL]: exports.presetCompleteToolNames,
    // Custom Workflow Presets
    [PresetName.HR_AUTOMATION]: exports.presetHRAutomationToolNames,
    [PresetName.APPROVAL_AUTOMATION]: exports.presetApprovalAutomationToolNames,
    [PresetName.BUSINESS_ANALYTICS]: exports.presetBusinessAnalyticsToolNames,
    [PresetName.BUSINESS_SUITE]: exports.presetBusinessSuiteToolNames,
};
