import { z } from 'zod';

/**
 * Thinking levels for Gemini 3 API
 */
export type ThinkingLevel = 'low' | 'high' | 'medium';

/**
 * Jonathan Ive Design Principles
 */
export const IveDesignPrinciples = {
  MINIMALISM: 'Extreme minimalism - remove decoration, keep only essence',
  WHITESPACE: 'Generous whitespace - luxury of emptiness',
  COLOR: 'Refined colors - grayscale + single accent color',
  TYPOGRAPHY: 'Typography-focused - clean and bold size contrast',
  ANIMATION: 'Subtle animation - natural and delicate movements',
} as const;

/**
 * Design Review Score Schema (100 points)
 */
export const DesignReviewScoreSchema = z.object({
  overall_score: z.number().min(0).max(100).describe('Overall design score out of 100'),
  visual_design: z.object({
    color_usage: z.object({
      score: z.number().min(0).max(10),
      comment: z.string(),
    }),
    typography: z.object({
      score: z.number().min(0).max(10),
      comment: z.string(),
    }),
    whitespace: z.object({
      score: z.number().min(0).max(10),
      comment: z.string(),
    }),
    consistency: z.object({
      score: z.number().min(0).max(10),
      comment: z.string(),
    }),
    total: z.number().min(0).max(40),
  }),
  user_experience: z.object({
    intuitiveness: z.object({
      score: z.number().min(0).max(10),
      comment: z.string(),
    }),
    accessibility: z.object({
      score: z.number().min(0).max(10),
      comment: z.string(),
    }),
    responsiveness: z.object({
      score: z.number().min(0).max(10),
      comment: z.string(),
    }),
    performance: z.object({
      score: z.number().min(0).max(10),
      comment: z.string(),
    }),
    total: z.number().min(0).max(40),
  }),
  innovation: z.object({
    uniqueness: z.object({
      score: z.number().min(0).max(10),
      comment: z.string(),
    }),
    progressiveness: z.object({
      score: z.number().min(0).max(10),
      comment: z.string(),
    }),
    total: z.number().min(0).max(20),
  }),
  rating: z.enum(['Insanely Great', 'Good', 'Needs Work', 'Reject']),
  strengths: z.array(z.string()).describe('List of strengths'),
  weaknesses: z.array(z.object({
    issue: z.string(),
    solution: z.string(),
  })).describe('List of weaknesses with solutions'),
  priority_improvements: z.array(z.object({
    priority: z.enum(['P1', 'P2', 'P3']),
    title: z.string(),
    before: z.string(),
    after: z.string(),
    impact: z.string(),
  })),
});

export type DesignReviewScore = z.infer<typeof DesignReviewScoreSchema>;

/**
 * Design System Schema
 */
export const DesignSystemSchema = z.object({
  color_palette: z.object({
    primary: z.string().describe('Primary color (usually white)'),
    secondary: z.string().describe('Secondary background (gray-50)'),
    text: z.string().describe('Text color (gray-900)'),
    accent: z.string().describe('Single accent color'),
    border: z.string().describe('Border color (gray-200)'),
  }),
  typography: z.object({
    hero: z.object({
      class: z.string(),
      description: z.string(),
    }),
    h1: z.object({
      class: z.string(),
      description: z.string(),
    }),
    h2: z.object({
      class: z.string(),
      description: z.string(),
    }),
    body: z.object({
      class: z.string(),
      description: z.string(),
    }),
  }),
  spacing: z.object({
    section_padding: z.string(),
    element_margin: z.string(),
    grid_gap: z.string(),
  }),
  animation: z.object({
    duration: z.string(),
    easing: z.string(),
    recommended_properties: z.array(z.string()),
  }),
  principles: z.array(z.string()).describe('Design principles applied'),
});

export type DesignSystem = z.infer<typeof DesignSystemSchema>;

/**
 * Wireframe Schema
 */
export const WireframeSchema = z.object({
  page_title: z.string(),
  layout_description: z.string(),
  sections: z.array(z.object({
    name: z.string(),
    purpose: z.string(),
    components: z.array(z.string()),
  })),
  user_flow: z.array(z.string()),
  wireframe_svg: z.string().optional().describe('SVG representation of wireframe'),
  figma_url: z.string().optional().describe('Figma prototype URL if available'),
});

export type Wireframe = z.infer<typeof WireframeSchema>;

/**
 * High Fidelity Mockup Schema
 */
export const HighFidelityMockupSchema = z.object({
  page_title: z.string(),
  design_rationale: z.string().describe('Why this design was chosen'),
  react_code: z.string().describe('Complete React TSX component with Tailwind CSS'),
  design_system_used: z.object({
    colors: z.array(z.string()),
    typography: z.array(z.string()),
    spacing: z.array(z.string()),
  }),
  ive_principles_applied: z.array(z.string()),
  accessibility_features: z.array(z.string()),
});

export type HighFidelityMockup = z.infer<typeof HighFidelityMockupSchema>;

/**
 * Accessibility Check Schema
 */
export const AccessibilityCheckSchema = z.object({
  wcag_version: z.string().describe('WCAG version (e.g., 2.1 AA)'),
  overall_compliance: z.enum(['Pass', 'Partial', 'Fail']),
  checks: z.array(z.object({
    criterion: z.string().describe('WCAG criterion (e.g., 1.4.3 Contrast)'),
    level: z.enum(['A', 'AA', 'AAA']),
    status: z.enum(['Pass', 'Fail', 'Not Applicable']),
    description: z.string(),
    issues: z.array(z.string()).optional(),
    recommendations: z.array(z.string()).optional(),
  })),
  color_contrast_issues: z.array(z.object({
    element: z.string(),
    foreground: z.string(),
    background: z.string(),
    ratio: z.number(),
    required_ratio: z.number(),
    recommendation: z.string(),
  })).optional(),
  keyboard_navigation: z.object({
    status: z.enum(['Pass', 'Fail']),
    issues: z.array(z.string()),
  }),
  screen_reader: z.object({
    status: z.enum(['Pass', 'Fail']),
    issues: z.array(z.string()),
  }),
});

