#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { Gemini3UXClient } from './gemini-client.js';
import { DesignReviewer } from './tools/design-reviewer.js';
import { DesignSystemGenerator } from './tools/design-system-generator.js';
/**
 * Gemini 3 UI/UX Designer MCP Server
 *
 * Based on Jonathan Ive's design philosophy:
 * - Extreme minimalism
 * - Generous whitespace
 * - Refined colors (grayscale + one accent)
 * - Typography-focused
 * - Subtle animations
 */
class Gemini3UXDesignerServer {
    server;
    client;
    designReviewer;
    designSystemGenerator;
    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY environment variable is required');
        }
        this.client = new Gemini3UXClient({
            apiKey,
            model: 'gemini-3-pro-preview',
            thinkingLevel: 'high',
        });
        this.designReviewer = new DesignReviewer(this.client);
        this.designSystemGenerator = new DesignSystemGenerator(this.client);
        this.server = new Server({
            name: 'gemini3-uiux-designer',
            version: '1.0.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.setupHandlers();
    }
    setupHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: this.getTools(),
            };
        });
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                switch (name) {
                    case 'review_design':
                        return await this.handleReviewDesign(args);
                    case 'generate_design_system':
                        return await this.handleGenerateDesignSystem(args);
                    case 'create_wireframe':
                        return await this.handleCreateWireframe(args);
                    case 'generate_high_fidelity_mockup':
                        return await this.handleGenerateHiFiMockup(args);
                    case 'check_accessibility':
                        return await this.handleCheckAccessibility(args);
                    case 'analyze_usability':
                        return await this.handleAnalyzeUsability(args);
                    case 'optimize_ux_writing':
                        return await this.handleOptimizeUXWriting(args);
                    case 'design_interaction_flow':
                        return await this.handleDesignInteractionFlow(args);
                    case 'create_animation_specs':
                        return await this.handleCreateAnimationSpecs(args);
                    case 'evaluate_consistency':
                        return await this.handleEvaluateConsistency(args);
                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
            }
            catch (error) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error executing tool ${name}: ${error}`,
                        },
                    ],
                    isError: true,
                };
            }
        });
    }
    getTools() {
        return [
            {
                name: 'review_design',
                description: 'Review UI/UX design using Jonathan Ive\'s principles. Provides 100-point score with detailed feedback on visual design, UX, and innovation. Rating: Insanely Great (90-100), Good (80-89), Needs Work (70-79), or Reject (0-69).',
                inputSchema: {
                    type: 'object',
                    properties: {
                        designCode: {
                            type: 'string',
                            description: 'The React/TSX code to review',
                        },
                        designDescription: {
                            type: 'string',
                            description: 'Description of the design and its purpose',
                        },
                        context: {
                            type: 'string',
                            description: 'Optional additional context (target audience, platform, etc.)',
                        },
                    },
                    required: ['designCode', 'designDescription'],
                },
            },
            {
                name: 'generate_design_system',
                description: 'Generate a complete design system following Ive principles: grayscale colors + one accent, massive typography with contrast, generous spacing, and subtle animations.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        projectName: {
                            type: 'string',
                            description: 'Name of the project',
                        },
                        brandIdentity: {
                            type: 'string',
                            description: 'Optional brand identity description',
                        },
                        accentColor: {
                            type: 'string',
                            description: 'Optional accent color (hex code). If not provided, will choose blue-600 or gray-900',
                        },
                    },
                    required: ['projectName'],
                },
            },
            {
                name: 'create_wireframe',
                description: 'Create minimalist wireframes focusing on layout structure, user flow, and component hierarchy. No visual styling - pure structure.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        pageTitle: {
                            type: 'string',
                            description: 'Title/name of the page',
                        },
                        purpose: {
                            type: 'string',
                            description: 'What is this page trying to accomplish?',
                        },
                        userFlow: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Expected user flow steps',
                        },
                    },
                    required: ['pageTitle', 'purpose'],
                },
            },
            {
                name: 'generate_high_fidelity_mockup',
                description: 'Generate high-fidelity React mockup with full Ive styling: extreme minimalism, huge ultra-light titles, generous whitespace, grayscale + one accent.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        pageTitle: {
                            type: 'string',
                            description: 'Page title',
                        },
                        content: {
                            type: 'string',
                            description: 'Content description or wireframe to convert',
                        },
                        designSystem: {
                            type: 'object',
                            description: 'Optional design system to use (from generate_design_system)',
                        },
                    },
                    required: ['pageTitle', 'content'],
                },
            },
            {
                name: 'check_accessibility',
                description: 'Comprehensive WCAG 2.1 AA accessibility audit: color contrast, keyboard navigation, screen reader support, ARIA attributes, and compliance checking.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        designCode: {
                            type: 'string',
                            description: 'React/HTML code to audit',
                        },
                        wcagLevel: {
                            type: 'string',
                            enum: ['A', 'AA', 'AAA'],
                            description: 'WCAG compliance level (default: AA)',
                        },
                    },
                    required: ['designCode'],
                },
            },
            {
                name: 'analyze_usability',
                description: 'Usability analysis using Nielsen heuristics, user flow analysis, friction point identification, and SUS score estimation.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        designDescription: {
                            type: 'string',
                            description: 'Description of the design/flow',
                        },
                        userTask: {
                            type: 'string',
                            description: 'Primary task users need to complete',
                        },
                        designCode: {
                            type: 'string',
                            description: 'Optional React/HTML code',
                        },
                    },
                    required: ['designDescription', 'userTask'],
                },
            },
            {
                name: 'optimize_ux_writing',
                description: 'Optimize microcopy, button labels, error messages, and UI text for clarity, brevity, and tone. Follows UX writing best practices.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        originalText: {
                            type: 'string',
                            description: 'Text to optimize',
                        },
                        context: {
                            type: 'string',
                            description: 'Where this text appears (button, error, tooltip, etc.)',
                        },
                        tone: {
                            type: 'string',
                            description: 'Desired tone (professional, friendly, casual, etc.)',
                        },
                    },
                    required: ['originalText', 'context'],
                },
            },
            {
                name: 'design_interaction_flow',
                description: 'Design interaction flows with state transitions, micro-interactions, and feedback patterns. Specifies triggers, responses, and animations.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        flowName: {
                            type: 'string',
                            description: 'Name of the interaction flow',
                        },
                        objective: {
                            type: 'string',
                            description: 'What should this interaction accomplish?',
                        },
                        steps: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'High-level steps in the flow',
                        },
                    },
                    required: ['flowName', 'objective'],
                },
            },
            {
                name: 'create_animation_specs',
                description: 'Create subtle animation specifications following Ive principles: 200ms duration, natural easing, opacity/transform only. No flashy effects.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        animationName: {
                            type: 'string',
                            description: 'Name of the animation',
                        },
                        purpose: {
                            type: 'string',
                            description: 'What is this animation for?',
                        },
                        element: {
                            type: 'string',
                            description: 'Which element to animate (button, card, modal, etc.)',
                        },
                    },
                    required: ['animationName', 'purpose', 'element'],
                },
            },
            {
                name: 'evaluate_consistency',
                description: 'Evaluate design consistency across pages/components. Checks color usage, typography, spacing, component patterns, and design system adherence.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        designs: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    code: { type: 'string' },
                                },
                                required: ['name', 'code'],
                            },
                            description: 'Multiple designs to compare',
                        },
                        designSystem: {
                            type: 'object',
                            description: 'Optional design system to check against',
                        },
                    },
                    required: ['designs'],
                },
            },
        ];
    }
    // Tool Handlers
    async handleReviewDesign(args) {
        const response = await this.designReviewer.reviewDesign(args.designCode, args.designDescription, args.context);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(response, null, 2),
                },
            ],
        };
    }
    async handleGenerateDesignSystem(args) {
        const response = await this.designSystemGenerator.generateDesignSystem(args.projectName, args.brandIdentity, args.accentColor);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(response, null, 2),
                },
            ],
        };
    }
    async handleCreateWireframe(args) {
        // Use client directly for wireframe generation
        const prompt = `Create a minimalist wireframe for: ${args.pageTitle}
