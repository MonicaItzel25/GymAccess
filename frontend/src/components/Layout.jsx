// components/Layout.jsx
// Shell de la zona autenticada (US-S2-10, FR-041, FR-043, FR-045): menú
// lateral izquierdo con las opciones permitidas para el rol, colapsable en
// pantallas ≤768 px, y el contenido de la ruta activa. El rol que se filtra
// aquí solo gobierna la interfaz: los permisos reales siempre los valida el
// backend (FR-045, RN-001).
// Con el panel abierto actúa como diálogo modal: recibe el foco, lo retiene
// (Tab y Shift+Tab), se cierra con Escape y devuelve el foco al botón «Menú».
// ES Modules (JSX).

import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Opciones de menú por rol (solo interfaz; el backend valida igualmente).
const OPCIONES = [
  { ruta: '/', texto: 'Inicio', roles: ['administrador', 'recepcionista', 'entrenador', 'cliente'] },
  { ruta: '/usuarios', texto: 'Usuarios', roles: ['administrador'] },
  { ruta: '/entrenadores', texto: 'Entrenadores', roles: ['administrador'] },
  { ruta: '/asignaciones', texto: 'Asignaciones', roles: ['administrador', 'recepcionista'] },
  { ruta: '/ejercicios', texto: 'Ejercicios', roles: ['administrador', 'entrenador'] },
  { ruta: '/rutinas', texto: 'Mis rutinas', roles: ['entrenador'] },
  { ruta: '/objetivos-progreso', texto: 'Objetivos y progreso', roles: ['entrenador'] },
  { ruta: '/clientes', texto: 'Clientes', roles: ['administrador', 'recepcionista', 'entrenador'] },
  { ruta: '/membresias', texto: 'Membresías', roles: ['administrador', 'recepcionista', 'entrenador'] },
  { ruta: '/tipos-membresia', texto: 'Tipos de membresía', roles: ['administrador'] },
  { ruta: '/pagos', texto: 'Pagos', roles: ['administrador', 'recepcionista'] },
  { ruta: '/mi-rutina', texto: 'Mi rutina', roles: ['cliente'] },
  { ruta: '/mi-progreso', texto: 'Mi progreso', roles: ['cliente'] },
  { ruta: '/mis-pagos', texto: 'Mis pagos', roles: ['cliente'] },
  { ruta: '/accesos', texto: 'Accesos', roles: ['administrador', 'recepcionista', 'entrenador'] },
  { ruta: '/mis-accesos', texto: 'Mis accesos', roles: ['cliente'] },
  { ruta: '/registrar-rostro', texto: 'Registrar rostro', roles: ['administrador', 'recepcionista'] },
  { ruta: '/punto-acceso', texto: 'Punto de acceso', roles: ['administrador', 'recepcionista'] },
  { ruta: '/autorizar-ingreso', texto: 'Autorizar ingreso', roles: ['administrador', 'recepcionista'] },
  { ruta: '/perfil', texto: 'Mi perfil', roles: ['cliente'] },
];

// Mismo punto de corte que la hoja de estilos para el panel colapsable.
const CONSULTA_MOVIL = '(max-width: 768px)';
const ENFOCABLES = 'a[href], button:not([disabled])';

export default function Layout() {
  const { usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  // Menú lateral plegado por defecto; en escritorio siempre visible (FR-041).
  const [menuAbierto, setMenuAbierto] = useState(false);

  const refMenu = useRef(null);
  const refBoton = useRef(null);
  const refContenido = useRef(null);

  const opciones = OPCIONES.filter((o) => o.roles.includes(usuario?.rol));

  // Gestión del foco mientras el panel está abierto.
  useEffect(() => {
    if (!menuAbierto) return undefined;

    const menu = refMenu.current;
    const boton = refBoton.current;
    const contenido = refContenido.current;
    const consulta = window.matchMedia?.(CONSULTA_MOVIL);

    // Lo que queda detrás de la capa deja de ser enfocable e interactivo.
    contenido.setAttribute('inert', '');
    // Foco inicial: la sección actual o, si no está en el menú, la primera.
    (menu.querySelector('[aria-current="page"]') ?? menu.querySelector(ENFOCABLES))?.focus();

    function manejarTecla(evento) {
      if (evento.key === 'Escape') {
        evento.preventDefault();
        setMenuAbierto(false);
        return;
      }
      if (evento.key !== 'Tab') return;

      const controles = menu.querySelectorAll(ENFOCABLES);
      const primero = controles[0];
      const ultimo = controles[controles.length - 1];
      const fuera = !menu.contains(document.activeElement);
      const limite = evento.shiftKey ? primero : ultimo;
      if (fuera || document.activeElement === limite) {
        evento.preventDefault();
        (evento.shiftKey ? ultimo : primero).focus();
      }
    }

    // Al ensanchar la ventana el menú vuelve a ser fijo: se libera el foco.
    function manejarAncho(evento) {
      if (!evento.matches) setMenuAbierto(false);
    }

    document.addEventListener('keydown', manejarTecla);
    consulta?.addEventListener('change', manejarAncho);

    return () => {
      document.removeEventListener('keydown', manejarTecla);
      consulta?.removeEventListener('change', manejarAncho);
      contenido.removeAttribute('inert');
      // En escritorio el botón no se muestra y no se le puede devolver el foco.
      if (!consulta || consulta.matches) boton.focus();
    };
  }, [menuAbierto]);

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
      <aside
        ref={refMenu}
        className="menu-lateral"
        id="menu-lateral"
        {...(menuAbierto
          ? { role: 'dialog', 'aria-modal': true, 'aria-label': 'Menú de navegación' }
          : {})}
      >
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
          // Cierre con puntero; con teclado se usa Escape.
          tabIndex={-1}
          onClick={cerrarMenu}
        />
      )}

      <div className="zona-principal" ref={refContenido}>
        <header className="barra-superior">
          <button
            ref={refBoton}
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
