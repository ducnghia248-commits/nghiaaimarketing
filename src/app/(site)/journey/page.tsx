"use client";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { GameArt } from "@/components/GameArt";
import { LeadForm } from "@/components/LeadForm";
import { usePlayer } from "@/components/PlayerProvider";
import { RobotGuide } from "@/components/Robot";
import { Hero } from "@/components/three/Hero";
import { Button } from "@/components/ui/Button";
import { fireworks } from "@/lib/client/confetti";
import { sfx } from "@/lib/client/sound";
import { BADGES, GAME_ROUTES, type BadgeId } from "@/lib/games/defs";

/** Màn hình tổng kết toàn bộ hành trình 3 game. */
export default function JourneyPage() {
  const router = useRouter();
  const { player, games, branding, loaded, refresh } = usePlayer();
  const [leadOpen, setLeadOpen] = useState(false);
  const celebrated = useRef(false);

  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    if (player?.allDone && !celebrated.current) {
      celebrated.current = true;
      setTimeout(() => {
        fireworks(3500);
        sfx.win();
      }, 400);
    }
  }, [player?.allDone]);

  if (!loaded) return <div className="grid min-h-[60vh] place-items-center text-white/60">Đang tải…</div>;

  const enabled = games.filter((g) => g.enabled);
  const maxTotal = enabled.reduce((s, g) => s + g.maxScore, 0);

  return (
    <section className="mx-auto max-w-5xl px-4 pb-16 pt-4">
      <div className="grid items-center gap-4 md:grid-cols-[1.1fr_1fr]">
        <div className="text-center md:text-left">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-neon">Tổng kết hành trình</p>
          <h1 className="mt-1 text-4xl font-black sm:text-5xl">
            {player?.allDone ? <span className="text-gradient">NHÀ VÔ ĐỊCH FPT!</span> : "Hành trình của bạn"}
          </h1>
          <p className="mt-2 text-white/70">
            {player?.allDone ? "Bạn đã chinh phục cả 3 thử thách công nghệ. Xin chúc mừng!" : `Hoàn thành ${player?.completedGames.length ?? 0}/${enabled.length} game. Chinh phục nốt để nhận huy hiệu Nhà vô địch!`}
          </p>
          <div className="mt-6 inline-flex items-end gap-6 rounded-3xl bg-black/25 px-6 py-4">
            <div>
              <div className="text-xs font-bold uppercase text-white/50">Tổng điểm</div>
              <div className="text-5xl font-black tabular-nums text-fpt-orange-light">{player?.totalScore ?? 0}</div>
              <div className="text-xs text-white/50">/ {maxTotal}</div>
            </div>
            {player?.rank && (
              <div>
                <div className="text-xs font-bold uppercase text-white/50">Xếp hạng</div>
                <div className="text-5xl font-black text-neon">#{player.rank}</div>
              </div>
            )}
          </div>
        </div>
        <div className="relative h-[300px] sm:h-[360px]">
          <Hero modelUrl={branding.heroModelUrl} compact />
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {enabled.map((g, i) => {
          const b = player?.bests[g.id];
          return (
            <motion.div key={g.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 * i }}
              className={`glass rounded-3xl p-5 ${b ? "" : "opacity-70"}`}>
              <GameArt id={g.id} className="mx-auto h-20" />
              <h3 className="mt-2 text-center text-lg font-black">{g.name}</h3>
              {b ? (
                <>
                  <div className="mt-2 text-center text-3xl font-black text-fpt-orange-light">{b.score}<span className="text-sm text-white/50"> / {b.maxScore}</span></div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-neon to-fpt-orange" style={{ width: `${(100 * b.score) / Math.max(1, b.maxScore)}%` }} />
                  </div>
                  <div className="mt-1 text-center text-xs text-white/50">{b.plays} lượt chơi</div>
                </>
              ) : (
                <div className="mt-3 text-center">
                  <Button size="sm" onClick={() => router.push(GAME_ROUTES[g.id])}>CHƠI NGAY</Button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <h2 className="mt-10 text-xl font-black">Bộ sưu tập huy hiệu</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {(Object.keys(BADGES) as BadgeId[]).map((id, i) => {
          const has = player?.badges.includes(id);
          return (
            <motion.div key={id} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 + i * 0.08 }}
              className={`rounded-2xl border p-4 text-center ${has ? "border-fpt-orange/60 bg-fpt-orange/15" : "border-white/10 bg-white/5 grayscale"}`}>
              <div className={`text-4xl ${has ? "" : "opacity-30"}`}>{BADGES[id].icon}</div>
              <div className="mt-1 text-sm font-black">{BADGES[id].name}</div>
              <div className="text-[11px] text-white/55">{BADGES[id].desc}</div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-10 flex flex-col items-center gap-4">
        <RobotGuide mood={player?.allDone ? "cheer" : "happy"} size={80} text={player?.allDone ? "Đừng quên để lại thông tin để nhận ưu đãi từ FPT nhé! 🎁" : "Mỗi game có thể chơi lại để phá kỷ lục!"} />
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={() => setLeadOpen(true)}>🎁 NHẬN TƯ VẤN & ƯU ĐÃI</Button>
          <Button variant="blue" onClick={() => router.push("/leaderboard")}>🏅 BẢNG XẾP HẠNG</Button>
          <Button variant="ghost" onClick={() => router.push("/play")}>CHƠI TIẾP</Button>
          <Button variant="ghost" onClick={() => router.push("/")}>VỀ TRANG CHỦ</Button>
        </div>
      </div>
      <LeadForm open={leadOpen} onClose={() => setLeadOpen(false)} />
    </section>
  );
}
