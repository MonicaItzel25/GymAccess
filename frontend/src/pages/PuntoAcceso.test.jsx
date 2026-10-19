// pages/PuntoAcceso.test.jsx
// Prueba del kiosco del punto de acceso (US-S2-08, FR-030): cuando el rostro
// no se identifica en los tres intentos permitidos, la pantalla muestra
// «No se pudo identificar su rostro, acuda a recepción» y no autoriza ingreso.
// Se sustituye CapturaRostro (cámara y modelos) por un doble que emite el
// descriptor, para probar la lógica sin hardware ni pesos (FR-046).

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PuntoAcceso from './PuntoAcceso';

// Doble del kiosco: un botón que emite un descriptor hacia el componente.
vi.mock('../components/CapturaRostro', () => ({
  default: ({ onDescriptor, activo }) => (
    <button type="button" disabled={!activo} onClick={() => onDescriptor([0.1])}>
      Simular captura
    </button>
  ),
}));

// Doble de la API: siempre responde «rostro no identificado».
vi.mock('../services/api', () => ({
  api: {
    enviarIntentoAcceso: vi.fn().mockResolvedValue({
      resultado: 'rechazado',
      motivo: 'rostro no identificado',
      mensaje: 'Rostro no identificado',
    }),
  },
}));

describe('Kiosco del punto de acceso', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('test_muestra_mensaje_acuda_a_recepcion_cuando_el_rostro_no_se_identifica', async () => {
    render(<PuntoAcceso />);

    // Dos intentos fallidos: el contador avanza visiblemente.
    for (let intento = 1; intento <= 2; intento += 1) {
      fireEvent.click(screen.getByRole('button', { name: /simular captura/i }));
      await waitFor(() => {
        const contador = screen.getByText(/Intentos fallidos:/);
        expect(contador.textContent).toContain(`${intento} de 3`);
      });
    }

    // Tercer intento fallido: se agota y aparece la derivación a recepción.
    fireEvent.click(screen.getByRole('button', { name: /simular captura/i }));
    const alerta = await screen.findByRole('alert');
    expect(alerta.textContent).toContain(
      'No se pudo identificar su rostro, acuda a recepción'
    );
    expect(screen.getByRole('button', { name: /reiniciar/i })).toBeTruthy();

    // Nunca se presenta autorización con el rostro sin identificar (FR-030).
    expect(screen.queryByText(/acceso autorizado/i)).toBeNull();
  });
});
