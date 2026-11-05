# Especificación de la función: Notificaciones, reportes y seguimiento administrativo (Sprint 4)

**Rama de la función**: `004-sprint-4-notificaciones-reportes`

**Estado**: Borrador para revisión

**Entrada**: Descripción aprobada del Sprint 4 en `docs/sprint-4.md` y decisiones confirmadas por el usuario en la solicitud de inicio formal.

**Documentos de referencia**: `docs/sprint-4.md`, `docs/project-context.md`, `docs/reglas.md`, `docs/aseguramiento-calidad-sprint-4.md` y las especificaciones de `specs/001-sprint1-base-auth/`, `specs/002-sprint-2-membresias-pagos-reconocimiento-acceso/` y `specs/003-sprint-3-entrenadores-rutinas-dashboard/`.

## Escenarios de usuario y pruebas

Las siete historias aprobadas delimitan el alcance funcional de este sprint. Los permisos de recepcionista resueltos en Clarify se aplican de forma explícita; cualquier capacidad fuera de esta matriz no se concede.

## Aclaraciones resueltas

Las siguientes decisiones fueron expresamente seleccionadas por el usuario durante `/speckit.clarify`. La zona IANA concreta y el valor horario son parámetros de configuración que deberán quedar definidos antes de implementar la revisión diaria; no se fija aquí un valor no proporcionado.

| ID | Pregunta | Resolución aprobada | Requisito afectado | Evidencia |
|---|---|---|---|---|
| D-01 | ¿Qué zona horaria determina los días naturales del vencimiento? | Usar la zona local del gimnasio obtenida de una configuración explícita con identificador IANA. El valor concreto debe establecerse antes de implementar; no se presupone ubicación. | FR-001, RN-001, RN-002 | Esta aclaración y su resolución quedan registradas en esta tabla. |
| D-02 | ¿Con qué frecuencia se revisan las membresías? | Ejecutar una revisión diaria, a una hora configurable en la zona local del gimnasio. | FR-001, FR-003, RN-002 | Esta aclaración y su resolución quedan registradas en esta tabla. |
| D-03 | ¿Qué ocurre con una notificación pendiente cuando una renovación sustituye su periodo? | Marcarla como «No aplicable» y conservarla en el historial. Una notificación ya atendida mantiene su estado de atención. | FR-005, FR-014, RN-003, RN-007 | Esta aclaración y su resolución quedan registradas en esta tabla. |
| D-04 | ¿Cómo se evita duplicar notificaciones de membresía, incluso después de atenderlas? | Como máximo una notificación por tipo + membresía + fecha de vencimiento; una revisión posterior no la recrea aunque ya esté atendida. | FR-004, FR-014, RN-004 | Esta aclaración y su resolución quedan registradas en esta tabla. |
| D-05 | ¿Cómo se evitan duplicados en alertas de acceso rechazado? | Como máximo una alerta por registro de acceso rechazado; no se recrea aunque ya haya sido atendida. | FR-007, FR-014 | Esta aclaración y su resolución quedan registradas en esta tabla. |
| D-06 | ¿Cómo se conservan las notificaciones atendidas? | No aplicar purga automática; se conservan en el historial. No se fija todavía un plazo de retención ni se define una operación de eliminación. | FR-014, RN-007 | Esta aclaración y su resolución quedan registradas en esta tabla. |
| D-07 | ¿Puede la recepcionista consultar o atender alertas de accesos rechazados? | No. La consulta y atención de estas alertas queda reservada al administrador. | FR-024, FR-025, RN-011 | Esta aclaración y su resolución quedan registradas en esta tabla. |
| D-08 | ¿Puede la recepcionista consultar o exportar reportes operativos globales? | No. La consulta y exportación de reportes operativos globales queda reservada al administrador. | FR-017, FR-024, FR-025, RN-010, RN-011 | Esta aclaración y su resolución quedan registradas en esta tabla. |
| D-09 | ¿Cómo se diferencia el reporte operativo de Sprint 4 del dashboard de Sprint 3? | Los reportes de Sprint 4 serán consultas detalladas, filtrables y exportables que complementen los indicadores agregados del dashboard; no duplicarán esos agregados. Antes de implementación se verificará el dashboard existente. | FR-017, FR-019, RN-014 | Esta aclaración y su resolución quedan registradas en esta tabla. |
| D-10 | ¿Qué registros de pago se incluyen y cómo se tratan los adeudos? | Usar los pagos que el módulo existente considera válidos y su regla vigente de adeudo; no inventar estados ni fórmulas. La correspondencia concreta se verificará contra el código y los datos disponibles antes de planificar la consulta. | FR-015, FR-016 | Esta aclaración y su resolución quedan registradas en esta tabla. |

