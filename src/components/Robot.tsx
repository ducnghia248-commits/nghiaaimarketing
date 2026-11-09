"use client";
import { AnimatePresence, motion } from "framer-motion";

export type RobotMood = "idle" | "happy" | "cheer" | "think" | "sad" | "wave";

/** Robot AI đồng hành (vector 2D nhẹ, dùng ở mọi màn hình; bản 3D xuất hiện ở Landing/Chiến thắng). */
export function Robot({ mood = "idle", size = 140, className = "" }: { mood?: RobotMood; size?: number; className?: string }) {
  const eyes = (() => {
    switch (mood) {
      case "happy":
      case "cheer":
        return (
          <g stroke="#22d3ee" strokeWidth="5" strokeLinecap="round" fill="none" filter="url(#rb-glow)">
            <path d="M68 74 q8 -10 16 0" />
            <path d="M104 74 q8 -10 16 0" />
          </g>
        );
      case "sad":
        return (
          <g fill="#22d3ee" filter="url(#rb-glow)">
            <rect x="68" y="70" width="16" height="7" rx="3.5" transform="rotate(12 76 73)" />
            <rect x="104" y="70" width="16" height="7" rx="3.5" transform="rotate(-12 112 73)" />
          </g>
        );
      case "think":
        return (
          <g fill="#22d3ee" filter="url(#rb-glow)">
            <rect className="robot-eye" x="70" y="64" width="12" height="16" rx="6" />
            <rect x="105" y="70" width="14" height="6" rx="3" />
          </g>
        );
      default:
        return (
          <g fill="#22d3ee" filter="url(#rb-glow)">
            <rect className="robot-eye" x="70" y="62" width="13" height="19" rx="6.5" />
            <rect className="robot-eye" x="105" y="62" width="13" height="19" rx="6.5" />
          </g>
        );
    }
  })();
  const armWave = mood === "wave" || mood === "cheer";
  return (
    <motion.div
      className={`relative inline-block ${className}`}
      style={{ width: size, height: size * 1.25 }}
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden
    >
      <svg viewBox="0 0 188 235" width="100%" height="100%">
        <defs>
          <linearGradient id="rb-head" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#c9dcff" />
          </linearGradient>
          <linearGradient id="rb-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f3f7ff" />
            <stop offset="1" stopColor="#a9c4f5" />
          </linearGradient>
          <filter id="rb-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <ellipse cx="94" cy="226" rx="46" ry="7" fill="#000" opacity=".3" />
        {/* ăng-ten */}
        <line x1="94" y1="14" x2="94" y2="34" stroke="#94a3b8" strokeWidth="4" />
        <circle cx="94" cy="12" r="9" fill="#f07629" filter="url(#rb-glow)" />
        {/* tay */}
        <motion.g
          style={{ originX: "150px", originY: "150px" }}
          animate={armWave ? { rotate: [0, -38, -8, -38, 0] } : { rotate: 0 }}
          transition={armWave ? { duration: 1.4, repeat: Infinity, repeatDelay: 0.4 } : {}}
        >
          <rect x="146" y="136" width="18" height="52" rx="9" fill="url(#rb-body)" stroke="#7da2e6" strokeWidth="2" transform="rotate(-18 155 150)" />
          <circle cx="166" cy="186" r="10" fill="#1369b4" />
        </motion.g>
        <rect x="24" y="136" width="18" height="52" rx="9" fill="url(#rb-body)" stroke="#7da2e6" strokeWidth="2" transform="rotate(14 33 150)" />
        <circle cx="22" cy="186" r="10" fill="#1369b4" />
        {/* thân */}
        <rect x="42" y="124" width="104" height="92" rx="30" fill="url(#rb-body)" stroke="#7da2e6" strokeWidth="2" />
        <rect x="64" y="146" width="60" height="44" rx="14" fill="#0a1540" />
        <g fill="none" stroke="#22d3ee" strokeLinecap="round" strokeWidth="3.5" filter="url(#rb-glow)">
          <path d="M84 176 q10 -9 20 0" />
          <path d="M78 168 q16 -15 32 0" opacity=".75" />
          <circle cx="94" cy="181" r="2.5" fill="#22d3ee" />
        </g>
        {/* đầu */}
        <rect x="30" y="32" width="128" height="96" rx="38" fill="url(#rb-head)" stroke="#7da2e6" strokeWidth="2" />
        <rect x="46" y="48" width="96" height="58" rx="26" fill="#0a1540" />
        {eyes}
        {(mood === "happy" || mood === "cheer") && <ellipse cx="94" cy="94" rx="9" ry="4" fill="#f07629" opacity=".9" />}
        <circle cx="30" cy="80" r="9" fill="#1369b4" />
        <circle cx="158" cy="80" r="9" fill="#1369b4" />
      </svg>
    </motion.div>
  );
}

/** Robot kèm bong bóng lời thoại. */
export function RobotGuide({
  mood,
  text,
  size = 110,
  side = "right",
  className = "",
}: {
  mood?: RobotMood;
  text?: React.ReactNode;
  size?: number;
  side?: "left" | "right";
  className?: string;
}) {
  return (
    <div className={`flex items-end gap-2 ${side === "left" ? "flex-row-reverse" : ""} ${className}`}>
      <Robot mood={mood} size={size} />
      <AnimatePresence mode="wait">
        {text && (
          <motion.div
            key={typeof text === "string" ? text : "node"}
            initial={{ opacity: 0, y: 8, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            className={`glass relative mb-10 max-w-[260px] rounded-2xl sm:max-w-[420px] px-4 py-3 text-sm font-semibold leading-snug text-white shadow-xl ${
              side === "left" ? "rounded-br-sm" : "rounded-bl-sm"
            }`}
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
