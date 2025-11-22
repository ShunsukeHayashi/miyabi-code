/**
 * Gemini Service with SWML-Enhanced Prompts
 * Integrates Gemini 2.5 Flash with miyabi World Space and SWML optimization
 *
 * Based on:
 * - gemini-3-adaptive-ui-runtime/services/geminiService.ts
 * - miyabi_def/variables/world_definition.yaml
 * - miyabi_def/variables/step_back_question_method.yaml
 */

import type { Intent } from '@/types/intent';
import type { WorldSpace } from '@/types/worldSpace';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ═══════════════════════════════════════════════════════════════════════
// § 1. Configuration
// ═══════════════════════════════════════════════════════════════════════

const GEMINI_MODEL = 'gemini-2.5-flash';

// ═══════════════════════════════════════════════════════════════════════
// § 2. Response Schema
// ═══════════════════════════════════════════════════════════════════════

export interface GeminiUIResponse {
  ui_strategy: string; // SWML reasoning on why this UI was chosen
  title: string; // Short title for the component
  react_code: string; // Full React component code
  suggested_next_prompts: string[]; // Next actions user might want
  swml_insights?: string[]; // Step-back question insights
  quality_score?: number; // Estimated quality score
}

const responseSchema = {
  type: 'OBJECT',
  properties: {
    ui_strategy: {
      type: 'STRING',
      description:
        'SWML reasoning on why this UI layout/component was chosen. Include step-back question insights.',
    },
    title: {
      type: 'STRING',
      description: 'A short title for the component',
    },
    react_code: {
      type: 'STRING',
      description:
        'The full React component code string using TypeScript, HeroUI components, and Tailwind CSS',
    },
    suggested_next_prompts: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Suggested next actions (2-4 prompts)',
    },
    swml_insights: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Step-back question insights that guided this design',
    },
    quality_score: {
      type: 'NUMBER',
      description: 'Self-assessed quality score (0.0 - 1.0)',
    },
  },
  required: ['ui_strategy', 'title', 'react_code', 'suggested_next_prompts'],
};

// ═══════════════════════════════════════════════════════════════════════
// § 3. System Instruction (SWML-Enhanced)
// ═══════════════════════════════════════════════════════════════════════

function createSystemInstruction(world: WorldSpace): string {
  return `
**Role:**
You are the "Miyabi Just-in-Time UI Architect", powered by SWML (Shunsuke's World Model Logic).
You do not speak; you build.
You utilize \`${GEMINI_MODEL}\`'s reasoning capabilities to instantly engineer bespoke React components that solve the user's immediate problem within the miyabi console environment.

**Core Philosophy:**
1.  **No Text Walls:** Never answer with a paragraph. Answer with a Dashboard, a Chart, or a Visualization.
2.  **Radical Adaptation:** If the user is confused, build a Wizard. If the user is expert, build a dense Data Grid.
3.  **Full Functionality:** The UI must not be a mock. It must use \`useState\`, \`useEffect\`, and handle user interactions logically.
4.  **SWML Optimization:** Apply step-back questions (A to Z) to ensure optimal UI design.

**Technical Constraints:**
-   **Language:** TypeScript (React 18 Functional Components)
-   **Styling:** Tailwind CSS v3.4 + HeroUI components (preferred)
-   **Icons:** \`lucide-react\` (import { Icon } from 'lucide-react')
-   **Charts:** \`recharts\` (import { BarChart, LineChart, ... } from 'recharts')
-   **Animations:** \`framer-motion\` (import { motion } from 'framer-motion')
-   **Data Handling:** If data is needed, generate realistic mock data directly in the component
-   **Environment:** The component will be rendered in miyabi-console
-   **Export:** You MUST export the main component as \`default\`

**World Context (W):**
- **Time:** ${world.temporal.current_time} (${world.temporal.timezone})
- **Location:** ${world.spatial.physical.location}, ${world.spatial.physical.datacenter}
- **User Role:** ${world.contextual.user.primary_role}
- **Current Page:** ${world.contextual.user.current_page || 'Unknown'}
- **System Health:** ${world.state.system.health}
- **Tech Stack:** ${world.contextual.system.tech_stack.frontend.primary} + ${world.contextual.system.tech_stack.frontend.frameworks.join(', ')}
- **Project Phase:** ${world.state.project.phase} (${world.state.project.progress})

**SWML 26-Step Process:**
When designing UI, apply step-back questions:
1. **A (Analyze):** What is the core problem?
2. **B (Breakdown):** What are the fundamental components?
3. **C (Clarify):** What does success mean?
4. **D (Design):** What is the optimal structure?
5. **O (Optimize):** What is the best possible solution?

**Dynamic Behavior Rules:**
-   **Data Fetching:** For now, generate mock data in the component. Use realistic data relevant to miyabi console (agents, metrics, logs, infrastructure status).
-   **Self-Correction:** Before outputting, ask yourself:
    - "Is this UI too complex for the user's intent?"
    - "Does this match the current page context (${world.contextual.user.current_page})?"
    - "Is this responsive and accessible?"
-   **Quality Target:** Aim for quality score >= 0.85

**Output Format:**
You must return a strictly valid JSON object adhering to the schema.
DO NOT wrap the JSON in markdown code blocks (like \`\`\`json). Return raw JSON only.

**Example Component Structure:**
\`\`\`tsx
import React, { useState, useEffect } from 'react';
import { Card, Button } from '@heroui/react';
import { Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function MyComponent() {
  const [data, setData] = useState([...mock data...]);

  return (
    <div className="p-6">
      <Card className="p-4">
        {/* Your UI here */}
      </Card>
    </div>
  );
}
\`\`\`

**Remember:**
- Use HeroUI components (Card, Button, Input, etc.)
- Use Tailwind for styling
- Generate realistic mock data
- Make it fully functional with useState/useEffect
- Export as default
`;
}

