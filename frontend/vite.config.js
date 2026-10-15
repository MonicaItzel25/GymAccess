import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuración de desarrollo del frontend React.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // El frontend nunca accede a MySQL: toda consulta pasa por la API REST.
      '/api': 'http://127.0.0.1:3001',
    },
  },
});
