# Especificación de la funcionalidad: Sprint 3 — Entrenadores, rutinas, catálogo de ejercicios y dashboard administrativo

**Rama de la funcionalidad**: `003-sprint-3-entrenadores-rutinas-dashboard`

**Creado**: 2026-10-18

**Estado**: Borrador

**Entrada**: Descripción del usuario: "Utiliza las decisiones confirmadas para iniciar la especificación de Sprint 3 de GymAccess. La fuente principal debe ser `docs/sprint-3.md`. Decisiones confirmadas: (1) Dashboard administrativo con estadísticas consolidadas y datos reales. (2) Catálogo independiente y reutilizable de ejercicios, administrado por roles autorizados. (3) Pantalla de auditoría exclusiva del administrador, con filtros, solo lectura y sin posibilidad de editar o borrar registros. (4) E3 permanece pendiente hasta encontrar y aclarar su definición exacta; no se incorpora como requisito obligatorio."

**Documentos de referencia**: `docs/sprint-3.md` (insumo principal), `docs/project-context.md`, `docs/reglas.md`, `.specify/memory/constitution.md` (v1.0.0), especificaciones y contratos de `specs/001-sprint1-base-auth/` y `specs/002-sprint-2-membresias-pagos-reconocimiento-acceso/`.

## Escenarios de usuario y pruebas

Cada historia es un recorte independiente y testeable. Las historias US-S3-01 a US-S3-07 provienen de `docs/sprint-3.md`; las historias US-S3-08 y US-S3-09 incorporan las decisiones confirmadas 2 y 3.

### Historia de usuario 1 - Registro de entrenadores (US-S3-01) (Prioridad: P1)

Como administrador, quiero registrar a los entrenadores del gimnasio vinculándolos a su cuenta de usuario, para definir quiénes estarán a cargo del acompañamiento de los clientes.

**Por qué esta prioridad**: es la base de todo el módulo de entrenamiento: sin perfiles de entrenador no existe a quién asignar clientes ni quién gestione rutinas.

**Prueba independiente**: el administrador registra un entrenador asociado a una cuenta existente con rol `entrenador` y aparece en el listado; un rol no autorizado recibe denegación.

**Escenarios de aceptación**:

1. **Dado** una cuenta de usuario existente con rol `entrenador` sin perfil de entrenador, **Cuando** el administrador registra al entrenador con su información profesional, **Entonces** el entrenador queda guardado, asociado a esa cuenta y visible en el listado.
2. **Dado** una cuenta con rol distinto de `entrenador`, **Cuando** el administrador intenta asociarle un perfil de entrenador, **Entonces** el sistema rechaza la operación con un mensaje claro.
3. **Dado** un recepcionista o un entrenador autenticado, **Cuando** intenta registrar un entrenador, **Entonces** el sistema deniega la operación en el servidor.
4. **Dado** un entrenador registrado, **Cuando** el administrador modifica su información o lo desactiva, **Entonces** los cambios quedan guardados y registrados en auditoría.

---

### Historia de usuario 2 - Asignación de entrenador a cliente (US-S3-02) (Prioridad: P1)

Como administrador o recepcionista, quiero asignar un entrenador a un cliente activo para establecer la responsabilidad del seguimiento físico y de entrenamiento.

**Por qué esta prioridad**: es la relación operativa central del sprint: sin asignación no hay control sobre quién gestiona al cliente, y de ella dependen rutinas, objetivos y progreso.

**Prueba independiente**: con un entrenador registrado y un cliente activo, el administrador asigna el entrenador y el cliente queda visible en la carga de ese entrenador; una segunda asignación vigente del mismo cliente se rechaza.

**Escenarios de aceptación**:

1. **Dado** un cliente activo sin entrenador asignado vigente, **Cuando** el administrador (o el recepcionista) le asigna un entrenador activo, **Entonces** la asignación queda registrada con fecha de inicio y estado vigente.
2. **Dado** un cliente que ya tiene un entrenador asignado vigente, **Cuando** se intenta asignar otro entrenador, **Entonces** el sistema rechaza la operación por tener ya un entrenador principal en el periodo activo.
3. **Dado** un cliente inexistente o un entrenador inexistente o inactivo, **Cuando** se intenta realizar la asignación, **Entonces** el sistema rechaza la operación sin crear registros.
4. **Dado** una asignación vigente, **Cuando** el administrador la finaliza, **Entonces** la asignación conserva su historial con fecha de fin y estado final, y el entrenador deja de gestionar ese cliente.
5. **Dado** un entrenador autenticado, **Cuando** intenta asignarse clientes, **Entonces** el sistema deniega la operación.

