// Integridad de la auditoría del Sprint 3 (SC-005, RN-010, T108): cada
// escritura de los módulos nuevos deja actor, acción, fecha, entidad con el
// identificador afectado y resultado, sin datos sensibles.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { crearApp } from '../../src/app.js';
import { consultar } from '../../src/config/db.js';
import { vaciarTablas, insertarUsuario, insertarCliente, cerrarPool } from '../helpers/baseDatos.js';

const app = crearApp();

describe('Integridad de la auditoría del Sprint 3', () => {
  const usuarios = {};
  const tokens = {};
  const esperadas = [];
  let registros;

  /** Ejecuta una escritura y anota el registro de auditoría que debe dejar. */
  async function escribir(rol, metodo, ruta, cuerpo, { estado, modulo, accion, resultado = 'exitoso', id }) {
    const r = await request(app)[metodo](ruta)
      .set('Authorization', `Bearer ${tokens[rol]}`)
      .send(cuerpo);
    expect(r.status, `${metodo} ${ruta}: ${r.body.message ?? ''}`).toBe(estado);
    esperadas.push({ modulo, accion, resultado, actor: usuarios[rol], id: id ?? null, datos: r.body.data });
    if (!id) esperadas.at(-1).id = r.body.data ? Object.entries(r.body.data).find(([k]) => k === `id_${ENTIDAD[modulo]}`)?.[1] : null;
    return r.body.data;
  }
  const ENTIDAD = {
    entrenadores: 'entrenador', asignaciones: 'asignacion', ejercicios: 'ejercicio',
    rutinas: 'rutina', objetivos: 'objetivo', progresos: 'progreso',
  };

  beforeAll(async () => {
    await vaciarTablas();
    for (const [rol, clave] of [['administrador', 'admin'], ['recepcionista', 'recepcion'], ['entrenador', 'entrenador']]) {
      const correo = `${clave}-t108@prueba.com`;
      usuarios[clave] = await insertarUsuario({ nombre: `Cuenta ${clave}`, correo, rol });
      const sesion = await request(app).post('/api/auth/login').send({ correo, password: 'Prueba1234' });
      tokens[clave] = sesion.body.data.token;
    }
    const idCliente = await insertarCliente({ correo: 'cliente-t108@prueba.com' });

    const perfil = await escribir('admin', 'post', '/api/entrenadores', { id_usuario: usuarios.entrenador },
      { estado: 201, modulo: 'entrenadores', accion: 'crear_entrenador' });
    const idEntrenador = perfil.id_entrenador;
    await escribir('admin', 'post', '/api/entrenadores', { id_usuario: usuarios.entrenador },
      { estado: 400, modulo: 'entrenadores', accion: 'crear_entrenador', resultado: 'rechazado', id: usuarios.entrenador });
    await escribir('admin', 'put', `/api/entrenadores/${idEntrenador}`, { especialidad: 'Fuerza' },
      { estado: 200, modulo: 'entrenadores', accion: 'modificar_entrenador', id: idEntrenador });
    await escribir('admin', 'put', `/api/entrenadores/${idEntrenador}/estado`, { estado: 'activo' },
      { estado: 200, modulo: 'entrenadores', accion: 'cambiar_estado_entrenador', id: idEntrenador });

    const asignacion = await escribir('recepcion', 'post', '/api/asignaciones',
      { id_cliente: idCliente, id_entrenador: idEntrenador },
      { estado: 201, modulo: 'asignaciones', accion: 'asignar_entrenador' });

    const ejercicio = await escribir('admin', 'post', '/api/ejercicios', { nombre: 'Press T108', descripcion: 'Pecho' },
      { estado: 201, modulo: 'ejercicios', accion: 'crear_ejercicio' });
    await escribir('admin', 'put', `/api/ejercicios/${ejercicio.id_ejercicio}`, { descripcion: 'Pecho y tríceps' },
      { estado: 200, modulo: 'ejercicios', accion: 'modificar_ejercicio', id: ejercicio.id_ejercicio });
    await escribir('admin', 'put', `/api/ejercicios/${ejercicio.id_ejercicio}/estado`, { estado: 'activo' },
      { estado: 200, modulo: 'ejercicios', accion: 'cambiar_estado_ejercicio', id: ejercicio.id_ejercicio });

    const rutina = await escribir('entrenador', 'post', '/api/rutinas', {
      id_cliente: idCliente, nombre: 'Rutina T108',
      ejercicios: [{ id_ejercicio: ejercicio.id_ejercicio, series: 3, repeticiones: 10 }],
    }, { estado: 201, modulo: 'rutinas', accion: 'crear_rutina' });
    await escribir('entrenador', 'put', `/api/rutinas/${rutina.id_rutina}`, { nombre: 'Rutina T108 b' },
      { estado: 200, modulo: 'rutinas', accion: 'modificar_rutina', id: rutina.id_rutina });
    await escribir('entrenador', 'patch', `/api/rutinas/${rutina.id_rutina}/estado`, { estado: 'activa' },
      { estado: 200, modulo: 'rutinas', accion: 'cambiar_estado_rutina', id: rutina.id_rutina });

    const objetivo = await escribir('entrenador', 'post', '/api/objetivos',
      { id_cliente: idCliente, meta: 'Meta T108', fecha_objetivo: '2026-12-31' },
      { estado: 201, modulo: 'objetivos', accion: 'crear objetivo' });
    await escribir('entrenador', 'put', `/api/objetivos/${objetivo.id_objetivo}`, { meta: 'Meta T108 b' },
      { estado: 200, modulo: 'objetivos', accion: 'modificar objetivo', id: objetivo.id_objetivo });
    await escribir('entrenador', 'post', '/api/progresos',
      { id_cliente: idCliente, id_objetivo: objetivo.id_objetivo, fecha: '2026-11-20', avance: 'Avance' },
      { estado: 201, modulo: 'progresos', accion: 'registrar progreso' });
    await escribir('entrenador', 'patch', `/api/objetivos/${objetivo.id_objetivo}/estado`, { estado: 'cerrado' },
      { estado: 200, modulo: 'objetivos', accion: 'cambiar estado objetivo', id: objetivo.id_objetivo });

    await escribir('recepcion', 'put', `/api/asignaciones/${asignacion.id_asignacion}/finalizar`, {},
      { estado: 200, modulo: 'asignaciones', accion: 'finalizar_asignacion', id: asignacion.id_asignacion });

    registros = await consultar('SELECT * FROM auditoria ORDER BY id_auditoria');
  });

  afterAll(async () => {
    await cerrarPool();
  });

  it('test_cada_escritura_deja_exactamente_un_registro', () => {
    expect(registros).toHaveLength(esperadas.length);
  });

  it('test_cada_registro_identifica_actor_accion_entidad_resultado_y_fecha', () => {
    esperadas.forEach((esperada, indice) => {
      const registro = registros[indice];
      expect(registro, esperada.accion).toMatchObject({
        id_usuario: esperada.actor,
        modulo: esperada.modulo,
        accion: esperada.accion,
        resultado: esperada.resultado,
      });
      expect(registro.fecha).toBeInstanceOf(Date);
      expect(esperada.id, `identificador de ${esperada.accion}`).toBeTruthy();
      expect(registro.descripcion, esperada.accion).toContain(`#${esperada.id}`);
    });
  });

  it('test_las_descripciones_no_contienen_datos_sensibles', () => {
    const texto = JSON.stringify(registros);
    expect(texto).not.toMatch(/Prueba1234|\$2[aby]\$|eyJ[A-Za-z0-9_-]{10,}|descriptor|password/i);
  });
});
