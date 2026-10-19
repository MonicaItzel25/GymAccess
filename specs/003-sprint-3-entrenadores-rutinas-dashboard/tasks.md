---
description: "Lista de tareas de implementación del Sprint 3 — Entrenadores, rutinas, catálogo de ejercicios y dashboard administrativo"
---

# Tasks: Sprint 3 — Entrenadores, rutinas, catálogo de ejercicios y dashboard administrativo

**Input**: Documentos de diseño de `/specs/003-sprint-3-entrenadores-rutinas-dashboard/`

**Prerequisites**: plan.md (requerido), spec.md (historias), research.md, data-model.md, contracts/api.md, quickstart.md, `.specify/memory/constitution.md`

**Tests**: Las pruebas SÍ se incluyen porque la especificación las exige explícitamente (FR-038: «El sprint DEBE cubrir con pruebas los casos exitosos, los errores de validación, los permisos por rol y los accesos no autorizados»; SC-008). Se escriben ANTES de la implementación de cada historia y deben FALLAR hasta que la historia esté completa.

**Organization**: Las tareas están agrupadas por historia de usuario (orden del spec: US1…US9) para permitir implementación y prueba independientes de cada una.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias)
- **[Story]**: Historia de usuario a la que pertenece la tarea (US1…US9)
- Cada tarea incluye la ruta exacta del archivo

## Path Conventions

- **Web app**: `backend/src/`, `backend/tests/`, `frontend/src/` (según plan.md)
- Convención de pruebas backend: `backend/tests/contract/<modulo>.contract.test.js`, `backend/tests/integration/<modulo>.integration.test.js`, `backend/tests/unit/validadores.test.js`
- Convención de pruebas frontend: colocadas junto a la pantalla, `frontend/src/pages/<Pantalla>.test.jsx`

---

## Fase 1: Preparación (Setup compartido)

**Propósito**: verificar el entorno y los insumos antes de tocar código (constitución V: leer `docs/project-context.md`, `docs/reglas.md` y el documento de entrada del sprint).

- [ ] T001 Revisar los insumos del sprint (`docs/sprint-3.md`, `docs/reglas.md`, `docs/project-context.md`, `.specify/memory/constitution.md`) y confirmar que el alcance a implementar coincide con `specs/003-sprint-3-entrenadores-rutinas-dashboard/spec.md`
- [ ] T002 Verificar el entorno de pruebas: `backend/.env.test` apunta a `gym_db_pruebas` (nunca `gym_db`) y el backend arranca con `node --env-file=.env.test src/server.js` según `specs/003-sprint-3-entrenadores-rutinas-dashboard/quickstart.md` §1–§3
- [ ] T003 [P] Establecer línea base verde: ejecutar `npm test` en `backend/` y `frontend/` y confirmar 100% de suites de los Sprints 1 y 2 en verde antes de iniciar cambios (regresión de referencia para SC-008/SC-010 en `backend/tests/`)

---

## Fase 2: Fundacional (Prerrequisitos bloqueantes)

**Propósito**: esquema y ayuda de pruebas compartidos que TODAS las historias necesitan.

**?? CRÍTICO**: ninguna historia puede comenzar hasta completar esta fase.

- [ ] T004 Crear la migración `database/migrations/007_crear_tablas_sprint3.sql` con las 7 tablas de `data-model.md` §1–§6 (`entrenadores`, `asignaciones_entrenador`, `ejercicios`, `rutinas`, `ejercicio_rutina`, `objetivos`, `progresos`); SIN `USE gym_db;` (convención de `data-model.md` §0, patrón de las migraciones 004–006), con PK/FK `ON DELETE RESTRICT ON UPDATE CASCADE`, `KEY idx_*`, `UNIQUE uq_entrenadores_usuario (id_usuario)`, `UNIQUE uq_ejercicios_nombre (nombre)`, columna generada `esta_vigente` + `UNIQUE (id_cliente, esta_vigente)` y columna generada `esta_activa` + `UNIQUE (id_cliente, esta_activa)` (research R-03)
- [ ] T005 Aplicar la migración SOLO en `gym_db_pruebas`: desde `backend/` ejecutar `node --env-file=.env.test ../database/migrate.mjs` y verificar la salida «+ Aplicado: 007_crear_tablas_sprint3.sql»; comprobar además que `gym_db.migraciones` NO contiene la 007 (FR-037; ejecutar `npm run migrar` sin `.env.test` está prohibido)
- [ ] T006 [P] Ampliar `backend/tests/helpers/baseDatos.js` (`vaciarTablas()`) con las 7 tablas nuevas, conservando la guarda `verificarBasePruebas()` intacta

**Punto de verificación**: base de pruebas con las 7 tablas y helper de pruebas al día; las historias pueden empezar en paralelo.

---

## Fase 3: Historia 1 — Registro de entrenadores (Prioridad: P1) ?? MVP

**Goal**: el administrador registra, edita y activa/desactiva perfiles de entrenador vinculados a cuentas existentes con rol `entrenador` (US-S3-01).

**Independent Test**: con una cuenta `entrenador` sin perfil, el administrador crea el perfil y aparece en el listado; una cuenta con otro rol es rechazada; un recepcionista recibe 403 (`contracts/api.md` §1).

### Pruebas para la Historia 1 (solicitadas por FR-038) ??

> **NOTA**: escribir estas pruebas PRIMERO y verificar que FALLAN antes de la implementación.