### Historia de usuario 1 - Notificaciones de membresías próximas a vencer (US-S4-01) (Prioridad: P1)

Como administrador o recepcionista autorizado, quiero recibir una notificación interna tres días naturales antes del vencimiento de una membresía activa para dar seguimiento oportuno a su renovación.

**Prueba independiente**: preparar una membresía activa cuya fecha de vencimiento sea exactamente tres días naturales después de la fecha local de revisión y comprobar la notificación; repetir la revisión y verificar que no se genere otra notificación equivalente.

**Escenarios de aceptación**:

1. **Dado** que una membresía cumple las condiciones de vigencia y su fecha de vencimiento es exactamente tres días naturales después de la fecha local de revisión, **Cuando** el sistema realice la revisión diaria, **Entonces** se genera una notificación interna vinculada a la membresía y al cliente.
2. **Dado** que existe una notificación equivalente para la misma membresía y vencimiento, **Cuando** la revisión se repite, **Entonces** no se crea un duplicado.
3. **Dado** que una renovación sustituye el periodo de una membresía y existen notificaciones pendientes vinculadas al periodo anterior, **Cuando** el sistema actualiza la situación de la membresía, **Entonces** cambia esas notificaciones pendientes a «No aplicable» y las conserva en el historial; las notificaciones ya atendidas conservan su estado de atención.
4. **Dado** que una membresía no está activa o no cumple la condición de vigencia, **Cuando** se revisan los vencimientos próximos, **Entonces** no se genera una notificación de próximo vencimiento para ella.
5. **Dado** que existe una notificación de membresía, **Cuando** un administrador o recepcionista consulta las notificaciones de membresía, **Entonces** puede identificar al cliente, la membresía y su fecha de vencimiento.
6. **Dado** que existe una notificación de próximo vencimiento ya atendida, **Cuando** se ejecutan revisiones posteriores para la misma membresía, tipo de notificación y fecha de vencimiento, **Entonces** no se genera otra notificación y la existente conserva su estado atendido.

---

### Historia de usuario 2 - Notificaciones de membresías vencidas (US-S4-02) (Prioridad: P1)

Como administrador o recepcionista autorizado, quiero identificar las membresías vencidas mediante notificaciones internas para dar seguimiento a los clientes que necesitan renovar.

**Prueba independiente**: comprobar una membresía cuya fecha de vencimiento ya pasó, una renovación vigente que la sustituye y la repetición de la revisión.

**Escenarios de aceptación**:

1. **Dado** que una membresía superó su fecha de vencimiento y no existe una renovación vigente que la sustituya, **Cuando** se realiza la revisión, **Entonces** se genera una notificación de membresía vencida.
2. **Dado** que ya existe una notificación para la misma membresía y vencimiento, **Cuando** se repite la revisión, **Entonces** no se genera un duplicado.
3. **Dado** que el cliente renovó su membresía, **Cuando** se actualiza su situación, **Entonces** la renovación vigente se refleja y la notificación anterior no se presenta como pendiente de renovación si ya fue resuelta.
4. **Dado** que existen membresías vencidas, **Cuando** un usuario autorizado consulta las notificaciones de membresía, **Entonces** puede identificar al cliente y la fecha de vencimiento.

