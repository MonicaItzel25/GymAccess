# Aseguramiento de la calidad - Sprint 4: Notificaciones, reportes y seguimiento administrativo

<!--
Registro de calidad de `docs/aseguramiento-calidad-sprint-4.md`.
La guía indicada `docs/aseguramiento-calidad/guia-aseguramiento-calidad.md` no se encontró en el repositorio durante esta etapa.
Elimina estos comentarios y las notas «(Guía: ...)» antes de convertir a Word.
Al cierre no debe quedar ningún < >, «Pendiente» ni «Captura pendiente» como estado.
-->

Este documento es el registro de calidad del Sprint 4 de GymAccess. Reúne las puertas de calidad, las decisiones, los riesgos, la trazabilidad de los criterios de aceptación, los hallazgos, la regresión de los sprints anteriores y el control de calidad final, con sus evidencias.

Resultado general: Pendiente. El sprint está en preparación; no se han verificado criterios de cierre.

## 0. Datos del documento

| Campo | Valor |
|---|---|-
| Sprint | 4 - Notificaciones, reportes y seguimiento administrativo |
| Insumo | `docs/sprint-4.md` |
| Rama | Pendiente de crear; nombre de feature previsto: `004-sprint-4-notificaciones-reportes` |
| Responsable | Pendiente de definir |
| Fecha de inicio | Pendiente de registrar |
| Fecha de cierre | Pendiente; sprint no cerrado |
| Estado general | En preparación; sin aprobación |

## 1. Objetivo y alcance

**Objetivo.** Asegurar que el Sprint 4 de GymAccess salga con calidad: que los requisitos estén completos, sean medibles y no se contradigan, que las pruebas estén planeadas antes del código y que el cambio no rompa lo construido en los sprints anteriores.

**Dentro del alcance:** US-S4-01 a US-S4-07: notificaciones internas de membresías próximas a vencer (tres días naturales antes) y vencidas; alertas internas de accesos rechazados; consulta, filtros y atención trazable de notificaciones; reportes financieros de pagos y adeudos; reportes operativos; filtros y exportación a Word `.docx`. Permisos aprobados: administrador con acceso completo; recepcionista consulta y atiende notificaciones de membresías, sin reportes financieros globales; entrenador y cliente sin acceso al módulo administrativo.

**Fuera del alcance:** notificaciones por correo, SMS o servicios externos; aplicación móvil; pasarelas de pago, facturación electrónica o contabilidad completa; cambios al reconocimiento facial o hardware; reconstrucción de funcionalidades anteriores; cambios de credenciales; duplicación de dashboard o reportes existentes. Los permisos no confirmados para la recepcionista se mantienen restringidos hasta su aprobación.

## 2. Criterios de entrada y de salida

Pendiente: aún no se ha evaluado el cumplimiento de los criterios de entrada o de salida.

**Criterios de entrada (para comenzar la implementación):**

- [ ] Las 8 puertas de la sección 3 están Aprobadas o Aprobadas con observación.
- [ ] Si el sprint exige un cambio a la constitución del proyecto, la enmienda está aprobada y registrada (hallazgo H-01).
- [ ] Las decisiones de la sección 4 están resueltas y registradas.
- [ ] No hay hallazgos críticos ni altos abiertos en el análisis de consistencia.
- [ ] Cada criterio de aceptación tuvo al menos una prueba planeada (sección 6).
- [ ] La línea base de regresión está registrada (sección 8).
- [ ] La documentación desfasada de los sprints anteriores está identificada.

**Criterios de salida (para cerrar el sprint):**

- [ ] Los criterios de aceptación están aprobados. **Pendiente de verificación.**
- [ ] Todas las pruebas de los sprints anteriores siguen pasando.
- [ ] No hay defectos críticos ni altos abiertos (sección 7).
- [ ] La matriz de calidad final (sección 9) está completa, con evidencia.
- [ ] Reporte, análisis y matriz no se contradicen.

(Guía: cambia `[ ]` por `[x]` solo cuando el criterio de verdad se cumplió.)

## 3. Puertas de calidad

El estado de cada puerta se registra con la evidencia disponible; las puertas aún no verificadas permanecen pendientes. El detalle está en los documentos citados en la columna de evidencia.

