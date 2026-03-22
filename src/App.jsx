import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid
} from "recharts";
import {
  Users, Briefcase, LogOut, Plus, Trash2, ChevronDown, ChevronRight,
  Activity, Shield, UserPlus, Calendar, Target, AlertTriangle,
  CheckCircle, Zap, Star, Phone, Building2, FileText, Award,
  Lock, Edit3, Download, Filter, Eye, EyeOff, Key, TrendingUp, Clock,
  Sun, Moon, XCircle, ArrowRight
} from "lucide-react";

const DARK = {
  bg: "#0a0e1a", panel: "#111827", card: "#1a2332", border: "#1e2d3d",
  text: "#e4e9f1", sub: "#7b8fa8", dim: "#4a5c72",
  blue: "#5b7cf7", blueD: "rgba(91,124,247,.12)",
  green: "#10b981", greenD: "rgba(16,185,129,.12)",
  amber: "#f5a623", amberD: "rgba(245,166,35,.12)",
  red: "#ef4565", redD: "rgba(239,69,101,.12)",
  cyan: "#22c3e6", cyanD: "rgba(34,195,230,.12)",
  gold: "#e6b422", goldD: "rgba(230,180,34,.12)",
  violet: "#8b5cf6",
};
const LIGHT = {
  bg: "#f5f7fa", panel: "#ffffff", card: "#ffffff", border: "#e2e8f0",
  text: "#1a202c", sub: "#64748b", dim: "#94a3b8",
  blue: "#4f46e5", blueD: "rgba(79,70,229,.08)",
  green: "#059669", greenD: "rgba(5,150,105,.08)",
  amber: "#d97706", amberD: "rgba(217,119,6,.08)",
  red: "#dc2626", redD: "rgba(220,38,38,.08)",
  cyan: "#0891b2", cyanD: "rgba(8,145,178,.08)",
  gold: "#ca8a04", goldD: "rgba(202,138,4,.08)",
  violet: "#7c3aed",
};

const ThemeCtx = React.createContext({ dark: true, toggle: () => {} });
function useTheme() { return React.useContext(ThemeCtx); }

let C = DARK;
function setThemeColors(dark) { C = dark ? DARK : LIGHT; }

const SK = "jt-v6";
const TIMEOUT = 15 * 60 * 1000;
const STAT = () => [
  { v: "active", l: "Active", c: C.green, i: Zap },
  { v: "placed", l: "Placed", c: C.gold, i: Star },
  { v: "stopped", l: "Stopped", c: C.red, i: XCircle },
];
const EVTS = () => [
  { v: "call", l: "Call", c: C.cyan, i: Phone },
  { v: "assessment", l: "Assessment", c: C.amber, i: FileText },
  { v: "interview", l: "Interview", c: C.blue, i: Building2 },
  { v: "offer", l: "Offer", c: C.green, i: Award },
  { v: "placed", l: "Got Job!", c: C.gold, i: Star },
  { v: "rejected", l: "Rejected", c: C.red, i: XCircle },
];
const PIPE_ORDER = ["call","assessment","interview","offer","placed"];
const PIPE_LABELS = { call: "Call", assessment: "Assessment", interview: "Interview", offer: "Offer", placed: "Hired" };
const gS = v => { if (v && v.startsWith("stopped")) return STAT().find(x => x.v === "stopped"); return STAT().find(x => x.v === v) || STAT()[0]; };
const isStopped = v => v && v.startsWith("stopped");
const stoppedDate = v => v && v.startsWith("stopped:") ? v.split(":")[1] : null;
const gE = v => EVTS().find(x => x.v === v) || EVTS()[0];
const TZ = "America/New_York";
const td = () => { const d = new Date(); return d.toLocaleDateString("en-CA", { timeZone: TZ }); };
const parseD = (d) => new Date(d + "T12:00:00");
const fmtD = (d) => { if (!d) return ""; const dt = parseD(d); const day = dt.getDate(); const mon = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][dt.getMonth()]; return `${day} ${mon}`; };
const fmtDFull = (d) => { if (!d) return ""; const dt = parseD(d); const day = dt.getDate(); const mon = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][dt.getMonth()]; const wd = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][dt.getDay()]; return `${wd}, ${day} ${mon}`; };
const isWeekday = (dateStr) => { const d = parseD(dateStr); const day = d.getDay(); return day !== 0 && day !== 6; };
// isWorkday checks weekends + declared holidays
let _holidays = [];
const setHolidays = (h) => { _holidays = (h || []).map(x => typeof x === "string" ? x : x.date); };
const isWorkday = (dateStr) => isWeekday(dateStr) && !_holidays.includes(dateStr);
const countWorkdays = (dates) => dates.filter(d => isWorkday(d)).length;
const uid = () => Math.random().toString(36).slice(2, 9);
const init = () => ({ emps: [], entries: [], pstat: {}, events: [], stars: {}, pin: "admin123", target: 30, log: [], holidays: [] });

const getCSS = () => `@keyframes spin{to{transform:rotate(360deg)}}@keyframes fi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}@keyframes rise{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}@keyframes fadeScale{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}@keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}@keyframes slideFade{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:none}}*{box-sizing:border-box;margin:0}::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}select option{background:${C.panel};color:${C.text}}`;

