# Modelo de datos: Sprint 3 — Entrenadores, rutinas, catálogo de ejercicios y dashboard administrativo

**Fecha**: 2026-10-19 | **Plan**: [plan.md](./plan.md) | **Espec**: [spec.md](./spec.md) | **Investigación**: [research.md](./research.md)

Fuente de la migración: `database/migrations/007_crear_tablas_sprint3.sql` (nueva; 001–006 intactas).

## 0. Convenciones y entorno

- Naming `snake_case`, PK `id_<entidad> INT AUTO_INCREMENT`, fechas `fecha_*`, estados `ENUM(...)`.
- Tablas `InnoDB`, `DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci` (igual que 001–006).
- FK con `ON DELETE RESTRICT ON UPDATE CASCADE` (sin borrados físicos, FR-036) y `KEY idx_*` para las consultas frecuentes (constitución III).
- **La migración 007 NO incluye `USE gym_db;`** (patrón de las 004–006, ver nota de entorno en `004_precio_acordado_membresias.sql`): el destino lo decide la BD seleccionada por `migrate.mjs`, que con `node --env-file=.env.test ../database/migrate.mjs` es `gym_db_pruebas`.
- Vínculo cuenta↔ficha de cliente: se resuelve por `correo` (`usuarios.correo = clientes.correo`), patrón ya usado por los portales del cliente en los Sprints 1 y 2.
- Nombres de campos nuevos coherentes entre interfaz, API y documentación (constitución: experiencia de usuario).

## 1. Entrenadores — `entrenadores`

Perfil profesional vinculado en exclusiva a una cuenta con rol `entrenador` (FR-001, RN-002). El nombre completo NO se duplica: procede de `usuarios.nombre`.

| Campo | Tipo | Restricciones |
|---|---|---|
| `id_entrenador` | `INT AUTO_INCREMENT` | PRIMARY KEY |
| `id_usuario` | `INT NOT NULL` | UNIQUE (`uq_entrenadores_usuario`), FK → `usuarios(id_usuario)` |
| `especialidad` | `VARCHAR(150) NULL` | Especialidad o descripción profesional (FR-002) |
| `telefono` | `VARCHAR(20) NULL` | Cuando se capture (FR-002) |
| `estado` | `ENUM('activo','inactivo') NOT NULL DEFAULT 'activo'` | Activación/desactivación (FR-002) |
| `fecha_creacion` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` | |

**Reglas de validación**: `id_usuario` debe existir, tener `rol = 'entrenador'` y `estado = 'activo'` en la cuenta, y no tener ya un perfil (rechazo con mensaje claro, US-S3-01.2). Un perfil por cuenta (UNIQUE) ⇒ RN-002 a nivel de datos.

**Transiciones de estado**: `activo ↔ inactivo` (administrador). Consecuencias (FR-003): `inactivo` no recibe nuevas asignaciones y no puede crear ni modificar rutinas, objetivos ni progresos (comprobado en servidor). Sin borrado físico (SC-004).

**Auditoría**: registrar, modificar y cambiar estado (FR-004) vía `registrarAccion`.

## 2. Asignaciones — `asignaciones_entrenador`

Relación entrenador–cliente por periodo de seguimiento (US-S3-02). Un cliente puede tener varias en el historial, como máximo una vigente (FR-006, RN-003).

| Campo | Tipo | Restricciones |
|---|---|---|
| `id_asignacion` | `INT AUTO_INCREMENT` | PRIMARY KEY |
| `id_cliente` | `INT NOT NULL` | FK → `clientes(id_cliente)` |
| `id_entrenador` | `INT NOT NULL` | FK → `entrenadores(id_entrenador)` |
| `fecha_inicio` | `DATE NOT NULL` | Registro de inicio (FR-005) |
| `fecha_fin` | `DATE NULL` | Se llena al finalizar (FR-007) |
| `estado` | `ENUM('vigente','finalizada') NOT NULL DEFAULT 'vigente'` | Estado final conservado (FR-007) |
| `esta_vigente` | `INT` generada `STORED` = `1` si `estado='vigente' AND fecha_fin IS NULL`, `NULL` en caso contrario | UNIQUE (`uq_asignaciones_vigente (id_cliente, esta_vigente)`) |
| `fecha_creacion` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` | |

