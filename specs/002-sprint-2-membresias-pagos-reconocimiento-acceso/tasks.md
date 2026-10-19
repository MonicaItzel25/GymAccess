---

description: "Lista de tareas para la implementación del Sprint 2"

# Tareas: Membresías, pagos, reconocimiento facial y accesos (Sprint 2)

**Entrada**: Documentos de diseño de `/specs/002-sprint-2-membresias-pagos-reconocimiento-acceso/`

**Prerrequisitos**: plan.md (requerido), spec.md (requerido para las historias), research.md, data-model.md, contracts/, quickstart.md

**Tests**: INCLUIDOS. El spec los exige explícitamente (FR-046: casos exitosos, errores de validación, permisos por rol y accesos no autorizados de cada módulo; FR-047 y SC-008). Framework: Vitest + Supertest en backend (ejecución con `.env.test` contra `gym_db_pruebas`), Vitest + jsdom + Testing Library en frontend.

**Organización**: las tareas están agrupadas por historia de usuario para permitir implementación y prueba independientes. El código del Sprint 2 ya está consolidado en el repositorio; las tareas se concentran en los cambios realmente pendientes: migraciones correctivas 004–006, precio acordado, autorización manual, protección de pagos duplicados, documentación facial, rediseño y reconciliación de numeración FR.

## Formato: `[ID] [P?] [Historia] Descripción`

- **[P]**: puede ejecutarse en paralelo (archivos distintos, sin dependencias de tareas incompletas)
- **[Historia]**: historia de usuario a la que pertenece (US1…US10 = US-S2-01…US-S2-10)
- Todas las descripciones incluyen la ruta exacta del archivo

## Convención de rutas

- Aplicación web: `backend/src/`, `frontend/src/`, `database/migrations/`
- Pruebas backend: `backend/tests/{unit,integration,contract}`; pruebas frontend junto a lo probado
- **Prohibido**: editar `database/migrations/001_*`, `002_*`, `003_*` ni operar sobre `gym_db`; toda ejecución y prueba usa el entorno `gym_db_pruebas` (FR-048, constitución III)

---

## Fase 1: Configuración (Infraestructura compartida)

**Propósito**: preparar el entorno de pruebas y la configuración facial antes de tocar código

- [X] T001 Agregar `FACE_MATCH_THRESHOLD` (valor por defecto documentado `0.5`) a `backend/.env.example` y `backend/.env.test` según research.md R4
- [X] T002 Verificar que el runner `database/migrate.mjs` aplica las migraciones 001–003 sobre `gym_db_pruebas` con `npm run migrar` desde `backend/` usando `.env.test`, sin tocar `gym_db`

**Punto de control**: entorno de pruebas preparado; ninguna migración existente fue modificada

---

## Fase 2: Fundacional (Prerrequisitos bloqueantes)

**Propósito**: crear las tres migraciones correctivas nuevas que múltiples historias necesitan

**?? CRÍTICO**: ninguna historia puede comenzar hasta completar esta fase (excepto US7 y US10, que no dependen de esquema)

- [X] T003 Crear `database/migrations/004_precio_acordado_membresias.sql`: `ALTER TABLE membresias ADD COLUMN precio_acordado DECIMAL(10,2) NULL`, backfill con el precio vigente del tipo (`UPDATE membresias m JOIN tipos_membresia t ON t.id_tipo_membresia = m.id_tipo_membresia SET m.precio_acordado = t.precio WHERE m.precio_acordado IS NULL`) y `MODIFY precio_acordado DECIMAL(10,2) NOT NULL`, con comentario que documenta la limitación del backfill (data-model.md §3.1, research.md R6)
- [X] T004 Crear `database/migrations/005_accesos_autorizacion_manual.sql`: `ALTER TABLE accesos ADD COLUMN id_usuario INT NULL` con FK a `usuarios` (`ON DELETE RESTRICT ON UPDATE CASCADE`), `ADD COLUMN origen ENUM('kiosco','manual') NOT NULL DEFAULT 'kiosco'`, índice `idx_accesos_usuario` y comentario que documenta el backfill implícito de los registros existentes como `kiosco` (data-model.md §3.2)
- [X] T005 Crear `database/migrations/006_pagos_id_operacion.sql`: `ALTER TABLE pagos ADD COLUMN id_operacion VARCHAR(100) NULL` y `ADD UNIQUE KEY uq_pagos_cliente_operacion (id_cliente, id_operacion)` (data-model.md §3.3, research.md R3)
- [X] T006 Ejecutar `npm run migrar` desde `backend/` con `.env.test` (SOLO `gym_db_pruebas`) y verificar en la tabla `migraciones` que quedaron registrados los tres archivos nuevos y que `membresias.precio_acordado` está poblado en todas las filas
- [X] T007 Ajustar los fixtures de `backend/tests/helpers/baseDatos.js` para que los INSERTs directos de membresías incluyan `precio_acordado` (campo ahora NOT NULL) manteniendo los seeds de `database/seeds/` intactos

