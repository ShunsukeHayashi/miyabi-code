/**
 * Workflow Automation Builder
 * Lark自動化ワークフローの設計・実装機能
 */
export interface WorkflowTrigger {
    type: 'record_created' | 'record_updated' | 'field_changed' | 'scheduled' | 'manual' | 'webhook' | 'form_submitted';
    tableId?: string;
    fieldId?: string;
    conditions?: WorkflowCondition[];
    schedule?: {
        type: 'daily' | 'weekly' | 'monthly' | 'custom';
        time?: string;
        dayOfWeek?: number;
        dayOfMonth?: number;
        cronExpression?: string;
    };
    webhookConfig?: {
        url: string;
        method: 'GET' | 'POST';
        headers?: Record<string, string>;
    };
}
export interface WorkflowCondition {
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'is_empty' | 'is_not_empty';
    value: any;
    logicalOperator?: 'and' | 'or';
}
export interface WorkflowAction {
    type: 'create_record' | 'update_record' | 'delete_record' | 'send_notification' | 'send_email' | 'webhook' | 'script' | 'approval_request' | 'assign_task';
    config: {
        delay?: number;
        targetTableId?: string;
        fieldMappings?: Record<string, any>;
        recordId?: string;
        recipients?: string[];
        message?: string;
        title?: string;
        emailTemplate?: string;
        subject?: string;
        body?: string;
        attachments?: string[];
        url?: string;
        method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
        headers?: Record<string, string>;
        payload?: any;
        scriptCode?: string;
        scriptLanguage?: 'javascript' | 'python';
        approvers?: string[];
        approvalType?: 'any' | 'all' | 'sequential';
        assignee?: string;
        dueDate?: string;
        priority?: 'low' | 'medium' | 'high';
    };
}
export interface WorkflowDefinition {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    trigger: WorkflowTrigger;
    actions: WorkflowAction[];
    errorHandling?: {
        retryCount: number;
        retryDelay: number;
        onError: 'stop' | 'continue' | 'notify';
        errorNotificationRecipients?: string[];
    };
    metadata: {
        createdAt: number;
        updatedAt: number;
        version: string;
        author: string;
    };
}
export interface WorkflowTemplate {
    id: string;
    name: string;
    category: 'approval' | 'notification' | 'data_sync' | 'automation' | 'integration';
    description: string;
    template: Omit<WorkflowDefinition, 'id' | 'metadata'>;
    parameters: Array<{
        name: string;
        type: 'string' | 'number' | 'boolean' | 'table' | 'field' | 'user';
        required: boolean;
        description: string;
        defaultValue?: any;
    }>;
}
export interface WorkflowExecutionResult {
    success: boolean;
    workflowId: string;
    executionId: string;
    triggeredAt: number;
    completedAt?: number;
    status: 'running' | 'completed' | 'failed' | 'cancelled';
    results: Array<{
        actionType: string;
        success: boolean;
        result?: any;
        error?: string;
        executedAt: number;
    }>;
    logs: string[];
    errors: string[];
}
/**
 * Workflow Automation Builder
 * ビジネスロジックから自動化ワークフローを設計・構築
 */
export declare class WorkflowBuilder {
    private static readonly WORKFLOW_TEMPLATES;
    /**
     * ビジネスルールからワークフローを自動生成
     */
    static generateWorkflow(businessRules: Array<{
        id: string;
        name: string;
        description: string;
        condition: string;
        action: string;
        table: string;
    }>): {
        success: boolean;
        workflows: WorkflowDefinition[];
        errors: string[];
    };
    /**
     * ビジネスルールをワークフローに変換
     */
    private static convertRuleToWorkflow;
    /**
     * 条件をトリガーに変換
     */
    private static parseConditionToTrigger;
    /**
     * アクションをワークフローアクションに変換
     */
    private static parseActionToWorkflowActions;
    /**
     * テンプレートからワークフローを生成
     */
    static generateFromTemplate(templateId: string, parameters: Record<string, any>): {
        success: boolean;
        workflow?: WorkflowDefinition;
        errors: string[];
    };
    /**
     * ワークフローの検証
     */
    static validateWorkflow(workflow: WorkflowDefinition): {
        isValid: boolean;
        errors: string[];
        warnings: string[];
        suggestions: string[];
    };
    /**
     * トリガーの検証
     */
    private static validateTrigger;
    /**
     * アクションの検証
     */
    private static validateAction;
    /**
     * ワークフローテンプレートの取得
     */
    static getTemplates(category?: string): WorkflowTemplate[];
    /**
     * カスタムテンプレートの追加
     */
    static addCustomTemplate(template: WorkflowTemplate): void;
    /**
     * ワークフローの実行シミュレーション
     */
    static simulateExecution(workflow: WorkflowDefinition, sampleData: any): WorkflowExecutionResult;
    /**
     * アクション実行のシミュレーション
     */
    private static simulateAction;
    /**
     * ワークフローの最適化提案
     */
    static optimizeWorkflow(workflow: WorkflowDefinition): {
        optimizedWorkflow: WorkflowDefinition;
        optimizations: Array<{
            type: 'performance' | 'reliability' | 'maintainability';
            description: string;
            impact: 'low' | 'medium' | 'high';
        }>;
    };
}
