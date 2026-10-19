// pages/Inicio.jsx
// Pantalla de inicio de la zona autenticada (US-S2-10, FR-041, FR-042, FR-044):
// bienvenida personalizada con el nombre de la sesión y tarjetas de
// estadísticas construidas SOLO con datos reales de los endpoints existentes
// de cada rol (contracts/api-sprint2.md §3, research.md R7): no se inventan
// cifras ni se usan endpoints nuevos en este sprint.
// Imagen decorativa servida desde frontend/public/img/ (asset propio local).
// ES Modules (JSX).

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const formateadorMoneda = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
});

/** Formula un importe como moneda mexicana. */
function moneda(valor) {
  return formateadorMoneda.format(Number(valor) || 0);
}

const DESCRIPCIONES = {
  administrador: 'Gestiona usuarios, roles y clientes del gimnasio.',
  recepcionista: 'Registra y consulta clientes del gimnasio.',
  entrenador: 'Consulta la información básica de los clientes.',
  cliente: 'Consulta tu información personal desde "Mi perfil".',
};

// Tarjetas por rol: endpoints existentes, sin endpoints nuevos (contrato §3).
// `suma` indica la columna monetaria a totalizar; `principalDinero` muestra el
// importe como valor principal de la tarjeta.
const TARJETAS_POR_ROL = {
  administrador: [
    { clave: 'clientes', titulo: 'Clientes', obtener: () => api.listarClientes(), nota: 'registrados' },
    { clave: 'adeudos', titulo: 'Adeudos pendientes', obtener: () => api.listarAdeudos(), suma: 'adeudo', notaTotal: true },
    { clave: 'accesos', titulo: 'Intentos de acceso', obtener: () => api.listarAccesos(), nota: 'registrados' },
  ],
  recepcionista: [
    { clave: 'clientes', titulo: 'Clientes', obtener: () => api.listarClientes(), nota: 'registrados' },
    { clave: 'accesos', titulo: 'Intentos de acceso', obtener: () => api.listarAccesos(), nota: 'registrados' },
    { clave: 'pagos', titulo: 'Pagos registrados', obtener: () => api.listarPagos(), suma: 'monto', notaTotal: true },
  ],
  entrenador: [
    { clave: 'membresias', titulo: 'Membresías', obtener: () => api.listarMembresias(), nota: 'en el historial' },
    { clave: 'accesos', titulo: 'Intentos de acceso', obtener: () => api.listarAccesos(), nota: 'registrados' },
  ],
  cliente: [
    { clave: 'misPagos', titulo: 'Mis pagos', obtener: () => api.misPagos(), suma: 'monto', notaTotal: true },
    { clave: 'misAccesos', titulo: 'Mis accesos', obtener: () => api.misAccesos(), nota: 'registrados' },
    { clave: 'misAdeudos', titulo: 'Mi adeudo', obtener: () => api.misAdeudos(), suma: 'adeudo', principalDinero: true },
  ],
};

/** Traduce la lista real devuelta por la API a la vista de una tarjeta. */
function calcularTarjeta(tarjeta, datos) {
  const filas = Array.isArray(datos) ? datos : [];
  const cantidad = filas.length;
  const total = tarjeta.suma
    ? filas.reduce((acumulado, fila) => acumulado + Number(fila?.[tarjeta.suma] || 0), 0)
    : 0;

  if (tarjeta.principalDinero) {
    return {
      clave: tarjeta.clave,
      titulo: tarjeta.titulo,
      valor: moneda(total),
      detalle:
        cantidad === 1
          ? 'membresía con adeudo'
          : `${cantidad} membresías con adeudo`,
    };
  }

  return {
    clave: tarjeta.clave,
    titulo: tarjeta.titulo,
    valor: String(cantidad),
    detalle: tarjeta.notaTotal ? `Total ${moneda(total)}` : tarjeta.nota,
  };
}

export default function Inicio() {
  const { usuario } = useAuth();
  const [tarjetas, setTarjetas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const rol = usuario?.rol;
  const esquema = TARJETAS_POR_ROL[rol] || [];

  useEffect(() => {
    let activo = true;

    if (esquema.length === 0) {
      setTarjetas([]);
      setCargando(false);
      return () => {
        activo = false;
      };
    }

    setCargando(true);
    setError('');
    Promise.all(
      esquema.map((tarjeta) =>
        tarjeta.obtener().then((datos) => calcularTarjeta(tarjeta, datos))
      )
    )
      .then((resultados) => {
        if (activo) setTarjetas(resultados);
      })
      .catch((e) => {
        // Error comprensible del servidor (FR-044); nunca cifras inventadas.
        if (activo) setError(e.message || 'No se pudieron cargar las estadísticas');
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rol]);

  return (
    <div className="pagina-inicio">
      <img
        className="decoracion-inicio"
        src="/img/gimnasio-inicio.svg"
        alt=""
        aria-hidden="true"
      />

      <section className="tarjeta">
        <h1>Hola, {usuario?.nombre}</h1>
        <p className="subtitulo">Rol: {usuario?.rol}</p>
        <p>{DESCRIPCIONES[rol] || 'Bienvenido al sistema.'}</p>
      </section>

      <section className="rejilla-estadisticas" aria-label="Estadísticas del gimnasio">
        {cargando && (
          <p className="etiqueta" role="status">
            Cargando estadísticas…
          </p>
        )}

        {!cargando && error && (
          <div className="mensaje mensaje-error" role="alert">
            {error}
          </div>
        )}

        {!cargando &&
          !error &&
          tarjetas.map((tarjeta) => (
            <article className="tarjeta estadistica" key={tarjeta.clave}>
              <h2>{tarjeta.titulo}</h2>
              <p className="valor">{tarjeta.valor}</p>
              <p className="detalle">{tarjeta.detalle}</p>
            </article>
          ))}

        {!cargando && !error && tarjetas.length === 0 && (
          <p className="etiqueta">No hay estadísticas disponibles para tu rol.</p>
        )}
      </section>
    </div>
  );
}
