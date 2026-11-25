/* Başka İstanbul Yok · kumaş
   Kahraman: gerçek kumaş benzetimi (Verlet). Rüzgâr, yerçekimi, loş spot ışık, yere düşen gölge.
   Sürükle = 360° çevir · tıkla = rüzgâr savur · kumaş seç = iplik rengi. Dış servis yok. */
"use strict";
const $ = (s, k = document) => k.querySelector(s);
const hizYok = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Pantone yılın renkleri, sRGB karşılığı. Her yön tek iplik. */
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
const HEDEFLER = [
  { id: "watergarden", ad: "Watergarden", blok: "A", renk: "viva", adim: ["A Blok çatısı", "Bulvarın üstü", "Vitrin ışıkları", "Watergarden avlusu"] },
  { id: "finanskent", ad: "Finanskent", blok: "B", renk: "klasik", adim: ["B Blok çatısı", "Kuleler arası rüzgâr", "Cam cepheler", "Finanskent meydanı"] },
  { id: "maltepe", ad: "Maltepe sahili", blok: "C", renk: "peri", adim: ["C Blok çatısı", "Otoyolun üstü", "Sahil şeridi", "Konser alanı"] }
];
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
function tohum(n) { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); }

/* ================= kumaş fiziği ================= */
const SX = 46, SY = 34, GEN = 2.3, BOY = 1.7, ADIM = 1 / 60;
const N = SX * SY, P = new Float32Array(N * 3), O = new Float32Array(N * 3), NOR = new Float32Array(N * 3);
const BAG = [];
function kur() {
  for (let j = 0; j < SY; j++) for (let i = 0; i < SX; i++) {
    const k = (j * SX + i) * 3, x = (i / (SX - 1) - .5) * GEN, y = .95 - j / (SY - 1) * BOY, z = (tohum(i + j * 7) - .5) * .01;
    P[k] = O[k] = x; P[k + 1] = O[k + 1] = y; P[k + 2] = O[k + 2] = z;
  }
  const dx = GEN / (SX - 1), dy = BOY / (SY - 1), dd = Math.hypot(dx, dy);
  for (let j = 0; j < SY; j++) for (let i = 0; i < SX; i++) {
    const a = j * SX + i;
    if (i < SX - 1) BAG.push(a, a + 1, dx, 1);
    if (j < SY - 1) BAG.push(a, a + SX, dy, 1);
    if (i < SX - 1 && j < SY - 1) { BAG.push(a, a + SX + 1, dd, .6); BAG.push(a + 1, a + SX, dd, .6); }
    if (i < SX - 2) BAG.push(a, a + 2, dx * 2, .12);       // zayıf eğilme direnci: kumaş kırılmasın ama levha da olmasın
    if (j < SY - 2) BAG.push(a, a + 2 * SX, dy * 2, .12);
  }
}
kur();
const BAGL = new Float32Array(BAG);
let ruzgarGuc = 1, savur = 0, zaman = 0;

function normaller() {
  NOR.fill(0);
  for (let j = 0; j < SY - 1; j++) for (let i = 0; i < SX - 1; i++) {
    const a = j * SX + i, b = a + 1, c = a + SX, d = c + 1;
    for (const [p, q, r] of [[a, c, b], [b, c, d]]) {
      const ax = P[q * 3] - P[p * 3], ay = P[q * 3 + 1] - P[p * 3 + 1], az = P[q * 3 + 2] - P[p * 3 + 2];
      const bx = P[r * 3] - P[p * 3], by = P[r * 3 + 1] - P[p * 3 + 1], bz = P[r * 3 + 2] - P[p * 3 + 2];
      const nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
      for (const v of [p, q, r]) { NOR[v * 3] += nx; NOR[v * 3 + 1] += ny; NOR[v * 3 + 2] += nz; }
    }
  }
  for (let v = 0; v < N; v++) { const k = v * 3, l = Math.hypot(NOR[k], NOR[k + 1], NOR[k + 2]) || 1; NOR[k] /= l; NOR[k + 1] /= l; NOR[k + 2] /= l; }
}

