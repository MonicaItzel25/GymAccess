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
import AutorizarIngreso from './pages/AutorizarIngreso';
import TiposMembresia from './pages/TiposMembresia';
import Pagos from './pages/Pagos';
import MisPagos from './pages/MisPagos';
import Accesos from './pages/Accesos';
import MisAccesos from './pages/MisAccesos';
import Entrenadores from './pages/Entrenadores';
import Asignaciones from './pages/Asignaciones';
import Ejercicios from './pages/Ejercicios';
import Rutinas from './pages/Rutinas';
import ObjetivosProgreso from './pages/ObjetivosProgreso';
import MiRutina from './pages/MiRutina';
import MiProgreso from './pages/MiProgreso';
import Dashboard from './pages/Dashboard';

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
 *  El backend vuelve a validar siempre (FR-045). */
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
        {/* Perfiles de entrenador (Sprint 3, US-S3-01): solo administrador. */}
        <Route
          path="/entrenadores"
          element={
            <RutaRol roles={['administrador']}>
              <Entrenadores />
            </RutaRol>
          }
        />
        {/* Asignaciones entrenador–cliente (Sprint 3, US-S3-02). */}
        <Route
          path="/asignaciones"
          element={
            <RutaRol roles={['administrador', 'recepcionista']}>
              <Asignaciones />
            </RutaRol>
          }
        />
        {/* Catálogo de ejercicios (Sprint 3, US-S3-08):
            administrador escribe, entrenador solo consulta (FR-012). */}
        <Route
          path="/ejercicios"
          element={
            <RutaRol roles={['administrador', 'entrenador']}>
              <Ejercicios />
            </RutaRol>
          }
        />
        {/* Rutinas de entrenamiento (Sprint 3, US-S3-03): solo entrenador. */}
        <Route
          path="/rutinas"
          element={
            <RutaRol roles={['entrenador']}>
              <Rutinas />
            </RutaRol>
          }
        />
        {/* Objetivos y progreso (Sprint 3, US-S3-04): solo entrenador. */}
        <Route
          path="/objetivos-progreso"
          element={
            <RutaRol roles={['entrenador']}>
              <ObjetivosProgreso />
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
        {/* Autorización manual en recepción (Sprint 2, US-S2-08, FR-030). */}
        <Route
          path="/autorizar-ingreso"
          element={
            <RutaRol roles={['administrador', 'recepcionista']}>
              <AutorizarIngreso />
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
        {/* Dashboard administrativo (Sprint 3, US-S3-06): solo administrador. */}
        <Route
          path="/dashboard"
          element={
            <RutaRol roles={['administrador']}>
              <Dashboard />
            </RutaRol>
          }
        />
        {/* Rutina y progreso propios (Sprint 3, US-S3-05): solo cliente. */}
        <Route
          path="/mi-rutina"
          element={
            <RutaRol roles={['cliente']}>
              <MiRutina />
            </RutaRol>
          }
        />
        <Route
          path="/mi-progreso"
          element={
            <RutaRol roles={['cliente']}>
              <MiProgreso />
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
