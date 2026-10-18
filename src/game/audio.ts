import type { Color } from './colors';

// Notes of an A-major chord (A4, C#5, E5, A5) – any combination sounds harmonious
const FREQUENCIES: Record<Color, number> = {
  green: 880,
  red: 659.25,
  yellow: 554.37,
  blue: 440,
};

const ATTACK_S = 0.02;
const RELEASE_S = 0.12;
const VOLUME = 0.18;

type Voice = { oscs: OscillatorNode[]; gain: GainNode; stopped: boolean };

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
const voices = new Set<Voice>();

function getContextClass(): typeof AudioContext | undefined {
  const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
  return w.AudioContext ?? w.webkitAudioContext;
}

// Soft bell-like voice: sine fundamental + quiet octave overtone through a low-pass filter
function startVoice(freq: number, at = 0, volume = VOLUME): Voice | null {
  if (!ctx || !master) return null;
  const start = ctx.currentTime + at;
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 2800;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + ATTACK_S);
  // Gentle natural decay while held, so long presses don't drone
  gain.gain.setTargetAtTime(volume * 0.55, start + ATTACK_S, 0.35);
  filter.connect(gain).connect(master);

  const oscs = [
    { type: 'sine' as const, mult: 1, level: 1 },
    { type: 'sine' as const, mult: 2, level: 0.18 },
  ].map(({ type, mult, level }) => {
    const osc = ctx!.createOscillator();
    const partial = ctx!.createGain();
    osc.type = type;
    osc.frequency.value = freq * mult;
    partial.gain.value = level;
    osc.connect(partial).connect(filter);
    osc.start(start);
    return osc;
  });

  const voice: Voice = { oscs, gain, stopped: false };
  voices.add(voice);
  oscs[0].onended = () => {
    voices.delete(voice);
    gain.disconnect();
  };
  return voice;
}

function stopVoice(voice: Voice, at = 0) {
  if (!ctx || voice.stopped) return;
  voice.stopped = true;
  const end = ctx.currentTime + Math.max(at, 0);
  try {
    voice.gain.gain.cancelScheduledValues(end);
    voice.gain.gain.setTargetAtTime(0, end, RELEASE_S / 3);
    voice.oscs.forEach((o) => o.stop(end + RELEASE_S * 2));
  } catch {
    // Already stopped
  }
}

function playNotes(notes: { freq: number; at: number; dur: number }[], volume = VOLUME) {
  for (const n of notes) {
    const v = startVoice(n.freq, n.at, volume);
    if (v) stopVoice(v, n.at + n.dur);
  }
}

export const audio = {
  // Must be called from a user gesture (Start / Play again) to satisfy autoplay policies
  async unlock(): Promise<void> {
    const Ctx = getContextClass();
    if (!Ctx) throw new Error('Web Audio is not supported');
    if (!ctx) {
      ctx = new Ctx();
      master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination);
    }
    if (ctx.state !== 'running') await ctx.resume();
    if (ctx.state !== 'running') throw new Error('AudioContext did not start');
  },

  // Returns a stop function; when durationMs is given the tone also stops by itself
  playTone(color: Color, durationMs?: number): () => void {
    const voice = startVoice(FREQUENCIES[color]);
    if (!voice) return () => {};
    if (durationMs !== undefined) stopVoice(voice, durationMs / 1000 - RELEASE_S);
    return () => stopVoice(voice);
  },

  // Bright rising major arpeggio ending on a held chord
  playWin() {
    const arpeggio = [523.25, 659.25, 783.99, 1046.5];
    playNotes(arpeggio.map((freq, i) => ({ freq, at: i * 0.12, dur: 0.18 })));
    playNotes(
      [523.25, 659.25, 783.99, 1046.5].map((freq) => ({ freq, at: 0.5, dur: 0.9 })),
      VOLUME * 0.45,
    );
  },

  // Soft descending minor phrase – clear "game over" without a harsh buzz
  playLoss() {
    playNotes([
      { freq: 392, at: 0, dur: 0.22 },
      { freq: 329.63, at: 0.24, dur: 0.22 },
      { freq: 261.63, at: 0.48, dur: 0.22 },
      { freq: 196, at: 0.72, dur: 0.7 },
    ]);
  },

  stopAll() {
    for (const v of voices) stopVoice(v);
  },
};
