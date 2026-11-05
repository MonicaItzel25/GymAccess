# Tareas de implementación: Notificaciones, reportes y seguimiento administrativo (Sprint 4)

**Especificación**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)
**Estado**: borrador de planificación; ninguna tarea se marca como completada. La generación fue manual porque `/speckit.tasks` no está disponible en esta sesión.

## Convenciones y restricciones

- `[P]` identifica tareas paralelizables una vez satisfechas sus dependencias. `[US1]`–`[US7]` identifican la historia correspondiente.
- Los nombres de archivo bajo directorios genéricos son puntos de integración candidatos documentados en `plan.md`; antes de crear archivos, revisar la estructura vigente y los cambios locales. No asumir que endpoints o componentes S4 ya existen.
- La migración `008_crear_notificaciones_sprint4.sql` es una propuesta: confirmar numeración/nombre antes de crearla. No editar migraciones anteriores.
- Mantener Node.js 24.x (`>=24 <25`). La zona IANA y hora diaria, la dependencia del scheduler, la versión DOCX y los límites de exportación requieren autorización; no inferir valores.
- Ejecutar futuras pruebas con datos solo después de verificar `.env.test` y `DB_NAME=gym_db_pruebas`. Nunca operar `gym_db`.
- H-21 y H-22 siguen abiertos hasta que se obtenga y revise la evidencia indicada en sus tareas. Estas tareas no acreditan implementación ni ejecución.

## Trazabilidad entre requisitos y tareas

La matriz vincula los requisitos funcionales con las tareas de diseño, implementación y validación futuras. Las tareas de prueba quedan pendientes y no son evidencia de ejecución.

| Requisitos | Tareas relacionadas |
|---|---|
| FR-001–FR-006 | T009, T013–T022, T028, T031–T033, T057–T058 |
| FR-007–FR-009 | T009, T023–T027, T057–T058 |
| FR-010–FR-014 | T009–T011, T028–T036, T057–T058 |
| FR-015–FR-016 | T012, T037–T042, T051–T056 |
| FR-017–FR-019 | T004, T043–T048, T051–T056 |
| FR-020–FR-021 | T012, T037–T048, T054–T056 |
| FR-022–FR-023 | T002, T049–T056 |
| FR-024–FR-025 | T028–T030, T036, T038, T042, T044, T048, T052, T056, T060 |
| FR-026–FR-027 | T028–T029, T037–T048, T051–T060 |
| FR-028 | T010, T029, T034–T035, T061 |
| FR-029 | T003, T005, T058–T060 |
| FR-030 | T013–T019, T025, T057–T058 |
| SC-001–SC-004 | T016–T017, T021–T022, T026–T027, T032–T035 |
| SC-005–SC-006 | T030, T036, T042, T048, T052, T058, T060 |
| SC-007–SC-008, SC-013 | T040–T048, T054–T056 |
| SC-009 | T049–T056 |
| SC-010 | T041, T047, T058, T060 |
| SC-011 | T058–T060 |
| SC-012 | T015, T017, T019, T025, T027, T057–T058 |

Las tareas T001–T005 son decisiones, inspección y gates previos; T006–T012 establecen cimientos compartidos; T057–T063 corresponden a integración, regresión y cierre. Sus dependencias se indican en cada tarea y no sustituyen la aprobación de G-01/G-05/G-06.

## Fase 0: Aprobaciones y preparación

- [ ] T001 Solicitar autorización para la zona IANA del gimnasio, la hora de ejecución diaria y la dependencia/mecanismo del scheduler; no fijar configuración hasta recibir respuesta. Referencias: `spec.md` D-01/D-02, `plan.md` y `research.md` R-01.
- [ ] T002 Solicitar decisiones sobre la dependencia y versión DOCX y sobre límites de filas/bytes; conservar H-21 abierto hasta autorización y validación efectiva. Referencias: `plan.md`, decisión 7; `research.md` R-07; `contracts/api.md`, exportación.
- [ ] T003 [P] Inspeccionar el estado vigente de `backend/src/`, `frontend/src/`, `backend/tests/`, pruebas frontend, `database/migrations/`, manifests y lockfiles; mapear puntos de integración y preservar los cambios locales antes de editar.
- [ ] T004 [P] Reconfirmar la matriz de indicadores de `frontend/src/pages/Inicio.jsx` frente a los reportes detallados, y documentar cualquier solapamiento antes de implementar US-S4-06. Referencias: `research.md` R-06, FR-017/FR-019.
- [ ] T005 Revisar y aprobar este plan de tareas y sus gates; acordar que las pruebas con datos se limiten a `gym_db_pruebas` y preservar la guarda del entorno de pruebas. Dependencias: T001–T004.