**Punto de control**: base de pruebas con esquema Sprint 2 completo; el backend existente debe seguir arrancando sin errores (los campos nuevos son aditivos)

---

## Fase 3: Historia de Usuario 1 - Gestión de tipos de membresía (Prioridad: P1) ?? MVP

**Objetivo**: catálogo de tipos con validación de duración/precio positivos, permisos de escritura solo administrador y garantía de que modificar el catálogo no altera membresías ya asignadas (FR-001…FR-005)

**Prueba independiente**: crear un tipo con duración y precio válidos, modificar su precio con membresías asignadas y verificar que esas membresías conservan su `precio_acordado`; verificar que un recepcionista recibe 403 al escribir. La estabilidad del adeudo ante cambios del catálogo se prueba en US6 (T035), cuando el cálculo ya usa el precio acordado

### Tests para la Historia 1

- [X] T008 [P] [US1] Ampliar `backend/tests/contract/tipos-membresia.test.js` con los rechazos de FR-002 (duración o precio ≤ 0 → 400 con mensaje comprensible) y el permiso FR-004 (recepcionista → 403 en escritura, 200 en consulta)
- [X] T009 [P] [US1] Crear `backend/tests/integration/precio-acordado.test.js` con `test_modificar_precio_del_catalogo_no_altera_el_precio_acordado_de_las_membresias_asignadas`: asignar membresía (precio 800), cambiar el tipo a 1000 y verificar que la membresía conserva `precio_acordado` 800 (FR-005, RN-016). La estabilidad del adeudo ante el cambio de catálogo NO se verifica aquí: corresponde a T035 (US6), cuando `calcularAdeudo` ya usa el precio acordado

### Implementación para la Historia 1

- [X] T010 [US1] Reconciliar la numeración FR citada en los comentarios de `backend/src/services/tipoMembresia.service.js` y `backend/src/routes/tipoMembresia.routes.js` contra el `spec.md` actual (FR-001…FR-005), sin tocar migraciones (supuesto «Numeración de requisitos», research.md R8)
- [X] T011 [US1] Verificar y ajustar si hace falta `backend/src/validators/tipoMembresia.js` para exigir `duracion_dias` y `precio` estrictamente mayores que cero y nombre no vacío (FR-002), manteniendo mensajes comprensibles
- [X] T012 [US1] Ejecutar `npm test` en `backend/` y confirmar verde la suite de tipos de membresía y precio acordado

**Punto de control**: el catálogo valida correctamente y el precio acordado ya no se ve afectado por cambios del catálogo

---

## Fase 4: Historia de Usuario 2 - Asignación de membresía con precio acordado (Prioridad: P2)

**Objetivo**: al asignar una membresía se registra el precio acordado del tipo vigente en el momento de la operación, dentro de la transacción existente (FR-006, FR-007, RN-016, contrato §2.1)

**Prueba independiente**: asignar una membresía con un tipo de precio conocido y verificar que la respuesta incluye `precio_acordado` igual al precio del tipo; enviar `precio_acordado` en la petición y verificar rechazo

### Tests para la Historia 2

- [X] T013 [P] [US2] Ampliar `backend/tests/integration/membresias.test.js` con `test_asignar_membresia_conserva_el_precio_acordado_del_tipo_vigente` (FR-007: el campo se registra igual que `fecha_inicio` y `fecha_fin`)
- [X] T014 [P] [US2] Ampliar `backend/tests/contract/membresias.test.js`: `POST /api/membresias` devuelve `precio_acordado` en `data` (contrato §2.1) y responde 400 si el cliente envía el campo `precio_acordado` en la petición (principio II: el precio lo decide el servidor)

