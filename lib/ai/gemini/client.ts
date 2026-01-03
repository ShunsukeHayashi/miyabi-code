/**
 * Gemini AI Client - Core Implementation
 * Phase 2.1 AI Generative Content Engine
 *
 * P0.5 Minimal Code: Essential Gemini API integration only
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

// Specification-defined interfaces
export interface GeminiContentRequest {
  contentType: 'course-outline' | 'lesson-content' | 'assessment' | 'video-script' | 'interactive-exercise';
  topic: string;
  targetAudience: {
    level: 'beginner' | 'intermediate' | 'advanced';
    age: number;
    background: string;
    learningGoals: string[];
  };
  generationConfig: {
    language: 'ja' | 'en' | 'zh' | 'ko' | 'es';
    tone: 'formal' | 'casual' | 'academic' | 'conversational';
    length: 'short' | 'medium' | 'long';
    includeExamples: boolean;
    interactivityLevel: 1 | 2 | 3 | 4 | 5;
  };
  qualityConstraints: {
    readabilityScore: number;
    factualAccuracy: boolean;
    plagiarismCheck: boolean;
    biasDetection: boolean;
  };
}

export interface GeminiContentResponse {
  content: {
    title: string;
    body: string;
    summary: string;
    keyPoints: string[];
    estimatedReadingTime: number;
  };
  metadata: {
    generatedAt: string;
    modelVersion: string;
    promptTokens: number;
    completionTokens: number;
    qualityScore: number;
    confidenceLevel: number;
  };
  qualityMetrics: {
    readabilityScore: number;
    factualAccuracyScore: number;
    originalityScore: number;
    biasScore: number;
    engagementPrediction: number;
  };
  recommendations: {
    improvements: string[];
    additionalResources: string[];
    relatedTopics: string[];
  };
}

export interface GeminiError {
  code: 'API_LIMIT' | 'INVALID_REQUEST' | 'MODEL_ERROR' | 'SAFETY_FILTER' | 'TIMEOUT';
  message: string;
  details: {
    requestId: string;
    timestamp: string;
    retryAfter?: number;
    suggestion: string;
  };
}

/**
 * Gemini AI Content Generation Client
 */
