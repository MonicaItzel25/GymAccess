# Plan de implementación: Notificaciones, reportes y seguimiento administrativo (Sprint 4)

**Rama prevista**: `004-sprint-4-notificaciones-reportes` (la rama Git actual sigue siendo `main`)
**Fecha**: 2026-11-04
**Especificación**: [spec.md](./spec.md)

**Entrada**: `specs/004-sprint-4-notificaciones-reportes/spec.md`, decisiones D-01–D-10 y directrices técnicas aprobadas para G-05.

## Resumen

Planificar el módulo administrativo del Sprint 4 usando la arquitectura existente de GymAccess: notificaciones persistentes para vencimientos de membresía, alertas vinculadas a accesos rechazados, atención auditable, reportes derivados de los registros existentes y exportación `.docx`. Se propone configurar inicialmente `America/Mexico_City` y ejecutar la revisión diaria a las 00:30 de esa zona, manteniendo ambos valores configurables. La deduplicación se respaldará en persistencia, las renovaciones actualizarán los avisos pendientes dentro de su transacción y los permisos se validarán en el backend. La comparación del dashboard y las decisiones sobre límites reales de filtros y saldos se documentan en [research.md](./research.md).

Este documento y sus artefactos son diseño, no implementación. No se crearon código ni migraciones, no se instalaron dependencias y no se consultaron bases de datos.

## Contexto técnico

- **Lenguaje y plataforma**: JavaScript ES Modules; backend Node.js + Express, frontend React 18; MySQL mediante `mysql2`. Los planes anteriores describen Node.js 20+, aunque `backend/package.json` no fija `engines`; confirmar versión mínima del entorno antes de instalar `node-cron`.
- **Dependencias existentes**: Express, `mysql2`, `express-validator`, `dotenv`, React y React Router. No hay módulo S4 ni dependencia `.docx` instalada.
- **Candidatas evaluadas, no instaladas**: `node-cron` 4.6.0 para tarea diaria con zona IANA y prevención de solapamiento; requiere Node.js >=20. `docx` 9.15.2 para generar DOCX desde Node y admite Node.js >=16. Se justifica evaluar ambas por los requisitos de planificación/exportación; su incorporación efectiva queda sujeta a revisión del plan y a una tarea posterior.
- **Persistencia**: MySQL y migraciones versionadas. No se encontró tabla de notificaciones en código o migraciones inspeccionadas; no se comprobó el estado de ningún entorno de base de datos. Se diseña una tabla nueva `notificaciones`, cuya migración futura sería la siguiente numerada (`008`), sin crearla ni aplicarla ahora.
- **Pruebas**: Vitest y Supertest en backend; Vitest, Testing Library y jsdom en frontend. No se ejecutaron pruebas. Quickstart y tareas posteriores deberán restringir cualquier uso de datos a `gym_db_pruebas`.
- **Objetivo temporal**: zona IANA inicial configurable `America/Mexico_City`; expresión diaria propuesta `30 0 * * *`; zona/hora se configuran en entorno y no se codifican como constantes no configurables.
- **Alcance**: US-S4-01 a US-S4-07, FR-001–FR-029. Sin correo/SMS, contabilidad completa ni duplicación de indicadores agregados.
- **Límites**: no cambiar los módulos fuente más allá de los puntos de integración descritos; conservar datos originales; respetar permisos de D-07/D-08; no afirmar verificación de base de datos, pruebas o documentos exportados hasta contar con evidencia.

## Comprobación de la constitución

| Principio | Aplicación al diseño | Estado de planificación |
|---|---|---|
| I. Arquitectura por capas con API REST | UI consume API; servicios aplican reglas; modelos consultan MySQL. La exportación se genera en backend. | Conforme en el diseño; pendiente de revisión formal del plan. |
| II. Backend como única autoridad | `autenticar` y `autorizar(...)` en endpoints; validación en backend, no solo ocultamiento de UI. | Conforme en el diseño; cobertura por probar posteriormente. |
| III. Persistencia migrable y auditable | Tabla/migración nueva; claves foráneas y restricciones únicas; transacciones para renovación/atención auditada. | Diseño propuesto; migración no creada ni aplicada. |
| IV. Seguridad y privacidad | Respuestas de notificación/reportes solo con campos necesarios; no exponer contraseñas, tokens ni biometría. | Conforme en el diseño; pendiente de revisión de contratos y pruebas. |
| V. Alcance estricto y pruebas | Solo S4; no editar migraciones existentes; pruebas en etapa posterior y solo en entorno autorizado. | Conforme con restricciones; pruebas pendientes. |

**Resultado de la comprobación inicial**: no se identifica una violación de constitución en la propuesta. Esto no es aprobación de G-05 ni evidencia de implementación. La comprobación posterior al diseño permanece pendiente de revisión humana.

## Decisiones de diseño

