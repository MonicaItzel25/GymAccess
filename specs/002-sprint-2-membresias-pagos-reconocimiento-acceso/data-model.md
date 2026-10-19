# Modelo de datos — Sprint 2

Fecha: 2026-10-18 (ampliado en la Fase 1 del plan; estado actualizado en T072 tras
aplicar las migraciones 004–006 en el entorno de pruebas). Describe el modelo
requerido por `spec.md`, el estado real del esquema consolidado y los cambios de
esquema de este sprint. **No crea ni ejecuta migraciones** y **no modifica** las
migraciones existentes (`database/migrations/001`, `002` y `003` se conservan tal cual).

## 1. Entidades existentes (esquema consolidado, solo lectura)

Fuente: `database/migrations/002_crear_tablas_sprint1.sql` y
`003_crear_tablas_sprint2.sql`, revisadas sin modificar. Las celdas en negrita
señalan los vacíos que resuelven las migraciones 004–006 del §3: describen el estado
de partida de 001–003, no el estado del entorno de pruebas ya migrado.

| Tabla | Campos relevantes | Observación |
|---|---|---|
| `usuarios` | `id_usuario` PK, credenciales, `rol ENUM('administrador','recepcionista','entrenador','cliente')`, `estado` | Sprint 1; se reutiliza sin cambios |
| `clientes` | `id_cliente` PK, datos del cliente | Sprint 1; se reutiliza sin cambios |
| `tipos_membresia` | `id_tipo_membresia` PK, `nombre`, `descripcion`, `duracion` INT, `precio DECIMAL(10,2) NOT NULL`, `estado` | Catálogo; su precio es solo referencia para nuevas asignaciones y renovaciones |
| `membresias` | `id_membresia` PK, `id_cliente` FK, `id_tipo_membresia` FK, `fecha_inicio DATE`, `fecha_fin DATE`, `estado ENUM('activa','vencida','suspendida','cancelada')` | **No almacena ningún precio** |
| `pagos` | `id_pago` PK, `id_cliente` FK, `id_membresia` FK, `monto DECIMAL(10,2)`, `fecha_pago`, `metodo_pago`, `estado ENUM('pagado','pendiente','cancelado')` | Sin campo de operación externa (FR-017) |
| `rostros` | `id_rostro` PK, `id_cliente` FK UNIQUE, `descriptor_facial JSON` (128 números), `fecha_registro`, `estado` | Un descriptor por cliente; nunca imágenes |
| `accesos` | `id_acceso` PK, `id_cliente` FK NULL, `fecha DATE`, `hora TIME`, `resultado ENUM('autorizado','rechazado')`, `motivo_rechazo VARCHAR(100) NULL`, `fecha_intento DATETIME` | **No registra el usuario responsable ni el origen de la decisión** |
| `auditoria` | `id_auditoria` PK, `id_usuario` FK NULL, `accion`, `modulo`, `fecha`, `resultado ENUM('exitoso','rechazado','error')`, `descripcion` | Reutilizable para la trazabilidad de autorizaciones manuales |
| `migraciones` | `id_migracion` PK, `nombre VARCHAR(255) UNIQUE`, `fecha_ejecucion` | Control de migraciones (`database/migrate.mjs`) |

## 2. Entidades requeridas por las decisiones de este spec

### 2.1 Tipo de membresía (catálogo)

- **Campos**: `nombre` (no vacío), `descripcion`, `duracion` (entero > 0),
  `precio` (decimal > 0), `estado` (activo/inactivo).
- **Validaciones** (FR-001, FR-002): duración y precio estrictamente positivos;
  nombre no vacío. Escritura solo administrador (FR-004).
- **Regla clave**: modificar precio o duración NO altera membresías ya asignadas
  (FR-005, RN-016).

### 2.2 Membresía

- **Campos**: vínculo cliente + tipo, `fecha_inicio`, `fecha_fin` (calculada:
  `fecha_inicio` + `duracion` del tipo), `precio_acordado` (nuevo, ver §3), `estado`.
