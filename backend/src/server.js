// server.js
// Punto de entrada del servidor. Carga las variables de entorno y escucha
// en el puerto configurado. ES Modules.

import 'dotenv/config';
import { crearApp } from './app.js';

const puerto = Number(process.env.PUERTO || 3001);
const app = crearApp();

app.listen(puerto, () => {
  console.log(`Servidor del gimnasio escuchando en http://127.0.0.1:${puerto}`);
});
