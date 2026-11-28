// Pruebas de contrato: consulta propia de rutina y progreso (US-S3-05).
// Contrato §7: recurso de solo consulta del cliente sobre SUS datos.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import { cerrarPool } from '../helpers/baseDatos.js';
import { prepararMiEntrenamiento } from '../helpers/miEntrenamiento.js';

const app = crearApp();
const RECURSOS = ['rutina', 'objetivos', 'progresos'];

describe('Contrato de mi entrenamiento', () => {
  let datos;

  const consultar = (recurso, clave) => {
    const peticion = request(app).get(`/api/mi-entrenamiento/${recurso}`);
    return clave ? peticion.set('Authorization', `Bearer ${datos.tokens[clave]}`) : peticion;
  };

  beforeAll(async () => {
    datos = await prepararMiEntrenamiento(app);
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('test_la_rutina_propia_responde_200_con_sus_ejercicios_y_parametros', async () => {
    const respuesta = await consultar('rutina', 'ana');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.ok).toBe(true);
    expect(respuesta.body.data.nombre).toBe('Actual de Ana');
    expect(respuesta.body.data.estado).toBe('activa');
    expect(respuesta.body.data.ejercicios[0]).toMatchObject({
      orden: 1,
      nombre: 'Sentadilla US6',
      grupo_muscular: 'General',
      series: 4,
      repeticiones: 8,
      descanso_segundos: 90,
      instrucciones: 'Espalda recta',
    });
    expect(Number(respuesta.body.data.ejercicios[0].peso_recomendado)).toBe(40);
  });

  it('test_sin_rutina_activa_responde_200_con_data_nulo', async () => {
    const respuesta = await consultar('rutina', 'vacio');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({ ok: true, data: null });
  });

  it.each(['objetivos', 'progresos'])(
    'test_sin_registros_de_%s_responde_una_lista_vacia',
    async (recurso) => {
      const respuesta = await consultar(recurso, 'vacio');

      expect(respuesta.status).toBe(200);
      expect(respuesta.body).toEqual({ ok: true, data: [] });
    }
  );

  it.each(['objetivos', 'progresos'])(
    'test_los_%s_devueltos_son_solo_los_propios',
    async (recurso) => {
      const respuesta = await consultar(recurso, 'ana');

      expect(respuesta.status).toBe(200);
      expect(respuesta.body.data.length).toBeGreaterThan(0);
      for (const fila of respuesta.body.data) {
        expect(fila.id_cliente).toBe(datos.clientes.ana);
      }
    }
  );

  it.each(['admin', 'recepcion', 'entrenador'])(
    'test_el_rol_de_la_cuenta_%s_recibe_403_en_los_tres_recursos',
    async (clave) => {
      for (const recurso of RECURSOS) {
        const respuesta = await consultar(recurso, clave);
        expect(respuesta.status, recurso).toBe(403);
        expect(respuesta.body.data, recurso).toBeUndefined();
      }
    }
  );

  it('test_sin_sesion_responde_401', async () => {
    for (const recurso of RECURSOS) {
      expect((await consultar(recurso)).status, recurso).toBe(401);
    }
  });

  it('test_una_cuenta_sin_ficha_vinculada_responde_404_con_mensaje_generico', async () => {
    for (const recurso of RECURSOS) {
      const respuesta = await consultar(recurso, 'sinFicha');
      expect(respuesta.status, recurso).toBe(404);
      expect(respuesta.body.message).toBe('No existe un cliente asociado a esta cuenta');
    }
  });

  it.each(['cliente', 'id_cliente', 'id', 'ID_Cliente'])(
    'test_el_parametro_%s_se_rechaza_con_403_sin_exponer_datos',
    async (parametro) => {
      for (const recurso of RECURSOS) {
        // Se rechaza tanto con el identificador ajeno como con el propio.
        for (const valor of [datos.clientes.bruno, datos.clientes.ana, '']) {
          const respuesta = await consultar(recurso, 'ana').query({ [parametro]: valor });
          expect(respuesta.status, `${recurso} ${parametro}=${valor}`).toBe(403);
          expect(respuesta.body.data).toBeUndefined();
          expect(JSON.stringify(respuesta.body)).not.toContain('Bruno');
        }
      }
    }
  );

  it.each(['post', 'put', 'patch', 'delete'])(
    'test_no_existe_escritura_con_%s',
    async (metodo) => {
      for (const recurso of RECURSOS) {
        const respuesta = await request(app)[metodo](`/api/mi-entrenamiento/${recurso}`)
          .set('Authorization', `Bearer ${datos.tokens.ana}`)
          .send({});
        expect(respuesta.status, recurso).toBe(404);
      }
    }
  );
});
