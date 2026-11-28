// Pruebas de navegación del dashboard (US-S3-06): la opción y la ruta son solo
// del administrador y la pantalla de inicio se conserva. Los permisos reales
// los valida el backend.

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
vi.mock('./pages/Dashboard', () => ({ default: () => <p>Pantalla del dashboard</p> }));

function abrir(ruta) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <App />
    </MemoryRouter>
  );
}

describe('Navegación del dashboard', () => {
  it('test_el_administrador_ve_la_opcion_y_abre_el_dashboard', () => {
    sesion.rol = 'administrador';
    abrir('/dashboard');

    expect(screen.getByText('Pantalla del dashboard')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeTruthy();
  });

  it('test_la_pantalla_de_inicio_se_conserva', () => {
    sesion.rol = 'administrador';
    abrir('/');

    expect(screen.getByText('Pantalla de inicio')).toBeTruthy();
    expect(screen.queryByText('Pantalla del dashboard')).toBeNull();
  });

  it.each(['recepcionista', 'entrenador', 'cliente'])(
    'test_el_rol_%s_no_ve_la_opcion_ni_accede_a_la_ruta',
    (rol) => {
      sesion.rol = rol;
      abrir('/dashboard');

      expect(screen.getByText('Pantalla de inicio')).toBeTruthy();
      expect(screen.queryByText('Pantalla del dashboard')).toBeNull();
      expect(screen.queryByRole('link', { name: 'Dashboard' })).toBeNull();
    }
  );
});
