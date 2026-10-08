// 배경음악: 스테이지 시작 시 재생
// 우선순위: 사용자가 고른 음악 파일 > 유튜브 영상(Tl-dmo9_VCg) > 내장 합성 BGM
// (유튜브를 불러올 수 없는 환경이면 자동으로 다음 순서로 넘어감)
window.Bgm = (function () {
  const YT_ID = 'Tl-dmo9_VCg';
  const VOL = { file: 0.5, yt: 45, synth: 0.16 };

  let yt = null, ytState = 'idle'; // idle | loading | ready | failed
  let fileAudio = null, fileUrl = null, fileName = null;
  let playing = null; // 'file' | 'yt' | 'synth' | null
  let wanted = false, paused = false;
  let onChange = () => {};

  // ---------- 유튜브 ----------
  function loadYouTube() {
    if (ytState !== 'idle') return;
    ytState = 'loading';
    const fail = () => {
      if (ytState === 'ready' || ytState === 'failed') return;
      ytState = 'failed';
      onChange();
      if (wanted && !paused && !playing) play();
    };
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:0;bottom:0;width:200px;height:200px;opacity:0;pointer-events:none;z-index:-1';
    const el = document.createElement('div');
    el.id = 'yt-bgm';
    host.appendChild(el);
    document.body.appendChild(host);
    window.onYouTubeIframeAPIReady = () => {
      try {
        yt = new YT.Player('yt-bgm', {
          videoId: YT_ID, width: 200, height: 200,
          playerVars: { autoplay: 0, controls: 0, loop: 1, playlist: YT_ID, playsinline: 1 },
          events: {
            onReady: () => {
              ytState = 'ready';
              onChange();
              if (wanted && !paused && (!playing || playing === 'synth')) play();
            },
            onError: () => { ytState = 'failed'; onChange(); if (playing === 'yt') { playing = null; play(); } },
          },
        });
      } catch (e) { fail(); }
    };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.onerror = fail;
    document.head.appendChild(s);
    setTimeout(fail, 8000);
  }

  // ---------- 내장 합성 BGM (오리지널 곡: D단조 결투 테마) ----------
  const BPM = 132, STEP = 60 / BPM / 4, STEPS = 64;
  const N = (m) => 440 * Math.pow(2, (m - 69) / 12);
  // 마디별 화음 (MIDI): Dm, Bb, Gm, A
  const CHORDS = [[50, 53, 57], [46, 50, 53], [43, 46, 50], [45, 49, 52]];
  const OSTINATO = [0, 0, 7, 0, 3, 0, 7, 12, 0, 0, 7, 0, 3, 7, 10, 12];
  // 금관 모티프 [스텝, 반음(근음 기준), 길이(스텝)]
  const BRASS = [[0, 12, 5], [6, 15, 2], [8, 19, 6], [14, 17, 2]];
  let synth = null;

  function voice(ac, out, type, freq, t, dur, vol, cutoff, attack = 0.01) {
    const o = ac.createOscillator(); o.type = type; o.frequency.value = freq;
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f); f.connect(g); g.connect(out);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function drum(ac, out, t, big) {
    const o = ac.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(big ? 95 : 140, t);
    o.frequency.exponentialRampToValueAtTime(big ? 42 : 70, t + 0.35);
    const g = ac.createGain();
    g.gain.setValueAtTime(big ? 0.9 : 0.4, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (big ? 0.6 : 0.25));
    o.connect(g); g.connect(out);
    o.start(t); o.stop(t + 0.7);
    if (Sfx.noiseBuf) {
      const n = ac.createBufferSource(); n.buffer = Sfx.noiseBuf;
      const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 600;
      const ng = ac.createGain();
      ng.gain.setValueAtTime(big ? 0.35 : 0.15, t);
      ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
      n.connect(f); f.connect(ng); ng.connect(out);
      n.start(t); n.stop(t + 0.2);
    }
  }

  function scheduleStep(ac, out, i, t) {
    const bar = Math.floor(i / 16) % 4, s = i % 16;
    const ch = CHORDS[bar], root = ch[0];
    // 현악 오스티나토 (8분음표 + 16분 꾸밈)
    if (s % 2 === 0 || s === 13 || s === 15) {
      voice(ac, out, 'sawtooth', N(root - 12 + OSTINATO[s]), t, STEP * 1.6, 0.16, 1400);
    }
    // 합창 패드 (마디 시작)
    if (s === 0) {
      for (const m of ch) {
        for (const det of [-4, 4]) {
          const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = N(m + 12); o.detune.value = det;
          const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 750; f.Q.value = 1.2;
          const g = ac.createGain(), dur = STEP * 16;
          g.gain.setValueAtTime(0.0001, t);
          g.gain.linearRampToValueAtTime(0.05, t + 0.35);
          g.gain.setValueAtTime(0.05, t + dur - 0.3);
          g.gain.linearRampToValueAtTime(0.0001, t + dur);
          o.connect(f); f.connect(g); g.connect(out);
          o.start(t); o.stop(t + dur + 0.05);
        }
      }
      voice(ac, out, 'triangle', N(root - 24), t, STEP * 15, 0.35, 300, 0.05);
    }
    // 팀파니
    if (s === 0 || s === 8) drum(ac, out, t, true);
    if (bar === 3 && (s === 12 || s === 13 || s === 14 || s === 15)) drum(ac, out, t, false);
    // 금관 (2, 4마디)
    if (bar === 1 || bar === 3) {
      for (const [st, semi, len] of BRASS) {
        if (st === s) {
          const m = bar === 3 && st >= 8 ? root + semi - 1 : CHORDS[0][0] + semi;
          voice(ac, out, 'sawtooth', N(m), t, STEP * len, 0.11, 2200, 0.03);
          voice(ac, out, 'square', N(m - 12), t, STEP * len, 0.05, 1200, 0.03);
        }
      }
    }
  }

  function startSynth() {
    const ac = Sfx.ctx;
    if (!ac || synth) return;
    const out = ac.createGain();
    out.gain.value = VOL.synth;
    out.connect(Sfx.out);
    let step = 0, next = ac.currentTime + 0.1;
    const timer = setInterval(() => {
      while (next < ac.currentTime + 0.2) {
        scheduleStep(ac, out, step, next);
        next += STEP; step = (step + 1) % STEPS;
      }
    }, 40);
    synth = { out, timer };
  }
  function stopSynth() {
    if (!synth) return;
    const s = synth; synth = null;
    clearInterval(s.timer);
    try { s.out.gain.setTargetAtTime(0, Sfx.ctx.currentTime, 0.15); } catch (e) { /* ignore */ }
    setTimeout(() => { try { s.out.disconnect(); } catch (e) { /* ignore */ } }, 1500);
  }

  // ---------- 재생 제어 ----------
  function stopAll() {
    if (fileAudio) fileAudio.pause();
    if (yt && yt.pauseVideo) try { yt.pauseVideo(); } catch (e) { /* ignore */ }
    stopSynth();
    playing = null;
  }

  function play(restart) {
    stopAll();
    if (fileAudio) {
      if (restart) fileAudio.currentTime = 0;
      fileAudio.play().catch(() => {});
      playing = 'file';
    } else if (ytState === 'ready' && yt) {
      try {
        if (restart) yt.seekTo(0, true);
        yt.playVideo();
        playing = 'yt';
      } catch (e) { ytState = 'failed'; }
    } else if (ytState === 'loading') {
      playing = null; // 로딩되면 onReady에서 재생
    }
    if (!playing && ytState !== 'loading') { startSynth(); playing = 'synth'; }
    syncVolume();
  }

  function syncVolume() {
    const m = Sfx.muted;
    if (fileAudio) fileAudio.volume = m ? 0 : VOL.file;
    if (yt && yt.setVolume) try { yt.setVolume(m ? 0 : VOL.yt); } catch (e) { /* ignore */ }
  }

  // ---------- 사용자 음악 파일 (IndexedDB에 저장) ----------
  function db() {
    return new Promise((res, rej) => {
      const r = indexedDB.open('saberduel', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('bgm');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  async function saveFile(blob, name) {
    try {
      const d = await db();
      d.transaction('bgm', 'readwrite').objectStore('bgm').put(blob ? { blob, name } : null, 'file');
    } catch (e) { /* 저장 실패해도 이번 세션에서는 재생됨 */ }
  }
  function useFile(blob, name) {
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    if (fileAudio) fileAudio.pause();
    if (!blob) { fileAudio = null; fileUrl = null; fileName = null; }
    else {
      fileUrl = URL.createObjectURL(blob);
      fileAudio = new Audio(fileUrl);
      fileAudio.loop = true;
      fileName = name;
    }
    onChange();
    if (wanted && !paused) play(true);
  }

  async function init(cb) {
    if (cb) onChange = cb;
    loadYouTube();
    try {
      const d = await db();
      const r = d.transaction('bgm').objectStore('bgm').get('file');
      r.onsuccess = () => { if (r.result && r.result.blob) useFile(r.result.blob, r.result.name); };
    } catch (e) { /* ignore */ }
  }

  return {
    init,
    // 스테이지(매치) 시작
    start() { wanted = true; paused = false; play(true); },
    stop() { wanted = false; paused = false; stopAll(); },
    pause() { if (!wanted) return; paused = true; stopAll(); },
    resume() { if (!wanted) return; paused = false; play(false); },
    setFile(file) { useFile(file, file.name); saveFile(file, file.name); },
    clearFile() { useFile(null); saveFile(null); },
    syncVolume,
    get source() {
      if (fileName) return '내 파일: ' + fileName;
      if (ytState === 'ready') return '유튜브 영상';
      if (ytState === 'loading') return '유튜브 불러오는 중…';
      return '기본 결투 테마 (유튜브 사용 불가)';
    },
    get hasFile() { return !!fileName; },
  };
})();
