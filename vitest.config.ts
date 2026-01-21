import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [],
  test: {
    include: ['test/unit/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/packages/**'],
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./test/setup.ts'],
    ssr: {
      noExternal: true,
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts', 'test/unit/**/*.test.ts'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/test/**', '**/packages/**'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
});