---

### Historia de usuario 3 - Alertas internas de intentos de acceso rechazados (US-S4-03) (Prioridad: P1)

Como administrador, quiero recibir alertas internas cuando se registren intentos de acceso rechazados para identificar situaciones que requieren revisión sin alterar el control de acceso existente.

**Prueba independiente**: registrar un acceso rechazado y uno autorizado; verificar que solo el primero origine una alerta vinculada al registro original.

**Escenarios de aceptación**:

1. **Dado** que el módulo de acceso registra un intento rechazado, **Cuando** guarda el resultado, **Entonces** se genera una alerta interna relacionada con el registro de acceso.
2. **Dado** que un intento de acceso fue autorizado, **Cuando** se registra, **Entonces** no se genera una alerta de rechazo.
3. **Dado** que un intento rechazado no identifica a un cliente, **Cuando** se crea la alerta, **Entonces** conserva los datos disponibles y no inventa la identidad del cliente.
4. **Dado** que existe una alerta, **Cuando** el administrador consulta su detalle y el historial de accesos, **Entonces** la alerta muestra los datos disponibles y el registro original permanece intacto.
5. **Dado** que existe una alerta atendida para un registro de acceso rechazado, **Cuando** se vuelve a procesar ese mismo registro, **Entonces** no se crea otra alerta y la alerta existente conserva su estado atendido.

---

### Historia de usuario 4 - Consulta, filtros y atención de notificaciones (US-S4-04) (Prioridad: P1)

Como administrador o recepcionista autorizado, quiero consultar, filtrar y atender las notificaciones que me corresponden para mantener un seguimiento trazable de las situaciones pendientes.

**Prueba independiente**: consultar notificaciones con diferentes tipos y estados, aplicar filtros, atender una notificación y verificar el actor y la fecha de atención.

**Escenarios de aceptación**:

1. **Dado** que un usuario tiene permiso para consultar un tipo de notificación, **Cuando** abre el módulo, **Entonces** solo ve las notificaciones autorizadas para su rol.
2. **Dado** que existen notificaciones de distintos tipos o estados, **Cuando** el usuario aplica los filtros disponibles, **Entonces** se muestran únicamente las notificaciones que cumplen los filtros.
3. **Dado** que existe una notificación pendiente y el usuario tiene permiso para atenderla, **Cuando** la marca como atendida, **Entonces** se actualiza su estado y se registra quién realizó la acción y cuándo.
4. **Dado** que una notificación fue atendida, **Cuando** se consulta posteriormente, **Entonces** permanece disponible en el historial conforme a los permisos del usuario.
5. **Dado** que un entrenador o cliente intenta acceder al módulo administrativo, **Cuando** solicita la consulta o una operación, **Entonces** el backend deniega el acceso.
6. **Dado** que una recepcionista intenta consultar o atender una alerta de acceso rechazado, **Cuando** solicita la operación, **Entonces** el sistema deniega el acceso; solo el administrador puede consultar y atender esas alertas.

---

### Historia de usuario 5 - Reportes financieros de pagos y adeudos (US-S4-05) (Prioridad: P1)

Como administrador, quiero consultar reportes financieros de pagos y adeudos por periodo para conocer los importes registrados en GymAccess.

**Prueba independiente**: generar un reporte para un periodo con pagos y adeudos conocidos, comparar los resultados con sus registros de origen y comprobar la denegación para la recepcionista.

**Escenarios de aceptación**:

1. **Dado** que existen pagos registrados, **Cuando** el administrador selecciona un periodo válido, **Entonces** el reporte incluye los registros que cumplen el periodo y filtros seleccionados.
2. **Dado** que un reporte contiene pagos válidos, **Cuando** calcula sus totales, **Entonces** los importes corresponden a los registros incluidos y a los estados que se hayan definido para el cálculo.
3. **Dado** que no hay información para el periodo seleccionado, **Cuando** se genera el reporte, **Entonces** se presenta un estado vacío comprensible sin error ni datos inventados.
4. **Dado** que una recepcionista solicita un reporte financiero global, **Cuando** el backend evalúa la solicitud, **Entonces** deniega el acceso.
5. **Dado** que el administrador solicita un reporte financiero, **Cuando** lo exporta, **Entonces** el documento Word contiene los resultados y totales del mismo reporte consultado.
6. **Dado** que los registros disponibles no incluyen gastos o costos, **Cuando** se informa el total de pagos, **Entonces** no se presenta como utilidad neta ni rentabilidad.

---

### Historia de usuario 6 - Reportes operativos (US-S4-06) (Prioridad: P1)

Como administrador, quiero consultar reportes operativos de clientes, membresías y accesos para revisar la actividad del gimnasio utilizando los registros existentes.

**Prueba independiente**: generar reportes de clientes, membresías y accesos y comparar resultados con los registros fuente; verificar los permisos por rol.

**Escenarios de aceptación**:

1. **Dado** que existen clientes, **Cuando** el administrador genera el reporte de clientes, **Entonces** se presentan los registros permitidos por el propósito del reporte.
2. **Dado** que existen membresías, **Cuando** el administrador genera un reporte de membresías, **Entonces** se muestran los periodos y estados coherentes con las reglas de vigencia.
3. **Dado** que existen registros de acceso, **Cuando** el administrador genera un reporte de accesos para un periodo, **Entonces** se muestran los resultados correspondientes a ese periodo.
4. **Dado** que no existen registros para los criterios seleccionados, **Cuando** se genera el reporte, **Entonces** se informa que no hay resultados.
5. **Dado** que el reporte operativo se exporta, **Cuando** el administrador solicita el documento, **Entonces** el `.docx` incluye los resultados presentados en la consulta.
6. **Dado** que una recepcionista, entrenador o cliente intenta consultar o exportar un reporte operativo global, **Cuando** solicita la operación, **Entonces** el backend deniega el acceso.
7. **Dado** que el dashboard de Sprint 3 ya presenta indicadores agregados sobre clientes, membresías o accesos, **Cuando** se define el reporte operativo de Sprint 4 tras comparar el dashboard existente antes de implementar, **Entonces** el reporte ofrece información detallada, filtrable y exportable que complementa esos agregados sin duplicar los mismos indicadores.

---

### Historia de usuario 7 - Filtros y exportación de reportes a Word (US-S4-07) (Prioridad: P1)

Como administrador, quiero filtrar los reportes y exportar sus resultados a Word para obtener documentos organizados y consistentes con la consulta realizada.

**Prueba independiente**: filtrar un reporte por periodo y criterios aplicables, exportarlo, abrir el `.docx` y comparar su contenido con el resultado de la pantalla.

**Escenarios de aceptación**:

1. **Dado** que el administrador ingresa fechas válidas, **Cuando** genera el reporte, **Entonces** solo se incluyen los registros dentro del periodo seleccionado.
2. **Dado** que la fecha inicial es posterior a la fecha final, **Cuando** solicita el reporte, **Entonces** la solicitud se rechaza con un mensaje de validación comprensible.
3. **Dado** que un reporte admite filtros adicionales, **Cuando** se aplican conjuntamente, **Entonces** los resultados cumplen todos los criterios seleccionados.
4. **Dado** que se generó un reporte correctamente, **Cuando** el administrador solicita la exportación, **Entonces** se descarga un documento válido con extensión `.docx`.
5. **Dado** que se abre un documento exportado, **Cuando** se compara con la consulta original, **Entonces** sus datos, filtros y totales coinciden.
6. **Dado** que una consulta no devuelve registros, **Cuando** se exporta, **Entonces** el documento indica que no hay resultados y no inventa registros.
7. **Dado** que un usuario no tiene permiso para un reporte, **Cuando** intenta consultarlo o exportarlo directamente, **Entonces** el backend deniega la operación.

---

### Casos límite

