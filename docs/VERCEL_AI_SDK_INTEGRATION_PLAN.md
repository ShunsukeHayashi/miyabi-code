# Vercel AI SDK Integration Plan for Issue #428

**Date**: 2025-10-24
**Issue**: #428 - Agent実行UI - 実行ダイアログと進捗表示（MVP完成）
**PR**: #502 (Backend Complete, Frontend Skeleton)
**Status**: 設計フェーズ完了 ✅

---

## 📊 Executive Summary

**Vercel AI SDK**を活用して、Miyabi Agent実行UIを**リアルタイムストリーミング + Generative UI**で実装します。既存のPR #502バックエンド（Rust WebSocket実装）と統合し、**フロントエンド開発時間を50%削減**（8-10時間 → 4-5時間）。

---

## 🎯 Integration Goals

1. **リアルタイムログストリーミング** - Agent実行ログをリアルタイム表示
2. **Generative UI** - Agent状態に応じて動的にUIコンポーネント生成
3. **Claude統合** - Anthropic Claude 3.5 Sonnetとの直接統合
4. **型安全性** - TypeScript完全対応
5. **開発速度** - useChat()フックで実装時間50%削減

---

## 📚 Vercel AI SDK - Key Findings

### Core Architecture

```typescript
// AI SDK Core
import { streamText, generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

// AI SDK UI (React)
import { useChat, useCompletion } from 'ai/react';

// AI SDK RSC (Generative UI - Experimental)
import { streamUI, useUIState, useAIState } from 'ai/rsc';
```

### Key Capabilities

| Feature | 説明 | Miyabi活用例 |
|---------|------|--------------|
| **streamText** | テキストストリーミング | Agent実行ログのリアルタイム表示 |
| **useChat()** | チャットインターフェース | Agent実行ダイアログと状態管理 |
| **Generative UI** | 動的UIコンポーネント生成 | Agent状態に応じたUIレンダリング |
| **Multi-Provider** | 複数AI Provider対応 | Claude, GPT-4, Groq切り替え |
| **TypeScript** | 完全型安全 | Miyabi型システムとの統合 |

---

## 🏗️ Architecture Design

### Current State (PR #502)

**Backend (Rust)**:
```
┌─────────────────────────────────────────┐
│  miyabi-web-api (Rust)                  │
├─────────────────────────────────────────┤
│  POST /api/v1/agents/execute            │
│  GET /api/v1/agents/executions/:id/logs │
│  WebSocket /api/v1/ws?execution_id=:id  │
├─────────────────────────────────────────┤
│  AgentExecutor Service                  │
│  ├─ Async execution (Tokio)             │
│  ├─ Log streaming to DB                 │
│  └─ miyabi CLI integration              │
├─────────────────────────────────────────┤
│  PostgreSQL                             │
│  ├─ agent_executions table              │
│  └─ execution_logs table                │
└─────────────────────────────────────────┘
```

**Frontend (React - Skeleton)**:
```
miyabi-web/src/
├── components/agent/
│   └── ExecuteAgentDialog.tsx          # TODO markers
├── hooks/
│   └── useExecuteAgent.ts              # TODO markers
└── app/dashboard/executions/[id]/
    └── page.tsx                        # TODO markers
```

### Proposed Architecture (Vercel AI SDK)

```
┌─────────────────────────────────────────────────────────────┐
│  Next.js App Router (miyabi-web)                            │
├─────────────────────────────────────────────────────────────┤
│  React Components                                           │
│  ├── ExecuteAgentDialog.tsx    [useChat()]                  │
│  ├── AgentExecutionPanel.tsx   [useUIState()]               │
│  └── LogStreamViewer.tsx       [streamUI()]                 │
├─────────────────────────────────────────────────────────────┤
│  API Routes (Next.js)                                       │
│  ├── /api/agents/execute       [POST]   → Rust Backend     │
│  ├── /api/agents/stream        [POST]   → AI SDK Provider  │
│  └── /api/agents/logs          [GET]    → Rust Backend     │
├─────────────────────────────────────────────────────────────┤
│  Dual Integration                                           │
│  ├── Vercel AI SDK              ├── Rust Backend            │
│  │   └── @ai-sdk/anthropic      │   └── miyabi-web-api     │
│  │       └── Claude 3.5 Sonnet  │       └── WebSocket      │
└─────────────────────────────────────────────────────────────┘
```

---

## 💡 Implementation Strategy

### Phase 1: AI SDK Setup (1-2 hours)

**Install Dependencies**:
```bash
cd miyabi-web
pnpm add ai @ai-sdk/anthropic
```

