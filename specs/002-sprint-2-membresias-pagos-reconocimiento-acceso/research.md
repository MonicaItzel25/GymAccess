# Investigación — Sprint 2 (Membresías, pagos, reconocimiento facial y accesos)

Fecha: 2026-10-18 | Fase 0 del plan de implementación. Investigación basada en
fuentes locales: `.specify/memory/constitution.md`, `docs/project-context.md`,
`docs/reglas.md`, `docs/sprint-2.md`, el código consolidado del repositorio y las
migraciones 001–003 (leídas sin modificar). No se accedió a ninguna carpeta externa
al repositorio.

Cada hallazgo sigue el formato: Decisión / Racional / Alternativas consideradas.

## R1 — Precio acordado de la membresía (congelación del precio)

- **Decisión**: agregar `membresias.precio_acordado DECIMAL(10,2) NOT NULL` mediante
  la migración correctiva `004_precio_acordado_membresias.sql`. `asignarMembresia` y
  `renovarMembresia` escriben en ese campo el `precio` vigente del tipo capturado en
  el momento de la operación (dentro de la misma transacción). `calcularAdeudo` y las
  funciones derivadas de adeudo usan `membresia.precio_acordado` en lugar del JOIN
  con `tipos_membresia.precio`. El precio del catálogo deja de participar en el
  cálculo de adeudos por completo.
- **Racional**: es el requisito central de las decisiones de 2026-10-15 (FR-005,
  FR-007, FR-011, FR-018, RN-016, SC-010). El código actual
  (`pago.service.js::calcularAdeudo` usa `Math.max(0, precioTipo − pagos)`) cambia
  retroactivamente los adeudos al editar el catálogo; con el snapshot congelado ese
  efecto desaparece. Capturar el precio dentro de la transacción de asignación/renovación
  evita condiciones de carrera con ediciones simultáneas del catálogo (FR-008 ya usa
  `FOR UPDATE` sobre la vigente).
- **Alternativas consideradas**:
  1. *Calcular el adeudo con el precio histórico del tipo por fechas*: rechazada porque
     `tipos_membresia` no versiona precios (un UPDATE sobrescribe el valor) y habría
     que reconstruir la historia; frágil y no auditable.
  2. *Tabla de snapshot `membresia_precios`*: rechazada como sobre-diseño para un solo
     dato inmutable por membresía; una columna NOT NULL cumple con menos complejidad
     (constitución: sin información derivada innecesaria, pero aquí el snapshot ES la
     fuente de verdad).
  3. *Backfill distinto (precio actual del tipo)*: adoptado como único viable para
     datos históricos — no existe registro del precio acordado en el pasado; se
     documenta la limitación (ver Fase 1, data-model.md).

## R2 — Autorización manual de ingreso en recepción

- **Decisión**: nuevo endpoint autenticado `POST /api/acceso/manual` con
  `autenticar` + `autorizar('administrador','recepcionista')`. El body acepta
  `id_cliente`, `resultado` (`autorizado`|`rechazado`) y `motivo` (obligatorio si es
  rechazo). El servicio (extensión de `acceso.service.js`, ver R5) valida en servidor:
  (1) que el cliente exista; (2) que su membresía vigente esté vigente por fechas y
  estado (`evaluarMembresia` reutilizado) cuando el resultado sea `autorizado`; si no
  está vigente o el cliente no existe, la operación se rechaza con 4xx y NO se crea
  registro autorizado. Siempre inserta en `accesos` con `origen='manual'`,
  `id_usuario = req.usuario.id_usuario`, fecha/hora, resultado y motivo, y genera su
  registro de auditoría. El kiosco (`POST /api/acceso/intento`) no se modifica en su
  lógica: sigue sin sesión, sigue sin autorizar por sí mismo y muestra el mensaje
  «No se pudo identificar su rostro, acuda a recepción» (FR-030).
- **Racional**: la matriz de permisos y RN-017 exigen rol autenticado y decisión en
  servidor; reutilizar `evaluarMembresia` garantiza coherencia con el kiosco
  (constitución: «la validación de acceso, la consulta de membresía y el registro del
  resultado se ejecutan de manera coherente»). El registro en `accesos` con
  `origen='manual'` y `id_usuario` da el rastro exigido por SC-002/SC-011 sin tocar
  el modelo de auditoría existente.
- **Alternativas consideradas**:
  1. *Endpoint del kiosco que acepte un código de recepcionista*: rechazado — mezclaría
     sesión de personal en la terminal sin sesión (excepción E2) y ampliaría la
     superficie del kiosco más allá de la validación de acceso.
  2. *Separar el registro manual en una tabla nueva `autorizaciones_manuales`*:
     rechazado — duplicaría el concepto de intento de acceso y complicaría el historial
     (US-S2-09 exige ver todo junto); `accesos` ya tiene resultado y motivo.
  3. *Que el frontend decida la vigencia*: rechazado — viola el principio II; la
     vigencia se evalúa en el servidor aunque el personal haya «verificado» en pantalla.

