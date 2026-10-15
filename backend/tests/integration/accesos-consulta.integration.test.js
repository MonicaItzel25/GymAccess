// Pruebas de integración: consulta de registros de acceso (US-S2-09.1).
// Verifica que el listado incluye los intentos con fecha, hora, resultado y
// motivo de rechazo cuando corresponde.

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

function descriptorDe(semilla) {
  return Array.from({ length: 128 }, (_, i) => Math.sin(semilla * (i + 1)));
}

describe('Integración de consulta de accesos', () => {
  let tokenAdmin;
  let idCliente;

  beforeAll(async () => {
    await vaciarTablas();
    await insertarUsuario({ nombre: 'Admin', correo: 'admin-accint@prueba.com', rol: 'administrador' });
    tokenAdmin = await tokenDe('admin-accint@prueba.com');
    idCliente = await insertarCliente({ correo: 'cliente-accint@prueba.com' });

    // Registra un rostro para poder generar intentos autorizados/rechazados.
    const descriptor = descriptorDe(21);
    await (await import('../../src/config/db.js')).obtenerPool().execute(
      "INSERT INTO rostros (id_cliente, descriptor_facial, estado) VALUES (?, ?, 'activo')",
      [idCliente, JSON.stringify(descriptor)]
    );

    // Genera un intento: sin membresía → rechazado (rostro identificado).
    await request(app)
      .post('/api/acceso/intento')
      .send({ descriptor_facial: descriptor });

    // Genera un intento de rostro desconocido → rechazado (no identificado).
    await request(app)
      .post('/api/acceso/intento')
      .send({ descriptor_facial: descriptorDe(999) });
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('el listado incluye los intentos con fecha, hora, resultado y motivo (US-S2-09.1)', async () => {
    const respuesta = await request(app)
      .get('/api/accesos')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.length).toBeGreaterThanOrEqual(2);

    for (const acceso of respuesta.body.data) {
      expect(acceso.fecha).toBeTruthy();
      expect(acceso.hora).toBeTruthy();
      expect(['autorizado', 'rechazado']).toContain(acceso.resultado);
    }

    // Al menos un rechazo lleva motivo (membrsía o rostro no identificado).
    const rechazados = respuesta.body.data.filter((a) => a.resultado === 'rechazado');
    expect(rechazados.length).toBeGreaterThan(0);
    for (const r of rechazados) {
      expect(r.motivo_rechazo).toBeTruthy();
    }
  });

  it('el intento de rostro identificado sin membresía registra id_cliente y motivo', async () => {
    const filas = await consultar(
      'SELECT * FROM accesos WHERE id_cliente = ? AND resultado = ?',
      [idCliente, 'rechazado']
    );
    expect(filas.length).toBeGreaterThan(0);
    expect(filas[0].motivo_rechazo).toBe('sin membresia vigente');
  });

  it('el intento de rostro no identificado registra id_cliente nulo', async () => {
    const filas = await consultar(
      "SELECT * FROM accesos WHERE motivo_rechazo = 'rostro no identificado'"
    );
    expect(filas.length).toBeGreaterThan(0);
    expect(filas[0].id_cliente).toBeNull();
  });

  it('el filtro por cliente devuelve solo los accesos de ese cliente', async () => {
    const respuesta = await request(app)
      .get(`/api/accesos?cliente=${idCliente}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.length).toBeGreaterThan(0);
    for (const acceso of respuesta.body.data) {
      expect(Number(acceso.id_cliente)).toBe(Number(idCliente));
    }
  });

  it('no existe ninguna ruta DELETE de accesos (FR-018)', async () => {
    const respuesta = await request(app)
      .delete('/api/accesos')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect([404, 405]).toContain(respuesta.status);
  });
});
