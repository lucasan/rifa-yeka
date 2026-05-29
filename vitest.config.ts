import { defineConfig } from 'vitest/config';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
});
