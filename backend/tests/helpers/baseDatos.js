// tests/helpers/baseDatos.js
// Utilidades para preparar y limpiar datos de prueba entre suites.
// Requiere que las migraciones ya estén aplicadas:
//   node database/migrate.mjs
// ES Modules.

import bcrypt from 'bcrypt';
import { obtenerPool } from '../../src/config/db.js';

// ?? Guard de seguridad (T007): ninguna operación destructiva ni de escritura se
// ejecuta contra una base distinta de `gym_db_pruebas`. Protege `gym_db` aunque
// falle la carga de `backend/.env.test` (defensa en profundidad).
function verificarBasePruebas() {
  const base = process.env.DB_NAME;
  if (base !== 'gym_db_pruebas') {
    throw new Error(
      `base de datos no permitida para pruebas: se esperaba gym_db_pruebas y se resolvió ${
        base || '(sin DB_NAME)'
      }`
    );
  }
}

// Hash reutilizado para las contraseñas de prueba (se genera una sola vez).
let hashPrueba = null;

/** Hash bcrypt para las contraseñas fijas de las pruebas. */
export async function obtenerHashPrueba() {
  if (!hashPrueba) {
    hashPrueba = await bcrypt.hash('Prueba1234', 10);
  }
  return hashPrueba;
}

/** Vacía las tablas operativas en orden de dependencia de las FK. */
export async function vaciarTablas() {
  verificarBasePruebas();
  const pool = obtenerPool();
  // Tablas del Sprint 2 primero (dependen de usuarios y clientes).
  await pool.execute('DELETE FROM auditoria');
  await pool.execute('DELETE FROM accesos');
  await pool.execute('DELETE FROM rostros');
  // Tablas del Sprint 1.
  await pool.execute('DELETE FROM pagos');
  await pool.execute('DELETE FROM membresias');
  await pool.execute('DELETE FROM clientes');
  await pool.execute('DELETE FROM usuarios');
}

/** Inserta un usuario de prueba con contraseña hasheada. */
export async function insertarUsuario({
  nombre = 'Usuario Prueba',
  correo = 'usuario@prueba.com',
  password = 'Prueba1234',
  rol = 'recepcionista',
  estado = 'activo',
} = {}) {
  verificarBasePruebas();
  const hash = await bcrypt.hash(password, 10);
  const [resultado] = await obtenerPool().execute(
    `INSERT INTO usuarios (nombre, correo, password, rol, estado)
     VALUES (?, ?, ?, ?, ?)`,
    [nombre, correo, hash, rol, estado]
  );
  return resultado.insertId;
}

/** Inserta un cliente de prueba. */
export async function insertarCliente({
  nombre = 'Cliente',
  apellido = 'Prueba',
  correo = 'cliente@prueba.com',
  telefono = '555-0000',
  direccion = 'Calle Falsa 123',
  estado = 'activo',
} = {}) {
  verificarBasePruebas();
  const [resultado] = await obtenerPool().execute(
    `INSERT INTO clientes (nombre, apellido, correo, telefono, direccion, estado)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [nombre, apellido, correo, telefono, direccion, estado]
  );
  return resultado.insertId;
}

/** Cierra el pool (para usar al finalizar las suites). */
export async function cerrarPool() {
  await obtenerPool().end();
}
