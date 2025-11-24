/**
 * 広める - Marketing Automation Agent (Commercial)
 * マーケティング施策最適化Agent
 */
export interface MarketingCampaign {
    product: string;
    target_market: string;
    budget: number;
    duration_months: number;
    objectives: string[];
}
export interface MarketingPlan {
    campaign_strategy: CampaignStrategy;
    channel_mix: ChannelAllocation[];
    timeline: CampaignPhase[];
    expected_roi: ROIProjection;
    tactics: string[];
}
interface CampaignStrategy {
    positioning: string;
    value_proposition: string;
    differentiation: string[];
    messaging_framework: string[];
}
interface ChannelAllocation {
    channel: string;
    budget_allocation: number;
    expected_reach: number;
    priority: 'high' | 'medium' | 'low';
}
interface CampaignPhase {
    phase: string;
    duration: string;
    activities: string[];
    kpis: string[];
}
interface ROIProjection {
    expected_revenue: number;
    cost: number;
    roi_percentage: number;
    payback_period_months: number;
}
export declare class HiromeruAgent {
    createMarketingPlan(campaign: MarketingCampaign): Promise<MarketingPlan>;
    private developStrategy;
    private optimizeChannelMix;
    private createTimeline;
    private projectROI;
    private generateTactics;
}
export {};
//# sourceMappingURL=hiromeru-marketing.d.ts.map