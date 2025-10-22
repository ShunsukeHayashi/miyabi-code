# Miyabi Web UI - WebSocket API Specification

**Version**: 1.0  
**WebSocket URL**: `wss://api.miyabi.dev/ws` (Production) | `ws://localhost:3001/ws` (Development)  
**Protocol**: WebSocket (RFC 6455)  
**Authentication**: Query Parameter JWT

---

## Table of Contents

1. [Connection](#connection)
2. [Authentication](#authentication)
3. [Message Format](#message-format)
4. [Client → Server Messages](#client--server-messages)
5. [Server → Client Events](#server--client-events)
6. [Connection Management](#connection-management)
7. [Error Handling](#error-handling)

---

## Connection

### Establishing Connection

```javascript
const token = localStorage.getItem('token');
const ws = new WebSocket(`wss://api.miyabi.dev/ws?token=${token}`);

ws.onopen = (event) => {
  console.log('WebSocket connected');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = (event) => {
  console.log('WebSocket disconnected:', event.code, event.reason);
};
```

---

## Authentication

### Query Parameter Authentication

**URL Format**:
```
wss://api.miyabi.dev/ws?token=<JWT_TOKEN>
```

### Connection Accepted

Upon successful authentication, the server sends a `connected` event:

```json
{
  "type": "connected",
  "connectionId": "conn_550e8400-e29b-41d4-a716-446655440000",
  "user": {
    "id": "user-uuid",
    "githubUsername": "ShunsukeHayashi"
  },
  "timestamp": "2025-10-22T10:00:00Z"
}
```

### Connection Rejected

If authentication fails, the server closes the connection with code `4001`:

```json
{
  "code": 4001,
  "reason": "Unauthorized: Invalid or expired token"
}
```

---

## Message Format

All messages are JSON objects with a `type` field:

```typescript
interface WebSocketMessage {
  type: string;
  [key: string]: any;
}
```

---

## Client → Server Messages

### 1. Ping (Heartbeat)

**Type**: `ping`

**Purpose**: Keep connection alive

**Request**:
```json
{
  "type": "ping"
}
```

**Response**:
```json
{
  "type": "pong",
  "timestamp": "2025-10-22T10:00:00Z"
}
```

**Frequency**: Every 30 seconds recommended

---

### 2. Subscribe to Agent Execution

**Type**: `subscribe`

**Purpose**: Subscribe to specific agent execution updates

**Request**:
```json
{
  "type": "subscribe",
  "channel": "agent-execution",
  "executionId": "exec-uuid-1"
}
```

**Response**:
```json
{
  "type": "subscribed",
  "channel": "agent-execution",
  "executionId": "exec-uuid-1"
}
```

---

### 3. Unsubscribe from Agent Execution

**Type**: `unsubscribe`

**Request**:
```json
{
  "type": "unsubscribe",
  "channel": "agent-execution",
  "executionId": "exec-uuid-1"
}
```

**Response**:
```json
{
  "type": "unsubscribed",
  "channel": "agent-execution",
  "executionId": "exec-uuid-1"
}
```

---

## Server → Client Events

### 1. Agent Execution Started

**Type**: `agent.started`

**Description**: Sent when an agent execution begins

**Payload**:
```json
{
  "type": "agent.started",
  "executionId": "exec-uuid-1",
  "agentType": "CodeGen",
  "issueNumber": 270,
  "timestamp": "2025-10-22T10:00:00Z"
}
```

---

### 2. Agent Execution Progress

**Type**: `agent.progress`

**Description**: Sent periodically during agent execution

**Payload**:
```json
{
  "type": "agent.progress",
  "executionId": "exec-uuid-1",
  "progress": 50,
  "currentStep": "コード生成中...",
  "timestamp": "2025-10-22T10:02:30Z"
}
```

**Fields**:
- `progress`: Integer 0-100 (percentage)
- `currentStep`: Human-readable description of current step

---

### 3. Agent Execution Completed

**Type**: `agent.completed`

**Description**: Sent when agent execution completes successfully

**Payload**:
```json
{
  "type": "agent.completed",
  "executionId": "exec-uuid-1",
  "agentType": "CodeGen",
  "result": {
    "prNumber": 145,
    "qualityScore": 95,
    "filesChanged": 3,
    "linesAdded": 250,
    "linesDeleted": 10
  },
  "timestamp": "2025-10-22T10:05:00Z"
}
```

---

### 4. Agent Execution Failed

**Type**: `agent.failed`

**Description**: Sent when agent execution fails

**Payload**:
```json
{
  "type": "agent.failed",
  "executionId": "exec-uuid-1",
  "agentType": "CodeGen",
  "errorMessage": "コンパイルエラー: missing semicolon at line 42",
  "errorCode": "COMPILATION_ERROR",
  "timestamp": "2025-10-22T10:03:00Z"
}
```

---

### 5. Agent Execution Log

**Type**: `agent.log`

**Description**: Real-time log output from agent execution

**Payload**:
```json
{
  "type": "agent.log",
  "executionId": "exec-uuid-1",
  "level": "info",
  "message": "Running cargo build...",
  "timestamp": "2025-10-22T10:01:30Z"
}
```

**Log Levels**:
- `info`: Informational message
- `warn`: Warning message
- `error`: Error message
- `debug`: Debug message

---

### 6. Issue Created

**Type**: `issue.created`

**Description**: Sent when a new issue is created (e.g., from LINE Bot)

**Payload**:
```json
{
  "type": "issue.created",
  "issueNumber": 271,
  "title": "新機能：ダッシュボードUI改善",
  "repositoryId": "repo-uuid-1",
  "timestamp": "2025-10-22T10:00:00Z"
}
```

---

### 7. Workflow Execution Started

**Type**: `workflow.started`

**Description**: Sent when a workflow execution begins

**Payload**:
```json
{
  "type": "workflow.started",
  "workflowExecutionId": "wf-exec-uuid-1",
  "workflowId": "workflow-uuid-1",
  "workflowName": "Standard Code Review Flow",
  "timestamp": "2025-10-22T10:00:00Z"
}
```

---

### 8. Workflow Execution Completed

**Type**: `workflow.completed`

**Description**: Sent when a workflow execution completes

**Payload**:
```json
{
  "type": "workflow.completed",
  "workflowExecutionId": "wf-exec-uuid-1",
  "workflowId": "workflow-uuid-1",
  "agentExecutions": [
    {
      "executionId": "exec-uuid-1",
      "agentType": "CodeGen",
      "status": "completed"
    },
    {
      "executionId": "exec-uuid-2",
      "agentType": "Review",
      "status": "completed"
    }
  ],
  "timestamp": "2025-10-22T10:10:00Z"
}
```

---

### 9. Notification

**Type**: `notification`

**Description**: General notification to user

**Payload**:
```json
{
  "type": "notification",
  "severity": "info",
  "title": "Agent実行完了",
  "message": "Issue #270のコード生成が完了しました",
  "actionUrl": "/executions/exec-uuid-1",
  "timestamp": "2025-10-22T10:05:00Z"
}
```

**Severity Levels**:
- `info`: Informational notification
- `success`: Success notification
- `warning`: Warning notification
- `error`: Error notification

---

## Connection Management

### Heartbeat / Ping-Pong

To keep the connection alive, clients should send a `ping` message every 30 seconds:

```javascript
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'ping' }));
  }
}, 30000);
```

The server will respond with a `pong` message:

```json
{
  "type": "pong",
  "timestamp": "2025-10-22T10:00:00Z"
}
```

### Connection Timeout

- If no message is received from the client for **90 seconds**, the server will close the connection
- If no pong is received after sending ping, the server will close the connection after **3 failed attempts**

### Reconnection Strategy

Recommended client-side reconnection strategy:

```javascript
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectDelay = 5000; // 5 seconds

function connect() {
  const ws = new WebSocket(`wss://api.miyabi.dev/ws?token=${token}`);

  ws.onopen = () => {
    console.log('Connected');
    reconnectAttempts = 0;
  };

  ws.onclose = () => {
    console.log('Disconnected');
    
    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      setTimeout(() => {
        console.log(`Reconnecting... (attempt ${reconnectAttempts})`);
        connect();
      }, reconnectDelay);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
}
```

---

## Error Handling

### WebSocket Close Codes

| Code | Reason | Description |
|------|--------|-------------|
| 1000 | Normal Closure | Connection closed normally |
| 1001 | Going Away | Server shutting down or browser navigating away |
| 1006 | Abnormal Closure | Connection lost without close frame |
| 4001 | Unauthorized | Invalid or expired JWT token |
| 4002 | Rate Limit Exceeded | Too many messages sent |
| 4003 | Invalid Message | Malformed JSON or invalid message type |

### Server-Sent Error Messages

**Type**: `error`

**Payload**:
```json
{
  "type": "error",
  "code": "INVALID_MESSAGE",
  "message": "Invalid message format",
  "timestamp": "2025-10-22T10:00:00Z"
}
```

**Error Codes**:
- `INVALID_MESSAGE`: Malformed or invalid message
- `SUBSCRIPTION_ERROR`: Failed to subscribe to channel
- `RATE_LIMIT`: Too many messages sent
- `INTERNAL_ERROR`: Server internal error

---

## Usage Example (React)

```typescript
// hooks/useWebSocket.ts
import { useEffect, useRef, useState } from 'react';

interface WebSocketEvent {
  type: string;
  [key: string]: any;
}

export function useWebSocket(url: string) {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<WebSocketEvent[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const ws = new WebSocket(`${url}?token=${token}`);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);

      // Start heartbeat
      const heartbeat = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);

      wsRef.current = ws;
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setEvents((prev) => [...prev, data]);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);

      // Reconnect after 5 seconds
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [url]);

  const send = (message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  return { connected, events, send };
}
```

**Usage**:
```tsx
function LiveDashboard() {
  const { connected, events, send } = useWebSocket('wss://api.miyabi.dev/ws');

  useEffect(() => {
    // Subscribe to agent execution updates
    send({
      type: 'subscribe',
      channel: 'agent-execution',
      executionId: 'exec-uuid-1'
    });
  }, []);

  const agentEvents = events.filter(e => e.type.startsWith('agent.'));

  return (
    <div>
      <div>Status: {connected ? 'Connected' : 'Disconnected'}</div>
      <div>
        {agentEvents.map((event, i) => (
          <div key={i}>
            {event.type}: {JSON.stringify(event)}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Security Considerations

1. **Always use WSS (secure WebSocket) in production**
2. **Validate JWT token on every connection**
3. **Rate limit messages per connection** (max 100 messages/minute)
4. **Sanitize all user input** in messages
5. **Close idle connections** after 90 seconds of inactivity
6. **Log all connection attempts** for security monitoring

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- All UUIDs are in standard UUID v4 format
- Maximum message size: 1 MB
- Connection timeout: 90 seconds
- Heartbeat interval: 30 seconds recommended