## Fase 1: Base compartida, persistencia y seguridad

- [ ] T006 Definir la configuración validada de scheduler a partir de las autorizaciones recibidas, incluyendo zona IANA y hora, sin codificar valores no aprobados. Componentes: configuración del backend y `backend/src/server.js`. Dependencias: T001, T005.
- [ ] T007 Diseñar y revisar la migración S4 de `notificaciones`: tipos/estados, referencias exclusivas, claves únicas de membresía y acceso, claves foráneas y `ENGINE=InnoDB`; volver a comprobar la siguiente numeración y usar `008_crear_notificaciones_sprint4.sql` solo si sigue correspondiendo. No ejecutar la migración. Referencia: `data-model.md`, secciones 2 y 5. Dependencias: T003, T005.
- [ ] T008 Crear la migración S4 aprobada en `database/migrations/` sin modificar migraciones existentes. Mantenerla sin aplicar hasta la etapa autorizada. Dependencias: T007.
- [ ] T009 Crear el modelo/repositorio de notificaciones bajo `backend/src/models/` con consultas parametrizadas, validación de tipo/referencias, transición condicional e idempotencia mediante las restricciones persistentes. Dependencias: T008.
- [ ] T010 Crear un escritor estricto de auditoría que reciba y use la conexión transaccional; no reutilizar para esta operación el servicio que absorbe errores ni el modelo que usa el pool global. Componentes: `backend/src/models/` y `backend/src/services/` según la estructura revisada. Dependencias: T003, T008.
- [ ] T011 [P] Preparar fixtures y utilidades de pruebas unitarias/integración usando los patrones existentes de `backend/tests/` y las carpetas de pruebas frontend ya existentes; no inventar rutas de archivos antes de inspeccionarlas. Preservar y comprobar la guarda de base de datos de pruebas; no ejecutar pruebas en esta fase. Dependencias: T003, T005.
- [ ] T012 [P] Preparar validadores compartidos de filtros y fechas en `backend/src/validators/` para formatos, rangos invertidos, valores permitidos y consultas parametrizadas, usando la zona autorizada al interpretar `DATETIME`. Dependencias: T001, T003, T005.

## Fase 2: US-S4-01 — Notificaciones de membresías próximas a vencer

- [ ] T013 [US1] Implementar en `backend/src/services/` el cálculo de vencimientos a tres días naturales según la zona IANA autorizada y el periodo vigente de la membresía. Dependencias: T006, T009.
- [ ] T014 [US1] Implementar la generación persistente e idempotente del aviso próximo, usando tipo + membresía + fecha de vencimiento; tratar solo colisión de clave duplicada como resultado ya satisfecho y propagar otros errores. Dependencias: T013.
- [ ] T015 [US1] Implementar recuperación tardía de avisos próximos omitidos conforme a D-11 opción B: generar solo mientras la membresía no haya vencido, excluir periodos sustituidos y avisos ya existentes/atendidos, y revalidar bajo el bloqueo compartido con renovación. El caso ya vencido lo resuelve US2. Dependencias: T014.
- [ ] T016 [US1] Añadir pruebas unitarias del cálculo temporal, elegibilidad, idempotencia y tratamiento de errores para el generador de avisos próximos. Componentes: pruebas unitarias en la estructura existente de `backend/tests/`. Dependencias: T011, T013, T014.
- [ ] T017 [US1] Añadir pruebas de integración de creación única, recuperación tardía antes del vencimiento, renovación que sustituye el periodo, notificación existente/atendida y concurrencia de inserciones; usar únicamente entorno autorizado de pruebas. Dependencias: T008, T015, T016.

## Fase 3: US-S4-02 — Notificaciones de membresías vencidas

