/**
 * =============================================================================
 * Custom Workflow Tools Index
 * =============================================================================
 * Export all custom workflow tools for integrated business process automation
 * =============================================================================
 */
export { employeeOnboardingComplete } from './employee-onboarding';
export { smartApprovalRouter } from './smart-approval-router';
export { businessIntelligenceSuite } from './business-intelligence-suite';
export declare const CUSTOM_WORKFLOW_TOOLS: {
    readonly EMPLOYEE_ONBOARDING: "employee.onboarding.complete";
    readonly SMART_APPROVAL_ROUTER: "approval.smart_router.process";
    readonly BUSINESS_INTELLIGENCE: "business.intelligence.suite.analyze";
};
export declare const CUSTOM_WORKFLOW_PRESETS: {
    readonly HR_AUTOMATION: readonly ["employee.onboarding.complete", "corehr.v1.employee.create", "contact.v3.user.batchGetId", "drive.v1.permissionMember.create", "im.v1.chatMembers.create", "bitable.v1.appTableRecord.create"];
    readonly APPROVAL_AUTOMATION: readonly ["approval.smart_router.process", "approval.v4.instance.create", "contact.v3.user.list", "im.v1.message.create", "bitable.v1.appTableRecord.search"];
    readonly BUSINESS_ANALYTICS: readonly ["business.intelligence.suite.analyze", "bitable.v1.appTableRecord.search", "search.v2.dataSearch", "aily.v1.analysis.generate", "docx.v1.document.create"];
    readonly COMPLETE_AUTOMATION: readonly ["employee.onboarding.complete", "approval.smart_router.process", "business.intelligence.suite.analyze", "contact.v3.user.batchGetId", "drive.v1.permissionMember.create", "drive.v1.permissionMember.list", "bitable.v1.appTableRecord.create", "bitable.v1.appTableRecord.search", "bitable.v1.appTableRecord.update", "im.v1.message.create", "im.v1.chatMembers.create", "approval.v4.instance.create", "docx.v1.document.create", "aily.v1.analysis.generate"];
};
/**
 * Custom Workflow Tool Categories
 * Organized by business function for easy discovery
 */
export declare const WORKFLOW_CATEGORIES: {
    readonly HUMAN_RESOURCES: {
        readonly description: "Employee lifecycle and HR process automation";
        readonly tools: readonly ["employee.onboarding.complete"];
        readonly use_cases: readonly ["New employee onboarding automation", "Employee offboarding (future)", "Performance review orchestration (future)", "Training program management (future)"];
    };
    readonly PROCESS_AUTOMATION: {
        readonly description: "Business process and approval workflow automation";
        readonly tools: readonly ["approval.smart_router.process"];
        readonly use_cases: readonly ["Intelligent approval routing", "Escalation management", "Compliance checking", "Workflow optimization"];
    };
    readonly BUSINESS_INTELLIGENCE: {
        readonly description: "Data analytics and business intelligence automation";
        readonly tools: readonly ["business.intelligence.suite.analyze"];
        readonly use_cases: readonly ["Executive dashboard generation", "Trend analysis and forecasting", "Anomaly detection", "Automated reporting"];
    };
};
/**
 * Integration Guidelines
 * How to integrate custom workflows with existing tools
 */
export declare const INTEGRATION_PATTERNS: {
    readonly SEQUENTIAL: {
        readonly description: "Execute workflows in sequence for complex processes";
        readonly example: readonly ["employee.onboarding.complete", "approval.smart_router.process", "business.intelligence.suite.analyze"];
    };
    readonly EVENT_DRIVEN: {
        readonly description: "Trigger workflows based on business events";
        readonly example: {
            readonly on_employee_start: "employee.onboarding.complete";
            readonly on_approval_request: "approval.smart_router.process";
            readonly on_monthly_close: "business.intelligence.suite.analyze";
        };
    };
    readonly CONDITIONAL: {
        readonly description: "Execute different workflows based on conditions";
        readonly example: {
            readonly if_new_hire: "employee.onboarding.complete";
            readonly if_approval_needed: "approval.smart_router.process";
            readonly if_analysis_scheduled: "business.intelligence.suite.analyze";
        };
    };
};
