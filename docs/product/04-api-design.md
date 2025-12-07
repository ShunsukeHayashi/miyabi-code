# Miyabi Character Studio - API Design Specification

**Version**: 1.0
**Date**: 2025-12-07
**Base URL**: `https://api.miyabi-character-studio.com/v1`
**Protocol**: HTTPS Only
**Authentication**: JWT Bearer Token

---

## 🎯 API Design Principles

1. **RESTful**: リソース指向の設計
2. **Versioning**: URL Versioning (`/v1/`)
3. **Consistency**: 統一されたレスポンス形式
4. **Error Handling**: 明確なエラーメッセージ
5. **Rate Limiting**: Plan別の制限

---

## 📋 API Endpoint List

### Authentication & User Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | 新規ユーザー登録 | ❌ |
| POST | `/auth/login` | ログイン | ❌ |
| POST | `/auth/refresh` | トークン更新 | ✅ |
| GET | `/auth/me` | ログインユーザー情報取得 | ✅ |
| PUT | `/auth/me` | ユーザー情報更新 | ✅ |
| DELETE | `/auth/me` | アカウント削除 | ✅ |

### Character Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/characters` | キャラクター新規作成 | ✅ |
| GET | `/characters` | キャラクター一覧取得 | ✅ |
| GET | `/characters/{id}` | キャラクター詳細取得 | ✅ |
| PUT | `/characters/{id}` | キャラクター更新 | ✅ |
| DELETE | `/characters/{id}` | キャラクター削除 | ✅ |

### Difference Generation

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/differences/batch` | 差分一括生成開始 | ✅ |
| GET | `/differences/batch/{batchId}` | バッチ生成状況取得 | ✅ |
| GET | `/differences/{id}` | 差分詳細取得 | ✅ |
| POST | `/differences/{id}/regenerate` | 差分再生成 | ✅ |
| DELETE | `/differences/{id}` | 差分削除 | ✅ |

### Export & Download

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/export/{batchId}` | エクスポート（ZIP） | ✅ |
| GET | `/export/{batchId}/vtube-studio` | VTube Studio形式 | ✅ |
| GET | `/export/{batchId}/live2d-psd` | Live2D PSD形式 (Pro) | ✅ |

