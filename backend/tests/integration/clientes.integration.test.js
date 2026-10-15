// Pruebas de integración: registro y persistencia de clientes en MySQL.

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

describe('Integración de registro de clientes', () => {
  let tokenRecep;

  beforeAll(async () => {
    await vaciarTablas();
    await insertarUsuario({ nombre: 'Recep', correo: 'recep-int@prueba.com', rol: 'recepcionista' });
    tokenRecep = await tokenDe('recep-int@prueba.com');
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('persiste el cliente en MySQL con fecha de registro y estado activo', async () => {
    const respuesta = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({
        nombre: 'Carla',
        apellido: 'Mendoza',
        correo: 'carla@prueba.com',
        telefono: '555-2222',
        direccion: 'Av. Principal 45',
      });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.data.estado).toBe('activo');

    const filas = await consultar('SELECT * FROM clientes WHERE correo = ?', [
      'carla@prueba.com',
    ]);
    expect(filas).toHaveLength(1);
    expect(filas[0].nombre).toBe('Carla');
    expect(filas[0].fecha_registro).toBeTruthy();
  });

  it('no permite correos duplicados a nivel de aplicación y de base de datos', async () => {
    const primero = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({ nombre: 'Otra', apellido: 'Persona', correo: 'dup@prueba.com' });
    expect(primero.status).toBe(201);

    const segundo = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({ nombre: 'Otra', apellido: 'Persona', correo: 'dup@prueba.com' });
    expect(segundo.status).toBe(409);

    const filas = await consultar('SELECT COUNT(*) AS total FROM clientes WHERE correo = ?', [
      'dup@prueba.com',
    ]);
    expect(Number(filas[0].total)).toBe(1);
  });

  it('registra clientes sin correo (campo opcional)', async () => {
    const respuesta = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({ nombre: 'Sin', apellido: 'Correo' });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.data.correo).toBeNull();
  });

  // --- FR-010 y FR-025 — T025 ---

  it('FR-010: la cuenta activa inicia sesión y consulta su ficha aunque el registro del cliente esté inactivo', async () => {
    await insertarUsuario({
      nombre: 'Cliente Cuenta Activa',
      correo: 'cuenta-activa@prueba.com',
      rol: 'cliente',
    });
    await insertarCliente({
      nombre: 'Ficha',
      apellido: 'Inactiva',
      correo: 'cuenta-activa@prueba.com',
      estado: 'inactivo',
    });

    const token = await tokenDe('cuenta-activa@prueba.com');
    expect(token).toBeTruthy();

    const respuesta = await request(app)
      .get('/api/clientes/mio')
      .set('Authorization', `Bearer ${token}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.correo).toBe('cuenta-activa@prueba.com');
    expect(respuesta.body.data.estado).toBe('inactivo');
  });

  it('FR-025: el rol cliente recibe 403 al consultar una ficha ajena y no ve sus datos', async () => {
    const idTercero = await insertarCliente({
      nombre: 'Tercero',
      apellido: 'Ajeno',
      correo: 'tercero@prueba.com',
      telefono: '555-7777',
    });
    const token = await tokenDe('cuenta-activa@prueba.com');

    const respuesta = await request(app)
      .get(`/api/clientes/${idTercero}`)
      .set('Authorization', `Bearer ${token}`);

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.ok).toBe(false);
    expect(respuesta.body.data).toBeUndefined();
    expect(JSON.stringify(respuesta.body)).not.toContain('Tercero');
    expect(JSON.stringify(respuesta.body)).not.toContain('555-7777');
  });
});
