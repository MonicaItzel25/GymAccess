---

description: "Lista de tareas para la implementación de la función 001-sprint1-base-auth"

---

# Tasks: Base del sistema, autenticación y gestión (Sprint 1)

**Input**: Documentos de diseño de `/specs/001-sprint1-base-auth/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md, estado-repositorio.md

**Tests**: Se incluyen tareas de prueba porque (a) las suites existentes de Vitest +
supertest **afirman comportamiento que este sprint cambia** (p. ej. el mensaje de
login, ajuste A8) y deben mantenerse en verde, y (b) la constitución y plan.md
exigen pruebas automatizadas de unidades, integración y matriz de permisos.

**Organization**: Las tareas están organizadas por historia de usuario para permitir
implementación y verificación independientes.

> **?? Advertencia de seguridad de datos (verificada el 2026-10-14, solo lectura)**:
> el código actual **no referencia `gym_db_pruebas` en ninguna parte**;
> `backend/.env` define `DB_NAME=gym_db`, `backend/src/config/db.js` usa
> `process.env.DB_NAME || 'gym_db'` y `backend/tests/helpers/baseDatos.js` ejecuta
> `DELETE` sobre las tablas operativas. Por tanto, hoy `npm test` y el arranque de la
> aplicación apuntan a **`gym_db` (datos reales)**. Las fases 1–2 incluyen tareas
> explícitas para garantizar que pruebas y aplicación usen **`gym_db_pruebas`** y
> **PAROS OBLIGATORIOS** (T008, T009): si la garantía no puede establecerse, se
> detiene la ejecución y se solicita confirmación antes de continuar.

## Cómo se garantiza cada protección de la base de datos

1. **`npm test` carga `.env.test` antes de la conexión MySQL** (T006 + T008):
   el script `test` pasará a ser `node --env-file=.env.test ./node_modules/vitest/vitest.mjs run`:
   Node procesa `--env-file` **en el arranque del proceso, antes de importar
   cualquier módulo**, de modo que `process.env.DB_NAME = 'gym_db_pruebas'` ya
   existe cuando Vitest importa los archivos de prueba. Después,
   `backend/src/config/db.js` ejecuta `import 'dotenv/config'`, y **dotenv nunca
   sobrescribe variables ya presentes en el entorno**, por lo que `.env`
   (`DB_NAME=gym_db`) no puede prevalecer. Además el pool es **perezoso**
   (`let pool = null`; se crea en la primera llamada a `obtenerPool()`, dentro de
   una prueba, nunca al importar el módulo).
2. **`baseDatos.js` rechaza toda base distinta de `gym_db_pruebas`** (T007):
   se añade un guard `verificarBasePruebas()` que lanza un error con mensaje en
   español si `process.env.DB_NAME !== 'gym_db_pruebas'`, y se invoca **al
   principio** de `vaciarTablas()` (que ejecuta los 7 `DELETE`) y de
   `insertarUsuario()`/`insertarCliente()`, **antes de cualquier sentencia**. Es
   defensa en profundidad: aunque falle la cadena del punto 1, ningún `DELETE` se
   ejecuta contra `gym_db`.
3. **`backend/.env` queda sin cambios** (T006): solo se crea `backend/.env.test`;
   modificar el `.env` de la aplicación está prohibido. La aplicación en desarrollo
   usa el override de la variable de entorno del proceso (T009), nunca el archivo.
4. **Consolidación sin sobrescrituras** (T001): inventario y comparación
   origen/destino antes de copiar, exclusión de la documentación de Spec Kit y
   paro obligatorio con aprobación ante cualquier conflicto.

## Formato: `[ID] [P?] [Historia] Descripción`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias)
- **[Historia]**: Historia a la que pertenece la tarea (US1…US6)
- Rutas exactas en cada descripción

## Convenciones de ruta

- **Tras la consolidación (T001)**, el código vive en la raíz del workspace:
  `backend/`, `frontend/`, `database/` (origen hasta entonces:
  `C:\Users\moni2\Documents\gymAccess1`).
- **Base de datos**: todo trabajo automatizado contra **`gym_db_pruebas`**; la
  aplicación en desarrollo solo apunta a `gym_db` cuando se pida explícitamente con
  la variable de entorno del proceso. **Prohibido** ejecutar migraciones, recrear
  bases o editar/reejecutar las 5 migraciones registradas en `gym_db.migraciones`.
- La documentación de Spec Kit del workspace (`specs/`, `.specify/`, `docs/`,
  `AGENTS.md`) y los archivos de configuración de OpenCode (`.opencode/`) se
  **conservan intactos** en la consolidación.

---

## Phase 1: Setup (Consolidación del código — decisión A1 aprobada)

**Propósito**: traer el código real a este workspace y adoptar la estructura
documentada en plan.md, sin tocar la base de datos ni la documentación existente.

- [X] T001 Antes de copiar, generar el inventario de origen (`C:\Users\moni2\Documents\gymAccess1`: carpetas `backend/`, `frontend/`, `database/` y sus archivos) y de destino (raíz del workspace), **comparar ambos archivo por archivo**: copiar **únicamente** `backend/`, `frontend/` y `database/`; **no copiar** `specs/`, `.specify/`, `docs/` ni ningún archivo raíz del origen (el workspace ya tiene su propia documentación de Spec Kit: `specs/001-sprint1-base-auth/`, `.specify/`, `docs/`, `AGENTS.md`, `.opencode/`, que deben quedar intactos); si en el destino existe **cualquier** archivo u homónimo que se sobrescribiría, **DETENERSE, listar los conflictos y solicitar aprobación explícita antes de sobrescribir**; conservar el original sin eliminar ni modificar; no ejecutar ningún script de BD durante la copia
- [X] T002 Renombrar `database/scripts/ejecutar-migraciones.mjs` a `database/migrate.mjs` y **buscar en todo el árbol copiado** cualquier referencia al nombre antiguo (`ejecutar-migraciones`), actualizándola a la ruta nueva **sin ejecutar el script**: `backend/package.json` (script `migrar`, hoy `node ../database/scripts/ejecutar-migraciones.mjs`), `backend/tests/helpers/baseDatos.js` (comentario de uso), `database/README.md` y cualquier archivo de `database/scripts/`; leer `database/migrate.mjs` para confirmar que sus rutas internas (`migrations/`, `seeds/`, tabla `migraciones`) siguen siendo relativas y correctas tras el renombrado; cerrar con una búsqueda final que no quede ninguna coincidencia del nombre antiguo
- [X] T003 [P] Verificar y completar `database/README.md` con la configuración de la MySQL local: `127.0.0.1:3306`, servicio `MySQL2610`, bases `gym_db` (producción/desarrollo) y `gym_db_pruebas` (pruebas automatizadas, única base permitida para las suites), uso de `database/migrate.mjs`, la regla de numeración futura desde `004_…` y el aviso de no ejecutar migraciones contra `gym_db` durante este sprint
- [X] T004 [P] Verificar que `backend/.env.example` contiene solo placeholders (`PORT`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRACION_HORAS`) sin contraseñas reales, y que `backend/.env` local no se incluye en documentación ni commits

