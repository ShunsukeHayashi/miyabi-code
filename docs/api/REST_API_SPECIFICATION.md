# Miyabi Web UI - REST API Specification

**Version**: 1.0  
**Base URL**: `https://api.miyabi.dev` (Production) | `http://localhost:3001` (Development)  
**Protocol**: HTTPS  
**Authentication**: Bearer Token (JWT)

---

## Table of Contents

1. [Authentication Endpoints](#authentication-endpoints)
2. [Repository Endpoints](#repository-endpoints)
3. [Issue Endpoints](#issue-endpoints)
4. [Agent Endpoints](#agent-endpoints)
5. [Workflow Endpoints](#workflow-endpoints)
6. [Dashboard Endpoints](#dashboard-endpoints)
7. [Error Responses](#error-responses)

---

## Authentication Endpoints

### 1.1 GitHub OAuth Redirect

**Endpoint**: `GET /api/auth/github`

**Description**: Initiates GitHub OAuth flow

**Response**:
```http
HTTP/1.1 302 Found
Location: https://github.com/login/oauth/authorize?client_id=xxx&redirect_uri=xxx&scope=repo,read:user
```

---

### 1.2 GitHub OAuth Callback

**Endpoint**: `GET /api/auth/github/callback`

**Query Parameters**:
- `code` (string, required): OAuth authorization code from GitHub

**Response** (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "githubUsername": "ShunsukeHayashi",
    "email": "shunsuke@example.com",
    "avatarUrl": "https://avatars.githubusercontent.com/u/11504206"
  }
}
```

---

### 1.3 Get Current User

**Endpoint**: `GET /api/auth/me`

**Headers**:
```http
Authorization: Bearer <JWT_TOKEN>
```

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "githubUsername": "ShunsukeHayashi",
  "email": "shunsuke@example.com",
  "avatarUrl": "https://avatars.githubusercontent.com/u/11504206",
  "lineConnected": false
}
```

---

### 1.4 Logout

**Endpoint**: `POST /api/auth/logout`

**Headers**:
```http
Authorization: Bearer <JWT_TOKEN>
```

**Response** (200 OK):
```json
{
  "success": true
}
```

---

## Repository Endpoints

### 2.1 List Repositories

**Endpoint**: `GET /api/repositories`

**Headers**:
```http
Authorization: Bearer <JWT_TOKEN>
```

**Response** (200 OK):
```json
{
  "repositories": [
    {
      "id": "repo-uuid-1",
      "githubRepoId": 123456789,
      "owner": "ShunsukeHayashi",
      "name": "Miyabi",
      "fullName": "ShunsukeHayashi/Miyabi",
      "defaultBranch": "main",
      "isActive": true,
      "createdAt": "2025-10-22T10:00:00Z",
      "updatedAt": "2025-10-22T10:00:00Z"
    }
  ]
}
```

---

### 2.2 Connect Repository

**Endpoint**: `POST /api/repositories`

**Headers**:
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body**:
```json
{
  "githubRepoId": 123456789,
  "owner": "ShunsukeHayashi",
  "name": "Miyabi"
}
```

**Response** (201 Created):
```json
{
  "id": "repo-uuid-1",
  "githubRepoId": 123456789,
  "owner": "ShunsukeHayashi",
  "name": "Miyabi",
  "fullName": "ShunsukeHayashi/Miyabi",
  "defaultBranch": "main",
  "isActive": true,
  "createdAt": "2025-10-22T10:00:00Z",
  "updatedAt": "2025-10-22T10:00:00Z"
}
```

---

### 2.3 Delete Repository Connection

**Endpoint**: `DELETE /api/repositories/:id`

**Headers**:
```http
Authorization: Bearer <JWT_TOKEN>
```

**Response** (204 No Content)

---

## Issue Endpoints

### 3.1 List Issues

**Endpoint**: `GET /api/repositories/:repoId/issues`

**Headers**:
```http
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters**:
- `state` (string, optional): `open` | `closed` | `all` (default: `open`)
- `label` (string, optional): Filter by label
- `page` (integer, optional): Page number (default: 1)
- `per_page` (integer, optional): Results per page (default: 30, max: 100)

**Response** (200 OK):
```json
{
  "issues": [
    {
      "number": 270,
      "title": "Implement authentication UI",
      "body": "Description...",
      "state": "open",
      "labels": ["✨ type:feature", "🔥 priority:P0-Critical"],
      "createdAt": "2025-10-20T10:00:00Z",
      "updatedAt": "2025-10-22T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 30,
    "totalCount": 150
  }
}
```

---

### 3.2 Get Issue Detail

**Endpoint**: `GET /api/repositories/:repoId/issues/:number`

**Headers**:
```http
Authorization: Bearer <JWT_TOKEN>
```

**Response** (200 OK):
```json
{
  "number": 270,
  "title": "Implement authentication UI",
  "body": "Description...",
  "state": "open",
  "labels": ["✨ type:feature", "🔥 priority:P0-Critical"],
  "assignees": ["ShunsukeHayashi"],
  "createdAt": "2025-10-20T10:00:00Z",
  "updatedAt": "2025-10-22T10:00:00Z",
  "comments": 5
}
```

---

## Agent Endpoints

### 4.1 List Available Agents

**Endpoint**: `GET /api/agents`

**Headers**:
```http
Authorization: Bearer <JWT_TOKEN>
```

**Response** (200 OK):
```json
{
  "agents": [
    {
      "type": "Coordinator",
      "displayName": "しきるん",
      "description": "Issue分析・タスク分解",
      "category": "coding",
      "estimatedDuration": 300
    },
    {
      "type": "CodeGen",
      "displayName": "つくるん",
      "description": "AI駆動コード生成",
      "category": "coding",
      "estimatedDuration": 600
    }
  ]
}
```

---

### 4.2 Execute Agent

**Endpoint**: `POST /api/agents/execute`

**Headers**:
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body**:
```json
{
  "repositoryId": "repo-uuid-1",
  "agentType": "CodeGen",
  "issueNumber": 270,
  "options": {
    "useWorktree": true,
    "autoCreatePR": true,
    "notifySlack": false
  }
}
```

**Response** (202 Accepted):
```json
{
  "executionId": "exec-uuid-1",
  "status": "pending",
  "estimatedCompletionAt": "2025-10-22T10:10:00Z"
}
```

---

### 4.3 Get Agent Execution Status

**Endpoint**: `GET /api/agents/executions/:executionId`

**Headers**:
```http
Authorization: Bearer <JWT_TOKEN>
```

**Response** (200 OK):
```json
{
  "id": "exec-uuid-1",
  "agentType": "CodeGen",
  "status": "running",
  "startedAt": "2025-10-22T10:05:00Z",
  "progress": 50,
  "currentStep": "コード生成中...",
  "errorMessage": null,
  "result": null
}
```

**Possible Statuses**:
- `pending`: Agent execution queued
- `running`: Agent currently executing
- `completed`: Agent execution completed successfully
- `failed`: Agent execution failed

---

### 4.4 Cancel Agent Execution

**Endpoint**: `POST /api/agents/executions/:executionId/cancel`

**Headers**:
```http
Authorization: Bearer <JWT_TOKEN>
```

**Response** (200 OK):
```json
{
  "success": true,
  "executionId": "exec-uuid-1",
  "status": "canceled"
}
```

---

## Workflow Endpoints

### 5.1 List Workflows

**Endpoint**: `GET /api/workflows`

**Headers**:
```http
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters**:
- `template` (boolean, optional): Filter by templates
- `public` (boolean, optional): Filter by public workflows

**Response** (200 OK):
```json
{
  "workflows": [
    {
      "id": "workflow-uuid-1",
      "name": "Standard Code Review Flow",
      "description": "CodeGen → Review → PR",
      "definition": {
        "nodes": [...],
        "edges": [...]
      },
      "isTemplate": true,
      "isPublic": true,
      "createdAt": "2025-10-20T10:00:00Z"
    }
  ]
}
```

---

### 5.2 Create Workflow

**Endpoint**: `POST /api/workflows`

**Headers**:
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "My Custom Workflow",
  "description": "Custom workflow description",
  "repositoryId": "repo-uuid-1",
  "definition": {
    "nodes": [
      {
        "id": "node-1",
        "type": "agent",
        "data": { "agentType": "CodeGen" },
        "position": { "x": 100, "y": 100 }
      }
    ],
    "edges": [
      {
        "id": "edge-1",
        "source": "node-1",
        "target": "node-2"
      }
    ]
  }
}
```

**Response** (201 Created):
```json
{
  "id": "workflow-uuid-2",
  "name": "My Custom Workflow",
  "description": "Custom workflow description",
  "definition": { ... },
  "isTemplate": false,
  "isPublic": false,
  "createdAt": "2025-10-22T10:00:00Z"
}
```

---

### 5.3 Update Workflow

**Endpoint**: `PUT /api/workflows/:id`

**Headers**:
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body**: (Same as Create Workflow)

**Response** (200 OK): (Same as Create Workflow response)

---

### 5.4 Delete Workflow

**Endpoint**: `DELETE /api/workflows/:id`

**Headers**:
```http
Authorization: Bearer <JWT_TOKEN>
```

**Response** (204 No Content)

---

### 5.5 Execute Workflow

**Endpoint**: `POST /api/workflows/:id/execute`

**Headers**:
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body**:
```json
{
  "issueNumber": 270,
  "options": {
    "useWorktree": true,
    "autoCreatePR": true
  }
}
```

**Response** (202 Accepted):
```json
{
  "workflowExecutionId": "wf-exec-uuid-1",
  "agentExecutions": [
    {
      "executionId": "exec-uuid-1",
      "agentType": "CodeGen",
      "status": "pending"
    },
    {
      "executionId": "exec-uuid-2",
      "agentType": "Review",
      "status": "pending"
    }
  ]
}
```

---

## Dashboard Endpoints

### 6.1 Get Dashboard Summary

**Endpoint**: `GET /api/dashboard/summary`

**Headers**:
```http
Authorization: Bearer <JWT_TOKEN>
```

**Response** (200 OK):
```json
{
  "runningCount": 3,
  "completedCount": 45,
  "errorCount": 2,
  "totalIssuesProcessed": 50
}
```

---

### 6.2 Get Recent Executions

**Endpoint**: `GET /api/dashboard/recent-executions`

**Headers**:
```http
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters**:
- `limit` (integer, optional): Max results (default: 10, max: 50)

**Response** (200 OK):
```json
{
  "executions": [
    {
      "id": "exec-uuid-1",
      "agentType": "CodeGen",
      "issueNumber": 270,
      "status": "completed",
      "startedAt": "2025-10-22T10:00:00Z",
      "completedAt": "2025-10-22T10:05:00Z"
    }
  ]
}
```

---

## Error Responses

### Standard Error Format

All error responses follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

### HTTP Status Codes

- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `202 Accepted`: Request accepted for async processing
- `204 No Content`: Request succeeded with no response body
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate)
- `422 Unprocessable Entity`: Validation error
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Service temporarily unavailable

### Error Codes

- `INVALID_TOKEN`: JWT token is invalid or expired
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Request validation failed
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Internal server error

### Example Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "issueNumber",
      "reason": "must be a positive integer"
    }
  }
}
```

---

## Rate Limiting

- **Rate Limit**: 1000 requests per hour per user
- **Headers**:
  - `X-RateLimit-Limit`: Total allowed requests
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Unix timestamp when limit resets

---

## Versioning

API versioning is handled via URL path:
- Current version: `/api/*` (v1)
- Future versions: `/api/v2/*`

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- All UUIDs are in standard UUID v4 format
- All responses are in JSON format
- Request bodies must be valid JSON
