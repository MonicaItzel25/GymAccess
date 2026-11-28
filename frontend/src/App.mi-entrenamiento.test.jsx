// Pruebas de navegación de «Mi rutina» y «Mi progreso» (US-S3-05): las
// opciones y rutas son solo del cliente. Los permisos reales los valida el
// backend.

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

const sesion = vi.hoisted(() => ({ rol: 'cliente' }));

vi.mock('./context/AuthContext', () => ({
  useAuth: () => ({
    usuario: { id_usuario: 1, nombre: 'Persona de prueba', rol: sesion.rol },
    cargando: false,
    cerrarSesion: vi.fn(),
  }),
}));
vi.mock('./pages/Inicio', () => ({ default: () => <p>Pantalla de inicio</p> }));
vi.mock('./pages/MiRutina', () => ({ default: () => <p>Pantalla de mi rutina</p> }));
vi.mock('./pages/MiProgreso', () => ({ default: () => <p>Pantalla de mi progreso</p> }));

const PANTALLAS = [
  ['/mi-rutina', 'Mi rutina', 'Pantalla de mi rutina'],
  ['/mi-progreso', 'Mi progreso', 'Pantalla de mi progreso'],
];

function abrir(ruta) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <App />
    </MemoryRouter>
  );
}

describe('Navegación de mi entrenamiento', () => {
  it.each(PANTALLAS)('test_el_cliente_ve_la_opcion_y_abre_%s', (ruta, opcion, contenido) => {
    sesion.rol = 'cliente';
    abrir(ruta);

    expect(screen.getByText(contenido)).toBeTruthy();
    expect(screen.getByRole('link', { name: opcion })).toBeTruthy();
  });

  it.each(['administrador', 'recepcionista', 'entrenador'])(
    'test_el_rol_%s_no_ve_las_opciones_ni_accede_a_las_rutas',
    (rol) => {
      sesion.rol = rol;
      for (const [ruta, opcion, contenido] of PANTALLAS) {
        const vista = abrir(ruta);
        expect(screen.getByText('Pantalla de inicio')).toBeTruthy();
        expect(screen.queryByText(contenido)).toBeNull();
        // «Mis rutinas» es del entrenador: se compara el nombre exacto.
        expect(screen.queryByRole('link', { name: opcion })).toBeNull();
        vista.unmount();
      }
    }
  );
});
