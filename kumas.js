/* Başka İstanbul Yok · kumaş
   Şehir harita karosuyla değil, dokuma ile çizilir: çözgü (dikey) + atkı (yatay) 2/2 dimi örgü.
   Üç bloğun çatısından üç iplik çıkar; kasnaklardan geçerek hedefe dikilir. Dış servis yok. */
"use strict";
const $ = (s, k = document) => k.querySelector(s);
const hizYok = matchMedia("(prefers-reduced-motion: reduce)").matches;
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

/* Renkler: Pantone yılın renkleri, sRGB karşılığı. Her yön tek iplik. */
const IPLIK = {
  klasik: { ad: "Classic Blue", kod: "19-4052", hex: "#0f4c81" },
  viva:   { ad: "Viva Magenta", kod: "18-1750", hex: "#bb2649" },
  peri:   { ad: "Very Peri", kod: "17-3938", hex: "#6667ab" },
  mercan: { ad: "Living Coral", kod: "16-1546", hex: "#ff6f61" },
  isik:   { ad: "Illuminating", kod: "13-0647", hex: "#f5df4d" },
  gri:    { ad: "Ultimate Gray", kod: "17-5104", hex: "#939597" },
  mocha:  { ad: "Mocha Mousse", kod: "17-1230", hex: "#a47864" },
  seftali:{ ad: "Peach Fuzz", kod: "13-1023", hex: "#ffbe98" }
};

/* Kumaş üzerindeki konumlar 0..1 kesir; yön temsilîdir, ölçekli harita değildir. */
const BLOKLAR = [
  { ad: "A Blok", x: .60, y: .80 },
  { ad: "B Blok", x: .68, y: .83 },
  { ad: "C Blok", x: .76, y: .79 }
];
const HEDEFLER = [
  { id: "watergarden", ad: "Watergarden", alt: "AVM · moda, sinema, akşam", blok: 0, x: .86, y: .30, renk: "viva",
    adim: ["A Blok çatısı", "Kasnak 1: Ataşehir bulvarı", "Kasnak 2: vitrin ışıkları", "İniş: Watergarden avlusu"] },
  { id: "finanskent", ad: "Finanskent", alt: "İş, fırsat, sabah toplantısı", blok: 1, x: .58, y: .16, renk: "klasik",
    adim: ["B Blok çatısı", "Kasnak 1: kuleler arası rüzgâr", "Kasnak 2: cam cepheler", "İniş: Finanskent meydanı"] },
  { id: "maltepe", ad: "Maltepe sahili", alt: "Konser alanı, deniz, gün batımı", blok: 2, x: .95, y: .60, renk: "peri",
    adim: ["C Blok çatısı", "Kasnak 1: E-5 üstü", "Kasnak 2: sahil şeridi", "İniş: konser alanı"] }
];
let secili = null;

/* ---------------- dokuma ---------------- */
const tuval = $("#dokuma"), c = tuval.getContext("2d");
let W = 0, H = 0, D = 1, kumas = null, t0 = performance.now();

function tohum(n) { let x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); }
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function ton(rgb, k) { return `rgb(${rgb.map(v => Math.max(0, Math.min(255, Math.round(v * k)))).join(",")})`; }

