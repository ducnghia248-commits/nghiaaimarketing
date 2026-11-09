"use client";
import confetti from "canvas-confetti";

const COLORS = ["#1369b4", "#f07629", "#22d3ee", "#22c55e", "#ffffff"];

function reduced() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function burst(x = 0.5, y = 0.5, power = 1) {
  if (reduced()) return;
  void confetti({ particleCount: Math.round(70 * power), spread: 75, startVelocity: 38 * power, origin: { x, y }, colors: COLORS, scalar: 0.9, zIndex: 60 });
}

/** Pháo hoa chiến thắng ~2.5 giây. */
export function fireworks(duration = 2500) {
  if (reduced()) return;
  const end = Date.now() + duration;
  const tick = () => {
    void confetti({ particleCount: 14, angle: 60, spread: 70, origin: { x: 0, y: 0.75 }, colors: COLORS, zIndex: 60 });
    void confetti({ particleCount: 14, angle: 120, spread: 70, origin: { x: 1, y: 0.75 }, colors: COLORS, zIndex: 60 });
    if (Math.random() < 0.3)
      void confetti({ particleCount: 60, spread: 360, startVelocity: 28, origin: { x: 0.2 + Math.random() * 0.6, y: 0.2 + Math.random() * 0.3 }, colors: COLORS, zIndex: 60 });
    if (Date.now() < end) requestAnimationFrame(tick);
  };
  tick();
}
