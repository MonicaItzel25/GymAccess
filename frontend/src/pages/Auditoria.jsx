// pages/Auditoria.jsx
// Consulta de auditoría para el administrador (US-S3-09, FR-030, FR-031):
// registros con filtros y en modo solo lectura. No existe ningún control para
// crear, editar ni borrar. El backend valida el rol y los filtros.
// ES Modules (JSX).

import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';

/** Entidades que registran auditoría (contrato §9). */
const ENTITIES = {
  accesos: 'Accesos', asignaciones: 'Asignaciones', clientes: 'Clientes',
  ejercicios: 'Ejercicios', entrenadores: 'Entrenadores', membresias: 'Membresías',
  objetivos: 'Objetivos', pagos: 'Pagos', progresos: 'Progresos', rostros: 'Rostros',
  rutinas: 'Rutinas', tipos_membresia: 'Tipos de membresía', usuarios: 'Usuarios',
};

const RESULTS = { exitoso: 'Exitoso', rechazado: 'Rechazado', error: 'Error' };
const EMPTY_FILTER = { desde: '', hasta: '', modulo: '', actor: '' };

/** Solo se envían los filtros con valor. */
const activeFilters = (filter) =>
  Object.fromEntries(
    Object.entries(filter)
      .map(([name, value]) => [name, value.trim()])
      .filter(([, value]) => value)
  );

export default function Auditoria() {
  const [rows, setRows] = useState(null);
  const [filter, setFilter] = useState(EMPTY_FILTER);
  const [applied, setApplied] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (query) => {
    setApplied(query);
    setLoading(true);
    setError('');
    try {
      const data = await api.obtenerAuditoria(query);
      if (!Array.isArray(data)) throw new Error('La respuesta del servidor no es válida');
      setRows(data);
    } catch (e) {
      // Sin registros anteriores: no corresponderían a los filtros pedidos.
      setRows(null);
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
    load(activeFilters(filter));
  }

  function clear() {
    setFilter(EMPTY_FILTER);
    load({});
  }

  const change = (field, value) => setFilter((current) => ({ ...current, [field]: value }));

  return (
    <>
      <section className="tarjeta">
        <h1>Auditoría</h1>
        <form onSubmit={submit}>
          <div className="fila">
            <div className="campo">
              <label className="etiqueta" htmlFor="aud-desde">Desde</label>
              <input id="aud-desde" type="date" value={filter.desde}
                onChange={(e) => change('desde', e.target.value)} />
            </div>
            <div className="campo">
              <label className="etiqueta" htmlFor="aud-hasta">Hasta</label>
              <input id="aud-hasta" type="date" value={filter.hasta}
                onChange={(e) => change('hasta', e.target.value)} />
            </div>
            <div className="campo">
              <label className="etiqueta" htmlFor="aud-entidad">Entidad</label>
              <select id="aud-entidad" value={filter.modulo}
                onChange={(e) => change('modulo', e.target.value)}>
                <option value="">Todas</option>
                {Object.entries(ENTITIES).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label className="etiqueta" htmlFor="aud-actor">Actor (nombre o ID)</label>
              <input id="aud-actor" value={filter.actor} maxLength={100}
                onChange={(e) => change('actor', e.target.value)} />
            </div>
          </div>
          <div className="fila">
            <button type="submit" disabled={loading}>Aplicar filtros</button>
            <button type="button" onClick={clear} disabled={loading}>Limpiar filtros</button>
          </div>
        </form>
      </section>

      <section className="tarjeta">
        <h2>Registros</h2>
        {loading && <p>Cargando registros…</p>}
        {error && (
          <div className="mensaje mensaje-error" role="alert">
            <span>No se pudo consultar la auditoría: {error}</span>{' '}
            <button type="button" onClick={() => load(applied)}>Reintentar</button>
          </div>
        )}
        {!loading && rows?.length === 0 && <p>No hay registros que cumplan los filtros.</p>}
        {!loading && rows?.length > 0 && (
          <>
            <p>{`Registros mostrados: ${rows.length}`}</p>
            <div className="tabla-desplazable">
              <table className="tabla" aria-label="Registros de auditoría">
                <thead>
                  <tr>
                    <th>Fecha y hora</th>
                    <th>Actor</th>
                    <th>Acción</th>
                    <th>Entidad</th>
                    <th>Resultado</th>
                    <th>Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id_auditoria}>
                      <td className="celda-fecha">{new Date(row.fecha).toLocaleString('es-MX')}</td>
                      <td>{row.actor ?? 'Sistema'}</td>
                      <td>{row.accion.replaceAll('_', ' ')}</td>
                      <td>{ENTITIES[row.modulo] ?? row.modulo}</td>
                      <td>{RESULTS[row.resultado] ?? row.resultado}</td>
                      <td>{row.descripcion ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </>
  );
}
