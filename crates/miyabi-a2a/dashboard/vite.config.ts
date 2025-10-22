import {defineConfig} from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import vitePluginInjectDataLocator from "./plugins/vite-plugin-inject-data-locator";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), vitePluginInjectDataLocator(), tailwindcss()],
  server: {
    allowedHosts: true,
    proxy: {
      '/v1': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/.well-known': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 1000, // 1MB
    // Rollup options for better chunking
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom', 'react/jsx-runtime'],
          'vendor-heroui': ['@heroui/react', '@heroui/system', '@heroui/theme'],
          'vendor-charts': ['recharts'],
          'vendor-framer': ['framer-motion'],
          'vendor-iconify': ['@iconify/react'],
          // Heavy libraries
          'vendor-cytoscape': ['cytoscape', 'cytoscape-dagre'],
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Source maps (disabled in production for performance)
    sourcemap: false,
    // CSS code splitting
    cssCodeSplit: true,
  },
  // Performance optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@heroui/react',
      '@iconify/react',
      'framer-motion',
    ],
  },
});