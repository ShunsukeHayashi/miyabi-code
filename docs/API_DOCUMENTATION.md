# Miyabi API Documentation

**Version**: 1.0.0
**Last Updated**: 2025-11-18
**Base URL**: `http://miyabi-alb-dev-xxxxx.us-west-2.elb.amazonaws.com`
**API Prefix**: `/api/v1`
**Environment**: Development

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [Request/Response Format](#requestresponse-format)
5. [Error Codes](#error-codes)
6. [Rate Limiting](#rate-limiting)
7. [Examples](#examples)

---

## 🚀 Quick Start

### Base URL

```
http://miyabi-alb-dev-xxxxx.us-west-2.elb.amazonaws.com
```

### Health Check

Test if the API is running:

```bash
curl -i http://YOUR_ALB_DNS/health
```

**Response**:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2025-11-18T10:30:00Z"
}
```

### Authentication Flow

1. **Login** to get JWT token
2. **Include token** in `Authorization` header for protected routes
3. **Refresh token** before expiry (optional)

---

## 🔐 Authentication

### JWT Token Authentication

All protected endpoints require a valid JWT token in the `Authorization` header.

**Header Format**:
```
Authorization: Bearer <jwt_token>
```

### Login

**Endpoint**: `POST /api/v1/auth/login`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "admin"
  },
  "expires_at": "2025-11-19T10:30:00Z"
}
```

**Error Response** (401 Unauthorized):
```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

### Register

**Endpoint**: `POST /api/v1/auth/register`

**Request**:
```json
{
  "email": "newuser@example.com",
  "password": "securepassword123",
  "name": "Jane Smith"
}
```

**Response** (201 Created):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_124",
    "email": "newuser@example.com",
    "name": "Jane Smith",
    "role": "user"
  }
}
```

### Logout

**Endpoint**: `POST /api/v1/auth/logout`

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Response** (200 OK):
```json
{
  "message": "Successfully logged out"
}
```

---

## 📡 API Endpoints

### Health & Status

#### GET /health

Check API health status.

**Authentication**: Not required

**Response** (200 OK):
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2025-11-18T10:30:00Z"
}
```

#### GET /api/v1/status

Detailed system status.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "api": {
    "status": "healthy",
    "version": "1.0.0",
    "uptime_seconds": 3600
  },
  "database": {
    "status": "connected",
    "pool_size": 10,
    "active_connections": 3
  },
  "cache": {
    "status": "connected",
    "hit_rate": 0.85,
    "memory_usage_mb": 150
  }
}
```

---

### User Management

#### GET /api/v1/users

List all users (paginated).

**Authentication**: Required (Admin only)

**Query Parameters**:
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 100)
- `sort` (string, optional): Sort field (e.g., "created_at", "email")
- `order` (string, optional): Sort order ("asc", "desc")

**Request**:
```bash
GET /api/v1/users?page=1&limit=20&sort=created_at&order=desc
Authorization: Bearer <jwt_token>
```

**Response** (200 OK):
```json
{
  "users": [
    {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "admin",
      "created_at": "2025-11-01T10:00:00Z",
      "updated_at": "2025-11-18T09:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

#### GET /api/v1/users/:id

Get user by ID.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "admin",
  "created_at": "2025-11-01T10:00:00Z",
  "updated_at": "2025-11-18T09:00:00Z",
  "metadata": {
    "last_login": "2025-11-18T08:30:00Z",
    "login_count": 42
  }
}
```

#### PUT /api/v1/users/:id

Update user.

**Authentication**: Required (Own account or Admin)

**Request**:
```json
{
  "name": "John Updated",
  "email": "newemail@example.com"
}
```

**Response** (200 OK):
```json
{
  "id": "user_123",
  "email": "newemail@example.com",
  "name": "John Updated",
  "role": "admin",
  "updated_at": "2025-11-18T10:35:00Z"
}
```

#### DELETE /api/v1/users/:id

Delete user.

**Authentication**: Required (Admin only)

**Response** (204 No Content)

---

### Agent Management

#### GET /api/v1/agents

List all agents.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "agents": [
    {
      "id": "agent_001",
      "name": "MUGEN",
      "type": "coordinator",
      "status": "active",
      "division": "mugen",
      "capabilities": ["task_coordination", "resource_allocation"],
      "created_at": "2025-11-01T00:00:00Z"
    },
    {
      "id": "agent_002",
      "name": "MAJIN",
      "type": "coordinator",
      "status": "active",
      "division": "majin",
      "capabilities": ["quality_assurance", "testing"],
      "created_at": "2025-11-01T00:00:00Z"
    }
  ]
}
```

#### GET /api/v1/agents/:id

Get agent details.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "id": "agent_001",
  "name": "MUGEN",
  "type": "coordinator",
  "status": "active",
  "division": "mugen",
  "capabilities": ["task_coordination", "resource_allocation"],
  "metrics": {
    "tasks_completed": 150,
    "tasks_active": 3,
    "success_rate": 0.98,
    "average_completion_time_minutes": 45
  },
  "created_at": "2025-11-01T00:00:00Z",
  "last_active": "2025-11-18T10:30:00Z"
}
```

