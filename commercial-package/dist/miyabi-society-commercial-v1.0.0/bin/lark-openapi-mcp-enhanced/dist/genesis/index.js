"use strict";
/**
 * Genesis System Main Entry Point
 * Lark Genesis Architect メインエクスポート
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenesisArchitect = exports.GeminiClient = exports.PerformanceOptimizer = exports.MultilangSupport = exports.ProgressMonitor = exports.TemplateManager = exports.LarkBaseBuilder = exports.StructuredDataExtractor = exports.COMMAND_STACK = exports.GenesisPromptEngine = void 0;
// Core components
var prompt_engine_1 = require("./core/prompt-engine");
Object.defineProperty(exports, "GenesisPromptEngine", { enumerable: true, get: function () { return prompt_engine_1.GenesisPromptEngine; } });
Object.defineProperty(exports, "COMMAND_STACK", { enumerable: true, get: function () { return prompt_engine_1.COMMAND_STACK; } });
var data_extractor_1 = require("./core/data-extractor");
Object.defineProperty(exports, "StructuredDataExtractor", { enumerable: true, get: function () { return data_extractor_1.StructuredDataExtractor; } });
// Integration components
var lark_base_builder_1 = require("./integrations/lark-base-builder");
Object.defineProperty(exports, "LarkBaseBuilder", { enumerable: true, get: function () { return lark_base_builder_1.LarkBaseBuilder; } });
// System components
var template_manager_1 = require("./systems/template-manager");
Object.defineProperty(exports, "TemplateManager", { enumerable: true, get: function () { return template_manager_1.TemplateManager; } });
var progress_monitor_1 = require("./systems/progress-monitor");
Object.defineProperty(exports, "ProgressMonitor", { enumerable: true, get: function () { return progress_monitor_1.ProgressMonitor; } });
var multilang_support_1 = require("./systems/multilang-support");
Object.defineProperty(exports, "MultilangSupport", { enumerable: true, get: function () { return multilang_support_1.MultilangSupport; } });
var performance_optimizer_1 = require("./systems/performance-optimizer");
Object.defineProperty(exports, "PerformanceOptimizer", { enumerable: true, get: function () { return performance_optimizer_1.PerformanceOptimizer; } });
// Utilities
var gemini_client_1 = require("./utils/gemini-client");
Object.defineProperty(exports, "GeminiClient", { enumerable: true, get: function () { return gemini_client_1.GeminiClient; } });
// Import types for internal use
const prompt_engine_2 = require("./core/prompt-engine");
const data_extractor_2 = require("./core/data-extractor");
const lark_base_builder_2 = require("./integrations/lark-base-builder");
const template_manager_2 = require("./systems/template-manager");
const progress_monitor_2 = require("./systems/progress-monitor");
const multilang_support_2 = require("./systems/multilang-support");
const performance_optimizer_2 = require("./systems/performance-optimizer");
/**
 * Genesis Architect
 * 統合システムクラス
 */
