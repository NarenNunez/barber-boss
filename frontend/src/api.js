
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
  getGaleriaBarbero: async (barberoId) => {
    const { data, error } = await supabase
      .from('galeria_barbero')
      .select('id, url, titulo, orden')
      .eq('barbero_id', barberoId)
      .order('orden', { ascending: true });
    if (error) throw error;
    return data;
  },

  subirFotoGaleria: async (barberoId, file, titulo) => {
    const ext = file.name.split('.').pop();
    const path = `${barberoId}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('fotos-barberos')
      .upload(path, file, { upsert: true });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('fotos-barberos').getPublicUrl(path);
    const { error } = await supabase.from('galeria_barbero').insert({
      barbero_id: barberoId,
      url: data.publicUrl,
      storage_key: path,
      titulo: titulo || 'Sin título',
      orden: Date.now(),
    });
    if (error) throw error;
    return data.publicUrl;
  },

  eliminarFotoGaleria: async (id, storage_key) => {
    await supabase.storage.from('fotos-barberos').remove([storage_key]);
    const { error } = await supabase.from('galeria_barbero').delete().eq('id', id);
    if (error) throw error;
  },
  getGananciasBarbero: async (barberoId) => {
    const ahora = new Date();
    const hoy = ahora.toISOString().split('T')[0];
    
    const lunesActual = new Date(ahora);
    lunesActual.setDate(ahora.getDate() - ahora.getDay() + 1);
    const semanaInicio = lunesActual.toISOString().split('T')[0];
    
    const mesInicio = `${ahora.getFullYear()}-${String(ahora.getMonth()+1).padStart(2,'0')}-01`;

    const { data, error } = await supabase
      .from('reservas')
      .select(`
        fecha,
        servicio:servicio_id ( precio )
      `)
      .eq('barbero_id', barberoId)
      .eq('estado', 'completado')
      .gte('fecha', mesInicio);
    if (error) throw error;

    const calcular = (filas) => filas.reduce((a, r) => a + (r.servicio?.precio || 0), 0);

    return {
      hoy:    calcular(data.filter(r => r.fecha === hoy)),
      semana: calcular(data.filter(r => r.fecha >= semanaInicio)),
      mes:    calcular(data),
    };
  },
  getGananciasAdmin: async () => {
    const ahora = new Date();
    const hoy = ahora.toISOString().split('T')[0];

    const lunesActual = new Date(ahora);
    lunesActual.setDate(ahora.getDate() - ahora.getDay() + 1);
    const semanaInicio = lunesActual.toISOString().split('T')[0];

    const mesInicio = `${ahora.getFullYear()}-${String(ahora.getMonth()+1).padStart(2,'0')}-01`;

    const { data, error } = await supabase
      .from('reservas')
      .select(`
        fecha,
        barbero:barbero_id ( id, nombre, color, porcentaje ),
        servicio:servicio_id ( precio )
      `)
      .eq('estado', 'completado')
      .gte('fecha', mesInicio);
    if (error) throw error;
    return { data, hoy, semanaInicio, mesInicio };
  },
  getProductos: async () => {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
      .order('categoria', { ascending: true });
    if (error) throw error;
    return data;
  },

  crearProducto: async (producto) => {
    const { data, error } = await supabase
      .from('productos')
      .insert(producto)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  actualizarProducto: async (id, cambios) => {
    const { data, error } = await supabase
      .from('productos')
      .update(cambios)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  eliminarProducto: async (id) => {
    const { error } = await supabase
      .from('productos')
      .update({ activo: false })
      .eq('id', id);
    if (error) throw error;
  },

  getVentas: async () => {
    const ahora = new Date();
    const mesInicio = `${ahora.getFullYear()}-${String(ahora.getMonth()+1).padStart(2,'0')}-01`;
    const { data, error } = await supabase
      .from('ventas')
      .select(`id, cantidad, precio_unitario, total, fecha, created_at, producto:producto_id ( id, nombre, categoria )`)
      .gte('fecha', mesInicio)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  registrarVenta: async (producto_id, cantidad, precio_unitario) => {
    const total = cantidad * precio_unitario;
    const fecha = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('ventas')
      .insert({ producto_id, cantidad, precio_unitario, total, fecha })
      .select()
      .single();
    if (error) throw error;
    await supabase.from('productos').update({ stock: supabase.rpc('decrement', { x: cantidad }) });
    return data;
  },
};