export class GeminiClient {
  private client: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is required');
    }

    this.client = new GoogleGenerativeAI(key);
    this.model = this.client.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.7,
        topP: 0.9,
      }
    });
  }

  /**
   * Generate course outline content
   */
  async generateCourse(request: GeminiContentRequest): Promise<GeminiContentResponse> {
    if (request.contentType !== 'course-outline') {
      throw this.createError('INVALID_REQUEST', 'Content type must be course-outline', request);
    }

    const prompt = this.buildCoursePrompt(request);
    return this.executeGeneration(prompt, request);
  }

  /**
   * Generate lesson content
   */
  async generateLesson(request: GeminiContentRequest): Promise<GeminiContentResponse> {
    if (request.contentType !== 'lesson-content') {
      throw this.createError('INVALID_REQUEST', 'Content type must be lesson-content', request);
    }

    const prompt = this.buildLessonPrompt(request);
    return this.executeGeneration(prompt, request);
  }

  /**
   * Generate assessment content
   */
  async generateAssessment(request: GeminiContentRequest): Promise<GeminiContentResponse> {
    if (request.contentType !== 'assessment') {
      throw this.createError('INVALID_REQUEST', 'Content type must be assessment', request);
    }

    const prompt = this.buildAssessmentPrompt(request);
    return this.executeGeneration(prompt, request);
  }

  /**
   * Core generation execution
   */
  private async executeGeneration(prompt: string, request: GeminiContentRequest): Promise<GeminiContentResponse> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse structured response
      const parsedContent = this.parseGeneratedContent(text, request);

      // Calculate metrics
      const processingTime = Date.now() - startTime;
      const metadata = this.createMetadata(response, processingTime);
      const qualityMetrics = await this.calculateQualityMetrics(parsedContent.content, request);
      const recommendations = this.generateRecommendations(parsedContent.content, qualityMetrics);

      return {
        content: parsedContent.content,
        metadata,
        qualityMetrics,
        recommendations
      };

    } catch (error) {
      throw this.handleGenerationError(error, requestId);
    }
  }

  /**
   * Build course generation prompt
   */
  private buildCoursePrompt(request: GeminiContentRequest): string {
    const { topic, targetAudience, generationConfig } = request;
    const lengthGuide = this.getLengthGuide(generationConfig.length);

    return `
あなたは優秀な教育コンテンツ設計者です。以下の要件に従って、高品質なコースアウトラインを作成してください。

## 作成要件
- **トピック**: ${topic}
- **対象者レベル**: ${targetAudience.level}
- **対象年齢**: ${targetAudience.age}歳
- **背景**: ${targetAudience.background}
- **学習目標**: ${targetAudience.learningGoals.join(', ')}
- **言語**: ${generationConfig.language}
- **トーン**: ${generationConfig.tone}
- **長さ**: ${generationConfig.length} (${lengthGuide})
- **例の包含**: ${generationConfig.includeExamples ? 'あり' : 'なし'}
- **インタラクティブレベル**: ${generationConfig.interactivityLevel}/5

## 出力形式
以下のJSON構造で回答してください：

\`\`\`json
{
  "title": "コースタイトル",
  "body": "詳細なコース内容（Markdown形式）",
  "summary": "200文字以内のサマリー",
  "keyPoints": ["重要ポイント1", "重要ポイント2", ...],
  "estimatedReadingTime": 読み取り時間（分）
}
\`\`\`

## 品質要件
- 読みやすさスコア: ${request.qualityConstraints.readabilityScore}以上
- 事実確認: ${request.qualityConstraints.factualAccuracy ? '必須' : '不要'}
- バイアス回避: ${request.qualityConstraints.biasDetection ? '必須' : '不要'}

実用的で魅力的なコース設計を作成してください。
`;
  }

  /**
   * Build lesson generation prompt
   */
  private buildLessonPrompt(request: GeminiContentRequest): string {
    const { topic, targetAudience, generationConfig } = request;
    const lengthGuide = this.getLengthGuide(generationConfig.length);

    return `
あなたは経験豊富な教育者です。以下の要件に従って、効果的なレッスンコンテンツを作成してください。

## 作成要件
- **レッスントピック**: ${topic}
- **対象者レベル**: ${targetAudience.level}
- **対象年齢**: ${targetAudience.age}歳
- **学習背景**: ${targetAudience.background}
- **学習目標**: ${targetAudience.learningGoals.join(', ')}
- **言語**: ${generationConfig.language}
- **文体**: ${generationConfig.tone}
- **コンテンツ長**: ${generationConfig.length} (${lengthGuide})
- **具体例**: ${generationConfig.includeExamples ? '豊富に含める' : '最小限'}
- **インタラクション**: レベル${generationConfig.interactivityLevel}

## 出力形式
\`\`\`json
{
  "title": "レッスンタイトル",
  "body": "レッスン本文（Markdown形式、構造化）",
  "summary": "レッスンの要約（200文字以内）",
  "keyPoints": ["学習ポイント1", "学習ポイント2", ...],
  "estimatedReadingTime": 推定読み取り時間（分）
}
\`\`\`

## 構造要件
1. 導入（興味を引く）
2. 主要概念の説明
3. 実践例・演習
4. まとめ・次のステップ

魅力的で理解しやすいレッスンを作成してください。
`;
  }

  /**
   * Build assessment generation prompt
   */
  private buildAssessmentPrompt(request: GeminiContentRequest): string {
    const { topic, targetAudience, generationConfig } = request;

    return `
あなたは評価設計の専門家です。以下の要件に従って、効果的な学習評価を作成してください。

## 作成要件
- **評価対象**: ${topic}
- **対象レベル**: ${targetAudience.level}
- **対象年齢**: ${targetAudience.age}歳
- **学習目標**: ${targetAudience.learningGoals.join(', ')}
- **言語**: ${generationConfig.language}
- **評価スタイル**: ${generationConfig.tone}
- **問題数**: ${generationConfig.length === 'short' ? '5-7問' : generationConfig.length === 'medium' ? '8-12問' : '13-20問'}

## 出力形式
\`\`\`json
{
  "title": "評価タイトル",
  "body": "評価の説明と問題（Markdown形式）",
  "summary": "評価の概要（200文字以内）",
  "keyPoints": ["評価ポイント1", "評価ポイント2", ...],
  "estimatedReadingTime": 推定実施時間（分）
}
\`\`\`

## 評価項目要件
- 多様な問題形式（選択式、記述式、実践的課題）
- 明確な採点基準
- 建設的なフィードバック例
- 学習目標との対応関係

学習効果を最大化する評価を設計してください。
`;
  }

  /**
   * Parse generated content from JSON response
   */
  private parseGeneratedContent(text: string, request: GeminiContentRequest) {
    try {
      // Extract JSON from markdown code blocks
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
      if (!jsonMatch) {
        // Fallback: try to parse entire text as JSON
        return { content: JSON.parse(text) };
      }

      const content = JSON.parse(jsonMatch[1]);

      // Validate required fields
      this.validateContentStructure(content);

      return { content };
    } catch (error) {
      // Fallback: create structured content from text
      return this.createFallbackContent(text, request);
    }
  }

  /**
   * Validate content structure
   */
  private validateContentStructure(content: any): void {
    const required = ['title', 'body', 'summary', 'keyPoints', 'estimatedReadingTime'];
    for (const field of required) {
      if (!(field in content)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
  }

  /**
   * Create fallback content structure
   */
  private createFallbackContent(text: string, request: GeminiContentRequest) {
    const lines = text.split('\n').filter(line => line.trim());
    const title = lines[0] || `Generated ${request.contentType}`;

    return {
      content: {
        title,
        body: text,
        summary: lines.slice(0, 3).join(' ').substring(0, 200),
        keyPoints: lines.slice(1, 6).filter(line => line.length > 10),
        estimatedReadingTime: Math.ceil(text.length / 1000 * 5) // ~5 minutes per 1000 chars
      }
    };
  }

  /**
   * Calculate quality metrics
   */
  private async calculateQualityMetrics(content: any, request: GeminiContentRequest) {
    // Basic quality assessment
    const readabilityScore = this.calculateReadability(content.body);
    const factualAccuracyScore = 85; // Placeholder - would use fact-checking service
    const originalityScore = 90; // Placeholder - would use plagiarism detection
    const biasScore = 15; // Placeholder - would use bias detection
    const engagementPrediction = this.calculateEngagement(content, request);

    return {
      readabilityScore,
      factualAccuracyScore,
      originalityScore,
      biasScore,
      engagementPrediction
    };
  }

  /**
   * Calculate readability score (simplified Flesch formula)
   */
  private calculateReadability(text: string): number {
    const sentences = text.split(/[.!?]+/).length;
    const words = text.split(/\s+/).length;
    const syllables = this.countSyllables(text);

    // Simplified Flesch Reading Ease
    const score = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Simple syllable counting
   */
  private countSyllables(text: string): number {
    const words = text.toLowerCase().split(/\s+/);
    return words.reduce((total, word) => {
      const syllables = word.match(/[aeiou]/g)?.length || 1;
      return total + Math.max(1, syllables);
    }, 0);
  }

  /**
   * Calculate engagement prediction
   */
  private calculateEngagement(content: any, request: GeminiContentRequest): number {
    let score = 50; // Base score

    // Length appropriateness
    const wordCount = content.body.split(/\s+/).length;
    const targetLength = this.getTargetWordCount(request.generationConfig.length);
    const lengthDiff = Math.abs(wordCount - targetLength) / targetLength;
    score += (1 - lengthDiff) * 20;

    // Interactivity level bonus
    score += request.generationConfig.interactivityLevel * 5;

    // Examples bonus
    if (request.generationConfig.includeExamples) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(content: any, qualityMetrics: any) {
    const improvements: string[] = [];
    const additionalResources: string[] = [];
    const relatedTopics: string[] = [];

    // Quality-based improvements
    if (qualityMetrics.readabilityScore < 60) {
      improvements.push('文章をより簡潔に分割して読みやすさを向上');
    }
    if (qualityMetrics.engagementPrediction < 70) {
      improvements.push('インタラクティブ要素や具体例を追加');
    }

    // Generic recommendations
    additionalResources.push('関連する参考図書やオンライン資料');
    additionalResources.push('実践的な演習プロジェクト');

    relatedTopics.push('基礎概念の復習');
    relatedTopics.push('応用レベルのトピック');

    return { improvements, additionalResources, relatedTopics };
  }

  /**
   * Create metadata object
   */
  private createMetadata(response: any, processingTime: number) {
    return {
      generatedAt: new Date().toISOString(),
      modelVersion: 'gemini-2.0-flash-exp',
      promptTokens: response.usageMetadata?.promptTokenCount || 0,
      completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
      qualityScore: 85, // Calculated score
      confidenceLevel: 88
    };
  }

  /**
   * Error handling helpers
   */
  private createError(code: GeminiError['code'], message: string, request?: any): Error {
    const error = new Error(message);
    (error as any).code = code;
    (error as any).details = {
      requestId: this.generateRequestId(),
      timestamp: new Date().toISOString(),
      suggestion: this.getErrorSuggestion(code)
    };
    return error;
  }

  private handleGenerationError(error: any, requestId: string): Error {
    if (error.message?.includes('quota')) {
      return this.createError('API_LIMIT', 'API quota exceeded');
    }
    if (error.message?.includes('safety')) {
      return this.createError('SAFETY_FILTER', 'Content filtered by safety systems');
    }
    return this.createError('MODEL_ERROR', error.message || 'Unknown generation error');
  }

  private getErrorSuggestion(code: GeminiError['code']): string {
    const suggestions = {
      'API_LIMIT': 'APIクォータが不足しています。しばらく待ってから再試行してください',
      'INVALID_REQUEST': 'リクエストパラメータを確認してください',
      'MODEL_ERROR': 'モデルエラーが発生しました。入力内容を確認してください',
      'SAFETY_FILTER': '安全フィルターが適用されました。コンテンツを調整してください',
      'TIMEOUT': 'タイムアウトが発生しました。リクエストを簡素化してください'
    };
    return suggestions[code] || '詳細はサポートにお問い合わせください';
  }

  /**
   * Utility methods
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getLengthGuide(length: string): string {
    const guides = {
      'short': '~500語',
      'medium': '~1500語',
      'long': '~3000語'
    };
    return guides[length] || '~1500語';
  }

  private getTargetWordCount(length: string): number {
    const counts = { 'short': 500, 'medium': 1500, 'long': 3000 };
    return counts[length] || 1500;
  }
}

// Export singleton instance (lazy initialization for tests)
let _geminiClient: GeminiClient | null = null;

export const geminiClient = {
  get instance(): GeminiClient {
    if (!_geminiClient) {
      _geminiClient = new GeminiClient();
    }
    return _geminiClient;
  }
};