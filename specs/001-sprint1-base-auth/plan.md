# Plan de implementación: Sprint 1 — Base del sistema, autenticación, usuarios, roles, permisos, clientes y rediseño de login

**Rama**: `001-sprint1-base-auth` | **Fecha**: 2026-10-14 | **Espec**: [spec.md](spec.md)

**Entrada**: Especificación de la función desde `/specs/001-sprint1-base-auth/spec.md`

## Resumen

La especificación exige la base segura del sistema: inicio/cierre de sesión con
reglas de seguridad definidas (hash de contraseñas, sesión de 8 horas, bloqueo de
15 minutos tras 5 fallos, mensaje genérico y normalización de correo), gestión de
usuarios con los cuatro roles válidos y protección del último administrador activo,
gestión de clientes con vínculo opcional cuenta–cliente, consulta de perfil propio
exclusivo, autorización verificada en servidor según la matriz del Sprint 1, y un
rediseño visual del inicio de sesión con estética oscura y acento naranja que no
altere la lógica de autenticación existente.

El enfoque técnico: aplicación web en tres capas separadas (`frontend/` React,
`backend/` Node.js + Express con ES Modules, `database/` MySQL) comunicadas
exclusivamente por una API REST bajo `/api`, con migraciones versionadas y
registradas, validación y autorización siempre en servidor, y pruebas automatizadas
de unidades, integración y matriz de permisos. **Corrección de estado (ver
[estado-repositorio.md](estado-repositorio.md))**: existe código previo de los
Sprints 1 y 2 en `C:\Users\moni2\Documents\gymAccess1` y 5 migraciones/semillas
ya ejecutadas en `gym_db`; este plan se replantea como **adaptación sobre lo
existente** (sin recrear tablas, sin reiniciar la base de datos y sin editar
migraciones ejecutadas). Las decisiones A1, A5, A6, A7/A9 y A16 quedaron
**aprobadas el 2026-10-14** con las opciones recomendadas (consolidar el código
aquí como tarea, vínculo cuenta–cliente por correo, bloqueo en memoria, contratos
alineados al API existente y consulta básica de clientes del entrenador); quedan
como trabajo del Sprint 1 los ajustes de código A8, A10, A11, A12 y A15.

## Contexto técnico

**Lenguaje/versión**: JavaScript ES2022+ (ES Modules: `import`/`export`);
Node.js 20 LTS o superior para backend y scripts; React 18 con JavaScript para
frontend (sin TypeScript, según la regla del proyecto).

**Dependencias principales**: Express (web framework), `mysql2/promise` (driver
MySQL con consultas parametrizadas), `bcrypt` (hash de contraseñas, exigido por
regla), `jsonwebtoken` (JWT de 8 horas, exigido por regla), Vite (herramienta de
compilación/desarrollo del frontend), CORS (solo si frontend y backend se sirven en
distinto origen en desarrollo). Todas quedan justificadas en
[research.md](research.md).

**Almacenamiento**: **MySQL local exclusiva** (servicio del sistema en
`127.0.0.1:3306`; verificado en ejecución el 2026-10-14). No se usarán bases de
datos en la nube ni servicios externos de datos. Toda la administración se organiza
en la carpeta `database/` en la raíz del proyecto:

- `database/migrations/`: scripts SQL versionados para crear y modificar tablas
  (los ya ejecutados se conservan intactos; los cambios son migraciones nuevas
  numeradas desde `004_…`).
- `database/seeds/`: datos de prueba claramente identificados como tales.
- `database/migrate.mjs`: ejecutor de migraciones en JavaScript ES Modules que
  aplica los scripts en orden y registra cada ejecución en la tabla `migraciones`.
- `database/README.md`: instrucciones para configurar y utilizar la MySQL local.
- Conexión mediante variables de entorno leídas de `process.env`, con un archivo
  `.env.example` **sin contraseñas reales** (solo placeholders documentados).
- Registro de migraciones ejecutadas en la tabla `migraciones` (ya existe con
  5 entradas; su esquema real es `id_migracion`, `nombre` UNIQUE,
  `fecha_ejecucion`).

**Pruebas**: Vitest en backend (unidades + integración de API con `supertest` y base
de datos de prueba) y en frontend (componentes con React Testing Library). Nombres
de pruebas y aserciones en español.

**Plataforma objetivo**: aplicación web de una sola sucursal; navegador de escritorio
(≥1024 px) y responsivo hasta 320 px de ancho; servidor y MySQL en la máquina local
del gimnasio (Windows).

