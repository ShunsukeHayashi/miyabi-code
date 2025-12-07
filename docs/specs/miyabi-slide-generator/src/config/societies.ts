// ==============================================================================
// Miyabi Society Configuration
// ==============================================================================
// Complete configuration for all 9 Domain Societies and 80 AI Agents
// ==============================================================================

import { Society, SocietyDomain, Agent, PantheonMember, WorldDomainConfig } from "../types";

// ==============================================================================
// Pantheon Council (Strategic Governance)
// ==============================================================================
export const PANTHEON_COUNCIL: PantheonMember[] = [
  {
    id: "pantheon-gates",
    historicalFigure: "Bill Gates",
    role: "CTO Strategy",
    domain: "Technology & Architecture",
    specialty: "System design, platform strategy, technical vision",
  },
  {
    id: "pantheon-jobs",
    historicalFigure: "Steve Jobs",
    role: "CDO Design",
    domain: "User Experience & Design",
    specialty: "Product design, customer experience, brand aesthetics",
  },
  {
    id: "pantheon-napoleon",
    historicalFigure: "Napoleon Bonaparte",
    role: "CSO Strategy",
    domain: "Operations & Tactics",
    specialty: "Strategic planning, operational excellence, competitive positioning",
  },
  {
    id: "pantheon-kotler",
    historicalFigure: "Philip Kotler",
    role: "CMO Marketing",
    domain: "Marketing & Growth",
    specialty: "Marketing strategy, market positioning, growth frameworks",
  },
];

