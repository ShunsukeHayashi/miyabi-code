/**
 * SWML (Shunsuke's World Model Logic) Type Definitions
 * Based on miyabi_def/variables/step_back_question_method.yaml
 *
 * F: Goal × 𝒬 → Result
 * F(G, Q) = ∫_{A}^{Z} f(step, Q) d(step)
 *
 * 26-Step Process (A to Z) with Step-back Questions
 */

// ═══════════════════════════════════════════════════════════════════════
// § 1. Step-back Questions
// ═══════════════════════════════════════════════════════════════════════

export type QuestionCategory = 'why' | 'what_if' | 'how';

export interface StepBackQuestion {
  question: string;
  category: QuestionCategory;
  depth: number; // Abstraction level (1 = one level up)
}

export const STANDARD_QUESTIONS: StepBackQuestion[] = [
  {
    question: 'What is the core problem we are trying to solve?',
    category: 'why',
    depth: 1,
  },
  {
    question: 'Why is this goal important in the bigger picture?',
    category: 'why',
    depth: 2,
  },
  {
    question: 'What are the fundamental principles guiding this work?',
    category: 'what_if',
    depth: 2,
  },
  {
    question: 'What would the ideal solution look like?',
    category: 'what_if',
    depth: 1,
  },
  {
    question: 'How does this connect to our broader objectives?',
    category: 'how',
    depth: 2,
  },
];

// ═══════════════════════════════════════════════════════════════════════
// § 2. Process Step Definition
// ═══════════════════════════════════════════════════════════════════════

export type StepName =
  | 'A_analyze'
  | 'B_breakdown'
  | 'C_clarify'
  | 'D_design'
  | 'E_enumerate'
  | 'F_formulate'
  | 'G_generate'
  | 'H_hypothesize'
  | 'I_implement'
  | 'J_judge'
  | 'K_know'
  | 'L_learn'
  | 'M_measure'
  | 'N_normalize'
  | 'O_optimize'
  | 'P_parallelize'
  | 'Q_question'
  | 'R_refactor'
  | 'S_synthesize'
  | 'T_test'
  | 'U_unify'
  | 'V_validate'
  | 'W_write'
  | 'X_execute'
  | 'Y_yield'
  | 'Z_zeroin';

export interface ProcessStep {
  name: StepName;
  name_en: string;
  name_ja: string;
  formula: string;
  step_back_question: string;
  input: string;
  output: string;
  operations: string[];
}

// ═══════════════════════════════════════════════════════════════════════
// § 3. Step Result
// ═══════════════════════════════════════════════════════════════════════

export interface StepResult {
  step: StepName;
  success: boolean;
  output: any;
  quality_score: number; // 0.0 - 1.0
  time_taken_ms: number;
  step_back_insights: string[];
}

// ═══════════════════════════════════════════════════════════════════════
// § 4. SWML Process
// ═══════════════════════════════════════════════════════════════════════

export interface SWMLProcess {
  goal: string;
  questions: StepBackQuestion[];
  steps: ProcessStep[];
  current_step: number;
  results: StepResult[];
  overall_quality: number;
}

// ═══════════════════════════════════════════════════════════════════════
// § 5. 26 Steps Definition
// ═══════════════════════════════════════════════════════════════════════

