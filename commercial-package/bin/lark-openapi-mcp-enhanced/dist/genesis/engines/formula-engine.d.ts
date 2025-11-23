/**
 * Formula Engine
 * Lark Base数式の自動生成と検証機能
 */
export interface FormulaField {
    name: string;
    tableName: string;
    formula: string;
    returnType: 'text' | 'number' | 'date' | 'boolean' | 'array';
    description?: string;
    dependencies: string[];
    validation?: {
        required: boolean;
        min?: number;
        max?: number;
        pattern?: string;
    };
}
export interface FormulaTemplate {
    id: string;
    name: string;
    category: 'calculation' | 'aggregation' | 'logical' | 'date' | 'text' | 'lookup';
    description: string;
    formula: string;
    parameters: FormulaParameter[];
    example: string;
    returnType: string;
}
export interface FormulaParameter {
    name: string;
    type: 'field' | 'value' | 'table';
    required: boolean;
    description: string;
    defaultValue?: any;
}
export interface FormulaValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
    optimizations: string[];
    dependencies: string[];
    returnType: string;
    complexity: 'low' | 'medium' | 'high';
}
export interface FormulaGenerationRequest {
    intent: string;
    sourceFields: Array<{
        name: string;
        type: string;
        tableName: string;
    }>;
    targetType: string;
    constraints?: any;
    examples?: Array<{
        input: any;
        expectedOutput: any;
    }>;
}
/**
 * Formula Engine
 * Lark Base数式の自動生成、検証、最適化
 */
export declare class FormulaEngine {
    private static readonly FUNCTION_LIBRARY;
    /**
     * 意図から数式を自動生成
     */
    static generateFormula(request: FormulaGenerationRequest): {
        success: boolean;
        formula: string;
        description: string;
        dependencies: string[];
        confidence: number;
        alternatives: Array<{
            formula: string;
            description: string;
            confidence: number;
        }>;
    };
    /**
     * 意図の解析
     */
    private static parseIntent;
    /**
     * パターンマッチング
     */
    private static matchPatterns;
    /**
     * 数式候補の生成
     */
    private static generateCandidates;
    /**
     * 数式の検証
     */
    static validateFormula(formula: string, availableFields: Array<{
        name: string;
        type: string;
        tableName: string;
    }>): FormulaValidationResult;
    /**
     * 構文チェック
     */
    private static checkSyntax;
    /**
     * フィールド参照チェック
     */
    private static checkFieldReferences;
    /**
     * 関数チェック
     */
    private static checkFunctions;
    /**
     * 戻り値タイプの推定
     */
    private static inferReturnType;
    /**
     * 複雑度の評価
     */
    private static evaluateComplexity;
    /**
     * 最適化提案
     */
    private static suggestOptimizations;
    /**
     * 改善提案
     */
    private static generateSuggestions;
    /**
     * 部分式の抽出
     */
    private static extractSubExpressions;
    /**
     * 型の互換性チェック
     */
    private static isCompatibleType;
    /**
     * 数式テンプレートの取得
     */
    static getFormulaTemplates(category?: string): FormulaTemplate[];
    /**
     * カスタム数式テンプレートの追加
     */
    static addCustomTemplate(template: FormulaTemplate): void;
    /**
     * 数式の実行シミュレーション
     */
    static simulateFormula(formula: string, sampleData: Record<string, any>): {
        success: boolean;
        result: any;
        error?: string;
    };
}
