/**
 * Type definitions for Genesis system
 */
/**
 * Field types supported by Lark Base
 */
export type FieldType = 'text' | 'longText' | 'number' | 'currency' | 'percent' | 'date' | 'dateTime' | 'checkbox' | 'select' | 'multiSelect' | 'user' | 'multipleUsers' | 'link' | 'lookup' | 'formula' | 'rollup' | 'attachment' | 'email' | 'phone' | 'url' | 'rating' | 'progress' | 'createdTime' | 'createdBy' | 'lastModifiedTime' | 'lastModifiedBy' | 'autoNumber';
/**
 * Field definition for a table
 */
export interface FieldDefinition {
    name: string;
    type: FieldType;
    description?: string;
    required?: boolean;
    unique?: boolean;
    defaultValue?: any;
    options?: string[];
    linkedTable?: string;
    linkedField?: string;
    multiple?: boolean;
    formula?: string;
    aggregation?: 'count' | 'sum' | 'average' | 'max' | 'min';
    precision?: number;
    dateFormat?: string;
    includeTime?: boolean;
}
/**
 * Table definition
 */
export interface TableDefinition {
    name: string;
    description?: string;
    fields: FieldDefinition[];
    primaryField?: string;
}
/**
 * View types supported by Lark Base
 */
export type ViewType = 'grid' | 'kanban' | 'gallery' | 'calendar' | 'gantt' | 'form' | 'hierarchy';
/**
 * Filter operators
 */
export type FilterOperator = 'is' | 'isNot' | 'contains' | 'doesNotContain' | 'isEmpty' | 'isNotEmpty' | 'greaterThan' | 'lessThan' | 'greaterThanOrEqual' | 'lessThanOrEqual' | 'isWithin' | 'isBefore' | 'isAfter';
/**
 * View filter configuration
 */
export interface ViewFilter {
    field: string;
    operator: FilterOperator;
    value?: any;
}
/**
 * Sort configuration
 */
export interface SortConfig {
    field: string;
    order: 'asc' | 'desc';
}
/**
 * View configuration
 */
export interface ViewConfiguration {
    name: string;
    tableId: string;
    type: ViewType;
    description?: string;
    filters?: ViewFilter[];
    sortBy?: SortConfig[];
    groupBy?: string;
    colorBy?: string;
    coverField?: string;
    dateField?: string;
    startDateField?: string;
    endDateField?: string;
    parentField?: string;
    visibleFields?: string[];
    hiddenFields?: string[];
    fieldWidths?: Record<string, number>;
    rowHeight?: 'short' | 'medium' | 'tall' | 'extra_tall';
}
/**
 * Automation trigger types
 */
export type TriggerType = 'record_created' | 'record_updated' | 'field_updated' | 'record_matches_conditions' | 'form_submitted' | 'time_based' | 'webhook';
/**
 * Automation action types
 */
export type ActionType = 'update_record' | 'create_record' | 'create_records' | 'delete_record' | 'send_notification' | 'send_email' | 'create_task' | 'run_script' | 'call_webhook';
/**
 * Automation trigger configuration
 */
export interface AutomationTrigger {
    type: TriggerType;
    table?: string;
    field?: string;
    condition?: any;
    config?: Record<string, any>;
}
/**
 * Automation action configuration
 */
export interface AutomationAction {
    type: ActionType;
    config: Record<string, any>;
}
/**
 * Automation rule
 */
export interface AutomationRule {
    name: string;
    description?: string;
    enabled?: boolean;
    trigger: AutomationTrigger;
    conditions?: ViewFilter[];
    actions: AutomationAction[];
}
/**
 * Dashboard widget types
 */
export type WidgetType = 'metric' | 'chart' | 'table' | 'text' | 'image';
/**
 * Chart types for dashboard widgets
 */
export type ChartType = 'bar' | 'line' | 'pie' | 'donut' | 'area' | 'scatter' | 'heatmap';
/**
 * Dashboard widget configuration
 */
export interface DashboardWidget {
    type: WidgetType;
    title: string;
    description?: string;
    position?: {
        x: number;
        y: number;
    };
    size?: {
        width: number;
        height: number;
    };
    config: {
        table?: string;
        view?: string;
        field?: string;
        aggregation?: 'count' | 'sum' | 'average' | 'max' | 'min';
        groupBy?: string;
        filters?: ViewFilter[];
        chartType?: ChartType;
        dateField?: string;
        dateRange?: string;
        metric?: string;
        text?: string;
        imageUrl?: string;
    };
}
/**
 * Dashboard configuration
 */
export interface DashboardConfiguration {
    name: string;
    description?: string;
    widgets: DashboardWidget[];
    layout?: 'auto' | 'fixed';
    refreshInterval?: number;
}
/**
 * Genesis template definition
 */
export interface GenesisTemplate {
    id: string;
    name: string;
    description: string;
    category: 'sales' | 'operations' | 'hr' | 'finance' | 'development' | 'other';
    icon?: string;
    tables: TableDefinition[];
    views: ViewConfiguration[];
    dashboards: DashboardConfiguration[];
    automations: AutomationRule[];
    tags?: string[];
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    estimatedSetupTime?: number;
    requiredIntegrations?: string[];
}
/**
 * Genesis creation options
 */
export interface GenesisOptions {
    useRealAPI?: boolean;
    template?: string;
    enableAI?: boolean;
    autoCreateViews?: boolean;
    autoCreateDashboards?: boolean;
    autoCreateAutomations?: boolean;
    folderToken?: string;
    language?: 'en' | 'zh' | 'ja';
}
/**
 * Genesis analysis result
 */
export interface GenesisAnalysisResult {
    confidence: number;
    suggestedTables: TableDefinition[];
    suggestedViews: ViewConfiguration[];
    relationships: Array<{
        fromTable: string;
        fromField: string;
        toTable: string;
        toField: string;
        type: 'one-to-one' | 'one-to-many' | 'many-to-many';
    }>;
    aiFeatures: Array<{
        feature: string;
        description: string;
        benefit: string;
    }>;
    warnings?: string[];
    recommendations?: string[];
}
/**
 * Genesis creation result
 */
export interface GenesisCreationResult {
    success: boolean;
    baseToken?: string;
    baseUrl?: string;
    tables?: Array<{
        name: string;
        tableId: string;
        recordCount: number;
    }>;
    views?: Array<{
        name: string;
        viewId: string;
        type: ViewType;
    }>;
    dashboards?: Array<{
        name: string;
        dashboardId: string;
    }>;
    automations?: Array<{
        name: string;
        automationId: string;
        enabled: boolean;
    }>;
    error?: string;
    executionTime?: number;
}
