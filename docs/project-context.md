# Contexto general del proyecto

## 1. Identificación

- **Nombre:** Sistema de Gestión de Acceso y Control Financiero para Gimnasio con Reconocimiento Facial.
- **Asignatura:** Gestión de Proyectos.
- **Carrera:** Ingeniería en Sistemas Computacionales.
- **Docente:** Ing. Manuel Hernández Meléndez.
- **Fecha del acta de constitución:** 7 de octubre de 2026.
- **Equipo:** Equipo de desarrollo.
- **Tipo de proyecto:** Proyecto académico.

## 2. Propósito

El sistema busca centralizar la información y las operaciones principales de un gimnasio en una sola plataforma. Permitirá gestionar usuarios, clientes, membresías, pagos y accesos; utilizar reconocimiento facial como mecanismo de identificación; y ofrecer funciones de entrenamiento para asignar rutinas y consultar el progreso de los clientes.

El sistema debe reducir errores de captura, facilitar la consulta de información y apoyar la administración del gimnasio. No sustituye un sistema contable completo ni contempla facturación electrónica.

## 3. Alcance general del producto

El producto completo se organizará en tres sprints:

1. **Sprint 1 — Base del sistema, usuarios y clientes:** autenticación, autorización por rol, administración de usuarios y clientes.
2. **Sprint 2 — Membresías, pagos, reconocimiento facial y accesos:** catálogo y asignación de membresías con precio acordado, pagos con protección de duplicados, consulta de adeudos, registro facial, validación de acceso, autorización manual de ingreso en recepción, historial de intentos de acceso (ingresos; no se registran salidas), auditoría de operaciones relevantes, y pantalla de inicio con estadísticas reales y rediseño de la zona autenticada (ampliación de alcance aprobada).
3. **Sprint 3 — Entrenadores, rutinas y dashboard administrativo:** gestión de entrenadores, asignación de clientes, creación y consulta de rutinas, objetivos, progreso y dashboard administrativo.

Cada sprint debe construir sobre el trabajo anterior. No se debe volver a implementar una funcionalidad ya terminada sin una razón documentada.

## 4. Usuarios y roles

El sistema utilizará únicamente estos cuatro roles:

- **Administrador:** administra usuarios, roles y funciones generales del sistema; puede consultar información administrativa y dashboard.
- **Recepcionista:** realiza tareas operativas autorizadas, como gestionar clientes, asignar entrenadores cuando corresponda, consultar membresías y registrar pagos.
- **Entrenador:** consulta los clientes asignados, crea y modifica sus rutinas y registra objetivos y progreso de esos clientes.
- **Cliente:** consulta únicamente su propia información, membresía, pagos/adeudos, historial de accesos cuando esté disponible, rutina asignada y progreso.

La auditoría es una funcionalidad del sistema, no un rol adicional. No se debe crear un rol `auditor` salvo que se apruebe expresamente un cambio de alcance.

Los permisos se deben verificar en el backend. Ocultar un botón en el frontend no es suficiente para proteger una operación.

## 5. Reglas generales del negocio

- Todo usuario debe iniciar sesión para utilizar las funciones privadas.
- Los usuarios inactivos no pueden iniciar sesión.
- Los permisos dependen del rol del usuario autenticado.
- Un usuario con rol `cliente` debe estar vinculado a un registro de cliente.
- Puede existir un registro de cliente sin una cuenta de acceso, hasta que se le habilite una.
- Un cliente solo puede consultar sus propios datos.
- Un entrenador solo puede gestionar los clientes que tiene asignados.
- Una membresía debe tener una fecha de inicio, una fecha de fin y un estado coherente.
- El acceso físico se autoriza solo después de identificar al cliente y comprobar las reglas de acceso y la vigencia de su membresía.
- Los pagos y los accesos deben conservar un historial consultable.
- Las operaciones importantes deben registrarse en auditoría según las reglas de cada sprint.
- Las funciones de Sprint 3 no deben permitir que un entrenador consulte o modifique el progreso de clientes no asignados.

## 6. Arquitectura y tecnologías

### Frontend

- React
- JavaScript
- HTML
- CSS

El frontend presenta las pantallas y consume la API REST. No debe conectarse directamente a MySQL.

### Backend

- Node.js
- Express
- JavaScript
- API REST
- ES Modules mediante `import` y `export`

El backend valida entradas, aplica las reglas del negocio, autentica usuarios, autoriza operaciones y se comunica con MySQL.

El archivo `backend/package.json` debe incluir:

```json
{
  "type": "module"
}
```

No se utilizará CommonJS (`require()` o `module.exports`) en el backend.

### Base de datos

- MySQL

Los scripts, migraciones y semillas se organizarán en `database/`. Los cambios de esquema deben realizarse mediante migraciones versionadas y registradas, evitando modificaciones manuales no documentadas en la base de datos.

## 7. Estructura de carpetas esperada