**Checkpoint**: código consolidado sin sobrescribir nada sin aprobación, ejecutor con nombre estándar, todas las referencias actualizadas y documentación de BD local completa.

---

## Phase 2: Foundational (Bloqueante de todas las historias)

**Propósito**: dejar el entorno consolidado funcionando y **garantizar que pruebas y
aplicación operan sobre `gym_db_pruebas` y nunca sobre `gym_db`**, con doble
mecanismo: carga del entorno de pruebas y guard explícito en el helper.

**?? CRITICAL**: Ninguna historia puede comenzar hasta completar esta fase, y los
PAROS OBLIGATORIOS de T008 y T009 deben respetarse sin excepción.

- [X] T005 Verificar en **solo lectura** la base de pruebas: `gym_db_pruebas` existe en `127.0.0.1:3306` con las 9 tablas (`usuarios`, `clientes`, `tipos_membresia`, `membresias`, `pagos`, `rostros`, `accesos`, `auditoria`, `migraciones`) y las 5 migraciones registradas (`001_crear_base_datos`, `002_crear_tablas_sprint1`, `003_crear_tablas_sprint2`, `001_usuario_admin`, `002_tipos_membresia_ejemplo`); comprobar también que `gym_db` conserva sus 5 filas y sus datos intactos; **no ejecutar migraciones, no crear ni modificar tablas ni datos en ninguna base**
- [X] T006 Configurar la carga del entorno de pruebas **antes de cualquier conexión**: crear `backend/.env.test` con `DB_NAME=gym_db_pruebas` (mismas credenciales locales, sin commitearlas) y cambiar el script `test` de `backend/package.json` de `vitest run` a `node --env-file=.env.test ./node_modules/vitest/vitest.mjs run` (alternativa equivalente admisible: que `backend/vitest.config.js` cargue `.env.test` en tiempo de carga de la configuración, siempre que la carga ocurra antes de importar archivos de prueba); **`backend/.env` queda SIN CAMBIOS** (prohibido modificarlo); documentar en `database/README.md` que las suites jamás deben ejecutarse sin `.env.test`
- [X] T007 Agregar el guard de defensa en profundidad en `backend/tests/helpers/baseDatos.js`: crear `verificarBasePruebas()` que lance un error con mensaje en español (`base de datos no permitida para pruebas: se esperaba gym_db_pruebas`) si `process.env.DB_NAME !== 'gym_db_pruebas'`, e invocarla **al inicio** de `vaciarTablas()` (antes de los 7 `DELETE`), `insertarUsuario()` e `insertarCliente()`, **antes de cualquier sentencia**; sin tocar ningún otro archivo
- [X] T008 **PARO OBLIGATORIO** antes de ejecutar `npm test`: comprobar por inspección (sin ejecutar pruebas) la cadena completa de garantía: (a) el script `test` de `backend/package.json` carga `.env.test` en el arranque de Node antes de importar módulos, (b) `backend/src/config/db.js` usa `import 'dotenv/config'` que **no sobrescribe** variables ya presentes y crea el pool de forma perezosa en `obtenerPool()`, (c) `backend/tests/helpers/baseDatos.js` contiene el guard de T007, y (d) ninguna ruta de pruebas referencia `gym_db`; **si algún eslabón no puede verificarse de forma concluyente, DETENERSE y solicitar confirmación al usuario antes de continuar**; solo con la cadena completa verificada, ejecutar `npm install` en `backend/` y `frontend/` y la línea base `npm test` en ambos, registrando resultados (las suites de Sprints 1 y 2 deben pasar en `gym_db_pruebas`)
- [X] T009 **PARO OBLIGATORIO** antes de arrancar la aplicación: verificar que el proceso se lanzará con `DB_NAME=gym_db_pruebas` fijada en el entorno del comando (p. ej. `$env:DB_NAME='gym_db_pruebas'; npm run dev`) **sin editar** `backend/.env`; **si no puede garantizarse, DETENERSE y solicitar confirmación al usuario**; solo entonces arrancar `backend` (`npm run dev`) y `frontend` (`npm run dev`) y verificar el humo básico contra `gym_db_pruebas`: proxy `/api` responde, `POST /api/auth/login` con una cuenta de prueba activa de esa base devuelve `{ok:true,data:{token,usuario}}` y `GET /api/auth/me` valida el token

