# Reglas y constitución técnica del proyecto

Estas reglas son obligatorias para todo el desarrollo. Si una historia de usuario parece contradecirlas, se debe señalar la contradicción y solicitar una decisión antes de implementarla.

## I. Arquitectura

1. Mantener separados `frontend/`, `backend/` y `database/`.
2. El frontend utilizará React y JavaScript.
3. El backend utilizará Node.js, Express y JavaScript.
4. MySQL será la base de datos del proyecto.
5. El frontend nunca se conectará directamente a MySQL; toda comunicación pasará por la API REST.
6. El backend será responsable de validar datos, aplicar reglas de negocio, autenticar y autorizar solicitudes.
7. No introducir nuevas tecnologías o servicios externos sin justificar su necesidad y documentar el cambio.

## II. Módulos de JavaScript

1. El backend utilizará exclusivamente ES Modules.
2. Usar `import` y `export`.
3. No usar `require()` ni `module.exports`.
4. `backend/package.json` debe incluir `"type": "module"`.
5. Respetar la estructura modular existente y evitar duplicar lógica de negocio en rutas diferentes.

## III. Base de datos y migraciones

1. MySQL es la fuente de persistencia del sistema.
2. Los cambios de estructura deben implementarse mediante scripts de migración versionados dentro de `database/`.
3. Cada migración debe tener un nombre claro, orden definido y ser registrada en la tabla de migraciones del sistema.
4. No modificar una migración que ya haya sido ejecutada en un entorno compartido; crear una nueva migración correctiva.
5. Usar claves primarias, claves foráneas, restricciones únicas y restricciones `NOT NULL` cuando correspondan al modelo.
6. Definir índices para las consultas frecuentes cuando sea necesario.
7. No almacenar información derivada que pueda obtenerse de manera fiable mediante consultas, salvo que exista una razón documentada.
8. Evitar borrar físicamente usuarios, clientes, pagos, accesos o registros de auditoría que deban conservarse. Preferir estados o mecanismos de conservación definidos por el modelo.
9. Las operaciones relacionadas que deban completarse juntas deben utilizar transacciones.
10. Los datos de prueba deben estar identificados y no deben confundirse con datos reales.

## IV. Autenticación y credenciales

1. Guardar contraseñas únicamente mediante hashes seguros con bcrypt.
2. Nunca devolver hashes de contraseña en respuestas de la API.
3. Usar JWT con expiración de 8 horas.
4. Bloquear temporalmente el inicio de sesión durante 15 minutos después de 5 intentos consecutivos fallidos.
5. Mostrar un mensaje genérico ante credenciales incorrectas: `correo o contraseña incorrectos`.
6. Informar que una cuenta está inactiva únicamente cuando esa sea la regla definida para ese caso y sin revelar información innecesaria.
7. Normalizar el correo eliminando espacios al inicio y al final y realizando comparaciones sin distinguir mayúsculas/minúsculas.
8. No permitir registro público de cuentas ni recuperación por correo dentro del alcance actual.
9. No permitir que usuarios inactivos inicien sesión.
10. La sesión debe requerir autenticación nuevamente cuando el token expire.

## V. Roles y autorización

Los únicos roles iniciales son:

- `administrador`
- `recepcionista`
- `entrenador`
- `cliente`

Reglas:

1. El backend debe comprobar el rol y, cuando corresponda, la relación del usuario con el recurso solicitado.
2. El administrador puede gestionar usuarios y roles, sin poder desactivar ni cambiar el rol del único administrador activo.
3. El recepcionista puede operar sobre clientes, membresías y pagos dentro de los permisos definidos para cada sprint; no puede administrar roles ni editar rutinas o progresos de entrenamiento.
4. El entrenador puede gestionar rutinas, objetivos y progreso únicamente de los clientes que tenga asignados.
5. El cliente solo puede consultar su propia información y no puede modificarla desde el portal de consulta.
6. El cliente con cuenta debe estar vinculado a un registro de `clientes`.
7. No crear un rol `auditor`: auditoría es una funcionalidad interna del sistema.
8. No confiar en el rol enviado por el frontend; obtenerlo de la sesión validada y de la información persistida.

## VI. Validación y manejo de errores

1. Validar los datos recibidos en el backend, aunque exista validación en el frontend.
2. Rechazar identificadores inexistentes y relaciones inválidas.
3. Usar códigos HTTP apropiados y mensajes comprensibles, sin exponer consultas SQL, trazas, secretos o detalles internos.
4. No aceptar directamente del cliente campos que permitan elevar privilegios, como rol, estado privilegiado o identificadores de propietario, sin autorización y validación explícitas.
5. Evitar inyección SQL mediante consultas parametrizadas o mecanismos equivalentes seguros.
6. Manejar errores de forma consistente y registrar información técnica sin incluir contraseñas, tokens o datos biométricos.

## VII. Privacidad y reconocimiento facial

1. Tratar la información facial como información sensible y limitar su acceso.
2. Solicitar y documentar la autorización correspondiente antes de registrar información facial para las pruebas o el uso previsto.
3. Almacenar solo la información necesaria para el funcionamiento definido y protegerla contra accesos no autorizados.
4. No exponer imágenes, plantillas o datos biométricos en respuestas generales ni en logs.
5. Si no es posible identificar de forma confiable al cliente, no autorizar el acceso automáticamente; utilizar el procedimiento alternativo definido para la demostración.
6. La decisión de acceso debe comprobar también la vigencia y el estado de la membresía.
7. Registrar el resultado de las verificaciones de acceso sin guardar información biométrica innecesaria.
8. Documentar las condiciones y limitaciones de las pruebas de reconocimiento facial; no afirmar una precisión absoluta.

## VIII. Membresías, pagos y accesos