**Environment Variables** (`.env.local`):
```bash
ANTHROPIC_API_KEY=sk-ant-xxx  # Claude API Key
```

**Basic Configuration**:
```typescript
// lib/ai-config.ts
import { anthropic } from '@ai-sdk/anthropic';

export const aiProvider = anthropic('claude-3-5-sonnet-20240620');
```

### Phase 2: Agent Execution Dialog (2-3 hours)

**Replace Skeleton with AI SDK**:

```typescript
// components/agent/ExecuteAgentDialog.tsx
'use client';

import { useChat } from 'ai/react';
import { useState } from 'react';

interface ExecuteAgentDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ExecuteAgentDialog({ open, onClose }: ExecuteAgentDialogProps) {
  const [issueId, setIssueId] = useState<string>('');
  const [agentType, setAgentType] = useState<string>('coordinator');
  const [options, setOptions] = useState({
    use_worktree: false,
    auto_pr: false,
    slack_notify: false,
  });

  const { messages, append, isLoading, status } = useChat({
    api: '/api/agents/execute',
    body: { issueId, agentType, options },
  });

  const handleExecute = async () => {
    await append({
      role: 'user',
      content: `Execute ${agentType} agent for issue #${issueId}`,
    });
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent>
        <h2>Execute Agent</h2>

        {/* Issue Selection */}
        <Select value={issueId} onChange={setIssueId}>
          <option value="">Select Issue</option>
          {/* TODO: Fetch issues from API */}
        </Select>

        {/* Agent Type */}
        <Select value={agentType} onChange={setAgentType}>
          <option value="coordinator">Coordinator</option>
          <option value="codegen">CodeGen</option>
          <option value="review">Review</option>
        </Select>

        {/* Options */}
        <Checkbox
          checked={options.use_worktree}
          onChange={(e) => setOptions({ ...options, use_worktree: e.target.checked })}
        >
          Enable Worktree Parallel Execution
        </Checkbox>

        {/* Execution Button */}
        <Button onClick={handleExecute} disabled={isLoading || !issueId}>
          {isLoading ? 'Executing...' : 'Execute Agent'}
        </Button>

        {/* Real-time Log Display */}
        {messages.length > 0 && (
          <div className="log-viewer">
            {messages.map((msg) => (
              <LogEntry key={msg.id} message={msg.content} />
            ))}
          </div>
        )}

        {/* Status Display */}
        <StatusBadge status={status} />
      </DialogContent>
    </Dialog>
  );
}
```

**API Route** (`app/api/agents/execute/route.ts`):

```typescript
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const { messages, issueId, agentType, options } = await req.json();

  // Call Rust backend to start execution
  const executionResponse = await fetch(`http://localhost:8080/api/v1/agents/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ issue_id: issueId, agent_type: agentType, options }),
  });

  const { execution_id } = await executionResponse.json();

  // Stream logs from Rust WebSocket to frontend via AI SDK
  const result = await streamText({
    model: anthropic('claude-3-5-sonnet-20240620'),
    messages: [
      {
        role: 'system',
        content: `You are monitoring Agent execution ${execution_id}. Stream execution logs.`,
      },
      ...messages,
    ],
    // Custom stream from Rust WebSocket
    async onStream({ textDelta }) {
      // Connect to Rust WebSocket
      const ws = new WebSocket(`ws://localhost:8080/api/v1/ws?execution_id=${execution_id}`);

      ws.onmessage = (event) => {
        const log = JSON.parse(event.data);
        textDelta(log.message); // Stream to frontend
      };
    },
  });

  return result.toAIStreamResponse();
}
```

### Phase 3: Execution Status Page (2-3 hours)

**Generative UI Implementation**:

```typescript
// app/dashboard/executions/[id]/page.tsx
'use client';

import { useUIState, useAIState, streamUI } from 'ai/rsc';
import { useEffect } from 'react';

