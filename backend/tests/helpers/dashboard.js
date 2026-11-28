// tests/helpers/dashboard.js
// Datos del dashboard con valores conocidos. Se insertan directamente para
// controlar las fechas respecto de hoy y del periodo consultado. ES Modules.

import { vaciarTablas, insertarUsuario, insertarCliente } from './baseDatos.js';
import { ejecutar } from '../../src/config/db.js';
import { hoy, aFechaLocal } from '../../src/utils/fechas.js';

/** Fecha 'YYYY-MM-DD' desplazada `dias` respecto de hoy. */
export function enDias(dias) {
  const [anio, mes, dia] = hoy().split('-').map(Number);
  return aFechaLocal(new Date(anio, mes - 1, dia + dias));
}

/** Periodo pasado y cerrado, sin relación con la fecha de ejecución. */
export const PERIODO = { desde: '2020-03-01', hasta: '2020-03-31' };

export async function sembrarDashboard() {
  await vaciarTablas();
  const cuentas = {};
  for (const rol of ['administrador', 'recepcionista', 'entrenador', 'cliente']) {
    cuentas[rol] = await insertarUsuario({ nombre: `Cuenta ${rol}`, correo: `${rol}-dash@prueba.com`, rol });
  }
  const cuentaSegunda = await insertarUsuario({ nombre: 'Zoe Segunda', correo: 'zoe-dash@prueba.com', rol: 'entrenador' });
  const cuentaBaja = await insertarUsuario({ nombre: 'Yago Baja', correo: 'yago-dash@prueba.com', rol: 'entrenador' });

  // Seis clientes: cinco activos y uno inactivo.
  const clientes = [];
  for (let i = 1; i <= 6; i += 1) {
    clientes.push(await insertarCliente({
      nombre: `C${i}`, apellido: 'Dash', correo: `c${i}-dash@prueba.com`,
      estado: i === 6 ? 'inactivo' : 'activo',
    }));
  }
  // Registro: dos dentro del periodo (en los bordes) y el resto fuera.
  const registros = ['2020-03-01 00:00:00', '2020-03-31 23:59:59', '2020-02-29 23:59:59', '2020-04-01 00:00:00', '2019-01-01 10:00:00', '2019-01-01 10:00:00'];
  for (const [i, fecha] of registros.entries()) {
    await ejecutar('UPDATE clientes SET fecha_registro = ? WHERE id_cliente = ?', [fecha, clientes[i]]);
  }

  const tipo = await ejecutar(
    "INSERT INTO tipos_membresia (nombre, duracion, precio) VALUES ('Tipo dashboard', 30, 500)"
  );
  async function membresia(indice, inicio, fin, estado, precio = 500) {
    const r = await ejecutar(
      `INSERT INTO membresias (id_cliente, id_tipo_membresia, fecha_inicio, fecha_fin, estado, precio_acordado)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [clientes[indice], tipo.insertId, inicio, fin, estado, precio]
    );
    return r.insertId;
  }
  // vigentes: 8 días y 30 días. por vencer: hoy y 7 días. vencidas: 3.
  const m1 = await membresia(0, enDias(-20), enDias(8), 'activa');
  const m2 = await membresia(1, enDias(-20), enDias(30), 'activa');
  const m3 = await membresia(2, enDias(-30), enDias(0), 'activa');
  await membresia(3, enDias(-23), enDias(7), 'activa');
  await membresia(4, enDias(-40), enDias(-1), 'activa');
  await membresia(4, enDias(-10), enDias(20), 'suspendida');
  await membresia(5, enDias(-10), enDias(20), 'cancelada', 100);

  async function pago(indice, idMembresia, monto, fecha, estado = 'pagado') {
    await ejecutar(
      `INSERT INTO pagos (id_cliente, id_membresia, monto, fecha_pago, metodo_pago, estado)
       VALUES (?, ?, ?, ?, 'efectivo', ?)`,
      [clientes[indice], idMembresia, monto, fecha, estado]
    );
  }
  await pago(0, m1, 200.5, '2020-03-01 00:00:00');
  await pago(0, m1, 99.5, '2020-03-31 23:59:59');
  await pago(1, m2, 500, '2020-04-01 00:00:00');
  await pago(2, m3, 700, '2020-02-29 23:59:59'); // Excede el precio: no genera adeudo negativo.
  await pago(1, m2, 50, '2020-03-10 12:00:00', 'cancelado');
  await pago(1, m2, 60, '2020-03-11 12:00:00', 'pendiente');

  for (const [fecha, resultado] of [
    ['2020-03-01', 'autorizado'], ['2020-03-15', 'autorizado'], ['2020-03-31', 'rechazado'],
    ['2020-02-29', 'rechazado'], ['2020-04-01', 'autorizado'],
  ]) {
    await ejecutar(
      "INSERT INTO accesos (id_cliente, fecha, hora, resultado) VALUES (?, ?, '10:00:00', ?)",
      [clientes[0], fecha, resultado]
    );
  }

  async function entrenador(idUsuario, estado = 'activo') {
    const r = await ejecutar('INSERT INTO entrenadores (id_usuario, estado) VALUES (?, ?)', [idUsuario, estado]);
    return r.insertId;
  }
  const principal = await entrenador(cuentas.entrenador);
  const segunda = await entrenador(cuentaSegunda);
  await entrenador(cuentaBaja, 'inactivo');
  for (const indice of [0, 1]) {
    await ejecutar(
      'INSERT INTO asignaciones_entrenador (id_cliente, id_entrenador, fecha_inicio) VALUES (?, ?, ?)',
      [clientes[indice], principal, '2020-01-01']
    );
  }
  await ejecutar(
    `INSERT INTO asignaciones_entrenador (id_cliente, id_entrenador, fecha_inicio, fecha_fin, estado)
     VALUES (?, ?, '2020-01-01', '2020-02-01', 'finalizada')`,
    [clientes[2], segunda]
  );

  for (const [indice, estado] of [[0, 'activa'], [1, 'activa'], [2, 'inactiva'], [5, 'activa']]) {
    await ejecutar(
      "INSERT INTO rutinas (id_cliente, id_entrenador, nombre, estado) VALUES (?, ?, 'Rutina reservada', ?)",
      [clientes[indice], principal, estado]
    );
  }
  for (const estado of ['activo', 'activo', 'alcanzado', 'cerrado']) {
    await ejecutar(
      "INSERT INTO objetivos (id_cliente, meta, fecha_objetivo, estado) VALUES (?, 'Meta reservada', '2020-12-31', ?)",
      [clientes[0], estado]
    );
  }
  for (const fecha of ['2020-03-01', '2020-03-31', '2020-02-29', '2020-04-01']) {
    await ejecutar(
      "INSERT INTO progresos (id_cliente, fecha, avance) VALUES (?, ?, 'Avance reservado')",
      [clientes[0], fecha]
    );
  }

  return { principal, segunda };
}
