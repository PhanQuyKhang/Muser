import * as THREE from './vendor/three.module.js';

const canvas = document.getElementById('bg');
const lite = new URLSearchParams(location.search).has('lite');
const N = lite ? 24 : 64;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: !lite, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, lite ? 1 : 1.5));
const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
function resize() { renderer.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

/* ---------- procedural album art ---------- */
const PAL = ['#B9A3FF', '#79DFC3', '#F2A7D5', '#FF8A94', '#8FB8FF', '#FFD38A', '#7f5cff', '#2a6fdb'];
function art(i) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  const a = PAL[i % PAL.length], b = PAL[(i * 3 + 2) % PAL.length];
  const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  rr(0, 0, 256, 256, 34); g.clip();
  const gr = g.createLinearGradient(0, 0, 256, 256); gr.addColorStop(0, a); gr.addColorStop(1, b);
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  g.globalAlpha = 0.35; g.fillStyle = '#fff';
  const k = i % 4;
  if (k === 0) { g.beginPath(); g.arc(128, 128, 70, 0, 7); g.fill(); g.globalAlpha = 0.5; g.fillStyle = '#101014'; g.beginPath(); g.arc(128, 128, 14, 0, 7); g.fill(); }
  if (k === 1) { for (let y = 20; y < 256; y += 34) g.fillRect(0, y, 256, 14); }
  if (k === 2) { g.beginPath(); g.arc(70, 190, 100, 0, 7); g.fill(); g.beginPath(); g.arc(200, 60, 50, 0, 7); g.fill(); }
  if (k === 3) { g.beginPath(); g.moveTo(0, 256); g.lineTo(128, 40); g.lineTo(256, 256); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const textures = Array.from({ length: 12 }, (_, i) => art(i));
const geo = new THREE.PlaneGeometry(4, 4);
const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();

const cards = [];
for (let i = 0; i < N; i++) {
  const mat = new THREE.MeshBasicMaterial({ map: textures[i % 12], transparent: true, opacity: 0.5, side: THREE.DoubleSide });
  const m = new THREE.Mesh(geo, mat);
  m.userData = { r1: rnd(), r2: rnd(), r3: rnd(), op: 0.5, tint: new THREE.Color(1, 1, 1) };
  m.position.set((m.userData.r1 - 0.5) * 40, (m.userData.r2 - 0.5) * 24, -20);
  scene.add(m); cards.push(m);
}

/* real album covers (local files from img/covers) replace the procedural art */
function roundedCover(im) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'), r = 30;
  g.beginPath(); g.moveTo(r, 0); g.arcTo(256, 0, 256, 256, r); g.arcTo(256, 256, 0, 256, r); g.arcTo(0, 256, 0, 0, r); g.arcTo(0, 0, 256, 0, r); g.closePath(); g.clip();
  g.drawImage(im, 0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
for (let k = 0; k < 12; k++) {
  const im = new Image();
  im.onload = () => {
    const t = roundedCover(im); textures[k] = t;
    cards.forEach((m, i) => { if (i % 12 === k) { m.material.map = t; m.material.needsUpdate = true; } });
  };
  im.src = `img/covers/${String(k + 1).padStart(2, '0')}.jpg`;
}

/* waveform ring */
const SEG = 160;
const ringGeo = new THREE.BufferGeometry();
ringGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((SEG + 1) * 3), 3));
const ring = new THREE.Line(ringGeo, new THREE.LineBasicMaterial({ color: 0xb9a3ff, transparent: true, opacity: 0.55 }));
ring.position.z = -16; scene.add(ring);

/* ---------- state ---------- */
let pose = 'hero', slideIdx = 0, mode = null, mx = 0, my = 0;
const tints = { familiar: new THREE.Color(0.85, 0.78, 1), explore: new THREE.Color(0.65, 1, 0.9), surprise: new THREE.Color(1, 0.68, 0.9), none: new THREE.Color(1, 1, 1) };
const spreadOf = { familiar: 0.55, explore: 1, surprise: 1.7, none: 1 };
const speedOf = { familiar: 0.5, explore: 1, surprise: 2.4, none: 1 };
let spread = 1, speed = 1;
addEventListener('pointermove', e => { mx = (e.clientX / innerWidth - 0.5) * 2; my = (e.clientY / innerHeight - 0.5) * 2; });

/* ---------- audio (synth, no files) ---------- */
let ac = null, analyser = null, audioOn = false, master = null, nextT = 0, stepN = 0, timer = null;
const BPM = 96, S16 = 60 / BPM / 4;
const chords = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
const f = n => 440 * Math.pow(2, (n - 69) / 12);
function env(g, t, a, d, v) { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
function osc(type, freq, t, dur, vol, dest) { const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = freq; env(g, t, 0.01, dur, vol); o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05); }
let noiseBuf;
function noise(t, dur, vol, hp) { const s = ac.createBufferSource(); s.buffer = noiseBuf; const fl = ac.createBiquadFilter(); fl.type = 'highpass'; fl.frequency.value = hp; const g = ac.createGain(); env(g, t, 0.002, dur, vol); s.connect(fl); fl.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.05); }
function sched() {
  while (nextT < ac.currentTime + 0.2) {
    const s = stepN % 16, bar = Math.floor(stepN / 16) % 4, ch = chords[bar], t = nextT;
    if (s % 4 === 0) { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12); env(g, t, 0.002, 0.28, 0.9); o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.35); }
    if (s % 4 === 2) noise(t, 0.05, 0.12, 7000);
    if (s === 4 || s === 12) noise(t, 0.12, 0.2, 1800);
    if ([0, 3, 6, 8, 11, 14].includes(s)) osc('sawtooth', f(ch[0] - 24), t, 0.18, 0.16, bassF());
    if (s === 0) ch.forEach(n => osc('triangle', f(n), t, S16 * 15, 0.06, master));
    if (s % 2 === 0) osc('sine', f(ch[(s / 2) % 3] + 12), t, 0.25, 0.05, master);
    nextT += S16; stepN++;
  }
}
let bassNode;
function bassF() { return bassNode; }
function startAudio() {
  ac = new (window.AudioContext || window.webkitAudioContext)();
  master = ac.createGain(); master.gain.value = 0.26;
  const comp = ac.createDynamicsCompressor(); master.connect(comp);
  analyser = ac.createAnalyser(); analyser.fftSize = 256; comp.connect(analyser); analyser.connect(ac.destination);
  bassNode = ac.createBiquadFilter(); bassNode.type = 'lowpass'; bassNode.frequency.value = 420; bassNode.connect(master);
  noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  nextT = ac.currentTime + 0.1; stepN = 0; timer = setInterval(sched, 40);
}
function toggleAudio() {
  if (!ac) startAudio();
  audioOn = !audioOn;
  if (audioOn) ac.resume(); else ac.suspend();
  return audioOn;
}
const freq = new Uint8Array(128);
function beatLevel(t) {
  if (audioOn && analyser) { analyser.getByteFrequencyData(freq); let s = 0; for (let i = 1; i < 6; i++) s += freq[i]; return Math.min(1, s / 5 / 230); }
  const ph = (t * BPM / 60) % 1; return Math.pow(1 - ph, 3) * 0.7;
}

