// Pruebas de contrato: consulta del personal asignado (US-S3-07, FR-008).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import { cerrarPool } from '../helpers/baseDatos.js';
import { prepararPersonal } from '../helpers/personalAsignado.js';

const app = crearApp();

describe('Contrato del personal asignado', () => {
  let datos;
  const consultar = (ruta, rol) =>
    request(app).get(ruta).set('Authorization', `Bearer ${datos.tokens[rol]}`);

  beforeAll(async () => {
    datos = await prepararPersonal(app);
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it.each(['admin', 'recepcion'])('test_%s_recibe_la_carga_numerica_de_cada_entrenador', async (rol) => {
    const r = await consultar('/api/entrenadores', rol);

    expect(r.status).toBe(200);
    expect(r.body.data).toHaveLength(3);
    for (const perfil of r.body.data) {
      expect(typeof perfil.carga).toBe('number');
      expect(perfil).toHaveProperty('nombre');
      expect(perfil).toHaveProperty('estado');
    }
  });

  it('test_un_entrenador_sin_asignados_aparece_con_carga_cero', async () => {
    const r = await consultar('/api/entrenadores', 'admin');
    const perfil = r.body.data.find((fila) => fila.id_entrenador === datos.entrenadores.sinCarga);

    expect(perfil.carga).toBe(0);
  });

  it.each(['admin', 'recepcion'])('test_%s_recibe_la_lista_de_asignaciones_vigentes', async (rol) => {
    const r = await consultar('/api/asignaciones?vigentes=true', rol);

    expect(r.status).toBe(200);
    expect(r.body.data).toHaveLength(2);
    for (const fila of r.body.data) {
      expect(fila.estado).toBe('vigente');
      expect(fila.id_entrenador).toBe(datos.entrenadores.conCarga);
      expect(fila.cliente_nombre).toBeTruthy();
    }
  });

  it.each(['/api/entrenadores', '/api/asignaciones?vigentes=true'])(
    'test_el_cliente_recibe_403_en_%s',
    async (ruta) => {
      const r = await consultar(ruta, 'cliente');

      expect(r.status).toBe(403);
      expect(r.body.data).toBeUndefined();
    }
  );
});
