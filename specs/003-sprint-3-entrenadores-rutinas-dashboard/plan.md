# Plan de implementación: Sprint 3 — Entrenadores, rutinas, catálogo de ejercicios y dashboard administrativo

**Rama**: `003-sprint-3-entrenadores-rutinas-dashboard` | **Fecha**: 2026-10-19 | **Espec**: [spec.md](./spec.md)

**Entrada**: Especificación de la funcionalidad desde `/specs/003-sprint-3-entrenadores-rutinas-dashboard/spec.md`

**Nota**: este archivo lo genera el comando `/speckit.plan`; su definición describe el flujo de ejecución.

## Resumen

El Sprint 3 extiende la aplicación web existente con el módulo de entrenamiento completo: perfil de entrenador vinculado a cuentas con rol `entrenador`, asignaciones entrenador–cliente (una vigente por cliente), catálogo independiente de ejercicios, rutinas con historial de versiones y una única rutina activa por cliente, objetivos y entradas de progreso; más dos vistas de administración: un dashboard con indicadores consolidados calculados en vivo con datos reales y una pantalla de auditoría de solo lectura con filtros.

El enfoque técnico reutiliza la arquitectura en capas consolidada en los Sprints 1 y 2 (rutas → controladores → servicios → modelos, con `express-validator`, middleware `autenticar`/`autorizar` y registro de auditoría mediante `auditoria.service.js`), agrega una única migración nueva (`007_crear_tablas_sprint3.sql`) aplicada exclusivamente en `gym_db_pruebas`, y calcula los indicadores del dashboard con consultas agregadas al momento de la consulta sobre las tablas ya existentes, sin información derivada almacenada. El frontend añade pantallas nuevas al patrón de rutas protegidas por rol existente, conserva la pantalla de inicio del Sprint 2 intacta y respeta la estética Dark Fitness & Warm Orange.

## Contexto técnico

**Lenguaje/versión**: JavaScript (ES Modules) — Node.js 20+ en el backend y React 18 en el frontend; sin TypeScript.

**Dependencias principales**: Express 4.21, express-validator 7, mysql2 3, jsonwebtoken 9, bcrypt 5 (backend); React 18.3, React Router 6.28, Vite 5.4 (frontend). El sprint no introduce dependencias nuevas (constitución I: tecnologías externas solo con justificación previa).

**Persistencia**: MySQL con migraciones versionadas en `database/migrations/` (001–006 existentes e intocables). El sprint crea la migración `007_crear_tablas_sprint3.sql` (siguiente número disponible) y la aplica SOLO en `gym_db_pruebas` mediante `node --env-file=.env.test ../database/migrate.mjs` ejecutado desde `backend/`: el `--env-file` precarga `DB_NAME=gym_db_pruebas` en el entorno y `migrate.mjs` no sobreescribe variables ya definidas. Prohibido ejecutar `npm run migrar` sin `.env.test` (conectaría con `backend/.env` apuntando a `gym_db` de producción). `gym_db` no se opera en este sprint.

**Pruebas**: backend — Vitest + supertest, ejecutadas con `npm test` (`node --env-file=.env.test ./node_modules/vitest/vitest.mjs run`); frontend — Vitest + Testing Library + jsdom con `npm test`. Tras cada `npm test` la BD de pruebas queda vacía y se re-siembra con `node --env-file=.env.test validate-sprint2.mjs`.

**Plataforma objetivo**: aplicación web local; backend en `127.0.0.1:3001`, frontend Vite en desarrollo; escritorio y pantallas de hasta 768 px (SC-009), con `prefers-reduced-motion` respetado.

**Tipo de proyecto**: monorepo web con tres capas — `backend/` (API REST), `frontend/` (SPA React) y `database/` (migraciones SQL).

**Metas de rendimiento**: SC-001 — flujo demostrable completo en menos de 15 minutos; los indicadores del dashboard se calculan en la consulta (RN-011) sobre volúmenes de un solo gimnasio (centenas de registros por tabla); no se exigen metas de alto rendimiento.

**Restricciones**: constitución v1.0.0 — el backend es la única autoridad de validación y autorización (FR-032, RN-001); autenticación JWT (8 h) y bcrypt intactos; sin eliminaciones físicas de las nuevas entidades (FR-036, SC-004); auditoría inmutable y sin datos sensibles (FR-031, RN-010); migraciones solo nuevas y aplicadas solo en `gym_db_pruebas` (FR-037); E3 sin cambios (FR-039, RN-014); pruebas obligatorias de éxito, validación, permisos y denegación (FR-038, SC-002); cero regresiones en Sprints 1 y 2 (FR-035, SC-008, SC-010).