/* ---------- pose targets ---------- */
function target(i, t, T) {
  const u = cards[i].userData, p = pose;
  const sp = spread, tt = t * speed;
  let x, y, z, op = 0.55, sc = 1, ry = 0;
  const cloud = (zBase, zRange) => {
    x = ((u.r1 - 0.5) * 44 + Math.sin(tt * 0.2 + u.r3 * 6) * 1.6) * sp;
    y = ((u.r2 - 0.5) * 26 + Math.cos(tt * 0.25 + u.r1 * 6) * 1.3) * sp;
    z = zBase - u.r3 * zRange;
  };
  if (p === 'ring') {
    const a = i / N * Math.PI * 2 + tt * 0.12;
    x = Math.cos(a) * 14 * sp; y = Math.sin(i * 1.7) * 1.8; z = -19 + Math.sin(a) * 7; op = 0.6; ry = -Math.cos(a) * 0.5;
  } else if (p === 'wall') {
    const cols = 10; x = ((i % cols) - 4.5) * 4.7; y = ((Math.floor(i / cols) % 7) - 3) * 4.7; z = -26 + Math.sin(tt * 0.6 + i) * 0.6; op = 0.4;
  } else if (p === 'stack') {
    if (i < 8) { x = (i % 2 ? 1 : -1) * 2.5 * (1 + i * 0.15); y = Math.sin(i) * 1.2; z = -14 - i * 0.4; op = 0.85; ry = 0.3 * (i % 2 ? -1 : 1); } else { cloud(-22, 22); op = 0.2; }
  } else if (p === 'dim') { cloud(-26, 20); op = 0.17; }
  else if (p === 'hero') { cloud(-10, 20); op = 0.7; }
  else { cloud(-12, 24); op = 0.5; }
  return { x, y, z, op, sc, ry };
}

