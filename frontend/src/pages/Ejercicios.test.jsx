// pages/Ejercicios.test.jsx
// Pruebas de la pantalla del catálogo de ejercicios (US-S3-08):
//   1. El administrador ve el listado completo (CRUD).
//   2. El administrador da de alta un ejercicio desde el formulario.
//   3. El entrenador recibe una vista de SOLO LECTURA sin controles de
//      escritura (FR-012, Clarification Q2).
//   4. El mensaje de error del backend es visible (nombre duplicado).
//   5. Estado vacío comprensible.
// Se usa un doble de `services/api` para no depender del backend (FR-046).

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Ejercicios from './Ejercicios';

// Sesión mutable: cada prueba fija el rol antes de pintar la pantalla.
const estado = vi.hoisted(() => ({
  usuario: { id_usuario: 1, nombre: 'Elsa Admin', correo: 'elsa@gimnasio.mx', rol: 'administrador' },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ usuario: estado.usuario, cargando: false }),
}));

vi.mock('../services/api', () => ({
  api: {
    listarEjercicios: vi.fn(),
    crearEjercicio: vi.fn(),
    actualizarEjercicio: vi.fn(),
    cambiarEstadoEjercicio: vi.fn(),
  },
}));

import { api } from '../services/api';

function pintar() {
  return render(
    <MemoryRouter>
      <Ejercicios />
    </MemoryRouter>
  );
}

describe('Pantalla del catálogo de ejercicios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    estado.usuario = { id_usuario: 1, nombre: 'Elsa Admin', correo: 'elsa@gimnasio.mx', rol: 'administrador' };
  });

  it('test_admin_ve_listado_completo_con_nombre_descripcion_grupo_y_estado', async () => {
    api.listarEjercicios.mockResolvedValue([
      {
        id_ejercicio: 1,
        nombre: 'Press de banca',
        descripcion: 'Empuje horizontal con barra',
        grupo_muscular: 'Pecho',
        estado: 'activo',
      },
    ]);

    pintar();

    expect(await screen.findByText('Press de banca')).toBeTruthy();
    expect(screen.getByText('Empuje horizontal con barra')).toBeTruthy();
    expect(screen.getByText('Pecho')).toBeTruthy();
    expect(api.listarEjercicios).toHaveBeenCalled();
  });

  it('test_admin_da_de_alta_un_ejercicio_desde_el_formulario', async () => {
    api.listarEjercicios.mockResolvedValue([]);
    api.crearEjercicio.mockResolvedValue({
      id_ejercicio: 2,
      nombre: 'Press inclinado',
      descripcion: 'Empuje con barra en banco inclinado',
      grupo_muscular: null,
      estado: 'activo',
    });

    pintar();

    fireEvent.change(await screen.findByLabelText(/nombre/i), { target: { value: 'Press inclinado' } });
    fireEvent.change(screen.getByLabelText(/descripción/i), { target: { value: 'Empuje con barra en banco inclinado' } });
    fireEvent.click(screen.getByRole('button', { name: /registrar/i }));

    expect(await screen.findByRole('status')).toBeTruthy();
    expect(api.crearEjercicio).toHaveBeenCalledWith({
      nombre: 'Press inclinado',
      descripcion: 'Empuje con barra en banco inclinado',
      grupo_muscular: null,
    });
  });

  it('test_entrenador_recibe_solo_lectura_sin_controles_de_escritura', async () => {
    estado.usuario = { id_usuario: 2, nombre: 'Hugo Entrenador', correo: 'hugo@gimnasio.mx', rol: 'entrenador' };
    api.listarEjercicios.mockResolvedValue([
      {
        id_ejercicio: 1,
        nombre: 'Sentadilla',
        descripcion: 'Empuje inferior con barra',
        grupo_muscular: 'Pierna',
        estado: 'activo',
      },
    ]);

    pintar();

    expect(await screen.findByText('Sentadilla')).toBeTruthy();
    // Sin formulario de alta, sin edición y sin activar/desactivar.
    expect(screen.queryByRole('button', { name: /registrar/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /editar/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /desactivar/i })).toBeNull();
    expect(api.crearEjercicio).not.toHaveBeenCalled();
  });

  it('test_muestra_el_mensaje_de_error_cuando_el_backend_rechaza_el_alta', async () => {
    api.listarEjercicios.mockResolvedValue([]);
    api.crearEjercicio.mockRejectedValue(
      new Error('Ya existe un ejercicio con ese nombre')
    );

    pintar();

    fireEvent.change(await screen.findByLabelText(/nombre/i), { target: { value: 'Press de banca' } });
    fireEvent.change(screen.getByLabelText(/descripción/i), { target: { value: 'Duplicado' } });
    fireEvent.click(screen.getByRole('button', { name: /registrar/i }));

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('Ya existe un ejercicio con ese nombre');
  });

  it('test_muestra_estado_vacio_cuando_el_catalogo_no_tiene_ejercicios', async () => {
    api.listarEjercicios.mockResolvedValue([]);

    pintar();

    expect(await screen.findByText(/No hay ejercicios en el catálogo/)).toBeTruthy();
  });
});
