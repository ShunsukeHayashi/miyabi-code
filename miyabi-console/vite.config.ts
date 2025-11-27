import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { apiMiddleware } from './src/api/middleware'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Custom plugin for API routes
    {
      name: 'api-routes',
      configureServer(server) {
        server.middlewares.use(apiMiddleware());
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    hmr: {
      overlay: false, // Disable error overlay to avoid Tailwind CSS module resolution issues
    },
  },
  optimizeDeps: {
    exclude: ['@tailwindcss/node'],
  },
  build: {
    // Manual chunks for better code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // UI library
          'vendor-heroui': ['@heroui/react'],
          // ReactFlow (heavy diagram library)
          'vendor-reactflow': ['@xyflow/react'],
          // Charts (heavy charting library)
          'vendor-recharts': ['recharts'],
          // Icons
          'vendor-icons': ['lucide-react'],
          // AI SDK
          'vendor-ai': ['ai', '@ai-sdk/google'],
        },
      },
    },
    // Increase chunk size warning limit (KB)
    chunkSizeWarningLimit: 600,
    // Enable source maps for production debugging
    sourcemap: false,
    // Minify output
    minify: 'esbuild',
    // Target modern browsers
    target: 'es2020',
  },
})