## R3 — Protección de pagos duplicados por identificador de operación (FR-017)

- **Decisión**: migración correctiva `005_proteccion_pagos_duplicados.sql` agrega
  `pagos.id_operacion VARCHAR(100) NULL` con índice único compuesto
  `(id_cliente, id_operacion)`. `registrarPago` acepta `id_operacion` opcional; si se
  provee y ya existe un pago con el mismo `(id_cliente, id_operacion)`, devuelve 409
  con mensaje claro sin crear el registro. Los pagos sin identificador siguen
  permitidos (el índice compuesto de MySQL permite múltiples NULL).
- **Racional**: FR-017 solo exige impedir el duplicado «cuando se proporcione un
  identificador de operación»; el índice único traslada la garantía al motor de BD,
  sobreviviendo a concurrencia (RN-012).
- **Alternativas consideradas**: *Validación solo en el servicio*: rechazada — no
  resiste carreras de dos registros simultáneos; el índice único es la garantía
  comprobable.

## R4 — Reconocimiento facial: tecnología, instalación y limitaciones (FR-026)

- **Decisión**: mantener `face-api.js ^0.22.2` + `@tensorflow/tfjs ^4.22.2` en el
  navegador (ya instaladas): el frontend captura con `getUserMedia`, carga
  `tinyFaceDetector`, `faceLandmark68Net` y `faceRecognitionNet` desde
  `frontend/public/modelos/` y envía el **descriptor de 128 números** como JSON al
  backend; el backend solo calcula la distancia euclidiana
  (`utils/matchRostro.js::euclideanDistance`, de la exportación pura de face-api.js,
  sin TensorFlow nativo en servidor) con umbral `FACE_MATCH_THRESHOLD` (0,5 por
  defecto). Documentar todo esto —requisitos de instalación (modelos descargados en
  `public/modelos/`, HTTPS o localhost para `getUserMedia`, permiso de cámara), el
  algoritmo, el umbral y sus limitaciones (sensibilidad a iluminación, gafas,
  tapabocas, ángulo; sin afirmar precisión absoluta)— en
  `docs/tecnologia-reconocimiento-facial.md`. Añadir `FACE_MATCH_THRESHOLD` a
  `backend/.env.example` y `backend/.env.test` con el valor por defecto documentado.
- **Racional**: la tecnología ya está instalada y probada (Sprint 1); FR-026 solo
  exige documentarla con sus limitaciones. Mover la comparación al servidor
  completo requeriría modelos de Node con TensorFlow nativo, complejidad ajena al
  alcance.
- **Alternativas consideradas**: *face-api.js en Node*: rechazada — no soportado
  oficialmente sin dependencias nativas problemáticas; la comparación de 128 floats
  es matemática pura y ya funciona en el servidor.

## R5 — Punto de inserción de la lógica de autorización manual

- **Decisión**: implementar la lógica en `backend/src/services/acceso.service.js`
  (nueva función `autorizarAccesoManual`) y su route `acceso.routes.js` (nuevo
  endpoint montado bajo `/api/acceso/manual` con `autenticar` + `autorizar`), más su
  controller y validator correspondientes, siguiendo el patrón por módulo existente.
- **Racional**: la autorización manual es una variante del intento de acceso (mismo
  registro `accesos`, misma evaluación de membresía, misma auditoría); separarla en un
  servicio nuevo fragmentaría la lógica de acceso ya consolidada. Se respeta la
  estructura route → controller → service → model existente sin duplicar lógica
  (constitución, módulos JavaScript, punto 4).
- **Alternativas consideradas**: *nuevo `autorizacionManual.service.js`*: rechazado por
  duplicar `evaluarMembresia` y el registro de accesos (ver R2, alternativa 2).

## R6 — Backfill de `precio_acordado` en membresías existentes

- **Decisión**: la migración 004 pobla `precio_acordado` en las membresías existentes
  con el precio vigente de su tipo al momento de aplicarla (`UPDATE ... JOIN
  tipos_membresia`), única opción posible porque el historial de precios no existe.
  Se documenta esta limitación en `data-model.md` y en la propia migración.
- **Racional**: el campo es NOT NULL; el backfill es determinista y auditable; el
  efecto práctico es que los adeudos existentes no cambian tras el despliegue salvo
  que el catálogo se edite a partir de ese momento, que es exactamente el comportamiento
  requerido.
