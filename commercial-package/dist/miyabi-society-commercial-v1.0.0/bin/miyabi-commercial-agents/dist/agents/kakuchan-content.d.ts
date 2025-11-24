/**
 * 書くちゃん - Content Creation Agent (Commercial)
 * コンテンツ制作・ライティング最適化Agent
 */
export interface ContentRequest {
    type: 'blog' | 'email' | 'social' | 'video-script' | 'whitepaper';
    topic: string;
    target_audience: string;
    tone: 'professional' | 'casual' | 'technical' | 'friendly';
    length?: number;
    keywords?: string[];
}
export interface GeneratedContent {
    title: string;
    content: string;
    seo_score: number;
    readability_score: number;
    keywords_used: string[];
    suggestions: string[];
}
/**
 * Content Creation Agent (Proprietary Algorithm)
 */
export declare class KakuchanAgent {
    /**
     * コンテンツ生成（独自アルゴリズム）
     */
    generateContent(request: ContentRequest): Promise<GeneratedContent>;
    private analyzeTopic;
    private identifyPersona;
    private generateStructure;
    private generateTitle;
    private generateBody;
    private calculateSEO;
    private calculateReadability;
    private extractUsedKeywords;
    private generateSuggestions;
}
//# sourceMappingURL=kakuchan-content.d.ts.map