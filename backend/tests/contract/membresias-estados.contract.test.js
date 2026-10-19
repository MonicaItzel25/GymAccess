// Pruebas de contrato: estados de membresía (US-S2-03).
// PUT /:id/renovar → administrador y recepcionista (201).
// PUT /:id/suspender, /:id/reactivar, /:id/cancelar → solo administrador (200)
// y 403 para recepcionista (FR-026).

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

/** Crea una membresía activa de prueba y devuelve su id. */
async function crearMembresiaActiva(idCliente) {
  const pool = obtenerPool();
  const [rTipo] = await pool.execute(
    "INSERT INTO tipos_membresia (nombre, descripcion, duracion, precio, estado) VALUES (?, ?, ?, ?, 'activo')",
    [`Tipo estados ${Date.now()}`, 'Para pruebas', 30, 500]
  );
  const [rMem] = await pool.execute(
    "INSERT INTO membresias (id_cliente, id_tipo_membresia, fecha_inicio, fecha_fin, estado, precio_acordado) VALUES (?, ?, ?, ?, 'activa', ?)",
    [idCliente, rTipo.insertId, '2026-01-01', '2030-12-31', 500]
  );
  return rMem.insertId;
}

describe('Contrato de estados de membresía', () => {
  let tokenAdmin;
  let tokenRecep;
  let idCliente;

  beforeAll(async () => {
    await vaciarTablas();
    await insertarUsuario({ nombre: 'Admin', correo: 'admin-est@prueba.com', rol: 'administrador' });
    await insertarUsuario({ nombre: 'Recep', correo: 'recep-est@prueba.com', rol: 'recepcionista' });
    tokenAdmin = await tokenDe('admin-est@prueba.com');
    tokenRecep = await tokenDe('recep-est@prueba.com');
    idCliente = await insertarCliente({ correo: 'cliente-est@prueba.com' });
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('PUT /renovar como recepcionista devuelve 201', async () => {
    const idMem = await crearMembresiaActiva(idCliente);
    const respuesta = await request(app)
      .put(`/api/membresias/${idMem}/renovar`)
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({});

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.ok).toBe(true);
  });

  it('PUT /renovar como administrador devuelve 201', async () => {
    const idMem = await crearMembresiaActiva(idCliente);
    const respuesta = await request(app)
      .put(`/api/membresias/${idMem}/renovar`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({});

    expect(respuesta.status).toBe(201);
  });

  it('PUT /suspender como administrador devuelve 200', async () => {
    const idMem = await crearMembresiaActiva(idCliente);
    const respuesta = await request(app)
      .put(`/api/membresias/${idMem}/suspender`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({});

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.estado).toBe('suspendida');
  });

  it('PUT /suspender como recepcionista devuelve 403 (FR-026)', async () => {
    const idMem = await crearMembresiaActiva(idCliente);
    const respuesta = await request(app)
      .put(`/api/membresias/${idMem}/suspender`)
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({});

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.message).toContain('permisos');
  });

  it('PUT /reactivar como administrador devuelve 200', async () => {
    const idMem = await crearMembresiaActiva(idCliente);
    await request(app)
      .put(`/api/membresias/${idMem}/suspender`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({});

    const respuesta = await request(app)
      .put(`/api/membresias/${idMem}/reactivar`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({});

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.estado).toBe('activa');
  });

  it('PUT /reactivar como recepcionista devuelve 403', async () => {
    const idMem = await crearMembresiaActiva(idCliente);
    await request(app)
      .put(`/api/membresias/${idMem}/suspender`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({});

    const respuesta = await request(app)
      .put(`/api/membresias/${idMem}/reactivar`)
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({});

    expect(respuesta.status).toBe(403);
  });

  it('PUT /cancelar como administrador devuelve 200', async () => {
    const idMem = await crearMembresiaActiva(idCliente);
    const respuesta = await request(app)
      .put(`/api/membresias/${idMem}/cancelar`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({});

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.estado).toBe('cancelada');
  });

  it('PUT /cancelar como recepcionista devuelve 403 (FR-026)', async () => {
    const idMem = await crearMembresiaActiva(idCliente);
    const respuesta = await request(app)
      .put(`/api/membresias/${idMem}/cancelar`)
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({});

    expect(respuesta.status).toBe(403);
  });

  it('PUT sobre membresía inexistente devuelve 404', async () => {
    const respuesta = await request(app)
      .put('/api/membresias/999999/suspender')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({});

    expect(respuesta.status).toBe(404);
  });
});
