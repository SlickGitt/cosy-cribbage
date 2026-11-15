// Synthesised sound: card and score effects plus a soft lofi loop. No audio files needed.
let ctx = null, master, sfxBus, musicBus, crackle = null, loopTimer = null, nextBar = 0, bar = 0;
export const settings = { sound: true, music: true };

export function initAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
  master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
  sfxBus = ctx.createGain(); sfxBus.gain.value = settings.sound ? 1 : 0; sfxBus.connect(master);
  musicBus = ctx.createGain(); musicBus.gain.value = 0; musicBus.connect(master);
  if (settings.music) startMusic();
}

function noiseBuffer(sec, sparse = false) {
  const b = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = sparse ? (Math.random() < 0.0006 ? (Math.random() - 0.5) * 1.6 : (Math.random() - 0.5) * 0.04) : Math.random() * 2 - 1;
  return b;
}

function tone(freq, start, dur, type = 'sine', vol = 0.2, bus = sfxBus) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(vol, start + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g); g.connect(bus); o.start(start); o.stop(start + dur + 0.05);
}

export function sfx(name, n = 1) {
  if (!ctx || !settings.sound) return;
  const t = ctx.currentTime;
  if (name === 'card') {
    const s = ctx.createBufferSource(); s.buffer = noiseBuffer(0.08);
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2400; f.Q.value = 0.8;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.35, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    s.connect(f); f.connect(g); g.connect(sfxBus); s.start(t);
  } else if (name === 'score') {
    const notes = [659, 784, 988, 1175, 1319];
    for (let i = 0; i < Math.min(5, Math.max(2, n)); i++) tone(notes[i], t + i * 0.07, 0.35, 'triangle', 0.12);
  } else if (name === 'go') {
    tone(330, t, 0.18, 'square', 0.05); tone(247, t + 0.1, 0.22, 'square', 0.05);
  } else if (name === 'step') {
    tone(180 + Math.random() * 40, t, 0.06, 'triangle', 0.05);
  } else if (name === 'chime') {
    [523, 659, 784].forEach((f, i) => tone(f, t + i * 0.12, 0.8, 'sine', 0.1));
  } else if (name === 'baa') {
    // a bleat: buzzy tone with a fast wobble through a vowel-ish filter
    const o = ctx.createOscillator(), lfo = ctx.createOscillator(), lg = ctx.createGain(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    const base = 300 + Math.random() * 90;
    o.type = 'sawtooth'; o.frequency.setValueAtTime(base * 1.08, t); o.frequency.linearRampToValueAtTime(base, t + 0.12); o.frequency.linearRampToValueAtTime(base * 0.86, t + 0.6);
    lfo.frequency.value = 22; lg.gain.value = base * 0.07; lfo.connect(lg); lg.connect(o.frequency);
    f.type = 'bandpass'; f.frequency.value = 1150; f.Q.value = 1.6;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.32, t + 0.05); g.gain.setValueAtTime(0.28, t + 0.4); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);
    o.connect(f); f.connect(g); g.connect(sfxBus); o.start(t); lfo.start(t); o.stop(t + 0.7); lfo.stop(t + 0.7);
  } else if (name === 'moo') {
    const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(118, t); o.frequency.linearRampToValueAtTime(128, t + 0.35); o.frequency.linearRampToValueAtTime(96, t + 1.1);
    f.type = 'lowpass'; f.Q.value = 4; f.frequency.setValueAtTime(320, t); f.frequency.linearRampToValueAtTime(820, t + 0.4); f.frequency.linearRampToValueAtTime(380, t + 1.1);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.4, t + 0.12); g.gain.setValueAtTime(0.36, t + 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    o.connect(f); f.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + 1.25);
  } else if (name === 'chitter') {
    for (let i = 0; i < 6; i++) tone(2300 + Math.random() * 700, t + i * 0.045, 0.03, 'square', 0.035);
  } else if (name === 'tweet') {
    [0, 0.11].forEach((d) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(2600, t + d); o.frequency.exponentialRampToValueAtTime(3900, t + d + 0.07);
      g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(0.07, t + d + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.08); o.connect(g); g.connect(sfxBus); o.start(t + d); o.stop(t + d + 0.1); });
  } else if (name === 'flap' || name === 'rustle' || name === 'scurry') {
    const dur = name === 'rustle' ? 0.45 : name === 'flap' ? 0.25 : 0.2;
    const s = ctx.createBufferSource(); s.buffer = noiseBuffer(dur + 0.05);
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = name === 'rustle' ? 3200 : name === 'flap' ? 900 : 1800; f.Q.value = 0.7;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
    const beats = name === 'flap' ? 4 : name === 'scurry' ? 5 : 7;
    for (let i = 0; i < beats; i++) { const s0 = t + (i * dur) / beats; g.gain.exponentialRampToValueAtTime(name === 'rustle' ? 0.12 : 0.18, s0 + 0.01); g.gain.exponentialRampToValueAtTime(0.004, s0 + dur / beats); }
    s.connect(f); f.connect(g); g.connect(sfxBus); s.start(t); s.stop(t + dur + 0.05);
  } else if (name === 'pop') {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(700, t); o.frequency.exponentialRampToValueAtTime(220, t + 0.09);
    g.gain.setValueAtTime(0.15, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12); o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + 0.15);
  } else if (name === 'win') {
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, t + i * 0.13, 0.5, 'triangle', 0.12));
  }
}