function kumasDok() {
  const koyu = matchMedia("(prefers-color-scheme: dark)").matches && document.documentElement.dataset.theme !== "light";
  /* zemin kumaş sakin olmalı: üstüne dikilen renkli iplikler okunsun diye çözgü ile atkı birbirine yakın */
  const cozgu = hexRgb(koyu ? "#3a2e27" : "#d4bfae"), atki = hexRgb(koyu ? "#2a221d" : "#efe6db");
  const g = Math.round(7 * D);                       // bir iplik hücresi
  const off = document.createElement("canvas"); off.width = W; off.height = H;
  const k = off.getContext("2d");
  const sut = Math.ceil(W / g), sat = Math.ceil(H / g);
  for (let y = 0; y < sat; y++) {
    const atkiTon = .9 + tohum(y + 11) * .16;          // her atkı ipliğinin kendi tonu
    for (let x = 0; x < sut; x++) {
      const cozguTon = .86 + tohum(x * 3 + 7) * .2;
      const ust = ((x + y) % 4) < 2;                   // 2/2 dimi
      const px = x * g, py = y * g;
      if (ust) {                                       // çözgü üstte: dikey parıltı
        k.fillStyle = ton(cozgu, cozguTon * .78); k.fillRect(px, py, g, g);
        k.fillStyle = ton(cozgu, cozguTon * 1.08); k.fillRect(px + g * .22, py, g * .56, g);
        k.fillStyle = ton(cozgu, cozguTon * 1.25); k.fillRect(px + g * .42, py + g * .1, g * .14, g * .8);
      } else {                                         // atkı üstte: yatay parıltı
        k.fillStyle = ton(atki, atkiTon * .82); k.fillRect(px, py, g, g);
        k.fillStyle = ton(atki, atkiTon * 1.02); k.fillRect(px, py + g * .22, g, g * .56);
        k.fillStyle = ton(atki, atkiTon * 1.1); k.fillRect(px + g * .1, py + g * .42, g * .8, g * .14);
      }
    }
  }
  /* bir üst halka: İstanbul kasnağı */
  const cx = W * .74, cy = H * .5, rx = W * .34, ry = H * .46;
  k.lineWidth = 10 * D; k.strokeStyle = "rgba(120,90,60,.28)"; k.beginPath(); k.ellipse(cx, cy, rx, ry, 0, 0, 7); k.stroke();
  k.lineWidth = 3 * D; k.strokeStyle = "rgba(245,223,77,.55)"; k.beginPath(); k.ellipse(cx, cy, rx - 7 * D, ry - 7 * D, 0, 0, 7); k.stroke();
  k.font = `${12 * D}px ui-monospace,Consolas,monospace`; k.fillStyle = koyu ? "rgba(243,233,223,.7)" : "rgba(42,33,29,.7)";
  k.fillText("İSTANBUL · BİR ÜST HALKA", cx - rx * .3, cy - ry + 26 * D);
  /* bloklar: saten dikiş kuleler */
  for (const b of BLOKLAR) {
    const bx = b.x * W, by = b.y * H, bw = 26 * D, bh = 70 * D;
    for (let i = 0; i < bw; i += 2 * D) {
      k.fillStyle = ton(hexRgb(IPLIK.gri.hex), koyu ? .7 + (i % (4 * D) ? .1 : 0) : .55 + (i % (4 * D) ? .1 : 0));
      k.fillRect(bx - bw / 2 + i, by - bh, 1.6 * D, bh);
    }
    k.fillStyle = IPLIK.isik.hex; k.fillRect(bx - bw / 2, by - bh - 3 * D, bw, 3 * D);   // çatı
    k.font = `600 ${11 * D}px "Segoe UI",sans-serif`; k.fillStyle = koyu ? "#f3e9df" : "#2a211d";
    k.fillText(b.ad, bx - bw / 2, by + 15 * D);
  }
  kumas = off;
}

function yol(h) {
  const b = BLOKLAR[h.blok], x0 = b.x * W, y0 = b.y * H - 74 * D, x3 = h.x * W, y3 = h.y * H;
  return [x0, y0, x0 + (x3 - x0) * .1, y0 - 140 * D, x0 + (x3 - x0) * .7, y3 + 90 * D, x3, y3];
}
function nokta(p, t) {
  const u = 1 - t, a = u * u * u, b = 3 * u * u * t, d = 3 * u * t * t, e = t * t * t;
  return [a * p[0] + b * p[2] + d * p[4] + e * p[6], a * p[1] + b * p[3] + d * p[5] + e * p[7]];
}
const KASNAK = [.3, .55, .8];