| ID | Puerta | Estado | Evidencia |
|:--:|---|---|---|-
| G-01 | Insumo del sprint revisado contra el código | Pendiente de validación completa | Revisión documental y estática de solo lectura realizada en `backend/src/app.js`, controladores, servicios, modelos, rutas y middlewares de clientes, membresías, pagos/adeudos, accesos y auditoría; revisados `frontend/src/pages/Inicio.jsx`, `frontend/src/services/api.js`, migraciones de `database/migrations/` y paquetes. Se encontraron módulos reutilizables para esos datos, auditoría y permisos. `Inicio.jsx` presenta agregados; no se identificó endpoint específico de dashboard ni módulo de reportes detallados. El inventario y la comparación de complementariedad FR-017/FR-019 se documentan en `specs/004-sprint-4-notificaciones-reportes/research.md`, R-06, con revalidación futura requerida. Persistencia física de notificaciones no confirmada porque no se consultaron bases de datos. `docs/sprint-3.md` presenta discrepancia de título/insumo por aclarar; por ello G-01 no se marca aprobada. No se ejecutaron pruebas. |
| G-02 | Especificación (`/speckit.specify`) | Pendiente de revisión | `specs/004-sprint-4-notificaciones-reportes/spec.md` creada en esta etapa a partir del insumo y referencias. No se ejecutaron otras etapas Spec Kit ni una revisión formal de requisitos. |
| G-03 | Aclaraciones (`/speckit.clarify`) | Aprobada con observaciones | Preguntas funcionales de las siete historias respondidas expresamente por el usuario y registradas como D-01 a D-10 en `specs/004-sprint-4-notificaciones-reportes/spec.md`. Para planificación se propusieron `America/Mexico_City` y 00:30 como valores iniciales configurables; deben quedar configurados/verificados antes de implementar. |
| G-04 | Lista de calidad de requisitos (`/speckit.checklist`) | Aprobada con observaciones | `specs/004-sprint-4-notificaciones-reportes/checklists/requirements.md`: 20/20 criterios documentales cumplen. El inventario comparativo de la pantalla `Inicio.jsx` y su complementariedad se documenta ahora en `specs/004-sprint-4-notificaciones-reportes/research.md`, R-06; debe revalidarse contra el código vigente antes de implementar. No se ejecutaron pruebas. |
| G-05 | Plan (`/speckit.plan`) | Pendiente; no aprobada en revisión técnica | Revisión documental y estática realizada el 2026-11-04 contra el spec, plan y cuatro artefactos, además de servicios/modelos/rutas/package manifests actuales. Se detectaron bloqueos de consistencia y decisiones por cerrar en H-16 a H-22; ver «Revisión técnica de G-05». No se generó `tasks.md`, no se implementó código, no se ejecutaron pruebas ni migraciones, no se instalaron dependencias y no se consultaron bases de datos. |
| G-06 | Tareas (`/speckit.tasks`) | Pendiente | `tasks.md` no se crea en esta etapa. |
| G-07 | Consistencia (`/speckit.analyze`) | Pendiente | No ejecutado; sin resultados de análisis ni cobertura declarada. |
| G-08 | Pruebas planeadas y línea base | Pendiente | No se ejecutaron pruebas ni se registró línea base; deben planearse en etapas posteriores. |

## 4. Decisiones de aclaración

| ID | Pregunta | Resolución aprobada | Requisito afectado | Evidencia en el spec |
|---|---|---|---|---|-
| D-01 | ¿Qué zona horaria determina los días naturales? | Zona local del gimnasio obtenida de configuración explícita con identificador IANA; valor concreto antes de implementar. | FR-001, RN-001, RN-002 | `specs/004-sprint-4-notificaciones-reportes/spec.md`, «Aclaraciones resueltas», D-01 |
| D-02 | ¿Con qué frecuencia se revisan vencimientos? | Una vez al día, a una hora configurable en la zona local del gimnasio. | FR-001, FR-003, RN-002 | `specs/004-sprint-4-notificaciones-reportes/spec.md`, «Aclaraciones resueltas», D-02 |
| D-03 | ¿Qué ocurre con una alerta pendiente sustituida por renovación? | Marcar «No aplicable» y conservarla; las ya atendidas conservan su estado. | FR-005, FR-014, RN-003, RN-007 | `specs/004-sprint-4-notificaciones-reportes/spec.md`, «Aclaraciones resueltas», D-03 |
| D-04 | ¿Cómo se deduplican avisos de membresía después de atenderlos? | Una por tipo + membresía + vencimiento; no se recrea aunque esté atendida. | FR-004, FR-014, RN-004 | `specs/004-sprint-4-notificaciones-reportes/spec.md`, «Aclaraciones resueltas», D-04 |
| D-05 | ¿Cómo se deduplican alertas de acceso? | Una por registro de acceso rechazado; no se recrea aunque esté atendida. | FR-007, FR-014 | `specs/004-sprint-4-notificaciones-reportes/spec.md`, «Aclaraciones resueltas», D-05 |
| D-06 | ¿Qué retención aplica a notificaciones atendidas? | Sin purga automática y conservadas en historial; no se fija plazo de retención en esta etapa. | FR-014, RN-007 | `specs/004-sprint-4-notificaciones-reportes/spec.md`, «Aclaraciones resueltas», D-06 |
| D-07 | ¿Puede recepción consultar o atender alertas de acceso rechazado? | No; consulta y atención reservadas al administrador. | FR-024, FR-025, RN-011 | `specs/004-sprint-4-notificaciones-reportes/spec.md`, «Aclaraciones resueltas», D-07 |
| D-08 | ¿Puede recepción consultar o exportar reportes operativos globales? | No; consulta y exportación reservadas al administrador. | FR-017, FR-024, FR-025, RN-010, RN-011 | `specs/004-sprint-4-notificaciones-reportes/spec.md`, «Aclaraciones resueltas», D-08 |
| D-09 | ¿Cómo evitar duplicar el dashboard de Sprint 3? | Reportes S4 detallados, filtrables y exportables complementan los agregados; no los duplican. Verificar dashboard existente. | FR-017, FR-019, RN-014 | `specs/004-sprint-4-notificaciones-reportes/spec.md`, «Aclaraciones resueltas», D-09 |
| D-10 | ¿Qué pagos/adeudos reportar? | Usar los pagos que el módulo existente considera válidos y su regla vigente de adeudo; verificar implementación y no inventar estados. | FR-015, FR-016 | `specs/004-sprint-4-notificaciones-reportes/spec.md`, «Aclaraciones resueltas», D-10 |