Purpose: ${args.purpose}
${args.userFlow ? `User Flow: ${args.userFlow.join(' → ')}` : ''}

Focus on layout structure, component hierarchy, and user flow. No visual styling.`;
        const responseSchema = {
            type: 'object',
            properties: {
                page_title: { type: 'string' },
                layout_description: { type: 'string' },
                sections: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            name: { type: 'string' },
                            purpose: { type: 'string' },
                            components: {
                                type: 'array',
                                items: { type: 'string' },
                            },
                        },
                        required: ['name', 'purpose', 'components'],
                    },
                },
                user_flow: {
                    type: 'array',
                    items: { type: 'string' },
                },
            },
            required: ['page_title', 'layout_description', 'sections', 'user_flow'],
        };
        const response = await this.client.generateStructuredContent(prompt, responseSchema, { thinkingLevel: 'high' });
        return {
            content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
        };
    }
    async handleGenerateHiFiMockup(args) {
        const prompt = `Generate a high-fidelity React mockup using Jonathan Ive's design principles:

Page: ${args.pageTitle}
Content: ${args.content}
${args.designSystem ? `Design System: ${JSON.stringify(args.designSystem)}` : ''}

Apply:
- Extreme minimalism
- Huge ultra-light title (text-[120px] font-extralight)
- Generous whitespace (py-48)
- Grayscale + one accent color
- Subtle animations (duration-200)
- 1px delicate lines

