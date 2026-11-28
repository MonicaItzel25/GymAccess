// Pruebas unitarias de los validadores (sin base de datos).
// Cubren la política de contraseña, el catálogo de roles y las reglas
// de clientes definidas en data-model.md.

import { describe, it, expect } from 'vitest';
import { validationResult } from 'express-validator';
import { reglasCrearUsuario, reglasModificarUsuario } from '../../src/validators/usuario.validators.js';
import { reglasCrearCliente } from '../../src/validators/cliente.validators.js';
import { reglasLogin } from '../../src/validators/auth.validators.js';
import { reglasCrearRutina } from '../../src/validators/rutina.validators.js';
import { reglasCrearProgreso } from '../../src/validators/progreso.validators.js';
import { reglasPeriodo } from '../../src/validators/dashboard.validators.js';
import { reglasConsultarAuditoria } from '../../src/validators/auditoria.validators.js';

/** Ejecuta una cadena de reglas sobre un cuerpo falso y devuelve los errores. */
async function ejecutarReglas(reglas, body) {
  const req = { body };
  for (const regla of reglas) {
    await regla.run(req);
  }
  return validationResult(req).array();
}

describe('Validador de login', () => {
  it('acepta un correo válido con contraseña', async () => {
    const errores = await ejecutarReglas(reglasLogin, {
      correo: 'alguien@prueba.com',
      password: 'cualquiera',
    });
    expect(errores).toHaveLength(0);
  });

  it('rechaza un correo con formato inválido', async () => {
    const errores = await ejecutarReglas(reglasLogin, {
      correo: 'no-es-correo',
      password: 'x',
    });
    expect(errores.length).toBeGreaterThan(0);
    expect(errores[0].msg).toContain('formato');
  });

  it('rechaza el correo vacío', async () => {
    const errores = await ejecutarReglas(reglasLogin, { correo: '', password: 'x' });
    expect(errores.length).toBeGreaterThan(0);
  });
});

describe('Política de contraseña de usuarios', () => {
  async function erroresPassword(password) {
    return ejecutarReglas(reglasCrearUsuario, {
      nombre: 'Nombre Válido',
      correo: 'valido@prueba.com',
      password,
      rol: 'cliente',
    });
  }

  it('acepta una contraseña con 8 caracteres, mayúscula y número', async () => {
    expect(await erroresPassword('Abcdefg1')).toHaveLength(0);
  });

  it('rechaza una contraseña menor de 8 caracteres', async () => {
    const errores = await erroresPassword('Abc1');
    expect(errores.some((e) => e.msg.includes('8 caracteres'))).toBe(true);
  });

  it('rechaza una contraseña sin mayúscula', async () => {
    const errores = await erroresPassword('abcdefg1');
    expect(errores.some((e) => e.msg.includes('mayúscula'))).toBe(true);
  });

  it('rechaza una contraseña sin número', async () => {
    const errores = await erroresPassword('Abcdefgh');
    expect(errores.some((e) => e.msg.includes('número'))).toBe(true);
  });

  it('rechaza una contraseña vacía', async () => {
    const errores = await erroresPassword('');
    expect(errores.length).toBeGreaterThan(0);
  });
});

describe('Catálogo de roles', () => {
  it('acepta los 4 roles del ENUM', async () => {
    for (const rol of ['administrador', 'recepcionista', 'entrenador', 'cliente']) {
      const errores = await ejecutarReglas(reglasCrearUsuario, {
        nombre: 'Nombre Válido',
        correo: `rol-${rol}@prueba.com`,
        password: 'Abcdefg1',
        rol,
      });
      expect(errores, `el rol ${rol} debería ser válido`).toHaveLength(0);
    }
  });

  it('rechaza un rol fuera del catálogo', async () => {
    const errores = await ejecutarReglas(reglasCrearUsuario, {
      nombre: 'Nombre Válido',
      correo: 'rol@prueba.com',
      password: 'Abcdefg1',
      rol: 'superadmin',
    });
    expect(errores.some((e) => e.msg.includes('rol'))).toBe(true);
  });

  it('en la modificación permite campos opcionales vacíos', async () => {
    const errores = await ejecutarReglas(reglasModificarUsuario, { rol: 'entrenador' });
    expect(errores).toHaveLength(0);
  });

  it('en la modificación valida el estado del ENUM', async () => {
    const errores = await ejecutarReglas(reglasModificarUsuario, { estado: 'borrado' });
    expect(errores.some((e) => e.msg.includes('estado'))).toBe(true);
  });
});