Las respuestas fueron expresas en esta conversación. No se agrega fecha ni aprobación distinta de las decisiones registradas.

### Decisiones técnicas para la planificación G-05

Estas decisiones reflejan directrices del usuario y propuestas técnicas de diseño; no equivalen a implementación ni aprobación de G-05.

| ID | Decisión para el plan | Alcance / estado | Evidencia |
|---|---|---|---|
| TD-01 | Usar `America/Mexico_City` como zona IANA inicial configurable y proponer revisión diaria a las 00:30 locales, también configurable. | Valor inicial de planificación; comprobar configuración y comportamiento antes de implementar. | `specs/004-sprint-4-notificaciones-reportes/plan.md`, decisiones 1; `research.md`, R-01. |
| TD-02 | Evaluar `node-cron` 4.6.0 para horario IANA y evitar solapamientos; ejecución prevista desde `server.js`. | Candidata compatible con Node >=20; runtime real no está fijado en `backend/package.json`; no instalada. | `research.md`, R-01; documentación oficial enlazada allí. |
| TD-03 | Diseñar tabla `notificaciones` con unicidad tipo+membresía+vencimiento y unicidad de `id_acceso`. | Propuesta de persistencia nueva; no confirmada en la base ni migrada. | `data-model.md`, secciones 2 y 5; `research.md`, R-02. |
| TD-04 | Integrar el cambio de avisos pendientes a no aplicable dentro de la transacción de renovación. | Atendidas conservan su estado; pruebas de rollback pendientes. | `research.md`, R-03; `plan.md`, decisión 3. |
| TD-05 | Basar filtros en columnas y valores existentes; adeudo solo como saldo vigente con regla existente, sin inventar saldo histórico. | La semántica de periodo para adeudos requiere revisión porque la fuente no guarda saldos históricos. | `research.md`, R-05; `data-model.md`, sección 4; H-16. |
| TD-06 | Documentar agregados existentes de `Inicio.jsx` y especificar reportes detallados complementarios, no tarjetas duplicadas. | Inventario documental realizado; revalidación antes de implementar. | `research.md`, R-06; FR-017/FR-019; H-04/H-10. |
| TD-07 | Evaluar `docx` 9.15.2 para generación DOCX en backend. | Candidata con Node >=16 y soporte ESM; no instalada ni aprobada como dependencia final. | `research.md`, R-07; metadata npm enlazada allí. |
| TD-08 | Registrar atención y auditoría en una transacción; revertir atención si falla la auditoría y dejar error técnico sin datos sensibles. | Diseño específico pendiente de implementación y pruebas; no alterar el comportamiento global del servicio existente sin revisión. | `research.md`, R-08; H-13. |
| TD-09 | Validar permisos específicos en backend: administrador completo S4; recepcionista solo avisos de membresía; otros reportes/alertas reservados al administrador. | Alineado con D-07/D-08; rutas futuras deben probarse. | `contracts/api.md`, convenciones y rutas; `research.md`, R-09. |

### Revisión técnica de G-05 (2026-11-04)

**Resultado**: G-05 permanece pendiente y no puede aprobarse todavía. La revisión encontró que el plan reconoce varias incertidumbres, pero no las resuelve ni mantiene consistencia completa con el spec. H-16–H-22 son hallazgos documentales/estáticos, no fallos observados en ejecución. No se hicieron pruebas, instalaciones, migraciones ni consultas a bases de datos.