const pg = () => ({ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", fontSize: 13, transition: "background 0.3s, color 0.3s" });
const wrap = { maxWidth: 1100, margin: "0 auto", padding: "18px 22px" };
const hdr = () => ({ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 26, padding: "16px 22px", background: C.panel, borderRadius: 14, border: `1px solid ${C.border}`, flexWrap: "wrap", gap: 10, boxShadow: `0 2px 12px ${C.bg}80` });
const crd = () => ({ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: 22, marginBottom: 16 });
const inp = () => ({ padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.panel, color: C.text, fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit", transition: "border-color .2s" });
const tth = () => ({ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: .8, color: C.dim, borderBottom: `2px solid ${C.border}` });
const ttd = () => ({ padding: "10px 14px", fontSize: 13, borderBottom: `1px solid ${C.border}10`, verticalAlign: "middle" });
const logoCss = () => ({ fontSize: 19, fontWeight: 800, background: `linear-gradient(135deg,${C === DARK ? C.blue : "#3730a3"},${C === DARK ? C.cyan : "#0e7490"})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" });

function B({ c = C.blue, o, children, ...p }) {
  return <button {...p} style={{ padding: "9px 18px", borderRadius: 10, border: o ? `1.5px solid ${c}` : "none", background: o ? "transparent" : c, color: o ? c : "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap", fontFamily: "inherit", transition: "all .15s", ...(p.style||{}) }} onMouseOver={e => { if(!o) e.currentTarget.style.opacity="0.9"; else e.currentTarget.style.background=`${c}10`; }} onMouseOut={e => { if(!o) e.currentTarget.style.opacity="1"; else e.currentTarget.style.background="transparent"; }}>{children}</button>;
}
function Bs({ c = C.blue, o, children, ...p }) {
  return <button {...p} style={{ padding: "5px 12px", borderRadius: 7, border: o ? `1px solid ${c}` : "none", background: o ? "transparent" : c, color: o ? c : "#fff", fontWeight: 600, fontSize: 11, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap", fontFamily: "inherit", transition: "all .15s", ...(p.style||{}) }}>{children}</button>;
}
function Tag({ c, children }) {
  return <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 20, background: `${c}15`, color: c, fontSize: 11, fontWeight: 600, gap: 3, letterSpacing: 0.2 }}>{children}</span>;
}
function Tb({ a, children, ...p }) {
  return <button {...p} style={{ padding: "8px 18px", borderRadius: 9, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, fontFamily: "inherit", background: a ? `linear-gradient(135deg,${C.blue},${C.violet})` : "transparent", color: a ? "#fff" : C.sub, transition: "all .2s", boxShadow: a ? `0 2px 10px ${C.blue}30` : "none" }}>{children}</button>;
}
function Ring({ v, mx, sz = 42, sw = 3 }) {
  const p = Math.min(v/mx,1), r = (sz-sw)/2, ci = 2*Math.PI*r, off = ci*(1-p);
  const fc = v >= mx ? C.green : p >= .6 ? C.amber : C.red;
  return <div style={{ position: "relative", width: sz, height: sz, flexShrink: 0 }}><svg width={sz} height={sz} style={{ transform: "rotate(-90deg)" }}><circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={C.border} strokeWidth={sw} /><circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={fc} strokeWidth={sw} strokeDasharray={ci} strokeDashoffset={off} strokeLinecap="round" style={{ transition: "all .4s" }} /></svg><div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: sz*.24, fontWeight: 800, color: fc }}>{v}</div></div>;
}
function Bar2({ v, mx, h = 4 }) {
  const p = Math.min(v/mx*100,100), c = p >= 100 ? C.green : p >= 60 ? C.amber : C.red;
  return <div style={{ width: "100%", height: h, borderRadius: h, background: C.border, overflow: "hidden" }}><div style={{ width: `${p}%`, height: "100%", borderRadius: h, background: c, transition: "width .4s" }} /></div>;
}
function Stars2({ n }) { if (!n) return null; return <span style={{ display: "inline-flex", gap: 1, marginLeft: 4 }}>{Array.from({ length: Math.min(n,5) }, (_,i) => <Star key={i} size={10} fill={C.gold} color={C.gold} />)}{n > 5 && <span style={{ fontSize: 9, color: C.gold }}>+{n-5}</span>}</span>; }
function Tip({ active, payload, label }) { if (!active || !payload?.length) return null; return <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px", fontSize: 11 }}><div style={{ fontWeight: 600, marginBottom: 3 }}>{label}</div>{payload.map((p,i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 1 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: p.color }} />{p.name}: <strong>{p.value}</strong></div>)}</div>; }
function Mdl({ open, onClose, title, children }) { if (!open) return null; return <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.6)", backdropFilter: "blur(6px)" }}><div onClick={e => e.stopPropagation()} style={{ ...crd(), maxWidth: 480, width: "92%", margin: 0, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.3)", animation: "fi .25s" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}><h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{title}</h3><button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${C.border}`, background: C.panel, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.dim, fontSize: 13, fontFamily: "inherit" }}>✕</button></div>{children}</div></div>; }

function useSTO(timeout, cb) { const t = useRef(null); const reset = useCallback(() => { if (t.current) clearTimeout(t.current); t.current = setTimeout(cb, timeout); }, [timeout, cb]); useEffect(() => { const ev = ["mousedown","keydown","touchstart","scroll"]; ev.forEach(e => window.addEventListener(e, reset)); reset(); return () => { ev.forEach(e => window.removeEventListener(e, reset)); if (t.current) clearTimeout(t.current); }; }, [reset]); }

function doExport(st) {
  let csv = "Date,Employee,Person,Jobs,Status\n";
  st.entries.forEach(e => { const n = st.emps.find(x => x.id === e.eid)?.name || "?"; csv += `${e.date},"${n}","${e.person}",${e.jobs},${st.pstat?.[e.person]||"active"}\n`; });
  if (st.events?.length) { csv += "\nDate,Employee,Person,Type,Company,Notes\n"; st.events.forEach(e => { const n = st.emps.find(x => x.id === e.eid)?.name || "?"; csv += `${e.date},"${n}","${e.person}",${e.type},"${e.company}","${e.note||""}"\n`; }); }
  // Show in overlay for copy since downloads are blocked in sandbox
  const id = "jt-csv-overlay";
  let existing = document.getElementById(id);
  if (existing) existing.remove();
  const overlay = document.createElement("div");
  overlay.id = id;
  overlay.style.cssText = "position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;";
  overlay.innerHTML = `<div style="background:#1a2332;border-radius:12px;padding:24px;max-width:600px;width:90%;max-height:80vh;display:flex;flex-direction:column;gap:12px">
    <div style="display:flex;justify-content:space-between;align-items:center"><span style="color:#e4e9f1;font-weight:700;font-family:system-ui">CSV Data</span><div style="display:flex;gap:8px"><button id="jt-csv-copy" style="background:#10b981;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:700;cursor:pointer;font-size:12px;font-family:system-ui">Copy All</button><button id="jt-csv-close" style="background:#4a5c72;color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:700;cursor:pointer;font-size:12px;font-family:system-ui">Close</button></div></div>
    <div style="color:#7b8fa8;font-size:11px;font-family:system-ui">Click "Copy All" then paste into Excel or Google Sheets</div>
    <textarea id="jt-csv-text" style="flex:1;min-height:300px;background:#111827;color:#e4e9f1;border:1px solid #1e2d3d;border-radius:8px;padding:12px;font-family:monospace;font-size:11px;resize:none">${csv.replace(/</g,'&lt;')}</textarea>
  </div>`;
  document.body.appendChild(overlay);
  document.getElementById("jt-csv-close").onclick = () => overlay.remove();
  document.getElementById("jt-csv-copy").onclick = () => {
    const ta = document.getElementById("jt-csv-text");
    ta.select(); ta.setSelectionRange(0, 99999);
    try { navigator.clipboard.writeText(ta.value).then(() => { document.getElementById("jt-csv-copy").textContent = "Copied!"; setTimeout(() => { const b = document.getElementById("jt-csv-copy"); if (b) b.textContent = "Copy All"; }, 2000); }); } catch { document.execCommand("copy"); document.getElementById("jt-csv-copy").textContent = "Copied!"; }
  };
}

function printHTML(html) {
  const id = "jt-report-overlay";
  let existing = document.getElementById(id);
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = id;
  overlay.style.cssText = "position:fixed;inset:0;z-index:99999;background:#fff;overflow-y:auto;";

  const toolbar = document.createElement("div");
  toolbar.style.cssText = "position:sticky;top:0;z-index:1;background:#4f46e5;padding:10px 20px;display:flex;justify-content:space-between;align-items:center;gap:10px;";
  toolbar.innerHTML = `<span style="color:#fff;font-family:system-ui;font-size:13px;font-weight:600">Report Preview</span><div style="display:flex;gap:8px">
    <button id="jt-copy-btn" style="background:#fff;color:#4f46e5;border:none;padding:8px 16px;border-radius:6px;font-weight:700;cursor:pointer;font-size:12px;font-family:system-ui">Copy HTML</button>
    <button id="jt-close-btn" style="background:rgba(255,255,255,0.2);color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:700;cursor:pointer;font-size:12px;font-family:system-ui">Close</button>
  </div>`;

  const content = document.createElement("div");
  content.style.cssText = "max-width:800px;margin:0 auto;padding:30px;";
  // Strip html/head/body tags, keep just the inner content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/i);
  if (styleMatch) {
    const s = document.createElement("style");
    s.textContent = styleMatch[1];
    content.appendChild(s);
  }
  const inner = document.createElement("div");
  inner.innerHTML = bodyMatch ? bodyMatch[1] : html;
  content.appendChild(inner);

  overlay.appendChild(toolbar);
  overlay.appendChild(content);
  document.body.appendChild(overlay);

  document.getElementById("jt-close-btn").onclick = () => overlay.remove();
  document.getElementById("jt-copy-btn").onclick = () => {
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(content);
    sel.removeAllRanges();
    sel.addRange(range);
    try { document.execCommand("copy"); } catch {}
    sel.removeAllRanges();
    document.getElementById("jt-copy-btn").textContent = "Copied!";
    setTimeout(() => { const b = document.getElementById("jt-copy-btn"); if (b) b.textContent = "Copy HTML"; }, 2000);
  };
}

const PDF_STYLE = `*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',system-ui,sans-serif;font-size:11px;color:#1a1a2e;padding:30px 30px 60px;max-width:800px;margin:0 auto}
h1{font-size:18px;font-weight:800;margin-bottom:4px;color:#1a1a2e}
h2{font-size:13px;font-weight:700;margin:18px 0 8px;color:#333;border-bottom:2px solid #e0e0e0;padding-bottom:4px}
.sub{color:#666;font-size:10px;margin-bottom:16px}
.stats{display:flex;gap:12px;margin:12px 0 16px;flex-wrap:wrap}
.stat{text-align:center;padding:8px 14px;background:#f5f7fa;border-radius:8px;border:1px solid #e8ecf1;min-width:70px}
.stat .n{font-size:20px;font-weight:800}
.stat .l{font-size:9px;color:#888;text-transform:uppercase}
.green{color:#059669}.red{color:#e11d48}.amber{color:#d97706}.blue{color:#4f46e5}.gold{color:#ca8a04}
table{width:100%;border-collapse:collapse;margin:6px 0 12px;font-size:11px}
th{text-align:left;padding:6px 8px;background:#f5f7fa;border-bottom:2px solid #ddd;font-size:9px;text-transform:uppercase;color:#888;font-weight:700}
td{padding:6px 8px;border-bottom:1px solid #f0f0f0}
.met{background:#ecfdf5}.miss{background:#fff5f5}
.tag{display:inline-block;padding:1px 6px;border-radius:3px;font-size:9px;font-weight:700}
.tag-g{background:#ecfdf5;color:#059669}.tag-r{background:#fff1f2;color:#e11d48}.tag-a{background:#fffbeb;color:#d97706}
.footer{margin-top:20px;padding-top:10px;border-top:1px solid #e0e0e0;font-size:9px;color:#aaa;text-align:center}
@media print{button{display:none!important}body{padding:15px}}`;

function doPDF(st, dateFrom, dateTo, tgt) {
  const d1 = dateFrom || td();
  const d2 = dateTo || d1;
  const isRange = d1 !== d2;
  const entries = st.entries.filter(e => e.date >= d1 && e.date <= d2);
  const events = (st.events||[]).filter(e => e.date >= d1 && e.date <= d2);
  const dates = [...new Set(entries.map(e=>e.date))].sort();

  const byEmp = {};
  entries.forEach(e => {
    const n = st.emps.find(x=>x.id===e.eid)?.name||"?";
    if(!byEmp[n]) byEmp[n] = { total: 0, days: {}, people: {} };
    byEmp[n].total += e.jobs;
    byEmp[n].days[e.date] = (byEmp[n].days[e.date]||0) + e.jobs;
    byEmp[n].people[e.person] = (byEmp[n].people[e.person]||0) + e.jobs;
  });

  const totalJ = entries.reduce((a,e)=>a+e.jobs,0);
  const title = isRange ? `Report: ${d1} to ${d2}` : `Daily Report: ${d1}`;

  let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>HIREZEN - ${title}</title><style>${PDF_STYLE}</style></head><body>
<h1>HIREZEN - ${title}</h1>
<div class="sub">Generated ${new Date().toLocaleString()} | Target: ${tgt} jobs/day/employee</div>
<div class="stats">
<div class="stat"><div class="n green">${totalJ}</div><div class="l">Applications</div></div>
<div class="stat"><div class="n blue">${Object.keys(byEmp).length}</div><div class="l">Active</div></div>
<div class="stat"><div class="n">${new Set(entries.map(e=>e.person)).size}</div><div class="l">People</div></div>
<div class="stat"><div class="n">${countWorkdays(dates)}</div><div class="l">Working Days</div></div>
</div>`;

  html += `<h2>Employee Summary</h2><table><thead><tr><th>Employee</th><th>Total</th><th>Working Days</th><th>People</th><th>Avg/Day</th><th>Target</th></tr></thead><tbody>`;
  Object.entries(byEmp).sort((a,b)=>b[1].total-a[1].total).forEach(([name,d])=>{
    const da = countWorkdays(Object.keys(d.days)); const pplCount = Object.keys(d.people).length; const avg = pplCount > 0 && da > 0 ? Math.round(d.total / pplCount / da) : 0;
    const dh = Object.keys(d.days).filter(dt => isWorkday(dt) && d.days[dt] >= tgt).length;
    html += `<tr><td><strong>${name}</strong></td><td>${d.total}</td><td>${da}</td><td>${pplCount}</td><td>${avg}</td><td><span class="tag ${dh===da?'tag-g':'tag-r'}">${dh}/${da}</span></td></tr>`;
  });
  html += `</tbody></table>`;

  dates.forEach(date => {
    const dayE = entries.filter(e=>e.date===date);
    const dayT = dayE.reduce((a,e)=>a+e.jobs,0);
    html += `<h2>${date} (${dayT} applications)</h2><table><thead><tr><th>Employee</th><th>Person</th><th>Jobs</th><th>Target</th></tr></thead><tbody>`;
    const byE2 = {};
    dayE.forEach(e=>{ const n=st.emps.find(x=>x.id===e.eid)?.name||"?"; if(!byE2[n])byE2[n]={tot:0,ppl:{}}; byE2[n].tot+=e.jobs; byE2[n].ppl[e.person]=(byE2[n].ppl[e.person]||0)+e.jobs; });
    Object.entries(byE2).sort((a,b)=>b[1].tot-a[1].tot).forEach(([name,d])=>{
      const hit = d.tot>=tgt; const ppl = Object.entries(d.ppl);
      ppl.forEach(([p,j],i)=>{
        html += `<tr class="${hit?'met':'miss'}">${i===0?`<td rowspan="${ppl.length}"><strong>${name}</strong><br><span style="font-size:9px;color:#888">${d.tot} total</span></td>`:''}
        <td>${p}</td><td>${j}</td>${i===0?`<td rowspan="${ppl.length}"><span class="tag ${hit?'tag-g':'tag-r'}">${hit?'Met':(tgt-d.tot)+' short'}</span></td>`:''}
        </tr>`;
      });
    });
    const activeIds = new Set(dayE.map(e=>e.eid));
    const waiting = st.emps.filter(e=>!activeIds.has(e.id) && st.entries.some(x=>x.eid===e.id));
    if(waiting.length>0) html += `<tr><td colspan="4" style="background:#fffbeb;color:#d97706;font-weight:600;font-size:10px">Still Waiting: ${waiting.map(e=>e.name).join(', ')}</td></tr>`;
    html += `</tbody></table>`;
  });

  if(events.length>0){
    html += `<h2>Updates</h2><table><thead><tr><th>Date</th><th>Employee</th><th>Person</th><th>Type</th><th>Company</th></tr></thead><tbody>`;
    events.forEach(ev=>{ const n=st.emps.find(x=>x.id===ev.eid)?.name||"?"; html += `<tr><td>${ev.date}</td><td>${n}</td><td>${ev.person}</td><td><span class="tag tag-a">${ev.type}</span></td><td>${ev.company}</td></tr>`; });
    html += `</tbody></table>`;
  }

  html += `<div class="footer">HIREZEN JobTracker | ${title}</div></body></html>`;
  printHTML(html);
}

function doEmpPDF(st, empId, tgt) {
  const emp = st.emps.find(x => x.id === empId);
  if (!emp) return;
  const entries = [...st.entries.filter(e => e.eid === empId)].sort((a, b) => a.date.localeCompare(b.date));
  const events = [...(st.events || []).filter(e => e.eid === empId)].sort((a, b) => a.date.localeCompare(b.date));
  if (!entries.length) { alert("No entries for this employee."); return; }

  const firstD = entries[0].date; const lastD = entries[entries.length - 1].date;
  const totalJ = entries.reduce((a, e) => a + e.jobs, 0);
  const dates = [...new Set(entries.map(e => e.date))].sort();
  const people = [...new Set(entries.map(e => e.person))];
  const stars = st.stars?.[empId] || 0;

  const byDate = {}; entries.forEach(e => { if (!byDate[e.date]) byDate[e.date] = { total: 0, people: {} }; byDate[e.date].total += e.jobs; byDate[e.date].people[e.person] = (byDate[e.date].people[e.person] || 0) + e.jobs; });
  const weekdayDates = dates.filter(d => isWorkday(d));
  const daysHit = weekdayDates.filter(d => byDate[d].total >= tgt).length;
  const byPerson = {}; entries.forEach(e => { byPerson[e.person] = (byPerson[e.person] || 0) + e.jobs; });

  let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>HIREZEN - ${emp.name} Report</title><style>${PDF_STYLE}</style></head><body>
<h1>HIREZEN - ${emp.name} Full Report</h1>
<div class="sub">${firstD} to ${lastD} | Generated ${new Date().toLocaleString()} | Target: ${tgt}/day</div>
<div class="stats">
<div class="stat"><div class="n green">${totalJ}</div><div class="l">Total Applications</div></div>
<div class="stat"><div class="n blue">${weekdayDates.length}</div><div class="l">Working Days</div></div>
<div class="stat"><div class="n">${people.length > 0 && weekdayDates.length > 0 ? Math.round(totalJ / people.length / weekdayDates.length) : 0}</div><div class="l">Avg/Day</div></div>
<div class="stat"><div class="n ${daysHit === weekdayDates.length ? 'green' : 'red'}">${daysHit}/${weekdayDates.length}</div><div class="l">Target</div></div>
<div class="stat"><div class="n">${people.length}</div><div class="l">People</div></div>
${stars > 0 ? `<div class="stat"><div class="n gold">${stars} &#9733;</div><div class="l">Stars</div></div>` : ''}
</div>

<h2>People Applied For</h2><table><thead><tr><th>Person</th><th>Status</th><th style="text-align:right">Jobs</th></tr></thead><tbody>`;
  Object.entries(byPerson).sort((a, b) => b[1] - a[1]).forEach(([person, jobs]) => {
    const status = st.pstat?.[person] || "active";
    html += `<tr><td><strong>${person}</strong></td><td><span class="tag tag-${status==='placed'?'g':'a'}">${status}</span></td><td style="text-align:right"><strong>${jobs}</strong></td></tr>`;
  });
  html += `</tbody></table>`;

  html += `<h2>Day-by-Day</h2><table><thead><tr><th>Date</th><th>Person</th><th style="text-align:right">Jobs</th><th style="text-align:center">Total</th><th style="text-align:center">Target</th></tr></thead><tbody>`;
  dates.forEach(date => {
    const day = byDate[date]; const ppl = Object.entries(day.people).sort((a, b) => b[1] - a[1]); const hit = day.total >= tgt;
    ppl.forEach(([person, jobs], i) => {
      html += `<tr class="${hit ? 'met' : 'miss'}">${i === 0 ? `<td rowspan="${ppl.length}"><strong>${date}</strong></td>` : ''}<td>${person}</td><td style="text-align:right">${jobs}</td>${i === 0 ? `<td rowspan="${ppl.length}" style="text-align:center"><strong>${day.total}</strong></td><td rowspan="${ppl.length}" style="text-align:center"><span class="tag ${hit ? 'tag-g' : 'tag-r'}">${hit ? 'Met' : (tgt - day.total) + ' short'}</span></td>` : ''}</tr>`;
    });
  });
  html += `</tbody></table>`;

  if (events.length > 0) {
    html += `<h2>Updates</h2><table><thead><tr><th>Date</th><th>Person</th><th>Type</th><th>Company</th><th>Notes</th></tr></thead><tbody>`;
    events.forEach(ev => { html += `<tr><td>${ev.date}</td><td>${ev.person}</td><td><span class="tag tag-a">${ev.type}</span></td><td>${ev.company}</td><td style="color:#888">${ev.note || '-'}</td></tr>`; });
    html += `</tbody></table>`;
  }

  html += `<div class="footer">HIREZEN JobTracker | ${emp.name} | ${firstD} - ${lastD}</div></body></html>`;
  printHTML(html);
}

export default function App() {
  const [dark, setDark] = useState(true);
  const toggle = useCallback(() => { setDark(d => { const n = !d; setThemeColors(n); return n; }); }, []);
  setThemeColors(dark);

  const [st, setSt] = useState(null); const [vw, setVw] = useState("land"); const [cur, setCur] = useState(null); const [atab, setAtab] = useState("dash"); const [ld, setLd] = useState(true);
  const out = useCallback(() => { setVw("land"); setCur(null); setAtab("dash"); }, []);
  useSTO(TIMEOUT, out);
  const load = useCallback(async () => { try { const r = await window.storage.get(SK, true); const data = r?.value ? { ...init(), ...JSON.parse(r.value) } : init(); setHolidays(data.holidays); setSt(data); } catch { setSt(init()); } }, []);
  useEffect(() => { (async () => { await load(); setLd(false); })(); const i = setInterval(load, 15000); return () => clearInterval(i); }, [load]);
  const save = useCallback(async n => { setHolidays(n.holidays); setSt(n); try { await window.storage.set(SK, JSON.stringify(n), true); } catch {} }, []);
  if (ld || !st) return <div style={{ ...pg(), display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTopColor: C.blue, borderRadius: "50%", animation: "spin .7s linear infinite" }} /><style>{getCSS()}</style></div>;
  return <ThemeCtx.Provider value={{ dark, toggle }}>
    <div><style>{getCSS()}</style>
    {vw === "land" && <Land go={setVw} />}
    {vw === "alog" && <ALog st={st} ok={() => setVw("admin")} bk={() => setVw("land")} />}
    {vw === "emp" && <EmpP st={st} save={save} cur={cur} setCur={setCur} bk={() => { setVw("land"); setCur(null); }} />}
    {vw === "admin" && <Adm st={st} save={save} tab={atab} setTab={setAtab} out={out} ref2={load} />}
  </div></ThemeCtx.Provider>;
}

function ThemeToggle() {
  const { dark, toggle } = useTheme();
  return <button onClick={toggle} style={{ padding: "9px 18px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: "transparent", color: C.sub, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7, fontFamily: "inherit", whiteSpace: "nowrap", transition: "all .15s" }}>
    {dark ? <Sun size={14} /> : <Moon size={14} />} {dark ? "Light" : "Dark"}
  </button>;
}

function EmpStats({ my, tgt }) {
  const now = new Date();
  const thisWeekStart = new Date(now); thisWeekStart.setDate(now.getDate() - now.getDay());
  const weekStr = thisWeekStart.toISOString().split("T")[0];
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Include ALL entries (even weekends/holidays) for totals - they did the work
  const weekEntries = my.filter(e => e.date >= weekStr);
  const monthEntries = my.filter(e => e.date.startsWith(monthStr));
  const weekJobs = weekEntries.reduce((a, e) => a + e.jobs, 0);
  const monthJobs = monthEntries.reduce((a, e) => a + e.jobs, 0);
  // Count only working days for "days active" display
  const weekDays = new Set(weekEntries.map(e => e.date)).size;
  const monthDays = new Set(monthEntries.map(e => e.date)).size;
  const weekPpl = new Set(weekEntries.map(e => e.person)).size;
  const monthPpl = new Set(monthEntries.map(e => e.person)).size;
  const allDays = [...new Set(my.map(e => e.date))];
  const daysHit = allDays.filter(d => my.filter(e => e.date === d).reduce((a, e) => a + e.jobs, 0) >= tgt).length;

  // Avg: total jobs per person / number of days they submitted (at least 1)
  const calcAvg = (entries) => {
    const pm = {};
    entries.forEach(e => { if (!pm[e.person]) pm[e.person] = { t: 0, d: new Set() }; pm[e.person].t += e.jobs; pm[e.person].d.add(e.date); });
    const avgs = Object.values(pm).map(p => p.d.size > 0 ? Math.round(p.t / p.d.size) : 0);
    return avgs.length > 0 ? Math.round(avgs.reduce((a,v) => a+v, 0) / avgs.length) : 0;
  };
  const weekAvg = calcAvg(weekEntries);
  const monthAvg = calcAvg(monthEntries);

  return <div style={crd()}>
    <div style={{ fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}><TrendingUp size={16} color={C.blue} /> My Stats</div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      {/* This Week */}
      <div style={{ background: C.panel, borderRadius: 10, border: `1px solid ${C.border}`, padding: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.blue, marginBottom: 10, textTransform: "uppercase" }}>This week</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div><div style={{ fontSize: 22, fontWeight: 800, color: C.green }}>{weekJobs}</div><div style={{ fontSize: 9, color: C.dim }}>Applications</div></div>
          <div><div style={{ fontSize: 22, fontWeight: 800, color: C.blue }}>{weekDays}</div><div style={{ fontSize: 9, color: C.dim }}>Working Days</div></div>
          <div><div style={{ fontSize: 22, fontWeight: 800, color: C.cyan }}>{weekPpl}</div><div style={{ fontSize: 9, color: C.dim }}>People</div></div>
          <div><div style={{ fontSize: 22, fontWeight: 800, color: C.amber }}>{weekAvg}</div><div style={{ fontSize: 9, color: C.dim }}>Avg/day</div></div>
        </div>
      </div>
      {/* This Month */}
      <div style={{ background: C.panel, borderRadius: 10, border: `1px solid ${C.border}`, padding: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.violet, marginBottom: 10, textTransform: "uppercase" }}>This month</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div><div style={{ fontSize: 22, fontWeight: 800, color: C.green }}>{monthJobs}</div><div style={{ fontSize: 9, color: C.dim }}>Applications</div></div>
          <div><div style={{ fontSize: 22, fontWeight: 800, color: C.blue }}>{monthDays}</div><div style={{ fontSize: 9, color: C.dim }}>Working Days</div></div>
          <div><div style={{ fontSize: 22, fontWeight: 800, color: C.cyan }}>{monthPpl}</div><div style={{ fontSize: 9, color: C.dim }}>People</div></div>
          <div><div style={{ fontSize: 22, fontWeight: 800, color: C.amber }}>{monthAvg}</div><div style={{ fontSize: 9, color: C.dim }}>Avg/day</div></div>
        </div>
      </div>
    </div>
    {/* All-time row */}
    <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
      <div style={{ padding: "6px 14px", borderRadius: 8, background: C.greenD, textAlign: "center" }}><div style={{ fontSize: 16, fontWeight: 800, color: C.green }}>{my.reduce((a, e) => a + e.jobs, 0)}</div><div style={{ fontSize: 8, color: C.dim }}>ALL TIME</div></div>
      <div style={{ padding: "6px 14px", borderRadius: 8, background: C.blueD, textAlign: "center" }}><div style={{ fontSize: 16, fontWeight: 800, color: C.blue }}>{allDays.length}</div><div style={{ fontSize: 8, color: C.dim }}>WORKING DAYS</div></div>
      <div style={{ padding: "6px 14px", borderRadius: 8, background: `${daysHit === allDays.length ? C.green : C.red}12`, textAlign: "center" }}><div style={{ fontSize: 16, fontWeight: 800, color: daysHit === allDays.length ? C.green : C.red }}>{daysHit}/{allDays.length}</div><div style={{ fontSize: 8, color: C.dim }}>TARGET MET</div></div>
    </div>
  </div>;
}

function Land({ go }) {
  return <div style={{ ...pg(), overflow: "hidden", position: "relative", minHeight: "100vh" }}>
    {/* Background */}
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "-20%", right: "-10%", width: "55vw", height: "55vw", maxWidth: 650, maxHeight: 650, borderRadius: "50%", background: `radial-gradient(circle, ${C.blue}10 0%, transparent 60%)` }} />
      <div style={{ position: "absolute", bottom: "-15%", left: "-8%", width: "45vw", height: "45vw", maxWidth: 550, maxHeight: 550, borderRadius: "50%", background: `radial-gradient(circle, ${C.cyan}07 0%, transparent 60%)` }} />
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "35vw", height: "35vw", maxWidth: 420, maxHeight: 420, borderRadius: "50%", background: `radial-gradient(circle, ${C.violet}05 0%, transparent 60%)` }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(${C.border}18 1px, transparent 1px)`, backgroundSize: "32px 32px" }} />
    </div>

    <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Nav */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 32px", animation: "rise .5s ease-out" }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 5, color: "#4338ca" }}>HIREZEN</div>
        <ThemeToggle />
      </div>

      {/* Hero */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px 60px" }}>

        <div style={{ animation: "rise .6s ease-out", marginBottom: 24, textAlign: "center" }}>
          <div style={{ display: "inline-block", padding: "6px 18px", borderRadius: 24, background: `${C.blue}08`, border: `1px solid ${C.blue}15`, fontSize: 10, fontWeight: 700, color: C.blue, letterSpacing: 1.5, textTransform: "uppercase" }}>CONSULTANCY MANAGEMENT PLATFORM</div>
        </div>

        {/* HIREZEN — big standalone line */}
        <div style={{ animation: "rise .7s ease-out .05s both", textAlign: "center", marginBottom: 16 }}>
          <h1 style={{ fontSize: "clamp(52px, 9vw, 80px)", fontWeight: 900, letterSpacing: "clamp(10px, 2.5vw, 22px)", textTransform: "uppercase", color: "#4338ca", lineHeight: 1 }}>HIREZEN</h1>
        </div>

        <div style={{ width: 64, height: 2.5, background: `linear-gradient(90deg, transparent, ${C.blue}, ${C.cyan}, transparent)`, margin: "0 auto 22px", borderRadius: 2, animation: "fadeScale .5s ease-out .15s both" }} />

        {/* Subtitle block */}
        <div style={{ animation: "rise .8s ease-out .2s both", textAlign: "center", maxWidth: 480 }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: C.text, marginBottom: 10, letterSpacing: -0.3, lineHeight: 1.3 }}>Job Application Tracker</h2>
          <p style={{ color: C.sub, fontSize: 15, lineHeight: 1.7 }}>Track daily applications, monitor your team's interview pipeline, and manage placements — all in one dashboard.</p>
        </div>

        {/* CTA Buttons */}
        <div style={{ display: "flex", gap: 14, marginTop: 36, animation: "rise .9s ease-out .3s both" }}>
          <button onClick={() => go("emp")} style={{ padding: "16px 42px", borderRadius: 14, border: "none", cursor: "pointer", background: `linear-gradient(145deg, ${C.blue}, ${C.violet})`, color: "#fff", fontWeight: 700, fontSize: 15, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 10, boxShadow: `0 4px 24px ${C.blue}30, 0 1px 0 inset rgba(255,255,255,.1)`, transition: "transform .15s, box-shadow .15s" }} onMouseOver={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 32px ${C.blue}40`; }} onMouseOut={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = `0 4px 24px ${C.blue}30`; }}>
            <Users size={17} /> Employee Portal
          </button>
          <button onClick={() => go("alog")} style={{ padding: "16px 42px", borderRadius: 14, border: `1.5px solid ${C.green}40`, cursor: "pointer", background: `${C.green}06`, backdropFilter: "blur(8px)", color: C.green, fontWeight: 700, fontSize: 15, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 10, transition: "transform .15s, background .15s" }} onMouseOver={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.background = `${C.green}12`; }} onMouseOut={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.background = `${C.green}06`; }}>
            <Shield size={17} /> Admin Dashboard
          </button>
        </div>

        {/* Feature Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, maxWidth: 560, width: "100%", marginTop: 48, animation: "rise 1s ease-out .4s both" }}>
          {[
            { icon: Target, label: "Daily Targets", desc: "30 per person", color: C.amber },
            { icon: Building2, label: "Interviews", desc: "Track pipeline", color: C.blue },
            { icon: Star, label: "Placements", desc: "Star rewards", color: C.gold },
            { icon: Activity, label: "Live Sync", desc: "Real-time data", color: C.green },
          ].map((f, i) => {
            const FI = f.icon;
            return <div key={i} style={{ padding: "18px 10px", borderRadius: 14, background: `${f.color}06`, border: `1px solid ${f.color}10`, textAlign: "center", animation: `slideFade .4s ease-out ${.6 + i * .08}s both` }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: `${f.color}12`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}><FI size={17} color={f.color} /></div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 3 }}>{f.label}</div>
              <div style={{ fontSize: 10, color: C.dim }}>{f.desc}</div>
            </div>;
          })}
        </div>

        {/* Trust numbers */}
        <div style={{ display: "flex", justifyContent: "center", gap: 36, marginTop: 40, animation: "rise 1s ease-out .6s both" }}>
          {[{ value: "20+", label: "TEAM MEMBERS" }, { value: "100%", label: "SECURE" }, { value: "24/7", label: "ALWAYS ON" }].map((m, i) => <div key={i} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: -0.5 }}>{m.value}</div>
            <div style={{ fontSize: 8, color: C.dim, marginTop: 3, letterSpacing: 1.5, fontWeight: 600 }}>{m.label}</div>
          </div>)}
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "20px 24px", animation: "rise 1s ease-out .7s both" }}>
        <div style={{ fontSize: 10, color: C.dim }}><span style={{ opacity: .5 }}>Built for</span> <span style={{ fontWeight: 700, color: C.sub }}>HIREZEN Consultancy</span></div>
      </div>
    </div>
  </div>;
}


function ALog({ st, ok, bk }) {
  const [p, setP] = useState(""); const [e, setE] = useState(""); const [sh, setSh] = useState(false);
  const go = () => { if (p === st.pin) ok(); else setE("Wrong password"); };
  return <div style={pg()}><div style={{ ...wrap, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
    <div style={{ ...crd(), maxWidth: 360, width: "100%", textAlign: "center" }}>
      <Shield size={28} color={C.green} style={{ marginBottom: 14 }} />
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 18 }}>Admin Login</h2>
      <div style={{ position: "relative", marginBottom: 12 }}>
        <input type={sh?"text":"password"} placeholder="Password" value={p} onChange={ev => { setP(ev.target.value); setE(""); }} onKeyDown={ev => ev.key === "Enter" && go()} style={inp()} />
        <button onClick={() => setSh(!sh)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.dim }}>{sh ? <EyeOff size={14} /> : <Eye size={14} />}</button>
      </div>
      {e && <div style={{ color: C.red, fontSize: 11, marginBottom: 8 }}>{e}</div>}
      <div style={{ display: "flex", gap: 8 }}><B c={C.dim} o onClick={bk} style={{ flex: 1 }}>Back</B><B c={C.green} onClick={go} style={{ flex: 1 }}>Login</B></div>
    </div>
  </div></div>;
}

function EmpP({ st, save, cur, setCur, bk }) {
  const [sid, setSid] = useState(""); const [pw, setPw] = useState(""); const [pe, setPe] = useState("");
  const [nn, setNn] = useState(""); const [np, setNp] = useState(""); const [reg, setReg] = useState(false); const [spw, setSpw] = useState(false);
  const [dt, setDt] = useState(td()); const [rows, setRows] = useState([{ p: "", j: "" }]);
  const [evm, setEvm] = useState(null); const [evt, setEvt] = useState("call"); const [evc, setEvc] = useState(""); const [evn, setEvn] = useState(""); const [evd, setEvd] = useState(td());
  const [editId, setEditId] = useState(null); const [editJobs, setEditJobs] = useState("");
  const em = cur ? st.emps.find(x => x.id === cur) : null;
  const tgt = st.target || 30;
  const my = useMemo(() => st.entries.filter(x => x.eid === cur), [st.entries, cur]);
  const todJ = useMemo(() => my.filter(x => x.date === td()).reduce((a, x) => a + x.jobs, 0), [my]);
  const todByPerson = useMemo(() => { const m = {}; my.filter(x => x.date === td()).forEach(x => { m[x.person] = (m[x.person]||0) + x.jobs; }); return Object.entries(m).sort((a,b) => b[1]-a[1]); }, [my]);
  // Filter out future entries from my for stats
  const myValid = useMemo(() => my.filter(x => x.date <= td()), [my]);
  const myEv = useMemo(() => (st.events||[]).filter(x => x.eid === cur), [st.events, cur]);
  const myP = useMemo(() => {
    const m = {}; my.forEach(x => { m[x.person] = (m[x.person]||0) + x.jobs; });
    // Filter out people stopped more than 7 days ago
    const today = parseD(td());
    return Object.entries(m).filter(([name]) => {
      const stat = st.pstat?.[name];
      if (!isStopped(stat)) return true; // active/placed — always show
      const sd = stoppedDate(stat);
      if (!sd) return false; // stopped but no date — hide
      const diff = Math.floor((today - parseD(sd)) / 86400000);
      return diff <= 7; // show for 7 days after stop, then hide
    }).sort((a,b) => b[1]-a[1]);
  }, [my, st.pstat]);

  const login = () => { const e = st.emps.find(x => x.id === sid); if (!e) return; if (e.pw && e.pw !== pw) { setPe("Wrong password"); return; } setCur(sid); setPw(""); setPe(""); };
  const doReg = () => { if (!nn.trim() || np.length < 4) return; const e = { id: uid(), name: nn.trim(), pw: np, dt: td() }; save({ ...st, emps: [...st.emps, e] }); setCur(e.id); setNn(""); setNp(""); setReg(false); };
  const [dupWarn, setDupWarn] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const submit = () => {
    const ok = rows.filter(r => r.p.trim() && Number(r.j) > 0); if (!ok.length) return;
    const submitDate = dt || td();
    // Block future dates
    if (submitDate > td()) { setDupWarn("Cannot submit for future dates."); return; }
    // Duplicate check: same employee + same person + same date
    const dupes = ok.filter(r => st.entries.some(e => e.eid === cur && e.person === r.p.trim() && e.date === (dt||td())));
    if (dupes.length > 0) {
      setDupWarn(`Already submitted for ${dupes.map(d=>d.p.trim()).join(", ")} on ${fmtD(dt||td())}. Update the existing entry instead.`);
      return;
    }
    setDupWarn("");
    const ne = ok.map(r => ({ id: uid(), eid: cur, person: r.p.trim(), jobs: Number(r.j), date: dt||td() }));
    const tot = ne.reduce((a,x) => a + x.jobs, 0);
    const ps = { ...st.pstat }; ne.forEach(n => { if (!ps[n.person]) ps[n.person] = "active"; });
    save({ ...st, entries: [...st.entries, ...ne], pstat: ps }); setRows([{ p: "", j: "" }]); setDt(td());
    setOkMsg(`${tot} applications logged for ${ne.length} ${ne.length === 1 ? "person" : "people"} on ${fmtD(submitDate)}`);
    setTimeout(() => setOkMsg(""), 4000);
  };
  const addEv = () => {
    if (!evc.trim() || !evm) return;
    const ev = { id: uid(), eid: cur, person: evm, type: evt, company: evc.trim(), note: evn.trim(), date: evd||td() };
    let ns = { ...st, events: [...(st.events||[]), ev] };
    if (evt === "placed") { ns.pstat = { ...ns.pstat, [evm]: "placed" }; ns.stars = { ...ns.stars, [cur]: (ns.stars[cur]||0)+1 }; }
    save(ns); setEvc(""); setEvn(""); setEvt("call"); setEvm(null);
  };
  const saveMyEdit = () => {
    if (!editId || !editJobs) return;
    save({ ...st, entries: st.entries.map(x => x.id === editId ? { ...x, jobs: Number(editJobs) } : x) });
    setEditId(null); setEditJobs("");
  };

  if (!cur) return <div style={pg()}><div style={{ ...wrap, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
    <div style={{ ...crd(), maxWidth: 400, width: "100%", animation: "fi .4s" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}><Lock size={28} color={C.blue} style={{ marginBottom: 10 }} /><h2 style={{ fontSize: 18, fontWeight: 700 }}>Employee Login</h2></div>
      {st.emps.length > 0 && <div style={{ marginBottom: 16 }}>
        <select value={sid} onChange={e => { setSid(e.target.value); setPe(""); }} style={{ ...inp(), appearance: "auto", marginBottom: 8 }}><option value="">Select name</option>{st.emps.filter(e => !e.off && !e.removed).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
        {sid && <div style={{ position: "relative", marginBottom: 8 }}><input type={spw?"text":"password"} placeholder="Password" value={pw} onChange={e => { setPw(e.target.value); setPe(""); }} onKeyDown={e => e.key === "Enter" && login()} style={{ ...inp(), paddingRight: 36 }} /><button onClick={() => setSpw(!spw)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.dim }}>{spw ? <EyeOff size={13} /> : <Eye size={13} />}</button></div>}
        {pe && <div style={{ color: C.red, fontSize: 11, marginBottom: 6 }}>{pe}</div>}
        <B c={C.blue} onClick={login} style={{ width: "100%", justifyContent: "center" }}>Login</B>
      </div>}
      {reg ? <div><input placeholder="Full name" value={nn} onChange={e => setNn(e.target.value)} style={{ ...inp(), marginBottom: 6 }} /><input type="password" placeholder="Create password (4+)" value={np} onChange={e => setNp(e.target.value)} onKeyDown={e => e.key === "Enter" && doReg()} style={{ ...inp(), marginBottom: 10 }} /><div style={{ display: "flex", gap: 6 }}><B c={C.dim} o onClick={() => setReg(false)} style={{ flex: 1 }}>Cancel</B><B c={C.green} onClick={doReg} style={{ flex: 1 }}><UserPlus size={13} /> Register</B></div></div>
      : <B c={C.cyan} o onClick={() => setReg(true)} style={{ width: "100%", justifyContent: "center" }}><UserPlus size={13} /> New Employee</B>}
      <B c={C.dim} o onClick={bk} style={{ width: "100%", justifyContent: "center", marginTop: 10 }}>Back</B>
    </div>
  </div></div>;

  return <div style={pg()}><div style={wrap}>
    <div style={hdr()}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${C.blue},${C.cyan})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Briefcase size={18} color="#fff" /></div>
        <div>
          <div style={logoCss()}>HIREZEN JobTracker</div>
          <div style={{ color: C.sub, fontSize: 11, marginTop: 1, display: "flex", alignItems: "center", gap: 5 }}>Welcome, <strong style={{ color: C.text }}>{em?.name}</strong> {(st.stars?.[cur]||0) > 0 && <Stars2 n={st.stars[cur]} />}</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}><ThemeToggle /><B c={C.dim} o onClick={() => setCur(null)}><LogOut size={14} /> Logout</B></div>
    </div>
    {/* Today - Per Person Breakdown */}
    <div style={crd()}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}><Target size={15} color={C.amber} /> Today — {fmtDFull(td())} <span style={{ fontSize: 11, fontWeight: 500, color: C.sub }}>({tgt} per person)</span></div>
      {!isWorkday(td()) && <div style={{ padding: "8px 12px", borderRadius: 8, background: C.amberD, color: C.amber, fontSize: 12, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
        <Calendar size={13} /> {isWeekday(td()) ? `Holiday — ${(st.holidays||[]).find(h=>h.date===td())?.name || "Holiday"}` : "Weekend"} — this day won't count in your avg/day
      </div>}
      {todByPerson.length === 0 ? <div style={{ textAlign: "center", padding: 16, color: C.dim }}>No applications yet today</div> :
        <div style={{ display: "grid", gap: 8 }}>
          {todByPerson.map(([person, jobs]) => {
            const hit = jobs >= tgt;
            return <div key={person} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, background: hit ? `${C.green}08` : C.panel, border: `1px solid ${hit ? `${C.green}25` : C.border}` }}>
              <Ring v={jobs} mx={tgt} sz={44} sw={3} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{person}</span>
                  <span style={{ fontWeight: 800, fontSize: 15, color: hit ? C.green : C.amber }}>{jobs}/{tgt}</span>
                </div>
                <Bar2 v={jobs} mx={tgt} h={5} />
              </div>
              <div style={{ flexShrink: 0 }}>{hit ? <Tag c={C.green}><CheckCircle size={9} /> Done</Tag> : <Tag c={C.amber}>{tgt - jobs} left</Tag>}</div>
            </div>;
          })}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 14px", borderRadius: 8, background: C.panel, border: `1px solid ${C.border}`, fontSize: 12 }}>
            <span style={{ color: C.sub }}>Total across {todByPerson.length} {todByPerson.length === 1 ? "person" : "people"}</span>
            <span style={{ fontWeight: 800, color: C.blue }}>{todJ} applications</span>
          </div>
        </div>
      }
    </div>
    <EmpStats my={my} tgt={tgt} />
    <div style={crd()}><div style={{ fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}><Plus size={16} color={C.blue} /> Log Applications</div><div style={{ marginBottom: 12 }}><input type="date" value={dt} max={td()} onChange={e => setDt(e.target.value)} style={{ ...inp(), maxWidth: 170, colorScheme: C === DARK ? "dark" : "light" }} /></div>{rows.map((r,i) => <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}><input placeholder="Person name" value={r.p} onChange={e => { const n=[...rows]; n[i].p=e.target.value; setRows(n); }} style={{ ...inp(), flex: 2 }} /><input type="number" placeholder="Jobs" min="1" value={r.j} onChange={e => { const n=[...rows]; n[i].j=e.target.value; setRows(n); }} style={{ ...inp(), flex: 1, maxWidth: 90 }} />{rows.length > 1 && <button onClick={() => setRows(rows.filter((_,j)=>j!==i))} style={{ background: C.redD, border: "none", borderRadius: 6, padding: 6, cursor: "pointer" }}><Trash2 size={13} color={C.red} /></button>}</div>)}<div style={{ display: "flex", gap: 8, marginTop: 10 }}><Bs c={C.cyan} o onClick={() => setRows([...rows, { p: "", j: "" }])}><Plus size={12} /> Person</Bs><Bs c={C.green} onClick={submit}><Briefcase size={12} /> Submit</Bs></div>{dupWarn && <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 6, background: C.redD, color: C.red, fontSize: 11, display: "flex", alignItems: "center", gap: 5 }}><AlertTriangle size={13} /> {dupWarn}</div>}{okMsg && <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 6, background: C.greenD, color: C.green, fontSize: 11, display: "flex", alignItems: "center", gap: 5 }}><CheckCircle size={13} /> {okMsg}</div>}</div>
    {myP.length > 0 && <div style={crd()}>
      <div style={{ fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}><Users size={16} color={C.cyan} /> My People — Application Tracker</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 12 }}>
        {myP.map(([name,jobs]) => {
          const ps = gS(st.pstat?.[name]||"active"); const PSI = ps.i;
          const pe = myEv.filter(x=>x.person===name).sort((a,b)=>b.date.localeCompare(a.date));
          // Group events by company for this person
          const byComp = {};
          pe.forEach(ev => { if(!byComp[ev.company]) byComp[ev.company]=[]; byComp[ev.company].push(ev); });
          // Find highest stage per company
          const compEntries = Object.entries(byComp).map(([comp, evts]) => {
            const types = evts.map(e => e.type);
            let stage = "call";
            for (const s of PIPE_ORDER) { if (types.includes(s)) stage = s; }
            const isRejected = types.includes("rejected");
            return { company: comp, events: evts, stage, isRejected, latest: evts[0]?.date };
          }).sort((a,b) => {
            if (a.isRejected !== b.isRejected) return a.isRejected ? 1 : -1;
            return PIPE_ORDER.indexOf(b.stage) - PIPE_ORDER.indexOf(a.stage);
          });

          // Compute smart status: purely from events, never from stale pstat
          const hasPlaced = compEntries.some(c => c.stage === "placed" && !c.isRejected);
          const hasActive = compEntries.some(c => !c.isRejected);
          const allRejected = compEntries.length > 0 && compEntries.every(c => c.isRejected);
          const bestStage = hasPlaced ? "placed" : compEntries.filter(c => !c.isRejected).reduce((best, c) => PIPE_ORDER.indexOf(c.stage) > PIPE_ORDER.indexOf(best) ? c.stage : best, "call");
          const smartStatus = hasPlaced ? { l: "Placed", c: C.gold, i: Star }
            : allRejected ? { l: "All Rejected", c: C.red, i: XCircle }
            : hasActive ? { l: PIPE_LABELS[bestStage] || "Active", c: gE(bestStage).c, i: gE(bestStage).i }
            : { l: "Active", c: C.green, i: Zap }; // default: no events = Active
          const SmI = smartStatus.i;
          const borderC = hasPlaced ? C.gold + "40" : allRejected ? C.red + "30" : C.border;

          return <div key={name} style={{ background: C.panel, borderRadius: 12, border: `1px solid ${borderC}`, padding: 14 }}>
            {/* Person header */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <div><div style={{ fontWeight: 600, fontSize: 14 }}>{name}</div><span style={{ fontSize: 10, color: C.sub }}>{jobs} applications • {compEntries.length} {compEntries.length === 1 ? "company" : "companies"}</span></div>
              <Tag c={smartStatus.c}><SmI size={9} /> {smartStatus.l}</Tag>
            </div>

            {/* Company pipelines */}
            {compEntries.length > 0 && <div style={{ marginBottom: 10 }}>
              {compEntries.map(({ company, events: cEvts, stage, isRejected }) => {
                const stageIdx = PIPE_ORDER.indexOf(stage);
                const nextStages = isRejected ? [] : PIPE_ORDER.slice(stageIdx + 1);
                // Quick add helper - creates event and saves immediately
                const quickAdd = (type) => {
                  const ev = { id: uid(), eid: cur, person: name, type, company, note: "", date: td() };
                  let ns = { ...st, events: [...(st.events||[]), ev] };
                  if (type === "placed") { ns.pstat = { ...ns.pstat, [name]: "placed" }; ns.stars = { ...ns.stars, [cur]: (ns.stars[cur]||0)+1 }; }
                  save(ns);
                };
                return <div key={company} style={{ background: C.card, borderRadius: 10, border: `1px solid ${isRejected ? C.red + "30" : stage === "placed" ? C.gold + "30" : C.border}`, padding: 12, marginBottom: 6 }}>
                  {/* Company name + current stage */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{company}</span>
                    {isRejected ? <Tag c={C.red}><XCircle size={9} /> Rejected</Tag> :
                      stage === "placed" ? <Tag c={C.gold}><Star size={9} /> Hired</Tag> :
                      <Tag c={gE(stage).c}>{React.createElement(gE(stage).i, { size: 9 })} {PIPE_LABELS[stage]}</Tag>}
                  </div>

                  {/* Visual pipeline bar */}
                  <div style={{ display: "flex", alignItems: "center", gap: 2, marginBottom: 8 }}>
                    {PIPE_ORDER.map((s, i) => {
                      const reached = isRejected ? false : i <= stageIdx;
                      const sc = gE(s);
                      return <React.Fragment key={s}>
                        <div style={{ flex: 1, height: 5, borderRadius: 3, background: isRejected ? C.red + "30" : reached ? sc.c : C.border, opacity: reached ? 1 : 0.25, transition: "all .3s" }} />
                        {i < PIPE_ORDER.length - 1 && <ArrowRight size={8} color={isRejected ? C.red : reached ? sc.c : C.dim} style={{ flexShrink: 0, opacity: reached ? 0.7 : 0.15 }} />}
                      </React.Fragment>;
                    })}
                  </div>
                  <div style={{ display: "flex", gap: 3, marginBottom: 6 }}>
                    {PIPE_ORDER.map((s, i) => {
                      const reached = isRejected ? false : i <= stageIdx;
                      return <span key={s} style={{ flex: 1, fontSize: 8, fontWeight: 600, textAlign: "center", color: reached ? gE(s).c : C.dim, opacity: reached ? 1 : 0.35 }}>{PIPE_LABELS[s]}</span>;
                    })}
                  </div>

                  {/* Quick action buttons — advance to next stage or reject */}
                  {!isRejected && stage !== "placed" && <div style={{ marginTop: 6, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: C.dim, marginBottom: 6 }}>Update status:</div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {nextStages.map(ns => {
                        const et = gE(ns);
                        return <button key={ns} onClick={() => quickAdd(ns)} style={{ padding: "5px 12px", borderRadius: 7, border: `1px solid ${et.c}40`, background: `${et.c}10`, color: et.c, fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontFamily: "inherit", transition: "all .15s" }}
                          onMouseOver={e => e.currentTarget.style.background = `${et.c}25`}
                          onMouseOut={e => e.currentTarget.style.background = `${et.c}10`}>
                          {React.createElement(et.i, { size: 10 })} {ns === "placed" ? "Got Job!" : PIPE_LABELS[ns]}
                        </button>;
                      })}
                      <button onClick={() => quickAdd("rejected")} style={{ padding: "5px 12px", borderRadius: 7, border: `1px solid ${C.red}40`, background: `${C.red}08`, color: C.red, fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontFamily: "inherit", transition: "all .15s" }}
                        onMouseOver={e => e.currentTarget.style.background = `${C.red}20`}
                        onMouseOut={e => e.currentTarget.style.background = `${C.red}08`}>
                        <XCircle size={10} /> Rejected
                      </button>
                    </div>
                  </div>}

                  {/* Hired celebration */}
                  {stage === "placed" && !isRejected && <div style={{ marginTop: 6, padding: "6px 10px", borderRadius: 7, background: C.goldD, color: C.gold, fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}><Star size={12} fill={C.gold} /> Successfully placed!</div>}

                  {/* Event timeline */}
                  {cEvts.length > 0 && <div style={{ borderLeft: `2px solid ${C.border}`, paddingLeft: 8, marginTop: 8 }}>
                    {cEvts.slice(0, 3).map(ev => {
                      const et = gE(ev.type); const EI = et.i;
                      return <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3, fontSize: 10 }}>
                        <EI size={9} color={et.c} /><strong style={{ color: et.c }}>{et.l}</strong>
                        {ev.note && <span style={{ color: C.dim }}>— {ev.note}</span>}
                        <span style={{ color: C.dim, marginLeft: "auto", fontSize: 9 }}>{fmtD(ev.date)}</span>
                      </div>;
                    })}
                    {cEvts.length > 3 && <div style={{ fontSize: 9, color: C.dim }}>+{cEvts.length - 3} more</div>}
                  </div>}
                </div>;
              })}
            </div>}

            {/* No company events yet */}
            {compEntries.length === 0 && <div style={{ padding: "8px 0", color: C.dim, fontSize: 11 }}>No interview activity yet. Track a call, assessment, or interview below.</div>}

            {/* Action buttons */}
            {ps.v !== "stopped" && ps.v !== "placed" && <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <B c={C.blue} o onClick={() => { setEvm(name); setEvd(td()); }} style={{ flex: 1, justifyContent: "center" }}><Plus size={12} /> New Company</B>
              <B c={C.red} o onClick={() => { if (!st.pstat) st.pstat = {}; save({ ...st, pstat: { ...st.pstat, [name]: `stopped:${td()}` } }); }} style={{ justifyContent: "center" }}><XCircle size={12} /> Stop</B>
            </div>}
            {ps.v === "stopped" && <div style={{ display: "flex", gap: 6, marginTop: 4, alignItems: "center" }}>
              <div style={{ flex: 1, padding: "6px 10px", borderRadius: 7, background: C.redD, color: C.red, fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}><XCircle size={12} /> Person stopped — left consultancy</div>
              <Bs c={C.green} onClick={() => save({ ...st, pstat: { ...st.pstat, [name]: "active" } })}>Reactivate</Bs>
            </div>}
            {ps.v === "placed" && <div style={{ padding: "6px 10px", borderRadius: 7, background: C.goldD, color: C.gold, fontSize: 11, display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}><Star size={12} fill={C.gold} /> Successfully placed!</div>}
          </div>;
        })}
      </div>
    </div>}
    <Mdl open={!!evm} onClose={() => setEvm(null)} title={`Track Update — ${evm}`}>
      <div style={{ fontSize: 12, color: C.sub, marginBottom: 12 }}>Log a new company interaction for <strong style={{ color: C.text }}>{evm}</strong></div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 14 }}>
        {EVTS().map(et => { const EI = et.i; const a = evt === et.v; return <Bs key={et.v} c={et.c} o={!a} onClick={() => setEvt(et.v)}><EI size={11} /> {et.l}</Bs>; })}
      </div>
      {evt === "placed" && <div style={{ padding: "8px 12px", borderRadius: 8, background: C.goldD, color: C.gold, fontSize: 11, marginBottom: 12, display: "flex", alignItems: "center", gap: 5 }}><Star size={12} fill={C.gold} /> This earns you a star! Person will be marked as Placed.</div>}
      {evt === "rejected" && <div style={{ padding: "8px 12px", borderRadius: 8, background: C.redD, color: C.red, fontSize: 11, marginBottom: 12, display: "flex", alignItems: "center", gap: 5 }}><XCircle size={12} /> This company's application will be marked as rejected. Person stays active for other companies.</div>}
      <input placeholder="Company name (e.g. Google, Amazon)" value={evc} onChange={e => setEvc(e.target.value)} style={{ ...inp(), marginBottom: 8 }} />
      <input type="date" value={evd} max={td()} onChange={e => setEvd(e.target.value)} style={{ ...inp(), maxWidth: 170, colorScheme: C === DARK ? "dark" : "light", marginBottom: 8 }} />
      <input placeholder="Notes (optional)" value={evn} onChange={e => setEvn(e.target.value)} style={{ ...inp(), marginBottom: 14 }} />
      <B c={evt === "rejected" ? C.red : C.green} onClick={addEv} style={{ width: "100%", justifyContent: "center" }}>{evt === "rejected" ? <><XCircle size={13} /> Mark Rejected</> : <><Plus size={13} /> Save</>}</B>
    </Mdl>
    {/* Edit entry modal - employees can only edit today's entries */}
    <Mdl open={!!editId} onClose={() => { setEditId(null); setEditJobs(""); }} title="Edit application count">
      <div style={{ color: C.sub, fontSize: 12, marginBottom: 12 }}>You can modify entries from today and yesterday only. After that, entries are locked.</div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 10, fontWeight: 600, color: C.dim, display: "block", marginBottom: 4 }}>NUMBER OF APPLICATIONS</label>
        <input type="number" min="1" value={editJobs} onChange={e => setEditJobs(e.target.value)} style={inp()} placeholder="Enter new count" />
      </div>
      <B c={C.green} onClick={saveMyEdit} style={{ width: "100%", justifyContent: "center" }}><CheckCircle size={13} /> Save Changes</B>
    </Mdl>
    <div style={crd()}><div style={{ fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}><Calendar size={16} color={C.violet} /> History</div>{my.length === 0 ? <div style={{ textAlign: "center", padding: 20, color: C.dim }}>No entries yet</div> : <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={tth()}>Date</th><th style={tth()}>Person</th><th style={tth()}>Status</th><th style={{ ...tth(), textAlign: "right" }}>Jobs</th><th style={{ ...tth(), textAlign: "center", width: 50 }}>Edit</th></tr></thead><tbody>{[...my].reverse().slice(0,50).map(e => { const s = gS(st.pstat?.[e.person]||"active"); const SI = s.i; const daysDiff = Math.floor((parseD(td()) - parseD(e.date)) / 86400000); const canEdit = daysDiff >= 0 && daysDiff <= 1; return <tr key={e.id}><td style={ttd()}>{fmtD(e.date)}</td><td style={ttd()}>{e.person}</td><td style={ttd()}><Tag c={s.c}><SI size={9} /> {s.l}</Tag></td><td style={{ ...ttd(), textAlign: "right", fontWeight: 700, color: C.green }}>{e.jobs}</td><td style={{ ...ttd(), textAlign: "center" }}>{canEdit ? <button onClick={() => { setEditId(e.id); setEditJobs(String(e.jobs)); }} style={{ background: `${C.blue}15`, border: `1px solid ${C.blue}30`, borderRadius: 5, padding: "3px 8px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3, color: C.blue, fontSize: 10, fontWeight: 600 }}><Edit3 size={10} /> Edit</button> : <span style={{ color: C.dim, fontSize: 9 }}>locked</span>}</td></tr>; })}</tbody></table></div>}</div>
  </div></div>;
}

function Adm({ st, save, tab, setTab, out, ref2 }) {
  const [addM, setAddM] = useState(false); const [an, setAn] = useState(""); const [ap, setAp] = useState("");
  const [exp, setExp] = useState(null);
  const [edM, setEdM] = useState(null); const [edD, setEdD] = useState({});
  const [rpM, setRpM] = useState(null); const [rpV, setRpV] = useState("");
  const [ff, setFf] = useState(""); const [ft, setFt] = useState("");
  const [sd, setSd] = useState("");
  const [pdfFrom, setPdfFrom] = useState(""); const [pdfTo, setPdfTo] = useState("");
  const [pdfEmp, setPdfEmp] = useState("");
  const [np2, setNp2] = useState(""); const [nt, setNt] = useState("");
  const [pipeView, setPipeView] = useState(null);
  const [resetStep, setResetStep] = useState(0);
  const [resetPin, setResetPin] = useState("");
  const [holDate, setHolDate] = useState(""); const [holName, setHolName] = useState("");
  const [reassign, setReassign] = useState(null); // { person: "John", fromEid: "abc" }
  const [reassignTo, setReassignTo] = useState("");
  const tgt = st.target || 30;

  const fil = useMemo(() => { let e = st.entries.filter(x => x.date <= td()); if (ff) e = e.filter(x => x.date >= ff); if (ft) e = e.filter(x => x.date <= ft); return e; }, [st.entries, ff, ft]);
  const es = useMemo(() => st.emps.map(em => {
    const ents = fil.filter(x => x.eid === em.id); const jobs = ents.reduce((a,x)=>a+x.jobs,0); const ppl = new Set(ents.map(x=>x.person)).size;
    const todJ = st.entries.filter(x => x.eid === em.id && x.date === td()).reduce((a,x)=>a+x.jobs,0);
    const stars = st.stars?.[em.id]||0; const evts = (st.events||[]).filter(x => x.eid === em.id);
    const byD = {}; ents.forEach(x => { if (!byD[x.date]) byD[x.date] = { jobs: 0, ppl: {} }; byD[x.date].jobs += x.jobs; byD[x.date].ppl[x.person] = (byD[x.date].ppl[x.person]||0) + x.jobs; });
    // Precise avg/day: for each person this employee applies for, calc that person's avg (working days only - excludes weekends & holidays), then average all
    const personAvgs = {};
    ents.forEach(x => { if (!personAvgs[x.person]) personAvgs[x.person] = { total: 0, days: new Set() }; personAvgs[x.person].total += x.jobs; personAvgs[x.person].days.add(x.date); });
    const perPersonAvgs = Object.values(personAvgs).map(p => p.days.size > 0 ? p.total / p.days.size : 0);
    const avgDay = perPersonAvgs.length > 0 ? Math.round(perPersonAvgs.reduce((a,v) => a+v, 0) / perPersonAvgs.length) : 0;
    return { ...em, ents, jobs, ppl, todJ, stars, evts, byD, avgDay };
  }), [st, fil]);
  // Active employees (not removed) vs all
  const activeEs = useMemo(() => es.filter(x => !x.removed), [es]);
  const removedEs = useMemo(() => es.filter(x => x.removed), [es]);

  const hitT = useMemo(() => activeEs.filter(x=>x.todJ>=tgt).length, [activeEs,tgt]);
  const allD = useMemo(() => [...new Set(st.entries.map(x=>x.date))].sort((a,b)=>b.localeCompare(a)), [st.entries]);
  const dayD = useMemo(() => { const m={}; fil.forEach(x=>{m[x.date]=(m[x.date]||0)+x.jobs;}); return Object.entries(m).sort().map(([d,j])=>({ date: fmtD(d), fd: d, jobs: j })); }, [fil]);

  const dd = useMemo(() => {
    if (!sd) return null; const de = st.entries.filter(x=>x.date===sd); const byE = {};
    de.forEach(x => { const n=st.emps.find(e=>e.id===x.eid)?.name||"?"; if(!byE[n])byE[n]={name:n,eid:x.eid,ppl:{},tot:0}; byE[n].ppl[x.person]=(byE[n].ppl[x.person]||0)+x.jobs; byE[n].tot+=x.jobs; });
    return { tot: de.reduce((a,x)=>a+x.jobs,0), emps: Object.values(byE).sort((a,b)=>b.tot-a.tot) };
  }, [sd, st]);

  const rpt = useMemo(() => {
    const d=sd||td(); const de=st.entries.filter(x=>x.date===d); const dv=(st.events||[]).filter(x=>x.date===d); const byE={};
    de.forEach(x=>{const n=st.emps.find(e=>e.id===x.eid)?.name||"?"; if(!byE[n])byE[n]={tot:0,ppl:{}}; byE[n].tot+=x.jobs; byE[n].ppl[x.person]=(byE[n].ppl[x.person]||0)+x.jobs;});
    return { d, tot: de.reduce((a,x)=>a+x.jobs,0), ec: Object.keys(byE).length, byE, evs: dv };
  }, [sd, st]);

  const addE = () => { if (!an.trim()||ap.length<4) return; save({ ...st, emps: [...st.emps, { id: uid(), name: an.trim(), pw: ap, dt: td() }] }); setAn(""); setAp(""); setAddM(false); };
  const rmE = i => {
    // Soft delete - mark as removed with date, keep all records
    save({ ...st, emps: st.emps.map(x => x.id === i ? { ...x, removed: td() } : x) });
  };
  const restoreE = i => save({ ...st, emps: st.emps.map(x => x.id === i ? { ...x, removed: undefined } : x) });
  const rmEn = i => save({ ...st, entries: st.entries.filter(x=>x.id!==i) });
  const savEd = () => { if (!edM) return; save({ ...st, entries: st.entries.map(x=>x.id===edM?{...x,...edD}:x) }); setEdM(null); };
  const rstPw = () => { if (!rpM||rpV.length<4) return; save({ ...st, emps: st.emps.map(x=>x.id===rpM?{...x,pw:rpV}:x) }); setRpM(null); setRpV(""); };
  const setPS = (n,v) => save({ ...st, pstat: { ...st.pstat, [n]: v } });
  const doReassign = () => {
    if (!reassign || !reassignTo || reassignTo === reassign.fromEid) return;
    // Transfer all entries and events for this person from old employee to new employee
    const updated = {
      ...st,
      entries: st.entries.map(e => e.person === reassign.person && e.eid === reassign.fromEid ? { ...e, eid: reassignTo } : e),
      events: (st.events || []).map(e => e.person === reassign.person && e.eid === reassign.fromEid ? { ...e, eid: reassignTo } : e),
    };
    save(updated);
    setReassign(null); setReassignTo("");
  };

  const tabs = [
    { id: "dash", l: "Dashboard", i: Activity },
    { id: "team", l: "Team", i: Users },
    { id: "date", l: "Date View", i: Calendar },
    { id: "people", l: "People", i: Target },
    { id: "report", l: "Report", i: FileText },
    { id: "cfg", l: "Settings", i: Shield },
  ];

  return <div style={pg()}><div style={wrap}>
    <div style={hdr()}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${C.blue},${C.cyan})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Shield size={18} color="#fff" /></div>
        <div>
          <div style={logoCss()}>HIREZEN JobTracker</div>
          <div style={{ color: C.sub, fontSize: 10, marginTop: 1, display: "flex", alignItems: "center", gap: 5 }}>Admin Dashboard <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, display: "inline-block", boxShadow: `0 0 6px ${C.green}` }} /> <span style={{ color: C.green, fontSize: 10 }}>Live</span></div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}><ThemeToggle /><B c={C.violet} o onClick={()=>doExport(st)}><Download size={14} /> CSV</B><B c={C.cyan} o onClick={ref2}><Activity size={14} /> Refresh</B><B c={C.red} o onClick={out}><LogOut size={14} /> Logout</B></div>
    </div>
    <div style={{ display: "flex", gap: 3, marginBottom: 22, overflowX: "auto", paddingBottom: 2, background: C.panel, borderRadius: 12, padding: 4, border: `1px solid ${C.border}` }}>{tabs.map(t=><Tb key={t.id} a={tab===t.id} onClick={()=>setTab(t.id)}><t.i size={12} style={{ marginRight: 4, verticalAlign: "middle" }} /> {t.l}</Tb>)}</div>
    {["dash","team","people"].includes(tab) && <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}><Filter size={12} color={C.dim} /><input type="date" value={ff} onChange={e=>setFf(e.target.value)} style={{ ...inp(), maxWidth: 140, padding: "4px 8px", fontSize: 11, colorScheme: C === DARK ? "dark" : "light" }} /><span style={{ color: C.dim, fontSize: 10 }}>to</span><input type="date" value={ft} onChange={e=>setFt(e.target.value)} style={{ ...inp(), maxWidth: 140, padding: "4px 8px", fontSize: 11, colorScheme: C === DARK ? "dark" : "light" }} />{(ff||ft)&&<Bs c={C.red} o onClick={()=>{setFf("");setFt("");}}>Clear</Bs>}</div>}

    <Mdl open={!!edM} onClose={()=>setEdM(null)} title="Edit Entry"><input value={edD.person||""} onChange={e=>setEdD({...edD,person:e.target.value})} placeholder="Person" style={{ ...inp(), marginBottom: 8 }} /><input type="number" value={edD.jobs||""} onChange={e=>setEdD({...edD,jobs:Number(e.target.value)})} placeholder="Jobs" style={{ ...inp(), marginBottom: 8 }} /><input type="date" value={edD.date||""} onChange={e=>setEdD({...edD,date:e.target.value})} style={{ ...inp(), colorScheme: C === DARK ? "dark" : "light", marginBottom: 12 }} /><B c={C.green} onClick={savEd} style={{ width: "100%", justifyContent: "center" }}><CheckCircle size={13} /> Save</B></Mdl>
    <Mdl open={!!rpM} onClose={()=>setRpM(null)} title="Reset Password"><p style={{ color: C.sub, fontSize: 12, marginBottom: 10 }}>For: <strong style={{ color: C.text }}>{st.emps.find(x=>x.id===rpM)?.name}</strong></p><input type="text" placeholder="New password (4+)" value={rpV} onChange={e=>setRpV(e.target.value)} style={{ ...inp(), marginBottom: 12 }} /><B c={C.green} onClick={rstPw} style={{ width: "100%", justifyContent: "center" }}><Key size={13} /> Reset</B></Mdl>
    <Mdl open={addM} onClose={()=>setAddM(false)} title="Add Employee"><input placeholder="Name" value={an} onChange={e=>setAn(e.target.value)} style={{ ...inp(), marginBottom: 6 }} /><input placeholder="Password (4+)" value={ap} onChange={e=>setAp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addE()} style={{ ...inp(), marginBottom: 12 }} /><B c={C.green} onClick={addE} style={{ width: "100%", justifyContent: "center" }}><UserPlus size={13} /> Add</B></Mdl>
    <Mdl open={!!reassign} onClose={() => { setReassign(null); setReassignTo(""); }} title={`Reassign — ${reassign?.person}`}>
      {reassign && (() => {
        const fromEmp = st.emps.find(x => x.id === reassign.fromEid);
        const entryCount = st.entries.filter(x => x.person === reassign.person && x.eid === reassign.fromEid).length;
        const eventCount = (st.events || []).filter(x => x.person === reassign.person && x.eid === reassign.fromEid).length;
        const totalJobs = st.entries.filter(x => x.person === reassign.person && x.eid === reassign.fromEid).reduce((a, x) => a + x.jobs, 0);
        return <>
          <div style={{ padding: "10px 14px", borderRadius: 8, background: C.blueD, marginBottom: 14, fontSize: 12 }}>
            <div style={{ fontWeight: 600, color: C.text, marginBottom: 4 }}>Transfer <strong>{reassign.person}</strong> from <strong>{fromEmp?.name || "?"}</strong> to another employee</div>
            <div style={{ color: C.sub, fontSize: 11 }}>This will move {totalJobs} applications ({entryCount} entries) and {eventCount} pipeline events to the new employee. No data is deleted.</div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 10, fontWeight: 600, color: C.dim, display: "block", marginBottom: 4 }}>TRANSFER TO</label>
            <select value={reassignTo} onChange={e => setReassignTo(e.target.value)} style={{ ...inp(), appearance: "auto" }}>
              <option value="">Select employee...</option>
              {st.emps.filter(e => !e.removed && e.id !== reassign.fromEid).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          {reassignTo && <div style={{ padding: "8px 12px", borderRadius: 8, background: C.amberD, color: C.amber, fontSize: 11, marginBottom: 14, display: "flex", alignItems: "center", gap: 5 }}>
            <AlertTriangle size={13} /> {reassign.person}'s {totalJobs} applications and {eventCount} events will move from {fromEmp?.name} to {st.emps.find(x => x.id === reassignTo)?.name}
          </div>}
          <B c={C.blue} onClick={doReassign} style={{ width: "100%", justifyContent: "center" }} disabled={!reassignTo}><ArrowRight size={13} /> Confirm Transfer</B>
        </>;
      })()}
    </Mdl>

    {tab === "dash" && <div style={{ animation: "fi .3s" }}>

      {/* ── ROW 1: Key numbers ── */}
      {(() => {
        const todayTotal = st.entries.filter(e => e.date === td()).reduce((a, x) => a + x.jobs, 0);
        const todayActive = new Set(st.entries.filter(e => e.date === td()).map(e => e.eid)).size;
        const allPpl = new Set(st.entries.map(e => e.person)).size;
        // Precise avg: for each person, calc their own daily avg, then average all persons
        const personMap = {};
        st.entries.filter(e => e.date <= td()).forEach(e => {
          if (!personMap[e.person]) personMap[e.person] = { total: 0, days: new Set() };
          personMap[e.person].total += e.jobs; personMap[e.person].days.add(e.date);
        });
        const personAvgs = Object.values(personMap).map(p => p.days.size > 0 ? p.total / p.days.size : 0);
        const avgPerDay = personAvgs.length > 0 ? Math.round(personAvgs.reduce((a,v) => a+v, 0) / personAvgs.length) : 0;
        const activeCount = activeEs.length;
        return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginBottom: 18 }}>
          <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: C.green }}>{todayTotal}</div>
            <div style={{ fontSize: 10, color: C.sub, marginTop: 2 }}>Applications — {fmtD(td())}</div>
          </div>
          <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: C.blue }}>{todayActive}/{activeCount}</div>
            <div style={{ fontSize: 10, color: C.sub, marginTop: 2 }}>Employees Active Today</div>
          </div>
          <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: C.cyan }}>{allPpl}</div>
            <div style={{ fontSize: 10, color: C.sub, marginTop: 2 }}>Total People</div>
          </div>
          <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: C.amber }}>{avgPerDay}</div>
            <div style={{ fontSize: 10, color: C.sub, marginTop: 2 }}>Avg/Day Per Person</div>
          </div>
        </div>;
      })()}

      {/* ── ROW 2: Today's Employee Status ── */}
      <div style={crd()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}><Target size={16} color={C.amber} /> Today — {fmtDFull(td())}</div>
          <div style={{ display: "flex", gap: 6 }}>
            {!isWorkday(td()) && <div style={{ padding: "4px 12px", borderRadius: 20, background: C.amberD, display: "flex", alignItems: "center", gap: 4 }}><Calendar size={10} color={C.amber} /><span style={{ fontSize: 11, fontWeight: 600, color: C.amber }}>{isWeekday(td()) ? (st.holidays||[]).find(h=>h.date===td())?.name || "Holiday" : "Weekend"}</span></div>}
            <div style={{ padding: "4px 12px", borderRadius: 20, background: C.greenD, display: "flex", alignItems: "center", gap: 4 }}><CheckCircle size={10} color={C.green} /><span style={{ fontSize: 12, fontWeight: 800, color: C.green }}>{hitT}</span><span style={{ fontSize: 9, color: C.sub }}>met</span></div>
            <div style={{ padding: "4px 12px", borderRadius: 20, background: C.amberD, display: "flex", alignItems: "center", gap: 4 }}><AlertTriangle size={10} color={C.amber} /><span style={{ fontSize: 12, fontWeight: 800, color: C.amber }}>{activeEs.filter(x=>x.todJ>0&&x.todJ<tgt).length}</span><span style={{ fontSize: 9, color: C.sub }}>below</span></div>
            <div style={{ padding: "4px 12px", borderRadius: 20, background: C.redD, display: "flex", alignItems: "center", gap: 4 }}><XCircle size={10} color={C.red} /><span style={{ fontSize: 12, fontWeight: 800, color: C.red }}>{activeEs.filter(x=>x.todJ===0).length}</span><span style={{ fontSize: 9, color: C.sub }}>none</span></div>
          </div>
        </div>

        {/* Employee cards instead of table */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 10 }}>
          {(() => {
            const todayEntries = st.entries.filter(e => e.date === td());
            const byEmp = {};
            todayEntries.forEach(e => {
              const emp = st.emps.find(x => x.id === e.eid);
              if (!emp) return;
              if (!byEmp[e.eid]) byEmp[e.eid] = { name: emp.name, id: emp.id, people: {}, total: 0 };
              byEmp[e.eid].people[e.person] = (byEmp[e.eid].people[e.person]||0) + e.jobs;
              byEmp[e.eid].total += e.jobs;
            });
            st.emps.filter(emp => !emp.removed).forEach(emp => { if (!byEmp[emp.id]) byEmp[emp.id] = { name: emp.name, id: emp.id, people: {}, total: 0 }; });
            return Object.values(byEmp).sort((a,b) => b.total - a.total).map(emp => {
              const people = Object.entries(emp.people).sort((a,b) => b[1] - a[1]);
              const pplCount = people.length;
              const target = pplCount > 0 ? tgt * pplCount : tgt;
              const allMet = pplCount > 0 && people.every(([,j]) => j >= tgt);
              const hasActivity = emp.total > 0;
              const borderC = allMet ? C.green : hasActivity ? C.amber : C.red;

              // Find last submission date for waiting message
              const lastEntry = st.entries.filter(x => x.eid === emp.id && x.date <= td()).sort((a,b) => b.date.localeCompare(a.date))[0];
              const lastDate = lastEntry?.date;
              const daysSince = lastDate ? Math.max(0, Math.round((parseD(td()) - parseD(lastDate)) / 86400000)) : null;

              return <div key={emp.id} style={{ background: C.panel, borderRadius: 12, border: `1.5px solid ${borderC}${allMet ? "40" : "25"}`, padding: 14 }}>
                {/* Name + ring */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <Ring v={emp.total} mx={target} sz={40} sw={3} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{emp.name}</div>
                    <div style={{ fontSize: 10, color: C.sub }}>{emp.total}/{target} {pplCount > 1 && `(${tgt}×${pplCount})`}</div>
                  </div>
                  {allMet && <Tag c={C.green}><CheckCircle size={9} /> Done</Tag>}
                  {hasActivity && !allMet && <Tag c={C.amber}>In Progress</Tag>}
                  {!hasActivity && <Tag c={C.red}>Waiting</Tag>}
                </div>

                {/* Per person breakdown */}
                {people.length > 0 ? <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {people.map(([person, jobs]) => {
                    const hit = jobs >= tgt;
                    return <div key={person} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                      <span style={{ fontSize: 12, flex: 1, fontWeight: 500 }}>{person}</span>
                      <Bar2 v={jobs} mx={tgt} h={4} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: hit ? C.green : C.amber, minWidth: 40, textAlign: "right" }}>{jobs}/{tgt}</span>
                    </div>;
                  })}
                </div> : <div style={{ fontSize: 11, color: C.amber, padding: "6px 8px", borderRadius: 6, background: C.amberD, display: "flex", alignItems: "center", gap: 5 }}>
                  <Clock size={12} /> Waiting on entry{daysSince !== null && daysSince > 0 ? ` — last submitted ${daysSince} day${daysSince > 1 ? "s" : ""} ago` : daysSince === 0 ? "" : " — no previous submissions"}
                </div>}
              </div>;
            });
          })()}
        </div>
      </div>

      {/* ── ROW 3: Weekly trend + Team performance side by side ── */}
      {fil.length > 0 && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        {/* Weekly trend */}
        <div style={crd()}>
          <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}><TrendingUp size={13} color={C.amber} /> Daily Trend</div>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={dayD} onClick={d=>{ if(d?.activePayload?.[0]){setSd(d.activePayload[0].payload.fd);setTab("date");} }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="date" tick={{ fill: C.dim, fontSize: 9 }} />
              <YAxis tick={{ fill: C.dim, fontSize: 9 }} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="jobs" name="Applications" fill={C.blue} radius={[4,4,0,0]} cursor="pointer" />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 9, color: C.dim, marginTop: 4, textAlign: "center" }}>Click any bar to see date details</div>
        </div>

        {/* Team performance — based on avg/day per person (equal effort = equal bar) */}
        <div style={crd()}>
          <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}><Users size={13} color={C.blue} /> Team Performance <span style={{ fontSize: 9, fontWeight: 400, color: C.dim }}>(avg applications per person per day)</span></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[...activeEs].sort((a,b) => b.avgDay - a.avgDay).map(em => {
              const maxAvg = Math.max(...activeEs.map(x => x.avgDay), 1);
              const pct = Math.round((em.avgDay / maxAvg) * 100);
              return <div key={em.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 600, minWidth: 70, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{em.name}</span>
                <div style={{ flex: 1, height: 8, borderRadius: 4, background: C.border, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", borderRadius: 4, background: `linear-gradient(90deg, ${C.blue}, ${C.cyan})`, transition: "width .4s" }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.text, minWidth: 36, textAlign: "right" }}>{em.avgDay}</span>
                <span style={{ fontSize: 9, color: C.dim, minWidth: 50 }}>{em.ppl}p/{Object.keys(em.byD).length}d</span>
              </div>;
            })}
          </div>
        </div>
      </div>}

      {/* ── ROW 4: Employee Leaderboard (kept as is) ── */}
      {activeEs.length > 0 && <div style={crd()}>
        <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 12, display: "flex", alignItems: "center", gap: 4 }}><Award size={13} color={C.gold} /> Employee Leaderboard</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <th style={tth()}>#</th>
              <th style={tth()}>Employee</th>
              <th style={{ ...tth(), textAlign: "right" }}>Avg/Day</th>
              <th style={{ ...tth(), textAlign: "right" }}>Calls</th>
              <th style={{ ...tth(), textAlign: "right" }}>Assessments</th>
              <th style={{ ...tth(), textAlign: "right" }}>Interviews</th>
              <th style={{ ...tth(), textAlign: "right" }}>Offers</th>
              <th style={{ ...tth(), textAlign: "right" }}>Placed</th>
              <th style={{ ...tth(), textAlign: "right" }}>Score</th>
            </tr></thead>
            <tbody>
              {[...activeEs].map(em => {
                const evts = (st.events||[]).filter(x => x.eid === em.id);
                const calls = evts.filter(x => x.type === "call").length;
                const assessments = evts.filter(x => x.type === "assessment").length;
                const interviews = evts.filter(x => x.type === "interview").length;
                const offers = evts.filter(x => x.type === "offer").length;
                const placed = evts.filter(x => x.type === "placed").length;
                const score = em.avgDay + (calls * 2) + (assessments * 5) + (interviews * 10) + (offers * 15) + (placed * 25);
                return { ...em, calls, assessments, interviews, offers, placed, score };
              }).sort((a, b) => b.score - a.score).map((em, i) => {
                const medalBg = i === 0 ? C.goldD : i === 1 ? `${C.sub}10` : i === 2 ? `${C.amber}08` : "transparent";
                const medalColor = i === 0 ? C.gold : i === 1 ? C.sub : i === 2 ? C.amber : C.dim;
                return <tr key={em.id} style={{ background: medalBg }}>
                  <td style={{ ...ttd(), fontWeight: 800, color: medalColor, fontSize: 13 }}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i+1}`}
                  </td>
                  <td style={{ ...ttd(), fontWeight: 600 }}>{em.name}<Stars2 n={em.stars} /></td>
                  <td style={{ ...ttd(), textAlign: "right", fontWeight: 700, color: C.green }}>{em.avgDay}</td>
                  <td style={{ ...ttd(), textAlign: "right", color: em.calls > 0 ? C.cyan : C.dim }}>{em.calls || "-"}</td>
                  <td style={{ ...ttd(), textAlign: "right", color: em.assessments > 0 ? C.amber : C.dim }}>{em.assessments || "-"}</td>
                  <td style={{ ...ttd(), textAlign: "right", color: em.interviews > 0 ? C.blue : C.dim }}>{em.interviews || "-"}</td>
                  <td style={{ ...ttd(), textAlign: "right", color: em.offers > 0 ? C.green : C.dim }}>{em.offers || "-"}</td>
                  <td style={{ ...ttd(), textAlign: "right", color: em.placed > 0 ? C.gold : C.dim, fontWeight: em.placed > 0 ? 700 : 400 }}>{em.placed || "-"}</td>
                  <td style={{ ...ttd(), textAlign: "right", fontWeight: 800, fontSize: 14, color: i === 0 ? C.gold : C.text }}>{em.score}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 8, fontSize: 9, color: C.dim }}>Score = Avg/Day + Calls×2 + Assessments×5 + Interviews×10 + Offers×15 + Placed×25</div>
      </div>}

    </div>}

    {tab === "team" && <div style={{ animation: "fi .3s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}><div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}><Users size={15} color={C.blue} /> Team ({activeEs.length} active{removedEs.length > 0 ? `, ${removedEs.length} removed` : ""})</div><B c={C.blue} onClick={()=>setAddM(true)}><Plus size={13} /> Add</B></div>

      {/* Removed employees section */}
      {removedEs.length > 0 && <div style={{ ...crd(), background: C.redD, border: `1px solid ${C.red}20`, marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 12, color: C.red, marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}><XCircle size={14} /> Removed Employees ({removedEs.length})</div>
        <div style={{ fontSize: 11, color: C.sub, marginBottom: 10 }}>These employees have been removed. Their historical data is preserved for accurate reporting.</div>
        {removedEs.map(em => <div key={em.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 8, background: C.panel, border: `1px solid ${C.border}`, marginBottom: 4 }}>
          <div><span style={{ fontWeight: 600, fontSize: 12 }}>{em.name}</span><span style={{ fontSize: 10, color: C.dim, marginLeft: 8 }}>Removed: {fmtD(em.removed)}</span><span style={{ fontSize: 10, color: C.sub, marginLeft: 8 }}>{em.jobs} total applications</span></div>
          <Bs c={C.green} onClick={() => restoreE(em.id)}>Restore</Bs>
        </div>)}
      </div>}

      {activeEs.map(em=>{
        // Today's per-person breakdown for this employee
        const todayEntries = st.entries.filter(x => x.eid === em.id && x.date === td());
        const todByPerson = {};
        todayEntries.forEach(x => { todByPerson[x.person] = (todByPerson[x.person]||0) + x.jobs; });
        const todPeople = Object.entries(todByPerson).sort((a,b) => b[1] - a[1]);
        const todPplCount = todPeople.length;
        const todTarget = todPplCount > 0 ? tgt * todPplCount : tgt;
        const todTotal = todayEntries.reduce((a,x) => a + x.jobs, 0);

        return <div key={em.id} style={{ ...crd(), marginBottom: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={()=>setExp(exp===em.id?null:em.id)}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Ring v={todTotal} mx={todTarget} sz={34} sw={3} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{em.name}<Stars2 n={em.stars} /></div>
              <div style={{ fontSize: 10, color: C.sub }}>Today: {todTotal}/{todTarget} {todPplCount > 1 && <span style={{ color: C.dim }}>({tgt}×{todPplCount} people)</span>}</div>
              {todPeople.length > 0 && <div style={{ display: "flex", gap: 4, marginTop: 3, flexWrap: "wrap" }}>
                {todPeople.map(([person, jobs]) => {
                  const hit = jobs >= tgt;
                  return <span key={person} style={{ fontSize: 9, padding: "1px 6px", borderRadius: 4, background: hit ? `${C.green}15` : `${C.amber}15`, color: hit ? C.green : C.amber, fontWeight: 600 }}>{person}: {jobs}/{tgt}</span>;
                })}
              </div>}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ textAlign: "center" }}><div style={{ fontSize: 14, fontWeight: 700, color: C.green }}>{em.jobs}</div><div style={{ fontSize: 8, color: C.dim }}>TOTAL</div></div><div style={{ textAlign: "center" }}><div style={{ fontSize: 14, fontWeight: 700, color: C.cyan }}>{em.ppl}</div><div style={{ fontSize: 8, color: C.dim }}>PEOPLE</div></div><Bs c={C.amber} o onClick={e=>{e.stopPropagation();setRpM(em.id);}}><Key size={10} /></Bs><Bs c={C.red} o onClick={e=>{e.stopPropagation();rmE(em.id);}}><Trash2 size={10} /></Bs>{exp===em.id?<ChevronDown size={13} color={C.dim}/>:<ChevronRight size={13} color={C.dim}/>}</div>
        </div>
        {exp===em.id && <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
          {em.ents.length===0 ? <div style={{ color: C.dim, textAlign: "center", padding: 10, fontSize: 11 }}>No entries</div> : (() => {
            const sorted = Object.keys(em.byD).sort((a,b)=>b.localeCompare(a));
            const weekdays = sorted.filter(d => isWorkday(d));
            const dH = weekdays.filter(d=>em.byD[d].jobs>=tgt).length;
            return <div>
              <div style={{ display: "flex", gap: 5, marginBottom: 10, flexWrap: "wrap", fontSize: 10 }}>
                <span style={{ padding: "3px 8px", borderRadius: 5, background: C.greenD, color: C.green, fontWeight: 700 }}>{em.jobs} total</span>
                <span style={{ padding: "3px 8px", borderRadius: 5, background: C.amberD, color: C.amber, fontWeight: 700 }}>{weekdays.length} working days</span>
                <span style={{ padding: "3px 8px", borderRadius: 5, background: C.blueD, color: C.blue, fontWeight: 700 }}>{em.avgDay} avg/day</span>
                <span style={{ padding: "3px 8px", borderRadius: 5, background: dH===weekdays.length?C.greenD:C.redD, color: dH===weekdays.length?C.green:C.red, fontWeight: 700 }}>{dH}/{weekdays.length} target</span>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={tth()}>Date</th><th style={tth()}>Person</th><th style={{ ...tth(), textAlign: "right" }}>Jobs</th><th style={{ ...tth(), textAlign: "center" }}>Target</th><th style={{ ...tth(), width: 50 }}></th></tr></thead>
              <tbody>{sorted.map(date => { const d=em.byD[date]; const hit=d.jobs>=tgt; return Object.entries(d.ppl).map(([person,jobs],pi)=>{ const entry=em.ents.find(x=>x.date===date&&x.person===person); return <tr key={`${date}-${person}`}>{pi===0&&<td style={{ ...ttd(), fontWeight: 600, verticalAlign: "top" }} rowSpan={Object.keys(d.ppl).length}><div>{fmtDFull(date)}</div><div style={{ fontSize: 10, color: C.dim }}>{d.jobs} total</div></td>}<td style={ttd()}>{person}</td><td style={{ ...ttd(), textAlign: "right", fontWeight: 700, color: C.green }}>{jobs}</td>{pi===0&&<td style={{ ...ttd(), textAlign: "center", verticalAlign: "top" }} rowSpan={Object.keys(d.ppl).length}>{hit?<Tag c={C.green}><CheckCircle size={9}/></Tag>:<Tag c={C.red}>{tgt-d.jobs}</Tag>}</td>}<td style={ttd()}>{entry&&<div style={{ display: "flex", gap: 2 }}><button onClick={()=>{setEdM(entry.id);setEdD({person:entry.person,jobs:entry.jobs,date:entry.date});}} style={{ background: "none", border: "none", cursor: "pointer" }}><Edit3 size={10} color={C.amber} /></button><button onClick={()=>rmEn(entry.id)} style={{ background: "none", border: "none", cursor: "pointer" }}><Trash2 size={10} color={C.dim} /></button></div>}</td></tr>; }); })}</tbody></table>
            </div>;
          })()}
        </div>}
      </div>; })}
    </div>}

    {tab === "date" && <div style={{ animation: "fi .3s" }}>
      <div style={{ fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}><Calendar size={15} color={C.violet} /> Date View{sd && <span style={{ fontWeight: 500, fontSize: 12, color: C.sub }}> — {fmtDFull(sd)}</span>}</div>
      <div style={{ ...crd(), display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}><input type="date" value={sd} onChange={e=>setSd(e.target.value)} style={{ ...inp(), maxWidth: 170, colorScheme: C === DARK ? "dark" : "light" }} />{allD.length>0&&<div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>{allD.slice(0,7).map(d=><Bs key={d} c={sd===d?C.blue:C.dim} o={sd!==d} onClick={()=>setSd(d)}>{fmtD(d)}</Bs>)}</div>}</div>
      {sd&&dd ? <div>
        {(()=>{
          const waitingC = st.emps.filter(e => !e.removed && !dd.emps.some(x=>x.eid===e.id) && st.entries.some(x => x.eid === e.id)).length;
          return <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
            <div style={{ padding: 12, borderRadius: 10, background: C.greenD, textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 800, color: C.green }}>{dd.tot}</div><div style={{ fontSize: 10, color: C.sub }}>Applications</div></div>
            <div style={{ padding: 12, borderRadius: 10, background: C.blueD, textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 800, color: C.blue }}>{dd.emps.length}</div><div style={{ fontSize: 10, color: C.sub }}>Submitted</div></div>
            <div style={{ padding: 12, borderRadius: 10, background: `${C.amber}12`, textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 800, color: C.amber }}>{waitingC}</div><div style={{ fontSize: 10, color: C.sub }}>Waiting</div></div>
            <div style={{ padding: 12, borderRadius: 10, background: C.cyanD, textAlign: "center" }}><div style={{ fontSize: 22, fontWeight: 800, color: C.cyan }}>{dd.emps.reduce((a,e)=>a+Object.keys(e.ppl).length,0)}</div><div style={{ fontSize: 10, color: C.sub }}>People</div></div>
          </div>;
        })()}
        {/* Submitted table */}
        {dd.emps.length > 0 ? <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 600, fontSize: 12, color: C.green, marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}><CheckCircle size={13} /> Submitted ({dd.emps.length} employees)</div>
          <table style={{ width: "100%", borderCollapse: "collapse", background: C.card, borderRadius: 10, overflow: "hidden" }}><thead><tr><th style={tth()}>Employee</th><th style={tth()}>Person</th><th style={{ ...tth(), textAlign: "right" }}>Jobs</th><th style={{ ...tth(), textAlign: "center" }}>Target</th></tr></thead>
          <tbody>{dd.emps.map(em=>{ const hit=em.tot>=tgt; const pp=Object.entries(em.ppl).sort((a,b)=>b[1]-a[1]); return pp.map(([person,jobs],pi)=><tr key={`${em.eid}-${person}`} style={{ background: hit ? `${C.green}06` : "transparent" }}>{pi===0&&<td style={{ ...ttd(), fontWeight: 600, verticalAlign: "top" }} rowSpan={pp.length}><div style={{ display: "flex", alignItems: "center", gap: 6 }}><Ring v={em.tot} mx={tgt} sz={28} sw={2} /><div><div>{em.name}</div><div style={{ fontSize: 10, color: C.dim }}>{em.tot} total</div></div></div></td>}<td style={ttd()}>{person}</td><td style={{ ...ttd(), textAlign: "right", fontWeight: 700, color: C.green }}>{jobs}</td>{pi===0&&<td style={{ ...ttd(), textAlign: "center", verticalAlign: "top" }} rowSpan={pp.length}>{hit?<Tag c={C.green}>Met</Tag>:<Tag c={C.red}>{tgt-em.tot} short</Tag>}</td>}</tr>); })}</tbody></table>
        </div> : <div style={{ ...crd(), textAlign: "center", padding: 20, color: C.dim, marginBottom: 14 }}>No applications submitted on this date</div>}
        {/* Still Waiting section */}
        {(()=>{
          const submittedIds = new Set(dd.emps.map(e=>e.eid));
          const waiting = st.emps.filter(e => !e.removed && !submittedIds.has(e.id) && st.entries.some(x => x.eid === e.id));
          const neverSubmitted = st.emps.filter(e => !e.removed && !submittedIds.has(e.id) && !st.entries.some(x => x.eid === e.id));
          if (waiting.length === 0 && neverSubmitted.length === 0) return null;
          return <div>
            {waiting.length > 0 && <div style={{ ...crd(), background: `${C.amber}08`, border: `1px solid ${C.amber}20`, marginBottom: 10 }}>
              <div style={{ fontWeight: 600, fontSize: 12, color: C.amber, marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}><Clock size={13} /> Still Waiting - {waiting.length} employee{waiting.length>1?"s":""} not submitted</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={tth()}>Employee</th><th style={tth()}>Last Submitted</th><th style={{ ...tth(), textAlign: "right" }}>All-Time Total</th><th style={{ ...tth(), textAlign: "center" }}>Status</th></tr></thead>
              <tbody>{waiting.map(emp => {
                const allEnts = [...st.entries.filter(x => x.eid === emp.id)];
                const sorted = allEnts.sort((a,b)=>b.date.localeCompare(a.date));
                const lastDate = sorted.length > 0 ? sorted[0].date : "-";
                const totalAll = allEnts.reduce((a,x)=>a+x.jobs, 0);
                const daysSince = lastDate !== "-" ? Math.max(0, Math.round((parseD(sd) - parseD(lastDate)) / 86400000)) : 0;
                return <tr key={emp.id}>
                  <td style={{ ...ttd(), fontWeight: 600 }}><div style={{ display: "flex", alignItems: "center", gap: 6 }}><Ring v={0} mx={tgt} sz={28} sw={2} />{emp.name}</div></td>
                  <td style={ttd()}><span style={{ color: C.sub }}>{fmtD(lastDate)}</span>{daysSince > 0 && <span style={{ fontSize: 9, color: C.amber, marginLeft: 4 }}>({daysSince}d ago)</span>}</td>
                  <td style={{ ...ttd(), textAlign: "right", color: C.sub }}>{totalAll}</td>
                  <td style={{ ...ttd(), textAlign: "center" }}><Tag c={C.amber}><Clock size={9} /> Pending</Tag></td>
                </tr>;
              })}</tbody></table>
            </div>}
            {neverSubmitted.length > 0 && <div style={{ ...crd(), background: `${C.red}08`, border: `1px solid ${C.red}20` }}>
              <div style={{ fontWeight: 600, fontSize: 12, color: C.red, marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}><AlertTriangle size={13} /> Never Submitted - {neverSubmitted.length} employee{neverSubmitted.length>1?"s":""}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{neverSubmitted.map(emp => <Tag key={emp.id} c={C.red}>{emp.name}</Tag>)}</div>
            </div>}
          </div>;
        })()}
      </div> : <div style={{ ...crd(), textAlign: "center", padding: 30, color: C.dim }}>Select a date</div>}
    </div>}

    {tab === "people" && <div style={{ animation: "fi .3s" }}>
      <div style={{ fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}><Target size={15} color={C.cyan} /> People</div>
      {(()=>{ try {
        const now30 = new Date(); now30.setDate(now30.getDate() - 30);
        const monthAgo = now30.toISOString().split("T")[0];

        const pd={}; st.entries.filter(x => x.date <= td()).forEach(x=>{
          if(!pd[x.person]) pd[x.person]={name:x.person, allJobs:0, allEntries:[], by:new Set(), monthJobs:0, monthDays:new Set()};
          pd[x.person].allJobs+=x.jobs; pd[x.person].allEntries.push(x);
          pd[x.person].by.add(st.emps.find(e=>e.id===x.eid)?.name||"?");
          if(x.date >= monthAgo) { pd[x.person].monthJobs+=x.jobs; pd[x.person].monthDays.add(x.date); }
        });

        const arr=Object.values(pd).map(p=>{
          const evs = (st.events||[]).filter(e=>e.person===p.name);
          const allDays = [...new Set(p.allEntries.map(e=>e.date))];
          // Company pipeline data
          const compMap = {};
          evs.forEach(ev => {
            if(!compMap[ev.company]) compMap[ev.company] = { name: ev.company, events: [], types: new Set() };
            compMap[ev.company].events.push(ev); compMap[ev.company].types.add(ev.type);
          });
          const companies = Object.values(compMap).map(c => {
            let highest = "call";
            for (const s of PIPE_ORDER) { if (c.types.has(s)) highest = s; }
            return { name: c.name, stage: highest, isRejected: c.types.has("rejected"), events: c.events, latest: c.events.sort((a,b)=>b.date.localeCompare(a.date))[0]?.date };
          }).sort((a,b) => {
            if (a.isRejected !== b.isRejected) return a.isRejected ? 1 : -1;
            return PIPE_ORDER.indexOf(b.stage) - PIPE_ORDER.indexOf(a.stage);
          });

          return {
            name: p.name, allJobs: p.allJobs, byS: [...p.by].join(", "), byC: p.by.size,
            byEmps: [...p.by], byEids: [...new Set(p.allEntries.map(e => e.eid))],
            stat: st.pstat?.[p.name]||"active", evs, companies,
            totalDays: countWorkdays(allDays),
            monthJobs: p.monthJobs, monthDays: countWorkdays([...p.monthDays]),
            avgPerDay: (() => { const wd = countWorkdays([...p.monthDays]); return wd > 0 ? Math.round(p.monthJobs / wd) : 0; })(),
          };
        }).sort((a,b)=>b.allJobs-a.allJobs);

        if(!arr.length) return <div style={{ ...crd(), textAlign: "center", padding: 30, color: C.dim }}>No data yet.</div>;

        const stoppedToday = arr.filter(p => isStopped(p.stat) && stoppedDate(p.stat) === td());
        const stoppedOld = arr.filter(p => isStopped(p.stat) && stoppedDate(p.stat) !== td());
        const activePpl = arr.filter(p => !isStopped(p.stat) && p.stat !== "placed").length;
        const placedPpl = arr.filter(p => p.stat === "placed").length;
        // Visible people = active + placed + stopped today only
        const visibleArr = arr.filter(p => !isStopped(p.stat) || stoppedDate(p.stat) === td());

        return <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ padding: "6px 14px", borderRadius: 8, background: C.greenD, display: "flex", alignItems: "center", gap: 5 }}><Zap size={12} color={C.green} /><span style={{ fontSize: 14, fontWeight: 800, color: C.green }}>{activePpl}</span><span style={{ fontSize: 9, color: C.sub }}>Active</span></div>
            <div style={{ padding: "6px 14px", borderRadius: 8, background: C.goldD, display: "flex", alignItems: "center", gap: 5 }}><Star size={12} color={C.gold} /><span style={{ fontSize: 14, fontWeight: 800, color: C.gold }}>{placedPpl}</span><span style={{ fontSize: 9, color: C.sub }}>Placed</span></div>
            {stoppedToday.length > 0 && <div style={{ padding: "6px 14px", borderRadius: 8, background: C.redD, display: "flex", alignItems: "center", gap: 5 }}><XCircle size={12} color={C.red} /><span style={{ fontSize: 14, fontWeight: 800, color: C.red }}>{stoppedToday.length}</span><span style={{ fontSize: 9, color: C.sub }}>Stopped Today</span></div>}
          </div>

          {/* Stopped today alert — only shown on the day they were stopped */}
          {stoppedToday.length > 0 && <div style={{ ...crd(), background: C.redD, border: `1px solid ${C.red}25`, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: C.red, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><XCircle size={15} /> Left Consultancy Today ({stoppedToday.length})</div>
            <div style={{ fontSize: 11, color: C.sub, marginBottom: 8 }}>These people were stopped today. This notification will disappear tomorrow. Records are preserved.</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{stoppedToday.map(p => <Tag key={p.name} c={C.red}><XCircle size={8} /> {p.name}</Tag>)}</div>
          </div>}

          {/* Person cards — only active, placed, and stopped-today people */}
          {visibleArr.map((p, idx) => {
            const s = gS(p.stat); const SI = s.i;
            return <div key={p.name} style={{ ...crd(), marginBottom: 12, opacity: isStopped(p.stat) ? 0.6 : 1 }}>
              {/* Header row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 800, fontSize: 16 }}>{p.name}</span>
                    <Tag c={s.c}><SI size={9} /> {s.l}</Tag>
                  </div>
                  <div style={{ fontSize: 11, color: C.sub, marginTop: 3 }}>Applied by: {p.byS}</div>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: C.dim }}>#{idx + 1}</div>
              </div>

              {/* Stats grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(100px,1fr))", gap: 8, marginBottom: 14 }}>
                <div style={{ padding: "8px 12px", borderRadius: 8, background: C.panel, border: `1px solid ${C.border}`, textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.green }}>{p.allJobs}</div>
                  <div style={{ fontSize: 9, color: C.dim }}>Total Applications</div>
                </div>
                <div style={{ padding: "8px 12px", borderRadius: 8, background: C.panel, border: `1px solid ${C.border}`, textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.blue }}>{p.totalDays}</div>
                  <div style={{ fontSize: 9, color: C.dim }}>Working Days</div>
                </div>
                <div style={{ padding: "8px 12px", borderRadius: 8, background: C.panel, border: `1px solid ${C.border}`, textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.amber }}>{p.avgPerDay}</div>
                  <div style={{ fontSize: 9, color: C.dim }}>Avg/Day</div>
                </div>
                <div style={{ padding: "8px 12px", borderRadius: 8, background: C.panel, border: `1px solid ${C.border}`, textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.cyan }}>{p.monthJobs}</div>
                  <div style={{ fontSize: 9, color: C.dim }}>Last 30 Days</div>
                </div>
                <div style={{ padding: "8px 12px", borderRadius: 8, background: C.panel, border: `1px solid ${C.border}`, textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.violet }}>{p.companies.length}</div>
                  <div style={{ fontSize: 9, color: C.dim }}>Companies</div>
                </div>
              </div>

              {/* Company pipeline table */}
              {p.companies.length > 0 && <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: "uppercase", marginBottom: 8 }}>Company Pipeline</div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr>
                    <th style={tth()}>Company</th>
                    <th style={tth()}>Current Stage</th>
                    <th style={{ ...tth(), width: 140 }}>Progress</th>
                    <th style={tth()}>Last Activity</th>
                  </tr></thead>
                  <tbody>{p.companies.map(comp => {
                    const stageEt = comp.isRejected ? gE("rejected") : gE(comp.stage);
                    const stageIdx = PIPE_ORDER.indexOf(comp.stage);
                    return <tr key={comp.name} style={{ background: comp.isRejected ? C.redD : comp.stage === "placed" ? C.goldD : "transparent" }}>
                      <td style={{ ...ttd(), fontWeight: 600 }}>{comp.name}</td>
                      <td style={ttd()}>
                        {comp.isRejected ? <Tag c={C.red}><XCircle size={9} /> Rejected</Tag> :
                          <Tag c={stageEt.c}>{React.createElement(stageEt.i, { size: 9 })} {PIPE_LABELS[comp.stage] || comp.stage}</Tag>}
                      </td>
                      <td style={ttd()}>
                        <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
                          {PIPE_ORDER.map((s, i) => <div key={s} style={{
                            flex: 1, height: 5, borderRadius: 2.5, marginRight: i < 4 ? 1 : 0,
                            background: comp.isRejected ? (C.red + "30") : i <= stageIdx ? gE(s).c : C.border,
                            opacity: comp.isRejected ? 0.5 : i <= stageIdx ? 1 : 0.2,
                          }} />)}
                        </div>
                      </td>
                      <td style={{ ...ttd(), fontSize: 11, color: C.sub }}>{fmtD(comp.latest)}</td>
                    </tr>;
                  })}</tbody>
                </table>
              </div>}

              {p.companies.length === 0 && p.evs.length === 0 && <div style={{ padding: "10px 0", color: C.dim, fontSize: 11 }}>No interview activity tracked yet.</div>}

              {/* Reassign — transfer person to different employee */}
              {!isStopped(p.stat) && p.byEids.length > 0 && <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: C.dim, marginBottom: 6 }}>Transfer to another employee:</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {p.byEids.map(eid => {
                    const emp = st.emps.find(e => e.id === eid);
                    if (!emp) return null;
                    return <Bs key={eid} c={C.blue} o onClick={() => { setReassign({ person: p.name, fromEid: eid }); setReassignTo(""); }}><ArrowRight size={10} /> from {emp.name}</Bs>;
                  })}
                </div>
              </div>}
            </div>;
          })}
        </div>;
      } catch(err) { return <div style={{ ...crd(), color: C.red, padding: 20 }}>Error: {String(err)}</div>; } })()}
    </div>}


    {tab === "report" && <div style={{ animation: "fi .3s" }}>
      <div style={{ fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}><FileText size={15} color={C.violet} /> Reports</div>

      {/* Single Day PDF */}
      <div style={crd()}>
        <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 10 }}>Single Day Report</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input type="date" value={sd||td()} onChange={e=>setSd(e.target.value)} style={{ ...inp(), maxWidth: 170, colorScheme: C === DARK ? "dark" : "light" }} />
          <B c={C.violet} onClick={()=>doPDF(st, sd||td(), sd||td(), tgt)}><Download size={12} /> Download PDF</B>
        </div>
      </div>

      {/* Date Range PDF */}
      <div style={crd()}>
        <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 10 }}>Date Range Report</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
          <div><label style={{ fontSize: 9, fontWeight: 600, color: C.dim, display: "block", marginBottom: 3 }}>FROM</label><input type="date" value={pdfFrom} onChange={e=>setPdfFrom(e.target.value)} style={{ ...inp(), maxWidth: 150, colorScheme: C === DARK ? "dark" : "light" }} /></div>
          <div><label style={{ fontSize: 9, fontWeight: 600, color: C.dim, display: "block", marginBottom: 3 }}>TO</label><input type="date" value={pdfTo} onChange={e=>setPdfTo(e.target.value)} style={{ ...inp(), maxWidth: 150, colorScheme: C === DARK ? "dark" : "light" }} /></div>
          <B c={C.violet} onClick={()=>{ if(pdfFrom && pdfTo) doPDF(st, pdfFrom, pdfTo, tgt); }} style={{ marginTop: 14 }}><Download size={12} /> Download Range PDF</B>
        </div>
      </div>

      {/* Per Employee PDF */}
      <div style={crd()}>
        <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 10 }}>Employee Full Report</div>
        <div style={{ color: C.sub, fontSize: 11, marginBottom: 10 }}>Select an employee to download their complete report — all days, all people, all activity from day one till today.</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <select value={pdfEmp} onChange={e => setPdfEmp(e.target.value)} style={{ ...inp(), maxWidth: 250, appearance: "auto" }}>
            <option value="">Select employee...</option>
            {st.emps.map(e => {
              const total = st.entries.filter(x => x.eid === e.id).reduce((a, x) => a + x.jobs, 0);
              const days = countWorkdays([...new Set(st.entries.filter(x => x.eid === e.id).map(x => x.date))]);
              return <option key={e.id} value={e.id}>{e.name} ({total} applications, {days} working days)</option>;
            })}
          </select>
          <B c={C.blue} onClick={() => { if (pdfEmp) doEmpPDF(st, pdfEmp, tgt); }}><Download size={12} /> Download Employee PDF</B>
        </div>
      </div>

      {/* CSV Export */}
      <div style={crd()}>
        <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 10 }}>Export Raw Data</div>
        <B c={C.cyan} onClick={()=>doExport(st)}><Download size={12} /> Export All as CSV</B>
      </div>

      {/* Preview */}
      <div style={{ ...crd(), fontFamily: "'JetBrains Mono','Courier New',monospace", fontSize: 11, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>PREVIEW - {fmtDFull(rpt.d)}</div>
        <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 6, marginBottom: 6 }}>{"SUMMARY\n"}{`Apps: ${rpt.tot} | Active: ${rpt.ec}/${activeEs.length} | Target: ${tgt}\nMet: ${Object.values(rpt.byE).filter(x=>x.tot>=tgt).length}/${rpt.ec}`}</div>
        <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 6, marginBottom: 6 }}>{"BREAKDOWN\n"}{Object.entries(rpt.byE).map(([n,d])=>`${d.tot>=tgt?"[OK]":"[!!]"} ${n}: ${d.tot}\n`+Object.entries(d.ppl).map(([p,j])=>`     ${p}: ${j}`).join("\n")).join("\n\n")}{Object.keys(rpt.byE).length===0?"No activity.\n":""}</div>
        {(()=>{
          const noAct = st.emps.filter(e=>!e.removed && !Object.keys(rpt.byE).some(n=>n===e.name));
          const waiting = noAct.filter(e => st.entries.some(x => x.eid === e.id));
          const never = noAct.filter(e => !st.entries.some(x => x.eid === e.id));
          if (!noAct.length) return null;
          return <div>
            {waiting.length>0&&<div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 6, marginBottom: 6, color: C.amber }}>{"STILL WAITING (have submitted before)\n"}{waiting.map(e=>{const ents=[...st.entries.filter(x=>x.eid===e.id)].sort((a,b)=>b.date.localeCompare(a.date));const le=ents[0];const d=le?Math.max(0,Math.round((parseD(rpt.d)-parseD(le.date))/86400000)):0;return`[..] ${e.name} - last: ${le ? fmtD(le.date) : "?"} ${d>0?`(${d}d ago)`:""}`;}).join("\n")}</div>}
            {never.length>0&&<div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 6, marginBottom: 6, color: C.red }}>{"NEVER SUBMITTED\n"}{never.map(e=>`[--] ${e.name}`).join("\n")}</div>}
          </div>;
        })()}
        {rpt.evs.length>0&&<div style={{ color: C.cyan }}>{"UPDATES\n"}{rpt.evs.map(ev=>{const n=st.emps.find(x=>x.id===ev.eid)?.name||"?";return`[${ev.type.toUpperCase()}] ${ev.person} @ ${ev.company} (${n})`;}).join("\n")}</div>}
      </div>
    </div>}

    {tab === "cfg" && <div style={{ animation: "fi .3s", maxWidth: 420 }}>
      <div style={{ fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}><Shield size={15} color={C.green} /> Settings</div>
      <div style={crd()}><div style={{ fontWeight: 600, fontSize: 12, marginBottom: 8 }}>Admin Password</div><div style={{ display: "flex", gap: 8 }}><input type="text" placeholder="New (4+)" value={np2} onChange={e=>setNp2(e.target.value)} style={{ ...inp(), flex: 1 }} /><B c={C.green} onClick={()=>{if(np2.length>=4){save({...st,pin:np2});setNp2("");}}}>Save</B></div></div>
      <div style={crd()}><div style={{ fontWeight: 600, fontSize: 12, marginBottom: 8 }}>Daily Target (current: {tgt})</div><div style={{ display: "flex", gap: 8 }}><input type="number" placeholder={String(tgt)} value={nt} onChange={e=>setNt(e.target.value)} style={{ ...inp(), flex: 1 }} /><B c={C.amber} onClick={()=>{if(Number(nt)>0){save({...st,target:Number(nt)});setNt("");}}}>Set</B></div></div>

      {/* Holiday Management */}
      <div style={crd()}>
        <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 10 }}>Holidays (not counted in avg)</div>
        <div style={{ fontSize: 11, color: C.sub, marginBottom: 12 }}>Declare holidays for festivals or closures. These days won't count in avg/day calculations even if they fall on weekdays.</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input type="date" value={holDate} onChange={e => setHolDate(e.target.value)} style={{ ...inp(), flex: 1, colorScheme: C === DARK ? "dark" : "light" }} />
          <input placeholder="Name (e.g. Diwali)" value={holName} onChange={e => setHolName(e.target.value)} style={{ ...inp(), flex: 1 }} />
          <B c={C.blue} onClick={() => {
            if (!holDate) return;
            const holidays = [...(st.holidays || [])];
            if (holidays.some(h => h.date === holDate)) return;
            holidays.push({ date: holDate, name: holName.trim() || "Holiday" });
            holidays.sort((a, b) => b.date.localeCompare(a.date));
            save({ ...st, holidays });
            setHolDate(""); setHolName("");
          }}>Add</B>
        </div>
        {(st.holidays || []).length > 0 ? <div style={{ maxHeight: 200, overflowY: "auto" }}>
          {(st.holidays || []).map((h, i) => {
            const isPast = h.date < td();
            return <div key={h.date} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", borderRadius: 7, background: isPast ? "transparent" : C.panel, border: `1px solid ${C.border}`, marginBottom: 3, opacity: isPast ? 0.5 : 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{fmtDFull(h.date)}</span>
                <span style={{ fontSize: 11, color: C.sub }}>{h.name}</span>
              </div>
              <button onClick={() => save({ ...st, holidays: (st.holidays || []).filter(x => x.date !== h.date) })} style={{ background: "none", border: "none", cursor: "pointer", color: C.dim }}><Trash2 size={11} /></button>
            </div>;
          })}
        </div> : <div style={{ fontSize: 11, color: C.dim }}>No holidays declared</div>}
      </div>
      <BackupRestore st={st} save={save} />
      <div style={crd()}>
        <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 8, color: C.red }}>Danger Zone</div>
        {resetStep === 0 && <>
          <div style={{ color: C.sub, fontSize: 11, marginBottom: 10 }}>This will permanently delete all employees, applications, and events. Requires PIN to proceed.</div>
          <B c={C.red} onClick={() => { setResetStep(1); setResetPin(""); }}><Trash2 size={13} /> Reset All Data</B>
        </>}
        {resetStep === 1 && <div style={{ padding: 16, borderRadius: 10, background: C.redD, border: `1px solid ${C.red}30` }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.red, marginBottom: 8 }}>Enter Reset PIN</div>
          <div style={{ color: C.sub, fontSize: 12, marginBottom: 12 }}>Enter the 4-digit reset PIN to continue.</div>
          <input type="password" maxLength={4} placeholder="Enter PIN" value={resetPin} onChange={e => setResetPin(e.target.value.replace(/\D/g, "").slice(0, 4))} style={{ ...inp(), maxWidth: 150, textAlign: "center", letterSpacing: 8, fontSize: 18, fontWeight: 800, marginBottom: 12 }} />
          {resetPin.length === 4 && resetPin !== "6674" && <div style={{ color: C.red, fontSize: 11, marginBottom: 8 }}>Wrong PIN</div>}
          <div style={{ display: "flex", gap: 8 }}>
            <B c={C.dim} o onClick={() => { setResetStep(0); setResetPin(""); }} style={{ flex: 1, justifyContent: "center" }}>Cancel</B>
            <B c={C.red} onClick={() => { if (resetPin === "6674") setResetStep(2); }} style={{ flex: 1, justifyContent: "center", opacity: resetPin === "6674" ? 1 : 0.4 }}>Verify & Continue</B>
          </div>
        </div>}
        {resetStep === 2 && <div style={{ padding: 16, borderRadius: 10, background: C.redD, border: `2px solid ${C.red}` }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: C.red, marginBottom: 8 }}>FINAL WARNING</div>
          <div style={{ color: C.red, fontSize: 13, marginBottom: 14, fontWeight: 600 }}>PIN verified. This action CANNOT be undone. All data will be gone forever.</div>
          <div style={{ display: "flex", gap: 8 }}>
            <B c={C.green} onClick={() => { setResetStep(0); setResetPin(""); }} style={{ flex: 1, justifyContent: "center" }}>No, Go Back</B>
            <B c={C.red} onClick={() => { try{if(window.createBackup)window.createBackup(JSON.stringify(st));}catch{} save(init()); setResetStep(0); setResetPin(""); }} style={{ flex: 1, justifyContent: "center" }}><Trash2 size={13} /> Yes, Delete Everything</B>
          </div>
        </div>}
      </div>
    </div>}
  </div></div>;
}

