// pages/PuntoAcceso.jsx
// Kiosco del punto de acceso (US-S2-07 y US-S2-08). Captura el rostro,
// envía el descriptor al backend (ruta sin token) y muestra la decisión.
// Máximo 3 intentos consecutivos; al agotarse muestra el mensaje de
// "rostro no identificado" (FR-027). ES Modules (JSX).

import { useCallback, useState } from 'react';
import { api } from '../services/api';
import CapturaRostro from '../components/CapturaRostro';

const MAXIMO_INTENTOS = 3;
const MENSAJE_AGOTADO = 'No se pudo identificar su rostro, acuda a recepción';

export default function PuntoAcceso() {
  const [decision, setDecision] = useState(null);
  const [intentos, setIntentos] = useState(0);
  const [agotado, setAgotado] = useState(false);
  const [error, setError] = useState('');
  const [procesando, setProcesando] = useState(false);

  const reiniciar = useCallback(() => {
    setDecision(null);
    setIntentos(0);
    setAgotado(false);
    setError('');
  }, []);

  async function manejarDescriptor(descriptor) {
    if (agotado || procesando) return;
    setProcesando(true);
    setError('');
    try {
      const resultado = await api.enviarIntentoAcceso(descriptor);
      setDecision(resultado);

      if (resultado.resultado === 'autorizado') {
        // Ingreso logueado: no se cuentan intentos fallidos.
        setIntentos(0);
        return;
      }

      // Solo cuenta como intento fallido el rostro no identificado (FR-027).
      if (resultado.motivo === 'rostro no identificado') {
        const nuevos = intentos + 1;
        setIntentos(nuevos);
        if (nuevos >= MAXIMO_INTENTOS) {
          setAgotado(true);
        }
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setProcesando(false);
    }
  }

  return (
    <section className="tarjeta">
      <h1>Punto de acceso</h1>
      <p className="etiqueta">
        Ubique el rostro dentro del marco. Identificación automática sin sesión.
      </p>

      {error && <div className="mensaje mensaje-error" role="alert">{error}</div>}

      {!agotado ? (
        <>
          <CapturaRostro onDescriptor={manejarDescriptor} activo={!procesando} />
          {intentos > 0 && (
            <p className="etiqueta" role="status">
              Intentos fallidos: {intentos} de {MAXIMO_INTENTOS}
            </p>
          )}
        </>
      ) : (
        <div className="mensaje mensaje-error" role="alert">
          <p>{MENSAJE_AGOTADO}</p>
          <button type="button" onClick={reiniciar}>Reiniciar</button>
        </div>
      )}

      {decision && !agotado && (
        <div
          className={`mensaje ${decision.resultado === 'autorizado' ? 'mensaje-exito' : 'mensaje-error'}`}
          role="status"
        >
          {decision.resultado === 'autorizado' ? (
            <>
              <p><strong>Acceso autorizado</strong></p>
              <p>
                {decision.cliente.nombre} {decision.cliente.apellido} — membresía{' '}
                {decision.membresia.estado}, válida hasta {decision.membresia.fecha_fin}.
              </p>
            </>
          ) : (
            <p>{decision.mensaje}</p>
          )}
        </div>
      )}
    </section>
  );
}
