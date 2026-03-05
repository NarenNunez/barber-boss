// api/stats.js
import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { logger } from '../lib/logger.js';
import { generarPDF, generarExcel } from '../lib/reportes.js';

const router = Router();

// ── GET /api/stats/dashboard ──────────────────────────────────
router.get('/dashboard', requireAuth, requireAdmin, async (req, res) => {
  try {
    const hoy = new Date().toISOString().split('T')[0];

    // Resumen de hoy (vista materializada)
    const { data: resumenHoy, error: e1 } = await supabaseAdmin
      .from('resumen_hoy')
      .select('*');

    // KPIs del día
    const { data: kpiHoy, error: e2 } = await supabaseAdmin
      .from('reservas')
      .select('estado, servicio:servicio_id(precio)')
      .eq('fecha', hoy);

    if (e1 || e2) throw e1 || e2;

    const completadas = kpiHoy.filter(r => r.estado === 'completado');
    const ingresosHoy = completadas.reduce((a, r) => a + (r.servicio?.precio || 0), 0);

    // Ingresos últimos 7 días
    const semanaAtras = new Date();
    semanaAtras.setDate(semanaAtras.getDate() - 6);
    const { data: semana } = await supabaseAdmin
      .from('reservas')
      .select('fecha, estado, servicio:servicio_id(precio)')
      .eq('estado', 'completado')
      .gte('fecha', semanaAtras.toISOString().split('T')[0])
      .lte('fecha', hoy);

    // Agrupar por día
    const ingresoPorDia = {};
    semana?.forEach(r => {
      ingresoPorDia[r.fecha] = (ingresoPorDia[r.fecha] || 0) + (r.servicio?.precio || 0);
    });

    // Abonos pendientes
    const { count: abonosPendientes } = await supabaseAdmin
      .from('reservas')
      .select('id', { count: 'exact', head: true })
      .eq('abono_estado', 'pendiente');

    // Stats servicios
    const { data: statsServicios } = await supabaseAdmin
      .from('stats_servicios')
      .select('*')
      .order('count_hoy', { ascending: false });

    res.json({
      resumen_barberos: resumenHoy,
      kpi: {
        ingresos_hoy:     ingresosHoy,
        servicios_hoy:    completadas.length,
        pendientes_hoy:   kpiHoy.filter(r => r.estado === 'pendiente').length,
        en_curso:         kpiHoy.filter(r => r.estado === 'en_curso').length,
        abonos_pendientes: abonosPendientes || 0,
      },
      ingresos_semana: ingresoPorDia,
      servicios:       statsServicios,
    });
  } catch (err) {
    logger.error('GET /stats/dashboard:', err);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// ── GET /api/stats/reportes ───────────────────────────────────
router.get('/reportes', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { desde, hasta, barbero_id } = req.query;
    const fechaDesde = desde || new Date(new Date().setDate(1)).toISOString().split('T')[0];
    const fechaHasta = hasta || new Date().toISOString().split('T')[0];

    let q = supabaseAdmin
      .from('reservas')
      .select(`
        id, fecha, hora_inicio, estado,
        cliente_nombre, cliente_tel,
        abono_estado, abono_monto, abono_metodo,
        barbero:barbero_id ( id, nombre, color ),
        servicio:servicio_id ( nombre, precio )
      `)
      .gte('fecha', fechaDesde)
      .lte('fecha', fechaHasta)
      .order('fecha', { ascending: false });

    if (barbero_id) q = q.eq('barbero_id', barbero_id);

    const { data, error } = await q;
    if (error) throw error;

    // Calcular totales
    const completadas = data.filter(r => r.estado === 'completado');
    const totalIngresos = completadas.reduce((a, r) => a + (r.servicio?.precio || 0), 0);

    // Ingresos por barbero
    const porBarbero = {};
    completadas.forEach(r => {
      const id = r.barbero?.id;
      if (!porBarbero[id]) porBarbero[id] = { barbero: r.barbero, servicios: 0, ingresos: 0 };
      porBarbero[id].servicios++;
      porBarbero[id].ingresos += r.servicio?.precio || 0;
    });

    res.json({
      reservas: data,
      resumen: {
        total:          data.length,
        completadas:    completadas.length,
        canceladas:     data.filter(r => r.estado === 'cancelado').length,
        ingresos_total: totalIngresos,
        por_barbero:    Object.values(porBarbero),
      },
      periodo: { desde: fechaDesde, hasta: fechaHasta },
    });
  } catch (err) {
    logger.error('GET /stats/reportes:', err);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
});

// ── GET /api/stats/exportar/pdf ───────────────────────────────
router.get('/exportar/pdf', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const fechaDesde = desde || new Date(new Date().setDate(1)).toISOString().split('T')[0];
    const fechaHasta = hasta || new Date().toISOString().split('T')[0];

    const { data } = await supabaseAdmin
      .from('reservas')
      .select(`
        fecha, hora_inicio, cliente_nombre,
        estado, abono_estado,
        barbero:barbero_id ( nombre ),
        servicio:servicio_id ( nombre, precio )
      `)
      .gte('fecha', fechaDesde)
      .lte('fecha', fechaHasta)
      .order('fecha')
      .order('hora_inicio');

    const pdfBuffer = await generarPDF(data, { desde: fechaDesde, hasta: fechaHasta });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=reporte-${fechaDesde}-${fechaHasta}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    logger.error('GET /exportar/pdf:', err);
    res.status(500).json({ error: 'Error al generar PDF' });
  }
});

// ── GET /api/stats/exportar/excel ────────────────────────────
router.get('/exportar/excel', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const fechaDesde = desde || new Date(new Date().setDate(1)).toISOString().split('T')[0];
    const fechaHasta = hasta || new Date().toISOString().split('T')[0];

    const { data } = await supabaseAdmin
      .from('reservas')
      .select(`
        fecha, hora_inicio, cliente_nombre, cliente_tel,
        estado, abono_estado, abono_metodo, abono_monto,
        barbero:barbero_id ( nombre ),
        servicio:servicio_id ( nombre, precio )
      `)
      .gte('fecha', fechaDesde)
      .lte('fecha', fechaHasta)
      .order('fecha');

    const xlsBuffer = generarExcel(data, { desde: fechaDesde, hasta: fechaHasta });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=reporte-${fechaDesde}-${fechaHasta}.xlsx`);
    res.send(xlsBuffer);
  } catch (err) {
    logger.error('GET /exportar/excel:', err);
    res.status(500).json({ error: 'Error al generar Excel' });
  }
});

export default router;
