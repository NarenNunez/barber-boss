// lib/reportes.js
import PDFDocument from 'pdfkit';
import XLSX from 'xlsx';

const fmtCOP   = n => `$${Number(n).toLocaleString('es-CO')}`;
const fmtFecha = s => new Date(s).toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' });

// ─────────────────────────────────────────────────────────────
// PDF
// ─────────────────────────────────────────────────────────────
export function generarPDF(reservas, { desde, hasta }) {
  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    doc.on('data',  chunk => chunks.push(chunk));
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const GOLD   = '#D4AF37';
    const DARK   = '#1A1A1A';
    const MUTED  = '#666666';
    const W      = doc.page.width - 100;

    // ── Encabezado ──────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 80).fill(DARK);
    doc.fontSize(28).fillColor(GOLD).font('Helvetica-Bold').text('BARBER BOSS', 50, 22);
    doc.fontSize(10).fillColor('#aaa').font('Helvetica').text('Sistema de Gestión de Reservas', 50, 55);
    doc.fontSize(10).fillColor('#aaa').text(`Reporte ${fmtFecha(desde)} — ${fmtFecha(hasta)}`, 50, 70, { align: 'right' });

    doc.moveDown(2.5);

    // ── KPIs ────────────────────────────────────────────────
    const completadas = reservas.filter(r => r.estado === 'completado');
    const canceladas  = reservas.filter(r => r.estado === 'cancelado');
    const ingresos    = completadas.reduce((a, r) => a + (r.servicio?.precio || 0), 0);

    const kpis = [
      ['Total Reservas', reservas.length],
      ['Completadas',    completadas.length],
      ['Canceladas',     canceladas.length],
      ['Ingresos',       fmtCOP(ingresos)],
    ];

    const kpiW = W / 4;
    let kpiX   = 50;

    kpis.forEach(([label, valor]) => {
      doc.rect(kpiX, doc.y, kpiW - 8, 56).fillAndStroke('#f9f9f9', '#e0e0e0');
      doc.fillColor(MUTED).fontSize(8).font('Helvetica').text(label.toUpperCase(), kpiX + 8, doc.y - 50);
      doc.fillColor(DARK).fontSize(18).font('Helvetica-Bold').text(String(valor), kpiX + 8, doc.y - 36);
      kpiX += kpiW;
    });

    doc.moveDown(3.5);

    // ── Tabla ───────────────────────────────────────────────
    doc.fontSize(11).fillColor(DARK).font('Helvetica-Bold').text('DETALLE DE RESERVAS', 50);
    doc.moveDown(0.5);

    // Headers
    const cols = [
      { label: 'Fecha',      w: 70  },
      { label: 'Hora',       w: 50  },
      { label: 'Cliente',    w: 130 },
      { label: 'Barbero',    w: 90  },
      { label: 'Servicio',   w: 90  },
      { label: 'Precio',     w: 65  },
      { label: 'Estado',     w: 65  },
    ];

    let cx = 50;
    const hy = doc.y;
    doc.rect(50, hy, W, 18).fill(DARK);

    cols.forEach(col => {
      doc.fillColor('#fff').fontSize(8).font('Helvetica-Bold')
        .text(col.label, cx + 4, hy + 4, { width: col.w - 4 });
      cx += col.w;
    });
    doc.y = hy + 20;

    // Filas
    reservas.forEach((r, i) => {
      if (doc.y > doc.page.height - 80) {
        doc.addPage();
        doc.y = 50;
      }
      const rowY = doc.y;
      const bg   = i % 2 === 0 ? '#FFFFFF' : '#F8F8F8';

      doc.rect(50, rowY, W, 16).fill(bg);

      const cells = [
        fmtFecha(r.fecha),
        r.hora_inicio?.slice(0,5) || '',
        r.cliente_nombre,
        r.barbero?.nombre?.split(' ')[0] || '',
        r.servicio?.nombre || '',
        fmtCOP(r.servicio?.precio || 0),
        r.estado,
      ];

      cx = 50;
      cols.forEach((col, j) => {
        const color = j === 6
          ? r.estado === 'completado' ? '#10B981' : r.estado === 'cancelado' ? '#EF4444' : '#F59E0B'
          : '#333';
        doc.fillColor(color).fontSize(7.5).font('Helvetica')
          .text(cells[j], cx + 4, rowY + 3, { width: col.w - 6, ellipsis: true });
        cx += col.w;
      });

      doc.y = rowY + 18;
    });

    // ── Pie ──────────────────────────────────────────────────
    doc.moveDown(2);
    doc.fontSize(8).fillColor(MUTED).text(
      `Generado el ${new Date().toLocaleString('es-CO')} · Barber Boss`,
      50, doc.y, { align: 'center', width: W }
    );

    doc.end();
  });
}

// ─────────────────────────────────────────────────────────────
// EXCEL
// ─────────────────────────────────────────────────────────────
export function generarExcel(reservas, { desde, hasta }) {
  const wb = XLSX.utils.book_new();

  // ── Hoja 1: Detalle ────────────────────────────────────────
  const filas = reservas.map(r => ({
    Fecha:          r.fecha,
    Hora:           r.hora_inicio?.slice(0, 5),
    Cliente:        r.cliente_nombre,
    Teléfono:       r.cliente_tel,
    Barbero:        r.barbero?.nombre,
    Servicio:       r.servicio?.nombre,
    'Precio (COP)': r.servicio?.precio || 0,
    Estado:         r.estado,
    'Estado Abono': r.abono_estado,
    'Método Pago':  r.abono_metodo || '',
    'Monto Abono':  r.abono_monto || 0,
  }));

  const ws1 = XLSX.utils.json_to_sheet(filas);

  // Anchos de columna
  ws1['!cols'] = [
    { wch: 12 }, { wch: 8 }, { wch: 20 }, { wch: 14 }, { wch: 16 },
    { wch: 18 }, { wch: 13 }, { wch: 12 }, { wch: 13 }, { wch: 12 }, { wch: 12 },
  ];

  XLSX.utils.book_append_sheet(wb, ws1, 'Reservas');

  // ── Hoja 2: Resumen por barbero ────────────────────────────
  const porBarbero = {};
  reservas.filter(r => r.estado === 'completado').forEach(r => {
    const n = r.barbero?.nombre || 'Sin barbero';
    if (!porBarbero[n]) porBarbero[n] = { Barbero: n, Servicios: 0, 'Ingresos (COP)': 0 };
    porBarbero[n].Servicios++;
    porBarbero[n]['Ingresos (COP)'] += r.servicio?.precio || 0;
  });

  const ws2 = XLSX.utils.json_to_sheet(Object.values(porBarbero));
  ws2['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'Por Barbero');

  // ── Hoja 3: Resumen servicios ──────────────────────────────
  const porServicio = {};
  reservas.filter(r => r.estado === 'completado').forEach(r => {
    const n = r.servicio?.nombre || 'Sin servicio';
    if (!porServicio[n]) porServicio[n] = { Servicio: n, Cantidad: 0, 'Ingresos (COP)': 0 };
    porServicio[n].Cantidad++;
    porServicio[n]['Ingresos (COP)'] += r.servicio?.precio || 0;
  });

  const ws3 = XLSX.utils.json_to_sheet(Object.values(porServicio));
  ws3['!cols'] = [{ wch: 22 }, { wch: 10 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, ws3, 'Por Servicio');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
