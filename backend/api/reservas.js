// api/reservas.js
import { Router } from 'express';
import { addMinutes, format, parseISO } from 'date-fns';
import { supabaseAdmin, uploadFile, deleteFile } from '../lib/supabase.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { reservaRules, abonoRules, uuidParam, disponibilidadQuery, validate } from '../middleware/validate.js';
import { uploadComprobante } from '../lib/multer.js';
import { logger } from '../lib/logger.js';

const router = Router();

// ── GET /api/reservas/disponibilidad ─────────────────────────
// Retorna los slots disponibles de un barbero en una fecha
router.get('/disponibilidad', disponibilidadQuery, validate, async (req, res) => {
  try {
    const { barbero_id, fecha, duracion = 30 } = req.query;

    const { data, error } = await supabaseAdmin.rpc('horas_disponibles', {
      p_barbero_id: barbero_id,
      p_fecha:      fecha,
      p_duracion:   parseInt(duracion),
    });

    if (error) throw error;
    res.json({ slots: data });
  } catch (err) {
    logger.error('GET /disponibilidad:', err);
    res.status(500).json({ error: 'Error al obtener disponibilidad' });
  }
});

// ── GET /api/reservas ─────────────────────────────────────────
// Lista reservas (admin: todas; barbero: solo las suyas)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { fecha, barbero_id, estado, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let q = supabaseAdmin
      .from('reservas')
      .select(`
        id, cliente_nombre, cliente_tel, cliente_email,
        fecha, hora_inicio, hora_fin,
        estado, abono_estado, abono_metodo, abono_monto, comprobante_url,
        notas, created_at,
        barbero:barbero_id ( id, nombre, color ),
        servicio:servicio_id ( id, nombre, precio, duracion_min )
      `, { count: 'exact' })
      .order('fecha', { ascending: true })
      .order('hora_inicio', { ascending: true })
      .range(offset, offset + parseInt(limit) - 1);

    // Barbero solo ve sus propias citas
    if (req.user.rol === 'barbero') {
      q = q.eq('barbero_id', req.user.barbero_id);
    } else if (barbero_id) {
      q = q.eq('barbero_id', barbero_id);
    }

    if (fecha)   q = q.eq('fecha', fecha);
    if (estado)  q = q.eq('estado', estado);

    const { data, error, count } = await q;
    if (error) throw error;

    res.json({ data, total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    logger.error('GET /reservas:', err);
    res.status(500).json({ error: 'Error al obtener reservas' });
  }
});

