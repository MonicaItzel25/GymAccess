// routes/entrenador.routes.js
// Rutas de perfiles de entrenador (Sprint 3, US-S3-01).
// Escritura: solo administrador. Consulta: administrador y recepcionista
// (contrato §1, matriz de denegaciones §10). ES Modules.

import { Router } from 'express';
import { autenticar } from '../middlewares/auth.js';
import { autorizar } from '../middlewares/authorize.js';
import { validar } from '../validators/validar.js';
import {
  reglasCrearEntrenador,
  reglasModificarEntrenador,
  reglasCambiarEstadoEntrenador,
  reglasIdEntrenador,
} from '../validators/entrenador.validators.js';
import {
  listar,
  obtener,
  crear,
  actualizar,
  cambiarEstado,
} from '../controllers/entrenador.controller.js';

const router = Router();

router.use(autenticar);

// Escritura (US-S3-01): solo administrador.
router.post('/', autorizar('administrador'), reglasCrearEntrenador, validar, crear);
router.put('/:id', autorizar('administrador'), reglasIdEntrenador, reglasModificarEntrenador, validar, actualizar);
router.put('/:id/estado', autorizar('administrador'), reglasIdEntrenador, reglasCambiarEstadoEntrenador, validar, cambiarEstado);

// Consulta: administrador y recepcionista.
router.get('/', autorizar('administrador', 'recepcionista'), listar);
router.get('/:id', autorizar('administrador', 'recepcionista'), reglasIdEntrenador, validar, obtener);

export default router;
