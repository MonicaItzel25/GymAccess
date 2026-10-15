// Pruebas de integración: registro y persistencia de clientes en MySQL.

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
});
