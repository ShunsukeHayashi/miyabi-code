import { IveDesignPrinciples } from '../types.js';
/**
 * Jonathan Ive Design System Generation Instruction
 */
const IVE_DESIGN_SYSTEM_INSTRUCTION = `**Role:**
You are creating a design system in the style of Jonathan Ive's Apple design language.

**Core Principles:**
1. ${IveDesignPrinciples.MINIMALISM} - Remove all excess
2. ${IveDesignPrinciples.WHITESPACE} - Generous spacing is luxury
3. ${IveDesignPrinciples.COLOR} - Grayscale + ONE accent color only
4. ${IveDesignPrinciples.TYPOGRAPHY} - Extreme size contrast with refined fonts
5. ${IveDesignPrinciples.ANIMATION} - Subtle, natural, inevitable

**Required Components:**

**Color Palette:**
- Primary: #FFFFFF (White) - The foundation
- Secondary: #F9FAFB (Gray-50) - Subtle backgrounds
- Text: #111827 (Gray-900) - High contrast text
- Accent: ONE color only (e.g., #2563EB for blue, or #111827 for ultra-minimal)
- Border: #E5E7EB (Gray-200) - Delicate lines

**Typography System:**
- Hero: font-extralight text-[120px] tracking-tighter leading-none
  (For landing page headlines - massive and ultra-light)
- H1: font-semibold text-7xl tracking-tight leading-tight
  (Section headers - bold and large)
- H2: font-semibold text-5xl tracking-tight
  (Subsection headers)
- Body: font-normal text-xl text-gray-600 leading-relaxed
  (Readable body text)

**Spacing Scale:**
- Section Padding: py-48 (192px) - Generous vertical space
- Element Margin: mb-24 (96px) - Breathing room between elements
- Grid Gap: gap-16 (64px) - Component spacing

**Animation Guidelines:**
- Duration: 200ms (Quick and imperceptible)
- Easing: ease-in-out (Natural motion)
- Properties: opacity, transform only (No color transitions)
- Avoid: pulse, bounce, shake, wiggle

**Example Usage:**
\`\`\`tsx
// Hero Section
<section className="bg-white py-48 text-center">
  <h1 className="text-[120px] font-extralight tracking-tighter text-gray-900">
    Product Name
  </h1>
  <div className="h-px w-24 bg-gray-300 mx-auto my-20"></div>
  <p className="text-2xl text-gray-600">Simple. Powerful. Beautiful.</p>
</section>
\`\`\`

**Output:**
Generate a complete design system with all specifications.`;
export class DesignSystemGenerator {
    client;
    constructor(client) {
        this.client = client;
    }
    async generateDesignSystem(projectName, brandIdentity, accentColor) {
        let prompt = `${IVE_DESIGN_SYSTEM_INSTRUCTION}

**Project:** ${projectName}`;
        if (brandIdentity) {
            prompt += `\n**Brand Identity:** ${brandIdentity}`;
        }
        if (accentColor) {
            prompt += `\n**Requested Accent Color:** ${accentColor} (validate it's minimal and appropriate)`;
        }
        else {
            prompt += `\n**Accent Color:** Choose between blue-600 (#2563EB) or use gray-900 for ultra-minimalism`;
        }
        prompt += `\n\n**Task:**
Create a complete design system following Ive principles.
Include precise Tailwind classes and hex codes.`;
        const responseSchema = {
            type: 'object',
            properties: {
                color_palette: {
                    type: 'object',
                    properties: {
                        primary: { type: 'string' },
                        secondary: { type: 'string' },
                        text: { type: 'string' },
                        accent: { type: 'string' },
                        border: { type: 'string' },
                    },
                    required: ['primary', 'secondary', 'text', 'accent', 'border'],
                },
                typography: {
                    type: 'object',
                    properties: {
                        hero: {
                            type: 'object',
                            properties: {
                                class: { type: 'string' },
                                description: { type: 'string' },
                            },
                            required: ['class', 'description'],
                        },
                        h1: {
                            type: 'object',
                            properties: {
                                class: { type: 'string' },
                                description: { type: 'string' },
                            },
                            required: ['class', 'description'],
                        },
                        h2: {
                            type: 'object',
                            properties: {
                                class: { type: 'string' },
                                description: { type: 'string' },
                            },
                            required: ['class', 'description'],
                        },
                        body: {
                            type: 'object',
                            properties: {
                                class: { type: 'string' },
                                description: { type: 'string' },
                            },
                            required: ['class', 'description'],
                        },
                    },
                    required: ['hero', 'h1', 'h2', 'body'],
                },
                spacing: {
                    type: 'object',
                    properties: {
                        section_padding: { type: 'string' },
                        element_margin: { type: 'string' },
                        grid_gap: { type: 'string' },
                    },
                    required: ['section_padding', 'element_margin', 'grid_gap'],
                },
                animation: {
                    type: 'object',
                    properties: {
                        duration: { type: 'string' },
                        easing: { type: 'string' },
                        recommended_properties: {
                            type: 'array',
                            items: { type: 'string' },
                        },
                    },
                    required: ['duration', 'easing', 'recommended_properties'],
                },
                principles: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Ive principles applied',
                },
            },
            required: ['color_palette', 'typography', 'spacing', 'animation', 'principles'],
        };
        const response = await this.client.generateStructuredContent(prompt, responseSchema, {
            thinkingLevel: 'high',
        });
        return response;
    }
}
//# sourceMappingURL=design-system-generator.js.map