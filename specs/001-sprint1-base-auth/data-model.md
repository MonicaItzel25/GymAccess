# Modelo de datos — Sprint 1

**Función**: 001-sprint1-base-auth | **Fecha**: 2026-10-14 | **Fase**: 1

## Estado de verificación

Modelo descrito a partir del `DESCRIBE` real de la MySQL local efectuado el
2026-10-14 (solo lectura) y de los scripts de
`C:\Users\moni2\Documents\gymAccess1\database\migrations`. **No se inventan
columnas ni tablas**: lo que sigue es lo que existe. Las decisiones de diseño
**A5** (vínculo por correo) y **A6** (bloqueo en memoria) quedaron **aprobadas
el 2026-10-14** con la opción recomendada (ver
[estado-repositorio.md](estado-repositorio.md), sección 6); las brechas de
código **A8, A10, A11 y A15** siguen marcadas como ajustes pendientes del
Sprint 1.

## Gestión de la base de datos (decisión vinculante)

- **MySQL local exclusiva**: instancia del propio equipo en `127.0.0.1:3306`
  (servicio `MySQL2610`; bases `gym_db` y `gym_db_pruebas`). Sin bases de datos en
  la nube ni servicios externos de datos (D17 de [research.md](research.md)).
- **Administración en `database/`** (raíz del proyecto):
  - `database/migrations/`: scripts SQL versionados que crean o modifican tablas.
  - `database/seeds/`: datos de prueba claramente identificados como tales.
  - `database/migrate.mjs`: ejecutor ES Modules que aplica en orden y registra en
    la tabla `migraciones` (nombre estándar; el archivo existente se encuentra hoy
    como `database/scripts/ejecutar-migraciones.mjs` — **renombrado aprobado con
    A1 el 2026-10-14**, pendiente de ejecución en la fase de tareas, ver D8 de
    research.md).
  - `database/README.md`: instrucciones de configuración y uso de la MySQL local.
- **Conexión por variables de entorno** (`DB_HOST`, `DB_PORT`, `DB_NAME`,
  `DB_USER`, `DB_PASSWORD`) con `.env.example` **sin contraseñas reales**.
- **Migraciones ejecutadas se conservan**: las 5 entradas registradas no se editan
  ni reejecutan; cualquier cambio futuro es un archivo **nuevo** en
  `database/migrations/` numerado desde `004_…`.

Convenciones reales observadas:

- Llaves primarias `id_*` con autoincremento; fechas en DATETIME con
  `DEFAULT CURRENT_TIMESTAMP`; `utf8mb4`.
- Ninguna tabla permite borrado físico de registros de negocio desde la
  aplicación: los estados cumplen esa función (regla III.7 y III.8).
- Los correos de usuario se comparan normalizados (sin espacios extremos, sin
  distinguir mayúsculas/minúsculas).

## Tabla `usuarios` (real, verificada 2026-10-14)

| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|--
| id_usuario | INT | PK, autoincremento | Identificador del usuario |
| nombre | VARCHAR(100) | NOT NULL | Nombre visible |
| correo | VARCHAR(150) | NOT NULL, UNIQUE (`uq_usuarios_correo`) | Correo normalizado; identificador de login |
| password | VARCHAR(255) | NOT NULL | Hash bcrypt; nunca se devuelve en la API |
| rol | ENUM | NOT NULL, DEFAULT `cliente` | `administrador`, `recepcionista`, `entrenador`, `cliente` |
| estado | ENUM | NOT NULL, DEFAULT `activo` | `activo` o `inactivo` (estado de la cuenta) |
| fecha_creacion | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Alta |

**No existen** las columnas `password_hash`, `creado_en`, `actualizado_en` ni
índice compuesto `(rol, estado)`: el nombre real de la contraseña es `password`
(contiene el hash) y no se propone renombrarla (renombrado = migración nueva, no
aprobada).

**Validaciones de negocio asociadas** (spec FR-011 a FR-016):

- Correo obligatorio y único tras normalización; contraseña requerida al crear
  (hash bcrypt, solo hash almacenado — FR-002).
- `rol` solo admite los cuatro valores (ENUM a nivel de datos); el campo nunca se
  toma de una solicitud sin autorización de administrador (FR-012, FR-016).
- **Brecha A10** (pendiente, sin migración): falta la protección del único
  administrador activo (FR-014), que es validación de servicio.
