# ClickFunnels Frontend

Modern sales funnel builder built with React, TypeScript, and Vite.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📦 Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Utility-first CSS
- **React Router** - Client-side routing
- **TanStack Query** - Server state management
- **Axios** - HTTP client
- **Zustand** - Client state management
- **Lucide React** - Icon library
- **ReactFlow** - Flow/diagram builder
- **GrapeJS** - WYSIWYG page editor

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── Dashboard/       # Dashboard UI
│   ├── FunnelBuilder/   # Funnel flow builder
│   └── PageEditor/      # WYSIWYG page editor
├── lib/                 # Utilities
│   └── api.ts           # API client
├── types/               # TypeScript definitions
│   └── index.ts         # Type definitions
├── App.tsx              # Root component
├── main.tsx             # Entry point
└── index.css            # Global styles
```

## 🔌 API Configuration

Set your API base URL in `.env`:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

## 📄 License

MIT