---

### Historia de usuario 3 - Catálogo de ejercicios reutilizable (US-S3-08) (Prioridad: P1)

Como administrador, quiero mantener un catálogo independiente de ejercicios del gimnasio para que los entrenadores los reutilicen en las rutinas sin duplicar información.

**Por qué esta prioridad**: las rutinas se construyen con ejercicios del catálogo; sin catálogo previo, las rutinas duplicarían ejercicios y no serían reutilizables.

**Prueba independiente**: el administrador crea un ejercicio, el entrenador lo consulta y puede usarlo en una rutina; un ejercicio desactivado no puede agregarse a rutinas nuevas.

**Escenarios de aceptación**:

1. **Dado** el catálogo vacío, **Cuando** el administrador crea un ejercicio con nombre y descripción, **Entonces** el ejercicio queda disponible para todas las rutinas.
2. **Dado** un ejercicio del catálogo, **Cuando** el entrenador lo consulta, **Entonces** lo ve completo para poder usarlo en sus rutinas.
3. **Dado** un ejercicio activo, **Cuando** el administrador lo desactiva, **Entonces** deja de estar disponible para rutinas nuevas pero se conserva en las rutinas existentes y en el historial.
4. **Dado** un recepcionista o un cliente autenticado, **Cuando** intenta crear, modificar o desactivar ejercicios del catálogo, **Entonces** el sistema deniega la operación.
5. **Dado** un ejercicio del catálogo, **Cuando** el entrenador intenta modificarlo o desactivarlo, **Entonces** el sistema deniega la operación.

---

### Historia de usuario 4 - Creación de rutinas de entrenamiento (US-S3-03) (Prioridad: P1)

Como entrenador, quiero crear rutinas personalizadas con ejercicios del catálogo, series, repeticiones e instrucciones para los clientes que tengo asignados, orientando su plan de entrenamiento.

**Por qué esta prioridad**: es el entregable deportivo principal del sprint y el valor que recibe el cliente final.

**Prueba independiente**: con un entrenador con cliente asignado y ejercicios en el catálogo, el entrenador crea una rutina con ejercicios y parámetros; al cliente sin asignación se le rechaza la rutina.

**Escenarios de aceptación**:

1. **Dado** un entrenador con un cliente asignado vigente, **Cuando** crea una rutina para ese cliente con ejercicios del catálogo, series, repeticiones e instrucciones, **Entonces** la rutina queda guardada y asociada al cliente y al entrenador.
2. **Dado** un cliente sin asignación vigente con el entrenador autenticado, **Cuando** el entrenador intenta crearle una rutina, **Entonces** el sistema rechaza la operación.
3. **Dado** un ejercicio desactivado en el catálogo, **Cuando** el entrenador intenta agregarlo a una rutina nueva, **Entonces** el sistema rechaza la operación.
4. **Dado** una rutina existente del entrenador, **Cuando** la modifica (ejercicios, parámetros o estado), **Entonces** los cambios quedan guardados y el historial permite comparar versiones anteriores.
5. **Dado** un recepcionista o un cliente autenticado, **Cuando** intenta crear o modificar rutinas, **Entonces** el sistema deniega la operación.

---

### Historia de usuario 5 - Registro de objetivos y progresos (US-S3-04) (Prioridad: P2)

Como entrenador, quiero registrar objetivos de entrenamiento y entradas de progreso de mis clientes asignados, para seguir su evolución de forma ordenada y medible.

**Por qué esta prioridad**: complementa las rutinas con seguimiento medible; depende de la relación entrenador-cliente ya operativa.

**Prueba independiente**: el entrenador registra un objetivo y una entrada de progreso para un cliente asignado y ambos quedan en el historial consultable; el cliente asignado puede verlos.

**Escenarios de aceptación**:

1. **Dado** un cliente asignado, **Cuando** el entrenador registra un objetivo con meta y fecha objetivo, **Entonces** el objetivo queda guardado con estado inicial y fecha de registro.
2. **Dado** un cliente asignado con un objetivo, **Cuando** el entrenador registra una entrada de progreso con fecha, valor o avance y comentario, **Entonces** la entrada queda guardada en el historial del cliente.
3. **Dado** un cliente sin asignación vigente, **Cuando** el entrenador intenta registrar objetivos o progresos, **Entonces** el sistema rechaza la operación.
4. **Dado** un historial de progreso de un cliente, **Cuando** el entrenador registra nuevas entradas, **Entonces** las entradas anteriores permanecen sin modificación para comparar la evolución.
5. **Dado** un recepcionista o un cliente autenticado, **Cuando** intenta registrar objetivos o progresos, **Entonces** el sistema deniega la operación.

