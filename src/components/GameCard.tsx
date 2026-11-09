"use client";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRouter } from "next/navigation";
import { GAME_ROUTES } from "@/lib/games/defs";
import type { PublicGame } from "@/lib/client/types";
import { GameArt } from "./GameArt";
import { Button } from "./ui/Button";

const ACCENT: Record<string, string> = {
  "perfect-stop": "from-fpt-orange/40 via-fpt-blue/20 to-transparent",
  quiz: "from-fpt-blue/50 via-neon/15 to-transparent",
  "find-diff": "from-fpt-green/35 via-fpt-blue/20 to-transparent",
};

/** Thẻ game 3D: nghiêng theo con trỏ, nổi khối, chuyển động nhẹ. */
export function GameCard({ game, index, best }: { game: PublicGame; index: number; best?: { score: number } }) {
  const router = useRouter();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), { stiffness: 200, damping: 18 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-12, 12]), { stiffness: 200, damping: 18 });
  const go = () => router.push(GAME_ROUTES[game.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: 18 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay: 0.1 + index * 0.12, type: "spring", damping: 18 }}
      style={{ perspective: 1000 }}
    >
      <motion.article
        onPointerMove={(e) => {
          if (e.pointerType !== "mouse") return;
          const r = e.currentTarget.getBoundingClientRect();
          mx.set((e.clientX - r.left) / r.width - 0.5);
          my.set((e.clientY - r.top) / r.height - 0.5);
        }}
        onPointerLeave={() => {
          mx.set(0);
          my.set(0);
        }}
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        whileHover={{ y: -6 }}
        className={`glass group relative flex h-full flex-col overflow-hidden rounded-3xl p-5 shadow-[0_30px_60px_-20px_rgba(0,0,0,.6)] ${!game.enabled ? "opacity-60 grayscale" : ""}`}
      >
        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${ACCENT[game.id]}`} />
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-neon/10 blur-2xl transition group-hover:bg-neon/25" />
        <div className="relative flex items-center justify-between text-xs font-bold">
          <span className="rounded-full bg-white/10 px-2.5 py-1 tracking-widest text-white/70">GAME 0{index + 1}</span>
          {best && <span className="rounded-full bg-fpt-green/20 px-2.5 py-1 text-fpt-green">✓ Kỷ lục {best.score}đ</span>}
        </div>
        <div className="relative my-3 flex h-36 items-center justify-center" style={{ transform: "translateZ(40px)" }}>
          {game.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={game.coverUrl} alt="" className="h-full w-auto rounded-xl object-contain" />
          ) : (
            <GameArt id={game.id} className="h-full w-auto drop-shadow-[0_10px_25px_rgba(0,0,0,.45)] transition-transform duration-500 group-hover:scale-110" />
          )}
        </div>
        <div className="relative" style={{ transform: "translateZ(24px)" }}>
          <h3 className="text-2xl font-black tracking-tight">{game.name}</h3>
          <p className="text-sm font-bold text-neon">{game.tagline}</p>
          <p className="mt-2 text-sm leading-relaxed text-white/70">{game.description}</p>
        </div>
        <div className="relative mt-4 grid grid-cols-2 gap-2 text-center text-xs">
          <div className="rounded-xl bg-black/25 px-2 py-2">
            <div className="text-white/50">Thời gian</div>
            <div className="font-extrabold">⏱ {game.estimatedTime}</div>
          </div>
          <div className="rounded-xl bg-black/25 px-2 py-2">
            <div className="text-white/50">Điểm tối đa</div>
            <div className="font-extrabold text-fpt-orange-light">★ {game.maxScore}</div>
          </div>
        </div>
        <div className="relative mt-auto pt-5">
          <Button className="w-full" size="lg" onClick={go} disabled={!game.enabled} variant={index === 1 ? "blue" : "primary"}>
            {game.enabled ? (best ? "CHƠI LẠI" : "BẮT ĐẦU") : "TẠM DỪNG"}
          </Button>
        </div>
      </motion.article>
    </motion.div>
  );
}
