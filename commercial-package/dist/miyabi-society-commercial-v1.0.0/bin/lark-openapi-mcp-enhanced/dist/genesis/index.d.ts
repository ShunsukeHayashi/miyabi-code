/**
 * Genesis System Main Entry Point
 * Lark Genesis Architect メインエクスポート
 */
export { GenesisPromptEngine, COMMAND_STACK } from './core/prompt-engine';
export type { CommandStackLevel, ExecutionContext, PromptEngineConfig } from './core/prompt-engine';
export { StructuredDataExtractor } from './core/data-extractor';
export type { ExtractionRule, ExtractionSchema, ExtractionResult } from './core/data-extractor';
export { LarkBaseBuilder } from './integrations/lark-base-builder';
export type { BaseSpec, TableSpec, FieldSpec, ViewSpec, AutomationSpec, PermissionSpec, BuildResult, } from './integrations/lark-base-builder';
export { TemplateManager } from './systems/template-manager';
export type { Template, TemplateMetadata, TemplateCategory, TemplateVariable, TemplateExample, } from './systems/template-manager';
export { ProgressMonitor } from './systems/progress-monitor';
export type { ProgressSession, ProgressStep, ProgressEvent, ProgressListener } from './systems/progress-monitor';
export { MultilangSupport } from './systems/multilang-support';
export type { SupportedLanguage, LanguageConfig, TranslationKey, LocalizedPrompt, LanguageDetectionResult, } from './systems/multilang-support';
export { PerformanceOptimizer } from './systems/performance-optimizer';
export type { PerformanceMetrics, OptimizationConfig, BatchOperation, CacheEntry, ResourceUsage, } from './systems/performance-optimizer';
export { GeminiClient } from './utils/gemini-client';
export type { GeminiConfig, GeminiRequest, GeminiResponse } from './utils/gemini-client';
import { ExecutionContext } from './core/prompt-engine';
import { BuildResult } from './integrations/lark-base-builder';
import { TemplateManager } from './systems/template-manager';
import { ProgressMonitor } from './systems/progress-monitor';
import { MultilangSupport, SupportedLanguage } from './systems/multilang-support';
import { PerformanceOptimizer, OptimizationConfig, PerformanceMetrics, ResourceUsage } from './systems/performance-optimizer';
/**
 * Genesis Architect
 * 統合システムクラス
 */
export declare class GenesisArchitect {
    private promptEngine;
    private dataExtractor;
    private baseBuilder;
    private templateManager;
    private progressMonitor;
    private multilangSupport;
    private performanceOptimizer;
    constructor(config: {
        geminiApiKey: string;
        larkClient: any;
        maxRetries?: number;
        timeoutMs?: number;
        enableLogging?: boolean;
        language?: SupportedLanguage;
        optimizationConfig?: Partial<OptimizationConfig>;
        rateLimitDelay?: number;
    });
    /**
     * 要求仕様からLark Baseまでの完全自動生成
     */
    createFromRequirements(requirements: string, options?: {
        language?: SupportedLanguage;
        templateId?: string;
        templateVariables?: Record<string, any>;
        enableProgressTracking?: boolean;
    }): Promise<{
        success: boolean;
        baseId?: string;
        executionContext: ExecutionContext;
        buildResult: BuildResult;
        errors: string[];
        progressSessionId?: string;
    }>;
    /**
     * 段階的実行（プレビュー機能）
     */
    executeStep(requirements: string, stepId: string, options?: {
        language?: SupportedLanguage;
        enableProgressTracking?: boolean;
    }): Promise<{
        success: boolean;
        result: any;
        errors: string[];
        progressSessionId?: string;
    }>;
    /**
     * Base設計仕様への変換
     */
    private convertToBaseSpec;
    /**
     * フィールドタイプマッピング
     */
    private mapFieldType;
    /**
     * テンプレート管理機能
     */
    getTemplateManager(): TemplateManager;
    /**
     * プログレス監視機能
     */
    getProgressMonitor(): ProgressMonitor;
    /**
     * 多言語対応機能
     */
    getMultilangSupport(): MultilangSupport;
    /**
     * パフォーマンス最適化機能
     */
    getPerformanceOptimizer(): PerformanceOptimizer;
    /**
     * 実行状況の取得
     */
    getStatus(): {
        isReady: boolean;
        version: string;
        capabilities: string[];
        performance: PerformanceMetrics;
        resourceUsage: ResourceUsage;
    };
    /**
     * システムのクリーンアップ
     */
    cleanup(): void;
}
