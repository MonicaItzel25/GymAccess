// pages/Dashboard.jsx
// Dashboard administrativo (US-S3-06, FR-025 a FR-029): indicadores agregados
// con datos reales, filtrables por periodo. No enlaza a información individual
// de rutinas ni de progresos (Q4) y no sustituye a la pantalla de inicio. El
// backend valida el rol y el periodo. ES Modules (JSX).

import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';

const money = (value) =>
  `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Grupos del contrato §8 con las etiquetas que ve el administrador. */
const GROUPS = [
  { key: 'clientes', title: 'Clientes', items: [
    ['totales', 'Totales'], ['activos', 'Activos'], ['nuevos', 'Nuevos en el periodo'],
  ] },
  { key: 'membresias', title: 'Membresías', items: [
    ['vigentes', 'Vigentes'], ['porVencer', 'Por vencer en 7 días'], ['vencidas', 'Vencidas o inactivas'],
  ] },
  { key: 'pagos', title: 'Pagos', items: [
    ['cantidad', 'Pagos del periodo'],
    ['ingresos', 'Ingresos del periodo', money],
    ['adeudosPendientes', 'Adeudo pendiente actual', money],
  ] },
  { key: 'accesos', title: 'Accesos del periodo', items: [
    ['intentos', 'Intentos'], ['autorizados', 'Autorizados'], ['rechazados', 'Rechazados'],
  ] },
  { key: 'entrenamiento', title: 'Entrenamiento', items: [
    ['entrenadoresActivos', 'Entrenadores activos'],
    ['rutinasActivas', 'Rutinas activas'],
    ['clientesSinRutinaActiva', 'Clientes sin rutina activa'],
    ['objetivosActivos', 'Objetivos activos'],
    ['progresosEnPeriodo', 'Registros de progreso del periodo'],
  ] },
];

const isValid = (data) =>
  Boolean(data?.periodo) &&
  GROUPS.every((group) => data[group.key]) &&
  Array.isArray(data.entrenamiento.cargaPorEntrenador);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState({ desde: '', hasta: '' });
  const [applied, setApplied] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (period) => {
    setApplied(period);
    setLoading(true);
    setError('');
    try {
      const result = await api.obtenerDashboard(period);
      if (!isValid(result)) throw new Error('La respuesta del servidor no es válida');
      setData(result);
      setFilter(result.periodo);
    } catch (e) {
      // Sin cifras anteriores: podrían confundirse con las del periodo pedido.
      setData(null);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load({});
  }, [load]);

  function submit(event) {
    event.preventDefault();
    load({ ...filter });
  }

  const change = (field, value) => setFilter((current) => ({ ...current, [field]: value }));

  return (
    <>
      <section className="tarjeta">
        <h1>Dashboard administrativo</h1>
        <form onSubmit={submit}>
          <div className="fila">
            <div className="campo">
              <label className="etiqueta" htmlFor="dash-desde">Desde</label>
              <input id="dash-desde" type="date" value={filter.desde}
                onChange={(e) => change('desde', e.target.value)} />
            </div>
            <div className="campo">
              <label className="etiqueta" htmlFor="dash-hasta">Hasta</label>
              <input id="dash-hasta" type="date" value={filter.hasta}
                onChange={(e) => change('hasta', e.target.value)} />
            </div>
          </div>
          <button type="submit" disabled={loading}>Aplicar periodo</button>
        </form>
        {loading && <p>Cargando indicadores…</p>}
        {error && (
          <div className="mensaje mensaje-error" role="alert">
            <span>No se pudieron cargar los indicadores: {error}</span>{' '}
            <button type="button" onClick={() => load(applied)}>Reintentar</button>
          </div>
        )}
        {data && !loading && (
          <>
            <p>{`Periodo mostrado: ${data.periodo.desde} a ${data.periodo.hasta}`}</p>
            <p>Las membresías, el adeudo y los estados de entrenamiento muestran la situación de hoy.</p>
          </>
        )}
      </section>

      {data && !loading && GROUPS.map((group) => (
        <section className="tarjeta" key={group.key} aria-labelledby={`dash-${group.key}`}>
          <h2 id={`dash-${group.key}`}>{group.title}</h2>
          <div className="rejilla-estadisticas">
            {group.items.map(([field, label, format]) => (
              <article className="tarjeta estadistica" key={field}>
                <h2>{label}</h2>
                <p className="valor">{format ? format(data[group.key][field]) : data[group.key][field]}</p>
              </article>
            ))}
          </div>
          {group.key === 'entrenamiento' && (
            data.entrenamiento.cargaPorEntrenador.length === 0 ? (
              <p>No hay entrenadores registrados.</p>
            ) : (
              <div className="tabla-desplazable">
                <table className="tabla" aria-label="Carga por entrenador">
                  <thead>
                    <tr>
                      <th>Entrenador</th>
                      <th>Clientes asignados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.entrenamiento.cargaPorEntrenador.map((trainer) => (
                      <tr key={trainer.id_entrenador}>
                        <td>{trainer.nombre}</td>
                        <td>{trainer.clientes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </section>
      ))}
    </>
  );
}
