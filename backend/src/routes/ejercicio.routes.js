// routes/ejercicio.routes.js
// Rutas del catálogo de ejercicios (Sprint 3, US-S3-08).
// GET: administrador y entrenador (el entrenador solo recibe activos, FR-012).
// Escritura (POST/PUT): SOLO administrador (FR-011, Clarification Q2;
// recepcionista, entrenador y cliente → 403, matriz de denegaciones §10).
// ES Modules.

import { Router } from 'express';
import { autenticar } from '../middlewares/auth.js';
import { autorizar } from '../middlewares/authorize.js';
import { validar } from '../validators/validar.js';
import {
  reglasCrearEjercicio,
  reglasModificarEjercicio,
  reglasCambiarEstadoEjercicio,
  reglasIdEjercicio,
} from '../validators/ejercicio.validators.js';
import { listar, crear, actualizar, cambiarEstado } from '../controllers/ejercicio.controller.js';

const router = Router();

router.use(autenticar);

// Consulta (US-S3-08.2): administrador y entrenador.
router.get('/', autorizar('administrador', 'entrenador'), listar);

// Escritura (US-S3-08): solo administrador.
router.post('/', autorizar('administrador'), reglasCrearEjercicio, validar, crear);
router.put('/:id', autorizar('administrador'), reglasIdEjercicio, reglasModificarEjercicio, validar, actualizar);
router.put(
  '/:id/estado',
  autorizar('administrador'),
  reglasIdEjercicio,
  reglasCambiarEstadoEjercicio,
  validar,
  cambiarEstado
);

export default router;
