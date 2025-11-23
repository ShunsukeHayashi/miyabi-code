/**
 * Template Management System
 * よく使われる設計パターンのテンプレート化
 */
import { BaseSpec } from '../integrations/lark-base-builder';
export interface TemplateMetadata {
    id: string;
    name: string;
    description: string;
    category: TemplateCategory;
    tags: string[];
    complexity: 'simple' | 'medium' | 'complex';
    estimatedTime: number;
    version: string;
    author: string;
    lastUpdated: Date;
    usageCount: number;
}
export type TemplateCategory = 'crm' | 'project-management' | 'inventory' | 'hr' | 'finance' | 'e-commerce' | 'support' | 'marketing' | 'custom';
export interface Template {
    metadata: TemplateMetadata;
    baseSpec: BaseSpec;
    variables: TemplateVariable[];
    instructions: string;
    examples: TemplateExample[];
}
export interface TemplateVariable {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'select';
    description: string;
    required: boolean;
    defaultValue?: any;
    options?: string[];
    validation?: {
        min?: number;
        max?: number;
        pattern?: string;
    };
}
export interface TemplateExample {
    name: string;
    description: string;
    variables: Record<string, any>;
    preview?: string;
}
/**
 * Template Manager
 * テンプレート管理システム
 */
export declare class TemplateManager {
    private templates;
    private categories;
    constructor();
    /**
     * ビルトインテンプレートの初期化
     */
    private initializeBuiltinTemplates;
    /**
     * テンプレートの登録
     */
    registerTemplate(template: Template): void;
    /**
     * テンプレートの取得
     */
    getTemplate(id: string): Template | undefined;
    /**
     * カテゴリ別テンプレート取得
     */
    getTemplatesByCategory(category: TemplateCategory): Template[];
    /**
     * 全テンプレート取得
     */
    getAllTemplates(): Template[];
    /**
     * テンプレート検索
     */
    searchTemplates(query: string): Template[];
    /**
     * テンプレートの適用
     */
    applyTemplate(templateId: string, variables: Record<string, any>): BaseSpec;
    /**
     * 変数の検証
     */
    private validateTemplateVariables;
    /**
     * 変数値の検証
     */
    private validateVariableValue;
    /**
     * テンプレート処理
     */
    private processTemplate;
    /**
     * 変数の置換
     */
    private replaceVariables;
    /**
     * CRM テンプレート作成
     */
    private createCRMTemplate;
    /**
     * プロジェクト管理テンプレート作成
     */
    private createProjectManagementTemplate;
    /**
     * 在庫管理テンプレート作成
     */
    private createInventoryTemplate;
    /**
     * HR管理テンプレート作成
     */
    private createHRTemplate;
    /**
     * E-commerceテンプレート作成
     */
    private createEcommerceTemplate;
    /**
     * サポートチケットテンプレート作成
     */
    private createSupportTemplate;
    /**
     * カスタムテンプレート作成
     */
    createCustomTemplate(spec: {
        name: string;
        description: string;
        category: TemplateCategory;
        baseSpec: BaseSpec;
        variables?: TemplateVariable[];
        instructions?: string;
    }): Template;
    /**
     * テンプレート統計の取得
     */
    getStatistics(): {
        totalTemplates: number;
        categories: Record<TemplateCategory, number>;
        mostUsed: Template[];
        recentlyUpdated: Template[];
    };
}
