// tests/setup/protegerBase.js
// Guardia global de las pruebas del backend. Vitest la ejecuta antes de cargar
// cada archivo de pruebas, de modo que ninguna suite llega a abrir conexiones
// si el destino no es la base de pruebas local. Cubre el caso de lanzar Vitest
// sin `--env-file=.env.test`, en el que `dotenv` cargaría `backend/.env`.
// Complementa, sin sustituir, la guardia de `helpers/baseDatos.js`. ES Modules.

const BASE_PERMITIDA = 'gym_db_pruebas';
const SERVIDORES_LOCALES = ['127.0.0.1', 'localhost'];

const base = process.env.DB_NAME;
const servidor = process.env.DB_HOST;

if (base !== BASE_PERMITIDA || !SERVIDORES_LOCALES.includes(servidor)) {
  throw new Error(
    `Pruebas detenidas: se exige la base ${BASE_PERMITIDA} en un servidor local y se resolvió ` +
      `base=${base || '(sin DB_NAME)'}, servidor=${servidor || '(sin DB_HOST)'}. ` +
      'Ejecuta las pruebas con «npm test» desde backend/.'
  );
}
