// api/servicios.js
import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { servicioRules, uuidParam, validate } from '../middleware/validate.js';
import { logger } from '../lib/logger.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('servicios')
      .select('id, nombre, descripcion, precio, duracion_min, orden')
      .eq('activo', true)
      .order('orden');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    logger.error('GET /servicios:', err);
    res.status(500).json({ error: 'Error al obtener servicios' });
  }
});

router.post('/', requireAuth, requireAdmin, servicioRules, validate, async (req, res) => {
  try {
    const { nombre, descripcion, precio, duracion_min } = req.body;
    const { data, error } = await supabaseAdmin
      .from('servicios').insert({ nombre, descripcion, precio, duracion_min }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    logger.error('POST /servicios:', err);
    res.status(500).json({ error: 'Error al crear servicio' });
  }
});

router.patch('/:id', requireAuth, requireAdmin, uuidParam('id'), validate, async (req, res) => {
  try {
    const updates = { ...req.body }; delete updates.id;
    const { data, error } = await supabaseAdmin
      .from('servicios').update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar servicio' });
  }
});

router.delete('/:id', requireAuth, requireAdmin, uuidParam('id'), validate, async (req, res) => {
  try {
    await supabaseAdmin.from('servicios').update({ activo: false }).eq('id', req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar servicio' });
  }
});

export default router;