---

### Historia de usuario 6 - Consulta de mi rutina y mi progreso (US-S3-05) (Prioridad: P2)

Como cliente, quiero consultar mi rutina asignada y mi historial de progreso desde la aplicación, para conocer mi evolución y mantenerme motivado.

**Por qué esta prioridad**: es la cara visible del módulo de entrenamiento para el cliente; depende de que el entrenador haya cargado rutina y progreso.

**Prueba independiente**: un cliente con cuenta vinculada a su ficha consulta su rutina y su progreso; al intentar consultar la información de otro cliente recibe denegación.

**Escenarios de aceptación**:

1. **Dado** un cliente con una rutina activa, **Cuando** consulta su rutina, **Entonces** ve los ejercicios con series, repeticiones, peso recomendado, descanso e instrucciones.
2. **Dado** un cliente con objetivos y entradas de progreso, **Cuando** consulta su progreso, **Entonces** ve su evolución histórica ordenada en el tiempo.
3. **Dado** un cliente sin rutina activa, **Cuando** consulta su rutina, **Entonces** ve un estado vacío comprensible, sin errores.
4. **Dado** un cliente autenticado, **Cuando** intenta consultar la rutina o el progreso de otro cliente, **Entonces** el sistema deniega la operación sin exponer datos de terceros.

---

### Historia de usuario 7 - Dashboard administrativo (US-S3-06) (Prioridad: P2)

Como administrador, quiero ver un dashboard con estadísticas consolidadas del gimnasio basadas en datos reales (clientes, membresías, pagos, accesos, entrenadores, rutinas y progreso), para tomar decisiones operativas rápidas.

**Por qué esta prioridad**: consolida la visión del negocio usando la información ya operativa de los Sprints 1 y 2 más la del propio sprint; su valor es de síntesis, por lo que va después del módulo operativo.

**Prueba independiente**: el administrador abre el dashboard y ve indicadores calculados con los registros reales del sistema, filtrables por periodo; un rol no autorizado recibe denegación.

**Escenarios de aceptación**:

1. **Dado** el sistema con datos reales de clientes, membresías, pagos, accesos, entrenadores, rutinas y progreso, **Cuando** el administrador abre el dashboard, **Entonces** ve los indicadores consolidados del periodo con valores calculados con las reglas de negocio del sistema (por ejemplo, clientes activos según vigencia de membresía por fechas).
2. **Dado** el dashboard con filtro de periodo por defecto, **Cuando** el administrador cambia el rango de fechas, **Entonces** los indicadores se recalculan para ese periodo.
3. **Dado** un periodo con inicio posterior a su fin, **Cuando** se aplica el filtro, **Entonces** el sistema rechaza el filtro con un mensaje de validación.
4. **Dado** un gimnasio sin datos en el periodo, **Cuando** el administrador abre el dashboard, **Entonces** los indicadores muestran cero o estados vacíos, sin errores ni datos ficticios.
5. **Dado** un recepcionista, entrenador o cliente autenticado, **Cuando** intenta acceder al dashboard, **Entonces** el sistema deniega el acceso en el servidor.

---

### Historia de usuario 8 - Pantalla de auditoría de solo lectura (US-S3-09) (Prioridad: P3)

Como administrador, quiero consultar una pantalla de auditoría con filtros y en modo solo lectura, para revisar las acciones relevantes registradas por el sistema sin posibilidad de editarlas o borrarlas.

**Por qué esta prioridad**: aprovecha el registro de auditoría ya existente; es una vista de supervisión, no una operación del flujo principal.

**Prueba independiente**: el administrador filtra los registros de auditoría por rango de fechas y módulo, y solo observa; controles de edición o borrado no existen y los demás roles reciben denegación.

**Escenarios de aceptación**:

