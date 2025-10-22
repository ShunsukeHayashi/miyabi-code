# Error Recovery System - User Guide

**Feature**: Production-Ready Error Recovery
**Version**: 1.0.0
**Last Updated**: 2025-10-22

---

## 📋 Overview

The Error Recovery System provides automatic retry and manual cancellation capabilities for failed or running tasks in the Miyabi A2A Dashboard.

### Key Features

- ✅ **Automatic Retry**: Failed tasks can be retried with exponential backoff
- ✅ **Max Retry Limit**: Maximum 3 retry attempts per task
- ✅ **Manual Cancellation**: Cancel running or queued tasks
- ✅ **Real-time Updates**: WebSocket-based live notifications
- ✅ **Browser Notifications**: Desktop notifications for critical events
- ✅ **Structured Errors**: Machine-readable error codes with detailed context

---

## 🔄 Task Retry System

### How It Works

When a task fails, you can retry it from the Error Dashboard. The system will:

1. Validate the task state (must be `Failed`)
2. Check retry count (max 3 attempts)
3. Calculate exponential backoff delay
4. Transition task to `Submitted` state
5. Increment retry counter
6. Broadcast retry event via WebSocket

### Retry Limits

| Attempt | Delay | Total Wait Time |
|---------|-------|-----------------|
| 1st     | 10s   | 10s             |
| 2nd     | 20s   | 30s             |
| 3rd     | 40s   | 70s             |
| 4th+    | ❌ Blocked | - |

**Max retry count**: 3 attempts

After 3 failed attempts, the task cannot be retried via API. Manual intervention required.

### Retry via Dashboard

**Steps**:
1. Navigate to **Error Dashboard**
2. Find the failed task in "Critical Errors" section
3. Click **Retry** button
4. Optional: Provide a reason in the prompt
5. Task will be queued for retry

**Visual Indicators**:
- **Retry Count Badge**: Shows current retry attempt (e.g., "Retry 2/3")
- **Next Retry Time Badge**: Shows scheduled retry time (e.g., "Next: 14:30:45")

### Retry via API

**Endpoint**: `POST /api/tasks/{task_id}/retry`

**Request**:
```bash
curl -X POST http://localhost:3001/api/tasks/123/retry \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Network timeout - retrying with increased timeout"
  }'
```

**Response (Success)**:
```json
{
  "task_id": "123",
  "status": "submitted",
  "message": "Task 123 has been queued for retry",
  "retry_count": 2
}
```

**Response (Error - Max Retries Exceeded)**:
```json
{
  "status": 429,
  "error_code": "MAX_RETRIES_EXCEEDED",
  "message": "Maximum retry limit of 3 attempts reached",
  "details": "Current retry count: 3/3",
  "timestamp": "2025-10-22T04:30:00Z"
}
```

### Error Codes

| Error Code | HTTP Status | Description | Solution |
|------------|-------------|-------------|----------|
| `INVALID_TASK_ID` | 400 | Task ID format invalid | Check task ID is a valid integer |
| `TASK_NOT_FOUND` | 404 | Task does not exist | Verify task ID exists in system |
| `INVALID_TASK_STATE` | 409 | Task not in Failed state | Only Failed tasks can be retried |
| `MAX_RETRIES_EXCEEDED` | 429 | Retry limit reached | Manual intervention required |
| `STORAGE_ERROR` | 500 | Backend storage error | Check logs, retry later |

---

## ❌ Task Cancellation System

### How It Works

You can cancel tasks that are currently queued or running. The system will:

1. Validate the task state (must be `Submitted` or `Working`)
2. Transition task to `Cancelled` state
3. Update task description with cancellation timestamp
4. Broadcast cancel event via WebSocket

**Note**: Once cancelled, tasks cannot be automatically resumed. Create a new task if needed.

### Cancel via Dashboard

**Steps**:
1. Navigate to **Error Dashboard**
2. Find the task in "Critical Errors" or "Warnings" section
3. Click **Cancel Workflow** button
4. Confirm cancellation
5. Task will be immediately cancelled

### Cancel via API

**Endpoint**: `POST /api/tasks/{task_id}/cancel`

**Request**:
```bash
curl -X POST http://localhost:3001/api/tasks/456/cancel \
  -H "Content-Type: application/json"
```

**Response (Success)**:
```json
{
  "task_id": "456",
  "status": "cancelled",
  "message": "Task 456 has been cancelled"
}
```