**Checkpoint**: base lista y aislada por doble mecanismo (entorno + guard) — pueden comenzar las historias.

---

## Phase 3: User Story 1 - Inicio de sesión seguro (Prioridad: P1) ?? MVP

**Objetivo**: que el inicio de sesión cumpla exactamente FR-001 a FR-007, en
particular el mensaje exclusivo `correo o contraseña incorrectos` (ajuste A8); el
resto del comportamiento (bloqueo 409 en memoria, normalización, hash bcrypt, JWT
8 h) ya existe y solo se verifica.

**Prueba independiente**: con un usuario activo existente, credenciales correctas
inician sesión; contraseña incorrecta, correo inexistente y cuenta inactiva devuelven
401 con el mensaje exacto; el quinto fallo bloquea 15 minutos.

### Implementación para la historia 1

- [X] T010 [US1] Actualizar las pruebas que esperan el mensaje antiguo `Credenciales incorrectas` en `backend/tests/contract/auth.contract.test.js` y `backend/tests/integration/auth.integration.test.js` para esperar el texto exacto `correo o contraseña incorrectos` (deben FALLAR antes del cambio de código; también el caso de cuenta inactiva con contraseña correcta)
- [X] T011 [US1] Cambiar en `backend/src/services/auth.service.js` el mensaje del `ErrorAutenticacion` de 401 al texto exacto `correo o contraseña incorrectos` (FR-005, A8), conservando 401, la respuesta idéntica para credenciales incorrectas y para cuenta inactiva (FR-006), y el bloqueo en `409` con su mensaje actual (FR-004)
- [X] T012 [US1] Ejecutar `npm test` en `backend/` (siempre con la cadena de `gym_db_pruebas` verificada, ver T008) y dejar en verde las suites de auth (unit, integration, contract); verificar sin cambios el bloqueo tras 5 fallos, la normalización de correos (FR-007) y la expiración de 8 horas (FR-003)