class GenesisArchitect {
    constructor(config) {
        this.promptEngine = new prompt_engine_2.GenesisPromptEngine({
            geminiApiKey: config.geminiApiKey,
            maxRetries: config.maxRetries || 5,
            timeoutMs: config.timeoutMs || 60000,
            enableLogging: config.enableLogging !== false,
            rateLimitDelay: config.rateLimitDelay || 3000, // 3 second delay between API calls
        });
        this.dataExtractor = data_extractor_2.StructuredDataExtractor;
        this.baseBuilder = new lark_base_builder_2.LarkBaseBuilder(config.larkClient, {
            retryAttempts: config.maxRetries || 3,
            retryDelay: 1000,
        });
        // 新システムの初期化
        this.templateManager = new template_manager_2.TemplateManager();
        this.progressMonitor = new progress_monitor_2.ProgressMonitor();
        this.multilangSupport = new multilang_support_2.MultilangSupport();
        this.performanceOptimizer = new performance_optimizer_2.PerformanceOptimizer(config.optimizationConfig);
    }
    /**
     * 要求仕様からLark Baseまでの完全自動生成
     */
    async createFromRequirements(requirements, options) {
        const errors = [];
        let progressSessionId;
        try {
            // 言語検出
            const detectedLanguage = this.multilangSupport.detectLanguage(requirements);
            const language = (options === null || options === void 0 ? void 0 : options.language) || detectedLanguage.detectedLanguage;
            // プログレスセッションの作成
            if (options === null || options === void 0 ? void 0 : options.enableProgressTracking) {
                const session = this.progressMonitor.createSession({
                    projectName: 'Lark Base Generation',
                    description: 'Generating Lark Base from requirements',
                    steps: [
                        { id: 'detect_language', name: 'Language Detection', description: 'Detecting input language' },
                        { id: 'analyze_requirements', name: 'Requirements Analysis', description: 'Analyzing requirements' },
                        { id: 'design_er', name: 'ER Design', description: 'Creating ER diagram' },
                        { id: 'design_base', name: 'Base Design', description: 'Designing base structure' },
                        { id: 'build_base', name: 'Base Construction', description: 'Building Lark Base' },
                    ],
                    metadata: {
                        sessionType: 'custom',
                        priority: 'high',
                    },
                });
                progressSessionId = session.id;
                this.progressMonitor.startSession(session.id);
            }
            // テンプレートの適用（指定されている場合）
            let baseSpec;
            if (options === null || options === void 0 ? void 0 : options.templateId) {
                try {
                    baseSpec = this.templateManager.applyTemplate(options.templateId, options.templateVariables || {});
                }
                catch (error) {
                    errors.push(`Template application failed: ${error}`);
                }
            }
            // テンプレートが適用されていない場合は通常の処理
            if (!baseSpec) {
                // 1. 7段階プロンプト実行（最適化付き）
                const context = await this.performanceOptimizer.executeOptimized(() => this.promptEngine.executeCommandStack(requirements), 'high');
                // 2. 最終結果からBase仕様を抽出
                const implementationPlan = context.results['C7'];
                if (!implementationPlan) {
                    throw new Error('Implementation plan not generated');
                }
                // 3. Base仕様への変換（C3の結果を使用）
                const baseDesign = context.results['C3'];
                if (!baseDesign) {
                    throw new Error('Base design not generated');
                }
                baseSpec = this.convertToBaseSpec(baseDesign);
            }
            // 4. Lark Base構築（最適化付き）
            const buildResult = await this.performanceOptimizer.executeOptimized(() => this.baseBuilder.buildBase(baseSpec), 'critical');
            // プログレスセッションの完了
            if (progressSessionId) {
                this.progressMonitor.completeSession(progressSessionId, { baseId: buildResult.baseId });
            }
            return {
                success: buildResult.success,
                baseId: buildResult.baseId,
                executionContext: {}, // テンプレート使用時は空
                buildResult,
                errors: [...errors, ...buildResult.errors],
                progressSessionId,
            };
        }
        catch (error) {
            errors.push(`Genesis execution failed: ${error}`);
            // プログレスセッションの失敗
            if (progressSessionId) {
                this.progressMonitor.failSession(progressSessionId, String(error));
            }
            return {
                success: false,
                executionContext: {},
                buildResult: {},
                errors,
                progressSessionId,
            };
        }
    }
    /**
     * 段階的実行（プレビュー機能）
     */
    async executeStep(requirements, stepId, options) {
        try {
            const context = {
                requirements,
                currentLevel: 0,
                results: {},
                metadata: {
                    projectId: `preview_${Date.now()}`,
                    timestamp: Date.now(),
                    version: '1.0.0',
                },
            };
            let progressSessionId;
            // プログレスセッションの作成
            if (options === null || options === void 0 ? void 0 : options.enableProgressTracking) {
                const session = this.progressMonitor.createSession({
                    projectName: 'Step Execution',
                    description: `Executing step: ${stepId}`,
                    steps: [{ id: 'execute_step', name: 'Step Execution', description: `Executing ${stepId}` }],
                    metadata: {
                        sessionType: 'custom',
                        priority: 'medium',
                    },
                });
                progressSessionId = session.id;
                this.progressMonitor.startSession(session.id);
                this.progressMonitor.startStep(session.id, 'execute_step');
            }
            const result = await this.performanceOptimizer.executeOptimized(() => this.promptEngine.executeSpecificCommand(stepId, context), 'medium');
            // プログレスセッションの完了
            if (progressSessionId) {
                this.progressMonitor.completeStep(progressSessionId, 'execute_step', { result });
                this.progressMonitor.completeSession(progressSessionId, { result });
            }
            return {
                success: true,
                result,
                errors: [],
                progressSessionId,
            };
        }
        catch (error) {
            return {
                success: false,
                result: null,
                errors: [`Step execution failed: ${error}`],
            };
        }
    }
    /**
     * Base設計仕様への変換
     */
    convertToBaseSpec(designResult) {
        return {
            name: designResult.baseName || 'Generated Base',
            description: designResult.description || 'Auto-generated Lark Base',
            tables: (designResult.tables || []).map((table) => ({
                name: table.name,
                description: table.description || '',
                fields: (table.fields || []).map((field) => ({
                    name: field.name,
                    type: this.mapFieldType(field.type),
                    description: field.description,
                    required: field.required,
                    options: field.options,
                })),
                views: (table.views || []).map((view) => ({
                    name: view.name,
                    type: view.type,
                    config: view.config,
                })),
            })),
            automations: designResult.automations || [],
        };
    }
    /**
     * フィールドタイプマッピング
     */
    mapFieldType(type) {
        const typeMap = {
            text: 'text',
            number: 'number',
            date: 'date',
            checkbox: 'checkbox',
            singleSelect: 'singleSelect',
            multiSelect: 'multiSelect',
            attachment: 'attachment',
            user: 'user',
            formula: 'formula',
        };
        return typeMap[type] || 'text';
    }
    /**
     * テンプレート管理機能
     */
    getTemplateManager() {
        return this.templateManager;
    }
    /**
     * プログレス監視機能
     */
    getProgressMonitor() {
        return this.progressMonitor;
    }
    /**
     * 多言語対応機能
     */
    getMultilangSupport() {
        return this.multilangSupport;
    }
    /**
     * パフォーマンス最適化機能
     */
    getPerformanceOptimizer() {
        return this.performanceOptimizer;
    }
    /**
     * 実行状況の取得
     */
    getStatus() {
        return {
            isReady: true,
            version: '2.0.0',
            capabilities: [
                'Requirements Analysis',
                'ER Design',
                'Base Structure Design',
                'Business Logic Design',
                'Automation Design',
                'UI Design',
                'Implementation Planning',
                'Auto Base Creation',
                'Template Management',
                'Progress Monitoring',
                'Multi-language Support',
                'Performance Optimization',
            ],
            performance: this.performanceOptimizer.getMetrics(),
            resourceUsage: this.performanceOptimizer.getResourceUsage(),
        };
    }
    /**
     * システムのクリーンアップ
     */
    cleanup() {
        this.performanceOptimizer.cleanup();
    }
}
exports.GenesisArchitect = GenesisArchitect;
