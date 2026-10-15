# Investigación — Sprint 1: base del sistema, autenticación y gestión

**Función**: 001-sprint1-base-auth | **Fecha**: 2026-10-14 | **Fase**: 0

> **Corrección posterior a la verificación del repositorio (2026-10-14)**: existe
> trabajo previo en `C:\Users\moni2\Documents\gymAccess1` y 5 migraciones ya
> ejecutadas en `gym_db`. Las decisiones **D1, D5, D8 y D12** quedan afectadas y
> deben revisarse según los ajustes A1, A5, A6 y A13 de
> [estado-repositorio.md](estado-repositorio.md); el resto se mantiene. Re-verificado
> el 2026-10-14 antes de la decisión de MySQL local (D17): servicio en ejecución,
> `gym_db` con sus 5 migraciones registradas y 9 tablas intactas; nada recreado.
>
> **Revisión de consistencia (2026-10-14, tras `DESCRIBE` de `usuarios`,
> `clientes`, `auditoria` y `migraciones`)**:
> - **D7 y D15 ajustadas** a lo realmente existente (express-validator; patrón
>   `routes/controllers/services/models`), descartando las versiones anteriores.
> - **Verificadas compatibles con el código real**: D3 (`mysql2`), D4 (`bcrypt` +
>   `jsonwebtoken` en `package.json`), D6 (token en `localStorage`), D13
>   (`process.env` + `.env.example`), D14 (Vitest + supertest + RTL) y D16 (proxy
>   `/api` en `vite.config.js`).
> - **Con nota de revisión**: D1 (A1 aprobada), D5 (A6 aprobada), D8 (renombrado
>   aprobado con A1) y D12 (A13: las tablas ya existen y se conservan).
> - **Sin cambios**: D2 (Vite), D9–D11, D13–D17 (D17 es la decisión vinculante
>   de MySQL local).

No quedan incógnitas marcadas como NEEDS CLARIFICATION en el plan. Este documento
consolida las decisiones técnicas, su justificación y las alternativas descartadas.

## D1 — Estructura inicial del repositorio

- **Decisión**: crear la estructura de tres capas `frontend/`, `backend/` y
  `database/` desde cero, conforme a la constitución, sin migrar ni reutilizar
  código previo (no existe: la raíz solo contiene `.opencode/`, `.specify/`,
  `docs/`, `specs/` y `AGENTS.md`).
- **Razon**: la regla de arquitectura exige la separación de carpetas y no hay
  código inspeccionable ni migraciones ejecutadas que preservar.
- **Alternativas consideradas**: monocarpete `src/` (viola la separación exigida);
  esperar a que exista código (imposible: repositorio vacío de código).

> **Revisión (2026-10-14, A1)**: el supuesto "repositorio vacío" era **incorrecto**
> al momento de redactar esta decisión: existe código completo del Sprint 1 (y del
> Sprint 2) en `C:\Users\moni2\Documents\gymAccess1` con la estructura de tres
> capas ya implementada (`frontend/`, `backend/`, `database/`). La regla de
> arquitectura se cumple con esa estructura existente, que **se conserva**; la
> consolidación en esta raíz queda como decisión **pendiente A1** (opción
> recomendada (a), sección 6.1 de [estado-repositorio.md](estado-repositorio.md)).
> No se crea nada desde cero ni se duplican carpetas sin aprobación.
> **Estado (2026-10-14): A1 aprobada (opción (a))** — consolidar el código aquí;
> la copia se ejecuta como tarea en la fase de implementación.

## D2 — Herramienta de compilación del frontend

- **Decisión**: Vite con el plugin oficial de React y JavaScript (sin TypeScript).
- **Razon**: crea y compila un proyecto React con ES Modules sin dependencias
  innecesarias, tiene proxy de desarrollo hacia `/api` (evita configurar CORS en
  desarrollo) y es el estándar actual para proyectos nuevos de este tipo.
- **Alternativas consideradas**: Create React App (oficialmente deprecado y sin
  mantenimiento); Parcel (menor ecosistema para React); Webpack a mano (configuración
  manual sin beneficio para este alcance).

## D3 — Driver de base de datos

- **Decisión**: `mysql2/promise` con pool de conexiones y consultas parametrizadas
  con marcadores `?`.
- **Razon**: soporta ES Modules y promesas, es el driver activo para MySQL con
  Node, y sus consultas parametrizadas cubren la regla anti-inyección SQL sin capas
  adicionales.