function ciz(an) {
  if (!kumas) return;
  c.drawImage(kumas, 0, 0);
  const sure = 5200;
  HEDEFLER.forEach((h, i) => {
    const p = yol(h), renk = IPLIK[h.renk].hex, rgb = hexRgb(renk);
    const soluk = secili && secili !== h.id;
    const ilerle = hizYok ? 1 : Math.min(1, ((an - t0 - i * 900) % (sure + 2600)) / sure);
    if (ilerle <= 0) return;
    c.globalAlpha = soluk ? .22 : 1;
    /* kasnaklar */
    KASNAK.forEach(kt => {
      const [kx, ky] = nokta(p, kt), gecti = ilerle >= kt;
      const r = (gecti ? 17 : 14) * D;
      c.lineWidth = 5 * D; c.strokeStyle = "rgba(164,120,100,.9)"; c.beginPath(); c.ellipse(kx, ky, r, r * .62, -.5, 0, 7); c.stroke();
      c.lineWidth = 2 * D; c.strokeStyle = gecti ? IPLIK.isik.hex : "rgba(245,223,77,.45)"; c.beginPath(); c.ellipse(kx, ky, r - 3 * D, (r - 3 * D) * .62, -.5, 0, 7); c.stroke();
    });
    /* koşu dikişi: ilmek üstte (dolu) / altta (gölge) */
    const adim = 90, ilmek = 6 * D;
    let onceki = nokta(p, 0), uzunluk = 0;
    for (let s = 1; s <= adim * ilerle; s++) {
      const q = nokta(p, s / adim), dx = q[0] - onceki[0], dy = q[1] - onceki[1], l = Math.hypot(dx, dy);
      const ustte = Math.floor(uzunluk / ilmek) % 2 === 0;
      c.lineCap = "round";
      if (ustte) {
        c.lineWidth = 5.6 * D; c.strokeStyle = ton(rgb, .5); c.beginPath(); c.moveTo(onceki[0] + D, onceki[1] + 1.4 * D); c.lineTo(q[0] + D, q[1] + 1.4 * D); c.stroke();
        c.lineWidth = 4.4 * D; c.strokeStyle = renk; c.beginPath(); c.moveTo(onceki[0], onceki[1]); c.lineTo(q[0], q[1]); c.stroke();
        c.lineWidth = 1 * D; c.strokeStyle = "rgba(255,255,255,.45)"; c.beginPath(); c.moveTo(onceki[0] - .6 * D, onceki[1] - .6 * D); c.lineTo(q[0] - .6 * D, q[1] - .6 * D); c.stroke();
      } else {
        c.lineWidth = 1.2 * D; c.strokeStyle = ton(rgb, .4); c.setLineDash([1.5 * D, 2.5 * D]); c.beginPath(); c.moveTo(onceki[0], onceki[1]); c.lineTo(q[0], q[1]); c.stroke(); c.setLineDash([]);
      }
      uzunluk += l; onceki = q;
    }
    /* uçan misafir: kanat açık wingsuit */
    if (ilerle < 1) {
      const [fx, fy] = nokta(p, ilerle), [gx, gy] = nokta(p, Math.min(1, ilerle + .01)), a = Math.atan2(gy - fy, gx - fx);
      c.save(); c.translate(fx, fy); c.rotate(a);
      c.fillStyle = IPLIK.klasik.hex; c.beginPath(); c.moveTo(12 * D, 0); c.lineTo(-8 * D, -10 * D); c.lineTo(-4 * D, 0); c.lineTo(-8 * D, 10 * D); c.closePath(); c.fill();
      c.fillStyle = IPLIK.isik.hex; c.beginPath(); c.arc(3 * D, 0, 2.4 * D, 0, 7); c.fill();
      c.restore();
    }
    /* iniş etiketi: dokuma etiket */
    if (ilerle >= 1 || hizYok) {
      const tx = h.x * W, ty = h.y * H;
      c.font = `600 ${13 * D}px "Segoe UI",sans-serif`;
      const w = c.measureText(h.ad).width + 18 * D;
      const lx = Math.min(tx - w / 2, W - w - 6 * D);
      c.fillStyle = renk; c.fillRect(lx, ty - 32 * D, w, 22 * D);
      c.fillStyle = "#fff"; c.fillText(h.ad, lx + 9 * D, ty - 16 * D);
      c.strokeStyle = "rgba(255,255,255,.5)"; c.setLineDash([3 * D, 3 * D]); c.lineWidth = 1 * D; c.strokeRect(lx + 3 * D, ty - 29 * D, w - 6 * D, 16 * D); c.setLineDash([]);
    }
    c.globalAlpha = 1;
  });
}

function boyut() {
  D = Math.min(devicePixelRatio || 1, 2);
  const r = tuval.getBoundingClientRect();
  W = tuval.width = Math.round(r.width * D); H = tuval.height = Math.round(r.height * D);
  kumasDok(); ciz(performance.now());
}
let gorunur = true;
new IntersectionObserver(e => { gorunur = e[0].isIntersecting; }).observe(tuval);
function dongu(an) { if (gorunur) ciz(an); if (!hizYok) requestAnimationFrame(dongu); }
addEventListener("resize", () => { clearTimeout(boyut.z); boyut.z = setTimeout(boyut, 150); });
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", boyut);
boyut(); requestAnimationFrame(dongu);