### Credits & Billing

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/credits/usage` | クレジット使用状況 | ✅ |
| GET | `/credits/transactions` | クレジット履歴 | ✅ |
| POST | `/billing/subscribe` | プランアップグレード | ✅ |
| DELETE | `/billing/subscribe` | プラン解約 | ✅ |
| POST | `/billing/webhook` | Stripe Webhook | ❌ |

---

## 📖 API Endpoint Details

### 1. Authentication & User Management

#### POST `/auth/register`
新規ユーザー登録

**Request:**
```json
{
  "email": "yume@example.com",
  "password": "SecurePass123!",
  "name": "佐藤ゆめ"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "yume@example.com",
      "name": "佐藤ゆめ",
      "plan": "free",
      "createdAt": "2025-12-07T12:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Errors:**
- `400 Bad Request`: バリデーションエラー
- `409 Conflict`: メールアドレス既存

---

#### POST `/auth/login`
ログイン

**Request:**
```json
{
  "email": "yume@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresAt": "2025-12-14T12:00:00Z"
  }
}
```

**Errors:**
- `401 Unauthorized`: メールアドレスまたはパスワードが間違っています

---

#### GET `/auth/me`
ログインユーザー情報取得

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "yume@example.com",
    "name": "佐藤ゆめ",
    "plan": "basic",
    "stripeCustomerId": "cus_XXX",
    "createdAt": "2025-12-07T12:00:00Z"
  }
}
```

---

### 2. Character Management

#### POST `/characters`
キャラクター新規作成（ベース画像アップロード + AI分析）

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request (FormData):**
```
name: "ゆめちゃん"
baseImage: [File] (PNG/JPEG/WebP, max 10MB)
style: "illustration" | "realistic"
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "char_abc123",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "name": "ゆめちゃん",
    "baseImageUrl": "https://cdn.miyabi.ai/characters/.../base.png",
    "features": {
      "hair": { "color": "pink", "style": "long", "length": "waist" },
      "eyes": { "color": "blue", "shape": "round" },
      "outfit": { "primary": "white dress", "secondary": "ribbon", "accessories": ["earrings"] },
      "bodyType": "slender",
      "artStyle": "illustration"
    },
    "geminiPrompt": "A cute anime-style character with long pink hair...",
    "consistencyScore": 95.2,
    "createdAt": "2025-12-07T12:00:00Z"
  }
}
```

**Errors:**
- `400 Bad Request`: 画像サイズが大きすぎます (最大10MB)
- `413 Payload Too Large`: ファイルサイズ超過
- `429 Too Many Requests`: 月間クレジット超過

---

#### GET `/characters`
キャラクター一覧取得

**Query Parameters:**
```
?page=1&limit=20&sort=createdAt:desc
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "characters": [
      {
        "id": "char_abc123",
        "name": "ゆめちゃん",
        "baseImageUrl": "https://cdn.miyabi.ai/...",
        "differencesCount": 5,
        "consistencyScore": 95.2,
        "createdAt": "2025-12-07T12:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 7,
      "totalPages": 1
    }
  }
}
```

---

#### GET `/characters/{id}`
キャラクター詳細取得（差分含む）

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "character": {
      "id": "char_abc123",
      "name": "ゆめちゃん",
      "baseImageUrl": "https://cdn.miyabi.ai/...",
      "features": { ... },
      "consistencyScore": 95.2,
      "createdAt": "2025-12-07T12:00:00Z"
    },
    "differences": [
      {
        "id": "diff_neutral_001",
        "expression": "neutral",
        "imageUrl": "https://cdn.miyabi.ai/...",
        "consistencyScore": 96.1,
        "generationTime": 45,
        "createdAt": "2025-12-07T12:05:00Z"
      },
      {
        "id": "diff_happy_001",
        "expression": "happy",
        "imageUrl": "https://cdn.miyabi.ai/...",
        "consistencyScore": 95.7,
        "generationTime": 48,
        "createdAt": "2025-12-07T12:06:00Z"
      }
    ]
  }
}
```

**Errors:**
- `404 Not Found`: キャラクターが見つかりません

---

### 3. Difference Generation

#### POST `/differences/batch`
差分一括生成開始（非同期処理）

**Request:**
```json
{
  "characterId": "char_abc123",
  "expressions": ["neutral", "happy", "angry", "sad", "surprised"],
  "options": {
    "resolution": "2K",
    "backgroundColor": "transparent",
    "aspectRatio": "1:1"
  }
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "batchId": "batch_xyz789",
    "characterId": "char_abc123",
    "totalDifferences": 5,
    "estimatedCompletionTime": "2025-12-07T12:25:00Z",
    "status": "pending"
  }
}
```

**Errors:**
- `400 Bad Request`: 不正な表情タイプ
- `429 Too Many Requests`: レート制限超過

---

#### GET `/differences/batch/{batchId}`
バッチ生成状況取得（ポーリング用）

**Response (200 OK - 生成中):**
```json
{
  "success": true,
  "data": {
    "batchId": "batch_xyz789",
    "status": "processing",
    "total": 5,
    "completed": 3,
    "progress": 60,
    "differences": [
      {
        "expression": "neutral",
        "status": "completed",
        "imageUrl": "https://cdn.miyabi.ai/...",
        "consistencyScore": 96.1
      },
      {
        "expression": "happy",
        "status": "completed",
        "imageUrl": "https://cdn.miyabi.ai/...",
        "consistencyScore": 95.7
      },
      {
        "expression": "angry",
        "status": "completed",
        "imageUrl": "https://cdn.miyabi.ai/...",
        "consistencyScore": 94.8
      },
      {
        "expression": "sad",
        "status": "processing",
        "progress": 78
      },
      {
        "expression": "surprised",
        "status": "pending"
      }
    ],
    "estimatedTimeRemaining": 480
  }
}
```

