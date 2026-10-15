// Pruebas de contrato: GET /api/clientes/mio (información propia del cliente).
// La relación usuario↔cliente se resuelve por coincidencia de correo.

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

describe('Contrato de información propia del cliente', () => {
  let tokenCliente;
  let tokenAdmin;
  let tokenEntrenador;

  beforeAll(async () => {
    await vaciarTablas();
    await insertarUsuario({
      nombre: 'Cliente Propio',
      correo: 'propietario@prueba.com',
      rol: 'cliente',
    });
    await insertarUsuario({ nombre: 'Admin', correo: 'admin-mio@prueba.com', rol: 'administrador' });
    await insertarUsuario({ nombre: 'Entrenador', correo: 'ent-mio@prueba.com', rol: 'entrenador' });
    await insertarUsuario({ nombre: 'Sin Cliente', correo: 'sin-cliente@prueba.com', rol: 'cliente' });

    tokenCliente = await tokenDe('propietario@prueba.com');
    tokenAdmin = await tokenDe('admin-mio@prueba.com');
    tokenEntrenador = await tokenDe('ent-mio@prueba.com');

    // Cliente con el mismo correo de la cuenta rol cliente
    await insertarCliente({
      nombre: 'Cliente',
      apellido: 'Propietario',
      correo: 'propietario@prueba.com',
      telefono: '555-4000',
    });
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('devuelve 200 con los datos del cliente al rol cliente', async () => {
    const respuesta = await request(app)
      .get('/api/clientes/mio')
      .set('Authorization', `Bearer ${tokenCliente}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.correo).toBe('propietario@prueba.com');
    expect(respuesta.body.data.nombre).toBe('Cliente');
    expect(respuesta.body.data.telefono).toBe('555-4000');
  });

  it('devuelve 403 para el rol administrador', async () => {
    const respuesta = await request(app)
      .get('/api/clientes/mio')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.message).toContain('permisos');
  });

  it('devuelve 403 para el rol entrenador', async () => {
    const respuesta = await request(app)
      .get('/api/clientes/mio')
      .set('Authorization', `Bearer ${tokenEntrenador}`);

    expect(respuesta.status).toBe(403);
  });

  it('devuelve 401 sin token', async () => {
    const respuesta = await request(app).get('/api/clientes/mio');
    expect(respuesta.status).toBe(401);
  });

  it('devuelve 404 cuando no existe un cliente con el correo de la cuenta', async () => {
    const tokenSin = await tokenDe('sin-cliente@prueba.com');
    const respuesta = await request(app)
      .get('/api/clientes/mio')
      .set('Authorization', `Bearer ${tokenSin}`);

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.message).toContain('No existe un cliente');
  });

  // --- Vinculación de cuenta con cliente (A15 / FR-023) — T024 ---

  it('POST /api/usuarios con rol cliente y ficha de cliente coincide devuelve 201', async () => {
    await insertarCliente({
      nombre: 'Nuevo',
      apellido: 'Cliente',
      correo: 'nuevo-cliente@prueba.com',
    });

    const respuesta = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        nombre: 'Cuenta Cliente',
        correo: '  NUEVO-CLIENTE@PRUEBA.COM  ',
        password: 'NuevaCuenta1',
        rol: 'cliente',
      });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.data.rol).toBe('cliente');
    expect(respuesta.body.data.correo).toBe('nuevo-cliente@prueba.com');
    expect(respuesta.body.data.password).toBeUndefined();
  });

  it('POST /api/usuarios con rol cliente sin ficha de cliente coincide devuelve 400', async () => {
    const respuesta = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        nombre: 'Sin Ficha',
        correo: 'sin-ficha@prueba.com',
        password: 'NuevaCuenta1',
        rol: 'cliente',
      });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.ok).toBe(false);
    expect(respuesta.body.message).toBe(
      'el correo no coincide con ningún cliente registrado'
    );
  });

  it('POST /api/usuarios con rol cliente y correo de usuario ya registrado devuelve 409', async () => {
    const respuesta = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        nombre: 'Duplicado Vínculo',
        correo: 'propietario@prueba.com',
        password: 'NuevaCuenta1',
        rol: 'cliente',
      });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.message).toContain('registrado');
  });
});
