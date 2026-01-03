# AI Course Platform Phase 2.1: AI Generative Content Engine 詳細仕様

**日付:** 2026-01-03
**バージョン:** 2.1.0
**優先度:** P0-Critical
**作成者:** Miyabi Agent Collaboration (カエデ-1, カエデ-2, カエデ-3)

---

## 🎯 **概要**

Phase 1で構築された基盤上に、**Google Gemini AI**を活用した包括的コンテンツ生成エンジンを実装します。リアルタイム生成、多言語対応、個人化機能を提供し、教育コンテンツの革新的な自動生成を実現します。

---

## 📋 **詳細要件定義** (P0.4準拠)

### **要件1: Gemini AI統合コア**

#### **入力仕様**
```typescript
interface GeminiContentRequest {
  // 基本パラメータ
  contentType: 'course-outline' | 'lesson-content' | 'assessment' | 'video-script' | 'interactive-exercise';
  topic: string; // 必須、最大500文字
  targetAudience: {
    level: 'beginner' | 'intermediate' | 'advanced';
    age: number; // 5-99歳
    background: string; // 最大200文字
    learningGoals: string[]; // 最大10項目
  };

  // 生成設定
  generationConfig: {
    language: 'ja' | 'en' | 'zh' | 'ko' | 'es';
    tone: 'formal' | 'casual' | 'academic' | 'conversational';
    length: 'short' | 'medium' | 'long'; // short: ~500語, medium: ~1500語, long: ~3000語
    includeExamples: boolean;
    interactivityLevel: 1 | 2 | 3 | 4 | 5; // 1=テキストのみ, 5=高度インタラクティブ
  };

  // 品質制御
  qualityConstraints: {
    readabilityScore: number; // 1-100, Flesch Reading Ease準拠
    factualAccuracy: boolean; // 事実確認要求
    plagiarismCheck: boolean; // 盗作チェック要求
    biasDetection: boolean; // バイアス検出要求
  };
}
```

#### **出力仕様**
```typescript
interface GeminiContentResponse {
  // 生成コンテンツ
  content: {
    title: string;
    body: string; // Markdown形式
    summary: string; // 最大200文字
    keyPoints: string[]; // 最大8項目
    estimatedReadingTime: number; // 分単位
  };

  // メタデータ
  metadata: {
    generatedAt: string; // ISO 8601
    modelVersion: string; // 使用Geminiモデル
    promptTokens: number;
    completionTokens: number;
    qualityScore: number; // 1-100
    confidenceLevel: number; // 1-100
  };

  // 品質指標
  qualityMetrics: {
    readabilityScore: number;
    factualAccuracyScore: number;
    originalityScore: number;
    biasScore: number; // 0=無バイアス, 100=高バイアス
    engagementPrediction: number; // 1-100
  };

  // 補助情報
  recommendations: {
    improvements: string[]; // 改善提案
    additionalResources: string[]; // 参考資料
    relatedTopics: string[]; // 関連トピック
  };
}
```

#### **エラーハンドリング仕様**
```typescript
interface GeminiError {
  code: 'API_LIMIT' | 'INVALID_REQUEST' | 'MODEL_ERROR' | 'SAFETY_FILTER' | 'TIMEOUT';
  message: string;
  details: {
    requestId: string;
    timestamp: string;
    retryAfter?: number; // seconds
    suggestion: string;
  };
}
```

### **要件2: リアルタイム生成システム**

#### **ストリーミングAPI仕様**
```typescript
interface StreamingContentGeneration {
  // WebSocket接続エンドポイント
  endpoint: '/api/ai/generate/stream';

  // ストリーミングメッセージ
  messageTypes: {
    'generation:start': { requestId: string; estimatedDuration: number };
    'generation:progress': { progress: number; currentSection: string };
    'generation:partial': { partialContent: string; type: 'title' | 'section' | 'summary' };
    'generation:complete': { finalContent: GeminiContentResponse };
    'generation:error': { error: GeminiError };
  };

  // 品質チェックポイント
  qualityCheckpoints: {
    // 25%, 50%, 75%, 100%での品質評価
    intervals: [0.25, 0.5, 0.75, 1.0];
    actions: 'continue' | 'adjust' | 'regenerate' | 'abort';
  };
}
```

#### **プログレス追跡仕様**
```typescript
interface GenerationProgress {
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
```

### **要件3: 個人化エンジン**

