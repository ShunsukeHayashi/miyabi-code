# Lark MCP 操作マニュアル

## 📖 概要

このドキュメントは、Lark MCP（Model Context Protocol）統合の完全な操作マニュアルです。
Wiki-Bitable統合の**Critical Lessons**（重要な教訓）、必須操作手順、エラーハンドリング、ベストプラクティスを提供します。

## 🚨 Critical Lessons（最重要）

### ⚠️ Common Error 1: app_token混同エラー

**問題**:
```
Error: NOTEXIST - app_token not found
```

**原因**:
Wikiノードトークン（`node_token`）をBitableのapp_tokenとして**直接使用**している

**正しい手順**:
```typescript
// ❌ 間違い: Wikiノードトークンを直接使用
const tables = await callMCPTool('bitable.v1.appTable.list', {
  app_token: 'JkKnwgeSViU4QWkj7FPj3dUGpVh' // これはwiki_node_token!
});

// ✅ 正しい: obj_tokenを取得してから使用
const nodeInfo = await callMCPTool('wiki.v2.space.getNode', {
  token: 'JkKnwgeSViU4QWkj7FPj3dUGpVh',
  obj_type: 'bitable'
});

const app_token = nodeInfo.obj_token; // N4p3bChGhajodqs96chj5UDXpRb

const tables = await callMCPTool('bitable.v1.appTable.list', {
  app_token: app_token // obj_tokenを使用
});
```

**重要**: `obj_token` IS the Bitable `app_token`

### ⚠️ Common Error 2: FieldNameNotFoundエラー

**問題**:
```
Error: FieldNameNotFound - field name does not exist
```

**原因**:
フィールド名を推測で指定している（絵文字、スペース、記号が異なる）

**正しい手順**:
```typescript
// ❌ 間違い: 推測でフィールド名を指定
const record = await callMCPTool('bitable.v1.appTableRecord.create', {
  app_token: app_token,
  table_id: table_id,
  fields: {
    '会社名': '株式会社テスト' // 実際は "��会社名" かもしれない
  }
});

// ✅ 正しい: フィールド一覧を取得して完全コピー
const fields = await callMCPTool('bitable.v1.appTableField.list', {
  app_token: app_token,
  table_id: table_id
});

// 返却されたfield_nameを完全にコピー
const companyNameField = fields.items.find(f => f.field_name.includes('会社名'));
const actualFieldName = companyNameField.field_name; // "👥会社名" など

const record = await callMCPTool('bitable.v1.appTableRecord.create', {
  app_token: app_token,
  table_id: table_id,
  fields: {
    [actualFieldName]: '株式会社テスト' // 実際のフィールド名を使用
  }
});
```

### ⚠️ Common Error 3: API順序エラー

**問題**:
APIを呼び出す順序が間違っている

**正しい順序**:
```
1. wiki.v2.space.getNode      → obj_token取得
2. bitable.v1.appTable.list    → テーブル一覧取得
3. bitable.v1.appTableField.list → フィールド一覧取得
4. bitable.v1.appTableRecord.*  → レコード操作
```

**❌ 間違った順序**:
```typescript
// ステップ1をスキップして直接テーブル一覧を取得
const tables = await callMCPTool('bitable.v1.appTable.list', {
  app_token: 'JkKnwgeSViU4QWkj7FPj3dUGpVh' // wiki_node_token（間違い）
});
```

**✅ 正しい順序**:
```typescript
// Step 1: obj_token取得
const nodeInfo = await callMCPTool('wiki.v2.space.getNode', {
  token: 'JkKnwgeSViU4QWkj7FPj3dUGpVh'
});
const app_token = nodeInfo.obj_token;

// Step 2: テーブル一覧取得
const tables = await callMCPTool('bitable.v1.appTable.list', {
  app_token: app_token
});

// Step 3: フィールド一覧取得
const fields = await callMCPTool('bitable.v1.appTableField.list', {
  app_token: app_token,
  table_id: tables.items[0].table_id
});

// Step 4: レコード操作
const records = await callMCPTool('bitable.v1.appTableRecord.search', {
  app_token: app_token,
  table_id: tables.items[0].table_id
});
```

