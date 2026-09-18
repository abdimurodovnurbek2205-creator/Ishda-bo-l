import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@repo/types': path.resolve(__dirname, './packages/types/src/index.ts'),
      '@repo/database': path.resolve(__dirname, './packages/database/src/index.ts'),
      '@': path.resolve(__dirname, './apps/web'),
    },
  },
});