Return complete React TSX with Tailwind CSS.`;
        const responseSchema = {
            type: 'object',
            properties: {
                page_title: { type: 'string' },
                design_rationale: { type: 'string' },
                react_code: { type: 'string' },
                design_system_used: {
                    type: 'object',
                    properties: {
                        colors: { type: 'array', items: { type: 'string' } },
                        typography: { type: 'array', items: { type: 'string' } },
                        spacing: { type: 'array', items: { type: 'string' } },
                    },
                },
                ive_principles_applied: {
                    type: 'array',
                    items: { type: 'string' },
                },
                accessibility_features: {
                    type: 'array',
                    items: { type: 'string' },
                },
            },
            required: ['page_title', 'design_rationale', 'react_code'],
        };
        const response = await this.client.generateStructuredContent(prompt, responseSchema, { thinkingLevel: 'high' });
        return {
            content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
        };
    }
    async handleCheckAccessibility(args) {
        const prompt = `Perform WCAG ${args.wcagLevel || 'AA'} accessibility audit on:

\`\`\`tsx
${args.designCode}
\`\`\`

Check:
- Color contrast ratios (4.5:1 for normal text, 3:1 for large)
- Keyboard navigation (tab order, focus indicators)
- Screen reader support (ARIA labels, semantic HTML)
- Form accessibility
- Image alt text

Provide detailed compliance report.`;
        const responseSchema = {
            type: 'object',
            properties: {
                wcag_version: { type: 'string' },
                overall_compliance: {
                    type: 'string',
                    enum: ['Pass', 'Partial', 'Fail'],
                },
                checks: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            criterion: { type: 'string' },
                            level: { type: 'string', enum: ['A', 'AA', 'AAA'] },
                            status: { type: 'string', enum: ['Pass', 'Fail', 'Not Applicable'] },
                            description: { type: 'string' },
                            issues: { type: 'array', items: { type: 'string' } },
                            recommendations: { type: 'array', items: { type: 'string' } },
                        },
                    },
                },
                keyboard_navigation: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', enum: ['Pass', 'Fail'] },
                        issues: { type: 'array', items: { type: 'string' } },
                    },
                },
                screen_reader: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', enum: ['Pass', 'Fail'] },
                        issues: { type: 'array', items: { type: 'string' } },
                    },
                },
            },
            required: ['wcag_version', 'overall_compliance', 'checks'],
        };
        const response = await this.client.generateStructuredContent(prompt, responseSchema, { thinkingLevel: 'high' });
        return {
            content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
        };
    }
    async handleAnalyzeUsability(args) {
        const prompt = `Analyze usability for:

Design: ${args.designDescription}
User Task: ${args.userTask}
${args.designCode ? `Code:\n\`\`\`tsx\n${args.designCode}\n\`\`\`` : ''}

