// Pruebas de navegación del personal asignado (US-S3-07): la opción y la ruta
// son del administrador y del recepcionista. Los permisos reales los valida el
// backend.

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

const sesion = vi.hoisted(() => ({ rol: 'administrador' }));

vi.mock('./context/AuthContext', () => ({
  useAuth: () => ({
    usuario: { id_usuario: 1, nombre: 'Persona de prueba', rol: sesion.rol },
    cargando: false,
    cerrarSesion: vi.fn(),
  }),
}));
vi.mock('./pages/Inicio', () => ({ default: () => <p>Pantalla de inicio</p> }));
vi.mock('./pages/PersonalAsignado', () => ({ default: () => <p>Pantalla de personal</p> }));

function abrir() {
  return render(
    <MemoryRouter initialEntries={['/personal-asignado']}>
      <App />
    </MemoryRouter>
  );
}

describe('Navegación del personal asignado', () => {
  it.each(['administrador', 'recepcionista'])('test_el_rol_%s_ve_la_opcion_y_abre_la_pantalla', (rol) => {
    sesion.rol = rol;
    abrir();

    expect(screen.getByText('Pantalla de personal')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Personal asignado' })).toBeTruthy();
  });

  it.each(['entrenador', 'cliente'])('test_el_rol_%s_no_ve_la_opcion_ni_accede_a_la_ruta', (rol) => {
    sesion.rol = rol;
    abrir();

    expect(screen.getByText('Pantalla de inicio')).toBeTruthy();
    expect(screen.queryByText('Pantalla de personal')).toBeNull();
    expect(screen.queryByRole('link', { name: 'Personal asignado' })).toBeNull();
  });
});
