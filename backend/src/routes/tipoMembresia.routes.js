// routes/tipoMembresia.routes.js
// Rutas de tipos de membresía. Escritura: solo administrador (FR-001).
// Consulta: administrador y recepcionista. ES Modules.

import { Router } from 'express';
import { autenticar } from '../middlewares/auth.js';
import { autorizar } from '../middlewares/authorize.js';
import {
  reglasCrearTipoMembresia,
  reglasModificarTipoMembresia,
  reglasIdTipoMembresia,
} from '../validators/tipoMembresia.validators.js';
import { validar } from '../validators/validar.js';
import { crear, listar, obtener, actualizar } from '../controllers/tipoMembresia.controller.js';

const router = Router();

router.use(autenticar);

// Escritura (US-S2-01): solo administrador
router.post('/', autorizar('administrador'), reglasCrearTipoMembresia, validar, crear);
router.put('/:id', autorizar('administrador'), reglasModificarTipoMembresia, validar, actualizar);

// Consulta (US-S2-01): administrador o recepcionista
router.get('/', autorizar('administrador', 'recepcionista'), listar);
router.get('/:id', autorizar('administrador', 'recepcionista'), reglasIdTipoMembresia, validar, obtener);

export default router;