**Response (Error - Invalid State)**:
```json
{
  "status": 409,
  "error_code": "INVALID_TASK_STATE",
  "message": "Task must be in Submitted or Working state to cancel",
  "details": "Current task status: Failed. Only Submitted or Working tasks can be cancelled.",
  "timestamp": "2025-10-22T04:35:00Z"
}
```

### Cancellation States

| Current State | Can Cancel? | Next State |
|---------------|-------------|------------|
| Submitted     | ✅ Yes      | Cancelled  |
| Working       | ✅ Yes      | Cancelled  |
| Failed        | ❌ No       | -          |
| Completed     | ❌ No       | -          |
| Cancelled     | ❌ No       | -          |

---

## 🔔 Real-time Notifications

### WebSocket Events

The dashboard receives real-time updates via WebSocket connection:

**TaskRetry Event**:
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

**TaskCancel Event**:
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

### Browser Notifications

When enabled, you'll receive desktop notifications for:
- ✅ **Task Retry**: "🔄 Task Retry - Task 123 retry attempt 2"
- ✅ **Task Cancelled**: "❌ Task Cancelled - Task 456 cancelled"

**Enable notifications**:
1. Click **Enable Notifications** in Error Dashboard
2. Allow notifications when browser prompts
3. Notifications will appear for future events

---

## 📊 Dashboard UI

### Error Dashboard Components

**1. Critical Errors Section**
- Lists all tasks with `Failed` status
- Shows retry count badge (if retried)
- Shows next retry time (if scheduled)
- Provides Retry and Cancel buttons

**2. Warnings Section**
- Lists non-critical issues
- Provides Dismiss button

**3. Notification Status**
- Shows browser notification status
- Provides Enable Notifications button

### Visual Indicators

**Retry Count Badge** (Warning color):
```
[Retry 2/3]
```
- Appears when `retry_count > 0`
- Color: Orange/Yellow
- Max shown: 3/3

**Next Retry Time Badge** (Primary color):
```
[Next: 14:30:45]
```
- Appears when `next_retry_at` is set
- Shows local time in HH:MM:SS format
- Color: Blue

---

## 🧪 Testing Error Recovery

### Manual Test Scenarios

**Scenario 1: Successful Retry**
1. Create a failed task (GitHub Issue with label `a2a:failed`)
2. Open Error Dashboard
3. Click Retry button
4. Verify:
   - Task status changes to `submitted`
   - Retry count badge shows "Retry 1/3"
   - WebSocket event received
   - Browser notification appears (if enabled)

**Scenario 2: Max Retries Exceeded**
1. Create a failed task with `retry_count = 3`
2. Try to retry via API or Dashboard
3. Verify:
   - Retry fails with 429 error
   - Error message: "Maximum retry limit of 3 attempts reached"

**Scenario 3: Successful Cancellation**
1. Create a submitted or working task
2. Open Error Dashboard
3. Click Cancel Workflow button
4. Verify:
   - Task status changes to `cancelled`
   - WebSocket event received
   - Browser notification appears (if enabled)

**Scenario 4: Invalid Cancellation**
1. Try to cancel a Failed or Completed task
2. Verify:
   - Cancellation fails with 409 error
   - Error message: "Task must be in Submitted or Working state"

### API Test Scripts

**Test Retry**:
```bash
# Create a failed task (via GitHub)
# Then retry it:
curl -X POST http://localhost:3001/api/tasks/123/retry \
  -H "Content-Type: application/json" \
  -d '{"reason": "Test retry"}' \
  -w "\nHTTP Status: %{http_code}\n"
```

**Test Cancel**:
```bash
# Create a submitted task
# Then cancel it:
curl -X POST http://localhost:3001/api/tasks/456/cancel \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n"
```

---

## 🔍 Troubleshooting

### Retry Not Working

**Symptom**: Retry button does nothing

**Possible Causes**:
1. Task is not in `Failed` state
2. Max retries (3) exceeded
3. Backend server not running
4. Network connectivity issue

**Solution**:
```bash
# Check task state
curl http://localhost:3001/api/tasks/123

# Check retry count in response
# If retry_count >= 3, cannot retry

# Check server logs
journalctl -u miyabi-dashboard -f | grep retry
```

### Cancel Not Working

**Symptom**: Cancel button does nothing

