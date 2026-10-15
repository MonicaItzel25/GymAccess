// migrate.mjs
// Aplica los scripts SQL versionados de database/migrations/ y database/seeds/
// en orden, y registra cada uno en la tabla `migraciones`.
// Convención: ES Modules (import/export); sin CommonJS.
//
// Uso: node database/migrate.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// Importación relativa al backend: el script vive fuera de backend/ y reutiliza
// su instalación de mysql2 sin duplicar dependencias.
import mysql from '../backend/node_modules/mysql2/promise.js';

const raizProyecto = fileURLToPath(new URL('../', import.meta.url));
const rutaEnv = path.join(raizProyecto, 'backend', '.env');

/** Carga backend/.env en process.env sin sobrescribir variables ya definidas. */
function cargarEnv() {
  if (!fs.existsSync(rutaEnv)) return;
  const contenido = fs.readFileSync(rutaEnv, 'utf8');
  for (const linea of contenido.split(/\r?\n/)) {
    if (!linea || linea.startsWith('#')) continue;
    const igual = linea.indexOf('=');
    if (igual === -1) continue;
    const clave = linea.slice(0, igual).trim();
    const valor = linea.slice(igual + 1).trim();
    if (!(clave in process.env)) process.env[clave] = valor;
  }
}

/** Devuelve los archivos .sql de un directorio, ordenados por nombre. */
function listarScripts(directorio) {
  if (!fs.existsSync(directorio)) return [];
  return fs
    .readdirSync(directorio)
    .filter((archivo) => archivo.toLowerCase().endsWith('.sql'))
    .sort()
    .map((archivo) => path.join(directorio, archivo));
}

async function main() {
  cargarEnv();

  const host = process.env.DB_HOST || '127.0.0.1';
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'gym_db';

  const conexion = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true,
    charset: 'utf8mb4',
  });

  console.log(`Conectado a MySQL en ${host}:${port} como ${user}.`);

  // 1. Crear la base de datos si no existe.
  await conexion.query(
    `CREATE DATABASE IF NOT EXISTS \`${database}\`
     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await conexion.query(`USE \`${database}\``);

  // 2. Asegurar la tabla de control antes de aplicar scripts.
  await conexion.query(`
    CREATE TABLE IF NOT EXISTS migraciones (
      id_migracion    INT AUTO_INCREMENT PRIMARY KEY,
      nombre          VARCHAR(255) NOT NULL,
      fecha_ejecucion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_migraciones_nombre (nombre)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const [aplicadas] = await conexion.query('SELECT nombre FROM migraciones');
  const conjunto = new Set(aplicadas.map((fila) => fila.nombre));

  // 3. Aplicar migraciones pendientes.
  const migraciones = listarScripts(path.join(raizProyecto, 'database', 'migrations'));
  // 4. Aplicar semillas pendientes.
  const semillas = listarScripts(path.join(raizProyecto, 'database', 'seeds'));

  let aplicados = 0;
  for (const archivo of [...migraciones, ...semillas]) {
    const nombre = path.basename(archivo);
    if (conjunto.has(nombre)) {
      console.log(`= Omitido (ya aplicado): ${nombre}`);
      continue;
    }
    const sql = fs.readFileSync(archivo, 'utf8');
    await conexion.query(sql);
    await conexion.query('INSERT INTO migraciones (nombre) VALUES (?)', [nombre]);
    console.log(`+ Aplicado: ${nombre}`);
    aplicados += 1;
  }

  await conexion.end();
  console.log(`Listo. Scripts aplicados en esta ejecución: ${aplicados}.`);
}

main().catch((error) => {
  console.error('Error al ejecutar las migraciones:');
  console.error(error.message);
  process.exitCode = 1;
});