- [ ] T007 [P] [US1] Prueba de contrato en `backend/tests/contract/entrenadores.contract.test.js`: alta 201 con cuenta rol `entrenador`, perfil duplicado 400, cuenta con otro rol 400 con mensaje claro (US-S3-01.2), `id_usuario` inexistente 404, 403 para recepcionista/entrenador/cliente en escritura (US-S3-01.3), `GET` permitido a administrador y recepcionista
- [ ] T008 [P] [US1] Prueba de integración en `backend/tests/integration/entrenadores.integration.test.js`: modificar información y cambiar estado (US-S3-01.4) y verificar que ambas acciones quedan en `auditoria` con actor, acción, fecha/hora, entidad y resultado (FR-004, SC-005)
- [ ] T009 [P] [US1] Prueba frontend en `frontend/src/pages/Entrenadores.test.jsx`: listado, alta desde formulario, mensaje de error en rechazo y estado vacío

### Implementación para la Historia 1

- [ ] T010 [P] [US1] Crear el modelo `backend/src/models/entrenador.model.js` con las columnas de `data-model.md` §1 (`id_usuario UNIQUE`, `especialidad VARCHAR(150) NULL`, `telefono VARCHAR(20) NULL`, `estado ENUM('activo','inactivo')`, `fecha_creacion`) y operaciones listar/obtener/crear/actualizar/cambiar estado
- [ ] T011 [P] [US1] Crear los validadores `backend/src/validators/entrenador.validators.js` con `express-validator`: `id_usuario` entero > 0; `especialidad` opcional ≤ 150; `telefono` opcional ≤ 20; `estado` solo `activo|inactivo`
- [ ] T012 [US1] Crear el servicio `backend/src/services/entrenador.service.js`: exige que la cuenta exista, tenga `rol = 'entrenador'` y no tenga ya perfil (FR-001/RN-002); registra auditoría con `registrarAccion` en crear/modificar/cambiar estado (FR-004)
- [ ] T013 [US1] Crear el controlador `backend/src/controllers/entrenador.controller.js` con `enviarOk`/`envolverControlador` (`backend/src/utils/response.js`)
- [ ] T014 [US1] Crear las rutas `backend/src/routes/entrenador.routes.js` (`GET /` y `GET /:id` → `autorizar('administrador','recepcionista')`; `POST /`, `PUT /:id`, `PUT /:id/estado` → `autorizar('administrador')`) y montarlas en `backend/src/app.js` bajo `/api/entrenadores`
- [ ] T015 [P] [US1] Añadir los métodos de este módulo en `frontend/src/services/api.js` (`listarEntrenadores`, `crearEntrenador`, `actualizarEntrenador`, `cambiarEstadoEntrenador`) según `contracts/api.md` §1
- [ ] T016 [US1] Crear la pantalla `frontend/src/pages/Entrenadores.jsx` (listado con estado y especialidad, alta desde cuenta existente, edición, activar/desactivar, estados vacíos y mensajes de error, estética Dark Fitness y `prefers-reduced-motion`)
- [ ] T017 [US1] Registrar la ruta y el menú solo para administrador en `frontend/src/App.jsx` y `frontend/src/components/Layout.jsx` (la ocultación es ayuda visual; la autorización real está en T014)

**Punto de verificación**: Historia 1 funcional y testeable de forma independiente (US-S3-01 completa).

---

## Fase 4: Historia 2 — Asignación de entrenador a cliente (Prioridad: P1)

**Goal**: administrador/recepcionista asignan un entrenador activo a un cliente activo y finalizan asignaciones, con una única asignación vigente por cliente (US-S3-02).

**Independent Test**: asignación creada como `vigente` con fecha de inicio; la segunda asignación vigente del mismo cliente se rechaza (SC-003); finalizar conserva el historial; un entrenador autenticado recibe 403.

### Pruebas para la Historia 2 (solicitadas por FR-038) ??

> **NOTA**: escribir estas pruebas PRIMERO y verificar que FALLAN antes de la implementación.

- [ ] T018 [P] [US2] Prueba de contrato en `backend/tests/contract/asignaciones.contract.test.js`: `POST` 201, segunda vigente 400 (US-S3-02.2), cliente/entrenador inexistente 404, entrenador inactivo 400 (US-S3-02.3), `PUT /:id/finalizar` 200 y 400 si ya estaba finalizada, 403 para entrenador y cliente (US-S3-02.5)
- [ ] T019 [P] [US2] Prueba de integración en `backend/tests/integration/asignaciones.integration.test.js`: alta y finalización registran auditoría con actor/acción/fecha/entidad/resultado (FR-009, SC-005) y el `GET` devuelve nombre del cliente (incluido el filtro `vigentes=true`)
- [ ] T020 [P] [US2] Prueba frontend en `frontend/src/pages/Asignaciones.test.jsx`: formulario de alta, rechazo mostrado y confirmación de finalización

### Implementación para la Historia 2

- [ ] T021 [P] [US2] Crear el modelo `backend/src/models/asignacion.model.js` con `data-model.md` §2: alta validada y registrada en transacción contra `UNIQUE (id_cliente, esta_vigente)`, finalizar con `fecha_fin`, listado con filtros `entrenador`/`vigentes` y nombre del cliente (`JOIN clientes`)
- [ ] T022 [P] [US2] Crear los validadores `backend/src/validators/asignacion.validators.js`: `id_cliente` e `id_entrenador` enteros > 0; `fecha_inicio`/`fecha_fin` fechas `YYYY-MM-DD` opcionales
- [ ] T023 [US2] Crear el servicio `backend/src/services/asignacion.service.js`: cliente `activo`, entrenador registrado y `activo`, rechazo de segunda asignación vigente (FR-006), finalización que rellena `fecha_fin` (FR-007) y auditoría (FR-009)
- [ ] T024 [US2] Crear el controlador `backend/src/controllers/asignacion.controller.js`
- [ ] T025 [US2] Crear las rutas `backend/src/routes/asignacion.routes.js` (`GET /` → `administrador|recepcionista|entrenador` con retorno limitado a las propias para el entrenador según `contracts/api.md` §2; `POST /` y `PUT /:id/finalizar` → `administrador|recepcionista`) y montarlas en `backend/src/app.js` bajo `/api/asignaciones`
- [ ] T026 [P] [US2] Añadir los métodos en `frontend/src/services/api.js` (`listarAsignaciones`, `crearAsignacion`, `finalizarAsignacion`)
- [ ] T027 [US2] Crear la pantalla `frontend/src/pages/Asignaciones.jsx` (alta de entrenador a cliente, listado con historial y estados, finalización con confirmación, errores comprensibles)
- [ ] T028 [US2] Registrar la ruta y el menú para administrador y recepcionista en `frontend/src/App.jsx` y `frontend/src/components/Layout.jsx`

