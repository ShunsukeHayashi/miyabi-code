"use strict";
/**
 * ER Diagram Generator
 * Mermaid記法によるER図自動生成機能
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERDiagramGenerator = void 0;
/**
 * ER Diagram Generator
 * エンティティとリレーションシップからMermaidのER図を生成
 */
class ERDiagramGenerator {
    /**
     * エンティティとリレーションシップからER図を生成
     */
    static generateDiagram(entities, relationships, config = {}) {
        const startTime = Date.now();
        const errors = [];
        const warnings = [];
        try {
            // 1. 入力検証
            const validationResult = this.validateInput(entities, relationships);
            if (validationResult.errors.length > 0) {
                return {
                    success: false,
                    mermaidCode: '',
                    entities,
                    relationships,
                    errors: validationResult.errors,
                    warnings: validationResult.warnings,
                    metadata: {
                        entityCount: entities.length,
                        relationshipCount: relationships.length,
                        attributeCount: 0,
                        generateTime: Date.now() - startTime,
                    },
                };
            }
            warnings.push(...validationResult.warnings);
            // 2. エンティティの正規化
            const normalizedEntities = this.normalizeEntities(entities);
            // 3. リレーションシップの正規化
            const normalizedRelationships = this.normalizeRelationships(relationships, normalizedEntities);
            // 4. Mermaidコードの生成
            const mermaidCode = this.generateMermaidCode(normalizedEntities, normalizedRelationships, config);
            // 5. 統計情報の計算
            const attributeCount = normalizedEntities.reduce((count, entity) => count + entity.attributes.length, 0);
            return {
                success: true,
                mermaidCode,
                entities: normalizedEntities,
                relationships: normalizedRelationships,
                errors,
                warnings,
                metadata: {
                    entityCount: normalizedEntities.length,
                    relationshipCount: normalizedRelationships.length,
                    attributeCount,
                    generateTime: Date.now() - startTime,
                },
            };
        }
        catch (error) {
            errors.push(`Diagram generation failed: ${error}`);
            return {
                success: false,
                mermaidCode: '',
                entities,
                relationships,
                errors,
                warnings,
                metadata: {
                    entityCount: entities.length,
                    relationshipCount: relationships.length,
                    attributeCount: 0,
                    generateTime: Date.now() - startTime,
                },
            };
        }
    }
    /**
     * 入力データの検証
     */
    static validateInput(entities, relationships) {
        const errors = [];
        const warnings = [];
        // エンティティの検証
        if (entities.length === 0) {
            errors.push('No entities provided');
            return { errors, warnings };
        }
        const entityNames = new Set();
        entities.forEach((entity, index) => {
            if (!entity.name) {
                errors.push(`Entity at index ${index} has no name`);
                return;
            }
            if (entityNames.has(entity.name)) {
                errors.push(`Duplicate entity name: ${entity.name}`);
                return;
            }
            entityNames.add(entity.name);
            if (!entity.attributes || entity.attributes.length === 0) {
                warnings.push(`Entity ${entity.name} has no attributes`);
            }
            // 属性の検証
            const attributeNames = new Set();
            entity.attributes.forEach((attr, attrIndex) => {
                if (!attr.name) {
                    errors.push(`Entity ${entity.name}: attribute at index ${attrIndex} has no name`);
                    return;
                }
                if (attributeNames.has(attr.name)) {
                    errors.push(`Entity ${entity.name}: duplicate attribute name: ${attr.name}`);
                    return;
                }
                attributeNames.add(attr.name);
                if (!attr.type) {
                    warnings.push(`Entity ${entity.name}: attribute ${attr.name} has no type`);
                }
            });
            // 主キーの検証
            if (entity.primaryKey && !entity.attributes.find((attr) => attr.name === entity.primaryKey)) {
                errors.push(`Entity ${entity.name}: primary key ${entity.primaryKey} not found in attributes`);
            }
        });
        // リレーションシップの検証
        relationships.forEach((rel, index) => {
            if (!rel.fromEntity || !rel.toEntity) {
                errors.push(`Relationship at index ${index}: missing fromEntity or toEntity`);
                return;
            }
            if (!entityNames.has(rel.fromEntity)) {
                errors.push(`Relationship at index ${index}: fromEntity ${rel.fromEntity} not found`);
            }
            if (!entityNames.has(rel.toEntity)) {
                errors.push(`Relationship at index ${index}: toEntity ${rel.toEntity} not found`);
            }
            if (!rel.type) {
                errors.push(`Relationship at index ${index}: missing relationship type`);
            }
        });
        return { errors, warnings };
    }
    /**
     * エンティティの正規化
     */
    static normalizeEntities(entities) {
        return entities.map((entity) => ({
            ...entity,
            displayName: entity.displayName || entity.name,
            description: entity.description || '',
            attributes: entity.attributes.map((attr) => ({
                ...attr,
                type: this.normalizeDataType(attr.type),
                nullable: attr.nullable !== false, // デフォルトはnullable
                unique: attr.unique || false,
                description: attr.description || '',
            })),
            primaryKey: entity.primaryKey || (entity.attributes.length > 0 ? entity.attributes[0].name : undefined),
            constraints: entity.constraints || [],
        }));
    }
    /**
     * リレーションシップの正規化
     */
    static normalizeRelationships(relationships, entities) {
        return relationships.map((rel) => ({
            ...rel,
            fromCardinality: rel.fromCardinality || this.inferCardinality(rel.type, 'from'),
            toCardinality: rel.toCardinality || this.inferCardinality(rel.type, 'to'),
            relationshipName: rel.relationshipName || `${rel.fromEntity}_${rel.toEntity}`,
            description: rel.description || '',
            attributes: rel.attributes || [],
        }));
    }
    /**
     * データ型の正規化
     */
    static normalizeDataType(type) {
        const normalized = type.toLowerCase();
        return this.MERMAID_TYPES[normalized] || type;
    }
    /**
     * カーディナリティの推定
     */
    static inferCardinality(relationshipType, side) {
        switch (relationshipType) {
            case 'one-to-one':
                return '1';
            case 'one-to-many':
                return side === 'from' ? '1' : '0..*';
            case 'many-to-many':
                return '0..*';
            default:
                return '0..*';
        }
    }
    /**
     * Mermaidコードの生成
     */
    static generateMermaidCode(entities, relationships, config) {
        const lines = [];
        // 1. ヘッダー
        lines.push('erDiagram');
        if (config.title) {
            lines.push(`    title ${config.title}`);
        }
        lines.push('');
        // 2. エンティティの定義
        entities.forEach((entity) => {
            const entityCode = this.generateEntityCode(entity, config);
            lines.push(entityCode);
            lines.push('');
        });
        // 3. リレーションシップの定義
        relationships.forEach((rel) => {
            const relationshipCode = this.generateRelationshipCode(rel, config);
            lines.push(relationshipCode);
        });
        return lines.join('\n').trim();
    }
    /**
     * エンティティコードの生成
     */
    static generateEntityCode(entity, config) {
        const lines = [];
        // エンティティ名
        lines.push(`    ${entity.name} {`);
        // 属性の生成
        if (config.showAttributes !== false) {
            entity.attributes.forEach((attr) => {
                const attrCode = this.generateAttributeCode(attr, entity.primaryKey, config);
                lines.push(`        ${attrCode}`);
            });
        }
        lines.push('    }');
        return lines.join('\n');
    }
    /**
     * 属性コードの生成
     */
    static generateAttributeCode(attribute, primaryKey, config = {}) {
        let code = '';
        // データ型
        if (config.showDataTypes !== false) {
            let typeStr = attribute.type;
            if (attribute.length) {
                typeStr += `(${attribute.length})`;
            }
            else if (attribute.precision && attribute.scale) {
                typeStr += `(${attribute.precision},${attribute.scale})`;
            }
            else if (attribute.precision) {
                typeStr += `(${attribute.precision})`;
            }
            code += `${typeStr} `;
        }
        // 属性名
        code += attribute.name;
        // キーインジケーター
        const indicators = [];
        if (attribute.name === primaryKey) {
            indicators.push('PK');
        }
        if (attribute.unique) {
            indicators.push('UK');
        }
        if (!attribute.nullable) {
            indicators.push('NOT NULL');
        }
        if (indicators.length > 0) {
            code += ` "${indicators.join(', ')}"`;
        }
        // コメント
        if (attribute.description && config.showConstraints !== false) {
            code += ` "comment: ${attribute.description}"`;
        }
        return code;
    }
    /**
     * リレーションシップコードの生成
     */
    static generateRelationshipCode(relationship, config) {
        const symbol = this.getRelationshipSymbol(relationship.type);
        const label = relationship.relationshipName || '';
        if (label) {
            return `    ${relationship.fromEntity} ${symbol} ${relationship.toEntity} : "${label}"`;
        }
        else {
            return `    ${relationship.fromEntity} ${symbol} ${relationship.toEntity}`;
        }
    }
    /**
     * リレーションシップシンボルの取得
     */
    static getRelationshipSymbol(type) {
        return this.CARDINALITY_SYMBOLS[type] || this.CARDINALITY_SYMBOLS['one-to-many'];
    }
    /**
     * SQLからER図への変換
     */
    static fromSQL(sqlScript) {
        // SQLパースの実装（基本的なCREATE TABLE文のパース）
        const entities = [];
        const relationships = [];
        const errors = [];
        try {
            const tableMatches = sqlScript.matchAll(/CREATE\s+TABLE\s+(\w+)\s*\(([\s\S]*?)\)/gi);
            for (const match of tableMatches) {
                const tableName = match[1];
                const columnDefinitions = match[2];
                const entity = this.parseTableDefinition(tableName, columnDefinitions);
                entities.push(entity);
            }
            // 外部キー制約からリレーションシップを抽出
            const foreignKeyMatches = sqlScript.matchAll(/FOREIGN\s+KEY\s*\((\w+)\)\s+REFERENCES\s+(\w+)\s*\((\w+)\)/gi);
            for (const match of foreignKeyMatches) {
                // 外部キー制約を見つけた場合のリレーションシップ生成ロジック
                // 実装の詳細は省略
            }
            return this.generateDiagram(entities, relationships);
        }
        catch (error) {
            errors.push(`SQL parsing failed: ${error}`);
            return {
                success: false,
                mermaidCode: '',
                entities,
                relationships,
                errors,
                warnings: [],
                metadata: {
                    entityCount: 0,
                    relationshipCount: 0,
                    attributeCount: 0,
                    generateTime: 0,
                },
            };
        }
    }
    /**
     * テーブル定義のパース
     */
    static parseTableDefinition(tableName, columnDefinitions) {
        const attributes = [];
        let primaryKey;
        const lines = columnDefinitions.split(',').map((line) => line.trim());
        for (const line of lines) {
            if (line.toUpperCase().includes('PRIMARY KEY')) {
                const pkMatch = line.match(/PRIMARY\s+KEY\s*\((\w+)\)/i);
                if (pkMatch) {
                    primaryKey = pkMatch[1];
                }
                continue;
            }
            const columnMatch = line.match(/(\w+)\s+(\w+(?:\([^)]*\))?)/i);
            if (columnMatch) {
                const [, columnName, columnType] = columnMatch;
                attributes.push({
                    name: columnName,
                    type: columnType,
                    nullable: !line.toUpperCase().includes('NOT NULL'),
                    unique: line.toUpperCase().includes('UNIQUE'),
                });
            }
        }
        return {
            name: tableName,
            attributes,
            primaryKey,
        };
    }
    /**
     * JSON SchemaからER図への変換
     */
    static fromJSONSchema(schema) {
        const entities = [];
        const relationships = [];
        try {
            // JSON Schema定義からエンティティを抽出
            if (schema.properties) {
                for (const [entityName, entitySchema] of Object.entries(schema.properties)) {
                    const entity = this.parseJSONSchemaEntity(entityName, entitySchema);
                    entities.push(entity);
                }
            }
            return this.generateDiagram(entities, relationships);
        }
        catch (error) {
            return {
                success: false,
                mermaidCode: '',
                entities,
                relationships,
                errors: [`JSON Schema parsing failed: ${error}`],
                warnings: [],
                metadata: {
                    entityCount: 0,
                    relationshipCount: 0,
                    attributeCount: 0,
                    generateTime: 0,
                },
            };
        }
    }
    /**
     * JSON Schemaエンティティのパース
     */
    static parseJSONSchemaEntity(name, schema) {
        var _a;
        const attributes = [];
        if (schema.properties) {
            for (const [propName, propSchema] of Object.entries(schema.properties)) {
                const prop = propSchema;
                attributes.push({
                    name: propName,
                    type: this.mapJSONSchemaType(prop.type),
                    nullable: !((_a = schema.required) === null || _a === void 0 ? void 0 : _a.includes(propName)),
                    description: prop.description,
                });
            }
        }
        return {
            name,
            attributes,
            description: schema.description,
        };
    }
    /**
     * JSON Schemaタイプのマッピング
     */
    static mapJSONSchemaType(type) {
        const typeMap = {
            string: 'varchar',
            number: 'decimal',
            integer: 'int',
            boolean: 'boolean',
            array: 'json',
            object: 'json',
        };
        return typeMap[type] || 'varchar';
    }
    /**
     * ER図の最適化
     */
    static optimizeDiagram(result) {
        // レイアウトの最適化、エンティティのグループ化など
        // 実装の詳細は省略
        return result;
    }
    /**
     * ER図の検証
     */
    static validateDiagram(result) {
        const issues = [];
        // 検証ルール
        result.entities.forEach((entity) => {
            // 主キーがない場合
            if (!entity.primaryKey) {
                issues.push({
                    type: 'warning',
                    message: 'Entity has no primary key',
                    entity: entity.name,
                });
            }
            // 属性が少ない場合
            if (entity.attributes.length < 2) {
                issues.push({
                    type: 'suggestion',
                    message: 'Entity has very few attributes',
                    entity: entity.name,
                });
            }
        });
        // 孤立したエンティティの検出
        const referencedEntities = new Set();
        result.relationships.forEach((rel) => {
            referencedEntities.add(rel.fromEntity);
            referencedEntities.add(rel.toEntity);
        });
        result.entities.forEach((entity) => {
            if (!referencedEntities.has(entity.name)) {
                issues.push({
                    type: 'suggestion',
                    message: 'Entity has no relationships',
                    entity: entity.name,
                });
            }
        });
        return {
            isValid: issues.filter((issue) => issue.type === 'error').length === 0,
            issues,
        };
    }
}
exports.ERDiagramGenerator = ERDiagramGenerator;
ERDiagramGenerator.MERMAID_TYPES = {
    string: 'string',
    text: 'string',
    number: 'number',
    integer: 'int',
    bigint: 'bigint',
    decimal: 'decimal',
    float: 'float',
    double: 'double',
    boolean: 'boolean',
    date: 'date',
    datetime: 'datetime',
    timestamp: 'timestamp',
    time: 'time',
    json: 'json',
    xml: 'xml',
    binary: 'binary',
    blob: 'blob',
    clob: 'clob',
    email: 'string',
    phone: 'string',
};
ERDiagramGenerator.CARDINALITY_SYMBOLS = {
    'zero-or-one': '||--o{',
    one: '||--||',
    'zero-or-many': '}o--o{',
    'one-or-many': '||--o{',
    many: '}o--o{',
    'one-to-one': '||--||',
    'one-to-many': '||--o{',
    'many-to-many': '}o--o{',
};
