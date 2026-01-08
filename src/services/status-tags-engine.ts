/**
 * L-Step Status Tags Engine
 * Phase 2: Customer Lifecycle Management for PPAL Learners
 *
 * Implements automated status tag transitions and learning analytics
 * Author: まなぶん (Course Society Curriculum Designer)
 */

import { LearningMetrics, StatusTag, StatusTransition, TransitionCondition } from '../types/learning-types';
import { CustomerProfile } from '../types/customer-types';
import { NotificationService } from './notification-service';
import { AnalyticsService } from './analytics-service';

export class StatusTagsEngine {
  private notificationService: NotificationService;
  private analyticsService: AnalyticsService;

  constructor(
    notificationService: NotificationService,
    analyticsService: AnalyticsService
  ) {
    this.notificationService = notificationService;
    this.analyticsService = analyticsService;
  }

  /**
   * Status Tag Definitions
   */
  static readonly STATUS_TAGS = {
    ST_001: '🌱 Learning:Active',
    ST_002: '📚 Learning:Progressing',
    ST_003: '🏆 Learning:Mastery',
    ST_004: '⚠️ Risk:Declining',
    ST_005: '🔄 Risk:Re-engagement',
    ST_006: '📤 Status:Churned'
  } as const;

  /**
   * Automated Transition Rules
   */
  private readonly transitionRules: StatusTransition[] = [
    // Progression Rules (Happy Path)
    {
      from: ['ST_001'],
      to: 'ST_002',
      conditions: [
        { metric: 'modules_completed', operator: '>=', value: 2 },
        { metric: 'assessment_score_avg', operator: '>=', value: 70 },
        { metric: 'days_since_enrollment', operator: '<=', value: 42 }
      ],
      manual_override: true,
      notification: { team: 'education', priority: 'low', template: 'progression_celebration' }
    },
    {
      from: ['ST_002'],
      to: 'ST_003',
      conditions: [
        { metric: 'curriculum_completion_rate', operator: '>=', value: 90 },
        { metric: 'final_assessment_score', operator: '>=', value: 85 },
        { metric: 'real_world_project_approved', operator: '==', value: true },
        { metric: 'community_contribution_score', operator: '>=', value: 50 }
      ],
      manual_override: true,
      notification: { team: 'education', priority: 'medium', template: 'mastery_achievement' }
    },

    // Risk Detection Rules
    {
      from: ['ST_001', 'ST_002'],
      to: 'ST_004',
      conditions: [
        { metric: 'days_since_last_login', operator: '>=', value: 5 },
        { metric: 'lesson_completion_rate_last_14days', operator: '<', value: 40 },
        { metric: 'community_engagement_last_14days', operator: '==', value: 0 }
      ],
      manual_override: false,
      notification: { team: 'retention', priority: 'high', template: 'at_risk_alert' }
    },
    {
      from: ['ST_003'],
      to: 'ST_004',
      conditions: [
        { metric: 'days_since_last_login', operator: '>=', value: 14 },
        { metric: 'community_participation_decline', operator: '>=', value: 50 }
      ],
      manual_override: false,
      notification: { team: 'retention', priority: 'high', template: 'master_at_risk' }
    },

    // Re-engagement Rules
    {
      from: ['ST_004'],
      to: 'ST_005',
      conditions: [
        { metric: 'customer_tier', operator: 'in', value: ['Enterprise', 'Pro'] },
        { metric: 'ltv_score', operator: '>=', value: 1000 },
        { metric: 'days_in_declining_status', operator: '>=', value: 3 }
      ],
      manual_override: true,
      notification: { team: 'retention', priority: 'urgent', template: 'reengagement_campaign' }
    },

    // Churn Rules
    {
      from: ['ST_004', 'ST_005'],
      to: 'ST_006',
      conditions: [
        { metric: 'days_since_last_activity', operator: '>=', value: 30 },
        { metric: 'reengagement_campaign_response', operator: '==', value: false }
      ],
      manual_override: true,
      notification: { team: 'retention', priority: 'medium', template: 'churn_confirmed' }
    },

    // Recovery Rules
    {
      from: ['ST_004', 'ST_005'],
      to: 'ST_001',
      conditions: [
        { metric: 'login_frequency_last_7days', operator: '>=', value: 3 },
        { metric: 'lesson_completion_last_7days', operator: '>=', value: 2 },
        { metric: 'engagement_score_improvement', operator: '>=', value: 25 }
      ],
      manual_override: true,
      notification: { team: 'retention', priority: 'medium', template: 'recovery_celebration' }
    }
  ];

