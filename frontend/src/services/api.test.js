// Pruebas unitarias de la gestión de sesión local del cliente API.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api, guardarSesion, obtenerSesion, cerrarSesionLocal } from './api';

describe('Gestión de sesión local', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('guarda y recupera token y usuario', () => {
    guardarSesion('token-123', { id_usuario: 1, nombre: 'Ana', rol: 'cliente' });

    const sesion = obtenerSesion();
    expect(sesion.token).toBe('token-123');
    expect(sesion.usuario.nombre).toBe('Ana');
    expect(sesion.usuario.rol).toBe('cliente');
  });

  it('devuelve null cuando no hay sesión guardada', () => {
    expect(obtenerSesion()).toBeNull();
  });

  it('cierra la sesión eliminando los datos locales', () => {
    guardarSesion('token-123', { nombre: 'Ana' });
    cerrarSesionLocal();

    expect(obtenerSesion()).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('usuario')).toBeNull();
  });

  it('devuelve null si el usuario guardado está corrupto', () => {
    localStorage.setItem('token', 'token-123');
    localStorage.setItem('usuario', '{esto no es json}');
    expect(obtenerSesion()).toBeNull();
  });

  it('tras cerrar sesión, una petición privada no envía Authorization y exige autenticación de nuevo', async () => {
    // Sesión cerrada: no queda token en localStorage.
    guardarSesion('token-123', { nombre: 'Ana' });
    cerrarSesionLocal();

    const fetchFalso = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ ok: false, message: 'no autorizado' }),
    });
    vi.stubGlobal('fetch', fetchFalso);

    try {
      const error = await api.perfil().catch((capturado) => capturado);

      // La petición privada sale SIN cabecera Authorization.
      const [ruta, opciones] = fetchFalso.mock.calls[0];
      expect(ruta).toBe('/api/auth/me');
      expect(opciones.headers.Authorization).toBeUndefined();

      // El backend responde 401 y el error se propaga: la aplicación
      // vuelve a exigir autenticación (FR-008).
      expect(error.estado).toBe(401);
      expect(error.message).toBe('no autorizado');
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