/* ---------------- hedef düğmeleri + dikiş sırası ---------------- */
function hedefSec(id) {
  secili = secili === id ? null : id;
  document.querySelectorAll(".hedef").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.id === secili)));
  const h = HEDEFLER.find(x => x.id === (secili || "watergarden"));
  $("#sira").replaceChildren(...h.adim.map((a, i) => {
    const li = document.createElement("li"), b = document.createElement("b");
    b.textContent = a; li.append(b, document.createTextNode(i === h.adim.length - 1 ? h.alt : i === 0 ? "Atlayış noktası" : "İplik kasnaktan geçer"));
    return li;
  }));
  t0 = performance.now();
  if (hizYok) ciz(t0);
}
$("#hedefler").replaceChildren(...HEDEFLER.map(h => {
  const b = document.createElement("button"), i = document.createElement("i");
  b.className = "hedef"; b.type = "button"; b.dataset.id = h.id; b.setAttribute("aria-pressed", "false");
  i.style.background = IPLIK[h.renk].hex;
  b.append(i, document.createTextNode(`${BLOKLAR[h.blok].ad} → ${h.ad}`));
  b.addEventListener("click", () => hedefSec(h.id));
  return b;
}));
hedefSec(null); secili = null;

/* ---------------- dört site, bir yaşam ---------------- */
const SITELER = [
  { alan: "ataşehirmodern.com", url: "https://ataşehirmodern.com", ad: "Bina", renk: "klasik", metin: "Blok, kat, komşuluk ve bina hizmetleri. Taşındığın gün ilk kapı.", soru: "Bloğumun duyuruları ve bina hizmetleri nerede?" },
  { alan: "afair.live", url: "https://www.afair.live", ad: "Moda", renk: "viva", metin: "Defile, koleksiyon ve canlı yayın. Ölçün alınır, kumaşın seçilir.", soru: "Online terzi müsait mi? → randevu", hedef: "#randevu" },
  { alan: "afair.studio", url: "https://afair.studio", ad: "Sanat", renk: "peri", metin: "Tasarım stüdyosu ve Dila galerisi. Fikrin koleksiyona dönüşür.", soru: "Stüdyoda nasıl üretim yaparım?" },
  { alan: "selinahbap.com", url: "https://www.selinahbap.com", ad: "Elektronik", renk: "mocha", metin: "Yapay zekâ, yazılım ve cihazlar. Evinin teknolojisi bir kapıdan girer.", soru: "Evimin sistemlerini kim kurar? → randevu", hedef: "#randevu" }
];
$("#kapilar").replaceChildren(...SITELER.map(s => {
  const a = document.createElement("a");
  a.className = "kapi"; a.href = s.hedef || s.url; if (!s.hedef) { a.target = "_blank"; a.rel = "noopener"; }
  a.style.setProperty("--renk", IPLIK[s.renk].hex);
  a.innerHTML = `<span class="alan"></span><b></b><p></p><span class="soru"></span>`;
  a.querySelector(".alan").textContent = s.alan; a.querySelector("b").textContent = s.ad;
  a.querySelector("p").textContent = s.metin; a.querySelector(".soru").textContent = s.soru;
  return a;
}));