#### **学習者プロファイル**
```typescript
interface LearnerProfile {
  userId: string;

  // 学習スタイル
  learningStyle: {
    visual: number; // 0-100
    auditory: number; // 0-100
    kinesthetic: number; // 0-100
    reading: number; // 0-100
  };

  // 進捗情報
  progressData: {
    completedCourses: string[];
    currentLevel: number; // 1-10
    strengths: string[]; // トピック
    weaknesses: string[]; // トピック
    learningPace: 'slow' | 'medium' | 'fast';
  };

  // 嗜好設定
  preferences: {
    contentLength: 'short' | 'medium' | 'long';
    interactivityLevel: 1 | 2 | 3 | 4 | 5;
    exampleTypes: ('visual' | 'textual' | 'interactive' | 'real-world')[];
    languagePreference: 'ja' | 'en' | 'zh' | 'ko' | 'es';
  };
}
```

#### **適応的コンテンツ生成**
```typescript
interface AdaptiveContentGeneration {
  // 入力: 基本リクエスト + 学習者プロファイル
  generatePersonalizedContent(
    baseRequest: GeminiContentRequest,
    learnerProfile: LearnerProfile
  ): Promise<GeminiContentResponse>;

  // 適応アルゴリズム
  adaptationStrategy: {
    contentDifficulty: 'auto' | 'manual';
    paceAdjustment: boolean;
    styleAdaptation: boolean;
    examplePersonalization: boolean;
  };

  // A/Bテスト機能
  abTesting: {
    variantGeneration: boolean;
    performanceTracking: boolean;
    autoOptimization: boolean;
  };
}
```

### **要件4: コンテンツ品質保証**

#### **自動品質評価システム**
```typescript
interface ContentQualityAssurance {
  // 品質チェック項目
  qualityChecks: {
    grammarCheck: boolean;
    factualVerification: boolean;
    readabilityAnalysis: boolean;
    biasDetection: boolean;
    plagiarismCheck: boolean;
    safetyFilter: boolean;
  };

  // 品質スコアリング
  scoringCriteria: {
    accuracy: number; // 重み付け 0-1
    clarity: number;
    engagement: number;
    originality: number;
    appropriateness: number;
  };

  // 自動改善提案
  improvementSuggestions: {
    enableAutoFix: boolean;
    suggestionTypes: ('grammar' | 'clarity' | 'engagement' | 'structure')[];
    confidenceThreshold: number; // 0-1
  };
}
```

### **要件5: マルチモーダル対応**

#### **コンテンツ形式**
```typescript
interface MultiModalContent {
  // テキストコンテンツ
  text: {
    markdown: string;
    html: string;
    plainText: string;
  };

  // 画像生成指示
  visualElements: {
    diagrams: {
      type: 'flowchart' | 'mindmap' | 'infographic' | 'chart';
      description: string;
      generationPrompt: string;
    }[];
    illustrations: {
      description: string;
      style: 'realistic' | 'cartoon' | 'minimalist' | 'technical';
      generationPrompt: string;
    }[];
  };

  // 音声スクリプト
  audioScript: {
    narrationText: string;
    tone: string;
    pacing: 'slow' | 'normal' | 'fast';
    emphasis: { text: string; type: 'bold' | 'pause' | 'speed' }[];
  };

  // インタラクティブ要素
  interactiveElements: {
    quizzes: {
      question: string;
      type: 'multiple_choice' | 'true_false' | 'short_answer';
      options?: string[];
      correctAnswer: string;
      explanation: string;
    }[];
    simulations: {
      type: string;
      description: string;
      parameters: Record<string, unknown>;
    }[];
  };
}
```

---

## 🔧 **技術実装仕様**

### **アーキテクチャ設計**
```typescript
// ディレクトリ構成
lib/ai/
├── gemini/
│   ├── client.ts         // Gemini APIクライアント
│   ├── streaming.ts      // ストリーミング処理
│   ├── prompts/          // プロンプトテンプレート
│   │   ├── course.ts
│   │   ├── lesson.ts
│   │   └── assessment.ts
│   └── types.ts          // 型定義
├── quality/
│   ├── validator.ts      // 品質検証
│   ├── scorer.ts         // スコアリング
│   └── improver.ts       // 自動改善
├── personalization/
│   ├── profiler.ts       // プロファイル管理
│   ├── adapter.ts        // 適応的生成
│   └── recommender.ts    // レコメンデーション
└── index.ts              // エクスポート
```

### **API設計**
```typescript
// エンドポイント
POST /api/ai/generate/course      // コース生成
POST /api/ai/generate/lesson      // レッスン生成
POST /api/ai/generate/assessment  // 評価生成
GET  /api/ai/generate/status/:id  // 生成状況確認
WS   /api/ai/generate/stream      // リアルタイム生成

// レスポンス形式統一
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: GeminiError;
  metadata: {
    requestId: string;
    timestamp: string;
    processingTime: number;
  };
}
```

