"use strict";
/**
 * Design Validation Engine
 * 生成された設計図の整合性チェック機能
 */
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DesignValidationEngine = void 0;
/**
 * Design Validation Engine
 * 設計アーティファクトの包括的検証システム
 */
class DesignValidationEngine {
    /**
     * 設計アーティファクトの包括的検証
     */
    static validateDesign(design, options = {}) {
        const startTime = Date.now();
        const results = [];
        const autoFixSuggestions = [];
        // 適用ルールの決定
        const applicableRules = this.getApplicableRules(design.type, options);
        // 各ルールの実行
        for (const rule of applicableRules) {
            try {
                const result = rule.validator(design);
                result.ruleId = rule.id;
                results.push(result);
                // 自動修正可能性のチェック
                if (!result.passed && rule.autoFix) {
                    autoFixSuggestions.push({
                        ruleId: rule.id,
                        description: `Auto-fix available for: ${rule.name}`,
                        impact: this.assessAutoFixImpact(rule, result),
                    });
                }
            }
            catch (error) {
                results.push({
                    ruleId: rule.id,
                    passed: false,
                    severity: 'error',
                    message: `Validation rule execution failed: ${error}`,
                    affectedElements: [],
                    suggestions: [],
                    autoFixAvailable: false,
                });
            }
        }
        // 統計の計算
        const summary = this.calculateSummary(results);
        const overallScore = this.calculateOverallScore(results);
        const status = this.determineOverallStatus(results);
        const recommendations = this.generateRecommendations(results);
        return {
            designId: design.id,
            designType: design.type,
            timestamp: Date.now(),
            overallScore,
            status,
            summary,
            results,
            recommendations,
            autoFixSuggestions,
        };
    }
    /**
     * バッチ検証
     */
    static validateMultipleDesigns(designs) {
        return designs.map((design) => this.validateDesign(design));
    }
    /**
     * 設計依存関係の検証
     */
    static validateDesignDependencies(designs) {
        const issues = [];
        const designMap = new Map(designs.map((d) => [d.id, d]));
        // 依存関係の検証
        for (const design of designs) {
            for (const depId of design.metadata.dependencies) {
                const dependency = designMap.get(depId);
                if (!dependency) {
                    issues.push({
                        type: 'missing_dependency',
                        design: design.id,
                        dependency: depId,
                        description: `Missing dependency: ${depId}`,
                    });
                }
            }
        }
        // 循環依存の検出
        const visited = new Set();
        const recursionStack = new Set();
        const detectCycle = (designId) => {
            if (recursionStack.has(designId)) {
                return true; // 循環依存発見
            }
            if (visited.has(designId)) {
                return false;
            }
            visited.add(designId);
            recursionStack.add(designId);
            const design = designMap.get(designId);
            if (design) {
                for (const depId of design.metadata.dependencies) {
                    if (detectCycle(depId)) {
                        issues.push({
                            type: 'circular_dependency',
                            design: designId,
                            dependency: depId,
                            description: `Circular dependency detected between ${designId} and ${depId}`,
                        });
                    }
                }
            }
            recursionStack.delete(designId);
            return false;
        };
        designs.forEach((design) => {
            if (!visited.has(design.id)) {
                detectCycle(design.id);
            }
        });
        return {
            valid: issues.length === 0,
            issues,
        };
    }
    /**
     * 具体的な検証ルール実装
     */
    static validateRequirementsCompleteness(design) {
        if (design.type !== 'requirements') {
            return this.createSkipResult('REQ_001', 'Not a requirements artifact');
        }
        const content = design.content;
        const requiredFields = ['title', 'description', 'functionalRequirements', 'stakeholders'];
        const missingFields = requiredFields.filter((field) => !content[field] || (Array.isArray(content[field]) && content[field].length === 0));
        return {
            ruleId: 'REQ_001',
            passed: missingFields.length === 0,
            severity: 'error',
            message: missingFields.length === 0
                ? 'Requirements are complete'
                : `Missing required fields: ${missingFields.join(', ')}`,
            affectedElements: missingFields,
            suggestions: missingFields.map((field) => `Add ${field} to complete requirements specification`),
            autoFixAvailable: false,
        };
    }
    static validateEntityNaming(design) {
        if (design.type !== 'entities') {
            return this.createSkipResult('ENT_001', 'Not an entities artifact');
        }
        const entities = design.content.entities || [];
        const invalidNames = [];
        const namingPattern = /^[A-Z][a-zA-Z0-9]*$/; // PascalCase
        entities.forEach((entity) => {
            if (!namingPattern.test(entity.name)) {
                invalidNames.push(entity.name);
            }
        });
        return {
            ruleId: 'ENT_001',
            passed: invalidNames.length === 0,
            severity: 'warning',
            message: invalidNames.length === 0
                ? 'Entity naming follows conventions'
                : `Entities with invalid names: ${invalidNames.join(', ')}`,
            affectedElements: invalidNames,
            suggestions: invalidNames.map((name) => `Rename '${name}' to follow PascalCase convention`),
            autoFixAvailable: true,
        };
    }
    static validatePrimaryKeys(design) {
        if (design.type !== 'entities') {
            return this.createSkipResult('ENT_002', 'Not an entities artifact');
        }
        const entities = design.content.entities || [];
        const entitiesWithoutPK = [];
        entities.forEach((entity) => {
            if (!entity.primaryKey || !entity.attributes.find((attr) => attr.name === entity.primaryKey)) {
                entitiesWithoutPK.push(entity.name);
            }
        });
        return {
            ruleId: 'ENT_002',
            passed: entitiesWithoutPK.length === 0,
            severity: 'error',
            message: entitiesWithoutPK.length === 0
                ? 'All entities have valid primary keys'
                : `Entities without primary keys: ${entitiesWithoutPK.join(', ')}`,
            affectedElements: entitiesWithoutPK,
            suggestions: entitiesWithoutPK.map((name) => `Add primary key to entity '${name}'`),
            autoFixAvailable: true,
        };
    }
    static validateRelationshipIntegrity(design) {
        if (design.type !== 'entities') {
            return this.createSkipResult('REL_001', 'Not an entities artifact');
        }
        const entities = design.content.entities || [];
        const relationships = design.content.relationships || [];
        const entityNames = new Set(entities.map((e) => e.name));
        const invalidRelationships = [];
        relationships.forEach((rel) => {
            if (!entityNames.has(rel.fromEntity) || !entityNames.has(rel.toEntity)) {
                invalidRelationships.push(`${rel.fromEntity} -> ${rel.toEntity}`);
            }
        });
        return {
            ruleId: 'REL_001',
            passed: invalidRelationships.length === 0,
            severity: 'error',
            message: invalidRelationships.length === 0
                ? 'All relationships are valid'
                : `Invalid relationships: ${invalidRelationships.join(', ')}`,
            affectedElements: invalidRelationships,
            suggestions: invalidRelationships.map((rel) => `Fix relationship: ${rel}`),
            autoFixAvailable: false,
        };
    }
    static validateFieldTypeConsistency(design) {
        if (design.type !== 'base_structure') {
            return this.createSkipResult('FIELD_001', 'Not a base structure artifact');
        }
        const tables = design.content.tables || [];
        const inconsistencies = [];
        // 同名フィールドの型一貫性チェック
        const fieldTypes = new Map();
        tables.forEach((table) => {
            var _b;
            (_b = table.fields) === null || _b === void 0 ? void 0 : _b.forEach((field) => {
                if (!fieldTypes.has(field.name)) {
                    fieldTypes.set(field.name, new Set());
                }
                fieldTypes.get(field.name).add(field.type);
            });
        });
        fieldTypes.forEach((types, fieldName) => {
            if (types.size > 1) {
                inconsistencies.push(`${fieldName}: ${Array.from(types).join(', ')}`);
            }
        });
        return {
            ruleId: 'FIELD_001',
            passed: inconsistencies.length === 0,
            severity: 'warning',
            message: inconsistencies.length === 0
                ? 'Field types are consistent'
                : `Inconsistent field types: ${inconsistencies.join('; ')}`,
            affectedElements: inconsistencies,
            suggestions: inconsistencies.map((inc) => `Standardize field type for: ${inc}`),
            autoFixAvailable: false,
        };
    }
    static validateTableSizeOptimization(design) {
        if (design.type !== 'base_structure') {
            return this.createSkipResult('PERF_001', 'Not a base structure artifact');
        }
        const tables = design.content.tables || [];
        const oversizedTables = [];
        const MAX_FIELDS = 50;
        tables.forEach((table) => {
            if (table.fields && table.fields.length > MAX_FIELDS) {
                oversizedTables.push(`${table.name} (${table.fields.length} fields)`);
            }
        });
        return {
            ruleId: 'PERF_001',
            passed: oversizedTables.length === 0,
            severity: 'suggestion',
            message: oversizedTables.length === 0
                ? 'Table sizes are optimized'
                : `Consider splitting large tables: ${oversizedTables.join(', ')}`,
            affectedElements: oversizedTables,
            suggestions: oversizedTables.map((table) => `Consider normalizing: ${table}`),
            autoFixAvailable: false,
        };
    }
    static validateSensitiveDataProtection(design) {
        if (design.type !== 'base_structure') {
            return this.createSkipResult('SEC_001', 'Not a base structure artifact');
        }
        const tables = design.content.tables || [];
        const sensitiveFields = [];
        const sensitivePatterns = /password|secret|token|key|ssn|credit|card|bank/i;
        tables.forEach((table) => {
            var _b;
            (_b = table.fields) === null || _b === void 0 ? void 0 : _b.forEach((field) => {
                if (sensitivePatterns.test(field.name) || sensitivePatterns.test(field.description || '')) {
                    sensitiveFields.push(`${table.name}.${field.name}`);
                }
            });
        });
        return {
            ruleId: 'SEC_001',
            passed: sensitiveFields.length === 0,
            severity: 'warning',
            message: sensitiveFields.length === 0
                ? 'No sensitive data detected'
                : `Potential sensitive fields detected: ${sensitiveFields.join(', ')}`,
            affectedElements: sensitiveFields,
            suggestions: sensitiveFields.map((field) => `Consider encryption/masking for: ${field}`),
            autoFixAvailable: false,
        };
    }
    static validateWorkflowLogic(design) {
        if (design.type !== 'workflows') {
            return this.createSkipResult('FLOW_001', 'Not a workflows artifact');
        }
        const workflows = design.content.workflows || [];
        const logicIssues = [];
        workflows.forEach((workflow) => {
            // 基本的なワークフロー検証
            if (!workflow.trigger) {
                logicIssues.push(`${workflow.name}: Missing trigger`);
            }
            if (!workflow.steps || workflow.steps.length === 0) {
                logicIssues.push(`${workflow.name}: No steps defined`);
            }
        });
        return {
            ruleId: 'FLOW_001',
            passed: logicIssues.length === 0,
            severity: 'error',
            message: logicIssues.length === 0 ? 'Workflow logic is valid' : `Workflow issues: ${logicIssues.join('; ')}`,
            affectedElements: logicIssues,
            suggestions: logicIssues.map((issue) => `Fix: ${issue}`),
            autoFixAvailable: false,
        };
    }
    static validateUIAccessibility(design) {
        if (design.type !== 'ui_design') {
            return this.createSkipResult('UI_001', 'Not a UI design artifact');
        }
        // UI アクセシビリティの基本チェック
        const forms = design.content.forms || [];
        const accessibilityIssues = [];
        forms.forEach((form) => {
            var _b;
            (_b = form.fields) === null || _b === void 0 ? void 0 : _b.forEach((field) => {
                if (!field.label) {
                    accessibilityIssues.push(`${form.name}.${field.name}: Missing label`);
                }
            });
        });
        return {
            ruleId: 'UI_001',
            passed: accessibilityIssues.length === 0,
            severity: 'warning',
            message: accessibilityIssues.length === 0
                ? 'UI accessibility requirements met'
                : `Accessibility issues: ${accessibilityIssues.join('; ')}`,
            affectedElements: accessibilityIssues,
            suggestions: accessibilityIssues.map((issue) => `Fix accessibility: ${issue}`),
            autoFixAvailable: false,
        };
    }
    static validateImplementationFeasibility(design) {
        var _b;
        if (design.type !== 'implementation_plan') {
            return this.createSkipResult('IMPL_001', 'Not an implementation plan artifact');
        }
        const plan = design.content.implementationPlan || {};
        const feasibilityIssues = [];
        // 基本的な実装可能性チェック
        if (!plan.phases || plan.phases.length === 0) {
            feasibilityIssues.push('No implementation phases defined');
        }
        const totalEffort = ((_b = plan.phases) === null || _b === void 0 ? void 0 : _b.reduce((total, phase) => {
            var _b;
            return (total +
                (((_b = phase.tasks) === null || _b === void 0 ? void 0 : _b.reduce((phaseTotal, task) => {
                    return phaseTotal + (parseInt(task.effort) || 0);
                }, 0)) || 0));
        }, 0)) || 0;
        if (totalEffort > 1000) {
            // 仮の閾値
            feasibilityIssues.push(`High implementation effort: ${totalEffort} hours`);
        }
        return {
            ruleId: 'IMPL_001',
            passed: feasibilityIssues.length === 0,
            severity: 'error',
            message: feasibilityIssues.length === 0
                ? 'Implementation plan is feasible'
                : `Feasibility issues: ${feasibilityIssues.join('; ')}`,
            affectedElements: feasibilityIssues,
            suggestions: feasibilityIssues.map((issue) => `Address: ${issue}`),
            autoFixAvailable: false,
        };
    }
    /**
     * 自動修正の実装例
     */
    static fixEntityNaming(design) {
        if (design.type !== 'entities') {
            return { success: false, changes: [], updatedDesign: design, warnings: ['Not an entities artifact'] };
        }
        const changes = [];
        const updatedDesign = JSON.parse(JSON.stringify(design));
        const entities = updatedDesign.content.entities || [];
        entities.forEach((entity, index) => {
            const originalName = entity.name;
            const fixedName = this.toPascalCase(originalName);
            if (originalName !== fixedName) {
                entity.name = fixedName;
                changes.push({
                    type: 'modify',
                    target: `entities[${index}].name`,
                    oldValue: originalName,
                    newValue: fixedName,
                    description: `Fixed entity name from '${originalName}' to '${fixedName}'`,
                });
            }
        });
        return {
            success: true,
            changes,
            updatedDesign,
            warnings: [],
        };
    }
    static fixPrimaryKeys(design) {
        if (design.type !== 'entities') {
            return { success: false, changes: [], updatedDesign: design, warnings: ['Not an entities artifact'] };
        }
        const changes = [];
        const updatedDesign = JSON.parse(JSON.stringify(design));
        const entities = updatedDesign.content.entities || [];
        entities.forEach((entity, index) => {
            if (!entity.primaryKey || !entity.attributes.find((attr) => attr.name === entity.primaryKey)) {
                // 'id' フィールドを追加
                const idField = {
                    name: 'id',
                    type: 'string',
                    required: true,
                    description: 'Primary key field',
                };
                entity.attributes.unshift(idField);
                entity.primaryKey = 'id';
                changes.push({
                    type: 'add',
                    target: `entities[${index}].attributes`,
                    newValue: idField,
                    description: `Added primary key field to entity '${entity.name}'`,
                });
            }
        });
        return {
            success: true,
            changes,
            updatedDesign,
            warnings: [],
        };
    }
    /**
     * ユーティリティメソッド
     */
    static registerRule(rule) {
        this.VALIDATION_RULES.set(rule.id, rule);
    }
    static getApplicableRules(designType, options) {
        return Array.from(this.VALIDATION_RULES.values()).filter((rule) => {
            var _b;
            if ((_b = options.excludeRules) === null || _b === void 0 ? void 0 : _b.includes(rule.id))
                return false;
            if (options.includeCategories && !options.includeCategories.includes(rule.category))
                return false;
            return true;
        });
    }
    static createSkipResult(ruleId, reason) {
        return {
            ruleId,
            passed: true,
            severity: 'info',
            message: `Skipped: ${reason}`,
            affectedElements: [],
            suggestions: [],
            autoFixAvailable: false,
        };
    }
    static calculateSummary(results) {
        return {
            total: results.length,
            passed: results.filter((r) => r.passed).length,
            warnings: results.filter((r) => !r.passed && r.severity === 'warning').length,
            errors: results.filter((r) => !r.passed && r.severity === 'error').length,
            suggestions: results.filter((r) => !r.passed && r.severity === 'suggestion').length,
        };
    }
    static calculateOverallScore(results) {
        if (results.length === 0)
            return 100;
        const weights = { error: 10, warning: 5, suggestion: 1, info: 0 };
        const totalPenalty = results.reduce((penalty, result) => {
            return penalty + (result.passed ? 0 : weights[result.severity]);
        }, 0);
        const maxPenalty = results.length * weights.error;
        return Math.max(0, Math.round(100 - (totalPenalty / maxPenalty) * 100));
    }
    static determineOverallStatus(results) {
        if (results.some((r) => !r.passed && r.severity === 'error'))
            return 'failed';
        if (results.some((r) => !r.passed && r.severity === 'warning'))
            return 'warning';
        return 'passed';
    }
    static generateRecommendations(results) {
        const recommendations = [];
        const errorCount = results.filter((r) => !r.passed && r.severity === 'error').length;
        const warningCount = results.filter((r) => !r.passed && r.severity === 'warning').length;
        if (errorCount > 0) {
            recommendations.push(`Address ${errorCount} critical error${errorCount > 1 ? 's' : ''} before proceeding`);
        }
        if (warningCount > 5) {
            recommendations.push('Consider reviewing design patterns to reduce warnings');
        }
        const autoFixCount = results.filter((r) => !r.passed && r.autoFixAvailable).length;
        if (autoFixCount > 0) {
            recommendations.push(`${autoFixCount} issue${autoFixCount > 1 ? 's' : ''} can be automatically fixed`);
        }
        return recommendations;
    }
    static assessAutoFixImpact(rule, result) {
        if (rule.severity === 'error')
            return 'high';
        if (rule.severity === 'warning')
            return 'medium';
        return 'low';
    }
    static toPascalCase(str) {
        return str.replace(/(?:^|[\s_-]+)(\w)/g, (_, char) => char.toUpperCase());
    }
    /**
     * カスタムルールの追加
     */
    static addCustomRule(rule) {
        this.VALIDATION_RULES.set(rule.id, rule);
    }
    /**
     * 利用可能なルール一覧の取得
     */
    static getAvailableRules() {
        return Array.from(this.VALIDATION_RULES.values());
    }
    /**
     * ルールの有効化/無効化
     */
    static toggleRule(ruleId, enabled) {
        const rule = this.VALIDATION_RULES.get(ruleId);
        if (rule) {
            if (enabled) {
                this.VALIDATION_RULES.set(ruleId, rule);
            }
            else {
                this.VALIDATION_RULES.delete(ruleId);
            }
            return true;
        }
        return false;
    }
}
exports.DesignValidationEngine = DesignValidationEngine;
_a = DesignValidationEngine;
DesignValidationEngine.VALIDATION_RULES = new Map();
(() => {
    // 基本構造検証ルール
    _a.registerRule({
        id: 'REQ_001',
        name: 'Requirements Completeness',
        category: 'structural',
        severity: 'error',
        description: '要求仕様の完全性チェック',
        validator: (design) => _a.validateRequirementsCompleteness(design),
    });
    _a.registerRule({
        id: 'ENT_001',
        name: 'Entity Naming Convention',
        category: 'best_practice',
        severity: 'warning',
        description: 'エンティティ命名規則の検証',
        validator: (design) => _a.validateEntityNaming(design),
        autoFix: (design) => _a.fixEntityNaming(design),
    });
    _a.registerRule({
        id: 'ENT_002',
        name: 'Primary Key Validation',
        category: 'structural',
        severity: 'error',
        description: '主キーの存在と妥当性検証',
        validator: (design) => _a.validatePrimaryKeys(design),
        autoFix: (design) => _a.fixPrimaryKeys(design),
    });
    _a.registerRule({
        id: 'REL_001',
        name: 'Relationship Integrity',
        category: 'logical',
        severity: 'error',
        description: 'エンティティ間関係の整合性検証',
        validator: (design) => _a.validateRelationshipIntegrity(design),
    });
    _a.registerRule({
        id: 'FIELD_001',
        name: 'Field Type Consistency',
        category: 'logical',
        severity: 'warning',
        description: 'フィールドタイプの一貫性検証',
        validator: (design) => _a.validateFieldTypeConsistency(design),
    });
    _a.registerRule({
        id: 'PERF_001',
        name: 'Table Size Optimization',
        category: 'performance',
        severity: 'suggestion',
        description: 'テーブルサイズとパフォーマンス最適化',
        validator: (design) => _a.validateTableSizeOptimization(design),
    });
    _a.registerRule({
        id: 'SEC_001',
        name: 'Sensitive Data Protection',
        category: 'security',
        severity: 'warning',
        description: '機密データの保護検証',
        validator: (design) => _a.validateSensitiveDataProtection(design),
    });
    _a.registerRule({
        id: 'FLOW_001',
        name: 'Workflow Logic Validation',
        category: 'logical',
        severity: 'error',
        description: 'ワークフローロジックの検証',
        validator: (design) => _a.validateWorkflowLogic(design),
    });
    _a.registerRule({
        id: 'UI_001',
        name: 'User Interface Accessibility',
        category: 'compliance',
        severity: 'warning',
        description: 'UIアクセシビリティ検証',
        validator: (design) => _a.validateUIAccessibility(design),
    });
    _a.registerRule({
        id: 'IMPL_001',
        name: 'Implementation Feasibility',
        category: 'logical',
        severity: 'error',
        description: '実装可能性の検証',
        validator: (design) => _a.validateImplementationFeasibility(design),
    });
})();
