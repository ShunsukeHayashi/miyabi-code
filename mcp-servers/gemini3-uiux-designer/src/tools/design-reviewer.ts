import { Gemini3UXClient } from '../gemini-client.js';
import {
  DesignReviewScore,
  DesignReviewScoreSchema,
  IveDesignPrinciples,
} from '../types.js';

/**
 * Jonathan Ive Design Review System Instruction
 * Based on extreme minimalism and refined aesthetics
 */
const IVE_DESIGN_REVIEW_INSTRUCTION = `**Role:**
You are Jonathan Ive, the legendary design chief who shaped Apple's design language.
Your mission is to review UI/UX designs with extreme attention to detail, evaluating them against your 5 core principles.

**Your Design Philosophy:**
1. **${IveDesignPrinciples.MINIMALISM}**
   - Remove ALL unnecessary decoration
   - Every element must serve a purpose
   - Simplicity is the ultimate sophistication

2. **${IveDesignPrinciples.WHITESPACE}**
   - Generous padding (py-48, mb-24)
   - Let the design breathe
   - Whitespace is luxury, not emptiness

3. **${IveDesignPrinciples.COLOR}**
   - Grayscale foundation (white, gray-50, gray-900)
   - ONLY ONE accent color (e.g., blue-600)
   - Reject: multi-color gradients, rainbow schemes

4. **${IveDesignPrinciples.TYPOGRAPHY}**
   - Huge titles with ultra-light fonts (text-[120px] font-extralight)
   - Bold size contrast (7xl vs xl)
   - Tracking tight, leading tight
   - Clean, readable, elegant

5. **${IveDesignPrinciples.ANIMATION}**
   - Subtle, natural transitions (duration-200)
   - No pulse, bounce, or attention-grabbing effects
   - Movement should feel inevitable, not flashy

**Evaluation Criteria (100 points):**

**Visual Design (40 points):**
- Color Usage (10 pts): Grayscale + single accent? Or chaotic rainbow?
- Typography (10 pts): Clear hierarchy? Readable? Elegant?
- Whitespace (10 pts): Generous breathing room? Or cramped?
- Consistency (10 pts): Design system adherence?

**User Experience (40 points):**
- Intuitiveness (10 pts): Can user understand in 3 seconds?
- Accessibility (10 pts): WCAG 2.1 AA compliant? Color contrast?
- Responsiveness (10 pts): Mobile-first? Works on all devices?
- Performance (10 pts): Fast load? Lightweight? Optimized?

**Innovation (20 points):**
- Uniqueness (10 pts): Different from competitors?
- Progressiveness (10 pts): Modern patterns? Forward-thinking?

**Rating System:**
- **90-100**: Insanely Great (Ship it!)
- **80-89**: Good (Minor improvements, then ship)
- **70-79**: Needs Work (Major revisions required)
- **0-69**: Reject (Start over with Ive principles)

**Your Task:**
Analyze the provided design with deep thinking. Be brutally honest but constructive.
Identify specific issues with exact solutions. Use design terminology precisely.

**Examples of Good vs Bad:**

**❌ BAD (Reject - Score: 45/100)**
\`\`\`tsx
<div className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
  <div className="blur-xl opacity-30 animate-pulse">
    <h1 className="text-8xl bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text">
      🌸 Product Name ✨
    </h1>
  </div>
</div>
\`\`\`
Issues: 5+ colors, emoji spam, flashy animations, no whitespace

**✅ GOOD (Insanely Great - Score: 95/100)**
\`\`\`tsx
<section className="bg-white py-48 px-5 text-center">
  <div className="max-w-5xl mx-auto">
    <h1 className="text-[120px] font-extralight tracking-tighter text-gray-900 leading-none mb-6">
      Product Name
    </h1>
    <div className="h-px w-24 bg-gray-300 mx-auto mb-20"></div>
    <p className="text-2xl text-gray-600 font-light">
      Simple. Powerful. Beautiful.
    </p>
  </div>
</section>
\`\`\`
Strengths: Pure grayscale, massive title with ultra-light font, generous padding (py-48), 1px divider, minimal text

**Output Format:**
Return a structured JSON with detailed scores, strengths, weaknesses, and priority improvements.`;

/**
 * Design Reviewer Tool
 * Reviews designs using Jonathan Ive's principles
 */
export class DesignReviewer {
  constructor(private client: Gemini3UXClient) {}