**Punto de verificación**: Historia 2 funcional; las historias 1 y 2 operan juntas sin interferencias.

---

## Fase 5: Historia 3 — Catálogo de ejercicios reutilizable (Prioridad: P1)

**Goal**: catálogo independiente administrado solo por el administrador; el entrenador lo consulta y usa (US-S3-08, Clarification Q2).

**Independent Test**: el administrador crea un ejercicio, el entrenador lo ve completo y puede usarlo en una rutina; desactivarlo lo retira de rutinas nuevas pero lo conserva en existentes; escritura del entrenador/recepcionista/cliente → 403.

### Pruebas para la Historia 3 (solicitadas por FR-038) ??

> **NOTA**: escribir estas pruebas PRIMERO y verificar que FALLAN antes de la implementación.

- [ ] T029 [P] [US3] Prueba de contrato en `backend/tests/contract/ejercicios.contract.test.js`: `POST` 201, nombre duplicado 400, campos vacíos 400, 403 para recepcionista y cliente en escritura (US-S3-08.4), 403 para entrenador en escritura (US-S3-08.5), `GET` del entrenador solo con ejercicios `activo` (FR-012)
- [ ] T030 [P] [US3] Prueba de integración en `backend/tests/integration/ejercicios.integration.test.js`: crear y modificar quedan en auditoría (FR-013) y la desactivación deja el ejercicio inactivo sin borrarlo (SC-004)
- [ ] T031 [P] [US3] Prueba frontend en `frontend/src/pages/Ejercicios.test.jsx`: CRUD del administrador y vista de solo lectura para entrenador

### Implementación para la Historia 3

- [ ] T032 [P] [US3] Crear el modelo `backend/src/models/ejercicio.model.js` con `data-model.md` §3 (`nombre VARCHAR(100) NOT NULL UNIQUE`, `descripcion VARCHAR(255) NOT NULL`, `grupo_muscular VARCHAR(50) NULL`, `estado ENUM('activo','inactivo')`) y filtro de estado
- [ ] T033 [P] [US3] Crear los validadores `backend/src/validators/ejercicio.validators.js`: `nombre` no vacío ≤ 100, `descripcion` no vacía ≤ 255, `grupo_muscular` opcional ≤ 50, `estado` solo `activo|inactivo`
- [ ] T034 [US3] Crear el servicio `backend/src/services/ejercicio.service.js`: escritura exclusiva del administrador, unicidad de nombre con mensaje claro, filtro de solo `activo` para el entrenador (Clarification Q2) y auditoría (FR-013)
- [ ] T035 [US3] Crear el controlador `backend/src/controllers/ejercicio.controller.js`
- [ ] T036 [US3] Crear las rutas `backend/src/routes/ejercicio.routes.js` (`GET /` → `administrador|entrenador`; `POST /`, `PUT /:id`, `PUT /:id/estado` → `autorizar('administrador')`) y montarlas en `backend/src/app.js` bajo `/api/ejercicios`
- [ ] T037 [P] [US3] Añadir los métodos en `frontend/src/services/api.js` (`listarEjercicios`, `crearEjercicio`, `actualizarEjercicio`, `cambiarEstadoEjercicio`)
- [ ] T038 [US3] Crear la pantalla `frontend/src/pages/Ejercicios.jsx` (CRUD del administrador; para el entrenador, catálogo de solo lectura sin controles de escritura)
- [ ] T039 [US3] Registrar la ruta y el menú para administrador y entrenador en `frontend/src/App.jsx` y `frontend/src/components/Layout.jsx`

**Punto de verificación**: Historia 3 funcional; el catálogo es reutilizable por las rutinas (Historia 4).

---

## Fase 6: Historia 4 — Creación de rutinas de entrenamiento (Prioridad: P1)

**Goal**: el entrenador crea y modifica rutinas con ejercicios del catálogo para sus clientes asignados, con una única rutina activa por cliente y continuidad tras reasignación (US-S3-03, Clarifications Q1/Q5).

**Independent Test**: con asignación vigente y ejercicios activos, la rutina se crea con sus parámetros; sin asignación → 403; ejercicio inactivo → 400; al activar una nueva, la anterior queda inactiva; recepcionista/cliente → 403.

### Pruebas para la Historia 4 (solicitadas por FR-038) ??

> **NOTA**: escribir estas pruebas PRIMERO y verificar que FALLAN antes de la implementación.

- [ ] T040 [P] [US4] Prueba de contrato en `backend/tests/contract/rutinas.contract.test.js`: `POST` 201 con asignación vigente, 403 sin asignación (US-S3-03.2), 403 para un entrenador desactivado con asignación vigente (FR-003), 400 con ejercicio `inactivo` (US-S3-03.3), 400 con parámetros inválidos (series/repeticiones < 1, peso/descanso < 0, `instrucciones` vacío), 403 para recepcionista/cliente/administrador (US-S3-03.5), `PATCH /:id/estado` 200
- [ ] T041 [P] [US4] Prueba de integración en `backend/tests/integration/rutinas.integration.test.js`: activar una rutina nueva deja la anterior `inactiva` (solo una activa por cliente, Q5/SC-003), modificar conserva el historial de versiones (FR-015), un entrenador con cliente reasignado puede consultar y modificar la rutina creada por otro (Q1, FR-017) y las acciones quedan en auditoría (FR-018)
- [ ] T042 [P] [US4] Prueba frontend en `frontend/src/pages/Rutinas.test.jsx`: creación con ejercicios, activación y estados de error

