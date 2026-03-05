// middleware/validate.js
import { validationResult, body, param, query } from 'express-validator';

// Ejecuta las validaciones y retorna 422 si hay errores
export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ errors: errors.array() });
  next();
}

// ── Reservas ──────────────────────────────────────────────────
export const reservaRules = [
  body('cliente_nombre').trim().notEmpty().isLength({ min: 2, max: 100 }),
  body('cliente_tel').trim().notEmpty().matches(/^[0-9]{7,15}$/),
  body('cliente_email').optional().isEmail().normalizeEmail(),
  body('barbero_id').isUUID(),
  body('servicio_id').isUUID(),
  body('fecha').isDate({ format: 'YYYY-MM-DD' }),
  body('hora_inicio').matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
  body('notas').optional().trim().isLength({ max: 500 }),
];

// ── Abono / comprobante ───────────────────────────────────────
export const abonoRules = [
  body('reserva_id').isUUID(),
  body('metodo').isIn(['nequi', 'daviplata', 'banco']),
  body('monto').isInt({ min: 1000 }),
];

// ── Barberos ──────────────────────────────────────────────────
export const barberoRules = [
  body('nombre').trim().notEmpty().isLength({ min: 2, max: 100 }),
  body('especialidad').trim().notEmpty().isLength({ max: 150 }),
  body('bio').optional().trim().isLength({ max: 500 }),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/),
  body('pin').isLength({ min: 4, max: 4 }).matches(/^\d{4}$/),
  body('horario_inicio').matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
  body('horario_fin').matches(/^([01]\d|2[0-3]):([0-5]\d)$/),
];

// ── Servicios ─────────────────────────────────────────────────
export const servicioRules = [
  body('nombre').trim().notEmpty().isLength({ max: 100 }),
  body('precio').isInt({ min: 1000 }),
  body('duracion_min').isInt({ min: 15, max: 240 }),
];

// ── UUID params ───────────────────────────────────────────────
export const uuidParam = (name) => param(name).isUUID();

// ── Query de disponibilidad ───────────────────────────────────
export const disponibilidadQuery = [
  query('barbero_id').isUUID(),
  query('fecha').isDate({ format: 'YYYY-MM-DD' }),
  query('duracion').optional().isInt({ min: 15, max: 240 }),
];
