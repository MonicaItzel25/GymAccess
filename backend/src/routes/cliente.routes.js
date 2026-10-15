// routes/cliente.routes.js
// Rutas de clientes. Escritura: administrador y recepcionista.
// Consulta: administrador, recepcionista y entrenador.
// Información propia: solo rol cliente (registrada antes de /:id).
// ES Modules.

import { Router } from 'express';
import { autenticar } from '../middlewares/auth.js';
import { autorizar } from '../middlewares/authorize.js';
import { reglasCrearCliente, reglasModificarCliente } from '../validators/cliente.validators.js';
import { validar } from '../validators/validar.js';
import {
  crear,
  listar,
  obtener,
  actualizar,
  mio,
} from '../controllers/cliente.controller.js';

const router = Router();

router.use(autenticar);

// Escritura (US4/US5): administrador o recepcionista
router.post('/', autorizar('administrador', 'recepcionista'), reglasCrearCliente, validar, crear);
router.put('/:id', autorizar('administrador', 'recepcionista'), reglasModificarCliente, validar, actualizar);

// Información propia (US7): solo rol cliente — DEBE ir antes de /:id
router.get('/mio', autorizar('cliente'), mio);

// Consulta (US6): administrador, recepcionista o entrenador
router.get('/', autorizar('administrador', 'recepcionista', 'entrenador'), listar);
router.get('/:id', autorizar('administrador', 'recepcionista', 'entrenador'), obtener);

export default router;
