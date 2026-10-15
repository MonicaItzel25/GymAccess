// components/Layout.jsx
// Distribución general de la aplicación: barra de navegación con las
// opciones permitidas para el rol y contenido de la ruta. ES Modules (JSX).

import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Opciones de menú por rol (solo interfaz; el backend valida igualmente).
const OPCIONES = [
  { ruta: '/', texto: 'Inicio', roles: ['administrador', 'recepcionista', 'entrenador', 'cliente'] },
  { ruta: '/usuarios', texto: 'Usuarios', roles: ['administrador'] },
  { ruta: '/clientes', texto: 'Clientes', roles: ['administrador', 'recepcionista', 'entrenador'] },
  { ruta: '/membresias', texto: 'Membresías', roles: ['administrador', 'recepcionista', 'entrenador'] },
  { ruta: '/tipos-membresia', texto: 'Tipos de membresía', roles: ['administrador'] },
  { ruta: '/pagos', texto: 'Pagos', roles: ['administrador', 'recepcionista'] },
  { ruta: '/mis-pagos', texto: 'Mis pagos', roles: ['cliente'] },
  { ruta: '/accesos', texto: 'Accesos', roles: ['administrador', 'recepcionista', 'entrenador'] },
  { ruta: '/mis-accesos', texto: 'Mis accesos', roles: ['cliente'] },
  { ruta: '/registrar-rostro', texto: 'Registrar rostro', roles: ['administrador', 'recepcionista'] },
  { ruta: '/punto-acceso', texto: 'Punto de acceso', roles: ['administrador', 'recepcionista'] },
  { ruta: '/perfil', texto: 'Mi perfil', roles: ['cliente'] },
];

export default function Layout() {
  const { usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  const opciones = OPCIONES.filter((o) => o.roles.includes(usuario?.rol));

  function manejarCierre() {
    cerrarSesion();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app">
      <header className="barra">
        <span className="marca">Gimnasio</span>
        <nav>
          {opciones.map((o) => (
            <NavLink key={o.ruta} to={o.ruta} end={o.ruta === '/'}>
              {o.texto}
            </NavLink>
          ))}
        </nav>
        <div className="sesion">
          <span>{usuario?.nombre} ({usuario?.rol})</span>
          <button type="button" onClick={manejarCierre}>Cerrar sesión</button>
        </div>
      </header>
      <main className="contenido">
        <Outlet />
      </main>
    </div>
  );
}