- [ ] T018 [US2] Implementar en `backend/src/services/` la evaluación de membresía vencida y no sustituida por una renovación vigente, rereleyendo el periodo bajo el mismo lock transaccional usado por renovación y US1. Dependencias: T009, T013.
- [ ] T019 [US2] Generar idempotentemente el aviso de membresía vencida y hacer que la reconciliación tardía genere solo este aviso cuando la membresía ya venció; no emitir además un aviso tardío de próximo vencimiento. Dependencias: T018.
- [ ] T020 [US2] Integrar la actualización de avisos pendientes del periodo anterior a `no_aplicable` dentro de la transacción de renovación, conservando notificaciones atendidas. Revisar el flujo de membresía existente antes de modificarlo. Dependencias: T008, T018.
- [ ] T021 [US2] Añadir pruebas unitarias de elegibilidad, renovación vigente, transición a `no_aplicable` y elección exclusiva del tipo de aviso tardío. Dependencias: T011, T018–T020.
- [ ] T022 [US2] Añadir pruebas de integración para ambos órdenes de carrera generación/renovación y para fallos que deban revertir conjuntamente las escrituras de renovación y notificaciones. Dependencias: T020, T021.

## Fase 4: US-S4-03 — Alertas de accesos rechazados

- [ ] T023 [US3] Integrar la captura del identificador persistido que devuelve el modelo de acceso y solicitar una alerta solo después de persistir un rechazo; conservar intacto el resultado y registro fuente. Componentes existentes a revisar: `backend/src/models/acceso.model.js` y el servicio de acceso.
- [ ] T024 [US3] Implementar alerta relacionada por `id_acceso` con idempotencia persistente; conservar cliente nulo y datos originales disponibles, y no crear alertas para accesos autorizados. Dependencias: T009, T023.
- [ ] T025 [US3] Implementar el reconciliador idempotente que identifica accesos rechazados sin alerta y reintenta su creación ante interrupciones; su conexión al inicio y a cada ciclo se integra en T057. Dependencias: T024.
- [ ] T026 [P] [US3] Añadir pruebas unitarias de rechazo/autorización, cliente nulo, relación por acceso y propagación de errores de creación de alerta. Dependencias: T011, T023, T024.
- [ ] T027 [US3] Añadir pruebas de integración de interrupción entre persistencia de acceso y alerta, recuperación posterior sin duplicados, repetición de reconciliación y no alteración del registro de acceso. Dependencias: T025, T026.

## Fase 5: US-S4-04 — Consulta, filtros y atención de notificaciones

- [ ] T028 [US4] Implementar las operaciones propuestas `GET /api/notificaciones?tipo=&estado=` y `PATCH /api/notificaciones/:id/atencion` en los componentes de rutas/controladores de `backend/src/`; comprobar la estructura de routers antes de crearlos. Aplicar filtros sin ampliar visibilidad. Dependencias: T009, T012.
- [ ] T029 [US4] Implementar la atención como transacción única: bloquear fila, validar `pendiente`, actualizar condicionalmente estado/actor/fecha, insertar auditoría estricta por la misma conexión y responder éxito solo tras `COMMIT`; rollback y error genérico ante fallo. Dependencias: T008–T010, T028.
- [ ] T030 [US4] Aplicar autorización backend por rol y tipo en consulta y atención: administrador completo dentro del alcance; recepcionista solo notificaciones de membresía; entrenador/cliente denegados; recepcionista denegada para alertas de acceso. No depender de la UI. Dependencias: T028.
- [ ] T031 [US4] Implementar la pantalla/componentes de notificaciones bajo `frontend/src/pages/` y `frontend/src/components/`, y las llamadas en `frontend/src/services/api.js`; mostrar filtros, historial, estado y datos de atención conforme a permisos. No asumir nombres de archivos/páginas inexistentes. Dependencias: T028–T030.
- [ ] T032 [P] [US4] Añadir pruebas unitarias de validación de filtros, transiciones, autorización por tipo y respuesta de conflicto para estado no pendiente. Dependencias: T011, T028–T030.
- [ ] T033 [US4] Añadir pruebas de integración de consulta, filtros, historial, actor/fecha, 404 y 409; verificar que peticiones inválidas o no autorizadas no muten datos ni creen auditorías exitosas. Dependencias: T030, T032.
- [ ] T034 [US4] Añadir prueba de concurrencia H-22 con dos atenciones simultáneas: exactamente una transición/auditoría exitosa y la otra respuesta de conflicto, sin doble auditoría. Dependencias: T029, T033.
- [ ] T035 [US4] Añadir pruebas de fallo H-22 para INSERT de auditoría, actualización y commit: rollback cuando sea posible, estado pendiente sin éxito confirmado, error público genérico y logs sin SQL/mensaje crudo. Revisar que ambas tablas usen InnoDB en la migración y que el éxito observe ambas escrituras. Dependencias: T008, T010, T029, T033.
- [ ] T036 [US4] Añadir pruebas de seguridad de acceso directo a rutas por todos los roles, incluyendo denegaciones de la recepcionista para alertas de acceso, y pruebas de regresión de la auditoría existente sin cambiar su comportamiento global. Dependencias: T030, T033.

