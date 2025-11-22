# API Documentation

**Base URL**: `http://miyabi-alb-dev-42521683.us-west-2.elb.amazonaws.com`
**Version**: 1.0.0
**Last Updated**: 2025-11-23

---

## Authentication

### GitHub OAuth Flow

1. **Redirect to GitHub**
   ```
   GET /auth/github
   ```
   Redirects user to GitHub OAuth authorization page.

2. **OAuth Callback**
   ```
   GET /auth/callback?code=<auth_code>
   ```
   Exchanges auth code for access token, creates session.

3. **Get Current User**
   ```
   GET /auth/me
   Authorization: Bearer <token>
   ```
   Returns current authenticated user.

4. **Logout**
   ```
   POST /auth/logout
   Authorization: Bearer <token>
   ```
   Invalidates current session.

---

## Endpoints

### Health Check

```http
GET /health
```

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-23T10:00:00Z"
}
```

---

### System Metrics

```http
GET /api/v1/metrics
Authorization: Bearer <token>
```

**Response**:
```json
{
  "cpu_usage": 45.5,
  "memory_usage": 62.3,
  "disk_usage": 35.0,
  "active_agents": 5,
  "total_tasks": 150,
  "completed_tasks": 120,
  "uptime_seconds": 86400
}
```

---

### Agents

#### List Agents

```http
GET /api/v1/agents
Authorization: Bearer <token>
```

**Response**:
```json
[
  {
    "id": "agent-001",
    "name": "CodeGen Agent",
    "status": "running",
    "type": "coding",
    "config": {
      "maxConcurrentTasks": 5
    }
  }
]
```

#### Get Agent

```http
GET /api/v1/agents/:id
Authorization: Bearer <token>
```

#### Configure Agent

```http
PUT /api/v1/agents/:id/config
Authorization: Bearer <token>
Content-Type: application/json

{
  "maxConcurrentTasks": 10
}
```

#### Agent Control

```http
POST /api/v1/agents/:id/start
POST /api/v1/agents/:id/stop
POST /api/v1/agents/:id/pause
POST /api/v1/agents/:id/resume
POST /api/v1/agents/:id/restart
Authorization: Bearer <token>
```

#### Agent Metrics

```http
GET /api/v1/agents/:id/metrics
Authorization: Bearer <token>
```

#### Agent Logs

```http
GET /api/v1/agents/:id/logs?limit=100
Authorization: Bearer <token>
```

---

### Database

#### Get Schema

```http
GET /api/v1/database/schema
Authorization: Bearer <token>
```

**Response**:
```json
{
  "tables": [
    {
      "name": "agents",
      "columns": ["id", "name", "status"],
      "row_count": 10
    }
  ],
  "total_records": 1000,
  "size_bytes": 1048576
}
```

#### Execute Query

```http
POST /api/v1/database/query
Authorization: Bearer <token>
Content-Type: application/json

{
  "query": "SELECT * FROM agents LIMIT 10"
}
```

#### Database Status

```http
GET /api/v1/database/status
Authorization: Bearer <token>
```

---

### Deployments

#### List Deployments

```http
GET /api/v1/deployments
Authorization: Bearer <token>
```

**Response**:
```json
[
  {
    "id": "deploy-001",
    "name": "v1.2.0 Release",
    "status": "completed",
    "environment": "production",
    "created_at": "2025-11-23T10:00:00Z",
    "completed_at": "2025-11-23T10:15:00Z"
  }
]
```

#### Trigger Deployment

```http
POST /api/v1/deployments
Authorization: Bearer <token>
Content-Type: application/json

{
  "environment": "staging"
}
```

#### Deployment Status

```http
GET /api/v1/deployments/status
Authorization: Bearer <token>
```

---

### Infrastructure

#### Get Status

```http
GET /api/v1/infrastructure/status
Authorization: Bearer <token>
```

**Response**:
```json
{
  "docker_containers": [
    {
      "id": "container-001",
      "name": "miyabi-api",
      "status": "running",
      "cpu_usage": 25.5,
      "memory_usage": 512
    }
  ],
  "services": [
    {
      "name": "miyabi-service-dev",
      "status": "running",
      "replicas": 2
    }
  ]
}
```

#### Get Topology

```http
GET /api/v1/infrastructure/topology
Authorization: Bearer <token>
```

---

### Activity

#### Get Stats

```http
GET /api/v1/activity/stats
Authorization: Bearer <token>
```

**Response**:
```json
{
  "totalEvents": 1500,
  "todayEvents": 150,
  "activeIssues": 5,
  "uptime": "99.9%"
}
```

#### Get Events

```http
GET /api/v1/activity/events?limit=50
Authorization: Bearer <token>
```

---

## WebSocket

### Connection

```javascript
const ws = new WebSocket('ws://miyabi-alb-dev-42521683.us-west-2.elb.amazonaws.com/ws')
```

### Event Types

| Event | Description |
|-------|-------------|
| `agent:status_changed` | Agent status updated |
| `agent:task_started` | Task execution started |
| `agent:task_completed` | Task execution completed |
| `agent:error` | Agent encountered error |
| `deployment:started` | Deployment initiated |
| `deployment:progress` | Deployment progress update |
| `deployment:completed` | Deployment finished |
| `deployment:failed` | Deployment failed |
| `system:metrics_updated` | System metrics refreshed |
| `system:alert` | System alert triggered |
| `database:query_completed` | Database query finished |

### Message Format

```json
{
  "type": "agent:status_changed",
  "timestamp": "2025-11-23T10:00:00Z",
  "data": {
    "agentId": "agent-001",
    "oldStatus": "idle",
    "newStatus": "running"
  }
}
```

---

## Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 400 | `BAD_REQUEST` | Invalid request parameters |
| 401 | `UNAUTHORIZED` | Missing or invalid token |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource not found |
| 500 | `INTERNAL_ERROR` | Server error |
| 503 | `SERVICE_UNAVAILABLE` | Service temporarily unavailable |

### Error Response Format

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Agent not found",
    "details": {
      "agentId": "invalid-id"
    }
  }
}
```

---

## Rate Limiting

- **Default**: 100 requests per minute per IP
- **Authenticated**: 1000 requests per minute per user

**Response Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1700740800
```

---

## Examples

### cURL - Get System Metrics

```bash
curl -X GET \
  'http://miyabi-alb-dev-42521683.us-west-2.elb.amazonaws.com/api/v1/metrics' \
  -H 'Authorization: Bearer <token>'
```

### cURL - List Agents

```bash
curl -X GET \
  'http://miyabi-alb-dev-42521683.us-west-2.elb.amazonaws.com/api/v1/agents' \
  -H 'Authorization: Bearer <token>'
```

### cURL - Trigger Deployment

```bash
curl -X POST \
  'http://miyabi-alb-dev-42521683.us-west-2.elb.amazonaws.com/api/v1/deployments' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{"environment": "staging"}'
```

---

**Maintained by**: Miyabi API Team
**Version**: 1.0.0
