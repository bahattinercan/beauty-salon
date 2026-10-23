import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * AP-003 — React bileşen test kapısı.
 *
 * Kapsam bilinçli olarak dardır: yalnız `tests/unit/**` (jsdom bileşen testleri).
 * AP-002'nin `tests/lib/**` altındaki `node:test` paketi buraya GİRMEZ; o paket
 * `node_modules` olmadan da çalışan ağsız/offline kapı olarak korunur ve
 * `npm run test:node` ile ayrıca koşar.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.tsx'],
    exclude: ['tests/lib/**', 'node_modules/**', '.next/**'],
    setupFiles: ['./tests/unit/setup.ts'],
    globals: false,
    restoreMocks: true,
    clearMocks: true,
  },
});
