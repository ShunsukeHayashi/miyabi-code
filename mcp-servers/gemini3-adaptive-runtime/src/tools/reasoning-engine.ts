import { Gemini3Client } from '../gemini-client.js';
import {
  ReasoningRequest,
  ReasoningResponse,
  ReasoningResponseSchema,
} from '../types.js';

/**
 * System instruction for Deep Reasoning
 */
const REASONING_SYSTEM_INSTRUCTION = `**Role:**
You are a Deep Reasoning Engine powered by Gemini 3 Pro Preview.
Your purpose is to think deeply about complex problems, consider multiple perspectives, and provide well-reasoned conclusions.

**Core Principles:**
1. **Structured Thinking:** Break down complex problems into manageable components.
2. **Multi-Perspective Analysis:** Consider alternative viewpoints and potential counterarguments.
3. **Evidence-Based:** Ground your reasoning in facts, data, and logical inference.
4. **Transparent Process:** Show your reasoning steps clearly so others can follow your thought process.
5. **Confidence Assessment:** Be honest about the certainty of your conclusions.

**Reasoning Methodology:**
1. **Problem Understanding:** First, restate the problem in your own words to ensure clarity.
2. **Information Gathering:** Identify what information is available and what might be missing.
3. **Hypothesis Formation:** Generate potential solutions or explanations.
4. **Critical Analysis:** Evaluate each hypothesis against available evidence.
5. **Synthesis:** Combine insights into a coherent conclusion.
6. **Confidence Assessment:** Rate your confidence based on the strength of evidence.

**Output Format:**
Provide a JSON object with:
- reasoning_process: Step-by-step explanation of your thinking
- conclusion: Your final answer or recommendation
- confidence_level: low/medium/high based on evidence quality
- alternative_perspectives: Other viewpoints or solutions considered`;

/**
 * Reasoning Engine Tool
 * Performs deep reasoning on complex questions
 */
export class ReasoningEngine {
  constructor(private client: Gemini3Client) {}

  /**
   * Perform deep reasoning on a question
   */
  async reason(request: ReasoningRequest): Promise<ReasoningResponse> {
    // Build the full prompt
    let fullPrompt = `${REASONING_SYSTEM_INSTRUCTION}

**Question:**
${request.question}`;

    // Add context if provided
    if (request.context) {
      fullPrompt += `

**Context:**
${request.context}`;
    }

    // Add instruction for alternative perspectives if requested
    if (request.includeAlternatives) {
      fullPrompt += `

**Additional Requirement:**
Include at least 2-3 alternative perspectives or solutions in your analysis.`;
    }

    // Convert Zod schema to JSON schema for Gemini 3
    const responseSchema = {
      type: 'object',
      properties: {
        reasoning_process: {
          type: 'string',
          description: 'Step-by-step reasoning process',
        },
        conclusion: {
          type: 'string',
          description: 'Final conclusion or answer',
        },
        confidence_level: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Confidence in the conclusion',
        },
        alternative_perspectives: {
          type: 'array',
          items: { type: 'string' },
          description: 'Alternative viewpoints considered',
        },
      },
      required: ['reasoning_process', 'conclusion', 'confidence_level'],
    };

    // Generate structured content with high thinking
    const response = await this.client.generateStructuredContent<ReasoningResponse>(
      fullPrompt,
      responseSchema,
      {
        thinkingLevel: request.thinkingLevel || 'high',
        tools: {
          googleSearch: true,
          codeExecution: false,
        },
      }
    );

    return response;
  }

  /**
   * Compare and analyze multiple options
   */
  async compareOptions(
    question: string,
    options: Array<{ name: string; details: string }>,
    criteria?: string[]
  ): Promise<ReasoningResponse> {
    let comparisonPrompt = `${REASONING_SYSTEM_INSTRUCTION}

**Analysis Task:**
Compare and evaluate the following options to answer: ${question}

**Options:**
${options.map((opt, idx) => `${idx + 1}. **${opt.name}**\n   ${opt.details}`).join('\n\n')}`;

    if (criteria && criteria.length > 0) {
      comparisonPrompt += `

**Evaluation Criteria:**
${criteria.map((c, idx) => `${idx + 1}. ${c}`).join('\n')}`;
    }

    comparisonPrompt += `

**Your Task:**
1. Analyze each option against the criteria (if provided)
2. Identify pros and cons for each option
3. Provide a reasoned recommendation
4. Explain trade-offs clearly`;

    const responseSchema = {
      type: 'object',
      properties: {
        reasoning_process: {
          type: 'string',
          description: 'Detailed comparison and analysis process',
        },
        conclusion: {
          type: 'string',
          description: 'Recommended option with justification',
        },
        confidence_level: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Confidence in the recommendation',
        },
        alternative_perspectives: {
          type: 'array',
          items: { type: 'string' },
          description: 'Other valid approaches or considerations',
        },
      },
      required: ['reasoning_process', 'conclusion', 'confidence_level'],
    };

    const response = await this.client.generateStructuredContent<ReasoningResponse>(
      comparisonPrompt,
      responseSchema,
      {
        thinkingLevel: 'high',
        tools: {
          googleSearch: true,
          codeExecution: false,
        },
      }
    );

    return response;
  }

  /**
   * Analyze a decision with potential consequences
   */
  async analyzeDecision(
    decision: string,
    context: string,
    timeHorizon?: string
  ): Promise<ReasoningResponse> {
    const decisionPrompt = `${REASONING_SYSTEM_INSTRUCTION}

**Decision to Analyze:**
${decision}

**Context:**
${context}

${timeHorizon ? `**Time Horizon:** ${timeHorizon}` : ''}

**Your Task:**
1. Identify potential positive and negative consequences
2. Consider short-term vs long-term impacts
3. Analyze risks and opportunities
4. Provide a balanced assessment
5. Suggest mitigation strategies for identified risks`;

    const responseSchema = {
      type: 'object',
      properties: {
        reasoning_process: {
          type: 'string',
          description: 'Comprehensive decision analysis',
        },
        conclusion: {
          type: 'string',
          description: 'Overall assessment and recommendation',
        },
        confidence_level: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Confidence in the analysis',
        },
        alternative_perspectives: {
          type: 'array',
          items: { type: 'string' },
          description: 'Alternative scenarios or outcomes',
        },
      },
      required: ['reasoning_process', 'conclusion', 'confidence_level'],
    };

    const response = await this.client.generateStructuredContent<ReasoningResponse>(
      decisionPrompt,
      responseSchema,
      {
        thinkingLevel: 'high',
        tools: {
          googleSearch: true,
          codeExecution: false,
        },
      }
    );

    return response;
  }
}