// ── GET /api/reservas/:id ─────────────────────────────────────
router.get('/:id', requireAuth, uuidParam('id'), validate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('reservas')
      .select(`
        *, 
        barbero:barbero_id ( id, nombre, color, especialidad ),
        servicio:servicio_id ( id, nombre, precio, duracion_min )
      `)
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Reserva no encontrada' });
    res.json(data);
  } catch (err) {
    logger.error('GET /reservas/:id:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// ── POST /api/reservas ────────────────────────────────────────
// Crear reserva (público — clientes)
router.post('/', reservaRules, validate, async (req, res) => {
  try {
    const {
      cliente_nombre, cliente_tel, cliente_email,
      barbero_id, servicio_id, fecha, hora_inicio, notas,
    } = req.body;

    // Calcular hora_fin según duración del servicio
    const { data: servicio, error: svcErr } = await supabaseAdmin
      .from('servicios')
      .select('duracion_min, nombre, precio')
      .eq('id', servicio_id)
      .single();

    if (svcErr || !servicio)
      return res.status(404).json({ error: 'Servicio no encontrado' });

    const inicio = parseISO(`${fecha}T${hora_inicio}`);
    const fin    = addMinutes(inicio, servicio.duracion_min);
    const hora_fin = format(fin, 'HH:mm');

    // Verificar disponibilidad
    const { data: conflicto } = await supabaseAdmin
      .from('reservas')
      .select('id')
      .eq('barbero_id', barbero_id)
      .eq('fecha', fecha)
      .not('estado', 'in', '("cancelado","no_show")')
      .lt('hora_inicio', hora_fin)
      .gt('hora_fin', hora_inicio)
      .maybeSingle();

    if (conflicto)
      return res.status(409).json({ error: 'Ese horario ya no está disponible' });

    const { data, error } = await supabaseAdmin
      .from('reservas')
      .insert({
        cliente_nombre: cliente_nombre.trim(),
        cliente_tel:    cliente_tel.trim(),
        cliente_email:  cliente_email?.trim() || null,
        barbero_id,
        servicio_id,
        fecha,
        hora_inicio,
        hora_fin,
        notas: notas?.trim() || null,
        estado: 'pendiente',
        abono_estado: 'sin_abono',
      })
      .select(`
        id, cliente_nombre, fecha, hora_inicio,
        barbero:barbero_id ( nombre ),
        servicio:servicio_id ( nombre, precio )
      `)
      .single();

    if (error) {
      // Exclusion constraint = conflicto de horario
      if (error.code === '23P01')
        return res.status(409).json({ error: 'Horario no disponible' });
      throw error;
    }

    logger.info(`Nueva reserva: ${data.id} — ${cliente_nombre}`);
    res.status(201).json(data);
  } catch (err) {
    logger.error('POST /reservas:', err);
    res.status(500).json({ error: 'Error al crear reserva' });
  }
});

// ── PATCH /api/reservas/:id/estado ───────────────────────────
// Cambiar estado (auth)
router.patch('/:id/estado', requireAuth, uuidParam('id'), validate, async (req, res) => {
  try {
    const { estado } = req.body;
    const ESTADOS_VALIDOS = ['pendiente','en_curso','completado','cancelado','no_show'];

    if (!ESTADOS_VALIDOS.includes(estado))
      return res.status(400).json({ error: 'Estado inválido' });

    const { data, error } = await supabaseAdmin
      .from('reservas')
      .update({ estado, gestionado_por: req.user.id })
      .eq('id', req.params.id)
      .select('id, estado')
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    logger.error('PATCH /estado:', err);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

// ── POST /api/reservas/abono ──────────────────────────────────
// Cliente sube comprobante de abono
router.post('/abono', uploadComprobante.single('comprobante'), abonoRules, validate, async (req, res) => {
  try {
    const { reserva_id, metodo, monto } = req.body;
    const file = req.file;

    if (!file)
      return res.status(400).json({ error: 'Comprobante requerido' });

    // Validar que la reserva existe y no tiene abono aún
    const { data: reserva, error: rErr } = await supabaseAdmin
      .from('reservas')
      .select('id, abono_estado, cliente_nombre')
      .eq('id', reserva_id)
      .single();

    if (rErr || !reserva)
      return res.status(404).json({ error: 'Reserva no encontrada' });

    if (reserva.abono_estado === 'aprobado')
      return res.status(409).json({ error: 'Esta reserva ya tiene abono aprobado' });

    // Subir a Supabase Storage
    const ext = file.originalname.split('.').pop();
    const storagePath = `comprobantes/${reserva_id}/${Date.now()}.${ext}`;

    const { key, url } = await uploadFile(
      'comprobantes',
      storagePath,
      file.buffer,
      file.mimetype,
    );

    // Actualizar reserva
    const { data, error } = await supabaseAdmin
      .from('reservas')
      .update({
        abono_estado:    'pendiente',
        abono_metodo:    metodo,
        abono_monto:     parseInt(monto),
        comprobante_url: url,
        comprobante_key: key,
      })
      .eq('id', reserva_id)
      .select('id, abono_estado')
      .single();

    if (error) throw error;

    logger.info(`Comprobante subido: ${reserva_id} — ${metodo} ${monto}`);
    res.json({ message: 'Comprobante recibido, pendiente de revisión', data });
  } catch (err) {
    logger.error('POST /abono:', err);
    res.status(500).json({ error: 'Error al procesar comprobante' });
  }
});

// ── PATCH /api/reservas/:id/abono ────────────────────────────
// Admin aprueba o rechaza abono
router.patch('/:id/abono', requireAuth, requireAdmin, uuidParam('id'), validate, async (req, res) => {
  try {
    const { accion } = req.body; // 'aprobar' | 'rechazar'
    if (!['aprobar','rechazar'].includes(accion))
      return res.status(400).json({ error: "accion debe ser 'aprobar' o 'rechazar'" });

    const nuevoEstado = accion === 'aprobar' ? 'aprobado' : 'rechazado';

    const { data, error } = await supabaseAdmin
      .from('reservas')
      .update({ abono_estado: nuevoEstado, gestionado_por: req.user.id })
      .eq('id', req.params.id)
      .select('id, abono_estado, cliente_nombre, cliente_tel')
      .single();

    if (error) throw error;
    logger.info(`Abono ${nuevoEstado}: reserva ${req.params.id}`);
    res.json(data);
  } catch (err) {
    logger.error('PATCH /abono:', err);
    res.status(500).json({ error: 'Error al procesar abono' });
  }
});

// ── DELETE /api/reservas/:id ──────────────────────────────────
router.delete('/:id', requireAuth, requireAdmin, uuidParam('id'), validate, async (req, res) => {
  try {
    // Eliminar comprobante de Storage si existe
    const { data: r } = await supabaseAdmin
      .from('reservas')
      .select('comprobante_key')
      .eq('id', req.params.id)
      .single();

    if (r?.comprobante_key) {
      await deleteFile('comprobantes', r.comprobante_key).catch(() => {});
    }

    const { error } = await supabaseAdmin
      .from('reservas')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.status(204).end();
  } catch (err) {
    logger.error('DELETE /reservas:', err);
    res.status(500).json({ error: 'Error al eliminar reserva' });
  }
});

export default router;
