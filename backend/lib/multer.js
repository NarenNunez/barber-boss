// lib/multer.js
import multer from 'multer';

const MIME_COMPROBANTE = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const MIME_FOTO        = ['image/jpeg', 'image/png', 'image/webp'];

function filterFactory(allowed) {
  return (req, file, cb) => {
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`), false);
  };
}

// Comprobantes de pago — máx 5MB
export const uploadComprobante = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 },
  fileFilter: filterFactory(MIME_COMPROBANTE),
});

// Fotos de barberos — máx 3MB
export const uploadFoto = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 3 * 1024 * 1024 },
  fileFilter: filterFactory(MIME_FOTO),
});