| Área revisada | Resultado verificable | Corrección o decisión requerida |
|---|---|---|
| Adeudos actuales e históricos (H-16) | `pago.service.js` calcula `max(0, precio_acordado - pagos pagados)` con datos actuales; no hay historial temporal de saldos. En cambio, US-S4-05 describe reportes de pagos y adeudos «por periodo». | Resolver con el usuario si el reporte de adeudos será una fotografía actual separada del periodo de pagos, o si se requiere modelar y persistir historia. Actualizar spec, contrato y criterio de aceptación; no presentar saldo actual como saldo del periodo. |
| Interrupciones del job y alertas de acceso (H-15/H-17) | `node-cron` es un scheduler en proceso; no ejecuta durante una caída. El plan deja la recuperación sin política definida. `research.md` R-04 menciona reconciliar accesos desde la revisión programada, pero el plan define ese job como revisión de membresías y no especifica un escaneo de accesos. | Definir reconciliación al arranque/ejecución, fechas omitidas y alertas de acceso rechazado pendientes; decidir si se emiten avisos tardíos. Si hay más de una instancia, definir ejecución única distribuida o documentar/desplegar una sola instancia. |
| Idempotencia y concurrencia (H-18) | El modelo propuesto tiene claves UNIQUE que protegen inserciones concurrentes para claves no nulas, pero no especifica insertar idempotentemente ante conflicto ni restricciones de correspondencia entre tipo y referencias. La clave de acceso separada sí es necesaria. | Definir estrategia de inserción basada en la restricción única, distinguir conflicto esperado de error real y asegurar que cada tipo tenga exactamente sus referencias. Probar reintentos y dos generadores simultáneos. |
| Renovación (H-19) | La renovación existente obtiene la membresía antes de abrir transacción y luego actualiza/cierra y crea el nuevo periodo. El plan dice «bloquear» la membresía, pero no define un protocolo de bloqueo común a renovación y generador. | Especificar bloqueo/orden de operaciones compartido por ambos flujos y actualización de avisos pendientes dentro de la misma conexión transaccional; mantener atendidas intactas. Resolver carreras de generación y renovación antes de tareas. |
| Filtros/periodos y totales (H-20) | Pagos hoy se listan sin filtro por fecha; accesos solo filtran fecha/cliente. En contratos, la semántica temporal de membresías queda pendiente y clientes solo tienen búsqueda; FR-020 solicita filtros por periodo para reportes. Además, «solo pagado» es regla para reducir adeudo, no una definición completa de totales del reporte de pagos. | Definir por reporte qué fecha limita el intervalo (registro de cliente, inicio/fin de membresía, fecha_pago, fecha del acceso), inclusión de extremos y estados/columnas de totales. Mantener separados pagos por periodo y adeudo actual, si esa es la decisión aprobada. |
| DOCX (H-21) | `docx` 9.15.2 es candidata con metadata de compatibilidad Node >=16/ESM, pero no se instaló ni se validaron API, licencia, tamaño de salida o comportamiento. El contrato no concreta MIME, `Content-Disposition`, nombre de archivo ni límites de exportación. | Revisar licencia/API y compatibilidad con la versión Node real; definir respuesta binaria, nombre/MIME, límites/volumen y que consulta y exportación usen la misma definición de filtros y agregados. La exportación queda sin dependencia aprobada. |
| Permisos (revisión estática) | Matriz propuesta de S4 concuerda con D-07/D-08: administrador completo, recepcionista solo notificaciones de membresía y otros roles denegados. Las rutas existentes son más amplias en algunos módulos, por lo que no se deben reutilizar permisos sin restringirlos. No hay endpoints S4 implementados. | Mantener autorización de backend por cada ruta y tipo de notificación, incluido acceso directo a detalle/exportación; probar 401/403 y no depender del menú del frontend. Diseño conforme, ejecución pendiente. |
| Auditoría y concurrencia de atención (H-22) | El servicio de auditoría actual absorbe errores y el modelo no acepta conexión transaccional; la propuesta de transacción estricta para atención es correcta como diseño, pero no define transición condicional/lock para dos solicitudes concurrentes ni una vía durable del error si falla la auditoría. | Diseñar actualización atómica solo desde pendiente y auditar en la misma conexión. Definir respuesta del segundo actor y registro seguro del error sin marcar la atención como exitosa si falla la auditoría. |
| Compatibilidad y archivos compartidos | `backend/package.json` no declara `engines`; node-cron requiere Node >=20 según metadata revisada. `docx` es candidata, no instalada. La ruta de servidor existente es `server.js`; `app.js` y varias rutas/UI/API compartidas están modificadas localmente con trabajo ajeno/Sprint 3. | Confirmar runtime y lockfile en la etapa autorizada; no incluir dependencias ni tocar/reescribir cambios locales ajenos. Integrar rutas compartidas mediante revisión del diff vigente. |

## 5. Riesgos y mitigaciones

