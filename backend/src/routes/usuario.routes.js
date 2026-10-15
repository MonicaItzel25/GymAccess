// routes/usuario.routes.js
// Rutas de gestión de usuarios: solo el administrador (FR-006).
// ES Modules.

import { Router } from 'express';
import { autenticar } from '../middlewares/auth.js';
import { autorizar } from '../middlewares/authorize.js';
import { reglasCrearUsuario, reglasModificarUsuario } from '../validators/usuario.validators.js';
import { validar } from '../validators/validar.js';
import { listar, obtener, crear, modificar } from '../controllers/usuario.controller.js';

const router = Router();

router.use(autenticar, autorizar('administrador'));

router.get('/', listar);
router.get('/:id', obtener);
router.post('/', reglasCrearUsuario, validar, crear);
router.put('/:id', reglasModificarUsuario, validar, modificar);

export default router;
