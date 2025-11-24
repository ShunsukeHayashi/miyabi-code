/**
 * Lark Base API Integration Layer
 * 自動Base/Table/Field作成機能
 */
import { LarkMcpTool } from '../../mcp-tool';
export interface BaseSpec {
    name: string;
    description: string;
    tables: TableSpec[];
    automations?: AutomationSpec[];
}
export interface TableSpec {
    name: string;
    description: string;
    fields: FieldSpec[];
    views?: ViewSpec[];
    permissions?: PermissionSpec[];
}
export interface FieldSpec {
    name: string;
    type: 'text' | 'number' | 'date' | 'checkbox' | 'singleSelect' | 'multiSelect' | 'attachment' | 'user' | 'formula' | 'phone' | 'email' | 'url' | 'rating' | 'currency' | 'percent' | 'duration' | 'created_time' | 'modified_time' | 'created_by' | 'modified_by';
    description?: string;
    required?: boolean;
    options?: {
        choices?: string[];
        formula?: string;
        format?: string;
        precision?: number;
        showAs?: string;
        timeFormat?: string;
        dateFormat?: string;
        includeTime?: boolean;
    };
}
export interface ViewSpec {
    name: string;
    type: 'grid' | 'kanban' | 'calendar' | 'gallery' | 'form' | 'timeline';
    description?: string;
    config?: {
        groupBy?: string;
        sortBy?: Array<{
            field: string;
            direction: 'asc' | 'desc';
        }>;
        filters?: Array<{
            field: string;
            condition: string;
            value: any;
        }>;
        fieldOrder?: string[];
        hiddenFields?: string[];
    };
}
export interface AutomationSpec {
    name: string;
    description: string;
    trigger: {
        type: 'record_created' | 'record_updated' | 'field_changed' | 'scheduled' | 'manual';
        conditions?: any;
        schedule?: string;
    };
    actions: Array<{
        type: 'create_record' | 'update_record' | 'send_notification' | 'send_email' | 'webhook' | 'script';
        config: any;
    }>;
}
export interface PermissionSpec {
    role: string;
    level: 'view' | 'comment' | 'edit' | 'admin';
    restrictions?: {
        fields?: string[];
        records?: any;
    };
}
export interface BuildResult {
    success: boolean;
    baseId?: string;
    tableIds?: Record<string, string>;
    fieldIds?: Record<string, Record<string, string>>;
    viewIds?: Record<string, Record<string, string>>;
    errors: string[];
    warnings: string[];
    metadata: {
        buildTime: number;
        tablesCreated: number;
        fieldsCreated: number;
        viewsCreated: number;
        automationsCreated: number;
    };
}
/**
 * Lark Base Builder
 * 設計仕様からLark Baseを自動構築
 */
export declare class LarkBaseBuilder {
    private larkClient;
    private retryAttempts;
    private retryDelay;
    constructor(larkClient: LarkMcpTool, options?: {
        retryAttempts?: number;
        retryDelay?: number;
    });
    /**
     * Base仕様からLark Baseを構築
     */
    buildBase(spec: BaseSpec): Promise<BuildResult>;
    /**
     * Base作成
     */
    private createBase;
    /**
     * テーブル作成
     */
    private createTable;
    /**
     * フィールド作成
     */
    private createField;
    /**
     * ビュー作成
     */
    private createView;
    /**
     * 自動化作成
     */
    private createAutomation;
    /**
     * フィールド仕様をLark API形式に変換
     */
    private convertFieldSpecs;
    /**
     * フィールドタイプをLark API形式にマッピング
     */
    private mapFieldType;
    /**
     * フィールドプロパティを構築
     */
    private buildFieldProperty;
    /**
     * ビュープロパティを構築
     */
    private buildViewProperty;
    /**
     * リトライ機能付き実行
     */
    private executeWithRetry;
    /**
     * Base削除
     */
    deleteBase(baseId: string): Promise<boolean>;
    /**
     * Base情報取得
     */
    getBaseInfo(baseId: string): Promise<any>;
    /**
     * ビルド進捗を取得
     */
    getBuildProgress(result: BuildResult): {
        percentage: number;
        currentStep: string;
        estimatedTimeRemaining: number;
    };
}
