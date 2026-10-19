// routes/pago.routes.js
// Rutas de pagos. Escritura y consulta: administrador y recepcionista.
// Información propia: solo rol cliente (registrada antes de las rutas /:id).
// No existe ninguna ruta DELETE (FR-016, SC-005). ES Modules.

import { Router } from 'express';
import { autenticar } from '../middlewares/auth.js';
import { autorizar } from '../middlewares/authorize.js';
import { reglasCrearPago } from '../validators/pago.validators.js';
import { validar } from '../validators/validar.js';
import { registrar, listar, mio } from '../controllers/pago.controller.js';

const router = Router();

router.use(autenticar);

// Escritura (US-S2-04): administrador o recepcionista
router.post('/', autorizar('administrador', 'recepcionista'), reglasCrearPago, validar, registrar);

// Información propia (US-S2-04): solo rol cliente — DEBE ir antes de las rutas generales
router.get('/mio', autorizar('cliente'), mio);

// Consulta (US-S2-04): administrador o recepcionista
router.get('/', autorizar('administrador', 'recepcionista'), listar);

export default router;
