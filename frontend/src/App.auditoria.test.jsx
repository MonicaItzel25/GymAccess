// Pruebas de navegación de la auditoría (US-S3-09): la opción y la ruta son
// solo del administrador. Los permisos reales los valida el backend.

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
vi.mock('./pages/Auditoria', () => ({ default: () => <p>Pantalla de auditoría</p> }));

function abrir() {
  return render(
    <MemoryRouter initialEntries={['/auditoria']}>
      <App />
    </MemoryRouter>
  );
}

describe('Navegación de la auditoría', () => {
  it('test_el_administrador_ve_la_opcion_y_abre_la_pantalla', () => {
    sesion.rol = 'administrador';
    abrir();

    expect(screen.getByText('Pantalla de auditoría')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Auditoría' })).toBeTruthy();
  });

  it.each(['recepcionista', 'entrenador', 'cliente'])(
    'test_el_rol_%s_no_ve_la_opcion_ni_accede_a_la_ruta',
    (rol) => {
      sesion.rol = rol;
      abrir();

      expect(screen.getByText('Pantalla de inicio')).toBeTruthy();
      expect(screen.queryByText('Pantalla de auditoría')).toBeNull();
      expect(screen.queryByRole('link', { name: 'Auditoría' })).toBeNull();
    }
  );
});
