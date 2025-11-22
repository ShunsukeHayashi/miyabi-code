/**
 * SWML Optimizer Service
 * Implements the 26-step optimization process (A→Z) with step-back questions
 *
 * F: Goal × 𝒬 → Result
 * F(G, Q) = ∫_{A}^{Z} f(step, Q) d(step)
 */

import type { Intent } from '@/types/intent';
import type {
    ProcessStep,
    QualityMetrics,
    SWMLProcess,
    StepBackQuestion,
    StepName,
    StepResult,
} from '@/types/swml';
import { STANDARD_QUESTIONS, SWML_26_STEPS, calculateProcessQuality } from '@/types/swml';
import type { WorldSpace } from '@/types/worldSpace';

// ═══════════════════════════════════════════════════════════════════════
// § 1. SWML Optimizer Class
// ═══════════════════════════════════════════════════════════════════════

export class SWMLOptimizer {
  private process: SWMLProcess | null = null;

  /**
   * Initialize SWML process for UI generation
   */
  initialize(goal: string, questions: StepBackQuestion[] = STANDARD_QUESTIONS): SWMLProcess {
    this.process = {
      goal,
      questions,
      steps: Object.values(SWML_26_STEPS),
      current_step: 0,
      results: [],
      overall_quality: 0.0,
    };
    return this.process;
  }

  /**
   * Get current process state
   */
  getProcess(): SWMLProcess | null {
    return this.process;
  }

  /**
   * Execute specific step with step-back questions
   */
  async executeStep(
    step: StepName,
    input: any,
    context: { intent: Intent; world: WorldSpace }
  ): Promise<StepResult> {
    const startTime = Date.now();
    const stepDefinition = SWML_26_STEPS[step];

    try {
      // Apply step-back questions for this step
      const insights = await this.applyStepBackQuestions(
        stepDefinition,
        input,
        context
      );

      // Execute step logic based on step type
      const output = await this.executeStepLogic(step, input, insights, context);

      // Calculate quality score
      const quality_score = this.calculateStepQualityScore(output, stepDefinition);

      const result: StepResult = {
        step,
        success: true,
        output,
        quality_score,
        time_taken_ms: Date.now() - startTime,
        step_back_insights: insights,
      };

      // Add to process results
      if (this.process) {
        this.process.results.push(result);
        this.process.current_step++;
        this.process.overall_quality = calculateProcessQuality(this.process.results);
      }

      return result;
    } catch (error) {
      const result: StepResult = {
        step,
        success: false,
        output: null,
        quality_score: 0.0,
        time_taken_ms: Date.now() - startTime,
        step_back_insights: [],
      };

      if (this.process) {
        this.process.results.push(result);
      }

      throw error;
    }
  }

  /**
   * Apply step-back questions to gain deeper insight
   */
  private async applyStepBackQuestions(
    step: ProcessStep,
    _input: any,
    context: { intent: Intent; world: WorldSpace }
  ): Promise<string[]> {
    const insights: string[] = [];

    // Main step-back question for this step
    insights.push(step.step_back_question);

    // Additional context-specific questions
    if (step.name === 'A_analyze') {
      insights.push(
        `User wants: ${context.intent.raw_input}`,
        `Current page: ${context.world.contextual.user.current_page || 'unknown'}`,
        `System health: ${context.world.state.system.health}`
      );
    } else if (step.name === 'D_design') {
      insights.push(
        `Preferred component: ${context.intent.modality.preferred_component}`,
        `UI complexity: ${context.intent.preferences.ui_complexity}`,
        `Data density: ${context.intent.preferences.data_density}`
      );
    } else if (step.name === 'O_optimize') {
      insights.push(
        `Quality target: ${context.intent.objectives.quality.min_score}`,
        `Performance preference: ${context.intent.preferences.cost_vs_performance}`
      );
    }

    return insights;
  }