### Implementación para la Historia 2

- [X] T015 [US2] Actualizar `backend/src/models/membresia.model.js`: incluir `precio_acordado` en el INSERT de creación y en los SELECT (reemplazar el JOIN que hoy expone `t.precio` como precio de la membresía)
- [X] T016 [US2] Actualizar `backend/src/services/membresia.service.js::asignarMembresia` para capturar `tipo.precio` dentro de la transacción existente y escribirlo en `precio_acordado` (FR-007, RN-016, research.md R1)
- [X] T017 [US2] Actualizar `backend/src/controllers/membresia.controller.js` para exponer `precio_acordado` en las respuestas de asignación y consulta (contrato §2.1)
- [X] T018 [US2] Ampliar `backend/src/validators/membresia.js` para rechazar con 400 un `precio_acordado` enviado en la petición de asignación o renovación
- [X] T019 [US2] Reconciliar los comentarios con numeración FR antigua en `backend/src/services/membresia.service.js` y `backend/src/models/membresia.model.js` (research.md R8)
- [X] T020 [US2] Ejecutar `npm test` en `backend/` y confirmar verde la suite de membresías

**Punto de control**: la asignación congela el precio; las historias siguientes lo reutilizan

---

## Fase 5: Historia de Usuario 3 - Consulta y estados de membresía (Prioridad: P3)

**Objetivo**: consulta por cliente y por estado, transiciones válidas (suspender, reactivar, cancelar) con rechazos claros y vigencia decidida por fechas + estado (FR-009, FR-010, FR-012, FR-013)

**Prueba independiente**: suspender una activa, reactivar una suspendida, intentar transiciones inválidas y consultar una membresía con estado `activa` pero `fecha_fin` pasada (debe presentarse como vencida)

### Tests para la Historia 3

- [X] T021 [P] [US3] Ampliar `backend/tests/integration/membresias-estados.test.js` con `test_rechaza_transiciones_invalidas_de_estado` (suspender suspendida, reactivar no suspendida, cancelar cancelada → 4xx con mensaje claro) y `test_membresia_activa_con_fecha_fin_vencida_no_esta_vigente` (FR-010, US-S2-03.4)

### Implementación para la Historia 3

- [X] T022 [US3] Verificar en `backend/src/services/membresia.service.js` que las funciones de estado rechazan transiciones inválidas con mensajes claros (FR-012) y ajustar si falta algún caso
- [X] T023 [US3] Verificar en `backend/src/services/acceso.service.js::evaluarMembresia` que la vigencia usa fechas + estado (no solo el texto del estado) y ajustar si hace falta (FR-010, constitución § Membresías punto 3)
- [X] T024 [US3] Ejecutar `npm test` en `backend/` y confirmar verde la suite de estados de membresía

**Punto de control**: estados y vigencia coherentes con la validación de acceso

---

## Fase 6: Historia de Usuario 4 - Renovación con precio del nuevo periodo (Prioridad: P4)

**Objetivo**: la renovación cierra el periodo actual, crea el siguiente de forma continua y registra en él el precio acordado correspondiente (precio del tipo vigente al renovar) (FR-011, US-S2-04.1)

**Prueba independiente**: renovar una membresía tras cambiar el precio del tipo y verificar que el nuevo periodo tiene `precio_acordado` = precio nuevo y que no hay solape de vigencias

### Tests para la Historia 4

- [X] T025 [P] [US4] Ampliar `backend/tests/integration/membresias.test.js` con `test_renovar_registra_el_precio_acordado_del_nuevo_periodo` (cambiar el precio del tipo entre asignación y renovación y verificar ambos `precio_acordado` distintos, sin solape de fechas)

### Implementación para la Historia 4

- [X] T026 [US4] Actualizar `backend/src/services/membresia.service.js::renovarMembresia` para capturar el `precio` vigente del tipo dentro de la transacción y escribirlo en el `precio_acordado` del nuevo periodo (FR-011)
- [X] T027 [US4] Verificar que la renovación conserva el historial y registra auditoría con actor y resultado (FR-011, FR-013) y ajustar si hace falta en `backend/src/services/membresia.service.js`
- [X] T028 [US4] Ejecutar `npm test` en `backend/` y confirmar verde la suite de renovaciones

**Punto de control**: cada periodo registra su propio precio acordado