/* ---------- loop ---------- */
const clock = new THREE.Clock(); const tmp = new THREE.Vector3();
let camT = new THREE.Vector3(), lookY = 0;
function loop() {
  requestAnimationFrame(loop);
  const t = clock.getElapsedTime(), b = beatLevel(t);
  const tint = tints[mode || 'none'];
  spread += ((spreadOf[mode || 'none']) - spread) * 0.04; speed += ((speedOf[mode || 'none']) - speed) * 0.04;
  for (let i = 0; i < N; i++) {
    const m = cards[i], u = m.userData, T = target(i, t);
    tmp.set(T.x, T.y, T.z); m.position.lerp(tmp, 0.045);
    u.op += (T.op - u.op) * 0.06;
    m.material.opacity = Math.min(1, u.op * (1 + b * 0.25));
    u.tint.lerp(tint, 0.05); m.material.color.copy(u.tint);
    const s = 1 + b * 0.07 + (pose === 'ring' ? 0.15 : 0); m.scale.setScalar(s);
    m.rotation.y += (T.ry + Math.sin(t * 0.4 + u.r1 * 6) * 0.25 - m.rotation.y) * 0.04;
    m.rotation.z = Math.sin(t * 0.3 + u.r2 * 9) * 0.18;
  }
  /* ring waveform */
  const arr = ringGeo.attributes.position.array, R = 6 + b * 1.2;
  for (let k = 0; k <= SEG; k++) {
    const a = k / SEG * Math.PI * 2; const fv = (audioOn && analyser) ? freq[(k % 64) + 2] / 255 : (0.5 + 0.5 * Math.sin(k * 0.6 + t * 3)) * 0.35 + b * 0.25;
    const r = R + fv * 1.6; arr[k * 3] = Math.cos(a) * r; arr[k * 3 + 1] = Math.sin(a) * r; arr[k * 3 + 2] = 0;
  }
  ringGeo.attributes.position.needsUpdate = true;
  ring.material.opacity = (pose === 'ring' || pose === 'hero' ? 0.7 : 0.18); ring.rotation.z = t * 0.05;
  ring.material.color.set(mode === 'surprise' ? 0xf2a7d5 : mode === 'explore' ? 0x79dfc3 : 0xb9a3ff);
  /* camera */
  camT.set(Math.sin(slideIdx * 0.9) * 3.5 + mx * 2, Math.cos(slideIdx * 1.3) * 1.6 - my * 1.2, 3 + Math.sin(slideIdx * 0.6) * 2 - b * 0.6);
  cam.position.lerp(camT, 0.03); cam.lookAt(0, 0, -16);
  renderer.render(scene, cam);
}
loop();

window.muser3d = {
  setSlide(i, p) { slideIdx = i; pose = p; },
  setMode(m) { mode = m; },
  toggleAudio,
};
{
  const all = [...document.querySelectorAll('.slide')];
  const act = Math.max(0, all.findIndex(s => s.classList.contains('active')));
  window.muser3d.setSlide(act, all[act]?.dataset.pose || 'hero');
}
