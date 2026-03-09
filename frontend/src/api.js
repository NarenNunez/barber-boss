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
};