function fizik() {
  zaman += ADIM;
  /* rüzgâr: yön ve şiddet yavaşça döner, üstüne türbülans; kumaş yüzeyine dik bileşeniyle iter */
  const yon = .6 + Math.sin(zaman * .13) * .7, s = (hizYok ? 0 : 1) * ruzgarGuc * (1.1 + .7 * Math.sin(zaman * .41) + .35 * Math.sin(zaman * 1.7)) + savur;
  const wx = Math.sin(yon) * s * .35, wz = Math.cos(yon) * s, wy = .12 * Math.sin(zaman * .9) * s;
  savur *= .965;
  normaller();
  const g = -7.5 * ADIM * ADIM, sur = .985;
  for (let v = 0; v < N; v++) {
    const k = v * 3, j = (v / SX) | 0;
    if (j === 0) continue;                                // üst kenar çubuğa dikili
    const tur = .55 + .45 * Math.sin(zaman * 2.3 + P[k] * 2.1 + P[k + 1] * 1.3);
    const dn = (NOR[k] * wx + NOR[k + 1] * wy + NOR[k + 2] * wz) * tur * ADIM * ADIM * 9;
    for (let a = 0; a < 3; a++) {
      const yeni = P[k + a] + (P[k + a] - O[k + a]) * sur + NOR[k + a] * dn + (a === 1 ? g : 0);
      O[k + a] = P[k + a]; P[k + a] = yeni;
    }
  }
  for (let it = 0; it < 8; it++) {
    for (let c = 0; c < BAGL.length; c += 4) {
      const a = BAGL[c] * 3, b = BAGL[c + 1] * 3, r = BAGL[c + 2], sert = BAGL[c + 3];
      const dx = P[b] - P[a], dy = P[b + 1] - P[a + 1], dz = P[b + 2] - P[a + 2], l = Math.hypot(dx, dy, dz) || 1e-6;
      const f = (l - r) / l * .5 * sert, sa = a < SX * 3 ? 0 : 1, sb = b < SX * 3 ? 0 : 1, t = sa + sb || 1;
      P[a] += dx * f * sa * 2 / t; P[a + 1] += dy * f * sa * 2 / t; P[a + 2] += dz * f * sa * 2 / t;
      P[b] -= dx * f * sb * 2 / t; P[b + 1] -= dy * f * sb * 2 / t; P[b + 2] -= dz * f * sb * 2 / t;
    }
  }
}

/* ================= WebGL: loş spot, kadife parıltı, gölge ================= */
const tuval = $("#kumas3d");
const gl = tuval && tuval.getContext("webgl2", { antialias: true, alpha: false });
const M = {
  per(f, a, n, z) { const t = 1 / Math.tan(f / 2); return [t / a, 0, 0, 0, 0, t, 0, 0, 0, 0, (z + n) / (n - z), -1, 0, 0, 2 * z * n / (n - z), 0]; },
  bak(e, c, u) {
    const z = norm([e[0] - c[0], e[1] - c[1], e[2] - c[2]]), x = norm(cap(u, z)), y = cap(z, x);
    return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, e), -dot(y, e), -dot(z, e), 1];
  },
  carp(a, b) { const o = new Array(16).fill(0); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) for (let k = 0; k < 4; k++) o[j * 4 + i] += a[k * 4 + i] * b[j * 4 + k]; return o; }
};
function norm(v) { const l = Math.hypot(...v) || 1; return v.map(x => x / l); }
function cap(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }

const VS = `#version 300 es
precision highp float; precision highp int;
in vec3 aP; in vec3 aN; in vec2 aU; uniform mat4 uM; uniform int uGolge; uniform vec3 uL;
out vec3 vP; out vec3 vN; out vec2 vU;
void main(){ vec3 p=aP;
  if(uGolge==1){ vec3 d=normalize(p-uL); float t=(-1.05-p.y)/d.y; p=p+d*t; p.y=-1.049; }
  vP=p; vN=aN; vU=aU; gl_Position=uM*vec4(p,1.); }`;
