// lib/supabase.js
// Dos clientes:
//   supabase      → anon key  (respeta RLS, para operaciones públicas)
//   supabaseAdmin → service_role key (bypasea RLS, solo backend interno)

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL    = process.env.SUPABASE_URL;
const ANON_KEY        = process.env.SUPABASE_ANON_KEY;
const SERVICE_KEY     = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_KEY) {
  throw new Error('Faltan variables de entorno de Supabase');
}

// Cliente público — para operaciones que respetan RLS
export const supabase = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { persistSession: false },
});

// Cliente admin — para operaciones del backend (bypasea RLS)
export const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Helper: subir archivo a Supabase Storage
export async function uploadFile(bucket, path, buffer, mimetype) {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType: mimetype,
      upsert: false,
    });
  if (error) throw error;
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(path);
  return { key: data.path, url: publicUrl };
}

// Helper: eliminar archivo de Storage
export async function deleteFile(bucket, path) {
  const { error } = await supabaseAdmin.storage.from(bucket).remove([path]);
  if (error) throw error;
}
