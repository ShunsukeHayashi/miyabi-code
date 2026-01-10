---
name: AI/LLM Integration Workflow
description: Comprehensive AI and LLM integration including Gemini, OpenAI, and Claude APIs. Use when implementing AI features, optimizing prompts, or debugging LLM integration across Miyabi projects.
allowed-tools: Bash, Read, Write, Edit, Grep, Glob
---

# 🤖 AI/LLM Integration Workflow

**Version**: 1.0.0
**Last Updated**: 2025-01-10
**Priority**: ⭐⭐⭐⭐⭐ (P0 Level)
**Purpose**: AI/LLM統合とプロンプト最適化

---

## 📋 概要

MiyabiエコシステムのAI/LLM統合管理ワークフロー。
Gemini、OpenAI、Claude APIの統合、プロンプトエンジニアリング、AI機能実装を統合管理します。

---

## 🎯 P0: 呼び出しトリガー

| トリガー | 例 |
|---------|-----|
| AI統合 | "integrate AI", "add AI features" |
| LLM API | "gemini api", "openai", "claude api" |
| プロンプト | "optimize prompt", "prompt engineering" |
| AI機能実装 | "ai content generation", "ai analysis" |
| AI エラー | "ai error", "llm timeout", "api limit" |
| AI最適化 | "improve ai performance", "reduce ai cost" |

---

## 🔧 P1: AI/LLM アーキテクチャ

### Miyabi AI/LLM Distribution

| Project | Primary AI | Use Case | Integration |
|---------|-----------|----------|-------------|
| **Gen-Studio** | Gemini 3 Flash | Content Generation, UI/UX Design | `services/gemini/` |
| **AI Course Generator** | Gemini Pro | Course Content, Slide Generation | `services/gemini/` |
| **AI Course SaaS** | OpenAI GPT-4 | Student Interaction, Assessment | `lib/openai/` |
| **MCP Bundle** | Claude MCP | Development Tools, Code Analysis | MCP Protocol |
| **Daily Ops** | Gemini Flash | Automation, Report Generation | `src/ai/` |

### API設定管理

```typescript
// services/ai/config.ts
export const AI_PROVIDERS = {
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    models: {
      flash: 'gemini-2.0-flash-exp',
      pro: 'gemini-1.5-pro',
      thinking: 'gemini-2.0-flash-thinking-exp-1219'
    },
    rateLimit: {
      requests: 60,
      window: '1m'
    }
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: 'https://api.openai.com/v1',
    models: {
      gpt4: 'gpt-4o',
      gpt35: 'gpt-3.5-turbo'
    }
  },
  claude: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    baseUrl: 'https://api.anthropic.com/v1',
    models: {
      sonnet: 'claude-3-5-sonnet-20241022',
      haiku: 'claude-3-5-haiku-20241022'
    }
  }
}
```

---

## 🚀 P2: AI統合パターン

### Pattern 1: Gemini統合 (Gen-Studio, CCG)

```typescript
// services/gemini/GeminiService.ts
import { GoogleGenerativeAI } from '@google/generative-ai'

export class GeminiService {
  private client: GoogleGenerativeAI
  private model: any

  constructor(modelName: string = 'gemini-2.0-flash-exp') {
    this.client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    this.model = this.client.getGenerativeModel({ model: modelName })
  }

  async generateContent(prompt: string, options?: GenerationOptions) {
    try {
      const result = await this.retryWithBackoff(async () => {
        return await this.model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: options?.temperature || 0.7,
            topP: options?.topP || 0.9,
            maxOutputTokens: options?.maxTokens || 2048
          }
        })
      })

      return {
        content: result.response.text(),
        usage: result.response.usageMetadata,
        finishReason: result.response.candidates[0]?.finishReason
      }
    } catch (error) {
      throw new AIServiceError(`Gemini API error: ${error.message}`)
    }
  }

  private async retryWithBackoff(fn: Function, maxRetries: number = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn()
      } catch (error) {
        if (i === maxRetries - 1) throw error

        const delay = Math.pow(2, i) * 1000  // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
}
```

### Pattern 2: OpenAI統合 (Course SaaS)

