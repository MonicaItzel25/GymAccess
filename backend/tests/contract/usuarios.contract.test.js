// Pruebas de contrato: POST y GET /api/usuarios (exclusivo administrador).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import { consultar } from '../../src/config/db.js';
import {
  vaciarTablas,
  insertarUsuario,
  cerrarPool,
} from '../helpers/baseDatos.js';

const app = crearApp();

async function tokenDe(correo) {
  const respuesta = await request(app)
    .post('/api/auth/login')
    .send({ correo, password: 'Prueba1234' });
  return respuesta.body.data.token;
}

describe('Contrato de gestión de usuarios', () => {
  let tokenAdmin;
  let idAdmin;

  beforeAll(async () => {
    await vaciarTablas();
    idAdmin = await insertarUsuario({
      nombre: 'Admin Contrato',
      correo: 'admin-contrato@prueba.com',
      rol: 'administrador',
    });
    await insertarUsuario({
      nombre: 'Recepcionista',
      correo: 'recepcion-contrato@prueba.com',
      rol: 'recepcionista',
    });
    tokenAdmin = await tokenDe('admin-contrato@prueba.com');
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('POST con administrador y datos válidos devuelve 201', async () => {
    const respuesta = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        nombre: 'Nuevo Usuario',
        correo: 'nuevo@prueba.com',
        password: 'NuevaClave1',
        rol: 'recepcionista',
      });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.ok).toBe(true);
    expect(respuesta.body.data.rol).toBe('recepcionista');
    expect(respuesta.body.data.password).toBeUndefined();
  });

  it('POST sin token devuelve 401', async () => {
    const respuesta = await request(app)
      .post('/api/usuarios')
      .send({ nombre: 'X', correo: 'x@prueba.com', password: 'X1abcdeff', rol: 'cliente' });

    expect(respuesta.status).toBe(401);
  });

  it('POST con rol no administrador devuelve 403', async () => {
    const tokenRecep = await tokenDe('recepcion-contrato@prueba.com');
    const respuesta = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({ nombre: 'X', correo: 'x2@prueba.com', password: 'X1abcdeff', rol: 'cliente' });

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.message).toContain('permisos');
  });

  it('POST con contraseña débil devuelve 400', async () => {
    const respuesta = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Débil', correo: 'debil@prueba.com', password: 'abc123', rol: 'cliente' });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.ok).toBe(false);
  });

  it('POST con rol fuera del catálogo devuelve 400', async () => {
    const respuesta = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Rol', correo: 'rol@prueba.com', password: 'NuevaClave1', rol: 'superadmin' });

    expect(respuesta.status).toBe(400);
  });

  it('POST con correo duplicado devuelve 409', async () => {
    const respuesta = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        nombre: 'Duplicado',
        correo: 'nuevo@prueba.com',
        password: 'NuevaClave1',
        rol: 'cliente',
      });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.message).toContain('registrado');
  });

  it('GET con administrador devuelve 200 y el listado sin contraseñas', async () => {
    const respuesta = await request(app)
      .get('/api/usuarios')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(200);
    expect(Array.isArray(respuesta.body.data)).toBe(true);
    expect(respuesta.body.data.length).toBeGreaterThanOrEqual(2);
    expect(respuesta.body.data[0].password).toBeUndefined();
  });

  // --- Auditoría de usuarios (A11, FR-021, SC-003, regla X.3) — T018 ---

  it('registra en auditoría la creación, la modificación y los rechazos sin exponer contraseñas', async () => {
    const clave = 'AuditoriaClave1';
    const creacion = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        nombre: 'Auditado',
        correo: 'auditado@prueba.com',
        password: clave,
        rol: 'recepcionista',
      });
    expect(creacion.status).toBe(201);
    const idAuditado = creacion.body.data.id_usuario;

    const modificacion = await request(app)
      .put(`/api/usuarios/${idAuditado}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Auditado Modificado', password: 'OtraClave123' });
    expect(modificacion.status).toBe(200);

    const filas = await consultar(
      `SELECT id_usuario, accion, resultado, descripcion
       FROM auditoria
       WHERE modulo = 'usuarios'
       ORDER BY id_auditoria`
    );

    const creacionFila = filas.find(
      (f) =>
        f.accion === 'crear_usuario' &&
        (f.descripcion || '').includes('auditado@prueba.com')
    );
    const modificacionFila = filas.find(
      (f) =>
        f.accion === 'modificar_usuario' &&
        (f.descripcion || '').includes(`#${idAuditado}`)
    );
    const rechazoFila = filas.find(
      (f) => f.accion === 'crear_usuario' && f.resultado === 'rechazado'
    );

    expect(creacionFila).toBeDefined();
    expect(creacionFila.resultado).toBe('exitoso');
    expect(creacionFila.id_usuario).toBe(idAdmin);

    expect(modificacionFila).toBeDefined();
    expect(modificacionFila.resultado).toBe('exitoso');
    expect(modificacionFila.id_usuario).toBe(idAdmin);

    // El correo duplicado del caso anterior queda como rechazo (A11).
    expect(rechazoFila).toBeDefined();
    expect(rechazoFila.resultado).toBe('rechazado');

    // Regla X.3: jamás contraseñas ni hashes en las descripciones.
    for (const fila of [creacionFila, modificacionFila, rechazoFila]) {
      expect(fila.descripcion).not.toContain(clave);
      expect(fila.descripcion).not.toContain('OtraClave123');
      expect(fila.descripcion).not.toContain('NuevaClave1');
      expect(fila.descripcion).not.toMatch(/\$2[aby]\$/);
      expect(fila.descripcion).not.toContain('password');
    }
  });
});
