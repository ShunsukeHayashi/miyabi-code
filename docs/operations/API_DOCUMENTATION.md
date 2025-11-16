# Miyabi API Documentation

**Version**: 1.0.0

## Overview
Miyabi exposes REST APIs for orchestration and management.

## Authentication
All API requests require an API key:
```
Authorization: Bearer YOUR_API_KEY
```

## Core Endpoints

### Issues API
```
GET  /api/v1/issues           - List issues
POST /api/v1/issues           - Create issue
GET  /api/v1/issues/:id       - Get issue details
PUT  /api/v1/issues/:id       - Update issue
```

### Pull Requests API
```
GET  /api/v1/prs              - List PRs
POST /api/v1/prs              - Create PR
GET  /api/v1/prs/:id          - Get PR details
POST /api/v1/prs/:id/merge    - Merge PR
```

### Agents API
```
GET  /api/v1/agents           - List agents
POST /api/v1/agents/execute   - Execute agent task
GET  /api/v1/agents/:id/status - Get agent status
```

## Example Requests

### Create Issue
```bash
curl -X POST https://api.miyabi.dev/v1/issues \
  -H "Authorization: Bearer YOUR_KEY" \
  -d '{"title": "New feature", "body": "Description"}'
```

### Merge PR
```bash
curl -X POST https://api.miyabi.dev/v1/prs/123/merge \
  -H "Authorization: Bearer YOUR_KEY" \
  -d '{"method": "squash"}'
```

## Rate Limits
- 100 requests/minute (authenticated)
- 10 requests/minute (unauthenticated)

---
**Last Updated**: 2025-11-17