1. **Dado** registros de auditoría en el sistema, **Cuando** el administrador abre la pantalla de auditoría, **Entonces** ve los registros con actor, acción, entidad, fecha/hora y resultado.
2. **Dado** la pantalla de auditoría, **Cuando** el administrador aplica filtros (rango de fechas, módulo o entidad y actor cuando aplique), **Entonces** la lista se acota a los registros que cumplen el filtro.
3. **Dado** la pantalla de auditoría, **Cuando** el administrador la revisa, **Entonces** no existen controles para editar, eliminar o crear registros de auditoría.
4. **Dado** un recepcionista, entrenador o cliente autenticado, **Cuando** intenta consultar la auditoría, **Entonces** el sistema deniega el acceso.
5. **Dado** un filtro sin resultados, **Cuando** se aplica, **Entonces** se muestra un estado vacío comprensible.

---

### Historia de usuario 9 - Consulta del personal asignado (US-S3-07) (Prioridad: P3)

Como administrador o recepcionista, quiero consultar los clientes asignados a cada entrenador y su carga, para organizar el trabajo del equipo.

**Por qué esta prioridad**: es una vista de apoyo operativo que depende de que existan asignaciones registradas.

**Prueba independiente**: con varias asignaciones vigentes, el administrador y el recepcionista ven la lista de clientes por entrenador con su carga; el cliente y roles no autorizados reciben denegación.

**Escenarios de aceptación**:

1. **Dado** entrenadores con clientes asignados vigentes, **Cuando** el administrador o el recepcionista consulta el personal asignado, **Entonces** ve cada entrenador con su cantidad de clientes y su lista de asignados.
2. **Dado** un entrenador sin clientes asignados, **Cuando** se consulta el personal asignado, **Entonces** aparece con carga cero.
3. **Dado** un cliente autenticado, **Cuando** intenta consultar el personal asignado, **Entonces** el sistema deniega la operación.

---

### Casos límite

- ¿Qué sucede cuando se intenta asignar un entrenador a un cliente que ya tiene uno vigente? → se rechaza la operación y se conserva la asignación existente.
- ¿Qué sucede cuando se finaliza una asignación y luego se registra una nueva? → el historial conserva ambas; solo la nueva queda vigente.
- ¿Qué sucede cuando el entrenador asignado es desactivado? → no puede gestionar rutinas ni progresos; sus asignaciones deben reasignarse o finalizarse por administración.
- ¿Qué sucede cuando el entrenador intenta crear una rutina, objetivo o progreso para un cliente que dejó de estar asignado? → se rechaza la operación.
- ¿Qué sucede cuando una rutina contiene un ejercicio que luego se desactiva del catálogo? → la rutina conserva el ejercicio y sus parámetros; solo se impide usarlo en rutinas nuevas.
- ¿Qué sucede cuando un mismo ejercicio del catálogo se usa en varias rutinas? → se reutiliza sin duplicarse; los parámetros (series, repeticiones, etc.) pertenecen a cada rutina.
- ¿Qué sucede cuando los parámetros de un ejercicio de rutina son inválidos (series o repeticiones en cero, peso o descanso negativos)? → se rechaza la validación con mensaje comprensible.
- ¿Qué sucede cuando un cliente sin membresía vigente tiene rutina? → es válido: el seguimiento deportivo depende de la asignación al cliente, no de la vigencia de la membresía (la vigencia solo condiciona el ingreso físico).
- ¿Qué sucede cuando un objetivo se cierra o se alcanza? → el objetivo y su historial de progreso permanecen para comparar evolución; no se borran.
- ¿Qué sucede cuando el dashboard se consulta sin datos en el periodo? → se muestran ceros o estados vacíos, nunca datos ficticios.
- ¿Qué sucede cuando el filtro del dashboard tiene fechas invertidas o mal formadas? → se rechaza con validación antes de calcular.
- ¿Qué sucede cuando la auditoría no tiene registros o el filtro no coincide? → estado vacío sin error.
- ¿Qué sucede cuando un cliente con cuenta intenta consultar datos de entrenamiento de otro cliente? → se deniega en el servidor sin revelar datos de terceros.
- ¿Qué sucede cuando se desactiva una cuenta de usuario de un entrenador con asignaciones vigentes? → la cuenta no puede operar; las asignaciones quedan pendientes de reasignación o finalización.
- ¿Qué sucede cuando el entrenador intenta editar una rutina creada por otro entrenador? → se deniega: cada rutina pertenece a quien la creó y a su cliente asignado.

## Requisitos

### Requisitos funcionales

**Entrenadores (US-S3-01)**

