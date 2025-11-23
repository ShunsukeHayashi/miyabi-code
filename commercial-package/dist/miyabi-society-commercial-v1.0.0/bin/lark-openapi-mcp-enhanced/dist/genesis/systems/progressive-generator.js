"use strict";
/**
 * Progressive Generation System
 * 段階的設計進行とユーザーフィードバック機能
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressiveGenerator = void 0;
/**
 * Progressive Generation System
 * ユーザーとの対話を通じて段階的にシステムを生成
 */
class ProgressiveGenerator {
    /**
     * 新しいプログレッシブセッションを開始
     */
    static startSession(userId, name, requirements, options = {}) {
        const sessionId = `session_${Date.now()}_${userId}`;
        // ステップの初期化
        const steps = (options.customSteps || this.DEFAULT_STEPS).map((stepTemplate, index) => ({
            id: `step_${index + 1}`,
            ...stepTemplate,
            status: 'pending',
            result: null,
            userFeedback: undefined,
        }));
        return {
            id: sessionId,
            name,
            description: `Progressive generation session for ${name}`,
            userId,
            requirements,
            steps,
            currentStepIndex: 0,
            overallProgress: 0,
            status: 'not_started',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            settings: {
                autoAdvance: options.autoAdvance !== false,
                requireApproval: options.requireApproval !== false,
                enableValidation: options.enableValidation !== false,
                saveHistory: true,
            },
            history: [],
        };
    }
    /**
     * セッションの次のステップを実行
     */
    static async executeNextStep(session, stepInputs = {}) {
        const errors = [];
        try {
            const currentStep = session.steps[session.currentStepIndex];
            if (!currentStep) {
                return {
                    success: false,
                    session,
                    errors: ['No more steps to execute'],
                };
            }
            // 依存関係チェック
            const dependencyCheck = this.checkDependencies(session, currentStep);
            if (!dependencyCheck.satisfied) {
                return {
                    success: false,
                    session,
                    errors: [`Dependencies not satisfied: ${dependencyCheck.missing.join(', ')}`],
                };
            }
            // 入力検証
            const inputValidation = this.validateStepInputs(currentStep, stepInputs);
            if (!inputValidation.valid) {
                return {
                    success: false,
                    session,
                    errors: inputValidation.errors,
                };
            }
            // ステップ実行
            session.steps[session.currentStepIndex].status = 'in_progress';
            this.addHistory(session, currentStep.id, 'started');
            const executionResult = await this.executeStep(session, currentStep, stepInputs);
            if (executionResult.success) {
                session.steps[session.currentStepIndex].status = 'completed';
                session.steps[session.currentStepIndex].result = executionResult.result;
                // 検証実行
                if (session.settings.enableValidation && currentStep.validationRules) {
                    const validationResults = this.runValidations(currentStep, executionResult.result);
                    if (validationResults.some((v) => !v.valid)) {
                        // 検証エラーがある場合は警告として記録
                        errors.push(...validationResults.flatMap((v) => v.issues.map((i) => i.message)));
                    }
                }
                // フィードバック要求の生成
                let feedbackRequest;
                if (session.settings.requireApproval) {
                    feedbackRequest = this.generateFeedbackRequest(session, currentStep, executionResult.result);
                }
                // 進捗更新
                this.updateProgress(session);
                return {
                    success: true,
                    session,
                    stepResult: executionResult.result,
                    feedbackRequest,
                    errors,
                };
            }
            else {
                session.steps[session.currentStepIndex].status = 'failed';
                return {
                    success: false,
                    session,
                    errors: executionResult.errors,
                };
            }
        }
        catch (error) {
            session.steps[session.currentStepIndex].status = 'failed';
            return {
                success: false,
                session,
                errors: [`Step execution failed: ${error}`],
            };
        }
    }
    /**
     * ユーザーフィードバックの処理
     */
    static async processFeedback(session, stepId, feedback) {
        try {
            const stepIndex = session.steps.findIndex((step) => step.id === stepId);
            if (stepIndex === -1) {
                return {
                    success: false,
                    session,
                    needsRevision: false,
                };
            }
            // フィードバックを記録
            session.steps[stepIndex].userFeedback = feedback;
            this.addHistory(session, stepId, 'feedback_received', feedback);
            let needsRevision = false;
            let revisionResult;
            // 承認されていないか、修正要求がある場合
            if (!feedback.approved || feedback.requestRevision) {
                needsRevision = true;
                // リビジョンの実行
                if (feedback.modifications.length > 0) {
                    revisionResult = await this.executeRevision(session, stepIndex, feedback);
                    if (revisionResult.improved) {
                        session.steps[stepIndex].result = revisionResult.newResult;
                        this.addHistory(session, stepId, 'revision_requested', {
                            changes: revisionResult.changes,
                            confidence: revisionResult.confidenceScore,
                        });
                    }
                }
            }
            else {
                // 承認された場合、次のステップに進む
                if (session.settings.autoAdvance && session.currentStepIndex < session.steps.length - 1) {
                    session.currentStepIndex++;
                }
            }
            this.updateProgress(session);
            return {
                success: true,
                session,
                needsRevision,
                revisionResult,
            };
        }
        catch (error) {
            return {
                success: false,
                session,
                needsRevision: false,
            };
        }
    }
    /**
     * セッションの進捗を更新
     */
    static updateProgress(session) {
        const completedSteps = session.steps.filter((step) => step.status === 'completed').length;
        session.overallProgress = Math.round((completedSteps / session.steps.length) * 100);
        session.updatedAt = Date.now();
        if (completedSteps === session.steps.length) {
            session.status = 'completed';
            session.completedAt = Date.now();
        }
        else if (completedSteps > 0) {
            session.status = 'in_progress';
        }
    }
    /**
     * 依存関係チェック
     */
    static checkDependencies(session, step) {
        const missing = [];
        step.dependencies.forEach((depName) => {
            const depStep = session.steps.find((s) => s.name === depName);
            if (!depStep || depStep.status !== 'completed') {
                missing.push(depName);
            }
        });
        return {
            satisfied: missing.length === 0,
            missing,
        };
    }
    /**
     * ステップ入力の検証
     */
    static validateStepInputs(step, inputs) {
        const errors = [];
        step.inputs.forEach((input) => {
            const value = inputs[input.name];
            if (input.required && (value === undefined || value === null || value === '')) {
                errors.push(`Required input '${input.name}' is missing`);
                return;
            }
            if (value !== undefined && input.validation) {
                const validation = input.validation;
                if (validation.pattern && typeof value === 'string') {
                    const regex = new RegExp(validation.pattern);
                    if (!regex.test(value)) {
                        errors.push(`Input '${input.name}' does not match required pattern`);
                    }
                }
                if (validation.minLength && typeof value === 'string' && value.length < validation.minLength) {
                    errors.push(`Input '${input.name}' is too short (minimum ${validation.minLength} characters)`);
                }
                if (validation.maxLength && typeof value === 'string' && value.length > validation.maxLength) {
                    errors.push(`Input '${input.name}' is too long (maximum ${validation.maxLength} characters)`);
                }
                if (validation.min !== undefined && typeof value === 'number' && value < validation.min) {
                    errors.push(`Input '${input.name}' is too small (minimum ${validation.min})`);
                }
                if (validation.max !== undefined && typeof value === 'number' && value > validation.max) {
                    errors.push(`Input '${input.name}' is too large (maximum ${validation.max})`);
                }
            }
        });
        return {
            valid: errors.length === 0,
            errors,
        };
    }
    /**
     * ステップの実行
     */
    static async executeStep(session, step, inputs) {
        try {
            // 実際の実装では、各ステップに応じた処理を実行
            // ここではダミーの実装
            const result = {
                stepId: step.id,
                stepName: step.name,
                inputs,
                timestamp: Date.now(),
                data: this.generateMockStepResult(step, inputs),
            };
            return {
                success: true,
                result,
                errors: [],
            };
        }
        catch (error) {
            return {
                success: false,
                errors: [`Step execution failed: ${error}`],
            };
        }
    }
    /**
     * モックステップ結果の生成
     */
    static generateMockStepResult(step, inputs) {
        switch (step.name) {
            case '要求分析':
                return {
                    projectTitle: 'Generated Project',
                    domain: 'Business Management',
                    functionalRequirements: [
                        { id: 'FR001', description: 'User management functionality' },
                        { id: 'FR002', description: 'Data reporting capabilities' },
                    ],
                    stakeholders: ['Business Users', 'System Administrators'],
                };
            case 'データモデル設計':
                return {
                    entities: [
                        {
                            name: 'User',
                            attributes: [
                                { name: 'id', type: 'string', primaryKey: true },
                                { name: 'name', type: 'string' },
                                { name: 'email', type: 'string' },
                            ],
                        },
                    ],
                    relationships: [],
                };
            default:
                return {
                    generated: true,
                    stepName: step.name,
                    timestamp: Date.now(),
                };
        }
    }
    /**
     * 検証の実行
     */
    static runValidations(step, result) {
        return (step.validationRules || []).map((rule) => rule.validator(result));
    }
    /**
     * フィードバック要求の生成
     */
    static generateFeedbackRequest(session, step, result) {
        return {
            sessionId: session.id,
            stepId: step.id,
            title: `${step.name}の確認`,
            description: `${step.description}の結果をご確認ください。`,
            data: result,
            questions: [
                {
                    id: 'overall_rating',
                    type: 'rating',
                    question: '全体的な結果の品質はいかがですか？',
                    required: true,
                },
                {
                    id: 'accuracy',
                    type: 'rating',
                    question: '要求に対する正確性はいかがですか？',
                    required: true,
                },
                {
                    id: 'comments',
                    type: 'text',
                    question: 'ご意見やご要望がございましたらお聞かせください。',
                    required: false,
                },
                {
                    id: 'approve',
                    type: 'boolean',
                    question: 'この結果を承認しますか？',
                    required: true,
                },
            ],
            timeout: 3600, // 1時間
        };
    }
    /**
     * リビジョンの実行
     */
    static async executeRevision(session, stepIndex, feedback) {
        const changes = [];
        let newResult = { ...session.steps[stepIndex].result };
        // フィードバックに基づく修正の適用
        feedback.modifications.forEach((mod) => {
            try {
                // 簡単な実装：フィールド値の直接変更
                if (mod.field in newResult) {
                    newResult[mod.field] = mod.newValue;
                    changes.push({
                        type: 'modification',
                        description: `Modified ${mod.field}: ${mod.reason}`,
                        impact: 'medium',
                    });
                }
            }
            catch (error) {
                // 修正に失敗した場合はスキップ
            }
        });
        const confidenceScore = Math.max(0.5, 1.0 - feedback.modifications.length * 0.1);
        return {
            improved: changes.length > 0,
            changes,
            newResult,
            confidenceScore,
        };
    }
    /**
     * 履歴に記録
     */
    static addHistory(session, stepId, action, data) {
        session.history.push({
            stepId,
            action,
            timestamp: Date.now(),
            data,
        });
    }
    /**
     * セッションの一時停止
     */
    static pauseSession(session) {
        session.status = 'paused';
        session.updatedAt = Date.now();
        return session;
    }
    /**
     * セッションの再開
     */
    static resumeSession(session) {
        if (session.status === 'paused') {
            session.status = session.overallProgress > 0 ? 'in_progress' : 'not_started';
            session.updatedAt = Date.now();
        }
        return session;
    }
    /**
     * セッションのキャンセル
     */
    static cancelSession(session) {
        session.status = 'cancelled';
        session.updatedAt = Date.now();
        return session;
    }
    /**
     * セッション状況の取得
     */
    static getSessionStatus(session) {
        var _a;
        const currentStep = session.steps[session.currentStepIndex] || null;
        const nextStep = session.steps[session.currentStepIndex + 1] || null;
        const completedSteps = session.steps.filter((step) => step.status === 'completed').length;
        const remainingSteps = session.steps.slice(session.currentStepIndex);
        const estimatedTimeRemaining = remainingSteps.reduce((total, step) => total + step.estimatedTime, 0);
        const canProceed = !currentStep ||
            (currentStep.status === 'completed' &&
                (!session.settings.requireApproval || ((_a = currentStep.userFeedback) === null || _a === void 0 ? void 0 : _a.approved) !== undefined));
        return {
            currentStep,
            nextStep,
            completedSteps,
            totalSteps: session.steps.length,
            estimatedTimeRemaining,
            canProceed,
        };
    }
    /**
     * セッションサマリーの生成
     */
    static generateSessionSummary(session) {
        const completedSteps = session.steps.filter((step) => step.status === 'completed');
        const failedSteps = session.steps.filter((step) => step.status === 'failed');
        const achievements = completedSteps.map((step) => `✅ ${step.name}が完了`);
        const issues = failedSteps.map((step) => `❌ ${step.name}が失敗`);
        const recommendations = [];
        const nextSteps = [];
        if (session.status === 'completed') {
            recommendations.push('全ステップが完了しました。実装フェーズに進むことができます。');
            nextSteps.push('実装計画に従ってLark Baseの構築を開始');
        }
        else if (session.status === 'in_progress') {
            const currentStep = session.steps[session.currentStepIndex];
            if (currentStep) {
                nextSteps.push(`${currentStep.name}を続行`);
            }
        }
        return {
            overview: `Progress: ${session.overallProgress}% (${completedSteps.length}/${session.steps.length} steps completed)`,
            achievements,
            issues,
            recommendations,
            nextSteps,
        };
    }
}
exports.ProgressiveGenerator = ProgressiveGenerator;
ProgressiveGenerator.DEFAULT_STEPS = [
    {
        name: '要求分析',
        description: '要求仕様の詳細分析と構造化',
        order: 1,
        dependencies: [],
        estimatedTime: 10,
        inputs: [
            {
                name: 'requirements',
                type: 'text',
                required: true,
                description: '要求仕様書またはプロジェクト概要',
                validation: { minLength: 100 },
            },
            {
                name: 'priority',
                type: 'selection',
                required: true,
                description: 'プロジェクト優先度',
                options: ['高', '中', '低'],
                defaultValue: '中',
            },
        ],
        outputs: [
            {
                name: 'analyzed_requirements',
                type: 'json',
                description: '構造化された要求仕様',
                previewable: true,
                editable: true,
            },
            {
                name: 'stakeholder_matrix',
                type: 'report',
                description: 'ステークホルダー分析レポート',
                previewable: true,
                editable: false,
            },
        ],
        validationRules: [
            {
                id: 'req_completeness',
                description: '要求仕様の完全性チェック',
                type: 'semantic',
                severity: 'warning',
                validator: (data) => ({
                    valid: true,
                    issues: [],
                }),
            },
        ],
    },
    {
        name: 'データモデル設計',
        description: 'エンティティとリレーションシップの設計',
        order: 2,
        dependencies: ['要求分析'],
        estimatedTime: 15,
        inputs: [
            {
                name: 'modeling_approach',
                type: 'selection',
                required: true,
                description: 'モデリング手法',
                options: ['標準的', '詳細', '簡略'],
                defaultValue: '標準的',
            },
        ],
        outputs: [
            {
                name: 'entity_model',
                type: 'json',
                description: 'エンティティモデル定義',
                previewable: true,
                editable: true,
            },
            {
                name: 'er_diagram',
                type: 'diagram',
                description: 'ER図',
                previewable: true,
                editable: false,
            },
        ],
    },
    {
        name: 'Base構造設計',
        description: 'Lark Baseのテーブル・フィールド構造設計',
        order: 3,
        dependencies: ['データモデル設計'],
        estimatedTime: 12,
        inputs: [
            {
                name: 'field_complexity',
                type: 'selection',
                required: true,
                description: 'フィールドの複雑さ',
                options: ['シンプル', '標準', '高度'],
                defaultValue: '標準',
            },
        ],
        outputs: [
            {
                name: 'base_structure',
                type: 'json',
                description: 'Base構造定義',
                previewable: true,
                editable: true,
            },
        ],
    },
    {
        name: 'ビジネスロジック設計',
        description: '数式とビジネスルールの設計',
        order: 4,
        dependencies: ['Base構造設計'],
        estimatedTime: 20,
        inputs: [
            {
                name: 'automation_level',
                type: 'selection',
                required: true,
                description: '自動化レベル',
                options: ['最小限', '標準', '最大'],
                defaultValue: '標準',
            },
        ],
        outputs: [
            {
                name: 'business_logic',
                type: 'json',
                description: 'ビジネスロジック定義',
                previewable: true,
                editable: true,
            },
            {
                name: 'formula_list',
                type: 'report',
                description: '数式一覧',
                previewable: true,
                editable: false,
            },
        ],
    },
    {
        name: 'ワークフロー設計',
        description: '自動化ワークフローの設計',
        order: 5,
        dependencies: ['ビジネスロジック設計'],
        estimatedTime: 18,
        inputs: [
            {
                name: 'workflow_complexity',
                type: 'selection',
                required: true,
                description: 'ワークフローの複雑さ',
                options: ['基本', '標準', '高度'],
                defaultValue: '標準',
            },
        ],
        outputs: [
            {
                name: 'workflows',
                type: 'json',
                description: 'ワークフロー定義',
                previewable: true,
                editable: true,
            },
        ],
    },
    {
        name: 'UI設計',
        description: 'ユーザーインターフェースの設計',
        order: 6,
        dependencies: ['ワークフロー設計'],
        estimatedTime: 15,
        inputs: [
            {
                name: 'ui_complexity',
                type: 'selection',
                required: true,
                description: 'UI複雑さ',
                options: ['シンプル', '標準', 'カスタム'],
                defaultValue: '標準',
            },
        ],
        outputs: [
            {
                name: 'ui_design',
                type: 'json',
                description: 'UI設計仕様',
                previewable: true,
                editable: true,
            },
        ],
    },
    {
        name: '実装計画',
        description: '実装手順と成果物の計画',
        order: 7,
        dependencies: ['UI設計'],
        estimatedTime: 10,
        inputs: [],
        outputs: [
            {
                name: 'implementation_plan',
                type: 'report',
                description: '実装計画書',
                previewable: true,
                editable: true,
            },
            {
                name: 'deployment_guide',
                type: 'report',
                description: 'デプロイメントガイド',
                previewable: true,
                editable: false,
            },
        ],
    },
];
