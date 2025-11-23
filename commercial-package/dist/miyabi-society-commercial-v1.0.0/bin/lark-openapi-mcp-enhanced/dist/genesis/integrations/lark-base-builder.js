"use strict";
/**
 * Lark Base API Integration Layer
 * 自動Base/Table/Field作成機能
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LarkBaseBuilder = void 0;
/**
 * Lark Base Builder
 * 設計仕様からLark Baseを自動構築
 */
class LarkBaseBuilder {
    constructor(larkClient, options = {}) {
        this.larkClient = larkClient;
        this.retryAttempts = options.retryAttempts || 3;
        this.retryDelay = options.retryDelay || 1000;
    }
    /**
     * Base仕様からLark Baseを構築
     */
    async buildBase(spec) {
        const startTime = Date.now();
        const result = {
            success: false,
            tableIds: {},
            fieldIds: {},
            viewIds: {},
            errors: [],
            warnings: [],
            metadata: {
                buildTime: 0,
                tablesCreated: 0,
                fieldsCreated: 0,
                viewsCreated: 0,
                automationsCreated: 0,
            },
        };
        try {
            // 1. Base作成
            const baseResult = await this.createBase(spec);
            if (!baseResult.success) {
                result.errors.push(...baseResult.errors);
                return result;
            }
            result.baseId = baseResult.baseId;
            // 2. テーブル作成
            for (const tableSpec of spec.tables) {
                const tableResult = await this.createTable(result.baseId, tableSpec);
                if (tableResult.success) {
                    result.tableIds[tableSpec.name] = tableResult.tableId;
                    result.fieldIds[tableSpec.name] = tableResult.fieldIds;
                    result.viewIds[tableSpec.name] = tableResult.viewIds;
                    result.metadata.tablesCreated++;
                    result.metadata.fieldsCreated += Object.keys(tableResult.fieldIds).length;
                    result.metadata.viewsCreated += Object.keys(tableResult.viewIds).length;
                }
                else {
                    result.errors.push(...tableResult.errors);
                    result.warnings.push(`Table ${tableSpec.name} creation failed`);
                }
            }
            // 3. 自動化設定
            if (spec.automations) {
                for (const automation of spec.automations) {
                    const automationResult = await this.createAutomation(result.baseId, automation, result.tableIds);
                    if (automationResult.success) {
                        result.metadata.automationsCreated++;
                    }
                    else {
                        result.warnings.push(...automationResult.errors);
                    }
                }
            }
            result.success = result.metadata.tablesCreated > 0;
            result.metadata.buildTime = Date.now() - startTime;
            return result;
        }
        catch (error) {
            result.errors.push(`Build failed: ${error}`);
            result.metadata.buildTime = Date.now() - startTime;
            return result;
        }
    }
    /**
     * Base作成
     */
    async createBase(spec) {
        try {
            // For now, return a mock result since we need to implement the actual API calls
            // This will be implemented when we have the proper Lark Base API integration
            return {
                success: true,
                baseId: 'mock-base-id-' + Date.now(),
                errors: [],
            };
        }
        catch (error) {
            return {
                success: false,
                errors: [`Base creation failed: ${error}`],
            };
        }
    }
    /**
     * テーブル作成
     */
    async createTable(baseId, spec) {
        try {
            // Mock implementation for now
            const tableId = `mock-table-${spec.name}-${Date.now()}`;
            const fieldIds = {};
            const viewIds = {};
            // Mock field creation
            for (const field of spec.fields) {
                fieldIds[field.name] = `mock-field-${field.name}-${Date.now()}`;
            }
            // Mock view creation
            if (spec.views) {
                for (const view of spec.views) {
                    viewIds[view.name] = `mock-view-${view.name}-${Date.now()}`;
                }
            }
            return {
                success: true,
                tableId,
                fieldIds,
                viewIds,
                errors: [],
            };
        }
        catch (error) {
            return {
                success: false,
                errors: [`Table creation failed: ${error}`],
            };
        }
    }
    /**
     * フィールド作成
     */
    async createField(baseId, tableId, spec) {
        try {
            // Mock implementation
            return {
                success: true,
                fieldId: `mock-field-${spec.name}-${Date.now()}`,
                errors: [],
            };
        }
        catch (error) {
            return {
                success: false,
                errors: [`Field creation failed: ${error}`],
            };
        }
    }
    /**
     * ビュー作成
     */
    async createView(baseId, tableId, spec, fieldIds) {
        try {
            // Mock implementation
            return {
                success: true,
                viewId: `mock-view-${spec.name}-${Date.now()}`,
                errors: [],
            };
        }
        catch (error) {
            return {
                success: false,
                errors: [`View creation failed: ${error}`],
            };
        }
    }
    /**
     * 自動化作成
     */
    async createAutomation(baseId, spec, tableIds) {
        try {
            // Mock implementation
            return {
                success: true,
                automationId: `mock-automation-${spec.name}-${Date.now()}`,
                errors: [],
            };
        }
        catch (error) {
            return {
                success: false,
                errors: [`Automation creation failed: ${error}`],
            };
        }
    }
    /**
     * フィールド仕様をLark API形式に変換
     */
    convertFieldSpecs(specs) {
        return specs.map((spec) => this.buildFieldProperty(spec));
    }
    /**
     * フィールドタイプをLark API形式にマッピング
     */
    mapFieldType(type) {
        const typeMap = {
            text: 1,
            number: 2,
            date: 3,
            checkbox: 4,
            singleSelect: 5,
            multiSelect: 6,
            attachment: 7,
            user: 8,
            formula: 9,
            phone: 10,
            email: 11,
            url: 12,
            rating: 13,
            currency: 14,
            percent: 15,
            duration: 16,
            created_time: 17,
            modified_time: 18,
            created_by: 19,
            modified_by: 20,
        };
        return typeMap[type] || 1;
    }
    /**
     * フィールドプロパティを構築
     */
    buildFieldProperty(spec) {
        var _a;
        const baseProperty = {
            field_name: spec.name,
            type: this.mapFieldType(spec.type),
            description: spec.description || '',
            required: spec.required || false,
        };
        if (spec.options) {
            if (spec.type === 'singleSelect' || spec.type === 'multiSelect') {
                return {
                    ...baseProperty,
                    property: {
                        options: ((_a = spec.options.choices) === null || _a === void 0 ? void 0 : _a.map((choice) => ({ name: choice }))) || [],
                    },
                };
            }
            else if (spec.type === 'formula') {
                return {
                    ...baseProperty,
                    property: {
                        formula: spec.options.formula || '',
                    },
                };
            }
        }
        return baseProperty;
    }
    /**
     * ビュープロパティを構築
     */
    buildViewProperty(spec, fieldIds) {
        var _a;
        const baseProperty = {
            view_name: spec.name,
            view_type: spec.type,
            description: spec.description || '',
        };
        if (spec.config) {
            return {
                ...baseProperty,
                property: {
                    ...spec.config,
                    field_order: ((_a = spec.config.fieldOrder) === null || _a === void 0 ? void 0 : _a.map((fieldName) => fieldIds[fieldName]).filter(Boolean)) || [],
                },
            };
        }
        return baseProperty;
    }
    /**
     * リトライ機能付き実行
     */
    async executeWithRetry(fn) {
        let lastError;
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                return await fn();
            }
            catch (error) {
                lastError = error;
                if (attempt < this.retryAttempts) {
                    await new Promise((resolve) => setTimeout(resolve, this.retryDelay * attempt));
                }
            }
        }
        throw lastError;
    }
    /**
     * Base削除
     */
    async deleteBase(baseId) {
        try {
            // Mock implementation
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Base情報取得
     */
    async getBaseInfo(baseId) {
        try {
            // Mock implementation
            return {
                app_id: baseId,
                name: 'Mock Base',
                description: 'Mock base description',
            };
        }
        catch (error) {
            throw error;
        }
    }
    /**
     * ビルド進捗を取得
     */
    getBuildProgress(result) {
        const totalSteps = result.metadata.tablesCreated + result.metadata.fieldsCreated + result.metadata.viewsCreated;
        const completedSteps = totalSteps;
        return {
            percentage: totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0,
            currentStep: result.success ? 'Completed' : 'Building',
            estimatedTimeRemaining: 0,
        };
    }
}
exports.LarkBaseBuilder = LarkBaseBuilder;
