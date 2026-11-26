// routes/objetivo.routes.js
// Rutas de los objetivos de entrenamiento (Sprint 3, US-S3-04).
// Recurso EXCLUSIVO del entrenador (contrato §5): recepcionista, cliente y
// administrador → 403 en todas las operaciones (US-S3-04.5, matriz §10).
// El perfil activo y la asignación vigente se validan en el servicio (FR-003,
// RN-005). Sin DELETE (FR-021). ES Modules.

import { Router } from 'express';
import { autenticar } from '../middlewares/auth.js';
import { autorizar } from '../middlewares/authorize.js';
import { validar } from '../validators/validar.js';
import {
  reglasListarObjetivos,
  reglasCrearObjetivo,
  reglasModificarObjetivo,
  reglasCambiarEstadoObjetivo,
  reglasIdObjetivo,
} from '../validators/objetivo.validators.js';
import {
  listar,
  crear,
  actualizar,
  cambiarEstado,
} from '../controllers/objetivo.controller.js';

const router = Router();

router.use(autenticar);

// Consulta y gestión: solo el entrenador (US-S3-04).
router.get('/', autorizar('entrenador'), reglasListarObjetivos, validar, listar);
router.post('/', autorizar('entrenador'), reglasCrearObjetivo, validar, crear);
router.put('/:id', autorizar('entrenador'), reglasIdObjetivo, reglasModificarObjetivo, validar, actualizar);
router.patch(
  '/:id/estado',
  autorizar('entrenador'),
  reglasIdObjetivo,
  reglasCambiarEstadoObjetivo,
  validar,
  cambiarEstado
);

export default router;
