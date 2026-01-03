import {
  GoogleGenerativeAI,
  GenerativeModel,
  Part,
  Tool
} from '@google/generative-ai';
import {
  Gemini3Config,
  ThinkingLevel,
  ToolConfig,
} from './types.js';

/**
 * Gemini 3 API Client
 * Handles all interactions with Gemini 3 Pro Preview model
 */
export class Gemini3Client {
  private genAI: GoogleGenerativeAI;
  private config: Gemini3Config;
  private model: GenerativeModel;

  constructor(config: Gemini3Config) {
    this.config = {
      model: 'gemini-1.5-pro',
      thinkingLevel: 'high',
      temperature: 0.3,
      topP: 0.95,
      maxOutputTokens: 8192,
      ...config,
    };

    this.genAI = new GoogleGenerativeAI(this.config.apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: this.config.model!,
    });
  }

  /**
   * Generate content with structured output
   */
  async generateStructuredContent<T>(
    prompt: string,
    responseSchema: Record<string, unknown>,
    options: {
      thinkingLevel?: ThinkingLevel;
      tools?: ToolConfig;
      contextParts?: Part[];
    } = {}
  ): Promise<T> {
    const thinkingLevel = options.thinkingLevel || this.config.thinkingLevel;

    // Build tools array
    const tools: Tool[] = [];
    if (options.tools?.codeExecution) {
      tools.push({ codeExecution: {} } as Tool);
    }
    if (options.tools?.googleSearch) {
      tools.push({ googleSearch: {} } as Tool);
    }

    // Build content parts
    const parts: Part[] = [
      { text: prompt },
      ...(options.contextParts || []),
    ];

    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts }],
        tools: tools.length > 0 ? tools : undefined,
        generationConfig: {
          temperature: this.config.temperature,
          topP: this.config.topP,
          maxOutputTokens: this.config.maxOutputTokens,
          responseMimeType: 'application/json',
          responseSchema: responseSchema as any,
        },
        // @ts-ignore - thinking_level is a new parameter in Gemini 3
        thinkingLevel: thinkingLevel,
      });

      const response = await result.response;
      const text = response.text();

      return JSON.parse(text) as T;
    } catch (error) {
      console.error('Gemini 3 API Error:', error);
      throw new Error(`Failed to generate structured content: ${error}`);
    }
  }

  /**
   * Generate content with text output
   */
  async generateContent(
    prompt: string,
    options: {
      thinkingLevel?: ThinkingLevel;
      tools?: ToolConfig;
      contextParts?: Part[];
    } = {}
  ): Promise<string> {
    const thinkingLevel = options.thinkingLevel || this.config.thinkingLevel;

    // Build tools array
    const tools: Tool[] = [];
    if (options.tools?.codeExecution) {
      tools.push({ codeExecution: {} } as Tool);
    }
    if (options.tools?.googleSearch) {
      tools.push({ googleSearch: {} } as Tool);
    }

    // Build content parts
    const parts: Part[] = [
      { text: prompt },
      ...(options.contextParts || []),
    ];

    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts }],
        tools: tools.length > 0 ? tools : undefined,
        generationConfig: {
          temperature: this.config.temperature,
          topP: this.config.topP,
          maxOutputTokens: this.config.maxOutputTokens,
        },
        // @ts-ignore - thinking_level is a new parameter in Gemini 3
        thinkingLevel: thinkingLevel,
      });

      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini 3 API Error:', error);
      throw new Error(`Failed to generate content: ${error}`);
    }
  }

  /**
   * Get model information
   */
  getModelInfo(): string {
    return `${this.config.model} (thinking: ${this.config.thinkingLevel})`;
  }
}