  /**
   * Evaluate customer for status tag transitions
   */
  async evaluateCustomerStatus(customerId: string): Promise<StatusTagEvaluation> {
    try {
      // Get current customer profile and metrics
      const customer = await this.getCustomerProfile(customerId);
      const metrics = await this.getLearningMetrics(customerId);
      const currentTag = customer.current_status_tag;

      // Find applicable transition rules
      const applicableRules = this.transitionRules.filter(rule =>
        rule.from.includes(currentTag)
      );

      // Evaluate each rule
      const evaluationResults: RuleEvaluation[] = [];

      for (const rule of applicableRules) {
        const ruleResult = await this.evaluateTransitionRule(rule, metrics);
        evaluationResults.push({
          rule,
          conditions_met: ruleResult.conditionsMet,
          confidence_score: ruleResult.confidenceScore,
          blocking_conditions: ruleResult.blockingConditions
        });
      }

      // Find the highest confidence transition
      const recommendedTransition = evaluationResults
        .filter(result => result.conditions_met)
        .sort((a, b) => b.confidence_score - a.confidence_score)[0];

      return {
        customer_id: customerId,
        current_tag: currentTag,
        recommended_transition: recommendedTransition?.rule.to,
        confidence_score: recommendedTransition?.confidence_score || 0,
        evaluation_results: evaluationResults,
        requires_manual_review: this.requiresManualReview(evaluationResults),
        next_evaluation_date: this.calculateNextEvaluationDate(currentTag, metrics)
      };

    } catch (error) {
      console.error(`Error evaluating customer status for ${customerId}:`, error);
      throw error;
    }
  }

  /**
   * Apply status tag transition
   */
  async applyStatusTransition(
    customerId: string,
    newTag: StatusTag,
    reason: string,
    appliedBy: string = 'auto'
  ): Promise<StatusTransitionResult> {
    try {
      const customer = await this.getCustomerProfile(customerId);
      const previousTag = customer.current_status_tag;

      // Validate transition
      const isValidTransition = await this.validateTransition(previousTag, newTag, customerId);
      if (!isValidTransition.valid) {
        throw new Error(`Invalid transition: ${isValidTransition.reason}`);
      }

      // Apply the transition
      const transition = await this.saveStatusTransition({
        customer_id: customerId,
        from_tag: previousTag,
        to_tag: newTag,
        applied_by: appliedBy,
        reason: reason,
        automation_trigger: appliedBy === 'auto' ? reason : null
      });

      // Trigger associated actions
      await this.executeTransitionActions(customerId, previousTag, newTag);

      // Send notifications
      await this.sendTransitionNotifications(customerId, transition);

      // Log analytics event
      await this.analyticsService.trackStatusTransition({
        customer_id: customerId,
        from_tag: previousTag,
        to_tag: newTag,
        applied_by: appliedBy,
        transition_time_ms: Date.now() - customer.tag_applied_date.getTime()
      });

      return {
        success: true,
        transition_id: transition.id,
        previous_tag: previousTag,
        new_tag: newTag,
        actions_triggered: await this.getTriggeredActions(newTag)
      };

    } catch (error) {
      console.error(`Error applying status transition for ${customerId}:`, error);
      return {
        success: false,
        error: error.message,
        previous_tag: customer.current_status_tag,
        new_tag: newTag
      };
    }
  }

