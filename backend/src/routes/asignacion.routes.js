// routes/asignacion.routes.js
// Rutas de asignaciones entrenador–cliente (Sprint 3, US-S3-02).
// Consulta: administrador, recepcionista y entrenador; el entrenador siempre
// recibe solo las SUYAS (semántica aplicada en el servicio, contrato §2,
// FR-008). Escritura: administrador y recepcionista (matriz §10). ES Modules.

import { Router } from 'express';
import { autenticar } from '../middlewares/auth.js';
import { autorizar } from '../middlewares/authorize.js';
import { validar } from '../validators/validar.js';
import {
  reglasCrearAsignacion,
  reglasFinalizarAsignacion,
  reglasIdAsignacion,
} from '../validators/asignacion.validators.js';
import { listar, crear, finalizar } from '../controllers/asignacion.controller.js';

const router = Router();

router.use(autenticar);

// Consulta (US-S3-02.1): administrador, recepcionista y entrenador.
router.get('/', autorizar('administrador', 'recepcionista', 'entrenador'), listar);

// Escritura (US-S3-02): administrador o recepcionista.
router.post('/', autorizar('administrador', 'recepcionista'), reglasCrearAsignacion, validar, crear);
router.put(
  '/:id/finalizar',
  autorizar('administrador', 'recepcionista'),
  reglasIdAsignacion,
  reglasFinalizarAsignacion,
  validar,
  finalizar
);

export default router;