- **Vínculo con `clientes`**: no hay columna FK; ver sección Relaciones (A5).

## Tabla `clientes` (real, verificada 2026-10-14)

| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|--
| id_cliente | INT | PK, autoincremento | Identificador del cliente |
| nombre | VARCHAR(100) | NOT NULL | Nombre |
| apellido | VARCHAR(100) | NOT NULL | Apellido (columna **singular**; no existe `apellidos`) |
| correo | VARCHAR(150) | NULL, UNIQUE (`uq_clientes_correo`) | Puede no existir (FR-022) |
| telefono | VARCHAR(20) | NULL | Teléfono |
| direccion | VARCHAR(200) | NULL | Dirección |
| fecha_registro | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Fecha de alta |
| estado | ENUM | NOT NULL, DEFAULT `activo` | `activo` o `inactivo` (estado del cliente) |

**No existen** las columnas `apellidos`, `usuario_id` ni `actualizado_en`; no hay
FK hacia `usuarios` (FR-020/FR-023 se resuelven hoy por unicidad de correo y por
el enlace por coincidencia de correo, ver Relaciones/A5).

**Notas de integridad reales**:

- Un registro de cliente puede existir sin cuenta de usuario (FR-022) — se apoya en
  `correo NULL`.
- No hay operación de borrado físico expuesta (FR-021): el modelo solo ofrece alta
  y modificación.
- **Brecha A11** (pendiente, sin migración): `cliente.service.js` no escribe en
  `auditoria` (constitución X.1).

## Tabla `intentos_login` — **no existe**

No hay tabla de intentos de login en `gym_db` (verificado el 2026-10-14). El
bloqueo de 5 fallos / 15 minutos está implementado **en memoria**
(`backend/src/services/auth.service.js`, `Map` indexado por correo normalizado,
cubre también correos inexistentes).

- **Decisión A6 (aprobada 2026-10-14, opción (a))**: se **acepta el estado en
  memoria** como mecanismo oficial, coherente con el supuesto de una sola
  computadora e instancia única; la limitación (los contadores se pierden al
  reiniciar el servidor) quedó documentada en `contracts/api.md` y en D5 de
  `research.md`. La alternativa (b) — una **migración nueva `004_…`** con tabla
  persistente (`correo` PK, `intentos_consecutivos`, `ultimo_intento_en`,
  `bloqueado_hasta`) — queda **descartada** mientras no cambie el supuesto.

## Tabla `auditoria` (real, verificada 2026-10-14)

Creada por la migración **ya ejecutada** `003_crear_tablas_sprint2.sql`.

| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|-
| id_auditoria | INT | PK, autoincremento | Identificador del registro |
| id_usuario | INT | NULL, FK → usuarios(id_usuario) | Actor (NULL si proceso del sistema) |
| accion | VARCHAR(100) | NOT NULL | Acción realizada |
| modulo | VARCHAR(50) | NOT NULL | Módulo afectado (p. ej. `usuarios`, `membresias`) |
| fecha | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP, indexada | Marca temporal |
| resultado | ENUM | NOT NULL | `exitoso`, `rechazado` o `error` |
| descripcion | VARCHAR(255) | NULL | Detalle legible; nunca contraseñas, JWT ni biométricos (regla X.3) |

**No existen** las columnas `actor_correo`, `entidad`, `entidad_id`, `detalle`
(JSON) ni `fecha_hora`: no se renombran (requeriría migración nueva sobre tabla
ya poblada). Solo inserción desde la aplicación; los roles operativos no tienen
funciones de edición (regla X.4).

- **Alcance actual**: solo los servicios de Sprint 2 (membresías, pagos, rostros,
  accesos) escriben auditoría hoy; **brecha A11**: falta invocar el registro en
  cambios de usuarios y clientes (ajuste de código del Sprint 1, sin migración).

## Tabla `migraciones` (real, verificada 2026-10-14)

| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|-
| id_migracion | INT | PK, autoincremento | Orden de aplicación |
| nombre | VARCHAR(255) | NOT NULL, UNIQUE (`uq_migraciones_nombre`) | Nombre del archivo |
| fecha_ejecucion | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Cuándo se aplicó |

Las 5 filas actuales (intactas; no se editan ni se borran):

