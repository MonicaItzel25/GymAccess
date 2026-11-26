// pages/Rutinas.jsx
// Rutinas de entrenamiento del entrenador (US-S3-03, Sprint 3).
// El entrenador crea, modifica y activa/desactiva rutinas SOLO para clientes
// con asignación vigente (FR-014, Q1/FR-017): el backend valida la vigencia
// (FR-032) y la lista de clientes proviene de SUS asignaciones. Una única
// rutina activa por cliente (Q5); las versiones antiguas se conservan como
// historial sin borrado físico (FR-015, FR-017). ES Modules (JSX).

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const FILA_INICIAL = {
  id_ejercicio: '',
  series: 4,
  repeticiones: 8,
  peso_recomendado: '',
  descanso_segundos: '',
  instrucciones: '',
};

export default function Rutinas() {
  // eslint-disable-next-line no-unused-vars
  const { usuario } = useAuth();

  const [rutinas, setRutinas] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [ejercicios, setEjercicios] = useState([]);
  const [idCliente, setIdCliente] = useState('');
  const [nombre, setNombre] = useState('');
  const [filas, setFilas] = useState([{ ...FILA_INICIAL }]);
  const [editando, setEditando] = useState(null); // id de la rutina en edición
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  async function cargar() {
    try {
      setRutinas(await api.listarRutinas());
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    cargar();
    api.listarAsignaciones().then(setAsignaciones).catch(() => setAsignaciones([]));
    api.listarEjercicios().then(setEjercicios).catch(() => setEjercicios([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function cambiarFila(indice, campo, valor) {
    setFilas((actuales) =>
      actuales.map((fila, i) => (i === indice ? { ...fila, [campo]: valor } : fila))
    );
  }

  function agregarFila() {
    setFilas((actuales) => [...actuales, { ...FILA_INICIAL }]);
  }

  function quitarFila(indice) {
    setFilas((actuales) => actuales.filter((_, i) => i !== indice));
  }

  function cancelarEdicion() {
    setEditando(null);
    setNombre('');
    setIdCliente('');
    setFilas([{ ...FILA_INICIAL }]);
    setError('');
  }

  async function prepararEdicion(rutina) {
    setError('');
    setExito('');
    try {
      const detalle = await api.obtenerRutina(rutina.id_rutina);
      setEditando(detalle.id_rutina);
      setIdCliente(String(detalle.id_cliente));
      setNombre(detalle.nombre);
      setFilas(
        detalle.ejercicios.map((ej) => ({
          id_ejercicio: String(ej.id_ejercicio),
          series: ej.series,
          repeticiones: ej.repeticiones,
          peso_recomendado: ej.peso_recomendado ?? '',
          descanso_segundos: ej.descanso_segundos ?? '',
          instrucciones: ej.instrucciones ?? '',
        }))
      );
    } catch (e) {
      setError(e.message);
    }
  }

  function construirCuerpo() {
    return {
      nombre: nombre.trim(),
      ejercicios: filas.map((fila, i) => ({
        id_ejercicio: Number(fila.id_ejercicio),
        orden: i + 1,
        series: Number(fila.series),
        repeticiones: Number(fila.repeticiones),
        peso_recomendado: fila.peso_recomendado === '' ? null : Number(fila.peso_recomendado),
        descanso_segundos: fila.descanso_segundos === '' ? null : Number(fila.descanso_segundos),
        instrucciones: fila.instrucciones.trim() === '' ? null : fila.instrucciones.trim(),
      })),
    };
  }

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setError('');
    setExito('');
    const cuerpo = construirCuerpo();
    try {
      if (editando) {
        await api.actualizarRutina(editando, cuerpo);
        setExito('Rutina modificada correctamente.');
        setEditando(null);
      } else {
        await api.crearRutina({ id_cliente: Number(idCliente), ...cuerpo });
        setExito('Rutina creada correctamente. Actívala para que el cliente la vea.');
      }
      setNombre('');
      setIdCliente('');
      setFilas([{ ...FILA_INICIAL }]);
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  async function alternarEstado(rutina) {
    setError('');
    setExito('');
    const activando = rutina.estado !== 'activa';
    const confirmar = window.confirm(
      activando
        ? `¿Activar la rutina «${rutina.nombre}»? La rutina activa anterior del cliente quedará inactiva.`
        : `¿Desactivar la rutina «${rutina.nombre}»?`
    );
    if (!confirmar) return;
    try {
      await api.cambiarEstadoRutina(rutina.id_rutina, activando ? 'activa' : 'inactiva');
      setExito(`Rutina ${activando ? 'activada' : 'desactivada'} correctamente.`);
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <>
      <section className="tarjeta">
        <h1>{editando ? 'Modificar rutina' : 'Nueva rutina'}</h1>
        {error && <div className="mensaje mensaje-error" role="alert">{error}</div>}
        {exito && <div className="mensaje mensaje-exito" role="status">{exito}</div>}

        <form onSubmit={manejarEnvio}>
          <div className="fila">
            <div className="campo">
              <label className="etiqueta" htmlFor="rt-cliente">Cliente</label>
              <select
                id="rt-cliente"
                value={idCliente}
                onChange={(e) => setIdCliente(e.target.value)}
                disabled={Boolean(editando)}
                required
              >
                <option value="">Selecciona un cliente</option>
                {asignaciones.map((asignacion) => (
                  <option key={asignacion.id_asignacion} value={asignacion.id_cliente}>
                    {`${asignacion.cliente_nombre} ${asignacion.cliente_apellido}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label className="etiqueta" htmlFor="rt-nombre">Nombre de la rutina</label>
              <input
                id="rt-nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                maxLength={100}
                required
              />
            </div>
          </div>

          <h2>Ejercicios</h2>
          {filas.map((fila, indice) => (
            <div className="fila" key={`rt-fila-${indice}`}>
              <div className="campo">
                <label className="etiqueta" htmlFor={`rt-ejercicio-${indice}`}>Ejercicio</label>
                <select
                  id={`rt-ejercicio-${indice}`}
                  value={fila.id_ejercicio}
                  onChange={(e) => cambiarFila(indice, 'id_ejercicio', e.target.value)}
                  required
                >
                  <option value="">Selecciona</option>
                  {ejercicios.map((ejercicio) => (
                    <option key={ejercicio.id_ejercicio} value={ejercicio.id_ejercicio}>
                      {ejercicio.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="campo">
                <label className="etiqueta" htmlFor={`rt-series-${indice}`}>Series</label>
                <input
                  id={`rt-series-${indice}`}
                  type="number"
                  min="1"
                  max="999"
                  value={fila.series}
                  onChange={(e) => cambiarFila(indice, 'series', e.target.value)}
                  required
                />
              </div>
              <div className="campo">
                <label className="etiqueta" htmlFor={`rt-reps-${indice}`}>Repeticiones</label>
                <input
                  id={`rt-reps-${indice}`}
                  type="number"
                  min="1"
                  max="999"
                  value={fila.repeticiones}
                  onChange={(e) => cambiarFila(indice, 'repeticiones', e.target.value)}
                  required
                />
              </div>
              <div className="campo">
                <label className="etiqueta" htmlFor={`rt-peso-${indice}`}>Peso recomendado (kg, opcional)</label>
                <input
                  id={`rt-peso-${indice}`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={fila.peso_recomendado}
                  onChange={(e) => cambiarFila(indice, 'peso_recomendado', e.target.value)}
                />
              </div>
              <div className="campo">
                <label className="etiqueta" htmlFor={`rt-descanso-${indice}`}>Descanso en segundos (opcional)</label>
                <input
                  id={`rt-descanso-${indice}`}
                  type="number"
                  min="0"
                  max="3600"
                  value={fila.descanso_segundos}
                  onChange={(e) => cambiarFila(indice, 'descanso_segundos', e.target.value)}
                />
              </div>
              <div className="campo">
                <label className="etiqueta" htmlFor={`rt-instr-${indice}`}>Instrucciones (opcional)</label>
                <input
                  id={`rt-instr-${indice}`}
                  value={fila.instrucciones}
                  onChange={(e) => cambiarFila(indice, 'instrucciones', e.target.value)}
                />
              </div>
              {filas.length > 1 && (
                <button type="button" onClick={() => quitarFila(indice)}>Quitar</button>
              )}
            </div>
          ))}
          <button type="button" onClick={agregarFila}>Agregar ejercicio</button>

          <div className="fila">
            <button type="submit">{editando ? 'Guardar cambios' : 'Crear rutina'}</button>
            {editando && (
              <button type="button" onClick={cancelarEdicion}>Cancelar</button>
            )}
          </div>
        </form>
      </section>

      <section className="tarjeta">
        <h1>Mis rutinas</h1>
        <table className="tabla">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Rutina</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rutinas.length === 0 && (
              <tr>
                <td colSpan={4}>No tienes rutinas registradas.</td>
              </tr>
            )}
            {rutinas.map((rutina) => (
              <tr key={rutina.id_rutina}>
                <td>{`${rutina.cliente_nombre} ${rutina.cliente_apellido}`}</td>
                <td>{rutina.nombre}</td>
                <td>{rutina.estado === 'activa' ? 'Activa' : 'Inactiva'}</td>
                <td>
                  <button type="button" onClick={() => prepararEdicion(rutina)}>Editar</button>{' '}
                  {rutina.estado === 'activa' ? (
                    <button type="button" onClick={() => alternarEstado(rutina)}>Desactivar</button>
                  ) : (
                    <button type="button" onClick={() => alternarEstado(rutina)}>Activar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
