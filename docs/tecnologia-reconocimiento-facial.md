# Tecnología de reconocimiento facial

Fecha: 2026-10-18 | Sprint 2, US-S2-06 | Requisito: FR-026 (documentar la tecnología
con sus limitaciones) y FR-047 (sin afirmaciones de precisión absoluta).

Este documento describe **qué tecnología usa** el reconocimiento facial de GymAccess,
**cómo se instala**, **cómo funciona** el algoritmo de comparación y **qué
limitaciones** se han observado. No declara porcentajes de precisión ni garantías
absolutas de identificación.

## 1. Tecnología utilizada

- **`face-api.js ^0.22.2`** en el **navegador** (frontend), sobre **`@tensorflow/tfjs
  ^4.22.2`**. Ambas dependencias ya estaban instaladas y probadas desde el Sprint 1;
  el Sprint 2 no agrega librerías nuevas.
- La **comparación de descriptores** ocurre en el **servidor** (`backend/src/utils/
  matchRostro.js`), pero es **matemática pura** (distancia euclidiana entre dos
  vectores de 128 números), por lo que **no se requiere TensorFlow nativo en Node**.
  `face-api.js` aporta `euclideanDistance` sin dependencias nativas.

Motivo de esta separación: ejecutar face-api.js completo en Node exigiría dependencias
nativas problemáticas, y la comparación de 128 floats no las necesita
(`research.md`, R4).

## 2. Modelos preentrenados

El frontend carga tres modelos desde `frontend/public/modelos/` (assets estáticos
locales, sin llamadas a servicios externos):

| Modelo | Uso |
|---|---|
| `tinyFaceDetector` | Detectar la presencia de un rostro en el fotograma |
| `faceLandmark68Net` | Localizar 68 puntos de referencia del rostro |
| `faceRecognitionNet` | Generar el **descriptor facial** de 128 números |

Los pesos (~6 MB) **no se versionan** en el repositorio; se descargan una sola vez
del repositorio oficial de `face-api.js` siguiendo las instrucciones de
`frontend/public/modelos/LEEME.md`.

## 3. Descriptor facial

- El descriptor es un **arreglo de exactamente 128 números** (floats), generado en el
  navegador por `faceRecognitionNet`.
- El frontend lo envía como JSON al backend. El backend lo **valida** (arreglo de 128
  números finitos) tanto en el registro de rostro como en el intento de acceso del
  kiosco.
- **Nunca se almacenan ni transmiten imágenes**: solo el vector de 128 números
  (`rostros.descriptor_facial`, tipo JSON). El descriptor **jamás se devuelve** por la
  API (FR-024, SC-004).

## 4. Algoritmo de comparación (servidor)

1. El cliente se identifica en el kiosco y el navegador envía su descriptor de 128
   números.
2. El backend recupera los descriptores registrados de los clientes y calcula la
   **distancia euclidiana** entre el descriptor del intento y cada uno
   (`matchRostro.js::distancia`).
3. Se elige el cliente de **menor distancia**. Si esa distancia es **≤ umbral**, se
   considera coincidencia (`matchRostro.js::coinciden`); en caso contrario, el rostro
   **no se identifica** y el kiosco responde «No se pudo identificar su rostro, acuda
   a recepción» (FR-030).

### Umbral de coincidencia

- Variable de entorno **`FACE_MATCH_THRESHOLD`**, con valor por defecto documentado
  **0,5** (configurable en `backend/.env.example` y `backend/.env.test`).
- **Menor valor = más estricto** (menos falsos positivos, más falsos negativos); mayor
  valor = más tolerante (más falsos positivos).
- Si la variable no está definida o no es un número válido y positivo, el backend usa
  0,5 por defecto (`matchRostro.js::obtenerUmbral`).
- No es un secreto: es un **ajuste de operación**, no una credencial.

## 5. Requisitos de instalación y uso

- **Navegador moderno** con soporte de `getUserMedia` (cámara).
- **HTTPS o `localhost`**: los navegadores solo conceden acceso a la cámara en contextos
  seguros; sin esto la captura falla.
- **Permiso de cámara** concedido por el usuario.
- Los **modelos** presentes en `frontend/public/modelos/` (ver §2).

## 6. Limitaciones observadas

El reconocimiento facial es un **apoyo**, no una garantía absoluta de identidad. Su
desempeño se degrada en situaciones como:

- **Iluminación** deficiente (muy oscura, contraluz o muy brillante).
- **Gafas**, **tapabocas** u otros accesorios que cubran el rostro.
- **Ángulo** de captura demasiado lateral o perfilado.
- **Distancia** incorrecta respecto a la cámara (rostro muy lejano o recortado).
- **Movimiento** o desenfoque durante la captura.

Por eso el sistema **nunca autoriza por sí solo** el ingreso cuando el rostro no se
identifica: deriva a recepción, donde el personal aplica el procedimiento manual de
verificación (FR-030, `POST /api/acceso/manual`). Este diseño es deliberado: la
decisión final de vigencia la toma el **servidor** con las mismas reglas del kiosco
(principio II).

> Declaración de alcance: este documento describe el comportamiento observado y el
> diseño del sistema. **No afirma una tasa de precisión**, tasa de error ni nivel de
> seguridad biométrica; cualquier cifra requeriría una evaluación empírica propia del
> entorno de operación (FR-047).

## 7. Privacidad y auditoría

- Solo se almacena el **descriptor de 128 números**; **no** imágenes ni fotos.
- El descriptor **no se expone** nunca por la API.
- La auditoría del registro y de los intentos de acceso **no contiene datos
  biométricos** (FR-025, SC-011).

## 8. Referencias internas

- `backend/src/utils/matchRostro.js` — distancia, umbral y coincidencia.
- `backend/src/services/rostro.service.js` — registro e identificación.
- `frontend/public/modelos/LEEME.md` — instalación de los pesos.
- `specs/002-sprint-2-membresias-pagos-reconocimiento-acceso/research.md` (R4) y
  `quickstart.md`.