### Implementación para la Historia 4

- [ ] T043 [P] [US4] Crear el modelo `backend/src/models/rutina.model.js` con `data-model.md` §4: tabla `rutinas` (columna generada `esta_activa` + `UNIQUE (id_cliente, esta_activa)`, `fecha_creacion`, `fecha_actualizacion`, `fecha_activacion`) y `ejercicio_rutina` (PK surrogate `id_rutina_ejercicio`, `orden`, `series`, `repeticiones`, `peso_recomendado DECIMAL(6,2) NULL`, `descanso_segundos INT NULL`, `instrucciones TEXT NULL`), con transacción de activación
- [ ] T044 [P] [US4] Crear los validadores `backend/src/validators/rutina.validators.js`: `nombre` no vacío ≤ 100; `ejercicios` con al menos una fila; por fila `series`/`repeticiones` enteros 1–999, `peso_recomendado` 0–999.99, `descanso_segundos` 0–3600, `instrucciones` no vacío cuando se capture (FR-016, RN-007, research R-10)
- [ ] T045 [US4] Crear el servicio `backend/src/services/rutina.service.js`: exige asignación vigente con el cliente y entrenador activo, aunque la rutina la creara otro entrenador (Q1/FR-017; FR-003), rechaza ejercicios `inactivo` en rutinas nuevas (RN-008), activación transaccional que desactiva la anterior (Q5/FR-015) y auditoría (FR-018)
- [ ] T046 [US4] Crear el controlador `backend/src/controllers/rutina.controller.js`
- [ ] T047 [US4] Crear las rutas `backend/src/routes/rutina.routes.js` (`GET /`, `GET /:id`, `POST /`, `PUT /:id`, `PATCH /:id/estado` → todos `autorizar('entrenador')`) y montarlas en `backend/src/app.js` bajo `/api/rutinas`
- [ ] T048 [P] [US4] Añadir los métodos en `frontend/src/services/api.js` (`listarRutinas`, `obtenerRutina`, `crearRutina`, `actualizarRutina`, `cambiarEstadoRutina`) y `listarAsignaciones` para poblar el selector de clientes propios (contracts §2, rol entrenador)
- [ ] T049 [US4] Crear la pantalla `frontend/src/pages/Rutinas.jsx` (listado de rutinas, detalle con ejercicios y parámetros, crear/editar con ejercicios del catálogo, activar/desactivar con confirmación)
- [ ] T050 [US4] Registrar la ruta y el menú para entrenador en `frontend/src/App.jsx` y `frontend/src/components/Layout.jsx`

**Punto de verificación**: Historia 4 funcional; las historias 2, 3 y 4 operan juntas (asignar → catálogo → rutina).

---

## Fase 7: Historia 5 — Registro de objetivos y progresos (Prioridad: P2)

**Goal**: el entrenador registra objetivos y entradas de progreso de sus clientes asignados, con historial inmutable (US-S3-04).

**Independent Test**: objetivo y entrada guardados en el historial y visibles; sin asignación → 403; entrada sin valor ni avance → 400; recepcionista/cliente → 403.

### Pruebas para la Historia 5 (solicitadas por FR-038) ??

> **NOTA**: escribir estas pruebas PRIMERO y verificar que FALLAN antes de la implementación.

- [ ] T051 [P] [US5] Prueba de contrato en `backend/tests/contract/objetivos-progresos.contract.test.js`: `POST /api/objetivos` 201, campos vacíos 400, `POST /api/progresos` 201, sin `valor_numerico` ni `avance` 400 (FR-020), `id_objetivo` de otro cliente 400, sin asignación 403 (US-S3-04.3), 403 para un entrenador desactivado con asignación vigente (FR-003), 403 para recepcionista/cliente (US-S3-04.5) y para el administrador en detalle (Q4)
- [ ] T052 [P] [US5] Prueba de integración en `backend/tests/integration/objetivos-progresos.integration.test.js`: cierre de objetivo con `fecha_cierre` conservando historial (SC-004), entradas anteriores intactas tras nuevas registraciones (US-S3-04.4) y auditoría de ambas operaciones (FR-022)
- [ ] T053 [P] [US5] Prueba frontend en `frontend/src/pages/ObjetivosProgreso.test.jsx`: alta de objetivo, registro de progreso y estados de error

### Implementación para la Historia 5