## Fase 6: US-S4-05 — Reportes financieros

- [ ] T037 [US5] Implementar consultas parametrizadas de pagos por `fecha_pago` y filtros permitidos, con importes separados por `pagado`, `pendiente` y `cancelado`, sin total combinado. Implementar adeudos solo como fotografía actual por membresía usando la regla existente, sin periodo histórico ni suma global. Componentes: `backend/src/models/` y `backend/src/services/`. Dependencias: T012.
- [ ] T038 [US5] Implementar las rutas/controladores financieros propuestos en `contracts/api.md` para pagos y adeudos, con validación, mensajes de error y autorización exclusiva de administrador. Dependencias: T037.
- [ ] T039 [US5] Implementar las vistas/componentes financieros en `frontend/src/pages/` y llamadas en `frontend/src/services/api.js`, incluyendo periodo/filtros para pagos, estado vacío y reporte separado de adeudos actuales. Dependencias: T038.
- [ ] T040 [P] [US5] Añadir pruebas unitarias de límites de fecha, filtros, sumas separadas por estado, datos vacíos y regla de adeudo vigente, sin introducir fórmulas o estados nuevos. Dependencias: T011, T012, T037.
- [ ] T041 [US5] Añadir pruebas de integración comparando filas/importes con las fuentes autorizadas, verificando rangos inclusivos, ausencia de total combinado/histórico y no modificación de pagos o membresías. Dependencias: T038, T040.
- [ ] T042 [US5] Añadir pruebas de autorización para recepcionista, entrenador y cliente en las rutas financieras y de descarga directa; comprobar denegación backend y ausencia de exposición de datos. Dependencias: T038.

## Fase 7: US-S4-06 — Reportes operativos

- [ ] T043 [US6] Implementar consultas parametrizadas de clientes por `fecha_registro`, membresías por cohorte `fecha_inicio` y accesos por fecha/cliente/resultado; mostrar estados actuales y preservar accesos con cliente nulo. Componentes: `backend/src/models/` y `backend/src/services/`. Dependencias: T004, T012.
- [ ] T044 [US6] Implementar las rutas/controladores operativos propuestos para clientes, membresías y accesos, con filtros, resultados vacíos y autorización exclusiva de administrador. Dependencias: T043.
- [ ] T045 [US6] Implementar vistas/componentes operativos en `frontend/src/pages/` y llamadas en `frontend/src/services/api.js`, con filtros, conteos/desgloses y estados vacíos. Dependencias: T044.
- [ ] T046 [P] [US6] Añadir pruebas unitarias de rangos inclusivos, `DATE`/`DATETIME`, cohortes, filtros combinados, estados actuales, resultados vacíos y cliente nulo en accesos. Dependencias: T011, T012, T043.
- [ ] T047 [US6] Añadir pruebas de integración de conteos y filas frente a las fuentes; comparar y documentar complementariedad con `Inicio.jsx` antes de cerrar el reporte, sin duplicar indicadores agregados. Dependencias: T004, T044, T046.
- [ ] T048 [US6] Añadir pruebas de seguridad para denegar a recepcionista, entrenador y cliente en todas las consultas operativas, sin depender de controles de interfaz. Dependencias: T044.

## Fase 8: US-S4-07 — Filtros y exportación Word DOCX

