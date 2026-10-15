// routes/acceso.routes.js
// Ruta del kiosco: POST /api/acceso/intento. Es la ÚNICA ruta sin token de
// todo el sistema: el cliente se identifica facialmente sin iniciar sesión
// (decisión justificada en plan.md / Complexity Tracking y research §4).
// La consulta de registros vive en accesoConsulta.routes.js bajo /api/accesos.
// ES Modules.

import { Router } from 'express';
import { body } from 'express-validator';
import { validar } from '../validators/validar.js';
import { intentar } from '../controllers/acceso.controller.js';

const router = Router();

// Descriptor del kiosco: arreglo de exactamente 128 números.
const reglasDescriptor = [
  body('descriptor_facial')
    .notEmpty()
    .withMessage('El descriptor facial es obligatorio')
    .isArray({ min: 128, max: 128 })
    .withMessage('El descriptor facial debe ser un arreglo de 128 números')
    .bail()
    .custom((arreglo) => arreglo.every((n) => typeof n === 'number' && Number.isFinite(n)))
    .withMessage('El descriptor facial debe contener solo números válidos'),
];

// Ruta del kiosco: SIN autenticar (única excepción del sistema).
router.post('/intento', reglasDescriptor, validar, intentar);

export default router;
