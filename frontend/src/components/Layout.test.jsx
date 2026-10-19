// components/Layout.test.jsx
// Prueba del shell con menú lateral del rediseño (US-S2-10, FR-041, FR-043):
// el menú solo presenta las opciones permitidas para el rol de la sesión.
// Los permisos reales siguen validándose en el backend; esto verifica la
// interfaz (FR-045, RN-001).

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Layout from './Layout';

// Sesión mutable: cada prueba fija el rol antes de pintar el shell.
const estado = vi.hoisted(() => ({
  usuario: { id_usuario: 1, nombre: 'Ana', rol: 'cliente' },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    usuario: estado.usuario,
    cargando: false,
    cerrarSesion: () => {},
  }),
}));

function pintar() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<p>contenido de la ruta</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('Shell de la zona autenticada', () => {
  it('test_menu_lateral_muestra_solo_las_opciones_del_rol', () => {
    // Cliente: solo sus secciones personales.
    estado.usuario = { id_usuario: 1, nombre: 'Ana', rol: 'cliente' };
    let vista = pintar();

    expect(screen.getByRole('link', { name: 'Mis pagos' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Mis accesos' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Mi perfil' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Usuarios' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Pagos' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Autorizar ingreso' })).toBeNull();
    vista.unmount();

    // Recepcionista: operación de recepción, sin gestión de usuarios ni catálogo.
    estado.usuario = { id_usuario: 2, nombre: 'Luis', rol: 'recepcionista' };
    vista = pintar();

    expect(screen.getByRole('link', { name: 'Autorizar ingreso' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Punto de acceso' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Pagos' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Usuarios' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Tipos de membresía' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Mi perfil' })).toBeNull();
    vista.unmount();
  });
});