**Alcance/escala**: 9 historias (P1–P3), FR-001…FR-039, RN-001…RN-014; 7 entidades nuevas materializadas en 7 tablas nuevas (incluido el cruce `ejercicio_rutina`); ~8 routers y ~10 pantallas nuevas; 1 migración; 39 requisitos funcionales.

**Clarificaciones resueltas**: cero elementos `NEEDS CLARIFICATION`. Las 5 preguntas del `/speckit.clarify` fijaron: continuidad de rutinas tras reasignación (Q1), administración exclusiva del catálogo por el administrador (Q2), umbral de membresías «por vencer» = 7 días (Q3), alcance agregado del dashboard para el administrador sin detalle individual (Q4) y una única rutina activa por cliente (Q5).

## Comprobación de la constitución

*GATE: debe superarse antes de la investigación de la Fase 0. Se vuelve a comprobar tras el diseño de la Fase 1.*

| Principio | Requisito aplicable al sprint | Estado |
|---|---|---|
| I. Arquitectura por capas con API REST | Las pantallas nuevas consumen únicamente la API; solo el backend toca MySQL; sin dependencias nuevas injustificadas | CUMPLE |
| II. Backend como única autoridad | Todo endpoint nuevo usa `autenticar` + `autorizar(...roles)` y valida la relación con el recurso (asignación vigente); la interfaz solo oculta opciones (FR-032) | CUMPLE |
| III. Persistencia migrable y auditable | Migración 007 nueva sin editar 001–006; PK/FK/restricciones únicas/`NOT NULL`/índices; sin tablas derivadas (RN-011); sin borrados físicos (FR-036); transacciones en operaciones multi-fila (activación de rutina, alta de asignación); auditoría no editable (FR-031) | CUMPLE |
| IV. Seguridad y privacidad | Sin cambios en autenticación; la auditoría del sprint registra actor/acción/fecha/entidad/resultado sin contraseñas, JWT ni biométricos (RN-010) | CUMPLE |
| V. Alcance estricto y pruebas obligatorias | Solo tareas del sprint; pruebas de éxito, validación, permisos y denegación (FR-038, SC-002); E3 sin cambios (FR-039); cero regresiones (SC-008, SC-010); documentación alineada | CUMPLE |
| Restricciones técnicas (ES Modules, validación, errores, roles) | Estructura modular existente sin duplicar lógica; `express-validator`; códigos HTTP y mensajes comprensibles sin exponer SQL; roles fijos (sin rol `auditor`) | CUMPLE |
| Roles y autorización | El entrenador solo opera con sus asignados; el recepcionista no edita rutinas; el cliente solo consulta lo propio; el administrador gestiona el resto (matriz de permisos del spec) | CUMPLE |
| Proceso de desarrollo y UX | Estados vacíos, errores y confirmaciones en pantallas nuevas; sin duplicar componentes; nombres consistentes entre interfaz, API y documentación; estética Dark Fitness, 768 px y `prefers-reduced-motion` | CUMPLE |
| Alcance excluido | Ningún ítem excluido (móvil, sucursales múltiples, clases grupales, pagos integrados, registro público) se toca | CUMPLE |

**Resultado del GATE**: CUMPLE — sin violaciones que justificar. Se re-comprueba tras la Fase 1 (ver «Re-comprobación tras la Fase 1» al final).

## Estructura del proyecto

### Documentación (esta funcionalidad)

```text
specs/003-sprint-3-entrenadores-rutinas-dashboard/
├── plan.md                  # Este archivo (salida de /speckit.plan)
├── research.md              # Salida de la Fase 0
├── data-model.md            # Salida de la Fase 1
├── quickstart.md            # Salida de la Fase 1
├── contracts/               # Salida de la Fase 1
│   └── api.md               # Contratos REST de los endpoints nuevos y ampliados
├── spec.md                  # Especificación (previa, con Clarifications)
├── checklists/
│   └── requirements.md      # Checklist de calidad (16/16)
└── tasks.md                 # Salida de /speckit.tasks (NO creado por /speckit.plan)
```

### Código fuente (raíz del repositorio)

