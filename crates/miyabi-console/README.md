# Miyabi Console

**Version**: 1.0.0
**Status**: ✅ Production Ready

The official unified console for the Miyabi autonomous development framework.

---

## 🎯 Overview

Miyabi Console is a comprehensive web-based dashboard for monitoring and managing the Miyabi development framework. It provides real-time visibility into agents, issues, pull requests, deployments, logs, and more.

### Features

- ✅ **8 Full-Featured Pages** - Complete development monitoring
- ✅ **Real-time Updates** - WebSocket-based live data
- ✅ **GitHub Integration** - Direct GitHub API access
- ✅ **57-Label System** - Comprehensive issue classification
- ✅ **DAG Visualization** - Agent dependency graphs
- ✅ **Mission Control** - Centralized system health monitoring

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Miyabi Backend API (miyabi-web-api) running on port 8080
- PostgreSQL database (for backend)

### Installation

```bash
cd crates/miyabi-console

# Install dependencies
npm install

# Start development server
npm run dev
```

The console will be available at **http://localhost:5173**

---

## 📊 Technology Stack

- **React 19.1.1** - UI library
- **Vite 7.1.7** - Build tool
- **Ant Design 5.27.6** - UI components
- **React Router 7.9.4** - Routing
- **React Flow 11.11.4** - DAG visualization
- **TypeScript 5.9.3** - Type safety

---

## 📚 Documentation

- **Console Architecture**: `/docs/CONSOLE_ARCHITECTURE.md`
- **Backend API**: `/crates/miyabi-web-api/README.md`

---

**Last Updated**: 2025-11-18
