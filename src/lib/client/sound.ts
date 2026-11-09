"use client";
/** Âm thanh tổng hợp bằng WebAudio (không cần file âm thanh), có thể bật/tắt — lưu lựa chọn trên trình duyệt. */
import { useSyncExternalStore } from "react";

const KEY = "pw_sound";
let enabled = true;
let ctx: AudioContext | null = null;
const listeners = new Set<() => void>();

if (typeof window !== "undefined") {
  try {
    enabled = localStorage.getItem(KEY) !== "off";
  } catch {}
}

export function setSound(on: boolean) {
  enabled = on;
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {}
  listeners.forEach((l) => l());
}

export function useSoundEnabled() {
  return useSyncExternalStore(
    (cb) => (listeners.add(cb), () => listeners.delete(cb)),
    () => enabled,
    () => true,
  );
}

function ac() {
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.12, delay = 0, slideTo?: number) {
  if (!enabled || typeof window === "undefined") return;
  const a = ac();
  if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

export const sfx = {
  click: () => tone(660, 0.08, "triangle", 0.08),
  tick: () => tone(1200, 0.04, "square", 0.03),
  start: () => [523, 659, 784].forEach((f, i) => tone(f, 0.14, "triangle", 0.1, i * 0.09)),
  stop: () => tone(220, 0.18, "sawtooth", 0.08, 0, 110),
  good: () => [660, 880].forEach((f, i) => tone(f, 0.16, "triangle", 0.11, i * 0.08)),
  perfect: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.22, "triangle", 0.12, i * 0.08)),
  wrong: () => tone(180, 0.25, "square", 0.07, 0, 120),
  win: () => [523, 659, 784, 1046, 784, 1046].forEach((f, i) => tone(f, 0.2, "triangle", 0.12, i * 0.11)),
};

export function vibrate(ms: number | number[]) {
  try {
    navigator.vibrate?.(ms);
  } catch {}
}