La estructura puede ampliarse si existe una razón técnica documentada, pero debe mantener la separación de responsabilidades:

```text
frontend/
backend/
database/
docs/
  project-context.md
  reglas.md
  sprint-1.md
  sprint-2.md
  sprint-3.md
```

Los archivos de especificación de Spec Kit que se generen durante el proceso se guardarán en las ubicaciones que la herramienta establezca. Los archivos `docs/sprint-1.md`, `docs/sprint-2.md` y `docs/sprint-3.md` son documentos de entrada del proyecto, no sustituyen automáticamente a las especificaciones generadas por Spec Kit.

## 8. Seguridad

- Las contraseñas deben almacenarse como hashes con bcrypt, nunca como texto plano.
- La autenticación utilizará tokens JWT con expiración de 8 horas.
- Tras 5 intentos consecutivos fallidos de inicio de sesión, la cuenta debe bloquearse temporalmente durante 15 minutos, conforme a la regla de autenticación del proyecto.
- Los errores de inicio de sesión deben ser genéricos para no revelar si un correo existe.
- Los correos deben normalizarse antes de comparar o guardar: eliminar espacios al inicio/final y manejar las comparaciones sin distinguir mayúsculas/minúsculas.
- Las rutas privadas deben validar la sesión y los permisos en el backend.
- No se deben devolver contraseñas, hashes, secretos, tokens ni datos biométricos innecesarios en respuestas de la API.
- El acceso a información facial debe limitarse a las operaciones necesarias para identificación y control de acceso.
- La información de clientes solo debe mostrarse a usuarios autorizados.
- No se deben registrar contraseñas, tokens ni datos biométricos en los logs de aplicación.

## 9. Alcance excluido

El proyecto no contempla inicialmente:

- Aplicación móvil.
- Gestión de múltiples sucursales.
- Nómina.
- Inventarios.
- Contabilidad completa.
- Facturación electrónica.
- Pagos bancarios integrados.
- Tienda, ventas de productos o administración de inventario.
- Clases grupales, reservas de clases o control complejo de asistencia a sesiones.
- Vigilancia continua o seguimiento de clientes fuera de las operaciones explícitas de acceso.
- Registro público de cuentas.
- Recuperación de contraseña por correo, salvo aprobación posterior.
- Eliminación física de usuarios y clientes como operación normal.

## 10. Supuestos y restricciones

- El gimnasio dispone de una computadora para utilizar el sistema.
- MySQL se utilizará como base de datos.
- Los usuarios tienen conocimientos básicos para utilizar una aplicación web.
- Los clientes proporcionan los datos necesarios para su registro.
- Para las pruebas de reconocimiento facial se contará con una cámara o dispositivo compatible.
- El alcance inicial corresponde a una sola sucursal.
- La integración facial se implementará con una tecnología seleccionada y probada durante el desarrollo; no se debe asumir una biblioteca específica antes de evaluar su compatibilidad.

## 11. Criterios generales de éxito

El producto se considerará satisfactorio cuando las pruebas demuestren que:

- Los usuarios pueden iniciar y cerrar sesión conforme a su rol.
- Las operaciones restringidas son rechazadas por el backend.
- Se pueden administrar usuarios y clientes.
- Se pueden configurar y asignar membresías y registrar pagos.
- El sistema valida las condiciones de acceso y conserva el historial.
- La identificación facial funciona bajo las condiciones de prueba documentadas.
- Los entrenadores pueden gestionar las rutinas de clientes asignados.
- Los clientes pueden consultar únicamente su información autorizada.
- El dashboard presenta información agregada y respeta los permisos.
- Los datos se almacenan correctamente en MySQL y las operaciones importantes quedan auditadas.

## 12. Diseño visual de la aplicación

La interfaz utilizará una estética **Dark Fitness & Warm Orange Accent**: oscura, elegante, minimalista y sin saturación visual.

- Fondo principal: `#0a0b0e`.
- Fondo del formulario: `#0f1117`.
- Naranja de acento: `#f05a24`.
- Tipografía sans-serif limpia; se puede utilizar Plus Jakarta Sans si se incorpora correctamente al proyecto.
- Controles con bordes suaves, buen contraste, espaciado consistente y estados de foco visibles.
- Los botones principales pueden utilizar un acento naranja, esquinas redondeadas y una sombra naranja discreta.
- El diseño de inicio de sesión debe usar una composición dividida 50/50 en pantallas grandes: panel de presentación a la izquierda y formulario a la derecha.
- En pantallas de hasta 768 px, se oculta el panel de presentación y el formulario ocupa la pantalla.
- La tarjeta de presentación puede utilizar glassmorphism discreto, con transparencia y borde sutil.
- Las animaciones deben ser suaves y breves, sin dificultar la lectura ni retrasar la autenticación. Respetar `prefers-reduced-motion`.
- La estética visual no debe cambiar las rutas, validaciones, llamadas a la API, manejo de sesión ni lógica de autenticación existente.