---

## Fase 7: Historia de Usuario 5 - Registro de pago con protección de duplicados (Prioridad: P3)

**Objetivo**: registrar pagos con importe positivo y relaciones válidas, más la protección de la misma operación registrada más de una vez cuando se provee `id_operacion` (FR-014…FR-017, contrato §1.2)

**Prueba independiente**: registrar un pago con `id_operacion` y repetirlo → 409 sin registro duplicado; pago sin `id_operacion` sigue funcionando (sin regresión)

### Tests para la Historia 5

- [X] T029 [P] [US5] Ampliar `backend/tests/contract/pagos.test.js`: `POST /api/pagos` acepta `id_operacion` opcional (≤ 100 caracteres), devuelve 409 con mensaje claro al repetir `(id_cliente, id_operacion)` y 201 al repetir con `id_operacion` distinto (FR-017, contrato §1.2)
- [X] T030 [P] [US5] Ampliar `backend/tests/integration/pagos.test.js` con `test_rechaza_pago_duplicado_misma_operacion_y_permite_pagos_sin_identificador`

### Implementación para la Historia 5

- [X] T031 [US5] Actualizar `backend/src/models/pago.model.js`: incluir `id_operacion` en el INSERT y manejar el error del índice único `uq_pagos_cliente_operacion` como duplicado detectable
- [X] T032 [US5] Actualizar `backend/src/services/pago.service.js::registrarPago` para detectar el duplicado `(id_cliente, id_operacion)` previo y responder 409 con mensaje comprensible sin crear el registro (FR-017, research.md R3)
- [X] T033 [US5] Ampliar `backend/src/validators/pago.js` para validar `id_operacion` opcional como cadena ≤ 100 caracteres
- [X] T034 [US5] Ejecutar `npm test` en `backend/` y confirmar verde la suite de pagos

**Punto de control**: pagos protegidos contra registros accidentales repetidos

---

## Fase 8: Historia de Usuario 6 - Adeudos calculados con precio acordado (Prioridad: P4)

**Objetivo**: el saldo pendiente usa `precio_acordado` de la membresía menos sus pagos válidos, sin valores negativos e inmutable ante cambios del catálogo (FR-018, FR-019, FR-020, RN-006)

**Prueba independiente**: con pagos parciales, el adeudo = `precio_acordado − pagos`; cambiar el precio del tipo no lo altera; cliente solo ve lo propio y el recepcionista no accede a la visión global (E1)

### Tests para la Historia 6

- [X] T035 [P] [US6] Ampliar `backend/tests/integration/adeudos.test.js` con `test_adeudo_usa_el_precio_acordado_y_no_el_precio_del_catalogo` (pagos parciales + cambio de precio del tipo sin efecto en el adeudo — aserción de estabilidad reservada aquí desde T009/US1, SC-010) y `test_recepcionista_no_accede_a_la_vision_global_de_adeudos` (E1 → 403)

### Implementación para la Historia 6

- [X] T036 [US6] Actualizar `backend/src/services/pago.service.js` (`calcularAdeudo`, `listarAdeudos`, `listarAdeudosPorCorreo`) para usar `membresia.precio_acordado` en lugar del precio del tipo: `adeudo = Math.max(0, precio_acordado − totalPagado)` (FR-018, contrato §2.2)
- [X] T037 [US6] Verificar en `backend/src/models/membresia.model.js` que los SELECT usados por los adeudos devuelven `precio_acordado` y ajustar si hace falta
- [X] T038 [US6] Ejecutar `npm test` en `backend/` y confirmar verde la suite de adeudos

**Punto de control**: el control financiero es estable ante cambios del catálogo

---

## Fase 9: Historia de Usuario 7 - Registro de información facial y documentación (Prioridad: P3)

**Objetivo**: registro facial único por cliente con autorización documentada, sin exponer jamás el descriptor, y la documentación de la tecnología con sus limitaciones (FR-021…FR-026)

**Prueba independiente**: revisar las respuestas de registro/consulta de rostro y los logs: cero datos biométricos; leer `docs/tecnologia-reconocimiento-facial.md` con requisitos de instalación y limitaciones

### Tests para la Historia 7

