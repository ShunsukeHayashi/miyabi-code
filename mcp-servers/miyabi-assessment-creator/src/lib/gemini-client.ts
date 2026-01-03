/**
 * Google Generative AI Client for AssessmentCreator
 * @module lib/gemini-client
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import winston from 'winston';

// Initialize logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: 'assessment-creator-agent.log',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ]
});

export interface AIModelConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

export interface PromptTemplate {
  name: string;
  template: string;
  variables: string[];
}

export class GeminiClient {
  private client: GoogleGenerativeAI;
  private model: GenerativeModel;
  private config: AIModelConfig;

  constructor(apiKey: string, config: Partial<AIModelConfig> = {}) {
    this.client = new GoogleGenerativeAI(apiKey);

    this.config = {
      model: 'gemini-2.0-flash-exp',
      temperature: 0.3, // Lower temperature for assessment generation
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

    logger.info('AssessmentCreator GeminiClient initialized', {
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

      logger.debug('Generating content', {
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
   * Generate structured content with JSON output and schema validation
   */
  async generateStructuredContent<T>(
    template: PromptTemplate,
    variables: Record<string, string>,
    schema?: any,
    retries: number = 2
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const prompt = this.interpolateTemplate(template.template, variables);
        const structuredPrompt = `${prompt}\n\nIMPORTANT: Respond with valid JSON only, no additional text or markdown formatting.`;

        logger.debug('Generating structured content', {
          templateName: template.name,
          attempt: attempt + 1,
          maxAttempts: retries + 1,
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
          logger.info('Structured content generated and validated', {
            templateName: template.name,
            attempt: attempt + 1
          });
          return validated as T;
        }

        logger.info('Structured content generated', {
          templateName: template.name,
          attempt: attempt + 1
        });

        return parsed as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.warn('Structured content generation attempt failed', {
          templateName: template.name,
          attempt: attempt + 1,
          error: lastError.message
        });

        if (attempt === retries) {
          logger.error('All structured content generation attempts failed', {
            templateName: template.name,
            totalAttempts: retries + 1,
            finalError: lastError.message
          });
        } else {
          // Wait before retry
          await this.delay(1000 * (attempt + 1));
        }
      }
    }

    throw new Error(`Structured content generation failed after ${retries + 1} attempts: ${lastError?.message}`);
  }

  /**
   * Generate multiple questions in parallel with batch processing
   */
  async generateBatchQuestions(
    requests: Array<{
      template: PromptTemplate;
      variables: Record<string, string>;
      id: string;
      schema?: any;
    }>
  ): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    const errors: Record<string, string> = {};

    logger.info('Starting batch question generation', {
      batchSize: requests.length
    });

    // Process in smaller batches to avoid rate limiting
    const batchSize = 3;
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);

      const batchPromises = batch.map(async (request) => {
        try {
          const content = await this.generateStructuredContent(
            request.template,
            request.variables,
            request.schema
          );
          return { id: request.id, content, error: null };
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          logger.error('Batch question generation failed', {
            id: request.id,
            error: errorMsg
          });
          return { id: request.id, content: null, error: errorMsg };
        }
      });

      const batchResults = await Promise.all(batchPromises);

      for (const result of batchResults) {
        if (result.content) {
          results[result.id] = result.content;
        } else if (result.error) {
          errors[result.id] = result.error;
        }
      }

      // Rate limiting delay between batches
      if (i + batchSize < requests.length) {
        await this.delay(1500);
      }
    }

    logger.info('Batch question generation completed', {
      totalRequests: requests.length,
      successfulResults: Object.keys(results).length,
      errors: Object.keys(errors).length
    });

    if (Object.keys(errors).length > 0) {
      logger.warn('Some batch questions failed to generate', { errors });
    }

    return results;
  }

  /**
   * Grade a student response using AI
   */
  async gradeResponse(
    questionText: string,
    correctAnswer: string,
    studentResponse: string,
    rubric: string,
    questionType: string
  ): Promise<{
    score: number;
    maxScore: number;
    feedback: string;
    isCorrect: boolean;
    partialCredit?: number;
  }> {
    try {
      const gradingPrompt = `
You are an expert educational assessor. Grade the following student response.

Question: ${questionText}
Question Type: ${questionType}
Correct Answer: ${correctAnswer}
Student Response: ${studentResponse}
Grading Rubric: ${rubric}

Provide your assessment as JSON with these exact fields:
{
  "score": <numeric score>,
  "maxScore": <maximum possible score>,
  "isCorrect": <true/false>,
  "partialCredit": <0.0-1.0 if applicable, null otherwise>,
  "feedback": "<constructive feedback explaining the grade>",
  "improvement": "<specific suggestions for improvement>"
}

IMPORTANT: Respond with valid JSON only.`;

      const result = await this.model.generateContent(gradingPrompt);
      const text = result.response.text();
      const jsonText = this.extractJSON(text);
      const gradingResult = JSON.parse(jsonText);

      logger.debug('Response graded', {
        questionType,
        score: gradingResult.score,
        maxScore: gradingResult.maxScore
      });

      return gradingResult;
    } catch (error) {
      logger.error('Failed to grade response', {
        questionType,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error(`Response grading failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Analyze assessment performance and provide insights
   */
  async analyzeAssessmentPerformance(
    assessmentData: {
      questions: any[];
      responses: any[];
      metadata: any;
    }
  ): Promise<{
    overallAnalysis: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    contentGaps: string[];
  }> {
    try {
      const analysisPrompt = `
Analyze this assessment performance data and provide educational insights.

Assessment Metadata: ${JSON.stringify(assessmentData.metadata, null, 2)}
Number of Questions: ${assessmentData.questions.length}
Number of Responses: ${assessmentData.responses.length}

Question Performance Summary:
${assessmentData.questions.map((q, i) => `Q${i + 1}: ${q.type} - ${q.difficulty} difficulty`).join('\n')}

Response Summary:
${assessmentData.responses.slice(0, 10).map((r, i) => `Response ${i + 1}: Score ${r.score}/${r.maxScore} (${Math.round((r.score / r.maxScore) * 100)}%)`).join('\n')}

Provide analysis as JSON:
{
  "overallAnalysis": "<comprehensive analysis of assessment performance>",
  "strengths": ["<area 1>", "<area 2>"],
  "weaknesses": ["<area 1>", "<area 2>"],
  "recommendations": ["<recommendation 1>", "<recommendation 2>"],
  "contentGaps": ["<gap 1>", "<gap 2>"]
}

IMPORTANT: Respond with valid JSON only.`;

      const result = await this.model.generateContent(analysisPrompt);
      const text = result.response.text();
      const jsonText = this.extractJSON(text);
      const analysis = JSON.parse(jsonText);

      logger.info('Assessment performance analyzed', {
        questionsAnalyzed: assessmentData.questions.length,
        responsesAnalyzed: assessmentData.responses.length
      });

      return analysis;
    } catch (error) {
      logger.error('Failed to analyze assessment performance', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error(`Performance analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }
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
      const testResult = await this.model.generateContent('Test connection for assessment generation');
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
        'question-generation',
        'auto-grading',
        'rubric-based-evaluation',
        'performance-analysis',
        'batch-processing',
        'structured-output',
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
    // Remove any markdown code block formatting
    let cleanText = text.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1');

    // Find JSON object or array
    const jsonMatch = cleanText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      return jsonMatch[1].trim();
    }

    // If no clear JSON structure found, try cleaning common prefixes/suffixes
    cleanText = cleanText.replace(/^[^{\[]*/, '').replace(/[^}\]]*$/, '');

    return cleanText.trim();
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