/**
 * Enterprise Account Plan Types
 * Generated from .miyabi/schemas/account-plan.json
 * 
 * Usage:
 * import { AccountPlan, Keyperson, BDRContext } from './account-plan.types';
 */

// ==========================================
// Enums
// ==========================================

export type CompanyScale = 'enterprise' | 'mid_market' | 'smb';
export type MaturityLevel = 'high' | 'mid' | 'low';
export type RoleType = 'decision_maker' | 'influencer' | 'user' | 'blocker';
export type TriggerEventType = 'org_change' | 'new_initiative' | 'ma' | 'leadership_change' | 'product_launch' | 'other';
export type ApproachChannel = 'linkedin' | 'email' | 'event' | 'referral' | 'cold_call';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

// ==========================================
// Core Interfaces
// ==========================================

export interface PainPoint {
  category: string;
  description: string;
  source: string;
  confidence: ConfidenceLevel;
}

export interface TriggerEvent {
  event: string;
  date: string; // ISO date
  type: TriggerEventType;
  relevance: string;
  source_url?: string;
}

export interface Company {
  name: string;
  industry: string;
  scale: CompanyScale;
  employee_count?: number;
  revenue?: string;
  fiscal_year_end?: string;
  headquarters?: string;
  website?: string;
  saas_stack?: string[];
  strategic_focus?: string[];
  pain_points?: PainPoint[];
  trigger_events?: TriggerEvent[];
}

// ==========================================
// Organization Structure
// ==========================================

export interface HiringSignal {
  position: string;
  skills_required: string[];
  implication: string;
}

export interface Department {
  name: string;
  parent?: string | null;
  mission?: string;
  maturity_level?: MaturityLevel;
  related_departments?: string[];
  hiring_signals?: HiringSignal[];
}

// ==========================================
// Keyperson & BDR Context
// ==========================================

export interface SNSLinks {
  linkedin?: string;
  twitter?: string;
  note?: string;
  qiita?: string;
  speakerdeck?: string;
}

export interface EventAppearance {
  event_name: string;
  date: string;
  topic?: string;
}

export interface BDRContext {
  priority: 1 | 2 | 3 | 4 | 5;
  why_you: string;
  why_now: string;
  ice_breaker: string;
  pain_to_solution?: string;
  recommended_channel: ApproachChannel;
  sample_message?: string | null;
}

export interface Keyperson {
  name: string;
  title: string;
  department?: string;
  role_type?: RoleType;
  career_summary?: string;
  expert_areas?: string[];
  sns_links?: SNSLinks;
  event_appearances?: EventAppearance[];
  bdr_context?: BDRContext;
}

// ==========================================
// Competitive & Strategy
// ==========================================

export interface CompetitiveLandscape {
  known_vendors?: string[];
  potential_competitors?: string[];
  differentiation_points?: string[];
}

export interface ApproachStep {
  step: number;
  action: string;
  target: string;
  channel: string;
  timing: string;
}

export interface CaseStudyRecommendation {
  company: string;
  relevance: string;
  story: string;
}

export interface RecommendedApproach {
  entry_point?: string;
  sequence?: ApproachStep[];
  key_messages?: string[];
  case_study_recommendations?: CaseStudyRecommendation[];
}

// ==========================================
// Metadata
// ==========================================

export interface DataSource {
  url: string;
  type: string;
  accessed_at: string;
}

export interface AccountPlanMetadata {
  generated_at: string;
  workflow_version: string;
  data_freshness?: {
    corporate_data?: string;
    keyman_data?: string;
  };
  sources?: DataSource[];
  confidence_score?: number;
}

// ==========================================
// Main Account Plan
// ==========================================

export interface AccountPlan {
  company: Company;
  departments?: Department[];
  keypersons?: Keyperson[];
  competitive_landscape?: CompetitiveLandscape;
  recommended_approach?: RecommendedApproach;
  metadata?: AccountPlanMetadata;
}

// ==========================================
// Agent I/O Types
// ==========================================

/** Input for Corporate Profiler Agent */
export interface CorporateProfilerInput {
  company_name: string;
  industry?: string;
  focus_areas?: string[];
}

/** Output from Corporate Profiler Agent */
export interface CorporateProfilerOutput {
  company_strategy: string;
  investment_areas: string[];
  trigger_events: TriggerEvent[];
  pain_points: PainPoint[];
}

/** Input for Talent Scout Agent */
export interface TalentScoutInput {
  company_name: string;
  company_domain: string;
  target_departments?: string[];
}

/** Output from Talent Scout Agent */
export interface TalentScoutOutput {
  org_structure: Department[];
  keyman_profiles: Keyperson[];
  dept_missions: Record<string, string>;
}

/** Input for BDR Strategist Agent */
export interface BDRStrategistInput {
  corporate_profile: CorporateProfilerOutput;
  talent_data: TalentScoutOutput;
  product_to_sell: string;
  case_study_db?: string;
}

/** Output from BDR Strategist Agent */
export interface BDRStrategistOutput {
  approach_strategies: Array<{
    target_person: Pick<Keyperson, 'name' | 'title'>;
    priority: 1 | 2 | 3 | 4 | 5;
    why_you: string;
    why_now: string;
    ice_breaker: string;
    pain_to_solution: string;
    recommended_channel: ApproachChannel;
    sample_message: string;
  }>;
}

// ==========================================
// Workflow Types
// ==========================================

export interface BDRWorkflowInput {
  target_company: string;
  industry_vertical?: string;
  target_department?: string;
  saas_product_to_sell: string;
}

export interface BDRWorkflowOutput {
  account_plan: AccountPlan;
  execution_log: {
    step: string;
    agent: string;
    status: 'success' | 'partial' | 'failed';
    duration_ms: number;
  }[];
}
