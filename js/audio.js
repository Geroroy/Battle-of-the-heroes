// Web Audio로 합성한 효과음 (외부 음원 파일 없음)
window.Sfx = (function () {
  let ac = null, master = null, noiseBuf = null, hum = null;
  let muted = false;
  try { muted = localStorage.getItem('saberduel.muted') === '1'; } catch (e) { /* ignore */ }

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    master = ac.createGain();
    master.gain.value = muted ? 0 : 0.8;
    master.connect(ac.destination);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  function env(g, t0, vol, attack, dur) {
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  }

  function noise(dur, type, f0, f1, q, vol, attack = 0.01) {
    if (!ac) return;
    const t0 = ac.currentTime;
    const src = ac.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const f = ac.createBiquadFilter(); f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t0);
    f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    const g = ac.createGain(); env(g, t0, vol, attack, dur);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t0); src.stop(t0 + dur + 0.05);
  }

  function tone(type, f0, f1, dur, vol, attack = 0.005) {
    if (!ac) return;
    const t0 = ac.currentTime;
    const o = ac.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(f0, t0);
    o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    const g = ac.createGain(); env(g, t0, vol, attack, dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }

  return {
    init,
    ignite() { tone('sawtooth', 40, 140, 0.45, 0.12, 0.02); noise(0.5, 'bandpass', 300, 1400, 2, 0.12, 0.03); },
    swing() { tone('sawtooth', 95, 160, 0.28, 0.09, 0.03); noise(0.28, 'bandpass', 350, 1300, 3, 0.18, 0.05); },
    clash() {
      noise(0.35, 'highpass', 2500, 1500, 1, 0.45);
      tone('square', 1400, 600, 0.18, 0.08);
      tone('sawtooth', 180, 60, 0.3, 0.15);
    },
    cut() { noise(0.7, 'bandpass', 3500, 800, 1.2, 0.35); tone('sawtooth', 220, 50, 0.6, 0.12); },
    lava() { noise(0.9, 'lowpass', 900, 120, 1, 0.5, 0.02); },
    thud() { tone('sine', 120, 50, 0.15, 0.25); },
    beep(high) { tone('square', high ? 880 : 440, high ? 880 : 440, high ? 0.35 : 0.12, 0.06); },
    startHum() {
      if (!ac || hum) return;
      const g = ac.createGain(); g.gain.value = 0;
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380;
      const o1 = ac.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 82;
      const o2 = ac.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = 87.5;
      o1.connect(lp); o2.connect(lp); lp.connect(g); g.connect(master);
      o1.start(); o2.start();
      g.gain.setTargetAtTime(0.04, ac.currentTime, 0.2);
      hum = { g, lp, o1, o2 };
    },
    humIntensity(v) {
      if (!hum) return;
      hum.lp.frequency.setTargetAtTime(380 + v * 900, ac.currentTime, 0.05);
      hum.g.gain.setTargetAtTime(0.035 + v * 0.05, ac.currentTime, 0.05);
    },
    stopHum() {
      if (!hum) return;
      const h = hum; hum = null;
      h.g.gain.setTargetAtTime(0, ac.currentTime, 0.08);
      setTimeout(() => { try { h.o1.stop(); h.o2.stop(); } catch (e) { /* ignore */ } }, 400);
    },
    toggleMute() {
      muted = !muted;
      try { localStorage.setItem('saberduel.muted', muted ? '1' : '0'); } catch (e) { /* ignore */ }
      if (master) master.gain.value = muted ? 0 : 0.8;
      if (window.Bgm) Bgm.syncVolume();
      return muted;
    },
    get muted() { return muted; },
    get ctx() { return ac; },
    get out() { return master; },
    get noiseBuf() { return noiseBuf; },
  };
})();