- **FR-001**: El sistema DEBE permitir al administrador registrar un entrenador vinculado a una cuenta de usuario existente con rol `entrenador`; NO DEBE permitirse un entrenador sin cuenta válida ni con otro rol.
- **FR-002**: El administrador DEBE poder consultar y modificar la información del perfil del entrenador (nombre completo procedente de la cuenta, especialidad o descripción profesional y teléfono cuando se capturen) y activarlo o desactivarlo.
- **FR-003**: Un entrenador desactivado NO DEBE poder recibir nuevas asignaciones ni crear, modificar ni registrar rutinas, objetivos o progresos.
- **FR-004**: Registrar, modificar y activar o desactivar entrenadores DEBEN quedar registrados en auditoría con actor, acción, fecha/hora, entidad y resultado.

**Asignaciones (US-S3-02, US-S3-07)**

- **FR-005**: El administrador y el recepcionista DEBEN poder asignar un entrenador activo a un cliente activo, registrando fecha de inicio y estado.
- **FR-006**: El sistema DEBE impedir que un cliente tenga más de una asignación de entrenador vigente al mismo tiempo (un único entrenador principal por periodo activo).
- **FR-007**: El sistema DEBE permitir finalizar una asignación registrando fecha de fin y estado final; NO DEBE existir eliminación física de asignaciones.
- **FR-008**: El administrador y el recepcionista DEBEN poder consultar los clientes asignados a cada entrenador y la cantidad de clientes por entrenador (carga).
- **FR-009**: Asignar y finalizar asignaciones DEBEN quedar registrados en auditoría.

**Catálogo de ejercicios (US-S3-08)**

- **FR-010**: El sistema DEBE mantener un catálogo independiente de ejercicios reutilizables por múltiples rutinas, con al menos nombre, descripción y estado activo o inactivo.
- **FR-011**: El administrador DEBE poder crear, modificar y desactivar o reactivar ejercicios del catálogo. Un ejercicio desactivado NO DEBE poder agregarse a rutinas nuevas, y DEBE conservarse en las rutinas existentes y en el historial.
- **FR-012**: El entrenador DEBE poder consultar el catálogo completo de ejercicios activos y usarlos en sus rutinas; NO DEBE poder modificar ni desactivar ejercicios del catálogo.
- **FR-013**: Crear y modificar ejercicios del catálogo DEBEN quedar registrados en auditoría.

**Rutinas (US-S3-03)**

- **FR-014**: El entrenador DEBE poder crear y modificar rutinas SOLO para clientes con los que tenga una asignación vigente.
- **FR-015**: Una rutina DEBE asociarse a un cliente válido y al entrenador que la crea, y DEBE conservar nombre, estado y fechas, manteniendo el historial de cambios para comparar versiones en el tiempo.
- **FR-016**: Una rutina DEBE poder contener uno o más ejercicios del catálogo, cada uno con series, repeticiones, peso recomendado, descanso e instrucciones; todos esos campos DEBEN validarse (valores numéricos positivos dentro de rangos razonables y texto de instrucciones no vacío cuando se capture).
- **FR-017**: El entrenador SOLO DEBE poder consultar y modificar rutinas de sus clientes asignados; NO DEBE existir eliminación física de rutinas.
- **FR-018**: Crear y modificar rutinas DEBEN quedar registrados en auditoría.

**Objetivos y progresos (US-S3-04)**

- **FR-019**: El entrenador DEBE poder registrar objetivos de entrenamiento para sus clientes asignados, con meta descrita, unidad cuando aplique, fecha objetivo y estado.
- **FR-020**: El entrenador DEBE poder registrar entradas de progreso de sus clientes asignados con fecha, valor o avance medido y comentario opcional; la información DEBE presentarse como seguimiento deportivo y NUNCA como diagnóstico médico.
- **FR-021**: Objetivos y progresos DEBEN conservarse históricos sin borrado físico, para comparar la evolución del cliente en el tiempo.
- **FR-022**: Registrar objetivos y registrar o modificar entradas de progreso DEBEN quedar registrados en auditoría.

**Consulta del cliente (US-S3-05)**

- **FR-023**: El cliente autenticado SOLO DEBE poder consultar su propia rutina activa y su propio historial de objetivos y progresos, sin posibilidad de modificarlos.
- **FR-024**: Ante la consulta de un cliente sin rutina activa o sin objetivos registrados, el sistema DEBE responder con estados vacíos comprensibles, no con errores.

**Dashboard (US-S3-06, decisión confirmada 1)**