export const SWML_26_STEPS: Record<StepName, ProcessStep> = {
  A_analyze: {
    name: 'A_analyze',
    name_en: 'Analyze',
    name_ja: '分析',
    formula: 'A: Goal → Problem Understanding',
    step_back_question: 'What is the core problem?',
    input: 'Goal',
    output: 'Problem Understanding',
    operations: [
      'Identify constraints',
      'List available resources',
      'Understand context',
    ],
  },

  B_breakdown: {
    name: 'B_breakdown',
    name_en: 'Break down',
    name_ja: '分解',
    formula: 'B: Problem → Sub-problems',
    step_back_question: 'What are the fundamental components?',
    input: 'Problem',
    output: 'Sub-problems {P₁, P₂, ..., Pₖ}',
    operations: [
      'Decompose into sub-problems',
      'Identify dependencies',
      'Prioritize components',
    ],
  },

  C_clarify: {
    name: 'C_clarify',
    name_en: 'Clarify',
    name_ja: '明確化',
    formula: 'C: Sub-problems → Clear Objectives',
    step_back_question: 'What does success mean for each component?',
    input: 'Sub-problems',
    output: 'Clear Objectives with success criteria',
    operations: ['Define success criteria', 'Establish metrics', 'Set timeline'],
  },

  D_design: {
    name: 'D_design',
    name_en: 'Design',
    name_ja: '設計',
    formula: 'D: Objectives → Solution Architecture',
    step_back_question: 'What is the optimal structure?',
    input: 'Objectives',
    output: 'Architecture (components, relations, interfaces)',
    operations: [
      'Design system architecture',
      'Define component interfaces',
      'Plan integration strategy',
    ],
  },

  E_enumerate: {
    name: 'E_enumerate',
    name_en: 'Enumerate',
    name_ja: '列挙',
    formula: 'E: Architecture → Task List',
    step_back_question: 'What are all the necessary tasks?',
    input: 'Architecture',
    output: 'Complete task list {T₁, T₂, ..., Tₘ}',
    operations: ['List all required tasks', 'Identify dependencies', 'Estimate effort'],
  },

  F_formulate: {
    name: 'F_formulate',
    name_en: 'Formulate',
    name_ja: '定式化',
    formula: 'F: Tasks → Mathematical Models',
    step_back_question: 'How can we formally describe each task?',
    input: 'Tasks',
    output: 'Mathematical models',
    operations: [
      'Define inputs/outputs',
      'Specify constraints',
      'Identify optimization targets',
    ],
  },

  G_generate: {
    name: 'G_generate',
    name_en: 'Generate',
    name_ja: '生成',
    formula: 'G: Models → Code/Artifacts',
    step_back_question: 'What needs to be created?',
    input: 'Models',
    output: 'Code, docs, tests, config',
    operations: ['Generate code', 'Create documentation', 'Write tests'],
  },

  H_hypothesize: {
    name: 'H_hypothesize',
    name_en: 'Hypothesize',
    name_ja: '仮説立案',
    formula: 'H: Current State → Predictions',
    step_back_question: 'What do we expect to happen?',
    input: 'Current state',
    output: 'Hypotheses',
    operations: [
      'Formulate hypotheses',
      'Define testable predictions',
      'Plan validation',
    ],
  },

  I_implement: {
    name: 'I_implement',
    name_en: 'Implement',
    name_ja: '実装',
    formula: 'I: Design → Working Code',
    step_back_question: 'How do we bring this to life?',
    input: 'Design',
    output: 'Working implementation',
    operations: ['Write code', 'Integrate components', 'Handle edge cases'],
  },

  J_judge: {
    name: 'J_judge',
    name_en: 'Judge',
    name_ja: '判断',
    formula: 'J: Implementation → Quality Assessment',
    step_back_question: 'Does this meet our standards?',
    input: 'Implementation',
    output: 'Quality score ∈ [0, 1]',
    operations: ['Assess code quality', 'Evaluate performance', 'Check completeness'],
  },

  K_know: {
    name: 'K_know',
    name_en: 'Know',
    name_ja: '認識',
    formula: 'K: Results → Knowledge',
    step_back_question: 'What patterns can we extract?',
    input: 'Results',
    output: 'Extracted knowledge',
    operations: ['Extract patterns', 'Update knowledge base', 'Document insights'],
  },

  L_learn: {
    name: 'L_learn',
    name_en: 'Learn',
    name_ja: '学習',
    formula: 'L: Experience → Improved Strategy',
    step_back_question: 'How can we do better next time?',
    input: 'Experience',
    output: 'Improved strategy',
    operations: ['Analyze what worked', 'Identify improvements', 'Update approach'],
  },

  M_measure: {
    name: 'M_measure',
    name_en: 'Measure',
    name_ja: '測定',
    formula: 'M: System → Metrics',
    step_back_question: 'What are the key indicators?',
    input: 'System',
    output: 'Metrics {metric₁: value₁, ...}',
    operations: ['Define KPIs', 'Collect measurements', 'Track progress'],
  },

  N_normalize: {
    name: 'N_normalize',
    name_en: 'Normalize',
    name_ja: '正規化',
    formula: 'N: Raw Data → Standardized Format',
    step_back_question: 'How do we make data comparable?',
    input: 'Raw data',
    output: 'Normalized data',
    operations: [
      'Apply normalization: (data - μ) / σ',
      'Standardize formats',
      'Remove outliers',
    ],
  },

  O_optimize: {
    name: 'O_optimize',
    name_en: 'Optimize',
    name_ja: '最適化',
    formula: 'O: Current Solution → Optimal Solution',
    step_back_question: 'What is the best possible solution?',
    input: 'Current solution',
    output: 'Optimal solution',
    operations: [
      'Apply optimization algorithms',
      'Maximize quality function',
      'Minimize resource usage',
    ],
  },

  P_parallelize: {
    name: 'P_parallelize',
    name_en: 'Parallelize',
    name_ja: '並列化',
    formula: 'P: Sequential Tasks → Parallel Execution',
    step_back_question: 'What can run concurrently?',
    input: 'Sequential tasks',
    output: 'Parallel execution plan',
    operations: [
      'Identify independent tasks',
      'Plan parallel execution',
      'Coordinate results',
    ],
  },

  Q_question: {
    name: 'Q_question',
    name_en: 'Question',
    name_ja: '質問',
    formula: 'Q: Current Understanding → Deeper Insight',
    step_back_question: 'What are we missing?',
    input: 'Current understanding',
    output: 'Deeper insights',
    operations: [
      'Ask step-back questions',
      'Challenge assumptions',
      'Seek fundamental principles',
    ],
  },

  R_refactor: {
    name: 'R_refactor',
    name_en: 'Refactor',
    name_ja: 'リファクタリング',
    formula: 'R: Working Code → Clean Code',
    step_back_question: 'How can we make this better?',
    input: 'Working code',
    output: 'Refactored code',
    operations: [
      'Improve readability',
      'Enhance maintainability',
      'Optimize performance',
    ],
  },

  S_synthesize: {
    name: 'S_synthesize',
    name_en: 'Synthesize',
    name_ja: '統合',
    formula: 'S: Components → Integrated System',
    step_back_question: 'How do parts become a whole?',
    input: 'Components {C₁, C₂, ..., Cᵣ}',
    output: 'Integrated system',
    operations: ['Combine components', 'Ensure compatibility', 'Test integration'],
  },

  T_test: {
    name: 'T_test',
    name_en: 'Test',
    name_ja: 'テスト',
    formula: 'T: System → Validation Results',
    step_back_question: 'Does it actually work?',
    input: 'System',
    output: 'Test results {test₁: pass/fail, ...}',
    operations: [
      'Run unit tests',
      'Execute integration tests',
      'Perform system tests',
    ],
  },

  U_unify: {
    name: 'U_unify',
    name_en: 'Unify',
    name_ja: '統一',
    formula: 'U: Diverse Approaches → Single Framework',
    step_back_question: 'What unifies these approaches?',
    input: 'Diverse approaches {A₁, A₂, ..., Aₜ}',
    output: 'Unified framework',
    operations: [
      'Find common patterns',
      'Create abstraction',
      'Define unified interface',
    ],
  },

  V_validate: {
    name: 'V_validate',
    name_en: 'Validate',
    name_ja: '検証',
    formula: 'V: Solution → Correctness Proof',
    step_back_question: "How do we know it's correct?",
    input: 'Solution',
    output: 'Validation proof',
    operations: ['Formal verification', 'Empirical testing', 'Peer review'],
  },

  W_write: {
    name: 'W_write',
    name_en: 'Write',
    name_ja: '記述',
    formula: 'W: Knowledge → Documentation',
    step_back_question: 'How do we share what we learned?',
    input: 'Knowledge',
    output: 'Documentation',
    operations: ['Write clear docs', 'Create examples', 'Explain rationale'],
  },

  X_execute: {
    name: 'X_execute',
    name_en: 'eXecute',
    name_ja: '実行',
    formula: 'X: Plan → Action',
    step_back_question: 'How do we make it happen?',
    input: 'Plan',
    output: 'Execution results',
    operations: ['Deploy system', 'Monitor execution', 'Adjust as needed'],
  },

  Y_yield: {
    name: 'Y_yield',
    name_en: 'Yield',
    name_ja: '生成',
    formula: 'Y: Process → Final Result',
    step_back_question: 'What is the final deliverable?',
    input: 'Complete process',
    output: 'Final result',
    operations: ['Package deliverable', 'Add metadata', 'Calculate quality metrics'],
  },

  Z_zeroin: {
    name: 'Z_zeroin',
    name_en: 'Zero-in',
    name_ja: '収束',
    formula: 'Z: Iterations → Optimal Solution',
    step_back_question: 'Have we reached the best solution?',
    input: 'Iterative results',
    output: 'Optimal solution',
    operations: [
      'Check convergence',
      'Verify optimality',
      'Finalize solution: lim_{n→∞} Solutionₙ = Solution*',
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════
// § 6. Quality Metrics
// ═══════════════════════════════════════════════════════════════════════

export interface QualityMetrics {
  completeness: number; // 0.0 - 1.0
  accuracy: number; // 0.0 - 1.0
  efficiency: number; // 0.0 - 1.0
  overall: number; // Weighted average
}

/**
 * Calculate quality score
 * Q = ω₁·Completeness + ω₂·Accuracy + ω₃·Efficiency
 */
export function calculateQualityScore(
  completeness: number,
  accuracy: number,
  efficiency: number,
  weights = { completeness: 0.4, accuracy: 0.3, efficiency: 0.3 }
): number {
  return (
    weights.completeness * completeness +
    weights.accuracy * accuracy +
    weights.efficiency * efficiency
  );
}

/**
 * Calculate step quality based on result
 */
export function calculateStepQuality(result: StepResult): number {
  if (!result.success) return 0.0;

  // Quality based on success, output quality, and time efficiency
  const baseQuality = result.quality_score;
  const timeEfficiency = Math.min(1.0, 5000 / result.time_taken_ms); // Prefer < 5s
  const insightBonus = result.step_back_insights.length * 0.05;

  return Math.min(1.0, baseQuality * 0.7 + timeEfficiency * 0.2 + insightBonus);
}

/**
 * Calculate overall process quality
 * Process_Quality = ∏_{step=A}^{Z} Step_Quality(step)
 */
export function calculateProcessQuality(results: StepResult[]): number {
  if (results.length === 0) return 0.0;

  // Geometric mean of step qualities
  const product = results.reduce(
    (acc, result) => acc * calculateStepQuality(result),
    1.0
  );

  return Math.pow(product, 1 / results.length);
}