**Checkpoint**: la historia 1 queda funcional y verificable de forma independiente.

---

## Phase 4: User Story 2 - Cierre de sesión (Prioridad: P2)

**Objetivo**: garantizar FR-008 — el cierre elimina la sesión local y la app vuelve
a exigir autenticación, sin dejar información del usuario anterior.

**Prueba independiente**: iniciar sesión, cerrar sesión y comprobar que toda función
privada exige credenciales de nuevo y que `localStorage` queda limpio.

### Implementación para la historia 2

- [X] T013 [US2] Verificar en `frontend/src/context/AuthContext.jsx` que la acción de cerrar sesión elimina `token` y `usuario` de `localStorage` y restablece el estado; ajustar solo si se detecta el hueco (FR-008)
- [ ] T014 [P] [US2] Verificar o ampliar las pruebas de `frontend/src/services/api.test.js` para cubrir el cierre: sin token en `localStorage` la petición privada no envía cabecera `Authorization` y la aplicación exige autenticación de nuevo
- [X] T015 [US2] Ejecutar manualmente el escenario A9 del `quickstart.md` (cerrar sesión, navegar a ruta privada, sin rastros del usuario anterior) y dejar constancia del resultado

**Checkpoint**: el ciclo completo de autenticación (inicio + cierre) queda demostrado.

---

## Phase 5: User Story 3 - Gestión de usuarios, roles y estados (Prioridad: P2)

**Objetivo**: cerrar las brechas A10 (protección del único administrador activo,
FR-014) y A11 (auditoría de usuarios, constitución X.1) sobre el CRUD existente.

**Prueba independiente**: crear un usuario por cada rol, modificar datos, desactivar
una cuenta y verificar que el último administrador activo no puede desactivarse ni
degradarse (409) y que las operaciones quedan en `auditoria`; los roles sin permiso
siguen recibiendo 403.

### Implementación para la historia 3

- [X] T016 [US3] Implementar la protección del único administrador activo (FR-014, SC-002, A10) en `backend/src/services/usuario.service.js`: en `cambiarEstado` (a `inactivo`) y `cambiarRol` (a rol distinto de `administrador`) usar una transacción con `SELECT ... FOR UPDATE` que cuente administradores activos y responder `ErrorServicio` con `409` y mensaje `no se puede modificar al único administrador activo` si se dejaría cero administradores activos
- [X] T017 [US3] Agregar el registro de auditoría de usuarios (A11, constitución X.1) en `backend/src/services/usuario.service.js` invocando `registrarAccion` de `backend/src/services/auditoria.service.js` en `crear`, `modificar`, `cambiarRol` y `cambiarEstado`, con `modulo` `usuarios`, acción, resultado (`exitoso`/`rechazado`/`error`) y descripción que **nunca** incluya contraseñas ni hashes (regla X.3)
- [X] T018 [US3] Ampliar `backend/tests/contract/usuarios-rol.contract.test.js` con el caso del último administrador activo (409 al desactivar y al degradar) y `backend/tests/contract/usuarios.contract.test.js` con la verificación de filas en `auditoria` tras crear y modificar usuarios sin exponer `password` (SC-003)
- [X] T019 [US3] Ejecutar `npm test` en `backend/` (con la cadena de `gym_db_pruebas` verificada, ver T008) y dejar en verde las suites `usuarios.contract.test.js`, `usuarios-rol.contract.test.js` y `usuarios.integration.test.js` (incluye el rechazo 403 de roles sin permiso, FR-017)

**Checkpoint**: la historia 3 queda funcional con sus reglas de negocio completas.

---

## Phase 6: User Story 4 - Gestión de clientes (Prioridad: P3)

