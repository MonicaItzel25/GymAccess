// routes/adeudo.routes.js
// Rutas de consulta de adeudos (FR-009, FR-010).
// GET /: solo administrador (consulta global, US-S2-05.3).
// GET /mio: solo cliente — se registra antes de la ruta genérica.
// ES Modules.

import { Router } from 'express';
import { autenticar } from '../middlewares/auth.js';
import { autorizar } from '../middlewares/authorize.js';
import { listar, mio } from '../controllers/adeudo.controller.js';

const router = Router();

router.use(autenticar);

// Información propia del cliente — DEBE ir antes de la ruta genérica.
router.get('/mio', autorizar('cliente'), mio);

// Consulta global: solo administrador (recepcionista recibe 403).
router.get('/', autorizar('administrador'), listar);

export default router;
