import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'assets',
    rollupOptions: {
      input: {
        'agent-result': resolve(__dirname, 'src/components/AgentResultWidget.tsx'),
        'issue-list': resolve(__dirname, 'src/components/IssueListWidget.tsx'),
        'project-status': resolve(__dirname, 'src/components/ProjectStatusWidget.tsx'),
        'agent-status': resolve(__dirname, 'src/components/AgentStatusWidget.tsx'),
      },
      output: {
        entryFileNames: '[name].[hash].js',
        chunkFileNames: '[name].[hash].js',
        assetFileNames: '[name].[hash].[ext]',
      },
    },
  },
  server: {
    port: 4444,
    host: true,
    cors: true,
  },
});
