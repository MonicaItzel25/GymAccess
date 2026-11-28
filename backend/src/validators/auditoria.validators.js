// validators/auditoria.validators.js
// Filtros de la consulta de auditoría (US-S3-09, contrato §9): todos son
// opcionales. `desde` y `hasta` admiten fecha o fecha y hora (compatibilidad
// con el Sprint 2) y no pueden estar invertidos. ES Modules.

import { query } from 'express-validator';

const MENSAJE_PERIODO = 'El periodo de fechas es inválido';
const FORMATO = /^[1-9]\d{3}-\d{2}-\d{2}([ T]\d{2}:\d{2}(:\d{2})?)?$/;

/** Comprueba formato y existencia real de la fecha y, si la hay, de la hora. */
function esFechaValida(valor) {
  if (!FORMATO.test(valor)) return false;
  const [fecha, hora] = valor.split(/[ T]/);
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const real = new Date(Date.UTC(anio, mes - 1, dia));
  if (real.getUTCMonth() !== mes - 1 || real.getUTCDate() !== dia) return false;
  if (!hora) return true;
  const [horas, minutos, segundos = 0] = hora.split(':').map(Number);
  return horas < 24 && minutos < 60 && segundos < 60;
}

/** Lleva una fecha a la forma comparable usada por la consulta. */
function comparable(valor, extremo) {
  const texto = valor.replace('T', ' ');
  if (texto.length === 10) return `${texto} ${extremo}`;
  return texto.length === 16 ? `${texto}:00` : texto;
}

const fechaOpcional = (campo) =>
  query(campo)
    .optional({ values: 'falsy' })
    .isString()
    .withMessage(MENSAJE_PERIODO)
    .bail()
    .custom(esFechaValida)
    .withMessage(MENSAJE_PERIODO);

const textoOpcional = (campo, maximo, mensaje) =>
  query(campo)
    .optional({ values: 'falsy' })
    .isString()
    .withMessage(mensaje)
    .bail()
    .isLength({ max: maximo })
    .withMessage(mensaje);

export const reglasConsultarAuditoria = [
  fechaOpcional('desde'),
  fechaOpcional('hasta'),
  query('hasta').custom((hasta, { req }) => {
    const { desde } = req.query;
    // Los formatos erróneos ya se rechazan en las reglas anteriores.
    if (typeof desde !== 'string' || typeof hasta !== 'string') return true;
    if (!esFechaValida(desde) || !esFechaValida(hasta)) return true;
    if (comparable(desde, '00:00:00') > comparable(hasta, '23:59:59')) {
      throw new Error(MENSAJE_PERIODO);
    }
    return true;
  }),
  textoOpcional('modulo', 50, 'El filtro de módulo no es válido'),
  textoOpcional('actor', 100, 'El filtro de actor no es válido'),
];
