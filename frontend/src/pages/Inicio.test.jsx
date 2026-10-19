// pages/Inicio.test.jsx
// Pruebas de la pantalla de inicio rediseñada (US-S2-10, FR-042, FR-044):
//   1. Bienvenida con el nombre del usuario y tarjetas de estadísticas con
//      datos REALES obtenidos de los endpoints propios de cada rol
//      (contracts/api-sprint2.md §3).
//   2. Con respuestas vacías de la API, las tarjetas muestran cero: nunca se
//      presentan datos ficticios como reales (constitución § Diseño visual).
// Se usa un doble de `services/api` para no depender del backend (FR-046).

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Inicio from './Inicio';

// Usuario mutable: cada prueba fija el rol antes de pintar.
const estado = vi.hoisted(() => ({
  usuario: { id_usuario: 1, nombre: 'Ana', correo: 'ana@gimnasio.mx', rol: 'administrador' },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ usuario: estado.usuario, cargando: false }),
}));

vi.mock('../services/api', () => ({
  api: {
    listarClientes: vi.fn(),
    listarAdeudos: vi.fn(),
    listarAccesos: vi.fn(),
    listarPagos: vi.fn(),
    listarMembresias: vi.fn(),
    misPagos: vi.fn(),
    misAccesos: vi.fn(),
    misAdeudos: vi.fn(),
  },
}));

import { api } from '../services/api';

/** Respuestas reales simuladas (distintas cantidades por endpoint). */
function responderConDatos() {
  api.listarClientes.mockResolvedValue([{ id_cliente: 1 }, { id_cliente: 2 }, { id_cliente: 3 }]);
  api.listarAdeudos.mockResolvedValue([{ adeudo: 400 }, { adeudo: 150 }]);
  api.listarAccesos.mockResolvedValue([{ id_acceso: 1 }, { id_acceso: 2 }]);
  api.listarPagos.mockResolvedValue([{ id_pago: 1 }]);
  api.listarMembresias.mockResolvedValue([{ id_membresia: 1 }]);
  api.misPagos.mockResolvedValue([{ id_pago: 1 }, { id_pago: 2 }]);
  api.misAccesos.mockResolvedValue([{ id_acceso: 1 }]);
  api.misAdeudos.mockResolvedValue([{ adeudo: 250 }]);
}

/** Devuelve el texto de la tarjeta cuyo título coincide con `titulo`. */
function textoDeTarjeta(titulo) {
  const encabezado = screen.getByRole('heading', { name: titulo });
  return encabezado.closest('article').textContent;
}

function pintar() {
  return render(
    <MemoryRouter>
      <Inicio />
    </MemoryRouter>
  );
}

describe('Pantalla de inicio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    responderConDatos();
  });

  it('test_muestra_bienvenida_y_tarjetas_con_datos_reales_por_rol', async () => {
    const escenarios = [
      {
        rol: 'administrador',
        tarjetas: [
          { titulo: 'Clientes', esperado: '3' },
          { titulo: 'Adeudos pendientes', esperado: '550' },
          { titulo: 'Intentos de acceso', esperado: '2' },
        ],
      },
      {
        rol: 'recepcionista',
        tarjetas: [
          { titulo: 'Clientes', esperado: '3' },
          { titulo: 'Intentos de acceso', esperado: '2' },
          { titulo: 'Pagos registrados', esperado: '1' },
        ],
      },
      {
        rol: 'entrenador',
        tarjetas: [
          { titulo: 'Membresías', esperado: '1' },
          { titulo: 'Intentos de acceso', esperado: '2' },
        ],
      },
      {
        rol: 'cliente',
        tarjetas: [
          { titulo: 'Mis pagos', esperado: '2' },
          { titulo: 'Mis accesos', esperado: '1' },
          { titulo: 'Mi adeudo', esperado: '250' },
        ],
      },
    ];

    for (const escenario of escenarios) {
      estado.usuario = { ...estado.usuario, rol: escenario.rol };
      const vista = pintar();

      // Bienvenida personalizada con el nombre real de la sesión.
      expect(screen.getByText(/Hola, Ana/)).toBeTruthy();

      for (const tarjeta of escenario.tarjetas) {
        const texto = await (async () => {
          const encabezado = await screen.findByRole('heading', { name: tarjeta.titulo });
          return encabezado.closest('article').textContent;
        })();
        expect(texto).toContain(tarjeta.esperado);
      }

      vista.unmount();
    }

    // Los datos provienen de la API: cada endpoint del rol fue consultado.
    expect(api.listarClientes).toHaveBeenCalled();
    expect(api.listarAccesos).toHaveBeenCalled();
    expect(api.misPagos).toHaveBeenCalled();
    expect(api.misAdeudos).toHaveBeenCalled();
  });

  it('test_no_presenta_datos_ficticios_como_reales', async () => {
    // La API responde sin registros: todo debe leerse como cero.
    api.listarClientes.mockResolvedValue([]);
    api.listarAdeudos.mockResolvedValue([]);
    api.listarAccesos.mockResolvedValue([]);
    api.listarPagos.mockResolvedValue([]);
    api.listarMembresias.mockResolvedValue([]);
    api.misPagos.mockResolvedValue([]);
    api.misAccesos.mockResolvedValue([]);
    api.misAdeudos.mockResolvedValue([]);
    estado.usuario = { ...estado.usuario, rol: 'administrador' };

    pintar();
    await screen.findByRole('heading', { name: 'Clientes' });

    const tarjetas = screen.getAllByRole('article');
    expect(tarjetas.length).toBeGreaterThan(0);
    for (const tarjeta of tarjetas) {
      const valor = tarjeta.querySelector('.valor');
      expect(valor).not.toBeNull();
      // Solo el cero devuelto por la API: ninguna cifra inventada (FR-042).
      expect(valor.textContent).toMatch(/^0$|^\$0\.00$/);
    }

    // Se consultó la API y se pintó lo que devolvió (cero registros).
    expect(api.listarClientes).toHaveBeenCalled();
    expect(api.listarAdeudos).toHaveBeenCalled();
  });
});
