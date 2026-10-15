import { defineConfig } from 'vitest/config';

// Configuración de pruebas del backend (entorno Node).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    hookTimeout: 30000,
    testTimeout: 30000,
    // Las suites comparten una única base de datos MySQL local y algunas usan
    // transacciones con bloqueo (FOR UPDATE) para la regla de una sola
    // membresía vigente. Ejecutar los archivos en paralelo provocaría bloqueos
    // cruzados entre suites, por lo que se ejecutan en serie.
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      include: ['src/**'],
    },
  },
});
