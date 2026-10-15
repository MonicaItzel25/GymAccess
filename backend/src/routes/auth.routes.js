// routes/auth.routes.js
// Rutas de autenticación: POST /login y GET /me. ES Modules.

import { Router } from 'express';
import { autenticar } from '../middlewares/auth.js';
import { reglasLogin } from '../validators/auth.validators.js';
import { validar } from '../validators/validar.js';
import { login, yo } from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', reglasLogin, validar, login);
router.get('/me', autenticar, yo);

export default router;
