import { api } from './api.js';
import { supabase } from './supabase.js';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const get = async (path) => {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
};

const post = async (path, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
};

export const api = {
  getBarberos:  () => get('/api/barberos'),
  getServicios: () => get('/api/servicios'),

  getReservas: async (fecha) => {
    let q = supabase
      .from('reservas')
      .select(`
        id, cliente_nombre, cliente_tel,
        fecha, hora_inicio, hora_fin,
        estado, abono_estado, abono_metodo, comprobante_url,
        barbero:barbero_id ( id, nombre, color ),
        servicio:servicio_id ( id, nombre, precio )
      `)
      .order('hora_inicio', { ascending: true });
    if (fecha) q = q.eq('fecha', fecha);
    const { data, error } = await q;
    if (error) throw error;
    return data;
  },

  actualizarEstadoReserva: async (id, estado) => {
    const { data, error } = await supabase
      .from('reservas')
      .update({ estado })
      .eq('id', id)
      .select('id, estado')
      .single();
    if (error) throw error;
    return data;
  },

  actualizarAbono: async (id, abono_estado) => {
    const { data, error } = await supabase
      .from('reservas')
      .update({ abono_estado })
      .eq('id', id)
      .select('id, abono_estado')
      .single();
    if (error) throw error;
    return data;
  },

  crearReserva: (data) => {
    const body = {
      cliente_nombre: data.cliente_nombre,
      cliente_tel:    data.cliente_telefono,
      barbero_id:     data.barbero_id,
      servicio_id:    data.servicio_id,
      fecha:          data.fecha_iso,
      hora_inicio:    data.hora_inicio,
      notas:          data.notas || null,
    };
    if (data.cliente_email) body.cliente_email = data.cliente_email;
    return post('/api/reservas', body);
  },

  suscribirReservas: (callback) => {
    const channel = supabase
      .channel('reservas-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservas' }, callback)
      .subscribe();
    return () => supabase.removeChannel(channel);
  },

  suscribirBarberos: (callback) => {
    const channel = supabase
      .channel('barberos-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'barberos' }, callback)
      .subscribe();
    return () => supabase.removeChannel(channel);
  },

  getHorasOcupadas: async (barberoId, fecha) => {
    const { data, error } = await supabase
      .from('reservas')
      .select('hora_inicio, hora_fin')
      .eq('barbero_id', barberoId)
      .eq('fecha', fecha)
      .neq('estado', 'cancelado');
    if (error) throw error;
    return data;
  },
};