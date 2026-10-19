// routes/membresia.routes.js
// Rutas de membresías. Escritura: administrador y recepcionista.
// Consulta: administrador, recepcionista y entrenador. El cliente no accede.
// ES Modules.

import { Router } from 'express';
import { autenticar } from '../middlewares/auth.js';
import { autorizar } from '../middlewares/authorize.js';
import {
  reglasCrearMembresia,
  reglasIdMembresia,
} from '../validators/membresia.validators.js';
import { validar } from '../validators/validar.js';
import { asignar, listar, obtener, renovar, suspender, reactivar, cancelar } from '../controllers/membresia.controller.js';

const router = Router();

router.use(autenticar);

// Escritura (US-S2-02): administrador o recepcionista
router.post('/', autorizar('administrador', 'recepcionista'), reglasCrearMembresia, validar, asignar);

// Ciclo de vida (US-S2-03): renovar admin/recep; suspender/reactivar/cancelar solo admin (FR-011, FR-012)
router.put('/:id/renovar', autorizar('administrador', 'recepcionista'), reglasIdMembresia, validar, renovar);
router.put('/:id/suspender', autorizar('administrador'), reglasIdMembresia, validar, suspender);
router.put('/:id/reactivar', autorizar('administrador'), reglasIdMembresia, validar, reactivar);
router.put('/:id/cancelar', autorizar('administrador'), reglasIdMembresia, validar, cancelar);

// Consulta (US-S2-02): administrador, recepcionista o entrenador
router.get('/', autorizar('administrador', 'recepcionista', 'entrenador'), listar);
router.get('/:id', autorizar('administrador', 'recepcionista', 'entrenador'), reglasIdMembresia, validar, obtener);

export default router;
