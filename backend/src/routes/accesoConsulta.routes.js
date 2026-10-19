// routes/accesoConsulta.routes.js
// Consulta de registros de acceso (FR-035, FR-036).
// GET /api/accesos: administrador, recepcionista y entrenador (filtros
// ?desde=, ?hasta=, ?cliente=).
// GET /api/accesos/mio: solo cliente — registrado antes de la ruta genérica.
// ES Modules.

import { Router } from 'express';
import { autenticar } from '../middlewares/auth.js';
import { autorizar } from '../middlewares/authorize.js';
import { listar, mio } from '../controllers/acceso.controller.js';

const router = Router();

router.use(autenticar);

// Información propia del cliente — DEBE ir antes de la ruta genérica.
router.get('/mio', autorizar('cliente'), mio);

// Historial para administrador, recepcionista y entrenador (FR-035).
router.get('/', autorizar('administrador', 'recepcionista', 'entrenador'), listar);

export default router;