- **FR-025**: El sistema DEBE presentar al administrador un dashboard con estadísticas consolidadas basadas exclusivamente en datos reales del sistema, sin datos ficticios, que incluyan como mínimo: clientes totales, clientes activos según vigencia de membresía, clientes nuevos en el periodo; membresías vigentes, por vencer y vencidas; pagos del periodo con cantidad e ingresos y adeudos pendientes; intentos de acceso del periodo con autorizados y rechazados; entrenadores activos y carga de clientes asignados; rutinas activas y clientes sin rutina activa; objetivos activos y registros de progreso del periodo.
- **FR-026**: El dashboard DEBE permitir filtrar los indicadores por un periodo (fecha de inicio y fin) con un valor por defecto razonable, y DEBE rechazar periodos con la fecha de inicio posterior a la de fin.
- **FR-027**: Los indicadores DEBEN calcularse con las mismas reglas de negocio del sistema (por ejemplo, la vigencia de membresías se determina por fechas y estado, no solo por el texto de un estado guardado).
- **FR-028**: El dashboard estará reservado al administrador; los demás roles NO DEBEN poder acceder a él.
- **FR-029**: El dashboard NO DEBE duplicar ni alterar el comportamiento de la pantalla de inicio existente; es una vista adicional de consolidación.

**Auditoría (US-S3-09, decisión confirmada 3)**

- **FR-030**: El sistema DEBE presentar al administrador una pantalla de auditoría de solo lectura con filtros por rango de fechas, módulo o entidad y actor cuando aplique, que muestre los registros de auditoría existentes.
- **FR-031**: La pantalla de auditoría NO DEBE ofrecer ninguna operación de edición, creación o borrado de registros, y los roles distintos del administrador NO DEBEN poder acceder a ella.

**Seguridad, permisos y proceso (decisiones generales)**

- **FR-032**: Toda operación nueva DEBE validar sesión y permisos en el servidor conforme a la matriz de permisos; la ocultación de opciones en la interfaz NO DEBE sustituir la autorización.
- **FR-033**: El entrenador NO DEBE poder consultar ni modificar información de clientes que no tenga asignados vigentemente en los módulos nuevos.
- **FR-034**: El recepcionista NO DEBE poder crear ni modificar rutinas, objetivos ni progresos; su participación se limita a la asignación de entrenadores y la consulta del personal asignado.
- **FR-035**: El sprint NO DEBE alterar el comportamiento ya consolidado de los Sprints 1 y 2 (autenticación, usuarios, clientes, membresías, pagos, reconocimiento facial, kiosco y autorización manual), salvo ampliaciones aprobadas expresamente.
- **FR-036**: Las nuevas entidades DEBEN conservarse sin eliminación física, usando estados y fechas, conforme a la constitución.
- **FR-037**: Los cambios de esquema necesarios para este sprint DEBEN documentarse para una nueva migración, sin editar las migraciones existentes (001 a 006), y DEBEN probarse únicamente en el entorno de datos de pruebas (`gym_db_pruebas` mediante `.env.test`); NO DEBE operarse sobre la base de producción `gym_db`.
- **FR-038**: El sprint DEBE cubrir con pruebas los casos exitosos, los errores de validación, los permisos por rol y los accesos no autorizados de las funcionalidades nuevas, sin regresiones en las suites existentes.
- **FR-039**: La excepción **E3** (historial de accesos del entrenador) permanece SIN CAMBIOS: mientras su definición exacta no se aclare, el comportamiento implementado en el Sprint 2 se mantiene intacto y NO se incorpora ninguna restricción nueva como requisito de este sprint.

### Reglas de negocio

- **RN-001**: Las operaciones privadas requieren sesión válida y permisos suficientes verificados en el servidor según el rol de la sesión.
- **RN-002**: Cada entrenador se asocia a exactamente una cuenta de usuario con rol `entrenador`; el perfil de entrenador no existe sin esa cuenta.
- **RN-003**: Un cliente tiene como máximo un entrenador principal asignado durante un periodo activo.
- **RN-004**: La vigencia de las asignaciones se determina con fechas y estado aplicables, no solo con el texto de un estado guardado.
- **RN-005**: El entrenador solo crea, modifica o consulta rutinas, objetivos y progreso de clientes con asignación vigente.
- **RN-006**: El cliente solo consulta su propia rutina, sus propios objetivos y su propio progreso.
- **RN-007**: Los campos de ejercicios de una rutina (series, repeticiones, peso recomendado, descanso e instrucciones) se validan antes de guardarse.
- **RN-008**: Un ejercicio desactivado del catálogo no se agrega a rutinas nuevas, pero las rutinas existentes lo conservan con sus parámetros.
- **RN-009**: Rutinas, objetivos y progresos conservan historial suficiente para comparar la evolución en el tiempo; no se borran físicamente.
- **RN-010**: La auditoría registra las acciones relevantes del sprint (entrenadores, asignaciones, catálogo de ejercicios, rutinas, objetivos y progresos) con actor, acción, fecha/hora, entidad y resultado, sin datos sensibles.
- **RN-011**: El dashboard se calcula al momento de la consulta con datos reales; no se almacena información derivada innecesariamente.
- **RN-012**: El recepcionista puede consultar y asignar, pero no edita rutinas ni progresos de entrenamiento.
- **RN-013**: La información de seguimiento deportivo no se presenta como diagnóstico médico.
- **RN-014**: Mientras E3 siga pendiente de aclaración, el historial de accesos del entrenador conserva el comportamiento definido en el Sprint 2.

