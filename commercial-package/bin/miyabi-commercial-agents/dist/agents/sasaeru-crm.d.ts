/**
 * 支える - CRM & Customer Success Agent (Commercial)
 * 顧客関係管理・カスタマーサクセスAgent
 */
export interface CustomerProfile {
    customer_id?: string;
    company_name: string;
    industry: string;
    size: 'small' | 'medium' | 'large' | 'enterprise';
    stage: 'lead' | 'opportunity' | 'customer' | 'advocate';
}
export interface CRMStrategy {
    customer_segmentation: CustomerSegment[];
    engagement_plan: EngagementActivity[];
    retention_tactics: RetentionTactic[];
    upsell_opportunities: UpsellOpportunity[];
    health_score: HealthScore;
}
interface CustomerSegment {
    segment_name: string;
    criteria: string[];
    size: number;
    ltv: number;
    priority: 'high' | 'medium' | 'low';
}
interface EngagementActivity {
    activity_type: string;
    frequency: string;
    channel: string;
    objective: string;
}
interface RetentionTactic {
    tactic: string;
    target_segment: string;
    expected_impact: string;
    implementation_effort: 'low' | 'medium' | 'high';
}
interface UpsellOpportunity {
    customer_segment: string;
    product_service: string;
    estimated_revenue: number;
    probability: number;
    next_steps: string[];
}
interface HealthScore {
    overall_score: number;
    engagement_score: number;
    satisfaction_score: number;
    usage_score: number;
    churn_risk: 'low' | 'medium' | 'high';
}
export declare class SasaeruAgent {
    optimizeCRM(profile: CustomerProfile): Promise<CRMStrategy>;
    private segmentCustomers;
    private createEngagementPlan;
    private generateRetentionTactics;
    private identifyUpsellOpportunities;
    private calculateHealthScore;
    private calculateEngagementScore;
    private calculateSatisfactionScore;
    private calculateUsageScore;
    /**
     * チャーン予測（機密アルゴリズム）
     */
    predictChurn(customerData: any): Promise<any>;
}
export {};
//# sourceMappingURL=sasaeru-crm.d.ts.map