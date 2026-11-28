// Pruebas de integración: los indicadores coinciden con los registros
// existentes (US-S3-06, FR-025, FR-027, SC-006).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import { consultar } from '../../src/config/db.js';
import { cerrarPool, vaciarTablas, insertarUsuario } from '../helpers/baseDatos.js';
import { sembrarDashboard, PERIODO } from '../helpers/dashboard.js';

const app = crearApp();

async function dashboard(query = PERIODO) {
  const sesion = await request(app)
    .post('/api/auth/login')
    .send({ correo: 'administrador-dash@prueba.com', password: 'Prueba1234' });
  const r = await request(app)
    .get('/api/dashboard')
    .query(query)
    .set('Authorization', `Bearer ${sesion.body.data.token}`);
  expect(r.status).toBe(200);
  return r.body.data;
}

describe('Integración del dashboard', () => {
  let ids;
  let datos;

  beforeAll(async () => {
    ids = await sembrarDashboard();
    datos = await dashboard();
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('test_cuenta_clientes_totales_activos_por_vigencia_y_nuevos', () => {
    // Activos: los cuatro con membresía activa cuya fecha fin no ha pasado.
    expect(datos.clientes).toEqual({ totales: 6, activos: 4, nuevos: 2 });
  });

  it('test_reparte_las_membresias_en_tres_contadores_que_suman_el_total', async () => {
    expect(datos.membresias).toEqual({ vigentes: 2, porVencer: 2, vencidas: 3 });
    const [fila] = await consultar('SELECT COUNT(*) AS total FROM membresias');
    const { vigentes, porVencer, vencidas } = datos.membresias;
    expect(vigentes + porVencer + vencidas).toBe(fila.total);
  });

  it('test_suma_solo_pagos_pagados_del_periodo_con_bordes_incluidos', () => {
    expect(datos.pagos.cantidad).toBe(2);
    expect(datos.pagos.ingresos).toBe(300);
  });

  it('test_calcula_los_adeudos_con_la_regla_vigente_sin_negativos', async () => {
    // 200 (m1) + 0 (m2) + 0 (m3, pagado de más) + 500 × 3 + 100 = 1800.
    expect(datos.pagos.adeudosPendientes).toBe(1800);

    const sesion = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'administrador-dash@prueba.com', password: 'Prueba1234' });
    const r = await request(app).get('/api/adeudos').set('Authorization', `Bearer ${sesion.body.data.token}`);
    expect(datos.pagos.adeudosPendientes).toBe(r.body.data.reduce((total, fila) => total + fila.adeudo, 0));
  });

  it('test_cuenta_los_accesos_del_periodo_por_resultado', () => {
    expect(datos.accesos).toEqual({ intentos: 3, autorizados: 2, rechazados: 1 });
  });

  it('test_resume_el_entrenamiento_sin_detalle_individual', () => {
    expect(datos.entrenamiento).toEqual({
      entrenadoresActivos: 2,
      rutinasActivas: 3,
      // Activos sin rutina activa: C3, C4 y C5 (C6 está inactivo).
      clientesSinRutinaActiva: 3,
      objetivosActivos: 2,
      progresosEnPeriodo: 2,
      cargaPorEntrenador: [
        { id_entrenador: ids.principal, nombre: 'Cuenta entrenador', clientes: 2 },
        { id_entrenador: ids.segunda, nombre: 'Zoe Segunda', clientes: 0 },
      ],
    });
    expect(JSON.stringify(datos)).not.toMatch(/reservad[ao]|C1 Dash|c1-dash/i);
  });

  it('test_un_periodo_sin_datos_devuelve_ceros', async () => {
    const vacio = await dashboard({ desde: '2001-01-01', hasta: '2001-01-31' });

    expect(vacio.clientes.nuevos).toBe(0);
    expect(vacio.pagos.cantidad).toBe(0);
    expect(vacio.pagos.ingresos).toBe(0);
    expect(vacio.accesos).toEqual({ intentos: 0, autorizados: 0, rechazados: 0 });
    expect(vacio.entrenamiento.progresosEnPeriodo).toBe(0);
  });

  it('test_sin_ningun_registro_todo_es_cero', async () => {
    await vaciarTablas();
    await insertarUsuario({ nombre: 'Solo admin', correo: 'administrador-dash@prueba.com', rol: 'administrador' });

    const vacio = await dashboard();

    expect(vacio.clientes).toEqual({ totales: 0, activos: 0, nuevos: 0 });
    expect(vacio.membresias).toEqual({ vigentes: 0, porVencer: 0, vencidas: 0 });
    expect(vacio.pagos).toEqual({ cantidad: 0, ingresos: 0, adeudosPendientes: 0 });
    expect(vacio.entrenamiento.cargaPorEntrenador).toEqual([]);
    expect(vacio.entrenamiento.clientesSinRutinaActiva).toBe(0);
  });
});