- [X] T039 [P] [US7] Ampliar `backend/tests/contract/rostros.test.js`: ninguna respuesta de `GET/POST /api/clientes/:id/rostro` incluye `descriptor_facial` ni imágenes (FR-024, SC-004), y la auditoría del registro no contiene biométricos (FR-025)

### Implementación para la Historia 7

- [X] T040 [US7] Crear `docs/tecnologia-reconocimiento-facial.md` según research.md R4: face-api.js + TensorFlow.js en navegador, modelos en `frontend/public/modelos/` (tinyFaceDetector, faceLandmark68Net, faceRecognitionNet), descriptor de 128 números, distancia euclidiana en servidor, umbral `FACE_MATCH_THRESHOLD` (0,5), requisitos (cámara, HTTPS/localhost, permisos) y limitaciones observadas (iluminación, gafas, tapabocas, ángulo), sin afirmar precisión absoluta (FR-026, FR-047)
- [X] T041 [US7] Reconciliar los comentarios con numeración antigua en `backend/src/services/rostro.service.js`, `backend/src/routes/rostro.routes.js` y `backend/src/utils/matchRostro.js` (research.md R8)
- [X] T042 [US7] Ejecutar `npm test` en `backend/` y confirmar verde la suite de rostros e identificación

**Punto de control**: privacidad biométrica verificada y tecnología documentada

---

## Fase 10: Historia de Usuario 8 - Validación de acceso y autorización manual (Prioridad: P2)

**Objetivo**: el kiosco identifica y decide con las reglas ya consolidadas; cuando el rostro no se identifica muestra «No se pudo identificar su rostro, acuda a recepción» sin autorizar por sí mismo; la recepción registra autorizaciones o rechazos manuales con usuario responsable, verificación de identidad y vigencia, y sin biométricos (FR-027…FR-034, RN-017, contrato §1.1)

**Prueba independiente**: con sesión de recepcionista, `POST /api/acceso/manual` autoriza a un cliente con membresía vigente (registro con `origen='manual'` e `id_usuario`), rechaza con 409 a uno sin vigencia, responde 401 sin sesión y 403 a entrenador o cliente

### Tests para la Historia 8

- [X] T043 [P] [US8] Crear `backend/tests/contract/acceso-manual.test.js` con los casos del contrato §1.1: 401 sin sesión, 403 para `entrenador` y `cliente`, 400 por campos inválidos (falta `id_cliente` o `resultado` inválido; `motivo` obligatorio cuando `resultado="rechazado"`), 404 por cliente inexistente, 409 por membresía no vigente al autorizar, 201 para autorizado y 201 para rechazo con motivo
- [X] T044 [P] [US8] Crear `backend/tests/integration/acceso-manual.test.js` con `test_autorizacion_manual_registra_origen_usuario_resultado_y_motivo` (verificar `origen='manual'`, `id_usuario` del responsable, fecha/hora, motivo en rechazo y registro de auditoría con actor — SC-009, SC-011) y `test_autorizacion_manual_no_almacena_datos_biometricos`
- [X] T045 [P] [US8] Crear `frontend/src/pages/PuntoAcceso.test.jsx` con `test_muestra_mensaje_acuda_a_recepcion_cuando_el_rostro_no_se_identifica` (FR-030)

### Implementación para la Historia 8

