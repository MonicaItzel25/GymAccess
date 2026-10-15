// Pruebas de contrato: POST /api/clientes (administrador y recepcionista).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import { consultar } from '../../src/config/db.js';
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

describe('Contrato de registro de clientes', () => {
  let tokenAdmin;
  let tokenRecep;
  let tokenEntrenador;
  let tokenCliente;
  let idRecep;

  beforeAll(async () => {
    await vaciarTablas();
    await insertarUsuario({ nombre: 'Admin', correo: 'admin-cli@prueba.com', rol: 'administrador' });
    idRecep = await insertarUsuario({ nombre: 'Recep', correo: 'recep-cli@prueba.com', rol: 'recepcionista' });
    await insertarUsuario({ nombre: 'Entrenador', correo: 'ent-cli@prueba.com', rol: 'entrenador' });
    await insertarUsuario({ nombre: 'Cliente', correo: 'cli-cli@prueba.com', rol: 'cliente' });
    tokenAdmin = await tokenDe('admin-cli@prueba.com');
    tokenRecep = await tokenDe('recep-cli@prueba.com');
    tokenEntrenador = await tokenDe('ent-cli@prueba.com');
    tokenCliente = await tokenDe('cli-cli@prueba.com');
    await insertarCliente({ correo: 'existente@prueba.com' });
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('POST como recepcionista devuelve 201', async () => {
    const respuesta = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({
        nombre: 'María',
        apellido: 'López',
        correo: 'maria@prueba.com',
        telefono: '555-1111',
      });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.ok).toBe(true);
    expect(respuesta.body.data.apellido).toBe('López');
  });

  it('POST como administrador devuelve 201', async () => {
    const respuesta = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Juan', apellido: 'Pérez', correo: 'juan@prueba.com' });

    expect(respuesta.status).toBe(201);
  });

  it('POST como entrenador devuelve 403', async () => {
    const respuesta = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({ nombre: 'Ana', apellido: 'Torres' });

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.message).toContain('permisos');
  });

  it('POST como cliente devuelve 403', async () => {
    const respuesta = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ nombre: 'Eva', apellido: 'Ruiz' });

    expect(respuesta.status).toBe(403);
  });

  it('POST sin nombre devuelve 400', async () => {
    const respuesta = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({ apellido: 'SinNombre' });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.ok).toBe(false);
  });

  it('POST con correo inválido devuelve 400', async () => {
    const respuesta = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({ nombre: 'Raro', apellido: 'Correos', correo: 'no-es-correo' });

    expect(respuesta.status).toBe(400);
  });

  it('POST con correo duplicado devuelve 409', async () => {
    const respuesta = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({ nombre: 'Duplicado', apellido: 'Correo', correo: 'existente@prueba.com' });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.message).toContain('registrado');
  });

  // --- Auditoría de clientes (A11, regla X.3) — T021 ---

  it('registra en auditoría la creación y modificación de clientes sin credenciales', async () => {
    const creacion = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({ nombre: 'Auditor', apellido: 'Cliente', correo: 'auditar@prueba.com' });
    expect(creacion.status).toBe(201);
    const idAuditor = creacion.body.data.id_cliente;

    const modificacion = await request(app)
      .put(`/api/clientes/${idAuditor}`)
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({ telefono: '555-9999' });
    expect(modificacion.status).toBe(200);
    expect(modificacion.body.data.telefono).toBe('555-9999');

    const filas = await consultar(
      `SELECT id_usuario, accion, resultado, descripcion
       FROM auditoria
       WHERE modulo = 'clientes'
       ORDER BY id_auditoria`
    );

    const creacionFila = filas.find(
      (f) => f.accion === 'crear_cliente' && (f.descripcion || '').includes('Auditor')
    );
    const modificacionFila = filas.find(
      (f) => f.accion === 'modificar_cliente' && (f.descripcion || '').includes(`#${idAuditor}`)
    );
    const rechazoFila = filas.find(
      (f) => f.accion === 'crear_cliente' && f.resultado === 'rechazado'
    );

    expect(creacionFila).toBeDefined();
    expect(creacionFila.resultado).toBe('exitoso');
    expect(creacionFila.id_usuario).toBe(idRecep);

    expect(modificacionFila).toBeDefined();
    expect(modificacionFila.resultado).toBe('exitoso');
    expect(modificacionFila.id_usuario).toBe(idRecep);

    // El correo duplicado del caso anterior queda registrado como rechazo.
    expect(rechazoFila).toBeDefined();
    expect(rechazoFila.resultado).toBe('rechazado');

    // Regla X.3: jamás credenciales ni hashes en las descripciones.
    for (const fila of [creacionFila, modificacionFila, rechazoFila]) {
      expect(fila.descripcion).not.toMatch(/\$2[aby]\$/);
      expect(fila.descripcion).not.toContain('password');
    }
  });
});
