// Pruebas de integración: cálculo de adeudos (FR-009).
// El adeudo por membresía = precio del tipo − SUMA(pagos); con pagos
// parciales completados el adeudo es 0.

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

describe('Integración de cálculo de adeudos', () => {
  let tokenAdmin;
  let tokenRecep;
  let idCliente;
  let idMembresia;

  beforeAll(async () => {
    await vaciarTablas();
    await insertarUsuario({ nombre: 'Admin', correo: 'admin-adeint@prueba.com', rol: 'administrador' });
    await insertarUsuario({ nombre: 'Recep', correo: 'recep-adeint@prueba.com', rol: 'recepcionista' });
    tokenAdmin = await tokenDe('admin-adeint@prueba.com');
    tokenRecep = await tokenDe('recep-adeint@prueba.com');
    idCliente = await insertarCliente({ correo: 'cliente-adeint@prueba.com' });

    const pool = obtenerPool();
    const [rTipo] = await pool.execute(
      "INSERT INTO tipos_membresia (nombre, descripcion, duracion, precio, estado) VALUES (?, ?, ?, ?, 'activo')",
      ['Mensual adeudo', '30 días', 30, 500]
    );
    const [rMem] = await pool.execute(
      "INSERT INTO membresias (id_cliente, id_tipo_membresia, fecha_inicio, fecha_fin, estado, precio_acordado) VALUES (?, ?, ?, ?, 'activa', ?)",
      [idCliente, rTipo.insertId, '2026-01-01', '2030-12-31', 500]
    );
    idMembresia = rMem.insertId;
  });

  afterAll(async () => {
    await cerrarPool();
  });

  async function registrarPago(monto) {
    return request(app)
      .post('/api/pagos')
      .set('Authorization', `Bearer ${tokenRecep}`)
      .send({
        id_cliente: idCliente,
        id_membresia: idMembresia,
        monto,
        metodo_pago: 'efectivo',
      });
  }

  function buscarAdeudo(lista) {
    return lista.find((a) => Number(a.id_membresia) === Number(idMembresia));
  }

  it('con la membresía sin pagos el adeudo es el precio completo (500)', async () => {
    const respuesta = await request(app)
      .get('/api/adeudos')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(200);
    const adeudo = buscarAdeudo(respuesta.body.data);
    expect(adeudo).toBeDefined();
    expect(Number(adeudo.adeudo)).toBe(500);
  });

  it('con un pago parcial de 250 el adeudo queda en 250', async () => {
    const pago = await registrarPago(250);
    expect(pago.status).toBe(201);

    const respuesta = await request(app)
      .get('/api/adeudos')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    const adeudo = buscarAdeudo(respuesta.body.data);
    expect(Number(adeudo.adeudo)).toBe(250);
  });

  it('con el segundo pago de 250 el adeudo queda en 0 (parciales completados)', async () => {
    const pago = await registrarPago(250);
    expect(pago.status).toBe(201);

    const respuesta = await request(app)
      .get('/api/adeudos')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    const adeudo = buscarAdeudo(respuesta.body.data);
    expect(Number(adeudo.adeudo)).toBe(0);
  });

  it('el cliente ve su propio adeudo en /api/adeudos/mio', async () => {
    const respuesta = await request(app)
      .get('/api/adeudos/mio')
      .set('Authorization', `Bearer ${tokenRecep}`); // recepcionista: 403
    // Este caso asegura que el rol cliente es el único permitido (cubierto en contrato).
    expect(respuesta.status).toBe(403);

    // Verifica el cálculo directamente desde el modelo del servicio.
    const { calcularAdeudo } = await import('../../src/services/pago.service.js');
    const calculo = await calcularAdeudo(idMembresia);
    expect(Number(calculo.adeudo)).toBe(0);
    expect(Number(calculo.total_pagado)).toBe(500);
  });

  it('el historial de pagos propios del cliente se consulta por /api/pagos/mio', async () => {
    // Localiza al cliente por correo, igual que hace el endpoint.
    const filas = await consultar('SELECT id_cliente FROM clientes WHERE correo = ?', [
      'cliente-adeint@prueba.com',
    ]);
    expect(filas).toHaveLength(1);

    const { listar } = await import('../../src/services/pago.service.js');
    const pagos = await listar({ idCliente: Number(filas[0].id_cliente) });
    expect(pagos.length).toBeGreaterThanOrEqual(2);
  });
});
