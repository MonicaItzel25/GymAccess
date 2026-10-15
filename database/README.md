# Base de datos — Sistema de Gestión para Gimnasio

Base de datos **MySQL local** (InnoDB, `utf8mb4`). Los archivos físicos de datos **no** se
suben al repositorio; solo los scripts SQL que la construyen.

## Conexión local

| Parámetro | Valor |
|-----------|-------|
| Host | `127.0.0.1` (exclusivamente local; sin nube ni servicios externos) |
| Puerto | `3306` |
| Servicio de Windows | `MySQL2610` |
| Cliente SQL | `C:\Program Files\MySQL\MySQL Server 26.10\bin\mysql.exe` |
| Credenciales | Solo en `backend/.env` (nunca en documentación ni en el repositorio) |

## Bases de datos

| Base | Uso |
|------|-----|
| `gym_db` | Producción/desarrollo con datos reales. **Conservar intacta**: 5 migraciones/semillas ya ejecutadas y sus datos. |
| `gym_db_pruebas` | Única base permitida para las suites automatizadas y para la validación. Tiene las mismas 9 tablas y las 5 migraciones registradas. |

## Estructura

```text
database/
├── migrations/   # Scripts SQL numerados que crean la estructura
├── seeds/        # Datos iniciales (usuario administrador, tipos de membresía)
├── migrate.mjs   # Ejecutor de migraciones (ES Modules)
└── README.md
```

## Convenciones

- Los scripts de `migrations/` van numerados (`001_...`, `002_...`) y se aplican en orden.
- **5 scripts ya están aplicados y registrados** en `gym_db.migraciones`
  (`001_crear_base_datos.sql`, `002_crear_tablas_sprint1.sql`,
  `003_crear_tablas_sprint2.sql`, `001_usuario_admin.sql`,
  `002_tipos_membresia_ejemplo.sql`). **Nunca se editan ni se reejecutan.**
- Cualquier cambio de estructura futuro se agrega como **nuevo** script numerado
  **desde `004_...` en adelante**; nunca se edita un script ya aplicado.
- El ejecutor usa ES Modules (`import`/`export`, sin `require`).

## Cómo ejecutar

1. Configurar las variables de entorno en `backend/.env` (`DB_HOST`, `DB_PORT`, `DB_USER`,
   `DB_PASSWORD`, `DB_NAME`). Ver `backend/.env.example`.
2. Ejecutar las migraciones (solo cuando se apruebe un cambio; **no durante el
   Sprint 1**):

   ```bash
   node database/migrate.mjs
   ```

3. La semilla `seeds/001_usuario_admin.sql` crea el primer administrador. Se aplica en la
   primera ejecución del script ejecutor.

> **?? AVISO (Sprint 1)**: durante la implementación del Sprint 1 **no se ejecutan
> migraciones ni el ejecutor contra `gym_db`** (prohibido crear `004_…`, editar las 5
> migraciones registradas o recrear bases). Todo el trabajo automatizado —suites
> `npm test` y validación— opera sobre **`gym_db_pruebas`**; la aplicación en desarrollo
> solo apunta a `gym_db` cuando se declare explícitamente en el entorno del proceso.
> **Las suites jamás deben ejecutarse sin `backend/.env.test`**: el script `npm test`
> de `backend/` carga ese archivo en el arranque de Node
> (`node --env-file=.env.test …`) y `tests/helpers/baseDatos.js` rechaza con error
> cualquier base distinta de `gym_db_pruebas` antes de tocar datos.

## Tablas

| Tabla | Estado en Sprint 1 |
|-------|--------------------|
| `usuarios` | Funcional (crear, consultar, modificar) |
| `clientes` | Funcional (crear, consultar, modificar) |
| `tipos_membresia` | Estructura inicial sin funcionalidad |
| `membresias` | Estructura inicial sin funcionalidad |
| `pagos` | Estructura inicial sin funcionalidad |
| `migraciones` | Control de scripts aplicados |
| `rostros`, `accesos`, `auditoria` | Existen desde `003_crear_tablas_sprint2.sql`; solo `auditoria` se usa en Sprint 1 (registro mínimo A11); el resto queda sin funcionalidad (Sprint 2) |
