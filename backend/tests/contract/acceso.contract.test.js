// Pruebas de contrato: POST /api/acceso/intento (ruta del kiosco, SIN token).
// Verifica que funciona sin autenticación, valida el descriptor y devuelve la
// decisión en `data` sin exponer datos biométricos.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import {
  vaciarTablas,
  insertarCliente,
  cerrarPool,
} from '../helpers/baseDatos.js';

const app = crearApp();

function descriptorPrueba(semilla = 1) {
  return Array.from({ length: 128 }, (_, i) => Number((((i + semilla) % 20) / 20).toFixed(4)));
}

describe('Contrato de validación de acceso (kiosco)', () => {
  let idCliente;

  beforeAll(async () => {
    await vaciarTablas();
    idCliente = await insertarCliente({ correo: 'cli-acceso@prueba.com' });
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('funciona SIN token (es la ruta del kiosco) y responde 200', async () => {
    const respuesta = await request(app)
      .post('/api/acceso/intento')
      .send({ descriptor_facial: descriptorPrueba(1) });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.ok).toBe(true);
    expect(respuesta.body.data).toHaveProperty('resultado');
    // Nunca expone descriptores almacenados (FR-020, SC-004).
    expect(JSON.stringify(respuesta.body)).not.toContain('descriptor_facial');
  });

  it('devuelve 400 con descriptor inválido (distinto de 128 números)', async () => {
    const respuesta = await request(app)
      .post('/api/acceso/intento')
      .send({ descriptor_facial: [0.1, 0.2] });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.ok).toBe(false);
  });

  it('devuelve 400 sin descriptor', async () => {
    const respuesta = await request(app)
      .post('/api/acceso/intento')
      .send({});

    expect(respuesta.status).toBe(400);
  });

  it('un rostro no registrado responde rechazado con motivo', async () => {
    const respuesta = await request(app)
      .post('/api/acceso/intento')
      .send({ descriptor_facial: descriptorPrueba(99) });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.resultado).toBe('rechazado');
    expect(respuesta.body.data.motivo).toBe('rostro no identificado');
    expect(respuesta.body.data.cliente).toBeNull();
  });
});
