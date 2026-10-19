// components/Layout.jsx
// Shell de la zona autenticada (US-S2-10, FR-041, FR-043, FR-045): menú
// lateral izquierdo con las opciones permitidas para el rol, colapsable en
// pantallas ≤768 px, y el contenido de la ruta activa. El rol que se filtra
// aquí solo gobierna la interfaz: los permisos reales siempre los valida el
// backend (FR-045, RN-001). ES Modules (JSX).

import { useState } from 'react';
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
  { ruta: '/autorizar-ingreso', texto: 'Autorizar ingreso', roles: ['administrador', 'recepcionista'] },
  { ruta: '/perfil', texto: 'Mi perfil', roles: ['cliente'] },
];

export default function Layout() {
  const { usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  // Menú lateral plegado por defecto; en escritorio siempre visible (FR-041).
  const [menuAbierto, setMenuAbierto] = useState(false);

  const opciones = OPCIONES.filter((o) => o.roles.includes(usuario?.rol));

  function manejarCierre() {
    cerrarSesion();
    navigate('/login', { replace: true });
  }

  /** Cierra el panel en móvil tras elegir una sección. */
  function cerrarMenu() {
    setMenuAbierto(false);
  }

  return (
    <div className={`app${menuAbierto ? ' menu-abierto' : ''}`}>
      <aside className="menu-lateral" id="menu-lateral">
        <div className="marca-lateral">
          <img src="/img/gimnasio-manuerna.svg" alt="" aria-hidden="true" className="marca-icono" />
          <span className="marca">GymAccess</span>
        </div>

        <nav aria-label="Navegación principal">
          {opciones.map((o) => (
            <NavLink
              key={o.ruta}
              to={o.ruta}
              end={o.ruta === '/'}
              className={({ isActive }) => (isActive ? 'activo' : undefined)}
              onClick={cerrarMenu}
            >
              {o.texto}
            </NavLink>
          ))}
        </nav>

        <div className="sesion-lateral">
          <span className="datos-sesion">
            {usuario?.nombre}
            <small>{usuario?.rol}</small>
          </span>
          <button type="button" className="secundario" onClick={manejarCierre}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {menuAbierto && (
        <button
          type="button"
          className="capa-menu"
          aria-label="Cerrar menú"
          onClick={cerrarMenu}
        />
      )}

      <div className="zona-principal">
        <header className="barra-superior">
          <button
            type="button"
            className="alternar-menu"
            aria-label="Alternar menú"
            aria-expanded={menuAbierto}
            aria-controls="menu-lateral"
            onClick={() => setMenuAbierto((abierto) => !abierto)}
          >
            Menú
          </button>
          <span className="marca-movil">GymAccess</span>
        </header>

        <main className="contenido">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
