/**
 * Intent Space (I) Type Definitions
 * Based on miyabi_def/intent-schema.yaml
 *
 * I(g, p, o, m) → Objective
 *
 * Parameters:
 *   g: Goals - Primary, secondary, and implicit goals
 *   p: Preferences - Quality/speed, cost/performance tradeoffs
 *   o: Objectives - Functional, non-functional, quality requirements
 *   m: Modality - Output format (text, code, visual, data, hybrid)
 */

// ═══════════════════════════════════════════════════════════════════════
// § 1. Goals Definition
// ═══════════════════════════════════════════════════════════════════════

export interface Goals {
  primary: string; // Main objective
  secondary?: string[]; // Supporting objectives
  implicit?: string[]; // Inferred objectives
}

// ═══════════════════════════════════════════════════════════════════════
// § 2. Preferences Definition
// ═══════════════════════════════════════════════════════════════════════

export type QualitySpeedPreference = 'quality' | 'balanced' | 'speed';
export type CostPerformancePreference = 'cost' | 'balanced' | 'performance';

export interface Preferences {
  quality_vs_speed: QualitySpeedPreference;
  cost_vs_performance: CostPerformancePreference;
  ui_complexity: 'minimal' | 'moderate' | 'complex';
  data_density: 'sparse' | 'moderate' | 'dense';
  interaction_style: 'static' | 'interactive' | 'realtime';
}

// ═══════════════════════════════════════════════════════════════════════
// § 3. Objectives Definition
// ═══════════════════════════════════════════════════════════════════════

export interface Objectives {
  functional: string[]; // What the UI should do
  non_functional: string[]; // Performance, accessibility, etc.
  quality: {
    min_score: number; // 0.0 - 1.0
    completeness_weight: number; // Default: 0.4
    accuracy_weight: number; // Default: 0.3
    efficiency_weight: number; // Default: 0.3
  };
}

// ═══════════════════════════════════════════════════════════════════════
// § 4. Modality Definition
// ═══════════════════════════════════════════════════════════════════════

export type UIComponentType =
  | 'dashboard' // Overview with multiple metrics
  | 'chart' // Data visualization
  | 'table' // Tabular data
  | 'form' // User input
  | 'card' // Single entity display
  | 'timeline' // Temporal data
  | 'graph' // Network/relationship data
  | 'wizard' // Step-by-step flow
  | 'kanban' // Task board
  | 'grid' // Responsive grid layout
  | 'list' // Vertical list
  | 'calendar' // Date-based view
  | 'map' // Geographic data
  | 'mixed'; // Hybrid of multiple types

export interface Modality {
  preferred_component: UIComponentType;
  data_sources: string[]; // e.g., ["agents", "metrics", "logs"]
  output_format: 'react_component' | 'html' | 'json' | 'markdown';
  styling: 'tailwind' | 'heroui' | 'inline' | 'none';
  libraries: string[]; // e.g., ["recharts", "lucide-react"]
}

// ═══════════════════════════════════════════════════════════════════════
// § 5. Complete Intent Space
// ═══════════════════════════════════════════════════════════════════════

export interface Intent {
  id: string; // Unique intent ID
  timestamp: string; // ISO 8601
  raw_input: string; // Original user input
  goals: Goals;
  preferences: Preferences;
  objectives: Objectives;
  modality: Modality;
  context?: {
    current_page?: string;
    current_data?: any;
    user_history?: string[];
  };
}

// ═══════════════════════════════════════════════════════════════════════
// § 6. Intent Clarity & Feasibility Metrics
// ═══════════════════════════════════════════════════════════════════════

export interface IntentMetrics {
  clarity: number; // 0.0 - 1.0 (how clear the intent is)
  feasibility: number; // 0.0 - 1.0 (how feasible to implement)
  specificity: number; // 0.0 - 1.0 (how specific the requirements are)
  complexity: number; // 0.0 - 1.0 (estimated implementation complexity)
}

// ═══════════════════════════════════════════════════════════════════════
// § 7. Intent Utilities
// ═══════════════════════════════════════════════════════════════════════

/**
 * Create default preferences
 */
export function createDefaultPreferences(): Preferences {
  return {
    quality_vs_speed: 'balanced',
    cost_vs_performance: 'balanced',
    ui_complexity: 'moderate',
    data_density: 'moderate',
    interaction_style: 'interactive',
  };
}

/**
 * Create default objectives
 */
export function createDefaultObjectives(): Objectives {
  return {
    functional: [],
    non_functional: ['responsive', 'accessible', 'performant'],
    quality: {
      min_score: 0.8,
      completeness_weight: 0.4,
      accuracy_weight: 0.3,
      efficiency_weight: 0.3,
    },
  };
}

/**
 * Create default modality for React components
 */
export function createDefaultModality(): Modality {
  return {
    preferred_component: 'dashboard',
    data_sources: [],
    output_format: 'react_component',
    styling: 'heroui',
    libraries: ['recharts', 'lucide-react', 'framer-motion'],
  };
}

/**
 * Parse raw user input into structured Intent
 * This is a simplified version - the real implementation would use NLP/LLM
 */