- Si la revisión de vencimientos se ejecuta más de una vez, no se duplican notificaciones equivalentes.
- La renovación anterior o posterior a una revisión no debe dejar una alerta de vencimiento próximo como pendiente si ya no corresponde al periodo vigente.
- La regla temporal usa tres días naturales según la zona IANA local del gimnasio configurada explícitamente; la configuración debe existir antes de implementar la revisión diaria.
- La revisión se ejecuta una vez al día a una hora configurable en la misma zona horaria.
- Un acceso rechazado sin cliente identificado puede generar una alerta con cliente nulo y los datos existentes del intento.
- Una falla al generar una alerta no debe cambiar el resultado ni modificar el registro original de acceso.
- Una notificación atendida conserva el usuario responsable y la fecha/hora; no se elimina del historial.
- Las solicitudes con fechas mal formadas o fecha inicial posterior a la final se rechazan.
- Los reportes sin datos muestran un estado vacío y pueden exportarse indicando ausencia de resultados.
- Los filtros no deben exponer información personal o financiera ajena al alcance y rol autorizados.
- Los reportes no calculan utilidad neta, gastos ni rentabilidad si esos conceptos no están registrados.
- Los documentos `.docx` deben reflejar los filtros y los mismos datos y totales de la consulta que los originó.
- La recepcionista no puede consultar ni atender alertas de accesos rechazados, ni consultar o exportar reportes operativos globales.
- Si ya existe un dashboard o reporte equivalente del Sprint 3, se reutiliza o complementa; no se duplica sin necesidad aprobada.

## Requisitos

### Requisitos funcionales

**Notificaciones de membresías próximas a vencer y vencidas (US-S4-01, US-S4-02)**

- **FR-001**: El sistema DEBE identificar membresías activas cuyo vencimiento corresponda exactamente a tres días naturales después de la fecha local de revisión, calculada con la zona IANA explícitamente configurada para el gimnasio.
- **FR-002**: El sistema DEBE generar notificaciones internas para membresías próximas a vencer.
- **FR-003**: El sistema DEBE identificar y notificar membresías vencidas cuando no exista una renovación vigente que las sustituya.
- **FR-004**: El sistema DEBE mantener como máximo una notificación por tipo, membresía y fecha de vencimiento; las revisiones repetidas NO DEBEN recrearla aunque ya haya sido atendida.
- **FR-005**: El sistema DEBE considerar el periodo de membresía vigente y el efecto de renovaciones al generar o presentar notificaciones.
- **FR-006**: Las notificaciones de membresía DEBEN relacionarse con la membresía y el cliente cuando esa relación esté disponible.

**Alertas de acceso rechazado (US-S4-03)**

- **FR-007**: El sistema DEBE generar como máximo una alerta interna por registro real de acceso rechazado; una revisión repetida NO DEBE recrearla aunque ya haya sido atendida.
- **FR-008**: Los accesos autorizados NO DEBEN generar alertas de rechazo.
- **FR-009**: La alerta DEBE conservar una referencia al registro original y utilizar solo los datos disponibles, sin alterar el historial de accesos ni inventar datos.

**Consulta y atención de notificaciones (US-S4-04)**

- **FR-010**: El sistema DEBE permitir consultar notificaciones según los permisos del usuario autenticado.
- **FR-011**: El sistema DEBE permitir filtrar notificaciones por tipo y estado; los filtros adicionales se precisarán durante aclaración y planificación.
- **FR-012**: El sistema DEBE permitir que los usuarios autorizados marquen una notificación como atendida.
- **FR-013**: Al atender una notificación, el sistema DEBE registrar el usuario responsable y la fecha/hora de atención.
- **FR-014**: Las notificaciones atendidas DEBEN conservarse para consulta histórica autorizada, sin purga automática. Las notificaciones pendientes que dejen de aplicar por una renovación DEBEN conservarse con estado «No aplicable».

**Reportes financieros y operativos (US-S4-05, US-S4-06)**