**Objetivo**: cerrar la brecha A11 (auditoría de clientes) y verificar la consulta
del entrenador con campos básicos (A16) sobre el CRUD existente.

**Prueba independiente**: registrar y editar clientes desde administrador y
recepcionista, comprobar la auditoría, el 403 de roles no autorizados y que el
entrenador solo recibe `id_cliente`, `nombre`, `apellido`, `telefono`, `estado`.

### Implementación para la historia 4

- [ ] T020 [US4] Agregar el registro de auditoría de clientes (A11) en `backend/src/services/cliente.service.js` invocando `registrarAccion` de `backend/src/services/auditoria.service.js` en `crear` y `actualizar`, con `modulo` `clientes`, resultado y descripción sin credenciales (regla X.3)
- [ ] T021 [US4] Ampliar `backend/tests/contract/clientes.contract.test.js` con la verificación de filas en `auditoria` tras crear y modificar clientes, y confirmar en `backend/tests/contract/clientes-consulta.contract.test.js` el recorte básico del entrenador (`id_cliente`, `nombre`, `apellido`, `telefono`, `estado`) autorizado por A16
- [ ] T022 [US4] Ejecutar `npm test` en `backend/` (con la cadena de `gym_db_pruebas` verificada, ver T008) y dejar en verde las suites `clientes.contract.test.js`, `clientes-consulta.contract.test.js`, `clientes-edicion.contract.test.js` y `clientes.integration.test.js`, incluido el rechazo `404 Recurso no encontrado` de `DELETE` (FR-021, sin borrado físico)

**Checkpoint**: la historia 4 queda funcional y verificable de forma independiente.

---

## Phase 7: User Story 5 - Vinculación de cuenta con cliente y perfil propio (Prioridad: P3)

**Objetivo**: implementar A15/FR-023 (cuenta `cliente` exige `correo` coincidente
con un `clientes.correo` existente; sin `clienteId`) y verificar el perfil propio
`GET /api/clientes/mio` (FR-024, FR-025) y la regla FR-010.

**Prueba independiente**: crear una cuenta con rol `cliente` cuyo correo coincide con
un cliente sin cuenta (201) y con un correo sin ficha (400); el cliente autenticado
consulta `/api/clientes/mio` y ve solo su ficha.

### Implementación para la historia 5

- [ ] T023 [US5] Implementar A15/FR-023 en `backend/src/services/usuario.service.js`: en `crear`, si `rol` es `cliente`, exigir que el `correo` normalizado (sin espacios extremos, insensible a mayúsculas) coincida con el `correo` de un registro `clientes` existente y sin cuenta vinculada; si no coincide responder `ErrorServicio` con `400` y mensaje `el correo no coincide con ningún cliente registrado`; un cliente sin `correo` no puede recibir cuenta
- [ ] T024 [US5] Ampliar `backend/tests/contract/clientes-mio.contract.test.js` con la creación de cuenta `cliente` válida (201, con cliente coincidente) e inválida (400 sin cliente coincidente; 409 con correo de usuario ya registrado), conservando el 404 `No existe un cliente asociado a esta cuenta` de `/api/clientes/mio` sin vínculo
- [ ] T025 [US5] Agregar en `backend/tests/integration/clientes.integration.test.js` la verificación de FR-010: cliente con cuenta `activa` y registro `inactivo` inicia sesión y consulta su ficha; y de FR-025: la consulta ajena a `/api/clientes/:id` desde el rol `cliente` responde `403` sin datos de terceros

**Checkpoint**: todas las historias de negocio (US1–US5) funcionan de forma independiente.

---

## Phase 8: User Story 6 - Rediseño visual del inicio de sesión (Prioridad: P4)

**Objetivo**: implementar FR-027 a FR-033 (A12) solo en presentación, sin alterar
la autenticación existente (`frontend/src/services/api.js` y
`frontend/src/context/AuthContext.jsx` no se modifican).

**Prueba independiente**: abrir el login en escritorio (split 50/50 con la paleta
`#0a0b0e` / `#0f1117` / `#f05a24`) y en ≤768 px (panel oculto, sin desbordamiento),
usar el toggle de contraseña, navegar con teclado y verificar que el flujo de login
comporta idéntico al previo.

### Implementación para la historia 6

