# Investigación técnica: Sprint 4 — Notificaciones, reportes y seguimiento administrativo

**Fecha**: 2026-11-04 | **Plan**: [plan.md](./plan.md) | **Especificación**: [spec.md](./spec.md)

La investigación combina inspección estática del código y migraciones existentes con evaluación documental de bibliotecas candidatas. No se ejecutaron pruebas, instalaciones ni operaciones sobre bases de datos.

## R-01. Programación diaria y zona IANA

- **Decisión propuesta**: ejecutar el job desde `backend/src/server.js` con `node-cron` 4.6.0, expresión `30 0 * * *`, `timezone: 'America/Mexico_City'` y `noOverlap: true`. Zona y hora deben ser configurables en el entorno; estos son valores iniciales y no constantes embebidas.
- **Racional**: el proceso de servidor es el punto de arranque apropiado y evita activar el job al importar `crearApp()` en pruebas. La documentación de node-cron describe una opción `timezone` compatible con identificadores IANA y `noOverlap`; el paquete declara Node >=20 y cero dependencias en la versión consultada.
- **Alternativas**: depender de la zona del host (no determinista); escribir un planificador manual (más lógica temporal); instalar una cola durable (mayor alcance y persistencia adicional).
- **Límite**: el scheduler en memoria no garantiza recuperar días completos de indisponibilidad. Decidir recuperación/checkpoint antes de implementar; las claves únicas protegen duplicados, no corrigen avisos omitidos.
- **Fuentes**: [documentación de opciones de node-cron](https://nodecron.com/scheduling-options.html), [zonas horarias y DST](https://nodecron.com/timezones-and-dst.html), [metadata npm node-cron](https://registry.npmjs.org/node-cron/latest). Consultadas el 2026-11-04.

## R-02. Persistencia e idempotencia de notificaciones

- **Decisión propuesta**: persistir en una nueva tabla `notificaciones`; índice único `(tipo, id_membresia, fecha_vencimiento)` para avisos de membresía e índice único sobre `id_acceso` para alertas de accesos rechazados. Las referencias que no correspondan al tipo serán `NULL`; la unicidad por acceso no se apoya en la clave de membresía.
- **Racional**: la inspección de `backend/src/` y las migraciones `001`–`007` no encontró módulo ni tabla de notificaciones. La base de datos no se consultó; por tanto, la existencia de estructura en los entornos no se confirma. La restricción de datos hace idempotente la creación incluso bajo reintento/concurrencia.
- **Estados**: limitar a los estados explícitos en spec: `pendiente`, `atendida`, `no_aplicable`. Transiciones: pendiente→atendida o pendiente→no_aplicable; atendida conserva su actor/fecha y no se recrea.
- **Alternativas**: guardar avisos solo en memoria (pierde historial); deduplicar únicamente en la aplicación (no protege concurrencia); modificar tablas originales (acoplamiento innecesario).
- **Dependencia**: migración nueva solo en etapa de implementación, después de revisión y aprobación; ninguna migración se creó o ejecutó aquí.

## R-03. Renovación transaccional

- **Decisión propuesta**: dentro de la transacción de `renovarMembresia`, bloquear la membresía que se renueva, actualizar a `no_aplicable` solo los avisos pendientes del periodo sustituido y crear/cerrar el periodo conforme a la lógica existente; conservar sin cambio las notificaciones atendidas. Una falla revierte ambos cambios.
- **Racional**: `backend/src/services/membresia.service.js` ya usa transacciones para cerrar/crear membresías, aunque la lectura de la membresía ocurre antes de abrirla. Incluir el estado de avisos dentro de la unidad atómica evita divergencia.
- **Alternativas**: actualizar avisos después del commit (puede dejar pendientes obsoletos); alterar avisos atendidos (contradice D-03); manejarlo solo en el frontend (no durable).

## R-04. Alertas de acceso rechazado

- **Decisión propuesta**: después de persistir el acceso, solicitar creación idempotente de alerta por `id_acceso`; no alertar accesos autorizados. Un fallo de alerta no cambia la decisión ni modifica el registro original. Registrar error técnico sin datos sensibles y permitir reconciliación idempotente desde la revisión programada.
- **Racional**: `backend/src/services/acceso.service.js` guarda el acceso y después registra auditoría; `backend/src/models/acceso.model.js` expone el ID insertado. La alerta puede referenciar el intento sin copiar ni alterar su fuente.
- **Riesgo**: la generación inmediata puede fallar después de guardar el acceso. La reconciliación es necesaria para evitar omisiones, y la unicidad de `id_acceso` evita duplicados.

## R-05. Filtros y reglas financieras

- **Fuentes comprobadas**: `pago.model.js` contiene `fecha_pago`, `estado`, `metodo_pago`, cliente y membresía; inserta pagos como `pagado`. La migración define `pagado`, `pendiente`, `cancelado`; la suma que reduce adeudo incluye solo `pagado`. `pago.service.js` calcula adeudo como `max(0, precio_acordado − suma de pagos pagados)`.
- **Decisión propuesta**: reporte de pagos filtrable por rango de `fecha_pago` y solo por otros campos ya presentes y autorizados (cliente, membresía, método y estado existente). Totales reportados deben seguir la regla de pagos válidos ya aplicada, sin crear estados ni fórmulas nuevas.
- **Adeudos**: los datos existentes representan saldo actual por membresía, no una serie histórica de saldos. Presentar adeudos como fotografía actual calculada con la regla actual; no ofrecer saldo «a fecha pasada» ni atribuirlo a un periodo sin una decisión funcional y datos históricos.
- **Operativos**: clientes admiten búsqueda por nombre/apellido; membresías disponen de tipo, estado y fechas; accesos admiten fechas y cliente y usan resultados `autorizado`/`rechazado`. El endpoint de acceso no filtra hoy por resultado; si el reporte lo necesita, ampliar consulta de forma parametrizada. No se asumirán filtros nuevos para campos ausentes.
- **Riesgo pendiente**: la especificación solicita reportes financieros por periodo, pero el adeudo es actual. El plan establece la limitación técnica; debe revisarse antes de tareas si se requiere otra interpretación.

## R-06. Inventario del dashboard y complementariedad (FR-017/FR-019)

La implementación encontrada es `frontend/src/pages/Inicio.jsx`, que calcula tarjetas sobre listas devueltas por APIs existentes. No se encontró página de dashboard separada, endpoint `/api/dashboard` montado en `backend/src/app.js`, ni módulo de reportes detallados.

| Rol en `Inicio.jsx` | Indicadores agregados actuales | Complemento propuesto S4 (sin repetir la tarjeta agregada) |
|---|---|---|
| Administrador | cantidad de clientes; suma de adeudos actuales; cantidad de intentos de acceso | detalle filtrable/exportable de clientes, membresías y eventos de acceso; pagos por fecha; adeudos como detalle de saldos actuales. No replicar totales generales de clientes/accesos ni el total agregado de adeudos como indicador autónomo. |
| Recepcionista | cantidad de clientes; cantidad de intentos de acceso; suma de importes listados de pagos | No habilitar reportes globales a este rol; su acceso S4 se limita a notificaciones de membresía. |
| Entrenador | cantidad de membresías; cantidad de intentos de acceso | Sin acceso a reportes administrativos S4. |
| Cliente | suma de sus pagos; cantidad de sus accesos; suma de sus adeudos actuales | Sin acceso al módulo administrativo S4; las vistas personales existentes permanecen fuera del alcance de reportes globales. |

**Conclusión**: los agregados son tarjetas simples calculadas en el frontend; no sustituyen consultas de filas, filtros por periodo ni DOCX. La cobertura/solapamiento queda documentada en este inventario, pero deberá revalidarse contra la versión de código vigente antes de implementar; el registro previo de G-01 y H-04 debe actualizarse con esta evidencia.

## R-07. Evaluación de generación `.docx`

- **Candidata**: `docx` 9.15.2. Metadata del registro npm consultada indica formato ES Module y `engines.node >=16`; la página del proyecto describe generación desde Node.js y navegador.
- **Racional**: compatible en principio con el backend ES Modules y Node >=20 previsto por documentación previa. Genera DOCX sin requerir Office instalado en el servidor.
- **Alternativas**: `docxtemplater` (orientado a plantillas y licencias/paquetes de funcionalidades por evaluar); generación manual OOXML (alto riesgo y complejidad); librería frontend (expone datos y cambia responsabilidad de exportación).
- **Estado**: no se instaló. Antes de adoptarla, revisar API y licencia, seguridad de contenido, tamaño, compatibilidad con Node real y validación de que documento/consulta coinciden.
- **Fuentes**: [metadata npm docx](https://registry.npmjs.org/docx/latest), [sitio del proyecto](https://docx.js.org/). Consultadas el 2026-11-04.

## R-08. Auditoría y errores

- **Decisión propuesta**: al atender, registrar en la misma transacción el cambio de estado, `id_usuario_atencion`, `fecha_atencion` y acción de auditoría. Requerirá extender el acceso al modelo de auditoría para aceptar conexión/transacción, sin cambiar la semántica de otras operaciones.
- **Fallos**: si la auditoría falla, hacer rollback de la atención, registrar error técnico sin datos sensibles y responder error controlado. En generación de alertas automáticas, el error no debe cambiar el resultado de acceso ni modificar el acceso fuente; log seguro y reconciliación futura.
- **Evidencia**: `auditoria.service.js` actual absorbe errores; el modelo de auditoría actual no recibe conexión transaccional. La implementación deberá diseñar una vía estricta específica para atención.

## R-09. Autorización

- Administrador: todas las operaciones S4.
- Recepcionista: consulta/atención de notificaciones de membresía únicamente.
- Alertas por acceso rechazado y reportes globales: solo administrador.
- Entrenadores y clientes: denegados del módulo administrativo.
- Aplicar `autenticar` y `autorizar(...)` en cada ruta del backend; la interfaz solo refleja permisos. No reutilizar sin ajuste los permisos más amplios de las APIs de origen.

## R-10. Entorno y evidencia

No se consultaron `gym_db` ni `gym_db_pruebas`, no se ejecutaron pruebas, no se creó una migración ni se instalaron dependencias. La configuración de producción no se infiere del repositorio; implementación, pruebas e inspección real de esquema requieren autorización/etapas posteriores.
