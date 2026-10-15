// Pruebas de integración: flujo completo de validación de acceso.
// Cubre los casos de la especificación (SC-002, SC-003): autorizado con
// membresía activa; rechazado por vencida, suspendida, cancelada, sin
// membresía y por rostro no identificado; cada uno con su registro en `accesos`.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import { consultar, obtenerPool } from '../../src/config/db.js';
import {
  vaciarTablas,
  insertarUsuario,
  insertarCliente,
  cerrarPool,
} from '../helpers/baseDatos.js';

const app = crearApp();

async function tokenDe(correo) {
  const respuesta = await request(app)
    .post('/api/auth/login')
    .send({ correo, password: 'Prueba1234' });
  return respuesta.body.data.token;
}

function descriptorDe(semilla) {
  return Array.from({ length: 128 }, (_, i) => Math.sin(semilla * (i + 1)));
}

/** Crea un tipo y registra un rostro de prueba. */
async function prepararTipoYRostro(idCliente, descriptor) {
  const pool = obtenerPool();
  const [r] = await pool.execute(
    "INSERT INTO tipos_membresia (nombre, descripcion, duracion, precio, estado) VALUES (?, ?, ?, ?, 'activo')",
    [`Tipo ${Date.now()}`, 'Tipo de prueba', 30, 500]
  );
  const idTipo = r.insertId;
  await pool.execute(
    "INSERT INTO rostros (id_cliente, descriptor_facial, estado) VALUES (?, ?, 'activo')",
    [idCliente, JSON.stringify(descriptor)]
  );
  return idTipo;
}

/** Asigna una membresía con estado y fechas controlados. */
async function asignarMembresia(idCliente, idTipo, { fechaInicio, fechaFin, estado }) {
  const [r] = await obtenerPool().execute(
    'INSERT INTO membresias (id_cliente, id_tipo_membresia, fecha_inicio, fecha_fin, estado) VALUES (?, ?, ?, ?, ?)',
    [idCliente, idTipo, fechaInicio, fechaFin, estado]
  );
  return r.insertId;
}

async function intentar(descriptor) {
  return request(app).post('/api/acceso/intento').send({ descriptor_facial: descriptor });
}

describe('Integración de validación de acceso', () => {
  let tokenRecep;

  beforeAll(async () => {
    await vaciarTablas();
    await insertarUsuario({ nombre: 'Recep', correo: 'recep-acc@prueba.com', rol: 'recepcionista' });
    tokenRecep = await tokenDe('recep-acc@prueba.com');
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('autoriza a un cliente con membresía activa y vigente', async () => {
    const idCliente = await insertarCliente({ correo: 'activo@prueba.com' });
    const descriptor = descriptorDe(10);
    const idTipo = await prepararTipoYRostro(idCliente, descriptor);
    await asignarMembresia(idCliente, idTipo, {
      fechaInicio: '2026-01-01',
      fechaFin: '2030-12-31',
      estado: 'activa',
    });

    const respuesta = await intentar(descriptor);
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.resultado).toBe('autorizado');
    expect(respuesta.body.data.cliente.id_cliente).toBe(idCliente);
    expect(respuesta.body.data.membresia.estado).toBe('activa');

    const accesos = await consultar('SELECT * FROM accesos WHERE id_cliente = ?', [idCliente]);
    expect(accesos).toHaveLength(1);
    expect(accesos[0].resultado).toBe('autorizado');
    expect(accesos[0].motivo_rechazo).toBeNull();
  });

  it('rechaza por membresía vencida (sin tolerancia) y registra el motivo', async () => {
    const idCliente = await insertarCliente({ correo: 'vencida@prueba.com' });
    const descriptor = descriptorDe(11);
    const idTipo = await prepararTipoYRostro(idCliente, descriptor);
    await asignarMembresia(idCliente, idTipo, {
      fechaInicio: '2020-01-01',
      fechaFin: '2020-02-01',
      estado: 'activa', // estado activa pero fecha_fin pasada = vencida
    });

    const respuesta = await intentar(descriptor);
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.resultado).toBe('rechazado');
    expect(respuesta.body.data.motivo).toBe('membresia vencida');

    const accesos = await consultar('SELECT * FROM accesos WHERE id_cliente = ?', [idCliente]);
    expect(accesos[0].resultado).toBe('rechazado');
    expect(accesos[0].motivo_rechazo).toBe('membresia vencida');
  });

  it('rechaza por membresía suspendida', async () => {
    const idCliente = await insertarCliente({ correo: 'suspendida@prueba.com' });
    const descriptor = descriptorDe(12);
    const idTipo = await prepararTipoYRostro(idCliente, descriptor);
    await asignarMembresia(idCliente, idTipo, {
      fechaInicio: '2026-01-01',
      fechaFin: '2030-12-31',
      estado: 'suspendida',
    });

    const respuesta = await intentar(descriptor);
    expect(respuesta.body.data.resultado).toBe('rechazado');
    expect(respuesta.body.data.motivo).toBe('membresia suspendida');
  });

  it('rechaza por membresía cancelada', async () => {
    const idCliente = await insertarCliente({ correo: 'cancelada@prueba.com' });
    const descriptor = descriptorDe(13);
    const idTipo = await prepararTipoYRostro(idCliente, descriptor);
    await asignarMembresia(idCliente, idTipo, {
      fechaInicio: '2026-01-01',
      fechaFin: '2030-12-31',
      estado: 'cancelada',
    });

    const respuesta = await intentar(descriptor);
    expect(respuesta.body.data.resultado).toBe('rechazado');
    expect(respuesta.body.data.motivo).toBe('membresia cancelada');
  });

  it('rechaza a un cliente identificado sin membresía vigente', async () => {
    const idCliente = await insertarCliente({ correo: 'sinmembresia@prueba.com' });
    const descriptor = descriptorDe(14);
    await prepararTipoYRostro(idCliente, descriptor);
    // Sin membresía asignada.

    const respuesta = await intentar(descriptor);
    expect(respuesta.body.data.resultado).toBe('rechazado');
    expect(respuesta.body.data.motivo).toBe('sin membresia vigente');

    const accesos = await consultar('SELECT * FROM accesos WHERE id_cliente = ?', [idCliente]);
    expect(accesos[0].motivo_rechazo).toBe('sin membresia vigente');
  });

  it('rechaza a un rostro no identificado y registra el intento con id_cliente nulo', async () => {
    const descriptorDesconocido = descriptorDe(777);
    const respuesta = await intentar(descriptorDesconocido);
    expect(respuesta.body.data.resultado).toBe('rechazado');
    expect(respuesta.body.data.motivo).toBe('rostro no identificado');
    expect(respuesta.body.data.cliente).toBeNull();

    const accesos = await consultar(
      'SELECT * FROM accesos WHERE resultado = ? ORDER BY id_acceso DESC LIMIT 1',
      ['rechazado']
    );
    expect(accesos[0].motivo_rechazo).toBe('rostro no identificado');
  });

  it('registra el intento de acceso en auditoría (FR-021)', async () => {
    const registros = await consultar(
      "SELECT * FROM auditoria WHERE accion = 'intento_acceso' AND modulo = 'accesos'"
    );
    expect(registros.length).toBeGreaterThan(0);
  });
});