```text
backend/
├── src/
│   ├── config/db.js
│   ├── middlewares/
│   │   ├── auth.js                  # autenticar (sin cambios)
│   │   ├── authorize.js             # autorizar(...roles) (sin cambios, se reutiliza)
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── (existentes: usuario, cliente, membresia, pago, acceso, auditoria, …)
│   │   ├── entrenador.model.js          # nuevo
│   │   ├── asignacion.model.js          # nuevo
│   │   ├── ejercicio.model.js           # nuevo
│   │   ├── rutina.model.js              # nuevo (+ ejercicios de rutina)
│   │   ├── objetivo.model.js            # nuevo
│   │   ├── progreso.model.js            # nuevo
│   │   └── dashboard.model.js           # nuevo (consultas agregadas)
│   ├── services/
│   │   ├── auditoria.service.js         # reutilizado (registrarAccion)
│   │   ├── entrenador.service.js        # nuevo
│   │   ├── asignacion.service.js        # nuevo
│   │   ├── ejercicio.service.js         # nuevo
│   │   ├── rutina.service.js            # nuevo
│   │   ├── objetivo.service.js          # nuevo
│   │   ├── progreso.service.js          # nuevo
│   │   └── dashboard.service.js         # nuevo
│   ├── controllers/                 # + entrenador, asignacion, ejercicio, rutina,
│   │                                #   objetivo, progreso, dashboard, miEntrenamiento
│   │                                #   (auditoria existente se amplía con filtros)
│   ├── routes/                      # + 8 routers nuevos (auditoria existente se amplía)
│   ├── validators/                  # + validators por módulo nuevo
│   ├── utils/ (fechas.js, response.js, errorServicio.js)  # reutilizados
│   ├── app.js                       # modificado: monta los routers nuevos
│   └── server.js
└── tests/                           # + archivos de pruebas por módulo nuevo;
                                     #   helpers/baseDatos.js ampliado con tablas nuevas

frontend/
├── src/
│   ├── App.jsx                      # modificado: rutas de las pantallas nuevas
│   ├── components/Layout.jsx        # modificado: menú según rol
│   ├── context/AuthContext.jsx      # sin cambios
│   ├── services/api.js              # modificado: métodos de los módulos nuevos
│   ├── pages/
│   │   ├── (existentes: Inicio, Clientes, Membresias, Pagos, Accesos, …)
│   │   ├── Entrenadores.jsx         # nuevo (US-S3-01)
│   │   ├── Asignaciones.jsx         # nuevo (US-S3-02)
│   │   ├── Ejercicios.jsx           # nuevo (US-S3-08)
│   │   ├── Rutinas.jsx              # nuevo (US-S3-03)
│   │   ├── ObjetivosProgreso.jsx    # nuevo (US-S3-04)
│   │   ├── MiRutina.jsx             # nuevo (US-S3-05)
│   │   ├── MiProgreso.jsx           # nuevo (US-S3-05)
│   │   ├── Dashboard.jsx            # nuevo (US-S3-06)
│   │   ├── Auditoria.jsx            # nuevo (US-S3-09)
│   │   └── PersonalAsignado.jsx     # nuevo (US-S3-07)
│   └── styles/estilos.css           # modificado: estilos de las pantallas nuevas
└── (las pruebas de pantallas se colocan junto a cada archivo: *.test.jsx)

database/
├── migrations/
│   ├── 001_… a 006_…                # intocables (FR-048 del Sprint 2)
│   └── 007_crear_tablas_sprint3.sql # nuevo — SOLO se aplica en gym_db_pruebas
├── seeds/
└── migrate.mjs                      # sin cambios
```

**Decisión de estructura**: monorepo web de tres capas ya consolidado en los Sprints 1 y 2 (`backend/`, `frontend/`, `database/`). El sprint solo añade los archivos señalados como nuevos y modifica `app.js`, `App.jsx`, `Layout.jsx`, `api.js`, `estilos.css` y `tests/helpers/baseDatos.js` siguiendo los patrones existentes; no se crean proyectos ni capas adicionales.

## Seguimiento de complejidad

Sin violaciones de la constitución que justificar: la comprobación inicial y la posterior al diseño (Fase 1) resultan en CUMPLE para los cinco principios, por lo que la tabla queda vacía.

## Re-comprobación tras la Fase 1

*Se ejecuta tras generar `research.md`, `data-model.md`, `contracts/api.md` y `quickstart.md`.*

- **Principio I**: el diseño mantiene las tres capas; los contratos son REST/JSON y ningún componente del frontend accede a MySQL → CUMPLE.
- **Principio II**: los contratos definen roles explícitos por endpoint y relaciones de recurso (asignación vigente) validadas en servidor → CUMPLE.
- **Principio III**: `data-model.md` especifica PK/FK/únicas/índices, restricciones de unicidad por columna generada para «una asignación vigente por cliente» y «una rutina activa por cliente», transacciones en esas operaciones, sin tablas derivadas (dashboard calculado en consulta) y sin borrados físicos → CUMPLE.
- **Principio IV**: el contrato de auditoría sigue siendo solo lectura y sin campos sensibles; no se toca la autenticación → CUMPLE.
- **Principio V**: `quickstart.md` cubre validación por rol, casos de denegación y suites completas sin regresiones; E3 permanece intacto → CUMPLE.

**Resultado**: CUMPLE — el diseño no introduce violaciones; no se registra nada en «Seguimiento de complejidad».
