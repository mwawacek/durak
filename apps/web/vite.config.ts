import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(dirname, 'src'),
      // The shared package is published as CommonJS (the backend needs CJS).
      // Vite / Rollup can't analyse `__exportStar(require(...))` for named
      // imports, so we point the web bundle at the TS source directly.
      // Typecheck still resolves through `@durak/shared`'s package.json types
      // field, so contracts stay strict.
      '@durak/shared': path.resolve(dirname, '../../packages/shared/src/index.ts'),
    },
  },
  server: {
    host: true,
    port: 5173,
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
});