```typescript
// lib/openai/OpenAIService.ts
import OpenAI from 'openai'

export class OpenAIService {
  private client: OpenAI

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }

  async createChatCompletion(
    messages: Array<{ role: string; content: string }>,
    options?: {
      model?: string
      temperature?: number
      maxTokens?: number
      functions?: any[]
    }
  ) {
    try {
      const response = await this.client.chat.completions.create({
        model: options?.model || 'gpt-4o',
        messages,
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 1000,
        functions: options?.functions
      })

      return {
        content: response.choices[0]?.message?.content,
        usage: response.usage,
        functionCall: response.choices[0]?.message?.function_call
      }
    } catch (error) {
      throw new AIServiceError(`OpenAI API error: ${error.message}`)
    }
  }

  async createEmbedding(text: string) {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text
    })

    return response.data[0].embedding
  }
}
```

### Pattern 3: マルチプロバイダー統合

```typescript
// services/ai/AIOrchestrator.ts
export class AIOrchestrator {
  private providers: Map<string, any>

  constructor() {
    this.providers = new Map([
      ['gemini', new GeminiService()],
      ['openai', new OpenAIService()],
      ['claude', new ClaudeService()]
    ])
  }

  async generateContent(
    request: {
      prompt: string
      provider?: string
      options?: any
      fallback?: boolean
    }
  ) {
    const primaryProvider = request.provider || 'gemini'

    try {
      return await this.executeWithProvider(primaryProvider, request)
    } catch (error) {
      if (request.fallback && primaryProvider !== 'openai') {
        console.warn(`Primary provider failed, falling back to OpenAI: ${error.message}`)
        return await this.executeWithProvider('openai', request)
      }
      throw error
    }
  }

  private async executeWithProvider(provider: string, request: any) {
    const service = this.providers.get(provider)
    if (!service) {
      throw new Error(`Provider not found: ${provider}`)
    }

    return await service.generateContent(request.prompt, request.options)
  }
}
```

### Pattern 4: プロンプトテンプレート管理

```typescript
// services/ai/PromptManager.ts
export class PromptManager {
  private templates: Map<string, PromptTemplate>

  constructor() {
    this.loadTemplates()
  }

  private loadTemplates() {
    this.templates = new Map([
      ['content-generation', {
        template: `
You are an expert content creator. Create engaging content based on the following requirements:

Topic: {{topic}}
Audience: {{audience}}
Style: {{style}}
Length: {{length}}

Requirements:
- Use clear, engaging language
- Include practical examples
- Ensure accuracy and relevance
- Format for {{format}}

Generate the content:
        `,
        variables: ['topic', 'audience', 'style', 'length', 'format']
      }],
      ['code-analysis', {
        template: `
Analyze the following code and provide insights:

Code:
\`\`\`{{language}}
{{code}}
\`\`\`

Please analyze for:
1. Code quality and best practices
2. Potential bugs or issues
3. Performance optimizations
4. Security considerations
5. Refactoring suggestions

Provide specific, actionable feedback:
        `,
        variables: ['language', 'code']
      }],
      ['ui-design', {
        template: `
Design a user interface component with the following specifications:

Component Type: {{componentType}}
Purpose: {{purpose}}
User Context: {{userContext}}
Design System: {{designSystem}}

Requirements:
- Responsive design
- Accessibility compliance
- Modern UI patterns
- Clear user flow

Provide detailed design recommendations:
        `,
        variables: ['componentType', 'purpose', 'userContext', 'designSystem']
      }]
    ])
  }

  renderTemplate(templateName: string, variables: Record<string, string>): string {
    const template = this.templates.get(templateName)
    if (!template) {
      throw new Error(`Template not found: ${templateName}`)
    }

    let rendered = template.template
    template.variables.forEach(variable => {
      const value = variables[variable] || ''
      rendered = rendered.replace(new RegExp(`{{${variable}}}`, 'g'), value)
    })

    return rendered
  }
}
```

---

## ⚡ P3: 最適化とベストプラクティス

### レート制限管理

```typescript
// services/ai/RateLimitManager.ts
export class RateLimitManager {
  private limits: Map<string, RateLimit>