Use Nielsen's 10 Usability Heuristics:
1. Visibility of system status
2. Match between system and real world
3. User control and freedom
4. Consistency and standards
5. Error prevention
6. Recognition rather than recall
7. Flexibility and efficiency of use
8. Aesthetic and minimalist design
9. Help users recognize, diagnose, and recover from errors
10. Help and documentation

Identify friction points and provide solutions.`;
        const responseSchema = {
            type: 'object',
            properties: {
                user_flow_analysis: {
                    type: 'object',
                    properties: {
                        optimal_path: { type: 'array', items: { type: 'string' } },
                        friction_points: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    step: { type: 'string' },
                                    issue: { type: 'string' },
                                    severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                                    solution: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                heuristic_evaluation: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            heuristic: { type: 'string' },
                            rating: { type: 'number', minimum: 0, maximum: 4 },
                            findings: { type: 'string' },
                            severity: { type: 'string', enum: ['cosmetic', 'minor', 'major', 'catastrophic'] },
                        },
                    },
                },
                recommendations: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                            issue: { type: 'string' },
                            solution: { type: 'string' },
                            expected_impact: { type: 'string' },
                        },
                    },
                },
            },
            required: ['user_flow_analysis', 'heuristic_evaluation', 'recommendations'],
        };
        const response = await this.client.generateStructuredContent(prompt, responseSchema, { thinkingLevel: 'high' });
        return {
            content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
        };
    }
    async handleOptimizeUXWriting(args) {
        const prompt = `Optimize UX writing:

Original: "${args.originalText}"
Context: ${args.context}
Tone: ${args.tone || 'Professional and friendly'}

Principles:
- Clarity: Be specific and unambiguous
- Brevity: Use fewest words possible
- Consistency: Match platform conventions
- Actionable: Verbs over nouns
- Human: Conversational but professional

Provide optimized version with rationale.`;
        const responseSchema = {
            type: 'object',
            properties: {
                original_text: { type: 'string' },
                optimized_text: { type: 'string' },
                improvements: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            aspect: { type: 'string' },
                            before: { type: 'string' },
                            after: { type: 'string' },
                            rationale: { type: 'string' },
                        },
                    },
                },
                tone_analysis: {
                    type: 'object',
                    properties: {
                        current_tone: { type: 'array', items: { type: 'string' } },
                        recommended_tone: { type: 'array', items: { type: 'string' } },
                        alignment_with_brand: { type: 'string' },
                    },
                },
                readability: {
                    type: 'object',
                    properties: {
                        reading_level: { type: 'string' },
                        recommendations: { type: 'array', items: { type: 'string' } },
                    },
                },
            },
            required: ['original_text', 'optimized_text', 'improvements'],
        };
        const response = await this.client.generateStructuredContent(prompt, responseSchema, { thinkingLevel: 'high' });
        return {
            content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
        };
    }
    async handleDesignInteractionFlow(args) {
        const prompt = `Design interaction flow:

Flow: ${args.flowName}
Objective: ${args.objective}
${args.steps ? `Steps: ${args.steps.join(' → ')}` : ''}

Design:
- User actions and system responses
- UI state transitions
- Micro-interactions (hover, click, loading)
- Feedback patterns (success, error, progress)
- Animation timing (follow Ive principles: subtle, 200ms)

Provide complete interaction specification.`;
        const responseSchema = {
            type: 'object',
            properties: {
                flow_name: { type: 'string' },
                objective: { type: 'string' },
                steps: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            step_number: { type: 'number' },
                            user_action: { type: 'string' },
                            system_response: { type: 'string' },
                            ui_state: { type: 'string' },
                            animation: { type: 'string' },
                        },
                    },
                },
                interaction_patterns: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            pattern_name: { type: 'string' },
                            description: { type: 'string' },
                            when_to_use: { type: 'string' },
                        },
                    },
                },
                micro_interactions: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            trigger: { type: 'string' },
                            feedback: { type: 'string' },
                            duration: { type: 'string' },
                            easing: { type: 'string' },
                        },
                    },
                },
            },
            required: ['flow_name', 'objective', 'steps'],
        };
        const response = await this.client.generateStructuredContent(prompt, responseSchema, { thinkingLevel: 'high' });
        return {
            content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
        };
    }
    async handleCreateAnimationSpecs(args) {
        const prompt = `Create animation specs following Ive principles:

