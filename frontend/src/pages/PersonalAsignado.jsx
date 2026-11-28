// pages/PersonalAsignado.jsx
// Personal asignado (US-S3-07, FR-008): cada entrenador con su carga y sus
// clientes con asignación vigente, para administrador y recepcionista. Solo
// consulta; el backend valida el rol. ES Modules (JSX).

import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';

const fetchTrainers = () => api.listarEntrenadores();
const fetchAssignments = () => api.listarAsignaciones({ vigentes: true });

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

function LoadError({ message, retryText, onRetry }) {
  return (
    <div className="mensaje mensaje-error" role="alert">
      <span>{message}</span>{' '}
      <button type="button" onClick={onRetry}>{retryText}</button>
    </div>
  );
}

export default function PersonalAsignado() {
  const trainers = useList(fetchTrainers);
  const assignments = useList(fetchAssignments);

  return (
    <>
      <section className="tarjeta">
        <h1>Personal asignado</h1>
        {trainers.loading && <p>Cargando entrenadores…</p>}
        {trainers.error && (
          <LoadError
            message={`No se pudieron cargar los entrenadores: ${trainers.error}`}
            retryText="Reintentar carga de entrenadores"
            onRetry={trainers.reload}
          />
        )}
        {assignments.error && (
          <LoadError
            message={`No se pudieron cargar las asignaciones: ${assignments.error}`}
            retryText="Reintentar carga de asignaciones"
            onRetry={assignments.reload}
          />
        )}
        {trainers.data?.length === 0 && !trainers.error && <p>No hay entrenadores registrados.</p>}
      </section>

      {(trainers.data ?? []).map((trainer) => {
        const clients = (assignments.data ?? []).filter(
          (row) => row.id_entrenador === trainer.id_entrenador
        );
        const headingId = `personal-${trainer.id_entrenador}`;
        return (
          <section className="tarjeta" key={trainer.id_entrenador} aria-labelledby={headingId}>
            <h2 id={headingId}>{trainer.nombre}</h2>
            <p>
              {`${trainer.especialidad || 'Sin especialidad'} · ${trainer.estado === 'activo' ? 'Activo' : 'Inactivo'}`}
            </p>
            <p>{`Clientes asignados: ${trainer.carga}`}</p>
            {trainer.carga === 0 && <p>Sin clientes asignados.</p>}
            {trainer.carga > 0 && assignments.loading && <p>Cargando clientes…</p>}
            {trainer.carga > 0 && clients.length > 0 && (
              <div className="tabla-desplazable">
                <table className="tabla" aria-label={`Clientes de ${trainer.nombre}`}>
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Asignado desde</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((row) => (
                      <tr key={row.id_asignacion}>
                        <td>{`${row.cliente_nombre} ${row.cliente_apellido}`}</td>
                        <td className="celda-fecha">{row.fecha_inicio}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        );
      })}
    </>
  );
}
