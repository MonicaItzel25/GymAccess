# Investigación: Sprint 3 — Entrenadores, rutinas, catálogo de ejercicios y dashboard administrativo

**Fecha**: 2026-10-19 | **Plan**: [plan.md](./plan.md) | **Espec**: [spec.md](./spec.md)

Objetivo: resolver las decisiones técnicas abiertas extraídas del Contexto técnico. No quedan elementos `NEEDS CLARIFICATION` en el plan; esta investigación documenta las decisiones de diseño, su racional y las alternativas descartadas, siguiendo el patrón de los Sprints 1 y 2.

## R-01. Migración del sprint y flujo de entorno

- **Decisión**: crear un único archivo `database/migrations/007_crear_tablas_sprint3.sql` con todas las tablas nuevas (o el grupo lógico que resulte de `data-model.md`), sin editar 001–006, y aplicarlo SOLO en `gym_db_pruebas` ejecutando desde `backend/`:
  `node --env-file=.env.test ../database/migrate.mjs`
- **Racional**: `migrate.mjs` carga `backend/.env` pero NO sobreescribe variables ya presentes en `process.env`; el `--env-file=.env.test` precarga `DB_NAME=gym_db_pruebas` y, por tanto, gana prioridad. Así se reutiliza el migrador existente (con su tabla de control `migraciones`) sin tocar infraestructura compartida ni arriesgar `gym_db`.
- **Alternativas descartadas**: (a) `npm run migrar` a secas — usa `backend/.env` y apuntaría a `gym_db` de producción, prohibido por FR-037; (b) modificar `migrate.mjs` para que acepte un argumento de entorno — toca infraestructura usada por todos los sprints sin necesidad; (c) script de migración paralelo — duplica el registro de migraciones y rompe la trazabilidad.

## R-02. Autorización por rol y por relación de recurso

- **Decisión**: encadenar en cada endpoint nuevo `autenticar` → `autorizar(...roles)` (patrón existente en `middlewares/authorize.js`) y validar la RELACIÓN recurso–usuario dentro del servicio: la gestión de rutinas/objetivos/progresos exige comprobar una asignación vigente entre el usuario autenticado (`rol entrenador`) y el cliente solicitado; la consulta del cliente exige que el `id` de la ficha coincida con la vinculada a su cuenta.
- **Racional**: la constitución II exige que el backend valide rol y relación; el middleware solo cubre el rol, y la relación («cliente asignado vigentemente», FR-014/FR-017/RN-005) solo puede comprobarse con una consulta a la base de datos en el momento de la operación.
- **Alternativas descartadas**: (a) guardar la lista de clientes asignados en el JWT — el token vive 8 horas y las asignaciones cambian antes, quedando obsoleto (riesgo de autorización obsoleta); (b) confiar en el `id_cliente` enviado por el frontend — burlable, prohibido por la constitución II.

## R-03. Restricciones de unicidad en MySQL (una asignación vigente; una rutina activa)

- **Decisión**: garantizar ambas unicidades con una **columna generada + índice único**, además de la validación en transacción:
  - `asignaciones`: columna generada `esta_vigente` = `1` cuando la asignación está vigente y `NULL` en caso contrario; `UNIQUE (id_cliente, esta_vigente)`. En MySQL un índice único permite múltiples `NULL`, por lo que el historial (asignaciones finalizadas) convive sin conflicto, mientras que un segundo registro vigente del mismo cliente falla a nivel de base de datos.
  - `rutinas`: columna generada `esta_activa` = `1` cuando `estado = 'activa'` y `NULL` en caso contrario; `UNIQUE (id_cliente, esta_activa)`.
  - El servicio ejecuta la operación en una **transacción** (desactivar la rutina anterior y activar la nueva; finalizar la asignación anterior antes de crear la siguiente) para que la validación de aplicación y la restricción no puedan divergir ante concurrencia.
- **Racional**: refuerza FR-006 y la regla de una única rutina activa (Clarification Q5) en el nivel de datos, no solo en el código; es consistente con el enfoque de fechas/estado ya usado en membresías (RN-004) y sobrevive a reintentos concurrentes. Funciona en MySQL 5.7 y 8 (compatible con mysql2).
- **Alternativas descartadas**: (a) `UNIQUE (id_cliente, estado)` — impide más de una fila finalizada/inactiva por cliente; (b) solo validación en aplicación sin índice — depende exclusivamente del código y no resiste concurrencia; (c) índices parciales (`WHERE`) — no soportados por MySQL.

## R-04. Historial de rutinas: versiones como filas

- **Decisión**: el «historial para comparar versiones» (FR-015) se materializa con **filas de rutina distintas**: cada plan nuevo es una fila adicional; al activarse, la anterior pasa a inactiva (una sola activa por cliente, Q5). Las ediciones de parámetros de la rutina vigente se guardan en la misma fila y su rastro queda en `auditoria` (FR-018). Los ejercicios de la rutina viven en una tabla dependiente con FK a la rutina.
- **Racional**: coincide con el lenguaje del spec y las aclaraciones («las versiones antiguas se conservan como historial»), evita tablas derivadas, respeta el sin-borrado físico (FR-036) y permite comparar evolución comparando filas con sus fechas.
- **Alternativas descartadas**: (a) tabla de snapshots/versiones por cada cambio de campo — complejidad añadida y datos parcialmente derivados de `auditoria`, que ya registra cada modificación; (b) mutar una única fila por cliente — destruiría el historial, violando FR-015/SC-004.

## R-05. Dashboard: agregados en la consulta (sin materialización)