**Possible Causes**:
1. Task is not in `Submitted` or `Working` state
2. Task already completed or failed
3. Backend server not running

**Solution**:
```bash
# Check task state
curl http://localhost:3001/api/tasks/456

# Verify task is in correct state (status: "submitted" or "working")
```

### WebSocket Not Receiving Events

**Symptom**: Dashboard doesn't update in real-time

**Possible Causes**:
1. WebSocket connection dropped
2. Backend not broadcasting events
3. Browser blocking WebSocket

**Solution**:
1. Check browser console for connection errors
2. Verify WebSocket endpoint: `ws://localhost:3001/ws`
3. Refresh page to reconnect
4. Check backend logs for broadcast errors

### Browser Notifications Not Appearing

**Symptom**: No desktop notifications

**Possible Causes**:
1. Notifications not enabled
2. Browser blocking notifications
3. System notifications disabled

**Solution**:
1. Click "Enable Notifications" in Error Dashboard
2. Check browser notification settings
3. Check system notification preferences (macOS, Windows)

---

## 📚 API Reference

### Retry Task

**Endpoint**: `POST /api/tasks/{task_id}/retry`

**Path Parameters**:
- `task_id` (string, required): Task ID to retry

**Request Body**:
```typescript
interface TaskRetryRequest {
  reason?: string;  // Optional reason for retry
}
```

**Response**: `TaskRetryResponse` (200 OK)
```typescript
interface TaskRetryResponse {
  task_id: string;
  status: string;         // "submitted"
  message: string;        // Success message
  retry_count: number;    // Incremented count
}
```

**Error Response**: `ErrorResponse` (4xx/5xx)
```typescript
interface ErrorResponse {
  status: number;         // HTTP status code
  error_code: string;     // Machine-readable code
  message: string;        // Human-readable message
  details?: string;       // Additional context
  request_id?: string;    // Request tracing ID
  timestamp: string;      // ISO 8601 timestamp
}
```

### Cancel Task

**Endpoint**: `POST /api/tasks/{task_id}/cancel`

**Path Parameters**:
- `task_id` (string, required): Task ID to cancel

**Request Body**: None

**Response**: `TaskCancelResponse` (200 OK)
```typescript
interface TaskCancelResponse {
  task_id: string;
  status: string;    // "cancelled"
  message: string;   // Success message
}
```

**Error Response**: Same as retry endpoint

---

## 📝 Best Practices

### When to Retry

**✅ Good use cases**:
- Network timeouts
- Temporary API failures
- Transient errors
- Rate limiting (after backoff)

**❌ Avoid retrying**:
- Invalid input errors
- Authentication failures
- Not found errors (404)
- Permanent failures

### When to Cancel

**✅ Good use cases**:
- Task taking too long
- Requirements changed
- User initiated cancellation
- Incorrect task configuration

**❌ Avoid cancelling**:
- Task almost complete
- Critical background tasks
- Tasks with side effects (may need rollback)

### Monitoring Retry Patterns

Track these metrics:
- Retry rate per hour
- Tasks reaching max retries
- Common retry reasons
- Average retry delay

High retry rates may indicate:
- Infrastructure issues
- Configuration problems
- External API instability

---

## 🔐 Security Considerations

### Rate Limiting

The system enforces max 3 retries per task to prevent:
- API abuse
- Resource exhaustion
- Infinite retry loops

### Authentication

Currently, the API does not require authentication. For production:
- Add API key authentication
- Implement role-based access control
- Log all retry/cancel operations

### Audit Logging

All retry/cancel operations are logged:
```
INFO  Task 123 queued for retry (attempt 2, next retry at 2025-10-22 04:40:00)
INFO  Task 456 has been cancelled by user
```

---

## 📊 Metrics & Analytics

### Key Metrics

**Retry Metrics**:
- Total retries per day
- Retry success rate
- Average retries per task
- Tasks reaching max retries

**Cancel Metrics**:
- Total cancellations per day
- Cancellation reasons
- Time to cancel (from submission)

### Example Queries

**Tasks with 3 retries** (needs investigation):
```bash
# Query GitHub Issues with label "retry:3"
curl -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/$OWNER/$REPO/issues?labels=retry:3"
```

---

**Error Recovery Guide Version**: 1.0.0
**Last Updated**: 2025-10-22
**Maintained by**: Claude Code (AI Assistant)