export type AccessibilityCheck = z.infer<typeof AccessibilityCheckSchema>;

/**
 * Usability Analysis Schema
 */
export const UsabilityAnalysisSchema = z.object({
  sus_score: z.number().min(0).max(100).optional().describe('System Usability Scale score'),
  user_flow_analysis: z.object({
    optimal_path: z.array(z.string()),
    actual_path: z.array(z.string()).optional(),
    friction_points: z.array(z.object({
      step: z.string(),
      issue: z.string(),
      severity: z.enum(['low', 'medium', 'high', 'critical']),
      solution: z.string(),
    })),
  }),
  task_completion: z.object({
    success_rate: z.number().min(0).max(100).optional(),
    average_time: z.string().optional(),
    error_rate: z.number().min(0).max(100).optional(),
  }).optional(),
  heuristic_evaluation: z.array(z.object({
    heuristic: z.string().describe('Nielsen heuristic name'),
    rating: z.number().min(0).max(4),
    findings: z.string(),
    severity: z.enum(['cosmetic', 'minor', 'major', 'catastrophic']),
  })),
  recommendations: z.array(z.object({
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    issue: z.string(),
    solution: z.string(),
    expected_impact: z.string(),
  })),
});

export type UsabilityAnalysis = z.infer<typeof UsabilityAnalysisSchema>;

/**
 * UX Writing Schema
 */
export const UXWritingSchema = z.object({
  original_text: z.string(),
  optimized_text: z.string(),
  improvements: z.array(z.object({
    aspect: z.string().describe('e.g., Clarity, Brevity, Tone'),
    before: z.string(),
    after: z.string(),
    rationale: z.string(),
  })),
  tone_analysis: z.object({
    current_tone: z.array(z.string()),
    recommended_tone: z.array(z.string()),
    alignment_with_brand: z.string(),
  }),
  readability: z.object({
    reading_level: z.string(),
    avg_sentence_length: z.number().optional(),
    complex_words: z.number().optional(),
    recommendations: z.array(z.string()),
  }),
});

export type UXWriting = z.infer<typeof UXWritingSchema>;

/**
 * Interaction Flow Schema
 */
export const InteractionFlowSchema = z.object({
  flow_name: z.string(),
  objective: z.string(),
  steps: z.array(z.object({
    step_number: z.number(),
    user_action: z.string(),
    system_response: z.string(),
    ui_state: z.string(),
    animation: z.string().optional(),
  })),
  interaction_patterns: z.array(z.object({
    pattern_name: z.string(),
    description: z.string(),
    when_to_use: z.string(),
  })),
  micro_interactions: z.array(z.object({
    trigger: z.string(),
    feedback: z.string(),
    duration: z.string(),
    easing: z.string(),
  })),
});

export type InteractionFlow = z.infer<typeof InteractionFlowSchema>;

/**
 * Animation Specs Schema
 */
export const AnimationSpecsSchema = z.object({
  animation_name: z.string(),
  purpose: z.string(),
  ive_principle: z.string().describe('Which Ive principle this follows'),
  specs: z.object({
    duration: z.string(),
    easing: z.string(),
    properties: z.array(z.string()),
    timing: z.string(),
  }),
  css_code: z.string().describe('Tailwind CSS classes or custom CSS'),
  framer_motion_code: z.string().optional().describe('Framer Motion variant if applicable'),
  accessibility_notes: z.array(z.string()),
  performance_notes: z.array(z.string()),
});

export type AnimationSpecs = z.infer<typeof AnimationSpecsSchema>;

/**
 * Consistency Evaluation Schema
 */
export const ConsistencyEvaluationSchema = z.object({
  overall_consistency_score: z.number().min(0).max(100),
  areas_evaluated: z.array(z.object({
    area: z.string().describe('e.g., Color usage, Typography, Spacing'),
    score: z.number().min(0).max(10),
    consistent_elements: z.array(z.string()),
    inconsistent_elements: z.array(z.object({
      element: z.string(),
      issue: z.string(),
      location: z.string(),
      recommendation: z.string(),
    })),
  })),
  brand_alignment: z.object({
    score: z.number().min(0).max(100),
    aligned_aspects: z.array(z.string()),
    misaligned_aspects: z.array(z.string()),
  }),
  design_system_compliance: z.object({
    score: z.number().min(0).max(100),
    compliant_components: z.array(z.string()),
    non_compliant_components: z.array(z.object({
      component: z.string(),
      deviation: z.string(),
      fix: z.string(),
    })),
  }),
});

export type ConsistencyEvaluation = z.infer<typeof ConsistencyEvaluationSchema>;

/**
 * Gemini 3 API Configuration
 */
export interface Gemini3Config {
  apiKey: string;
  model?: string;
  thinkingLevel?: ThinkingLevel;
  temperature?: number;
  topP?: number;
  maxOutputTokens?: number;
}

/**
 * Tool configuration
 */
export interface ToolConfig {
  codeExecution?: boolean;
  googleSearch?: boolean;
  fileSearch?: boolean;
  urlContext?: boolean;
}
