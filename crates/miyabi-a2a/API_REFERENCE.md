# Miyabi A2A Dashboard - API Reference

**Version**: 1.0.0
**Base URL**: `http://localhost:3001`
**Last Updated**: 2025-10-22

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Error Handling](#error-handling)
3. [Task Management](#task-management)
4. [Error Recovery](#error-recovery)
5. [WebSocket API](#websocket-api)
6. [Type Definitions](#type-definitions)

---

## 🔐 Authentication

**Current Status**: No authentication required (Development mode)

**Production Recommendation**: Implement one of the following:
- API Key authentication via `X-API-Key` header
- OAuth 2.0 / JWT tokens
- GitHub App authentication

---

## ❌ Error Handling

### Error Response Format

All API errors follow this structured format:

```typescript
interface ErrorResponse {
  status: number;         // HTTP status code (400-599)
  error_code: string;     // Machine-readable error code
  message: string;        // Human-readable error message
  details?: string;       // Optional additional context
  request_id?: string;    // Optional request tracing ID
  timestamp: string;      // ISO 8601 timestamp
}
```

### Example Error Response

```json
{
  "status": 404,
  "error_code": "TASK_NOT_FOUND",
  "message": "Task 123 does not exist",
  "timestamp": "2025-10-22T04:30:00Z"
}
```

### Standard Error Codes

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `INVALID_TASK_ID` | 400 | Task ID format is invalid (must be integer) |
| `TASK_NOT_FOUND` | 404 | Task does not exist in storage |
| `INVALID_TASK_STATE` | 409 | Task state doesn't allow requested operation |
| `MAX_RETRIES_EXCEEDED` | 429 | Task has reached maximum retry limit (3) |
| `STORAGE_ERROR` | 500 | Backend storage operation failed |
| `STORAGE_UPDATE_ERROR` | 500 | Failed to update task in storage |

---

## 📋 Task Management

### List Tasks

Get a list of all tasks with optional filtering.

**Endpoint**: `GET /api/tasks`

**Query Parameters**:
- `status` (optional): Filter by task status (`submitted`, `working`, `completed`, `failed`, `cancelled`)
- `limit` (optional): Maximum number of results (default: 50, max: 100)

**Request**:
```bash
curl http://localhost:3001/api/tasks?status=failed&limit=10
```

**Response** (200 OK):
```json
{
  "tasks": [
    {
      "id": 123,
      "title": "Generate code for user authentication",
      "description": "Implement JWT-based auth",
      "status": "failed",
      "task_type": "codegen",
      "agent": "codegen-agent",
      "priority": 3,
      "retry_count": 2,
      "created_at": "2025-10-22T04:00:00Z",
      "updated_at": "2025-10-22T04:30:00Z",
      "issue_url": "https://github.com/owner/repo/issues/123"
    }
  ]
}
```

### Get Task by ID

Retrieve a specific task by its ID.

**Endpoint**: `GET /api/tasks/{task_id}`

**Path Parameters**:
- `task_id` (required): Task ID (integer)

**Request**:
```bash
curl http://localhost:3001/api/tasks/123
```

**Response** (200 OK):
```json
{
  "id": 123,
  "title": "Generate code for user authentication",
  "description": "Implement JWT-based auth",
  "status": "failed",
  "task_type": "codegen",
  "agent": "codegen-agent",
  "context_id": null,
  "priority": 3,
  "retry_count": 2,
  "created_at": "2025-10-22T04:00:00Z",
  "updated_at": "2025-10-22T04:30:00Z",
  "issue_url": "https://github.com/owner/repo/issues/123"
}
```

**Response** (404 Not Found):
```json
{
  "status": 404,
  "error_code": "TASK_NOT_FOUND",
  "message": "Task 999 does not exist",
  "timestamp": "2025-10-22T04:30:00Z"
}
```

---

## 🔄 Error Recovery

### Retry Task

Retry a failed task with exponential backoff.

**Endpoint**: `POST /api/tasks/{task_id}/retry`

**Path Parameters**:
- `task_id` (required): Task ID to retry

**Request Body**:
```typescript
interface TaskRetryRequest {
  reason?: string;  // Optional reason for retry
}
```

**Request Example**:
```bash
curl -X POST http://localhost:3001/api/tasks/123/retry \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Network timeout - retrying with increased timeout"
  }'
```

**Response** (200 OK):
```json
{
  "task_id": "123",
  "status": "submitted",
  "message": "Task 123 has been queued for retry",
  "retry_count": 2
}
```

**Response** (400 Bad Request - Invalid Task ID):
```json
{
  "status": 400,
  "error_code": "INVALID_TASK_ID",
  "message": "Invalid task ID format",
  "details": "Task ID 'abc' must be a valid integer: invalid digit found in string",
  "timestamp": "2025-10-22T04:30:00Z"
}
```

**Response** (404 Not Found):
```json
{
  "status": 404,
  "error_code": "TASK_NOT_FOUND",
  "message": "Task 999 does not exist",
  "timestamp": "2025-10-22T04:30:00Z"
}
```

**Response** (409 Conflict - Invalid State):
```json
{
  "status": 409,
  "error_code": "INVALID_TASK_STATE",
  "message": "Task must be in failed state to retry",
  "details": "Current task status: Completed",
  "timestamp": "2025-10-22T04:30:00Z"
}
```

**Response** (429 Too Many Requests):
```json
{
  "status": 429,
  "error_code": "MAX_RETRIES_EXCEEDED",
  "message": "Maximum retry limit of 3 attempts reached",
  "details": "Current retry count: 3/3",
  "timestamp": "2025-10-22T04:30:00Z"
}
```

**Response** (500 Internal Server Error):
```json
{
  "status": 500,
  "error_code": "STORAGE_UPDATE_ERROR",
  "message": "Failed to update task status",
  "details": "Storage update error for task 123: Connection timeout",
  "timestamp": "2025-10-22T04:30:00Z"
}
```

**Retry Logic**:
1. Validates task exists
2. Checks task is in `Failed` state
3. Checks retry count < 3
4. Increments `retry_count`
5. Updates task status to `Submitted`
6. Calculates exponential backoff delay
7. Broadcasts `TaskRetry` event via WebSocket

**Exponential Backoff**:
- Attempt 1: 10 seconds
- Attempt 2: 20 seconds
- Attempt 3: 40 seconds
- Formula: `10 * 2^(retry_count - 1)`

### Cancel Task

Cancel a running or queued task.

**Endpoint**: `POST /api/tasks/{task_id}/cancel`

**Path Parameters**:
- `task_id` (required): Task ID to cancel

**Request Body**: None

**Request Example**:
```bash
curl -X POST http://localhost:3001/api/tasks/456/cancel \
  -H "Content-Type: application/json"
```

**Response** (200 OK):
```json
{
  "task_id": "456",
  "status": "cancelled",
  "message": "Task 456 has been cancelled"
}
```

**Response** (400 Bad Request - Invalid Task ID):
```json
{
  "status": 400,
  "error_code": "INVALID_TASK_ID",
  "message": "Invalid task ID format",
  "details": "Task ID 'invalid' must be a valid integer: invalid digit found in string",
  "timestamp": "2025-10-22T04:35:00Z"
}
```

**Response** (404 Not Found):
```json
{
  "status": 404,
  "error_code": "TASK_NOT_FOUND",
  "message": "Task 999 does not exist",
  "timestamp": "2025-10-22T04:35:00Z"
}
```

**Response** (409 Conflict - Invalid State):
```json
{
  "status": 409,
  "error_code": "INVALID_TASK_STATE",
  "message": "Task must be in Submitted or Working state to cancel",
  "details": "Current task status: Failed. Only Submitted or Working tasks can be cancelled.",
  "timestamp": "2025-10-22T04:35:00Z"
}
```

**Response** (500 Internal Server Error):
```json
{
  "status": 500,
  "error_code": "STORAGE_UPDATE_ERROR",
  "message": "Failed to update task status",
  "details": "Storage update error for task 456: Network error",
  "timestamp": "2025-10-22T04:35:00Z"
}
```

**Cancel Logic**:
1. Validates task exists
2. Checks task is in `Submitted` or `Working` state
3. Updates task status to `Cancelled`
4. Updates task description with cancellation timestamp
5. Broadcasts `TaskCancel` event via WebSocket

**Cancellable States**:
- ✅ `Submitted`: Queued but not started
- ✅ `Working`: Currently executing
- ❌ `Failed`: Already failed
- ❌ `Completed`: Already completed
- ❌ `Cancelled`: Already cancelled

---

## 🔌 WebSocket API

### Connection

**Endpoint**: `ws://localhost:3001/ws`

**Protocol**: WebSocket (RFC 6455)

**Connection Example** (JavaScript):
```javascript
const ws = new WebSocket('ws://localhost:3001/ws');

ws.onopen = () => {
  console.log('WebSocket connected');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('WebSocket closed');
};
```

### Message Format

All WebSocket messages are JSON objects with a `type` field:

```typescript
type DashboardUpdate =
  | { type: 'agents'; agents: Agent[] }
  | { type: 'systemstatus'; status: SystemStatus }
  | { type: 'error'; error: ErrorInfo }
  | { type: 'taskretry'; event: TaskRetryEvent }
  | { type: 'taskcancel'; event: TaskCancelEvent }
  | { type: 'ping' };
```

### Message Types

#### Agents Update

Sent periodically (every 10 seconds) or when agent state changes.

```json
{
  "type": "agents",
  "agents": [
    {
      "id": 1,
      "name": "しきるん",
      "role": "Coordinator",
      "category": "coding",
      "status": "active",
      "tasks": 5,
      "color": "leader",
      "description": "タスク統括・DAG分解"
    }
  ]
}
```

#### System Status Update

Sent periodically (every 10 seconds) or when system metrics change.

```json
{
  "type": "systemstatus",
  "status": {
    "status": "operational",
    "active_agents": 7,
    "total_agents": 21,
    "active_tasks": 12,
    "queued_tasks": 5,
    "task_throughput": 3.5,
    "avg_completion_time": 45.2
  }
}
```

#### Error Event

Sent when an error occurs in the system.

```json
{
  "type": "error",
  "error": {
    "id": "error-1729576200123",
    "task_id": "123",
    "agent_id": "1",
    "agent_name": "CodeGen Agent",
    "message": "Failed to generate code: Timeout",
    "stack_trace": "Error: Timeout\n  at ...",
    "timestamp": "2025-10-22T04:30:00Z",
    "severity": "critical",
    "is_retryable": true
  }
}
```

#### Task Retry Event ✨ NEW

Sent when a task is retried.

```json
{
  "type": "taskretry",
  "event": {
    "task_id": "123",
    "retry_count": 2,
    "reason": "Network timeout - retrying",
    "next_retry_at": "2025-10-22T04:40:00Z",
    "timestamp": "2025-10-22T04:39:50Z"
  }
}
```

#### Task Cancel Event ✨ NEW

Sent when a task is cancelled.

```json
{
  "type": "taskcancel",
  "event": {
    "task_id": "456",
    "reason": "Task cancelled by user at 2025-10-22 04:35:00",
    "timestamp": "2025-10-22T04:35:00Z"
  }
}
```

#### Ping

Heartbeat message to keep connection alive.

```json
{
  "type": "ping"
}
```

### Connection Lifecycle

1. **Initial Connection**: Client connects to `ws://localhost:3001/ws`
2. **Initial Data**: Server sends current `agents` and `systemstatus`
3. **Periodic Updates**: Server sends updates every 10 seconds
4. **Event-Driven**: Server broadcasts events (retry, cancel, error) immediately
5. **Reconnection**: Client should implement exponential backoff reconnection (3-second interval recommended)

---

## 📝 Type Definitions

### Task

```typescript
interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  task_type: TaskType;
  agent: string | null;
  context_id: string | null;
  priority: number;  // 1-10
  retry_count: number;
  created_at: string;  // ISO 8601
  updated_at: string;  // ISO 8601
  issue_url: string;
}

type TaskStatus = 'submitted' | 'working' | 'completed' | 'failed' | 'cancelled';

type TaskType = 'codegen' | 'review' | 'testing' | 'deployment' | 'documentation' | 'analysis';
```

### Agent

```typescript
interface Agent {
  id: number;
  name: string;
  role: string;
  category: 'coding' | 'business';
  status: 'active' | 'working' | 'idle' | 'error';
  tasks: number;
  color: 'leader' | 'executor' | 'analyst' | 'support';
  description: string;
}
```

### System Status

```typescript
interface SystemStatus {
  status: string;  // 'operational', 'degraded', 'down'
  active_agents: number;
  total_agents: number;
  active_tasks: number;
  queued_tasks: number;
  task_throughput: number;  // tasks per hour
  avg_completion_time: number;  // seconds
}
```

### Error Info

```typescript
interface ErrorInfo {
  id: string;
  task_id?: string;
  agent_id?: string;
  agent_name?: string;
  message: string;
  stack_trace?: string;
  timestamp: string;  // ISO 8601
  severity: 'critical' | 'high' | 'medium' | 'low';
  is_retryable: boolean;
}
```

### Task Retry Event

```typescript
interface TaskRetryEvent {
  task_id: string;
  retry_count: number;
  reason?: string;
  next_retry_at?: string;  // ISO 8601
  timestamp: string;  // ISO 8601
}
```

### Task Cancel Event

```typescript
interface TaskCancelEvent {
  task_id: string;
  reason: string;
  timestamp: string;  // ISO 8601
}
```

### Task Retry Request

```typescript
interface TaskRetryRequest {
  reason?: string;
}
```

### Task Retry Response

```typescript
interface TaskRetryResponse {
  task_id: string;
  status: string;  // 'submitted'
  message: string;
  retry_count: number;
}
```

### Task Cancel Response

```typescript
interface TaskCancelResponse {
  task_id: string;
  status: string;  // 'cancelled'
  message: string;
}
```

### Error Response

```typescript
interface ErrorResponse {
  status: number;
  error_code: string;
  message: string;
  details?: string;
  request_id?: string;
  timestamp: string;  // ISO 8601
}
```

---

## 📊 Rate Limits

**Current Status**: No rate limiting (Development mode)

**Production Recommendation**:
- Rate limit per IP: 100 requests per minute
- WebSocket connections per IP: 5 concurrent connections
- Retry operations per task: 3 attempts per hour

---

## 🔐 Security Headers

**Current Status**: Basic CORS enabled

**Production Recommendation**:
```
Access-Control-Allow-Origin: https://your-domain.com
Access-Control-Allow-Methods: GET, POST
Access-Control-Allow-Headers: Content-Type, Authorization
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

---

## 📚 Examples

### Complete Retry Flow

```bash
# 1. Get failed task
curl http://localhost:3001/api/tasks/123

# 2. Retry task
curl -X POST http://localhost:3001/api/tasks/123/retry \
  -H "Content-Type: application/json" \
  -d '{"reason": "Timeout - retrying"}'

# 3. Verify task status changed
curl http://localhost:3001/api/tasks/123

# 4. WebSocket receives TaskRetry event
# {
#   "type": "taskretry",
#   "event": {
#     "task_id": "123",
#     "retry_count": 1,
#     "reason": "Timeout - retrying",
#     "next_retry_at": "2025-10-22T04:40:00Z",
#     "timestamp": "2025-10-22T04:39:50Z"
#   }
# }
```

### Complete Cancel Flow

```bash
# 1. Get running task
curl http://localhost:3001/api/tasks/456

# 2. Cancel task
curl -X POST http://localhost:3001/api/tasks/456/cancel \
  -H "Content-Type: application/json"

# 3. Verify task status changed
curl http://localhost:3001/api/tasks/456

# 4. WebSocket receives TaskCancel event
# {
#   "type": "taskcancel",
#   "event": {
#     "task_id": "456",
#     "reason": "Task cancelled by user at 2025-10-22 04:35:00",
#     "timestamp": "2025-10-22T04:35:00Z"
#   }
# }
```

---

**API Reference Version**: 1.0.0
**Last Updated**: 2025-10-22
**Maintained by**: Claude Code (AI Assistant)
