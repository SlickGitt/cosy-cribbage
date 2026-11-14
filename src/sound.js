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
