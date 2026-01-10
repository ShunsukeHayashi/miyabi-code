---
name: Frontend Framework Workflow
description: Comprehensive Next.js, React, Tauri, and Vite frontend development workflow. Use when building, testing, or optimizing frontend applications across the Miyabi ecosystem.
allowed-tools: Bash, Read, Write, Edit, Grep, Glob
---

# ⚛️ Frontend Framework Workflow

**Version**: 1.0.0
**Last Updated**: 2025-01-10
**Priority**: ⭐⭐⭐⭐⭐ (P0 Level)
**Purpose**: フロントエンド開発の統合ワークフロー

---

## 📋 概要

Miyabiエコシステムの多様なフロントエンド技術スタック統合管理。
Next.js、React、Tauri、Viteの開発・ビルド・最適化を効率化します。

---

## 🎯 P0: 呼び出しトリガー

| トリガー | 例 |
|---------|-----|
| 開発サーバー | "start dev server", "run frontend" |
| ビルド | "build frontend", "create production build" |
| フレームワーク指定 | "next.js", "tauri", "vite", "react" |
| UI/UX作業 | "update UI", "fix layout", "responsive design" |
| パフォーマンス | "optimize frontend", "bundle analysis" |
| デプロイ | "deploy frontend", "production ready" |

---

## 🔧 P1: フレームワーク別構成

### 技術スタック分布

| Project | Framework | Version | Purpose | Port |
|---------|-----------|---------|---------|------|
| **Miyabi Private** | Next.js 14 | App Router | Main Dashboard | 3000 |
| **AI Course SaaS** | Next.js 14 | Pages Router | SaaS Platform | 3001 |
| **Gen-Studio** | React 19 + Tauri 2 | Desktop App | MUSE Desktop | 5173 |
| **AI Course Generator** | React + Vite | Web/Electron/Mobile | CCG v2 | 5174 |
| **MCP Inspector** | React + Express | Monorepo | MCP Tools | 3003 |

### 共通コマンド体系

```bash
# 開発サーバー起動
npm run dev          # Next.js, Vite
npm run tauri:dev    # Tauri (Gen-Studio)
npm run electron:dev # Electron (CCG)

# ビルド
npm run build        # 全フレームワーク共通
npm run tauri:build  # Tauri desktop app
npm run electron:build # Electron desktop app

# 品質チェック
npm run lint         # ESLint
npm run type-check   # TypeScript
npm run format       # Prettier
```

---

## 🚀 P2: フレームワーク別最適化

### Pattern 1: Next.js Development (Miyabi Private, SaaS)

```bash
# Next.js 14開発フロー（2-5分）
cd miyabi-private && \
npm run type-check && \
npm run lint && \
npm run build && \
npm run start
```

**特徴**:
- App Router (miyabi-private)
- Pages Router (course-saas)
- Prisma統合
- Tailwind CSS

```typescript
// app/layout.tsx (App Router)
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

### Pattern 2: Tauri Development (Gen-Studio)

```bash
# Tauri開発フロー（3-8分）
cd Gen-Studio && \
npm run type-check && \
npm run tauri:dev    # または npm run tauri:build
```

**特徴**:
- React 19
- Rust Backend
- WebSocket (port 9527)
- Desktop Native

```rust
// src-tauri/main.rs
#[tauri::command]
async fn generate_content(prompt: String) -> Result<String, String> {
    // Gemini API integration
    Ok(response)
}
```

### Pattern 3: Vite + Multi-Platform (CCG)

```bash
# Vite + Capacitor開発フロー（5-10分）
cd content-generator && \
npm run dev              # Web開発
npm run electron:dev     # Electron版
npm run ios:build        # iOS版
npm run android:build    # Android版
```

**特徴**:
- Vite高速ビルド
- Electron統合
- Capacitor (iOS/Android)
- モジュラー設計

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    react(),
    electron(electronConfig),
    // Capacitor plugin automatically added
  ],
  build: {
    target: 'esnext',
    rollupOptions: {
      external: ['electron']
    }
  }
})
```

### Pattern 4: レスポンシブUI最適化

```bash
# UI/UX開発フロー（1-3分）
npm run storybook     # Storybook (if available)
npm run test:visual   # Visual regression testing
npm run lighthouse    # Performance audit
```

**共通UIパターン**:

```typescript
// Tailwind responsive design
<div className="
  grid grid-cols-1
  md:grid-cols-2
  lg:grid-cols-3
  gap-4 p-4
  bg-background
  text-foreground
">
  <Card className="col-span-full md:col-span-1">
    {content}
  </Card>
</div>
```

---

## ⚡ P3: パフォーマンス最適化

### バンドル最適化

```javascript
// next.config.js
module.exports = {
  experimental: {
    appDir: true,
    turbo: {
      loaders: {
        '.md': ['raw-loader'],
      },
    },
  },
  webpack: (config) => {
    config.optimization.splitChunks.chunks = 'all'
    return config
  }
}
```