| id | nombre | fecha_ejecucion |
|---|---|---|-
| 1 | 001_crear_base_datos.sql | 2026-10-07 13:25:20 |
| 2 | 002_crear_tablas_sprint1.sql | 2026-10-07 13:25:20 |
| 3 | 001_usuario_admin.sql | 2026-10-07 13:25:20 |
| 4 | 003_crear_tablas_sprint2.sql | 2026-10-12 17:08:50 |
| 5 | 002_tipos_membresia_ejemplo.sql | 2026-10-12 17:08:50 |

No existe columna de checksum: el ejecutor detecta reaplicación por el nombre
único (D8 de [research.md](research.md)).

## Otras tablas existentes (fuera de la lógica del Sprint 1)

Creadas y pobladas por migraciones/semillas ejecutadas, **conservadas sin tocar**:
`tipos_membresia` (datos de ejemplo de la semilla), `membresias`, `pagos`,
`rostros`, `accesos`. El Sprint 1 no implementa lógica nueva sobre ellas
(ajuste A13); simplemente no se duplican ni se eliminan.

## Relaciones (estado real)

```text
usuarios 1 ──── 0..* auditoria     (auditoria.id_usuario FK → usuarios.id_usuario)
usuarios 1 ──── 0..1 clientes      (SIN FK: enlace por coincidencia de `correo`
                                     en cliente.service.obtenerPorCorreoUsuario)
membresias/pagos ── FK a clientes  (ya existentes, fuera de alcance Sprint 1)
```

- Un cliente puede existir sin cuenta; una cuenta con rol `cliente` se enlaza hoy
  **por correo coincidente** entre `usuarios.correo` y `clientes.correo`.
- **Decisión A5 (aprobada 2026-10-14, opción (a))**: se **acepta el enlace por
  correo** como mecanismo oficial; el FR-023 del spec y los contratos ya quedaron
  ajustados para exigir un `clientes.correo` coincidente al crear cuenta
  `cliente` (un cliente sin `correo` no puede tener cuenta). La alternativa (b) —
  migración **nueva `004_…`** con `clientes.id_usuario` (INT NULL, UNIQUE, FK) —
  queda **descartada**. **Ajuste de código pendiente A15**: la validación del
  vínculo aún no existe en `usuario.service.crear`.

## Transiciones de estado (comportamiento real + reglas del spec)

| Entidad | Transición | Condición |
|---|---|---|--
| usuario | `activo → inactivo` / `inactivo → activo` | Solo administrador vía `PUT /api/usuarios/:id` con `estado`; **falta la regla FR-014 de único administrador activo (brecha A10, pendiente de implementación)** |
| usuario | Inicio de sesión | Solo con estado `activo` (FR-006) |
| cliente | `activo → inactivo` / `inactivo → activo` | Administrador o recepcionista; NO impide el login de su cuenta (FR-010, regla Sprint 1) |
| vínculo usuario–cliente | resuelto en cada consulta | Por coincidencia de correo (mecanismo **aprobado**, A5) |
| intentos de login | `0..4 → bloqueado → 0` | **En memoria** (decisión **aprobada**, A6): 5 fallos consecutivos → bloqueo 15 min; se reinicia con un acierto o al vencer (FR-004); se pierde al reiniciar el servidor |

## Reglas de validación por entidad (resumen del spec)

- **Usuario**: nombre requerido (1–100); correo requerido, normalizado y único;
  contraseña requerida, mínimo 8 caracteres y solo como hash; rol requerido entre
  los cuatro; estado `activo`/`inactivo`.
- **Cliente**: nombre y apellido requeridos (columna `apellido`); correo opcional
  pero único si existe (normalizado); teléfono/dirección opcionales con longitud
  máxima; sin campos de propietario aceptados del cliente sin autorización.
- **Login**: correo y contraseña obligatorios; se normaliza antes de comparar;
  respuesta con el texto exacto `correo o contraseña incorrectos` (**brecha A8**:
  hoy el código responde `Credenciales incorrectas`).
- **Operaciones relacionadas** (cambios de usuario con su auditoría, validación del
  último administrador activo) se ejecutan en **transacciones** al implementarse
  A10/A11.

## Sin deriva de alcance

Las tablas de membresías, pagos, registros faciales y accesos **ya existen** por
la migración 003 (se conservan intactas); el Sprint 1 no agrega columnas, tablas
ni lógica de negocio sobre ellas (FR-026, ajuste A13). Cualquier cambio de esquema
del Sprint 1 requiere migración **nueva** `004_…` con aprobación previa.
