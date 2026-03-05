// middleware/auth.js
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';

const JWT_SECRET = process.env.JWT_SECRET;

// ── Verifica JWT y carga el usuario en req.user ──────────────
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer '))
      return res.status(401).json({ error: 'Token requerido' });

    const token = header.split(' ')[1];
    let payload;

    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    // Cargar usuario desde DB para tener datos frescos
    const { data: user, error } = await supabaseAdmin
      .from('usuarios')
      .select('id, email, nombre, rol, activo')
      .eq('id', payload.sub)
      .single();

    if (error || !user)
      return res.status(401).json({ error: 'Usuario no encontrado' });

    if (!user.activo)
      return res.status(403).json({ error: 'Cuenta desactivada' });

    req.user = user;
    next();
  } catch (err) {
    logger.error('requireAuth error:', err);
    res.status(500).json({ error: 'Error de autenticación' });
  }
}

// ── Solo super_admin ─────────────────────────────────────────
export function requireAdmin(req, res, next) {
  if (req.user?.rol !== 'super_admin')
    return res.status(403).json({ error: 'Acceso restringido a administradores' });
  next();
}

// ── Barbero puede ver solo sus propios datos ─────────────────
export function requireSelfOrAdmin(paramKey = 'barberoId') {
  return (req, res, next) => {
    const user = req.user;
    if (user.rol === 'super_admin') return next();
    // Si es barbero, verificar que el param coincida con su barbero_id
    if (req.barberoId && req.barberoId !== user.barbero_id)
      return res.status(403).json({ error: 'Acceso denegado' });
    next();
  };
}

// ── Login de barbero con PIN ─────────────────────────────────
import bcrypt from 'bcryptjs';

export async function loginBarberoPin(req, res) {
  try {
    const { barbero_id, pin } = req.body;
    if (!barbero_id || !pin)
      return res.status(400).json({ error: 'barbero_id y pin son requeridos' });

    const { data: barbero, error } = await supabaseAdmin
      .from('barberos')
      .select('id, nombre, especialidad, color, pin, activo, usuario_id')
      .eq('id', barbero_id)
      .single();

    if (error || !barbero)
      return res.status(404).json({ error: 'Barbero no encontrado' });

    if (!barbero.activo)
      return res.status(403).json({ error: 'Barbero desactivado' });

    const valid = await bcrypt.compare(String(pin), barbero.pin);
    if (!valid)
      return res.status(401).json({ error: 'PIN incorrecto' });

    // Generar JWT con rol barbero
    const token = jwt.sign(
      { sub: barbero.usuario_id || barbero.id, rol: 'barbero', barbero_id: barbero.id },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    return res.json({
      token,
      barbero: {
        id: barbero.id,
        nombre: barbero.nombre,
        especialidad: barbero.especialidad,
        color: barbero.color,
      },
    });
  } catch (err) {
    logger.error('loginBarberoPin:', err);
    res.status(500).json({ error: 'Error interno' });
  }
}

// ── Login admin con email + password (Supabase Auth) ─────────
export async function loginAdmin(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email y contraseña requeridos' });

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: 'Credenciales inválidas' });

    // Verificar que sea admin
    const { data: usuario } = await supabaseAdmin
      .from('usuarios')
      .select('id, nombre, rol, activo')
      .eq('id', data.user.id)
      .single();

    if (!usuario || usuario.rol !== 'super_admin')
      return res.status(403).json({ error: 'Acceso restringido' });

    if (!usuario.activo)
      return res.status(403).json({ error: 'Cuenta desactivada' });

    const token = jwt.sign(
      { sub: usuario.id, rol: 'super_admin' },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({ token, usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol } });
  } catch (err) {
    logger.error('loginAdmin:', err);
    res.status(500).json({ error: 'Error interno' });
  }
}
