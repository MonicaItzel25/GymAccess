// Pruebas de integración: mi rutina y mi progreso contra la base de pruebas
// (US-S3-05, Clarification Q5).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import { consultar } from '../../src/config/db.js';
import { cerrarPool } from '../helpers/baseDatos.js';
import { prepararMiEntrenamiento } from '../helpers/miEntrenamiento.js';

const app = crearApp();

describe('Integración de mi entrenamiento', () => {
  let datos;

  const obtener = async (recurso, clave) => {
    const respuesta = await request(app)
      .get(`/api/mi-entrenamiento/${recurso}`)
      .set('Authorization', `Bearer ${datos.tokens[clave]}`);
    expect(respuesta.status, recurso).toBe(200);
    return respuesta.body.data;
  };

  beforeAll(async () => {
    datos = await prepararMiEntrenamiento(app);
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('test_cada_cliente_ve_exactamente_su_rutina_activa', async () => {
    expect((await obtener('rutina', 'ana')).id_rutina).toBe(datos.rutinas['Actual de Ana']);
    expect((await obtener('rutina', 'bruno')).id_rutina).toBe(datos.rutinas['Actual de Bruno']);
  });

  it('test_los_ejercicios_llegan_en_el_orden_de_la_rutina', async () => {
    const rutina = await obtener('rutina', 'ana');

    expect(rutina.ejercicios.map((fila) => fila.orden)).toEqual([1, 2]);
    expect(rutina.ejercicios[1].peso_recomendado).toBeNull();
    expect(rutina.ejercicios[1].instrucciones).toBeNull();
  });

  it('test_el_historial_de_progresos_llega_ordenado_en_el_tiempo', async () => {
    const progresos = await obtener('progresos', 'ana');

    expect(progresos.map((fila) => fila.fecha)).toEqual(['2026-11-05', '2026-11-12', '2026-11-20']);
    expect(progresos.map((fila) => fila.valor_numerico)).toEqual([5, 12, 20]);
    expect(progresos.every((fila) => fila.comentario === 'Nota de ana')).toBe(true);
  });

  it('test_los_objetivos_coinciden_con_los_guardados_del_cliente', async () => {
    const objetivos = await obtener('objetivos', 'ana');

    expect(objetivos).toHaveLength(1);
    expect(objetivos[0]).toMatchObject({
      meta: 'Objetivo de ana',
      unidad: 'kg',
      fecha_objetivo: '2026-12-31',
      estado: 'activo',
    });
  });

  it('test_al_cambiar_la_rutina_activa_el_cliente_ve_la_nueva', async () => {
    await request(app)
      .patch(`/api/rutinas/${datos.rutinas['Borrador de Ana']}/estado`)
      .set('Authorization', `Bearer ${datos.tokens.entrenador}`)
      .send({ estado: 'activa' })
      .expect(200);

    expect((await obtener('rutina', 'ana')).nombre).toBe('Borrador de Ana');
  });

  it('test_consultar_no_modifica_datos_ni_agrega_auditoria', async () => {
    const contar = async () => {
      const [fila] = await consultar(
        `SELECT (SELECT COUNT(*) FROM auditoria) AS auditoria,
                (SELECT COUNT(*) FROM progresos) AS progresos,
                (SELECT COUNT(*) FROM rutinas) AS rutinas`
      );
      return fila;
    };
    const antes = await contar();
    for (const recurso of ['rutina', 'objetivos', 'progresos']) await obtener(recurso, 'ana');

    expect(await contar()).toEqual(antes);
  });
});
