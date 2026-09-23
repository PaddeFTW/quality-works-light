const KEY = "qw.sound";

export function soundOn() {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  return window.localStorage.getItem(KEY) !== "0";
}

export function setSoundOn(on: boolean) {
  window.localStorage.setItem(KEY, on ? "1" : "0");
}

export function playSoft() {
  if (!soundOn()) return;
  const audio = new AudioContext();
  const now = audio.currentTime;
  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.03, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
  const tone = audio.createOscillator();
  tone.type = "sine";
  tone.frequency.setValueAtTime(660, now);
  tone.frequency.exponentialRampToValueAtTime(440, now + 0.08);
  tone.connect(gain);
  gain.connect(audio.destination);
  tone.start(now);
  tone.stop(now + 0.1);
  window.setTimeout(() => void audio.close(), 200);
}
