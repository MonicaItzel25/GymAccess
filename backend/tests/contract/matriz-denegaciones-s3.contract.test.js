// Matriz de denegaciones del Sprint 3 (contrato §10, SC-002, T110): cada
// combinación de recurso y rol se comprueba en el servidor.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import { consultar } from '../../src/config/db.js';
import { vaciarTablas, insertarUsuario, insertarCliente, cerrarPool } from '../helpers/baseDatos.js';

const app = crearApp();
const ROLES = ['recepcionista', 'entrenador', 'cliente', 'administrador'];
const INEXISTENTE = 999999;

// Orden de permisos: recepcionista, entrenador, cliente, administrador.
// «relacion»: permitido solo con asignación vigente (sin ella, 403).
const SOLO_ADMIN = [false, false, false, true];
const GESTION = [true, false, false, true];
const CON_RELACION = [false, 'relacion', false, false];

const MATRIZ = [
  ['post', '/api/entrenadores', SOLO_ADMIN],
  ['put', `/api/entrenadores/${INEXISTENTE}`, SOLO_ADMIN],
  ['put', `/api/entrenadores/${INEXISTENTE}/estado`, SOLO_ADMIN],
  ['post', '/api/asignaciones', GESTION],
  ['put', `/api/asignaciones/${INEXISTENTE}/finalizar`, GESTION],
  ['post', '/api/ejercicios', SOLO_ADMIN],
  ['put', `/api/ejercicios/${INEXISTENTE}`, SOLO_ADMIN],
  ['put', `/api/ejercicios/${INEXISTENTE}/estado`, SOLO_ADMIN],
  ['get', '/api/ejercicios', [false, true, false, true]],
  ['post', '/api/rutinas', CON_RELACION],
  ['post', '/api/objetivos', CON_RELACION],
  ['post', '/api/progresos', CON_RELACION],
  ['get', '/api/mi-entrenamiento/rutina', [false, false, true, false]],
  ['get', '/api/mi-entrenamiento/objetivos', [false, false, true, false]],
  ['get', '/api/mi-entrenamiento/progresos', [false, false, true, false]],
  ['get', '/api/dashboard', SOLO_ADMIN],
  ['get', '/api/auditoria', SOLO_ADMIN],
];

// Escrituras sobre registros existentes del módulo de entrenamiento.
const SOBRE_EXISTENTES = [
  ['put', '/api/rutinas/ID'],
  ['patch', '/api/rutinas/ID/estado'],
  ['put', '/api/objetivos/ID'],
  ['patch', '/api/objetivos/ID/estado'],
];