const FS = `#version 300 es
precision highp float; precision highp int; in vec3 vP; in vec3 vN; in vec2 vU; uniform sampler2D uT; uniform vec3 uL; uniform vec3 uE; uniform int uGolge; uniform vec3 uRenk;
out vec4 o;
void main(){
  if(uGolge==1){ float a=.55*smoothstep(2.2,.2,length(vP.xz)); o=vec4(0.,0.,0.,a); return; }
  vec3 N=normalize(vN); if(!gl_FrontFacing) N=-N;
  vec3 L=normalize(uL-vP), V=normalize(uE-vP), H=normalize(L+V);
  vec3 tex=texture(uT,vU*vec2(9.,7.)).rgb;
  float sar=max((dot(N,L)+.35)/1.35,0.);                          // kumaş ışığı sarar
  float spot=smoothstep(.72,.98,dot(normalize(uL-vec3(0.,.1,0.)),normalize(uL-vP)));
  float kadife=pow(1.-max(dot(N,V),0.),3.)*.55;                     // kenarda ipek parıltısı
  float par=pow(max(dot(N,H),0.),36.)*.25;
  vec3 c=tex*(.04+sar*spot*1.25)+uRenk*kadife*spot+vec3(1.,.93,.82)*par*spot;
  if(!gl_FrontFacing) c*=.62;                                       // astar tarafı loş
  float sis=smoothstep(2.6,6.5,length(vP-uE));
  c=mix(c,vec3(.035,.028,.024),sis);
  o=vec4(pow(c,vec3(1./2.2)),1.); }`;
const FVS = `#version 300 es
in vec2 aQ; uniform mat4 uM; out vec2 vQ; void main(){ vQ=aQ; gl_Position=uM*vec4(aQ.x*6.,-1.05,aQ.y*6.,1.); }`;
const FFS = `#version 300 es
precision highp float; in vec2 vQ; out vec4 o; uniform vec3 uRenk;
void main(){ float r=length(vQ); vec3 c=mix(vec3(.055,.043,.036)+uRenk*.02,vec3(.022,.018,.016),smoothstep(.02,.42,r)); o=vec4(pow(c,vec3(1./2.2)),1.); }`;
/* sürreal: kumaştan kopup yukarı, üç hedefe süzülen iplik tozları */
const TVS = `#version 300 es
uniform mat4 uM; uniform float uT; out float vA;
float h(float n){return fract(sin(n*91.7)*43758.5);}
void main(){ float i=float(gl_VertexID), d=mod(i,3.), t=fract(h(i)+uT*.03*(.5+h(i+3.)));
  vec3 a=vec3((h(i+1.)-.5)*2.2,-.6+h(i+2.)*1.2,0.), b=vec3((d-1.)*1.8,2.4,-1.5-d*.4);
  vec3 p=mix(a,b,t)+vec3(sin(t*9.+i)*.08,0.,cos(t*7.+i)*.08);
  vA=sin(t*3.14159)*.8; gl_Position=uM*vec4(p,1.); gl_PointSize=1.5+h(i+5.)*2.5; }`;
const TFS = `#version 300 es
precision mediump float; in float vA; uniform vec3 uRenk; out vec4 o;
void main(){ vec2 d=gl_PointCoord-.5; if(dot(d,d)>.25) discard; o=vec4(mix(vec3(.96,.87,.3),uRenk,.4)*vA,vA); }`;