- [ ] T049 [US7] Confirmar la autorización de versión DOCX y de límites de exportación; documentar el resultado. Si no hay autorización, mantener la selección bloqueada y H-21 abierto. Dependencias: T002.
- [ ] T050 [US7] Validar la compatibilidad de la versión autorizada con Node.js 24.x y revisar manifest/lockfile y árbol de dependencias; no instalar nada antes de autorización. Registrar evidencia y mantener H-21 abierto hasta generar y abrir un DOCX real. Dependencias: T049.
- [ ] T051 [US7] Implementar la generación backend de DOCX reutilizando la misma consulta normalizada que alimenta la vista; construir el Buffer antes de headers y aplicar solo límites autorizados, sin truncamiento. Componentes: `backend/src/services/` y capa de exportación identificada en la estructura vigente. Dependencias: T037–T038, T043–T044, T050.
- [ ] T052 [US7] Implementar las rutas de descarga propuestas en `contracts/api.md` con MIME DOCX, nombre ASCII sin PII, `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, autorización de administrador y manejo seguro de errores antes/después de iniciar respuesta. Dependencias: T051.
- [ ] T053 [US7] Integrar controles de exportación/descarga con los filtros de las vistas financieras y operativas usando `frontend/src/services/api.js`; no permitir alterar el conjunto de datos entre consulta y exportación. Dependencias: T039, T045, T052.
- [ ] T054 [P] [US7] Añadir pruebas unitarias del contenido del documento, filtros normalizados, estado vacío, nombre seguro y límites finalmente aprobados. Dependencias: T011, T050–T052.
- [ ] T055 [US7] Añadir pruebas de integración que generen y abran DOCX, comparen filas, filtros y totales con la consulta, validen MIME/headers y cubran errores previos y posteriores a enviar headers. Evidencia requerida para H-21. Dependencias: T052, T054.
- [ ] T056 [US7] Medir memoria/latencia y probar límites aprobados y respuestas 413 sin truncamiento; revisar contenido sin PII innecesaria, exposición de errores, acceso directo por rol y compatibilidad con Node 24.x. Mantener H-21 abierto hasta revisión de evidencia y cierre autorizado. Dependencias: T050, T052, T055.

## Fase 9: Integración, regresión y cierre

- [ ] T057 Integrar los routers S4 en `backend/src/app.js`, la inicialización de reconciliación/scheduler en `backend/src/server.js` y las rutas de UI en `frontend/src/App.jsx`/`frontend/src/components/Layout.jsx`, solo según los puntos de integración confirmados. Mantener middleware de autenticación/autorización y no iniciar scheduler al construir `crearApp()`. Dependencias: T015, T019, T025, T028–T030, T038, T044, T052.
- [ ] T058 Añadir pruebas de integración de extremo a extremo para los flujos de las siete historias, inicio/reconciliación/ciclo diario, filtros, atención, permisos y descargas; configurar y comprobar el entorno autorizado antes de ejecutar cualquier prueba con datos. Dependencias: T017, T022, T027, T033–T036, T041–T042, T047–T048, T055–T057.
- [ ] T059 Ejecutar y documentar la suite de regresión aprobada para backend/frontend y módulos de sprints anteriores, incluyendo renovación, accesos, pagos, membresías, auditoría, dashboard y permisos; investigar fallos sin revertir cambios locales ajenos. Dependencias: T058.
- [ ] T060 Realizar revisión de seguridad integrada: rutas y exportaciones con acceso directo, validación/consultas parametrizadas, autorización por rol, minimización de datos, logs sanitizados, cabeceras de descarga y ausencia de cambios en fuentes. Dependencias: T036, T042, T048, T056, T058.
- [ ] T061 Revisar evidencia H-22: migración `notificaciones` y tabla `auditoria` transaccionales, escritor estricto con conexión compartida, concurrencia, rollback ante fallos y éxito solo tras commit; registrar límites de durabilidad de logs. No cerrar H-22 sin evidencia revisada. Dependencias: T008, T029, T034–T035, T058.
- [ ] T062 Actualizar los artefactos de planificación de esta carpeta (`plan.md`, `research.md`, `data-model.md`, `contracts/api.md`, `quickstart.md` y checklist) con decisiones autorizadas, resultados y evidencia; no registrar pruebas no ejecutadas ni cambiar documentos fuera del alcance autorizado. Dependencias: T059–T061.
- [ ] T063 Completar revisión de cierre: confirmar las siete historias, criterios de éxito, permisos, regresión, estado de H-21/H-22, decisiones temporales y dependencias; presentar pendientes a revisión y no crear commits/push sin autorización. Dependencias: T062.

## Orden y gates

1. Completar Fase 0 y obtener las autorizaciones aplicables antes de fijar scheduler, zona/hora o dependencia DOCX.
2. Completar la base compartida de Fase 1 antes de las historias de notificaciones. Las tareas `[P]` solo se pueden paralelizar cuando sus dependencias están satisfechas.
3. Ejecutar las fases US1–US7 con las dependencias indicadas. La exportación US7 depende de las consultas y vistas de US5/US6.
4. La integración y validación de Fase 9 depende de completar las historias; las pruebas con datos requieren el entorno autorizado y no deben usar `gym_db`.
5. La creación de este backlog no aprueba G-05 ni cierra G-06: las tareas quedan sin marcar hasta que se aprueben y ejecuten en las etapas correspondientes.