- [ ] T026 [US6] Implementar los estilos del rediseño en `frontend/src/styles/estilos.css`: distribución 50/50 en escritorio, fondo `#0a0b0e`, formulario sobre `#0f1117`, acentos `#f05a24`, ocultación del panel de presentación a ≤768 px con formulario centrado sin desbordamiento horizontal desde 320 px, estados de foco visibles y bloque `@media (prefers-reduced-motion: reduce)` que desactive animaciones (FR-027, FR-030, FR-031, FR-032)
- [ ] T027 [US6] Reescribir `frontend/src/pages/Login.jsx`: panel izquierdo con marca, título principal con resaltado naranja, tarjeta compacta de reconocimiento facial con estado visual **marcada como demostrativa** (nunca como resultado real) y puntos indicadores; formulario con correo, contraseña, control mostrar/ocultar contraseña, botón de envío y enlace de soporte cuyo texto no invente URLs; conservar campos, validaciones, llamadas a `api.js`, manejo de sesión y mensajes de error idénticos (FR-028, FR-029, FR-033)
- [ ] T028 [US6] Agregar las pruebas del componente en `frontend/src/pages/Login.test.jsx` (Vitest + React Testing Library): alterno de visibilidad de la contraseña, presencia del panel oculto en viewport ≤768 px, orden de tabulación y existencia de la media query `prefers-reduced-motion` (escribirlas primero y verificar que fallan)
- [ ] T029 [US6] Ejecutar `npm test` en `frontend/` dejando en verde `Login.test.jsx` y `api.test.js`, y verificar manualmente los escenarios R1–R7 del `quickstart.md` (SC-007, FR-033)

**Checkpoint**: el rediseño queda entregado sin alterar el comportamiento probado.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Propósito**: validación integral y cierre documental.

- [ ] T030 [P] Ejecutar y registrar los escenarios manuales del `quickstart.md` (A1–A9, U1–U8, C1–C8, R1–R7, E1–E3) en el entorno local — la aplicación con `DB_NAME=gym_db_pruebas` garantizada (ver T009) — verificando códigos exactos: 401 `correo o contraseña incorrectos`, bloqueo `409`, `404` en `DELETE`, auditoría visible y alcance SC-008 intacto (endpoints de Sprint 2 sin cambios)
- [ ] T031 [P] Ejecutar las suites completas `npm test` en `backend/` y en `frontend/` (con la cadena de `gym_db_pruebas` verificada, ver T008) y dejarlas en verde (SC-005)
- [ ] T032 Actualizar `specs/001-sprint1-base-auth/estado-repositorio.md` marcando como ejecutados los ajustes A1 (consolidación), A8 (mensaje), A10 (último administrador), A11 (auditoría), A12 (rediseño) y A15 (vínculo), con fecha y nota de verificación
- [ ] T033 Realizar commits incrementales por tarea o grupo lógico usando Conventional Commits con la descripción en español (ej.: `feat(auth): usar el mensaje exacto de credenciales incorrectas`), sin incluir `.env`, `.env.test` ni datos de credenciales

---

## Dependencies & Execution Order

### Dependencias por fase

- **Setup (Phase 1)**: sin dependencias — puede iniciarse de inmediato (T001 primero; T003/T004 en paralelo tras ella)
- **Foundational (Phase 2)**: depende del Setup — **bloquea todas las historias**; T005 → T006 → T007 → T008 (paro obligatorio) → T009 (paro obligatorio) en ese orden
- **User Stories (Phase 3–8)**: todas dependen de la fase Foundational
  - US1 (P1) y US2 (P2): independientes entre sí
  - US3 (P2) toca `backend/src/services/usuario.service.js`; US5 (P3) también toca ese archivo → **US5 debe ejecutarse después de US3** (evita conflictos en el mismo archivo)
  - US4 (P3) y US6 (P4): independientes de las demás
- **Polish (Phase 9)**: depende de las historias deseadas (mínimo US1 para MVP; todas para cierre del sprint)

### Dependencias entre historias

- **US1 (P1)**: sin dependencias de otras historias — MVP
- **US2 (P2)**: sin dependencias; usa la sesión de US1
- **US3 (P2)**: sin dependencias de historias; requiere Foundational
- **US4 (P3)**: independiente (archivos de clientes distintos)
- **US5 (P3)**: requiere US3 completada (mismo archivo `usuario.service.js`)
- **US6 (P4)**: independiente (solo frontend); no toca lógica de US1