- [X] T046 [US8] Actualizar `backend/src/models/acceso.model.js`: INSERT con `origen` e `id_usuario` (patrón de `auditoria.id_usuario`), conservando el INSERT del kiosco con `origen='kiosco'` e `id_usuario` NULL (data-model.md §2.5, §3.2)
- [X] T047 [US8] Implementar `backend/src/services/acceso.service.js::autorizarAccesoManual`: validar cliente existente; si `resultado="autorizado"`, reutilizar `evaluarMembresia` y responder 409 si no está vigente; insertar el registro con `origen='manual'` y el `id_usuario` de la sesión; registrar auditoría con actor sin interrumpir la operación si falla (FR-030, FR-040, research.md R2/R5)
- [X] T048 [US8] Crear `backend/src/controllers/accesoManual.controller.js` siguiendo el patrón de los controllers existentes (transforma req/res y llama al servicio)
- [X] T049 [US8] Crear `backend/src/validators/accesoManual.js` con express-validator: `id_cliente` entero > 0, `resultado` ∈ {`autorizado`,`rechazado`}, `motivo` cadena ≤ 100 obligatoria si `rechazado` (data-model.md §3.2, R10)
- [X] T050 [US8] Actualizar `backend/src/routes/acceso.routes.js`: montar `POST /api/acceso/manual` con `autenticar` + `autorizar('administrador','recepcionista')` y las cadenas del validator, sin modificar el endpoint del kiosco `POST /intento` (E2)
- [X] T051 [US8] Ampliar `backend/src/utils/catalogos.js` (`MOTIVOS_RECHAZO`) con los motivos de rechazo manual («identidad no verificable», «membresía no vigente») dentro de los 100 caracteres de `motivo_rechazo` (research.md R10)
- [X] T052 [US8] Crear `frontend/src/pages/AutorizarIngreso.jsx`: formulario de autorización manual (buscar cliente, mostrar su membresía vigente, elegir autorizado/rechazado con motivo) que llama a `POST /api/acceso/manual` vía `frontend/src/services/api.js`, con mensajes de error del servidor y confirmación de la operación (FR-030, FR-044)
- [X] T053 [US8] Registrar la ruta `/autorizar-ingreso` en `frontend/src/App.jsx` protegida para `administrador` y `recepcionista` con el patrón `RutaRol` existente, y verificar el mensaje «No se pudo identificar su rostro, acuda a recepción» en `frontend/src/pages/PuntoAcceso.jsx` (ajustar si no está textual)
- [X] T054 [US8] Ejecutar `npm test` en `backend/` y `npm test` en `frontend/` y confirmar verde las suites de acceso y kiosco

**Punto de control**: el procedimiento alternativo de acceso (decisión Q1, opción A) queda implementado y trazado

---

## Fase 11: Historia de Usuario 9 - Historial de accesos con origen y responsable (Prioridad: P4)

**Objetivo**: el historial muestra todos los intentos (kiosco y manuales) con fecha, hora, resultado, motivo, origen y usuario responsable, con filtros y permisos por rol (FR-034, FR-035, FR-036, E3)

**Prueba independiente**: tras ejecutar intentos del kiosco y registrar los manuales, el historial muestra ambos con sus campos; el cliente solo ve los suyos y no existe operación de edición o borrado

### Tests para la Historia 9

- [X] T055 [P] [US9] Ampliar `backend/tests/integration/accesos-consulta.test.js` con `test_historial_incluye_origen_y_usuario_responsable_de_autorizaciones_manuales` y `test_cliente_solo_ve_sus_propios_accesos_con_los_campos_nuevos`
- [X] T056 [P] [US9] Ampliar `backend/tests/contract/accesos-consulta.test.js`: los registros de `GET /api/accesos` y `GET /api/accesos/mio` incluyen `origen` e `id_usuario` (contrato §2.3)

### Implementación para la Historia 9

- [X] T057 [US9] Actualizar `backend/src/models/acceso.model.js` (consultas) y `backend/src/controllers/accesoConsulta.controller.js` para devolver `origen`, `id_usuario` y `usuario_nombre` (JOIN con `usuarios`, solo el nombre) junto a los campos existentes (contrato §2.3)
- [X] T058 [US9] Actualizar `frontend/src/pages/Accesos.jsx` y `frontend/src/pages/MisAccesos.jsx` para mostrar la columna de origen (kiosco/manual) y el usuario responsable cuando corresponda, con estado vacío comprensible (FR-044)
- [X] T059 [US9] Ejecutar `npm test` en `backend/` y confirmar verde la suite de consulta de accesos

**Punto de control**: trazabilidad completa de accesos automáticos y manuales

---

## Fase 12: Historia de Usuario 10 - Rediseño de la zona autenticada y pantalla de inicio (Prioridad: P4)

**Objetivo**: menú lateral izquierdo con opciones por rol, página independiente por módulo, pantalla de inicio con bienvenida personalizada, tarjetas de estadísticas con datos reales e imágenes de gimnasio, responsive ≤768 px y `prefers-reduced-motion` (FR-041…FR-045)

**Prueba independiente**: iniciar sesión con cada rol y verificar menú solo con sus opciones, dashboard con datos reales comparables contra los endpoints, operaciones existentes intactas y sin desbordamientos a 768 px

### Tests para la Historia 10

