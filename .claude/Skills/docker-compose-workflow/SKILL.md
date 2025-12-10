---
name: docker-compose-workflow
description: Manage Docker Compose workflows for Miyabi development and deployment. Use when building, running, or managing containerized services. Triggers include "docker compose", "container management", "docker build", "service orchestration", "container logs", or any Docker-related operations.
---

# Docker Compose Workflow

Manage containerized Miyabi services with Docker Compose.

## Project Structure

```
miyabi/
├── docker-compose.yml          # Main compose file
├── docker-compose.dev.yml      # Development overrides
├── docker-compose.prod.yml     # Production overrides
├── .env                        # Environment variables
├── Dockerfile                  # Main app Dockerfile
└── services/
    ├── api/Dockerfile
    ├── mcp/Dockerfile
    └── worker/Dockerfile
```

## Quick Commands

### Basic Operations
```bash
# Start all services
docker compose up -d

# Start with build
docker compose up -d --build

# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v

# Restart specific service
docker compose restart api
```

### Development Mode
```bash
# Start with dev overrides
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Watch logs
docker compose logs -f

# Specific service logs
docker compose logs -f api
```

### Production Mode
```bash
# Deploy with production config
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Scale services
docker compose up -d --scale worker=3
```

## Compose File Template

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: services/api/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - db
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  mcp-server:
    build:
      context: .
      dockerfile: services/mcp/Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - ./config:/app/config:ro
    environment:
      - MCP_PORT=8000

  worker:
    build:
      context: .
      dockerfile: services/worker/Dockerfile
    environment:
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    deploy:
      replicas: 2

  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=${DB_NAME}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

volumes:
  postgres_data:
  redis_data:

networks:
  default:
    name: miyabi-network
```

## Development Overrides

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  api:
    build:
      target: development
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - DEBUG=true
    command: npm run dev

  mcp-server:
    volumes:
      - ./services/mcp:/app
    command: npm run dev
```

## Dockerfile Best Practices

```dockerfile
# Multi-stage build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["npm", "run", "dev"]

FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
USER node
CMD ["npm", "start"]
```

## Health Checks

### API Service
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Database
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres"]
  interval: 10s
  timeout: 5s
  retries: 5
```

### Redis
```yaml
healthcheck:
  test: ["CMD", "redis-cli", "ping"]
  interval: 10s
  timeout: 5s
  retries: 5
```

## Troubleshooting

### View Container Status
```bash
# All containers
docker compose ps

# Detailed status
docker compose ps -a --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
```

### Debugging
```bash
# Enter container shell
docker compose exec api sh

# Run one-off command
docker compose run --rm api npm test

# View container config
docker compose config
```

### Common Issues

#### Port Already in Use
```bash
# Find process using port
lsof -i :3000
# or
netstat -tulpn | grep 3000

# Kill process or change port in compose
```

#### Container Won't Start
```bash
# Check logs
docker compose logs api

# Check events
docker events --filter 'container=miyabi-api'

# Inspect container
docker inspect miyabi-api-1
```

#### Volume Permission Issues
```bash
# Fix permissions
docker compose run --rm api chown -R node:node /app/data
```

## Resource Management

### Limit Resources
```yaml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

### Cleanup
```bash
# Remove stopped containers
docker compose rm

# Remove unused images
docker image prune

# Full cleanup
docker system prune -a --volumes
```

## Best Practices

1. Use multi-stage builds for smaller images
2. Always define health checks
3. Use named volumes for persistent data
4. Separate dev/prod configurations
5. Don't store secrets in compose files
6. Use .dockerignore to exclude unnecessary files
7. Pin image versions in production
