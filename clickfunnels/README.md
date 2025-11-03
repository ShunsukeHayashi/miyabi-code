# ClickFunnels - Phase 0 Setup

Complete ClickFunnels implementation using Rust + React + PostgreSQL.

## Project Structure

```
clickfunnels/
├── backend/              # Rust backend (Axum)
│   ├── crates/
│   │   ├── clickfunnels-core/          # Domain models
│   │   ├── clickfunnels-api/           # REST API
│   │   ├── clickfunnels-db/            # Database layer
│   │   └── clickfunnels-integrations/  # External integrations
│   └── Cargo.toml
├── frontend/             # React frontend (Vite + TypeScript)
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── database/             # PostgreSQL schemas
│   └── migrations/
│       └── 001_init_schema.sql
└── docker-compose.yml    # Docker orchestration
```

## Quick Start

### Using Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Manual Setup

#### 1. Database
```bash
# Start PostgreSQL
docker-compose up -d postgres

# Apply migrations
psql -U clickfunnels -d clickfunnels -f database/migrations/001_init_schema.sql
```

#### 2. Backend
```bash
cd backend
cargo run --release
```

#### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

## Services

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **PostgreSQL**: localhost:5432

## Database Schema

10 tables:
- users
- funnels
- pages
- products
- contacts
- orders
- integrations
- email_campaigns
- affiliates
- affiliate_referrals

## Development

### Backend
```bash
cd backend
cargo check    # Type checking
cargo test     # Run tests
cargo clippy   # Linting
```

### Frontend
```bash
cd frontend
npm run lint   # ESLint
npm run build  # Production build
```

## Phase 0 Complete ✅

- ✅ T001: Rust Workspace initialized
- ✅ T002: React + TypeScript frontend
- ✅ T003: PostgreSQL schema (10 tables)
- ✅ T004: Docker Compose orchestration

## Next Steps (Phase 1)

- T010: Implement User Entity
- T011: Implement Funnel Entity
- T012: Implement Page Entity
- T013: Implement Integration Entity

🤖 Generated with [Claude Code](https://claude.com/claude-code)