// ==============================================================================
// Society Definitions
// ==============================================================================
export const SOCIETIES: Record<SocietyDomain, Society> = {
  finance: {
    domain: "finance",
    name: "Finance Society",
    japaneseName: "財務ソサエティ",
    color: "#3B82F6",
    icon: "Landmark",
    agentCount: 9,
    fteReplaced: "21-32",
    annualSavings: "$1.4-2.3M",
    coordinator: {
      id: "finance-coordinator",
      name: "CFO-Agent",
      japaneName: "けいりくん",
      role: "Finance Society Coordinator",
      domain: "finance",
      status: "active",
    },
    agents: [
      { id: "fin-1", name: "CFO-Agent", role: "財務統括", domain: "finance", status: "active" },
      { id: "fin-2", name: "AccountingBot", role: "会計処理", domain: "finance", status: "active" },
      { id: "fin-3", name: "TaxAnalyzer", role: "税務分析", domain: "finance", status: "active" },
      { id: "fin-4", name: "BudgetPlanner", role: "予算策定", domain: "finance", status: "active" },
      { id: "fin-5", name: "CashFlowManager", role: "資金管理", domain: "finance", status: "active" },
      { id: "fin-6", name: "AuditBot", role: "内部監査", domain: "finance", status: "active" },
      { id: "fin-7", name: "ReportGenerator", role: "レポート作成", domain: "finance", status: "active" },
      { id: "fin-8", name: "ComplianceChecker", role: "コンプライアンス", domain: "finance", status: "active" },
      { id: "fin-9", name: "InvestmentAnalyzer", role: "投資分析", domain: "finance", status: "active" },
    ],
  },

  hr: {
    domain: "hr",
    name: "HR & People Society",
    japaneseName: "人事ソサエティ",
    color: "#EC4899",
    icon: "Users",
    agentCount: 9,
    fteReplaced: "17-28",
    annualSavings: "$1.1-1.8M",
    coordinator: {
      id: "hr-coordinator",
      name: "CHRO-Agent",
      japaneName: "じんじくん",
      role: "HR Society Coordinator",
      domain: "hr",
      status: "active",
    },
    agents: [
      { id: "hr-1", name: "CHRO-Agent", role: "人事統括", domain: "hr", status: "active" },
      { id: "hr-2", name: "RecruiterBot", role: "採用活動", domain: "hr", status: "active" },
      { id: "hr-3", name: "OnboardingAgent", role: "オンボーディング", domain: "hr", status: "active" },
      { id: "hr-4", name: "PayrollProcessor", role: "給与計算", domain: "hr", status: "active" },
      { id: "hr-5", name: "BenefitsManager", role: "福利厚生", domain: "hr", status: "active" },
      { id: "hr-6", name: "PerformanceTracker", role: "評価管理", domain: "hr", status: "active" },
      { id: "hr-7", name: "TrainingCoordinator", role: "研修管理", domain: "hr", status: "active" },
      { id: "hr-8", name: "EmployeeSupport", role: "従業員サポート", domain: "hr", status: "active" },
      { id: "hr-9", name: "OffboardingAgent", role: "退職処理", domain: "hr", status: "active" },
    ],
  },

  legal: {
    domain: "legal",
    name: "Legal & Compliance Society",
    japaneseName: "法務ソサエティ",
    color: "#6B7280",
    icon: "Scale",
    agentCount: 8,
    fteReplaced: "14-22",
    annualSavings: "$0.9-1.4M",
    coordinator: {
      id: "legal-coordinator",
      name: "CLO-Agent",
      japaneName: "ほうむくん",
      role: "Legal Society Coordinator",
      domain: "legal",
      status: "active",
    },
    agents: [
      { id: "leg-1", name: "CLO-Agent", role: "法務統括", domain: "legal", status: "active" },
      { id: "leg-2", name: "ContractReviewer", role: "契約書レビュー", domain: "legal", status: "active" },
      { id: "leg-3", name: "IPManager", role: "知財管理", domain: "legal", status: "active" },
      { id: "leg-4", name: "RegulatoryBot", role: "規制対応", domain: "legal", status: "active" },
      { id: "leg-5", name: "LitigationSupport", role: "訴訟サポート", domain: "legal", status: "active" },
      { id: "leg-6", name: "PrivacyOfficer", role: "プライバシー", domain: "legal", status: "active" },
      { id: "leg-7", name: "PolicyDrafter", role: "ポリシー策定", domain: "legal", status: "active" },
      { id: "leg-8", name: "RiskAssessor", role: "リスク評価", domain: "legal", status: "active" },
    ],
  },

  sales: {
    domain: "sales",
    name: "Sales & BizDev Society",
    japaneseName: "営業ソサエティ",
    color: "#F97316",
    icon: "TrendingUp",
    agentCount: 9,
    fteReplaced: "22-36",
    annualSavings: "$1.5-2.5M",
    coordinator: {
      id: "sales-coordinator",
      name: "CRO-Agent",
      japaneName: "えいぎょうくん",
      role: "Sales Society Coordinator",
      domain: "sales",
      status: "active",
    },
    agents: [
      { id: "sal-1", name: "CRO-Agent", role: "営業統括", domain: "sales", status: "active" },
      { id: "sal-2", name: "LeadGenerator", role: "リード獲得", domain: "sales", status: "busy" },
      { id: "sal-3", name: "QualificationBot", role: "リード評価", domain: "sales", status: "active" },
      { id: "sal-4", name: "ProposalWriter", role: "提案書作成", domain: "sales", status: "active" },
      { id: "sal-5", name: "NegotiationAgent", role: "交渉支援", domain: "sales", status: "active" },
      { id: "sal-6", name: "DealCloser", role: "クロージング", domain: "sales", status: "active" },
      { id: "sal-7", name: "PartnerManager", role: "パートナー管理", domain: "sales", status: "active" },
      { id: "sal-8", name: "PipelineAnalyzer", role: "パイプライン分析", domain: "sales", status: "active" },
      { id: "sal-9", name: "ForecastBot", role: "売上予測", domain: "sales", status: "active" },
    ],
  },

  operations: {
    domain: "operations",
    name: "Operations & Supply Chain Society",
    japaneseName: "運用ソサエティ",
    color: "#14B8A6",
    icon: "Settings",
    agentCount: 8,
    fteReplaced: "16-27",
    annualSavings: "$1.0-1.7M",
    coordinator: {
      id: "ops-coordinator",
      name: "COO-Agent",
      japaneName: "うんようくん",
      role: "Operations Society Coordinator",
      domain: "operations",
      status: "active",
    },
    agents: [
      { id: "ops-1", name: "COO-Agent", role: "運用統括", domain: "operations", status: "active" },
      { id: "ops-2", name: "SupplyChainBot", role: "サプライチェーン", domain: "operations", status: "active" },
      { id: "ops-3", name: "InventoryManager", role: "在庫管理", domain: "operations", status: "active" },
      { id: "ops-4", name: "VendorManager", role: "ベンダー管理", domain: "operations", status: "active" },
      { id: "ops-5", name: "QualityController", role: "品質管理", domain: "operations", status: "active" },
      { id: "ops-6", name: "LogisticsPlanner", role: "物流計画", domain: "operations", status: "active" },
      { id: "ops-7", name: "FacilitiesBot", role: "施設管理", domain: "operations", status: "active" },
      { id: "ops-8", name: "ProcessOptimizer", role: "プロセス改善", domain: "operations", status: "active" },
    ],
  },

  customerSuccess: {
    domain: "customerSuccess",
    name: "Customer Success Society",
    japaneseName: "顧客成功ソサエティ",
    color: "#8B5CF6",
    icon: "Heart",
    agentCount: 8,
    fteReplaced: "17-31",
    annualSavings: "$1.1-2.0M",
    coordinator: {
      id: "cs-coordinator",
      name: "CCO-Agent",
      japaneName: "こきゃくくん",
      role: "Customer Success Society Coordinator",
      domain: "customerSuccess",
      status: "active",
    },
    agents: [
      { id: "cs-1", name: "CCO-Agent", role: "CS統括", domain: "customerSuccess", status: "active" },
      { id: "cs-2", name: "OnboardingSpecialist", role: "顧客オンボーディング", domain: "customerSuccess", status: "active" },
      { id: "cs-3", name: "SupportBot", role: "カスタマーサポート", domain: "customerSuccess", status: "busy" },
      { id: "cs-4", name: "SuccessManager", role: "成功支援", domain: "customerSuccess", status: "active" },
      { id: "cs-5", name: "ChurnPredictor", role: "解約予測", domain: "customerSuccess", status: "active" },
      { id: "cs-6", name: "UpsellAgent", role: "アップセル", domain: "customerSuccess", status: "active" },
      { id: "cs-7", name: "FeedbackAnalyzer", role: "フィードバック分析", domain: "customerSuccess", status: "active" },
      { id: "cs-8", name: "HealthScoreBot", role: "ヘルススコア", domain: "customerSuccess", status: "active" },
    ],
  },

  rnd: {
    domain: "rnd",
    name: "R&D & Innovation Society",
    japaneseName: "研究開発ソサエティ",
    color: "#06B6D4",
    icon: "Lightbulb",
    agentCount: 12,
    fteReplaced: "33-54",
    annualSavings: "$2.2-3.6M",
    coordinator: {
      id: "rnd-coordinator",
      name: "CTO-Agent",
      japaneName: "かいはつくん",
      role: "R&D Society Coordinator",
      domain: "rnd",
      status: "active",
    },
    agents: [
      { id: "rnd-1", name: "CTO-Agent", role: "技術統括", domain: "rnd", status: "active" },
      { id: "rnd-2", name: "ArchitectBot", role: "アーキテクチャ", domain: "rnd", status: "active" },
      { id: "rnd-3", name: "CodeGenAgent", role: "コード生成", domain: "rnd", status: "busy" },
      { id: "rnd-4", name: "ReviewAgent", role: "コードレビュー", domain: "rnd", status: "active" },
      { id: "rnd-5", name: "TestAutomation", role: "テスト自動化", domain: "rnd", status: "active" },
      { id: "rnd-6", name: "DevOpsBot", role: "DevOps", domain: "rnd", status: "active" },
      { id: "rnd-7", name: "SecurityAgent", role: "セキュリティ", domain: "rnd", status: "active" },
      { id: "rnd-8", name: "DataScientist", role: "データサイエンス", domain: "rnd", status: "active" },
      { id: "rnd-9", name: "MLEngineer", role: "ML開発", domain: "rnd", status: "active" },
      { id: "rnd-10", name: "ResearchBot", role: "研究調査", domain: "rnd", status: "active" },
      { id: "rnd-11", name: "DocGenerator", role: "ドキュメント", domain: "rnd", status: "active" },
      { id: "rnd-12", name: "InnovationScout", role: "イノベーション", domain: "rnd", status: "active" },
    ],
  },

  marketing: {
    domain: "marketing",
    name: "Marketing & Brand Society",
    japaneseName: "マーケティングソサエティ",
    color: "#F43F5E",
    icon: "Megaphone",
    agentCount: 10,
    fteReplaced: "18-31",
    annualSavings: "$1.2-2.0M",
    coordinator: {
      id: "marketing-coordinator",
      name: "CMO-Agent",
      japaneName: "まーけくん",
      role: "Marketing Society Coordinator",
      domain: "marketing",
      status: "active",
    },
    agents: [
      { id: "mkt-1", name: "CMO-Agent", role: "マーケ統括", domain: "marketing", status: "active" },
      { id: "mkt-2", name: "ContentCreator", role: "コンテンツ制作", domain: "marketing", status: "busy" },
      { id: "mkt-3", name: "SEOSpecialist", role: "SEO最適化", domain: "marketing", status: "active" },
      { id: "mkt-4", name: "SocialMediaBot", role: "SNS運用", domain: "marketing", status: "active" },
      { id: "mkt-5", name: "AdManager", role: "広告管理", domain: "marketing", status: "active" },
      { id: "mkt-6", name: "EmailMarketer", role: "メールマーケ", domain: "marketing", status: "active" },
      { id: "mkt-7", name: "AnalyticsBot", role: "マーケ分析", domain: "marketing", status: "active" },
      { id: "mkt-8", name: "BrandManager", role: "ブランド管理", domain: "marketing", status: "active" },
      { id: "mkt-9", name: "EventPlanner", role: "イベント企画", domain: "marketing", status: "active" },
      { id: "mkt-10", name: "PRAgent", role: "広報", domain: "marketing", status: "active" },
    ],
  },

  admin: {
    domain: "admin",
    name: "Admin & Back Office Society",
    japaneseName: "管理ソサエティ",
    color: "#9CA3AF",
    icon: "Building",
    agentCount: 7,
    fteReplaced: "12-20",
    annualSavings: "$0.8-1.3M",
    coordinator: {
      id: "admin-coordinator",
      name: "CAO-Agent",
      japaneName: "かんりくん",
      role: "Admin Society Coordinator",
      domain: "admin",
      status: "active",
    },
    agents: [
      { id: "adm-1", name: "CAO-Agent", role: "管理統括", domain: "admin", status: "active" },
      { id: "adm-2", name: "SchedulerBot", role: "スケジュール管理", domain: "admin", status: "active" },
      { id: "adm-3", name: "ExpenseManager", role: "経費管理", domain: "admin", status: "active" },
      { id: "adm-4", name: "TravelAgent", role: "出張管理", domain: "admin", status: "idle" },
      { id: "adm-5", name: "DocumentManager", role: "文書管理", domain: "admin", status: "active" },
      { id: "adm-6", name: "CommunicationHub", role: "社内コミュニケーション", domain: "admin", status: "active" },
      { id: "adm-7", name: "ITHelpdesk", role: "ITサポート", domain: "admin", status: "active" },
    ],
  },
};

