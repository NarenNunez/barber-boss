import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// ─────────────────────────────────────────────
// DATOS
// ─────────────────────────────────────────────
const BARBEROS = [
  { id: 1, nombre: "Luis Miguel", especialidad: "Cortes Clásicos & Fade", color: "#3B82F6", iniciales: "CM", pin: "1234", rating: 4.9,foto_url:"https://cpanozlsttqdmixgxtum.supabase.co/storage/v1/object/public/fotos-barberos/barbero1.jpg", bio: "10 años de experiencia. Especialista en fades y degradados perfectos.", estado: "libre", proximaCita: null, proximoCliente: null, cola: 2, serviciosHoy: 6, horario: "09:00 – 18:00", galeria: ["Fade Clásico","Pompadour","Undercut","Crew Cut","Buzz Cut","Quiff"] },
  { id: 2, nombre: "Greison",  especialidad: "Barbas & Diseños",        color: "#8B5CF6", iniciales: "MT", pin: "2345", rating: 4.8, bio: "Maestro en barbas y diseños artísticos con técnica europea.", estado: "ocupado", proximaCita: "3:45 PM", proximoCliente: "Juan Pérez", cola: 0, serviciosHoy: 5, horario: "10:00 – 19:00", galeria: ["Barba Full","Diseño Geométrico","Líneas","Texturizado","Mohawk","Taper"] },
  { id: 3, nombre: "Alvaro",   especialidad: "Estilo Moderno & Textura", color: "#EC4899", iniciales: "AS", pin: "3456", rating: 4.7, bio: "Joven talento con visión moderna. Especialista en texturizados.", estado: "proximo", proximaCita: "2:45 PM", proximoCliente: "Luis García", cola: 1, serviciosHoy: 4, horario: "09:00 – 18:00", galeria: ["Texturizado","French Crop","Slick Back","Curtain","Wolf Cut","Shag"] },
  { id: 4, nombre: "Keiner",    especialidad: "Cortes Afro & Rizados",   color: "#10B981", iniciales: "DR", pin: "4567", rating: 4.9, bio: "Experto en cabello afro y texturizado con técnicas internacionales.", estado: "libre", proximaCita: "4:00 PM", proximoCliente: "Pedro Ruiz", cola: 3, serviciosHoy: 7, horario: "08:00 – 17:00", galeria: ["Afro","Twist","Dreads","Coil","Blowout","High Top"] },
];

const SERVICIOS = [
  { id: 1, nombre: "Corte Clásico",    precio: 25000, duracion: 30 },
  { id: 2, nombre: "Corte + Barba",    precio: 40000, duracion: 50 },
  { id: 3, nombre: "Barba Completa",   precio: 20000, duracion: 25 },
  { id: 4, nombre: "Afeitado Navaja",  precio: 30000, duracion: 35 },
  { id: 5, nombre: "Corte Premium",    precio: 55000, duracion: 60 },
  { id: 6, nombre: "Color & Corte",    precio: 70000, duracion: 90 },
];

const ABONO_MIN = 10000;
const NEQUI   = "321 555 7890";
const DAVIPLATA = "321 555 7890";
const BANCO   = "Bancolombia · CC 123-456789-00 · Carlos Peña";

let RESERVAS_INIT = [
  { id: 1, cliente: "Juan Pérez",   servicio: "Corte Clásico",  hora: "2:30 PM", barberoId: 2, estado: "en_curso",  telefono: "3001234567", comprobante: null, abonoEstado: "aprobado" },
  { id: 2, cliente: "Mario Castro", servicio: "Corte + Barba",  hora: "3:00 PM", barberoId: 1, estado: "pendiente", telefono: "3009876543", comprobante: "comp_mario.jpg", abonoEstado: "pendiente" },
  { id: 3, cliente: "Luis García",  servicio: "Barba Completa", hora: "2:45 PM", barberoId: 3, estado: "pendiente", telefono: "3005551234", comprobante: null, abonoEstado: "sin_abono" },
  { id: 4, cliente: "Pedro Ruiz",   servicio: "Corte Premium",  hora: "3:30 PM", barberoId: 4, estado: "pendiente", telefono: "3007778888", comprobante: "comp_pedro.jpg", abonoEstado: "pendiente" },
  { id: 5, cliente: "Carlos Díaz",  servicio: "Corte Clásico",  hora: "4:00 PM", barberoId: 1, estado: "pendiente", telefono: "3002223333", comprobante: null, abonoEstado: "sin_abono" },
  { id: 6, cliente: "Felipe Mora",  servicio: "Color & Corte",  hora: "5:00 PM", barberoId: 4, estado: "pendiente", telefono: "3006667777", comprobante: "comp_felipe.jpg", abonoEstado: "aprobado" },
];

const DIAS  = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const HORAS_DISP = ["9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM","12:00 PM","12:30 PM","1:00 PM","1:30 PM","2:00 PM","2:30 PM","3:00 PM","3:30 PM","4:00 PM","4:30 PM","5:00 PM","5:30 PM"];
const HORAS_OCUP = ["10:00 AM","11:30 AM","2:30 PM","4:00 PM"];
const fmtCOP = n => `$${Number(n).toLocaleString("es-CO")}`;

// ─────────────────────────────────────────────
// ESTILOS GLOBALES
// ─────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');

*{box-sizing:border-box;margin:0;padding:0}
:root{
  --gold:#D4AF37;--gold2:#B8960C;--gold3:#F0D060;
  --black:#000;--dark:#0A0A0A;--card:#131313;--card2:#1A1A1A;
  --border:rgba(255,255,255,0.07);--muted:#5A5A5A;--text:#F0EDE8;
  --libre:#10B981;--ocupado:#EF4444;--proximo:#F59E0B;
  --b1:#3B82F6;--b2:#8B5CF6;--b3:#EC4899;--b4:#10B981;
}
body{background:#000;color:var(--text);font-family:'DM Sans',sans-serif;overflow-x:hidden}

/* ── SCROLL ── */
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#0a0a0a}::-webkit-scrollbar-thumb{background:#2a2a2a;border-radius:2px}

/* ── NAV ── */
.nav{
  position:fixed;top:0;left:0;right:0;z-index:200;height:60px;
  background:rgba(0,0,0,0.96);backdrop-filter:blur(24px);
  border-bottom:1px solid rgba(212,175,55,0.15);
  display:flex;align-items:center;padding:0 40px;gap:16px;
}
.nav-logo{
  font-family:'Playfair Display',serif;font-size:22px;font-weight:900;
  color:var(--gold);letter-spacing:2px;cursor:pointer;margin-right:auto;
  font-style:italic;
}
.nav-logo span{color:#fff;font-style:normal}
.nav-pill{
  padding:7px 18px;border-radius:20px;font-size:12px;font-weight:500;
  letter-spacing:.5px;cursor:pointer;transition:all .2s;
  border:1px solid transparent;background:transparent;color:var(--muted);
  font-family:'DM Sans',sans-serif;
}
.nav-pill:hover{color:var(--text);border-color:var(--border)}
.nav-pill.act{background:var(--gold);color:#000;border-color:var(--gold)}
.nav-cta{
  padding:8px 22px;background:var(--gold);color:#000;border:none;
  font-family:'DM Sans',sans-serif;font-weight:600;font-size:12px;
  letter-spacing:1px;cursor:pointer;transition:all .2s;border-radius:2px;
  text-transform:uppercase;
}
.nav-cta:hover{background:#fff}

/* ── HERO ── */
.hero{
  min-height:100vh;padding-top:60px;display:flex;flex-direction:column;
  align-items:center;justify-content:center;position:relative;overflow:hidden;
  background:#000;
}
.hero-grain{
  position:absolute;inset:0;opacity:.035;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size:200px;
}
.hero-glow{
  position:absolute;top:30%;left:50%;transform:translate(-50%,-50%);
  width:600px;height:400px;
  background:radial-gradient(ellipse,rgba(212,175,55,.07) 0%,transparent 70%);
  pointer-events:none;
}
.hero-lines{
  position:absolute;inset:0;opacity:.025;
  background:repeating-linear-gradient(90deg,transparent,transparent 80px,var(--gold) 80px,var(--gold) 81px);
}
.hero-content{position:relative;z-index:2;text-align:center;padding:0 24px}
.hero-eyebrow{
  font-family:'Cormorant Garamond',serif;font-size:14px;font-weight:300;
  letter-spacing:6px;text-transform:uppercase;color:var(--gold);
  margin-bottom:24px;font-style:italic;opacity:.9;
}
.hero-title{
  font-family:'Playfair Display',serif;font-weight:900;font-style:italic;
  font-size:clamp(72px,14vw,148px);line-height:.88;color:#fff;
  letter-spacing:-2px;margin-bottom:4px;
}
.hero-title .gold{color:var(--gold)}
.hero-title .outline{
  -webkit-text-stroke:1px rgba(212,175,55,.5);color:transparent;
}
.hero-tagline{
  font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:300;
  font-style:italic;color:var(--muted);letter-spacing:4px;
  margin-bottom:52px;margin-top:12px;
}
.hero-btns{display:flex;gap:16px;justify-content:center;flex-wrap:wrap}
.btn-gold{
  padding:14px 44px;background:var(--gold);color:#000;border:none;
  font-family:'DM Sans',sans-serif;font-weight:600;font-size:13px;
  letter-spacing:2px;text-transform:uppercase;cursor:pointer;
  transition:all .3s;clip-path:polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%);
}
.btn-gold:hover{background:#fff;transform:translateY(-2px);box-shadow:0 12px 40px rgba(212,175,55,.25)}
.btn-ghost{
  padding:14px 44px;background:transparent;color:var(--gold);
  border:1px solid rgba(212,175,55,.35);font-family:'DM Sans',sans-serif;
  font-weight:500;font-size:13px;letter-spacing:2px;text-transform:uppercase;
  cursor:pointer;transition:all .3s;
  clip-path:polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%);
}
.btn-ghost:hover{border-color:var(--gold);background:rgba(212,175,55,.08)}
.hero-stats{
  display:flex;justify-content:center;gap:72px;
  margin-top:52px;
  position:relative;
}
.hstat-num{
  font-family:'Playfair Display',serif;font-size:38px;font-weight:700;
  color:var(--gold);line-height:1;font-style:italic;
}
.hstat-lbl{font-size:10px;color:var(--muted);letter-spacing:3px;text-transform:uppercase;margin-top:6px}

/* ── SECTION ── */
.section{padding:96px 40px;max-width:1200px;margin:0 auto}
.sec-tag{font-family:'Cormorant Garamond',serif;font-size:13px;font-weight:300;font-style:italic;letter-spacing:4px;color:var(--gold);text-transform:uppercase;margin-bottom:12px}
.sec-title{font-family:'Playfair Display',serif;font-size:clamp(40px,6vw,64px);font-weight:900;font-style:italic;color:#fff;line-height:1;letter-spacing:-1px}
.sec-head{text-align:center;margin-bottom:64px}
.gold-rule{width:48px;height:1px;background:var(--gold);margin:20px auto 0;opacity:.6}

/* ── BARBERO CARDS ── */
.barb-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px}
.barb-card{
  background:var(--card);border:1px solid var(--border);
  overflow:hidden;cursor:pointer;transition:all .35s;position:relative;
}
.barb-card:hover{transform:translateY(-6px);border-color:rgba(212,175,55,.25);box-shadow:0 24px 48px rgba(0,0,0,.5)}
.barb-card:hover .barb-hover{opacity:1}
.barb-photo{
  height:220px;position:relative;overflow:hidden;
  display:flex;align-items:center;justify-content:center;
}
.barb-initials-ph{
  font-family:'Playfair Display',serif;font-size:80px;font-style:italic;
  font-weight:700;opacity:.18;
}
.barb-hover{
  position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.85) 0%,transparent 60%);
  opacity:0;transition:opacity .35s;display:flex;align-items:flex-end;padding:20px;
}
.barb-hover-cta{font-family:'Cormorant Garamond',serif;font-size:15px;font-style:italic;color:var(--gold);letter-spacing:2px}
.barb-stripe{height:2px}
.barb-body{padding:20px 22px 22px}
.barb-name{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;font-style:italic;margin-bottom:4px}
.barb-esp{font-size:11px;color:var(--muted);letter-spacing:2px;text-transform:uppercase;margin-bottom:12px}
.barb-rating{font-size:13px;color:var(--gold)}

/* ── SERVICIOS ── */
.svc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px}
.svc-item{
  background:var(--card);border:1px solid var(--border);
  padding:20px 24px;display:flex;justify-content:space-between;align-items:center;
  transition:all .2s;cursor:pointer;
}
.svc-item:hover{border-color:rgba(212,175,55,.25);background:var(--card2)}
.svc-name{font-family:'Cormorant Garamond',serif;font-size:17px;font-weight:600;margin-bottom:2px}
.svc-dur{font-size:11px;color:var(--muted);letter-spacing:1px}
.svc-price{font-family:'Playfair Display',serif;font-size:22px;color:var(--gold);font-weight:700;font-style:italic}

