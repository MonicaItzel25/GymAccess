// Pruebas de contrato: asignaciones de entrenador a cliente (US-S3-02, Sprint 3).
// POST y finalizar: administrador y recepcionista; GET también para el
// entrenador, limitado a las suyas (contrato §2). Una única asignación vigente
// por cliente (FR-006, SC-003). Matriz de denegaciones §10.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
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

describe('Contrato de asignaciones de entrenador', () => {
  let tokenAdmin;
  let tokenRecep;
  let tokenEntrenador;
  let tokenCliente;
  let idCliente;
  let idCliente2;
  let idClienteInactivo;
  let idEntrenador;
  let idEntrenador2;
  let idAsignacion;
  let idAsignacion2;

  beforeAll(async () => {
    await vaciarTablas();
    await insertarUsuario({ nombre: 'Admin Asig', correo: 'admin-asig@prueba.com', rol: 'administrador' });
    await insertarUsuario({ nombre: 'Recep Asig', correo: 'recep-asig@prueba.com', rol: 'recepcionista' });
    const idCuentaEnt = await insertarUsuario({ nombre: 'Entrenador Uno', correo: 'ent-asig@prueba.com', rol: 'entrenador' });
    const idCuentaEnt2 = await insertarUsuario({ nombre: 'Entrenador Dos', correo: 'ent2-asig@prueba.com', rol: 'entrenador' });
    await insertarUsuario({ nombre: 'Cliente Cuenta', correo: 'cli-asig@prueba.com', rol: 'cliente' });

    idCliente = await insertarCliente({ nombre: 'Ana', apellido: 'Cliente', correo: 'ana-asig@prueba.com' });
    idCliente2 = await insertarCliente({ nombre: 'Bruno', apellido: 'Socio', correo: 'bruno-asig@prueba.com' });
    idClienteInactivo = await insertarCliente({ nombre: 'Carla', apellido: 'Inactiva', correo: 'carla-asig@prueba.com', estado: 'inactivo' });

    tokenAdmin = await tokenDe('admin-asig@prueba.com');
    tokenRecep = await tokenDe('recep-asig@prueba.com');
    tokenEntrenador = await tokenDe('ent-asig@prueba.com');
    tokenCliente = await tokenDe('cli-asig@prueba.com');

    // Perfiles de entrenador creados por la API (Historia 1).
    const perfil1 = await request(app)
      .post('/api/entrenadores')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ id_usuario: idCuentaEnt });
    idEntrenador = perfil1.body.data.id_entrenador;
    const perfil2 = await request(app)
      .post('/api/entrenadores')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ id_usuario: idCuentaEnt2 });
    idEntrenador2 = perfil2.body.data.id_entrenador;
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('POST como administrador crea la asignación vigente (201)', async () => {
    const respuesta = await request(app)
      .post('/api/asignaciones')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ id_cliente: idCliente, id_entrenador: idEntrenador });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.data.id_asignacion).toBeTruthy();
    expect(respuesta.body.data.estado).toBe('vigente');
    expect(respuesta.body.data.fecha_fin).toBeNull();
    expect(respuesta.body.data.fecha_inicio).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    idAsignacion = respuesta.body.data.id_asignacion;
  });

  it('POST con fecha_inicio explícita la respeta (200→201)', async () => {
    const respuesta = await request(app)
      .post('/api/asignaciones')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ id_cliente: idCliente2, id_entrenador: idEntrenador, fecha_inicio: '2026-01-15' });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.data.fecha_inicio).toBe('2026-01-15');
    idAsignacion2 = respuesta.body.data.id_asignacion;
  });

  it('una segunda asignación vigente del mismo cliente devuelve 400 (SC-003, FR-006)', async () => {
    const respuesta = await request(app)
      .post('/api/asignaciones')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ id_cliente: idCliente, id_entrenador: idEntrenador2 });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.message).toContain('ya tiene un entrenador asignado vigente');
  });

  it('POST con cliente inexistente devuelve 404', async () => {
    const respuesta = await request(app)
      .post('/api/asignaciones')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ id_cliente: 999999, id_entrenador: idEntrenador });

    expect(respuesta.status).toBe(404);
  });

  it('POST con entrenador sin perfil devuelve 404', async () => {
    const respuesta = await request(app)
      .post('/api/asignaciones')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ id_cliente: idCliente, id_entrenador: 999999 });

    expect(respuesta.status).toBe(404);
  });

  it('POST con cliente inactivo devuelve 400 (US-S3-02.3)', async () => {
    const respuesta = await request(app)
      .post('/api/asignaciones')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ id_cliente: idClienteInactivo, id_entrenador: idEntrenador });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.message).toContain('inactivo');
  });

  it('POST con entrenador inactivo devuelve 400 (US-S3-02.3)', async () => {
    await request(app)
      .put(`/api/entrenadores/${idEntrenador2}/estado`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'inactivo' });

    const idCliente3 = await insertarCliente({ nombre: 'Diego', apellido: 'Nuevo', correo: 'diego-asig@prueba.com' });
    const respuesta = await request(app)
      .post('/api/asignaciones')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ id_cliente: idCliente3, id_entrenador: idEntrenador2 });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.message).toContain('inactivo');

    await request(app)
      .put(`/api/entrenadores/${idEntrenador2}/estado`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'activo' });
  });

  it('PUT /:id/finalizar como recepcionista finaliza la asignación (200)', async () => {
    const respuesta = await request(app)
      .put(`/api/asignaciones/${idAsignacion2}/finalizar`)
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({});

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.estado).toBe('finalizada');
    expect(respuesta.body.data.fecha_fin).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('PUT /:id/finalizar sobre una asignación ya finalizada devuelve 400', async () => {
    const respuesta = await request(app)
      .put(`/api/asignaciones/${idAsignacion2}/finalizar`)
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({});

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.message).toContain('ya está finalizada');
  });

  it('PUT /:id/finalizar con identificador inexistente devuelve 404', async () => {
    const respuesta = await request(app)
      .put('/api/asignaciones/999999/finalizar')
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({});

    expect(respuesta.status).toBe(404);
  });

  it('POST y finalizar como entrenador o cliente devuelven 403 (matriz §10)', async () => {
    const postEntrenador = await request(app)
      .post('/api/asignaciones')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({ id_cliente: idCliente, id_entrenador: idEntrenador });
    const postCliente = await request(app)
      .post('/api/asignaciones')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ id_cliente: idCliente, id_entrenador: idEntrenador });
    const finalizarEntrenador = await request(app)
      .put(`/api/asignaciones/${idAsignacion}/finalizar`)
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({});

    expect(postEntrenador.status).toBe(403);
    expect(postCliente.status).toBe(403);
    expect(finalizarEntrenador.status).toBe(403);
  });

  it('GET como administrador incluye el nombre del cliente', async () => {
    const respuesta = await request(app)
      .get('/api/asignaciones')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(200);
    const propia = respuesta.body.data.find((a) => a.id_asignacion === idAsignacion);
    expect(propia.cliente_nombre).toBe('Ana');
    expect(propia.entrenador_nombre).toBe('Entrenador Uno');
  });

  it('GET con vigentes=true devuelve solo asignaciones vigentes (FR-008)', async () => {
    const respuesta = await request(app)
      .get('/api/asignaciones?vigentes=true')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.length).toBeGreaterThan(0);
    for (const asignacion of respuesta.body.data) {
      expect(asignacion.estado).toBe('vigente');
    }
  });

  it('GET como entrenador solo devuelve las suyas e ignora ?entrenador= de terceros', async () => {
    const respuesta = await request(app)
      .get(`/api/asignaciones?entrenador=${idEntrenador2}`)
      .set('Authorization', `Bearer ${tokenEntrenador}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.length).toBeGreaterThan(0);
    for (const asignacion of respuesta.body.data) {
      expect(asignacion.id_entrenador).toBe(idEntrenador);
    }
  });

  it('GET del entrenador: sin parámetro solo vigentes; con vigentes=false su histórico', async () => {
    // Bruno pasa al entrenador 2 tras finalizarse su asignación con el
    // entrenador 1; el histórico del entrenador 1 conserva la asignación
    // cerrada (FR-008, sin borrados).
    await request(app)
      .post('/api/asignaciones')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ id_cliente: idCliente2, id_entrenador: idEntrenador2 });

    const sinParametro = await request(app)
      .get('/api/asignaciones')
      .set('Authorization', `Bearer ${tokenEntrenador}`);
    expect(sinParametro.status).toBe(200);
    expect(sinParametro.body.data.length).toBeGreaterThan(0);
    for (const asignacion of sinParametro.body.data) {
      expect(asignacion.estado).toBe('vigente');
      expect(asignacion.id_entrenador).toBe(idEntrenador);
    }

    const historico = await request(app)
      .get('/api/asignaciones?vigentes=false')
      .set('Authorization', `Bearer ${tokenEntrenador}`);
    expect(historico.status).toBe(200);
    expect(historico.body.data.some((a) => a.estado === 'finalizada')).toBe(true);
  });

  it('GET como cliente devuelve 403', async () => {
    const respuesta = await request(app)
      .get('/api/asignaciones')
      .set('Authorization', `Bearer ${tokenCliente}`);

    expect(respuesta.status).toBe(403);
  });
});
