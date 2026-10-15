// app.js
// Factoría de la aplicación Express. Aquí se montan las rutas de cada
// historia de usuario en su fase correspondiente.
// ES Modules.

import express from 'express';
import { errorHandler } from './middlewares/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import usuarioRoutes from './routes/usuario.routes.js';
import clienteRoutes from './routes/cliente.routes.js';
import membresiaRoutes from './routes/membresia.routes.js';
import rostroRoutes from './routes/rostro.routes.js';
import accesoRoutes from './routes/acceso.routes.js';
import accesoConsultaRoutes from './routes/accesoConsulta.routes.js';
import auditoriaRoutes from './routes/auditoria.routes.js';
import tipoMembresiaRoutes from './routes/tipoMembresia.routes.js';
import pagoRoutes from './routes/pago.routes.js';
import adeudoRoutes from './routes/adeudo.routes.js';

export function crearApp() {
  const app = express();

  app.use(express.json());

  // Rutas montadas por fase:
  //   Fase 3 (US1): /api/auth        → auth.routes.js
  //   Fase 4 (US2): /api/usuarios    → usuario.routes.js
  //   Fase 6 (US4): /api/clientes    → cliente.routes.js
  //   Sprint 2 US-S2-02: /api/membresias → membresia.routes.js
  app.use('/api/auth', authRoutes);
  app.use('/api/usuarios', usuarioRoutes);
  app.use('/api/clientes', clienteRoutes);
  // Rutas faciales bajo /api/clientes/:id/rostro (Sprint 2, US-S2-06).
  app.use('/api/clientes', rostroRoutes);
  app.use('/api/membresias', membresiaRoutes);
  // Tipos de membresía (Sprint 2, US-S2-01).
  app.use('/api/tipos-membresia', tipoMembresiaRoutes);
  // Pagos (Sprint 2, US-S2-04).
  app.use('/api/pagos', pagoRoutes);
  // Adeudos (Sprint 2, US-S2-05).
  app.use('/api/adeudos', adeudoRoutes);
  // Control de acceso (Sprint 2, US-S2-08). El POST /intento es el kiosco sin token.
  app.use('/api/acceso', accesoRoutes);
  // Consulta de registros de acceso (Sprint 2, US-S2-09).
  app.use('/api/accesos', accesoConsultaRoutes);
  // Auditoría (Sprint 2, FR-021): solo administrador.
  app.use('/api/auditoria', auditoriaRoutes);

  // Respuesta para rutas desconocidas (antes del manejador de errores).
  app.use((req, res) => {
    res.status(404).json({ ok: false, message: 'Recurso no encontrado' });
  });

  // Manejo de errores centralizado: siempre al final de la cadena.
  app.use(errorHandler);

  return app;
}