  /**
   * Execute automated daily evaluation
   */
  async runDailyEvaluation(): Promise<DailyEvaluationReport> {
    console.log('Starting daily status tag evaluation...');

    const startTime = Date.now();
    const results: EvaluationSummary[] = [];

    try {
      // Get all active customers
      const activeCustomers = await this.getActiveCustomers();
      console.log(`Evaluating ${activeCustomers.length} customers...`);

      // Process in batches to avoid overwhelming the system
      const batchSize = 50;
      for (let i = 0; i < activeCustomers.length; i += batchSize) {
        const batch = activeCustomers.slice(i, i + batchSize);

        const batchPromises = batch.map(async (customer) => {
          try {
            const evaluation = await this.evaluateCustomerStatus(customer.id);

            // Auto-apply high-confidence transitions
            if (evaluation.recommended_transition &&
                evaluation.confidence_score >= 0.8 &&
                !evaluation.requires_manual_review) {

              const result = await this.applyStatusTransition(
                customer.id,
                evaluation.recommended_transition,
                'Daily automated evaluation',
                'auto'
              );

              return {
                customer_id: customer.id,
                action: 'transition_applied',
                from_tag: evaluation.current_tag,
                to_tag: evaluation.recommended_transition,
                confidence_score: evaluation.confidence_score
              };
            } else if (evaluation.requires_manual_review) {
              // Queue for manual review
              await this.queueForManualReview(customer.id, evaluation);

              return {
                customer_id: customer.id,
                action: 'queued_for_review',
                current_tag: evaluation.current_tag,
                reason: 'Requires manual review'
              };
            } else {
              return {
                customer_id: customer.id,
                action: 'no_change',
                current_tag: evaluation.current_tag
              };
            }
          } catch (error) {
            console.error(`Error processing customer ${customer.id}:`, error);
            return {
              customer_id: customer.id,
              action: 'error',
              error: error.message
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const report: DailyEvaluationReport = {
        execution_date: new Date(),
        total_customers_evaluated: activeCustomers.length,
        transitions_applied: results.filter(r => r.action === 'transition_applied').length,
        manual_reviews_queued: results.filter(r => r.action === 'queued_for_review').length,
        errors: results.filter(r => r.action === 'error').length,
        execution_time_ms: Date.now() - startTime,
        results: results
      };

      console.log('Daily evaluation completed:', {
        total: report.total_customers_evaluated,
        transitions: report.transitions_applied,
        reviews: report.manual_reviews_queued,
        errors: report.errors,
        time: `${report.execution_time_ms}ms`
      });

      return report;

    } catch (error) {
      console.error('Daily evaluation failed:', error);
      throw error;
    }
  }

  /**
   * Generate status tag analytics dashboard data
   */
  async getStatusTagDashboard(dateRange: DateRange): Promise<StatusTagDashboard> {
    try {
      const [
        distribution,
        transitions,
        retention_metrics,
        engagement_trends,
        cohort_analysis
      ] = await Promise.all([
        this.getStatusDistribution(dateRange),
        this.getTransitionAnalytics(dateRange),
        this.getRetentionMetrics(dateRange),
        this.getEngagementTrends(dateRange),
        this.getCohortAnalysis(dateRange)
      ]);

      return {
        date_range: dateRange,
        current_distribution: distribution,
        transition_analytics: transitions,
        retention_metrics: retention_metrics,
        engagement_trends: engagement_trends,
        cohort_analysis: cohort_analysis,
        key_insights: await this.generateKeyInsights(distribution, transitions),
        recommendations: await this.generateRecommendations(retention_metrics)
      };

    } catch (error) {
      console.error('Error generating status tag dashboard:', error);
      throw error;
    }
  }

  // Private helper methods

  private async evaluateTransitionRule(
    rule: StatusTransition,
    metrics: LearningMetrics
  ): Promise<RuleEvaluationResult> {
    const conditionResults = await Promise.all(
      rule.conditions.map(condition => this.evaluateCondition(condition, metrics))
    );

    const conditionsMet = conditionResults.every(result => result.met);
    const confidenceScore = conditionResults.reduce((sum, result) => sum + result.confidence, 0) / conditionResults.length;
    const blockingConditions = conditionResults
      .filter(result => !result.met)
      .map(result => result.condition);

    return {
      conditionsMet,
      confidenceScore,
      blockingConditions
    };
  }

  private async evaluateCondition(
    condition: TransitionCondition,
    metrics: LearningMetrics
  ): Promise<ConditionEvaluationResult> {
    const metricValue = this.getMetricValue(condition.metric, metrics);

    let met = false;
    let confidence = 0;

    switch (condition.operator) {
      case '>=':
        met = metricValue >= condition.value;
        confidence = met ? 1.0 : Math.max(0, metricValue / condition.value);
        break;
      case '<=':
        met = metricValue <= condition.value;
        confidence = met ? 1.0 : Math.max(0, condition.value / metricValue);
        break;
      case '==':
        met = metricValue === condition.value;
        confidence = met ? 1.0 : 0;
        break;
      case '<':
        met = metricValue < condition.value;
        confidence = met ? 1.0 : Math.max(0, 1 - (metricValue / condition.value));
        break;
      case 'in':
        met = Array.isArray(condition.value) && condition.value.includes(metricValue);
        confidence = met ? 1.0 : 0;
        break;
    }

    return {
      condition,
      met,
      confidence,
      actual_value: metricValue,
      expected_value: condition.value
    };
  }

  private requiresManualReview(evaluationResults: RuleEvaluation[]): boolean {
    // Require manual review for complex cases
    const hasConflictingRules = evaluationResults.filter(r => r.conditions_met).length > 1;
    const hasLowConfidenceTransition = evaluationResults.some(r =>
      r.conditions_met && r.confidence_score < 0.7
    );
    const hasHighValueCustomerAtRisk = evaluationResults.some(r =>
      r.rule.to === 'ST_004' && r.conditions_met
    );

    return hasConflictingRules || hasLowConfidenceTransition || hasHighValueCustomerAtRisk;
  }

  private async executeTransitionActions(
    customerId: string,
    fromTag: StatusTag,
    toTag: StatusTag
  ): Promise<void> {
    // Define actions for each status tag
    const actionMap: { [key in StatusTag]: TransitionAction[] } = {
      ST_001: [
        { type: 'email', template: 'welcome_active_learner' },
        { type: 'community', action: 'add_to_beginner_group' }
      ],
      ST_002: [
        { type: 'email', template: 'progression_celebration' },
        { type: 'unlock_content', content_id: 'advanced_modules' },
        { type: 'community', action: 'promote_to_intermediate' }
      ],
      ST_003: [
        { type: 'email', template: 'mastery_achievement' },
        { type: 'certification', action: 'issue_certificate' },
        { type: 'community', action: 'add_expert_badge' },
        { type: 'opportunity', action: 'invite_to_mentor_program' }
      ],
      ST_004: [
        { type: 'alert', team: 'retention', urgency: 'high' },
        { type: 'email', template: 'personal_checkin' },
        { type: 'extend_access', days: 14 }
      ],
      ST_005: [
        { type: 'human_outreach', type: 'phone_call' },
        { type: 'personalized_content', action: 'create_custom_path' },
        { type: 'incentive', type: 'extended_access' }
      ],
      ST_006: [
        { type: 'archive', action: 'move_to_winback_sequence' },
        { type: 'analytics', action: 'record_churn_reason' }
      ]
    };

    const actions = actionMap[toTag] || [];

    for (const action of actions) {
      try {
        await this.executeAction(customerId, action);
      } catch (error) {
        console.error(`Error executing action for customer ${customerId}:`, error);
      }
    }
  }

  // Additional helper methods would be implemented here...

  private async getCustomerProfile(customerId: string): Promise<CustomerProfile> {
    // Implementation to fetch customer profile
    throw new Error('Method not implemented');
  }

  private async getLearningMetrics(customerId: string): Promise<LearningMetrics> {
    // Implementation to fetch learning metrics
    throw new Error('Method not implemented');
  }

  private getMetricValue(metric: string, metrics: LearningMetrics): any {
    // Implementation to extract specific metric values
    throw new Error('Method not implemented');
  }

  private async executeAction(customerId: string, action: TransitionAction): Promise<void> {
    // Implementation for executing specific actions
    throw new Error('Method not implemented');
  }
}

// Type definitions would be in separate type files
interface StatusTagEvaluation {
  customer_id: string;
  current_tag: StatusTag;
  recommended_transition?: StatusTag;
  confidence_score: number;
  evaluation_results: RuleEvaluation[];
  requires_manual_review: boolean;
  next_evaluation_date: Date;
}

interface StatusTransitionResult {
  success: boolean;
  transition_id?: string;
  previous_tag: StatusTag;
  new_tag: StatusTag;
  actions_triggered?: string[];
  error?: string;
}

interface DailyEvaluationReport {
  execution_date: Date;
  total_customers_evaluated: number;
  transitions_applied: number;
  manual_reviews_queued: number;
  errors: number;
  execution_time_ms: number;
  results: EvaluationSummary[];
}

interface StatusTagDashboard {
  date_range: DateRange;
  current_distribution: { [tag: string]: number };
  transition_analytics: TransitionAnalytics;
  retention_metrics: RetentionMetrics;
  engagement_trends: EngagementTrends;
  cohort_analysis: CohortAnalysis;
  key_insights: string[];
  recommendations: string[];
}

export default StatusTagsEngine;