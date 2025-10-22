# Miyabi Web Platform

**Autonomous AI Agent Orchestration Platform - Frontend**

## Overview

Next.js 14 (App Router) based web interface for Miyabi autonomous agent platform.

## Technology Stack

- **Framework**: Next.js 14
- **Language**: TypeScript 5.3
- **UI Library**: React 18
- **Styling**: Tailwind CSS 3.4
- **Component Library**: shadcn/ui (to be added)
- **State Management**: Zustand (to be added)
- **Data Fetching**: TanStack Query (to be added)

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
pnpm build
```

### Production

```bash
pnpm start
```

## Project Structure

```
miyabi-web/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── layout.tsx   # Root layout
│   │   ├── page.tsx     # Home page
│   │   └── globals.css  # Global styles
│   ├── components/      # React components (to be added)
│   ├── lib/             # Utilities (to be added)
│   └── types/           # TypeScript types (to be added)
├── public/              # Static assets (to be added)
├── next.config.mjs      # Next.js configuration
├── tailwind.config.ts   # Tailwind configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Dependencies
```

## Features

### Phase 0: Foundation (Current)
- [x] Next.js 14 project setup
- [x] TypeScript configuration
- [x] Tailwind CSS styling
- [x] Basic home page

### Phase 1: Authentication (Next)
- [ ] GitHub OAuth integration
- [ ] JWT token management
- [ ] Protected routes

### Phase 2: Dashboard
- [ ] Repository list
- [ ] Agent execution history
- [ ] Real-time status updates

### Phase 3: Workflow Editor
- [ ] Visual workflow editor (React Flow)
- [ ] DAG visualization
- [ ] Task dependency management

### Phase 4: Real-time Monitoring
- [ ] WebSocket integration
- [ ] Live agent status
- [ ] Progress indicators

### Phase 5: Mobile Support
- [ ] Responsive design
- [ ] PWA features
- [ ] Mobile optimizations

### Phase 6: LINE Bot Integration
- [ ] LINE webhook UI
- [ ] Message templates
- [ ] Notification settings

## Environment Variables

Create `.env.local` file:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_client_id
```

## License

MIT

## Related

- **Backend API**: [`../crates/miyabi-web-api`](../crates/miyabi-web-api)
- **Architecture Design**: [`../docs/ARCHITECTURE_DESIGN.md`](../docs/ARCHITECTURE_DESIGN.md)
- **Issue**: [#425](https://github.com/customer-cloud/miyabi-private/issues/425)
