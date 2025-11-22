import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Gemini 3 API Client for Dynamic UI Generation
 *
 * This client interfaces with Gemini 3 Pro Preview to generate
 * adaptive UI components based on system data and user context.
 */

export interface UIGenerationRequest {
  userPrompt: string;
  systemData: any;
  currentContext?: any;
}

export interface UIGenerationResponse {
  ui_strategy: string;
  title: string;
  react_code: string;
  suggested_next_prompts: string[];
}

export class GeminiUIClient {
  private client: GoogleGenerativeAI;
  private model: string = 'gemini-3-pro-preview';

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Generate adaptive UI components based on data and context
   *
   * @param request - UI generation request with user prompt and system data
   * @returns Generated UI code and metadata
   */
  async generateUI(request: UIGenerationRequest): Promise<UIGenerationResponse> {
    const model = this.client.getGenerativeModel({
      model: this.model,
      generationConfig: {
        temperature: 0.3, // Low temperature for code generation
        topP: 0.95,
      },
    });

    const prompt = this.buildPrompt(request);

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from code blocks if wrapped
      let jsonText = text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '').replace(/```\n?$/g, '');
      }

      return JSON.parse(jsonText) as UIGenerationResponse;
    } catch (error) {
      console.error('Gemini UI generation error:', error);
      throw new Error(`Failed to generate UI: ${error}`);
    }
  }

  /**
   * Build the comprehensive prompt for Gemini 3
   *
   * Follows The Adaptive Runtime specification for god-mode prompting
   */
  private buildPrompt(request: UIGenerationRequest): string {
    return `
**Role:**
You are the "Just-in-Time UI Architect". You do not speak; you build.
You utilize Gemini 3 Pro Preview's reasoning capabilities to instantly engineer bespoke Single Page Applications (SPAs) that solve the user's immediate problem.

**Core Philosophy:**
1.  **No Text Walls:** Never answer with a paragraph. Answer with a Dashboard, a Form, or a Visualization.
2.  **Radical Adaptation:** If the user is confused, build a Wizard. If the user is expert, build a dense Data Grid.
3.  **Full Functionality:** The UI must not be a mock. It must use useState, useEffect, and handle user interactions logically.

**Technical Constraints:**
-   **Language:** TypeScript (React Functional Components).
-   **Styling:** Tailwind CSS (Use arbitrary values like w-[500px] if precise layout is needed).
-   **Icons:** lucide-react (import { Home, Settings } from 'lucide-react').
-   **Data Handling:** The provided system data is: ${JSON.stringify(request.systemData, null, 2)}

**Dynamic Behavior Rules:**
-   **The "Bridging" Pattern:**
    When the user performs a final action (e.g., "Start Agent", "Deploy"), the component must call: \`window.AgentBridge?.triggerAction(action, payload)\`.
-   **Self-Correction:**
    Before outputting, use your Thinking capability to ask: "Is this UI too complex for a mobile screen?" If so, simplify the layout to a single column.

**User Request:**
${request.userPrompt}

**Current Context:**
${request.currentContext ? JSON.stringify(request.currentContext, null, 2) : 'No additional context'}

**Output Requirements:**
Generate a React component that:
1. Visualizes the system data in an impactful, beautiful way
2. Uses framer-motion for smooth animations
3. Is fully responsive (mobile-first)
4. Has clear visual hierarchy using Tailwind CSS
5. Includes interactive elements where appropriate
6. Returns valid JSON matching the response schema
`;
  }
}

/**
 * Create Gemini UI Client with API key from environment
 */
export function createGeminiClient(): GeminiUIClient {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY environment variable is not set');
  }

  return new GeminiUIClient(apiKey);
}
