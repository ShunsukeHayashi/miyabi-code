/**
 * Structured Data Extractor
 * Markdown応答から構造化データを抽出する機能
 */
export interface ExtractionRule {
    name: string;
    pattern: RegExp;
    transform?: (match: string) => any;
    required?: boolean;
}
export interface ExtractionSchema {
    type: 'object' | 'array' | 'string' | 'number' | 'boolean';
    properties?: Record<string, ExtractionSchema>;
    items?: ExtractionSchema;
    rules?: ExtractionRule[];
    default?: any;
}
export interface ExtractionResult {
    success: boolean;
    data: any;
    errors: string[];
    warnings: string[];
    metadata: {
        sourceLength: number;
        extractedFields: number;
        confidence: number;
    };
}
/**
 * Structured Data Extractor
 * Markdown形式のAI応答から構造化データを抽出
 */
export declare class StructuredDataExtractor {
    private static readonly CODE_BLOCK_PATTERN;
    private static readonly JSON_PATTERN;
    private static readonly TABLE_PATTERN;
    private static readonly LIST_PATTERN;
    private static readonly HEADING_PATTERN;
    /**
     * Markdownテキストから構造化データを抽出
     */
    static extract(markdownText: string, schema?: ExtractionSchema): ExtractionResult;
    /**
     * JSONコードブロックからの抽出
     */
    private static extractFromCodeBlocks;
    /**
     * インラインJSONの抽出
     */
    private static extractInlineJSON;
    /**
     * テーブル形式からの抽出
     */
    private static extractFromTables;
    /**
     * リスト形式からの抽出
     */
    private static extractFromLists;
    /**
     * 構造化抽出（見出しベース）
     */
    private static extractStructured;
    /**
     * セクションコンテンツの解析
     */
    private static parseContent;
    /**
     * スキーマに対する検証
     */
    private static validateAgainstSchema;
    /**
     * 型検証
     */
    private static validateType;
    /**
     * フィールド数のカウント
     */
    private static countFields;
    /**
     * 信頼度の計算
     */
    static calculateConfidence(result: ExtractionResult): number;
    /**
     * 複数候補からの最適選択
     */
    static selectBestExtraction(candidates: ExtractionResult[]): ExtractionResult | null;
}
