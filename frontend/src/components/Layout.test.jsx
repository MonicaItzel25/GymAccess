// components/Layout.test.jsx
// Prueba del shell con menú lateral del rediseño (US-S2-10, FR-041, FR-043):
// el menú solo presenta las opciones permitidas para el rol de la sesión.
// Los permisos reales siguen validándose en el backend; esto verifica la
// interfaz (FR-045, RN-001).

import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
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
          <Route path="/mis-pagos" element={<p>contenido de pagos</p>} />
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

// jsdom no desplaza el foco con Tab: estas pruebas verifican lo que decide el
// componente (extremos del ciclo, atributos y devolución del foco).
describe('Menú móvil abierto: accesibilidad', () => {
  const boton = () => screen.getByRole('button', { name: 'Alternar menú' });
  const enlace = (nombre) => screen.getByRole('link', { name: nombre });
  const salir = () => screen.getByRole('button', { name: 'Cerrar sesión' });
  const zonaPrincipal = () => document.querySelector('.zona-principal');
  /** Devuelve false si el componente interceptó la tecla. */
  const pulsar = (key, shiftKey = false) =>
    fireEvent.keyDown(document.activeElement, { key, shiftKey });

  function abrir() {
    estado.usuario = { id_usuario: 1, nombre: 'Ana', rol: 'cliente' };
    const vista = pintar();
    fireEvent.click(boton());
    return vista;
  }

  afterEach(() => {
    delete window.matchMedia;
  });

  it('test_al_abrir_mueve_el_foco_a_la_seccion_actual_y_aisla_el_resto', () => {
    abrir();

    expect(document.activeElement).toBe(enlace('Inicio'));
    expect(boton().getAttribute('aria-expanded')).toBe('true');
    const dialogo = screen.getByRole('dialog', { name: 'Menú de navegación' });
    expect(dialogo.id).toBe('menu-lateral');
    expect(dialogo.getAttribute('aria-modal')).toBe('true');
    expect(zonaPrincipal().hasAttribute('inert')).toBe(true);
    expect(screen.getByRole('button', { name: 'Cerrar menú' }).tabIndex).toBe(-1);
  });

  it('test_escape_cierra_y_devuelve_el_foco_al_boton', () => {
    abrir();
    pulsar('Escape');

    expect(boton().getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Cerrar menú' })).toBeNull();
    expect(zonaPrincipal().hasAttribute('inert')).toBe(false);
    expect(document.activeElement).toBe(boton());
  });

  it('test_tab_y_shift_tab_recorren_el_menu_en_ciclo', () => {
    abrir();

    salir().focus();
    expect(pulsar('Tab')).toBe(false);
    expect(document.activeElement).toBe(enlace('Inicio'));

    expect(pulsar('Tab', true)).toBe(false);
    expect(document.activeElement).toBe(salir());

    // Entre los extremos decide el navegador.
    enlace('Mis pagos').focus();
    expect(pulsar('Tab')).toBe(true);
    expect(pulsar('Tab', true)).toBe(true);
  });

  it('test_si_el_foco_sale_del_menu_tab_lo_devuelve_dentro', () => {
    abrir();

    document.activeElement.blur();
    pulsar('Tab');
    expect(document.activeElement).toBe(enlace('Inicio'));

    document.activeElement.blur();
    pulsar('Tab', true);
    expect(document.activeElement).toBe(salir());
  });

  it('test_cerrar_con_la_capa_devuelve_el_foco_al_boton', () => {
    abrir();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar menú' }));

    expect(boton().getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(boton());
  });

  it('test_elegir_una_seccion_cierra_navega_y_devuelve_el_foco', () => {
    abrir();
    fireEvent.click(enlace('Mis pagos'));

    expect(screen.getByText('contenido de pagos')).toBeTruthy();
    expect(boton().getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(boton());

    // Al reabrir, el foco va a la nueva sección actual.
    fireEvent.click(boton());
    expect(document.activeElement).toBe(enlace('Mis pagos'));
  });

  it('test_con_el_menu_cerrado_no_intercepta_el_teclado', () => {
    estado.usuario = { id_usuario: 1, nombre: 'Ana', rol: 'cliente' };
    pintar();
    boton().focus();

    expect(pulsar('Tab')).toBe(true);
    expect(pulsar('Escape')).toBe(true);
    expect(document.activeElement).toBe(boton());

    // Tampoco quedan escuchas activas después de abrir y cerrar.
    fireEvent.click(boton());
    pulsar('Escape');
    expect(pulsar('Tab')).toBe(true);
  });

  it('test_al_pasar_a_escritorio_cierra_sin_llevar_el_foco_al_boton', () => {
    let alCambiar;
    const consulta = {
      matches: true,
      addEventListener: (_tipo, funcion) => {
        alCambiar = funcion;
      },
      removeEventListener: vi.fn(),
    };
    window.matchMedia = () => consulta;
    abrir();

    act(() => {
      consulta.matches = false;
      alCambiar({ matches: false });
    });

    expect(boton().getAttribute('aria-expanded')).toBe('false');
    expect(zonaPrincipal().hasAttribute('inert')).toBe(false);
    expect(document.activeElement).not.toBe(boton());
    expect(consulta.removeEventListener).toHaveBeenCalled();
  });
});
