/**
 * 数える - Analytics & Data Intelligence Agent (Commercial)
 * データ分析・インサイト抽出Agent
 */
export interface AnalyticsRequest {
    data_source: string;
    metrics: string[];
    time_period: string;
    goals?: string[];
}
export interface AnalyticsReport {
    summary: AnalyticsSummary;
    key_metrics: MetricAnalysis[];
    insights: Insight[];
    recommendations: Recommendation[];
    predictions: Prediction[];
}
interface AnalyticsSummary {
    period: string;
    total_events: number;
    unique_users: number;
    conversion_rate: number;
    revenue: number;
}
interface MetricAnalysis {
    metric: string;
    current_value: number;
    previous_value: number;
    change_percentage: number;
    trend: 'up' | 'down' | 'stable';
    status: 'good' | 'warning' | 'critical';
}
interface Insight {
    category: string;
    insight: string;
    impact: 'high' | 'medium' | 'low';
    confidence: number;
}
interface Recommendation {
    action: string;
    expected_impact: string;
    priority: 'high' | 'medium' | 'low';
    effort: 'low' | 'medium' | 'high';
}
interface Prediction {
    metric: string;
    next_period_value: number;
    confidence_interval: [number, number];
    factors: string[];
}
export declare class KazoeruAgent {
    analyzeData(request: AnalyticsRequest): Promise<AnalyticsReport>;
    private generateMockData;
    private createSummary;
    private analyzeMetrics;
    private extractInsights;
    private generateRecommendations;
    private predictFuture;
    /**
     * PDCA サイクル分析
     */
    analyzePDCACycle(data: any): Promise<any>;
}
export {};
//# sourceMappingURL=kazoeru-analytics.d.ts.map