- **FR-015**: El sistema DEBE generar reportes financieros a partir de los pagos y adeudos registrados en los módulos existentes.
- **FR-016**: Los totales financieros DEBEN corresponder a los registros incluidos según periodo, filtros y estados definidos; el sistema NO DEBE describirlos como utilidad neta si no dispone de datos de gastos y costos.
- **FR-017**: El sistema DEBE generar reportes operativos detallados, filtrables y exportables sobre clientes, membresías y accesos, usando los datos existentes y complementando —sin duplicar los mismos indicadores agregados— el dashboard de Sprint 3. La comparación con el dashboard existente DEBE verificarse y documentarse antes de implementar.
- **FR-018**: Los reportes sin resultados DEBEN presentar un estado vacío comprensible, sin inventar registros.
- **FR-019**: Antes de implementar reportes operativos, DEBE identificarse si sus indicadores ya están cubiertos por el dashboard u otros reportes del Sprint 3, para evitar duplicación.

**Filtros, exportación y permisos (US-S4-07 y todas)**

- **FR-020**: El sistema DEBE permitir filtrar reportes por fecha inicial y final y validar que la fecha inicial no sea posterior a la fecha final.
- **FR-021**: El sistema DEBE permitir filtros adicionales pertinentes al tipo de reporte, como estado, tipo de membresía o resultado de acceso, una vez definidos sus campos disponibles.
- **FR-022**: El administrador DEBE poder exportar reportes autorizados a documentos Word `.docx`.
- **FR-023**: El documento exportado DEBE incluir GymAccess, título, fecha de generación, periodo, filtros aplicados, resultados, totales cuando correspondan y estado sin resultados cuando aplique; su contenido DEBE coincidir con la consulta fuente.
- **FR-024**: Los permisos DEBEN validarse en el backend. El administrador tiene acceso completo; la recepcionista puede consultar y atender notificaciones de membresías, pero no reportes financieros globales; entrenador y cliente no acceden al módulo administrativo.
- **FR-025**: La recepcionista NO DEBE consultar ni atender alertas de accesos rechazados ni consultar o exportar reportes operativos globales; estas operaciones están reservadas al administrador.
- **FR-026**: Las consultas y exportaciones NO DEBEN alterar los pagos, membresías, accesos ni otros registros de origen.
- **FR-027**: Las notificaciones y reportes NO DEBEN exponer contraseñas, hashes, tokens, datos biométricos ni información personal o financiera innecesaria.
- **FR-028**: Las operaciones administrativas de atención de notificaciones DEBEN mantener la trazabilidad requerida por el sistema y aprovechar la auditoría existente cuando corresponda.
- **FR-029**: El sprint DEBE preservar los contratos y comportamiento de los módulos anteriores, cubrir permisos y errores, y no operar sobre `gym_db`.

### Reglas de negocio

- **RN-001**: Las notificaciones de próximo vencimiento corresponden a una fecha de vencimiento exactamente tres días naturales después de la fecha local de revisión.
- **RN-002**: El cálculo de los tres días naturales usa la zona IANA local del gimnasio almacenada en configuración explícita; la revisión se realiza diariamente a una hora configurable en esa zona. Los valores de configuración deben establecerse antes de implementar.
- **RN-003**: Una membresía vencida es aquella cuya fecha de vencimiento pasó y que no tiene renovación vigente que la sustituya.
- **RN-004**: Para membresías, la clave de unicidad funcional es tipo + membresía + fecha de vencimiento; para accesos rechazados, es el registro de acceso. La repetición no recrea la notificación aunque esté atendida.
- **RN-005**: Las notificaciones se presentan dentro de GymAccess; correo, SMS y servicios externos quedan fuera de este sprint.
- **RN-006**: Una alerta de acceso rechazado se relaciona con un intento real rechazado; las autorizaciones no generan esa alerta.
- **RN-007**: Atender una notificación conserva estado, usuario que la atendió y fecha/hora de atención. Una notificación pendiente sustituida por renovación pasa a «No aplicable» y permanece en el historial; no se purgan automáticamente notificaciones atendidas.
- **RN-008**: El administrador tiene acceso completo al módulo aprobado.
- **RN-009**: La recepcionista puede consultar y atender notificaciones de membresías, pero no consultar reportes financieros globales.
- **RN-010**: Entrenadores y clientes no acceden al módulo administrativo.
- **RN-011**: La recepcionista no consulta ni atiende alertas de acceso rechazado y no consulta ni exporta reportes operativos globales.
- **RN-012**: Los reportes financieros reflejan pagos y adeudos registrados; no equivalen a utilidad neta ni rentabilidad.
- **RN-013**: Los reportes y exportaciones no modifican los registros fuente y deben mantener consistencia entre consulta y documento.
- **RN-014**: No se duplican indicadores o reportes ya proporcionados por el Sprint 3 sin una necesidad aprobada.
- **RN-015**: Las pruebas y migraciones futuras deben limitarse al entorno de pruebas autorizado; `gym_db` no debe operarse.