// ==============================================================================
// World Domain Configuration
// ==============================================================================
export const WORLD_DOMAIN_CONFIG: WorldDomainConfig = {
  totalAgents: 80,
  totalFteReplaced: { min: 170, max: 281 },
  annualCostHuman: { min: 15100000, max: 25000000 },
  annualCostAI: { min: 2600000, max: 3600000 },
  savingsRate: { min: 70, max: 85 },
  societies: Object.values(SOCIETIES),
  pantheon: PANTHEON_COUNCIL,
};

// ==============================================================================
// Helper Functions
// ==============================================================================
export const getSocietyByDomain = (domain: SocietyDomain): Society => SOCIETIES[domain];

export const getAllAgents = (): Agent[] => {
  return Object.values(SOCIETIES).flatMap((society) => society.agents);
};

export const getAgentsByStatus = (status: Agent["status"]): Agent[] => {
  return getAllAgents().filter((agent) => agent.status === status);
};

export const getTotalMetrics = () => {
  const config = WORLD_DOMAIN_CONFIG;
  return {
    totalAgents: config.totalAgents,
    fteReplacedRange: `${config.totalFteReplaced.min}-${config.totalFteReplaced.max}`,
    annualSavingsRange: `$${((config.annualCostHuman.min - config.annualCostAI.max) / 1000000).toFixed(1)}-${((config.annualCostHuman.max - config.annualCostAI.min) / 1000000).toFixed(1)}M`,
    savingsRateRange: `${config.savingsRate.min}-${config.savingsRate.max}%`,
  };
};