| ID | Riesgo | Impacto | Mitigación | Prueba que lo cubre | Estado |
|:--:|---|---|---|---|---|-
| R-01 | Duplicar indicadores o reportes cubiertos por el dashboard de Sprint 3 | Alto: resultados redundantes o alcance contradictorio | Aplicar D-09: S4 entrega consultas detalladas complementarias; revalidar la matriz de agregados antes de implementar | `research.md`, R-06; `frontend/src/pages/Inicio.jsx`; FR-017/FR-019; revalidación futura | Abierto |
| R-02 | Calcular vencimientos en zona horaria o frecuencia distintas a las aprobadas | Alto: seguimiento erróneo de membresías | Definir zona IANA y hora diaria; diseñar cálculo de días naturales y probar límites de fecha y cambios horarios antes de implementar | `backend/src/services/membresia.service.js`, `backend/src/models/membresia.model.js`; `spec.md`, D-01/D-02; configuración y pruebas pendientes | Abierto |
| R-03 | Exponer notificaciones o reportes a roles no autorizados | Alto: acceso indebido a información administrativa/financiera | Aplicar D-07/D-08 y validar autorización en backend en rutas nuevas; no inferir permisos de endpoints existentes | `backend/src/middlewares/auth.js`, `backend/src/middlewares/authorize.js`, rutas actuales; `spec.md`, D-07/D-08; verificación de rutas S4 y pruebas pendientes | Abierto |
| R-04 | Diferencias entre totales reportados y pagos/adeudos existentes | Alto: reportes financieros incorrectos | Aplicar D-10 y contrastar cálculos y estados con el módulo existente; no presentar pagos como utilidad neta | `backend/src/services/pago.service.js`, `backend/src/models/pago.model.js`; `spec.md`, D-10; pruebas pendientes | Abierto |
| R-05 | Divergencia entre dos documentos titulados como insumo del Sprint 4 | Medio: requisitos o decisiones inconsistentes | Comparar documentos y establecer cuál es la fuente vigente, sin sobrescribirlos | `docs/sprint-3.md`; `docs/sprint-4.md`; aclaración pendiente | Abierto |
| R-06 | Renovación y generación concurrente pueden dejar avisos pendientes obsoletos o duplicados | Alto: historial de notificaciones inconsistente | Definir coordinación transaccional con renovación y una garantía de unicidad/idempotencia por las claves aprobadas | `backend/src/services/membresia.service.js`, `backend/src/models/membresia.model.js`; `spec.md`, FR-004/FR-005/RN-004; diseño y pruebas pendientes | Abierto |
| R-07 | Los filtros existentes no cubren necesariamente los reportes por periodo | Alto: reportes incompletos o totales incorrectos | Precisar filtros por reporte y validar fechas; no asumir que los listados actuales satisfacen el contrato | `backend/src/models/acceso.model.js` admite fechas/cliente; `backend/src/models/pago.model.js` no expone filtro por fecha; especificación FR-020/FR-021 | Abierto |
| R-08 | Los fallos al registrar auditoría no se propagan al flujo de negocio | Medio: una atención podría concluir sin evidencia durable en auditoría | Definir el nivel de garantía requerido y diseñar la integración de atención con el servicio existente | `backend/src/services/auditoria.service.js`; revisión estática; decisión de diseño pendiente | Abierto |
| R-09 | No se identificó mecanismo de exportación Word `.docx` | Medio: riesgo de dependencia inadecuada o exportación no conforme | Evaluar mecanismo compatible, contenido y validación del documento antes de implementar; no instalar dependencias en esta etapa | `backend/package.json`, `frontend/package.json`; evaluación pendiente | Abierto |
| R-10 | Archivos compartidos del backend/frontend tienen cambios locales ajenos a esta etapa | Alto: riesgo de sobrescribir o incluir trabajo no autorizado al integrar S4 | Inspeccionar cada diff antes de editar; preservar cambios ajenos y limitar cualquier commit a archivos autorizados de Sprint 4 | `git status --short` observado al iniciar esta revisión; `backend/src/app.js`, `frontend/src/App.jsx`, `frontend/src/services/api.js` y otros archivos modificados localmente | Abierto |
| R-11 | La tarea programada en memoria puede omitir revisiones si el proceso está detenido | Alto: membresías próximas a vencer pueden no generar aviso el día previsto | Definir recuperación/checkpoint de ejecuciones perdidas; mantener unicidad persistente y no solapamiento | `research.md`, R-01; candidata `node-cron`; no hay política de recuperación implementada | Abierto |
| R-12 | La recuperación diaria no cubre claramente avisos de acceso rechazado y puede duplicar trabajo en varias instancias | Alto: alertas perdidas durante caídas o ejecuciones redundantes | Definir reconciliación por registros rechazados sin notificación, política de aviso tardío y ejecución única distribuida o topología de una instancia; mantener restricción UNIQUE | `research.md`, R-04/R-01; `plan.md`, decisiones 1 y 4; alcance del job aún no especificado | Abierto |
| R-13 | Las claves únicas propuestas no bastan si la aplicación maneja conflictos como fallos, las referencias no corresponden al tipo o la renovación no comparte bloqueo con el generador | Alto: carreras, errores 500 o aviso obsoleto duplicado | Definir inserción idempotente ante conflicto, invariantes tipo/referencia y un protocolo de bloqueo común con renovación; probar concurrencia | `data-model.md`, sección 2; `research.md`, R-02/R-03; `membresia.service.js` lee antes de iniciar la transacción | Abierto |
| R-14 | Los filtros y totales por periodo no tienen semántica completa por fuente | Alto: conjuntos distintos o totales financieros engañosos | Definir campo de fecha por reporte, límites del periodo y significado de total pagado frente a pendiente/cancelado; conservar el adeudo como saldo actual salvo aprobación explícita | `spec.md`, FR-015/FR-016/FR-020/FR-021; `contracts/api.md`; `pago.model.js`, `acceso.model.js` | Abierto |
| R-15 | Exportación DOCX no tiene contrato de transporte ni validación de compatibilidad completa | Medio: archivos no descargables, inconsistentes o demasiado grandes | Verificar librería/licencia con runtime real y definir MIME, `Content-Disposition`, límites y equivalencia de consulta/exportación | `research.md`, R-07; `contracts/api.md`, rutas DOCX; manifests sin dependencia DOCX | Abierto |
| R-16 | Atenciones concurrentes o error de auditoría podrían no producir una única transición con trazabilidad fiable | Alto: doble auditoría, resultado ambiguo o atención sin rastro durable | Usar transición condicional/lock y auditoría estricta en la misma transacción; definir log de error seguro y respuesta para solicitudes concurrentes | `research.md`, R-08; `auditoria.service.js` absorbe errores; `auditoria.model.js` no acepta conexión | Abierto |

## 6. Trazabilidad

Cada criterio de aceptación (CA) se enlaza con su requisito, su tarea, su prueba y el resultado verificado.