- [ ] T054 [P] [US5] Crear el modelo `backend/src/models/objetivo.model.js` con `data-model.md` §5 (`meta VARCHAR(255) NOT NULL`, `unidad VARCHAR(30) NULL`, `fecha_objetivo DATE NOT NULL`, `estado ENUM('activo','alcanzado','cerrado')`, `fecha_registro`, `fecha_cierre`)
- [ ] T055 [P] [US5] Crear el modelo `backend/src/models/progreso.model.js` con `data-model.md` §6 (`valor_numerico DECIMAL(8,2) NULL`, `avance VARCHAR(150) NULL`, `comentario VARCHAR(255) NULL`, `fecha DATE NOT NULL`, índices `(id_cliente, fecha)` y `fecha`)
- [ ] T056 [P] [US5] Crear los validadores `backend/src/validators/objetivo.validators.js`: `id_cliente` entero > 0, `meta` no vacía ≤ 255, `unidad` opcional ≤ 30, `fecha_objetivo` fecha válida, `estado` solo `alcanzado|cerrado` en cierre
- [ ] T057 [P] [US5] Crear los validadores `backend/src/validators/progreso.validators.js`: `id_cliente` entero > 0, `fecha` fecha válida, `valor_numerico` ≥ 0 opcional, `avance` ≤ 150 opcional, `comentario` ≤ 255 opcional, y exige al menos uno entre `valor_numerico` y `avance` (FR-020)
- [ ] T058 [US5] Crear el servicio `backend/src/services/objetivo.service.js`: exige asignación vigente con entrenador activo (RN-005/FR-003), transiciones terminales con `fecha_cierre` (data-model §5), sin borrado físico y auditoría (FR-022)
- [ ] T059 [US5] Crear el servicio `backend/src/services/progreso.service.js`: exige asignación vigente con entrenador activo (FR-003), al menos valor o avance, `id_objetivo` existente y del mismo cliente, presentación como seguimiento deportivo nunca diagnóstico médico (RN-013) y auditoría (FR-022)
- [ ] T060 [US5] Crear el controlador `backend/src/controllers/objetivo.controller.js`
- [ ] T061 [US5] Crear el controlador `backend/src/controllers/progreso.controller.js`
- [ ] T062 [P] [US5] Crear las rutas `backend/src/routes/objetivo.routes.js` (`GET /` → `autorizar('entrenador')`; `POST /`, `PUT /:id`, `PATCH /:id/estado` → `autorizar('entrenador')`)
- [ ] T063 [P] [US5] Crear las rutas `backend/src/routes/progreso.routes.js` (`GET /` → `autorizar('entrenador')`; `POST /` → `autorizar('entrenador')`)
- [ ] T064 [US5] Montar `/api/objetivos` y `/api/progresos` en `backend/src/app.js`
- [ ] T065 [P] [US5] Añadir los métodos en `frontend/src/services/api.js` (`listarObjetivos`, `crearObjetivo`, `actualizarObjetivo`, `cambiarEstadoObjetivo`, `listarProgresos`, `crearProgreso`)
- [ ] T066 [US5] Crear la pantalla `frontend/src/pages/ObjetivosProgreso.jsx` (lista de objetivos con estados y cierre, historial de progreso, alta de ambos, errores y estados vacíos)
- [ ] T067 [US5] Registrar la ruta y el menú para entrenador en `frontend/src/App.jsx` y `frontend/src/components/Layout.jsx`

**Punto de verificación**: Historia 5 funcional; el entrenador registra seguimiento completo de sus asignados.

---

## Fase 8: Historia 6 — Consulta de mi rutina y mi progreso (Prioridad: P2)

**Goal**: el cliente consulta su rutina activa y su historial propio en modo solo lectura, con estados vacíos comprensibles (US-S3-05).

**Independent Test**: el cliente ve su rutina activa con parámetros y su evolución ordenada; sin rutina → estado vacío sin error; consultar datos de otro cliente → 403 sin exponer información.

### Pruebas para la Historia 6 (solicitadas por FR-038) ??

> **NOTA**: escribir estas pruebas PRIMERO y verificar que FALLAN antes de la implementación.

- [ ] T068 [P] [US6] Prueba de contrato en `backend/tests/contract/mi-entrenamiento.contract.test.js`: `GET /api/mi-entrenamiento/rutina` 200 con datos propios, `data: null` sin rutina activa sin error (FR-024), `objetivos`/`progresos` propios, 403 para otros roles, 404 sin ficha vinculada, y rechazo de cualquier intento de consultar a un tercero (parámetro de identificación de cliente → 403, US-S3-05.4)
- [ ] T069 [P] [US6] Prueba de integración en `backend/tests/integration/mi-entrenamiento.integration.test.js`: la rutina que ve el cliente es exactamente la `activa` (Q5) y su historial de progresos llega ordenado en el tiempo (US-S3-05.2)
- [ ] T070 [P] [US6] Prueba frontend en `frontend/src/pages/MiRutina.test.jsx`: rutina activa con ejercicios y estado vacío cuando no existe
- [ ] T071 [P] [US6] Prueba frontend en `frontend/src/pages/MiProgreso.test.jsx`: evolución ordenada y estado vacío sin objetivos

### Implementación para la Historia 6

- [ ] T072 [US6] Añadir a `backend/src/models/rutina.model.js` la consulta de la rutina `activa` del cliente resuelta por el `correo` de la sesión (patrón `obtenerPorCorreo` de `backend/src/controllers/cliente.controller.js`)
- [ ] T073 [P] [US6] Añadir a `backend/src/models/objetivo.model.js` y `backend/src/models/progreso.model.js` las consultas de historial propias por `correo` de la sesión, ordenadas por fecha ascendente
- [ ] T074 [US6] Crear el servicio `backend/src/services/miEntrenamiento.service.js`: resuelve la ficha por `correo` (vínculo cuenta↔ficha del supuesto del spec), devuelve estados vacíos (`null`/`[]`) en lugar de errores (FR-024) y nunca acepta identificadores de terceros
- [ ] T075 [US6] Crear el controlador `backend/src/controllers/miEntrenamiento.controller.js`
- [ ] T076 [US6] Crear las rutas `backend/src/routes/miEntrenamiento.routes.js` (`GET /rutina`, `GET /objetivos`, `GET /progresos` → `autorizar('cliente')`) y montarlas en `backend/src/app.js` bajo `/api/mi-entrenamiento`
- [ ] T077 [P] [US6] Añadir los métodos en `frontend/src/services/api.js` (`obtenerMiRutina`, `obtenerMisObjetivos`, `obtenerMisProgresos`)
- [ ] T078 [US6] Crear la pantalla `frontend/src/pages/MiRutina.jsx` (ejercicios con series, repeticiones, peso recomendado, descanso e instrucciones; estado vacío comprensible)
- [ ] T079 [P] [US6] Crear la pantalla `frontend/src/pages/MiProgreso.jsx` (objetivos e historial de progresos ordenado en el tiempo; estados vacíos)
- [ ] T080 [US6] Registrar las rutas y el menú para cliente en `frontend/src/App.jsx` y `frontend/src/components/Layout.jsx`