let prog, fprog, tprog, VAO, FVAO, U = {}, tex, bufP, bufN, idxN, secRenk = IPLIK.viva.hex;
function derle(vs, fs) {
  const s = (t, k) => { const o = gl.createShader(t); gl.shaderSource(o, k); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(o)); return o; };
  const p = gl.createProgram(); gl.attachShader(p, s(gl.VERTEX_SHADER, vs)); gl.attachShader(p, s(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(p)); return p;
}
function dokumaDokusu(hex) {
  /* 2/2 dimi: her hücre çözgü ya da atkı; iplik tonu iplikten ipliğe değişir, lif çizgisi var */
  const cv = document.createElement("canvas"); cv.width = cv.height = 256; const k = cv.getContext("2d");
  const [r, g, b] = hexRgb(hex).map(v => v * 255), hc = 8;
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    const ust = ((x + y) % 4) < 2, t = ust ? .82 + tohum(x * 3) * .3 : .62 + tohum(y + 50) * .22;
    k.fillStyle = `rgb(${r * t | 0},${g * t | 0},${b * t | 0})`; k.fillRect(x * hc, y * hc, hc, hc);
    k.fillStyle = `rgba(255,255,255,${ust ? .16 : .07})`;
    if (ust) k.fillRect(x * hc + 3, y * hc + 1, 2, hc - 2); else k.fillRect(x * hc + 1, y * hc + 3, hc - 2, 2);
    k.fillStyle = "rgba(0,0,0,.22)"; if (ust) k.fillRect(x * hc, y * hc, 1, hc); else k.fillRect(x * hc, y * hc, hc, 1);
  }
  const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.SRGB8_ALPHA8, gl.RGBA, gl.UNSIGNED_BYTE, cv); gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  const an = gl.getExtension("EXT_texture_filter_anisotropic"); if (an) gl.texParameterf(gl.TEXTURE_2D, an.TEXTURE_MAX_ANISOTROPY_EXT, 8);
  return t;
}
function glKur() {
  prog = derle(VS, FS); fprog = derle(FVS, FFS); tprog = derle(TVS, TFS);
  VAO = gl.createVertexArray(); gl.bindVertexArray(VAO);
  bufP = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bufP); gl.bufferData(gl.ARRAY_BUFFER, P, gl.DYNAMIC_DRAW);
  let l = gl.getAttribLocation(prog, "aP"); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 3, gl.FLOAT, false, 0, 0);
  bufN = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bufN); gl.bufferData(gl.ARRAY_BUFFER, NOR, gl.DYNAMIC_DRAW);
  l = gl.getAttribLocation(prog, "aN"); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 3, gl.FLOAT, false, 0, 0);
  const uv = new Float32Array(N * 2); for (let j = 0; j < SY; j++) for (let i = 0; i < SX; i++) { uv[(j * SX + i) * 2] = i / (SX - 1); uv[(j * SX + i) * 2 + 1] = j / (SY - 1); }
  const bu = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bu); gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW);
  l = gl.getAttribLocation(prog, "aU"); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 2, gl.FLOAT, false, 0, 0);
  const ix = []; for (let j = 0; j < SY - 1; j++) for (let i = 0; i < SX - 1; i++) { const a = j * SX + i; ix.push(a, a + SX, a + 1, a + 1, a + SX, a + SX + 1); }
  idxN = ix.length; const bi = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bi); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(ix), gl.STATIC_DRAW);
  FVAO = gl.createVertexArray(); gl.bindVertexArray(FVAO);
  const fb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, fb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  l = gl.getAttribLocation(fprog, "aQ"); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 2, gl.FLOAT, false, 0, 0);
  for (const [p, ad] of [[prog, "p"], [fprog, "f"], [tprog, "t"]]) for (const u of ["uM", "uL", "uE", "uT", "uGolge", "uRenk"]) U[ad + u] = gl.getUniformLocation(p, u);
  tex = dokumaDokusu(secRenk);
  gl.enable(gl.DEPTH_TEST);
}

/* kamera: sürükle 360°, tekerlek/kıstır yakınlaş, boşta kendiliğinden yavaşça döner */
let yaw = .5, pitch = .18, uzak = 3.6, sonDokunus = -1e9, surukle = null, kaydi = false;
function boyut() {
  const d = Math.min(devicePixelRatio || 1, 2), r = tuval.getBoundingClientRect();
  tuval.width = Math.round(r.width * d); tuval.height = Math.round(r.height * d); gl.viewport(0, 0, tuval.width, tuval.height);
}
tuval.addEventListener("pointerdown", e => { surukle = [e.clientX, e.clientY]; kaydi = false; tuval.setPointerCapture(e.pointerId); });
tuval.addEventListener("pointermove", e => {
  if (!surukle) return; const dx = e.clientX - surukle[0], dy = e.clientY - surukle[1];
  if (Math.abs(dx) + Math.abs(dy) > 3) kaydi = true;
  yaw -= dx * .008; pitch = Math.max(-.15, Math.min(.75, pitch + dy * .005)); surukle = [e.clientX, e.clientY]; sonDokunus = performance.now();
});
tuval.addEventListener("pointerup", () => { if (!kaydi) savur = 2.1; surukle = null; sonDokunus = performance.now(); });
tuval.addEventListener("wheel", e => { e.preventDefault(); uzak = Math.max(2.2, Math.min(6, uzak + e.deltaY * .002)); sonDokunus = performance.now(); }, { passive: false });
tuval.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") yaw += .2; else if (e.key === "ArrowRight") yaw -= .2; else if (e.key === " " || e.key === "Enter") savur = 2.1; else return;
  e.preventDefault(); sonDokunus = performance.now();
});

