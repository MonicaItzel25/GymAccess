// routes/rostro.routes.js
// Rutas de información facial bajo /api/clientes/:id/rostro.
// Escritura y consulta: administrador y recepcionista. El entrenador y el
// cliente reciben 403. ES Modules.

import { Router } from 'express';
import { autenticar } from '../middlewares/auth.js';
import { autorizar } from '../middlewares/authorize.js';
import { reglasRegistrarRostro, reglasIdClienteRostro } from '../validators/rostro.validators.js';
import { validar } from '../validators/validar.js';
import { registrar, obtenerEstado } from '../controllers/rostro.controller.js';

// Este router se monta en /api/clientes, por lo que las rutas son /:id/rostro.
const router = Router();

router.use(autenticar);
router.use(autorizar('administrador', 'recepcionista'));

router.post('/:id/rostro', reglasRegistrarRostro, validar, registrar);
router.get('/:id/rostro', reglasIdClienteRostro, validar, obtenerEstado);

export default router;