**Índices**: `KEY idx_asignaciones_entrenador (id_entrenador)`, `KEY idx_asignaciones_cliente (id_cliente)`, `KEY idx_asignaciones_inicio (fecha_inicio)` (carga por entrenador y dashboard).

**Reglas de validación**: cliente `activo`; entrenador registrado y `activo` (US-S3-02.3); la restricción única rechaza una segunda asignación vigente del mismo cliente incluso ante concurrencia (FR-006 + transacción, research R-03).

**Transiciones**: `(alta) → vigente` → `finalizada` (rellena `fecha_fin`; en transacción; sin eliminación física, FR-007). `finalizada` es terminal: una reasignación crea una fila nueva (RN-004: la vigencia se decide con fechas y estado, no solo con el texto).

**Efectos documentados** (Clarification Q1): al finalizar o al desactivar al entrenador, las rutinas activas del cliente permanecen vigentes; el próximo entrenador asignado puede consultarlas y modificarlas (FR-017).

**Auditoría**: asignar y finalizar (FR-009).

## 3. Catálogo de ejercicios — `ejercicios`

Catálogo independiente y reutilizable por múltiples rutinas (US-S3-08, FR-010).

| Campo | Tipo | Restricciones |
|---|---|---|
| `id_ejercicio` | `INT AUTO_INCREMENT` | PRIMARY KEY |
| `nombre` | `VARCHAR(100) NOT NULL` | UNIQUE (`uq_ejercicios_nombre`) — evita duplicados en el catálogo compartido |
| `descripcion` | `VARCHAR(255) NOT NULL` | Descripción del ejercicio (US-S3-08.1) |
| `grupo_muscular` | `VARCHAR(50) NULL` | Clasificación opcional (FR-010) |
| `estado` | `ENUM('activo','inactivo') NOT NULL DEFAULT 'activo'` | Disponibilidad para rutinas nuevas (FR-011) |
| `fecha_creacion` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` | |

**Reglas de validación**: solo administrador crea/modifica (FR-011); nombre único → error comprensible si se duplica; entrenador solo consulta (FR-012, Clarification Q2).

**Transiciones**: `activo ↔ inactivo` (administrador). Un ejercicio `inactivo` no puede agregarse a rutinas nuevas (RN-008), pero las rutinas existentes lo conservan con sus parámetros (SC-004). Sin borrado físico.

**Auditoría**: crear y modificar (FR-013).

## 4. Rutinas — `rutinas` + `ejercicio_rutina`

Plan de entrenamiento de un cliente creado por un entrenador, con historial de versiones y una única versión activa por cliente (FR-015, Clarification Q5).

### 4.1 `rutinas`

| Campo | Tipo | Restricciones |
|---|---|---|
| `id_rutina` | `INT AUTO_INCREMENT` | PRIMARY KEY |
| `id_cliente` | `INT NOT NULL` | FK → `clientes(id_cliente)` |
| `id_entrenador` | `INT NOT NULL` | FK → `entrenadores(id_entrenador)` — entrenador que la creó (autoría histórica) |
| `nombre` | `VARCHAR(100) NOT NULL` | Nombre de la versión del plan |
| `estado` | `ENUM('activa','inactiva') NOT NULL DEFAULT 'inactiva'` | Estado de la versión |
| `fecha_creacion` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` | |
| `fecha_actualizacion` | `DATETIME NULL` | Última modificación (FR-015 «fechas») |
| `esta_activa` | `INT` generada `STORED` = `1` si `estado='activa'`, `NULL` en caso contrario | UNIQUE (`uq_rutinas_activa (id_cliente, esta_activa)`) |
| `fecha_activacion` | `DATETIME NULL` | Para ordenar versiones en el tiempo |

