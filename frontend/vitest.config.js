import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Configuración de pruebas del frontend (componentes con jsdom).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{js,jsx}'],
    globals: true,
  },
});
