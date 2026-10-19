// Pruebas de contrato: POST /api/pagos (administrador y recepcionista).
// Verifica roles, catálogo de métodos de pago, montos y membresía existente.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import { obtenerPool } from '../../src/config/db.js';
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

/** Crea tipo y membresía de prueba, devolviendo el id de la membresía. */
async function crearMembresiaPrueba(idCliente) {
  const pool = obtenerPool();
  const [rTipo] = await pool.execute(
    "INSERT INTO tipos_membresia (nombre, descripcion, duracion, precio, estado) VALUES (?, ?, ?, ?, 'activo')",
    [`Tipo pago ${Date.now()}`, 'Para pruebas', 30, 500]
  );
  const [rMem] = await pool.execute(
    "INSERT INTO membresias (id_cliente, id_tipo_membresia, fecha_inicio, fecha_fin, estado, precio_acordado) VALUES (?, ?, ?, ?, 'activa', ?)",
    [idCliente, rTipo.insertId, '2026-01-01', '2030-12-31', 500]
  );
  return rMem.insertId;
}

describe('Contrato de registro de pagos', () => {
  let tokenAdmin;
  let tokenRecep;
  let tokenEntrenador;
  let tokenCliente;
  let idCliente;
  let idMembresia;

  beforeAll(async () => {
    await vaciarTablas();
    await insertarUsuario({ nombre: 'Admin', correo: 'admin-pago@prueba.com', rol: 'administrador' });
    await insertarUsuario({ nombre: 'Recep', correo: 'recep-pago@prueba.com', rol: 'recepcionista' });
    await insertarUsuario({ nombre: 'Entrenador', correo: 'ent-pago@prueba.com', rol: 'entrenador' });
    await insertarUsuario({ nombre: 'Cliente', correo: 'cli-pago@prueba.com', rol: 'cliente' });
    tokenAdmin = await tokenDe('admin-pago@prueba.com');
    tokenRecep = await tokenDe('recep-pago@prueba.com');
    tokenEntrenador = await tokenDe('ent-pago@prueba.com');
    tokenCliente = await tokenDe('cli-pago@prueba.com');
    idCliente = await insertarCliente({ correo: 'cliente-pago@prueba.com' });
    idMembresia = await crearMembresiaPrueba(idCliente);
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('POST como recepcionista devuelve 201', async () => {
    const respuesta = await request(app)
      .post('/api/pagos')
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({
        id_cliente: idCliente,
        id_membresia: idMembresia,
        monto: 200,
        metodo_pago: 'efectivo',
      });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.ok).toBe(true);
    expect(respuesta.body.data.estado).toBe('pagado');
  });

  it('POST como administrador devuelve 201', async () => {
    const respuesta = await request(app)
      .post('/api/pagos')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        id_cliente: idCliente,
        id_membresia: idMembresia,
        monto: 150,
        metodo_pago: 'transferencia',
      });

    expect(respuesta.status).toBe(201);
  });

  it('POST con método tarjeta del catálogo devuelve 201', async () => {
    const respuesta = await request(app)
      .post('/api/pagos')
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({
        id_cliente: idCliente,
        id_membresia: idMembresia,
        monto: 150,
        metodo_pago: 'tarjeta',
      });

    expect(respuesta.status).toBe(201);
  });

  it('POST sin token devuelve 401', async () => {
    const respuesta = await request(app)
      .post('/api/pagos')
      .send({
        id_cliente: idCliente,
        id_membresia: idMembresia,
        monto: 100,
        metodo_pago: 'efectivo',
      });

    expect(respuesta.status).toBe(401);
  });

  it('POST como entrenador devuelve 403', async () => {
    const respuesta = await request(app)
      .post('/api/pagos')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({
        id_cliente: idCliente,
        id_membresia: idMembresia,
        monto: 100,
        metodo_pago: 'efectivo',
      });

    expect(respuesta.status).toBe(403);
  });

  it('POST como cliente devuelve 403', async () => {
    const respuesta = await request(app)
      .post('/api/pagos')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({
        id_cliente: idCliente,
        id_membresia: idMembresia,
        monto: 100,
        metodo_pago: 'efectivo',
      });

    expect(respuesta.status).toBe(403);
  });

  it('POST con monto no positivo devuelve 400', async () => {
    const respuesta = await request(app)
      .post('/api/pagos')
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({
        id_cliente: idCliente,
        id_membresia: idMembresia,
        monto: 0,
        metodo_pago: 'efectivo',
      });

    expect(respuesta.status).toBe(400);
  });

  it('POST con método fuera del catálogo devuelve 400', async () => {
    const respuesta = await request(app)
      .post('/api/pagos')
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({
        id_cliente: idCliente,
        id_membresia: idMembresia,
        monto: 100,
        metodo_pago: 'cheque',
      });

    expect(respuesta.status).toBe(400);
  });

  it('POST con membresía inexistente devuelve 404', async () => {
    const respuesta = await request(app)
      .post('/api/pagos')
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({
        id_cliente: idCliente,
        id_membresia: 999999,
        monto: 100,
        metodo_pago: 'efectivo',
      });

    expect(respuesta.status).toBe(404);
  });

  it('GET /api/pagos como recepcionista devuelve 200 y lista', async () => {
    const respuesta = await request(app)
      .get('/api/pagos')
      .set('Authorization', `Bearer ${tokenRecep}`);

    expect(respuesta.status).toBe(200);
    expect(Array.isArray(respuesta.body.data)).toBe(true);
  });

  it('GET /api/pagos como cliente devuelve 403', async () => {
    const respuesta = await request(app)
      .get('/api/pagos')
      .set('Authorization', `Bearer ${tokenCliente}`);

    expect(respuesta.status).toBe(403);
  });

  it('no existe ruta DELETE de pagos (FR-008, SC-005)', async () => {
    const respuesta = await request(app)
      .delete(`/api/pagos/${idMembresia}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    // 404: la ruta no existe (o 405 si el método se expusiera). Nunca 200.
    expect([404, 405]).toContain(respuesta.status);
  });
});