- **Validaciones** (FR-006…FR-010): cliente y tipo existentes; tipo activo al
  asignar/renovar; fechas coherentes; máx una membresía vigente por cliente (garantía
  transaccional con `FOR UPDATE`, ya implementada).
- **Transiciones de estado** (FR-012, supuestos del spec):

| Estado actual | Transición permitida | Hacia | Condición |
|---|---|---|---|
| (ninguna) | asignar | `activa` | Tipo activo, cliente válido, sin otra vigente |
| `activa` | suspender | `suspendida` | Solo desde `activa` |
| `activa` | vencer (automático) | `vencida` | `fecha_fin < hoy` al evaluarse (FR-010) |
| `activa` | cerrar por renovación | `vencida` | Al crear el periodo siguiente (FR-011) |
| `suspendida` | reactivar | `activa` | Solo desde `suspendida` |
| `activa`/`suspendida`/`vencida` | cancelar | `cancelada` | Desde cualquier estado no cancelado |

  Transiciones inválidas → error con mensaje claro (ej.: suspender una suspendida).

- **Vigencia** (FR-010): vigente ⇔ `estado='activa'` Y `fecha_inicio <= hoy <=
  fecha_fin`; el estado por sí solo nunca decide (decide fechas + estado).

### 2.3 Pago

- **Campos**: cliente, membresía (cuando corresponda), `monto` (> 0), `fecha_pago`,
  `metodo_pago` (catálogo `METODOS_PAGO`), `estado`, `id_operacion` (nuevo, ver §3).
- **Validaciones** (FR-014, FR-015): monto positivo; cliente y membresía existentes;
  si hay membresía, debe pertenecer al cliente. Sin borrado físico (FR-016): las
  correcciones usan estados.
- **Adeudo** (FR-018): `adeudo = max(0, membresia.precio_acordado − SUM(pagos con
  estado='pagado' de la membresía))`.

### 2.4 Rostro (registro facial)

- **Campos**: cliente (único), `descriptor_facial` JSON con exactamente 128 números,
  `fecha_registro`, `estado`.
- **Validaciones** (FR-021…FR-025): cliente existente; descriptor 128 números;
  actualiza en lugar de duplicar; jamás se devuelve el descriptor ni se almacenan
  imágenes; auditoría sin biométricos.
- **Umbral de identificación**: `FACE_MATCH_THRESHOLD` (0,5 por defecto) en
  `utils/matchRostro.js` (distancia euclidiana).

### 2.5 Acceso (intentos de ingreso)

- **Campos**: `id_cliente` (NULL si rostro no identificado), `fecha`, `hora`,
  `resultado`, `motivo_rechazo`, `fecha_intento`, más los nuevos `id_usuario` y
  `origen` (ver §3).
- **Reglas** (FR-027…FR-034): identificar ANTES de evaluar membresía; autorizar solo
  con cliente identificado + membresía vigente; cada intento queda registrado sea
  autorizado o rechazado, sin biométricos y sin edición ni borrado.
- **Origen** (FR-030, RN-017): `kiosco` = intento automático sin sesión (id_usuario
  NULL); `manual` = autorización o rechazo registrado en recepción con
  `id_usuario` = personal responsable, siempre con motivo en los rechazos.

### 2.6 Auditoría

- **Campos**: actor (`id_usuario`, NULL para sistema), acción, módulo, fecha/hora,
  resultado, descripción. No editable ni eliminable desde la app (FR-038).
- **Cobertura del sprint** (FR-037): cambios de tipos, asignaciones/renovaciones,
  cambios de estado de membresías, registro/corrección de pagos, registro/modificación
  de rostro, resultados de acceso (incluidos los manuales).
- **Fallo de auditoría** (FR-040): nunca interrumpe la operación principal ni deriva
  en autorización de acceso.

Se reutilizan `usuarios` y `clientes` del Sprint 1 sin duplicarlos ni cambiar su
significado.

## 3. Cambios de esquema de este sprint (migraciones 004–006)

### 3.1 `membresias.precio_acordado` — migración `004_precio_acordado_membresias.sql`

