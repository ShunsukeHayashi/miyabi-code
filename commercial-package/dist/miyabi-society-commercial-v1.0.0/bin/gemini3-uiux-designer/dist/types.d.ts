import { z } from 'zod';
/**
 * Thinking levels for Gemini 3 API
 */
export type ThinkingLevel = 'low' | 'high' | 'medium';
/**
 * Jonathan Ive Design Principles
 */
export declare const IveDesignPrinciples: {
    readonly MINIMALISM: "Extreme minimalism - remove decoration, keep only essence";
    readonly WHITESPACE: "Generous whitespace - luxury of emptiness";
    readonly COLOR: "Refined colors - grayscale + single accent color";
    readonly TYPOGRAPHY: "Typography-focused - clean and bold size contrast";
    readonly ANIMATION: "Subtle animation - natural and delicate movements";
};
/**
 * Design Review Score Schema (100 points)
 */
export declare const DesignReviewScoreSchema: z.ZodObject<{
    overall_score: z.ZodNumber;
    visual_design: z.ZodObject<{
        color_usage: z.ZodObject<{
            score: z.ZodNumber;
            comment: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            score: number;
            comment: string;
        }, {
            score: number;
            comment: string;
        }>;
        typography: z.ZodObject<{
            score: z.ZodNumber;
            comment: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            score: number;
            comment: string;
        }, {
            score: number;
            comment: string;
        }>;
        whitespace: z.ZodObject<{
            score: z.ZodNumber;
            comment: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            score: number;
            comment: string;
        }, {
            score: number;
            comment: string;
        }>;
        consistency: z.ZodObject<{
            score: z.ZodNumber;
            comment: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            score: number;
            comment: string;
        }, {
            score: number;
            comment: string;
        }>;
        total: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        color_usage: {
            score: number;
            comment: string;
        };
        typography: {
            score: number;
            comment: string;
        };
        whitespace: {
            score: number;
            comment: string;
        };
        consistency: {
            score: number;
            comment: string;
        };
        total: number;
    }, {
        color_usage: {
            score: number;
            comment: string;
        };
        typography: {
            score: number;
            comment: string;
        };
        whitespace: {
            score: number;
            comment: string;
        };
        consistency: {
            score: number;
            comment: string;
        };
        total: number;
    }>;
    user_experience: z.ZodObject<{
        intuitiveness: z.ZodObject<{
            score: z.ZodNumber;
            comment: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            score: number;
            comment: string;
        }, {
            score: number;
            comment: string;
        }>;
        accessibility: z.ZodObject<{
            score: z.ZodNumber;
            comment: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            score: number;
            comment: string;
        }, {
            score: number;
            comment: string;
        }>;
        responsiveness: z.ZodObject<{
            score: z.ZodNumber;
            comment: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            score: number;
            comment: string;
        }, {
            score: number;
            comment: string;
        }>;
        performance: z.ZodObject<{
            score: z.ZodNumber;
            comment: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            score: number;
            comment: string;
        }, {
            score: number;
            comment: string;
        }>;
        total: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        total: number;
        intuitiveness: {
            score: number;
            comment: string;
        };
        accessibility: {
            score: number;
            comment: string;
        };
        responsiveness: {
            score: number;
            comment: string;
        };
        performance: {
            score: number;
            comment: string;
        };
    }, {
        total: number;
        intuitiveness: {
            score: number;
            comment: string;
        };
        accessibility: {
            score: number;
            comment: string;
        };
        responsiveness: {
            score: number;
            comment: string;
        };
        performance: {
            score: number;
            comment: string;
        };
    }>;
    innovation: z.ZodObject<{
        uniqueness: z.ZodObject<{
            score: z.ZodNumber;
            comment: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            score: number;
            comment: string;
        }, {
            score: number;
            comment: string;
        }>;
        progressiveness: z.ZodObject<{
            score: z.ZodNumber;
            comment: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            score: number;
            comment: string;
        }, {
            score: number;
            comment: string;
        }>;
        total: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        total: number;
        uniqueness: {
            score: number;
            comment: string;
        };
        progressiveness: {
            score: number;
            comment: string;
        };
    }, {
        total: number;
        uniqueness: {
            score: number;
            comment: string;
        };
        progressiveness: {
            score: number;
            comment: string;
        };
    }>;
    rating: z.ZodEnum<["Insanely Great", "Good", "Needs Work", "Reject"]>;
    strengths: z.ZodArray<z.ZodString, "many">;
    weaknesses: z.ZodArray<z.ZodObject<{
        issue: z.ZodString;
        solution: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        issue: string;
        solution: string;
    }, {
        issue: string;
        solution: string;
    }>, "many">;
    priority_improvements: z.ZodArray<z.ZodObject<{
        priority: z.ZodEnum<["P1", "P2", "P3"]>;
        title: z.ZodString;
        before: z.ZodString;
        after: z.ZodString;
        impact: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        priority: "P1" | "P2" | "P3";
        title: string;
        before: string;
        after: string;
        impact: string;
    }, {
        priority: "P1" | "P2" | "P3";
        title: string;
        before: string;
        after: string;
        impact: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    overall_score: number;
    visual_design: {
        color_usage: {
            score: number;
            comment: string;
        };
        typography: {
            score: number;
            comment: string;
        };
        whitespace: {
            score: number;
            comment: string;
        };
        consistency: {
            score: number;
            comment: string;
        };
        total: number;
    };
    user_experience: {
        total: number;
        intuitiveness: {
            score: number;
            comment: string;
        };
        accessibility: {
            score: number;
            comment: string;
        };
        responsiveness: {
            score: number;
            comment: string;
        };
        performance: {
            score: number;
            comment: string;
        };
    };
    innovation: {
        total: number;
        uniqueness: {
            score: number;
            comment: string;
        };
        progressiveness: {
            score: number;
            comment: string;
        };
    };
    rating: "Insanely Great" | "Good" | "Needs Work" | "Reject";
    strengths: string[];
    weaknesses: {
        issue: string;
        solution: string;
    }[];
    priority_improvements: {
        priority: "P1" | "P2" | "P3";
        title: string;
        before: string;
        after: string;
        impact: string;
    }[];
}, {
    overall_score: number;
    visual_design: {
        color_usage: {
            score: number;
            comment: string;
        };
        typography: {
            score: number;
            comment: string;
        };
        whitespace: {
            score: number;
            comment: string;
        };
        consistency: {
            score: number;
            comment: string;
        };
        total: number;
    };
    user_experience: {
        total: number;
        intuitiveness: {
            score: number;
            comment: string;
        };
        accessibility: {
            score: number;
            comment: string;
        };
        responsiveness: {
            score: number;
            comment: string;
        };
        performance: {
            score: number;
            comment: string;
        };
    };
    innovation: {
        total: number;
        uniqueness: {
            score: number;
            comment: string;
        };
        progressiveness: {
            score: number;
            comment: string;
        };
    };
    rating: "Insanely Great" | "Good" | "Needs Work" | "Reject";
    strengths: string[];
    weaknesses: {
        issue: string;
        solution: string;
    }[];
    priority_improvements: {
        priority: "P1" | "P2" | "P3";
        title: string;
        before: string;
        after: string;
        impact: string;
    }[];
}>;
export type DesignReviewScore = z.infer<typeof DesignReviewScoreSchema>;
/**
 * Design System Schema
 */
export declare const DesignSystemSchema: z.ZodObject<{
    color_palette: z.ZodObject<{
        primary: z.ZodString;
        secondary: z.ZodString;
        text: z.ZodString;
        accent: z.ZodString;
        border: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        primary: string;
        secondary: string;
        text: string;
        accent: string;
        border: string;
    }, {
        primary: string;
        secondary: string;
        text: string;
        accent: string;
        border: string;
    }>;
    typography: z.ZodObject<{
        hero: z.ZodObject<{
            class: z.ZodString;
            description: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            class: string;
            description: string;
        }, {
            class: string;
            description: string;
        }>;
        h1: z.ZodObject<{
            class: z.ZodString;
            description: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            class: string;
            description: string;
        }, {
            class: string;
            description: string;
        }>;
        h2: z.ZodObject<{
            class: z.ZodString;
            description: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            class: string;
            description: string;
        }, {
            class: string;
            description: string;
        }>;
        body: z.ZodObject<{
            class: z.ZodString;
            description: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            class: string;
            description: string;
        }, {
            class: string;
            description: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        hero: {
            class: string;
            description: string;
        };
        h1: {
            class: string;
            description: string;
        };
        h2: {
            class: string;
            description: string;
        };
        body: {
            class: string;
            description: string;
        };
    }, {
        hero: {
            class: string;
            description: string;
        };
        h1: {
            class: string;
            description: string;
        };
        h2: {
            class: string;
            description: string;
        };
        body: {
            class: string;
            description: string;
        };
    }>;
    spacing: z.ZodObject<{
        section_padding: z.ZodString;
        element_margin: z.ZodString;
        grid_gap: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        section_padding: string;
        element_margin: string;
        grid_gap: string;
    }, {
        section_padding: string;
        element_margin: string;
        grid_gap: string;
    }>;
    animation: z.ZodObject<{
        duration: z.ZodString;
        easing: z.ZodString;
        recommended_properties: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        duration: string;
        easing: string;
        recommended_properties: string[];
    }, {
        duration: string;
        easing: string;
        recommended_properties: string[];
    }>;
    principles: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    typography: {
        hero: {
            class: string;
            description: string;
        };
        h1: {
            class: string;
            description: string;
        };
        h2: {
            class: string;
            description: string;
        };
        body: {
            class: string;
            description: string;
        };
    };
    color_palette: {
        primary: string;
        secondary: string;
        text: string;
        accent: string;
        border: string;
    };
    spacing: {
        section_padding: string;
        element_margin: string;
        grid_gap: string;
    };
    animation: {
        duration: string;
        easing: string;
        recommended_properties: string[];
    };
    principles: string[];
}, {
    typography: {
        hero: {
            class: string;
            description: string;
        };
        h1: {
            class: string;
            description: string;
        };
        h2: {
            class: string;
            description: string;
        };
        body: {
            class: string;
            description: string;
        };
    };
    color_palette: {
        primary: string;
        secondary: string;
        text: string;
        accent: string;
        border: string;
    };
    spacing: {
        section_padding: string;
        element_margin: string;
        grid_gap: string;
    };
    animation: {
        duration: string;
        easing: string;
        recommended_properties: string[];
    };
    principles: string[];
}>;
export type DesignSystem = z.infer<typeof DesignSystemSchema>;
/**
 * Wireframe Schema
 */
export declare const WireframeSchema: z.ZodObject<{
    page_title: z.ZodString;
    layout_description: z.ZodString;
    sections: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        purpose: z.ZodString;
        components: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        name: string;
        purpose: string;
        components: string[];
    }, {
        name: string;
        purpose: string;
        components: string[];
    }>, "many">;
    user_flow: z.ZodArray<z.ZodString, "many">;
    wireframe_svg: z.ZodOptional<z.ZodString>;
    figma_url: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    page_title: string;
    layout_description: string;
    sections: {
        name: string;
        purpose: string;
        components: string[];
    }[];
    user_flow: string[];
    wireframe_svg?: string | undefined;
    figma_url?: string | undefined;
}, {
    page_title: string;
    layout_description: string;
    sections: {
        name: string;
        purpose: string;
        components: string[];
    }[];
    user_flow: string[];
    wireframe_svg?: string | undefined;
    figma_url?: string | undefined;
}>;
export type Wireframe = z.infer<typeof WireframeSchema>;
/**
 * High Fidelity Mockup Schema
 */
export declare const HighFidelityMockupSchema: z.ZodObject<{
    page_title: z.ZodString;
    design_rationale: z.ZodString;
    react_code: z.ZodString;
    design_system_used: z.ZodObject<{
        colors: z.ZodArray<z.ZodString, "many">;
        typography: z.ZodArray<z.ZodString, "many">;
        spacing: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        typography: string[];
        spacing: string[];
        colors: string[];
    }, {
        typography: string[];
        spacing: string[];
        colors: string[];
    }>;
    ive_principles_applied: z.ZodArray<z.ZodString, "many">;
    accessibility_features: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    page_title: string;
    design_rationale: string;
    react_code: string;
    design_system_used: {
        typography: string[];
        spacing: string[];
        colors: string[];
    };
    ive_principles_applied: string[];
    accessibility_features: string[];
}, {
    page_title: string;
    design_rationale: string;
    react_code: string;
    design_system_used: {
        typography: string[];
        spacing: string[];
        colors: string[];
    };
    ive_principles_applied: string[];
    accessibility_features: string[];
}>;
export type HighFidelityMockup = z.infer<typeof HighFidelityMockupSchema>;
/**
 * Accessibility Check Schema
 */
export declare const AccessibilityCheckSchema: z.ZodObject<{
    wcag_version: z.ZodString;
    overall_compliance: z.ZodEnum<["Pass", "Partial", "Fail"]>;
    checks: z.ZodArray<z.ZodObject<{
        criterion: z.ZodString;
        level: z.ZodEnum<["A", "AA", "AAA"]>;
        status: z.ZodEnum<["Pass", "Fail", "Not Applicable"]>;
        description: z.ZodString;
        issues: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        recommendations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        status: "Pass" | "Fail" | "Not Applicable";
        description: string;
        criterion: string;
        level: "A" | "AA" | "AAA";
        issues?: string[] | undefined;
        recommendations?: string[] | undefined;
    }, {
        status: "Pass" | "Fail" | "Not Applicable";
        description: string;
        criterion: string;
        level: "A" | "AA" | "AAA";
        issues?: string[] | undefined;
        recommendations?: string[] | undefined;
    }>, "many">;
    color_contrast_issues: z.ZodOptional<z.ZodArray<z.ZodObject<{
        element: z.ZodString;
        foreground: z.ZodString;
        background: z.ZodString;
        ratio: z.ZodNumber;
        required_ratio: z.ZodNumber;
        recommendation: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        element: string;
        foreground: string;
        background: string;
        ratio: number;
        required_ratio: number;
        recommendation: string;
    }, {
        element: string;
        foreground: string;
        background: string;
        ratio: number;
        required_ratio: number;
        recommendation: string;
    }>, "many">>;
    keyboard_navigation: z.ZodObject<{
        status: z.ZodEnum<["Pass", "Fail"]>;
        issues: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        issues: string[];
        status: "Pass" | "Fail";
    }, {
        issues: string[];
        status: "Pass" | "Fail";
    }>;
    screen_reader: z.ZodObject<{
        status: z.ZodEnum<["Pass", "Fail"]>;
        issues: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        issues: string[];
        status: "Pass" | "Fail";
    }, {
        issues: string[];
        status: "Pass" | "Fail";
    }>;
}, "strip", z.ZodTypeAny, {
    wcag_version: string;
    overall_compliance: "Pass" | "Partial" | "Fail";
    checks: {
        status: "Pass" | "Fail" | "Not Applicable";
        description: string;
        criterion: string;
        level: "A" | "AA" | "AAA";
        issues?: string[] | undefined;
        recommendations?: string[] | undefined;
    }[];
    keyboard_navigation: {
        issues: string[];
        status: "Pass" | "Fail";
    };
    screen_reader: {
        issues: string[];
        status: "Pass" | "Fail";
    };
    color_contrast_issues?: {
        element: string;
        foreground: string;
        background: string;
        ratio: number;
        required_ratio: number;
        recommendation: string;
    }[] | undefined;
}, {
    wcag_version: string;
    overall_compliance: "Pass" | "Partial" | "Fail";
    checks: {
        status: "Pass" | "Fail" | "Not Applicable";
        description: string;
        criterion: string;
        level: "A" | "AA" | "AAA";
        issues?: string[] | undefined;
        recommendations?: string[] | undefined;
    }[];
    keyboard_navigation: {
        issues: string[];
        status: "Pass" | "Fail";
    };
    screen_reader: {
        issues: string[];
        status: "Pass" | "Fail";
    };
    color_contrast_issues?: {
        element: string;
        foreground: string;
        background: string;
        ratio: number;
        required_ratio: number;
        recommendation: string;
    }[] | undefined;
}>;
export type AccessibilityCheck = z.infer<typeof AccessibilityCheckSchema>;
/**
 * Usability Analysis Schema
 */
export declare const UsabilityAnalysisSchema: z.ZodObject<{
    sus_score: z.ZodOptional<z.ZodNumber>;
    user_flow_analysis: z.ZodObject<{
        optimal_path: z.ZodArray<z.ZodString, "many">;
        actual_path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        friction_points: z.ZodArray<z.ZodObject<{
            step: z.ZodString;
            issue: z.ZodString;
            severity: z.ZodEnum<["low", "medium", "high", "critical"]>;
            solution: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            issue: string;
            solution: string;
            step: string;
            severity: "low" | "high" | "medium" | "critical";
        }, {
            issue: string;
            solution: string;
            step: string;
            severity: "low" | "high" | "medium" | "critical";
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        optimal_path: string[];
        friction_points: {
            issue: string;
            solution: string;
            step: string;
            severity: "low" | "high" | "medium" | "critical";
        }[];
        actual_path?: string[] | undefined;
    }, {
        optimal_path: string[];
        friction_points: {
            issue: string;
            solution: string;
            step: string;
            severity: "low" | "high" | "medium" | "critical";
        }[];
        actual_path?: string[] | undefined;
    }>;
    task_completion: z.ZodOptional<z.ZodObject<{
        success_rate: z.ZodOptional<z.ZodNumber>;
        average_time: z.ZodOptional<z.ZodString>;
        error_rate: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        success_rate?: number | undefined;
        average_time?: string | undefined;
        error_rate?: number | undefined;
    }, {
        success_rate?: number | undefined;
        average_time?: string | undefined;
        error_rate?: number | undefined;
    }>>;
    heuristic_evaluation: z.ZodArray<z.ZodObject<{
        heuristic: z.ZodString;
        rating: z.ZodNumber;
        findings: z.ZodString;
        severity: z.ZodEnum<["cosmetic", "minor", "major", "catastrophic"]>;
    }, "strip", z.ZodTypeAny, {
        rating: number;
        severity: "cosmetic" | "minor" | "major" | "catastrophic";
        heuristic: string;
        findings: string;
    }, {
        rating: number;
        severity: "cosmetic" | "minor" | "major" | "catastrophic";
        heuristic: string;
        findings: string;
    }>, "many">;
    recommendations: z.ZodArray<z.ZodObject<{
        priority: z.ZodEnum<["low", "medium", "high", "critical"]>;
        issue: z.ZodString;
        solution: z.ZodString;
        expected_impact: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        issue: string;
        solution: string;
        priority: "low" | "high" | "medium" | "critical";
        expected_impact: string;
    }, {
        issue: string;
        solution: string;
        priority: "low" | "high" | "medium" | "critical";
        expected_impact: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    recommendations: {
        issue: string;
        solution: string;
        priority: "low" | "high" | "medium" | "critical";
        expected_impact: string;
    }[];
    user_flow_analysis: {
        optimal_path: string[];
        friction_points: {
            issue: string;
            solution: string;
            step: string;
            severity: "low" | "high" | "medium" | "critical";
        }[];
        actual_path?: string[] | undefined;
    };
    heuristic_evaluation: {
        rating: number;
        severity: "cosmetic" | "minor" | "major" | "catastrophic";
        heuristic: string;
        findings: string;
    }[];
    sus_score?: number | undefined;
    task_completion?: {
        success_rate?: number | undefined;
        average_time?: string | undefined;
        error_rate?: number | undefined;
    } | undefined;
}, {
    recommendations: {
        issue: string;
        solution: string;
        priority: "low" | "high" | "medium" | "critical";
        expected_impact: string;
    }[];
    user_flow_analysis: {
        optimal_path: string[];
        friction_points: {
            issue: string;
            solution: string;
            step: string;
            severity: "low" | "high" | "medium" | "critical";
        }[];
        actual_path?: string[] | undefined;
    };
    heuristic_evaluation: {
        rating: number;
        severity: "cosmetic" | "minor" | "major" | "catastrophic";
        heuristic: string;
        findings: string;
    }[];
    sus_score?: number | undefined;
    task_completion?: {
        success_rate?: number | undefined;
        average_time?: string | undefined;
        error_rate?: number | undefined;
    } | undefined;
}>;
export type UsabilityAnalysis = z.infer<typeof UsabilityAnalysisSchema>;
/**
 * UX Writing Schema
 */
export declare const UXWritingSchema: z.ZodObject<{
    original_text: z.ZodString;
    optimized_text: z.ZodString;
    improvements: z.ZodArray<z.ZodObject<{
        aspect: z.ZodString;
        before: z.ZodString;
        after: z.ZodString;
        rationale: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        before: string;
        after: string;
        aspect: string;
        rationale: string;
    }, {
        before: string;
        after: string;
        aspect: string;
        rationale: string;
    }>, "many">;
    tone_analysis: z.ZodObject<{
        current_tone: z.ZodArray<z.ZodString, "many">;
        recommended_tone: z.ZodArray<z.ZodString, "many">;
        alignment_with_brand: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        current_tone: string[];
        recommended_tone: string[];
        alignment_with_brand: string;
    }, {
        current_tone: string[];
        recommended_tone: string[];
        alignment_with_brand: string;
    }>;
    readability: z.ZodObject<{
        reading_level: z.ZodString;
        avg_sentence_length: z.ZodOptional<z.ZodNumber>;
        complex_words: z.ZodOptional<z.ZodNumber>;
        recommendations: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        recommendations: string[];
        reading_level: string;
        avg_sentence_length?: number | undefined;
        complex_words?: number | undefined;
    }, {
        recommendations: string[];
        reading_level: string;
        avg_sentence_length?: number | undefined;
        complex_words?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    original_text: string;
    optimized_text: string;
    improvements: {
        before: string;
        after: string;
        aspect: string;
        rationale: string;
    }[];
    tone_analysis: {
        current_tone: string[];
        recommended_tone: string[];
        alignment_with_brand: string;
    };
    readability: {
        recommendations: string[];
        reading_level: string;
        avg_sentence_length?: number | undefined;
        complex_words?: number | undefined;
    };
}, {
    original_text: string;
    optimized_text: string;
    improvements: {
        before: string;
        after: string;
        aspect: string;
        rationale: string;
    }[];
    tone_analysis: {
        current_tone: string[];
        recommended_tone: string[];
        alignment_with_brand: string;
    };
    readability: {
        recommendations: string[];
        reading_level: string;
        avg_sentence_length?: number | undefined;
        complex_words?: number | undefined;
    };
}>;
export type UXWriting = z.infer<typeof UXWritingSchema>;
/**
 * Interaction Flow Schema
 */
export declare const InteractionFlowSchema: z.ZodObject<{
    flow_name: z.ZodString;
    objective: z.ZodString;
    steps: z.ZodArray<z.ZodObject<{
        step_number: z.ZodNumber;
        user_action: z.ZodString;
        system_response: z.ZodString;
        ui_state: z.ZodString;
        animation: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        step_number: number;
        user_action: string;
        system_response: string;
        ui_state: string;
        animation?: string | undefined;
    }, {
        step_number: number;
        user_action: string;
        system_response: string;
        ui_state: string;
        animation?: string | undefined;
    }>, "many">;
    interaction_patterns: z.ZodArray<z.ZodObject<{
        pattern_name: z.ZodString;
        description: z.ZodString;
        when_to_use: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        description: string;
        pattern_name: string;
        when_to_use: string;
    }, {
        description: string;
        pattern_name: string;
        when_to_use: string;
    }>, "many">;
    micro_interactions: z.ZodArray<z.ZodObject<{
        trigger: z.ZodString;
        feedback: z.ZodString;
        duration: z.ZodString;
        easing: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        duration: string;
        easing: string;
        trigger: string;
        feedback: string;
    }, {
        duration: string;
        easing: string;
        trigger: string;
        feedback: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    flow_name: string;
    objective: string;
    steps: {
        step_number: number;
        user_action: string;
        system_response: string;
        ui_state: string;
        animation?: string | undefined;
    }[];
    interaction_patterns: {
        description: string;
        pattern_name: string;
        when_to_use: string;
    }[];
    micro_interactions: {
        duration: string;
        easing: string;
        trigger: string;
        feedback: string;
    }[];
}, {
    flow_name: string;
    objective: string;
    steps: {
        step_number: number;
        user_action: string;
        system_response: string;
        ui_state: string;
        animation?: string | undefined;
    }[];
    interaction_patterns: {
        description: string;
        pattern_name: string;
        when_to_use: string;
    }[];
    micro_interactions: {
        duration: string;
        easing: string;
        trigger: string;
        feedback: string;
    }[];
}>;
export type InteractionFlow = z.infer<typeof InteractionFlowSchema>;
/**
 * Animation Specs Schema
 */
export declare const AnimationSpecsSchema: z.ZodObject<{
    animation_name: z.ZodString;
    purpose: z.ZodString;
    ive_principle: z.ZodString;
    specs: z.ZodObject<{
        duration: z.ZodString;
        easing: z.ZodString;
        properties: z.ZodArray<z.ZodString, "many">;
        timing: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        duration: string;
        easing: string;
        properties: string[];
        timing: string;
    }, {
        duration: string;
        easing: string;
        properties: string[];
        timing: string;
    }>;
    css_code: z.ZodString;
    framer_motion_code: z.ZodOptional<z.ZodString>;
    accessibility_notes: z.ZodArray<z.ZodString, "many">;
    performance_notes: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    purpose: string;
    animation_name: string;
    ive_principle: string;
    specs: {
        duration: string;
        easing: string;
        properties: string[];
        timing: string;
    };
    css_code: string;
    accessibility_notes: string[];
    performance_notes: string[];
    framer_motion_code?: string | undefined;
}, {
    purpose: string;
    animation_name: string;
    ive_principle: string;
    specs: {
        duration: string;
        easing: string;
        properties: string[];
        timing: string;
    };
    css_code: string;
    accessibility_notes: string[];
    performance_notes: string[];
    framer_motion_code?: string | undefined;
}>;
export type AnimationSpecs = z.infer<typeof AnimationSpecsSchema>;
/**
 * Consistency Evaluation Schema
 */
export declare const ConsistencyEvaluationSchema: z.ZodObject<{
    overall_consistency_score: z.ZodNumber;
    areas_evaluated: z.ZodArray<z.ZodObject<{
        area: z.ZodString;
        score: z.ZodNumber;
        consistent_elements: z.ZodArray<z.ZodString, "many">;
        inconsistent_elements: z.ZodArray<z.ZodObject<{
            element: z.ZodString;
            issue: z.ZodString;
            location: z.ZodString;
            recommendation: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            issue: string;
            element: string;
            recommendation: string;
            location: string;
        }, {
            issue: string;
            element: string;
            recommendation: string;
            location: string;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        score: number;
        area: string;
        consistent_elements: string[];
        inconsistent_elements: {
            issue: string;
            element: string;
            recommendation: string;
            location: string;
        }[];
    }, {
        score: number;
        area: string;
        consistent_elements: string[];
        inconsistent_elements: {
            issue: string;
            element: string;
            recommendation: string;
            location: string;
        }[];
    }>, "many">;
    brand_alignment: z.ZodObject<{
        score: z.ZodNumber;
        aligned_aspects: z.ZodArray<z.ZodString, "many">;
        misaligned_aspects: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        score: number;
        aligned_aspects: string[];
        misaligned_aspects: string[];
    }, {
        score: number;
        aligned_aspects: string[];
        misaligned_aspects: string[];
    }>;
    design_system_compliance: z.ZodObject<{
        score: z.ZodNumber;
        compliant_components: z.ZodArray<z.ZodString, "many">;
        non_compliant_components: z.ZodArray<z.ZodObject<{
            component: z.ZodString;
            deviation: z.ZodString;
            fix: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            component: string;
            deviation: string;
            fix: string;
        }, {
            component: string;
            deviation: string;
            fix: string;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        score: number;
        compliant_components: string[];
        non_compliant_components: {
            component: string;
            deviation: string;
            fix: string;
        }[];
    }, {
        score: number;
        compliant_components: string[];
        non_compliant_components: {
            component: string;
            deviation: string;
            fix: string;
        }[];
    }>;
}, "strip", z.ZodTypeAny, {
    overall_consistency_score: number;
    areas_evaluated: {
        score: number;
        area: string;
        consistent_elements: string[];
        inconsistent_elements: {
            issue: string;
            element: string;
            recommendation: string;
            location: string;
        }[];
    }[];
    brand_alignment: {
        score: number;
        aligned_aspects: string[];
        misaligned_aspects: string[];
    };
    design_system_compliance: {
        score: number;
        compliant_components: string[];
        non_compliant_components: {
            component: string;
            deviation: string;
            fix: string;
        }[];
    };
}, {
    overall_consistency_score: number;
    areas_evaluated: {
        score: number;
        area: string;
        consistent_elements: string[];
        inconsistent_elements: {
            issue: string;
            element: string;
            recommendation: string;
            location: string;
        }[];
    }[];
    brand_alignment: {
        score: number;
        aligned_aspects: string[];
        misaligned_aspects: string[];
    };
    design_system_compliance: {
        score: number;
        compliant_components: string[];
        non_compliant_components: {
            component: string;
            deviation: string;
            fix: string;
        }[];
    };
}>;
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
//# sourceMappingURL=types.d.ts.map