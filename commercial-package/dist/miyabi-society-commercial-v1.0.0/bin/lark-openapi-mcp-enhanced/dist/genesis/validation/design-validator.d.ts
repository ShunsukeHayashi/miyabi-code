/**
 * Design Validation Engine
 * 生成された設計図の整合性チェック機能
 */
export interface ValidationRule {
    id: string;
    name: string;
    category: 'structural' | 'logical' | 'performance' | 'security' | 'compliance' | 'best_practice';
    severity: 'error' | 'warning' | 'info' | 'suggestion';
    description: string;
    validator: (design: DesignArtifact) => ValidationResult;
    autoFix?: (design: DesignArtifact) => AutoFixResult;
}
export interface DesignArtifact {
    type: 'requirements' | 'entities' | 'base_structure' | 'business_logic' | 'workflows' | 'ui_design' | 'implementation_plan';
    id: string;
    name: string;
    version: string;
    content: any;
    metadata: {
        generatedAt: number;
        generatedBy: string;
        dependencies: string[];
        tags: string[];
    };
}
export interface ValidationResult {
    ruleId: string;
    passed: boolean;
    severity: ValidationRule['severity'];
    message: string;
    details?: string;
    affectedElements: string[];
    suggestions: string[];
    autoFixAvailable: boolean;
}
export interface AutoFixResult {
    success: boolean;
    changes: Array<{
        type: 'add' | 'remove' | 'modify';
        target: string;
        oldValue?: any;
        newValue?: any;
        description: string;
    }>;
    updatedDesign: DesignArtifact;
    warnings: string[];
}
export interface ValidationReport {
    designId: string;
    designType: string;
    timestamp: number;
    overallScore: number;
    status: 'passed' | 'warning' | 'failed';
    summary: {
        total: number;
        passed: number;
        warnings: number;
        errors: number;
        suggestions: number;
    };
    results: ValidationResult[];
    recommendations: string[];
    autoFixSuggestions: Array<{
        ruleId: string;
        description: string;
        impact: 'low' | 'medium' | 'high';
    }>;
}
/**
 * Design Validation Engine
 * 設計アーティファクトの包括的検証システム
 */
export declare class DesignValidationEngine {
    private static readonly VALIDATION_RULES;
    /**
     * 設計アーティファクトの包括的検証
     */
    static validateDesign(design: DesignArtifact, options?: {
        includeCategories?: ValidationRule['category'][];
        excludeRules?: string[];
        autoFix?: boolean;
    }): ValidationReport;
    /**
     * バッチ検証
     */
    static validateMultipleDesigns(designs: DesignArtifact[]): Array<ValidationReport>;
    /**
     * 設計依存関係の検証
     */
    static validateDesignDependencies(designs: DesignArtifact[]): {
        valid: boolean;
        issues: Array<{
            type: 'missing_dependency' | 'circular_dependency' | 'version_mismatch';
            design: string;
            dependency: string;
            description: string;
        }>;
    };
    /**
     * 具体的な検証ルール実装
     */
    private static validateRequirementsCompleteness;
    private static validateEntityNaming;
    private static validatePrimaryKeys;
    private static validateRelationshipIntegrity;
    private static validateFieldTypeConsistency;
    private static validateTableSizeOptimization;
    private static validateSensitiveDataProtection;
    private static validateWorkflowLogic;
    private static validateUIAccessibility;
    private static validateImplementationFeasibility;
    /**
     * 自動修正の実装例
     */
    private static fixEntityNaming;
    private static fixPrimaryKeys;
    /**
     * ユーティリティメソッド
     */
    private static registerRule;
    private static getApplicableRules;
    private static createSkipResult;
    private static calculateSummary;
    private static calculateOverallScore;
    private static determineOverallStatus;
    private static generateRecommendations;
    private static assessAutoFixImpact;
    private static toPascalCase;
    /**
     * カスタムルールの追加
     */
    static addCustomRule(rule: ValidationRule): void;
    /**
     * 利用可能なルール一覧の取得
     */
    static getAvailableRules(): ValidationRule[];
    /**
     * ルールの有効化/無効化
     */
    static toggleRule(ruleId: string, enabled: boolean): boolean;
}