**Índices**: `KEY idx_rutinas_cliente_estado (id_cliente, estado)`, `KEY idx_rutinas_entrenador (id_entrenador)`.

**Reglas de validación**: el entrenador autenticado debe tener asignación **vigente** con `id_cliente` para crear o modificar (FR-014, FR-017, RN-005) — incluidas rutinas creadas por otro entrenador para ese cliente (Clarification Q1); sin asignación → 403 incluso si él la creó.

**Transiciones**: `inactiva → activa` en transacción que desactiva la activa anterior del mismo cliente (una sola activa por cliente, UNIQUE + R-03); `activa → inactiva` manual o automática. Las versiones antiguas se conservan (historial comparable por fechas, FR-015; SC-004). Sin borrado físico (FR-017).

**Auditoría**: crear y modificar rutinas (FR-018).

### 4.2 `ejercicio_rutina`

Aparición concreta de un ejercicio del catálogo dentro de una rutina, con sus parámetros (FR-016, RN-007).

| Campo | Tipo | Restricciones |
|---|---|---|
| `id_rutina_ejercicio` | `INT AUTO_INCREMENT` | PRIMARY KEY (permite apariciones repetidas del mismo ejercicio dentro de una rutina) |
| `id_rutina` | `INT NOT NULL` | FK → `rutinas(id_rutina)` |
| `id_ejercicio` | `INT NOT NULL` | FK → `ejercicios(id_ejercicio)` |
| `orden` | `SMALLINT NOT NULL` | Orden dentro de la rutina |
| `series` | `INT NOT NULL` | ≥ 1 (app: 1–999) |
| `repeticiones` | `INT NOT NULL` | ≥ 1 (app: 1–999) |
| `peso_recomendado` | `DECIMAL(6,2) NULL` | ≥ 0 kg cuando se capture (app: 0–999.99) |
| `descanso_segundos` | `INT NULL` | ≥ 0 cuando se capture (app: 0–3600) |
| `instrucciones` | `TEXT NULL` | No vacío cuando se capture (FR-016) |

**Índices**: `KEY idx_rutina_ejercicios_rutina (id_rutina)`, `KEY idx_rutina_ejercicios_ejercicio (id_ejercicio)`.

**Reglas de validación**: al agregar, `ejercicios.estado = 'activo'` (RN-008; si se desactiva después, la fila se conserva intacta). Los parámetros se validan en `express-validator` antes de guardarse (research R-10); errores con mensaje comprensible.

## 5. Objetivos — `objetivos`

Meta deportiva de un cliente registrada por el entrenador (US-S3-04, FR-019). Se registran por cliente, no por rutina.

