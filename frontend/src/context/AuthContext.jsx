// context/AuthContext.jsx
// Estado global de la sesión: usuario autenticado, inicio y cierre de
// sesión. El rol que se guarda aquí solo gobierna la interfaz; los permisos
// reales siempre se validan en el backend. ES Modules (JSX).

import { createContext, useContext, useEffect, useState } from 'react';
import { api, guardarSesion, cerrarSesionLocal, obtenerSesion } from '../services/api';

const ContextoAuth = createContext(null);

export function AuthProvider({ children }) {
  const sesionInicial = obtenerSesion();
  const [usuario, setUsuario] = useState(sesionInicial?.usuario || null);
  const [cargando, setCargando] = useState(Boolean(sesionInicial?.token));

  // Al montar, valida el token guardado contra el backend.
  useEffect(() => {
    if (!sesionInicial?.token) return;
    let activo = true;
    api
      .perfil()
      .then((datos) => {
        if (activo) setUsuario(datos);
      })
      .catch(() => {
        if (activo) {
          cerrarSesionLocal();
          setUsuario(null);
        }
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  async function iniciarSesion(correo, password) {
    const datos = await api.login(correo, password);
    guardarSesion(datos.token, datos.usuario);
    setUsuario(datos.usuario);
    return datos.usuario;
  }

  function cerrarSesion() {
    cerrarSesionLocal();
    setUsuario(null);
  }

  const valor = { usuario, cargando, iniciarSesion, cerrarSesion };

  return <ContextoAuth.Provider value={valor}>{children}</ContextoAuth.Provider>;
}

export function useAuth() {
  return useContext(ContextoAuth);
}
