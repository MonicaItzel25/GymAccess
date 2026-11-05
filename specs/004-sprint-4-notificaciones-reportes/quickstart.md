# Guía de validación futura: Sprint 4

**Plan**: [plan.md](./plan.md) | **Contratos**: [contracts/api.md](./contracts/api.md) | **Modelo**: [data-model.md](./data-model.md)

> Esta guía define validaciones para etapas posteriores. Ninguna se ejecutó en G-05. No ejecutar contra `gym_db`; cualquier futura prueba con datos requiere verificar y usar exclusivamente el entorno autorizado `gym_db_pruebas`.

## Prerrequisitos antes de ejecutar

1. Revisión/aprobación de `plan.md`, artefactos y decisiones aún abiertas.
2. Tareas y casos de prueba generados/revisados en etapa autorizada.
3. Implementación y dependencias explícitamente aprobadas; versión de Node documentada.
4. Verificar configuración IANA `America/Mexico_City` y hora inicial `00:30` desde configuración, no desde credenciales ni base de producción.
5. Confirmar que backend usa `.env.test` y que `DB_NAME` apunta a `gym_db_pruebas` antes de pruebas que accedan a datos. No usar migrador ni pruebas en esta etapa G-05.

## Escenarios futuros de aceptación

| Escenario | Validación esperada |
|---|---|
| Próximo vencimiento | Con revisión fechada en la zona configurada, membresía activa con fecha_fin a tres días naturales: se crea una notificación pendiente. |
| Idempotencia de membresía | Repetir la revisión y luego atender el aviso: no se crea otro con la misma clave tipo+membresía+vencimiento. |
| Renovación atómica | Renovar con aviso previo pendiente: aviso pasa a no aplicable y queda historial; una falla transaccional no deja cambio parcial; avisos atendidos conservan su estado. |
| Acceso rechazado | Un acceso rechazado produce una alerta vinculada al `id_acceso`; un autorizado no; repetir procesamiento no duplica. |
| Atención/auditoría | Actor/fecha se guardan junto al cambio; una falla de auditoría revierte la atención y genera error controlado/log seguro. |
| Reporte financiero | Filtrar pagos por fechas válidas y comparar con registros fuente; respetar estados y suma de adeudo existentes; no reportar utilidad neta. Adeudo es saldo actual, no histórico. |
| Reportes operativos | Comparar filtros y resultados por cliente, membresía y accesos con fuentes; resultados vacíos legibles. |
| Dashboard | Verificar que reportes detallados complementan los agregados enumerados en `research.md` sin duplicarlos como indicadores generales. |
| Permisos | Administrador permitido; recepcionista limitada a notificaciones de membresía; alertas de acceso/reportes globales denegados a recepcionista; entrenador/cliente denegados al módulo admin. |
| DOCX | Abrir el documento generado y comparar periodo, filtros, filas, totales y estado vacío con la respuesta del reporte. |

## Comandos de prueba

Los comandos de Vitest y Supertest se definirán en `/speckit.tasks` después de aprobar el plan y revisar los archivos de pruebas existentes. No ejecutar durante G-05; preservar la guarda de entorno configurada en el helper de pruebas.
