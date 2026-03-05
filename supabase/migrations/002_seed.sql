-- ============================================================
-- BARBER BOSS — Datos iniciales
-- Ejecutar DESPUÉS de 001_schema.sql
-- ============================================================

-- Usuario super admin (crear en Supabase Auth primero, luego insertar aquí)
-- Reemplaza el UUID con el generado por Supabase Auth
INSERT INTO usuarios (id, email, nombre, rol) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@barberboss.com', 'Administrador', 'super_admin');

-- Barberos (los PINs van hasheados — usa bcrypt rounds=10)
-- PINs de ejemplo: Carlos=1234, Miguel=2345, Andrés=3456, David=4567
-- En producción genera los hashes con: bcrypt.hashSync('1234', 10)
INSERT INTO barberos (nombre, especialidad, bio, color, pin, horario_inicio, horario_fin, orden) VALUES
  ('Carlos Mendoza', 'Fade & Cortes Clásicos',
   '10 años de experiencia. Especialista en fades y degradados perfectos.',
   '#3B82F6',
   '$2b$10$placeholder_hash_1234',  -- reemplazar con hash real
   '09:00', '18:00', 1),

  ('Miguel Torres', 'Barbas & Diseños',
   'Maestro en barbas y diseños artísticos con técnica europea.',
   '#8B5CF6',
   '$2b$10$placeholder_hash_2345',
   '10:00', '19:00', 2),

  ('Andrés Silva', 'Estilo Moderno & Textura',
   'Joven talento con visión moderna. Especialista en texturizados.',
   '#EC4899',
   '$2b$10$placeholder_hash_3456',
   '09:00', '18:00', 3),

  ('David Rojas', 'Afro & Rizados',
   'Experto en cabello afro y texturizado con técnicas internacionales.',
   '#10B981',
   '$2b$10$placeholder_hash_4567',
   '08:00', '17:00', 4);

-- Servicios
INSERT INTO servicios (nombre, descripcion, precio, duracion_min, orden) VALUES
  ('Corte Clásico',    'Corte tradicional con acabado profesional',           25000, 30, 1),
  ('Corte + Barba',    'Corte completo más arreglo y diseño de barba',        40000, 50, 2),
  ('Barba Completa',   'Arreglo, diseño y acabado de barba',                  20000, 25, 3),
  ('Afeitado Navaja',  'Afeitado clásico con navaja y toalla caliente',       30000, 35, 4),
  ('Corte Premium',    'Corte con consultoría de estilo personalizada',       55000, 60, 5),
  ('Color & Corte',    'Coloración profesional más corte a elección',         70000, 90, 6);
