// tests/helpers/miEntrenamiento.js
// Preparación compartida de las pruebas de «Mi entrenamiento» (US-S3-05):
// dos clientes con cuenta y datos propios, un cliente sin registros y una
// cuenta sin ficha. Todo se crea por la API, como en el uso real. ES Modules.

import { expect } from 'vitest';
import request from 'supertest';
import { vaciarTablas, insertarUsuario, insertarCliente } from './baseDatos.js';

export async function prepararMiEntrenamiento(app) {
  await vaciarTablas();

  const cuentas = {};
  for (const [clave, rol] of [
    ['admin', 'administrador'],
    ['recepcion', 'recepcionista'],
    ['entrenador', 'entrenador'],
    ['ana', 'cliente'],
    ['bruno', 'cliente'],
    ['vacio', 'cliente'],
    ['sinFicha', 'cliente'],
  ]) {
    const correo = `${clave.toLowerCase()}-us6@prueba.com`;
    const id = await insertarUsuario({ nombre: `Cuenta ${clave} US6`, correo, rol });
    cuentas[clave] = { id, correo };
  }

  const clientes = {};
  for (const clave of ['ana', 'bruno', 'vacio']) {
    clientes[clave] = await insertarCliente({
      nombre: clave,
      apellido: 'US6',
      correo: cuentas[clave].correo,
    });
  }

  const tokens = {};
  for (const [clave, cuenta] of Object.entries(cuentas)) {
    const respuesta = await request(app)
      .post('/api/auth/login')
      .send({ correo: cuenta.correo, password: 'Prueba1234' });
    expect(respuesta.status, `Debe iniciar sesión la cuenta ${clave}`).toBe(200);
    tokens[clave] = respuesta.body.data.token;
  }

  async function enviar(metodo, ruta, token, cuerpo, estado = 201) {
    const respuesta = await request(app)[metodo](ruta)
      .set('Authorization', `Bearer ${token}`)
      .send(cuerpo);
    expect(respuesta.status, `${metodo.toUpperCase()} ${ruta}: ${respuesta.body.message ?? ''}`).toBe(estado);
    return respuesta.body.data;
  }

  const entrenador = await enviar('post', '/api/entrenadores', tokens.admin, {
    id_usuario: cuentas.entrenador.id,
  });
  const ejercicios = [];
  for (const nombre of ['Sentadilla US6', 'Remo US6']) {
    ejercicios.push(await enviar('post', '/api/ejercicios', tokens.admin, {
      nombre,
      descripcion: `Descripción de ${nombre}`,
      grupo_muscular: 'General',
    }));
  }

  const rutinas = {};
  async function crearRutina(cliente, nombre, activar) {
    const rutina = await enviar('post', '/api/rutinas', tokens.entrenador, {
      id_cliente: clientes[cliente],
      nombre,
      ejercicios: [
        {
          id_ejercicio: ejercicios[1].id_ejercicio,
          orden: 2,
          series: 3,
          repeticiones: 12,
          peso_recomendado: null,
          descanso_segundos: null,
          instrucciones: null,
        },
        {
          id_ejercicio: ejercicios[0].id_ejercicio,
          orden: 1,
          series: 4,
          repeticiones: 8,
          peso_recomendado: 40,
          descanso_segundos: 90,
          instrucciones: 'Espalda recta',
        },
      ],
    });
    if (activar) {
      await enviar('patch', `/api/rutinas/${rutina.id_rutina}/estado`, tokens.entrenador, { estado: 'activa' }, 200);
    }
    rutinas[nombre] = rutina.id_rutina;
  }

  for (const cliente of ['ana', 'bruno']) {
    await enviar('post', '/api/asignaciones', tokens.admin, {
      id_cliente: clientes[cliente],
      id_entrenador: entrenador.id_entrenador,
    });
  }
  await crearRutina('ana', 'Anterior de Ana', true);
  await crearRutina('ana', 'Actual de Ana', true);
  await crearRutina('ana', 'Borrador de Ana', false);
  await crearRutina('bruno', 'Actual de Bruno', true);

  for (const cliente of ['ana', 'bruno']) {
    const objetivo = await enviar('post', '/api/objetivos', tokens.entrenador, {
      id_cliente: clientes[cliente],
      meta: `Objetivo de ${cliente}`,
      unidad: 'kg',
      fecha_objetivo: '2026-12-31',
    });
    // Se registran desordenadas para comprobar el orden cronológico.
    for (const fecha of ['2026-11-20', '2026-11-05', '2026-11-12']) {
      await enviar('post', '/api/progresos', tokens.entrenador, {
        id_cliente: clientes[cliente],
        id_objetivo: objetivo.id_objetivo,
        fecha,
        valor_numerico: Number(fecha.slice(-2)),
        comentario: `Nota de ${cliente}`,
      });
    }
  }

  return { cuentas, clientes, tokens, rutinas };
}