/* ── RESERVA FLOW ── */
.res-page{min-height:100vh;padding:80px 16px 60px;background:#000;display:flex;flex-direction:column;align-items:center}
.res-wrap{width:100%;max-width:640px}
.res-header{text-align:center;margin-bottom:40px}
.res-title{font-family:'Playfair Display',serif;font-size:48px;font-weight:900;font-style:italic;color:var(--gold);line-height:1}
.res-sub{font-family:'Cormorant Garamond',serif;font-size:14px;font-style:italic;color:var(--muted);letter-spacing:3px;margin-top:6px}
.steps{display:flex;align-items:center;justify-content:center;margin-bottom:40px;gap:0;overflow-x:auto;padding-bottom:4px}
.step{display:flex;align-items:center;gap:8px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--muted);white-space:nowrap;font-family:'DM Sans',sans-serif}
.step-n{width:26px;height:26px;border-radius:50%;border:1px solid var(--muted);display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0}
.step.done{color:var(--gold)}.step.done .step-n{background:var(--gold);border-color:var(--gold);color:#000}
.step.active{color:#fff}.step.active .step-n{border-color:var(--gold);color:var(--gold)}
.step-line{flex:1;height:1px;background:rgba(255,255,255,.08);min-width:20px}
.fcard{background:var(--card);border:1px solid var(--border);padding:36px}
.ftitle{font-family:'Playfair Display',serif;font-size:28px;font-weight:900;font-style:italic;margin-bottom:6px}
.fsub{font-size:13px;color:var(--muted);margin-bottom:28px}
.flabel{font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:7px;display:block;font-family:'DM Sans',sans-serif}
.finput{
  width:100%;padding:11px 14px;background:rgba(255,255,255,.03);
  border:1px solid var(--border);color:var(--text);
  font-family:'DM Sans',sans-serif;font-size:14px;outline:none;transition:border-color .2s;
  border-radius:1px;
}
.finput:focus{border-color:rgba(212,175,55,.5)}
.finput::placeholder{color:var(--muted)}
.fselect{width:100%;padding:11px 14px;background:rgba(255,255,255,.03);border:1px solid var(--border);color:var(--text);font-family:'DM Sans',sans-serif;font-size:14px;outline:none;border-radius:1px;appearance:none}
.fselect option{background:#1a1a1a}
.opt-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.opt{
  padding:14px;border:1px solid var(--border);cursor:pointer;
  transition:all .2s;background:rgba(255,255,255,.02);text-align:center;
}
.opt:hover{border-color:rgba(212,175,55,.3);background:rgba(212,175,55,.04)}
.opt.sel{border-color:var(--gold);background:rgba(212,175,55,.08)}
.opt-name{font-weight:600;font-size:14px;margin-bottom:3px}
.opt-sub{font-size:11px;color:var(--muted)}
.hora-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}
.hora{padding:10px 6px;border:1px solid var(--border);cursor:pointer;text-align:center;font-size:13px;transition:all .2s;font-family:'DM Sans',sans-serif}
.hora:hover{border-color:var(--gold);color:var(--gold)}
.hora.sel{background:var(--gold);border-color:var(--gold);color:#000;font-weight:700}
.hora.ocp{opacity:.3;cursor:not-allowed}
.day-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}
.day{padding:10px 6px;border:1px solid var(--border);cursor:pointer;text-align:center;transition:all .2s}
.day:hover{border-color:var(--gold)}
.day.sel{background:var(--gold);border-color:var(--gold);color:#000}
.day-d{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;line-height:1.1}
.day-m{font-size:10px;color:inherit;letter-spacing:1px;opacity:.7}
.nav-btns{display:flex;gap:10px;margin-top:28px}
.btn-back{flex:1;padding:13px;background:transparent;border:1px solid var(--border);color:var(--muted);font-family:'DM Sans',sans-serif;font-weight:500;font-size:12px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:all .2s}
.btn-back:hover{border-color:#fff;color:#fff}
.btn-next{flex:2;padding:13px;background:var(--gold);border:none;color:#000;font-family:'DM Sans',sans-serif;font-weight:700;font-size:12px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:all .2s}
.btn-next:hover{background:#fff}
.btn-next:disabled{opacity:.4;cursor:not-allowed}
.conf-row{display:flex;justify-content:space-between;align-items:center;padding:11px 0;border-bottom:1px solid rgba(255,255,255,.05);font-size:14px}
.conf-lbl{font-size:10px;color:var(--muted);letter-spacing:2px;text-transform:uppercase;font-family:'DM Sans',sans-serif}

/* ── ABONO ── */
.abono-tabs{display:flex;gap:8px;margin-bottom:20px}
.abono-tab{flex:1;padding:10px;border:1px solid var(--border);background:transparent;color:var(--muted);font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;cursor:pointer;transition:all .2s}
.abono-tab.act{background:rgba(212,175,55,.12);border-color:var(--gold);color:var(--gold)}
.upload-zone{
  border:1px dashed rgba(212,175,55,.3);padding:32px;text-align:center;
  cursor:pointer;transition:all .2s;margin-top:12px;
}
.upload-zone:hover{border-color:var(--gold);background:rgba(212,175,55,.03)}
.upload-icon{font-size:28px;margin-bottom:8px}
.upload-text{font-size:13px;color:var(--muted)}
.upload-preview{
  background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.3);
  padding:12px 16px;margin-top:12px;display:flex;align-items:center;gap:10px;font-size:13px;
}
.info-box{background:rgba(212,175,55,.06);border:1px solid rgba(212,175,55,.2);padding:16px 20px;margin-bottom:16px}
.info-box-title{font-size:11px;font-weight:600;letter-spacing:2px;color:var(--gold);text-transform:uppercase;margin-bottom:8px;font-family:'DM Sans',sans-serif}
.info-row{display:flex;justify-content:space-between;font-size:13px;padding:4px 0}
.info-val{font-weight:600;color:var(--text)}

/* ── ADMIN ── */
.admin{min-height:100vh;display:flex;padding-top:60px;background:var(--dark)}
.sidebar{width:210px;min-height:calc(100vh - 60px);background:#0D0D0D;border-right:1px solid var(--border);padding:20px 0;position:sticky;top:60px;flex-shrink:0}
.sb-label{font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--muted);padding:0 16px;margin-bottom:6px;margin-top:20px;font-family:'DM Sans',sans-serif}
.sb-item{
  display:flex;align-items:center;gap:10px;padding:10px 16px;
  cursor:pointer;font-size:13px;color:var(--muted);transition:all .2s;
  border:none;background:transparent;width:100%;text-align:left;
  font-family:'DM Sans',sans-serif;font-weight:400;border-left:2px solid transparent;
}
.sb-item:hover{color:var(--text);background:rgba(255,255,255,.03)}
.sb-item.act{color:var(--gold);border-left-color:var(--gold);background:rgba(212,175,55,.05)}
.admin-main{flex:1;padding:24px 36px;overflow-x:hidden}
.pg-title{font-family:'Playfair Display',serif;font-size:36px;font-weight:900;font-style:italic;letter-spacing:-1px}
.pg-sub{font-size:12px;color:var(--muted);margin-top:4px;letter-spacing:.5px}
.pg-head{margin-bottom:28px}
.kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:28px}
.kpi{background:var(--card);border:1px solid var(--border);padding:22px}
.kpi-lbl{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:8px;font-family:'DM Sans',sans-serif}
.kpi-val{font-family:'Playfair Display',serif;font-size:36px;font-weight:700;font-style:italic;line-height:1;color:#fff}
.kpi-val.gold{color:var(--gold)}
.kpi-sub{font-size:12px;color:var(--libre);margin-top:4px}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}
.blk{background:var(--card);border:1px solid var(--border);padding:22px}
.blk-title{font-family:'Cormorant Garamond',serif;font-size:15px;font-weight:600;font-style:italic;letter-spacing:2px;color:var(--gold);text-transform:uppercase;margin-bottom:16px}
.row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.04);font-size:13px}
.row:last-child{border-bottom:none}
.dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.badge{padding:2px 8px;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;border-radius:1px}
.badge.en_curso{background:rgba(16,185,129,.15);color:var(--libre)}
.badge.pendiente{background:rgba(245,158,11,.15);color:var(--proximo)}
.badge.completado{background:rgba(59,130,246,.15);color:#3B82F6}
.badge.cancelado{background:rgba(239,68,68,.15);color:var(--ocupado)}
.badge.aprobado{background:rgba(16,185,129,.15);color:var(--libre)}
.badge.sin_abono{background:rgba(100,100,100,.15);color:#888}
.av-sm{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'DM Sans',sans-serif;font-size:11px;font-weight:700;color:#000;flex-shrink:0}
.prog{flex:1;height:3px;background:rgba(255,255,255,.07);border-radius:2px;overflow:hidden}
.prog-fill{height:100%;border-radius:2px}
.tbl{width:100%;border-collapse:collapse;font-size:12px}
.tbl th{text-align:left;padding:9px 12px;font-size:9px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--border);font-family:'DM Sans',sans-serif}
.tbl td{padding:11px 12px;border-bottom:1px solid rgba(255,255,255,.03)}
.tbl tr:hover td{background:rgba(255,255,255,.015)}
.act-btn{padding:4px 10px;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;cursor:pointer;border:none;transition:all .2s;font-family:'DM Sans',sans-serif;border-radius:1px}
.act-btn.p{background:var(--gold);color:#000}.act-btn.p:hover{background:#fff}
.act-btn.d{background:rgba(239,68,68,.12);color:var(--ocupado)}.act-btn.d:hover{background:var(--ocupado);color:#fff}
.act-btn.s{background:rgba(16,185,129,.12);color:var(--libre)}.act-btn.s:hover{background:var(--libre);color:#fff}
.act-btn.g{background:rgba(255,255,255,.07);color:var(--text)}.act-btn.g:hover{background:rgba(255,255,255,.15)}

/* ── PIN LOGIN ── */
.pin-page{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#000;padding:16px}
.pin-card{background:var(--card);border:1px solid var(--border);padding:48px 40px;width:100%;max-width:380px;text-align:center}
.pin-logo{font-family:'Playfair Display',serif;font-size:40px;font-weight:900;font-style:italic;color:var(--gold);line-height:1;margin-bottom:4px}
.pin-sub{font-family:'Cormorant Garamond',serif;font-size:13px;font-style:italic;color:var(--muted);letter-spacing:3px;margin-bottom:36px}
.pin-barb-sel{display:flex;gap:10px;justify-content:center;margin-bottom:28px;flex-wrap:wrap}
.pin-barb{
  width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  font-family:'DM Sans',sans-serif;font-weight:700;font-size:14px;color:#000;cursor:pointer;
  border:2px solid transparent;transition:all .2s;opacity:.5;
}
.pin-barb.sel{opacity:1;border-color:#fff;box-shadow:0 0 0 3px rgba(255,255,255,.15)}
.pin-display{
  font-family:'Playfair Display',serif;font-size:40px;font-weight:700;font-style:italic;
  letter-spacing:16px;text-align:center;padding:12px;
  background:rgba(255,255,255,.03);border:1px solid var(--border);margin-bottom:20px;
  min-height:66px;color:var(--gold);
}
.pin-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px}
.pin-key{
  padding:16px;background:rgba(255,255,255,.04);border:1px solid var(--border);
  font-family:'Playfair Display',serif;font-size:22px;font-weight:700;cursor:pointer;
  transition:all .15s;font-style:italic;color:#fff;
}
.pin-key:hover{background:rgba(212,175,55,.12);border-color:rgba(212,175,55,.4);color:var(--gold)}
.pin-key.del{font-family:'DM Sans',sans-serif;font-size:18px;font-style:normal}
.pin-err{font-size:12px;color:var(--ocupado);margin-top:8px}

/* ── BARBERO PANEL ── */
.bp{min-height:100vh;background:var(--dark);padding-top:60px}
.bp-header{background:var(--card);border-bottom:1px solid var(--border);padding:20px 32px;display:flex;align-items:center;gap:16px}
.bp-av{width:50px;height:50px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'DM Sans',sans-serif;font-weight:700;font-size:16px;color:#000;flex-shrink:0}
.bp-name{font-family:'Playfair Display',serif;font-size:24px;font-weight:700;font-style:italic}
.bp-esp{font-size:12px;color:var(--muted);margin-top:1px}
.bp-tabs{display:flex;gap:2px;margin-left:auto}
.bp-tab{padding:8px 18px;border-radius:2px;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;cursor:pointer;border:none;font-family:'DM Sans',sans-serif;background:transparent;color:var(--muted);transition:all .2s}
.bp-tab.act{background:var(--gold);color:#000}
.bp-body{padding:28px 32px;max-width:900px;margin:0 auto}
.cita-card{background:var(--card);border:1px solid var(--border);padding:18px 20px;margin-bottom:10px;display:flex;align-items:center;gap:16px;transition:all .2s}
.cita-card:hover{border-color:rgba(212,175,55,.2)}
.cita-hora{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;font-style:italic;color:var(--gold);width:80px;flex-shrink:0;line-height:1}
.cita-hora-ampm{font-size:11px;color:var(--muted);font-family:'DM Sans',sans-serif;font-style:normal;font-weight:400}
.cita-nombre{font-size:15px;font-weight:600;margin-bottom:2px}
.cita-svc{font-size:12px;color:var(--muted)}
.cita-btns{display:flex;gap:7px;margin-left:auto}

/* ── MONITOR ── */
.monitor{min-height:100vh;background:#000;padding-top:60px;display:flex;flex-direction:column}
.mon-head{
  background:rgba(0,0,0,.95);border-bottom:1px solid rgba(212,175,55,.2);
  padding:14px 32px;display:flex;align-items:center;justify-content:space-between;
}
.mon-logo{font-family:'Playfair Display',serif;font-size:20px;font-weight:900;font-style:italic;color:var(--gold)}
.mon-logo span{color:#fff;font-style:normal}
.mon-clock{font-family:'Playfair Display',serif;font-size:30px;font-weight:700;font-style:italic;color:#fff}
.mon-date{text-align:right;font-size:12px;color:var(--muted)}
.mon-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;padding:20px 28px;flex:1}
.mon-card{
  background:var(--card);border:1px solid var(--border);border-radius:2px;
  padding:22px;display:flex;flex-direction:column;gap:14px;transition:all .5s;
}
.mon-card.libre{border-top:3px solid var(--libre)}
.mon-card.ocupado{border-top:3px solid var(--ocupado);box-shadow:0 0 20px rgba(239,68,68,.07)}
.mon-card.proximo{border-top:3px solid var(--proximo);box-shadow:0 0 20px rgba(245,158,11,.07)}
.mon-barb-name{font-family:'Playfair Display',serif;font-size:26px;font-weight:700;font-style:italic}
.mon-barb-esp{font-size:10px;color:var(--muted);letter-spacing:2px;text-transform:uppercase;margin-top:1px}
.mon-estado{display:inline-flex;align-items:center;gap:7px;padding:5px 12px;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;width:fit-content;font-family:'DM Sans',sans-serif}
.mon-estado.libre{background:rgba(16,185,129,.1);color:var(--libre)}
.mon-estado.ocupado{background:rgba(239,68,68,.1);color:var(--ocupado)}
.mon-estado.proximo{background:rgba(245,158,11,.1);color:var(--proximo)}
.mon-blink{width:7px;height:7px;border-radius:50%}
.mon-blink.libre{background:var(--libre);animation:pg 2s infinite}
.mon-blink.ocupado{background:var(--ocupado);animation:pr 1s infinite}
.mon-blink.proximo{background:var(--proximo);animation:py 1.5s infinite}
.mon-label{font-size:9px;color:var(--muted);letter-spacing:2px;text-transform:uppercase;margin-bottom:3px;font-family:'DM Sans',sans-serif}
.mon-cliente{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:600;font-style:italic}
.mon-hora{font-size:13px;color:var(--gold);font-weight:500}
.mon-cola{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;font-style:italic}
.mon-footer{
  background:rgba(212,175,55,.06);border-top:1px solid rgba(212,175,55,.15);
  padding:14px 28px;display:flex;align-items:center;justify-content:space-between;
}
.mon-prox-list{display:flex;gap:24px}
.mon-prox-item{font-size:12px;color:var(--muted)}
.mon-prox-item strong{color:#fff}
.mon-walk-btn{
  padding:12px 24px;background:var(--gold);color:#000;border:none;
  font-family:'DM Sans',sans-serif;font-weight:700;font-size:11px;
  letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:all .2s;border-radius:1px;
}
.mon-walk-btn:hover{background:#fff}
.mon-stat{font-size:13px;color:var(--muted)}
.mon-stat strong{color:var(--text);margin-right:4px}

/* ── MODAL ── */
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:500;display:flex;align-items:center;justify-content:center;padding:16px}
.modal{background:var(--card);border:1px solid var(--border);padding:32px;width:100%;max-width:500px;position:relative;max-height:90vh;overflow-y:auto}
.modal-close{position:absolute;top:14px;right:14px;background:none;border:none;color:var(--muted);font-size:18px;cursor:pointer;transition:color .2s}
.modal-close:hover{color:#fff}
.modal-title{font-family:'Playfair Display',serif;font-size:26px;font-weight:700;font-style:italic;margin-bottom:22px}

/* ── LANDING SELECTOR ── */
.selector{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#000;padding:16px}
.sel-card{background:var(--card);border:1px solid var(--border);padding:48px 40px;width:100%;max-width:440px}
.sel-logo{font-family:'Playfair Display',serif;font-size:52px;font-weight:900;font-style:italic;color:var(--gold);line-height:.9;text-align:center;margin-bottom:4px}
.sel-sub{font-family:'Cormorant Garamond',serif;font-size:13px;font-style:italic;color:var(--muted);letter-spacing:4px;text-align:center;margin-bottom:40px}
.sel-divider{height:1px;background:linear-gradient(90deg,transparent,rgba(212,175,55,.3),transparent);margin-bottom:28px}
.role-btn{display:flex;align-items:center;gap:14px;padding:14px 18px;background:rgba(255,255,255,.02);border:1px solid var(--border);width:100%;cursor:pointer;transition:all .2s;margin-bottom:10px;text-align:left}
.role-btn:hover{border-color:rgba(212,175,55,.3);background:rgba(212,175,55,.04)}
.role-icon{font-size:22px;width:36px;flex-shrink:0;text-align:center}
.role-name{font-size:14px;font-weight:600;color:var(--text);margin-bottom:2px;font-family:'DM Sans',sans-serif}
.role-desc{font-size:11px;color:var(--muted)}

/* ── MISC ── */
.sep{height:1px;background:var(--border);margin:20px 0}
.field{margin-bottom:18px}

/* ── ANIMATIONS ── */
@keyframes pg{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,.4)}50%{box-shadow:0 0 0 5px rgba(16,185,129,0)}}
@keyframes pr{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.5)}50%{box-shadow:0 0 0 7px rgba(239,68,68,0)}}
@keyframes py{0%,100%{box-shadow:0 0 0 0 rgba(245,158,11,.4)}50%{box-shadow:0 0 0 5px rgba(245,158,11,0)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.fade{animation:fadeUp .35s ease forwards}

@media(max-width:900px){
  .mon-grid{grid-template-columns:1fr 1fr}
  .g2{grid-template-columns:1fr}
  .sidebar{display:none}
  .opt-grid{grid-template-columns:1fr}
  .hora-grid{grid-template-columns:repeat(3,1fr)}
  .bp-tabs{gap:4px}
  .bp-tab{padding:6px 12px;font-size:10px}
}
@media(max-width:560px){
  .mon-grid{grid-template-columns:1fr}
  .hero-stats{gap:28px}
  .hero-title{font-size:72px}
}
`;

// ─────────────────────────────────────────────
// CLOCK
// ─────────────────────────────────────────────
function Clock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setT(new Date()), 1000); return () => clearInterval(i); }, []);
  return <>{t.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}</>;
}

// ─────────────────────────────────────────────
// BARBERO MODAL (Perfil)
// ─────────────────────────────────────────────
function BarberoModal({ b, onClose, onReservar }) {
  return (
    <div className="overlay fade" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>✕</button>
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 22 }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: b.color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display',serif", fontSize: 28, fontStyle: "italic", fontWeight: 700, color: "#000", flexShrink: 0 }}>
            {b.iniciales}
          </div>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700, fontStyle: "italic" }}>{b.nombre}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 2, textTransform: "uppercase", marginTop: 2 }}>{b.especialidad}</div>
            <div style={{ color: "var(--gold)", fontSize: 13, marginTop: 4 }}>{"★".repeat(5)} <span style={{ color: "var(--muted)", fontSize: 11 }}>{b.rating}</span></div>
          </div>
        </div>
        <div style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(212,175,55,.3),transparent)", marginBottom: 18 }} />
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, fontStyle: "italic", color: "var(--muted)", lineHeight: 1.8, marginBottom: 20 }}>{b.bio}</p>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: "var(--muted)", marginBottom: 10 }}>Galería de trabajos</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 20 }}>
          {b.galeria.map(g => (
            <div key={g} style={{ aspectRatio: "1", background: `${b.color}10`, border: `1px solid ${b.color}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "var(--muted)", textAlign: "center", padding: 8, fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: 14 }}>{g}</div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)", marginBottom: 20 }}>
          <span>Horario: <strong style={{ color: "#fff" }}>{b.horario}</strong></span>
          <span>Hoy: <strong style={{ color: "var(--gold)" }}>{b.serviciosHoy} servicios</strong></span>
        </div>
        <button className="btn-gold" style={{ width: "100%" }} onClick={() => { onClose(); onReservar(b); }}>
          Reservar con {b.nombre.split(" ")[0]}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// HOME
// ─────────────────────────────────────────────
function Home({ onNav }) {
  const [modal, setModal] = useState(null);
  const now = new Date();

  return (
    <div>
      {/* HERO */}
      <section className="hero">
        <div className="hero-grain" />
        <div className="hero-glow" />
        <div className="hero-lines" />
        <div className="hero-content fade">
          <div className="hero-eyebrow">Estilo · Precisión · Distinción</div>
          <div className="hero-title">
            <span className="outline">BARBER</span><br />
            <span className="gold">BOSS</span>
          </div>
          <div className="hero-tagline">Where every cut tells a story</div>
          <div className="hero-btns">
            <button className="btn-gold" onClick={() => onNav("reservas")}>Reservar Cita</button>
            <button className="btn-ghost" onClick={() => document.getElementById("equipo")?.scrollIntoView({ behavior: "smooth" })}>Nuestro Equipo</button>
          </div>
        </div>
        <div className="hero-stats">
          {[["4", "Barberos Elite"], ["4K+", "Clientes"], ["4.9", "Calificación"], ["6+", "Años"]].map(([n, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div className="hstat-num">{n}</div>
              <div className="hstat-lbl">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* EQUIPO */}
      <section id="equipo" style={{ background: "#060606", borderTop: "1px solid rgba(255,255,255,.04)" }}>
        <div className="section">
          <div className="sec-head">
            <div className="sec-tag">Conoce al equipo</div>
            <div className="sec-title">Nuestros Barberos</div>
            <div className="gold-rule" />
          </div>
          <div className="barb-grid">
            {BARBEROS.map(b => (
              <div key={b.id} className="barb-card" onClick={() => setModal(b)}>
                <div className="barb-photo" style={{ background: `${b.color}0D` }}>
                           {b.foto_url
                            ? <img src={b.foto_url} alt={b.nombre} style={{ width:"100%", height:"100%", objectFit:"cover", position:"absolute", inset:0 }} />
                            : <div className="barb-initials-ph" style={{ color: b.color }}>{b.iniciales}</div>
                            }
                  <div className="barb-hover">
                    <div className="barb-hover-cta">Ver perfil completo →</div>
                  </div>
                </div>
                <div className="barb-stripe" style={{ background: b.color }} />
                <div className="barb-body">
                  <div className="barb-name">{b.nombre}</div>
                  <div className="barb-esp">{b.especialidad}</div>
                  <div className="barb-rating">{"★".repeat(Math.round(b.rating))} <span style={{ color: "var(--muted)", fontSize: 12 }}>{b.rating}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICIOS */}
      <section style={{ background: "#000", borderTop: "1px solid rgba(255,255,255,.04)" }}>
        <div className="section">
          <div className="sec-head">
            <div className="sec-tag">Lo que ofrecemos</div>
            <div className="sec-title">Servicios</div>
            <div className="gold-rule" />
          </div>
          <div className="svc-grid">
            {SERVICIOS.map(s => (
              <div key={s.id} className="svc-item" onClick={() => onNav("reservas")}>
                <div>
                  <div className="svc-name">{s.nombre}</div>
                  <div className="svc-dur">{s.duracion} min</div>
                </div>
                <div className="svc-price">{fmtCOP(s.precio)}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 48 }}>
            <button className="btn-gold" onClick={() => onNav("reservas")}>Reservar Ahora</button>
          </div>
        </div>
      </section>

      {modal && <BarberoModal b={modal} onClose={() => setModal(null)} onReservar={b => onNav("reservas", { barbero: b })} />}
    </div>
  );
}

// ─────────────────────────────────────────────
// RESERVAS — 7 pasos (incluye abono)
// ─────────────────────────────────────────────
function Reservas({ initData = {} }) {
  const [step, setStep] = useState(initData.barbero ? 2 : 1);
  const [form, setForm] = useState({ nombre: "", telefono: "", email: "", barbero: initData.barbero || null, servicio: null, fecha: "", hora: "" });
  const [abonoMetodo, setAbonoMetodo] = useState("nequi");
  const [comprobante, setComprobante] = useState(null);
  const fileRef = useRef();

  const STEP_LABELS = ["Datos", "Barbero", "Servicio", "Fecha", "Hora", "Abono", "Confirmar"];

  const StepBar = () => (
    <div className="steps">
      {STEP_LABELS.map((s, i) => (
        <div key={s} style={{ display: "flex", alignItems: "center" }}>
          <div className={`step ${i + 1 < step ? "done" : ""} ${i + 1 === step ? "active" : ""}`}>
            <div className="step-n">{i + 1 < step ? "✓" : i + 1}</div>
            <span>{s}</span>
          </div>
          {i < STEP_LABELS.length - 1 && <div className="step-line" />}
        </div>
      ))}
    </div>
  );

  // ÉXITO
  if (step === 8) return (
    <div className="res-page">
      <div className="res-wrap">
        <div className="fcard fade" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 38, fontWeight: 900, fontStyle: "italic", color: "var(--gold)", marginBottom: 8 }}>¡Reserva Confirmada!</div>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, fontStyle: "italic", color: "var(--muted)", marginBottom: 32, lineHeight: 1.7 }}>
            Tu abono está en revisión. Recibirás confirmación por WhatsApp.
          </p>
          <div style={{ background: "rgba(212,175,55,.06)", border: "1px solid rgba(212,175,55,.2)", padding: 20, marginBottom: 24, textAlign: "left" }}>
            {[["Cliente", form.nombre], ["Barbero", form.barbero?.nombre], ["Servicio", form.servicio?.nombre], ["Fecha", form.fecha], ["Hora", form.hora], ["Abono enviado", `Comprobante vía ${abonoMetodo}`]].map(([l, v]) => (
              <div className="conf-row" key={l}><span className="conf-lbl">{l}</span><span style={{ fontWeight: 600 }}>{v}</span></div>
            ))}
          </div>
          <a href={`https://wa.me/573215557890?text=Hola, soy ${form.nombre}. Envié el comprobante de abono para mi cita el ${form.fecha} a las ${form.hora} con ${form.barbero?.nombre}.`} target="_blank" rel="noreferrer">
            <button className="btn-gold" style={{ width: "100%", marginBottom: 12 }}>📱 Confirmar por WhatsApp</button>
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="res-page">
      <div className="res-wrap">
        <div className="res-header">
          <div className="res-title">Reservar Cita</div>
          <div className="res-sub">Barber Boss · Sistema de Reservas</div>
        </div>
        <StepBar />

        <div className="fcard fade" key={step}>
          {/* PASO 1 */}
          {step === 1 && <>
            <div className="ftitle">Tus Datos</div>
            <div className="fsub">Necesitamos tus datos para confirmar la cita</div>
            {[["Nombre Completo", "nombre", "Carlos Rodríguez", "text"], ["Teléfono / WhatsApp", "telefono", "3001234567", "tel"], ["Email (opcional)", "email", "correo@email.com", "email"]].map(([l, k, p, t]) => (
              <div className="field" key={k}>
                <label className="flabel">{l}</label>
                <input className="finput" type={t} placeholder={p} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} />
              </div>
            ))}
            <div className="nav-btns">
              <button className="btn-next" disabled={!form.nombre || !form.telefono} onClick={() => setStep(2)}>Continuar →</button>
            </div>
          </>}

          {/* PASO 2 */}
          {step === 2 && <>
            <div className="ftitle">Elige tu Barbero</div>
            <div className="fsub">¿Con quién quieres ir?</div>
            <div className="opt-grid">
              {BARBEROS.map(b => (
                <div key={b.id} className={`opt ${form.barbero?.id === b.id ? "sel" : ""}`} onClick={() => setForm({ ...form, barbero: b })}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: b.color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, fontStyle: "italic", color: "#000", margin: "0 auto 10px" }}>{b.iniciales}</div>
                  <div className="opt-name">{b.nombre.split(" ")[0]}</div>
                  <div className="opt-sub">{b.especialidad.split("&")[0].trim()}</div>
                  <div style={{ color: "var(--gold)", fontSize: 12, marginTop: 5 }}>{"★".repeat(Math.round(b.rating))} {b.rating}</div>
                </div>
              ))}
            </div>
            <div className="nav-btns">
              <button className="btn-back" onClick={() => setStep(1)}>← Atrás</button>
              <button className="btn-next" disabled={!form.barbero} onClick={() => setStep(3)}>Continuar →</button>
            </div>
          </>}

          {/* PASO 3 */}
          {step === 3 && <>
            <div className="ftitle">Elige el Servicio</div>
            <div className="fsub">¿Qué te vas a hacer hoy?</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {SERVICIOS.map(s => (
                <div key={s.id} className={`opt ${form.servicio?.id === s.id ? "sel" : ""}`} onClick={() => setForm({ ...form, servicio: s })} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left" }}>
                  <div><div className="opt-name">{s.nombre}</div><div className="opt-sub">{s.duracion} min</div></div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontStyle: "italic", color: "var(--gold)" }}>{fmtCOP(s.precio)}</div>
                </div>
              ))}
            </div>
            <div className="nav-btns">
              <button className="btn-back" onClick={() => setStep(2)}>← Atrás</button>
              <button className="btn-next" disabled={!form.servicio} onClick={() => setStep(4)}>Continuar →</button>
            </div>
          </>}

          {/* PASO 4 */}
          {step === 4 && <>
            <div className="ftitle">Elige la Fecha</div>
            <div className="fsub">Selecciona el día de tu cita</div>
            <div className="day-grid">
              {Array.from({ length: 14 }, (_, i) => {
                const d = new Date(); d.setDate(d.getDate() + i + 1);
                const lbl = `${DIAS[d.getDay()].slice(0, 3)} ${d.getDate()} ${MESES[d.getMonth()]}`;
                return (
                  <div key={i} className={`day ${form.fecha === lbl ? "sel" : ""}`} onClick={() => setForm({ ...form, fecha: lbl })}>
                    <div style={{ fontSize: 9, color: "inherit", letterSpacing: 1, opacity: .6, marginBottom: 2 }}>{DIAS[d.getDay()].slice(0, 3).toUpperCase()}</div>
                    <div className="day-d">{d.getDate()}</div>
                    <div className="day-m">{MESES[d.getMonth()]}</div>
                  </div>
                );
              })}
            </div>
            <div className="nav-btns">
              <button className="btn-back" onClick={() => setStep(3)}>← Atrás</button>
              <button className="btn-next" disabled={!form.fecha} onClick={() => setStep(5)}>Continuar →</button>
            </div>
          </>}

          {/* PASO 5 */}
          {step === 5 && <>
            <div className="ftitle">Elige la Hora</div>
            <div className="fsub">Disponibilidad de {form.barbero?.nombre.split(" ")[0]} · {form.fecha}</div>
            <div className="hora-grid">
              {HORAS_DISP.map(h => {
                const ocp = HORAS_OCUP.includes(h);
                return (
                  <div key={h} className={`hora ${form.hora === h ? "sel" : ""} ${ocp ? "ocp" : ""}`} onClick={() => !ocp && setForm({ ...form, hora: h })}>
                    {h}
                    {ocp && <div style={{ fontSize: 9, color: "var(--muted)", marginTop: 1 }}>No disp.</div>}
                  </div>
                );
              })}
            </div>
            <div className="nav-btns">
              <button className="btn-back" onClick={() => setStep(4)}>← Atrás</button>
              <button className="btn-next" disabled={!form.hora} onClick={() => setStep(6)}>Continuar →</button>
            </div>
          </>}

          {/* PASO 6 — ABONO */}
          {step === 6 && <>
            <div className="ftitle">Pago de Abono</div>
            <div className="fsub">Aparta tu cupo con un abono mínimo de {fmtCOP(ABONO_MIN)}</div>
            <div className="abono-tabs">
              {[["nequi", "📱 Nequi"], ["daviplata", "📱 Daviplata"], ["banco", "🏦 Banco"]].map(([k, l]) => (
                <button key={k} className={`abono-tab ${abonoMetodo === k ? "act" : ""}`} onClick={() => setAbonoMetodo(k)}>{l}</button>
              ))}
            </div>
            <div className="info-box">
              <div className="info-box-title">{abonoMetodo === "nequi" ? "Nequi" : abonoMetodo === "daviplata" ? "Daviplata" : "Transferencia Bancaria"}</div>
              {abonoMetodo === "nequi" && <><div className="info-row"><span style={{ color: "var(--muted)" }}>Número</span><span className="info-val">{NEQUI}</span></div><div className="info-row"><span style={{ color: "var(--muted)" }}>Nombre</span><span className="info-val">Barber Boss</span></div></>}
              {abonoMetodo === "daviplata" && <><div className="info-row"><span style={{ color: "var(--muted)" }}>Número</span><span className="info-val">{DAVIPLATA}</span></div><div className="info-row"><span style={{ color: "var(--muted)" }}>Nombre</span><span className="info-val">Barber Boss</span></div></>}
              {abonoMetodo === "banco" && <><div className="info-row"><span style={{ color: "var(--muted)" }}>Datos</span><span className="info-val">{BANCO}</span></div><div className="info-row"><span style={{ color: "var(--muted)" }}>Concepto</span><span className="info-val">{form.nombre} · Abono cita</span></div></>}
              <div className="info-row" style={{ borderTop: "1px solid rgba(212,175,55,.15)", marginTop: 6, paddingTop: 8 }}><span style={{ color: "var(--muted)" }}>Monto mínimo</span><span style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontStyle: "italic", color: "var(--gold)" }}>{fmtCOP(ABONO_MIN)}</span></div>
            </div>
            <div className="flabel" style={{ marginBottom: 0 }}>Adjunta el comprobante de pago</div>
            <input type="file" accept="image/*" ref={fileRef} style={{ display: "none" }} onChange={e => e.target.files[0] && setComprobante(e.target.files[0].name)} />
            {!comprobante ? (
              <div className="upload-zone" onClick={() => fileRef.current?.click()}>
                <div className="upload-icon">📎</div>
                <div className="upload-text">Toca para subir la captura o foto del comprobante</div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>JPG, PNG — Máx. 5MB</div>
              </div>
            ) : (
              <div className="upload-preview">
                <span>✅</span>
                <span>{comprobante}</span>
                <button style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 12 }} onClick={() => setComprobante(null)}>Cambiar</button>
              </div>
            )}
            <div className="nav-btns">
              <button className="btn-back" onClick={() => setStep(5)}>← Atrás</button>
              <button className="btn-next" disabled={!comprobante} onClick={() => setStep(7)}>Continuar →</button>
            </div>
          </>}

          {/* PASO 7 */}
          {step === 7 && <>
            <div className="ftitle">Confirmar Reserva</div>
            <div className="fsub">Revisa los detalles antes de confirmar</div>
            <div style={{ background: "rgba(255,255,255,.02)", border: "1px solid var(--border)", padding: 20, marginBottom: 24 }}>
              {[["Cliente", form.nombre], ["Teléfono", form.telefono], ["Barbero", form.barbero?.nombre], ["Servicio", form.servicio?.nombre], ["Fecha", form.fecha], ["Hora", form.hora], ["Método pago", abonoMetodo.charAt(0).toUpperCase() + abonoMetodo.slice(1)], ["Comprobante", comprobante]].map(([l, v]) => (
                <div className="conf-row" key={l}>
                  <span className="conf-lbl">{l}</span>
                  <span style={{ fontWeight: 600, fontSize: l === "Total" ? 20 : 14, fontFamily: l === "Total" ? "'Playfair Display',serif" : "inherit", fontStyle: l === "Total" ? "italic" : "normal", color: l === "Total" ? "var(--gold)" : "var(--text)" }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ background: "rgba(245,158,11,.06)", border: "1px solid rgba(245,158,11,.2)", padding: "12px 16px", fontSize: 12, color: "#F59E0B", marginBottom: 20 }}>
              ⏳ Tu abono será revisado y confirmado en máximo 10 minutos por WhatsApp.
            </div>
            <div className="nav-btns">
              <button className="btn-back" onClick={() => setStep(6)}>← Atrás</button>
              <button className="btn-next" onClick={() => setStep(8)}>✓ Confirmar Reserva</button>
            </div>
          </>}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SUPER ADMIN
// ─────────────────────────────────────────────
function SuperAdmin() {
    const [autenticado, setAutenticado] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const PIN_ADMIN = "0000";

  const verificarPin = (digito) => {
    const nuevo = pin + digito;
    setPin(nuevo);
    if (nuevo.length === 4) {
      if (nuevo === PIN_ADMIN) {
        setAutenticado(true);
        setError(false);
      } else {
        setError(true);
        setTimeout(() => { setPin(""); setError(false); }, 1000);
      }
    }
  };

  if (!autenticado) return (
    <div style={{ minHeight:"100vh", background:"#080808", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"#141414", border:"1px solid rgba(255,255,255,.08)", padding:"48px 40px", width:340, textAlign:"center" }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontStyle:"italic", fontWeight:900, color:"#D4AF37", marginBottom:8 }}>Admin</div>
        <div style={{ fontSize:12, color:"#666", letterSpacing:2, textTransform:"uppercase", marginBottom:32 }}>Ingresa tu PIN</div>
        <div style={{ display:"flex", justifyContent:"center", gap:16, marginBottom:32 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width:14, height:14, borderRadius:"50%", background: pin.length > i ? (error ? "#EF4444" : "#D4AF37") : "rgba(255,255,255,.1)", transition:"all .2s" }} />
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:10 }}>
          {[1,2,3,4,5,6,7,8,9].map(n => (
            <button key={n} onClick={() => pin.length < 4 && verificarPin(String(n))}
              style={{ padding:"18px 0", background:"#1A1A1A", border:"1px solid rgba(255,255,255,.07)", color:"#fff", fontSize:20, fontWeight:600, cursor:"pointer", borderRadius:2 }}>
              {n}
            </button>
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <button onClick={() => setPin(p => p.slice(0,-1))}
            style={{ padding:"18px 0", background:"#1A1A1A", border:"1px solid rgba(255,255,255,.07)", color:"#888", fontSize:14, cursor:"pointer", borderRadius:2 }}>⌫</button>
          <button onClick={() => pin.length < 4 && verificarPin("0")}
            style={{ padding:"18px 0", background:"#1A1A1A", border:"1px solid rgba(255,255,255,.07)", color:"#fff", fontSize:20, fontWeight:600, cursor:"pointer", borderRadius:2 }}>0</button>
        </div>
        {error && <div style={{ marginTop:16, fontSize:12, color:"#EF4444", letterSpacing:1 }}>PIN incorrecto</div>}
      </div>
    </div>
  );
  const [tab, setTab] = useState("dashboard");
  const [reservas, setReservas] = useState(RESERVAS_INIT);
  const [abonoModal, setAbonoModal] = useState(null);

  if (!autenticado) return (
    <div style={{ minHeight:"100vh", background:"#080808", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"#141414", border:"1px solid rgba(255,255,255,.08)", padding:"48px 40px", width:340, textAlign:"center" }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontStyle:"italic", fontWeight:900, color:"#D4AF37", marginBottom:8 }}>Admin</div>
        <div style={{ fontSize:12, color:"#666", letterSpacing:2, textTransform:"uppercase", marginBottom:32 }}>Ingresa tu PIN</div>
        
        {/* Puntos */}
        <div style={{ display:"flex", justifyContent:"center", gap:16, marginBottom:32 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width:14, height:14, borderRadius:"50%", background: pin.length > i ? (error ? "#EF4444" : "#D4AF37") : "rgba(255,255,255,.1)", transition:"all .2s" }} />
          ))}
        </div>

        {/* Teclado */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:10 }}>
          {[1,2,3,4,5,6,7,8,9].map(n => (
            <button key={n} onClick={() => pin.length < 4 && verificarPin(String(n))}
              style={{ padding:"18px 0", background:"#1A1A1A", border:"1px solid rgba(255,255,255,.07)", color:"#fff", fontSize:20, fontWeight:600, cursor:"pointer", borderRadius:2, transition:"all .15s" }}>
              {n}
            </button>
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <button onClick={() => setPin(p => p.slice(0,-1))}
            style={{ padding:"18px 0", background:"#1A1A1A", border:"1px solid rgba(255,255,255,.07)", color:"#888", fontSize:14, cursor:"pointer", borderRadius:2 }}>
            ⌫
          </button>
          <button onClick={() => pin.length < 4 && verificarPin("0")}
            style={{ padding:"18px 0", background:"#1A1A1A", border:"1px solid rgba(255,255,255,.07)", color:"#fff", fontSize:20, fontWeight:600, cursor:"pointer", borderRadius:2 }}>
            0
          </button>
        </div>

        {error && <div style={{ marginTop:16, fontSize:12, color:"#EF4444", letterSpacing:1 }}>PIN incorrecto</div>}
      </div>
    </div>
  );
  const totalHoy = BARBEROS.reduce((a, b) => a + b.serviciosHoy, 0);
  const pendAbono = reservas.filter(r => r.abonoEstado === "pendiente").length;

  const SB = [
    { id: "dashboard", icon: "◈", label: "Dashboard" },
    { id: "abonos",    icon: "💳", label: `Abonos ${pendAbono > 0 ? `(${pendAbono})` : ""}` },
    { id: "reservas",  icon: "📅", label: "Todas las Citas" },
    { id: "barberos",  icon: "✂️", label: "Gestión Barberos" },
    { id: "calendario",icon: "🗓", label: "Calendario" },
    { id: "reportes",  icon: "📈", label: "Reportes" },
  ];

  const aprobAbono = id => setReservas(p => p.map(r => r.id === id ? { ...r, abonoEstado: "aprobado", estado: "pendiente" } : r));
  const rechAbono  = id => setReservas(p => p.map(r => r.id === id ? { ...r, abonoEstado: "rechazado" } : r));
  const iniciar    = id => setReservas(p => p.map(r => r.id === id ? { ...r, estado: "en_curso" } : r));
  const completar  = id => setReservas(p => p.map(r => r.id === id ? { ...r, estado: "completado" } : r));
  const cancelar   = id => setReservas(p => p.map(r => r.id === id ? { ...r, estado: "cancelado" } : r));

  return (
    <div className="admin">
      <div className="sidebar">
        <div style={{ padding: "16px 16px 0", marginBottom: 8 }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontStyle: "italic", color: "var(--gold)", letterSpacing: 1 }}>Admin</div>
        </div>
        <div className="sb-label">Panel</div>
        {SB.map(s => (
          <button key={s.id} className={`sb-item ${tab === s.id ? "act" : ""}`} onClick={() => setTab(s.id)}>
            <span>{s.icon}</span> {s.label}
          </button>
        ))}
      </div>

      <div className="admin-main">

        {/* DASHBOARD */}
        {tab === "dashboard" && <div className="fade">
          <div className="pg-head">
            <div className="pg-title">Dashboard</div>
            <div className="pg-sub">{new Date().toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
          </div>
          <div className="kpi-grid">
            {[
              { l: "Servicios Hoy", v: totalHoy, sub: "↑ +3 vs ayer", gold: false },
              { l: "Citas Pendientes", v: reservas.filter(r => r.estado === "pendiente").length, sub: "Para hoy", gold: false },
              { l: "Abonos en Revisión", v: pendAbono, sub: pendAbono > 0 ? "⚠ Requieren acción" : "Todo al día", gold: true },
              { l: "En Curso Ahora", v: reservas.filter(r => r.estado === "en_curso").length, sub: "Barberos activos", gold: false },
            ].map(k => (
              <div key={k.l} className="kpi">
                <div className="kpi-lbl">{k.l}</div>
                <div className={`kpi-val ${k.gold ? "gold" : ""}`}>{k.v}</div>
                <div className="kpi-sub">{k.sub}</div>
              </div>
            ))}
          </div>
          <div className="g2">
            <div className="blk">
              <div className="blk-title">Citas de Hoy</div>
              {reservas.slice(0, 5).map(r => {
                const b = BARBEROS.find(x => x.id === r.barberoId);
                return (
                  <div key={r.id} className="row">
                    <div className="dot" style={{ background: b?.color }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{r.cliente}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>{r.servicio} · {b?.nombre.split(" ")[0]}</div>
                    </div>
                    <div style={{ fontSize: 12, color: "#9CA3AF", marginRight: 8 }}>{r.hora}</div>
                    <span className={`badge ${r.estado}`}>{r.estado.replace("_", " ")}</span>
                  </div>
                );
              })}
            </div>
            <div className="blk">
              <div className="blk-title">Rendimiento Barberos</div>
              {BARBEROS.map(b => (
                <div key={b.id} className="row">
                  <div className="av-sm" style={{ background: b.color }}>{b.iniciales}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{b.nombre.split(" ")[0]}</span>
                      <span style={{ fontSize: 12, color: "var(--gold)" }}>{b.serviciosHoy} servicios</span>
                    </div>
                    <div className="prog">
                      <div className="prog-fill" style={{ width: `${(b.serviciosHoy / 10) * 100}%`, background: b.color }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Estado real */}
          <div className="blk">
            <div className="blk-title">Estado en Tiempo Real</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
              {BARBEROS.map(b => (
                <div key={b.id} style={{ background: "rgba(255,255,255,.02)", border: "1px solid var(--border)", padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div className="av-sm" style={{ background: b.color }}>{b.iniciales}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{b.nombre.split(" ")[0]}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <div className="dot" style={{ background: b.estado === "libre" ? "var(--libre)" : b.estado === "ocupado" ? "var(--ocupado)" : "var(--proximo)" }} />
                        <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: b.estado === "libre" ? "var(--libre)" : b.estado === "ocupado" ? "var(--ocupado)" : "var(--proximo)" }}>{b.estado}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>Cola: <strong style={{ color: "var(--gold)" }}>{b.cola}</strong></div>
                </div>
              ))}
            </div>
          </div>
        </div>}

        {/* ABONOS */}
        {tab === "abonos" && <div className="fade">
          <div className="pg-head">
            <div className="pg-title">Abonos</div>
            <div className="pg-sub">Comprobantes de pago pendientes de revisión</div>
          </div>
          {pendAbono > 0 && (
            <div style={{ background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.25)", padding: "12px 18px", marginBottom: 18, fontSize: 13, color: "#F59E0B" }}>
              ⚠ Tienes <strong>{pendAbono}</strong> comprobante{pendAbono > 1 ? "s" : ""} esperando aprobación
            </div>
          )}
          <div className="blk">
            <table className="tbl">
              <thead>
                <tr><th>Cliente</th><th>Barbero</th><th>Hora</th><th>Servicio</th><th>Comprobante</th><th>Estado</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {reservas.map(r => {
                  const b = BARBEROS.find(x => x.id === r.barberoId);
                  return (
                    <tr key={r.id}>
                      <td><div style={{ fontWeight: 600 }}>{r.cliente}</div><div style={{ fontSize: 11, color: "var(--muted)" }}>📱 {r.telefono}</div></td>
                      <td><div style={{ display: "flex", alignItems: "center", gap: 7 }}><div className="av-sm" style={{ background: b?.color, width: 26, height: 26, fontSize: 10 }}>{b?.iniciales}</div>{b?.nombre.split(" ")[0]}</div></td>
                      <td style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontStyle: "italic", color: "var(--gold)" }}>{r.hora}</td>
                      <td style={{ fontSize: 12 }}>{r.servicio}</td>
                      <td>
                        {r.comprobante
                          ? <button className="act-btn g" onClick={() => setAbonoModal(r)}>📎 Ver</button>
                          : <span style={{ fontSize: 11, color: "var(--muted)" }}>Sin comp.</span>}
                      </td>
                      <td><span className={`badge ${r.abonoEstado}`}>{r.abonoEstado.replace("_", " ")}</span></td>
                      <td>
                        {r.abonoEstado === "pendiente" && (
                          <div style={{ display: "flex", gap: 5 }}>
                            <button className="act-btn s" onClick={() => aprobAbono(r.id)}>✓ Aprobar</button>
                            <button className="act-btn d" onClick={() => rechAbono(r.id)}>✗ Rechazar</button>
                          </div>
                        )}
                        {r.abonoEstado === "aprobado" && <span style={{ fontSize: 11, color: "var(--libre)" }}>✓ Aprobado</span>}
                        {r.abonoEstado === "rechazado" && <span style={{ fontSize: 11, color: "var(--ocupado)" }}>✗ Rechazado</span>}
                        {r.abonoEstado === "sin_abono" && <span style={{ fontSize: 11, color: "var(--muted)" }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>}

        {/* TODAS LAS CITAS */}
        {tab === "reservas" && <div className="fade">
          <div className="pg-head"><div className="pg-title">Gestión de Citas</div><div className="pg-sub">Todas las reservas del día</div></div>
          <div className="blk">
            <table className="tbl">
              <thead><tr><th>Hora</th><th>Cliente</th><th>Barbero</th><th>Servicio</th><th>Abono</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {reservas.map(r => {
                  const b = BARBEROS.find(x => x.id === r.barberoId);
                  return (
                    <tr key={r.id}>
                      <td style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontStyle: "italic", color: "var(--gold)" }}>{r.hora}</td>
                      <td><div style={{ fontWeight: 600 }}>{r.cliente}</div><div style={{ fontSize: 11, color: "var(--muted)" }}>📱 {r.telefono}</div></td>
                      <td><div style={{ display: "flex", alignItems: "center", gap: 7 }}><div className="av-sm" style={{ background: b?.color, width: 26, height: 26, fontSize: 10 }}>{b?.iniciales}</div>{b?.nombre.split(" ")[0]}</div></td>
                      <td style={{ fontSize: 12 }}>{r.servicio}</td>
                      <td><span className={`badge ${r.abonoEstado}`}>{r.abonoEstado.replace("_", " ")}</span></td>
                      <td><span className={`badge ${r.estado}`}>{r.estado.replace("_", " ")}</span></td>
                      <td>
                        <div style={{ display: "flex", gap: 5 }}>
                          {r.estado === "pendiente" && r.abonoEstado === "aprobado" && <button className="act-btn s" onClick={() => iniciar(r.id)}>Iniciar</button>}
                          {r.estado === "en_curso" && <button className="act-btn p" onClick={() => completar(r.id)}>Completar</button>}
                          {(r.estado === "pendiente" || r.estado === "en_curso") && <button className="act-btn d" onClick={() => cancelar(r.id)}>Cancelar</button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>}

        {/* BARBEROS */}
        {tab === "barberos" && <div className="fade">
          <div className="pg-head"><div className="pg-title">Gestión Barberos</div><div className="pg-sub">Administra tu equipo</div></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16 }}>
            {BARBEROS.map(b => (
              <div key={b.id} className="blk" style={{ borderLeft: `3px solid ${b.color}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                  <div style={{ width: 54, height: 54, borderRadius: "50%", background: b.color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display',serif", fontSize: 18, fontStyle: "italic", fontWeight: 700, color: "#000" }}>{b.iniciales}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontStyle: "italic", fontWeight: 700 }}>{b.nombre}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 1 }}>{b.especialidad}</div>
                  </div>
                  <div className="dot" style={{ background: b.estado === "libre" ? "var(--libre)" : b.estado === "ocupado" ? "var(--ocupado)" : "var(--proximo)", width: 10, height: 10 }} />
                </div>
                <div className="sep" style={{ margin: "12px 0" }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                  {[["Rating", `${b.rating} ★`], ["Servicios Hoy", b.serviciosHoy], ["Cola", `${b.cola} personas`], ["Horario", b.horario]].map(([l, v]) => (
                    <div key={l}>
                      <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: 2, textTransform: "uppercase", fontFamily: "'DM Sans',sans-serif" }}>{l}</div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 7 }}>
                  <button className="act-btn p" style={{ flex: 1 }}>Editar</button>
                  <button className="act-btn g" style={{ flex: 1 }}>Ver Citas</button>
                  <button className="act-btn d">⊗</button>
                </div>
              </div>
            ))}
          </div>
        </div>}

        {/* CALENDARIO */}
        {tab === "calendario" && <div className="fade">
          <div className="pg-head"><div className="pg-title">Calendario</div><div className="pg-sub">Vista del día con todos los barberos</div></div>
          <div className="blk">
            <div style={{ display: "flex", gap: 16, marginBottom: 18, flexWrap: "wrap" }}>
              {BARBEROS.map(b => (
                <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12 }}>
                  <div style={{ width: 10, height: 10, background: b.color, borderRadius: 1 }} />
                  {b.nombre.split(" ")[0]}
                </div>
              ))}
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
                <thead>
                  <tr>
                    <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 9, color: "var(--muted)", letterSpacing: 2, textTransform: "uppercase", width: 80 }}>Hora</th>
                    {BARBEROS.map(b => (
                      <th key={b.id} style={{ padding: "8px 12px", fontSize: 11, fontWeight: 700, color: b.color, letterSpacing: 1, textTransform: "uppercase" }}>{b.nombre.split(" ")[0]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HORAS_DISP.slice(0, 10).map(h => {
                    const citasH = reservas.filter(r => r.hora === h);
                    return (
                      <tr key={h} style={{ borderTop: "1px solid rgba(255,255,255,.04)" }}>
                        <td style={{ padding: "8px 12px", fontFamily: "'Playfair Display',serif", fontSize: 16, fontStyle: "italic", color: "var(--muted)" }}>{h}</td>
                        {BARBEROS.map(b => {
                          const c = citasH.find(x => x.barberoId === b.id);
                          return (
                            <td key={b.id} style={{ padding: "5px 7px" }}>
                              {c ? (
                                <div style={{ background: `${b.color}18`, border: `1px solid ${b.color}35`, padding: "6px 10px", fontSize: 12 }}>
                                  <div style={{ fontWeight: 600, color: b.color }}>{c.cliente}</div>
                                  <div style={{ color: "var(--muted)", fontSize: 11 }}>{c.servicio}</div>
                                </div>
                              ) : (
                                <div style={{ height: 32, border: "1px dashed rgba(255,255,255,.05)" }} />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>}

        {/* REPORTES */}
        {tab === "reportes" && <div className="fade">
          <div className="pg-head"><div className="pg-title">Reportes</div><div className="pg-sub">Estadísticas del negocio</div></div>
          <div className="kpi-grid">
            {[["Servicios Semana", "98", "↑ +8% vs semana pasada"], ["Servicios Mes", "380", "↑ +15% vs mes pasado"], ["Servicio Top", "Corte + Barba", "38% del total"], ["Barbero #1", "David Rojas", "7 servicios hoy"]].map(([l, v, s]) => (
              <div key={l} className="kpi"><div className="kpi-lbl">{l}</div><div className="kpi-val gold" style={{ fontSize: 28 }}>{v}</div><div className="kpi-sub">{s}</div></div>
            ))}
          </div>
          <div className="g2">
            <div className="blk">
              <div className="blk-title">Ranking Barberos (Hoy)</div>
              {[...BARBEROS].sort((a, b) => b.serviciosHoy - a.serviciosHoy).map((b, i) => (
                <div key={b.id} className="row">
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontStyle: "italic", color: i === 0 ? "var(--gold)" : "var(--muted)", width: 28 }}>#{i + 1}</div>
                  <div className="av-sm" style={{ background: b.color }}>{b.iniciales}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{b.nombre}</div>
                    <div className="prog" style={{ marginTop: 5 }}>
                      <div className="prog-fill" style={{ width: `${(b.serviciosHoy / 10) * 100}%`, background: b.color }} />
                    </div>
                  </div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: 18, color: "var(--gold)", marginLeft: 10 }}>{b.serviciosHoy}</div>
                </div>
              ))}
            </div>
            <div className="blk">
              <div className="blk-title">Por Servicio</div>
              {SERVICIOS.map(s => (
                <div key={s.id} className="row">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, fontStyle: "italic", fontWeight: 600 }}>{s.nombre}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{s.duracion} min</div>
                  </div>
                  <div className="prog" style={{ width: 80 }}>
                    <div className="prog-fill" style={{ width: `${Math.floor(Math.random() * 60 + 30)}%`, background: "var(--gold)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>}
      </div>

      {/* MODAL COMPROBANTE */}
      {abonoModal && (
        <div className="overlay fade" onClick={e => e.target === e.currentTarget && setAbonoModal(null)}>
          <div className="modal">
            <button className="modal-close" onClick={() => setAbonoModal(null)}>✕</button>
            <div className="modal-title">Comprobante de Abono</div>
            <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 3 }}>Cliente</div>
                <div style={{ fontWeight: 600 }}>{abonoModal.cliente}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 3 }}>Servicio</div>
                <div style={{ fontWeight: 600 }}>{abonoModal.servicio}</div>
              </div>
            </div>
            <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid var(--border)", padding: 40, textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📄</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, fontStyle: "italic", color: "var(--muted)" }}>{abonoModal.comprobante}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>(En producción se mostraría la imagen real)</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="act-btn s" style={{ flex: 1, padding: "12px 0", fontSize: 12 }} onClick={() => { aprobAbono(abonoModal.id); setAbonoModal(null); }}>✓ Aprobar Abono</button>
              <button className="act-btn d" style={{ flex: 1, padding: "12px 0", fontSize: 12 }} onClick={() => { rechAbono(abonoModal.id); setAbonoModal(null); }}>✗ Rechazar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// PIN LOGIN → BARBERO PANEL
// ─────────────────────────────────────────────
function PinLogin({ onSuccess }) {
  const [barbSelId, setBarbSelId] = useState(null);
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");

  const pressKey = k => {
    if (pin.length < 4) setPin(p => p + k);
    setErr("");
  };
  const del = () => setPin(p => p.slice(0, -1));
  const verificar = () => {
    const b = BARBEROS.find(x => x.id === barbSelId);
    if (b && pin === b.pin) { onSuccess(b); }
    else { setErr("PIN incorrecto. Intenta de nuevo."); setPin(""); }
  };

  return (
    <div className="pin-page">
      <div className="pin-card fade">
        <div className="pin-logo">Barber<br />Boss</div>
        <div className="pin-sub">Acceso Barbero</div>

        <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12, fontFamily: "'DM Sans',sans-serif" }}>Selecciona tu perfil</div>
        <div className="pin-barb-sel">
          {BARBEROS.map(b => (
            <div key={b.id} className={`pin-barb ${barbSelId === b.id ? "sel" : ""}`}
              style={{ background: b.color }} onClick={() => { setBarbSelId(b.id); setPin(""); setErr(""); }}>
              {b.iniciales}
            </div>
          ))}
        </div>

        {barbSelId && (
          <>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontStyle: "italic", color: "var(--gold)", marginBottom: 14 }}>
              {BARBEROS.find(b => b.id === barbSelId)?.nombre}
            </div>
            <div className="pin-display">
              {"●".repeat(pin.length)}{"·".repeat(4 - pin.length)}
            </div>
            <div className="pin-grid">
              {[1,2,3,4,5,6,7,8,9].map(n => (
                <button key={n} className="pin-key" onClick={() => pressKey(String(n))}>{n}</button>
              ))}
              <button className="pin-key del" onClick={del}>⌫</button>
              <button className="pin-key" onClick={() => pressKey("0")}>0</button>
              <button className="pin-key" style={{ background: "rgba(212,175,55,.15)", borderColor: "rgba(212,175,55,.4)", color: "var(--gold)" }}
                onClick={verificar} disabled={pin.length < 4}>✓</button>
            </div>
            {err && <div className="pin-err">{err}</div>}
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// BARBERO PANEL
// ─────────────────────────────────────────────
function BarberoPanel({ barbero, onLogout }) {
  const [tab, setTab] = useState("citas");
  const [reservas, setReservas] = useState(RESERVAS_INIT);
  const misCitas = reservas.filter(r => r.barberoId === barbero.id);

  return (
    <div className="bp">
      <div className="bp-header">
        <div className="bp-av" style={{ background: barbero.color }}>{barbero.iniciales}</div>
        <div>
          <div className="bp-name">{barbero.nombre}</div>
          <div className="bp-esp">{barbero.especialidad}</div>
        </div>
        <div className="bp-tabs">
          {[["citas","Mis Citas"],["stats","Estadísticas"],["perfil","Mi Perfil"]].map(([k,l]) => (
            <button key={k} className={`bp-tab ${tab === k ? "act" : ""}`} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
        <button style={{ marginLeft: 16, background: "none", border: "1px solid var(--border)", color: "var(--muted)", padding: "7px 14px", cursor: "pointer", fontSize: 11, letterSpacing: 1, fontFamily: "'DM Sans',sans-serif" }} onClick={onLogout}>Salir</button>
      </div>
      <div className="bp-body">

        {tab === "citas" && <div className="fade">
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 30, fontWeight: 700, fontStyle: "italic" }}>Mis Citas de Hoy</div>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>{misCitas.length} citas · {barbero.horario}</div>
          </div>
          {misCitas.length === 0 && <div style={{ color: "var(--muted)", textAlign: "center", padding: "60px 0", fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontStyle: "italic" }}>Sin citas programadas para hoy</div>}
          {misCitas.map(r => (
            <div key={r.id} className="cita-card">
              <div>
                <div className="cita-hora">{r.hora.split(" ")[0]}</div>
                <div className="cita-hora-ampm">{r.hora.split(" ")[1]}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div className="cita-nombre">{r.cliente}</div>
                <div className="cita-svc">{r.servicio}</div>
                <span className={`badge ${r.abonoEstado}`} style={{ marginTop: 4, display: "inline-block" }}>Abono: {r.abonoEstado.replace("_", " ")}</span>
              </div>
              <span className={`badge ${r.estado}`}>{r.estado.replace("_", " ")}</span>
              <div className="cita-btns">
                {r.estado === "pendiente" && r.abonoEstado === "aprobado" && (
                  <button className="act-btn s" onClick={() => setReservas(p => p.map(x => x.id === r.id ? { ...x, estado: "en_curso" } : x))}>Iniciar</button>
                )}
                {r.estado === "en_curso" && (
                  <button className="act-btn p" onClick={() => setReservas(p => p.map(x => x.id === r.id ? { ...x, estado: "completado" } : x))}>✓ Completar</button>
                )}
                <a href={`https://wa.me/57${r.telefono}`} target="_blank" rel="noreferrer">
                  <button className="act-btn" style={{ background: "rgba(37,211,102,.12)", color: "#25D366", borderRadius: 1 }}>📱</button>
                </a>
              </div>
            </div>
          ))}
        </div>}

        {tab === "stats" && <div className="fade">
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 30, fontWeight: 700, fontStyle: "italic", marginBottom: 22 }}>Estadísticas</div>
          <div className="kpi-grid">
            {[["Servicios Hoy", barbero.serviciosHoy], ["Citas Pendientes", misCitas.filter(r => r.estado === "pendiente").length], ["Rating", `${barbero.rating} ★`]].map(([l, v]) => (
              <div key={l} className="kpi"><div className="kpi-lbl">{l}</div><div className="kpi-val gold">{v}</div></div>
            ))}
          </div>
          <div className="blk">
            <div className="blk-title">Ranking del Equipo</div>
            {[...BARBEROS].sort((a, b) => b.serviciosHoy - a.serviciosHoy).map((b, i) => (
              <div key={b.id} className="row">
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontStyle: "italic", color: i === 0 ? "var(--gold)" : "var(--muted)", width: 28 }}>#{i + 1}</div>
                <div className="av-sm" style={{ background: b.color, border: b.id === barbero.id ? "2px solid var(--gold)" : "none" }}>{b.iniciales}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: b.id === barbero.id ? 700 : 400, fontSize: 13, color: b.id === barbero.id ? "#fff" : "var(--muted)" }}>{b.nombre}</div>
                  <div className="prog" style={{ marginTop: 5 }}>
                    <div className="prog-fill" style={{ width: `${(b.serviciosHoy / 10) * 100}%`, background: b.id === barbero.id ? "var(--gold)" : b.color, opacity: b.id === barbero.id ? 1 : 0.5 }} />
                  </div>
                </div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: 18, color: b.id === barbero.id ? "var(--gold)" : "var(--muted)", marginLeft: 10 }}>{b.serviciosHoy}</div>
              </div>
            ))}
          </div>
        </div>}

        {tab === "perfil" && <div className="fade">
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 30, fontWeight: 700, fontStyle: "italic", marginBottom: 22 }}>Mi Perfil</div>
          <div className="blk" style={{ marginBottom: 14 }}>
            <div className="blk-title">Información</div>
            {[["Nombre", barbero.nombre], ["Especialidad", barbero.especialidad], ["Horario", barbero.horario], ["Bio", barbero.bio]].map(([l, v]) => (
              <div className="conf-row" key={l}><span className="conf-lbl">{l}</span><span style={{ maxWidth: 280, textAlign: "right", fontSize: 13 }}>{v}</span></div>
            ))}
          </div>
          <div className="blk">
            <div className="blk-title">Mi Galería</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              {barbero.galeria.map(g => (
                <div key={g} style={{ aspectRatio: "1", background: `${barbero.color}0D`, border: `1px solid ${barbero.color}25`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cormorant Garamond',serif", fontSize: 14, fontStyle: "italic", color: "var(--muted)", textAlign: "center", padding: 8 }}>{g}</div>
              ))}
            </div>
          </div>
        </div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MONITOR
// ─────────────────────────────────────────────
function Monitor() {
  const [showWalk, setShowWalk] = useState(false);
  const [walkNombre, setWalkNombre] = useState("");
  const [walkBarbId, setWalkBarbId] = useState(null);
  const now = new Date();
  const totalHoy = BARBEROS.reduce((a, b) => a + b.serviciosHoy, 0);

  return (
    <div className="monitor">
      <div className="mon-head">
        <div>
          <div className="mon-logo">Barber <span>Boss</span></div>
          <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: 2, textTransform: "uppercase" }}>Monitor de Sala</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div className="mon-clock"><Clock /></div>
        </div>
        <div className="mon-date">
          <div style={{ fontSize: 14, fontWeight: 500 }}>{DIAS[now.getDay()]}</div>
          <div>{now.getDate()} {MESES[now.getMonth()]} {now.getFullYear()}</div>
        </div>
      </div>

      <div className="mon-grid">
        {BARBEROS.map(b => (
          <div key={b.id} className={`mon-card ${b.estado}`}>
            <div>
              <div className="mon-barb-name" style={{ color: b.color }}>{b.nombre.split(" ")[0]}</div>
              <div className="mon-barb-esp">{b.especialidad}</div>
            </div>
            <div className={`mon-estado ${b.estado}`}>
              <div className={`mon-blink ${b.estado}`} />
              {b.estado === "libre" ? "Disponible" : b.estado === "ocupado" ? "Atendiendo" : "Próximo Cliente"}
            </div>
            <div>
              <div className="mon-label">{b.estado === "ocupado" ? "En Silla" : "Próxima Cita"}</div>
              {b.estado === "ocupado" && b.proximoCliente
                ? <div className="mon-cliente">{b.proximoCliente}</div>
                : b.proximoCliente
                  ? <>
                      <div className="mon-cliente">{b.proximoCliente}</div>
                      <div className="mon-hora">{b.proximaCita}</div>
                    </>
                  : <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontStyle: "italic", color: "var(--muted)" }}>Sin reservas</div>
              }
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "auto" }}>
              <div>
                <div className="mon-label">Cola</div>
                <div className="mon-cola" style={{ color: b.cola > 0 ? "var(--gold)" : "var(--muted)" }}>{b.cola}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="mon-label">Servicios hoy</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontStyle: "italic", color: "var(--muted)" }}>{b.serviciosHoy}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mon-footer">
        <div style={{ display: "flex", gap: 28 }}>
          <div className="mon-stat"><strong>Hoy:</strong> {totalHoy} clientes</div>
          <div className="mon-stat"><strong>Cola total:</strong> {BARBEROS.reduce((a, b) => a + b.cola, 0)} personas</div>
        </div>
        <div className="mon-prox-list">
          {RESERVAS_INIT.filter(r => r.estado === "pendiente").slice(0, 3).map(r => {
            const b = BARBEROS.find(x => x.id === r.barberoId);
            return (
              <div key={r.id} className="mon-prox-item">
                <strong>{r.hora}</strong> · {r.cliente.split(" ")[0]} → <span style={{ color: b?.color }}>{b?.nombre.split(" ")[0]}</span>
              </div>
            );
          })}
        </div>
        <button className="mon-walk-btn" onClick={() => setShowWalk(true)}>+ Walk-In</button>
      </div>

      {showWalk && (
        <div className="overlay fade" onClick={e => e.target === e.currentTarget && setShowWalk(false)}>
          <div className="modal">
            <button className="modal-close" onClick={() => setShowWalk(false)}>✕</button>
            <div className="modal-title">Turno Walk-In</div>
            <div className="field">
              <label className="flabel">Nombre del Cliente</label>
              <input className="finput" placeholder="Nombre completo" value={walkNombre} onChange={e => setWalkNombre(e.target.value)} />
            </div>
            <div className="field">
              <label className="flabel">Asignar a Barbero</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {BARBEROS.map(b => (
                  <div key={b.id} className={`opt ${walkBarbId === b.id ? "sel" : ""}`} style={{ padding: 12 }} onClick={() => setWalkBarbId(b.id)}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: b.color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, color: "#000" }}>{b.iniciales}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{b.nombre.split(" ")[0]}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: b.estado === "libre" ? "var(--libre)" : b.estado === "ocupado" ? "var(--ocupado)" : "var(--proximo)" }}>
                          <div className="dot" style={{ background: b.estado === "libre" ? "var(--libre)" : b.estado === "ocupado" ? "var(--ocupado)" : "var(--proximo)", width: 5, height: 5 }} />
                          {b.estado} · Cola {b.cola}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button className="btn-gold" style={{ width: "100%", marginTop: 4 }} onClick={() => { setShowWalk(false); setWalkNombre(""); setWalkBarbId(null); }}>
              Agregar a Cola
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// SELECTOR INICIAL
// ─────────────────────────────────────────────
function Selector({ onSelect }) {
  return (
    <div className="selector">
      <div className="sel-card fade">
        <div className="sel-logo">Barber<br />Boss</div>
        <div className="sel-sub">Sistema de Gestión</div>
        <div className="sel-divider" />
        {[
          { icon: "🏠", name: "Inicio — Landing", desc: "Página pública del negocio", view: "home" },
          { icon: "📅", name: "Reservar Cita", desc: "Flujo completo de reserva para clientes", view: "reservas" },
          { icon: "👑", name: "Panel Admin", desc: "Gestión completa del dueño", view: "admin" },
          { icon: "✂️", name: "Panel Barbero", desc: "Acceso con PIN personal por barbero", view: "pin" },
          { icon: "📺", name: "Monitor de Sala", desc: "Proyección para la barbería", view: "monitor" },
        ].map(r => (
          <button key={r.view} className="role-btn" onClick={() => onSelect(r.view)}>
            <div className="role-icon">{r.icon}</div>
            <div>
              <div className="role-name">{r.name}</div>
              <div className="role-desc">{r.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────
export default function App() {
  const location = useLocation();
  const [initData, setInitData] = useState({});
  const [barberoLogueado, setBarberoLogueado] = useState(null);

  const routeMap = {
    "/":        "home",
    "/reservas":"reservas",
    "/admin":   "admin",
    "/barbero": barberoLogueado ? "barbero" : "pin",
    "/monitor": "monitor",
    "/selector":"selector",
  };

  const view = routeMap[location.pathname] || "home";
  const navigate = useNavigate();
  const nav = (v, data = {}) => {
    setInitData(data);
    const pathMap = {
      home:"/" , reservas:"/reservas", admin:"/admin",
      pin:"/barbero", barbero:"/barbero", monitor:"/monitor", selector:"/selector"
    };
    navigate(pathMap[v] || "/");
  };


  // Nav visible solo en home y reservas (vistas públicas)
  const showNav = ["home", "reservas"].includes(view);

  return (
    <div style={{ background: "#000", minHeight: "100vh" }}>
      <style>{CSS}</style>

      {/* NAV solo en vistas públicas */}
      {showNav && (
        <nav className="nav">
          <div className="nav-logo" onClick={() => nav("home")}>Barber<span>Boss</span></div>
          <button className="nav-pill" onClick={() => document.getElementById("equipo")?.scrollIntoView({ behavior: "smooth" })}>Equipo</button>
          <button className="nav-pill" onClick={() => document.getElementById("equipo")?.scrollIntoView({ behavior: "smooth" })}>Servicios</button>
          <button className="nav-cta" onClick={() => nav("reservas")}>Reservar</button>
        </nav>
      )}

      {/* Botón "Menú" discreto en vistas privadas */}
      {!showNav && view !== "selector" && (
        <div style={{ position: "fixed", top: 16, right: 16, zIndex: 300 }}>
          <button onClick={() => { setBarberoLogueado(null); setView("selector"); }}
            style={{ background: "rgba(0,0,0,.7)", border: "1px solid rgba(255,255,255,.1)", color: "var(--muted)", padding: "7px 14px", cursor: "pointer", fontSize: 11, letterSpacing: 1, fontFamily: "'DM Sans',sans-serif", backdropFilter: "blur(10px)" }}>
            ← Menú
          </button>
        </div>
      )}

      {view === "selector" && <Selector onSelect={v => { setBarberoLogueado(null); nav(v); }} />}
      {view === "home"     && <Home onNav={nav} />}
      {view === "reservas" && <Reservas initData={initData} />}
      {view === "admin"    && <SuperAdmin />}
      {view === "monitor"  && <Monitor />}
      {view === "pin"      && !barberoLogueado && <PinLogin onSuccess={b => { setBarberoLogueado(b); setView("barbero"); }} />}
      {view === "barbero"  && barberoLogueado  && <BarberoPanel barbero={barberoLogueado} onLogout={() => { setBarberoLogueado(null); setView("pin"); }} />}
    </div>
  );
}