- **Alternativas consideradas**: `mysql` (legacy, sin promesas); ORMs
  (Prisma/Sequelize/Knex: nueva tecnología de mayor superficie, lenguaje de esquema
  propio y regla de migraciones manuales del proyecto que prefiere SQL versionado).

## D4 — Hash de contraseñas y tokens

- **Decisión**: `bcrypt` para hashes (sal integrada, factor de trabajo por defecto
  del paquete) y `jsonwebtoken` para JWT con `exp` de 8 horas que incluya `id`,
  `correo` y `rol` firmados; nunca datos sensibles adicionales en el payload.
- **Razon**: la constitución exige expresamente bcrypt y JWT con expiración de
  8 horas; ambas librerías son el estándar maduro de cada uno.
- **Alternativas consideradas**: argon2/scrypt (la regla nombra bcrypt);
  JWT implementado a mano (riesgo de error criptográfico); sesiones de servidor con
  cookie httpOnly (cambiaría el modelo de sesión definido en la especificación).

## D5 — Almacenamiento del intento de login y bloqueo de 15 minutos

- **Decisión**: tabla `intentos_login` indexada por correo normalizado con columnas
  `intentos_consecutivos`, `ultimo_intento_en` y `bloqueado_hasta`; el contador se
  incrementa en cada fallo, se reinicia en un inicio exitoso y no depende de que la
  cuenta exista. El mensaje de bloqueo es idéntico exista o no el correo.
- **Razon**: el caso límite de la especificación exige que el bloqueo y el mensaje
  no revelen si el correo existe; guardar contadores en `usuarios` solo cubriría
  cuentas reales.
- **Alternativas consideradas**: columnas en `usuarios` (revela existencia y no
  cubre correos inexistentes); almacenamiento en memoria del proceso (se pierde al
  reiniciar y no sirve con varias instancias); Redis (servicio externo nuevo, sin
  justificación para la escala de una sola sucursal).

> **Revisión (2026-10-14, A6)**: la tabla `intentos_login` **no existe** en la BD
> real; el bloqueo implementado vive en **memoria** (`auth.service.js`) con
> exactamente el comportamiento exigido (5 fallos → 15 minutos, mensaje idéntico
> exista o no el correo). La decisión queda **pendiente A6**: aceptar el estado en
> memoria (opción recomendada, coherente con el supuesto de una sola computadora
> e instancia única, sección 6.3 de [estado-repositorio.md](estado-repositorio.md))
> documentando que se pierde al reiniciar el servidor, o bien crear la migración
> nueva `004_…` aquí descrita si se exige persistencia entre reinicios.
> **Estado (2026-10-14): A6 aprobada (opción (a))** — se acepta el bloqueo en
> memoria y queda documentada su limitación; la migración persistente queda
> descartada mientras no cambie el supuesto de instancia única.

## D6 — Almacenamiento de la sesión en el frontend

- **Decisión**: guardar el token en `localStorage` con clave fija del proyecto,
  enviarlo en la cabecera `Authorization: Bearer` y eliminarlo al cerrar sesión.
- **Razon**: la especificación pide que el cierre de sesión elimine la sesión local
  y que la app exija autenticación de nuevo; con un JWT de 8 horas y una sola
  sucursal es el patrón simple y verificable. El riesgo de XSS se mitiga con la
  validación en servidor y sin inserción de HTML dinámico.
- **Alternativas consideradas**: token solo en memoria (se pierde al recargar y
  complica el flujo); cookie httpOnly (requiere configuración de CORS con
  credenciales y protección CSRF, más complejidad de la necesaria).

## D7 — Validación de entradas

- **Decisión**: **adoptar la validación existente** con `express-validator`, ya
  presente en `backend/package.json` y aplicada en `backend/src/validators/`
  (`auth.validators.js`, `usuario.validators.js`, `cliente.validators.js`,
  `validar.js`) invocada desde las rutas; respuestas 400 con mensajes en español.
  No se introduce ninguna librería de validación nueva.
- **Razon**: el código real ya usa este patrón (verificado 2026-10-14); cambiarlo
  por validadores propios o por `zod` duplicaría lógica y violaría la regla de no
  reescribir trabajo existente (A3).
- **Alternativas consideradas**: validadores a medida (ya descartada por
  duplicar lo existente); `zod` (dependencia nueva sin necesidad); mantener dos
  sistemas de validación paralelos (inconsistente, descartado).

## D8 — Ejecutor de migraciones

