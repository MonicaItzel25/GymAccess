// pages/Login.jsx
// Pantalla de inicio de sesión. ES Modules (JSX).

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
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        <button type="submit" disabled={enviando}>
          {enviando ? 'Verificando…' : 'Iniciar sesión'}
        </button>
      </form>
    </div>
  );
}