// ═══════════════════════════════════════════════════════════════════════
// § 4. Prompt Enhancement with SWML
// ═══════════════════════════════════════════════════════════════════════

function enhancePromptWithSWML(
  intent: Intent,
  world: WorldSpace,
  swmlStrategy?: any
): string {
  let prompt = `
**User Intent:** ${intent.raw_input}

**Parsed Requirements:**
- **Component Type:** ${intent.modality.preferred_component}
- **Data Sources:** ${intent.modality.data_sources.join(', ') || 'None specified'}
- **UI Complexity:** ${intent.preferences.ui_complexity}
- **Data Density:** ${intent.preferences.data_density}
- **Interaction Style:** ${intent.preferences.interaction_style}
- **Quality vs Speed:** ${intent.preferences.quality_vs_speed}

**Functional Objectives:**
${intent.objectives.functional.map((obj) => `- ${obj}`).join('\n')}

**Non-Functional Requirements:**
${intent.objectives.non_functional.map((req) => `- ${req}`).join('\n')}
`;

  // Add SWML strategy if available
  if (swmlStrategy) {
    prompt += `
**SWML Strategy:**
${swmlStrategy.strategy}

**SWML Reasoning:**
${swmlStrategy.reasoning}

**Component Hierarchy:**
${JSON.stringify(swmlStrategy.component_hierarchy, null, 2)}

**Optimization Insights:**
${swmlStrategy.optimization_insights?.join('\n') || 'N/A'}
`;
  }

  // Add context-specific instructions
  if (world.contextual.user.current_page) {
    prompt += `
**Context:** User is currently on "${world.contextual.user.current_page}" page.
Make sure the UI fits this context and complements existing page content.
`;
  }

  prompt += `
**Instructions:**
1. Apply SWML step-back questions to optimize the design
2. Generate a fully functional React component using HeroUI and Tailwind
3. Include realistic mock data relevant to miyabi console
4. Ensure responsive design and accessibility
5. Return ONLY valid JSON (no markdown code blocks)
`;

  return prompt;
}

// ═══════════════════════════════════════════════════════════════════════
// § 5. Gemini Service Class
// ═══════════════════════════════════════════════════════════════════════

export class GeminiService {
  private ai: GoogleGenerativeAI;
  private conversationHistory: Array<{ role: string; content: string }> = [];

  constructor(apiKey: string) {
    this.ai = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Generate UI component based on Intent and World Space
   */
  async generateUI(
    intent: Intent,
    world: WorldSpace,
    swmlStrategy?: any
  ): Promise<GeminiUIResponse> {
    try {
      // Create enhanced prompt
      const userPrompt = enhancePromptWithSWML(intent, world, swmlStrategy);

      // Add to conversation history
      this.conversationHistory.push({
        role: 'user',
        content: userPrompt,
      });

      // Keep only last 5 interactions for context
      if (this.conversationHistory.length > 10) {
        this.conversationHistory = this.conversationHistory.slice(-10);
      }

      // Call Gemini API
      const model = this.ai.getGenerativeModel({
        model: GEMINI_MODEL,
        systemInstruction: createSystemInstruction(world),
      });

      const response = await model.generateContent({
        contents: this.conversationHistory.map((msg) => ({
          role: msg.role as 'user' | 'model',
          parts: [{ text: msg.content }],
        })),
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: responseSchema as any,
          temperature: 0.4, // Lower for more consistent code generation
          topP: 0.95,
        },
      });

      // Parse response
      const text = response.response.text();
      console.log('Raw Gemini Response:', text);

      // Extract JSON (in case it's wrapped in markdown)
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      const jsonString =
        firstBrace !== -1 && lastBrace !== -1
          ? text.substring(firstBrace, lastBrace + 1)
          : text;

      const result = JSON.parse(jsonString) as GeminiUIResponse;

      // Add to conversation history
      this.conversationHistory.push({
        role: 'model',
        content: JSON.stringify(result),
      });

      return result;
    } catch (error) {
      console.error('Gemini Service Error:', error);
      throw new Error(
        `Failed to generate UI: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Get conversation history
   */
  getHistory(): Array<{ role: string; content: string }> {
    return this.conversationHistory;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// § 6. Singleton Factory
// ═══════════════════════════════════════════════════════════════════════

let geminiServiceInstance: GeminiService | null = null;

export function getGeminiService(apiKey?: string): GeminiService {
  if (!geminiServiceInstance) {
    const key = apiKey || import.meta.env.VITE_GEMINI_API_KEY;
    if (!key) {
      throw new Error(
        'Gemini API key not found. Please set VITE_GEMINI_API_KEY in .env'
      );
    }
    geminiServiceInstance = new GeminiService(key);
  }
  return geminiServiceInstance;
}

// ═══════════════════════════════════════════════════════════════════════
// § 7. Integration Function: Intent → SWML → Gemini → UI
// ═══════════════════════════════════════════════════════════════════════

export async function generateDynamicUI(
  intent: Intent,
  world: WorldSpace,
  swmlStrategy?: any
): Promise<GeminiUIResponse> {
  const service = getGeminiService();
  return service.generateUI(intent, world, swmlStrategy);
}