**Response (200 OK - 完了):**
```json
{
  "success": true,
  "data": {
    "batchId": "batch_xyz789",
    "status": "completed",
    "total": 5,
    "completed": 5,
    "progress": 100,
    "averageConsistency": 95.4,
    "totalGenerationTime": 1112,
    "differences": [ ... ],
    "completedAt": "2025-12-07T12:23:32Z"
  }
}
```

**Errors:**
- `404 Not Found`: バッチIDが見つかりません

---

#### POST `/differences/{id}/regenerate`
差分再生成（1枚のみ）

**Request:**
```json
{
  "options": {
    "resolution": "2K",
    "backgroundColor": "transparent"
  }
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "jobId": "job_regenerate_001",
    "differenceId": "diff_sad_001",
    "status": "pending",
    "estimatedCompletionTime": "2025-12-07T12:28:00Z"
  }
}
```

---

### 4. Export & Download

#### GET `/export/{batchId}?format=zip`
エクスポート（ZIP一括ダウンロード）

**Query Parameters:**
```
format: "zip" | "vtube-studio" | "live2d-psd"
includeMetadata: true | false (default: true)
```

**Response (200 OK - ZIP):**
```
Content-Type: application/zip
Content-Disposition: attachment; filename="ゆめちゃん_20251207.zip"

[Binary ZIP Data]
```

**ZIP Contents:**
```
ゆめちゃん_20251207/
├── ゆめちゃん_通常.png
├── ゆめちゃん_喜び.png
├── ゆめちゃん_怒り.png
├── ゆめちゃん_悲しみ.png
├── ゆめちゃん_驚き.png
└── metadata.json
```

**metadata.json:**
```json
{
  "characterName": "ゆめちゃん",
  "generatedAt": "2025-12-07T12:23:32Z",
  "differences": [
    { "expression": "neutral", "filename": "ゆめちゃん_通常.png", "consistency": 96.1 },
    { "expression": "happy", "filename": "ゆめちゃん_喜び.png", "consistency": 95.7 },
    { "expression": "angry", "filename": "ゆめちゃん_怒り.png", "consistency": 94.8 },
    { "expression": "sad", "filename": "ゆめちゃん_悲しみ.png", "consistency": 95.2 },
    { "expression": "surprised", "filename": "ゆめちゃん_驚き.png", "consistency": 95.9 }
  ],
  "averageConsistency": 95.4,
  "miyabiVersion": "1.0.0"
}
```

**Errors:**
- `404 Not Found`: バッチIDが見つかりません
- `402 Payment Required`: Pro限定機能（Live2D PSD）

---

#### GET `/export/{batchId}/vtube-studio`
VTube Studio形式エクスポート

**Response (200 OK - ZIP):**
```
Content-Type: application/zip
Content-Disposition: attachment; filename="ゆめちゃん_VTubeStudio.zip"

[Binary ZIP Data]
```

**ZIP Contents:**
```
ゆめちゃん_VTubeStudio/
├── ゆめちゃん_通常.png
├── ゆめちゃん_喜び.png
├── ゆめちゃん_怒り.png
├── ゆめちゃん_悲しみ.png
├── ゆめちゃん_驚き.png
└── character.json
```

**character.json (VTube Studio Format):**
```json
{
  "version": "1.0",
  "character": {
    "name": "ゆめちゃん",
    "expressions": [
      { "id": "neutral", "file": "ゆめちゃん_通常.png", "hotkey": "1" },
      { "id": "happy", "file": "ゆめちゃん_喜び.png", "hotkey": "2" },
      { "id": "angry", "file": "ゆめちゃん_怒り.png", "hotkey": "3" },
      { "id": "sad", "file": "ゆめちゃん_悲しみ.png", "hotkey": "4" },
      { "id": "surprised", "file": "ゆめちゃん_驚き.png", "hotkey": "5" }
    ]
  },
  "settings": {
    "resolution": "2048x2048",
    "transparency": true
  },
  "metadata": {
    "generatedBy": "Miyabi Character Studio",
    "generatedAt": "2025-12-07T12:23:32Z"
  }
}
```

---

### 5. Credits & Billing

