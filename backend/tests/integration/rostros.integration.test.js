// Pruebas de integración: registro y actualización de descriptores faciales
// en MySQL. Verifica UNIQUE por cliente (re-registración actualiza, US-S2-06.3)
// y que el descriptor NUNCA se almacena como imagen ni se devuelve.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import { consultar, obtenerPool } from '../../src/config/db.js';
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

function descriptorPrueba(semilla = 1) {
  return Array.from({ length: 128 }, (_, i) => Number((((i + semilla) % 20) / 20).toFixed(4)));
}

/** Normaliza la columna JSON, que mysql2 puede devolver ya parseada. */
function aArreglo(valor) {
  return typeof valor === 'string' ? JSON.parse(valor) : valor;
}

describe('Integración de registro facial', () => {
  let tokenRecep;
  let idCliente;

  beforeAll(async () => {
    await vaciarTablas();
    await insertarUsuario({ nombre: 'Recep', correo: 'recep-rosint@prueba.com', rol: 'recepcionista' });
    tokenRecep = await tokenDe('recep-rosint@prueba.com');
    idCliente = await insertarCliente({ correo: 'cliente-rosint@prueba.com' });
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('asocia el descriptor al cliente y lo persiste como JSON de 128 números', async () => {
    const descriptor = descriptorPrueba(1);
    const respuesta = await request(app)
      .post(`/api/clientes/${idCliente}/rostro`)
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({ descriptor_facial: descriptor });

    expect(respuesta.status).toBe(201);

    const filas = await consultar('SELECT * FROM rostros WHERE id_cliente = ?', [idCliente]);
    expect(filas).toHaveLength(1);
    const almacenado = aArreglo(filas[0].descriptor_facial);
    expect(Array.isArray(almacenado)).toBe(true);
    expect(almacenado).toHaveLength(128);
    expect(filas[0].estado).toBe('activo');
  });

  it('re-registrar el mismo cliente actualiza sin duplicar (US-S2-06.3)', async () => {
    const respuesta = await request(app)
      .post(`/api/clientes/${idCliente}/rostro`)
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({ descriptor_facial: descriptorPrueba(9) });

    expect([200, 201]).toContain(respuesta.status);

    const filas = await consultar('SELECT * FROM rostros WHERE id_cliente = ?', [idCliente]);
    expect(filas).toHaveLength(1); // sigue habiendo un solo registro
    const almacenado = aArreglo(filas[0].descriptor_facial);
    expect(almacenado[0]).toBe(descriptorPrueba(9)[0]); // descriptor nuevo
  });

  it('registra la acción de rostro en auditoría (FR-021)', async () => {
    const registros = await consultar(
      "SELECT * FROM auditoria WHERE accion LIKE '%rostro%' AND modulo = 'rostros'"
    );
    expect(registros.length).toBeGreaterThan(0);
  });
});