- [X] T060 [P] [US10] Crear `frontend/src/pages/Inicio.test.jsx` con `test_muestra_bienvenida_y_tarjetas_con_datos_reales_por_rol` (mock de `frontend/src/services/api.js`) y `test_no_presenta_datos_ficticios_como_reales`
- [X] T061 [P] [US10] Crear `frontend/src/components/Layout.test.jsx` con `test_menu_lateral_muestra_solo_las_opciones_del_rol`

### Implementación para la Historia 10

- [X] T062 [P] [US10] Agregar imágenes decorativas de gimnasio propias en `frontend/public/img/` (assets locales, sin servicios externos; ver research.md R7)
- [X] T063 [US10] Rediseñar `frontend/src/components/Layout.jsx` como shell con menú lateral izquierdo colapsable en ≤768 px, opciones filtradas por rol y enlace a la nueva página de inicio, sin modificar `frontend/src/services/api.js` ni `frontend/src/context/AuthContext.jsx` (FR-041, FR-043, FR-045)
- [X] T064 [US10] Crear `frontend/src/pages/Inicio.jsx`: bienvenida con el nombre del usuario del `AuthContext` y tarjetas de estadísticas con datos REALES de los endpoints existentes por rol (contrato §3, research.md R7), con estados vacíos y errores comprensibles (FR-042, FR-044)
- [X] T065 [US10] Actualizar `frontend/src/App.jsx`: la ruta `/` renderiza `Inicio.jsx` para usuarios autenticados conservando intactas todas las rutas, validaciones y mensajes existentes (FR-043, escenario US-S2-10.3)
- [X] T066 [US10] Agregar los estilos del rediseño (tema oscuro con acento naranja `#f05a24`, fondo `#0a0b0e`) respetando `prefers-reduced-motion` y sin desbordamientos horizontales hasta 768 px, en los archivos de estilo existentes del frontend (FR-044, constitución § Diseño visual)
- [ ] T067 [US10] Ejecutar `npm test` en `frontend/` y una prueba manual de humo: login, usuarios, clientes, membresías, pagos y accesos siguen operativos con el mismo comportamiento (FR-043)

**Punto de control**: interfaz unificada sin regresiones funcionales

---

## Fase 13: Pulido y preocupaciones transversales

**Propósito**: verificación global, alineación documental y evidencias

- [X] T068 Ejecutar la suite completa del backend (`npm test` en `backend/`) y del frontend (`npm test` en `frontend/`) con todas las migraciones 004–006 aplicadas en `gym_db_pruebas`, confirmando SC-008 (todo verde)
- [X] T069 [P] Reconciliar los comentarios restantes con numeración FR/RN antigua en todo `backend/src/` (búsqueda por patrones de numeración previa) contra `spec.md`, sin tocar migraciones (research.md R8)
- [X] T070 [P] Verificar la alineación de `docs/reglas.md` y `docs/project-context.md` con el comportamiento implementado del Sprint 2 y actualizar solo lo que contradiga (constitución V, punto 4)
- [X] T071 Registrar los resultados de la validación V1–V7 de `quickstart.md` en `specs/002-sprint-2-membresias-pagos-reconocimiento-acceso/validacion-manual.md` (fecha, entorno `gym_db_pruebas`, comandos y resultado por escenario), sin ejecutar nada sobre `gym_db`
- [X] T072 Revisar la consistencia final: `spec.md`, `data-model.md`, `contracts/api-sprint2.md` y `quickstart.md` contra el código implementado; confirmar que `checklists/requirements.md` sigue en verde y que no quedan marcadores `[NEEDS CLARIFICATION]`

---

## Dependencias y orden de ejecución

### Dependencias por fase

- **Fase 1 (Configuración)**: sin dependencias — puede comenzar de inmediato
- **Fase 2 (Fundacional)**: depende de la Fase 1 — **bloquea** US2, US3, US4, US5, US6, US8 y US9 (T003–T007)
- **Fases 3–11 (Historias)**: dependen de la Fase 2; US7 (Fase 9) y US10 (Fase 12) solo dependen de la Fase 1
- **Fase 13 (Pulido)**: depende de todas las historias que se decidan implementar

### Dependencias entre historias