let gorunur = true, birikim = 0, onceki = performance.now();
function kare(an) {
  requestAnimationFrame(kare);
  if (!gorunur) { onceki = an; return; }
  birikim += Math.min(.05, (an - onceki) / 1000); onceki = an;
  while (birikim >= ADIM) { fizik(); birikim -= ADIM; }
  if (!hizYok && an - sonDokunus > 2500 && !surukle) yaw += .0016;
  /* dar (telefon) ekranda kumaş ekranı doldurmasın: görüş açısını ve uzaklığı en-boy oranına göre aç */
  const oran = tuval.width / tuval.height, dar = Math.max(1, 1.2 / oran);
  const fov = Math.min(1.2, 2 * Math.atan(Math.tan(.375) * dar)), ef = uzak * Math.min(1.35, Math.sqrt(dar));
  const e = [Math.sin(yaw) * Math.cos(pitch) * ef, .15 + Math.sin(pitch) * ef, Math.cos(yaw) * Math.cos(pitch) * ef];
  const mvp = M.carp(M.per(fov, oran, .1, 30), M.bak(e, [0, oran < 1 ? .25 : -.05, 0], [0, 1, 0]));
  const isik = [-1.6, 2.6, 2.2], renk = hexRgb(secRenk);
  gl.clearColor(.035, .028, .024, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  /* zemin */
  gl.useProgram(fprog); gl.bindVertexArray(FVAO); gl.uniformMatrix4fv(U.fuM, false, mvp); gl.uniform3fv(U.fuRenk, renk);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  /* kumaş verisi */
  gl.bindVertexArray(VAO);
  gl.bindBuffer(gl.ARRAY_BUFFER, bufP); gl.bufferSubData(gl.ARRAY_BUFFER, 0, P);
  gl.bindBuffer(gl.ARRAY_BUFFER, bufN); gl.bufferSubData(gl.ARRAY_BUFFER, 0, NOR);
  gl.useProgram(prog); gl.uniformMatrix4fv(U.puM, false, mvp); gl.uniform3fv(U.puL, isik); gl.uniform3fv(U.puE, e); gl.uniform3fv(U.puRenk, renk);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(U.puT, 0);
  /* gölge: spot ışıktan zemine izdüşüm */
  gl.depthMask(false); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.uniform1i(U.puGolge, 1); gl.drawElements(gl.TRIANGLES, idxN, gl.UNSIGNED_SHORT, 0);
  gl.disable(gl.BLEND); gl.depthMask(true);
  gl.uniform1i(U.puGolge, 0); gl.drawElements(gl.TRIANGLES, idxN, gl.UNSIGNED_SHORT, 0);
  /* sürreal iplik tozu */
  gl.useProgram(tprog); gl.uniformMatrix4fv(U.tuM, false, mvp); gl.uniform1f(U.tuT, hizYok ? 0 : an / 1000); gl.uniform3fv(U.tuRenk, renk);
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false);
  gl.drawArrays(gl.POINTS, 0, 420);
  gl.depthMask(true); gl.disable(gl.BLEND);
}
let sahne = "yok";
if (gl) {
  try {
    glKur(); boyut(); addEventListener("resize", boyut);
    new IntersectionObserver(e => { gorunur = e[0].isIntersecting; }).observe(tuval);
    for (let i = 0; i < 180; i++) fizik();                 // açılışta kumaş asılı dursun, düz levha görünmesin
    requestAnimationFrame(kare); sahne = "webgl2";
  } catch (x) { sahne = "hata: " + x.message; }
}
if (sahne !== "webgl2") document.body.classList.add("sahnesiz");
tuval && (tuval.dataset.sahne = sahne);

