/**
 * つぶやくん - SNS Strategy Agent (Commercial)
 * SNS戦略立案・投稿最適化Agent
 */
export interface SNSStrategyParams {
    platform: 'twitter' | 'instagram' | 'youtube' | 'tiktok' | 'linkedin';
    audience: string;
    goals: string[];
    current_followers?: number;
    budget?: number;
}
export interface SNSStrategy {
    platform: string;
    content_pillars: string[];
    posting_schedule: PostingSchedule[];
    engagement_tactics: string[];
    growth_projections: GrowthProjection;
    recommended_tools: string[];
}
interface PostingSchedule {
    day: string;
    time: string;
    content_type: string;
    topic: string;
}
interface GrowthProjection {
    month_1: number;
    month_3: number;
    month_6: number;
    engagement_rate: string;
}
/**
 * SNS Strategy Agent (Proprietary Algorithm)
 */
export declare class TsubuyakunAgent {
    /**
     * SNS戦略生成（独自アルゴリズム - バイナリ化時に保護）
     */
    generateStrategy(params: SNSStrategyParams): Promise<SNSStrategy>;
    /**
     * プラットフォーム最適化（独自アルゴリズム）
     */
    private optimizeForPlatform;
    /**
     * オーディエンス分析（独自アルゴリズム）
     */
    private analyzeAudience;
    private extractInterests;
    private extractDemographic;
    private extractPainPoints;
    /**
     * コンテンツピラー生成（独自アルゴリズム）
     */
    private generateContentPillars;
    /**
     * 投稿スケジュール最適化（独自アルゴリズム）
     */
    private optimizePostingSchedule;
    private selectContentType;
    /**
     * エンゲージメント戦術生成（独自アルゴリズム）
     */
    private generateEngagementTactics;
    /**
     * 成長予測モデル（独自アルゴリズム）
     */
    private predictGrowth;
    /**
     * ツール推奨（独自アルゴリズム）
     */
    private recommendTools;
}
export {};
//# sourceMappingURL=tsubuyakun-sns.d.ts.map