## 📋 必須操作手順

### Step 1: obj_token取得（Wiki内Bitableの場合）

**API**: `wiki.v2.space.getNode`

**目的**: WikiノードからBitableのapp_tokenを取得

**パラメータ**:
```json
{
  "token": "wiki_node_token",
  "obj_type": "bitable"
}
```

**レスポンス**:
```json
{
  "node": {
    "node_token": "JkKnwgeSViU4QWkj7FPj3dUGpVh",
    "obj_token": "N4p3bChGhajodqs96chj5UDXpRb", // これがapp_token!
    "obj_type": "bitable",
    "title": "[MCP Demo] AI-BPO事業管理システム"
  }
}
```

**重要**: `obj_token` = Bitable `app_token`

### Step 2: テーブル一覧取得

**API**: `bitable.v1.appTable.list`

**目的**: Bitable内の全テーブルを取得

**パラメータ**:
```json
{
  "app_token": "N4p3bChGhajodqs96chj5UDXpRb",
  "page_size": 100
}
```

**レスポンス**:
```json
{
  "items": [
    {
      "table_id": "tblwRRR6Bi2P5XxE",
      "name": "顧客管理",
      "revision": 123
    },
    {
      "table_id": "tbloO6l2UWv3Fco9",
      "name": "パートナー管理",
      "revision": 456
    }
  ]
}
```

### Step 3: フィールド一覧取得

**API**: `bitable.v1.appTableField.list`

**目的**: テーブル内の全フィールド情報を取得

**パラメータ**:
```json
{
  "app_token": "N4p3bChGhajodqs96chj5UDXpRb",
  "table_id": "tblwRRR6Bi2P5XxE",
  "page_size": 100
}
```

**レスポンス**:
```json
{
  "items": [
    {
      "field_id": "fldG7zxBGj",
      "field_name": "👥会社名",
      "type": 1,
      "is_primary": true
    },
    {
      "field_id": "fldsBDgxEb",
      "field_name": "🎯顧客タイプ",
      "type": 3,
      "property": {
        "options": [
          { "name": "大企業" },
          { "name": "中小企業" }
        ]
      }
    }
  ]
}
```

**重要**: `field_name`を完全にコピーして使用（絵文字含む）

### Step 4: レコード操作

#### 4-1: レコード検索

**API**: `bitable.v1.appTableRecord.search`

**パラメータ**:
```json
{
  "app_token": "N4p3bChGhajodqs96chj5UDXpRb",
  "table_id": "tblwRRR6Bi2P5XxE",
  "filter": {
    "conditions": [
      {
        "field_name": "👥会社名",
        "operator": "contains",
        "value": ["テスト"]
      }
    ]
  },
  "sort": [
    {
      "field_name": "作成時間",
      "desc": true
    }
  ],
  "page_size": 20
}
```

#### 4-2: レコード作成

**API**: `bitable.v1.appTableRecord.create`

**パラメータ**:
```json
{
  "app_token": "N4p3bChGhajodqs96chj5UDXpRb",
  "table_id": "tblwRRR6Bi2P5XxE",
  "fields": {
    "👥会社名": "株式会社サンプル",
    "🎯顧客タイプ": "大企業",
    "💰契約金額": 1000000
  }
}
```

#### 4-3: レコード更新

**API**: `bitable.v1.appTableRecord.update`

**パラメータ**:
```json
{
  "app_token": "N4p3bChGhajodqs96chj5UDXpRb",
  "table_id": "tblwRRR6Bi2P5XxE",
  "record_id": "recXXXXXXXXX",
  "fields": {
    "🎯顧客タイプ": "中小企業",
    "💰契約金額": 500000
  }
}
```

## 🎯 Absolute Rules（絶対ルール）

### Rule 1: Token Management

**❌ やってはいけないこと**:
- Wikiノードトークンを直接使わない
- obj_tokenを取得せずにBitable操作を試みない
- 推測でapp_tokenを指定しない