| Campo | Tipo | Restricciones |
|---|---|---|
| `id_objetivo` | `INT AUTO_INCREMENT` | PRIMARY KEY |
| `id_cliente` | `INT NOT NULL` | FK → `clientes(id_cliente)` |
| `meta` | `VARCHAR(255) NOT NULL` | Meta descrita (FR-019) |
| `unidad` | `VARCHAR(30) NULL` | Cuando aplique (FR-019) |
| `fecha_objetivo` | `DATE NOT NULL` | Fecha objetivo (US-S3-04.1) |
| `estado` | `ENUM('activo','alcanzado','cerrado') NOT NULL DEFAULT 'activo'` | Estado inicial y cierre |
| `fecha_registro` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` | Fecha de registro (US-S3-04.1) |
| `fecha_cierre` | `DATETIME NULL` | Se llena al alcanzar o cerrar |

**Índices**: `KEY idx_objetivos_cliente (id_cliente)`, `KEY idx_objetivos_estado (estado)` (indicador «objetivos activos»).

**Reglas de validación**: asignación vigente del entrenador con el cliente (RN-005); campos no vacíos.

**Transiciones**: `activo → alcanzado` o `activo → cerrado` (con `fecha_cierre`); ambos son terminales. Objetivo e historial de progresos permanecen (RN-009, SC-004). Sin borrado físico.

**Auditoría**: registrar objetivos (FR-022).

## 6. Progresos — `progresos`

Entrada periódica de evolución del cliente (US-S3-04, FR-020). Historial completo, sin modificaciones destructivas (US-S3-04.4).

| Campo | Tipo | Restricciones |
|---|---|---|
| `id_progreso` | `INT AUTO_INCREMENT` | PRIMARY KEY |
| `id_cliente` | `INT NOT NULL` | FK → `clientes(id_cliente)` |
| `id_objetivo` | `INT NULL` | FK → `objetivos(id_objetivo)` — cuando exista (supuesto del spec) |
| `fecha` | `DATE NOT NULL` | Fecha de la entrada |
| `valor_numerico` | `DECIMAL(8,2) NULL` | Valor o avance medido (p. ej., peso, marcas) |
| `avance` | `VARCHAR(150) NULL` | Avance descrito cuando no sea numérico |
| `comentario` | `VARCHAR(255) NULL` | Comentario opcional (FR-020) |
| `fecha_registro` | `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP` | |

**Índices**: `KEY idx_progresos_cliente_fecha (id_cliente, fecha)`, `KEY idx_progresos_fecha (fecha)` (indicador del periodo), `KEY idx_progresos_objetivo (id_objetivo)`.

**Reglas de validación**: al menos uno entre `valor_numerico` y `avance` (FR-020, validación en aplicación); si existe `id_objetivo`, debe pertenecer al mismo cliente; asignación vigente del entrenador (RN-005). El contenido se presenta como seguimiento deportivo, nunca como diagnóstico médico (FR-020, RN-013).

**Integridad histórica**: las entradas no se editan de forma destructiva; si se corrigen, la entrada original queda y la corrección se registra como nueva entrada + auditoría (FR-021, RN-009).

**Auditoría**: registrar entradas (FR-022).

## 7. Dashboard — sin tablas nuevas

No se crea ninguna tabla de indicadores (RN-011): `GET /api/dashboard` calcula al momento sobre las fuentes siguientes (FR-025, FR-027):

| Indicador | Fuente |
|---|---|
| Clientes totales / nuevos en periodo | `clientes` (`COUNT`, `fecha_registro` en el periodo) |
| Clientes activos | Vigencia real de `membresias` por fechas y estado (lógica Sprint 2 reutilizada) |
| Membresías vigentes / por vencer (7 días) / vencidas | `membresias.fecha_inicio`, `membresias.fecha_fin` + hoy (Clarification Q3) |
| Pagos del periodo (cantidad e ingresos) | `pagos` (`COUNT`, `SUM(monto)` con `estado='pagado'` y `fecha_pago` en el periodo) |
| Adeudos pendientes | Lógica de adeudos del Sprint 2 |
| Intentos de acceso autorizados/rechazados | `accesos` (`fecha` en el periodo, `resultado`) |
| Entrenadores activos y carga | `entrenadores` + `asignaciones_entrenador.esta_vigente` |
| Rutinas activas / clientes sin rutina activa | `rutinas.estado` (índice `idx_rutinas_cliente_estado`) |
| Objetivos activos / progresos del periodo | `objetivos.estado`, `progresos.fecha` |

## 8. Entidades reutilizadas sin cambio de alcance

`usuarios`, `clientes` (Sprint 1); `membresias`, `tipos_membresia`, `pagos` (indicadores de vigencia, ingresos y adeudos); `accesos` (intentos); `auditoria` (pantalla de solo lectura y registro de las acciones, ampliada su consulta con filtros, research R-06). Ninguna recibe cambios de esquema en este sprint.

## 9. Relaciones (resumen)

```text
usuarios 1 ──1 entrenadores ──< asignaciones_entrenador >── 1 clientes
                                   │                            │
                                   │ (autoría)                  │
                                   ▼                            │
                                rutinas >──< ejercicio_rutina >── ejercicios
                                   │
clientes ──< objetivos ──< progresos (id_objetivo opcional)
```