**Tipo de proyecto**: aplicación web (frontend + backend + base de datos separados).

**Metas de rendimiento**: operaciones típicas de la API en menos de 500 ms en
percentil 95 a la escala real (decenas de usuarios concurrentes como máximo); el
inicio de sesión completo no debe superar los 10 segundos (SC-001).

**Restricciones**: sesión con expiración de 8 horas; bloqueo de 15 minutos tras 5
intentos fallidos consecutivos; mensaje único `correo o contraseña incorrectos`;
solo los cuatro roles válidos; sin registro público ni recuperación por correo; sin
eliminación física de usuarios ni clientes; sin dependencias nuevas sin
justificación documentada; **MySQL solo local (sin nube ni servicios externos),
configuración de conexión por variables de entorno con `.env.example` sin
contraseñas reales, y `database/` como única administración del esquema**; el
rediseño de login NO puede alterar rutas, campos, validaciones, sesión, tokens ni
mensajes existentes.

**Escala/alcance**: ~20 endpoints REST, 4 roles, decenas de usuarios y clientes,
~8 pantallas del Sprint 1; la base de datos ya tiene sus tablas por las 5
migraciones/semillas ejecutadas (cualquier migración nueva requiere aprobación y se
numera desde 004), exclusivamente alcance de Sprint 1 (sin membresías funcionales,
pagos, reconocimiento facial, control de acceso, rutinas ni dashboard).

**Unknowns / NEEDS CLARIFICATION**: ninguno en el plan técnico. Verificación de
estado real (2026-10-14) en [estado-repositorio.md](estado-repositorio.md): el
repositorio de trabajo no contiene código, pero **sí existe trabajo previo** en
`C:\Users\moni2\Documents\gymAccess1` (backend, frontend y `database/` de los
Sprints 1 y 2) y **5 entradas ya ejecutadas** en `gym_db.migraciones`
(001–003 + 2 semillas) que se preservan intactas. Los ajustes de diseño que de
ello se derivan están listados allí (A1–A14).

## Verificación de la constitución

*CONTROL: Debe pasar antes de la investigación de la Fase 0. Se repite después del
diseño de la Fase 1.*

| # | Puerta (regla de la constitución) | Estado |
|---|---|---|
| 1 | Separación `frontend/`, `backend/`, `database/` | PASA |
| 2 | React (frontend), Node.js + Express (backend), MySQL; ES Modules exclusivos con `"type": "module"` | PASA |
| 3 | El frontend nunca se conecta a MySQL: solo API REST bajo `/api` | PASA |
| 4 | El backend valida datos, aplica reglas de negocio, autentica y autoriza; el rol proviene de la sesión validada, nunca del cliente | PASA |
| 5 | Cambios de esquema solo mediante migraciones versionadas en `database/`, registradas en `migraciones`, con orden y sin edición de migraciones ejecutadas (ya existen 5 entradas ejecutadas en `gym_db.migraciones`: 001, 002, 003 y 2 semillas — se preservan intactas; cualquier cambio futuro sería una migración nueva 004+) | PASA |
| 6 | Sin borrado físico de usuarios/clientes: baja lógica por estado; sin datos derivados innecesarios; operaciones relacionadas en transacciones | PASA |
| 7 | Contraseñas solo con hash bcrypt; jamás devueltas en API ni mostradas | PASA |
| 8 | JWT con expiración de 8 h; bloqueo 15 min tras 5 fallos; mensaje genérico `correo o contraseña incorrectos`; normalización de correo; cuentas inactivas sin sesión; sin registro público ni recuperación por correo | PASA |
| 9 | Solo los roles `administrador`, `recepcionista`, `entrenador`, `cliente`; sin rol `auditor`; último administrador activo protegido; cliente con cuenta vinculado a un registro de `clientes` | PASA |
| 10 | Validación en servidor de todo lo recibido; consultas parametrizadas; códigos HTTP apropiados sin exponer SQL, trazas ni secretos; sin aceptar rol/estado/ids de propietario del cliente sin validación | PASA |
| 11 | Datos biométricos: fuera del alcance del Sprint 1 (ningún registro facial) | PASA |
| 12 | Auditoría: registro mínimo de cambios de usuarios y clientes cumpliendo la regla X; auditoría completa difirienda al Sprint 2 según el alcance aprobado del spec | PASA (parcial justificado por alcance) |
| 13 | Rediseño de login: paleta `#0a0b0e`/`#0f1117`/`#f05a24`, split 50/50, ocultación ≤768 px, `prefers-reduced-motion`, indicador “Acceso autorizado” solo demostrativo, sin tocar la lógica de autenticación | PASA |
| 14 | Alcance: sin membresías funcionales, pagos, reconocimiento facial, control de acceso, rutinas, dashboard, registro público; sin nuevas tecnologías sin justificar (todas documentadas en research.md) | PASA |
| 15 | Proceso: depende solo de Sprint 1, sin ampliar alcance; contradicciones detectadas se escalan (ninguna detectada entre spec, sprint-1 y constitución) | PASA |
| 16 | Base de datos **local** exclusiva (`127.0.0.1:3306`, sin nube ni servicios externos); administración centralizada en `database/` (migrations, seeds, `migrate.mjs`, README); conexión por variables de entorno con `.env.example` sin secretos; migraciones ejecutadas registradas en `migraciones` y conservadas | PASA |

