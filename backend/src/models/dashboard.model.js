// models/dashboard.model.js
// Consultas agregadas del dashboard (Sprint 3, US-S3-06, data-model §7). No hay
// tablas de indicadores: todo se calcula al momento (RN-011). Solo devuelve
// totales; nunca detalle individual de clientes, rutinas o progresos (Q4).
// Consultas siempre parametrizadas. ES Modules.

import { consultar } from '../config/db.js';

/** Convierte a número los agregados (mysql2 entrega SUM y DECIMAL como texto). */
async function fila(sql, parametros = []) {
  const [datos] = await consultar(sql, parametros);
  return Object.fromEntries(
    Object.entries(datos).map(([nombre, valor]) => [nombre, Number(valor ?? 0)])
  );
}

/** Totales de clientes; «activos» según la vigencia real de sus membresías. */
export async function contarClientes({ desde, hasta, hoy }) {
  return fila(
    `SELECT
       (SELECT COUNT(*) FROM clientes) AS totales,
       (SELECT COUNT(DISTINCT id_cliente) FROM membresias
         WHERE estado = 'activa' AND fecha_fin >= ?) AS activos,
       (SELECT COUNT(*) FROM clientes
         WHERE fecha_registro >= ? AND fecha_registro < DATE_ADD(?, INTERVAL 1 DAY)) AS nuevos`,
    [hoy, desde, hasta]
  );
}

/** Reparte todas las membresías en tres grupos excluyentes (FR-027). */
export async function contarMembresias({ hoy, limite }) {
  return fila(
    `SELECT
       COALESCE(SUM(estado = 'activa' AND fecha_fin > ?), 0) AS vigentes,
       COALESCE(SUM(estado = 'activa' AND fecha_fin >= ? AND fecha_fin <= ?), 0) AS porVencer,
       COALESCE(SUM(estado <> 'activa' OR fecha_fin < ?), 0) AS vencidas
     FROM membresias`,
    [limite, hoy, limite, hoy]
  );
}

/** Pagos `pagado` del periodo y saldo pendiente actual con la regla del
 *  Sprint 2: precio acordado menos pagos pagados, nunca negativo. */
export async function resumirPagos({ desde, hasta }) {
  return fila(
    `SELECT
       (SELECT COUNT(*) FROM pagos
         WHERE estado = 'pagado' AND fecha_pago >= ?
           AND fecha_pago < DATE_ADD(?, INTERVAL 1 DAY)) AS cantidad,
       (SELECT COALESCE(SUM(monto), 0) FROM pagos
         WHERE estado = 'pagado' AND fecha_pago >= ?
           AND fecha_pago < DATE_ADD(?, INTERVAL 1 DAY)) AS ingresos,
       (SELECT COALESCE(SUM(GREATEST(m.precio_acordado - COALESCE(p.total, 0), 0)), 0)
          FROM membresias m
          LEFT JOIN (
            SELECT id_membresia, SUM(monto) AS total FROM pagos
            WHERE estado = 'pagado' GROUP BY id_membresia
          ) p ON p.id_membresia = m.id_membresia) AS adeudosPendientes`,
    [desde, hasta, desde, hasta]
  );
}

/** Intentos de acceso del periodo por resultado. */
export async function contarAccesos({ desde, hasta }) {
  return fila(
    `SELECT
       COUNT(*) AS intentos,
       COALESCE(SUM(resultado = 'autorizado'), 0) AS autorizados,
       COALESCE(SUM(resultado = 'rechazado'), 0) AS rechazados
     FROM accesos
     WHERE fecha >= ? AND fecha <= ?`,
    [desde, hasta]
  );
}

/** Totales del módulo de entrenamiento. */
export async function contarEntrenamiento({ desde, hasta }) {
  return fila(
    `SELECT
       (SELECT COUNT(*) FROM entrenadores WHERE estado = 'activo') AS entrenadoresActivos,
       (SELECT COUNT(*) FROM rutinas WHERE estado = 'activa') AS rutinasActivas,
       (SELECT COUNT(*) FROM clientes c
         WHERE c.estado = 'activo' AND NOT EXISTS (
           SELECT 1 FROM rutinas r
           WHERE r.id_cliente = c.id_cliente AND r.estado = 'activa')) AS clientesSinRutinaActiva,
       (SELECT COUNT(*) FROM objetivos WHERE estado = 'activo') AS objetivosActivos,
       (SELECT COUNT(*) FROM progresos WHERE fecha >= ? AND fecha <= ?) AS progresosEnPeriodo`,
    [desde, hasta]
  );
}

/** Clientes con asignación vigente por entrenador: incluye a los activos sin
 *  carga y a cualquier inactivo que conserve asignaciones vigentes. */
export async function cargaPorEntrenador() {
  const filas = await consultar(
    `SELECT e.id_entrenador, u.nombre, COUNT(a.id_asignacion) AS clientes
     FROM entrenadores e
     JOIN usuarios u ON u.id_usuario = e.id_usuario
     LEFT JOIN asignaciones_entrenador a
       ON a.id_entrenador = e.id_entrenador AND a.estado = 'vigente'
     GROUP BY e.id_entrenador, u.nombre, e.estado
     HAVING e.estado = 'activo' OR COUNT(a.id_asignacion) > 0
     ORDER BY u.nombre, e.id_entrenador`
  );
  return filas.map((datos) => ({ ...datos, clientes: Number(datos.clientes) }));
}
