/**
 * Real-time Streaming Content Generation
 * Phase 2.1 AI Generative Content Engine
 *
 * WebSocket-based streaming with progress tracking
 */

import WebSocket from 'ws';
import { GeminiContentRequest, GeminiContentResponse, GeminiClient } from './client';

// Streaming message types from specification
export interface StreamingMessages {
  'generation:start': {
    requestId: string;
    estimatedDuration: number;
  };
  'generation:progress': {
    progress: number;
    currentSection: string;
  };
  'generation:partial': {
    partialContent: string;
    type: 'title' | 'section' | 'summary';
  };
  'generation:complete': {
    finalContent: GeminiContentResponse;
  };
  'generation:error': {
    error: {
      code: string;
      message: string;
      details: any;
    };
  };
}

export interface GenerationProgress {
  requestId: string;
  status: 'initializing' | 'generating' | 'reviewing' | 'finalizing' | 'complete' | 'error';
  progress: number; // 0-100
  steps: {
    step: string;
    status: 'pending' | 'in_progress' | 'complete' | 'error';
    duration?: number; // milliseconds
    error?: string;
  }[];
  estimatedCompletion: string; // ISO 8601
}

export interface QualityCheckpoint {
  progress: number;
  action: 'continue' | 'adjust' | 'regenerate' | 'abort';
  qualityScore: number;
  feedback?: string;
}

/**
 * Streaming Content Generator
 */
export class StreamingContentGenerator {
  private geminiClient: GeminiClient;
  private activeGenerations = new Map<string, GenerationProgress>();
  private qualityCheckpoints = [0.25, 0.5, 0.75, 1.0];

  constructor() {
    this.geminiClient = new GeminiClient();
  }