Resultado: **sin violaciones**; no se requiere registro en la tabla de complejidad.
Se repite la verificación tras la Fase 1 (ver más abajo).

## Estructura del proyecto

### Documentación (esta función)

```text
specs/001-sprint1-base-auth/
├── plan.md              # Este archivo (salida de /speckit.plan)
├── research.md          # Salida de la Fase 0
├── data-model.md        # Salida de la Fase 1
├── quickstart.md        # Salida de la Fase 1
├── estado-repositorio.md # Verificación del estado real y decisiones A1–A14
├── contracts/           # Salida de la Fase 1
│   ├── api.md           # Contrato REST de endpoints del Sprint 1
│   └── permisos.md      # Matriz de permisos y reglas de autorización
├── checklists/
│   └── requirements.md  # Checklist de calidad de la especificación
└── tasks.md             # Salida de /speckit.tasks (NO creado por /speckit.plan)
```

### Código fuente (estructura existente verificada, 2026-10-14)

> El código real reside hoy en `C:\Users\moni2\Documents\gymAccess1`; la
> **consolidación en esta raíz quedó aprobada (A1, 2026-10-14)** y se ejecutará
> como tarea en la fase de implementación. Se describe **la estructura existente**,
> sin renombrar ni mover archivos hasta esa ejecución.

```text
backend/                            # EXISTENTE (Express, ES Modules, "type": "module")
├── package.json                    # scripts: start, dev, test (vitest), migrar
├── .env.example                    # Placeholders de conexión (sin contraseñas reales)
├── .env                            # Valores locales reales (NO versionado)
├── vitest.config.js
├── src/
│   ├── app.js                      # Monta /api/auth, /api/usuarios, /api/clientes
│   │                               #   + rutas de Sprint 2 (Módulo A2, sin tocar)
│   ├── server.js                   # Punto de entrada (lee process.env)
│   ├── config/db.js                # Pool mysql2 con variables de entorno
│   ├── middlewares/                # auth.js (JWT), authorize.js (roles),
│   │                               #   errorHandler.js (errores sin fugas)
│   ├── routes/                     # auth.routes.js, usuario.routes.js,
│   │                               #   cliente.routes.js (+ Sprint 2)
│   ├── controllers/                # auth, usuario, cliente (+ Sprint 2)
│   ├── services/                   # auth.service (bloqueo en memoria),
│   │                               #   usuario.service, cliente.service (+ S2)
│   ├── models/                     # consultas parametrizadas por entidad
│   ├── validators/                 # reglas express-validator (D7 revisado)
│   └── utils/                      # response.js ({ok,data|message}), errorServicio.js
└── tests/
    ├── unit/                       # p. ej. validadores.test.js
    ├── integration/                # auth, usuarios, clientes (+ Sprint 2)
    ├── contract/                   # auth, usuarios, usuarios-rol, clientes, …
    └── helpers/baseDatos.js        # usa gym_db_pruebas

frontend/                           # EXISTENTE (React 18 + Vite + react-router-dom)
├── package.json
├── vite.config.js                  # proxy /api → backend (verifica D16)
├── vitest.config.js
└── src/
    ├── main.jsx / App.jsx          # rutas y guardas de sesión
    ├── context/AuthContext.jsx     # token en localStorage (verifica D6)
    ├── services/api.js             # cliente HTTP con Authorization Bearer
    ├── components/                 # Layout.jsx, CapturaRostro.jsx
    ├── styles/estilos.css
    └── pages/                      # Login.jsx (rediseño pendiente A12),
                                    #   Inicio, Usuarios, Clientes, MiPerfil,
                                    #   + páginas de Sprint 2 (fuera de alcance)
```