- **Campo**: `precio_acordado DECIMAL(10,2) NOT NULL`.
- **Estado**: migración creada y aplicada en `gym_db_pruebas` (Fase 1, T001–T007);
  en `gym_db` el campo sigue inexistente porque la base de operación no se modifica
  (FR-048). Sin esta migración, los adeudos usarían el precio vigente del catálogo
  con efecto retroactivo (comportamiento no deseado, FR-005/FR-018).
- **Contenido de la migración**: `ALTER TABLE membresias ADD COLUMN
  precio_acordado DECIMAL(10,2) NULL`, backfill con el precio vigente del tipo
  (`UPDATE membresias m JOIN tipos_membresia t ... SET m.precio_acordado = t.precio
  WHERE m.precio_acordado IS NULL`), luego `MODIFY ... NOT NULL`. Se documenta que el
  backfill con el precio actual es la única opción posible: el historial de precios no
  existe (research.md, R6).
- **Ajustes asociados**: `membresia.service.js` (capturar precio en asignar/renovar),
  `membresia.model.js` (leer/escribir el campo), `pago.service.js::calcularAdeudo` y
  sus derivadas (`listarAdeudos`, `listarAdeudosPorCorreo`) usar `precio_acordado`.

### 3.2 `accesos.id_usuario` y `accesos.origen` — migración `005_accesos_autorizacion_manual.sql`

- **Campos**: `id_usuario INT NULL` con FK a `usuarios` (patrón ya usado en
  `auditoria.id_usuario`) y `origen ENUM('kiosco','manual') NOT NULL DEFAULT
  'kiosco'`.
- **Estado**: migración creada y aplicada en `gym_db_pruebas` (Fase 1, T001–T007);
  en `gym_db` los campos siguen inexistentes.
- **Backfill**: los registros existentes quedan con `origen='kiosco'` (son los
  emitidos por el kiosco) e `id_usuario` NULL.
- **Resultado y motivo**: ya existen (`accesos.resultado`,
  `accesos.motivo_rechazo VARCHAR(100)`); se verifica que los motivos manuales
  («identidad no verificable», «membresía no vigente») quepan en 100 caracteres.
  Sin cambio de esquema.
- **Datos biométricos**: `accesos` no almacena biométricos y debe seguir sin hacerlo.
- **Ajustes asociados**: `acceso.service.js::autorizarAccesoManual` (nuevo),
  `acceso.model.js` (insertar con origen e id_usuario),
  `acceso.routes.js`/`accesoConsulta.routes.js` y `acceso.controller.js`
  (devolver origen e id_usuario responsable en el historial), más
  `validators/accesoManual.validators.js` del endpoint manual.

### 3.3 `pagos.id_operacion` — migración `006_pagos_id_operacion.sql`

- **Campo**: `id_operacion VARCHAR(100) NULL` + `UNIQUE KEY
  (id_cliente, id_operacion)`.
- **Estado**: migración creada y aplicada en `gym_db_pruebas` (Fase 1, T001–T007);
  en `gym_db` el campo sigue inexistente.
- **Ajustes asociados**: `pago.service.js::registrarPago` rechaza duplicado
  `(id_cliente, id_operacion)` con 409; `pago.model.js` inserta el campo;
  validator/contract actualizados.

## 4. Resumen de las migraciones de este sprint

| Migración | Contenido | Origen |
|---|---|---|
| `004_precio_acordado_membresias.sql` | `membresias.precio_acordado` + backfill | Decisiones de precio acordado (2026-10-15), FR-005/007/011/018 |
| `005_accesos_autorizacion_manual.sql` | `accesos.id_usuario`, `accesos.origen` + backfill | Decisión de autorización manual, FR-030/034 |
| `006_pagos_id_operacion.sql` | `pagos.id_operacion` + índice único | FR-017 |

Estas migraciones se crearon y ejecutaron **únicamente sobre el entorno de datos de
prueba** (`gym_db_pruebas`, Fase 1: T001–T007) (FR-048, research.md R9), registradas
en la tabla `migraciones` por `database/migrate.mjs`. Ninguna migración existente
(001–003) fue editada, y la base `gym_db` en operación no se modificó ni se reinició.