### Dentro de cada historia

- Pruebas primero: actualizar/escribir pruebas y verificar que FALLAN antes del cambio
- Servicios antes que sus pruebas de integración
- Cada historia completa antes de pasar a la siguiente prioridad
- Commits al terminar cada tarea o grupo lógico

### Oportunidades de paralelismo

- T003 y T004 en paralelo tras T001
- T014 (frontend, `api.test.js`) en paralelo con T013 (`AuthContext.jsx`)
- US2 (frontend) puede trabajarse en paralelo con US1/US3 (backend)
- US4 (clientes) y US6 (login visual) pueden trabajarse en paralelo entre sí y con US5
- T030 y T031 en paralelo al cierre

---

## Parallel Example: User Story 3

```text
Tarea: "Implementar la protección del único administrador activo en backend/src/services/usuario.service.js" (T016)
Tarea: "Agregar registro de auditoría de usuarios en backend/src/services/usuario.service.js" (T017)
# Ambas tocan el mismo archivo → secuenciales (T016 antes que T017).

# En paralelo con US3 (archivos distintos):
Tarea: "Verificar cierre de sesión en frontend/src/context/AuthContext.jsx" (US2, T013)
```

## Parallel Example: User Story 6

```text
Tarea: "Implementar estilos del rediseño en frontend/src/styles/estilos.css" (T026)
Tarea: "Agregar pruebas del componente en frontend/src/pages/Login.test.jsx" (T028, primero; debe fallar)
# Ambas en paralelo; luego T027 reescribe frontend/src/pages/Login.jsx
```

---

## Implementation Strategy

### MVP primero (solo historia 1)

1. Completar Phase 1: Setup (consolidación A1, sin sobrescribir nada sin aprobación)
2. Completar Phase 2: Foundational (CRÍTICA — bloquea todo; doble mecanismo de aislamiento de BD + PAROS OBLIGATORIOS T008/T009)
3. Completar Phase 3: US1 (mensaje exacto de login, A8)
4. **PARAR y VALIDAR**: probar US1 de forma independiente (escenarios A1–A9 del quickstart)
5. Demostrar/desplegar si está listo

### Entrega incremental

1. Setup + Foundational → base consolidada, referencias actualizadas y aislada de `gym_db`
2. US1 → probar independientemente → demo (MVP)
3. US2 → probar independientemente → demo (ciclo completo de sesión)
4. US3 → probar independientemente → demo (usuarios con reglas de negocio)
5. US4 → probar independientemente → demo (clientes auditados)
6. US5 → probar independientemente → demo (vínculo y perfil propio)
7. US6 → probar independientemente → demo (login rediseñado, comportamiento idéntico)
8. Polish → cierre documental y suites completas en verde

### Notas

- [P] = archivos distintos, sin dependencias
- La etiqueta [Historia] vincula la tarea a US1–US6 para trazabilidad
- Cada historia debe ser completable y comprobable de forma independiente
- **PAROS OBLIGATORIOS**: T008 y T009 — si la cadena de garantía de
  `gym_db_pruebas` (`.env.test` cargado en el arranque, guard de
  `baseDatos.js`, override de entorno en la app) no puede verificarse, la
  ejecución se detiene y se solicita confirmación al usuario; **nunca** se ejecuta
  `npm test` ni la aplicación contra `gym_db`
- **Prohibido** en este sprint: migraciones nuevas (`004_…`), edición de las 5
  migraciones registradas, recrear `gym_db` o `gym_db_pruebas`, ejecutar
  `database/migrate.mjs`, modificar `backend/.env`, tocar la lógica de módulos de
  Sprint 2 (membresías, pagos, rostros, accesos, auditoría como endpoint) y
  modificar `frontend/src/services/api.js` o `frontend/src/context/AuthContext.jsx`
  fuera de la verificación de US2/US6
- **Consolidación segura (T001)**: no se sobrescriben archivos sin aprobación y la
  documentación de Spec Kit del workspace queda intacta
- Verificar siempre que las pruebas fallan antes de implementar (TDD en los
  ajustes con pruebas nuevas)
- Parar en cualquier checkpoint para validar la historia de forma independiente