#### POST /api/v1/agents/:id/tasks

Assign task to agent.

**Authentication**: Required

**Request**:
```json
{
  "title": "Implement new feature",
  "description": "Add user authentication module",
  "priority": "high",
  "deadline": "2025-11-20T23:59:59Z"
}
```

**Response** (201 Created):
```json
{
  "task_id": "task_789",
  "agent_id": "agent_001",
  "title": "Implement new feature",
  "status": "assigned",
  "created_at": "2025-11-18T10:35:00Z"
}
```

---

### Task Management

#### GET /api/v1/tasks

List tasks.

**Authentication**: Required

**Query Parameters**:
- `status` (string, optional): Filter by status ("pending", "in_progress", "completed", "failed")
- `agent_id` (string, optional): Filter by agent
- `priority` (string, optional): Filter by priority ("low", "medium", "high", "critical")

**Response** (200 OK):
```json
{
  "tasks": [
    {
      "id": "task_789",
      "title": "Implement new feature",
      "description": "Add user authentication module",
      "status": "in_progress",
      "priority": "high",
      "agent_id": "agent_001",
      "agent_name": "MUGEN",
      "created_at": "2025-11-18T10:35:00Z",
      "updated_at": "2025-11-18T10:40:00Z",
      "deadline": "2025-11-20T23:59:59Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 8
  }
}
```

#### POST /api/v1/tasks

Create new task.

**Authentication**: Required

**Request**:
```json
{
  "title": "Bug fix: Login timeout",
  "description": "Users experiencing login timeout after 30 seconds",
  "priority": "critical",
  "agent_id": "agent_002",
  "tags": ["bug", "authentication", "P0"]
}
```

**Response** (201 Created):
```json
{
  "id": "task_790",
  "title": "Bug fix: Login timeout",
  "description": "Users experiencing login timeout after 30 seconds",
  "status": "pending",
  "priority": "critical",
  "agent_id": "agent_002",
  "tags": ["bug", "authentication", "P0"],
  "created_at": "2025-11-18T10:45:00Z"
}
```

#### PATCH /api/v1/tasks/:id

Update task.

**Authentication**: Required

**Request**:
```json
{
  "status": "completed",
  "notes": "Implemented OAuth2 flow with 60s timeout"
}
```

**Response** (200 OK):
```json
{
  "id": "task_790",
  "status": "completed",
  "notes": "Implemented OAuth2 flow with 60s timeout",
  "completed_at": "2025-11-18T12:30:00Z",
  "updated_at": "2025-11-18T12:30:00Z"
}
```

---

### Metrics & Analytics

#### GET /api/v1/metrics

Get system metrics.

**Authentication**: Required

**Query Parameters**:
- `start_time` (ISO 8601, optional): Start time for metrics
- `end_time` (ISO 8601, optional): End time for metrics
- `interval` (string, optional): Aggregation interval ("1m", "5m", "1h", "1d")

