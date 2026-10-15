// Pruebas unitarias de los validadores (sin base de datos).
// Cubren la política de contraseña, el catálogo de roles y las reglas
// de clientes definidas en data-model.md.

import { describe, it, expect } from 'vitest';
import { validationResult } from 'express-validator';
import { reglasCrearUsuario, reglasModificarUsuario } from '../../src/validators/usuario.validators.js';
import { reglasCrearCliente } from '../../src/validators/cliente.validators.js';
import { reglasLogin } from '../../src/validators/auth.validators.js';

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
