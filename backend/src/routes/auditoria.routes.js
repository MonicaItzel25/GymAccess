// routes/auditoria.routes.js
// Rutas de auditoría (FR-037, FR-038). GET /api/auditoria: solo administrador.
// No existe ninguna ruta DELETE (FR-038, SC-005). ES Modules.

import { Router } from 'express';
import { autenticar } from '../middlewares/auth.js';
import { autorizar } from '../middlewares/authorize.js';
import { listar } from '../controllers/auditoria.controller.js';

const router = Router();

router.use(autenticar);

// Consulta global de auditoría: exclusiva del administrador.
router.get('/', autorizar('administrador'), listar);

export default router;