### Permisos por rol

La siguiente matriz aplica las decisiones confirmadas; los permisos no concedidos se deniegan.

| Operación | Administrador | Recepcionista | Entrenador | Cliente |
|---|---|---|---|---|
| Consultar notificaciones de membresías | Sí | Sí | No | No |
| Atender notificaciones de membresías | Sí | Sí | No | No |
| Consultar/atender alertas de accesos rechazados | Sí | No | No | No |
| Consultar reportes financieros globales | Sí | No | No | No |
| Exportar reportes financieros | Sí | No | No | No |
| Consultar reportes operativos globales | Sí | No | No | No |
| Exportar reportes operativos | Sí | No | No | No |
| Acceder al módulo administrativo | Sí | Solo las funciones expresamente permitidas | No | No |

### Entidades clave

- **Notificación**: aviso interno con tipo, título o descripción, fecha de generación, estado, referencia opcional a cliente, membresía o acceso, y datos de atención cuando corresponda. Los estados funcionales son pendiente, atendida y no aplicable (cuando una renovación sustituye el periodo de una notificación pendiente). Su modelo físico queda pendiente de diseño.
- **Atención de notificación**: acción que cambia una notificación pendiente a atendida y conserva el usuario responsable y la fecha/hora.
- **Membresía**: entidad existente que aporta cliente, periodo, vencimiento y estado para las notificaciones y reportes; se reutiliza sin duplicar su fuente de datos.
- **Registro de acceso**: entidad existente que conserva cada intento autorizado o rechazado; una alerta referencia el registro sin modificarlo.
- **Reporte**: resultado de consulta de pagos/adeudos o datos operativos, calculado a partir de registros existentes y criterios de filtro.
- **Documento Word**: representación exportada de un reporte, con los mismos resultados, periodo, filtros y totales que la consulta de origen.

## Criterios de éxito

### Resultados medibles

- **SC-001**: El 100% de las membresías activas que cumplan la condición confirmada de vencimiento a tres días naturales generan una notificación interna, y las revisiones repetidas no crean duplicados equivalentes.
- **SC-002**: El 100% de las membresías vencidas que no tengan renovación vigente que las sustituya se identifican y notifican conforme a la regla definida.
- **SC-003**: El 100% de intentos rechazados probados genera alerta relacionada con el registro original y ningún intento autorizado probado genera alerta de rechazo.
- **SC-004**: El 100% de las notificaciones atendidas probadas conserva usuario responsable y fecha/hora, y permanece consultable según permisos.
- **SC-005**: El 100% de intentos de la recepcionista para consultar reportes financieros globales son denegados por el backend.
- **SC-006**: El 100% de los intentos de entrenadores y clientes de acceder al módulo administrativo son denegados por el backend.
- **SC-007**: El 100% de los reportes financieros probados coincide con los registros fuente incluidos y no se presenta como utilidad neta sin datos de gastos y costos.
- **SC-008**: El 100% de filtros de fechas probados devuelve registros dentro del periodo y rechaza rangos invertidos.
- **SC-009**: El 100% de los documentos `.docx` probados es válido, legible y coincide con los resultados, filtros y totales de la consulta.
- **SC-010**: Cero cambios en los registros de origen atribuibles a la consulta o exportación de reportes.
- **SC-011**: Las pruebas de regresión aprobadas para el cierre no muestran regresiones en los módulos de sprints anteriores; los resultados solo se declararán cuando exista evidencia de ejecución.