**Response** (200 OK):
```json
{
  "period": {
    "start": "2025-11-18T00:00:00Z",
    "end": "2025-11-18T23:59:59Z"
  },
  "metrics": {
    "api": {
      "total_requests": 12500,
      "successful_requests": 12350,
      "failed_requests": 150,
      "average_response_time_ms": 85,
      "p95_response_time_ms": 120,
      "p99_response_time_ms": 180
    },
    "agents": {
      "total_agents": 21,
      "active_agents": 18,
      "tasks_completed": 45,
      "tasks_in_progress": 12,
      "average_success_rate": 0.96
    },
    "system": {
      "cpu_usage_percent": 35,
      "memory_usage_percent": 55,
      "disk_usage_percent": 40
    }
  }
}
```

#### GET /api/v1/metrics/agents

Agent-specific metrics.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "agents": [
    {
      "id": "agent_001",
      "name": "MUGEN",
      "metrics": {
        "tasks_completed_24h": 8,
        "tasks_active": 2,
        "success_rate": 0.98,
        "average_completion_time_minutes": 42
      }
    }
  ]
}
```

---

### Logs & Events

#### GET /api/v1/logs

Query application logs.

**Authentication**: Required (Admin only)

**Query Parameters**:
- `level` (string, optional): Filter by log level ("debug", "info", "warn", "error")
- `start_time` (ISO 8601, optional): Start time
- `end_time` (ISO 8601, optional): End time
- `limit` (number, optional): Max logs to return (default: 100, max: 1000)

**Response** (200 OK):
```json
{
  "logs": [
    {
      "timestamp": "2025-11-18T10:45:30Z",
      "level": "info",
      "message": "Task task_790 assigned to agent agent_002",
      "metadata": {
        "task_id": "task_790",
        "agent_id": "agent_002",
        "user_id": "user_123"
      }
    }
  ],
  "count": 45
}
```

#### GET /api/v1/events

System event stream.

**Authentication**: Required

**Response** (200 OK):
```json
{
  "events": [
    {
      "id": "event_456",
      "type": "task.created",
      "timestamp": "2025-11-18T10:45:00Z",
      "payload": {
        "task_id": "task_790",
        "created_by": "user_123"
      }
    },
    {
      "id": "event_457",
      "type": "agent.status_changed",
      "timestamp": "2025-11-18T10:50:00Z",
      "payload": {
        "agent_id": "agent_001",
        "old_status": "idle",
        "new_status": "active"
      }
    }
  ]
}
```

---

## 📦 Request/Response Format

### Request Headers

**Required Headers**:
```
Content-Type: application/json
```

**Optional Headers**:
```
Authorization: Bearer <jwt_token>  (for protected endpoints)
X-Request-ID: <unique_request_id>  (for tracing)
```

### Response Format

All responses follow this structure:

**Success Response**:
```json
{
  "data": { /* response data */ },
  "metadata": { /* optional metadata */ }
}
```

**Error Response**:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { /* optional error details */ }
  }
}
```

### Timestamps

All timestamps use **ISO 8601** format:
```
2025-11-18T10:30:00Z
```

### Pagination

Paginated endpoints return:
```json
{
  "data": [ /* items */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5,
    "has_next": true,
    "has_prev": false
  }
}
```

---

## ⚠️ Error Codes

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 204 | No Content | Success, no response body |
| 400 | Bad Request | Invalid request format |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (e.g., duplicate) |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily down |

### Application Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_CREDENTIALS` | 401 | Invalid email/password |
| `TOKEN_EXPIRED` | 401 | JWT token expired |
| `TOKEN_INVALID` | 401 | Invalid JWT token |
| `INSUFFICIENT_PERMISSIONS` | 403 | User lacks required permissions |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource not found |
| `DUPLICATE_RESOURCE` | 409 | Resource already exists |
| `VALIDATION_ERROR` | 422 | Request validation failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Internal server error |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `EXTERNAL_SERVICE_ERROR` | 503 | External service unavailable |

### Error Response Examples

**Validation Error** (422):
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "fields": {
        "email": "Invalid email format",
        "password": "Password must be at least 8 characters"
      }
    }
  }
}
```

**Authentication Error** (401):
```json
{
  "error": {
    "code": "TOKEN_EXPIRED",
    "message": "JWT token has expired",
    "details": {
      "expired_at": "2025-11-18T09:00:00Z"
    }
  }
}
```

---

## 🚦 Rate Limiting

### Rate Limits

**Global Rate Limit**:
- 1000 requests per hour per API key
- 100 requests per minute per API key

**Specific Endpoints**:
- Login: 10 requests per minute per IP
- Register: 5 requests per hour per IP

### Rate Limit Headers

All responses include:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1700308800
```

