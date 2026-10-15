// Pruebas de integración: asignación de membresías en MySQL.
// Verifica el cálculo de fecha_fin (FR-003) y la regla de una sola membresía
// vigente por cliente (FR-025).

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
import { aFechaLocal } from '../../src/utils/fechas.js';

const app = crearApp();

async function tokenDe(correo) {
  const respuesta = await request(app)
    .post('/api/auth/login')
    .send({ correo, password: 'Prueba1234' });
  return respuesta.body.data.token;
}

async function crearTipoPrueba({ duracion = 30, precio = 500 } = {}) {
  const [resultado] = await obtenerPool().execute(
    'INSERT INTO tipos_membresia (nombre, descripcion, duracion, precio, estado) VALUES (?, ?, ?, ?, ?)',
    [`Tipo ${duracion} dias`, 'Tipo para pruebas de integración', duracion, precio, 'activo']
  );
  return resultado.insertId;
}

describe('Integración de asignación de membresías', () => {
  let tokenRecep;
  let idCliente;

  beforeAll(async () => {
    await vaciarTablas();
    await insertarUsuario({ nombre: 'Recep', correo: 'recep-int@prueba.com', rol: 'recepcionista' });
    tokenRecep = await tokenDe('recep-int@prueba.com');
    idCliente = await insertarCliente({ correo: 'cliente-int@prueba.com' });
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('calcula fecha_fin = fecha_inicio + duracion (FR-003)', async () => {
    const idTipo = await crearTipoPrueba({ duracion: 30 });
    const respuesta = await request(app)
      .post('/api/membresias')
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({
        id_cliente: idCliente,
        id_tipo_membresia: idTipo,
        fecha_inicio: '2026-10-01',
      });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.data.fecha_inicio).toBe('2026-10-01');
    // 2026-10-01 + 30 días = 2026-10-31
    expect(respuesta.body.data.fecha_fin).toBe('2026-10-31');
    expect(respuesta.body.data.estado).toBe('activa');
  });

  it('deja una sola membresía vigente por cliente (FR-025)', async () => {
    const idTipo = await crearTipoPrueba({ duracion: 60 });
    // Primera membresía vigente
    const primera = await request(app)
      .post('/api/membresias')
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({ id_cliente: idCliente, id_tipo_membresia: idTipo, fecha_inicio: '2026-11-01' });
    expect(primera.status).toBe(201);

    // Segunda membresía: debe cerrar la anterior
    const segunda = await request(app)
      .post('/api/membresias')
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({ id_cliente: idCliente, id_tipo_membresia: idTipo, fecha_inicio: '2026-12-01' });
    expect(segunda.status).toBe(201);

    const vigentes = await consultar(
      "SELECT * FROM membresias WHERE id_cliente = ? AND estado = 'activa'",
      [idCliente]
    );
    expect(vigentes).toHaveLength(1);
    expect(aFechaLocal(vigentes[0].fecha_inicio)).toBe('2026-12-01');

    // La primera sigue existiendo pero ya no está activa
    const primeraGuardada = await consultar('SELECT * FROM membresias WHERE id_membresia = ?', [
      primera.body.data.id_membresia,
    ]);
    expect(primeraGuardada).toHaveLength(1);
    expect(primeraGuardada[0].estado).not.toBe('activa');
  });

  it('persiste la membresía con estado inicial activa en la base de datos', async () => {
    const idOtro = await insertarCliente({ correo: 'cliente-int2@prueba.com' });
    const idTipo = await crearTipoPrueba({ duracion: 90 });
    const respuesta = await request(app)
      .post('/api/membresias')
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({ id_cliente: idOtro, id_tipo_membresia: idTipo });

    expect(respuesta.status).toBe(201);
    const filas = await consultar('SELECT * FROM membresias WHERE id_cliente = ?', [idOtro]);
    expect(filas).toHaveLength(1);
    expect(filas[0].estado).toBe('activa');
  });

  it('rechaza asignar a un tipo de membresía inactivo con 409', async () => {
    const idInactivo = await insertarCliente({ correo: 'cliente-int3@prueba.com' });
    const idTipoInactivo = await obtenerPool()
      .execute(
        "INSERT INTO tipos_membresia (nombre, descripcion, duracion, precio, estado) VALUES (?, ?, ?, ?, 'inactivo')",
        ['Tipo inactivo', 'No debe poder asignarse', 30, 100]
      )
      .then((r) => r[0].insertId);

    const respuesta = await request(app)
      .post('/api/membresias')
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({ id_cliente: idInactivo, id_tipo_membresia: idTipoInactivo });

    expect(respuesta.status).toBe(409);
  });
});
