// Tiny Web Audio "arcade SFX" engine — no asset files, runs on first user gesture.
// Mute state persists in localStorage. Safe to call from event handlers only.

const MUTE_KEY = "shred:mute";

let ctx: AudioContext | null = null;
let muted = false;
let initialized = false;

function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!initialized) {
    try {
      muted = localStorage.getItem(MUTE_KEY) === "1";
    } catch {
      // ignore
    }
    initialized = true;
  }
  if (muted) return null;
  if (!ctx) {
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

export function isMuted(): boolean {
  if (typeof window === "undefined") return false;
  if (!initialized) {
    try {
      muted = localStorage.getItem(MUTE_KEY) === "1";
    } catch {
      // ignore
    }
    initialized = true;
  }
  return muted;
}

export function setMuted(next: boolean): void {
  muted = next;
  initialized = true;
  try {
    localStorage.setItem(MUTE_KEY, next ? "1" : "0");
  } catch {
    // ignore
  }
}

type ToneOptions = {
  freq: number;
  endFreq?: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
  delay?: number;
};

function tone(opts: ToneOptions) {
  const ac = ensure();
  if (!ac) return;
  const t0 = ac.currentTime + (opts.delay ?? 0);
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = opts.type ?? "sine";
  osc.frequency.setValueAtTime(opts.freq, t0);
  if (opts.endFreq) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, opts.endFreq), t0 + opts.duration);
  }
  const peak = (opts.gain ?? 0.18);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + opts.duration + 0.02);
}

function noise(duration: number, gainPeak = 0.22, lowpass = 1800, delay = 0) {
  const ac = ensure();
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const length = Math.floor(ac.sampleRate * duration);
  const buf = ac.createBuffer(1, length, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = lowpass;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(gainPeak, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start(t0);
  src.stop(t0 + duration + 0.02);
}

export const sfx = {
  hover() {
    tone({ freq: 720, endFreq: 920, duration: 0.07, type: "triangle", gain: 0.06 });
  },
  click() {
    tone({ freq: 520, endFreq: 880, duration: 0.09, type: "square", gain: 0.1 });
  },
  navTap() {
    tone({ freq: 440, endFreq: 660, duration: 0.08, type: "triangle", gain: 0.08 });
  },
  packSelect() {
    tone({ freq: 380, endFreq: 760, duration: 0.18, type: "sawtooth", gain: 0.12 });
    tone({ freq: 720, endFreq: 1140, duration: 0.18, type: "triangle", gain: 0.08, delay: 0.04 });
  },
  rip() {
    noise(0.55, 0.32, 2400);
    noise(0.35, 0.22, 900, 0.18);
  },
  explosion() {
    noise(0.7, 0.5, 600);
    tone({ freq: 180, endFreq: 60, duration: 0.7, type: "sawtooth", gain: 0.22 });
    tone({ freq: 90, endFreq: 50, duration: 0.9, type: "square", gain: 0.18, delay: 0.05 });
  },
  reveal() {
    [0, 0.08, 0.16].forEach((d, i) => tone({ freq: 660 + i * 220, endFreq: 1100 + i * 220, duration: 0.18, type: "triangle", gain: 0.14, delay: d }));
  },
  rareReveal() {
    [0, 0.1, 0.22, 0.34].forEach((d, i) => tone({ freq: 740 + i * 180, duration: 0.22, type: "sine", gain: 0.16, delay: d }));
    noise(0.4, 0.18, 4200, 0.3);
  },
  coin() {
    tone({ freq: 988, duration: 0.08, type: "square", gain: 0.14 });
    tone({ freq: 1318, duration: 0.12, type: "square", gain: 0.14, delay: 0.07 });
  },
  success() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone({ freq: f, duration: 0.22, type: "triangle", gain: 0.16, delay: i * 0.09 }));
  },
  chest() {
    noise(0.18, 0.25, 1200);
    tone({ freq: 220, endFreq: 880, duration: 0.45, type: "sawtooth", gain: 0.2, delay: 0.05 });
    [880, 1108, 1318, 1760].forEach((f, i) => tone({ freq: f, duration: 0.18, type: "triangle", gain: 0.14, delay: 0.18 + i * 0.07 }));
  },
  error() {
    tone({ freq: 220, endFreq: 110, duration: 0.32, type: "sawtooth", gain: 0.18 });
  },
};

export type SfxName = keyof typeof sfx;