**Punto de verificación**: Historia 6 funcional; el cliente consulta de forma aislada e independiente del resto de roles.

---

## Fase 9: Historia 7 — Dashboard administrativo (Prioridad: P2)

**Goal**: dashboard con estadísticas consolidadas reales, filtrable por periodo, exclusivo del administrador (US-S3-06, decisiones confirmadas 1 y 4).

**Independent Test**: el administrador ve indicadores calculados con registros reales y filtra el periodo; fechas invertidas → 400; periodo sin datos → ceros sin datos ficticios; otros roles → 403.

### Pruebas para la Historia 7 (solicitadas por FR-038) ??

> **NOTA**: escribir estas pruebas PRIMERO y verificar que FALLAN antes de la implementación.

- [ ] T081 [P] [US7] Prueba de contrato en `backend/tests/contract/dashboard.contract.test.js`: esquema de grupos de `contracts/api.md` §8, fechas invertidas 400 (US-S3-06.3), por defecto mes en curso, 403 para recepcionista/entrenador/cliente (US-S3-06.5)
- [ ] T082 [P] [US7] Prueba de integración en `backend/tests/integration/dashboard.integration.test.js`: los indicadores coinciden con los registros existentes (SC-006), «clientes activos» sigue la vigencia real de membresías por fechas (FR-027), «por vencer» usa 7 días (Q3), «vencidas» agrupa estados no `activa` como `suspendida` y los tres contadores suman el total (FR-027), periodo vacío devuelve ceros (US-S3-06.4) y la pantalla no expone detalle individual de rutinas (Q4)
- [ ] T083 [P] [US7] Prueba frontend en `frontend/src/pages/Dashboard.test.jsx`: indicadores por grupos, filtro de fechas y estado de ceros

### Implementación para la Historia 7

- [ ] T084 [P] [US7] Crear el modelo `backend/src/models/dashboard.model.js` con las consultas agregadas de `data-model.md` §7 sobre `clientes`, `membresias`, `pagos`, `accesos`, `entrenadores`, `asignaciones_entrenador`, `rutinas`, `objetivos` y `progresos`, acotadas por periodo y usando los índices existentes
- [ ] T085 [US7] Crear el servicio `backend/src/services/dashboard.service.js`: periodo por defecto mes en curso, rechazo de `desde > hasta` (FR-026), vigencia de membresías con `backend/src/utils/fechas.js` (FR-027) y umbral «por vencer» de 7 días (Q3)
- [ ] T086 [US7] Crear el controlador `backend/src/controllers/dashboard.controller.js`
- [ ] T087 [US7] Crear las rutas `backend/src/routes/dashboard.routes.js` (`GET /` → `autorizar('administrador')`) y montarlas en `backend/src/app.js` bajo `/api/dashboard`
- [ ] T088 [P] [US7] Añadir el método `obtenerDashboard` en `frontend/src/services/api.js` con parámetros `desde`/`hasta`
- [ ] T089 [US7] Crear la pantalla `frontend/src/pages/Dashboard.jsx` (indicadores por grupos con el esquema de `contracts/api.md` §8, filtro de fechas por defecto mes en curso, ceros sin datos ficticios, sin enlaces a rutinas/progresos individuales (Q4))
- [ ] T090 [US7] Registrar la ruta y el menú solo para administrador en `frontend/src/App.jsx` y `frontend/src/components/Layout.jsx`, sin alterar la pantalla de inicio existente (FR-029)

**Punto de verificación**: Historia 7 funcional; el administrador consolida datos reales de los Sprints 1–3.

---

## Fase 10: Historia 8 — Pantalla de auditoría de solo lectura (Prioridad: P3)

**Goal**: pantalla de auditoría con filtros, exclusiva del administrador, sin ninguna operación de escritura (US-S3-09, decisión confirmada 3).

**Independent Test**: el administrador filtra por rango de fechas, módulo y actor y solo observa; no existen controles de edición/creación/borrado; otros roles → 403; filtro sin resultados → estado vacío.

### Pruebas para la Historia 8 (solicitadas por FR-038) ??

> **NOTA**: escribir estas pruebas PRIMERO y verificar que FALLAN antes de la implementación.

- [ ] T091 [P] [US8] Prueba de contrato en `backend/tests/contract/auditoria-filtros.contract.test.js`: `GET /api/auditoria` con `desde`/`hasta`/`modulo`/`actor` acota la lista (US-S3-09.2), `desde > hasta` 400, 403 para recepcionista/entrenador/cliente (US-S3-09.4), y `POST`/`PUT`/`DELETE` sobre `/api/auditoria` responden 404 (no existen operaciones de escritura, FR-031/SC-007)
- [ ] T092 [P] [US8] Prueba de integración en `backend/tests/integration/auditoria-filtros.integration.test.js`: sin parámetros conserva el comportamiento previo del Sprint 2 (compatibilidad) y la respuesta incluye actor, acción, entidad (mapeada a `modulo` + detalle en `descripcion`, contrato §9), fecha/hora y resultado (US-S3-09.1)
- [ ] T093 [P] [US8] Prueba frontend en `frontend/src/pages/Auditoria.test.jsx`: registros visibles, aplicar filtros, estado vacío sin resultados y **cero botones/controles de edición, creación o borrado** (SC-007)

### Implementación para la Historia 8