/* ---------------- randevu: takvim talebi (.ics), sunucuya gönderim yok ---------------- */
const HIZMET = [
  { id: "terzi", ad: "Online terzi", alt: "Ölçü ve prova görüşmesi · 45 dk", sure: 45, renk: "viva", site: "afair.live" },
  { id: "tarim", ad: "Tarım danışmanı", alt: "Balkon, teras ve çatı bahçesi · 30 dk", sure: 30, renk: "mocha", site: "Dila · Tarım" },
  { id: "teknik", ad: "Elektronik kurulum", alt: "Ev sistemleri ve cihazlar · 60 dk", sure: 60, renk: "klasik", site: "selinahbap.com" }
];
const secim = { hizmet: null, gun: null, saat: null };
const GUNAD = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
function gunler() {
  const bugun = new Date(); bugun.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(bugun); d.setDate(d.getDate() + i); return d; });
}
function ciz2() {
  $("#hizmetler").replaceChildren(...HIZMET.map(h => {
    const b = document.createElement("button"), i = document.createElement("i"), s = document.createElement("span");
    b.type = "button"; b.className = "secenek"; b.setAttribute("role", "radio"); b.setAttribute("aria-checked", String(secim.hizmet === h.id));
    i.style.background = IPLIK[h.renk].hex;
    s.innerHTML = "<b></b><small></small>"; s.querySelector("b").textContent = h.ad; s.querySelector("small").textContent = `${h.alt} · ${h.site}`;
    b.append(i, s); b.addEventListener("click", () => { secim.hizmet = h.id; ciz2(); });
    return b;
  }));
  const gs = gunler();
  if (!secim.gun) secim.gun = gs[0].toDateString();
  $("#gunler").replaceChildren(...gs.map(d => {
    const b = document.createElement("button"); b.type = "button"; b.className = "gun";
    b.setAttribute("aria-pressed", String(secim.gun === d.toDateString()));
    b.innerHTML = `${d.getDate()}<small>${GUNAD[d.getDay()]}</small>`;
    b.addEventListener("click", () => { secim.gun = d.toDateString(); secim.saat = null; ciz2(); });
    return b;
  }));
  const simdi = new Date();
  $("#saatler").replaceChildren(...[10, 11, 12, 13, 14, 15, 16, 17].map(sa => {
    const b = document.createElement("button"), d = new Date(secim.gun); d.setHours(sa);
    b.type = "button"; b.className = "saat"; b.textContent = `${String(sa).padStart(2, "0")}:00`;
    b.disabled = d <= simdi; b.setAttribute("aria-pressed", String(secim.saat === sa));
    b.addEventListener("click", () => { secim.saat = sa; ciz2(); });
    return b;
  }));
  const h = HIZMET.find(x => x.id === secim.hizmet);
  const hazir = h && secim.saat !== null;
  $("#indir").disabled = !hazir;
  $("#ozet").textContent = hazir
    ? `${h.ad} · ${new Date(secim.gun).toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })} ${String(secim.saat).padStart(2, "0")}:00 · ${h.sure} dk. Talep takvimine eklenir; onay hizmet sağlayıcıdan gelir.`
    : (h ? "Şimdi bir gün ve saat seç." : "Önce bir hizmet ve saat seç.");
}
function ics() {
  const h = HIZMET.find(x => x.id === secim.hizmet), b = new Date(secim.gun); b.setHours(secim.saat, 0, 0, 0);
  const s = new Date(b.getTime() + h.sure * 60000), f = d => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}00`;
  const u = new Uint32Array(2); crypto.getRandomValues(u);
  const satir = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Baska Istanbul Yok//Kumas//TR", "BEGIN:VEVENT",
    `UID:${u[0].toString(16)}${u[1].toString(16)}@baskaistanbulyok`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(b)}`, `DTEND:${f(s)}`,
    `SUMMARY:Randevu talebi: ${h.ad}`, `DESCRIPTION:${h.alt} (${h.site}). Bu bir taleptir; onay hizmet sağlayıcıdan gelir.`, "STATUS:TENTATIVE",
    "END:VEVENT", "END:VCALENDAR"];
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([satir.join("\r\n") + "\r\n"], { type: "text/calendar" }));
  a.download = `randevu-${h.id}-${f(b).slice(0, 8)}.ics`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
$("#indir").addEventListener("click", ics);
ciz2();

/* ---------------- masuralar: her renk bir iplik makarası ---------------- */
$("#masuralar").replaceChildren(...Object.values(IPLIK).map((r, n) => {
  const d = document.createElement("div"), cv = document.createElement("canvas"), b = document.createElement("b"), s = document.createElement("span");
  d.className = "masura"; b.textContent = r.ad; s.textContent = `PANTONE ${r.kod} · ${r.hex}`;
  d.append(cv, b, s);
  requestAnimationFrame(() => {
    const k = Math.min(devicePixelRatio || 1, 2), w = cv.clientWidth * k, h = cv.clientHeight * k; cv.width = w; cv.height = h;
    const g = cv.getContext("2d"), rgb = hexRgb(r.hex);
    g.fillStyle = "#c9b8a6"; g.fillRect(w * .2, h * .06, w * .6, h * .08); g.fillRect(w * .2, h * .86, w * .6, h * .08);
    for (let y = h * .14; y < h * .86; y += 2 * k) {               // sarılmış iplik: her tur ayrı ton
      const t = .8 + tohum(y + n * 31) * .35;
      g.strokeStyle = ton(rgb, t); g.lineWidth = 1.6 * k;
      g.beginPath(); g.moveTo(w * .24, y); g.quadraticCurveTo(w * .5, y + 1.2 * k, w * .76, y); g.stroke();
    }
    g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(w * .44, h * .14, w * .05, h * .72);
  });
  return d;
}));
