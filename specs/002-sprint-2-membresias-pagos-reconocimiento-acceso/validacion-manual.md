# Validación manual — Sprint 2

Registro de la validación V1–V7 de `quickstart.md` y de la prueba de humo de las
operaciones existentes (T067 / FR-043), conforme a la sección «Registro de
evidencias» del propio `quickstart.md`.

- **Fecha**: 2026-10-18.
- **Entorno de datos**: `gym_db_pruebas` (cargado con `backend/.env.test`). En
  ningún momento se ejecutó nada sobre `gym_db` (FR-048 / constitución III): el
  script de validación incluye una guardia que aborta si se resuelve otra base y
  las suites del backend usan `.env.test` por defecto.
- **Migraciones aplicadas en `gym_db_pruebas`**: 001 → 006, con
  `004_precio_acordado_membresias.sql`, `005_accesos_autorizacion_manual.sql` y
  `006_pagos_id_operacion.sql` registradas en la tabla `migraciones`. Comando seguro
  usado (desde `backend/`): `node --env-file=.env.test ../database/migrate.mjs`
  (`npm run migrar` a secas apunta a `gym_db` y NO se usó).
- **Modelos faciales del kiosco**: descargados en `frontend/public/modelos/` (7 archivos
  de pesos, ≈6,9 MB) según `LEEME.md`; no se versionan (`.gitignore` actualizado en T072
  para excluirlos junto con su archivo de instrucciones).
- **Umbral facial**: `FACE_MATCH_THRESHOLD=0.5` añadido a `backend/.env.test` (T001/T072).
- **Suites automatizadas (SC-008 / FR-046)**:
  - `npm test` en `backend/` → **221/221 pruebas en verde** (30 archivos).
  - `npm test` en `frontend/` → **14/14 pruebas en verde** (5 archivos).
- **Comando de la validación extremo a extremo a nivel de API** (desde
  `backend/`):

  ```bash
  node --env-file=.env.test validate-sprint2.mjs
  ```

  Resultado: **58/58 comprobaciones correctas** (todas con etiqueta `[OK]`).
  El script crea sus propios datos de prueba (usuarios `*-validacion@prueba.com`
  y `cliente-[a-d]@prueba.com` con contraseña `Prueba1234`), usa la aplicación
  real de Express en el mismo proceso (supertest) y NO abre puertos ni toca el
  backend en desarrollo.

**Método**: la validación de V1–V5 y V7 se ejecuta contra la API real (misma
capa que consume la interfaz); la capa de interfaz de V6 se evidencia con las
pruebas automatizadas del frontend. La revisión visual en navegador (menú por
rol, ≤768 px y movimiento reducido) queda **pendiente** porque el navegador de
escritorio de la sesión está desconectado.

## V1 — Precio acordado congelado (US-S2-01/02, FR-005/007/018, SC-010) — PASA

1. `POST /api/tipos-membresia` «Mensual Validación» precio 800 → 201.
2. `POST /api/membresias` con ese tipo → 201 y `precio_acordado: 800.00`.
3. `PUT /api/tipos-membresia/:id` precio 1000 → 200; `GET /api/membresias/:id`
   sigue respondiendo `precio_acordado: 800.00`.
4. `POST /api/pagos` parcial de 300 → `GET /api/adeudos` devuelve `adeudo: 500`
   (no 700).
5. `PUT /api/membresias/:id/renovar` → 201 con `precio_acordado: 1000.00` en el
   nuevo periodo.
6. `GET /api/auditoria` contiene `asignar_membresia` y `renovar_membresia` con
   `id_usuario` distinto de nulo (actor).

## V2 — Adeudos por rol (US-S2-06, FR-019/020, E1) — PASA

1. Administrador: `GET /api/adeudos` → 200 (visión global).
2. Recepcionista: `GET /api/adeudos` → 403; `GET /api/pagos` → 200.
3. Cliente: `GET /api/adeudos` → 403; `GET /api/adeudos/mio` → 200 con solo las
   membresías del propio cliente (2 filas, ninguna ajena).

## V3 — Pago duplicado por operación (US-S2-05, FR-017) — PASA

