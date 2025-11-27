/**
 * つぶやくん - SNS Strategy Agent (Commercial)
 * SNS戦略立案・投稿最適化Agent + X投稿・アカウント分析機能
 *
 * 新機能:
 * - X (Twitter) への投稿生成・投稿
 * - アカウント分析（どの投稿が伸びるか予測）
 */
export interface SNSStrategyParams {
    platform: 'twitter' | 'instagram' | 'youtube' | 'tiktok' | 'linkedin';
    audience: string;
    goals: string[];
    current_followers?: number;
    budget?: number;
}
export interface XPostParams {
    content?: string;
    topic?: string;
    style?: 'informative' | 'engaging' | 'promotional' | 'thread' | 'question';
    include_hashtags?: boolean;
    max_length?: number;
    language?: 'ja' | 'en';
}
export interface XPostResult {
    generated_post: string;
    character_count: number;
    hashtags: string[];
    suggested_time: string;
    engagement_prediction: {
        likes: string;
        retweets: string;
        replies: string;
        score: number;
    };
    tweet_id?: string;
    posted?: boolean;
}
export interface XAccountAnalysisParams {
    account_url: string;
    analysis_depth?: 'basic' | 'detailed' | 'comprehensive';
}
export interface XAccountAnalysis {
    account: {
        username: string;
        followers: number;
        following: number;
        tweet_count: number;
    };
    content_analysis: {
        top_performing_topics: string[];
        best_posting_times: string[];
        optimal_content_types: string[];
        hashtag_effectiveness: string[];
    };
    engagement_patterns: {
        average_likes: number;
        average_retweets: number;
        average_replies: number;
        engagement_rate: string;
    };
    recommendations: {
        content_suggestions: string[];
        timing_suggestions: string[];
        growth_tactics: string[];
    };
    predicted_viral_topics: string[];
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
 * X投稿・アカウント分析機能搭載
 */
export declare class TsubuyakunAgent {
    private twitterConfig;
    constructor();
    /**
     * Twitter API設定の読み込み
     */
    private loadTwitterConfig;
    /**
     * X投稿を生成（AI最適化）
     */
    generateXPost(params: XPostParams): Promise<XPostResult>;
    /**
     * Xに投稿を実行
     */
    postToX(params: XPostParams): Promise<XPostResult>;
    /**
     * Twitter API v2 でツイート送信
     */
    private sendTweet;
    /**
     * Xアカウント分析
     */
    analyzeXAccount(params: XAccountAnalysisParams): Promise<XAccountAnalysis>;
    /**
     * URLからユーザー名を抽出
     */
    private extractUsernameFromUrl;
    /**
     * アカウント情報取得
     */
    private fetchAccountInfo;
    /**
     * コンテンツパターン分析
     */
    private analyzeContentPatterns;
    /**
     * エンゲージメントパターン分析
     */
    private analyzeEngagementPatterns;
    /**
     * アカウントレコメンデーション生成
     */
    private generateAccountRecommendations;
    /**
     * バイラルトピック予測
     */
    private predictViralTopics;
    /**
     * 投稿内容生成（スタイル別）
     */
    private generatePostContent;
    /**
     * 最適ハッシュタグ生成
     */
    private generateOptimalHashtags;
    /**
     * エンゲージメント予測
     */
    private predictEngagement;
    /**
     * 最適投稿時間取得
     */
    private getOptimalPostingTime;
    /**
     * OAuth署名生成
     */
    private generateOAuthSignature;
    /**
     * ノンス生成
     */
    private generateNonce;
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