### Rate Limit Exceeded Response

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later",
    "details": {
      "retry_after_seconds": 60
    }
  }
}
```

---

## 📚 Examples

### Example 1: Complete Authentication Flow

```bash
#!/bin/bash

# 1. Register new user
REGISTER_RESPONSE=$(curl -X POST http://YOUR_ALB_DNS/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@miyabi.ai",
    "password": "SecurePass123",
    "name": "Demo User"
  }')

# Extract token
TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.token')

# 2. Access protected endpoint
curl http://YOUR_ALB_DNS/api/v1/users \
  -H "Authorization: Bearer $TOKEN"

# 3. Logout
curl -X POST http://YOUR_ALB_DNS/api/v1/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

### Example 2: Create and Track Task

```bash
#!/bin/bash

TOKEN="your_jwt_token_here"

# 1. Create task
TASK_RESPONSE=$(curl -X POST http://YOUR_ALB_DNS/api/v1/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement caching layer",
    "description": "Add Redis caching for user sessions",
    "priority": "high",
    "agent_id": "agent_001"
  }')

# Extract task ID
TASK_ID=$(echo $TASK_RESPONSE | jq -r '.id')

# 2. Check task status
curl http://YOUR_ALB_DNS/api/v1/tasks/$TASK_ID \
  -H "Authorization: Bearer $TOKEN"

# 3. Update task status
curl -X PATCH http://YOUR_ALB_DNS/api/v1/tasks/$TASK_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "notes": "Started implementation"
  }'

# 4. Complete task
curl -X PATCH http://YOUR_ALB_DNS/api/v1/tasks/$TASK_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "notes": "Caching layer implemented and tested"
  }'
```

### Example 3: Monitor System Metrics

```bash
#!/bin/bash

TOKEN="your_jwt_token_here"

# Get metrics for last 24 hours
START_TIME=$(date -u -v-1d +%Y-%m-%dT%H:%M:%SZ)
END_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)

curl "http://YOUR_ALB_DNS/api/v1/metrics?start_time=$START_TIME&end_time=$END_TIME&interval=1h" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'

# Get agent-specific metrics
curl http://YOUR_ALB_DNS/api/v1/metrics/agents \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.agents[] | {name, tasks_completed_24h, success_rate}'
```

### Example 4: Query Logs

```bash
#!/bin/bash

TOKEN="your_jwt_token_here"

# Get error logs from last hour
START_TIME=$(date -u -v-1H +%Y-%m-%dT%H:%M:%SZ)

curl "http://YOUR_ALB_DNS/api/v1/logs?level=error&start_time=$START_TIME&limit=50" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.logs[] | {timestamp, message}'
```

---

## 🔗 Additional Resources

- [Infrastructure Runbook](./INFRASTRUCTURE_RUNBOOK.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [API Changelog](./API_CHANGELOG.md) (to be created)

---

## 📝 API Versioning

**Current Version**: v1

**Version Policy**:
- Breaking changes: New major version (v2, v3)
- Non-breaking changes: Same version
- Deprecation: 6 months notice

**Deprecated Endpoints**: None (v1.0.0)

---

## 🛡️ Security Best Practices

### For API Consumers

1. **Never commit tokens** to version control
2. **Use environment variables** for sensitive data
3. **Rotate tokens regularly** (every 30 days)
4. **Use HTTPS** in production (when configured)
5. **Validate responses** before processing
6. **Implement retry logic** with exponential backoff
7. **Monitor rate limits** to avoid blocking

### For API Maintainers

1. **Keep dependencies updated**
2. **Run security audits** regularly
3. **Monitor CloudWatch** for suspicious activity
4. **Implement CORS** properly
5. **Use parameterized queries** to prevent SQL injection
6. **Sanitize user input**
7. **Log security events**

---

**Questions or Issues?**

- Create a GitHub issue with label `api`
- Contact Backend team
- Check [Troubleshooting Guide](./TROUBLESHOOTING.md)

**Last Review**: 2025-11-18
**Next Review**: 2025-12-18
**Owner**: Miyabi Backend Team