/* ================= kumaş seçimi = uçuş yönü ================= */
function kumasSec(h) {
  secRenk = IPLIK[h.renk].hex;
  if (gl && sahne === "webgl2") { gl.deleteTexture(tex); tex = dokumaDokusu(secRenk); savur = 1.5; }
  document.querySelectorAll(".hedef").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.id === h.id)));
  $("#kumasad").textContent = `${h.blok} Blok → ${h.ad}`;
  $("#sira").replaceChildren(...h.adim.map(a => { const li = document.createElement("li"); li.textContent = a; return li; }));
}
$("#hedefler").replaceChildren(...HEDEFLER.map(h => {
  const b = document.createElement("button"), i = document.createElement("i");
  b.className = "hedef"; b.type = "button"; b.dataset.id = h.id; i.style.background = IPLIK[h.renk].hex;
  b.append(i, document.createTextNode(h.ad)); b.addEventListener("click", () => kumasSec(h));
  return b;
}));
kumasSec(HEDEFLER[0]);

/* ================= dört site, bir yaşam ================= */
const SITELER = [
  { alan: "ataşehirmodern.com", url: "https://ataşehirmodern.com", ad: "Ev", renk: "klasik", soru: "Bloğumda ne var?" },
  { alan: "afair.live", url: "https://www.afair.live", ad: "Moda", renk: "viva", soru: "Terzi müsait mi?", hedef: "#randevu" },
  { alan: "afair.studio", url: "https://afair.studio", ad: "Sanat", renk: "peri", soru: "Ne yaratabilirim?" },
  { alan: "selinahbap.com", url: "https://www.selinahbap.com", ad: "Teknoloji", renk: "mocha", soru: "Evimi kim kurar?", hedef: "#randevu" }
];
$("#kapilar").replaceChildren(...SITELER.map(s => {
  const a = document.createElement("a");
  a.className = "kapi"; a.href = s.hedef || s.url; if (!s.hedef) { a.target = "_blank"; a.rel = "noopener"; }
  a.style.setProperty("--renk", IPLIK[s.renk].hex);
  for (const [cl, t] of [["alan", s.alan], ["ad", s.ad], ["soru", s.soru]]) { const e = document.createElement(cl === "ad" ? "b" : "span"); e.className = cl; e.textContent = t; a.append(e); }
  return a;
}));

/* ================= randevu: takvim talebi (.ics), sunucuya gönderim yok ================= */
const HIZMET = [
  { id: "terzi", ad: "Terzi", alt: "Ölçü ve prova · 45 dk", sure: 45, renk: "viva" },
  { id: "tarim", ad: "Tarım danışmanı", alt: "Balkon ve çatı bahçesi · 30 dk", sure: 30, renk: "mocha" },
  { id: "teknik", ad: "Teknik kurulum", alt: "Ev sistemleri · 60 dk", sure: 60, renk: "klasik" }
];
const secim = { hizmet: null, gun: null, saat: null }, GUNAD = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
function gunler() { const b = new Date(); b.setHours(0, 0, 0, 0); return Array.from({ length: 7 }, (_, i) => { const d = new Date(b); d.setDate(d.getDate() + i); return d; }); }
function randevuCiz() {
  $("#hizmetler").replaceChildren(...HIZMET.map(h => {
    const b = document.createElement("button"), i = document.createElement("i"), s = document.createElement("span"), bb = document.createElement("b"), sm = document.createElement("small");
    b.type = "button"; b.className = "secenek"; b.setAttribute("role", "radio"); b.setAttribute("aria-checked", String(secim.hizmet === h.id));
    i.style.background = IPLIK[h.renk].hex; bb.textContent = h.ad; sm.textContent = h.alt; s.append(bb, sm);
    b.append(i, s); b.addEventListener("click", () => { secim.hizmet = h.id; randevuCiz(); });
    return b;
  }));
  const gs = gunler(); if (!secim.gun) secim.gun = gs[0].toDateString();
  $("#gunler").replaceChildren(...gs.map(d => {
    const b = document.createElement("button"), sm = document.createElement("small"); b.type = "button"; b.className = "gun";
    b.setAttribute("aria-pressed", String(secim.gun === d.toDateString())); sm.textContent = GUNAD[d.getDay()];
    b.append(String(d.getDate()), sm); b.addEventListener("click", () => { secim.gun = d.toDateString(); secim.saat = null; randevuCiz(); });
    return b;
  }));
  const simdi = new Date();
  $("#saatler").replaceChildren(...[10, 11, 12, 13, 14, 15, 16, 17].map(sa => {
    const b = document.createElement("button"), d = new Date(secim.gun); d.setHours(sa);
    b.type = "button"; b.className = "saat"; b.textContent = `${String(sa).padStart(2, "0")}:00`;
    b.disabled = d <= simdi; b.setAttribute("aria-pressed", String(secim.saat === sa));
    b.addEventListener("click", () => { secim.saat = sa; randevuCiz(); });
    return b;
  }));
  const h = HIZMET.find(x => x.id === secim.hizmet), hazir = h && secim.saat !== null;
  $("#indir").disabled = !hazir;
  $("#ozet").textContent = hazir
    ? `${h.ad} · ${new Date(secim.gun).toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })} ${String(secim.saat).padStart(2, "0")}:00`
    : (h ? "Bir saat seç." : "Bir hizmet seç.");
}
function ics() {
  const h = HIZMET.find(x => x.id === secim.hizmet), b = new Date(secim.gun); b.setHours(secim.saat, 0, 0, 0);
  const s = new Date(b.getTime() + h.sure * 60000), f = d => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}00`;
  const u = new Uint32Array(2); crypto.getRandomValues(u);
  const satir = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Baska Istanbul Yok//Kumas//TR", "BEGIN:VEVENT",
    `UID:${u[0].toString(16)}${u[1].toString(16)}@baskaistanbulyok`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(b)}`, `DTEND:${f(s)}`,
    `SUMMARY:Randevu talebi: ${h.ad}`, `DESCRIPTION:${h.alt}. Bu bir taleptir; onay hizmet sağlayıcıdan gelir.`, "STATUS:TENTATIVE", "END:VEVENT", "END:VCALENDAR"];
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([satir.join("\r\n") + "\r\n"], { type: "text/calendar" }));
  a.download = `randevu-${h.id}-${f(b).slice(0, 8)}.ics`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
