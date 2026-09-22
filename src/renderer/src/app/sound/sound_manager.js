// ============================================================
// SoundManager — WebAudio 実装 (pure js / Vue 非依存。tricy から移植、xqueens のループ点と世代カウンタを合わせた)
//   playSe(key, tone)   効果音。tone は半音 x2 単位のデチューン
//   playBgm(key)        BGM 切替。未ロードならロード完了後に再生。null で停止
//   setVolumes({master, bgm, se})  音量 (永続化は session ストアの options が担う)
// ============================================================
import MASTER from "./sound_master.js";

const SE_THROTTLE_MS = 50;

class SoundManager {
  constructor() {
    this.context = null;
    this.buffers = { se: {}, bgm: {} };
    this.volumes = { master: 0.4, bgm: 0.7, se: 0.7 };
    this.muted = false;
    this.bgmSource = null;
    this.bgmGain = null;
    this.currentBgmKey = null;
    this.bgmGeneration = 0;
    this.lastPlayedAt = {};
    this.base = "assets/sounds/";
  }

  ensureContext() {
    if (!this.context) this.context = new AudioContext();
    if (this.context.state === "suspended") this.context.resume();
    return this.context;
  }

  async loadAll() {
    const jobs = [];
    for (const key of Object.keys(MASTER.se)) jobs.push(this.load("se", key));
    for (const [key, entry] of Object.entries(MASTER.bgm)) if (!entry.delayed) jobs.push(this.load("bgm", key));
    await Promise.allSettled(jobs);
  }

  async load(group, key) {
    if (this.buffers[group][key]) return this.buffers[group][key];
    const entry = MASTER[group][key];
    if (!entry) {
      console.warn(`[sound] undefined ${group} key: ${key}`);
      return null;
    }
    try {
      const res = await fetch(`${this.base}${entry.file}`);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = await res.arrayBuffer();
      const buffer = await this.ensureContext().decodeAudioData(data);
      this.buffers[group][key] = buffer;
      return buffer;
    } catch (e) {
      console.warn(`[sound] failed to load ${group}/${key}:`, e.message);
      return null;
    }
  }

  get seVolume() {
    return this.muted ? 0 : this.volumes.master * this.volumes.se;
  }
  get bgmVolume() {
    return this.muted ? 0 : this.volumes.master * this.volumes.bgm;
  }

  playSe(key, tone = 0) {
    const entry = MASTER.se[key];
    if (!entry) {
      console.warn(`[sound] undefined se key: ${key}`);
      return;
    }
    const buffer = this.buffers.se[key];
    if (!buffer) return;
    const now = Date.now();
    if (this.lastPlayedAt[key] && now - this.lastPlayedAt[key] < SE_THROTTLE_MS) return;
    this.lastPlayedAt[key] = now;
    const ctx = this.ensureContext();
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    source.detune.value = tone * 200;
    gain.gain.value = this.seVolume * entry.volume;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(0);
  }

  async playBgm(key) {
    if (key === this.currentBgmKey) return;
    const generation = ++this.bgmGeneration;
    this.stopBgm();
    if (key == null || key === "") return;
    const entry = MASTER.bgm[key];
    if (!entry) {
      console.warn(`[sound] undefined bgm key: ${key}`);
      return;
    }
    const buffer = await this.load("bgm", key);
    if (!buffer || generation !== this.bgmGeneration) return;
    const ctx = this.ensureContext();
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    source.loop = entry.loop !== false;
    if (source.loop && Number.isFinite(entry.sampleRate) && Number.isFinite(entry.loopStartSamples) && Number.isFinite(entry.loopLengthSamples)) {
      source.loopStart = entry.loopStartSamples / entry.sampleRate;
      source.loopEnd = (entry.loopStartSamples + entry.loopLengthSamples) / entry.sampleRate;
    }
    gain.gain.value = this.bgmVolume * entry.volume;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(0);
    this.bgmSource = source;
    this.bgmGain = gain;
    this.currentBgmKey = key;
  }

  stopBgm() {
    if (this.bgmSource) {
      try {
        this.bgmSource.stop();
      } catch (e) {
        /* 既に停止済み */
      }
    }
    this.bgmSource = null;
    this.bgmGain = null;
    this.currentBgmKey = null;
  }

  setVolumes(volumes) {
    Object.assign(this.volumes, volumes);
    this.syncBgmVolume();
  }

  setMuted(muted) {
    this.muted = muted;
    this.syncBgmVolume();
  }

  syncBgmVolume() {
    if (this.bgmGain && this.currentBgmKey) this.bgmGain.gain.value = this.bgmVolume * MASTER.bgm[this.currentBgmKey].volume;
  }
}

export default new SoundManager();