- **Decisión**: endpoint `GET /api/dashboard` que ejecuta consultas agregadas (`COUNT`/`SUM`) sobre las tablas existentes (`clientes`, `membresias`, `pagos`, `accesos`) y las nuevas (entrenadores, asignaciones, rutinas, objetivos, progresos) acotadas por el periodo recibido, reutilizando la lógica de vigencia ya existente (`utils/fechas.js` y las reglas del Sprint 2) para «activos», «por vencer» (7 días, Q3) y «vencidos». Índices sobre las fechas consultadas.
- **Racional**: RN-011 y FR-027 exigen cálculo en consulta con las mismas reglas de negocio; con volúmenes de un solo gimnasio el costo es despreciable y no hay datos que mantener sincronizados.
- **Alternativas descartadas**: (a) tabla materializada de indicadores — información derivada prohibida salvo razón documentada (constitución III) y requiere recálculos; (b) caché en frontend — riesgo de datos ficticios o desactualizados, contradice SC-006.

## R-06. Pantalla de auditoría: ampliar el GET existente

- **Decisión**: reutilizar `GET /api/auditoria` (ya existente, solo administrador, sin DELETE) ampliándolo con **parámetros de consulta opcionales** de filtrado: `desde`, `hasta`, `modulo` (o `entidad`) y `actor`. No se crea ninguna operación de escritura. La pantalla nueva en el frontend consume ese endpoint.
- **Racional**: FR-030/FR-031 piden solo lectura con filtros; el endpoint ya garantiza el rol y la inmutabilidad, y los filtros opcionales no alteran el comportamiento existente (compatible con las pruebas del Sprint 2). Mantiene un único camino de consulta (sin duplicar endpoints).
- **Alternativas descartadas**: (a) endpoint nuevo `/api/auditoria/filtrada` — duplica lógica y rompe la regla de no duplicar rutas; (b) filtrado solo en frontend — descarga registros innecesarios y no escala la semántica de autorización.

## R-07. Contratos REST y formato de respuesta

- **Decisión**: documentar los endpoints nuevos y ampliados en `contracts/api.md` con: método, ruta en kebab-case (`/api/entrenadores`, `/api/asignaciones`, `/api/ejercicios`, `/api/rutinas`, `/api/objetivos`, `/api/progresos`, `/api/dashboard`), roles permitidos, esquema de solicitud con `express-validator`, esquema de respuesta `2xx`, y errores `400/401/403/404` con el formato `{ ok, message, … }` ya usado (`utils/response.js` y el `errorHandler` centralizado).
- **Racional**: es el patrón de los Sprints 1 y 2; garantiza nombres consistentes entre interfaz, API y documentación (constitución: experiencia de usuario) y pruebas de contrato reutilizables con supertest.
- **Alternativas descartadas**: (a) respuestas con otro formato o códigos — generaría dos convenciones paralelas en el mismo API; (b) GraphQL — tecnología nueva injustificada (constitución I).

## R-08. Frontend: rutas protegidas y menú por rol

- **Decisión**: registrar las pantallas nuevas en `App.jsx` siguiendo el patrón de protección existente (sesión desde `AuthContext`), añadir las entradas de menú correspondientes en `Layout.jsx` ocultas según rol, y añadir los métodos HTTP nuevos en `services/api.js`. La autorización real sigue resolviéndose en backend (R-02); la ocultación es solo ayuda visual.
- **Racional**: reutiliza el mecanismo ya probado en Sprints 1 y 2, respeta la constitución II y evita duplicar componentes de layout o autenticación.
- **Alternativas descartadas**: (a) sistema de rutas nuevo o librería de permisos — dependencia/alcance nuevo sin necesidad; (b) comprobar permisos solo en frontend — burlable, prohibido por la constitución II.

## R-09. Pruebas: cobertura y conservación de la BD de pruebas

- **Decisión**: pruebas por módulo en `backend/tests/` (patrón de los sprints existentes con supertest + `crearApp()`), cubriendo éxito, validación, permisos por rol y denegaciones (FR-038), y pruebas de pantalla en `frontend/src/pages/*.test.jsx` con Testing Library. Ampliar `backend/tests/helpers/baseDatos.js` (`vaciarTablas()`) con las tablas nuevas; los helpers conservan `verificarBasePruebas()` como guarda de entorno. Tras cada `npm test` se re-siembra con `node --env-file=.env.test validate-sprint2.mjs`.
- **Racional**: SC-008/SC-010 exigen 100% de suites nuevas y cero regresiones; ampliar el helper existente evita duplicar infraestructura y mantiene la guarda contra la base de producción.
- **Alternativas descartadas**: (a) un helper nuevo por sprint — duplicaría la guarda de entorno; (b) pruebas contra `gym_db` — prohibido (FR-037).

## R-10. Validación de parámetros de ejercicios y estados

- **Decisión**: validar con `express-validator` en la capa de validators: `series` y `repeticiones` enteros ≥ 1 dentro de un rango razonable (p. ej., 1–999), `peso_recomendado` y `descanso` numéricos ≥ 0 cuando se capturen, `instrucciones` no vacío cuando se capture (FR-016, RN-007); estados con conjuntos cerrados: entrenador y ejercicio (`activo/inactivo`), asignación (`vigente/finalizada`), rutina (`activa/inactiva`), objetivo (`activo/alcanzado/cerrado`). El progreso exige al menos uno entre valor numérico y avance descrito (FR-020), validado en aplicación.
- **Racional**: sigue el patrón de `express-validator` de los módulos existentes, los mensajes de error comprensibles exigidos por la constitución, y mantiene los estados como `ENUM` o `VARCHAR` controlados por la capa de servicio.
- **Alternativas descartadas**: (a) `CHECK` a nivel SQL para «valor o avance» — no soportado en MySQL 5.7 y menos mantenible que la validación centralizada; (b) estados arbitrarios libres — imposibilitaría las consultas del dashboard y las transiciones verificables.
