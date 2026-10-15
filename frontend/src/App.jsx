// App.jsx
// Configuración de rutas de la aplicación. Las rutas protegidas exigen
// sesión; cada fase añade las rutas de su historia. ES Modules (JSX).

import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Inicio from './pages/Inicio';
import Usuarios from './pages/Usuarios';
import Clientes from './pages/Clientes';
import MiPerfil from './pages/MiPerfil';
import Membresias from './pages/Membresias';
import RegistrarRostro from './pages/RegistrarRostro';
import PuntoAcceso from './pages/PuntoAcceso';
import TiposMembresia from './pages/TiposMembresia';
import Pagos from './pages/Pagos';
import MisPagos from './pages/MisPagos';
import Accesos from './pages/Accesos';
import MisAccesos from './pages/MisAccesos';

/** Envuelve las rutas que requieren sesión iniciada. */
function RutaProtegida() {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return <p className="centrado">Cargando…</p>;
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  return <Layout />;
}

/** Restringe una ruta a roles concretos de la interfaz.
 *  El backend vuelve a validar siempre (FR-005). */
function RutaRol({ roles, children }) {
  const { usuario } = useAuth();
  if (!roles.includes(usuario?.rol)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RutaProtegida />}>
        <Route path="/" element={<Inicio />} />
        <Route
          path="/usuarios"
          element={
            <RutaRol roles={['administrador']}>
              <Usuarios />
            </RutaRol>
          }
        />
        <Route
          path="/clientes"
          element={
            <RutaRol roles={['administrador', 'recepcionista', 'entrenador']}>
              <Clientes />
            </RutaRol>
          }
        />
        <Route
          path="/membresias"
          element={
            <RutaRol roles={['administrador', 'recepcionista', 'entrenador']}>
              <Membresias />
            </RutaRol>
          }
        />
        <Route
          path="/registrar-rostro"
          element={
            <RutaRol roles={['administrador', 'recepcionista']}>
              <RegistrarRostro />
            </RutaRol>
          }
        />
        <Route
          path="/punto-acceso"
          element={
            <RutaRol roles={['administrador', 'recepcionista']}>
              <PuntoAcceso />
            </RutaRol>
          }
        />
        <Route
          path="/tipos-membresia"
          element={
            <RutaRol roles={['administrador']}>
              <TiposMembresia />
            </RutaRol>
          }
        />
        <Route
          path="/pagos"
          element={
            <RutaRol roles={['administrador', 'recepcionista']}>
              <Pagos />
            </RutaRol>
          }
        />
        <Route
          path="/mis-pagos"
          element={
            <RutaRol roles={['cliente']}>
              <MisPagos />
            </RutaRol>
          }
        />
        <Route
          path="/accesos"
          element={
            <RutaRol roles={['administrador', 'recepcionista', 'entrenador']}>
              <Accesos />
            </RutaRol>
          }
        />
        <Route
          path="/mis-accesos"
          element={
            <RutaRol roles={['cliente']}>
              <MisAccesos />
            </RutaRol>
          }
        />
        <Route
          path="/perfil"
          element={
            <RutaRol roles={['cliente']}>
              <MiPerfil />
            </RutaRol>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
