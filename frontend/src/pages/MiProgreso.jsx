// pages/MiProgreso.jsx
// Objetivos e historial de progreso propios del cliente (US-S3-05, FR-023,
// FR-024). Solo consulta. Es seguimiento deportivo, nunca diagnóstico médico
// (RN-013). ES Modules (JSX).

import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';

const NOMBRE_ESTADO = { activo: 'Activo', alcanzado: 'Alcanzado', cerrado: 'Cerrado' };

const fetchGoals = () => api.obtenerMisObjetivos();
const fetchEntries = () => api.obtenerMisProgresos();

/** Carga un listado con indicador, error y reintento. */
function useList(fetcher) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });

  const reload = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: '' }));
    try {
      const data = await fetcher();
      if (!Array.isArray(data)) throw new Error('La respuesta del servidor no es válida');
      setState({ data, loading: false, error: '' });
    } catch (e) {
      setState((current) => ({ ...current, loading: false, error: e.message }));
    }
  }, [fetcher]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ...state, reload };
}

/** Indicador, error o estado vacío de un listado; si hay filas, la tabla. */
function ListContent({ list, loadingText, errorText, retryText, emptyText, children }) {
  return (
    <>
      {list.loading && <p>{loadingText}</p>}
      {list.error && (
        <div className="mensaje mensaje-error" role="alert">
          <span>{errorText}: {list.error}</span>{' '}
          <button type="button" onClick={list.reload}>{retryText}</button>
        </div>
      )}
      {list.data?.length === 0 && !list.loading && !list.error && <p>{emptyText}</p>}
      {list.data?.length > 0 && <div className="tabla-desplazable">{children}</div>}
    </>
  );
}

export default function MiProgreso() {
  const goals = useList(fetchGoals);
  const entries = useList(fetchEntries);

  const goalName = (id) =>
    goals.data?.find((goal) => goal.id_objetivo === id)?.meta ?? '—';
  const timeline = [...(entries.data ?? [])].sort(
    (a, b) => a.fecha.localeCompare(b.fecha) || a.id_progreso - b.id_progreso
  );

  return (
    <>
      <section className="tarjeta">
        <h1>Mis objetivos</h1>
        <p>Información de seguimiento deportivo; no constituye un diagnóstico médico.</p>
        <ListContent
          list={goals}
          loadingText="Cargando tus objetivos…"
          errorText="No se pudieron cargar tus objetivos"
          retryText="Reintentar carga de objetivos"
          emptyText="Aún no tienes objetivos registrados."
        >
          <table className="tabla" aria-label="Mis objetivos">
            <thead>
              <tr>
                <th>Objetivo</th>
                <th>Unidad</th>
                <th>Para el</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {(goals.data ?? []).map((goal) => (
                <tr key={goal.id_objetivo}>
                  <td>{goal.meta}</td>
                  <td>{goal.unidad ?? '—'}</td>
                  <td className="celda-fecha">{goal.fecha_objetivo}</td>
                  <td>{NOMBRE_ESTADO[goal.estado] ?? goal.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ListContent>
      </section>

      <section className="tarjeta">
        <h1>Mi evolución</h1>
        <ListContent
          list={entries}
          loadingText="Cargando tu evolución…"
          errorText="No se pudo cargar tu evolución"
          retryText="Reintentar carga de progresos"
          emptyText="Aún no tienes entradas de progreso."
        >
          <table className="tabla" aria-label="Mi evolución">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Objetivo</th>
                <th>Valor</th>
                <th>Avance</th>
                <th>Comentario</th>
              </tr>
            </thead>
            <tbody>
              {timeline.map((entry) => (
                <tr key={entry.id_progreso}>
                  <td className="celda-fecha">{entry.fecha}</td>
                  <td>{goalName(entry.id_objetivo)}</td>
                  <td>{entry.valor_numerico ?? '—'}</td>
                  <td>{entry.avance ?? '—'}</td>
                  <td>{entry.comentario ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ListContent>
      </section>
    </>
  );
}