- [ ] T094 [US8] Ampliar `backend/src/models/auditoria.model.js` con el listado filtrado opcional por `desde`, `hasta`, `modulo` y `actor` (research R-06), conservando la consulta existente sin parámetros
- [ ] T095 [US8] Ampliar `backend/src/controllers/auditoria.controller.js` para leer y validar los filtros de `contracts/api.md` §9 sin alterar la respuesta actual cuando no se envían
- [ ] T096 [US8] Crear `backend/src/validators/auditoria.validators.js` (`desde`/`hasta` fechas válidas y `desde <= hasta`) y aplicarlo en `backend/src/routes/auditoria.routes.js` sin añadir ningún método de escritura
- [ ] T097 [P] [US8] Ampliar el método de auditoría en `frontend/src/services/api.js` (`obtenerAuditoria` con filtros `desde`, `hasta`, `modulo`, `actor`)
- [ ] T098 [US8] Crear la pantalla `frontend/src/pages/Auditoria.jsx` (tabla de solo lectura con actor/acción/entidad/fecha/resultado, filtros, estado vacío; sin controles de edición, creación ni borrado)
- [ ] T099 [US8] Registrar la ruta y el menú solo para administrador en `frontend/src/App.jsx` y `frontend/src/components/Layout.jsx`

**Punto de verificación**: Historia 8 funcional; la auditoría es consultable con filtros y sigue siendo inmutable.

---

## Fase 11: Historia 9 — Consulta del personal asignado (Prioridad: P3)

**Goal**: administrador y recepcionista ven cada entrenador con su carga y lista de clientes asignados (US-S3-07).

**Independent Test**: con varias asignaciones vigentes, el listado muestra por entrenador su cantidad de clientes y sus asignados; un entrenador sin asignados aparece con carga 0; un cliente recibe 403.

### Pruebas para la Historia 9 (solicitadas por FR-038) ??

> **NOTA**: escribir estas pruebas PRIMERO y verificar que FALLAN antes de la implementación.

- [ ] T100 [P] [US9] Prueba de contrato en `backend/tests/contract/personal-asignado.contract.test.js`: `GET /api/entrenadores` incluye `carga` y `GET /api/asignaciones?vigentes=true` devuelve la lista por entrenador (FR-008), entrenador sin asignados con carga 0 (US-S3-07.2), 403 para cliente en ambos endpoints (US-S3-07.3)
- [ ] T101 [P] [US9] Prueba de integración en `backend/tests/integration/personal-asignado.integration.test.js`: la carga coincide con el número de asignaciones vigentes reales (SC-006 aplicado a esta vista) y cambia al finalizar una asignación
- [ ] T102 [P] [US9] Prueba frontend en `frontend/src/pages/PersonalAsignado.test.jsx`: entrenadores con carga, lista de asignados y carga 0

### Implementación para la Historia 9

- [ ] T103 [US9] Ampliar `backend/src/models/entrenador.model.js` con la carga de clientes asignados vigentes por entrenador (contador sobre `asignaciones_entrenador.esta_vigente`, FR-008)
- [ ] T104 [US9] Ampliar `backend/src/services/entrenador.service.js` para poblar la carga en el listado de `GET /api/entrenadores`
- [ ] T105 [P] [US9] Crear la pantalla `frontend/src/pages/PersonalAsignado.jsx` (reutilizando `listarEntrenadores` y `listarAsignaciones` de `frontend/src/services/api.js`: entrenadores con su cantidad de clientes y lista de asignados, carga 0 visible, estados vacíos)
- [ ] T106 [US9] Registrar la ruta y el menú para administrador y recepcionista en `frontend/src/App.jsx` y `frontend/src/components/Layout.jsx`

**Punto de verificación**: Historia 9 funcional; todas las historias del sprint completas.

---

## Fase 12: Pulido y temas transversales

**Propósito**: verificación cruzada de calidad, seguridad y documentación (constitución V, criterios de éxito SC-001…SC-010).

- [ ] T107 [P] Ejecutar las suites completas: `npm test` en `backend/` y `frontend/` al 100% con cero regresiones de los Sprints 1 y 2, y re-siembrar después con `node --env-file=.env.test validate-sprint2.mjs` (SC-008/SC-010; `quickstart.md` §4)
- [ ] T108 [P] Verificar la integridad de la auditoría: todas las escrituras de los módulos nuevos con actor, acción, fecha/hora, entidad (contrato §9: `modulo` + detalle en `descripcion`) y resultado, sin contraseñas, JWT ni biométricos (SC-005, RN-010) y cero controles de modificación en la pantalla (SC-007) en `frontend/src/pages/Auditoria.jsx`
- [ ] T109 Ejecutar el recorrido manual completo de `specs/003-sprint-3-entrenadores-rutinas-dashboard/quickstart.md` §6 (SC-001: flujo demostrable < 15 minutos) y las verificaciones transversales de §7
- [ ] T110 [P] Verificar la matriz de denegaciones de `specs/003-sprint-3-entrenadores-rutinas-dashboard/contracts/api.md` §10 al 100% en el servidor (SC-002) y confirmar que no existe ningún endpoint `DELETE` nuevo ni operación de escritura sobre auditoría (FR-031/FR-036)
- [ ] T111 [P] Confirmar que E3 queda intacta (`specs/002-sprint-2-membresias-pagos-reconocimiento-acceso/spec.md`, FR-039/RN-014) y que ningún cambio altera los Sprints 1 y 2: autenticación, usuarios, clientes, membresías, pagos, reconocimiento facial, kiosco y autorización manual (SC-010)
- [ ] T112 [P] Comprobar responsividad y motion en las pantallas nuevas de `frontend/src/pages/`: escritorio y 768 px sin desbordamiento horizontal y `prefers-reduced-motion` respetado (SC-009)
- [ ] T113 [P] Ampliar `backend/tests/unit/validadores.test.js` con las reglas de los validadores nuevos (rangos de rutinas, «al menos valor o avance», fechas de periodo y filtros de auditoría)
- [ ] T114 Alinear la documentación con lo implementado (`spec.md`, `plan.md`, `contracts/api.md`, `quickstart.md`, `data-model.md`) y re-validar `checklists/requirements.md` (constitución V: documentación alineada con el comportamiento implementado)

---

## Dependencias y orden de ejecución

### Dependencias entre fases

