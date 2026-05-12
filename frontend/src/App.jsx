import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from './api.js';
import { supabase } from './supabase.js';
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
const HORAS_DISP = ["9:00 AM","9:45 AM","10:30 AM","11:15 AM","12:00 AM","12:45 AM","1:30 PM","2:15 PM","3:00 PM","3:45 PM","4:30 PM","5:15 PM","6:00 PM","6:45 PM","7:30 PM"];
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

::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#0a0a0a}::-webkit-scrollbar-thumb{background:#2a2a2a;border-radius:2px}

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
  margin-top:52px;position:relative;
}
.hstat-num{
  font-family:'Playfair Display',serif;font-size:38px;font-weight:700;
  color:var(--gold);line-height:1;font-style:italic;
}
.hstat-lbl{font-size:10px;color:var(--muted);letter-spacing:3px;text-transform:uppercase;margin-top:6px}

.section{padding:96px 40px;max-width:1200px;margin:0 auto}
.sec-tag{font-family:'Cormorant Garamond',serif;font-size:13px;font-weight:300;font-style:italic;letter-spacing:4px;color:var(--gold);text-transform:uppercase;margin-bottom:12px}
.sec-title{font-family:'Playfair Display',serif;font-size:clamp(40px,6vw,64px);font-weight:900;font-style:italic;color:#fff;line-height:1;letter-spacing:-1px}
.sec-head{text-align:center;margin-bottom:64px}
.gold-rule{width:48px;height:1px;background:var(--gold);margin:20px auto 0;opacity:.6}

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

.admin{min-height:100vh;display:flex;padding-top:0px;background:var(--dark)}
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
.kpi-sub{font-size:13px;color:var(--libre);margin-top:6px;font-family:'Cormorant Garamond',serif;font-style:italic;font-weight:400;letter-spacing:.5px}
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

.monitor{min-height:100vh;background:#000;padding-top:0;display:flex;flex-direction:column}
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

.overlay{position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:500;display:flex;align-items:center;justify-content:center;padding:16px}
.modal{background:var(--card);border:1px solid var(--border);padding:32px;width:100%;max-width:500px;position:relative;max-height:90vh;overflow-y:auto}
.modal-close{position:absolute;top:14px;right:14px;background:none;border:none;color:var(--muted);font-size:18px;cursor:pointer;transition:color .2s}
.modal-close:hover{color:#fff}
.modal-title{font-family:'Playfair Display',serif;font-size:26px;font-weight:700;font-style:italic;margin-bottom:22px}

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

.sep{height:1px;background:var(--border);margin:20px 0}
.field{margin-bottom:18px}

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
  .mob-menu-btn{display:block !important}
  .admin-main{padding:16px;padding-top:52px}
  .kpi-grid{grid-template-columns:1fr 1fr}
  .pg-title{font-size:26px}
  .tbl{font-size:11px}
  .tbl th,.tbl td{padding:8px 6px}
  .bp-header{flex-wrap:wrap;padding:14px 16px;gap:10px}
  .bp-body{padding:16px}
  .bp-name{font-size:18px}
  .bp-tabs{order:3;width:100%;justify-content:center;margin-left:0}
}
@media(max-width:560px){
  .mon-grid{grid-template-columns:1fr}
  .hero-stats{gap:28px}
  .hero-title{font-size:72px}
  /* Admin móvil */
  .admin{flex-direction:column}
  .admin-main{padding:12px}
  .kpi-grid{grid-template-columns:1fr 1fr;gap:8px}
  .kpi{padding:14px}
  .kpi-val{font-size:26px}
  .kpi-lbl{font-size:9px}
  .g2{grid-template-columns:1fr;gap:10px}
  .blk{padding:14px}
  .pg-title{font-size:22px}
  .pg-head{margin-bottom:16px}
  /* Tablas en móvil: scroll horizontal */
  .blk{overflow-x:auto}
  .tbl{min-width:500px}
  /* Panel barbero móvil */
  .bp-header{padding:12px;gap:8px}
  .bp-av{width:40px;height:40px;font-size:13px}
  .bp-name{font-size:16px}
  .bp-esp{font-size:11px}
  .bp-body{padding:12px}
  .bp-tabs{gap:2px}
  .bp-tab{padding:7px 10px;font-size:10px;letter-spacing:0}
  .cita-card{padding:12px;flex-wrap:wrap;gap:10px}
  .cita-hora{font-size:22px;width:60px}
  .cita-btns{width:100%;justify-content:flex-end}
  /* KPI panel barbero */
  .kpi-grid{gap:8px}
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

function GaleriaViewer({ barberoId, color }) {
  const [fotos, setFotos] = useState([]);

  useEffect(() => {
    api.getGaleriaBarbero(barberoId).then(data => setFotos(data)).catch(() => {});
  }, [barberoId]);

  if (fotos.length === 0) return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 20 }}>
      {["Fade Clásico","Pompadour","Undercut","Crew Cut","Buzz Cut","Quiff"].map(g => (
        <div key={g} style={{ aspectRatio: "1", background: `${color}10`, border: `1px solid ${color}25`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: 14, color: "var(--muted)", textAlign: "center", padding: 8 }}>{g}</div>
      ))}
    </div>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 20 }}>
      {fotos.map(f => (
        <div key={f.id} style={{ aspectRatio: "1", overflow: "hidden", border: `1px solid ${color}25`, position: "relative" }}>
          <img src={f.url} alt={f.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          {f.titulo && (
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,.6)", padding: "4px 6px", fontSize: 10, color: "#fff", textAlign: "center" }}>{f.titulo}</div>
          )}
        </div>
      ))}
    </div>
  );
}
// ─────────────────────────────────────────────
// BARBERO MODAL
// ─────────────────────────────────────────────
function BarberoModal({ b, onClose, onReservar }) {
  return (
    <div className="overlay fade" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>✕</button>
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 22 }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: b.color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display',serif", fontSize: 28, fontStyle: "italic", fontWeight: 700, color: "#000", flexShrink: 0 }}>
            {b.nombre?.slice(0,2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700, fontStyle: "italic" }}>{b.nombre}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 2, textTransform: "uppercase", marginTop: 2 }}>{b.especialidad}</div>
            <div style={{ color: "var(--gold)", fontSize: 13, marginTop: 4 }}>{"★".repeat(5)}</div>
          </div>
        </div>
        <div style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(212,175,55,.3),transparent)", marginBottom: 18 }} />
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, fontStyle: "italic", color: "var(--muted)", lineHeight: 1.8, marginBottom: 20 }}>{b.bio || "Especialista con años de experiencia en el arte de la barbería."}</p>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: "var(--muted)", marginBottom: 10 }}>Galería de trabajos</div>
        <GaleriaViewer barberoId={b.id} color={b.color} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)", marginBottom: 20 }}>
          <span>Especialidad: <strong style={{ color: "#fff" }}>{b.especialidad}</strong></span>
        </div>
        <button className="btn-gold" style={{ width: "100%" }} onClick={() => { onClose(); onReservar(b); }}>
          Reservar con {b.nombre?.split(" ")[0]}
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
  const [barberos, setBarberos] = useState(BARBEROS);
  const [servicios, setServicios] = useState(SERVICIOS);

  useEffect(() => {
    api.getBarberos()
      .then(data => setBarberos(data))
      .catch(() => {});
    api.getServicios()
      .then(data => setServicios(data))
      .catch(() => {});
  }, []);

  return (
    <div>
      <section className="hero">
        <div className="hero-grain" />
        <div className="hero-glow" />
        <div className="hero-lines" />
        {/* Logo marca de agua */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -54%)",
          width: "clamp(224px, 38vw, 476px)",
          height: "clamp(224px, 38vw, 476px)",
          backgroundImage: "url(https://cpanozlsttqdmixgxtum.supabase.co/storage/v1/object/public/comprobantes/comprobantes/Gemini_Generated_Image_x504l3x504l3x504-removebg-preview.png)",
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          opacity: 0.06,
          pointerEvents: "none",
          zIndex: 1,
          filter: "grayscale(100%)",
        }} />
        <div className="hero-content fade">
          <div className="hero-eyebrow">Estilo · Precisión · Distinción</div>
          <div className="hero-title">
            <span className="outline">BARBER</span><br />
            <span className="gold">BOSS</span>
          </div>
          <div className="hero-tagline">Reserva tu cita y déjanos cuidar tu estilo.</div>
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

      <section id="equipo" style={{ background: "#060606", borderTop: "1px solid rgba(255,255,255,.04)" }}>
        <div className="section">
          <div className="sec-head">
            <div className="sec-tag">Conoce al equipo</div>
            <div className="sec-title">Nuestros Barberos</div>
            <div className="gold-rule" />
          </div>
          <div className="barb-grid">
            {barberos.map(b => (
              <div key={b.id} className="barb-card" onClick={() => setModal(b)}>
                <div className="barb-photo" style={{ background: `${b.color}0D` }}>
                  {b.foto_url
                    ? <img src={b.foto_url} alt={b.nombre} style={{ width:"100%", height:"100%", objectFit:"cover", position:"absolute", inset:0 }} />
                    : <div className="barb-initials-ph" style={{ color: b.color }}>{b.nombre?.slice(0,2).toUpperCase()}</div>
                  }
                  <div className="barb-hover">
                    <div className="barb-hover-cta">Ver perfil completo →</div>
                  </div>
                </div>
                <div className="barb-stripe" style={{ background: b.color }} />
                <div className="barb-body">
                  <div className="barb-name">{b.nombre}</div>
                  <div className="barb-esp">{b.especialidad}</div>
                  <div className="barb-rating">{"★".repeat(5)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="servicios" style={{ background: "#000", borderTop: "1px solid rgba(255,255,255,.04)" }}>
        <div className="section">
          <div className="sec-head">
            <div className="sec-tag">Lo que ofrecemos</div>
            <div className="sec-title">Servicios</div>
            <div className="gold-rule" />
          </div>
          <div className="svc-grid">
            {servicios.map(s => (
              <div key={s.id} className="svc-item" onClick={() => onNav("reservas")}>
                <div>
                  <div className="svc-name">{s.nombre}</div>
                  <div className="svc-dur">{s.duracion_min || s.duracion} min</div>
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

function StepBar({ step, labels }) {
  return (
    <div className="steps">
      {labels.map((s, i) => (
        <div key={s} style={{ display: "flex", alignItems: "center" }}>
          <div className={`step ${i + 1 < step ? "done" : ""} ${i + 1 === step ? "active" : ""}`}>
            <div className="step-n">{i + 1 < step ? "?" : i + 1}</div>
            <span>{s}</span>
          </div>
          {i < labels.length - 1 && <div className="step-line" />}
        </div>
      ))}
    </div>
  );
}
// RESERVAS
// ─────────────────────────────────────────────
function Reservas({ initData = {}, barberos, servicios }) {
  const [step, setStep] = useState(initData.barbero ? 2 : 1);
  const [form, setForm] = useState({ nombre: "", telefono: "", email: "", barbero: initData.barbero || null, servicio: null, fecha: "", hora: "" });
  const [abonoMetodo, setAbonoMetodo] = useState("nequi");
  const [comprobante, setComprobante] = useState(null);
  const fileRef = useRef();
  const [horasOcupadas, setHorasOcupadas] = useState([]);

  // ✅ FIX: recarga horas ocupadas cada vez que cambia barbero, fecha O paso
  useEffect(() => {
    if (form.barbero?.id && form.fechaISO) {
      api.getHorasOcupadas(form.barbero.id, form.fechaISO)
        .then(data => setHorasOcupadas(data.map(r => r.hora_inicio)))
        .catch(() => {});
    }
  }, [form.barbero?.id, form.fechaISO, step]);

  const STEP_LABELS = ["Datos", "Barbero", "Servicio", "Fecha", "Hora", "Abono", "Confirmar"];

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
          <button className="btn-ghost" style={{ width: "100%" }} onClick={() => { setStep(1); setForm({ nombre: "", telefono: "", email: "", barbero: null, servicio: null, fecha: "", hora: "" }); }}>← Volver al Inicio</button>
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
        <StepBar step={step} labels={STEP_LABELS} />
        <div className="fcard fade" key={step}>
          {step === 1 && <>
            <div className="ftitle">Tus Datos</div>
            <div className="fsub">Necesitamos tus datos para confirmar la cita</div>
            {[["Nombre Completo", "nombre", "Carlos Rodríguez", "text"], ["Teléfono / WhatsApp", "telefono", "3001234567", "tel"]].map(([l, k, p, t]) => (
              <div className="field" key={k}>
                <label className="flabel">{l}</label>
                <input className="finput" type={t} placeholder={p} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} />
              </div>
            ))}
            <div className="nav-btns">
              <button className="btn-next" disabled={!form.nombre || !form.telefono} onClick={() => setStep(2)}>Continuar →</button>
            </div>
          </>}

          {step === 2 && <>
            <div className="ftitle">Elige tu Barbero</div>
            <div className="fsub">¿Con quién quieres ir?</div>
            <div className="opt-grid">
              {barberos.map(b => (
                <div key={b.id} className={`opt ${form.barbero?.id === b.id ? "sel" : ""}`} onClick={() => setForm({ ...form, barbero: b })}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: b.color, overflow: "hidden", margin: "0 auto 10px", flexShrink: 0 }}>
                   {b.foto_url
                   ? <img src={b.foto_url} alt={b.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                   : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, color: "#000" }}>{b.nombre?.slice(0,2).toUpperCase()}</div>
                  }
                    </div>
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

          {step === 3 && <>
            <div className="ftitle">Elige el Servicio</div>
            <div className="fsub">¿Qué te vas a hacer hoy?</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {servicios.map(s => (
                <div key={s.id} className={`opt ${form.servicio?.id === s.id ? "sel" : ""}`} onClick={() => setForm({ ...form, servicio: s })} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left" }}>
                  <div><div className="opt-name">{s.nombre}</div><div className="opt-sub">{s.duracion_min || s.duracion} min</div></div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontStyle: "italic", color: "var(--gold)" }}>{fmtCOP(s.precio)}</div>
                </div>
              ))}
            </div>
            <div className="nav-btns">
              <button className="btn-back" onClick={() => setStep(2)}>← Atrás</button>
              <button className="btn-next" disabled={!form.servicio} onClick={() => setStep(4)}>Continuar →</button>
            </div>
          </>}

          {step === 4 && <>
            <div className="ftitle">Elige la Fecha</div>
            <div className="fsub">Selecciona el día de tu cita</div>
            <div className="day-grid">
              {/* ✅ FIX: incluye hoy como opción */}
              {Array.from({ length: 14 }, (_, i) => {
                const d = new Date(); d.setDate(d.getDate() + i);
                const lbl = `${DIAS[d.getDay()].slice(0, 3)} ${d.getDate()} ${MESES[d.getMonth()]}`;
                return (
                  <div key={i} className={`day ${form.fecha === lbl ? "sel" : ""}`} onClick={() => {
                    const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                    setForm({ ...form, fecha: lbl, fechaISO: iso });
                  }}>
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

          {step === 5 && <>
            <div className="ftitle">Elige la Hora</div>
            <div className="fsub">Disponibilidad de {form.barbero?.nombre.split(" ")[0]} · {form.fecha}</div>
            <div className="hora-grid">
              {HORAS_DISP.map(h => {
                // ✅ FIX: convertir h a formato 24h exacto para comparar correctamente
                const [time, ampm] = h.split(' ');
                let [hh, mm] = time.split(':');
                hh = parseInt(hh);
                if (ampm === 'PM' && hh !== 12) hh += 12;
                if (ampm === 'AM' && hh === 12) hh = 0;
                const hora24 = `${String(hh).padStart(2,'0')}:${mm}`;
                const ocp = horasOcupadas.some(ho => ho.slice(0,5) === hora24);
                return (
                  <div key={h} className={`hora ${form.hora === h ? "sel" : ""} ${ocp ? "ocp" : ""}`} onClick={() => {
                    if (!ocp) {
                      setForm({ ...form, hora: h, hora24 });
                    }
                  }}>
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
            <input type="file" accept="image/*" ref={fileRef} style={{ display: "none" }} onChange={e => e.target.files[0] && setComprobante(e.target.files[0])} />
            {!comprobante ? (
              <div className="upload-zone" onClick={() => fileRef.current?.click()}>
                <div className="upload-icon">📎</div>
                <div className="upload-text">Toca para subir la captura o foto del comprobante</div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>JPG, PNG — Máx. 5MB</div>
              </div>
            ) : (
              <div className="upload-preview">
                <span>✅</span>
                <span>{comprobante?.name || comprobante}</span>
                <button style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 12 }} onClick={() => setComprobante(null)}>Cambiar</button>
              </div>
            )}
            <div className="nav-btns">
              <button className="btn-back" onClick={() => setStep(5)}>← Atrás</button>
              <button className="btn-next" disabled={!comprobante} onClick={() => setStep(7)}>Continuar →</button>
            </div>
          </>}

          {step === 7 && <>
            <div className="ftitle">Confirmar Reserva</div>
            <div className="fsub">Revisa los detalles antes de confirmar</div>
            <div style={{ background: "rgba(255,255,255,.02)", border: "1px solid var(--border)", padding: 20, marginBottom: 24 }}>
              {[["Cliente", form.nombre], ["Teléfono", form.telefono], ["Barbero", form.barbero?.nombre], ["Servicio", form.servicio?.nombre], ["Fecha", form.fecha], ["Hora", form.hora], ["Método pago", abonoMetodo.charAt(0).toUpperCase() + abonoMetodo.slice(1)], ["Comprobante", comprobante?.name || comprobante]].map(([l, v]) => (
                <div className="conf-row" key={l}>
                  <span className="conf-lbl">{l}</span>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ background: "rgba(245,158,11,.06)", border: "1px solid rgba(245,158,11,.2)", padding: "12px 16px", fontSize: 12, color: "#F59E0B", marginBottom: 20 }}>
              ⏳ Tu abono será revisado y confirmado en máximo 10 minutos por WhatsApp.
            </div>
            <div className="nav-btns">
              <button className="btn-back" onClick={() => setStep(6)}>← Atrás</button>
              {/* ✅ FIX 1: supabase.storage (no supabase.from) para subir el comprobante */}
              <button className="btn-next" onClick={async () => {
                try {
                  let comprobante_url = null;
                  if (comprobante && comprobante instanceof File) {
                    const ext = comprobante.name.split('.').pop();
                    const path = `comprobantes/${Date.now()}.${ext}`;
                    const { error: uploadError } = await supabase.storage
                      .from('comprobantes')
                      .upload(path, comprobante, { upsert: true });
                    if (!uploadError) {
                      const { data: urlData } = supabase.storage
                        .from('comprobantes')
                        .getPublicUrl(path);
                      comprobante_url = urlData.publicUrl;
                    }
                  }
                  await api.crearReserva({
                    cliente_nombre:   form.nombre,
                    cliente_telefono: form.telefono,
                    cliente_email:    form.email,
                    barbero_id:       form.barbero?.id,
                    servicio_id:      form.servicio?.id,
                    fecha_iso:        form.fechaISO,
                    hora_inicio:      form.hora24,
                    notas:            `Abono vía ${abonoMetodo}`,
                    comprobante_url,
                  });
                  setStep(8);
                } catch (err) {
                  console.error('Error al crear reserva:', err);
                  setStep(8);
                }
              }}>✓ Confirmar Reserva</button>
            </div>
          </>}
        </div>
      </div>
    </div>
  );
}
function EditBarberoForm({ barbero, onClose, onSaved }) {
  const [form, setForm] = useState({
    nombre:         barbero.nombre || "",
    especialidad:   barbero.especialidad || "",
    bio:            barbero.bio || "",
    horario_inicio: barbero.horario_inicio || "",
    horario_fin:    barbero.horario_fin || "",
    color:          barbero.color || "#D4AF37",
    porcentaje:     barbero.porcentaje || 60,
  });
  const [saving, setSaving] = useState(false);
  const [fotoPreview, setFotoPreview] = useState(barbero.foto_url || null);
  const [fotoFile, setFotoFile] = useState(null);
  const fileRef = useRef();

  const handleFoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const guardar = async () => {
    setSaving(true);
    console.log('form a guardar:', form);
    console.log('porcentaje:', form.porcentaje);
    let foto_url = barbero.foto_url;
    if (fotoFile) {
      const ext = fotoFile.name.split('.').pop();
      const path = `barbero-${barbero.id}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('fotos-barberos')
        .upload(path, fotoFile, { upsert: true });
      if (!uploadError) {
        const { data } = supabase.storage.from('fotos-barberos').getPublicUrl(path);
        foto_url = data.publicUrl;
      }
    }
    const { data, error } = await supabase
      .from('barberos')
      .update({ ...form, foto_url })
      .eq('id', barbero.id)
      .select();
    console.log('resultado update:', data, error);
    setSaving(false);
    onSaved();
  };

  return (
    <div>
      <div className="field">
        <label className="flabel">Foto del Barbero</label>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: form.color, overflow: "hidden", flexShrink: 0 }}>
            {fotoPreview
              ? <img src={fotoPreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: "#000" }}>{form.nombre?.slice(0,2).toUpperCase()}</div>
            }
          </div>
          <div>
            <input type="file" accept="image/*" ref={fileRef} style={{ display: "none" }} onChange={handleFoto} />
            <button className="act-btn g" onClick={() => fileRef.current?.click()}>📷 Cambiar foto</button>
            {fotoFile && <div style={{ fontSize: 11, color: "var(--libre)", marginTop: 6 }}>✓ {fotoFile.name}</div>}
          </div>
        </div>
      </div>

      {[
        ["Nombre", "nombre"],
        ["Especialidad", "especialidad"],
        ["Bio", "bio"],
        ["Horario inicio (HH:MM:SS)", "horario_inicio"],
        ["Horario fin (HH:MM:SS)", "horario_fin"],
      ].map(([l, k]) => (
        <div className="field" key={k}>
          <label className="flabel">{l}</label>
          <input className="finput" value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} />
        </div>
      ))}

      <div className="field">
        <label className="flabel">Color</label>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })}
            style={{ width: 48, height: 36, border: "none", background: "none", cursor: "pointer" }} />
          <span style={{ fontSize: 13, color: "var(--muted)" }}>{form.color}</span>
        </div>
      </div>

      <div className="field">
        <label className="flabel">Porcentaje del Barbero (%)</label>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <input type="range" min="0" max="100" step="5"
            value={form.porcentaje}
            onChange={e => setForm({ ...form, porcentaje: Number(e.target.value) })}
            style={{ flex: 1, accentColor: "var(--gold)" }} />
          <div style={{ background: "rgba(212,175,55,.1)", border: "1px solid rgba(212,175,55,.3)", padding: "6px 14px", minWidth: 60, textAlign: "center" }}>
            <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontStyle: "italic", color: "var(--gold)", fontWeight: 700 }}>{form.porcentaje}%</span>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
          <span>Barbero: <strong style={{ color: "var(--gold)" }}>{form.porcentaje}%</strong></span>
          <span>Negocio: <strong style={{ color: "var(--libre)" }}>{100 - form.porcentaje}%</strong></span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button className="btn-back" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
        <button className="btn-next" style={{ flex: 2 }} onClick={guardar} disabled={saving}>
          {saving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
    </div>
  );
}
function GananciasAdmin({ barberos }) {
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    api.getGananciasAdmin().then(setDatos).catch(() => {});
  }, []);

  if (!datos) return null;

  const { data, hoy, semanaInicio } = datos;

  const calcBarbero = (barberoId, desde) => {
    const reservas = data.filter(r => r.barbero?.id === barberoId && r.fecha >= desde);
    const total = reservas.reduce((a, r) => a + (r.servicio?.precio || 0), 0);
    const b = barberos.find(x => x.id === barberoId);
    const pct = b?.porcentaje || 60;
    return { total, ganancia: Math.round(total * pct / 100), negocio: Math.round(total * (100 - pct) / 100) };
  };

  const totalHoy    = data.filter(r => r.fecha === hoy).reduce((a, r) => a + (r.servicio?.precio || 0), 0);
  const totalSemana = data.filter(r => r.fecha >= semanaInicio).reduce((a, r) => a + (r.servicio?.precio || 0), 0);
  const totalMes    = data.reduce((a, r) => a + (r.servicio?.precio || 0), 0);

  return (
    <div>
      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        {[["Ingresos Hoy", totalHoy], ["Ingresos Semana", totalSemana], ["Ingresos Mes", totalMes]].map(([l, v]) => (
          <div key={l} className="kpi">
            <div className="kpi-lbl">{l}</div>
            <div className="kpi-val gold" style={{ fontSize: 26 }}>{fmtCOP(v)}</div>
          </div>
        ))}
      </div>
      <div className="blk">
        <div className="blk-title">Ganancias por Barbero — Esta Semana</div>
        {barberos.map(b => {
          const { total, ganancia, negocio } = calcBarbero(b.id, semanaInicio);
          return (
            <div key={b.id} className="row" style={{ flexWrap: "wrap", gap: 8 }}>
              <div className="av-sm" style={{ background: b.color }}>{b.nombre?.slice(0,2).toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{b.nombre}</div>
                <div style={{ fontSize: 10, color: "var(--muted)" }}>{b.porcentaje || 60}% barbero / {100 - (b.porcentaje || 60)}% negocio</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 2 }}>Total generado</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontStyle: "italic", color: "#fff" }}>{fmtCOP(total)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 2 }}>Barbero</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontStyle: "italic", color: "var(--gold)" }}>{fmtCOP(ganancia)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 2 }}>Negocio</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontStyle: "italic", color: "var(--libre)" }}>{fmtCOP(negocio)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
function Tienda({ }) {
  const [tab, setTab] = useState("productos");
  const [productos, setProductos] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [modalProducto, setModalProducto] = useState(null);
  const [modalVenta, setModalVenta] = useState(null);
  const [formProducto, setFormProducto] = useState({ nombre: "", precio: "", categoria: "bebidas", stock: "" });
  const [cantidadVenta, setCantidadVenta] = useState(1);
  const [saving, setSaving] = useState(false);

  const cargarProductos = () => api.getProductos().then(setProductos).catch(() => {});
  const cargarVentas = () => api.getVentas().then(setVentas).catch(() => {});

  useEffect(() => { cargarProductos(); cargarVentas(); }, []);

  const guardarProducto = async () => {
    setSaving(true);
    try {
      if (modalProducto?.id) {
        await api.actualizarProducto(modalProducto.id, {
          nombre: formProducto.nombre,
          precio: Number(formProducto.precio),
          categoria: formProducto.categoria,
          stock: Number(formProducto.stock),
        });
      } else {
        await api.crearProducto({
          nombre: formProducto.nombre,
          precio: Number(formProducto.precio),
          categoria: formProducto.categoria,
          stock: Number(formProducto.stock),
        });
      }
      setModalProducto(null);
      cargarProductos();
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const eliminar = async (id) => {
    if (!window.confirm("¿Eliminar este producto?")) return;
    await api.eliminarProducto(id);
    cargarProductos();
  };

  const registrarVenta = async () => {
    if (!modalVenta) return;
    setSaving(true);
    try {
      await api.registrarVenta(modalVenta.id, cantidadVenta, modalVenta.precio);
      setModalVenta(null);
      setCantidadVenta(1);
      cargarVentas();
      cargarProductos();
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const abrirEditar = (p) => {
    setFormProducto({ nombre: p.nombre, precio: p.precio, categoria: p.categoria, stock: p.stock });
    setModalProducto(p);
  };

  const abrirNuevo = () => {
    setFormProducto({ nombre: "", precio: "", categoria: "bebidas", stock: "" });
    setModalProducto({ nuevo: true });
  };

  const hoy = new Date().toISOString().split('T')[0];
  const totalHoy = ventas.filter(v => v.fecha === hoy).reduce((a, v) => a + v.total, 0);
  const totalMes = ventas.reduce((a, v) => a + v.total, 0);
  const categorias = ["bebidas", "camisas", "gorras", "otros"];

  return (
    <div className="fade">
      <div className="pg-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="pg-title">Tienda</div>
          <div className="pg-sub">Productos y ventas del negocio</div>
        </div>
        <button className="btn-gold" style={{ padding: "8px 20px", fontSize: 12 }} onClick={abrirNuevo}>+ Nuevo Producto</button>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        {[
          ["Productos Activos", productos.length],
          ["Ventas Hoy", fmtCOP(totalHoy)],
          ["Ventas del Mes", fmtCOP(totalMes)],
          ["Transacciones Hoy", ventas.filter(v => v.fecha === hoy).length],
        ].map(([l, v]) => (
          <div key={l} className="kpi">
            <div className="kpi-lbl">{l}</div>
            <div className="kpi-val gold" style={{ fontSize: 24 }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[["productos", "📦 Productos"], ["ventas", "💰 Historial Ventas"]].map(([k, l]) => (
          <button key={k} className={`abono-tab ${tab === k ? "act" : ""}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === "productos" && (
        <div>
          {categorias.map(cat => {
            const prods = productos.filter(p => p.categoria === cat);
            if (prods.length === 0) return null;
            return (
              <div key={cat} className="blk" style={{ marginBottom: 14 }}>
                <div className="blk-title">{cat.charAt(0).toUpperCase() + cat.slice(1)}</div>
                <table className="tbl">
                  <thead>
                    <tr><th>Producto</th><th>Precio</th><th>Stock</th><th>Acciones</th></tr>
                  </thead>
                  <tbody>
                    {prods.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>{p.nombre}</td>
                        <td style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", color: "var(--gold)", fontSize: 16 }}>{fmtCOP(p.precio)}</td>
                        <td>
                          <span style={{ color: p.stock <= 3 ? "var(--ocupado)" : p.stock <= 10 ? "var(--proximo)" : "var(--libre)", fontWeight: 600 }}>
                            {p.stock} uds
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button className="act-btn s" onClick={() => { setModalVenta(p); setCantidadVenta(1); }}>💰 Vender</button>
                            <button className="act-btn g" onClick={() => abrirEditar(p)}>Editar</button>
                            <button className="act-btn d" onClick={() => eliminar(p.id)}>⊗</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
          {productos.length === 0 && (
            <div className="blk" style={{ textAlign: "center", padding: "48px 0" }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontStyle: "italic", color: "var(--muted)" }}>No hay productos — agrega el primero</div>
            </div>
          )}
        </div>
      )}

      {tab === "ventas" && (
        <div className="blk">
          <table className="tbl">
            <thead>
              <tr><th>Fecha</th><th>Producto</th><th>Categoría</th><th>Cantidad</th><th>Precio Unit.</th><th>Total</th></tr>
            </thead>
            <tbody>
              {ventas.map(v => (
                <tr key={v.id}>
                  <td style={{ fontSize: 12, color: "var(--muted)" }}>{v.fecha}</td>
                  <td style={{ fontWeight: 600 }}>{v.producto?.nombre}</td>
                  <td><span className="badge pendiente">{v.producto?.categoria}</span></td>
                  <td style={{ textAlign: "center" }}>{v.cantidad}</td>
                  <td style={{ fontSize: 13, color: "var(--muted)" }}>{fmtCOP(v.precio_unitario)}</td>
                  <td style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", color: "var(--gold)", fontSize: 16 }}>{fmtCOP(v.total)}</td>
                </tr>
              ))}
              {ventas.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: "var(--muted)", fontStyle: "italic" }}>Sin ventas este mes</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalProducto && (
        <div className="overlay fade" onClick={e => e.target === e.currentTarget && setModalProducto(null)}>
          <div className="modal">
            <button className="modal-close" onClick={() => setModalProducto(null)}>✕</button>
            <div className="modal-title">{modalProducto.nuevo ? "Nuevo Producto" : "Editar Producto"}</div>
            {[["Nombre", "nombre", "text"], ["Precio", "precio", "number"], ["Stock", "stock", "number"]].map(([l, k, t]) => (
              <div className="field" key={k}>
                <label className="flabel">{l}</label>
                <input className="finput" type={t} value={formProducto[k]} onChange={e => setFormProducto({ ...formProducto, [k]: e.target.value })} />
              </div>
            ))}
            <div className="field">
              <label className="flabel">Categoría</label>
              <select className="fselect" value={formProducto.categoria} onChange={e => setFormProducto({ ...formProducto, categoria: e.target.value })}>
                {categorias.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button className="btn-back" style={{ flex: 1 }} onClick={() => setModalProducto(null)}>Cancelar</button>
              <button className="btn-next" style={{ flex: 2 }} onClick={guardarProducto} disabled={saving || !formProducto.nombre || !formProducto.precio}>
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalVenta && (
        <div className="overlay fade" onClick={e => e.target === e.currentTarget && setModalVenta(null)}>
          <div className="modal">
            <button className="modal-close" onClick={() => setModalVenta(null)}>✕</button>
            <div className="modal-title">Registrar Venta</div>
            <div style={{ background: "rgba(212,175,55,.06)", border: "1px solid rgba(212,175,55,.2)", padding: 16, marginBottom: 20 }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontStyle: "italic", marginBottom: 4 }}>{modalVenta.nombre}</div>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>Precio: <strong style={{ color: "var(--gold)" }}>{fmtCOP(modalVenta.precio)}</strong> · Stock: <strong style={{ color: modalVenta.stock <= 3 ? "var(--ocupado)" : "var(--libre)" }}>{modalVenta.stock} uds</strong></div>
            </div>
            <div className="field">
              <label className="flabel">Cantidad</label>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button className="act-btn g" onClick={() => setCantidadVenta(Math.max(1, cantidadVenta - 1))}>−</button>
                <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontStyle: "italic", color: "var(--gold)", minWidth: 40, textAlign: "center" }}>{cantidadVenta}</span>
                <button className="act-btn g" onClick={() => setCantidadVenta(Math.min(modalVenta.stock, cantidadVenta + 1))}>+</button>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderTop: "1px solid var(--border)", marginBottom: 20 }}>
              <span style={{ color: "var(--muted)" }}>Total</span>
              <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontStyle: "italic", color: "var(--gold)" }}>{fmtCOP(cantidadVenta * modalVenta.precio)}</span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-back" style={{ flex: 1 }} onClick={() => setModalVenta(null)}>Cancelar</button>
              <button className="btn-next" style={{ flex: 2 }} onClick={registrarVenta} disabled={saving || cantidadVenta < 1}>
                {saving ? "Registrando..." : "✓ Confirmar Venta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// ─────────────────────────────────────────────
// SUPER ADMIN
// ─────────────────────────────────────────────
function SuperAdmin({ barberos, servicios }) {
  const [autenticado, setAutenticado] = useState(false);
  const [pinAdmin, setPinAdmin] = useState("");
  const [errorAdmin, setErrorAdmin] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [reservas, setReservas] = useState([]);
  const hoy = new Date().toISOString().split('T')[0];
  const [editModal, setEditModal] = useState(null);
  const [reagendarModal, setReagendarModal] = useState(null);
  const [menuMobile, setMenuMobile] = useState(false);
  const [nuevaCitaModal, setNuevaCitaModal] = useState(false);
  const [nuevaCitaForm, setNuevaCitaForm] = useState({ nombre: "", telefono: "", barbero_id: "", servicio_id: "", fecha: new Date().toISOString().split('T')[0], hora: "" });
  const [nuevaCitaSaving, setNuevaCitaSaving] = useState(false);
  const [toasts, setToasts] = useState([]);
  const reservasRef = React.useRef([]);

  const [horaActual, setHoraActual] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setHoraActual(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Sonido de notificación con Web Audio API
  const playNotifSound = (tipo = "info") => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      if (tipo === "nueva") {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
      } else if (tipo === "abono") {
        osc.frequency.setValueAtTime(660, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
      } else {
        osc.frequency.setValueAtTime(660, ctx.currentTime);
      }
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch(e) {}
  };

  const addToast = (msg, tipo = "info") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, tipo }]);
    playNotifSound(tipo);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 5000);
  };

  const [fechaFiltro, setFechaFiltro] = useState(null);

  useEffect(() => {
    api.getReservas(fechaFiltro).then(data => {
      setReservas(data);
      reservasRef.current = data;
    }).catch(() => {});
    const unsub = api.suscribirReservas((payload) => {
      api.getReservas(fechaFiltro).then(data => {
        // Detectar nueva reserva
        if (payload.eventType === 'INSERT') {
          addToast(`Nueva cita: ${payload.new?.cliente_nombre || "Cliente"} acaba de reservar`, "nueva");
        }
        // Detectar nuevo comprobante
        if (payload.eventType === 'UPDATE' && payload.new?.abono_estado === 'pendiente' && payload.old?.abono_estado === 'sin_abono') {
          addToast(`Comprobante recibido de ${payload.new?.cliente_nombre || "un cliente"}`, "abono");
        }
        setReservas(data);
        reservasRef.current = data;
      }).catch(() => {});
    });
    return unsub;
  }, [fechaFiltro]);
  // ✅ AUTO-INICIO: cada minuto revisa citas pendientes con abono aprobado
  useEffect(() => {
    const autoIniciar = async () => {
      const ahora = new Date();
      const hoyStr = ahora.toISOString().split('T')[0];
      const horaActual = `${String(ahora.getHours()).padStart(2,'0')}:${String(ahora.getMinutes()).padStart(2,'0')}`;

      const citasParaIniciar = reservasRef.current.filter(r =>
        r.estado === 'pendiente' &&
        r.abono_estado === 'aprobado' &&
        r.fecha === hoyStr &&
        r.hora_inicio?.slice(0, 5) <= horaActual
      );

      for (const cita of citasParaIniciar) {
        try {
          await api.actualizarEstadoReserva(cita.id, 'en_curso');
          setReservas(p => p.map(r => r.id === cita.id ? { ...r, estado: 'en_curso' } : r));
          reservasRef.current = reservasRef.current.map(r => r.id === cita.id ? { ...r, estado: 'en_curso' } : r);
          addToast(`Cita de ${cita.cliente_nombre} iniciada automáticamente`, "info");
        } catch(e) {
          console.error('Error auto-inicio:', e);
        }
      }
    };

    // Ejecutar inmediatamente al cargar y luego cada minuto
    autoIniciar();
    const intervalo = setInterval(autoIniciar, 60000);
    return () => clearInterval(intervalo);
  }, []);

  const [abonoModal, setAbonoModal] = useState(null);
  const PIN_ADMIN = "0000";

  const verificarPinAdmin = (digito) => {
    const nuevo = pinAdmin + digito;
    setPinAdmin(nuevo);
    if (nuevo.length === 4) {
      if (nuevo === PIN_ADMIN) {
        setAutenticado(true);
        setErrorAdmin(false);
      } else {
        setErrorAdmin(true);
        setTimeout(() => { setPinAdmin(""); setErrorAdmin(false); }, 1000);
      }
    }
  };

  if (!autenticado) return (
    <div style={{ minHeight:"100vh", background:"#080808", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"#141414", border:"1px solid rgba(255,255,255,.08)", padding:"48px 40px", width:340, textAlign:"center" }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:32, fontStyle:"italic", fontWeight:900, color:"#D4AF37", marginBottom:4 }}>Admin</div>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:13, fontStyle:"italic", color:"#555", letterSpacing:3, marginBottom:36 }}>Barber Boss</div>
        <div style={{ display:"flex", justifyContent:"center", gap:16, marginBottom:32 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width:14, height:14, borderRadius:"50%", background: pinAdmin.length > i ? (errorAdmin ? "#EF4444" : "#D4AF37") : "rgba(255,255,255,.1)", transition:"all .2s" }} />
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:10 }}>
          {[1,2,3,4,5,6,7,8,9].map(n => (
            <button key={n} onClick={() => pinAdmin.length < 4 && verificarPinAdmin(String(n))}
              style={{ padding:"18px 0", background:"#1A1A1A", border:"1px solid rgba(255,255,255,.07)", color:"#fff", fontSize:20, fontWeight:600, cursor:"pointer", borderRadius:2 }}>
              {n}
            </button>
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <button onClick={() => setPinAdmin(p => p.slice(0,-1))}
            style={{ padding:"18px 0", background:"#1A1A1A", border:"1px solid rgba(255,255,255,.07)", color:"#888", fontSize:14, cursor:"pointer", borderRadius:2 }}>⌫</button>
          <button onClick={() => pinAdmin.length < 4 && verificarPinAdmin("0")}
            style={{ padding:"18px 0", background:"#1A1A1A", border:"1px solid rgba(255,255,255,.07)", color:"#fff", fontSize:20, fontWeight:600, cursor:"pointer", borderRadius:2 }}>0</button>
        </div>
        {errorAdmin && <div style={{ marginTop:16, fontSize:12, color:"#EF4444", letterSpacing:1 }}>PIN incorrecto</div>}
      </div>
    </div>
  );

  const totalHoy = reservas.filter(r => r.estado === 'completado').length;
  const pendAbono = reservas.filter(r => r.abono_estado === "pendiente").length;

  const SB_ICONS = {
    dashboard: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
    abonos: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
        <line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
    reservas: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    barberos: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/>
        <line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/>
      </svg>
    ),
    calendario: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
        <line x1="8" y1="14" x2="8" y2="14"/><line x1="12" y1="14" x2="12" y2="14"/>
        <line x1="16" y1="14" x2="16" y2="14"/>
      </svg>
    ),
    reportes: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
    tienda: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
  };

  const SB = [
    { id: "dashboard", label: "Dashboard" },
    { id: "abonos",    label: `Abonos${pendAbono > 0 ? ` (${pendAbono})` : ""}` },
    { id: "reservas",  label: "Todas las Citas" },
    { id: "barberos",  label: "Gestión Barberos" },
    { id: "calendario",label: "Calendario" },
    { id: "reportes",  label: "Reportes" },
    { id: "tienda",    label: "Tienda" },
  ];

  const aprobAbono = async id => {
    await api.actualizarAbono(id, 'aprobado');
    setReservas(p => p.map(r => r.id === id ? { ...r, abono_estado: "aprobado" } : r));
  };
  const rechAbono = async id => {
    await api.actualizarAbono(id, 'rechazado');
    setReservas(p => p.map(r => r.id === id ? { ...r, abono_estado: "rechazado" } : r));
  };
  const iniciar = async id => {
    await api.actualizarEstadoReserva(id, 'en_curso');
    setReservas(p => p.map(r => r.id === id ? { ...r, estado: "en_curso" } : r));
  };
  const completar = async id => {
    await api.actualizarEstadoReserva(id, 'completado');
    setReservas(p => p.map(r => r.id === id ? { ...r, estado: "completado" } : r));
  };
  const cancelar = async id => {
    await api.actualizarEstadoReserva(id, 'cancelado');
    setReservas(p => p.map(r => r.id === id ? { ...r, estado: "cancelado" } : r));
  };

  return (
    <div className="admin">
      {/* Botón hamburguesa móvil */}
      <button onClick={() => setMenuMobile(true)} style={{
        display: "none", position: "fixed", top: 14, left: 14, zIndex: 600,
        background: "var(--card)", border: "1px solid var(--border)", padding: "8px 10px",
        cursor: "pointer", borderRadius: 2,
      }} className="mob-menu-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {/* Overlay móvil */}
      {menuMobile && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 590 }} onClick={() => setMenuMobile(false)} />
      )}

      <div className="sidebar" style={menuMobile ? { display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 595, width: 220 } : {}}>
        <div style={{ padding: "16px 16px 0", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontStyle: "italic", color: "var(--gold)", letterSpacing: 1 }}>Admin</div>
          <button onClick={() => setMenuMobile(false)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 18, display: menuMobile ? "block" : "none" }}>✕</button>
        </div>
        <div className="sb-label">Panel</div>
        {SB.map(s => (
          <button key={s.id} className={`sb-item ${tab === s.id ? "act" : ""}`} onClick={() => { setTab(s.id); setMenuMobile(false); }}>
            <span style={{ display: "flex", alignItems: "center", opacity: tab === s.id ? 1 : 0.6 }}>{SB_ICONS[s.id]}</span>
            {s.label}
          </button>
        ))}
        <div style={{ position:"absolute", bottom:20, left:0, right:0, padding:"0 16px" }}>
          <button onClick={() => setAutenticado(false)}
            style={{ width:"100%", padding:"8px", background:"rgba(239,68,68,.08)", border:"1px solid rgba(239,68,68,.2)", color:"#EF4444", fontSize:11, letterSpacing:1, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
            Cerrar Sesión
          </button>
        </div>
      </div>

      <div className="admin-main">
        {tab === "tienda" && <Tienda />}

        {tab === "dashboard" && <div className="fade">
          {/* HEADER con reloj en vivo */}
          <div className="pg-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div className="pg-title">Dashboard</div>
              <div className="pg-sub">{new Date().toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, fontWeight: 700, fontStyle: "italic", color: "#fff", lineHeight: 1 }}>
                {horaActual.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: true })}
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 1, marginTop: 4 }}>Hora actual</div>
            </div>
          </div>

          {(() => {
            const hoyStr = new Date().toISOString().split('T')[0];
            const reservasHoy = reservas.filter(r => r.fecha === hoyStr);
            const pendAbonoTotal = reservas.filter(r => r.abono_estado === "pendiente").length;
            const enCursoAhora = reservasHoy.filter(r => r.estado === "en_curso");
            return (<>

          {/* ALERTA ABONOS PENDIENTES */}
          {pendAbonoTotal > 0 && (
            <div onClick={() => setTab("abonos")} style={{
              background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.35)",
              padding: "14px 20px", marginBottom: 20, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              transition: "all .2s"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(245,158,11,.14)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(245,158,11,.08)"}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--proximo)", animation: "py 1.5s infinite" }} />
                <span style={{ fontSize: 13, color: "#F59E0B", fontWeight: 600 }}>
                  {pendAbonoTotal} comprobante{pendAbonoTotal > 1 ? "s" : ""} esperando aprobación
                </span>
              </div>
              <span style={{ fontSize: 11, color: "#F59E0B", letterSpacing: 1, textTransform: "uppercase" }}>Revisar →</span>
            </div>
          )}

          {/* CITAS EN CURSO AHORA */}
          {enCursoAhora.length > 0 && (
            <div style={{ background: "rgba(16,185,129,.06)", border: "1px solid rgba(16,185,129,.25)", padding: "14px 20px", marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: "var(--libre)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10, fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>
                ● En atención ahora mismo
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {enCursoAhora.map(r => (
                  <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: r.barbero?.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#000" }}>{r.barbero?.nombre?.slice(0,2).toUpperCase()}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{r.cliente_nombre}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>{r.servicio?.nombre}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* KPIs */}
          <div className="kpi-grid">
            {[
              { l: "Servicios Hoy", v: reservasHoy.length, sub: `${reservasHoy.filter(r => r.estado === 'completado').length} completados` },
              { l: "Citas Pendientes", v: reservasHoy.filter(r => r.estado === "pendiente").length, sub: "Para hoy" },
              { l: "Abonos en Revisión", v: pendAbonoTotal, sub: pendAbonoTotal > 0 ? "Requieren acción" : "Todo al día", gold: true },
              { l: "En Curso Ahora", v: enCursoAhora.length, sub: "Barberos activos" },
            ].map(k => (
              <div key={k.l} className="kpi" style={{ position: "relative", overflow: "hidden" }}>
                {k.v === 0 && <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(45deg,transparent,transparent 10px,rgba(255,255,255,.01) 10px,rgba(255,255,255,.01) 11px)" }} />}
                <div className="kpi-lbl">{k.l}</div>
                <div className={`kpi-val ${k.gold ? "gold" : ""}`} style={{ color: k.v === 0 ? "rgba(255,255,255,.2)" : k.gold ? "var(--gold)" : "#fff" }}>{k.v}</div>
                <div className="kpi-sub" style={{ color: k.v === 0 ? "var(--muted)" : k.gold && k.v > 0 ? "#F59E0B" : "var(--libre)" }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* ACCESOS RÁPIDOS */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10, marginBottom: 20 }}>
            {[
              { label: "Nueva Cita", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>, action: () => setNuevaCitaModal(true), color: "var(--gold)", bg: "rgba(212,175,55,.08)", border: "rgba(212,175,55,.25)" },
              { label: "Ver Abonos", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>, action: () => setTab("abonos"), color: "#F59E0B", bg: "rgba(245,158,11,.06)", border: "rgba(245,158,11,.2)", badge: pendAbonoTotal },
              { label: "Todas las Citas", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, action: () => setTab("reservas"), color: "#3B82F6", bg: "rgba(59,130,246,.06)", border: "rgba(59,130,246,.2)" },
              { label: "Ver Reportes", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>, action: () => setTab("reportes"), color: "var(--libre)", bg: "rgba(16,185,129,.06)", border: "rgba(16,185,129,.2)" },
            ].map(a => (
              <button key={a.label} onClick={a.action} style={{
                background: a.bg, border: `1px solid ${a.border}`, padding: "12px 16px",
                cursor: "pointer", textAlign: "left", transition: "all .2s", position: "relative"
              }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
                <div style={{ fontSize: 18, marginBottom: 6 }}>{a.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: a.color, fontFamily: "'DM Sans',sans-serif", letterSpacing: .5 }}>{a.label}</div>
                {a.badge > 0 && <div style={{ position: "absolute", top: 8, right: 8, background: "#F59E0B", color: "#000", borderRadius: "50%", width: 18, height: 18, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{a.badge}</div>}
              </button>
            ))}
          </div>

          <div className="g2">
            <div className="blk">
              <div className="blk-title">Citas de Hoy</div>
              {reservasHoy.length === 0
                ? <div style={{ textAlign: "center", padding: "32px 0", fontFamily: "'Cormorant Garamond',serif", fontSize: 16, fontStyle: "italic", color: "var(--muted)" }}>Sin citas programadas para hoy</div>
                : reservasHoy.slice(0, 5).map(r => (
                  <div key={r.id} className="row">
                    <div className="dot" style={{ background: r.barbero?.color }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{r.cliente_nombre}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>{r.servicio?.nombre} · {r.barbero?.nombre?.split(" ")[0]}</div>
                    </div>
                    <div style={{ fontSize: 12, color: "#9CA3AF", marginRight: 8 }}>{r.hora_inicio?.slice(0,5)}</div>
                    <span className={`badge ${r.estado}`}>{r.estado.replace("_", " ")}</span>
                  </div>
                ))
              }
            </div>
            <div className="blk">
              <div className="blk-title">Rendimiento Barberos</div>
              {barberos.map(b => {
                const completados = reservasHoy.filter(r => r.barbero?.id === b.id && r.estado === 'completado').length;
                const total = reservasHoy.filter(r => r.barbero?.id === b.id).length;
                const pct = total > 0 ? Math.round((completados / total) * 100) : 0;
                return (
                  <div key={b.id} className="row">
                    <div className="av-sm" style={{ background: b.color }}>{b.nombre?.slice(0,2).toUpperCase()}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{b.nombre.split(" ")[0]}</span>
                        {total === 0
                          ? <span style={{ fontSize: 11, color: "var(--muted)", fontStyle: "italic" }}>Sin citas hoy</span>
                          : <span style={{ fontSize: 12, color: "var(--gold)" }}>{completados}/{total} completados</span>
                        }
                      </div>
                      <div className="prog">
                        <div className="prog-fill" style={{ width: `${pct}%`, background: pct === 0 ? "rgba(255,255,255,.08)" : b.color, transition: "width .5s ease" }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          </>); })()}
          {/* FIX: Estado en tiempo real calculado desde reservas reales */}
          <div className="blk">
            <div className="blk-title">Estado en Tiempo Real</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
              {barberos.map(b => {
                const hoyStr = new Date().toISOString().split('T')[0];
                const enCurso = reservas.some(r => r.barbero?.id === b.id && r.estado === 'en_curso' && r.fecha === hoyStr);
                const tienePendiente = reservas.some(r => r.barbero?.id === b.id && r.estado === 'pendiente' && r.fecha === hoyStr);
                const estadoReal = enCurso ? 'ocupado' : tienePendiente ? 'proximo' : 'libre';
                const colaReal = reservas.filter(r => r.barbero?.id === b.id && r.estado === 'pendiente' && r.fecha === hoyStr).length;
                return (
                <div key={b.id} style={{ background: "rgba(255,255,255,.02)", border: "1px solid var(--border)", padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div className="av-sm" style={{ background: b.color }}>{b.nombre?.slice(0,2).toUpperCase()}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{b.nombre.split(" ")[0]}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <div className="dot" style={{ background: estadoReal === "libre" ? "var(--libre)" : estadoReal === "ocupado" ? "var(--ocupado)" : "var(--proximo)" }} />
                        <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: estadoReal === "libre" ? "var(--libre)" : estadoReal === "ocupado" ? "var(--ocupado)" : "var(--proximo)" }}>{estadoReal}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>Cola: <strong style={{ color: "var(--gold)" }}>{colaReal}</strong></div>
                </div>
                );
              })}
            </div>
          </div>
        </div>}

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
                  return (
                    <tr key={r.id}>
                      <td><div style={{ fontWeight: 600 }}>{r.cliente_nombre}</div><div style={{ fontSize: 11, color: "var(--muted)" }}>📱 {r.cliente_tel}</div></td>
                      <td><div style={{ display: "flex", alignItems: "center", gap: 7 }}><div className="av-sm" style={{ background: r.barbero?.color, width: 26, height: 26, fontSize: 10 }}>{r.barbero?.nombre?.slice(0,2).toUpperCase()}</div>{r.barbero?.nombre.split(" ")[0]}</div></td>
                      <td style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontStyle: "italic", color: "var(--gold)" }}>{r.hora_inicio?.slice(0,5)}</td>
                      <td style={{ fontSize: 12 }}>{r.servicio?.nombre}</td>
                      <td>
                        {r.comprobante_url
                          ? <button className="act-btn g" onClick={() => setAbonoModal(r)}>📎 Ver</button>
                          : <span style={{ fontSize: 11, color: "var(--muted)" }}>Sin comp.</span>}
                      </td>
                      <td><span className={`badge ${r.abono_estado}`}>{r.abono_estado.replace("_", " ")}</span></td>
                      <td>
                        {r.abono_estado === "pendiente" && (
                          <div style={{ display: "flex", gap: 5 }}>
                            <button className="act-btn s" onClick={() => aprobAbono(r.id)}>✓ Aprobar</button>
                            <button className="act-btn d" onClick={() => rechAbono(r.id)}>✗ Rechazar</button>
                          </div>
                        )}
                        {r.abono_estado === "aprobado" && <span style={{ fontSize: 11, color: "var(--libre)" }}>✓ Aprobado</span>}
                        {r.abono_estado === "rechazado" && <span style={{ fontSize: 11, color: "var(--ocupado)" }}>✗ Rechazado</span>}
                        {r.abono_estado === "sin_abono" && <span style={{ fontSize: 11, color: "var(--muted)" }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>}

        {tab === "reservas" && <div className="fade">
          <div className="pg-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div className="pg-title">Gestión de Citas</div>
              <div className="pg-sub">{fechaFiltro ? `Reservas del ${fechaFiltro}` : "Todas las reservas"}</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="date" value={fechaFiltro || ""} onChange={e => setFechaFiltro(e.target.value || null)}
                style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)", padding: "7px 12px", fontSize: 12, fontFamily: "'DM Sans',sans-serif", cursor: "pointer" }} />
              {fechaFiltro && <button className="act-btn g" onClick={() => setFechaFiltro(null)}>Ver todas</button>}
              <button className="btn-gold" style={{ padding: "7px 16px", fontSize: 11 }} onClick={() => setNuevaCitaModal(true)}>+ Nueva Cita</button>
            </div>
          </div>
          <div className="blk">
            <table className="tbl">
              <thead><tr><th>Hora</th><th>Cliente</th><th>Barbero</th><th>Servicio</th><th>Abono</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {reservas.map(r => {
                  return (
                    <tr key={r.id}>
                      <td style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontStyle: "italic", color: "var(--gold)" }}>{r.hora_inicio?.slice(0,5)}</td>
                      <td><div style={{ fontWeight: 600 }}>{r.cliente_nombre}</div><div style={{ fontSize: 11, color: "var(--muted)" }}>📱 {r.cliente_tel}</div></td>
                      <td><div style={{ display: "flex", alignItems: "center", gap: 7 }}><div className="av-sm" style={{ background: r.barbero?.color, width: 26, height: 26, fontSize: 10 }}>{r.barbero?.nombre?.slice(0,2).toUpperCase()}</div>{r.barbero?.nombre.split(" ")[0]}</div></td>
                      <td style={{ fontSize: 12 }}>{r.servicio?.nombre}</td>
                      <td><span className={`badge ${r.abono_estado}`}>{r.abono_estado.replace("_", " ")}</span></td>
                      <td><span className={`badge ${r.estado}`}>{r.estado.replace("_", " ")}</span></td>
                      <td>
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                          {r.estado === "pendiente" && <button className="act-btn s" onClick={() => iniciar(r.id)}>Iniciar</button>}
                          {r.estado === "en_curso" && <button className="act-btn p" onClick={() => completar(r.id)}>Completar</button>}
                          {(r.estado === "pendiente" || r.estado === "en_curso") && <button className="act-btn d" onClick={() => cancelar(r.id)}>Cancelar</button>}
                          {(r.estado === "pendiente") && <button className="act-btn g" onClick={() => setReagendarModal(r)}>📅 Reagendar</button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>}

        {tab === "barberos" && <div className="fade">
          <div className="pg-head"><div className="pg-title">Gestión Barberos</div><div className="pg-sub">Administra tu equipo</div></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16 }}>
            {barberos.map(b => (
              <div key={b.id} className="blk" style={{ borderLeft: `3px solid ${b.color}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                  <div style={{ width: 54, height: 54, borderRadius: "50%", background: b.color, overflow: "hidden", flexShrink: 0 }}>
                  {b.foto_url
                   ? <img src={b.foto_url} alt={b.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display',serif", fontSize: 18, fontStyle: "italic", fontWeight: 700, color: "#000" }}>{b.nombre?.slice(0,2).toUpperCase()}</div>
                     }
                    </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontStyle: "italic", fontWeight: 700 }}>{b.nombre}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 1 }}>{b.especialidad}</div>
                  </div>
                  <div className="dot" style={{ background: b.estado === "libre" ? "var(--libre)" : b.estado === "ocupado" ? "var(--ocupado)" : "var(--proximo)", width: 10, height: 10 }} />
                </div>
                <div className="sep" style={{ margin: "12px 0" }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                  {[["Horario", `${b.horario_inicio?.slice(0,5)} – ${b.horario_fin?.slice(0,5)}`], ["Especialidad", b.especialidad]].map(([l, v]) => (
                    <div key={l}>
                      <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: 2, textTransform: "uppercase", fontFamily: "'DM Sans',sans-serif" }}>{l}</div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 7 }}>
                  <button className="act-btn p" style={{ flex: 1 }} onClick={() => setEditModal(b)}>Editar</button>
                  <button className="act-btn g" style={{ flex: 1 }} onClick={() => { setTab("reservas"); }}>Ver Citas</button>
                  <button className="act-btn d" onClick={async () => {
                                   if (!window.confirm(`¿Eliminar a ${b.nombre}?`)) return;
                                  await supabase.from('barberos').update({ activo: false }).eq('id', b.id);
                                  window.location.reload();
                                  }}>⊗</button>
                </div>
              </div>
            ))}
          </div>
        </div>}

        {tab === "calendario" && <div className="fade">
          <div className="pg-head"><div className="pg-title">Calendario</div><div className="pg-sub">Vista del día con todos los barberos</div></div>
          <div className="blk">
            <div style={{ display: "flex", gap: 16, marginBottom: 18, flexWrap: "wrap" }}>
              {barberos.map(b => (
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
                    {barberos.map(b => (
                      <th key={b.id} style={{ padding: "8px 12px", fontSize: 11, fontWeight: 700, color: b.color, letterSpacing: 1, textTransform: "uppercase" }}>{b.nombre.split(" ")[0]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* FIX: Calendario usa hora_inicio y barbero?.id correctos */}
                  {HORAS_DISP.slice(0, 10).map(h => {
                    const h24 = (() => {
                      const [time, ampm] = h.split(' ');
                      let [hh, mm] = time.split(':');
                      hh = parseInt(hh);
                      if (ampm === 'PM' && hh !== 12) hh += 12;
                      if (ampm === 'AM' && hh === 12) hh = 0;
                      return `${String(hh).padStart(2,'0')}:${mm}`;
                    })();
                    const hoyStr = new Date().toISOString().split('T')[0];
                    const citasH = reservas.filter(r => r.hora_inicio?.slice(0,5) === h24 && r.fecha === hoyStr);
                    return (
                      <tr key={h} style={{ borderTop: "1px solid rgba(255,255,255,.04)" }}>
                        <td style={{ padding: "8px 12px", fontFamily: "'Playfair Display',serif", fontSize: 16, fontStyle: "italic", color: "var(--muted)" }}>{h}</td>
                        {barberos.map(b => {
                          const c = citasH.find(x => x.barbero?.id === b.id);
                          return (
                            <td key={b.id} style={{ padding: "5px 7px" }}>
                              {c ? (
                                <div style={{ background: `${b.color}18`, border: `1px solid ${b.color}35`, padding: "6px 10px", fontSize: 12 }}>
                                  <div style={{ fontWeight: 600, color: b.color }}>{c.cliente_nombre}</div>
                                  <div style={{ color: "var(--muted)", fontSize: 11 }}>{c.servicio?.nombre}</div>
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

        {tab === "reportes" && <div className="fade">
          <div className="pg-head"><div className="pg-title">Reportes</div><div className="pg-sub">Estadísticas del negocio</div></div>
          {/* FIX: KPIs de reportes filtrados por hoy */}
          {(() => {
            const hoyRep = new Date().toISOString().split('T')[0];
            const resHoy = reservas.filter(r => r.fecha === hoyRep);
            return (
          <div className="kpi-grid">
            {[["Servicios Hoy", resHoy.filter(r => r.estado === 'completado').length, "Completados hoy"], ["Citas Totales", resHoy.length, "Registradas hoy"], ["Abonos Pendientes", reservas.filter(r => r.abono_estado === 'pendiente').length, "Por revisar"], ["En Curso", resHoy.filter(r => r.estado === 'en_curso').length, "Ahora mismo"]].map(([l, v, s]) => (
              <div key={l} className="kpi"><div className="kpi-lbl">{l}</div><div className="kpi-val gold" style={{ fontSize: 28 }}>{v}</div><div className="kpi-sub">{s}</div></div>
            ))}
          </div>
          ); })()}
          <GananciasAdmin barberos={barberos} />
          <div className="g2">
            <div className="blk">
              <div className="blk-title">Ranking Barberos (Hoy)</div>
              {/* FIX: Ranking usa fecha de hoy */}
              {[...barberos].map(b => ({
                ...b,
                completadosHoy: reservas.filter(r => r.barbero?.id === b.id && r.estado === 'completado' && r.fecha === new Date().toISOString().split('T')[0]).length
              })).sort((a, b) => b.completadosHoy - a.completadosHoy).map((b, i) => (
                <div key={b.id} className="row">
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontStyle: "italic", color: i === 0 ? "var(--gold)" : "var(--muted)", width: 28 }}>#{i + 1}</div>
                  <div className="av-sm" style={{ background: b.color }}>{b.nombre?.slice(0,2).toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{b.nombre}</div>
                    <div className="prog" style={{ marginTop: 5 }}>
                      <div className="prog-fill" style={{ width: `${(b.completadosHoy / Math.max(...barberos.map(x => reservas.filter(r => r.barbero?.id === x.id && r.estado === 'completado').length), 1)) * 100}%`, background: b.color }} />
                    </div>
                  </div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: 18, color: "var(--gold)", marginLeft: 10 }}>{b.completadosHoy}</div>
                </div>
              ))}
            </div>
            <div className="blk">
              <div className="blk-title">Por Servicio</div>
              {/* FIX: Por servicio usa semana completa */}
              {servicios.map(s => {
                const count = reservas.filter(r => r.servicio?.id === s.id && r.estado === 'completado').length;
                const maxCount = Math.max(...servicios.map(x => reservas.filter(r => r.servicio?.id === x.id && r.estado === 'completado').length), 1);
                return (
                  <div key={s.id} className="row">
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, fontStyle: "italic", fontWeight: 600 }}>{s.nombre}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>{count} realizados</div>
                    </div>
                    <div className="prog" style={{ width: 80 }}>
                      <div className="prog-fill" style={{ width: `${(count / maxCount) * 100}%`, background: "var(--gold)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>}
      </div>

      {abonoModal && (
        <div className="overlay fade" onClick={e => e.target === e.currentTarget && setAbonoModal(null)}>
          <div className="modal">
            <button className="modal-close" onClick={() => setAbonoModal(null)}>✕</button>
            <div className="modal-title">Comprobante de Abono</div>
            <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 3 }}>Cliente</div>
                <div style={{ fontWeight: 600 }}>{abonoModal.cliente_nombre}</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>📱 {abonoModal.cliente_tel}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 3 }}>Servicio</div>
                <div style={{ fontWeight: 600 }}>{abonoModal.servicio?.nombre}</div>
              </div>
            </div>
            {/* ✅ FIX 3 aplicado arriba en modal: imagen real del comprobante */}
            <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid var(--border)", padding: 12, textAlign: "center", marginBottom: 20 }}>
              {abonoModal.comprobante_url ? (
                <img
                  src={abonoModal.comprobante_url}
                  alt="Comprobante"
                  style={{ maxWidth: "100%", maxHeight: 400, objectFit: "contain", borderRadius: 2 }}
                />
              ) : (
                <div style={{ fontSize: 13, color: "var(--muted)", fontStyle: "italic", padding: 28 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
                  Sin comprobante adjunto
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="act-btn s" style={{ flex: 1, padding: "12px 0", fontSize: 12 }} onClick={() => { aprobAbono(abonoModal.id); setAbonoModal(null); }}>✓ Aprobar Abono</button>
              <button className="act-btn d" style={{ flex: 1, padding: "12px 0", fontSize: 12 }} onClick={() => { rechAbono(abonoModal.id); setAbonoModal(null); }}>✗ Rechazar</button>
            </div>
          </div>
        </div>
      )}
      {editModal && (
        <div className="overlay fade" onClick={e => e.target === e.currentTarget && setEditModal(null)}>
          <div className="modal">
            <button className="modal-close" onClick={() => setEditModal(null)}>✕</button>
            <div className="modal-title">Editar Barbero</div>
            <EditBarberoForm barbero={editModal} onClose={() => setEditModal(null)} onSaved={() => setEditModal(null)} />
          </div>
        </div>
      )}

      {/* MEJORA: Modal Nueva Cita (Admin) */}
      {nuevaCitaModal && (
        <div className="overlay fade" onClick={e => e.target === e.currentTarget && setNuevaCitaModal(false)}>
          <div className="modal" style={{ maxWidth: 540 }}>
            <button className="modal-close" onClick={() => setNuevaCitaModal(false)}>✕</button>
            <div className="modal-title">Nueva Cita</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="field">
                <label className="flabel">Nombre Cliente</label>
                <input className="finput" placeholder="Nombre completo" value={nuevaCitaForm.nombre}
                  onChange={e => setNuevaCitaForm(p => ({ ...p, nombre: e.target.value }))} />
              </div>
              <div className="field">
                <label className="flabel">Teléfono</label>
                <input className="finput" placeholder="3001234567" value={nuevaCitaForm.telefono}
                  onChange={e => setNuevaCitaForm(p => ({ ...p, telefono: e.target.value }))} />
              </div>
            </div>
            <div className="field">
              <label className="flabel">Barbero</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 8 }}>
                {barberos.map(b => (
                  <div key={b.id} className={`opt ${nuevaCitaForm.barbero_id === b.id ? "sel" : ""}`}
                    style={{ padding: "8px 10px", display: "flex", alignItems: "center", gap: 8 }}
                    onClick={() => setNuevaCitaForm(p => ({ ...p, barbero_id: b.id }))}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: b.color, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#000" }}>{b.nombre?.slice(0,2).toUpperCase()}</div>
                    <span style={{ fontSize: 12 }}>{b.nombre.split(" ")[0]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="field">
              <label className="flabel">Servicio</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {servicios.map(s => (
                  <div key={s.id} className={`opt ${nuevaCitaForm.servicio_id === s.id ? "sel" : ""}`}
                    style={{ padding: "8px 12px", display: "flex", justifyContent: "space-between" }}
                    onClick={() => setNuevaCitaForm(p => ({ ...p, servicio_id: s.id }))}>
                    <span style={{ fontSize: 13 }}>{s.nombre}</span>
                    <span style={{ fontSize: 13, color: "var(--gold)", fontFamily: "'Playfair Display',serif", fontStyle: "italic" }}>{fmtCOP(s.precio)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="field">
                <label className="flabel">Fecha</label>
                <input type="date" className="finput" value={nuevaCitaForm.fecha}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setNuevaCitaForm(p => ({ ...p, fecha: e.target.value }))} />
              </div>
              <div className="field">
                <label className="flabel">Hora</label>
                <input type="time" className="finput" value={nuevaCitaForm.hora}
                  onChange={e => setNuevaCitaForm(p => ({ ...p, hora: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button className="btn-back" style={{ flex: 1 }} onClick={() => setNuevaCitaModal(false)}>Cancelar</button>
              <button className="btn-next" style={{ flex: 2 }}
                disabled={nuevaCitaSaving || !nuevaCitaForm.nombre || !nuevaCitaForm.telefono || !nuevaCitaForm.barbero_id || !nuevaCitaForm.servicio_id || !nuevaCitaForm.fecha || !nuevaCitaForm.hora}
                onClick={async () => {
                  setNuevaCitaSaving(true);
                  try {
                    await api.crearReserva({
                      cliente_nombre:   nuevaCitaForm.nombre,
                      cliente_telefono: nuevaCitaForm.telefono,
                      barbero_id:       nuevaCitaForm.barbero_id,
                      servicio_id:      nuevaCitaForm.servicio_id,
                      fecha_iso:        nuevaCitaForm.fecha,
                      hora_inicio:      nuevaCitaForm.hora,
                      notas:            "Creada desde panel admin",
                      comprobante_url:  null,
                    });
                    setNuevaCitaModal(false);
                    setNuevaCitaForm({ nombre: "", telefono: "", barbero_id: "", servicio_id: "", fecha: new Date().toISOString().split('T')[0], hora: "" });
                    addToast("Cita creada correctamente", "info");
                  } catch(e) {
                    console.error(e);
                    addToast("Error al crear la cita", "info");
                  }
                  setNuevaCitaSaving(false);
                }}>
                {nuevaCitaSaving ? "Creando..." : "✓ Crear Cita"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MEJORA: Modal Reagendar */}
      {reagendarModal && (
        <div className="overlay fade" onClick={e => e.target === e.currentTarget && setReagendarModal(null)}>
          <div className="modal">
            <button className="modal-close" onClick={() => setReagendarModal(null)}>✕</button>
            <div className="modal-title">Reagendar Cita</div>
            <div style={{ marginBottom: 18, background: "rgba(255,255,255,.02)", border: "1px solid var(--border)", padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{reagendarModal.cliente_nombre}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{reagendarModal.servicio?.nombre} · {reagendarModal.barbero?.nombre}</div>
              <div style={{ fontSize: 12, color: "var(--gold)", marginTop: 4 }}>Actual: {reagendarModal.fecha} a las {reagendarModal.hora_inicio?.slice(0,5)}</div>
            </div>
            <div className="field">
              <label className="flabel">Nueva Fecha</label>
              <input type="date" className="finput" id="reagendar-fecha" defaultValue={reagendarModal.fecha}
                min={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="field">
              <label className="flabel">Nueva Hora</label>
              <input type="time" className="finput" id="reagendar-hora" defaultValue={reagendarModal.hora_inicio?.slice(0,5)} />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button className="btn-back" style={{ flex: 1 }} onClick={() => setReagendarModal(null)}>Cancelar</button>
              <button className="btn-next" style={{ flex: 2 }} onClick={async () => {
                const nuevaFecha = document.getElementById('reagendar-fecha').value;
                const nuevaHora = document.getElementById('reagendar-hora').value;
                if (!nuevaFecha || !nuevaHora) return;
                const { error } = await supabase.from('reservas')
                  .update({ fecha: nuevaFecha, hora_inicio: nuevaHora })
                  .eq('id', reagendarModal.id);
                if (!error) {
                  addToast(`Cita de ${reagendarModal.cliente_nombre} reagendada`, "info");
                  setReservas(p => p.map(r => r.id === reagendarModal.id ? { ...r, fecha: nuevaFecha, hora_inicio: nuevaHora } : r));
                  setReagendarModal(null);
                }
              }}>Guardar Nueva Hora</button>
            </div>
          </div>
        </div>
      )}

      {/* MEJORA: Toast notifications */}
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10 }}>
        {toasts.map(t => (
          <div key={t.id} className="fade" style={{
            background: t.tipo === "nueva" ? "rgba(16,185,129,.15)" : t.tipo === "abono" ? "rgba(245,158,11,.15)" : "rgba(59,130,246,.15)",
            border: `1px solid ${t.tipo === "nueva" ? "rgba(16,185,129,.4)" : t.tipo === "abono" ? "rgba(245,158,11,.4)" : "rgba(59,130,246,.4)"}`,
            color: t.tipo === "nueva" ? "var(--libre)" : t.tipo === "abono" ? "var(--proximo)" : "#3B82F6",
            padding: "12px 18px", fontSize: 13, fontFamily: "'DM Sans',sans-serif",
            maxWidth: 320, display: "flex", alignItems: "center", gap: 10,
          }}>
            <span>{t.tipo === "nueva" ? "📅" : t.tipo === "abono" ? "💳" : "ℹ️"}</span>
            <span>{t.msg}</span>
            <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))}
              style={{ marginLeft: "auto", background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 14 }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PIN LOGIN → BARBERO
// ─────────────────────────────────────────────
function PinLogin({ onSuccess, barberos }) {
  const [barbSelId, setBarbSelId] = useState(null);
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [barberosPins, setBarberosPins] = useState([]);

  useEffect(() => {
    supabase.from('barberos').select('id, pin').then(({ data }) => {
      if (data) setBarberosPins(data);
    });
  }, []);

  const pressKey = k => { if (pin.length < 4) setPin(p => p + k); setErr(""); };
  const del = () => setPin(p => p.slice(0, -1));
  const verificar = () => {
    const bp = barberosPins.find(x => x.id === barbSelId);
    const b = barberos.find(x => x.id === barbSelId);
    if (bp && pin === bp.pin) { onSuccess(b); }
    else { setErr("PIN incorrecto. Intenta de nuevo."); setPin(""); }
  };

  return (
    <div className="pin-page">
      <div className="pin-card fade">
        <div className="pin-logo">Barber<br />Boss</div>
        <div className="pin-sub">Acceso Barbero</div>
        <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12, fontFamily: "'DM Sans',sans-serif" }}>Selecciona tu perfil</div>
        <div className="pin-barb-sel">
          {barberos.map(b => (
            <div key={b.id} className={`pin-barb ${barbSelId === b.id ? "sel" : ""}`}
              style={{ background: b.color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontWeight: 700, fontSize: 18, color: "#000", letterSpacing: 0 }}
              onClick={() => { setBarbSelId(b.id); setPin(""); setErr(""); }}>
              {b.nombre?.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase()}
            </div>
          ))}
        </div>
        {barbSelId && (
          <>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, fontStyle: "italic", color: "var(--gold)", marginBottom: 14 }}>
              {barberos.find(b => b.id === barbSelId)?.nombre}
            </div>
            <div className="pin-display">{"●".repeat(pin.length)}{"·".repeat(4 - pin.length)}</div>
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
function GaleriaEditor({ barbero }) {
  const [fotos, setFotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [titulo, setTitulo] = useState("");
  const fileRef = useRef();

  const cargar = () => {
    api.getGaleriaBarbero(barbero.id).then(data => setFotos(data)).catch(() => {});
  };

  useEffect(() => { cargar(); }, [barbero.id]);

  const subir = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      await api.subirFotoGaleria(barbero.id, file, titulo || file.name.split('.')[0]);
      setTitulo("");
      cargar();
    } catch (err) {
      console.error(err);
    }
    setUploading(false);
  };

  const eliminar = async (foto) => {
    if (!window.confirm("¿Eliminar esta foto?")) return;
    await api.eliminarFotoGaleria(foto.id, foto.storage_key);
    cargar();
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <input className="finput" placeholder="Título (opcional)" value={titulo}
          onChange={e => setTitulo(e.target.value)}
          style={{ flex: 1, padding: "8px 12px", fontSize: 12 }} />
        <input type="file" accept="image/*" ref={fileRef} style={{ display: "none" }} onChange={subir} />
        <button className="act-btn p" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? "Subiendo..." : "📷 Subir foto"}
        </button>
      </div>
      {fotos.length === 0 && (
        <div style={{ textAlign: "center", padding: "32px 0", fontFamily: "'Cormorant Garamond',serif", fontSize: 16, fontStyle: "italic", color: "var(--muted)" }}>
          Aún no hay fotos en tu galería
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
        {fotos.map(f => (
          <div key={f.id} style={{ aspectRatio: "1", overflow: "hidden", border: `1px solid ${barbero.color}25`, position: "relative" }}>
            <img src={f.url} alt={f.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", opacity: 0, transition: "opacity .2s", display: "flex", alignItems: "center", justifyContent: "center" }}
              onMouseEnter={e => e.currentTarget.style.opacity = 1}
              onMouseLeave={e => e.currentTarget.style.opacity = 0}>
              <button className="act-btn d" onClick={() => eliminar(f)}>🗑 Eliminar</button>
            </div>
            {f.titulo && (
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,.6)", padding: "4px 6px", fontSize: 10, color: "#fff", textAlign: "center" }}>{f.titulo}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
function GananciasPanel({ barbero, misCitas }) {
  const [ganancias, setGanancias] = useState({ hoy: 0, semana: 0, mes: 0 });

  useEffect(() => {
    api.getGananciasBarbero(barbero.id)
      .then(data => setGanancias(data))
      .catch(() => {});
  }, [barbero.id, misCitas.length]);

  const pct = barbero.porcentaje || 60;
  const calc = (total) => Math.round(total * pct / 100);

  return (
    <div className="blk" style={{ marginBottom: 14 }}>
      <div className="blk-title">Mis Ganancias</div>
      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 16 }}>
        Tu porcentaje: <strong style={{ color: "var(--gold)" }}>{pct}%</strong>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {[
          ["Hoy", ganancias.hoy],
          ["Esta Semana", ganancias.semana],
          ["Este Mes", ganancias.mes],
        ].map(([l, total]) => (
          <div key={l} style={{ background: "rgba(212,175,55,.05)", border: "1px solid rgba(212,175,55,.15)", padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8, fontFamily: "'DM Sans',sans-serif" }}>{l}</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, fontStyle: "italic", color: "var(--gold)" }}>{fmtCOP(calc(total))}</div>
            <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>de {fmtCOP(total)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────
// BARBERO PANEL
// ─────────────────────────────────────────────
function BarberoPanel({ barbero, onLogout, barberos }) {
  const [tab, setTab] = useState("citas");
  const hoy = new Date().toISOString().split('T')[0];
  const [reservas, setReservas] = useState([]);
  const [barberoData, setBarberoData] = useState(barbero);

  useEffect(() => {
    api.getBarberos()
      .then(data => {
        const actualizado = data.find(b => b.id === barbero.id);
        if (actualizado) setBarberoData(actualizado);
      })
      .catch(() => {});
    api.getReservas(hoy).then(data => setReservas(data)).catch(() => {});
    const unsub = api.suscribirReservas(() => {
      api.getReservas(hoy).then(data => setReservas(data)).catch(() => {});
    });
    return unsub;
  }, []);

  const misCitas = reservas.filter(r => r.barbero?.id === barberoData.id);

  useEffect(() => {
    const autoIniciar = async () => {
      const ahora = new Date();
      const hoyStr = ahora.toISOString().split('T')[0];
      const horaActual = `${String(ahora.getHours()).padStart(2,'0')}:${String(ahora.getMinutes()).padStart(2,'0')}`;
      const citasParaIniciar = reservas.filter(r =>
        r.barbero?.id === barberoData.id &&
        r.estado === 'pendiente' &&
        r.abono_estado === 'aprobado' &&
        r.fecha === hoyStr &&
        r.hora_inicio?.slice(0, 5) <= horaActual
      );
      for (const cita of citasParaIniciar) {
        try {
          await api.actualizarEstadoReserva(cita.id, 'en_curso');
          setReservas(p => p.map(r => r.id === cita.id ? { ...r, estado: 'en_curso' } : r));
        } catch(e) {
          console.error('Error auto-inicio barbero:', e);
        }
      }
    };
    autoIniciar();
    const intervalo = setInterval(autoIniciar, 60000);
    return () => clearInterval(intervalo);
  }, [reservas]);

  return (
    <div className="bp">
      <div className="bp-header">
        <div className="bp-av" style={{ background: barberoData.color, overflow: "hidden", padding: 0 }}>
          {barberoData.foto_url
            ? <img src={barberoData.foto_url} alt={barberoData.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : barberoData.nombre?.slice(0,2).toUpperCase()
          }
        </div>
        <div>
          <div className="bp-name">{barberoData.nombre}</div>
          <div className="bp-esp">{barberoData.especialidad}</div>
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
            <div style={{ fontSize: 13, color: "var(--muted)" }}>{misCitas.length} citas · {barberoData.horario_inicio?.slice(0,5)} – {barberoData.horario_fin?.slice(0,5)}</div>
          </div>
          {misCitas.length === 0 && <div style={{ color: "var(--muted)", textAlign: "center", padding: "60px 0", fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontStyle: "italic" }}>Sin citas programadas para hoy</div>}
          {misCitas.map(r => (
            <div key={r.id} className="cita-card">
              <div>
                <div className="cita-hora">{r.hora_inicio?.slice(0,5)}</div>
                <div className="cita-hora-ampm"></div>
              </div>
              <div style={{ flex: 1 }}>
                <div className="cita-nombre">{r.cliente_nombre}</div>
                <div className="cita-svc">{r.servicio?.nombre}</div>
                <span className={`badge ${r.abono_estado}`} style={{ marginTop: 4, display: "inline-block" }}>Abono: {r.abono_estado.replace("_", " ")}</span>
              </div>
              <span className={`badge ${r.estado}`}>{r.estado.replace("_", " ")}</span>
              <div className="cita-btns">
                {r.estado === "pendiente" && r.abono_estado === "aprobado" && (
                  <button className="act-btn s" onClick={async () => {
                    await api.actualizarEstadoReserva(r.id, "en_curso");
                    setReservas(p => p.map(x => x.id === r.id ? { ...x, estado: "en_curso" } : x));
                  }}>Iniciar</button>
                )}
                {r.estado === "en_curso" && (
                  <button className="act-btn p" onClick={async () => {
                    await api.actualizarEstadoReserva(r.id, "completado");
                    setReservas(p => p.map(x => x.id === r.id ? { ...x, estado: "completado" } : x));
                  }}>✓ Completar</button>
                )}
                <a href={`https://wa.me/57${r.cliente_tel}`} target="_blank" rel="noreferrer">
                  <button className="act-btn" style={{ background: "rgba(37,211,102,.12)", color: "#25D366", borderRadius: 1 }}>📱</button>
                </a>
              </div>
            </div>
          ))}
        </div>}

        {tab === "stats" && <div className="fade">
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 30, fontWeight: 700, fontStyle: "italic", marginBottom: 22 }}>Estadísticas</div>
          <div className="kpi-grid">
            {[["Completados Hoy", misCitas.filter(r => r.estado === "completado").length], ["Citas Pendientes", misCitas.filter(r => r.estado === "pendiente").length], ["En Curso", misCitas.filter(r => r.estado === "en_curso").length]].map(([l, v]) => (
              <div key={l} className="kpi"><div className="kpi-lbl">{l}</div><div className="kpi-val gold">{v}</div></div>
            ))}
          </div>
          <GananciasPanel barbero={barberoData} misCitas={misCitas} />
          <div className="blk">
            <div className="blk-title">Ranking del Equipo</div>
            {[...barberos].map(b => ({
              ...b,
              completadosHoy: reservas.filter(r => r.barbero?.id === b.id && r.estado === 'completado').length
            })).sort((a, b) => b.completadosHoy - a.completadosHoy).map((b, i) => (
              <div key={b.id} className="row">
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontStyle: "italic", color: i === 0 ? "var(--gold)" : "var(--muted)", width: 28 }}>#{i + 1}</div>
                <div className="av-sm" style={{ background: b.color, border: b.id === barberoData.id ? "2px solid var(--gold)" : "none" }}>{b.nombre?.slice(0,2).toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: b.id === barberoData.id ? 700 : 400, fontSize: 13, color: b.id === barberoData.id ? "#fff" : "var(--muted)" }}>{b.nombre.split(" ")[0]}</span>
                    <span style={{ fontSize: 12, color: "var(--gold)" }}>{b.completadosHoy} completados</span>
                  </div>
                  <div className="prog" style={{ marginTop: 5 }}>
                    <div className="prog-fill" style={{ width: "100%", background: b.id === barberoData.id ? "var(--gold)" : b.color, opacity: b.id === barberoData.id ? 1 : 0.3 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>}

        {tab === "perfil" && <div className="fade">
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 30, fontWeight: 700, fontStyle: "italic", marginBottom: 22 }}>Mi Perfil</div>
          <div className="blk" style={{ marginBottom: 14 }}>
            <div className="blk-title">Información</div>
            {[["Nombre", barberoData.nombre], ["Especialidad", barberoData.especialidad], ["Horario", `${barberoData.horario_inicio?.slice(0,5)} – ${barberoData.horario_fin?.slice(0,5)}`], ["Bio", barberoData.bio]].map(([l, v]) => (
              <div className="conf-row" key={l}><span className="conf-lbl">{l}</span><span style={{ maxWidth: 280, textAlign: "right", fontSize: 13 }}>{v}</span></div>
            ))}
          </div>
          <div className="blk">
            <div className="blk-title">Mi Galería</div>
            <GaleriaEditor barbero={barberoData} />
          </div>
        </div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MONITOR
// ─────────────────────────────────────────────
function Monitor({ barberos, servicios }) {
  const [reservas, setReservas] = useState([]);
  const hoy = new Date().toISOString().split('T')[0];
  const [showWalk, setShowWalk] = useState(false);
  const [walkNombre, setWalkNombre] = useState("");
  const [walkBarbId, setWalkBarbId] = useState(null);
  const [walkServId, setWalkServId] = useState(null);
  const [walkSaving, setWalkSaving] = useState(false);
  const now = new Date();

  useEffect(() => {
    api.getReservas(hoy).then(data => setReservas(data)).catch(() => {});
    const unsub = api.suscribirReservas(() => {
      api.getReservas(hoy).then(data => setReservas(data)).catch(() => {});
    });
    return unsub;
  }, []);

  const totalHoy = reservas.filter(r => r.estado === 'completado').length;

  const getBarberoEstado = (barberoId) => {
    const enCurso = reservas.find(r => r.barbero?.id === barberoId && r.estado === 'en_curso');
    if (enCurso) return 'ocupado';
    const proximo = reservas.find(r => r.barbero?.id === barberoId && r.estado === 'pendiente');
    if (proximo) return 'proximo';
    return 'libre';
  };

  const getProximaCita = (barberoId) => {
    return reservas
      .filter(r => r.barbero?.id === barberoId && r.estado === 'pendiente')
      .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))[0];
  };

  const getCitaEnCurso = (barberoId) => {
    return reservas.find(r => r.barbero?.id === barberoId && r.estado === 'en_curso');
  };

  const getCola = (barberoId) => {
    return reservas.filter(r => r.barbero?.id === barberoId && r.estado === 'pendiente').length;
  };

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
        {barberos.map(b => {
          const estado = getBarberoEstado(b.id);
          const citaEnCurso = getCitaEnCurso(b.id);
          const proximaCita = getProximaCita(b.id);
          const cola = getCola(b.id);
          const citaActiva = citaEnCurso || proximaCita;
          // Próximas 3 citas pendientes de este barbero
          const proximas3 = reservas
            .filter(r => r.barbero?.id === b.id && r.estado === 'pendiente')
            .sort((a, x) => a.hora_inicio.localeCompare(x.hora_inicio))
            .slice(0, 3);
          return (
            <div key={b.id} className={`mon-card ${estado}`}>
              <div>
                <div className="mon-barb-name" style={{ color: b.color }}>{b.nombre.split(" ")[0]}</div>
                <div className="mon-barb-esp">{b.especialidad}</div>
              </div>
              <div className={`mon-estado ${estado}`}>
                <div className={`mon-blink ${estado}`} />
                {estado === "libre" ? "Disponible" : estado === "ocupado" ? "Atendiendo" : "Próximo Cliente"}
              </div>
              <div>
                <div className="mon-label">{estado === "ocupado" ? "En Silla" : "Próxima Cita"}</div>
                {citaActiva
                  ? <>
                      <div className="mon-cliente">{citaActiva.cliente_nombre}</div>
                      {/* ✅ FIX: mostrar solo HH:MM sin segundos */}
                      <div className="mon-hora">{citaActiva.hora_inicio?.slice(0,5)}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{citaActiva.servicio?.nombre}</div>
                    </>
                  : <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontStyle: "italic", color: "var(--muted)" }}>Sin reservas</div>
                }
              </div>
              {/* ✅ MEJORA: próximas 3 citas del barbero */}
              {proximas3.length > 0 && (
                <div style={{ borderTop: "1px solid rgba(255,255,255,.06)", paddingTop: 10, marginTop: 4 }}>
                  <div className="mon-label" style={{ marginBottom: 6 }}>Cola de espera</div>
                  {proximas3.map((c, i) => (
                    <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: i < proximas3.length - 1 ? "1px solid rgba(255,255,255,.04)" : "none" }}>
                      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, fontStyle: "italic", color: i === 0 ? "#fff" : "var(--muted)" }}>
                        {c.cliente_nombre?.split(" ")[0]}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--gold)", fontWeight: 600 }}>
                        {c.hora_inicio?.slice(0,5)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "auto", paddingTop: 10 }}>
                <div>
                  <div className="mon-label">Cola</div>
                  <div className="mon-cola" style={{ color: cola > 0 ? "var(--gold)" : "var(--muted)" }}>{cola}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="mon-label">Completados hoy</div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontStyle: "italic", color: "var(--muted)" }}>
                    {reservas.filter(r => r.barbero?.id === b.id && r.estado === 'completado').length}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mon-footer">
        <div style={{ display: "flex", gap: 28 }}>
          <div className="mon-stat"><strong>Completados hoy:</strong> {totalHoy}</div>
          <div className="mon-stat"><strong>Cola total:</strong> {barberos.reduce((a, b) => a + getCola(b.id), 0)} personas</div>
        </div>
        <div className="mon-prox-list">
          {reservas.filter(r => r.estado === "pendiente")
            .sort((a,b) => a.hora_inicio.localeCompare(b.hora_inicio))
            .slice(0, 3).map(r => (
            <div key={r.id} className="mon-prox-item">
              <strong>{r.hora_inicio?.slice(0,5)}</strong> · {r.cliente_nombre?.split(" ")[0]} → <span style={{ color: r.barbero?.color }}>{r.barbero?.nombre?.split(" ")[0]}</span>
            </div>
          ))}
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
              <label className="flabel">Servicio</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {servicios.map(s => (
                  <div key={s.id} className={`opt ${walkServId === s.id ? "sel" : ""}`}
                    style={{ padding: "8px 12px", display: "flex", justifyContent: "space-between", textAlign: "left" }}
                    onClick={() => setWalkServId(s.id)}>
                    <span style={{ fontSize: 13 }}>{s.nombre}</span>
                    <span style={{ fontSize: 13, color: "var(--gold)", fontFamily: "'Playfair Display',serif", fontStyle: "italic" }}>{fmtCOP(s.precio)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="field">
              <label className="flabel">Asignar a Barbero</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {barberos.map(b => {
                  const estado = getBarberoEstado(b.id);
                  const cola = getCola(b.id);
                  return (
                    <div key={b.id} className={`opt ${walkBarbId === b.id ? "sel" : ""}`} style={{ padding: 12 }} onClick={() => setWalkBarbId(b.id)}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: b.color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, color: "#000" }}>{b.nombre.slice(0,2).toUpperCase()}</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{b.nombre.split(" ")[0]}</div>
                          <div style={{ fontSize: 10, color: estado === "libre" ? "var(--libre)" : estado === "ocupado" ? "var(--ocupado)" : "var(--proximo)" }}>{estado} · Cola {cola}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <button className="btn-gold" style={{ width: "100%", marginTop: 4, opacity: (!walkNombre.trim() || !walkBarbId || !walkServId) ? 0.5 : 1 }}
              disabled={!walkNombre.trim() || !walkBarbId || !walkServId || walkSaving}
              onClick={async () => {
                setWalkSaving(true);
                try {
                  const hoyISO = new Date().toISOString().split('T')[0];
                  const ahora = new Date();
                  const horaActual = `${String(ahora.getHours()).padStart(2,'0')}:${String(ahora.getMinutes()).padStart(2,'0')}`;
                  await api.crearReserva({
                    cliente_nombre:   walkNombre.trim(),
                    cliente_telefono: "0000000000",
                    barbero_id:       walkBarbId,
                    servicio_id:      walkServId,
                    fecha_iso:        hoyISO,
                    hora_inicio:      horaActual,
                    notas:            "Walk-In — sin reserva previa",
                    comprobante_url:  null,
                  });
                  setShowWalk(false);
                  setWalkNombre("");
                  setWalkBarbId(null);
                  setWalkServId(null);
                } catch(e) {
                  console.error("Walk-in error:", e);
                  alert("Error al crear el turno. Intenta de nuevo.");
                }
                setWalkSaving(false);
              }}>
              {walkSaving ? "Creando turno..." : "Agregar a Cola"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// SELECTOR
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
  const navigate = useNavigate();
  const [initData, setInitData] = useState({});
  const [barberoLogueado, setBarberoLogueado] = useState(null);
  const [barberos, setBarberos] = useState(BARBEROS);
  const [servicios, setServicios] = useState(SERVICIOS);

  useEffect(() => {
    api.getBarberos()
      .then(data => setBarberos(data))
      .catch(err => console.error('ERROR barberos:', err));
    api.getServicios()
      .then(data => setServicios(data))
      .catch(err => console.error('ERROR servicios:', err));
  }, []);

  const routeMap = {
    "/":         "home",
    "/reservas": "reservas",
    "/admin":    "admin",
    "/barbero":  barberoLogueado ? "barbero" : "pin",
    "/monitor":  "monitor",
    "/selector": "selector",
  };

  const view = routeMap[location.pathname] || "home";

  // Título dinámico por vista
  useEffect(() => {
    const titles = {
      home:     "Barber Boss",
      reservas: "Barber Boss — Reservar Cita",
      admin:    "Barber Boss — Admin",
      pin:      "Barber Boss — Acceso Barbero",
      barbero:  `Barber Boss — ${barberoLogueado?.nombre || "Panel Barbero"}`,
      monitor:  "Barber Boss — Monitor de Sala",
      selector: "Barber Boss — Selector",
    };
    document.title = titles[view] || "Barber Boss";
  }, [view, barberoLogueado]);

  const nav = (v, data = {}) => {
    setInitData(data);
    const pathMap = {
      home: "/", reservas: "/reservas", admin: "/admin",
      pin: "/barbero", barbero: "/barbero", monitor: "/monitor", selector: "/selector"
    };
    navigate(pathMap[v] || "/");
  };

  const showNav = ["home", "reservas"].includes(view);

  return (
    <div style={{ background: "#000", minHeight: "100vh" }}>
      <style>{CSS}</style>

      {showNav && (
        <nav className="nav">
          <div className="nav-logo" onClick={() => nav("home")}>Barber<span>Boss</span></div>
          <button className="nav-pill" onClick={() => document.getElementById("equipo")?.scrollIntoView({ behavior: "smooth" })}>Equipo</button>
          <button className="nav-pill" onClick={() => document.getElementById("servicios")?.scrollIntoView({ behavior: "smooth" })}>Servicios</button>
          <button className="nav-cta" onClick={() => nav("reservas")}>Reservar</button>
        </nav>
      )}
      {view === "selector" && <Selector onSelect={v => { setBarberoLogueado(null); nav(v); }} />}
      {view === "home"     && <Home onNav={nav} barberos={barberos} servicios={servicios} />}
      {view === "reservas" && <Reservas initData={initData} barberos={barberos} servicios={servicios} />}
      {view === "admin"    && <SuperAdmin nav={nav} barberos={barberos} servicios={servicios} />}
      {view === "monitor"  && <Monitor barberos={barberos} servicios={servicios} />}
      {view === "pin"      && !barberoLogueado && <PinLogin onSuccess={b => { setBarberoLogueado(b); navigate("/barbero"); }} barberos={barberos} />}
      {view === "barbero"  && barberoLogueado  && <BarberoPanel barbero={barberoLogueado} onLogout={() => { setBarberoLogueado(null); navigate("/barbero"); }} barberos={barberos} />}
    </div>
  );
}