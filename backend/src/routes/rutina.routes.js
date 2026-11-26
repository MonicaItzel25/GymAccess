// routes/rutina.routes.js
// Rutas de las rutinas de entrenamiento (Sprint 3, US-S3-03).
// Recurso EXCLUSIVO del entrenador (contrato §4): recepcionista, cliente y
// administrador → 403 en todas las operaciones (US-S3-03.5, matriz §10).
// La asignación vigente con el cliente se valida en el servicio (FR-014).
// ES Modules.

import { Router } from 'express';
import { autenticar } from '../middlewares/auth.js';
import { autorizar } from '../middlewares/authorize.js';
import { validar } from '../validators/validar.js';
import {
  reglasCrearRutina,
  reglasModificarRutina,
  reglasCambiarEstadoRutina,
  reglasIdRutina,
  reglasListarRutinas,
} from '../validators/rutina.validators.js';
import {
  listar,
  obtenerPorId,
  crear,
  actualizar,
  cambiarEstado,
} from '../controllers/rutina.controller.js';

const router = Router();

router.use(autenticar);

// Consulta y gestión: solo el entrenador (US-S3-03).
router.get('/', autorizar('entrenador'), reglasListarRutinas, validar, listar);
router.get('/:id', autorizar('entrenador'), reglasIdRutina, validar, obtenerPorId);
router.post('/', autorizar('entrenador'), reglasCrearRutina, validar, crear);
router.put('/:id', autorizar('entrenador'), reglasIdRutina, reglasModificarRutina, validar, actualizar);
router.patch(
  '/:id/estado',
  autorizar('entrenador'),
  reglasIdRutina,
  reglasCambiarEstadoRutina,
  validar,
  cambiarEstado
);

export default router;