function BackupRestore({ st, save }) {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const loadBackups = async () => {
    setLoading(true);
    try {
      if (window.getBackups) {
        const b = await window.getBackups();
        setBackups(b);
      } else {
        setMsg("Backups available only on deployed version with Firebase");
      }
    } catch { setMsg("Error loading backups"); }
    setLoading(false);
  };

  const restore = async (data) => {
    if (!confirm("Restore this backup? Current data will be replaced.")) return;
    try {
      const parsed = JSON.parse(data);
      save(parsed);
      if (window.restoreBackup) await window.restoreBackup(data);
      setMsg("Restored successfully!");
      setTimeout(() => setMsg(""), 3000);
    } catch { setMsg("Error restoring backup"); }
  };

  const manualBackup = async () => {
    if (window.createBackup) {
      const ok = await window.createBackup(JSON.stringify(st));
      if (ok) { setMsg("Backup created!"); loadBackups(); setTimeout(() => setMsg(""), 3000); }
      else setMsg("Backup failed");
    } else { setMsg("Backups available only on deployed version"); }
  };

  return <div style={crd()}>
    <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 10 }}>Backup & Restore</div>
    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
      <B c={C.blue} onClick={manualBackup}><Download size={12} /> Create Backup Now</B>
      <B c={C.cyan} o onClick={loadBackups}><Activity size={12} /> {loading ? "Loading..." : "View Backups"}</B>
    </div>
    {msg && <div style={{ padding: "6px 10px", borderRadius: 6, background: C.greenD, color: C.green, fontSize: 11, marginBottom: 10 }}>{msg}</div>}
    {backups.length > 0 && <div style={{ maxHeight: 200, overflowY: "auto" }}>
      {backups.map((b, i) => <div key={b.id || i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 6, background: C.panel, border: `1px solid ${C.border}`, marginBottom: 4 }}>
        <div><div style={{ fontSize: 11, fontWeight: 600 }}>{b.label || "Backup"}</div><div style={{ fontSize: 9, color: C.dim }}>{b.createdAt}</div></div>
        <Bs c={C.green} onClick={() => restore(b.data)}>Restore</Bs>
      </div>)}
    </div>}
  </div>;
}