describe('Validación de clientes', () => {
  it('acepta un cliente con nombre y apellido válidos', async () => {
    const errores = await ejecutarReglas(reglasCrearCliente, {
      nombre: 'María',
      apellido: 'López',
    });
    expect(errores).toHaveLength(0);
  });

  it('rechaza el nombre vacío', async () => {
    const errores = await ejecutarReglas(reglasCrearCliente, {
      nombre: '',
      apellido: 'López',
    });
    expect(errores.length).toBeGreaterThan(0);
  });

  it('rechaza un apellido de un solo carácter', async () => {
    const errores = await ejecutarReglas(reglasCrearCliente, {
      nombre: 'María',
      apellido: 'L',
    });
    expect(errores.some((e) => e.msg.includes('apellido'))).toBe(true);
  });

  it('permite el cliente sin correo (campo opcional)', async () => {
    const errores = await ejecutarReglas(reglasCrearCliente, {
      nombre: 'María',
      apellido: 'López',
      correo: null,
    });
    expect(errores).toHaveLength(0);
  });

  it('rechaza un correo con formato inválido cuando se envía', async () => {
    const errores = await ejecutarReglas(reglasCrearCliente, {
      nombre: 'María',
      apellido: 'López',
      correo: 'esto-no-es@correo',
    });
    expect(errores.length).toBeGreaterThan(0);
  });

  it('rechaza un teléfono con caracteres no permitidos', async () => {
    const errores = await ejecutarReglas(reglasCrearCliente, {
      nombre: 'María',
      apellido: 'López',
      telefono: 'abc-#!',
    });
    expect(errores.some((e) => e.msg.includes('teléfono'))).toBe(true);
  });
});

/** Ejecuta las reglas sobre parámetros de consulta falsos. */
async function erroresDeConsulta(reglas, query) {
  const req = { query, body: {}, params: {} };
  for (const regla of reglas) {
    await regla.run(req);
  }
  return validationResult(req).array();
}

describe('Validación de rutinas (Sprint 3)', () => {
  const rutina = (fila = {}) => ({
    id_cliente: 1,
    nombre: 'Rutina',
    ejercicios: [{ id_ejercicio: 1, series: 3, repeticiones: 10, ...fila }],
  });

  it.each([
    ['series', 1], ['series', 999], ['repeticiones', 1], ['repeticiones', 999],
    ['peso_recomendado', 0], ['peso_recomendado', 999.99], ['peso_recomendado', null],
    ['descanso_segundos', 0], ['descanso_segundos', 3600],
  ])('test_acepta_%s_igual_a_%s', async (campo, valor) => {
    expect(await ejecutarReglas(reglasCrearRutina, rutina({ [campo]: valor }))).toHaveLength(0);
  });

  it.each([
    ['series', 0], ['series', 1000], ['repeticiones', 0], ['repeticiones', 1000],
    ['peso_recomendado', -1], ['peso_recomendado', 1000], ['descanso_segundos', -1],
    ['descanso_segundos', 3601], ['id_ejercicio', 0], ['instrucciones', ''], ['orden', 0],
  ])('test_rechaza_%s_igual_a_%s', async (campo, valor) => {
    const errores = await ejecutarReglas(reglasCrearRutina, rutina({ [campo]: valor }));
    expect(errores.length).toBeGreaterThan(0);
  });

  it('test_exige_al_menos_un_ejercicio', async () => {
    const errores = await ejecutarReglas(reglasCrearRutina, { ...rutina(), ejercicios: [] });
    expect(errores[0].msg).toBe('La rutina debe incluir al menos un ejercicio');
  });
});

describe('Validación de progresos (Sprint 3)', () => {
  const progreso = (campos) => ({ id_cliente: 1, fecha: '2026-11-20', ...campos });

  it.each([
    ['un_valor_en_cero', { valor_numerico: 0 }],
    ['solo_un_avance', { avance: 'Mejora' }],
  ])('test_acepta_%s', async (_caso, campos) => {
    expect(await ejecutarReglas(reglasCrearProgreso, progreso(campos))).toHaveLength(0);
  });

  it.each([
    ['sin_valor_ni_avance', {}],
    ['con_avance_en_blanco', { avance: '   ' }],
  ])('test_rechaza_una_entrada_%s', async (_caso, campos) => {
    const errores = await ejecutarReglas(reglasCrearProgreso, progreso(campos));
    expect(errores.some((e) => e.msg === 'Indica un valor o un avance medido')).toBe(true);
  });
});

describe('Filtros de periodo y de auditoría (Sprint 3)', () => {
  it.each([
    ['dashboard', reglasPeriodo],
    ['auditoría', reglasConsultarAuditoria],
  ])('test_%s_acepta_un_periodo_valido_y_la_ausencia_de_filtros', async (_nombre, reglas) => {
    expect(await erroresDeConsulta(reglas, {})).toHaveLength(0);
    expect(await erroresDeConsulta(reglas, { desde: '2026-11-01', hasta: '2026-11-01' })).toHaveLength(0);
  });

  it.each([
    ['dashboard', reglasPeriodo],
    ['auditoría', reglasConsultarAuditoria],
  ])('test_%s_rechaza_fechas_inexistentes', async (_nombre, reglas) => {
    const errores = await erroresDeConsulta(reglas, { desde: '2026-02-30' });
    expect(errores[0].msg).toBe('El periodo de fechas es inválido');
  });

  it('test_la_auditoria_rechaza_un_periodo_invertido_y_admite_fecha_con_hora', async () => {
    const invertido = await erroresDeConsulta(reglasConsultarAuditoria, {
      desde: '2026-11-02', hasta: '2026-11-01',
    });
    expect(invertido[0].msg).toBe('El periodo de fechas es inválido');
    expect(await erroresDeConsulta(reglasConsultarAuditoria, {
      desde: '2026-11-01 08:00', hasta: '2026-11-01T09:30:00',
    })).toHaveLength(0);
    expect(await erroresDeConsulta(reglasConsultarAuditoria, { desde: '2026-11-01 25:00' }))
      .toHaveLength(1);
  });
});