## Supuestos

- El alcance aprobado se limita a US-S4-01 a US-S4-07 y a las decisiones de permisos expresas en esta especificación.
- «Tres días naturales antes» es una decisión confirmada. La zona local se obtiene de configuración IANA explícita y la revisión diaria usa una hora configurable; los valores deben establecerse antes de implementar.
- Las notificaciones son exclusivamente internas; no se incorporan correo, SMS ni mensajería externa.
- Se reutilizan clientes, membresías, pagos, accesos, usuarios, roles y auditoría existentes; no se duplican sus fuentes de datos.
- La recepcionista puede consultar y atender notificaciones de membresías; no consulta reportes financieros globales, alertas de acceso rechazado ni reportes operativos globales.
- La revisión de vencimientos se ejecuta diariamente a una hora configurable en la zona IANA local del gimnasio, configurada explícitamente antes de implementar.
- «Acceso completo» del administrador se interpreta dentro del alcance aprobado del Sprint 4 y no amplía otros módulos.
- El dashboard de Sprint 3 se debe revisar para evitar duplicar indicadores o reportes. La especificación no cambia ni completa el alcance de Sprint 3.
- El formato de exportación aprobado es Word `.docx`; la biblioteca o mecanismo técnico no se decide en esta especificación.
- No se asume una estructura de persistencia de notificaciones; su diseño y la verificación de los mecanismos existentes corresponden a etapas posteriores.
- Los reportes reflejan datos registrados y no constituyen un sistema contable completo.
- No se crea una nueva migración ni se aplica ninguna migración durante esta etapa.
- No se ejecutan pruebas ni operaciones sobre `gym_db` o `gym_db_pruebas` durante esta etapa.

## Preguntas pendientes de validación técnica

Las decisiones funcionales de las siete historias se resolvieron en Clarify. Los siguientes puntos no cambian su alcance y deberán verificarse o decidirse durante la revisión técnica y la planificación, sin inventar capacidades existentes:

- Revisar el código y esquema autorizados para identificar la persistencia disponible de notificaciones y atención.
- Establecer los valores de configuración concretos de zona IANA del gimnasio y hora diaria antes de implementar la revisión.
- Verificar en código el criterio de pagos válidos y la regla existente para calcular adeudos.
- Confirmar el conjunto de filtros que permiten los datos y contratos existentes.
- Evaluar un mecanismo compatible para generar `.docx` sin introducir dependencias injustificadas.
- Determinar cómo se integra el registro de atención con la auditoría existente.
- Comparar los indicadores agregados implementados en el dashboard de Sprint 3 con los informes detallados definidos para Sprint 4.

## Fuera de alcance

- Envío de notificaciones por correo electrónico, SMS o servicios externos.
- Aplicación móvil, pasarelas bancarias, facturación electrónica, nómina, inventarios o contabilidad completa.
- Cambios al hardware de reconocimiento facial, al mecanismo de autorización de acceso o a los registros originales de acceso.
- Reimplementación de clientes, membresías, pagos, accesos, usuarios, roles o auditoría ya existentes.
- Duplicación de dashboards, indicadores o reportes equivalentes del Sprint 3.
- Ampliar permisos de recepcionista sobre alertas de acceso o reportes operativos sin aprobación expresa.
- Cambiar contraseñas, credenciales, usuarios o permisos de bases de datos.
- Crear `plan.md`, `tasks.md`, contratos, migraciones o código en esta primera etapa.