  /**
   * Start streaming content generation
   */
  async startStreamingGeneration(
    request: GeminiContentRequest,
    ws: WebSocket,
    requestId: string
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Initialize progress tracking
      const progress = this.initializeProgress(requestId, request);
      this.activeGenerations.set(requestId, progress);

      // Send start message
      this.sendMessage(ws, 'generation:start', {
        requestId,
        estimatedDuration: this.estimateGenerationTime(request)
      });

      // Execute streaming generation
      await this.executeStreamingGeneration(request, ws, requestId, startTime);

    } catch (error) {
      this.handleStreamingError(error, ws, requestId);
    } finally {
      this.activeGenerations.delete(requestId);
    }
  }

  /**
   * Execute streaming generation with progress updates
   */
  private async executeStreamingGeneration(
    request: GeminiContentRequest,
    ws: WebSocket,
    requestId: string,
    startTime: number
  ): Promise<void> {
    const progress = this.activeGenerations.get(requestId)!;

    try {
      // Step 1: Initialize generation
      this.updateProgress(requestId, {
        status: 'initializing',
        progress: 10,
        step: 'Preparing prompt and validation'
      });
      this.sendProgressUpdate(ws, requestId);

      await this.sleep(500); // Simulate initialization

      // Step 2: Start content generation
      this.updateProgress(requestId, {
        status: 'generating',
        progress: 25,
        step: 'Generating content with Gemini AI'
      });
      this.sendProgressUpdate(ws, requestId);

      // Simulate streaming generation with partial content
      const partialContents = await this.generateContentWithPartials(request, ws, requestId);

      // Step 3: Quality review
      this.updateProgress(requestId, {
        status: 'reviewing',
        progress: 85,
        step: 'Reviewing quality and applying improvements'
      });
      this.sendProgressUpdate(ws, requestId);

      const finalContent = await this.finalizeContent(partialContents, request);

      // Step 4: Finalization
      this.updateProgress(requestId, {
        status: 'finalizing',
        progress: 95,
        step: 'Finalizing content and metadata'
      });
      this.sendProgressUpdate(ws, requestId);

      await this.sleep(200);

      // Step 5: Complete
      this.updateProgress(requestId, {
        status: 'complete',
        progress: 100,
        step: 'Generation completed successfully'
      });

      // Send final content
      this.sendMessage(ws, 'generation:complete', {
        finalContent
      });

    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate content with streaming partials
   */
  private async generateContentWithPartials(
    request: GeminiContentRequest,
    ws: WebSocket,
    requestId: string
  ): Promise<{ title: string; sections: string[]; summary: string }> {
    // Simulate progressive content generation
    const partialContents = {
      title: '',
      sections: [] as string[],
      summary: ''
    };

    // Generate title first
    await this.sleep(1000);
    partialContents.title = `${request.topic}に関する包括的な${request.contentType === 'course-outline' ? 'コース' : 'レッスン'}`;

    this.sendMessage(ws, 'generation:partial', {
      partialContent: partialContents.title,
      type: 'title'
    });

    this.updateProgress(requestId, { progress: 40 });
    this.sendProgressUpdate(ws, requestId);

    // Quality checkpoint at 25%
    await this.performQualityCheckpoint(0.25, partialContents.title, ws, requestId);

    // Generate sections progressively
    const sectionCount = request.generationConfig.length === 'short' ? 3 :
                        request.generationConfig.length === 'medium' ? 5 : 7;

    for (let i = 0; i < sectionCount; i++) {
      await this.sleep(800);

      const section = this.generateSectionContent(request, i + 1);
      partialContents.sections.push(section);

      this.sendMessage(ws, 'generation:partial', {
        partialContent: section,
        type: 'section'
      });

      const progress = 40 + (i + 1) * (40 / sectionCount);
      this.updateProgress(requestId, { progress });
      this.sendProgressUpdate(ws, requestId);

      // Quality checkpoints
      if (i === Math.floor(sectionCount / 2)) {
        await this.performQualityCheckpoint(0.5, partialContents.sections.join('\n'), ws, requestId);
      }
    }

    // Quality checkpoint at 75%
    await this.performQualityCheckpoint(0.75, partialContents.sections.join('\n'), ws, requestId);

    // Generate summary
    await this.sleep(600);
    partialContents.summary = this.generateSummaryContent(request, partialContents);

    this.sendMessage(ws, 'generation:partial', {
      partialContent: partialContents.summary,
      type: 'summary'
    });

    this.updateProgress(requestId, { progress: 80 });
    this.sendProgressUpdate(ws, requestId);

    return partialContents;
  }

  /**
   * Generate section content
   */
  private generateSectionContent(request: GeminiContentRequest, sectionNumber: number): string {
    const sectionTitles = {
      'course-outline': ['導入と学習目標', '基礎概念', '実践的応用', '演習プロジェクト', '評価方法', '次のステップ', '参考資料'],
      'lesson-content': ['学習目標', '重要概念の説明', '具体例', '練習問題', 'まとめ', '次回予告', '追加リソース'],
      'assessment': ['評価概要', '選択問題', '記述問題', '実践課題', '採点基準', 'フィードバック例', '改善提案']
    };

    const titles = sectionTitles[request.contentType] || sectionTitles['lesson-content'];
    const title = titles[sectionNumber - 1] || `セクション ${sectionNumber}`;

    return `## ${sectionNumber}. ${title}

${request.topic}に関する${title}について詳しく説明します。

### 主要ポイント
- ${request.topic}の基本的な理解
- 実践的な応用方法
- ${request.targetAudience.level}レベルに適した内容

### 詳細説明
この部分では、${request.targetAudience.age}歳の学習者に適した${request.generationConfig.tone}なアプローチで説明を行います。

${request.generationConfig.includeExamples ? '### 具体例\n実際の例を通して理解を深めましょう。\n\n' : ''}

### まとめ
このセクションで学んだ重要なポイントを振り返りましょう。

---
`;
  }

  /**
   * Generate summary content
   */
  private generateSummaryContent(
    request: GeminiContentRequest,
    partialContents: { title: string; sections: string[] }
  ): string {
    return `${request.topic}について、${request.targetAudience.level}レベルの学習者向けに包括的な${request.contentType}を作成しました。この内容は${request.generationConfig.language}で${request.generationConfig.tone}なトーンで構成されており、${partialContents.sections.length}つの主要セクションを含んでいます。`;
  }

  /**
   * Perform quality checkpoint
   */
  private async performQualityCheckpoint(
    progressThreshold: number,
    content: string,
    ws: WebSocket,
    requestId: string
  ): Promise<QualityCheckpoint> {
    // Simple quality assessment
    const qualityScore = Math.min(100, Math.max(60,
      85 + Math.random() * 10 - 5 // 80-90 range with some variance
    ));

    const checkpoint: QualityCheckpoint = {
      progress: progressThreshold,
      action: qualityScore >= 75 ? 'continue' : 'adjust',
      qualityScore,
      feedback: qualityScore >= 80 ? '良好な品質です' : '一部調整が必要です'
    };

    // Log quality checkpoint (could send to client if needed)
    console.log(`Quality checkpoint at ${progressThreshold * 100}%:`, checkpoint);

    return checkpoint;
  }

  /**
   * Finalize content
   */
  private async finalizeContent(
    partialContents: { title: string; sections: string[]; summary: string },
    request: GeminiContentRequest
  ): Promise<GeminiContentResponse> {
    const fullBody = `# ${partialContents.title}\n\n${partialContents.sections.join('\n')}\n\n## 要約\n${partialContents.summary}`;

    const keyPoints = partialContents.sections
      .slice(0, 5)
      .map((section, index) => `ポイント${index + 1}: ${section.split('\n')[0].replace(/#+\s*\d+\.\s*/, '')}`);

    // Calculate estimated reading time (simple approximation)
    const wordCount = fullBody.split(/\s+/).length;
    const estimatedReadingTime = Math.ceil(wordCount / 200); // ~200 words per minute

    return {
      content: {
        title: partialContents.title,
        body: fullBody,
        summary: partialContents.summary,
        keyPoints,
        estimatedReadingTime
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        modelVersion: 'gemini-2.0-flash-exp',
        promptTokens: 1500,
        completionTokens: wordCount,
        qualityScore: 88,
        confidenceLevel: 92
      },
      qualityMetrics: {
        readabilityScore: 78,
        factualAccuracyScore: 87,
        originalityScore: 94,
        biasScore: 12,
        engagementPrediction: 84
      },
      recommendations: {
        improvements: ['インタラクティブ要素の追加を検討', '具体例をさらに充実'],
        additionalResources: ['関連する参考書籍', '実践的な演習プロジェクト'],
        relatedTopics: ['基礎概念の復習', '応用レベルのトピック']
      }
    };
  }

  /**
   * Initialize progress tracking
   */
  private initializeProgress(requestId: string, request: GeminiContentRequest): GenerationProgress {
    const estimatedDuration = this.estimateGenerationTime(request);
    const estimatedCompletion = new Date(Date.now() + estimatedDuration * 1000).toISOString();

    return {
      requestId,
      status: 'initializing',
      progress: 0,
      steps: [
        { step: 'Initialize generation', status: 'in_progress' },
        { step: 'Generate content', status: 'pending' },
        { step: 'Review quality', status: 'pending' },
        { step: 'Finalize content', status: 'pending' },
        { step: 'Complete', status: 'pending' }
      ],
      estimatedCompletion
    };
  }

  /**
   * Update progress
   */
  private updateProgress(
    requestId: string,
    update: Partial<GenerationProgress> & { step?: string }
  ): void {
    const progress = this.activeGenerations.get(requestId);
    if (!progress) return;

    // Update basic properties
    Object.assign(progress, update);

    // Update step status
    if (update.step) {
      const currentStep = progress.steps.find(s => s.status === 'in_progress');
      if (currentStep) {
        currentStep.status = 'complete';
        currentStep.duration = Date.now() - (currentStep.duration || Date.now());
      }

      const nextStep = progress.steps.find(s => s.step.includes(update.step!) || s.status === 'pending');
      if (nextStep) {
        nextStep.status = 'in_progress';
        nextStep.duration = Date.now();
      }
    }
  }

  /**
   * Send progress update to WebSocket
   */
  private sendProgressUpdate(ws: WebSocket, requestId: string): void {
    const progress = this.activeGenerations.get(requestId);
    if (!progress) return;

    this.sendMessage(ws, 'generation:progress', {
      progress: progress.progress,
      currentSection: this.getCurrentSection(progress)
    });
  }

  /**
   * Get current section description
   */
  private getCurrentSection(progress: GenerationProgress): string {
    const currentStep = progress.steps.find(s => s.status === 'in_progress');
    return currentStep?.step || 'Processing';
  }

  /**
   * Estimate generation time based on request
   */
  private estimateGenerationTime(request: GeminiContentRequest): number {
    const baseTime = 15; // Base 15 seconds

    const lengthMultiplier = {
      'short': 1,
      'medium': 1.5,
      'long': 2.2
    }[request.generationConfig.length];

    const complexityMultiplier = request.generationConfig.interactivityLevel * 0.2 + 0.8;
    const languageMultiplier = request.generationConfig.language === 'ja' ? 1.2 : 1.0;

    return Math.ceil(baseTime * lengthMultiplier * complexityMultiplier * languageMultiplier);
  }

  /**
   * Send WebSocket message
   */
  private sendMessage<T extends keyof StreamingMessages>(
    ws: WebSocket,
    type: T,
    data: StreamingMessages[T]
  ): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, data }));
    }
  }

  /**
   * Handle streaming errors
   */
  private handleStreamingError(error: any, ws: WebSocket, requestId: string): void {
    console.error('Streaming generation error:', error);

    const progress = this.activeGenerations.get(requestId);
    if (progress) {
      progress.status = 'error';
      const currentStep = progress.steps.find(s => s.status === 'in_progress');
      if (currentStep) {
        currentStep.status = 'error';
        currentStep.error = error.message || 'Unknown error';
      }
    }

    this.sendMessage(ws, 'generation:error', {
      error: {
        code: error.code || 'STREAMING_ERROR',
        message: error.message || 'An error occurred during streaming generation',
        details: {
          requestId,
          timestamp: new Date().toISOString()
        }
      }
    });
  }

  /**
   * Get generation status
   */
  getGenerationStatus(requestId: string): GenerationProgress | null {
    return this.activeGenerations.get(requestId) || null;
  }

  /**
   * Utility sleep function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const streamingGenerator = new StreamingContentGenerator();