**✅ 必ずやること**:
- `wiki.v2.space.getNode`でobj_tokenを取得
- obj_tokenをapp_tokenとして使用
- エラー時は必ずobj_tokenを再確認

### Rule 2: Field Name Management

**❌ やってはいけないこと**:
- 推測でフィールド名を指定しない
- 絵文字を省略しない
- スペースや記号を省略しない

**✅ 必ずやること**:
- `bitable.v1.appTableField.list`で確認
- field_nameを完全にコピー
- 文字列として完全一致で使用

### Rule 3: Error Handling

**エラー発生時のアクション**:
```typescript
try {
  // MCP操作
} catch (error) {
  if (error.message.includes('NOTEXIST')) {
    // Rule 1: obj_tokenを再取得
    const nodeInfo = await callMCPTool('wiki.v2.space.getNode', {...});
    const app_token = nodeInfo.obj_token;
    // リトライ
  } else if (error.message.includes('FieldNameNotFound')) {
    // Rule 2: フィールド一覧を再取得
    const fields = await callMCPTool('bitable.v1.appTableField.list', {...});
    // フィールド名を確認してリトライ
  } else {
    // その他のエラー: ログに記録してエスカレーション
    console.error('Unexpected error:', error);
  }
}
```

## 🚀 Best Practices

### 1. API Call Optimization

**順序最適化**:
```typescript
// 最適な実行順序
const nodeInfo = await callMCPTool('wiki.v2.space.getNode', {...});
const app_token = nodeInfo.obj_token;

// 並列実行可能
const [tables, fields] = await Promise.all([
  callMCPTool('bitable.v1.appTable.list', { app_token }),
  callMCPTool('bitable.v1.appTableField.list', { app_token, table_id })
]);

// シーケンシャル実行が必要
const records = await callMCPTool('bitable.v1.appTableRecord.search', {
  app_token,
  table_id
});
```

### 2. Batch Operations

**バッチ作成**:
```typescript
// ❌ 非効率: 1件ずつ作成
for (const data of dataArray) {
  await callMCPTool('bitable.v1.appTableRecord.create', {...});
}

// ✅ 効率的: バッチ作成
await callMCPTool('bitable.v1.appTableRecord.batchCreate', {
  app_token,
  table_id,
  records: dataArray.map(data => ({ fields: data }))
});
```

### 3. Caching Strategy

**obj_token のキャッシュ**:
```typescript
let cached_app_token: string | null = null;

async function getAppToken(wiki_node_token: string): Promise<string> {
  if (cached_app_token) {
    return cached_app_token;
  }
  
  const nodeInfo = await callMCPTool('wiki.v2.space.getNode', {
    token: wiki_node_token
  });
  
  cached_app_token = nodeInfo.obj_token;
  return cached_app_token;
}
```

### 4. Error Recovery

**自動リトライロジック**:
```typescript
async function retryMCPCall<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
  throw new Error('Max retries exceeded');
}
```

## 📊 Rate Limiting

### Lark API Rate Limits

- **標準API**: 200 requests/minute
- **書き込み操作**: 20 requests/minute
- **管理操作**: 5 requests/minute

### Rate Limit対策

```typescript
class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private requestsPerMinute = 20;
  private interval = 60000 / this.requestsPerMinute;

  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const fn = this.queue.shift()!;
      await fn();
      await new Promise(resolve => setTimeout(resolve, this.interval));
    }

    this.processing = false;
  }
}
```

## 🔗 参考リンク

### ドキュメント
- [Lark Open Platform](https://open.larksuite.com/)
- [Wiki API Documentation](https://open.larksuite.com/document/server-docs/docs/wiki-v2/wiki-overview)
- [Bitable API Documentation](https://open.larksuite.com/document/server-docs/docs/bitable-v1/bitable-overview)

### MCPツール
- [Lark OpenAPI MCP Enhanced](https://github.com/ShunsukeHayashi/lark-openapi-mcp-enhanced)
- [Lark Wiki MCP Agents](https://github.com/ShunsukeHayashi/lark-wiki-mcp-agents)

---

**最終更新**: 2025-10-18
**バージョン**: 1.0.0
**次へ**: [システム構造](system-structure.md)