Animation: ${args.animationName}
Purpose: ${args.purpose}
Element: ${args.element}

Ive Animation Rules:
- Duration: 200ms (quick, imperceptible)
- Easing: ease-in-out (natural)
- Properties: opacity, transform ONLY (no color)
- Avoid: pulse, bounce, shake, wiggle
- Goal: Natural, inevitable, subtle

Provide Tailwind CSS and Framer Motion code.`;
        const responseSchema = {
            type: 'object',
            properties: {
                animation_name: { type: 'string' },
                purpose: { type: 'string' },
                ive_principle: { type: 'string' },
                specs: {
                    type: 'object',
                    properties: {
                        duration: { type: 'string' },
                        easing: { type: 'string' },
                        properties: { type: 'array', items: { type: 'string' } },
                        timing: { type: 'string' },
                    },
                },
                css_code: { type: 'string' },
                framer_motion_code: { type: 'string' },
                accessibility_notes: {
                    type: 'array',
                    items: { type: 'string' },
                },
                performance_notes: {
                    type: 'array',
                    items: { type: 'string' },
                },
            },
            required: ['animation_name', 'purpose', 'specs', 'css_code'],
        };
        const response = await this.client.generateStructuredContent(prompt, responseSchema, { thinkingLevel: 'high' });
        return {
            content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
        };
    }
    async handleEvaluateConsistency(args) {
        const designsList = args.designs.map((d) => `${d.name}:\n\`\`\`tsx\n${d.code}\n\`\`\``).join('\n\n');
        const prompt = `Evaluate design consistency across multiple designs:

${designsList}

${args.designSystem ? `Design System:\n${JSON.stringify(args.designSystem, null, 2)}` : ''}

Check:
- Color usage consistency
- Typography hierarchy
- Spacing patterns
- Component patterns
- Design system adherence
- Brand alignment

Identify inconsistencies and provide fixes.`;
        const responseSchema = {
            type: 'object',
            properties: {
                overall_consistency_score: {
                    type: 'number',
                    minimum: 0,
                    maximum: 100,
                },
                areas_evaluated: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            area: { type: 'string' },
                            score: { type: 'number', minimum: 0, maximum: 10 },
                            consistent_elements: { type: 'array', items: { type: 'string' } },
                            inconsistent_elements: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        element: { type: 'string' },
                                        issue: { type: 'string' },
                                        location: { type: 'string' },
                                        recommendation: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                },
                brand_alignment: {
                    type: 'object',
                    properties: {
                        score: { type: 'number', minimum: 0, maximum: 100 },
                        aligned_aspects: { type: 'array', items: { type: 'string' } },
                        misaligned_aspects: { type: 'array', items: { type: 'string' } },
                    },
                },
                design_system_compliance: {
                    type: 'object',
                    properties: {
                        score: { type: 'number', minimum: 0, maximum: 100 },
                        compliant_components: { type: 'array', items: { type: 'string' } },
                        non_compliant_components: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    component: { type: 'string' },
                                    deviation: { type: 'string' },
                                    fix: { type: 'string' },
                                },
                            },
                        },
                    },
                },
            },
            required: ['overall_consistency_score', 'areas_evaluated'],
        };
        const response = await this.client.generateStructuredContent(prompt, responseSchema, { thinkingLevel: 'high' });
        return {
            content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
        };
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Gemini 3 UI/UX Designer MCP Server running on stdio');
        console.error(`Model: ${this.client.getModelInfo()}`);
        console.error('Design Philosophy: Jonathan Ive - Extreme Minimalism');
    }
}
const server = new Gemini3UXDesignerServer();
server.run().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map