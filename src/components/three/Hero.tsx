"use client";
import dynamic from "next/dynamic";
import { Component, useEffect, useState } from "react";
import { Robot } from "../Robot";

const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false, loading: () => <HeroFallback pulse /> });

/** Hình minh họa thay thế khi thiết bị không hỗ trợ WebGL / yêu cầu giảm chuyển động. */
export function HeroFallback({ pulse, showRobot = true }: { pulse?: boolean; showRobot?: boolean }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div className="relative">
        <span className="absolute inset-0 m-auto h-44 w-44 rounded-full border-2 border-neon/60 animate-pulse-ring" />
        <svg viewBox="0 0 240 170" className={`relative w-64 drop-shadow-[0_0_30px_rgba(34,211,238,.45)] ${pulse ? "animate-pulse" : "animate-float"}`} aria-hidden>
          <g fill="none" stroke="#22d3ee" strokeWidth="7" strokeLinecap="round">
            <path d="M95 40 q25 -22 50 0" />
            <path d="M80 26 q40 -36 80 0" opacity=".6" />
          </g>
          <rect x="62" y="56" width="10" height="56" rx="5" fill="#1f2a44" transform="rotate(-10 67 110)" />
          <rect x="168" y="56" width="10" height="56" rx="5" fill="#1f2a44" transform="rotate(10 173 110)" />
          <rect x="30" y="100" width="180" height="46" rx="16" fill="#f4f7fc" />
          <rect x="44" y="128" width="152" height="5" rx="2.5" fill="#1369b4" />
          <circle cx="160" cy="116" r="4" fill="#22c55e" />
          <circle cx="174" cy="116" r="4" fill="#22d3ee" />
          <circle cx="188" cy="116" r="4" fill="#22d3ee" />
        </svg>
      </div>
      {showRobot && (
        <div className="absolute bottom-2 left-2 sm:left-8">
          <Robot mood="wave" size={92} />
        </div>
      )}
    </div>
  );
}

class GLBoundary extends Component<{ children: React.ReactNode; fallback: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function canUse3D() {
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function Hero({ modelUrl, showRobot = true, compact }: { modelUrl?: string | null; showRobot?: boolean; compact?: boolean }) {
  const [mode, setMode] = useState<"pending" | "3d" | "2d">("pending");
  useEffect(() => setMode(canUse3D() ? "3d" : "2d"), []);
  if (mode === "pending") return <HeroFallback pulse showRobot={showRobot} />;
  if (mode === "2d") return <HeroFallback showRobot={showRobot} />;
  return (
    <GLBoundary fallback={<HeroFallback showRobot={showRobot} />}>
      <HeroScene modelUrl={modelUrl} showRobot={showRobot} compact={compact} />
    </GLBoundary>
  );
}