- **Decisión**: script propio `database/migrate.mjs` (ES Modules) que aplica en
  orden los archivos numerados de `database/migrations/`, registra cada uno en la
  tabla `migraciones` (columnas reales: `nombre` UNIQUE y `fecha_ejecucion` con
  DEFAULT CURRENT_TIMESTAMP) y no vuelve a ejecutar una migración ya registrada.
  El checksum de contenido se **omite** deliberadamente: la tabla ya existe con
  5 entradas y añadiría una columna nueva sin necesidad funcional en Sprint 1.
- **Razon**: cubre las reglas de migración versionada, orden y registro con una
  dependencia cero; el proyecto ya exige SQL versionado manualmente. El proyecto
  previo contiene el mismo ejecutor en
  `database/scripts/ejecutar-migraciones.mjs` con idéntica lógica de registro:
  **la adopción con el nombre estándar `database/migrate.mjs` quedó aprobada
  con A1 (2026-10-14)** y se hará como **renombrado** sin alterar su
  comportamiento ni las filas registradas; hasta su ejecución como tarea de la
  fase de implementación, el archivo no se mueve ni se renombra.
- **Alternativas consideradas**: Knex CLI/Umzug/Flyway (nuevas tecnologías y otro
  formato de definición de esquema); ejecución manual en MySQL Workbench (sin
  registro ni orden reproducible); añadir columna de checksum (requiere migración
  sobre una tabla ya poblada, sin beneficio para el Sprint 1).

## D9 — Almacenamiento de los roles

- **Decisión**: columna `rol` ENUM de los cuatro valores exactos más `NOT NULL` en
  `usuarios`; la “gestión de roles” del administrador es asignar este campo.
- **Razon**: los roles son fijos por regla (sin `auditor` ni altas/bajas de rol en
  este sprint); el ENUM en MySQL garantiza a nivel de datos que no aparezca un quinto
  rol.
- **Alternativas consideradas**: tabla `roles` con FK (útil solo si hubiera CRUD de
  roles o permisos por rol configurable, que está fuera de alcance).

## D10 — Estructura de autenticación y cierre de sesión

- **Decisión**: `POST /api/auth/login` emite el JWT de 8 horas; el cierre de sesión
  es una acción del cliente (borrar token) sin endpoint ni lista negra de tokens.
- **Razon**: la especificación solo exige que la sesión local se elimine y que las
  rutas privadas exijan autenticación; una lista negra añadiría persistencia y
  consultas por request sin beneficio dentro de las 8 horas definidas.
- **Alternativas consideradas**: endpoint de logout con persistencia de tokens
  revocados (complejidad innecesaria para el alcance).

## D11 — Cobertura de auditoría en el Sprint 1

- **Decisión**: tabla `auditoria` insert-only con servicio interno que registra
  actor, acción, fecha/hora, entidad, identificador y resultado de los cambios de
  usuarios y clientes; sin interfaz de consulta en este sprint.
- **Razon**: la constitución (sección X) exige registrar cambios de usuarios como
  acción relevante, mientras que el alcance aprobado deja la auditoría completa
  (membresías, pagos, accesos) para el Sprint 2.
- **Alternativas consideradas**: omitir toda auditoría (viola la constitución);
  interfaz de consulta completa ahora (ampliaría el alcance del sprint).

## D12 — Tablas de membresías y pagos

- **Decisión**: NO crear tablas de tipos de membresía, membresías o pagos en el
  Sprint 1; el Sprint 2 las creará con sus propias migraciones.
- **Razon**: la especificación lo permite (“solo podrán prepararse
  estructuralmente”) y crear esquema especulativo obligaría a modificarlo luego,
  aumentando el riesgo de migraciones correctivas.
- **Alternativas consideradas**: crearlas vacías desde ya (sin consumidor ni
  reglas definidas aún).

> **Revisión (2026-10-14, A13)**: estas tablas **ya existen** en `gym_db` —
> creadas por la migración ejecutada `003_crear_tablas_sprint2.sql` y pobladas
> parcialmente (`tipos_membresia` con datos de ejemplo) — y se **conservan sin
> tocar**. La regla operativa del Sprint 1 se cumple entonces **no implementando
> lógica nueva** sobre ellas; nada se elimina ni se recrea.

## D13 — Entorno y configuración