1. **Ciclo de revisión**: proponer `node-cron` 4.6.0 ejecutado desde el punto de entrada `backend/src/server.js`, no al construir `crearApp()`, para no iniciar tareas al importar la aplicación en pruebas. Programar `30 0 * * *`, `timezone: America/Mexico_City` y `noOverlap: true`; configurar zona/hora explícitamente. La tabla y claves únicas protegen de repeticiones; la tolerancia ante caída prolongada se conserva como riesgo operativo a resolver antes de implementar.
2. **Notificaciones**: agregar una fila por tipo de notificación de membresía, membresía y fecha de vencimiento; respaldar unicidad en MySQL. La alerta de acceso tendrá `id_acceso` único. Los estados aprobados son pendiente, atendida y no aplicable.
3. **Renovación**: incluir la transición de notificaciones pendientes del periodo anterior a no aplicable en la misma transacción que cierra/crea el periodo de membresía; mantener estados atendidos y revertir todo si falla la transacción.
4. **Alertas de acceso**: crear la alerta a partir del identificador persistido de acceso rechazado; nunca alterar el registro de acceso ni convertir un fallo de alerta en cambio de decisión de acceso. Registrar el fallo técnicamente y hacer que el diseño contemple reconciliación idempotente.
5. **Reportes y filtros**: filtrar pagos por `fecha_pago` y campos ya presentes; calcular adeudos solo con el precio acordado menos pagos `pagado`, conforme al servicio existente. La fuente no conserva una fotografía histórica de adeudos: el reporte de adeudo se planifica como saldo actual; no se inventa un saldo «a fecha pasada». El periodo aplica al reporte de pagos y a los campos de fecha de los reportes operativos cuando corresponda.
6. **Dashboard**: conservar `Inicio.jsx`; no sustituir sus tarjetas. El inventario y la correspondencia de indicadores con reportes detallados se describen en `research.md`.
7. **Word**: `docx` 9.15.2 es candidata compatible con Node.js >=16 y ES Modules; no se instala ni se considera dependiente aprobada hasta revisar el plan y versión runtime.
8. **Auditoría**: la atención deberá guardar estado, actor y hora y registrar auditoría obligatoria. Diseño propuesto: realizar ambas escrituras con la misma conexión/transacción; si falla auditoría, revertir atención, registrar error técnico sin datos sensibles y devolver error controlado. No cambiar el comportamiento global actual de `auditoria.service.js` sin revisión.
9. **Permisos**: administrador accede al alcance S4; recepcionista solo consulta/atiende avisos de membresía; reportes globales y alertas de acceso son solo para administrador; entrenador/cliente denegados.

## Estructura propuesta

### Documentación de la función

```text
specs/004-sprint-4-notificaciones-reportes/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/api.md
├── spec.md
├── checklists/requirements.md
└── tasks.md                 # No crear en G-05; corresponde a /speckit.tasks
```

### Puntos de integración futuros (no editados en G-05)

```text
backend/src/
├── app.js                           # montar routers S4
├── server.js                        # iniciar trabajo diario en proceso servidor
├── controllers/                     # notificaciones y reportes
├── services/                        # generación, atención/auditoría y agregación
├── models/                          # persistencia y consultas parametrizadas
├── routes/                          # rutas S4 con autorizaciones específicas
└── validators/                      # filtros y entradas
backend/tests/                       # pruebas futuras, después de /speckit.tasks
frontend/src/
├── App.jsx                          # rutas UI
├── components/Layout.jsx            # menú por rol
├── services/api.js                  # clientes de API
└── pages/                           # pantallas de notificaciones/reportes
database/migrations/
└── 008_crear_notificaciones_sprint4.sql  # propuesta futura; no creada
```

**Estructura seleccionada**: monorepo actual de tres partes (`backend/`, `frontend/`, `database/`) y documentación bajo la carpeta de la feature. Los archivos marcados son puntos candidatos sujetos a tareas; no son cambios efectuados.

## Dependencias, riesgos y condiciones pendientes

- La tarea programada vive en memoria del proceso; `node-cron` no ofrece por sí solo ejecución durable ante interrupciones. Se debe decidir y probar política de recuperación de días omitidos antes de implementar.
- El backend existente no declara `engines`; el candidato `node-cron` requiere Node >=20. Verificar y documentar runtime real antes de instalar.
- La regla de adeudo disponible calcula un saldo vigente, no adeudo histórico por fecha. El reporte no deberá sugerir una reconstrucción histórica sin datos que la respalden.
- Los reportes nuevos requieren consultas con filtros permitidos por campo; el listado actual de pagos no filtra por fecha y requeriría ampliación futura. Los filtros de clientes, membresías y accesos se limitarán a campos realmente disponibles.
- El servicio de auditoría existente absorbe fallos; atención trazable exige un tratamiento transaccional y un registro de errores acotado sin datos sensibles.
- El inventario del dashboard está documentado, pero la revisión de solapamiento se considera completada solo para la pantalla de inicio encontrada; no se halló endpoint específico de dashboard ni módulo de reportes detallados.
- Hay numerosos cambios locales ajenos en archivos compartidos. Toda implementación futura deberá inspeccionar diffs antes de editar y aislar commits por alcance.

**Artefactos de G-05**: `research.md`, `data-model.md`, `contracts/api.md` y `quickstart.md` acompañan este plan. G-05 permanece pendiente de revisión; no se generó `tasks.md`.
