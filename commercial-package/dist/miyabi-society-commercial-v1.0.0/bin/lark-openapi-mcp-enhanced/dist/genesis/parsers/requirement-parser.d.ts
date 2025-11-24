/**
 * Requirement Specification Parser
 * 要求仕様フォームの自動解析機能
 */
export interface RequirementForm {
    title: string;
    description: string;
    businessDomain: string;
    stakeholders: string[];
    objectives: string[];
    functionalRequirements: FunctionalRequirement[];
    nonFunctionalRequirements: NonFunctionalRequirement[];
    constraints: string[];
    assumptions: string[];
    success_criteria: string[];
    timeline?: string;
    budget?: string;
    priority: 'high' | 'medium' | 'low';
    complexity: 1 | 2 | 3 | 4 | 5;
}
export interface FunctionalRequirement {
    id: string;
    title: string;
    description: string;
    actor: string;
    preconditions: string[];
    steps: string[];
    postconditions: string[];
    priority: 'must' | 'should' | 'could' | 'wont';
    complexity: 1 | 2 | 3 | 4 | 5;
    dependencies: string[];
    acceptance_criteria: string[];
}
export interface NonFunctionalRequirement {
    category: 'performance' | 'security' | 'usability' | 'reliability' | 'scalability' | 'maintainability' | 'compatibility';
    description: string;
    metric?: string;
    target?: string;
    priority: 'high' | 'medium' | 'low';
}
export interface ParseResult {
    success: boolean;
    form: RequirementForm | null;
    errors: string[];
    warnings: string[];
    confidence: number;
    metadata: {
        parseTime: number;
        sourceType: 'freeform' | 'structured' | 'template';
        extractedSections: number;
    };
}
/**
 * Requirement Specification Parser
 * 自然言語の要求仕様を構造化フォームに変換
 */
export declare class RequirementParser {
    private static readonly SECTION_PATTERNS;
    private static readonly USER_STORY_PATTERN;
    private static readonly ACCEPTANCE_CRITERIA_PATTERN;
    private static readonly LIST_ITEM_PATTERN;
    private static readonly NUMBERED_LIST_PATTERN;
    /**
     * 要求仕様テキストを解析
     */
    static parse(text: string): ParseResult;
    /**
     * ソースタイプの判定
     */
    private static determineSourceType;
    /**
     * 基本情報の抽出
     */
    private static extractBasicInfo;
    /**
     * ステークホルダーの抽出
     */
    private static extractStakeholders;
    /**
     * 目標の抽出
     */
    private static extractObjectives;
    /**
     * 機能要求の抽出
     */
    private static extractFunctionalRequirements;
    /**
     * 非機能要求の抽出
     */
    private static extractNonFunctionalRequirements;
    /**
     * 要求テキストの抽出
     */
    private static extractRequirementTexts;
    /**
     * 個別要求の解析
     */
    private static parseIndividualRequirement;
    /**
     * ユーザーストーリーの抽出
     */
    private static extractUserStories;
    /**
     * 制約の抽出
     */
    private static extractConstraints;
    /**
     * 前提条件の抽出
     */
    private static extractAssumptions;
    /**
     * 成功基準の抽出
     */
    private static extractSuccessCriteria;
    /**
     * リストアイテムの抽出ヘルパー
     */
    private static extractListItems;
    /**
     * メタデータの抽出
     */
    private static extractMetadata;
    /**
     * 信頼度の計算
     */
    private static calculateConfidence;
    /**
     * フォームの検証
     */
    private static validateForm;
    /**
     * フォームからテキストへの逆変換
     */
    static formToText(form: RequirementForm): string;
}