1. Los tipos de membresía deben tener información clara de nombre, duración, precio y estado.
2. Una membresía debe relacionarse con un cliente y un tipo de membresía válido.
3. El estado de vigencia debe determinarse usando las fechas y reglas del negocio, no solamente por el texto de un estado guardado.
4. Los pagos deben relacionarse con un cliente y, cuando corresponda, con una membresía.
5. No registrar pagos ficticios como si fueran transacciones reales.
6. No permitir que una membresía vencida o inactiva autorice el acceso.
7. Los accesos aceptados y rechazados deben quedar registrados conforme al modelo de datos.
8. La validación de acceso, la consulta de membresía y el registro del resultado deben ejecutarse de manera coherente para evitar decisiones contradictorias.

## IX. Entrenadores y rutinas

1. Cada entrenador debe estar asociado a un usuario válido con rol `entrenador`.
2. Un cliente tendrá como máximo un entrenador principal asignado durante un periodo activo, de acuerdo con la especificación del Sprint 3.
3. Las rutinas deben asociarse a un cliente y a un entrenador válidos.
4. El entrenador solo puede crear, modificar o consultar rutinas de clientes asignados.
5. El cliente solo puede consultar sus propias rutinas y su propio progreso.
6. Los cambios de rutina, objetivos y progreso deben conservar historial suficiente para comparar la evolución.
7. Los campos de ejercicios, series, repeticiones, peso recomendado, descanso e instrucciones deben validarse.
8. El sistema no debe presentar información de seguimiento deportivo como diagnóstico médico.

## X. Auditoría y registros

1. Registrar las acciones relevantes indicadas en las especificaciones: cambios de usuarios, asignaciones, operaciones de membresías y pagos, resultados de acceso y cambios de rutinas/progreso.
2. Cuando corresponda, registrar actor, acción, fecha/hora, entidad afectada y resultado.
3. No guardar contraseñas, JWT, secretos ni información biométrica en auditoría.
4. Los registros de auditoría no deben ser editables por los roles operativos mediante las funciones normales de la aplicación.

## XI. Interfaz y experiencia de usuario

1. Mostrar las opciones disponibles según el rol.
2. La ocultación de opciones es solo una ayuda de interfaz; la autorización real debe hacerse en backend.
3. Presentar estados vacíos, errores de validación y confirmaciones de operaciones importantes.
4. Evitar duplicar pantallas o componentes que puedan reutilizarse.
5. Mantener nombres de campos y conceptos consistentes entre interfaz, API y documentación.

## XII. Pruebas y proceso de desarrollo

1. Antes de implementar un sprint, leer `docs/project-context.md`, este archivo y el documento de entrada del sprint correspondiente.
2. No ampliar el alcance del sprint sin documentar y aprobar el cambio.
3. Implementar únicamente las tareas del sprint activo, respetando las dependencias de sprints anteriores.
4. Probar los casos exitosos, errores de validación, permisos y accesos no autorizados.
5. No afirmar que una función está terminada si no se ha probado.
6. Mantener la documentación alineada con el comportamiento implementado.
7. No sobrescribir ni eliminar trabajo existente sin revisar su propósito y sus dependencias.
8. Si se detecta una contradicción entre documentos, detener la decisión afectada y señalarla antes de elegir una interpretación.

## XIII. Alcance excluido

No implementar sin aprobación explícita:

- Aplicación móvil o múltiples sucursales.
- Nómina, inventario, contabilidad completa o facturación electrónica.
- Pagos bancarios integrados.
- Registro público de cuentas o recuperación de contraseña por correo.
- Clases grupales, reservación de clases o asistencia compleja a sesiones.
- Vigilancia continua o seguimiento fuera de las operaciones explícitas del sistema.

## XIV. Diseño visual, responsividad y animaciones

1. La pantalla de inicio de sesión seguirá una estética Dark Fitness & Warm Orange Accent, minimalista y de bajo ruido visual.
2. En escritorio, la pantalla de inicio de sesión usará una distribución dividida 50/50: hero a la izquierda y formulario a la derecha.
3. El contenedor de login ocupará como mínimo el alto de la ventana y evitará desbordamientos horizontales.
4. La paleta base será fondo `#0a0b0e`, fondo del formulario `#0f1117` y naranja de acento `#f05a24`.
5. El panel izquierdo incluirá marca, título principal, tarjeta compacta de reconocimiento facial con estado visual y puntos indicadores decorativos. No debe presentar información ficticia como si proviniera de una lectura real del backend; la tarjeta será una demostración visual.
6. El formulario incluirá correo, contraseña, control para mostrar/ocultar contraseña, botón principal con flecha y enlace de soporte/contacto.
7. En pantallas de hasta 768 px se ocultará el panel hero y el formulario se mostrará centrado a pantalla completa.
8. Los inputs deben tener etiquetas accesibles, estados de foco visibles, mensajes de validación legibles y contraste suficiente.
9. Las animaciones deben ser sutiles y breves (por ejemplo, aparición progresiva del formulario, movimiento leve de la tarjeta o transición del botón). No animar de forma continua elementos que distraigan.
10. Respetar la preferencia del sistema `prefers-reduced-motion` y desactivar o reducir las animaciones cuando esté activa.
11. No utilizar animaciones para ocultar errores ni para retrasar el envío del formulario.
12. Rediseñar el frontend no autoriza a modificar la autenticación, las llamadas al backend, los nombres de campos esperados, el almacenamiento de sesión, los tokens ni el manejo de errores. La lógica existente debe mantenerse operativa.
13. No mostrar el estado “Acceso autorizado” como resultado real de reconocimiento facial durante el login si no proviene de una operación real. En el hero se usa exclusivamente como elemento demostrativo del diseño.
