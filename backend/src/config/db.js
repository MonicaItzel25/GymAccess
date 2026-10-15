// config/db.js
// Pool de conexión a MySQL local. Todas las credenciales llegan mediante
// variables de entorno; nunca se escriben en el código (constitución V).
// ES Modules: import/export.

import 'dotenv/config';
import mysql from 'mysql2/promise';

let pool = null;

/**
 * Devuelve el pool de conexiones (creado a la primera llamada).
 * Leer process.env en tiempo de uso permite que las pruebas configuren
 * la base de datos antes de la primera consulta.
 */
export function obtenerPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'gym_db',
      waitForConnections: true,
      connectionLimit: 10,
      charset: 'utf8mb4',
    });
  }
  return pool;
}

/** Ejecuta una consulta parametrizada y devuelve las filas. */
export async function consultar(sql, parametros = []) {
  const [filas] = await obtenerPool().query(sql, parametros);
  return filas;
}

/** Ejecuta una sentencia sin devolver filas (INSERT/UPDATE/DELETE). */
export async function ejecutar(sql, parametros = []) {
  const [resultado] = await obtenerPool().execute(sql, parametros);
  return resultado;
}
