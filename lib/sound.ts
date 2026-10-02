const KEY = "qw.sound";

export type SoundKind = "save" | "send" | "publish" | "error";

let context: AudioContext | null = null;
let lastAt: Partial<Record<SoundKind, number>> = {};

function choice(): "0" | "1" | null {
  const value = window.localStorage.getItem(KEY);
  return value === "0" || value === "1" ? value : null;
}

export function soundOn() {
  if (typeof window === "undefined") return false;
  const stored = choice();
  if (stored === "0") return false;
  if (stored === "1") return true;
  return window.matchMedia("(pointer: coarse)").matches;
}

export function setSoundOn(on: boolean) {
  window.localStorage.setItem(KEY, on ? "1" : "0");
}

function tone(audio: AudioContext, start: number, frequency: number, length: number, gainValue: number, type: OscillatorType) {
  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
  const oscillator = audio.createOscillator();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start(start);
  oscillator.stop(start + length + 0.02);
}

export function play(kind: SoundKind) {
  if (!soundOn()) return;
  const nowMs = Date.now();
  const wait = kind === "save" ? 1500 : 400;
  if (nowMs - (lastAt[kind] ?? 0) < wait) return;
  lastAt[kind] = nowMs;
  const AudioCtx = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;
  context ??= new AudioCtx();
  if (context.state === "suspended") void context.resume();
  const now = context.currentTime;
  if (kind === "save") tone(context, now, 520, 0.08, 0.045, "sine");
  if (kind === "error") tone(context, now, 140, 0.07, 0.05, "triangle");
  if (kind === "send") {
    tone(context, now, 640, 0.12, 0.03, "sine");
    tone(context, now + 0.04, 320, 0.1, 0.02, "sine");
  }
  if (kind === "publish") {
    tone(context, now, 523, 0.16, 0.04, "sine");
    tone(context, now + 0.08, 784, 0.18, 0.03, "sine");
  }
}