### コードスプリッティング

```typescript
// Dynamic imports
const LazyComponent = lazy(() => import('./HeavyComponent'))

// Next.js dynamic import
const DynamicComponent = dynamic(
  () => import('./components/DynamicComponent'),
  { ssr: false }
)
```

### バンドルサイズ分析

```bash
# Next.js bundle analysis
npm run analyze

# Vite bundle analysis
npx vite-bundle-analyzer dist

# Tauri bundle size
npm run tauri:build -- --verbose
```

### メトリクス目標値

| Metric | Next.js | Tauri | Vite |
|--------|---------|-------|------|
| First Contentful Paint | < 1.5s | < 0.8s | < 1.0s |
| Bundle Size | < 2MB | < 50MB | < 1MB |
| Build Time | < 3min | < 5min | < 1min |
| Hot Reload | < 200ms | < 500ms | < 100ms |

---

## 📊 環境設定と依存関係

### 共通依存関係

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "typescript": "^5.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0"
  },
  "devDependencies": {
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "tailwindcss": "^3.0.0"
  }
}
```

### フレームワーク固有設定

#### Next.js (miyabi-private, course-saas)
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "@prisma/client": "^5.0.0",
    "next-auth": "^4.0.0"
  }
}
```

#### Tauri (Gen-Studio)
```json
{
  "dependencies": {
    "@tauri-apps/api": "^2.0.0",
    "@tauri-apps/plugin-websocket": "^2.0.0"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.0.0"
  }
}
```

#### Vite + Electron (CCG)
```json
{
  "dependencies": {
    "@capacitor/core": "^5.0.0",
    "@capacitor/ios": "^5.0.0",
    "@capacitor/android": "^5.0.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "electron": "^27.0.0",
    "electron-builder": "^24.0.0"
  }
}
```

---

## 🛡️ トラブルシューティング

### 共通問題パターン

| 問題 | フレームワーク | 原因 | 対処 |
|------|-------------|------|------|
| Hydration Error | Next.js | SSR/Client不一致 | `suppressHydrationWarning` |
| Module Resolution | Vite | パス解決失敗 | `vite.config.ts` alias設定 |
| IPC Error | Tauri | Rust/JS通信エラー | `tauri.conf.json` allowlist確認 |
| Hot Reload無効 | 全般 | ファイル監視失敗 | ポート・権限確認 |
| Build失敗 | TypeScript | 型エラー | `npm run type-check` |

### 緊急復旧手順

```bash
# フロントエンド緊急リセット
function frontend_emergency_reset() {
    local project=$1
    echo "🚨 Frontend Emergency Reset: $project"

    # 開発サーバー停止
    pkill -f "next.*dev"
    pkill -f "vite.*dev"
    pkill -f "tauri.*dev"

    cd "$project"

    # 依存関係クリーンアップ
    rm -rf node_modules .next dist
    npm install

    # TypeScript/ESLint キャッシュクリア
    rm -rf .eslintcache tsconfig.tsbuildinfo

    # 再起動
    npm run dev

    echo "✅ Reset complete"
}
```

### デバッグコマンド

```bash
# Next.js詳細ログ
DEBUG=* npm run dev

# Vite詳細ログ
DEBUG=vite:* npm run dev

# Tauri詳細ログ
npm run tauri dev -- --verbose

# React DevTools
npm install -g react-devtools
react-devtools
```

---

## ✅ 成功基準

| チェック項目 | 基準 |
|-------------|------|
| **開発サーバー起動** | 30秒以内 |
| **TypeScript型チェック** | 0 errors |
| **ESLint** | 0 warnings (設定による) |
| **ビルド成功** | フレームワーク別目標時間内 |
| **番組ル分割** | 適切なchunk生成 |
| **レスポンシブ** | 全ブレークポイント対応 |

### 出力フォーマット

```
⚛️ Frontend Framework Results

✅ Framework: Next.js 14 (App Router)
✅ TypeScript: 0 errors, XX files checked
✅ Build: Completed in X.Xs (target: <3min)
✅ Bundle: XXkB gzipped (target: <2MB)
✅ Lighthouse: Performance XX/100
✅ Responsive: Mobile/Tablet/Desktop ✓

Frontend ready ✓
```

---

## 🔗 関連ドキュメント

| ドキュメント | 用途 |
|-------------|------|
| `docs/frontend/` | フロントエンド設計 |
| `components/README.md` | コンポーネント仕様 |
| `tailwind.config.js` | デザインシステム |

---

## 📝 関連Skills

- **Testing Framework**: フロントエンドテスト統合
- **Database Management**: API統合
- **Multi-Project Workspace**: 横断的フロントエンド操作
- **CI/CD Pipeline**: ビルド自動化
- **Performance Analysis**: フロントエンド最適化