- **Preparación (Fase 1)**: sin dependencias; se inicia de inmediato.
- **Fundacional (Fase 2)**: depende de la Fase 1; **BLOQUEA todas las historias** (esquema único en `gym_db_pruebas`).
- **Historias (Fases 3–11)**: todas dependen de la Fase 2; después se rigen por sus dependencias internas (abajo).
- **Pulido (Fase 12)**: depende de todas las historias deseadas (mínimo US1–US4 para el flujo demostrable; idealmente las 9).

### Dependencias entre historias

- **US1 (entrenadores, P1)**: arranca tras la Fase 2 — sin dependencias de otras historias.
- **US2 (asignaciones, P1)**: requiere US1 (necesita perfiles de entrenador registrados).
- **US3 (catálogo, P1)**: independiente — arranca tras la Fase 2, en paralelo con US1/US2.
- **US4 (rutinas, P1)**: requiere US2 (asignación vigente) y US3 (ejercicios del catálogo).
- **US5 (objetivos y progreso, P2)**: requiere US2 (asignación vigente); independiente de US3/US4.
- **US6 (consulta del cliente, P2)**: requiere US4 (rutina activa) y US5 (objetivos/progresos que consulta).
- **US7 (dashboard, P2)**: requiere US1, US2, US4 y US5 para sus indicadores (más los datos de los Sprints 1 y 2, ya existentes).
- **US8 (auditoría, P3)**: técnicamente independiente (reutiliza `auditoria` existente); aporta valor tras las escrituras de US1–US5.
- **US9 (personal asignado, P3)**: requiere US1 y US2; amplía archivos ya creados por ambas (`entrenador.model.js`/`entrenador.service.js`).

### Dentro de cada historia

- Las pruebas se escriben PRIMERO y deben FALLAR antes de la implementación (FR-038).
- Modelos y validadores antes que servicios; servicios antes que controladores y rutas; montaje en `app.js` al final del backend; `api.js` antes que las pantallas; pantallas antes de registrar rutas/menú en `App.jsx`/`Layout.jsx`.
- Historia completa y verificada antes de pasar a la siguiente en orden de prioridad (P1 → P2 → P3).

### Oportunidades de paralelismo

- Todas las tareas `[P]` de una misma fase pueden ejecutarse a la vez (archivos distintos).
- Tras la Fase 2, US1, US3 y US8 pueden avanzar en paralelo entre sí (sin dependencias cruzadas).
- En cada historia, las pruebas (contract/integration/frontend) corren en paralelo; `model` + `validators` en paralelo; `api.js` en paralelo con la cadena de backend.
- Diferentes personas pueden asumir historias distintas respetando la tabla de dependencias.

---

## Ejemplo de paralelismo: Historia 1

```text
# Lote 1 — pruebas (todas en paralelo, deben fallar al inicio):
Task: "backend/tests/contract/entrenadores.contract.test.js"
Task: "backend/tests/integration/entrenadores.integration.test.js"
Task: "frontend/src/pages/Entrenadores.test.jsx"

# Lote 2 — backend base (en paralelo):
Task: "backend/src/models/entrenador.model.js"
Task: "backend/src/validators/entrenador.validators.js"

# Lote 3 — cadena secuencial: servicio → controlador → rutas + app.js

# Lote 4 — frontend (tras backend y api.js): Entrenadores.jsx → App.jsx/Layout.jsx
```

---

## Estrategia de implementación

### MVP primero (solo Historia 1)

1. Completar Fase 1: Preparación.
2. Completar Fase 2: Fundacional (CRÍTICA — bloquea todas las historias).
3. Completar Fase 3: Historia 1.
4. **PARAR Y VALIDAR**: probar la Historia 1 de forma independiente (alta, edición, estado, denegaciones).
5. Demo/commit si está lista.

### Entrega incremental

1. Preparación + Fundacional → base lista.
2. Historia 1 → probar → demo (MVP del módulo de entrenadores).
3. Historia 2 → probar → demo (asignación operativa).
4. Historia 3 → probar → demo (catálogo reutilizable).
5. Historia 4 → probar → demo (rutinas: fin del flujo P1 completo, SC-001).
6. Historias 5 y 6 → probar → demo (seguimiento y portal del cliente).
7. Historia 7 → probar → demo (dashboard con datos reales).
8. Historias 8 y 9 → probar → demo (auditoría y personal asignado).
9. Fase de Pulido → verificación transversal completa.

Cada historia añade valor sin romper las anteriores (SC-008/SC-010 se re-verifican al final de cada historia con `npm test`).

### Estrategia de equipo paralelo

Con varias personas:

1. El equipo completa Preparación y Fundacional juntos.
2. Una vez fundacional listo:
   - Desarrollador A: US1 → US2 → US4 (cadena de entrenadores).
   - Desarrollador B: US3 → US5 → US6 (catálogo y seguimiento).
   - Desarrollador C: US7, US8 y US9 (vistas de administración).
3. Las historias se integran de forma independiente respetando la tabla de dependencias.

---

## Notas

- `[P]` = archivos distintos sin dependencias; las tareas sin `[P]` deben respetar el orden indicado.
- La etiqueta `[Story]` (US1…US9) traza cada tarea con su historia del spec (US-S3-01…US-S3-09 en el orden de las historias del documento).
- Cada historia es completable y testeable de forma independiente (criterio de prueba independiente en su fase).
- Verificar que las pruebas fallan antes de implementar; correr `npm test` (y re-siembrar) tras cada historia.
- **Nunca** ejecutar `npm run migrar` sin `.env.test`; **nunca** operar sobre `gym_db`; las migraciones 001–006 son intocables (FR-037, FR-048).
- Commits tras cada tarea o grupo lógico, con Conventional Commits en español (solo con autorización).
- Detenerse en cada punto de verificación para validar la historia de forma independiente.
