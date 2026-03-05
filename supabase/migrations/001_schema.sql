-- ============================================================
-- BARBER BOSS — Schema completo con seguridad y RLS
-- Supabase PostgreSQL
-- ============================================================

-- EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE rol_usuario   AS ENUM ('super_admin', 'barbero');
CREATE TYPE estado_cita   AS ENUM ('pendiente', 'en_curso', 'completado', 'cancelado', 'no_show');
CREATE TYPE estado_abono  AS ENUM ('sin_abono', 'pendiente', 'aprobado', 'rechazado');
CREATE TYPE metodo_pago   AS ENUM ('nequi', 'daviplata', 'banco');

-- ============================================================
-- TABLA: usuarios
-- ============================================================
CREATE TABLE usuarios (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT UNIQUE NOT NULL,
  nombre        TEXT NOT NULL,
  rol           rol_usuario NOT NULL DEFAULT 'barbero',
  activo        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: barberos
-- ============================================================
CREATE TABLE barberos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id    UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  nombre        TEXT NOT NULL,
  especialidad  TEXT NOT NULL,
  bio           TEXT,
  foto_url      TEXT,
  color         TEXT NOT NULL DEFAULT '#3B82F6',
  pin           TEXT NOT NULL,               -- hash bcrypt
  horario_inicio TIME NOT NULL DEFAULT '09:00',
  horario_fin    TIME NOT NULL DEFAULT '18:00',
  activo        BOOLEAN NOT NULL DEFAULT true,
  orden         SMALLINT NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: servicios
-- ============================================================
CREATE TABLE servicios (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre        TEXT NOT NULL,
  descripcion   TEXT,
  precio        INTEGER NOT NULL,             -- en COP, entero
  duracion_min  SMALLINT NOT NULL DEFAULT 30,
  activo        BOOLEAN NOT NULL DEFAULT true,
  orden         SMALLINT NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: disponibilidad (bloques bloqueados por barbero)
-- ============================================================
CREATE TABLE disponibilidad_bloqueada (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbero_id    UUID NOT NULL REFERENCES barberos(id) ON DELETE CASCADE,
  fecha         DATE NOT NULL,
  hora_inicio   TIME NOT NULL,
  hora_fin      TIME NOT NULL,
  motivo        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: reservas
-- ============================================================
CREATE TABLE reservas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Cliente (no requiere cuenta)
  cliente_nombre  TEXT NOT NULL,
  cliente_tel     TEXT NOT NULL,
  cliente_email   TEXT,
  -- Relaciones
  barbero_id      UUID NOT NULL REFERENCES barberos(id),
  servicio_id     UUID NOT NULL REFERENCES servicios(id),
  -- Tiempo
  fecha           DATE NOT NULL,
  hora_inicio     TIME NOT NULL,
  hora_fin        TIME NOT NULL,
  -- Estado
  estado          estado_cita NOT NULL DEFAULT 'pendiente',
  -- Pago / Abono
  abono_estado    estado_abono NOT NULL DEFAULT 'sin_abono',
  abono_metodo    metodo_pago,
  abono_monto     INTEGER,
  comprobante_url TEXT,
  comprobante_key TEXT,                       -- Storage key para eliminar
  -- Notas
  notas           TEXT,
  -- Quién gestionó
  gestionado_por  UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  -- Timestamps
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Evitar solapamiento por barbero
  CONSTRAINT no_solapamiento EXCLUDE USING gist (
    barbero_id WITH =,
    daterange(fecha, fecha, '[]') WITH &&,
    timerange(hora_inicio, hora_fin) WITH &&
  ) WHERE (estado NOT IN ('cancelado', 'no_show'))
);

-- Índices de rendimiento
CREATE INDEX idx_reservas_barbero_fecha   ON reservas(barbero_id, fecha);
CREATE INDEX idx_reservas_fecha           ON reservas(fecha);
CREATE INDEX idx_reservas_estado          ON reservas(estado);
CREATE INDEX idx_reservas_abono           ON reservas(abono_estado);
CREATE INDEX idx_reservas_created         ON reservas(created_at DESC);
CREATE INDEX idx_barberos_activo          ON barberos(activo);
CREATE INDEX idx_disponibilidad_barbero   ON disponibilidad_bloqueada(barbero_id, fecha);

-- ============================================================
-- TABLA: galeria_barbero
-- ============================================================
CREATE TABLE galeria_barbero (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbero_id  UUID NOT NULL REFERENCES barberos(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  titulo      TEXT,
  orden       SMALLINT DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: configuracion (clave-valor del negocio)
-- ============================================================
CREATE TABLE configuracion (
  clave       TEXT PRIMARY KEY,
  valor       TEXT NOT NULL,
  descripcion TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO configuracion (clave, valor, descripcion) VALUES
  ('negocio_nombre',    'Barber Boss',       'Nombre del negocio'),
  ('negocio_tel',       '3215557890',        'Teléfono WhatsApp'),
  ('abono_minimo',      '10000',             'Monto mínimo de abono en COP'),
  ('nequi_numero',      '3215557890',        'Número Nequi'),
  ('daviplata_numero',  '3215557890',        'Número Daviplata'),
  ('banco_datos',       'Bancolombia · CC 123-456789-00 · Carlos Peña', 'Datos bancarios'),
  ('horario_apertura',  '08:00',             'Apertura del negocio'),
  ('horario_cierre',    '19:00',             'Cierre del negocio'),
  ('slot_minutos',      '30',               'Duración de cada slot en minutos');

-- ============================================================
-- FUNCIÓN: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_usuarios_upd   BEFORE UPDATE ON usuarios   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_barberos_upd   BEFORE UPDATE ON barberos   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_reservas_upd   BEFORE UPDATE ON reservas   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_config_upd     BEFORE UPDATE ON configuracion FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- FUNCIÓN: obtener horas disponibles de un barbero en una fecha
-- ============================================================
CREATE OR REPLACE FUNCTION horas_disponibles(
  p_barbero_id UUID,
  p_fecha      DATE,
  p_duracion   INT DEFAULT 30
)
RETURNS TABLE(hora_inicio TIME, hora_fin TIME, disponible BOOLEAN) AS $$
DECLARE
  v_inicio TIME;
  v_fin    TIME;
  v_slot   INTERVAL;
  v_cur    TIME;
BEGIN
  SELECT horario_inicio, horario_fin INTO v_inicio, v_fin
  FROM barberos WHERE id = p_barbero_id;

  v_slot := (p_duracion || ' minutes')::INTERVAL;
  v_cur  := v_inicio;

  WHILE v_cur + v_slot <= v_fin LOOP
    RETURN QUERY
    SELECT
      v_cur,
      v_cur + v_slot,
      NOT EXISTS (
        SELECT 1 FROM reservas r
        WHERE r.barbero_id = p_barbero_id
          AND r.fecha = p_fecha
          AND r.estado NOT IN ('cancelado','no_show')
          AND r.hora_inicio < v_cur + v_slot
          AND r.hora_fin   > v_cur
        UNION ALL
        SELECT 1 FROM disponibilidad_bloqueada d
        WHERE d.barbero_id = p_barbero_id
          AND d.fecha = p_fecha
          AND d.hora_inicio < v_cur + v_slot
          AND d.hora_fin   > v_cur
      );
    v_cur := v_cur + v_slot;
  END LOOP;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- VISTA: resumen_hoy (útil para dashboard)
-- ============================================================
CREATE OR REPLACE VIEW resumen_hoy AS
SELECT
  b.id             AS barbero_id,
  b.nombre         AS barbero_nombre,
  b.color,
  COUNT(r.id)      AS total_citas,
  COUNT(r.id) FILTER (WHERE r.estado = 'completado')  AS completadas,
  COUNT(r.id) FILTER (WHERE r.estado = 'en_curso')    AS en_curso,
  COUNT(r.id) FILTER (WHERE r.estado = 'pendiente')   AS pendientes,
  COUNT(r.id) FILTER (WHERE r.estado = 'cancelado')   AS canceladas,
  COALESCE(SUM(s.precio) FILTER (WHERE r.estado = 'completado'), 0) AS ingresos
FROM barberos b
LEFT JOIN reservas r  ON r.barbero_id = b.id AND r.fecha = CURRENT_DATE
LEFT JOIN servicios s ON s.id = r.servicio_id
WHERE b.activo = true
GROUP BY b.id, b.nombre, b.color;

-- ============================================================
-- VISTA: stats_servicios
-- ============================================================
CREATE OR REPLACE VIEW stats_servicios AS
SELECT
  s.id, s.nombre, s.precio, s.duracion_min,
  COUNT(r.id) FILTER (WHERE r.fecha = CURRENT_DATE)                       AS count_hoy,
  COUNT(r.id) FILTER (WHERE r.fecha >= date_trunc('week', CURRENT_DATE))  AS count_semana,
  COUNT(r.id) FILTER (WHERE r.fecha >= date_trunc('month', CURRENT_DATE)) AS count_mes,
  COUNT(r.id)                                                              AS count_total
FROM servicios s
LEFT JOIN reservas r ON r.servicio_id = s.id AND r.estado NOT IN ('cancelado','no_show')
WHERE s.activo = true
GROUP BY s.id, s.nombre, s.precio, s.duracion_min;

-- ============================================================
-- RLS — Row Level Security
-- ============================================================
ALTER TABLE usuarios              ENABLE ROW LEVEL SECURITY;
ALTER TABLE barberos               ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios              ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas               ENABLE ROW LEVEL SECURITY;
ALTER TABLE galeria_barbero        ENABLE ROW LEVEL SECURITY;
ALTER TABLE disponibilidad_bloqueada ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion          ENABLE ROW LEVEL SECURITY;

-- Servicios y barberos: lectura pública (para el frontend del cliente)
CREATE POLICY "servicios_lectura_publica" ON servicios FOR SELECT USING (activo = true);
CREATE POLICY "barberos_lectura_publica"  ON barberos  FOR SELECT USING (activo = true);
CREATE POLICY "galeria_lectura_publica"   ON galeria_barbero FOR SELECT USING (true);
CREATE POLICY "config_lectura_publica"    ON configuracion FOR SELECT USING (true);

-- Reservas: inserción pública (clientes crean reservas), lectura/gestión solo autenticados
CREATE POLICY "reservas_insercion_publica" ON reservas FOR INSERT WITH CHECK (true);
CREATE POLICY "reservas_lectura_auth"      ON reservas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "reservas_update_auth"       ON reservas FOR UPDATE USING (auth.role() = 'authenticated');

-- Admin: acceso total con service_role (backend usa service_role key)
-- El backend Node.js usa supabaseAdmin (service_role) que bypasea RLS
