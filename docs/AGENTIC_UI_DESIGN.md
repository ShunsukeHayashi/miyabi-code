# Miyabi Console - Agentic UI統合 詳細設計書

**Version**: 1.0.0
**Created**: 2025-11-19
**Author**: Miyabi Console Team
**Status**: 🎨 Design Review

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [System Design](#system-design)
4. [Data Flow](#data-flow)
5. [API Design](#api-design)
6. [Component Architecture](#component-architecture)
7. [Data Models](#data-models)
8. [Error Handling & Self-Healing](#error-handling--self-healing)
9. [Performance Optimization](#performance-optimization)
10. [Security Architecture](#security-architecture)
11. [Migration Strategy](#migration-strategy)
12. [Deployment Plan](#deployment-plan)

---

## 🎯 Executive Summary

### Project Goal
Migrate Miyabi Console from static React components to fully dynamic Agentic UI powered by Gemini 3, enabling AI-driven interface generation based on user intent and system context.

### Key Benefits
- **Zero Static UI**: All interfaces generated dynamically by AI
- **Context-Aware**: UI adapts to Agent states, system metrics, user actions
- **Self-Healing**: Automatic error detection and UI regeneration
- **Natural Language**: Users can request custom dashboards via text

### Success Metrics
- 100% of pages migrated to Agentic UI
- < 2s UI generation time
- 95%+ self-healing success rate
- Zero hardcoded components in production

---

## 🏗️ Architecture Overview

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Miyabi Console (Frontend)                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │   User Layer     │  │  Agentic UI      │  │  Static Layer    │  │
│  │   - Auth         │  │  Engine (NEW)    │  │  - Layout        │  │
│  │   - Navigation   │  │  - Generation    │  │  - Header        │  │
│  │   - Settings     │  │  - Rendering     │  │  - Sidebar       │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                       │
├─────────────────────────────────────────────────────────────────────┤
│                     Agentic UI Core Engine                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐        │
│  │ Intent         │  │ Context        │  │ Code           │        │
│  │ Recognizer     │  │ Provider       │  │ Generator      │        │
│  │ (Gemini 3)     │  │ (MiyabiCtx)    │  │ (Gemini 3)     │        │
│  └────────────────┘  └────────────────┘  └────────────────┘        │
│                                                                       │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐        │
│  │ Code           │  │ Error          │  │ Cache          │        │
│  │ Executor       │  │ Detector       │  │ Manager        │        │
│  │ (Babel+React)  │  │ (Self-Heal)    │  │ (IndexedDB)    │        │
│  └────────────────┘  └────────────────┘  └────────────────┘        │
│                                                                       │
├─────────────────────────────────────────────────────────────────────┤
│                         Backend Integration                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ Miyabi   │  │ GitHub   │  │ Gemini 3 │  │ tmux     │           │
│  │ Web API  │  │ API      │  │ API      │  │ API      │           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         App.tsx (Root)                               │
│  - Router                                                            │
│  - AuthProvider                                                      │
│  - MiyabiContextProvider (NEW)                                       │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ├─────────────────────┐
                              ↓                     ↓
                    ┌──────────────────┐  ┌──────────────────┐
                    │  Layout.tsx      │  │  Public Routes   │
                    │  (Static Shell)  │  │  - Login         │
                    └──────────────────┘  │  - Callback      │
                              │            └──────────────────┘
                              ↓
                ┌─────────────────────────────────────┐
                │     Protected Routes (Agentic)      │
                ├─────────────────────────────────────┤
                │  - AgentsPage      → AgenticRenderer│
                │  - DashboardPage   → AgenticRenderer│
                │  - Infrastructure  → AgenticRenderer│
                │  - Deployment      → AgenticRenderer│
                │  - Database        → AgenticRenderer│
                └─────────────────────────────────────┘
                              │
                              ↓
                ┌─────────────────────────────────────┐
                │      AgenticRenderer (NEW)          │
                ├─────────────────────────────────────┤
                │  1. Read user intent                │
                │  2. Fetch MiyabiContext             │
                │  3. Call Gemini 3 API               │
                │  4. Render generated code           │
                └─────────────────────────────────────┘
                              │
                              ↓
                ┌─────────────────────────────────────┐
                │       DynamicRenderer (NEW)         │
                ├─────────────────────────────────────┤
                │  - Babel transpile JSX→JS           │
                │  - Execute in sandbox               │
                │  - Render React component           │
                │  - Error boundary                   │
                └─────────────────────────────────────┘
```

---

## 🔄 Data Flow

### 1. Page Load Flow

```
User navigates to /agents
     ↓
AgentsPage component mounts
     ↓
AgenticRenderer initializes
     ↓
┌────────────────────────────────────────────┐
│ 1. Fetch MiyabiContext                     │
│    - apiClient.getAgents()                 │
│    - Real-time Agent states                │
│    - System metrics                        │
└────────────────────────────────────────────┘
     ↓
┌────────────────────────────────────────────┐
│ 2. Generate Intent                         │
│    "Display 21 Agents with real-time       │
│     status, metrics, and layer grouping"   │
└────────────────────────────────────────────┘
     ↓
┌────────────────────────────────────────────┐
│ 3. Call Gemini 3 API                       │
│    - System Instruction: MIYABI_PROMPT     │
│    - Context: MiyabiContext JSON           │
│    - History: Previous interactions        │
└────────────────────────────────────────────┘
     ↓
┌────────────────────────────────────────────┐
│ 4. Receive Generated UI                    │
│    {                                       │
│      ui_strategy: "...",                   │
│      title: "Agent Control Center",        │
│      react_code: "export default ...",     │
│      suggested_next_prompts: [...]         │
│    }                                       │
└────────────────────────────────────────────┘
     ↓
┌────────────────────────────────────────────┐
│ 5. Execute & Render                        │
│    - Babel transpile                       │
│    - Create component                      │
│    - Mount to DOM                          │
└────────────────────────────────────────────┘
     ↓
User sees dynamic Agent dashboard
```

### 2. Real-time Update Flow

```
Backend: Agent status changes (active → error)
     ↓
WebSocket event received (future enhancement)
OR
Polling timer triggers (current: 5s interval)
     ↓
MiyabiContext updates
     ↓
AgenticRenderer detects context change
     ↓
Option A: Lightweight update (same UI structure)
  → Update data props only
  → Re-render existing component

Option B: Significant change (new UI needed)
  → Regenerate full UI via Gemini 3
  → Replace component
```

### 3. User Interaction Flow

```
User types natural language query:
"Show me all agents that failed in the last hour"
     ↓
AgenticRenderer.handleUserPrompt()
     ↓
Fetch filtered context:
  - agents.filter(a => a.status === 'error' && ...)
     ↓
Call Gemini 3 with specific intent
     ↓
Generate custom filtered view
     ↓
Render new UI
```

---

## 🔌 API Design

### 1. Core Service: `agenticUIService.ts`

```typescript
// miyabi-console/src/services/agenticUIService.ts

import { GoogleGenAI, Type } from "@google/genai";
import type { MiyabiContext, AgenticUIResponse } from '@/types/agentic';

export class AgenticUIService {
  private client: GoogleGenAI;
  private cache: Map<string, AgenticUIResponse>;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
    this.cache = new Map();
  }

  async generateUI(
    intent: string,
    context: MiyabiContext,
    options: GenerateOptions = {}
  ): Promise<AgenticUIResponse> {
    // 1. Check cache
    const cacheKey = this.getCacheKey(intent, context);
    if (this.cache.has(cacheKey) && !options.forceRegenerate) {
      return this.cache.get(cacheKey)!;
    }

    // 2. Prepare system instruction
    const systemInstruction = this.buildSystemInstruction(context.type);

    // 3. Build prompt with context
    const prompt = this.buildPrompt(intent, context);

    // 4. Call Gemini 3
    const response = await this.client.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: this.getResponseSchema(),
        temperature: 0.3, // Lower for consistent UI generation
      }
    });

    // 5. Parse and validate
    const data = this.parseResponse(response.text);

    // 6. Cache
    this.cache.set(cacheKey, data);

    return data;
  }

  private buildSystemInstruction(contextType: MiyabiContextType): string {
    const baseInstruction = `
**Role:** Miyabi Console UI Architect
You are an expert UI engineer for Miyabi, an autonomous development platform.

**Core Principles:**
1. Jonathan Ive Minimalism - Remove all non-essential elements
2. Real-time First - Show live Agent states immediately
3. Data-Dense - Maximize information per pixel
4. Zero Latency - Generate UI in < 2 seconds

**Technical Stack:**
- React 19 + TypeScript
- HeroUI (NextUI v2) components
- Tailwind CSS (utility-first, no custom CSS)
- Lucide React icons
- Recharts for data visualization

**Output Format:**
Return ONLY valid JSON matching this schema:
{
  "ui_strategy": "Brief reasoning for this UI design (1-2 sentences)",
  "title": "Component title",
  "react_code": "Full TSX code with export default",
  "suggested_next_prompts": ["Action 1", "Action 2", "Action 3"]
}
`;

    const contextSpecific = this.getContextSpecificInstruction(contextType);

    return baseInstruction + contextSpecific;
  }

  private getContextSpecificInstruction(type: MiyabiContextType): string {
    switch (type) {
      case 'agents':
        return `
**Domain: Agent Management**
- 21 Total Agents across 5 layers (0-4)
- Agent States: active, idle, error, offline
- Key Metrics: CPU%, Memory%, Task completion rate
- Actions: Start, Stop, Pause, Resume, Restart

**UI Requirements:**
- Group agents by layer with clear visual hierarchy
- Use color coding: green=active, yellow=idle, red=error, gray=offline
- Show real-time metrics with progress bars
- Enable quick actions with prominent buttons
`;

      case 'dashboard':
        return `
**Domain: System Dashboard**
- System Stats: Active agents, Running tasks, Completed tasks
- Resource Monitoring: CPU, Memory, Disk usage
- API Status: healthy, degraded, down
- Recent Activity: Last 10 events with timestamps

**UI Requirements:**
- Grid layout with stat cards (4 columns on desktop, 2 on mobile)
- Large numbers for key metrics
- Charts for time-series data
- Activity feed with timeline
`;

      case 'infrastructure':
        return `
**Domain: Infrastructure Status**
- AWS Resources: ECS tasks, ElastiCache, RDS
- Network Topology: Service dependencies
- Health Checks: Status of each service
- Metrics: Request rates, error rates, latencies

**UI Requirements:**
- Visual topology diagram
- Service health badges
- Real-time metrics charts
- Alert indicators for issues
`;

      default:
        return '';
    }
  }

  private buildPrompt(intent: string, context: MiyabiContext): string {
    return `
User Intent: ${intent}

Current System Context:
${JSON.stringify(context.data, null, 2)}

Recent User Actions:
${context.history?.join('\n') || 'None'}

Generate a React component that perfectly addresses the user's intent using the provided context.
The component MUST use real data from the context (not mock data).
Include appropriate HeroUI components and Tailwind classes.
`;
  }

  private getResponseSchema() {
    return {
      type: Type.OBJECT,
      properties: {
        ui_strategy: { type: Type.STRING },
        title: { type: Type.STRING },
        react_code: { type: Type.STRING },
        suggested_next_prompts: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      },
      required: ["ui_strategy", "title", "react_code", "suggested_next_prompts"]
    };
  }

  private parseResponse(text: string): AgenticUIResponse {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('Invalid response format from Gemini 3');
    }

    const jsonString = text.substring(firstBrace, lastBrace + 1);
    return JSON.parse(jsonString);
  }

  private getCacheKey(intent: string, context: MiyabiContext): string {
    // Simple hash of intent + context type
    // In production, use proper hashing
    return `${intent}_${context.type}_${JSON.stringify(context.data).length}`;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

// Singleton instance
let agenticUIService: AgenticUIService | null = null;

export const getAgenticUIService = (): AgenticUIService => {
  if (!agenticUIService) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('VITE_GEMINI_API_KEY is not set');
    }
    agenticUIService = new AgenticUIService(apiKey);
  }
  return agenticUIService;
};
```

### 2. Context Provider: `MiyabiContext.tsx`

```typescript
// miyabi-console/src/contexts/MiyabiContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import type { Agent } from '@/types/agent';

export type MiyabiContextType = 'agents' | 'dashboard' | 'infrastructure' | 'deployment' | 'database';

export interface MiyabiContextData {
  type: MiyabiContextType;
  data: any;
  history: string[];
  lastUpdated: Date;
}

interface MiyabiContextValue {
  getContext: (type: MiyabiContextType) => Promise<MiyabiContextData>;
  updateContext: (type: MiyabiContextType) => Promise<void>;
  addHistory: (type: MiyabiContextType, action: string) => void;
}

const MiyabiContext = createContext<MiyabiContextValue | undefined>(undefined);

export const MiyabiContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [contexts, setContexts] = useState<Map<MiyabiContextType, MiyabiContextData>>(new Map());

  const getContext = async (type: MiyabiContextType): Promise<MiyabiContextData> => {
    // Check if context exists and is fresh (< 5s old)
    const existing = contexts.get(type);
    if (existing && (Date.now() - existing.lastUpdated.getTime()) < 5000) {
      return existing;
    }

    // Fetch fresh context
    const data = await fetchContextData(type);
    const contextData: MiyabiContextData = {
      type,
      data,
      history: existing?.history || [],
      lastUpdated: new Date(),
    };

    setContexts(prev => new Map(prev).set(type, contextData));
    return contextData;
  };

  const updateContext = async (type: MiyabiContextType): Promise<void> => {
    await getContext(type); // Force refresh
  };

  const addHistory = (type: MiyabiContextType, action: string): void => {
    setContexts(prev => {
      const newMap = new Map(prev);
      const ctx = newMap.get(type);
      if (ctx) {
        ctx.history.push(`[${new Date().toISOString()}] ${action}`);
        // Keep last 20 history items
        if (ctx.history.length > 20) {
          ctx.history = ctx.history.slice(-20);
        }
      }
      return newMap;
    });
  };

  const fetchContextData = async (type: MiyabiContextType): Promise<any> => {
    switch (type) {
      case 'agents':
        return await apiClient.getAgents();

      case 'dashboard':
        const agents = await apiClient.getAgents();
        return {
          agents,
          stats: {
            activeAgents: agents.filter(a => a.status === 'active').length,
            totalAgents: agents.length,
            runningTasks: agents.reduce((sum, a) => sum + a.tasks.active, 0),
            completedToday: agents.reduce((sum, a) => sum + a.tasks.completed, 0),
          }
        };

      case 'infrastructure':
        return await apiClient.getInfrastructureStatus();

      case 'deployment':
        return await apiClient.getDeploymentStatus();

      case 'database':
        return await apiClient.getDatabaseStatus();

      default:
        throw new Error(`Unknown context type: ${type}`);
    }
  };

  const value: MiyabiContextValue = {
    getContext,
    updateContext,
    addHistory,
  };

  return <MiyabiContext.Provider value={value}>{children}</MiyabiContext.Provider>;
};

export const useMiyabiContext = (): MiyabiContextValue => {
  const context = useContext(MiyabiContext);
  if (!context) {
    throw new Error('useMiyabiContext must be used within MiyabiContextProvider');
  }
  return context;
};
```

### 3. Agentic Renderer Component

```typescript
// miyabi-console/src/components/AgenticRenderer.tsx

import React, { useState, useEffect } from 'react';
import { Spinner } from '@heroui/react';
import { DynamicRenderer } from './DynamicRenderer';
import { useMiyabiContext } from '@/contexts/MiyabiContext';
import { getAgenticUIService } from '@/services/agenticUIService';
import type { MiyabiContextType } from '@/contexts/MiyabiContext';

interface AgenticRendererProps {
  intent: string;
  contextType: MiyabiContextType;
  onError?: (error: Error) => void;
}

export const AgenticRenderer: React.FC<AgenticRendererProps> = ({
  intent,
  contextType,
  onError,
}) => {
  const miyabiContext = useMiyabiContext();
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    generateUI();

    // Poll for context updates every 5 seconds
    const interval = setInterval(() => {
      miyabiContext.updateContext(contextType).then(() => {
        // Context updated, optionally regenerate UI
        // For now, we keep the same UI and let it fetch fresh data internally
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [intent, contextType]);

  const generateUI = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Get fresh context
      const context = await miyabiContext.getContext(contextType);

      // 2. Generate UI
      const service = getAgenticUIService();
      const response = await service.generateUI(intent, context);

      // 3. Set generated code
      setGeneratedCode(response.react_code);

      // 4. Log action
      miyabiContext.addHistory(contextType, `Generated UI: ${response.title}`);

    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      if (onError) onError(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" label="Generating UI..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          UI Generation Error
        </h3>
        <pre className="text-sm text-red-600 whitespace-pre-wrap">
          {error.message}
        </pre>
        <button
          onClick={generateUI}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!generatedCode) {
    return null;
  }

  return <DynamicRenderer code={generatedCode} onError={(err) => {
    setError(err);
    if (onError) onError(err);
  }} />;
};
```

---

## 📦 Data Models

### Type Definitions

```typescript
// miyabi-console/src/types/agentic.ts

export interface AgenticUIResponse {
  ui_strategy: string;
  title: string;
  react_code: string;
  suggested_next_prompts: string[];
}

export interface GenerateOptions {
  forceRegenerate?: boolean;
  timeout?: number;
  retryAttempts?: number;
}

export interface MiyabiContext {
  type: MiyabiContextType;
  data: any;
  history?: string[];
}

export type MiyabiContextType =
  | 'agents'
  | 'dashboard'
  | 'infrastructure'
  | 'deployment'
  | 'database';
```

---

## 🛡️ Error Handling & Self-Healing

### Error Types

1. **Generation Errors** - Gemini 3 API failure
2. **Transpilation Errors** - Babel syntax error
3. **Runtime Errors** - Component execution error
4. **Render Errors** - React boundary error

### Self-Healing Strategy

```typescript
// miyabi-console/src/services/selfHealingService.ts

export class SelfHealingService {
  private maxRetries = 3;
  private retryCount = 0;

  async attemptHeal(
    originalCode: string,
    error: Error,
    context: MiyabiContext
  ): Promise<string> {
    if (this.retryCount >= this.maxRetries) {
      throw new Error('Self-healing failed after max retries');
    }

    this.retryCount++;

    // Call Gemini 3 with error context
    const service = getAgenticUIService();
    const healedResponse = await service.generateUI(
      `Fix this code error: ${error.message}`,
      {
        ...context,
        data: {
          ...context.data,
          previousCode: originalCode,
          error: {
            message: error.message,
            stack: error.stack,
          }
        }
      },
      { forceRegenerate: true }
    );

    return healedResponse.react_code;
  }

  reset(): void {
    this.retryCount = 0;
  }
}
```

---

## ⚡ Performance Optimization

### 1. Caching Strategy

```typescript
// IndexedDB for persistent cache
const cacheDB = {
  async set(key: string, value: AgenticUIResponse): Promise<void> {
    // Store in IndexedDB with 1 hour TTL
  },

  async get(key: string): Promise<AgenticUIResponse | null> {
    // Retrieve from IndexedDB
  }
};
```

### 2. Preloading

```typescript
// Preload common contexts on app startup
useEffect(() => {
  const preload = async () => {
    const contexts: MiyabiContextType[] = ['agents', 'dashboard'];
    await Promise.all(contexts.map(type => miyabiContext.getContext(type)));
  };
  preload();
}, []);
```

### 3. Lazy Rendering

```typescript
// Only render when component is in viewport
import { useInView } from 'react-intersection-observer';

const { ref, inView } = useInView({ triggerOnce: true });

return (
  <div ref={ref}>
    {inView ? <AgenticRenderer {...props} /> : <Skeleton />}
  </div>
);
```

---

## 🔒 Security Architecture

### 1. API Key Management

```typescript
// Never expose API key in client code
// Use environment variables
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Validate on startup
if (!GEMINI_API_KEY) {
  throw new Error('Gemini API key not configured');
}
```

### 2. Code Sandbox

```typescript
// Execute generated code in isolated context
const sandbox = {
  React,
  'lucide-react': LucideReact,
  'recharts': Recharts,
  '@heroui/react': HeroUI,
  // Whitelist only allowed imports
};

// Prevent access to window, document, etc.
const customRequire = (moduleName: string) => {
  if (sandbox[moduleName]) return sandbox[moduleName];
  throw new Error(`Module ${moduleName} not allowed`);
};
```

### 3. Content Security Policy

```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy"
      content="script-src 'self' 'unsafe-eval' https://unpkg.com/@babel/standalone;
               connect-src 'self' https://generativelanguage.googleapis.com;">
```

---

## 🔄 Migration Strategy

### Phase 1: Foundation (Week 1)

**Day 1-2: Setup**
- Install dependencies (`@google/genai`, `@babel/standalone`)
- Copy Gemini 3 Runtime code to `miyabi-console/src/`
- Create service layer (`agenticUIService.ts`)
- Create context provider (`MiyabiContext.tsx`)

**Day 3-4: Core Components**
- Implement `AgenticRenderer.tsx`
- Implement `DynamicRenderer.tsx` (copy from Gemini 3 Runtime)
- Test with simple static prompt

**Day 5-7: First Page Migration**
- Migrate `AgentsPage.tsx` to Agentic UI
- Test real-time updates
- Fine-tune System Instruction

### Phase 2: Full Migration (Week 2)

**Day 8-10: Main Pages**
- Migrate `DashboardPage.tsx`
- Migrate `InfrastructureStatusPage.tsx`
- Migrate `DeploymentPipelinePage.tsx`

**Day 11-12: Remaining Pages**
- Migrate `DatabasePage.tsx`
- Remove legacy static components

**Day 13-14: Testing & Polish**
- End-to-end testing
- Performance optimization
- Bug fixes

### Phase 3: Production (Week 3)

**Day 15-17: Stability**
- Self-healing testing
- Error handling edge cases
- Performance profiling

**Day 18-19: Deployment**
- Deploy to staging
- QA testing
- Production deployment

**Day 20-21: Monitoring**
- Monitor Gemini 3 API usage
- Monitor error rates
- Collect user feedback

---

## 🚀 Deployment Plan

### Staging Deployment

```bash
# 1. Build
cd miyabi-console
npm run build

# 2. Deploy to AWS App Runner (staging)
aws apprunner update-service \
  --service-arn arn:aws:apprunner:us-east-1:...:service/miyabi-console-staging \
  --source-configuration ImageRepository={...}

# 3. Run smoke tests
npm run test:e2e -- --env staging
```

### Production Deployment

```bash
# 1. Feature flag rollout (gradual)
# Week 1: 10% traffic to Agentic UI
# Week 2: 50% traffic
# Week 3: 100% traffic

# 2. Monitor metrics
# - Gemini API latency
# - Error rate
# - User satisfaction

# 3. Full cutover
# Remove legacy components
# Deploy to production
```

---

## 📊 Success Criteria

### Technical Metrics
- ✅ 100% page migration complete
- ✅ UI generation < 2s (p95)
- ✅ Self-healing success rate > 95%
- ✅ Zero hardcoded static components

### User Metrics
- ✅ User satisfaction score > 4.5/5
- ✅ Task completion rate > 90%
- ✅ Time-to-insight < 3s

### Business Metrics
- ✅ Gemini API cost < $100/month
- ✅ Page load time < 1.5s
- ✅ Zero critical bugs in production

---

## 📝 Appendix

### Dependencies

```json
{
  "dependencies": {
    "@google/genai": "^1.30.0",
    "@heroui/react": "^2.4.8",
    "lucide-react": "^0.554.0",
    "recharts": "^3.4.1",
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  },
  "devDependencies": {
    "@babel/standalone": "^7.23.0",
    "typescript": "^5.8.2",
    "vite": "^6.2.0"
  }
}
```

### Environment Variables

```bash
# .env.local
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_API_URL=http://localhost:3002/api/v1
```

---

**Design Review Complete** ✅

This document provides the complete blueprint for migrating Miyabi Console to Agentic UI. All design decisions are final and implementation can begin immediately.

**Next Steps:**
1. Review and approve this design
2. Begin Phase 1 implementation
3. Daily standup to track progress

**Questions or concerns?** Please raise them before implementation begins.