  /**
   * Execute step-specific logic
   */
  private async executeStepLogic(
    step: StepName,
    input: any,
    insights: string[],
    context: { intent: Intent; world: WorldSpace }
  ): Promise<any> {
    switch (step) {
      case 'A_analyze':
        return this.analyzeGoal(context.intent, context.world);

      case 'B_breakdown':
        return this.breakdownProblem(input, context.intent);

      case 'C_clarify':
        return this.clarifyObjectives(input, context.intent);

      case 'D_design':
        return this.designArchitecture(input, context.intent, context.world);

      case 'G_generate':
        return this.generateUIStrategy(input, context.intent, insights);

      case 'J_judge':
        return this.judgeQuality(input, context.intent);

      case 'O_optimize':
        return this.optimizeSolution(input, context.intent, insights);

      default:
        // For other steps, return input as-is (lightweight implementation)
        return input;
    }
  }

  /**
   * A: Analyze goal and extract requirements
   */
  private analyzeGoal(intent: Intent, world: WorldSpace): any {
    return {
      user_goal: intent.goals.primary,
      component_type: intent.modality.preferred_component,
      data_sources: intent.modality.data_sources,
      constraints: {
        complexity: intent.preferences.ui_complexity,
        density: intent.preferences.data_density,
        interaction: intent.preferences.interaction_style,
      },
      context: {
        page: world.contextual.user.current_page,
        health: world.state.system.health,
        resources: world.resources.compute.limits,
      },
    };
  }

  /**
   * B: Break down into UI components
   */
  private breakdownProblem(_analysis: any, intent: Intent): any {
    const components = [];

    // Main component based on intent
    components.push({
      type: 'main',
      component: intent.modality.preferred_component,
      priority: 1,
    });

    // Add supporting components based on functional objectives
    if (intent.objectives.functional.includes('Enable quick controls')) {
      components.push({
        type: 'controls',
        component: 'button_group',
        priority: 2,
      });
    }

    if (intent.modality.data_sources.includes('metrics')) {
      components.push({
        type: 'visualization',
        component: 'chart',
        priority: 2,
      });
    }

    return { components, dependencies: [] };
  }

  /**
   * C: Clarify success criteria
   */
  private clarifyObjectives(_breakdown: any, intent: Intent): any {
    return {
      must_have: intent.objectives.functional,
      should_have: intent.objectives.non_functional,
      quality_threshold: intent.objectives.quality.min_score,
      success_criteria: [
        `Completeness >= ${intent.objectives.quality.completeness_weight * 100}%`,
        `Accuracy >= ${intent.objectives.quality.accuracy_weight * 100}%`,
        `Efficiency >= ${intent.objectives.quality.efficiency_weight * 100}%`,
      ],
    };
  }

  /**
   * D: Design UI architecture
   */
  private designArchitecture(
    objectives: any,
    intent: Intent,
    world: WorldSpace
  ): any {
    const layout =
      intent.preferences.ui_complexity === 'minimal' ? 'single-column' : 'grid';

    return {
      layout,
      components: objectives.components || [],
      styling: intent.modality.styling,
      libraries: intent.modality.libraries,
      responsive: intent.objectives.non_functional.includes('responsive'),
      accessible: intent.objectives.non_functional.includes('accessible'),
      theme: this.selectTheme(world),
    };
  }

  /**
   * G: Generate UI strategy with SWML insights
   */
  private generateUIStrategy(
    architecture: any,
    intent: Intent,
    insights: string[]
  ): any {
    return {
      strategy: `Create a ${architecture.layout} layout with ${intent.modality.preferred_component} as main component`,
      reasoning: insights.join('; '),
      component_hierarchy: architecture.components,
      data_flow: this.designDataFlow(intent.modality.data_sources),
      interactions: this.designInteractions(intent.preferences.interaction_style),
    };
  }