export function parseUserInput(input: string, context?: any): Intent {
  // Analyze input to determine component type
  let componentType: UIComponentType = 'dashboard';

  if (
    input.includes('chart') ||
    input.includes('graph') ||
    input.includes('visualize')
  ) {
    componentType = 'chart';
  } else if (input.includes('table') || input.includes('list')) {
    componentType = 'table';
  } else if (input.includes('form') || input.includes('input')) {
    componentType = 'form';
  } else if (input.includes('timeline') || input.includes('history')) {
    componentType = 'timeline';
  } else if (input.includes('card')) {
    componentType = 'card';
  }

  return {
    id: `intent-${Date.now()}`,
    timestamp: new Date().toISOString(),
    raw_input: input,
    goals: {
      primary: input,
      secondary: [],
      implicit: ['user-friendly', 'responsive'],
    },
    preferences: createDefaultPreferences(),
    objectives: createDefaultObjectives(),
    modality: {
      ...createDefaultModality(),
      preferred_component: componentType,
    },
    context,
  };
}

/**
 * Calculate intent clarity based on specificity
 */
export function calculateIntentClarity(intent: Intent): number {
  let clarity = 0.5; // Base clarity

  // More specific goals → higher clarity
  if (intent.goals.primary.length > 20) clarity += 0.1;
  if (intent.goals.secondary && intent.goals.secondary.length > 0)
    clarity += 0.1;

  // Specific objectives → higher clarity
  if (intent.objectives.functional.length > 0) clarity += 0.15;
  if (intent.objectives.non_functional.length > 0) clarity += 0.1;

  // Context provided → higher clarity
  if (intent.context?.current_page) clarity += 0.05;
  if (intent.context?.current_data) clarity += 0.1;

  return Math.min(clarity, 1.0);
}

/**
 * Estimate implementation complexity
 */
export function estimateComplexity(intent: Intent): number {
  let complexity = 0.3; // Base complexity

  // Component type complexity
  const complexComponents: UIComponentType[] = [
    'graph',
    'wizard',
    'kanban',
    'calendar',
    'map',
  ];
  if (complexComponents.includes(intent.modality.preferred_component)) {
    complexity += 0.2;
  }

  // Data sources complexity
  complexity += intent.modality.data_sources.length * 0.05;

  // Functional requirements complexity
  complexity += intent.objectives.functional.length * 0.05;

  // Interaction style complexity
  if (intent.preferences.interaction_style === 'realtime') complexity += 0.15;

  return Math.min(complexity, 1.0);
}

/**
 * Calculate intent metrics
 */
export function calculateIntentMetrics(intent: Intent): IntentMetrics {
  const clarity = calculateIntentClarity(intent);
  const complexity = estimateComplexity(intent);

  // Feasibility inversely related to complexity and directly to clarity
  const feasibility = clarity * (1 - complexity * 0.5);

  // Specificity based on amount of detail provided
  const specificity =
    (intent.objectives.functional.length +
      intent.objectives.non_functional.length) /
    10;

  return {
    clarity: Math.min(clarity, 1.0),
    feasibility: Math.min(feasibility, 1.0),
    specificity: Math.min(specificity, 1.0),
    complexity,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// § 8. Intent Examples
// ═══════════════════════════════════════════════════════════════════════

export const EXAMPLE_INTENTS: Record<string, Intent> = {
  agentDashboard: {
    id: 'example-agent-dashboard',
    timestamp: new Date().toISOString(),
    raw_input:
      'Show me a dashboard with all agent statuses, their performance metrics, and recent activity',
    goals: {
      primary: 'Display comprehensive agent monitoring dashboard',
      secondary: ['Show real-time metrics', 'Enable quick agent control'],
      implicit: ['Responsive design', 'Auto-refresh data'],
    },
    preferences: {
      quality_vs_speed: 'balanced',
      cost_vs_performance: 'performance',
      ui_complexity: 'moderate',
      data_density: 'dense',
      interaction_style: 'realtime',
    },
    objectives: {
      functional: [
        'Display agent status',
        'Show performance metrics',
        'List recent activity',
        'Enable start/stop controls',
      ],
      non_functional: ['Real-time updates', 'Responsive', 'Accessible'],
      quality: {
        min_score: 0.85,
        completeness_weight: 0.4,
        accuracy_weight: 0.3,
        efficiency_weight: 0.3,
      },
    },
    modality: {
      preferred_component: 'dashboard',
      data_sources: ['agents', 'metrics', 'logs'],
      output_format: 'react_component',
      styling: 'heroui',
      libraries: ['recharts', 'lucide-react', 'framer-motion'],
    },
  },

  performanceChart: {
    id: 'example-performance-chart',
    timestamp: new Date().toISOString(),
    raw_input:
      'Create a line chart showing agent performance over the last 7 days',
    goals: {
      primary: 'Visualize agent performance trends',
      secondary: ['Enable time range selection', 'Show multiple metrics'],
    },
    preferences: {
      quality_vs_speed: 'quality',
      cost_vs_performance: 'balanced',
      ui_complexity: 'minimal',
      data_density: 'moderate',
      interaction_style: 'interactive',
    },
    objectives: {
      functional: ['Display time-series data', 'Enable metric filtering'],
      non_functional: ['Smooth animations', 'Responsive'],
      quality: {
        min_score: 0.9,
        completeness_weight: 0.3,
        accuracy_weight: 0.5,
        efficiency_weight: 0.2,
      },
    },
    modality: {
      preferred_component: 'chart',
      data_sources: ['metrics'],
      output_format: 'react_component',
      styling: 'heroui',
      libraries: ['recharts'],
    },
  },
};