| CA | Criterio de aceptación (resumen) | Requisito (FR) | Tarea | Prueba | Resultado | Evidencia |
|:--:|---|---|---|---|---|---|-
| US-S4-01, CA 1–6 | Aviso a tres días; deduplicación; renovación preserva historial y estado atendido | FR-001, FR-002, FR-004–FR-006, FR-014 | Pendiente de `/speckit.tasks` | Pendiente de planear/ejecutar | Diseñado; no implementado ni probado | `plan.md`, decisiones 1–3; `research.md`, R-01–R-03; `data-model.md`, secciones 2–3 |
| US-S4-02, CA 1–4 | Avisos de vencimiento sin renovación sustituta y sin duplicados | FR-003–FR-006 | Pendiente de `/speckit.tasks` | Pendiente de planear/ejecutar | Diseñado; no implementado ni probado | `data-model.md`, secciones 2–3; `contracts/api.md`, notificaciones |
| US-S4-03, CA 1–5 | Alerta por acceso rechazado, sin duplicar ni alterar registro fuente | FR-007–FR-009 | Pendiente de `/speckit.tasks` | Pendiente de planear/ejecutar | Diseñado; no implementado ni probado | `research.md`, R-04; `data-model.md`, sección 2 |
| US-S4-04, CA 1–6 | Consulta, filtros, atención trazable e imposición de permisos | FR-010–FR-014, FR-024–FR-025, FR-028 | Pendiente de `/speckit.tasks` | Pendiente de planear/ejecutar | Diseñado; no implementado ni probado | `research.md`, R-08/R-09; `contracts/api.md`, notificaciones |
| US-S4-05, CA 1–6 | Reportes de pagos y adeudos según fuentes y reglas existentes | FR-015–FR-016, FR-018, FR-020–FR-023 | Pendiente de `/speckit.tasks` | Pendiente de planear/ejecutar | Inconsistencia abierta: historia pide adeudos por periodo, fuente solo respalda adeudo actual; definición de totales/estados de pagos también incompleta. No implementado ni probado. | `spec.md`, US-S4-05/FR-015/FR-016/FR-020; `research.md`, R-05; `data-model.md`, sección 4; H-16/H-20 |
| US-S4-06, CA 1–7 | Reportes operativos detallados, filtrables, exportables y complementarios al dashboard | FR-017–FR-019, FR-020–FR-027 | Pendiente de `/speckit.tasks` | Pendiente de planear/ejecutar | Inventario/documentación realizados; revalidación e implementación/pruebas pendientes | `research.md`, R-06; `contracts/api.md`, reportes operativos |
| US-S4-07, CA 1–7 | Validación de filtros, exportación DOCX y control de acceso | FR-020–FR-029 | Pendiente de `/speckit.tasks` | Pendiente de planear/ejecutar | Diseño propuesto; dependencia DOCX no instalada; no implementado ni probado | `research.md`, R-07/R-09; `quickstart.md`; `contracts/api.md` |

## 7. Hallazgos y defectos

Se registra todo lo que se encuentre, sea en los documentos, en el análisis o en las pruebas.