  /**
   * J: Judge quality of generated solution
   */
  private judgeQuality(solution: any, intent: Intent): QualityMetrics {
    // Simplified quality judgment
    const completeness =
      solution.component_hierarchy?.length > 0 ? 0.9 : 0.5;
    const accuracy =
      solution.strategy && solution.reasoning ? 0.85 : 0.6;
    const efficiency = 0.8; // Assume good efficiency for now

    return {
      completeness,
      accuracy,
      efficiency,
      overall:
        intent.objectives.quality.completeness_weight * completeness +
        intent.objectives.quality.accuracy_weight * accuracy +
        intent.objectives.quality.efficiency_weight * efficiency,
    };
  }

  /**
   * O: Optimize solution based on constraints
   */
  private optimizeSolution(
    solution: any,
    intent: Intent,
    insights: string[]
  ): any {
    // Apply optimization based on preferences
    const optimized = { ...solution };

    if (intent.preferences.quality_vs_speed === 'speed') {
      optimized.simplifications = [
        'Remove animations',
        'Reduce data density',
        'Minimize components',
      ];
    }

    if (intent.preferences.cost_vs_performance === 'cost') {
      optimized.cost_optimizations = [
        'Use client-side rendering',
        'Minimize API calls',
        'Use local caching',
      ];
    }

    optimized.optimization_insights = insights;

    return optimized;
  }

  /**
   * Helper: Select theme based on world context
   */
  private selectTheme(_world: WorldSpace): string {
    const currentHour = new Date().getHours();
    // Use dark theme during night hours (20:00 - 6:00)
    return currentHour >= 20 || currentHour < 6 ? 'dark' : 'light';
  }

  /**
   * Helper: Design data flow
   */
  private designDataFlow(dataSources: string[]): any {
    return dataSources.map((source, index) => ({
      source,
      fetch_strategy: 'real-time',
      cache_strategy: 'memory',
      priority: index + 1,
    }));
  }

  /**
   * Helper: Design interactions
   */
  private designInteractions(style: string): any {
    const interactions: any = {
      click: true,
      hover: style !== 'static',
      keyboard: true, // Always enable for accessibility
    };

    if (style === 'realtime') {
      interactions.websocket = true;
      interactions.auto_refresh = true;
    }

    return interactions;
  }

  /**
   * Calculate step quality score
   */
  private calculateStepQualityScore(output: any, step: ProcessStep): number {
    if (!output) return 0.0;

    // Base quality on output completeness
    let score = 0.7;

    // Bonus for having all expected fields
    if (typeof output === 'object' && Object.keys(output).length > 0) {
      score += 0.2;
    }

    // Bonus for step-specific quality
    if (step.name === 'D_design' && output.layout && output.components) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Run full SWML process for UI generation
   */
  async runFullProcess(
    intent: Intent,
    world: WorldSpace
  ): Promise<{
    strategy: any;
    quality: number;
    insights: string[];
  }> {
    // Initialize process
    this.initialize(intent.goals.primary);

    // Context for all steps
    const context = { intent, world };

    try {
      // A: Analyze
      const analysis = await this.executeStep('A_analyze', intent, context);

      // B: Breakdown
      const breakdown = await this.executeStep('B_breakdown', analysis.output, context);

      // C: Clarify
      const objectives = await this.executeStep('C_clarify', breakdown.output, context);

      // D: Design
      const architecture = await this.executeStep('D_design', objectives.output, context);

      // G: Generate (UI Strategy)
      const strategy = await this.executeStep('G_generate', architecture.output, context);

      // J: Judge
      await this.executeStep('J_judge', strategy.output, context);

      // O: Optimize
      const optimized = await this.executeStep('O_optimize', strategy.output, context);

      // Collect all insights
      const allInsights = this.process!.results.flatMap((r) => r.step_back_insights);

      return {
        strategy: optimized.output,
        quality: this.process!.overall_quality,
        insights: allInsights,
      };
    } catch (error) {
      console.error('SWML Process Error:', error);
      throw error;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// § 2. Export Singleton Instance
// ═══════════════════════════════════════════════════════════════════════

export const swmlOptimizer = new SWMLOptimizer();
