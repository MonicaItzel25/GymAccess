// pages/MiRutina.jsx
// Rutina activa del cliente (US-S3-05, FR-023, FR-024). Solo consulta: el
// backend resuelve la ficha por la sesión y valida el rol. ES Modules (JSX).

import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';

const conUnidad = (valor, unidad) =>
  valor === null || valor === undefined ? '—' : `${Number(valor)} ${unidad}`;

export default function MiRutina() {
  const [routine, setRoutine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.obtenerMiRutina();
      // `null` significa «sin rutina activa»; otra forma es una respuesta rota.
      if (data !== null && !Array.isArray(data?.ejercicios)) {
        throw new Error('La respuesta del servidor no es válida');
      }
      setRoutine(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="tarjeta">
      <h1>Mi rutina</h1>
      {loading && <p>Cargando tu rutina…</p>}
      {error && (
        <div className="mensaje mensaje-error" role="alert">
          <span>No se pudo cargar tu rutina: {error}</span>{' '}
          <button type="button" onClick={load}>Reintentar</button>
        </div>
      )}
      {!loading && !error && routine === null && (
        <p>Aún no tienes una rutina activa. Tu entrenador la activará cuando esté lista.</p>
      )}
      {!loading && !error && routine && (
        <>
          <h2>{routine.nombre}</h2>
          <div className="tabla-desplazable">
            <table className="tabla" aria-label="Ejercicios de mi rutina">
              <thead>
                <tr>
                  <th>Orden</th>
                  <th>Ejercicio</th>
                  <th>Grupo muscular</th>
                  <th>Series</th>
                  <th>Repeticiones</th>
                  <th>Peso recomendado</th>
                  <th>Descanso</th>
                  <th>Instrucciones</th>
                </tr>
              </thead>
              <tbody>
                {routine.ejercicios.map((exercise) => (
                  <tr key={exercise.id_rutina_ejercicio}>
                    <td>{exercise.orden}</td>
                    <td>{exercise.nombre}</td>
                    <td>{exercise.grupo_muscular || '—'}</td>
                    <td>{exercise.series}</td>
                    <td>{exercise.repeticiones}</td>
                    <td>{conUnidad(exercise.peso_recomendado, 'kg')}</td>
                    <td>{conUnidad(exercise.descanso_segundos, 's')}</td>
                    <td>{exercise.instrucciones || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