| ID | Descripción | Severidad (crítica, alta, media, baja) | Origen (puerta o prueba) | Estado | Resolución | Evidencia |
|:--:|---|---|---|---|---|---|-
| H-01 | Zona horaria y frecuencia de revisión no estaban concretadas en el spec inicial | Media | G-03 | Resuelto con observación | Revisión diaria en zona local IANA explícita y hora configurable; configurar valores antes de implementar | `specs/004-sprint-4-notificaciones-reportes/spec.md`, D-01/D-02 |
| H-02 | No estaba definida la transición de notificaciones tras renovación ni su clave de duplicidad | Media | G-03 | Resuelto | No aplicable para aviso pendiente; unicidad por evento de membresía o registro de acceso; sin recreación tras atención | `specs/004-sprint-4-notificaciones-reportes/spec.md`, D-03/D-04/D-05 |
| H-03 | Permisos de recepcionista para alertas de acceso y reportes operativos eran ambiguos | Media | G-03 | Resuelto | Ambos permisos denegados; operaciones reservadas al administrador | `specs/004-sprint-4-notificaciones-reportes/spec.md`, D-07/D-08 |
| H-04 | Riesgo de solapar reportes S4 con agregados del dashboard S3 | Media | G-03/G-05 | Resuelto con observación | Se inventariaron las tarjetas de `Inicio.jsx` y se documentó la complementariedad de reportes detallados; revalidar contra código vigente antes de implementar | `specs/004-sprint-4-notificaciones-reportes/research.md`, R-06; FR-017/FR-019 |
| H-05 | Campos/estados concretos para conciliación financiera requieren comprobar el módulo existente | Media | G-03/G-05 | Resuelto con observación | Se verificaron en código/migración los estados existentes y que solo pagos `pagado` reducen el adeudo; sigue sin haber saldos históricos por periodo, registrado separadamente en H-16 | `backend/src/models/pago.model.js`, `backend/src/services/pago.service.js`, `database/migrations/002_crear_tablas_sprint1.sql`; `research.md`, R-05 |
| H-06 | Algunos criterios de aceptación no hacían observables las decisiones D-03, D-04, D-05 y D-09 | Media | G-04 | Resuelto | Se agregaron escenarios explícitos para estado «No aplicable», deduplicación posterior a atención y complementariedad de reportes; checklist documental 20/20 | `specs/004-sprint-4-notificaciones-reportes/spec.md`, US-S4-01 escenarios 3 y 6, US-S4-03 escenario 5, US-S4-06 escenario 7; `checklists/requirements.md`, C07–C09 y C13 |
| H-07 | No se identificó implementación de persistencia de notificaciones en el código ni en las migraciones revisadas | Alta | G-01 | Abierto: persistencia no confirmada | Revisados `backend/src/` y `database/migrations/`; no se consultó ninguna base de datos, por lo que la existencia real de estructuras en los entornos no queda confirmada | `backend/src/`; `database/migrations/001_crear_base_datos.sql` a `007_crear_tablas_sprint3.sql`; inspección documental, sin acceso a DB |
| H-08 | No se identificó programador de revisión diaria ni configuración de zona IANA/hora en el código revisado | Alta | G-01/G-05 | Abierto: implementación y configuración pendientes | El plan propone `node-cron`, `America/Mexico_City` y 00:30 configurables; aún no existen en el código ni se han verificado en ejecución | `backend/src/`; `specs/004-sprint-4-notificaciones-reportes/plan.md`, decisión 1; `research.md`, R-01 |
| H-09 | No se identificó un módulo de reportes detallados ni endpoint específico de dashboard | Media | G-01 | Abierto: funcionalidad aún no implementada | Los reportes S4 deberán diseñarse sobre fuentes existentes; `Inicio.jsx` presenta agregados pero no reemplaza la comparación de cobertura | `frontend/src/pages/Inicio.jsx`, `frontend/src/services/api.js`, `backend/src/app.js`; inspección estática |
| H-10 | La comparación formal de los agregados de `Inicio.jsx` con FR-017/FR-019 no estaba documentada | Media | G-01/G-05 | Resuelto con observación | La matriz por rol y su complementariedad se documentaron en R-06; revalidar contra el código vigente justo antes de implementar | `frontend/src/pages/Inicio.jsx`; `specs/004-sprint-4-notificaciones-reportes/research.md`, R-06; FR-017/FR-019 |
| H-11 | Los filtros de las fuentes existentes son limitados para los reportes requeridos | Media | G-01 | Abierto: alcance de filtros por precisar | Accesos admiten fechas y cliente; en los modelos/servicios de pagos revisados no se encontró filtro por fecha. Precisar filtros por tipo de reporte | `backend/src/models/acceso.model.js`, `backend/src/models/pago.model.js`, `backend/src/services/pago.service.js`; revisión estática |
| H-12 | No se identificó mecanismo o dependencia de generación `.docx` | Media | G-01 | Abierto: alternativa técnica por evaluar | Evaluar compatibilidad sin instalar dependencias durante esta inspección | `backend/package.json`, `frontend/package.json`; revisión estática |
| H-13 | El servicio de auditoría captura fallos y continúa la operación | Media | G-01 | Abierto: garantía para atención por definir | Es comportamiento existente; definir si la atención de notificaciones requiere tratamiento distinto o evidencia adicional | `backend/src/services/auditoria.service.js`; revisión estática |
| H-14 | Hay archivos compartidos con cambios locales ajenos al alcance de esta etapa | Alta | G-01 | Abierto: proteger durante integración | El estado de Git mostró modificaciones y archivos sin seguimiento ajenos a G-04; deben preservarse y excluirse de cualquier commit S4 no autorizado | `git status --short` observado al inicio de la inspección; lista de trabajo local |
| H-15 | El scheduler en memoria no ejecuta durante caídas; no se define recuperación de días omitidos ni semántica del aviso tardío | Alta | G-05 | Abierto: política de recuperación pendiente | Definir reconciliación/catch-up por fechas de negocio y comprobar comportamiento tras reinicio. `noOverlap` por sí solo no da durabilidad | `research.md`, R-01; `plan.md`, decisión 1 y riesgos |
| H-16 | La historia financiera solicita pagos y adeudos por periodo, pero el módulo existente solo calcula adeudo actual y no guarda saldos históricos | Alta | G-05 | Abierto: bloqueo de consistencia funcional | El plan evita inventar saldos históricos, pero ofrecer solo fotografía actual no satisface literalmente «adeudos por periodo». Requiere decisión del usuario y corrección concordante del spec/contrato o diseño de persistencia histórica antes de aprobar G-05 | `spec.md`, US-S4-05 y FR-015/FR-016/FR-020; `backend/src/services/pago.service.js`; `research.md`, R-05; `contracts/api.md` |
| H-17 | La reconciliación de accesos rechazados se menciona dentro del proceso diario sin incluirse explícitamente en el alcance del job ni definir su recuperación | Alta | G-05 | Abierto: completar diseño de recuperación | El plan describe el scheduler como revisión de membresías; si falla la alerta tras guardar acceso, debe definirse qué proceso vuelve a buscar registros rechazados sin alerta y cómo evita trabajo redundante | `backend/src/services/acceso.service.js` (guarda acceso); `backend/src/models/acceso.model.js` (devuelve ID); `research.md`, R-04; `plan.md`, decisiones 1 y 4 |
| H-18 | El diseño de unicidad no define estrategia de inserción idempotente ni manejo de colisiones/referencias por tipo | Alta | G-05 | Abierto: detalle de concurrencia pendiente | Las restricciones UNIQUE son una base necesaria; definir insert-atómico/duplicate-key handling, invariantes de campos por categoría y pruebas con generadores simultáneos. No se observó una carrera ejecutada | `data-model.md`, sección 2; `research.md`, R-02 |
| H-19 | El bloqueo propuesto no coordina de forma explícita generador y renovación; la renovación actual lee la membresía antes de abrir su transacción | Alta | G-05 | Abierto: protocolo transaccional pendiente | Acordar lock/orden compartido, incluir actualización de notificaciones dentro de la conexión de renovación y resolver cambios de periodo concurrentes antes de crear tareas | `backend/src/services/membresia.service.js`, renovarMembresia; `backend/src/models/membresia.model.js`; `research.md`, R-03 |
| H-20 | El contrato no define de forma completa campos temporales y totales para reportes por periodo | Alta | G-05 | Abierto: filtros/semántica pendientes | Para cada reporte, definir campo fecha, periodo inclusivo, filtros y significado de totales por estado. «Pagado» reduce adeudo; no define por sí solo todos los totales de reporte. No inventar filtros | `spec.md`, FR-015/FR-016/FR-020/FR-021; `contracts/api.md`; `pago.model.js`, `acceso.model.js` |
| H-21 | La biblioteca DOCX está evaluada solo a nivel de metadata; falta contrato de descarga y evaluación de uso | Media | G-05 | Abierto: selección/contrato pendientes | Verificar API/licencia/runtime antes de adoptarla y definir MIME, nombre de archivo, disposición binaria, límites y equivalencia entre consulta y exportación; no instalar aún | `research.md`, R-07; `contracts/api.md`, reportes DOCX; manifests actuales |
| H-22 | La atención no define competencia entre dos atenciones simultáneas ni registro durable del fallo de auditoría | Alta | G-05 | Abierto: atomicidad y trazabilidad pendientes | Hacer transición solo desde pendiente bajo lock/actualización condicional; la auditoría debe usar la misma conexión y fallar estrictamente. Definir respuesta al segundo intento y el canal seguro de error | `research.md`, R-08; `backend/src/services/auditoria.service.js`; `backend/src/models/auditoria.model.js` |