$("#indir").addEventListener("click", ics);
randevuCiz();

/* ================= masuralar ================= */
$("#masuralar").replaceChildren(...Object.values(IPLIK).map((r, n) => {
  const d = document.createElement("div"), cv = document.createElement("canvas"), b = document.createElement("b"), s = document.createElement("span");
  d.className = "masura"; b.textContent = r.ad; s.textContent = `PANTONE ${r.kod}`; d.append(cv, b, s);
  requestAnimationFrame(() => {
    const k = Math.min(devicePixelRatio || 1, 2), w = cv.clientWidth * k, h = cv.clientHeight * k; cv.width = w; cv.height = h;
    const g = cv.getContext("2d"), rgb = hexRgb(r.hex).map(v => v * 255);
    g.fillStyle = "#3a2f29"; g.fillRect(w * .2, h * .06, w * .6, h * .08); g.fillRect(w * .2, h * .86, w * .6, h * .08);
    for (let y = h * .14; y < h * .86; y += 2 * k) {
      const t = .75 + tohum(y + n * 31) * .4;
      g.strokeStyle = `rgb(${rgb.map(v => Math.min(255, v * t | 0)).join(",")})`; g.lineWidth = 1.6 * k;
      g.beginPath(); g.moveTo(w * .24, y); g.quadraticCurveTo(w * .5, y + 1.2 * k, w * .76, y); g.stroke();
    }
    const yg = g.createLinearGradient(w * .24, 0, w * .76, 0); yg.addColorStop(0, "rgba(0,0,0,.45)"); yg.addColorStop(.45, "rgba(255,255,255,.18)"); yg.addColorStop(1, "rgba(0,0,0,.5)");
    g.fillStyle = yg; g.fillRect(w * .24, h * .14, w * .52, h * .72);
  });
  return d;
}));

/* sınama kancası: ?sina=1 */
if (new URLSearchParams(location.search).has("sina")) {
  const o = document.createElement("pre"); o.id = "sina"; o.hidden = true;
  setTimeout(() => { o.textContent = JSON.stringify({ sahne, dikis: BAGL.length / 4, parcacik: N, alt_y: P[(N - 1) * 3 + 1] }); document.body.append(o); }, 1500);
}