  /**
   * Review a design with Ive's critical eye
   */
  async reviewDesign(
    designCode: string,
    designDescription: string,
    context?: string
  ): Promise<DesignReviewScore> {
    let fullPrompt = `${IVE_DESIGN_REVIEW_INSTRUCTION}

**Design to Review:**

**Description:**
${designDescription}

**Code:**
\`\`\`tsx
${designCode}
\`\`\``;

    if (context) {
      fullPrompt += `

**Additional Context:**
${context}`;
    }

    fullPrompt += `

**Your Task:**
1. Analyze this design against all 5 Ive principles
2. Score each category meticulously
3. Identify specific weaknesses with exact line numbers/elements
4. Provide concrete solutions for each issue
5. Prioritize improvements by impact

Use your deep thinking to be thorough and precise.`;

    const responseSchema = {
      type: 'object',
      properties: {
        overall_score: {
          type: 'number',
          minimum: 0,
          maximum: 100,
          description: 'Overall design score',
        },
        visual_design: {
          type: 'object',
          properties: {
            color_usage: {
              type: 'object',
              properties: {
                score: { type: 'number', minimum: 0, maximum: 10 },
                comment: { type: 'string' },
              },
              required: ['score', 'comment'],
            },
            typography: {
              type: 'object',
              properties: {
                score: { type: 'number', minimum: 0, maximum: 10 },
                comment: { type: 'string' },
              },
              required: ['score', 'comment'],
            },
            whitespace: {
              type: 'object',
              properties: {
                score: { type: 'number', minimum: 0, maximum: 10 },
                comment: { type: 'string' },
              },
              required: ['score', 'comment'],
            },
            consistency: {
              type: 'object',
              properties: {
                score: { type: 'number', minimum: 0, maximum: 10 },
                comment: { type: 'string' },
              },
              required: ['score', 'comment'],
            },
            total: { type: 'number', minimum: 0, maximum: 40 },
          },
          required: ['color_usage', 'typography', 'whitespace', 'consistency', 'total'],
        },
        user_experience: {
          type: 'object',
          properties: {
            intuitiveness: {
              type: 'object',
              properties: {
                score: { type: 'number', minimum: 0, maximum: 10 },
                comment: { type: 'string' },
              },
              required: ['score', 'comment'],
            },
            accessibility: {
              type: 'object',
              properties: {
                score: { type: 'number', minimum: 0, maximum: 10 },
                comment: { type: 'string' },
              },
              required: ['score', 'comment'],
            },
            responsiveness: {
              type: 'object',
              properties: {
                score: { type: 'number', minimum: 0, maximum: 10 },
                comment: { type: 'string' },
              },
              required: ['score', 'comment'],
            },
            performance: {
              type: 'object',
              properties: {
                score: { type: 'number', minimum: 0, maximum: 10 },
                comment: { type: 'string' },
              },
              required: ['score', 'comment'],
            },
            total: { type: 'number', minimum: 0, maximum: 40 },
          },
          required: ['intuitiveness', 'accessibility', 'responsiveness', 'performance', 'total'],
        },
        innovation: {
          type: 'object',
          properties: {
            uniqueness: {
              type: 'object',
              properties: {
                score: { type: 'number', minimum: 0, maximum: 10 },
                comment: { type: 'string' },
              },
              required: ['score', 'comment'],
            },
            progressiveness: {
              type: 'object',
              properties: {
                score: { type: 'number', minimum: 0, maximum: 10 },
                comment: { type: 'string' },
              },
              required: ['score', 'comment'],
            },
            total: { type: 'number', minimum: 0, maximum: 20 },
          },
          required: ['uniqueness', 'progressiveness', 'total'],
        },
        rating: {
          type: 'string',
          enum: ['Insanely Great', 'Good', 'Needs Work', 'Reject'],
          description: 'Overall rating',
        },
        strengths: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of design strengths',
        },
        weaknesses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              solution: { type: 'string' },
            },
            required: ['issue', 'solution'],
          },
          description: 'Weaknesses with solutions',
        },
        priority_improvements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              priority: {
                type: 'string',
                enum: ['P1', 'P2', 'P3'],
              },
              title: { type: 'string' },
              before: { type: 'string' },
              after: { type: 'string' },
              impact: { type: 'string' },
            },
            required: ['priority', 'title', 'before', 'after', 'impact'],
          },
        },
      },
      required: [
        'overall_score',
        'visual_design',
        'user_experience',
        'innovation',
        'rating',
        'strengths',
        'weaknesses',
        'priority_improvements',
      ],
    };

    const response = await this.client.generateStructuredContent<DesignReviewScore>(
      fullPrompt,
      responseSchema,
      {
        thinkingLevel: 'high',
        tools: {
          googleSearch: false,
          codeExecution: false,
        },
      }
    );

    return response;
  }

  /**
   * Quick score a design (faster, less detailed)
   */
  async quickScore(designCode: string): Promise<{ score: number; rating: string }> {
    const prompt = `${IVE_DESIGN_REVIEW_INSTRUCTION}

**Quick Score Task:**
Analyze this design and provide ONLY the overall score (0-100) and rating.

**Design Code:**
\`\`\`tsx
${designCode}
\`\`\`

**Output:** Just the score and rating.`;

    const responseSchema = {
      type: 'object',
      properties: {
        score: {
          type: 'number',
          minimum: 0,
          maximum: 100,
        },
        rating: {
          type: 'string',
          enum: ['Insanely Great', 'Good', 'Needs Work', 'Reject'],
        },
      },
      required: ['score', 'rating'],
    };

    const response = await this.client.generateStructuredContent<{ score: number; rating: string }>(
      prompt,
      responseSchema,
      {
        thinkingLevel: 'low',
      }
    );

    return response;
  }
}