## 8. Línea base de regresión

Se ejecuta la suite completa **antes** de tocar el código y de nuevo **al cierre**. Ninguna prueba de los sprints anteriores debe pasar de verde a rojo.

En esta etapa se hizo una inspección estática de archivos fuente; no se ejecutaron pruebas ni se estableció una línea base. No se consultaron bases de datos. Las suites y evidencias siguientes permanecen pendientes.

| Suite | Comando | Antes del sprint | Después del sprint | Diferencia | Evidencia |
|---|---|---|---|---|---|-
| Backend | Pendiente de planear | Pendiente; no ejecutado | Pendiente; no ejecutado | Pendiente | Evidencia pendiente |
| Frontend | Pendiente de planear | Pendiente; no ejecutado | Pendiente; no ejecutado | Pendiente | Evidencia pendiente |

**Fecha de la línea base:** Pendiente de registrar; commit y rama de línea base no verificados.

**Capturas de la línea base (fecha pendiente):**

Captura pendiente: `docs/evidencias/sprint-4/captura-linea-base-backend.png`.

Captura pendiente: `docs/evidencias/sprint-4/captura-linea-base-frontend.png`.

**Capturas del cierre (fecha pendiente):**

Captura pendiente: `docs/evidencias/sprint-4/captura-regresion-backend.png`.

Captura pendiente: `docs/evidencias/sprint-4/captura-regresion-frontend.png`.

**Duración del backend:** Pendiente de medir.

**Fecha del cierre:** Pendiente; sprint no cerrado. Actualizaciones de pruebas y análisis estático: pendientes.

## 9. Control de calidad final

Cinco requisitos funcionales del sprint, elegidos entre los que más pueden fallar, con el mismo formato de la matriz de calidad del MVP. Selección y resultados pendientes.

| ID | Requisito | Criterio de Aceptación | Prueba ejecutada | Resultado | Evidencia / defecto |
|:--:|---|---|---|---|---|-
| Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Evidencia pendiente |
| Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Evidencia pendiente |
| Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Evidencia pendiente |
| Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Evidencia pendiente |
| Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Evidencia pendiente |

## 10. Cierre

| Campo | Valor |
|---|---|-
| Criterios de salida cumplidos | Pendiente de evaluación; Sprint 4 en proceso |
| Defectos abiertos | H-07 a H-09, H-11 a H-22 abiertos; H-04, H-05, H-10 resueltos con observación; ver sección 7 |
| Observaciones | G-05 permanece pendiente/no aprobada por H-16 a H-22. La revisión fue documental y estática; persistencia física no confirmada. No hubo código, pruebas, migraciones, instalaciones ni operaciones de base de datos. Los cambios locales ajenos se conservaron. |
| Aprobado por | Pendiente; no hay aprobación registrada |
| Fecha | Pendiente; sprint no cerrado |

# Anexo de evidencias

Cada evidencia tiene tres bloques: **Requisito** (texto de la especificación con archivo y línea), **Prueba** (código o descripción) y **Resultado** (comando, salida real y captura). Las capturas están en `docs/evidencias/sprint-4/`.

## E-01 Requisito

Archivo: `specs/004-sprint-4-notificaciones-reportes/spec.md`, líneas pendientes de fijar al cerrar la especificación.

> Pendiente de seleccionar y citar un requisito funcional.

## E-01 Prueba

Archivo: Pendiente; todavía no hay prueba seleccionada.

Descripción y resultado esperado: pendientes de planear.

Fragmento clave:

```js
// Fragmento pendiente: no hay una prueba seleccionada.
```

## E-01 Resultado

Comando: Pendiente; no se ejecutaron pruebas.

Resultado: Pendiente; no se ejecutaron pruebas ni recorridos manuales o por API.

<!-- Evidencia pendiente; no existe captura registrada. -->

Resultado: **Pendiente** (sin casos ejecutados).

(Guía: repite los tres bloques E-02 a E-05, uno por cada requisito RF-02 a RF-05.)

## E-06 Recorrido de los escenarios contra la API real

Fecha y condiciones de ejecución: Pendientes; no se arrancó la API ni se usaron bases de datos o cuentas.

| # | Escenario | Resultado |
|---|-----------|-----------|
| Pendiente | Pendiente de definir | Pendiente; recorrido no ejecutado |

Resultado: **Pendiente** (sin escenarios ejecutados).

Alcance: pendiente de definir y verificar en una etapa posterior; no se hicieron comprobaciones manuales ni se generaron capturas.