```text
database/                           # Administración de la MySQL local (raíz del proyecto)
│                                   #   Hoy: C:\Users\moni2\Documents\gymAccess1\database
│                                   #   (consolidar en esta raíz = decisión A1)
├── migrations/                     # SQL versionados — YA EJECUTADOS, preservar:
│   ├── 001_crear_base_datos.sql          # 2026-10-07 — no editar
│   ├── 002_crear_tablas_sprint1.sql      # 2026-10-07 — no editar
│   ├── 003_crear_tablas_sprint2.sql      # 2026-10-12 — no editar
│   └── (cambios futuros: archivos nuevos 004_… con aprobación)
├── seeds/                          # Datos de prueba identificados — YA EJECUTADOS:
│   ├── 001_usuario_admin.sql             # 2026-10-07 — no editar
│   └── 002_tipos_membresia_ejemplo.sql   # 2026-10-12 — no editar
├── scripts/
│   └── ejecutar-migraciones.mjs    # Ejecutor ESM actual (registra en `migraciones`)
│                                   #   → renombrar a database/migrate.mjs
│                                   #     (aprobado A1; ver D8)
├── migrate.mjs                     # Nombre estándar objetivo (A1 aprobada;
│                                   #   pendiente de ejecución en tareas)
└── README.md                       # Configuración y uso de la MySQL local
```

**Decisión de estructura**: se adopta la opción de aplicación web (frontend +
backend + database) exigida por la constitución. Los árboles anteriores describen
**la estructura existente verificada** (código en `C:\Users\moni2\Documents\gymAccess1`):
patrón `src/{routes,controllers,services,models,middlewares,validators,utils}` en
el backend y `src/{context,services,components,pages,styles}` en el frontend.
**A1 quedó aprobada el 2026-10-14 (opción (a))**: consolidar `gymAccess1` en esta
raíz —copiar `backend/`, `frontend/` y `database/` sin eliminar el original— y
adoptar el patrón existente (descartado el árbol `src/modules/<entidad>/`,
A3), incluido el renombrado del ejecutor a `database/migrate.mjs` (D8). **La
consolidación y el renombrado se ejecutan como tareas** en la fase de
`/speckit.tasks`/implementación; hasta entonces no se mueven ni renombran
archivos, y ninguna fase de documentación modifica código ni tablas.

## Verificación de la constitución (revisión posterior a la Fase 1)

Tras diseñar el modelo de datos, los contratos y la guía de validación:

| Diseño | Cumplimiento |
|---|---|
| `data-model.md`: claves primarias/foráneas, únicas y `NOT NULL`, índices de consulta frecuente, estados en lugar de borrado físico, sin datos derivados, transacciones en operaciones relacionadas, migraciones ordenadas y registradas | PASA |
| `contracts/api.md`: solo endpoints REST bajo `/api`, validación de entrada en servidor, códigos 400/401/403/404/409/500 con mensajes seguros (sin `405`: la ruta DELETE inexistente responde `404`), sin campos de rol/ids de propietario aceptados del cliente sin autorización, sin contraseñas ni hashes en respuestas | PASA |
| `contracts/permisos.md`: matriz idéntica a la del spec, rol derivado de la sesión, cliente confinado a su propio recurso, último administrador protegido | PASA |
| `quickstart.md`: validación de reglas de seguridad (8 h, 15 min/5 fallos, mensaje genérico, inactivos), de permisos y del rediseño sin alterar la lógica | PASA |
| Base de datos local: todo el flujo (puesta en marcha, migraciones, semillas y pruebas) opera contra la MySQL local vía `database/migrate.mjs` y variables de entorno; cero dependencias de nube o servicios externos; ninguna migración registrada modificada (5/5 intactas) | PASA |
| Alcance: ninguna entidad ni endpoint de membresías, pagos, facial, acceso, rutinas o dashboard; ninguna migración existente modificada | PASA |

Resultado: **sin violaciones tras el diseño**. Ningún ítem pendiente para
Complexity Tracking.

## Registro de complejidad

> Se completa SOLO si la Verificación de la constitución detecta violaciones que
> deban justificarse.

Sin violaciones de la constitución. Ninguna justificación de complejidad pendiente.
