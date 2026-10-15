// Pruebas de integración: identificación facial con descriptores sintéticos.
// No depende de hardware: se registran descriptores de prueba y se comprueba
// que la comparación identifica al más próximo o devuelve null (FR-014).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { crearApp } from '../../src/app.js';
import { obtenerPool } from '../../src/config/db.js';
import { identificarCliente } from '../../src/services/rostro.service.js';
import { distancia } from '../../src/utils/matchRostro.js';
import {
  vaciarTablas,
  insertarCliente,
  cerrarPool,
} from '../helpers/baseDatos.js';

crearApp();

/** Descriptor sintético determinista a partir de una semilla. */
function descriptorDe(semilla) {
  return Array.from({ length: 128 }, (_, i) => Math.sin(semilla * (i + 1)));
}

/** Descriptor con un pequeño ruido respecto de otro. */
function conRuido(base, nivel) {
  return base.map((v) => v + nivel);
}

describe('Integración de identificación facial', () => {
  let idClienteAna;
  let descriptorAna;

  beforeAll(async () => {
    await vaciarTablas();
    idClienteAna = await insertarCliente({ nombre: 'Ana', apellido: 'López', correo: 'ana-id@prueba.com' });
    descriptorAna = descriptorDe(3);

    // Registra el rostro de Ana directamente en la base (una sola vez).
    const pool = obtenerPool();
    await pool.execute(
      "INSERT INTO rostros (id_cliente, descriptor_facial, estado) VALUES (?, ?, 'activo')",
      [idClienteAna, JSON.stringify(descriptorAna)]
    );
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('identifica al cliente cuando el descriptor es casi idéntico (distancia ≤ umbral)', async () => {
    const captura = conRuido(descriptorAna, 0.001);
    const identificado = await identificarCliente(captura);

    expect(identificado).not.toBeNull();
    expect(identificado.id_cliente).toBe(idClienteAna);
    expect(identificado.nombre).toBe('Ana');
  });

  it('devuelve null cuando el descriptor no se parece a ninguno registrado', async () => {
    const descriptorAjeno = descriptorDe(50);
    const identificado = await identificarCliente(descriptorAjeno);

    expect(identificado).toBeNull();
  });

  it('respeta un umbral más estricto inyectado', async () => {
    const captura = conRuido(descriptorAna, 0.001);
    // Umbral muy pequeño: ni la captura ruidosa pasa.
    const identificado = await identificarCliente(captura, { umbral: 0.0000001 });
    expect(identificado).toBeNull();
  });

  it('la utilidad de distancia devuelve 0 para vectores iguales', () => {
    expect(distancia(descriptorAna, descriptorAna)).toBeCloseTo(0, 10);
  });
});