- **US1 (P1)**: tras la Fundacional; sin dependencias de otras historias → **MVP**
- **US2 (P2)**: tras la Fundacional; base para US3, US4 y US6
- **US3 (P3)**: conviene después de US2 (mismos fixtures de membresías)
- **US4 (P4)**: después de US2 (renueva membresías con `precio_acordado`)
- **US5 (P3)**: tras la Fundacional; independiente de US2–US4
- **US6 (P4)**: después de US2 y US5 (adeudo = `precio_acordado` − pagos)
- **US7 (P3)**: independiente (sin dependencias de esquema)
- **US8 (P2)**: tras la Fundacional (migración 005); independiente de US2–US6
- **US9 (P4)**: después de US8 (muestra los registros manuales)
- **US10 (P4)**: independiente; solo necesita la Fase 1

### Orden sugerido (por prioridad)

Fundacional → US1 (P1) → US2 (P2) → US8 (P2) → US3 (P3) → US5 (P3) → US7 (P3) → US4 (P4) → US6 (P4) → US9 (P4) → US10 (P4) → Pulido

### Oportunidades de paralelismo

- Fase 2: T003, T004 y T005 en paralelo (archivos de migración distintos); T006 y T007 tras ellas
- Cada historia: todos los tasks de tests [P] en paralelo antes que la implementación
- Historias sin dependencia cruzada: US5 ∥ US7 ∥ US8 y US7 ∥ US10 en paralelo
- Pulido: T069 ∥ T070 en paralelo

---

## Ejemplo de paralelismo: Historia de Usuario 8

```bash
# Lanzar juntos los tests de la US8 (archivos distintos):
Tarea: "Contract test para POST /api/acceso/manual en backend/tests/contract/acceso-manual.test.js"
Tarea: "Integration test de autorización manual en backend/tests/integration/acceso-manual.test.js"
Tarea: "Component test del kiosco en frontend/src/pages/PuntoAcceso.test.jsx"

# Lanzar juntos model + validator + catalogos (archivos distintos):
Tarea: "Actualizar backend/src/models/acceso.model.js con origen e id_usuario"
Tarea: "Crear backend/src/validators/accesoManual.js"
Tarea: "Ampliar backend/src/utils/catalogos.js con motivos manuales"
```

---

## Estrategia de implementación

### MVP primero (solo Historia 1)

1. Completar Fase 1: Configuración
2. Completar Fase 2: Fundacional (CRÍTICA — bloquea la mayoría de historias)
3. Completar Fase 3: Historia 1 (catálogo + precio acordado estable)
4. **PARAR y VALIDAR**: probar la Historia 1 de forma independiente (V1 parcial del quickstart)
5. Desplegar/demostrar si está listo

### Entrega incremental

1. Configuración + Fundacional → base lista
2. + US1 → probar independiente → demo
3. + US2 → probar independiente → demo (precio acordado en asignación)
4. + US8 → probar independiente → demo (autorización manual operativa)
5. + US3, US5, US7 → probar cada una → demo
6. + US4, US6 → flujo financiero completo → demo
7. + US9 → trazabilidad completa
8. + US10 → rediseño sin regresiones
9. Pulido → cierre con evidencias (V1–V7, SC-008)

Cada historia agrega valor sin romper las anteriores.

### Estrategia de equipo en paralelo

Con varios desarrolladores:

1. El equipo completa Configuración + Fundacional
2. Una vez Fundacional lista:
   - Desarrollador A: US2 → US4 → US6 (cadena financiera)
   - Desarrollador B: US8 → US9 (cadena de acceso)
   - Desarrollador C: US1, US5, US7 y US10 (independientes)
3. Historias terminadas e integradas de forma independiente

---

## Notas

- Los tasks [P] = archivos distintos, sin dependencias
- La etiqueta [Historia] vincula cada tarea a su historia para trazabilidad
- Cada historia es completable y testeable de forma independiente
- Los tests se escriben ANTES de la implementación dentro de cada historia (FR-046)
- **Protecciones inquebrantables**: nunca editar `database/migrations/001–003`; nunca operar sobre `gym_db`; toda prueba y migración usa `gym_db_pruebas` con `.env.test`; el backend solo arranca con el entorno de pruebas durante el sprint (FR-048, constitución III y V)
- Commits con Conventional Commits en español: `feat(alcance): descripción en infinitivo`, por ejemplo `feat(membresias): congelar precio acordado al asignar y renovar`
- Parar en cada punto de control para validar la historia de forma independiente
- Evitar: tareas vagas, conflictos de archivo y dependencias cruzadas que rompan la independencia