1. `POST /api/pagos` con `id_operacion: "cobro-001"` → 201.
2. Mismo `(id_cliente, id_operacion)` → 409 («Ya existe un pago registrado con
   ese id_operacion para este cliente»); el conteo posterior confirma que NO se
   creó un registro duplicado.
3. `id_operacion: "cobro-002"` → 201.

## V4 — Acceso del kiosco (US-S2-07/08, FR-027…033) — PASA

1. Cliente D con rostro registrado y membresía vigente:
   `POST /api/acceso/intento` → 200 `autorizado`; en `GET /api/accesos` el
   registro tiene `origen: "kiosco"` e `id_usuario: null`.
2. Cliente B con membresía vencida (inicio 2020-01-01) → `rechazado` con motivo
   «membresia vencida».
3. Cliente C identificado sin membresía → `rechazado` con motivo
   «sin membresia vigente».
4. Descriptor no registrado → `rechazado`, motivo «rostro no identificado» y
   `cliente: null` (la interfaz muestra el mensaje textual «No se pudo
   identificar su rostro, acuda a recepción», cubierto por
   `PuntoAcceso.test.jsx`); la respuesta no incluye descriptor ni datos
   biométricos.

## V5 — Autorización manual en recepción (US-S2-08, FR-030, SC-011) — PASA

1. Sesión de recepcionista: `POST /api/acceso/manual` de cliente vigente → 201
   con `origen: "manual"` e `id_usuario` = responsable de la sesión.
2. Cliente sin membresía vigente → 409 («La membresía no está vigente; no se
   autoriza el ingreso») y comprobado que NO quedó registro autorizado en
   `accesos`.
3. Rechazo manual con motivo «Identidad no verificable» → 201 con
   `motivo_rechazo` registrado.
4. Sin sesión → 401; con sesión de entrenador → 403; con sesión de cliente → 403.
5. `GET /api/accesos` muestra el registro manual con usuario responsable
   (`usuario_nombre`), fecha, hora, resultado y motivo; sin biométricos.
6. `GET /api/auditoria` contiene `autorizacion_manual` con actor (SC-009).

## V6 — Rediseño y pantalla de inicio (US-S2-10, FR-041…045) — PASA PARCIAL

1. Menú lateral por rol: evidencia automatizada en `Layout.test.jsx`
   (`test_menu_lateral_muestra_solo_las_opciones_del_rol`) y autorización real
   en servidor verificada en V2/V5 (403/401).
2. Pantalla de inicio con datos reales por rol: evidencia automatizada en
   `Inicio.test.jsx` (bienvenida y tarjetas con datos de los `GET` del rol).
3. Operaciones existentes sin regresión (FR-043): bloque «Humo» del script
   (`[OK]` en login correcto/fallido, usuarios, clientes, membresías, pagos y
   accesos) + suites completas en verde.
4. ≤768 px sin desbordamiento y 5. movimiento reducido: reglas CSS presentes y
   verificadas en `Login.test.jsx`; **revisión visual en navegador pendiente**
   (navegador de escritorio desconectado en la sesión).

## V7 — Privacidad biométrica y permisos (SC-003/004/005) — PASA

1. Escaneo de las 49 respuestas de la API capturadas durante la validación:
   cero apariciones de `descriptor_facial` u otros datos biométricos; auditoría
   y registros de acceso tampoco contienen descriptores (FR-024/FR-039).
2. `DELETE /api/pagos/1`, `DELETE /api/accesos/1` y `DELETE /api/auditoria/1`
   → 404: no existen operaciones de borrado (SC-005).
3. Denegaciones por rol en el servidor: 401 sin sesión y 403 para
   entrenador/cliente en `POST /api/acceso/manual`, y 403 para recepcionista y
   cliente en `GET /api/adeudos` (RN-001/FR-045), no solo ocultas en la
   interfaz.

## Incidencias detectadas durante la validación

- Ninguna funcional incumplió su criterio. Se corrigió únicamente una aserción
  del propio script (mensaje exacto del 401 de login: «correo o contraseña
  incorrectos»).
- **Pendiente de usuario**: verificación visual de V6 (menú por rol, ≤768 px y
  movimiento reducido) y de la prueba de humo de interfaz del T067 con el
  navegador de escritorio conectado.
