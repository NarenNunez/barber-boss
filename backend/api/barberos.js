// api/barberos.js
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { supabaseAdmin, uploadFile, deleteFile } from '../lib/supabase.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { barberoRules, uuidParam, validate } from '../middleware/validate.js';
import { uploadFoto } from '../lib/multer.js';
import { logger } from '../lib/logger.js';

const router = Router();

// ── GET /api/barberos ─────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('barberos')
      .select('id, nombre, especialidad, bio, foto_url, color, horario_inicio, horario_fin, orden')
      .eq('activo', true)
      .order('orden');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    logger.error('GET /barberos:', err);
    res.status(500).json({ error: 'Error al obtener barberos' });
  }
});

// ── GET /api/barberos/:id ─────────────────────────────────────
router.get('/:id', uuidParam('id'), validate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('barberos')
      .select(`
        id, nombre, especialidad, bio, foto_url, color, horario_inicio, horario_fin,
        galeria:galeria_barbero ( id, url, titulo, orden )
      `)
      .eq('id', req.params.id)
      .eq('activo', true)
      .single();
    if (error || !data) return res.status(404).json({ error: 'Barbero no encontrado' });
    res.json(data);
  } catch (err) {
    logger.error('GET /barberos/:id:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// ── POST /api/barberos ────────────────────────────────────────
router.post('/', requireAuth, requireAdmin, barberoRules, validate, async (req, res) => {
  try {
    const { nombre, especialidad, bio, color, pin, horario_inicio, horario_fin } = req.body;
    const pinHash = await bcrypt.hash(String(pin), 10);

    const { data, error } = await supabaseAdmin
      .from('barberos')
      .insert({ nombre, especialidad, bio, color, pin: pinHash, horario_inicio, horario_fin })
      .select()
      .single();
    if (error) throw error;

    logger.info(`Barbero creado: ${data.id} — ${nombre}`);
    res.status(201).json(data);
  } catch (err) {
    logger.error('POST /barberos:', err);
    res.status(500).json({ error: 'Error al crear barbero' });
  }
});

// ── PATCH /api/barberos/:id ───────────────────────────────────
router.patch('/:id', requireAuth, requireAdmin, uuidParam('id'), validate, async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.pin) {
      updates.pin = await bcrypt.hash(String(updates.pin), 10);
    }
    delete updates.id;

    const { data, error } = await supabaseAdmin
      .from('barberos')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    logger.error('PATCH /barberos/:id:', err);
    res.status(500).json({ error: 'Error al actualizar barbero' });
  }
});

// ── POST /api/barberos/:id/foto ───────────────────────────────
router.post('/:id/foto', requireAuth, requireAdmin, uuidParam('id'), validate,
  uploadFoto.single('foto'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'Foto requerida' });

    // Eliminar foto anterior si existe
    const { data: barb } = await supabaseAdmin
      .from('barberos').select('foto_url').eq('id', req.params.id).single();

    if (barb?.foto_url) {
      const key = barb.foto_url.split('/').slice(-2).join('/');
      await deleteFile('fotos-barberos', key).catch(() => {});
    }

    const ext = file.originalname.split('.').pop();
    const path = `barberos/${req.params.id}/foto.${ext}`;
    const { url } = await uploadFile('fotos-barberos', path, file.buffer, file.mimetype);

    await supabaseAdmin.from('barberos').update({ foto_url: url }).eq('id', req.params.id);
    res.json({ foto_url: url });
  } catch (err) {
    logger.error('POST /foto:', err);
    res.status(500).json({ error: 'Error al subir foto' });
  }
});

// ── DELETE /api/barberos/:id ──────────────────────────────────
router.delete('/:id', requireAuth, requireAdmin, uuidParam('id'), validate, async (req, res) => {
  try {
    // Soft delete
    await supabaseAdmin.from('barberos').update({ activo: false }).eq('id', req.params.id);
    res.status(204).end();
  } catch (err) {
    logger.error('DELETE /barberos:', err);
    res.status(500).json({ error: 'Error al eliminar barbero' });
  }
});

export default router;
