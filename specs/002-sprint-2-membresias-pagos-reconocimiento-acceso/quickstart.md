# Inicio rápido y validación — Sprint 2

Fecha: 2026-10-18. Guía de validación del Sprint 2 según `spec.md`, `data-model.md`
y `contracts/api-sprint2.md`. Es una guía de ejecución y comprobación; la
implementación detallada (migraciones, servicios, tests) pertenece a las tareas y a
la fase de implementación.

## Prerrequisitos

- Node.js 18+ y MySQL accesible localmente.
- Modelos faciales descargados en `frontend/public/modelos/`
  (`tinyFaceDetector`, `faceLandmark68Net`, `faceRecognitionNet`) — requisito de
  instalación de la tecnología facial (research.md R4).
- Cámara disponible para el navegador (`getUserMedia` exige HTTPS o `localhost`).
- **Regla de oro (FR-048)**: toda ejecución y toda prueba se hace contra el entorno
  de datos de prueba (`gym_db_pruebas`); la base `gym_db` en operación NO se modifica,
  NO se reinicia y sus migraciones ejecutadas NO se editan (constitución III).

## Configuración del entorno de pruebas

1. Revisar `backend/.env.test`: `DB_NAME='gym_db_pruebas'`, `JWT_SECRET` de prueba y
   `FACE_MATCH_THRESHOLD` documentado (0,5 por defecto).
2. Aplicar migraciones y semillas SOLO al entorno de prueba desde `backend/`:

   ```bash
   node --env-file=.env.test ../database/migrate.mjs
   ```

   > `npm run migrar` a secas carga `backend/.env` (base `gym_db` de operación) y
   > NO sirve para validar este sprint; con `--env-file=.env.test` el runner
   > prioriza las variables ya cargadas y aplica sobre `gym_db_pruebas` (FR-048).

   El runner (`database/migrate.mjs`) aplica en orden 001 → 006 y registra cada
   archivo en la tabla `migraciones` (nombre único). Tras el Sprint 2 debe quedar
   registrado `004_precio_acordado_membresias.sql`,
   `005_accesos_autorizacion_manual.sql` y `006_pagos_id_operacion.sql`.
3. Verificación rápida de la migración 004: consultar una membresía y confirmar que
   `precio_acordado` está poblado en TODAS las filas (backfill) y con `NOT NULL`.

## Ejecución

- Backend para la validación (puerto 3001, entorno `gym_db_pruebas`):
  `node --env-file=.env.test src/server.js` en `backend/`. `npm run dev` y
  `npm start` cargan `backend/.env` (base `gym_db`), que aún no recibe las
  migraciones de este sprint, y por eso NO se usan para validar (FR-048).
- Frontend (puerto 5173): `npm run dev` en `frontend/` (usa proxy de Vite hacia
  `/api`).

## Pruebas automatizadas

- Backend: `npm test` en `backend/` (Vitest + Supertest, usa `.env.test`).
- Frontend: `npm test` en `frontend/` (Vitest + jsdom + Testing Library).
- Todo verde antes de cerrar el sprint (SC-008, FR-046).

## Escenarios de validación extremo a extremo

Cada escenario referencia los contratos y el modelo; usa datos del entorno de prueba.

### V1 — Precio acordado congelado (US-S2-01/02, FR-005/007/018, SC-010)

1. Crear tipo «Mensual» con precio 800 (administrador) y asignarlo a un cliente:
   la membresía responde `precio_acordado: 800.00`.
2. Modificar el tipo a precio 1000 (administrador).
3. Verificar: la membresía existente sigue con `precio_acordado: 800.00` y su adeudo
   no cambia; un pago parcial de 300 deja adeudo 500, no 700.
4. Renovar la membresía: el nuevo periodo registra `precio_acordado: 1000.00`
   (precio vigente al renovar).
5. Verificar en auditoría los registros de asignación y renovación con actor.

### V2 — Adeudos por rol (US-S2-06, FR-019/020, E1)

1. Administrador: `GET /api/adeudos` devuelve la visión global.
2. Recepcionista: la misma llamada → 403; `GET /api/pagos` sí funciona.
3. Cliente: `GET /api/adeudos/mio` devuelve solo lo propio.

### V3 — Pago duplicado por operación (US-S2-05, FR-017)

1. Registrar un pago con `id_operacion: "cobro-001"` → 201.
2. Repetir el mismo `(id_cliente, id_operacion)` → 409 sin crear registro.
3. Registrar otro pago con `id_operacion` distinto → 201.

### V4 — Acceso del kiosco (US-S2-07/08, FR-027…033)

1. Cliente con rostro registrado y membresía vigente: `POST /api/acceso/intento`
   con su descriptor → `autorizado` + registro en `accesos` con `origen: "kiosco"`.
2. Cliente con membresía vencida (o estado `activa` con `fecha_fin` pasada) →
   `rechazado` con motivo claro.
3. Descriptor de un rostro no registrado → `rechazado` con motivo
   «rostro no identificado»; la interfaz del kiosco muestra el mensaje «No se pudo
   identificar su rostro, acuda a recepción». Comprobar que la respuesta NO incluye
   descriptor ni datos biométricos.
4. Revisar `GET /api/accesos`: los registros del kiosco tienen `origen: "kiosco"` e
   `id_usuario: null`.

### V5 — Autorización manual en recepción (US-S2-08, FR-030, SC-011)

1. Con sesión de recepcionista: `POST /api/acceso/manual` con
   `{ "id_cliente": N, "resultado": "autorizado" }` de un cliente con membresía
   vigente → 201 con `origen: "manual"` e `id_usuario` = responsable.
2. Mismo endpoint para un cliente sin membresía vigente → 409, sin registro
   autorizado.
3. Rechazo manual con motivo (identidad no verificable) → 201 con
   `motivo_rechazo` registrado.
4. Sin sesión → 401. Con sesión de entrenador o cliente → 403.
5. Verificar en `GET /api/accesos` que el registro manual muestra usuario
   responsable, fecha, hora, resultado y motivo, y que no hay biométricos.
6. Verificar auditoría de la autorización manual con actor (SC-009).

### V6 — Rediseño y pantalla de inicio (US-S2-10, FR-041…045)

1. Iniciar sesión con cada uno de los 4 roles: el menú lateral muestra SOLO las
   opciones de su rol (autorización real verificada en servidor, V2/V5).
2. La pantalla de inicio muestra bienvenida con el nombre del usuario y tarjetas con
   datos REALES (comparar contra `GET` correspondiente del rol).
3. Reprobar las operaciones existentes (login, usuarios, clientes, membresías,
   pagos, accesos): mismo comportamiento y mensajes (FR-043).
4. Reducir la ventana a ≤768 px: sin desbordamientos horizontales.
5. Activar «movimiento reducido» del sistema: las animaciones se desactivan o reducen.

### V7 — Privacidad biométrica y permisos (SC-003/004/005)

1. Inspeccionar respuestas de interfaz, logs y auditoría tras V4/V5: cero datos
   biométricos ni descriptores.
2. Confirmar que no existe operación de borrado de pagos, accesos ni auditoría.
3. Confirmar denegaciones por rol en servidor (no solo ocultas en la interfaz).

## Registro de evidencias

Documentar resultados en `specs/002-…/validacion-manual.md` (creado durante la
implementación), con fecha, entorno (`gym_db_pruebas`), comandos ejecutados y
resultado por escenario; ninguna prueba se ejecuta sobre `gym_db`.
