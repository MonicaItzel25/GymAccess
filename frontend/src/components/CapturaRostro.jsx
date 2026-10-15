// components/CapturaRostro.jsx
// Captura el rostro con la cámara (getUserMedia) y genera el descriptor
// facial de 128 números con face-api.js en el navegador (research §2).
// La imagen NUNCA viaja por la red ni se almacena: solo se emite el
// descriptor numérico. ES Modules (JSX).

import { useCallback, useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

const RUTA_MODELOS = '/modelos';

// Modelos necesarios para generar el descriptor (ver public/modelos/LEEME.md).
const RUTAS_MODELOS = {
  tinyFaceDetector: `${RUTA_MODELOS}/tiny_face_detector_model-weights_manifest.json`,
  faceLandmark68: `${RUTA_MODELOS}/face_landmark_68_model-weights_manifest.json`,
  faceRecognition: `${RUTA_MODELOS}/face_recognition_model-weights_manifest.json`,
};

let modelosCargados = false;

async function cargarModelos() {
  if (modelosCargados) return;
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(RUTA_MODELOS),
    faceapi.nets.faceLandmark68Net.loadFromUri(RUTA_MODELOS),
    faceapi.nets.faceRecognitionNet.loadFromUri(RUTA_MODELOS),
  ]);
  modelosCargados = true;
}

/**
 * Emite el descriptor facial (arreglo de 128 números) mediante `onDescriptor`.
 * Muestra vista previa y mensajes orientativos de iluminación (research §6).
 */
export default function CapturaRostro({ onDescriptor, activo = true }) {
  const videoRef = useRef(null);
  const flujoRef = useRef(null);
  const [estado, setEstado] = useState('inactivo'); // inactivo | listo | capturando | error
  const [mensaje, setMensaje] = useState('');

  const detenerCamara = useCallback(() => {
    if (flujoRef.current) {
      flujoRef.current.getTracks().forEach((t) => t.stop());
      flujoRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!activo) {
      detenerCamara();
      return undefined;
    }

    let cancelado = false;

    async function abrirCamara() {
      setEstado('capturando');
      setMensaje('Cargando modelos faciales…');
      try {
        await cargarModelos();
        if (cancelado) return;

        setMensaje('Solicitando permiso de cámara…');
        const flujo = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false,
        });
        if (cancelado) {
          flujo.getTracks().forEach((t) => t.stop());
          return;
        }
        flujoRef.current = flujo;
        if (videoRef.current) {
          videoRef.current.srcObject = flujo;
          await videoRef.current.play();
        }
        setEstado('listo');
        setMensaje('Ubique su rostro dentro del marco y presione "Capturar".');
      } catch (error) {
        if (cancelado) return;
        setEstado('error');
        setMensaje(
          error.name === 'NotAllowedError'
            ? 'Permiso de cámara denegado. Concédelo en el navegador.'
            : 'No se pudo acceder a la cámara.'
        );
      }
    }

    abrirCamara();

    return () => {
      cancelado = true;
      detenerCamara();
    };
  }, [activo, detenerCamara]);

  async function capturar() {
    if (!videoRef.current || estado !== 'listo') return;
    setEstado('capturando');
    setMensaje('Procesando rostro…');
    try {
      const deteccion = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!deteccion) {
        setEstado('listo');
        setMensaje('No se detectó un rostro. Mejore la iluminación e inténtelo de nuevo.');
        return;
      }

      const descriptor = Array.from(deteccion.descriptor);
      setMensaje('Rostro detectado.');
      onDescriptor(descriptor);
    } catch {
      setEstado('listo');
      setMensaje('No se pudo procesar el rostro. Inténtelo de nuevo.');
    }
  }

  return (
    <div className="campo">
      <video
        ref={videoRef}
        muted
        playsInline
        style={{ width: '100%', maxWidth: 480, borderRadius: 8, background: '#000' }}
      />
      <p className="etiqueta" aria-live="polite">{mensaje}</p>
      <button type="button" onClick={capturar} disabled={estado !== 'listo'}>
        Capturar rostro
      </button>
    </div>
  );
}