  constructor() {
    this.limits = new Map([
      ['gemini', { requests: 60, window: 60000, current: 0, resetTime: 0 }],
      ['openai', { requests: 50, window: 60000, current: 0, resetTime: 0 }],
      ['claude', { requests: 40, window: 60000, current: 0, resetTime: 0 }]
    ])
  }

  async checkLimit(provider: string): Promise<boolean> {
    const limit = this.limits.get(provider)
    if (!limit) return true

    const now = Date.now()

    // Reset if window has passed
    if (now > limit.resetTime) {
      limit.current = 0
      limit.resetTime = now + limit.window
    }

    if (limit.current >= limit.requests) {
      const waitTime = limit.resetTime - now
      await new Promise(resolve => setTimeout(resolve, waitTime))
      return this.checkLimit(provider)
    }

    limit.current++
    return true
  }
}
```

### キャッシュ戦略

```typescript
// services/ai/AICache.ts
export class AICache {
  private cache = new Map<string, CacheEntry>()
  private readonly DEFAULT_TTL = 3600000  // 1時間

  async getCachedResponse(
    prompt: string,
    provider: string,
    options?: any
  ): Promise<any | null> {
    const cacheKey = this.generateCacheKey(prompt, provider, options)
    const cached = this.cache.get(cacheKey)

    if (cached && Date.now() < cached.expiry) {
      return cached.data
    }

    return null
  }

  setCachedResponse(
    prompt: string,
    provider: string,
    response: any,
    options?: any,
    ttl: number = this.DEFAULT_TTL
  ) {
    const cacheKey = this.generateCacheKey(prompt, provider, options)
    this.cache.set(cacheKey, {
      data: response,
      expiry: Date.now() + ttl
    })
  }

  private generateCacheKey(prompt: string, provider: string, options?: any): string {
    return `${provider}:${this.hashString(prompt + JSON.stringify(options || {}))}`
  }

  private hashString(str: string): string {
    // Simple hash function
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash  // Convert to 32bit integer
    }
    return hash.toString(36)
  }
}
```

### コスト最適化

```typescript
// services/ai/CostOptimizer.ts
export class CostOptimizer {
  private readonly COST_PER_1K_TOKENS = {
    'gemini-flash': 0.000075,
    'gemini-pro': 0.00125,
    'gpt-4o': 0.005,
    'gpt-3.5-turbo': 0.0015,
    'claude-sonnet': 0.003
  }

  selectOptimalModel(
    prompt: string,
    requirements: {
      quality?: 'low' | 'medium' | 'high'
      budget?: 'low' | 'medium' | 'high'
      speed?: 'low' | 'medium' | 'high'
    }
  ): { provider: string, model: string } {
    const tokenCount = this.estimateTokenCount(prompt)

    // ルールベース選択
    if (requirements.speed === 'high') {
      return { provider: 'gemini', model: 'gemini-flash' }
    }

    if (requirements.budget === 'low' && tokenCount > 1000) {
      return { provider: 'gemini', model: 'gemini-flash' }
    }

    if (requirements.quality === 'high') {
      return { provider: 'openai', model: 'gpt-4o' }
    }

    // デフォルト：バランス重視
    return { provider: 'gemini', model: 'gemini-pro' }
  }

  estimateCost(tokens: number, model: string): number {
    const rate = this.COST_PER_1K_TOKENS[model] || 0.001
    return (tokens / 1000) * rate
  }

  private estimateTokenCount(text: string): number {
    // 簡易トークン推定（実際のトークナイザーを使用することを推奨）
    return Math.ceil(text.length / 4)
  }
}
```

---

## 📊 AI統合監視とメトリクス

### パフォーマンスメトリクス

| 指標 | 目標値 | 必須値 |
|------|--------|--------|
| **API応答時間** | < 2s | < 5s |
| **成功率** | > 99% | > 95% |
| **月間コスト** | < $100 | < $200 |
| **キャッシュヒット率** | > 30% | > 20% |
| **エラー率** | < 1% | < 5% |

### 監視ダッシュボード

```typescript
// services/ai/AIMonitor.ts
export class AIMonitor {
  private metrics = {
    requests: new Map<string, number>(),
    latencies: new Map<string, number[]>(),
    costs: new Map<string, number>(),
    errors: new Map<string, number>()
  }