### Matriz de permisos por rol

| Operación | Administrador | Recepcionista | Entrenador | Cliente |
|---|---|---|---|---|
| Registrar, modificar y activar o desactivar entrenadores | Sí | No | No | No |
| Asignar o finalizar entrenador de un cliente | Sí | Sí | No | No |
| Consultar clientes asignados por entrenador y carga | Sí | Sí | Solo sus asignados | No |
| Crear, modificar y desactivar ejercicios del catálogo | Sí | No | No | No |
| Consultar el catálogo de ejercicios | Sí | No | Sí | No |
| Crear y modificar rutinas (clientes asignados) | No | No | Sí (solo las suyas) | No |
| Consultar rutinas | No | No | Suyas y de sus asignados | La propia |
| Registrar objetivos y progresos | No | No | Sí (solo sus asignados) | No |
| Consultar objetivos y progresos | No (solo agregados del dashboard) | No | Suyos y de sus asignados | Los propios |
| Consultar dashboard administrativo | Sí | No | No | No |
| Consultar pantalla de auditoría (solo lectura) | Sí | No | No | No |
| Historial general de accesos | Sí | Sí | Sin cambios (E3 pendiente) | Solo el propio |

### Entidades clave

- **Entrenador**: perfil profesional vinculado en exclusiva a una cuenta de usuario con rol `entrenador`. Atributos: cuenta de usuario (referencia única), nombre completo (procedente de la cuenta), especialidad o descripción profesional, teléfono cuando aplique y estado activo o inactivo.
- **Asignación de entrenador a cliente**: relación entre un cliente y un entrenador para un periodo de seguimiento. Atributos: cliente, entrenador, fecha de inicio, fecha de fin y estado. Un cliente puede tener varias asignaciones en el historial, pero como máximo una vigente.
- **Ejercicio (catálogo)**: elemento deportivo independiente y reutilizable por múltiples rutinas. Atributos: nombre, descripción, grupo muscular u otra clasificación opcional y estado activo o inactivo. No se elimina físicamente.
- **Ejercicio de una rutina**: aparición concreta de un ejercicio del catálogo dentro de una rutina, con sus parámetros: series, repeticiones, peso recomendado, descanso e instrucciones, y su orden dentro de la rutina.
- **Rutina**: plan de entrenamiento de un cliente creado por un entrenador. Atributos: cliente, entrenador, nombre, estado y fechas. Conserva historial de cambios; referencia uno o más ejercicios del catálogo.
- **Objetivo de entrenamiento**: meta deportiva de un cliente. Atributos: cliente, meta descrita, unidad cuando aplique, fecha objetivo y estado. Conserva historial.
- **Progreso del cliente**: entrada periódica de evolución. Atributos: cliente, objetivo cuando exista, fecha, valor o avance medido y comentario opcional. Conserva historial completo.
- **Entidades reutilizadas sin cambio de alcance**: `usuarios` y `clientes` (Sprint 1); `membresias` (base de los indicadores de vigencia), `pagos` (indicadores de ingresos y adeudos), `accesos` (indicadores de intentos) y `auditoria` (pantalla de solo lectura y registro de las acciones del sprint).

> **Nota de esquema (FR-037)**: las entidades nuevas se materializarán mediante una migración futura nueva (siguiente número disponible), sin modificar las migraciones 001 a 006, y se probará exclusivamente en `gym_db_pruebas` usando `.env.test`. No se opera sobre `gym_db` en este sprint.

## Criterios de éxito

### Resultados medibles

