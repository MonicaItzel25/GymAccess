# Contrato propuesto de API: Sprint 4

**Plan**: [../plan.md](../plan.md) | **Especificación**: [../spec.md](../spec.md)

Contrato de diseño para revisión; no corresponde a endpoints implementados. Todas las operaciones pasan por backend, formato de respuesta del proyecto y middleware `autenticar`/`autorizar(...)`. Los filtros que requieran nuevos parámetros deben validarse con `express-validator` y consultas parametrizadas.

## Convenciones

- Respuesta exitosa con el envoltorio existente `{ "ok": true, "data": ... }`; errores con `{ "ok": false, "message": "..." }` y códigos HTTP apropiados.
- No retornar hashes, tokens, secretos, biometría ni campos financieros/personales no necesarios.
- El frontend nunca accede a MySQL.
- Administrador: alcance S4 completo. Recepcionista: notificaciones de membresía solamente. Entrenador y cliente: sin acceso administrativo.

## Notificaciones — `/api/notificaciones`

| Método y ruta | Roles | Propósito |
|---|---|---|
| `GET /api/notificaciones?tipo=&estado=` | Administrador; recepcionista solo tipos de membresía | Consultar por filtros establecidos en FR-011; no permitir filtrar para ampliar visibilidad. |
| `PATCH /api/notificaciones/:id/atencion` | Administrador; recepcionista solo notificación de membresía | Cambiar pendiente a atendida; el actor se toma de sesión, nunca del body. |

El contrato de atención no admite mutar fechas, relaciones de origen ni tipo. Alertas de acceso y sus detalles quedan reservados al administrador. No se expone endpoint público para disparar el job diario.

## Reportes financieros

| Método y ruta propuesta | Roles | Filtros/datos |
|---|---|---|
| `GET /api/reportes/financieros/pagos?desde=&hasta=&cliente=&membresia=&metodo_pago=&estado=` | Administrador | Rango de `fecha_pago` obligatorio para consulta por periodo; los demás filtros solo se habilitan si se corresponden con columnas/valores existentes. |
| `GET /api/reportes/financieros/adeudos` | Administrador | Saldos actuales por membresía con cálculo existente; no ofrece saldo histórico por periodo. |
| `GET /api/reportes/financieros/pagos/docx?...` | Administrador | Genera documento con mismos filtros/filas/totales de la consulta fuente. |
| `GET /api/reportes/financieros/adeudos/docx?...` | Administrador | Exporta la fotografía actual de adeudos, no un estado histórico. |

Los valores posibles de `estado` no se amplían: pagos existentes (`pagado`, `pendiente`, `cancelado`). El total que reduce adeudo cuenta solo pagos `pagado`. La consulta global y exportación no están disponibles a recepcionista.

## Reportes operativos

| Método y ruta propuesta | Roles | Filtros candidatos basados en fuentes |
|---|---|---|
| `GET /api/reportes/operativos/clientes?buscar=` | Administrador | Búsqueda por nombre/apellido ya existente; campos de salida minimizados. |
| `GET /api/reportes/operativos/membresias?desde=&hasta=&tipo=&estado=` | Administrador | Fechas de membresía, tipo y estados existentes (`activa`, `vencida`, `suspendida`, `cancelada`). Precisar si el rango filtra inicio, fin o solapamiento antes de implementación. |
| `GET /api/reportes/operativos/accesos?desde=&hasta=&cliente=&resultado=` | Administrador | Fechas, cliente y resultados existentes (`autorizado`, `rechazado`); conservar cliente nulo y motivo original. |
| `GET /api/reportes/operativos/{clientes|membresias|accesos}/docx?...` | Administrador | Mismos filtros y datos que consulta; el documento puede indicar que no hay resultados. |

Los parámetros indicados como candidatos deberán definirse en tareas tras validar ambigüedades de semántica (por ejemplo, qué fecha de membresía limita el periodo); no se añadirán filtros o estados supuestos.

## Errores esperados

- `400`: filtro inválido o rango de fechas invertido.
- `401`: sesión ausente/inválida.
- `403`: rol sin permiso para el tipo de notificación o reporte.
- `404`: notificación no existente.
- `409`: transición no válida o notificación no pendiente.
- `500`: error controlado al consultar/exportar o fallo transaccional de auditoría; mensaje público no expone detalle interno.

## No contrato / fuera de alcance

- No se define endpoint de dashboard S4: no se identificó uno existente y no se duplican tarjetas de `Inicio.jsx`.
- No hay correo, SMS, eliminación de notificaciones, edición libre de notificación ni endpoint de ejecución manual del scheduler.
- Los paths propuestos se revisarán antes de generar tareas; su inclusión aquí no declara implementación.
