// utils/errorServicio.js
// Error de negocio con código HTTP asociado. Permite que los servicios
// rechacen operaciones (409 duplicados, 404 inexistentes, 400 reglas) sin
// acoplarse a Express. ES Modules.

export class ErrorServicio extends Error {
  constructor(mensaje, statusCode = 400) {
    super(mensaje);
    this.name = 'ErrorServicio';
    this.statusCode = statusCode;
  }
}