- **SC-001**: El flujo demostrable completo (administrador registra entrenadores → asigna un cliente → el entrenador crea una rutina con ejercicios del catálogo y registra objetivos y progreso → el cliente consulta su rutina y evolución → el administrador revisa el dashboard) se completa con datos reales en menos de 15 minutos.
- **SC-002**: El 100% de las operaciones de los módulos nuevos probadas por cada rol no autorizado son rechazadas en el servidor con respuesta de denegación uniforme.
- **SC-003**: El 100% de los intentos de crear una segunda asignación vigente para un cliente son rechazados, conservándose una única asignación activa.
- **SC-004**: Cero eliminaciones físicas de entrenadores, asignaciones, rutinas, ejercicios del catálogo, objetivos o progresos; el 100% de los historiales permanece consultable después de las operaciones de cierre o desactivación.
- **SC-005**: El 100% de las acciones de escritura de los módulos nuevos quedan registradas en auditoría con actor, acción, fecha/hora, entidad y resultado.
- **SC-006**: El dashboard muestra únicamente valores calculados a partir de datos reales: cero indicadores con datos ficticios, y los totales coinciden con los registros existentes al momento de la consulta para el periodo filtrado.
- **SC-007**: La pantalla de auditoría es accesible únicamente para el administrador y no expone ningún control de edición, creación o borrado (cero controles de modificación).
- **SC-008**: Las suites automatizadas del sprint pasan al 100% y las suites existentes de los Sprints 1 y 2 siguen pasando al 100% (cero regresiones).
- **SC-009**: El flujo completo es usable en escritorio y en pantallas de hasta 768 px sin desbordamiento horizontal y respetando la preferencia de movimiento reducido del sistema.
- **SC-010**: Ningún cambio del sprint altera la operación consolidada de autenticación, membresías, pagos, reconocimiento facial, kiosco y autorización manual (cero regresiones funcionales verificadas).

## Supuestos

- El «registro de entrenadores» se refiere al perfil de entrenador vinculado a una cuenta existente con rol `entrenador`: la creación de cuentas con rol entrenador ya existe desde el Sprint 1 y no se duplica.
- Los «roles autorizados» del catálogo de ejercicios se resuelven como: administrador administra (crear, modificar, desactivar o reactivar) y entrenador consulta y usa en rutinas; recepcionista y cliente no participan. Ajustable en `/speckit.clarify` si se requiere que el entrenador pueda dar de alta ejercicios nuevos.
- El dashboard administrativo es una vista nueva para el administrador; la pantalla de inicio existente del Sprint 2 conserva su comportamiento actual y no se duplica.
- El filtro de periodo del dashboard usa por defecto el mes en curso.
- Los objetivos se registran por cliente (no por rutina) y el progreso se asocia al cliente y, cuando exista, a un objetivo concreto.
- Los indicadores «clientes activos» se calculan con la vigencia real de membresías (fechas y estado), coherente con las reglas del Sprint 2.
- La información de entrenamiento (pesos, repeticiones, progreso) se trata como seguimiento deportivo, nunca como diagnóstico médico (reglas §IX.8).
- Clases grupales, reservas y asistencia compleja a sesiones siguen fuera de alcance (alcance excluido constitucional).
- El esquema nuevo se crea con una migración futura aplicada solo en `gym_db_pruebas` mediante `.env.test`; `gym_db` no se opera y las migraciones 001–006 no se editan.

## Ambigüedades pendientes

- **E3 — Historial de accesos del entrenador (decisión confirmada 4)**: el Sprint 2 define (E3, `specs/002-.../spec.md`): «mientras no exista la asignación de clientes (Sprint 3), el entrenador puede consultar el historial general de accesos. Cuando exista la asignación, la consulta DEBE restringirse a sus clientes asignados». **No se incorpora como requisito obligatorio de este sprint**: hasta aclarar su definición exacta (alcance del recorte, momento del cambio y compatibilidad con las pruebas existentes), el comportamiento del Sprint 2 se mantiene intacto (FR-039, RN-014). Cualquier restricción futura deberá aprobarse como ampliación documentada.
- **E4 — Consulta propia de membresías por el cliente**: el Sprint 2 difirió esta vista señalando «revisar en Sprint 3». El alcance confirmado de este sprint no la incluye; se propone mantenerla fuera y tratarla como futura ampliación aprobada.
- **Campos del perfil de entrenador y reglas del catálogo**: se aplicaron los supuestos razonables descritos arriba; pueden ajustarse en `/speckit.clarify` sin afectar la estructura de las historias.