export default function ExecutionStatusPage({ params }: { params: { id: string } }) {
  const [uiState, setUIState] = useUIState();
  const [aiState] = useAIState();

  useEffect(() => {
    // Fetch execution status from Rust backend
    fetch(`/api/agents/executions/${params.id}/logs`)
      .then((res) => res.json())
      .then((data) => {
        // Generate dynamic UI based on execution status
        streamUI({
          model: anthropic('claude-3-5-sonnet-20240620'),
          messages: [
            {
              role: 'system',
              content: `Generate UI components for Agent execution status: ${data.status}`,
            },
          ],
          onUIComponent: (component) => {
            setUIState((prev) => [...prev, component]);
          },
        });
      });
  }, [params.id]);

  return (
    <div className="execution-status-page">
      <h1>Execution #{params.id}</h1>

      {/* Dynamic UI Components Generated by AI */}
      <div className="dynamic-ui">
        {uiState.map((component, idx) => (
          <div key={idx}>{component}</div>
        ))}
      </div>

      {/* Static Status Display */}
      <ExecutionStatusCard executionId={params.id} />

      {/* Log Viewer */}
      <LogStreamViewer executionId={params.id} />
    </div>
  );
}
```

### Phase 4: Integration Testing (1-2 hours)

**Test Cases**:
1. Agent実行ダイアログからの実行
2. リアルタイムログストリーミング
3. 実行ステータス更新
4. WebSocket接続エラーハンドリング
5. Claude APIエラーハンドリング

---

## 🔀 Integration with Existing PR #502

### Changes Required

| File | Change | Reason |
|------|--------|--------|
| `ExecuteAgentDialog.tsx` | Replace skeleton with `useChat()` | AI SDK統合 |
| `useExecuteAgent.ts` | Simplify to AI SDK wrapper | Hook簡素化 |
| `app/api/agents/execute/route.ts` | **New File** | AI SDK API Route |
| `page.tsx` | Add `streamUI()` | Generative UI |
| `package.json` | Add `ai`, `@ai-sdk/anthropic` | Dependencies |

### Backward Compatibility

**Rust Backend**: No changes required ✅
- PR #502のWebSocket実装はそのまま使用
- AI SDKはRust APIの**ラッパー**として機能

**Database**: No changes required ✅
- `agent_executions`, `execution_logs`テーブルは既存のまま

---

## 📊 Implementation Roadmap

| Phase | Task | Time | Status |
|-------|------|------|--------|
| **Phase 0** | Vercel AI SDK調査・設計 | 2h | ✅ Complete |
| **Phase 1** | AI SDK Setup | 1-2h | ⏳ Pending |
| **Phase 2** | ExecuteAgentDialog実装 | 2-3h | ⏳ Pending |
| **Phase 3** | ExecutionStatusPage実装 | 2-3h | ⏳ Pending |
| **Phase 4** | Integration Testing | 1-2h | ⏳ Pending |
| **Phase 5** | PR #502 Rebase & Merge | 1-2h | ⏳ Pending |

**Total Estimated Time**: 9-14 hours
**Original Estimate (without AI SDK)**: 18-20 hours
**Time Saved**: **40-50%** ⚡

---

## 🎯 Success Criteria

- [x] Vercel AI SDK調査完了
- [ ] AI SDK導入完了
- [ ] Agent実行ダイアログ動作
- [ ] リアルタイムログストリーミング動作
- [ ] Generative UI動作
- [ ] PR #502とマージ可能
- [ ] **MVP完成 - 9社向けデモ準備完了** ✅

---

## 🔗 References

### Vercel AI SDK Documentation
- **Main Docs**: https://ai-sdk.dev/docs
- **Anthropic Provider**: https://ai-sdk.dev/providers/ai-sdk-providers/anthropic
- **useChat() Hook**: https://ai-sdk.dev/docs/ai-sdk-ui/chatbot
- **Generative UI**: https://ai-sdk.dev/docs/ai-sdk-rsc/generative-ui
- **Examples**: https://ai-sdk.dev/examples

### Miyabi Documentation
- **Issue #428**: Phase 3 Agent実行UI
- **PR #502**: Backend + Frontend Skeleton
- **MILESTONE_34_FINAL_SUMMARY.md**: Milestone 34完了報告

---

## 💡 Key Insights

### Why Vercel AI SDK?

1. **開発速度**: useChat()フックで**50%時間削減**
2. **リアルタイム**: ストリーミングがビルトイン
3. **Generative UI**: Agent状態に応じた動的UI生成
4. **型安全**: TypeScript完全対応
5. **Claude統合**: Anthropic公式サポート

### Integration Pattern

```
User Action → Next.js API Route → Rust Backend (miyabi-web-api)
                ↓                        ↓
           AI SDK Stream ← WebSocket Logs
                ↓
         React Component (useChat)
```

**ハイブリッドアーキテクチャ**: AI SDKのストリーミングUIと、Rustバックエンドの堅牢性を両立 🎯

---

**Generated**: 2025-10-24
**Status**: 設計完了 ✅ | 実装準備完了 🚀

🤖 Generated with [Claude Code](https://claude.com/claude-code)
