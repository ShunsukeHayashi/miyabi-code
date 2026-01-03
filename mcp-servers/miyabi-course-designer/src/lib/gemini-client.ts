/**
 * Google Generative AI Client for CourseDesigner
 * @module lib/gemini-client
 */

import { GoogleGenerativeAI, GenerativeModel, Part } from '@google/generative-ai';
import { AIModelConfig, PromptTemplate } from '../types/index.js';
import winston from 'winston';

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'course-designer.log' })
  ]
});

export class GeminiClient {
  private client: GoogleGenerativeAI;
  private model: GenerativeModel;
  private config: AIModelConfig;

  constructor(apiKey: string, config: Partial<AIModelConfig> = {}) {
    this.client = new GoogleGenerativeAI(apiKey);

    this.config = {
      model: 'gemini-2.0-flash-exp',
      temperature: 0.7,
      maxTokens: 8192,
      topP: 0.8,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
      ...config
    };

    this.model = this.client.getGenerativeModel({
      model: this.config.model,
      generationConfig: {
        temperature: this.config.temperature,
        maxOutputTokens: this.config.maxTokens,
        topP: this.config.topP,
      }
    });

    logger.info('GeminiClient initialized', {
      model: this.config.model,
      config: this.config
    });
  }

  /**
   * Generate content using a prompt template
   */
  async generateContent(
    template: PromptTemplate,
    variables: Record<string, string>
  ): Promise<string> {
    try {
      const prompt = this.interpolateTemplate(template.template, variables);

      logger.info('Generating content', {
        templateName: template.name,
        promptLength: prompt.length,
        variables: Object.keys(variables)
      });

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      logger.info('Content generated successfully', {
        templateName: template.name,
        responseLength: text.length
      });

      return text;
    } catch (error) {
      logger.error('Failed to generate content', {
        templateName: template.name,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error(`Content generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate structured content with JSON output
   */
  async generateStructuredContent<T>(
    template: PromptTemplate,
    variables: Record<string, string>,
    schema?: any
  ): Promise<T> {
    try {
      const prompt = this.interpolateTemplate(template.template, variables);
      const structuredPrompt = `${prompt}\n\nPlease respond with valid JSON only, no additional text.`;

      logger.info('Generating structured content', {
        templateName: template.name,
        hasSchema: !!schema
      });

      const result = await this.model.generateContent(structuredPrompt);
      const response = result.response;
      const text = response.text();

      // Clean up response to extract JSON
      const jsonText = this.extractJSON(text);
      const parsed = JSON.parse(jsonText);

      // Validate against schema if provided
      if (schema) {
        const validated = schema.parse(parsed);
        return validated as T;
      }

      return parsed as T;
    } catch (error) {
      logger.error('Failed to generate structured content', {
        templateName: template.name,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error(`Structured content generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate content in batches for efficiency
   */
  async generateBatchContent(
    requests: Array<{
      template: PromptTemplate;
      variables: Record<string, string>;
      id: string;
    }>
  ): Promise<Record<string, string>> {
    const results: Record<string, string> = {};

    logger.info('Starting batch content generation', {
      batchSize: requests.length
    });

    // Process in parallel with rate limiting
    const batchSize = 5;
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);

      const batchPromises = batch.map(async (request) => {
        try {
          const content = await this.generateContent(request.template, request.variables);
          return { id: request.id, content };
        } catch (error) {
          logger.error('Batch item failed', {
            id: request.id,
            error: error instanceof Error ? error.message : String(error)
          });
          return { id: request.id, content: '', error: String(error) };
        }
      });

      const batchResults = await Promise.all(batchPromises);

      for (const result of batchResults) {
        if (result.content) {
          results[result.id] = result.content;
        }
      }

      // Rate limiting delay between batches
      if (i + batchSize < requests.length) {
        await this.delay(1000);
      }
    }

    logger.info('Batch content generation completed', {
      totalRequests: requests.length,
      successfulResults: Object.keys(results).length
    });

    return results;
  }

  /**
   * Estimate token usage for a prompt
   */
  async estimateTokens(text: string): Promise<number> {
    try {
      const result = await this.model.countTokens(text);
      return result.totalTokens;
    } catch (error) {
      logger.warn('Failed to count tokens, using estimate', { error });
      // Rough estimate: ~4 characters per token
      return Math.ceil(text.length / 4);
    }
  }

  /**
   * Validate that the API key is working
   */
  async validateConnection(): Promise<boolean> {
    try {
      const testResult = await this.model.generateContent('Test connection');
      return testResult.response.text().length > 0;
    } catch (error) {
      logger.error('Connection validation failed', { error });
      return false;
    }
  }

  /**
   * Get model information
   */
  getModelInfo() {
    return {
      model: this.config.model,
      config: this.config,
      supportedFeatures: [
        'text-generation',
        'structured-output',
        'batch-processing',
        'token-counting'
      ]
    };
  }

  /**
   * Private: Interpolate variables in template
   */
  private interpolateTemplate(template: string, variables: Record<string, string>): string {
    let result = template;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(placeholder, value);
    }

    // Check for any remaining placeholders
    const remainingPlaceholders = result.match(/\\{\\{[^}]+\\}\\}/g);
    if (remainingPlaceholders) {
      logger.warn('Unresolved placeholders in template', {
        placeholders: remainingPlaceholders
      });
    }

    return result;
  }

  /**
   * Private: Extract JSON from response text
   */
  private extractJSON(text: string): string {
    // First, try to find JSON wrapped in code blocks
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }

    // Then try to find JSON within the text using proper regex
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return jsonMatch[0];
    }

    // If no clear JSON structure, try the entire text
    return text.trim();
  }

  /**
   * Private: Delay utility for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update model configuration
   */
  updateConfig(newConfig: Partial<AIModelConfig>) {
    this.config = { ...this.config, ...newConfig };

    this.model = this.client.getGenerativeModel({
      model: this.config.model,
      generationConfig: {
        temperature: this.config.temperature,
        maxOutputTokens: this.config.maxTokens,
        topP: this.config.topP,
      }
    });

    logger.info('Model configuration updated', { config: this.config });
  }
}