describe('Matriz de denegaciones del Sprint 3', () => {
  const tokens = {};
  let cuerpos;
  let idsAjenos;

  const pedir = (metodo, ruta, rol, cuerpo = {}) => {
    const peticion = request(app)[metodo](ruta);
    if (rol) peticion.set('Authorization', `Bearer ${tokens[rol]}`);
    return metodo === 'get' ? peticion : peticion.send(cuerpo);
  };

  beforeAll(async () => {
    await vaciarTablas();
    const ids = {};
    for (const rol of [...ROLES, 'otro']) {
      const correo = `${rol}-t110@prueba.com`;
      ids[rol] = await insertarUsuario({ nombre: `Cuenta ${rol}`, correo, rol: rol === 'otro' ? 'entrenador' : rol });
      const sesion = await request(app).post('/api/auth/login').send({ correo, password: 'Prueba1234' });
      tokens[rol] = sesion.body.data.token;
    }
    const idCliente = await insertarCliente({ correo: 'cliente-t110@prueba.com' });

    // El entrenador de la matriz tiene perfil pero ningún cliente asignado; el
    // «otro» es dueño de una rutina y un objetivo del cliente.
    const perfiles = {};
    for (const rol of ['entrenador', 'otro']) {
      const r = await pedir('post', '/api/entrenadores', 'administrador', { id_usuario: ids[rol] });
      perfiles[rol] = r.body.data.id_entrenador;
    }
    await pedir('post', '/api/asignaciones', 'administrador', { id_cliente: idCliente, id_entrenador: perfiles.otro });
    const ejercicio = await pedir('post', '/api/ejercicios', 'administrador', { nombre: 'Remo T110', descripcion: 'Espalda' });
    const filas = [{ id_ejercicio: ejercicio.body.data.id_ejercicio, series: 3, repeticiones: 10 }];
    const rutina = await pedir('post', '/api/rutinas', 'otro', { id_cliente: idCliente, nombre: 'Ajena', ejercicios: filas });
    const objetivo = await pedir('post', '/api/objetivos', 'otro', { id_cliente: idCliente, meta: 'Ajeno', fecha_objetivo: '2026-12-31' });
    expect([rutina.status, objetivo.status]).toEqual([201, 201]);
    idsAjenos = { rutinas: rutina.body.data.id_rutina, objetivos: objetivo.body.data.id_objetivo };
    cuerpos = {
      '/api/rutinas': { id_cliente: idCliente, nombre: 'Sin relación', ejercicios: filas },
      '/api/objetivos': { id_cliente: idCliente, meta: 'Sin relación', fecha_objetivo: '2026-12-31' },
      '/api/progresos': { id_cliente: idCliente, fecha: '2026-11-20', avance: 'Sin relación' },
    };
  });

  afterAll(async () => {
    await cerrarPool();
  });

  describe.each(MATRIZ)('%s %s', (metodo, ruta, permisos) => {
    it.each(ROLES.map((rol, i) => [rol, permisos[i]]))('test_%s: permiso %s', async (rol, permiso) => {
      const r = await pedir(metodo, ruta, rol, cuerpos[ruta]);
      if (permiso === true) {
        // Superar la autorización: puede fallar después por validación o inexistencia.
        expect([401, 403]).not.toContain(r.status);
      } else {
        expect(r.status).toBe(403);
        expect(r.body.data).toBeUndefined();
      }
    });

    it('test_sin_sesion_responde_401', async () => {
      expect((await pedir(metodo, ruta, null)).status).toBe(401);
    });
  });

  describe.each(SOBRE_EXISTENTES)('%s %s', (metodo, plantilla) => {
    it.each(ROLES)('test_%s_no_puede_modificar_registros_sin_relacion', async (rol) => {
      const recurso = plantilla.split('/')[2];
      const cuerpo = metodo === 'patch'
        ? { estado: recurso === 'rutinas' ? 'activa' : 'cerrado' }
        : recurso === 'rutinas' ? { nombre: 'Cambiada' } : { meta: 'Cambiada' };

      const r = await pedir(metodo, plantilla.replace('ID', idsAjenos[recurso]), rol, cuerpo);

      expect(r.status).toBe(403);
    });
  });

  it('test_los_rechazos_no_modificaron_los_registros', async () => {
    const [fila] = await consultar(
      `SELECT (SELECT COUNT(*) FROM rutinas WHERE nombre = 'Ajena' AND estado = 'inactiva') AS rutina,
              (SELECT COUNT(*) FROM objetivos WHERE meta = 'Ajeno' AND estado = 'activo') AS objetivo,
              (SELECT COUNT(*) FROM rutinas) AS rutinas,
              (SELECT COUNT(*) FROM progresos) AS progresos`
    );
    expect(fila).toEqual({ rutina: 1, objetivo: 1, rutinas: 1, progresos: 0 });
  });

  it('test_no_existen_operaciones_de_borrado', async () => {
    for (const recurso of ['entrenadores', 'asignaciones', 'ejercicios', 'rutinas', 'objetivos', 'progresos', 'auditoria']) {
      const r = await pedir('delete', `/api/${recurso}/1`, 'administrador');
      expect(r.status, recurso).toBe(404);
    }
  });
});
