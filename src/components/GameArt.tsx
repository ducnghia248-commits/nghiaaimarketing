import type { GameId } from "@/lib/games/defs";

/** Minh họa đại diện cho từng game (vector, phong cách riêng nhưng cùng hệ màu FPT). */
export function GameArt({ id, className = "" }: { id: GameId; className?: string }) {
  if (id === "perfect-stop")
    return (
      <svg viewBox="0 0 200 140" className={className} aria-hidden>
        <defs>
          <radialGradient id="ga-ps" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#22d3ee" stopOpacity=".35" />
            <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="70" r="66" fill="url(#ga-ps)" />
        <circle cx="100" cy="70" r="48" fill="none" stroke="#1e3a8a" strokeWidth="12" />
        <path d="M100 22 A48 48 0 0 1 138 40" fill="none" stroke="#f07629" strokeWidth="12" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 6px #f07629)" }} />
        <g style={{ transformOrigin: "100px 70px", animation: "spin 2.4s linear infinite" }}>
          <line x1="100" y1="70" x2="100" y2="16" stroke="#22d3ee" strokeWidth="5" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 6px #22d3ee)" }} />
        </g>
        <circle cx="100" cy="70" r="9" fill="#fff" />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </svg>
    );
  if (id === "quiz")
    return (
      <svg viewBox="0 0 200 140" className={className} aria-hidden>
        <rect x="40" y="18" width="120" height="34" rx="10" fill="#1369b4" />
        <text x="100" y="41" textAnchor="middle" fontSize="18" fontWeight="900" fill="#fff">? ? ?</text>
        {["A", "B", "C", "D"].map((l, i) => (
          <g key={l} transform={`translate(${i % 2 ? 104 : 36} ${62 + Math.floor(i / 2) * 36})`}>
            <rect width="60" height="28" rx="8" fill={i === 0 ? "#22c55e" : "rgba(255,255,255,.12)"} stroke="rgba(255,255,255,.3)" />
            <circle cx="14" cy="14" r="8" fill={i === 0 ? "#fff" : "#22d3ee"} />
            <text x="14" y="18" textAnchor="middle" fontSize="10" fontWeight="900" fill={i === 0 ? "#16a34a" : "#0a1540"}>{l}</text>
            <rect x="28" y="11" width="24" height="5" rx="2.5" fill="#fff" opacity=".7" />
          </g>
        ))}
      </svg>
    );
  return (
    <svg viewBox="0 0 200 140" className={className} aria-hidden>
      {[18, 104].map((x, i) => (
        <g key={x} transform={`translate(${x} 22)`}>
          <rect width="78" height="96" rx="8" fill="#eaf2ff" stroke="#22d3ee" strokeWidth="2" />
          <rect x="8" y="58" width="62" height="30" rx="4" fill="#355c9a" />
          <rect x="14" y="14" width="30" height="24" rx="3" fill="#7cc8ff" />
          <circle cx="58" cy="24" r="8" fill={i ? "#22c55e" : "#f07629"} />
          <rect x="44" y="44" width="24" height="8" rx="3" fill="#f5f7fb" stroke="#94a3b8" />
        </g>
      ))}
      <circle cx="162" cy="46" r="14" fill="none" stroke="#f07629" strokeWidth="3.5" style={{ filter: "drop-shadow(0 0 5px #f07629)" }} />
    </svg>
  );
}
