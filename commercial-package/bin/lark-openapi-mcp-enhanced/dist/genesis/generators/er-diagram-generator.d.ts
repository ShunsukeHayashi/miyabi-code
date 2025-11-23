/**
 * ER Diagram Generator
 * Mermaid記法によるER図自動生成機能
 */
export interface Entity {
    name: string;
    displayName?: string;
    description?: string;
    attributes: Attribute[];
    primaryKey?: string;
    constraints?: Constraint[];
}
export interface Attribute {
    name: string;
    type: string;
    nullable?: boolean;
    unique?: boolean;
    defaultValue?: any;
    description?: string;
    length?: number;
    precision?: number;
    scale?: number;
}
export interface Relationship {
    fromEntity: string;
    toEntity: string;
    type: 'one-to-one' | 'one-to-many' | 'many-to-many';
    fromCardinality: string;
    toCardinality: string;
    relationshipName?: string;
    description?: string;
    attributes?: Attribute[];
}
export interface Constraint {
    type: 'primary_key' | 'foreign_key' | 'unique' | 'check' | 'not_null';
    columns: string[];
    referencedTable?: string;
    referencedColumns?: string[];
    name?: string;
    checkCondition?: string;
}
export interface ERDiagramConfig {
    title?: string;
    theme?: 'default' | 'base' | 'dark' | 'forest' | 'neutral';
    direction?: 'TB' | 'BT' | 'LR' | 'RL';
    showAttributes?: boolean;
    showDataTypes?: boolean;
    showConstraints?: boolean;
    groupEntities?: boolean;
    entityGroups?: Record<string, string[]>;
}
export interface GenerationResult {
    success: boolean;
    mermaidCode: string;
    svgCode?: string;
    entities: Entity[];
    relationships: Relationship[];
    errors: string[];
    warnings: string[];
    metadata: {
        entityCount: number;
        relationshipCount: number;
        attributeCount: number;
        generateTime: number;
    };
}
/**
 * ER Diagram Generator
 * エンティティとリレーションシップからMermaidのER図を生成
 */
export declare class ERDiagramGenerator {
    private static readonly MERMAID_TYPES;
    private static readonly CARDINALITY_SYMBOLS;
    /**
     * エンティティとリレーションシップからER図を生成
     */
    static generateDiagram(entities: Entity[], relationships: Relationship[], config?: ERDiagramConfig): GenerationResult;
    /**
     * 入力データの検証
     */
    private static validateInput;
    /**
     * エンティティの正規化
     */
    private static normalizeEntities;
    /**
     * リレーションシップの正規化
     */
    private static normalizeRelationships;
    /**
     * データ型の正規化
     */
    private static normalizeDataType;
    /**
     * カーディナリティの推定
     */
    private static inferCardinality;
    /**
     * Mermaidコードの生成
     */
    private static generateMermaidCode;
    /**
     * エンティティコードの生成
     */
    private static generateEntityCode;
    /**
     * 属性コードの生成
     */
    private static generateAttributeCode;
    /**
     * リレーションシップコードの生成
     */
    private static generateRelationshipCode;
    /**
     * リレーションシップシンボルの取得
     */
    private static getRelationshipSymbol;
    /**
     * SQLからER図への変換
     */
    static fromSQL(sqlScript: string): GenerationResult;
    /**
     * テーブル定義のパース
     */
    private static parseTableDefinition;
    /**
     * JSON SchemaからER図への変換
     */
    static fromJSONSchema(schema: any): GenerationResult;
    /**
     * JSON Schemaエンティティのパース
     */
    private static parseJSONSchemaEntity;
    /**
     * JSON Schemaタイプのマッピング
     */
    private static mapJSONSchemaType;
    /**
     * ER図の最適化
     */
    static optimizeDiagram(result: GenerationResult): GenerationResult;
    /**
     * ER図の検証
     */
    static validateDiagram(result: GenerationResult): {
        isValid: boolean;
        issues: Array<{
            type: 'error' | 'warning' | 'suggestion';
            message: string;
            entity?: string;
            relationship?: string;
        }>;
    };
}
