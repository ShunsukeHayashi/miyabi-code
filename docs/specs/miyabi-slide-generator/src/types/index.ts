// ==============================================================================
// Miyabi Society Slide Generator - Type Definitions
// ==============================================================================

// Society Domain Types
export type SocietyDomain =
  | "finance"
  | "hr"
  | "legal"
  | "sales"
  | "operations"
  | "customerSuccess"
  | "rnd"
  | "marketing"
  | "admin";

// Theme Types
export type ThemeType = "BLUEPRINT" | "SKETCH";

// Slide Types
export type SlideType = "guidance" | "content" | "overview" | "metrics";

// Visual Element Types
export interface VisualElement {
  id: string;
  type: "icon" | "image" | "chart" | "text";
  iconName?: string;
  label?: string;
  x: number;
  y: number;
  color?: string;
  connectedTo?: string[];
  animation?: "flow" | "pulse" | "fade" | "none";
}

// Slide Metrics
export interface SlideMetrics {
  agentCount?: number;
  fteReplaced?: string;
  costSavings?: string;
  efficiency?: string;
  customMetrics?: Record<string, string | number>;
}

// Slide Definition
export interface Slide {
  id: string;
  title: string;
  type: SlideType;
  narrative: string;
  annotation: string;
  domain?: SocietyDomain | null;
  metrics?: SlideMetrics;
  visuals: VisualElement[];
  imageUrl?: string;
  generatedAt?: string;
}

// Deck Definition
export interface Deck {
  id: string;
  title: string;
  description: string;
  theme: ThemeType;
  slides: Slide[];
  createdAt?: string;
  updatedAt?: string;
  author?: string;
}

// Agent Definition (for visualization)
export interface Agent {
  id: string;
  name: string;
  japaneName?: string;
  role: string;
  domain: SocietyDomain;
  status: "active" | "idle" | "busy" | "error";
  tasksCompleted?: number;
  currentTask?: string;
}

// Society Definition
export interface Society {
  domain: SocietyDomain;
  name: string;
  japaneseName: string;
  color: string;
  icon: string;
  agentCount: number;
  fteReplaced: string;
  annualSavings: string;
  agents: Agent[];
  coordinator: Agent;
}

// Pantheon Council Member
export interface PantheonMember {
  id: string;
  historicalFigure: string;
  role: string;
  domain: string;
  specialty: string;
}

// World Domain Configuration
export interface WorldDomainConfig {
  totalAgents: number;
  totalFteReplaced: { min: number; max: number };
  annualCostHuman: { min: number; max: number };
  annualCostAI: { min: number; max: number };
  savingsRate: { min: number; max: number };
  societies: Society[];
  pantheon: PantheonMember[];
}

// Simulation State
export interface SimulationState {
  isRunning: boolean;
  currentTime: Date;
  tasksCompleted: number;
  tasksPerHour: number;
  efficiency: number;
  uptime: number;
  activeAgents: number;
  activeSocieties: SocietyDomain[];
  recentActivities: ActivityLog[];
}

// Activity Log
export interface ActivityLog {
  id: string;
  timestamp: Date;
  agentId: string;
  agentName: string;
  domain: SocietyDomain;
  action: string;
  details?: string;
  status: "success" | "pending" | "failed";
}

// API Response Types
export interface GenerateImageResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export interface GenerateDeckResponse {
  success: boolean;
  deck?: Deck;
  error?: string;
}

export interface AgentThoughtResponse {
  success: boolean;
  thought?: string;
  error?: string;
}