- **Decisión**: variables de entorno (`PORT`, `DB_HOST`, `DB_PORT`, `DB_NAME`,
  `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`) leídas directamente de `process.env` con
  Node 20 (`node --env-file=.env`); `.env` fuera de control de versiones y un
  archivo `.env.example` en `backend/` **solo con placeholders**, jamás con
  contraseñas o secretos reales.
- **Razon**: evita la dependencia `dotenv` y respeta la regla de no añadir
  tecnologías sin necesidad ni de exponer secretos.
- **Alternativas consideradas**: `dotenv` (dependencia evitable); valores fijos en
  código (secretos en el repositorio, prohibido por la regla de no exponer
  secretos); `.env.example` con valores reales (secretos filtrados al clonar).

## D17 — MySQL local exclusiva y organización de `database/`

- **Decisión**: la base de datos será **únicamente MySQL local**, ejecutada como
  servicio de la propia máquina en `127.0.0.1:3306` (servicio `MySQL2610`,
  verificado en ejecución el 2026-10-14). Toda la administración vive en la
  carpeta `database/` de la raíz del proyecto, con esta organización:
  `migrations/` (SQL versionados), `seeds/` (datos de prueba claramente
  identificados), `migrate.mjs` (ejecutor ESM que registra en `migraciones`) y
  `README.md` (instrucciones de configuración y uso). La conexión se configura
  por variables de entorno con `.env.example` sin contraseñas reales. **Prohibido
  el uso de bases de datos en la nube o servicios externos de datos** en cualquier
  fase del proyecto.
- **Razon**: el proyecto es de una sola sucursal con una computadora de uso local
  (supuesto del contexto); la constitución exige justificar y documentar todo
  servicio externo, y el trabajo previo ya funciona contra `gym_db` local con 5
  migraciones registradas que deben conservarse; centralizar `database/` hace
  reproducible la configuración sin depender de la interfaz de un proveedor.
- **Alternativas consideradas**: MySQL gestionado en la nube (PlanetScale, RDS,
  Aiven u otros) — descartado por la regla de servicios externos y por el supuesto
  de operación local; PostgreSQL u otros SGBD — descartado por la regla del
  proyecto de usar MySQL; contenedores Docker para la base — innecesarios cuando
  el servicio nativo local ya está instalado y en ejecución.

## D14 — Pruebas

- **Decisión**: Vitest para backend y frontend; `supertest` para pruebas de
  integración de la API contra una base de datos de prueba reseedeable; React
  Testing Library para componentes; matriz de permisos probada como conjunto de
  casos parametrizados. Nombres de pruebas y mensajes de aserción en español.
- **Razon**: Vitest entiende ES Modules sin transformación especial (Jest requiere
  configuración extra con ESM), unifica el runner en ambas capas y RTL prueba el
  frontend como lo ve el usuario.
- **Alternativas consideradas**: Jest (fricción conocida con ESM); `node:test` solo
  (no cubre componentes React); Cypress/Playwright (E2E completo fuera del alcance
  de este sprint; la validación end-to-end se hace con la guía quickstart).

## D15 — Patrón de la capa del backend

- **Decisión**: **conservar el patrón existente** de carpetas globales por capas
  `src/routes → src/controllers → src/services → src/models` con middlewares
  `src/middlewares/{auth,authorize,errorHandler}.js`, sin reorganizar en módulos
  por entidad (la propuesta `src/modules/<entidad>/` de versiones anteriores de
  este plan queda **descartada** por A3).
- **Razon**: es la estructura real del proyecto (verificada 2026-10-14); toda la
  lógica de negocio vive en `services/` y el acceso a datos en `models/` con
  consultas parametrizadas, cumpliendo la regla de no duplicar lógica entre rutas
  y de conservar el trabajo existente.
- **Alternativas consideradas**: reorganizar a `modules/<entidad>/` (refactor
  grande sin beneficio funcional, requiere aprobación explícita); un solo archivo
  de rutas con SQL embebido (viola la regla modular); capa de repositorios
  completa (innecesaria a esta escala).

## D16 — Servición del frontend en producción

- **Decisión**: en desarrollo, Vite sirve el frontend con proxy `/api` → backend; en
  producción, el backend sirve los archivos estáticos compilados del frontend.
- **Razon**: un solo origen simplifica el envío del token y evita CORS en el uso
  real del gimnasio (una sola computadora como supuesto del proyecto).
- **Alternativas consideradas**: dos orígenes separados en producción (CORS +
  credenciales); solo desarrollo sin plan de producción (dejaría la entrega sin
  forma de uso).
