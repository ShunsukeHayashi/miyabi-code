import { Gemini3Client } from '../gemini-client.js';
import {
  DynamicUIRequest,
  DynamicUIResponse,
  DynamicUIResponseSchema,
} from '../types.js';

/**
 * System instruction for Dynamic UI Generation
 * Based on "The Adaptive Runtime" specification
 */
const DYNAMIC_UI_SYSTEM_INSTRUCTION = `**Role:**
You are the "Just-in-Time UI Architect". You do not speak; you build.
You utilize Gemini 3 Pro Preview's reasoning capabilities to instantly engineer bespoke Single Page Applications (SPAs) that solve the user's immediate problem.

**Core Philosophy:**
1. **No Text Walls:** Never answer with a paragraph. Answer with a Dashboard, a Form, or a Visualization.
2. **Radical Adaptation:** If the user is confused, build a Wizard. If the user is expert, build a dense Data Grid.
3. **Full Functionality:** The UI must not be a mock. It must use useState, useEffect, and handle user interactions logically.

**Technical Constraints:**
- **Language:** TypeScript (React Functional Components).
- **Styling:** Tailwind CSS (Use arbitrary values w-[500px] if precise layout is needed).
- **Icons:** lucide-react (import { Home, Settings } from 'lucide-react').
- **Data Handling:** If the user provides a URL/File, parse it using your internal tools, then hardcode the extracted JSON data directly into the component's initialState.

**Dynamic Behavior Rules:**
- **The "Bridging" Pattern:**
  When the user performs a final action (e.g., "Book Hotel", "Send Email"), the component must NOT make a real fetch call. Instead, it must call a special function: window.AgentBridge.postMessage({ action: "execute", payload: {...} }).
- **Self-Correction:**
  Before outputting, use your Thinking capability to ask: "Is this UI too complex for a mobile screen?" If so, simplify the layout to a single column.

**Output Format:**
You must return a strictly valid JSON object with the following structure:
{
  "ui_strategy": "Explanation of why this UI layout was chosen",
  "title": "Title of the UI component",
  "react_code": "Complete React TypeScript component code",
  "suggested_next_prompts": ["prompt1", "prompt2"]
}`;

/**
 * Dynamic UI Generator Tool
 * Generates React TypeScript components based on user intent
 */
export class DynamicUIGenerator {
  constructor(private client: Gemini3Client) {}

  /**
   * Generate a dynamic UI component
   */
  async generateUI(request: DynamicUIRequest): Promise<DynamicUIResponse> {
    // Build the full prompt
    let fullPrompt = `${DYNAMIC_UI_SYSTEM_INSTRUCTION}

**User Request:**
${request.prompt}`;

    // Add context if provided
    if (request.currentScreenState) {
      fullPrompt += `

**Current Screen State:**
${JSON.stringify(request.currentScreenState, null, 2)}`;
    }

    if (request.contextUrls && request.contextUrls.length > 0) {
      fullPrompt += `

**Reference URLs:**
${request.contextUrls.join('\n')}`;
    }

    // Build context parts for files
    const contextParts = request.contextFiles?.map((file) => ({
      fileData: {
        mimeType: file.mimeType,
        fileUri: file.fileUri,
      },
    })) || [];

    // Convert Zod schema to JSON schema for Gemini 3
    const responseSchema = {
      type: 'object',
      properties: {
        ui_strategy: {
          type: 'string',
          description: 'Why this UI layout was chosen (Reasoning log)',
        },
        title: {
          type: 'string',
          description: 'Title of the generated UI',
        },
        react_code: {
          type: 'string',
          description: 'The full React component string',
        },
        suggested_next_prompts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Suggested follow-up prompts',
        },
      },
      required: ['ui_strategy', 'title', 'react_code'],
    };

    // Generate structured content
    const response = await this.client.generateStructuredContent<DynamicUIResponse>(
      fullPrompt,
      responseSchema,
      {
        thinkingLevel: request.thinkingLevel || 'high',
        tools: {
          codeExecution: true,
          googleSearch: true,
        },
        contextParts: contextParts as any,
      }
    );

    return response;
  }

  /**
   * Iterate on an existing UI based on user feedback
   */
  async iterateUI(
    originalCode: string,
    feedback: string,
    thinkingLevel?: string
  ): Promise<DynamicUIResponse> {
    const iterationPrompt = `${DYNAMIC_UI_SYSTEM_INSTRUCTION}

**Current UI Code:**
\`\`\`tsx
${originalCode}
\`\`\`

**User Feedback:**
${feedback}

**Your Task:**
Analyze the current UI and the user's feedback. Then generate an improved version that addresses their concerns.
Use your deep thinking to understand what changes are needed and why.`;

    const responseSchema = {
      type: 'object',
      properties: {
        ui_strategy: {
          type: 'string',
          description: 'Explanation of changes made and reasoning',
        },
        title: {
          type: 'string',
          description: 'Title of the updated UI',
        },
        react_code: {
          type: 'string',
          description: 'The improved React component code',
        },
        suggested_next_prompts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Suggested follow-up improvements',
        },
      },
      required: ['ui_strategy', 'title', 'react_code'],
    };

    const response = await this.client.generateStructuredContent<DynamicUIResponse>(
      iterationPrompt,
      responseSchema,
      {
        thinkingLevel: (thinkingLevel as any) || 'high',
        tools: {
          codeExecution: false,
          googleSearch: false,
        },
      }
    );

    return response;
  }
}
