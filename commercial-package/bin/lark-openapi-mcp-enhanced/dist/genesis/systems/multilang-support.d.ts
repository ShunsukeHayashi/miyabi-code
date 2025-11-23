/**
 * Multi-language Support System
 * 英語/中国語での要求仕様対応
 */
export type SupportedLanguage = 'en' | 'zh' | 'ja';
export interface LanguageConfig {
    code: SupportedLanguage;
    name: string;
    nativeName: string;
    direction: 'ltr' | 'rtl';
    dateFormat: string;
    numberFormat: {
        decimal: string;
        thousands: string;
        currency: string;
    };
}
export interface TranslationKey {
    key: string;
    translations: Record<SupportedLanguage, string>;
    context?: string;
    category?: string;
}
export interface LocalizedPrompt {
    language: SupportedLanguage;
    prompt: string;
    variables: string[];
    examples: string[];
}
export interface LanguageDetectionResult {
    detectedLanguage: SupportedLanguage;
    confidence: number;
    alternatives: Array<{
        language: SupportedLanguage;
        confidence: number;
    }>;
}
/**
 * Multi-language Support Manager
 * 多言語対応管理システム
 */
export declare class MultilangSupport {
    private languageConfigs;
    private translations;
    private promptTemplates;
    constructor();
    /**
     * 言語設定の初期化
     */
    private initializeLanguageConfigs;
    /**
     * 翻訳キーの初期化
     */
    private initializeTranslations;
    /**
     * プロンプトテンプレートの初期化
     */
    private initializePromptTemplates;
    /**
     * 言語設定の取得
     */
    getLanguageConfig(language: SupportedLanguage): LanguageConfig | undefined;
    /**
     * サポートされている言語の取得
     */
    getSupportedLanguages(): SupportedLanguage[];
    /**
     * 翻訳の取得
     */
    translate(key: string, language: SupportedLanguage, fallbackLanguage?: SupportedLanguage): string;
    /**
     * 翻訳キーの追加
     */
    addTranslation(key: string, translations: Record<SupportedLanguage, string>, context?: string, category?: string): void;
    /**
     * プロンプトテンプレートの追加
     */
    addPromptTemplate(templateId: string, prompts: LocalizedPrompt[]): void;
    /**
     * ローカライズされたプロンプトの取得
     */
    getLocalizedPrompt(templateId: string, language: SupportedLanguage, variables?: Record<string, string>): string;
    /**
     * 言語検出（簡易版）
     */
    detectLanguage(text: string): LanguageDetectionResult;
    /**
     * テキストの正規化
     */
    normalizeText(text: string, language: SupportedLanguage): string;
    /**
     * 中国語テキストの正規化
     */
    private normalizeChineseText;
    /**
     * 日本語テキストの正規化
     */
    private normalizeJapaneseText;
    /**
     * 英語テキストの正規化
     */
    private normalizeEnglishText;
    /**
     * 日付のローカライゼーション
     */
    formatDate(date: Date, language: SupportedLanguage): string;
    /**
     * 数値のローカライゼーション
     */
    formatNumber(number: number, language: SupportedLanguage, options?: {
        decimals?: number;
        currency?: boolean;
    }): string;
    /**
     * 翻訳統計の取得
     */
    getTranslationStatistics(): {
        totalKeys: number;
        languages: Record<SupportedLanguage, number>;
        categories: Record<string, number>;
    };
}
