# Pantheon Webapp

Pantheon Society management dashboard for Miyabi orchestration.

## Overview

Web-based interface for managing:
- Society composition and agent assignments
- Inter-society communication protocols
- Task orchestration and monitoring
- Performance metrics and analytics

## Architecture

```
Frontend (React/Next.js)
    ↓
Pantheon API Gateway
    ↓
Miyabi Core ← Society Agents
```

## Development

```bash
npm install
npm run dev
```

## Integration

Connects to:
- Miyabi Core orchestration system
- AIFactory for agent provisioning
- GitHub for task tracking
- Lark for notifications
