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
  crearReserva: (data) => post('/api/reservas', data),
};