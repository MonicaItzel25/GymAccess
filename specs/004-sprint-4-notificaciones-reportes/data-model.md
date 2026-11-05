# Modelo de datos propuesto: Sprint 4 — Notificaciones y reportes

**Plan**: [plan.md](./plan.md) | **Investigación**: [research.md](./research.md) | **Especificación**: [spec.md](./spec.md)

Este modelo es diseño para revisión, no una definición aplicada. La base de datos no se consultó y ninguna migración se creó o ejecutó.

## 1. Fuentes existentes reutilizadas

| Entidad física | Datos aprovechados | Uso S4 |
|---|---|---|
| `clientes` | identificador, nombre, apellido, estado y campos disponibles | identificación limitada en notificaciones y reportes. |
| `membresias` | cliente, tipo, fechas, estado y `precio_acordado` | revisión de vencimientos, filtro de membresías y adeudo vigente. |
| `pagos` | cliente, membresía, monto, `fecha_pago`, método y estado | reporte de pagos por fecha y cálculo existente de adeudo. |
| `accesos` | identificador, cliente nullable, fecha, hora, resultado, motivo | alerta referencial y reporte operativo por periodo/resultado. |
| `usuarios` | identificador del actor y rol autenticado | responsable de atención; no copiar credenciales. |
| `auditoria` | actor, acción, módulo, fecha, resultado y descripción | rastro de la atención administrativa. |

## 2. Entidad nueva propuesta: `notificaciones`

| Campo | Tipo conceptual | Restricciones y propósito |
|---|---|---|
| `id_notificacion` | entero | Clave primaria autoincremental. |
| `tipo` | cadena cerrada en servicio | Categorías derivadas del spec: membresía por vencer, membresía vencida, acceso rechazado. No aceptar tipo arbitrario enviado por cliente. |
| `descripcion` | texto corto | Texto generado desde datos de origen disponibles; no incluir secretos ni biometría. |
| `fecha_generacion` | fecha/hora | Requerida; momento de creación. |
| `estado` | `ENUM` | Valores establecidos por spec: `pendiente`, `atendida`, `no_aplicable`; por defecto pendiente. |
| `id_membresia` | entero nullable | FK a `membresias`; usado para avisos de membresía. |
| `fecha_vencimiento` | fecha nullable | Fecha que forma parte de la clave idempotente de aviso de membresía. |
| `id_acceso` | entero nullable | FK a `accesos`; para alerta de rechazo. UNIQUE para máximo una alerta por registro. |
| `id_usuario_atencion` | entero nullable | FK a `usuarios`; actor solo cuando se atiende. |
| `fecha_atencion` | fecha/hora nullable | Momento de atención; no aplica a pendientes/no aplicables. |

### Unicidad e integridad propuestas

- UNIQUE (`tipo`, `id_membresia`, `fecha_vencimiento`) respalda deduplicación de notificaciones de membresía aunque se atiendan.
- UNIQUE (`id_acceso`) respalda como máximo una alerta por intento rechazado; será NULL para notificaciones de membresía.
- FKs con política de borrado restrictiva coherente con el historial existente; no se elimina físicamente notificación, membresía, acceso ni auditoría mediante funciones S4.
- Las notificaciones referencian fuentes; no replican nombre/importe/resultado cuando se puede consultar mediante joins. La relación con el cliente se obtiene del origen si está disponible.
- Restricciones entre columnas/categorías y transiciones se validan en servicio. No se propone un estado de pago nuevo ni una fórmula alternativa de adeudo.

## 3. Transiciones

| Estado previo | Acción | Estado siguiente | Actor/fecha |
|---|---|---|---|
| — | generación automática | `pendiente` | sistema; fecha de generación. |
| `pendiente` | atención autorizada | `atendida` | usuario autenticado y fecha/hora obligatorios; escritura auditada. |
| `pendiente` | renovación sustituye periodo | `no_aplicable` | sin actor de atención; dentro de transacción de renovación. |
| `atendida` | revisión repetida o renovación | `atendida` | conservar actor y fecha originales; no recrear. |
| `no_aplicable` | revisión repetida | `no_aplicable` | no recrear ni cambiar historial. |

## 4. Reportes (sin tablas derivadas)

Los reportes se calculan de las entidades de origen. No se persisten totales derivados ni se modifica el origen.

- **Pagos por periodo**: filtrar mediante `fecha_pago`; estados permitidos proceden del esquema existente (`pagado`, `pendiente`, `cancelado`). Para totales que reducen adeudo, respetar la regla existente: solo pagos `pagado`.
- **Adeudos**: el valor disponible es saldo actual por membresía: `max(0, precio_acordado - suma(pagos pagado))`. No existe historial de saldos por fecha en el modelo inspeccionado; no construir un reporte histórico «al cierre de un periodo» sin decisión/datos nuevos.
- **Clientes**: usar atributos existentes y necesidad del reporte; aplicar minimización de datos y permisos.
- **Membresías**: campos existentes de tipo, estado y fechas. Estados solo los definidos actualmente (`activa`, `vencida`, `suspendida`, `cancelada`).
- **Accesos**: fecha, cliente nullable, resultado (`autorizado`, `rechazado`) y motivo disponible; no inventar cliente cuando no se identificó.

## 5. Migración futura

Se prevé `database/migrations/008_crear_notificaciones_sprint4.sql` por ser el siguiente número observado tras Sprint 3. El nombre/orden debe comprobarse de nuevo en la etapa de implementación. Esta migración es propuesta: no se creó, no se aplicó y no se consultó el historial de `gym_db_pruebas`.
