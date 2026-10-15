// pages/Login.test.jsx
// Pruebas del componente Login con el rediseño visual (US6, FR-027 a FR-033).
// Se escriben antes que la implementación para verificarlas en rojo (T028).

import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';

// Hoja de estilos leída del disco (Vitest se ejecuta con cwd en `frontend/`):
// las importaciones de CSS con `?raw` devuelven cadena vacía en este entorno
// y `import.meta.url` no usa el esquema `file:` bajo jsdom.
const estilos = readFileSync(resolve(process.cwd(), 'src/styles/estilos.css'), 'utf8');

// La pantalla solo consume el contexto de autenticación: se sustituye por un
// doble ligero para no tocar api.js ni la sesión real (FR-033).
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ iniciarSesion: vi.fn().mockResolvedValue(undefined) }),
}));

function pintar() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
}

describe('Rediseño del inicio de sesión', () => {
  it('alterna la visibilidad de la contraseña sin perder el valor (FR-029)', () => {
    pintar();
    const campo = screen.getByLabelText('Contraseña');
    fireEvent.change(campo, { target: { value: 'Secreto123' } });
    expect(campo.type).toBe('password');

    const alternar = screen.getByRole('button', { name: /mostrar contraseña/i });
    fireEvent.click(alternar);
    expect(campo.type).toBe('text');
    expect(campo.value).toBe('Secreto123');

    fireEvent.click(screen.getByRole('button', { name: /ocultar contraseña/i }));
    expect(campo.type).toBe('password');
    expect(campo.value).toBe('Secreto123');
  });

  it('incluye el panel de presentación y lo oculta a ≤768 px sin desbordamiento (FR-030)', () => {
    pintar();
    const panel = document.querySelector('.presentacion');
    expect(panel).not.toBeNull();
    expect(estilos).toContain('@media (max-width: 768px)');
    expect(estilos).toMatch(
      /@media \(max-width:\s*768px\)[\s\S]*?\.presentacion[\s\S]*?display:\s*none/
    );
    expect(estilos).toContain('overflow-x: hidden');
  });

  it('mantiene el orden de tabulación del formulario: correo, contraseña, alternar, enviar y soporte (FR-031)', () => {
    pintar();
    const formulario = document.querySelector('form');
    const focoables = [...formulario.querySelectorAll('input, button, a[href]')];

    expect(focoables.length).toBeGreaterThanOrEqual(5);
    expect(focoables[0].id).toBe('correo');
    expect(focoables[1].id).toBe('password');
    expect(focoables[2].getAttribute('aria-label')).toMatch(/contraseña/i);
    expect(focoables[focoables.length - 1].tagName).toBe('A');
  });

  it('desactiva las animaciones con prefers-reduced-motion (FR-032)', () => {
    expect(estilos).toContain('@media (prefers-reduced-motion: reduce)');
    expect(estilos).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?(transition-duration|animation[^:]*:\s*none)/
    );
  });

  it('presenta la tarjeta facial solo como demostración visual, nunca como resultado real (FR-028)', () => {
    pintar();
    const panel = document.querySelector('.presentacion');
    expect(panel).not.toBeNull();
    expect(panel.textContent).toMatch(/demostraci/i);
    expect(panel.textContent).not.toMatch(/veraci[óo]n (correcta|exitosa|completada)/i);
  });
});
