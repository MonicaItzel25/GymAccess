import { defineConfig } from 'vitest/config';

// Configuración de pruebas del backend (entorno Node).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    // Detiene las pruebas si el destino no es `gym_db_pruebas` en local.
    setupFiles: ['./tests/setup/protegerBase.js'],
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
