// pages/Login.jsx
// Pantalla de inicio de sesión con el rediseño visual (US6, A12, FR-027 a
// FR-033). ES Modules (JSX).
//
// FR-033: el comportamiento de autenticación NO cambia: mismos campos e ids,
// mismas validaciones, misma llamada a `iniciarSesion`, mismo manejo de
// sesión y mismos mensajes de error que la versión previa.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [verPassword, setVerPassword] = useState(false);

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await iniciarSesion(correo.trim(), password);
      navigate('/', { replace: true });
    } catch (e) {
      setError(e.message || 'No se pudo iniciar sesión');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="pagina-login">
      {/* Panel izquierdo de presentación (FR-028). El estado facial es una
          demostración visual; nunca afirma un resultado real de verificación. */}
      <section className="presentacion" aria-label="Presentación del sistema">
        <p className="marca-gran">Gimnasio</p>
        <h2 className="titulo-principal">
          Gestiona tu gimnasio <span className="resalte">en un solo lugar</span>
        </h2>

        <div className="tarjeta-facial">
          <p className="subtitulo">Reconocimiento facial</p>
          <p>
            <strong>Acceso autorizado</strong>
          </p>
          <span className="demo-etiqueta">
            Demostración visual — no es una verificación real
          </span>
          <div className="puntos" aria-hidden="true">
            <span className="activo" />
            <span className="activo" />
            <span />
          </div>
        </div>
      </section>

      <div className="zona-formulario">
        <form className="tarjeta" onSubmit={manejarEnvio}>
          <h1>Sistema de Gestión para Gimnasio</h1>
          <p className="subtitulo">Inicia sesión para continuar</p>

          {error && <div className="mensaje mensaje-error" role="alert">{error}</div>}

          <label htmlFor="correo">Correo</label>
          <input
            id="correo"
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
            autoComplete="username"
          />

          <label htmlFor="password">Contraseña</label>
          <div className="campo-password">
            <input
              id="password"
              type={verPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="alternar-password"
              onClick={() => setVerPassword((v) => !v)}
              aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={verPassword}
            >
              {verPassword ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>

          <button type="submit" disabled={enviando}>
            {enviando ? 'Verificando…' : 'Iniciar sesión'}
          </button>

          {/* Enlace de soporte sin inventar direcciones ni URLs (FR-029). */}
          <a className="enlace-soporte" href="#ayuda">
            ¿Problemas para acceder? Pide ayuda a tu administrador
          </a>
        </form>
      </div>
    </div>
  );
}
