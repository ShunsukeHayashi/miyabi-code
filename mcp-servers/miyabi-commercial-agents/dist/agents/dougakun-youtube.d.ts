/**
 * 動画くん - YouTube Optimization Agent (Commercial)
 * YouTube チャンネル運用最適化Agent
 */
export interface YouTubeRequest {
    channel_name: string;
    niche: string;
    current_subscribers?: number;
    upload_frequency?: string;
    goals: string[];
}
export interface YouTubeStrategy {
    channel_optimization: ChannelOptimization;
    content_calendar: ContentPlan[];
    growth_tactics: string[];
    monetization_roadmap: MonetizationPlan;
    analytics_kpis: string[];
}
interface ChannelOptimization {
    channel_description: string;
    tags: string[];
    thumbnail_guidelines: string[];
    seo_keywords: string[];
}
interface ContentPlan {
    week: number;
    video_title: string;
    video_type: string;
    target_keywords: string[];
    estimated_views: number;
}
interface MonetizationPlan {
    current_stage: string;
    next_milestone: string;
    revenue_streams: string[];
    estimated_monthly_revenue: number;
}
export declare class DougakunAgent {
    optimizeYouTubeChannel(request: YouTubeRequest): Promise<YouTubeStrategy>;
    private optimizeChannel;
    private generateContentCalendar;
    private generateGrowthTactics;
    private createMonetizationPlan;
    private identifyKPIs;
}
export {};
//# sourceMappingURL=dougakun-youtube.d.ts.map