- **Alternativas consideradas**: *dejar NULL y calcular en la capa*: rechazada —
  viola FR-018 (el precio debe estar registrado) y debilita la garantía.

## R7 — Rediseño de la zona autenticada y pantalla de inicio (US-S2-10, FR-041…045)

- **Decisión**: evolucionar `frontend/src/components/Layout.jsx` para convertirlo en
  el shell con menú lateral izquierdo (colapsable en móvil ≤768 px) y contenido
  renderizado por `App.jsx`; crear `frontend/src/pages/Inicio.jsx` como pantalla de
  inicio con bienvenida personalizada (nombre del usuario del `AuthContext`), tarjetas
  de estadísticas con **datos reales** obtenidos de endpoints existentes (conteos de
  clientes/membresías/pagos/accesos disponibles según el rol, usando las listas ya
  existentes o el endpoint de adeudos global del administrador) e imágenes
  decorativas de gimnasio servidas desde `frontend/public/img/` (assets estáticos
  propios, sin llamadas a servicios externos). Se conservan intactas rutas,
  `services/api.js`, `AuthContext`, tokens y manejo de errores (FR-043; constitución,
  punto 9 del diseño visual). Animaciones sutiles con `prefers-reduced-motion`.
- **Racional**: FR-041…045 y los escenarios US-S2-10.1…5; la estética Dark Fitness &
  Warm Orange ya está definida en la constitución (§ Diseño visual) y el login la
  aplica, así que el rediseño la unifica. Sin dependencias nuevas: no se instala
  librería de componentes.
- **Alternativas consideradas**:
  1. *Instalar librería UI (MUI, Tailwind)*: rechazada — introduce tecnología nueva
     sin necesidad (principio I) y el login ya tiene CSS propio.
  2. *Endpoint nuevo de estadísticas agregadas*: pospuesto — el alcance se cubre con
     datos de los endpoints existentes; si resulta insuficiente, se documentará como
     cambio pendiente sin ampliar el sprint.

## R8 — Reconciliación de la numeración de requisitos citada en el código

- **Decisión**: el código existente cita la numeración de una versión anterior del
  spec. Durante la fase de tareas, cada comentario se reconciliará contra la
  numeración FR/RN/SC de `spec.md` (001–045 / RN-001…017 / SC-001…011) **sin editar
  migraciones ejecutadas**; los comentarios de código sí podrán corregirse (no son
  artefactos ejecutados). La referencia canónica durante la implementación será el
  `spec.md` de esta carpeta.
- **Racional**: supuesto explícito del spec («Numeración de requisitos»): la
  reconciliación ocurre en plan/tareas. Cambiar comentarios de código no altera
  comportamiento ni migraciones.
- **Alternativas consideradas**: *re-numerar el spec para igualar el código*:
  rechazada — el spec 002 es el documento ratificado por las decisiones del usuario y
  su numeración es interna y secuencial (convención de casa del Sprint 1).

## R9 — Entorno de pruebas y migraciones (FR-048, constitución III)

- **Decisión**: las migraciones 004–006 se crearán como archivos nuevos y se
  aplicarán únicamente al entorno de datos de prueba (`gym_db_pruebas`, vía
  `node --env-file=.env.test ../database/migrate.mjs` desde `backend/`; `npm run
  migrar` a secas apunta a `backend/.env`) durante la implementación;
  `gym_db` (operación) no se modifica, no se reinicia y sus migraciones ejecutadas
  no se editan. Las pruebas automatizadas del backend usan `.env.test`
  (`node --env-file=.env.test`), como ya ocurre.
- **Racional**: FR-048 y principios III y V; el runner `migrate.mjs` ya soporta
  entornos separados y registra cada migración por nombre único.
- **Alternativas consideradas**: ninguna viable — editar migraciones ejecutadas viola
  la constitución directamente.

## R10 — Catálogo de motivos y mensajes del acceso

- **Decisión**: reutilizar `backend/src/utils/catalogos.js` (`MOTIVOS_RECHAZO`,
  `METODOS_PAGO`) y ampliarlo con los motivos de rechazo manual necesarios
  («identidad no verificable», «membresía no vigente») dentro de la longitud
  `motivo_rechazo VARCHAR(100)` existente. El mensaje del kiosco «No se pudo
  identificar su rostro, acuda a recepción» se mantiene textualmente donde ya se
  muestra (FR-030).
- **Racional**: la constitución exige nombres de conceptos consistentes entre
  interfaz, API y documentación; centralizar el catálogo evita divergencias.
- **Alternativas consideradas**: *catálogo por frontend*: rechazado — el backend debe
  validar los motivos (principio II).