### **データベース設計**
```sql
-- AI生成コンテンツ管理
CREATE TABLE ai_generated_content (
    id UUID PRIMARY KEY,
    request_id VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    input_params JSONB NOT NULL,
    generated_content JSONB NOT NULL,
    quality_metrics JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 学習者プロファイル
CREATE TABLE learner_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    learning_style JSONB,
    progress_data JSONB,
    preferences JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- コンテンツ品質評価
CREATE TABLE content_quality_assessments (
    id UUID PRIMARY KEY,
    content_id UUID REFERENCES ai_generated_content(id),
    quality_scores JSONB,
    feedback JSONB,
    reviewer_type VARCHAR(50), -- 'ai' or 'human'
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🧪 **テスト仕様**

### **単体テスト**
```typescript
// テストケース例
describe('GeminiContentGenerator', () => {
  test('基本的なコース生成', async () => {
    const request: GeminiContentRequest = { /* テストデータ */ };
    const response = await geminiClient.generateCourse(request);

    expect(response.content.title).toBeDefined();
    expect(response.qualityMetrics.readabilityScore).toBeGreaterThan(70);
  });

  test('日本語コンテンツ生成', async () => {
    const request: GeminiContentRequest = {
      contentType: 'lesson-content',
      topic: 'プログラミング基礎',
      generationConfig: { language: 'ja' }
    };

    const response = await geminiClient.generateLesson(request);
    expect(response.content.body).toMatch(/プログラミング/);
  });
});
```

### **統合テスト**
```typescript
// ストリーミングAPIテスト
test('リアルタイム生成ストリーミング', async () => {
  const ws = new WebSocket('ws://localhost:3000/api/ai/generate/stream');

  ws.send(JSON.stringify({ type: 'generate', data: testRequest }));

  const messages = await collectWebSocketMessages(ws, 5000);
  expect(messages).toContainEqual(
    expect.objectContaining({ type: 'generation:complete' })
  );
});
```

---

## 📊 **パフォーマンス要件**

| 指標 | 目標値 |
|------|--------|
| **コース生成時間** | < 30秒 |
| **レッスン生成時間** | < 15秒 |
| **品質評価時間** | < 5秒 |
| **ストリーミング遅延** | < 500ms |
| **同時生成数** | 50リクエスト |
| **API可用性** | 99.9% |

---

## 🔒 **セキュリティ要件**

### **データ保護**
- 生成プロンプトの暗号化保存
- APIキーの安全な管理
- 個人情報の匿名化処理
- GDPR準拠データ管理

### **アクセス制御**
- JWT認証必須
- レート制限 (100req/min per user)
- IP制限オプション
- 管理者権限分離

---

## 🚀 **実装順序** (優先度順)

### **Phase 2.1.1: コア実装** (Week 1)
1. **Gemini APIクライアント** - 基本的な生成機能
2. **基本プロンプトテンプレート** - コース・レッスン・評価
3. **API エンドポイント** - 基本CRUD操作
4. **品質評価システム** - 基本スコアリング

### **Phase 2.1.2: ストリーミング** (Week 2)
1. **WebSocketサーバー** - リアルタイム通信
2. **プログレス追跡** - 生成状況管理
3. **エラーハンドリング** - 包括的エラー処理
4. **フロントエンド統合** - UI更新

### **Phase 2.1.3: 個人化** (Week 3)
1. **学習者プロファイリング** - データ収集・分析
2. **適応的生成アルゴリズム** - 個人化ロジック
3. **A/Bテストフレームワーク** - 効果測定
4. **レコメンデーションシステム** - 関連コンテンツ提案

---

## ✅ **完了判定基準**

### **必須要件** (Phase 2.1完了条件)
- [ ] 全コンテンツタイプの生成機能実装
- [ ] リアルタイムストリーミング動作確認
- [ ] 日本語・英語での高品質生成確認
- [ ] 品質スコア70以上の安定生成
- [ ] 全APIエンドポイントのテスト完了
- [ ] セキュリティ監査完了

### **品質要件**
- [ ] 単体テストカバレッジ 90%以上
- [ ] 統合テストカバレッジ 80%以上
- [ ] パフォーマンステスト全項目クリア
- [ ] セキュリティテスト完了
- [ ] ユーザビリティテスト完了

---

**仕様確定日:** 2026-01-03
**実装開始予定:** 即座
**完了予定:** 2026-01-24 (3週間)

**責任者:** Miyabi CodeGen Agent (カエデ-1, カエデ-2, カエデ-3)
**レビュー担当:** Miyabi Review Agent (サクラ)

---

*この仕様に基づき、P0.4最小コード原則に従って必要最小限のコードのみを実装します。*