#### GET `/credits/usage`
クレジット使用状況取得

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "plan": "basic",
    "quota": {
      "characters": 20,
      "differences": 100
    },
    "used": {
      "characters": 7,
      "differences": 35
    },
    "remaining": {
      "characters": 13,
      "differences": 65
    },
    "resetDate": "2026-03-01T00:00:00Z",
    "daysUntilReset": 23
  }
}
```

---

#### GET `/credits/transactions`
クレジット履歴取得

**Query Parameters:**
```
?page=1&limit=20&startDate=2025-12-01&endDate=2025-12-31
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "txn_001",
        "characterId": "char_abc123",
        "characterName": "ゆめちゃん",
        "differencesGenerated": 5,
        "creditsUsed": 5,
        "createdAt": "2025-12-07T12:23:32Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 7,
      "totalPages": 1
    }
  }
}
```

---

#### POST `/billing/subscribe`
プランアップグレード（Stripe Checkout）

**Request:**
```json
{
  "plan": "basic" | "pro",
  "successUrl": "https://miyabi.ai/success",
  "cancelUrl": "https://miyabi.ai/cancel"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "checkoutUrl": "https://checkout.stripe.com/pay/cs_live_XXX",
    "sessionId": "cs_live_XXX"
  }
}
```

---

#### POST `/billing/webhook`
Stripe Webhook（サブスクリプション更新通知）

**Headers:**
```
Stripe-Signature: t=1234567890,v1=XXX
```

**Request (Stripe Event):**
```json
{
  "id": "evt_XXX",
  "type": "customer.subscription.updated",
  "data": {
    "object": {
      "id": "sub_XXX",
      "customer": "cus_XXX",
      "status": "active",
      "items": {
        "data": [
          {
            "price": {
              "id": "price_basic_monthly",
              "product": "prod_basic"
            }
          }
        ]
      }
    }
  }
}
```

**Response (200 OK):**
```json
{
  "received": true
}
```

---

## 🔒 Authentication & Authorization

### JWT Token Structure
```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "yume@example.com",
  "plan": "basic",
  "exp": 1738886400,
  "iat": 1738281600
}
```

### Authorization Header
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Error Response (401 Unauthorized)
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "認証トークンが無効です"
  }
}
```

---

## ⚡ Rate Limiting

### Plan-based Limits

| Plan | Rate Limit | Burst |
|------|------------|-------|
| Free | 10 req/min | 20 |
| Basic | 30 req/min | 60 |
| Pro | 100 req/min | 200 |

### Rate Limit Headers
```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 15
X-RateLimit-Reset: 1738281600
```

### Error Response (429 Too Many Requests)
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "レート制限を超過しました。1分後に再試行してください",
    "retryAfter": 60
  }
}
```

---

## 📊 Standard Error Responses

### Error Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ（日本語）",
    "details": { ... } // Optional
  }
}
```

### Common Error Codes

| HTTP Code | Error Code | Message |
|-----------|------------|---------|
| 400 | VALIDATION_ERROR | バリデーションエラー |
| 401 | UNAUTHORIZED | 認証が必要です |
| 402 | PAYMENT_REQUIRED | Pro限定機能です |
| 403 | FORBIDDEN | アクセス権限がありません |
| 404 | NOT_FOUND | リソースが見つかりません |
| 409 | CONFLICT | リソースが既に存在します |
| 413 | PAYLOAD_TOO_LARGE | ファイルサイズが大きすぎます |
| 429 | RATE_LIMIT_EXCEEDED | レート制限超過 |
| 500 | INTERNAL_SERVER_ERROR | サーバーエラーが発生しました |
| 503 | SERVICE_UNAVAILABLE | サービス一時停止中 |

---

## 🔗 Next Steps

このAPI設計を元に、次のドキュメントを作成:
1. **データベース設計** (`05-database-schema.md`) - ERD、インデックス戦略詳細
2. **開発ロードマップ** (`06-development-roadmap.md`) - 6ヶ月開発計画

---

**Author**: ProductDesignAgent
**Last Updated**: 2025-12-07
**Status**: ✅ Completed
