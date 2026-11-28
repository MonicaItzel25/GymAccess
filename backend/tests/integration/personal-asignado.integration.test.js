// Pruebas de integración: la carga coincide con las asignaciones vigentes
// reales y cambia con ellas (US-S3-07, SC-006).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import { consultar } from '../../src/config/db.js';
import { cerrarPool } from '../helpers/baseDatos.js';
import { prepararPersonal } from '../helpers/personalAsignado.js';

const app = crearApp();

describe('Integración del personal asignado', () => {
  let datos;

  async function cargas() {
    const r = await request(app)
      .get('/api/entrenadores')
      .set('Authorization', `Bearer ${datos.tokens.admin}`);
    expect(r.status).toBe(200);
    return new Map(r.body.data.map((fila) => [fila.id_entrenador, fila.carga]));
  }

  beforeAll(async () => {
    datos = await prepararPersonal(app);
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('test_la_carga_coincide_con_las_asignaciones_vigentes_guardadas', async () => {
    const actuales = await cargas();

    for (const [idEntrenador, carga] of actuales) {
      const [fila] = await consultar(
        "SELECT COUNT(*) AS total FROM asignaciones_entrenador WHERE id_entrenador = ? AND estado = 'vigente'",
        [idEntrenador]
      );
      expect(carga).toBe(fila.total);
    }
    expect(actuales.get(datos.entrenadores.conCarga)).toBe(2);
    expect(actuales.get(datos.entrenadores.soloHistorial)).toBe(0);
  });

  it('test_la_carga_disminuye_al_finalizar_una_asignacion', async () => {
    await datos.enviar('put', `/api/asignaciones/${datos.asignaciones[0]}/finalizar`, {}, 200);

    expect((await cargas()).get(datos.entrenadores.conCarga)).toBe(1);
  });

  it('test_un_entrenador_desactivado_sigue_mostrando_su_carga', async () => {
    await datos.enviar('put', `/api/entrenadores/${datos.entrenadores.conCarga}/estado`, { estado: 'inactivo' }, 200);

    expect((await cargas()).get(datos.entrenadores.conCarga)).toBe(1);
  });
});
