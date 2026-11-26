// routes/progreso.routes.js
// Rutas del progreso de los clientes (Sprint 3, US-S3-04).
// Recurso EXCLUSIVO del entrenador (contrato §6): recepcionista, cliente y
// administrador → 403 (US-S3-04.5, matriz §10). Solo consulta y alta: las
// entradas no se editan ni se borran (FR-021). El perfil activo y la
// asignación vigente se validan en el servicio (FR-003, RN-005). ES Modules.

import { Router } from 'express';
import { autenticar } from '../middlewares/auth.js';
import { autorizar } from '../middlewares/authorize.js';
import { validar } from '../validators/validar.js';
import {
  reglasListarProgresos,
  reglasCrearProgreso,
} from '../validators/progreso.validators.js';
import { listar, crear } from '../controllers/progreso.controller.js';

const router = Router();

router.use(autenticar);

// Consulta y alta: solo el entrenador (US-S3-04).
router.get('/', autorizar('entrenador'), reglasListarProgresos, validar, listar);
router.post('/', autorizar('entrenador'), reglasCrearProgreso, validar, crear);

export default router;
