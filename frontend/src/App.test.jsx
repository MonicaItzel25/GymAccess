// Pruebas de navegación de objetivos y progreso (US-S3-04): la opción de menú
// y la ruta son solo del entrenador. Los permisos reales los valida el backend.

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

const sesion = vi.hoisted(() => ({ rol: 'entrenador' }));

vi.mock('./context/AuthContext', () => ({
  useAuth: () => ({
    usuario: { id_usuario: 1, nombre: 'Persona de prueba', rol: sesion.rol },
    cargando: false,
    cerrarSesion: vi.fn(),
  }),
}));
vi.mock('./pages/Inicio', () => ({ default: () => <p>Pantalla de inicio</p> }));
vi.mock('./pages/ObjetivosProgreso', () => ({
  default: () => <p>Pantalla de seguimiento</p>,
}));

function abrir(ruta) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <App />
    </MemoryRouter>
  );
}

describe('Navegación de objetivos y progreso', () => {
  it('test_el_entrenador_ve_la_opcion_y_abre_la_pantalla', () => {
    sesion.rol = 'entrenador';
    abrir('/objetivos-progreso');

    expect(screen.getByText('Pantalla de seguimiento')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Objetivos y progreso' })).toBeTruthy();
  });

  it.each(['administrador', 'recepcionista', 'cliente'])(
    'test_el_rol_%s_no_ve_la_opcion_ni_accede_a_la_ruta',
    (rol) => {
      sesion.rol = rol;
      abrir('/objetivos-progreso');

      expect(screen.getByText('Pantalla de inicio')).toBeTruthy();
      expect(screen.queryByText('Pantalla de seguimiento')).toBeNull();
      expect(screen.queryByRole('link', { name: 'Objetivos y progreso' })).toBeNull();
    }
  );
});
