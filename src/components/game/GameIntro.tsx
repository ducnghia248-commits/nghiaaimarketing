"use client";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import type { PublicGame } from "@/lib/client/types";
import type { GameId } from "@/lib/games/defs";
import { GameArt } from "../GameArt";
import { RobotGuide } from "../Robot";
import { Button } from "../ui/Button";

/** Màn hình hướng dẫn luật chơi trước khi bắt đầu. */
export function GameIntro({
  id, game, onStart, busy, error, robotText,
}: { id: GameId; game?: PublicGame; onStart: () => void; busy?: boolean; error?: string; robotText: string }) {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass relative overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-60 w-60 rounded-full bg-fpt-blue/30 blur-3xl" />
        <div className="relative grid items-center gap-6 sm:grid-cols-[1fr_200px]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-neon">Luật chơi</p>
            <h1 className="mt-1 text-3xl font-black sm:text-4xl">{game?.name ?? "…"}</h1>
            <p className="font-bold text-fpt-orange-light">{game?.tagline}</p>
            <ol className="mt-5 space-y-2.5">
              {(game?.rules ?? []).map((r, i) => (
                <li key={i} className="flex gap-3 text-[15px] leading-snug text-white/85">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-fpt-blue text-xs font-black">{i + 1}</span>
                  {r}
                </li>
              ))}
            </ol>
          </div>
          <GameArt id={id} className="mx-auto hidden w-48 sm:block" />
        </div>
        <div className="relative mt-6 flex flex-wrap gap-3 text-sm">
          {game && <span className="rounded-full bg-black/30 px-3 py-1.5 font-bold">⏱ {game.estimatedTime}</span>}
          {game && <span className="rounded-full bg-black/30 px-3 py-1.5 font-bold text-fpt-orange-light">★ Tối đa {game.maxScore} điểm</span>}
        </div>
        {error && <p className="relative mt-4 rounded-xl bg-rose-500/15 px-4 py-3 text-sm font-semibold text-rose-200">{error}</p>}
        <div className="relative mt-6 flex flex-col gap-3 sm:flex-row">
          <Button size="xl" className="sm:flex-1" onClick={onStart} disabled={busy || (game && !game.enabled)}>
            {game && !game.enabled ? "TRÒ CHƠI ĐANG TẠM DỪNG" : busy ? "Đang chuẩn bị…" : "▶ BẮT ĐẦU"}
          </Button>
          <Button variant="ghost" size="lg" onClick={() => router.push("/play")}>← Chọn game khác</Button>
        </div>
      </motion.div>
      <div className="mt-4 flex justify-center sm:justify-start">
        <RobotGuide mood="happy" size={86} text={robotText} />
      </div>
    </div>
  );
}
