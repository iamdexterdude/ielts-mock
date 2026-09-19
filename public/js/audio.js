// The Listening recording: four tracks played back to back, once.
// Pausing, seeking and media keys are ignored; the app keeps the position in
// step with the exam clock, so a reload or a sleeping laptop can't rewind it.

export class ListeningPlayer {
  constructor(tracks) {
    this.tracks = tracks;
    this.offsets = [];
    let t = 0;
    for (const tr of tracks) {
      this.offsets.push(t);
      t += tr.duration;
    }
    this.total = t;
    this.urls = tracks.map((tr) => tr.src);
    this.ready = false;
    this.index = -1;
    this.active = false;
    this.lastTime = 0;
    this.expectedSeek = null;
    this.onTrackChange = () => {};
    this.onEnded = () => {};
    this.onNeedsGesture = () => {};

    const a = (this.audio = new Audio());
    a.preload = 'auto';
    a.setAttribute('playsinline', '');
    a.addEventListener('timeupdate', () => {
      if (!a.seeking) this.lastTime = a.currentTime;
    });
    a.addEventListener('seeking', () => {
      if (this.expectedSeek !== null && Math.abs(a.currentTime - this.expectedSeek) < 0.75) {
        this.expectedSeek = null;
        return;
      }
      if (this.active && Math.abs(a.currentTime - this.lastTime) > 1) {
        this._seek(this.lastTime); // someone tried to scrub: put it back
      }
    });
    a.addEventListener('pause', () => {
      if (this.active && !a.ended) this._play();
    });
    a.addEventListener('ratechange', () => {
      if (a.playbackRate !== this.rate) a.playbackRate = this.rate;
    });
    a.addEventListener('ended', () => this._next());
    this.rate = 1;
    this._lockMediaKeys();
  }

  _lockMediaKeys() {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({ title: 'IELTS Listening', artist: 'The recording plays once' });
    } catch {}
    for (const action of ['play', 'pause', 'stop', 'seekbackward', 'seekforward', 'seekto', 'previoustrack', 'nexttrack']) {
      try {
        navigator.mediaSession.setActionHandler(action, () => {});
      } catch {}
    }
  }

  // Download every track up front, so playback never waits on the network.
  async preload(onProgress = () => {}) {
    const loaded = new Array(this.tracks.length).fill(0);
    const sizes = new Array(this.tracks.length).fill(0);
    const report = () => {
      const known = sizes.every(Boolean);
      const frac = known
        ? loaded.reduce((x, y) => x + y, 0) / sizes.reduce((x, y) => x + y, 0)
        : loaded.filter(Boolean).length / (this.tracks.length * 2);
      onProgress(Math.min(1, frac));
    };
    await Promise.all(
      this.tracks.map(async (tr, i) => {
        let lastErr;
        for (let attempt = 0; attempt < 4; attempt++) {
          try {
            loaded[i] = 0;
            const res = await fetch(tr.src, { cache: 'force-cache' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            sizes[i] = Number(res.headers.get('content-length')) || 0;
            const reader = res.body.getReader();
            const chunks = [];
            for (;;) {
              const { done, value } = await reader.read();
              if (done) break;
              chunks.push(value);
              loaded[i] += value.length;
              report();
            }
            if (!sizes[i]) sizes[i] = loaded[i];
            this.urls[i] = URL.createObjectURL(new Blob(chunks, { type: 'audio/mpeg' }));
            report();
            return;
          } catch (err) {
            lastErr = err;
            await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
          }
        }
        throw lastErr;
      })
    );
    this.ready = true;
    onProgress(1);
  }

  locate(sec) {
    let i = this.tracks.length - 1;
    while (i > 0 && sec < this.offsets[i]) i--;
    return { index: i, offset: Math.max(0, sec - this.offsets[i]) };
  }

  position() {
    return this.index < 0 ? 0 : this.offsets[this.index] + (this.audio.currentTime || 0);
  }

  setVolume(v) {
    this.audio.volume = Math.max(0, Math.min(1, v));
  }

  // Test hook: play faster (only used by the debug panel).
  setRate(r) {
    this.rate = r;
    this.audio.defaultPlaybackRate = r;
    this.audio.playbackRate = r;
  }

  // Called straight from a click, so play() runs inside the user gesture.
  startAt(sec) {
    this.active = true;
    if (sec >= this.total) return this._finish();
    const { index, offset } = this.locate(sec);
    this._load(index, offset);
    return this._play();
  }

  // Bring playback back in line with the exam clock.
  syncTo(sec) {
    if (!this.active) return;
    if (sec >= this.total) return this._finish();
    const { index, offset } = this.locate(sec);
    if (index !== this.index) {
      this._load(index, offset);
      this._play();
    } else {
      this._seek(offset);
    }
  }

  stop() {
    this.active = false;
    this.audio.pause();
  }

  _seek(t) {
    this.expectedSeek = t;
    this.lastTime = t;
    try {
      this.audio.currentTime = t;
    } catch {}
  }

  _load(index, offset) {
    const changed = index !== this.index;
    this.index = index;
    const a = this.audio;
    if (!a.src || a.src !== this.urls[index]) {
      a.src = this.urls[index];
      a.defaultPlaybackRate = this.rate;
      a.playbackRate = this.rate;
    }
    // Before metadata loads this sets the start position; browsers apply it on load.
    this._seek(offset);
    if (changed) this.onTrackChange(index);
  }

  async _play() {
    if (!this.active) return;
    try {
      await this.audio.play();
    } catch (err) {
      if (err && err.name === 'NotAllowedError') this.onNeedsGesture();
    }
  }

  _next() {
    if (!this.active) return;
    if (this.index + 1 < this.tracks.length) {
      this._load(this.index + 1, 0);
      this._play();
    } else {
      this._finish();
    }
  }

  _finish() {
    const wasActive = this.active;
    this.active = false;
    this.audio.pause();
    if (wasActive) this.onEnded();
  }
}

// A short three-note chime for the headphone check.
export function playTestSound(volume = 0.85) {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  const ctx = new Ctx();
  const master = ctx.createGain();
  master.gain.value = Math.max(0.0001, volume) * 0.5;
  master.connect(ctx.destination);
  const notes = [523.25, 659.25, 783.99];
  notes.forEach((freq, i) => {
    const t = ctx.currentTime + i * 0.32;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(1, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + 0.95);
  });
  setTimeout(() => ctx.close(), 2200);
}