  recordRequest(
    provider: string,
    latency: number,
    tokens: number,
    cost: number,
    success: boolean
  ) {
    // リクエスト数
    this.metrics.requests.set(
      provider,
      (this.metrics.requests.get(provider) || 0) + 1
    )

    // レイテンシ
    if (!this.metrics.latencies.has(provider)) {
      this.metrics.latencies.set(provider, [])
    }
    this.metrics.latencies.get(provider)!.push(latency)

    // コスト
    this.metrics.costs.set(
      provider,
      (this.metrics.costs.get(provider) || 0) + cost
    )

    // エラー
    if (!success) {
      this.metrics.errors.set(
        provider,
        (this.metrics.errors.get(provider) || 0) + 1
      )
    }
  }

  generateDashboard() {
    const dashboard = {
      summary: {
        totalRequests: Array.from(this.metrics.requests.values()).reduce((a, b) => a + b, 0),
        totalCost: Array.from(this.metrics.costs.values()).reduce((a, b) => a + b, 0),
        overallErrorRate: this.calculateOverallErrorRate()
      },
      providers: new Map<string, any>()
    }

    for (const [provider] of this.metrics.requests) {
      dashboard.providers.set(provider, {
        requests: this.metrics.requests.get(provider) || 0,
        avgLatency: this.calculateAverageLatency(provider),
        cost: this.metrics.costs.get(provider) || 0,
        errorRate: this.calculateErrorRate(provider)
      })
    }

    return dashboard
  }
}
```

---

## 🛡️ トラブルシューティング

### 共通問題パターン

| 問題 | API | 原因 | 対処 |
|------|-----|------|------|
| Rate Limit | 全般 | API制限超過 | RateLimit管理実装 |
| Timeout | Gemini/OpenAI | ネットワーク遅延 | タイムアウト延長 |
| API Key Error | 全般 | 認証失敗 | API KEY確認 |
| Content Filter | OpenAI/Claude | 内容制限 | プロンプト調整 |
| Token Limit | 全般 | トークン上限 | 入力分割 |

### AI デバッグワークフロー

```bash
# AI統合デバッグ
function debug_ai_integration() {
    echo "🔍 AI Integration Debug"

    # 1. API Key確認
    echo "Checking API keys..."
    [ -n "$GEMINI_API_KEY" ] && echo "✅ Gemini API Key set" || echo "❌ Gemini API Key missing"
    [ -n "$OPENAI_API_KEY" ] && echo "✅ OpenAI API Key set" || echo "❌ OpenAI API Key missing"

    # 2. 接続テスト
    echo "Testing API connections..."
    npm run test:ai:connection

    # 3. プロンプトテスト
    echo "Testing prompt templates..."
    npm run test:ai:prompts

    # 4. パフォーマンステスト
    echo "Testing performance..."
    npm run test:ai:performance

    echo "✅ AI debug complete"
}
```

---

## ✅ 成功基準

| チェック項目 | 基準 |
|-------------|------|
| **API統合** | 全プロバイダー接続成功 |
| **プロンプト応答** | 期待される品質の出力 |
| **パフォーマンス** | 目標レスポンス時間内 |
| **コスト効率** | 予算内でのAPI使用 |
| **エラーハンドリング** | 適切なフォールバック |

### 出力フォーマット

```
🤖 AI/LLM Integration Results

✅ Providers: Gemini ✓, OpenAI ✓, Claude ✓
✅ Response Time: XXX.ms (target: <2s)
✅ Success Rate: XX.X% (target: >99%)
✅ Cost Efficiency: $X.XX/month (target: <$100)
✅ Cache Hit Rate: XX% (target: >30%)

AI Integration ready ✓
```

---

## 🔗 関連ドキュメント

| ドキュメント | 用途 |
|-------------|------|
| `services/ai/README.md` | AI統合ガイド |
| `prompts/templates.ts` | プロンプトテンプレート |
| `.env.example` | 環境変数設定例 |

---

## 📝 関連Skills

- **Frontend Framework**: AI UI統合
- **Database Management**: AI結果保存
- **Testing Framework**: AIテスト自動化
- **Environment Management**: API設定管理
- **Performance Analysis**: AI最適化