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
| G-01 | Insumo del sprint revisado contra el código | Pendiente de validación completa | `docs/sprint-4.md` revisado; el contraste integral con código y contratos existentes no se ha realizado en esta etapa. `docs/sprint-3.md` también se titula como insumo de Sprint 4; duplicidad por aclarar. |
| G-02 | Especificación (`/speckit.specify`) | Pendiente de revisión | `specs/004-sprint-4-notificaciones-reportes/spec.md` creada en esta etapa a partir del insumo y referencias. No se ejecutaron otras etapas Spec Kit ni una revisión formal de requisitos. |
| G-03 | Aclaraciones (`/speckit.clarify`) | Aprobada con observaciones | Preguntas funcionales de las siete historias respondidas expresamente por el usuario y registradas como D-01 a D-10 en `specs/004-sprint-4-notificaciones-reportes/spec.md`, sección «Aclaraciones resueltas». La zona IANA y la hora diaria deberán configurarse antes de implementar; la revisión de código y dashboard sigue pendiente en G-01/planificación. No quedan preguntas funcionales críticas abiertas en esta etapa. |
| G-04 | Lista de calidad de requisitos (`/speckit.checklist`) | Aprobada con observaciones | `specs/004-sprint-4-notificaciones-reportes/checklists/requirements.md`: 20/20 criterios documentales cumplen. La comparación efectiva con el dashboard no se ha realizado y sigue como condición previa a implementación (H-04/G-01). No se ejecutaron pruebas. |
| G-05 | Plan (`/speckit.plan`) | Pendiente | `plan.md`, `data-model.md` y `contracts/` no se crean en esta etapa. |
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

## 5. Riesgos y mitigaciones

| ID | Riesgo | Impacto | Mitigación | Prueba que lo cubre | Estado |
|:--:|---|---|---|---|---|-
| R-01 | Duplicar indicadores o reportes cubiertos por el dashboard de Sprint 3 | Alto: resultados redundantes o alcance contradictorio | Aplicar D-09: S4 entrega consultas detalladas complementarias; verificar indicadores ya implementados antes de diseñar | `spec.md`, D-09; revisión del dashboard pendiente | Abierto |
| R-02 | Generar avisos incorrectos por zona horaria, frecuencia, renovación o repetición | Alto: seguimiento erróneo de membresías | Aplicar D-01–D-06; configurar zona IANA/hora, mantener claves idempotentes y probar límites y renovaciones | `spec.md`, D-01–D-06; pruebas pendientes | Abierto |
| R-03 | Exponer notificaciones o reportes a roles no autorizados | Alto: acceso indebido a información administrativa/financiera | Aplicar D-07/D-08: permisos de recepcionista denegados para esos módulos; validar autorización en backend | `spec.md`, D-07/D-08; verificación de código y pruebas pendientes | Abierto |
| R-04 | Diferencias entre totales reportados y pagos/adeudos existentes | Alto: reportes financieros incorrectos | Aplicar D-10 y contrastar los cálculos con las reglas y campos del módulo existente; no presentar pagos como utilidad neta | `spec.md`, D-10; revisión técnica pendiente | Abierto |
| R-05 | Divergencia entre dos documentos titulados como insumo del Sprint 4 | Medio: requisitos o decisiones inconsistentes | Comparar documentos y establecer cuál es la fuente vigente, sin sobrescribirlos | `docs/sprint-3.md`; `docs/sprint-4.md` | Abierto |

## 6. Trazabilidad

Cada criterio de aceptación (CA) se enlaza con su requisito, su tarea, su prueba y el resultado verificado.

| CA | Criterio de aceptación (resumen) | Requisito (FR) | Tarea | Prueba | Resultado | Evidencia |
|:--:|---|---|---|---|---|---|-
| Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente de crear y verificar |

## 7. Hallazgos y defectos

Se registra todo lo que se encuentre, sea en los documentos, en el análisis o en las pruebas.

| ID | Descripción | Severidad (crítica, alta, media, baja) | Origen (puerta o prueba) | Estado | Resolución | Evidencia |
|:--:|---|---|---|---|---|---|-
| H-01 | Zona horaria y frecuencia de revisión no estaban concretadas en el spec inicial | Media | G-03 | Resuelto con observación | Revisión diaria en zona local IANA explícita y hora configurable; configurar valores antes de implementar | `specs/004-sprint-4-notificaciones-reportes/spec.md`, D-01/D-02 |
| H-02 | No estaba definida la transición de notificaciones tras renovación ni su clave de duplicidad | Media | G-03 | Resuelto | No aplicable para aviso pendiente; unicidad por evento de membresía o registro de acceso; sin recreación tras atención | `specs/004-sprint-4-notificaciones-reportes/spec.md`, D-03/D-04/D-05 |
| H-03 | Permisos de recepcionista para alertas de acceso y reportes operativos eran ambiguos | Media | G-03 | Resuelto | Ambos permisos denegados; operaciones reservadas al administrador | `specs/004-sprint-4-notificaciones-reportes/spec.md`, D-07/D-08 |
| H-04 | Riesgo de solapar reportes S4 con agregados del dashboard S3 | Media | G-03 | Abierto: falta verificar código | Se delimitó S4 como reportes detallados complementarios; inventario del dashboard pendiente | `specs/004-sprint-4-notificaciones-reportes/spec.md`, D-09; G-01 pendiente |
| H-05 | Campos/estados concretos para conciliación financiera requieren comprobar el módulo existente | Media | G-03 | Abierto: falta validar implementación | Usar criterio vigente del módulo, sin inventar estados; confirmar en revisión técnica | `specs/004-sprint-4-notificaciones-reportes/spec.md`, D-10; G-01 pendiente |
| H-06 | Algunos criterios de aceptación no hacían observables las decisiones D-03, D-04, D-05 y D-09 | Media | G-04 | Resuelto | Se agregaron escenarios explícitos para estado «No aplicable», deduplicación posterior a atención y complementariedad de reportes; checklist documental 20/20 | `specs/004-sprint-4-notificaciones-reportes/spec.md`, US-S4-01 escenarios 3 y 6, US-S4-03 escenario 5, US-S4-06 escenario 7; `checklists/requirements.md`, C07–C09 y C13 |

## 8. Línea base de regresión

Se ejecuta la suite completa **antes** de tocar el código y de nuevo **al cierre**. Ninguna prueba de los sprints anteriores debe pasar de verde a rojo.

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
| Criterios de salida cumplidos | Pendiente de evaluación |
| Defectos abiertos | Pendiente de análisis |
| Observaciones | Pendiente de validación final |
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