// Fmaj7, Em7, Dm7, Cmaj7 at a slow tempo, through a soft low-pass with vinyl crackle.
const CHORDS = [[174.6, 220, 261.6, 329.6], [164.8, 196, 246.9, 293.7], [146.8, 174.6, 220, 261.6], [130.8, 164.8, 196, 246.9]];
const BAR = 3.4;
function scheduleBar(start, idx) {
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100; lp.connect(musicBus);
  const ch = CHORDS[idx % 4];
  ch.forEach((f, i) => {
    [0, 1.7].forEach((off) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = i % 2 ? 'triangle' : 'sine'; o.frequency.value = f; o.detune.value = (i - 1.5) * 4;
      const s = start + off + i * 0.03;
      g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(0.05, s + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, s + 1.65);
      o.connect(g); g.connect(lp); o.start(s); o.stop(s + 1.7);
    });
  });
  const b = ctx.createOscillator(), bg = ctx.createGain();
  b.type = 'sine'; b.frequency.value = ch[0] / 2;
  bg.gain.setValueAtTime(0.0001, start); bg.gain.exponentialRampToValueAtTime(0.09, start + 0.05); bg.gain.exponentialRampToValueAtTime(0.0001, start + BAR * 0.9);
  b.connect(bg); bg.connect(musicBus); b.start(start); b.stop(start + BAR);
  const mel = [ch[2] * 2, ch[3] * 2, ch[1] * 2];
  [0.85, 2.1, 2.55].forEach((off, i) => { if (Math.random() < 0.7) tone(mel[i], start + off, 0.6, 'sine', 0.035, lp); });
}
function startMusic() {
  if (!ctx) return;
  musicBus.gain.cancelScheduledValues(ctx.currentTime);
  musicBus.gain.setTargetAtTime(0.9, ctx.currentTime, 0.4);
  if (!crackle) {
    crackle = ctx.createBufferSource(); crackle.buffer = noiseBuffer(3, true); crackle.loop = true;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900;
    const g = ctx.createGain(); g.gain.value = 0.5; crackle.connect(hp); hp.connect(g); g.connect(musicBus); crackle.start();
  }
  if (loopTimer) return;
  nextBar = ctx.currentTime + 0.1;
  loopTimer = setInterval(() => {
    while (nextBar < ctx.currentTime + 1.5) { scheduleBar(nextBar, bar++); nextBar += BAR; }
  }, 300);
}
function stopMusic() {
  if (!ctx) return;
  musicBus.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
  clearInterval(loopTimer); loopTimer = null;
}
export function setMusic(on) { settings.music = on; if (!ctx) return; on ? startMusic() : stopMusic(); }
export function setSound(on) { settings.sound = on; if (sfxBus) sfxBus.gain.value = on ? 1 : 0; }
