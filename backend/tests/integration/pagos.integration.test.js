// Pruebas de integración: registro de pagos en MySQL.
// Verifica pagos parciales sobre la misma membresía y que no exista ninguna
// ruta DELETE de pagos (FR-008, SC-005).

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

describe('Integración de registro de pagos', () => {
  let tokenRecep;
  let idCliente;
  let idMembresia;

  beforeAll(async () => {
    await vaciarTablas();
    await insertarUsuario({ nombre: 'Recep', correo: 'recep-pagoint@prueba.com', rol: 'recepcionista' });
    tokenRecep = await tokenDe('recep-pagoint@prueba.com');
    idCliente = await insertarCliente({ correo: 'cliente-pagoint@prueba.com' });

    const pool = obtenerPool();
    const [rTipo] = await pool.execute(
      "INSERT INTO tipos_membresia (nombre, descripcion, duracion, precio, estado) VALUES (?, ?, ?, ?, 'activo')",
      ['Mensual pago', '30 días', 30, 500]
    );
    const [rMem] = await pool.execute(
      "INSERT INTO membresias (id_cliente, id_tipo_membresia, fecha_inicio, fecha_fin, estado) VALUES (?, ?, ?, ?, 'activa')",
      [idCliente, rTipo.insertId, '2026-01-01', '2030-12-31']
    );
    idMembresia = rMem.insertId;
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('registra dos pagos parciales en el historial de la misma membresía', async () => {
    const primero = await request(app)
      .post('/api/pagos')
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({
        id_cliente: idCliente,
        id_membresia: idMembresia,
        monto: 300,
        metodo_pago: 'efectivo',
      });
    expect(primero.status).toBe(201);

    const segundo = await request(app)
      .post('/api/pagos')
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({
        id_cliente: idCliente,
        id_membresia: idMembresia,
        monto: 200,
        metodo_pago: 'tarjeta',
      });
    expect(segundo.status).toBe(201);

    const pagos = await consultar('SELECT * FROM pagos WHERE id_membresia = ?', [idMembresia]);
    expect(pagos).toHaveLength(2);
    const total = pagos.reduce((s, p) => s + Number(p.monto), 0);
    expect(total).toBe(500);
  });

  it('persiste el método de pago y el estado pagado', async () => {
    const filas = await consultar('SELECT * FROM pagos WHERE id_membresia = ? ORDER BY id_pago', [idMembresia]);
    expect(filas[0].metodo_pago).toBe('efectivo');
    expect(filas[0].estado).toBe('pagado');
    expect(filas[0].fecha_pago).toBeTruthy();
  });

  it('el historial de pagos se puede consultar por cliente', async () => {
    const respuesta = await request(app)
      .get(`/api/pagos?cliente=${idCliente}`)
      .set('Authorization', `Bearer ${tokenRecep}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it('no existe ninguna ruta DELETE de pagos (FR-008, SC-005)', async () => {
    const filasAntes = await consultar('SELECT COUNT(*) AS n FROM pagos');
    expect(Number(filasAntes[0].n)).toBeGreaterThan(0);

    const respuesta = await request(app)
      .delete('/api/pagos')
      .set('Authorization', `Bearer ${tokenRecep}`);
    expect([404, 405]).toContain(respuesta.status);

    const filasDespues = await consultar('SELECT COUNT(*) AS n FROM pagos');
    expect(Number(filasDespues[0].n)).toBe(Number(filasAntes[0].n));
  });
});
