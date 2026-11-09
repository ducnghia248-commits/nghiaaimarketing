"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GameCard } from "@/components/GameCard";
import { LeadForm } from "@/components/LeadForm";
import { usePlayer } from "@/components/PlayerProvider";
import { RobotGuide } from "@/components/Robot";
import { Button } from "@/components/ui/Button";
import { BADGES } from "@/lib/games/defs";

export default function SelectGame() {
  const { games, player, loaded } = usePlayer();
  const router = useRouter();
  const [leadOpen, setLeadOpen] = useState(false);
  const enabled = games.filter((g) => g.enabled);
  const done = enabled.filter((g) => player?.bests[g.id]).length;

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 pt-6">
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:items-end">
        <div className="text-center md:text-left">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-neon">Chọn thử thách</p>
          <h1 className="mt-1 text-3xl font-black sm:text-4xl">3 trò chơi – 1 hành trình công nghệ</h1>
          <p className="mt-2 text-white/65">Hoàn thành cả 3 game để nhận huy hiệu <b className="text-fpt-orange-light">{BADGES["nha-vo-dich"].name}</b> 🏆</p>
        </div>
        <RobotGuide
          mood={done === enabled.length && done > 0 ? "cheer" : "happy"}
          size={84}
          side="left"
          text={
            done === 0 ? "Chọn một trò chơi bất kỳ để bắt đầu nhé!" :
            done < enabled.length ? `Tuyệt! Bạn đã hoàn thành ${done}/${enabled.length} game. Tiếp tục nào!` :
            "Bạn đã chinh phục tất cả! Xem tổng kết hành trình nhé 🎉"
          }
        />
      </div>

      {enabled.length > 0 && (
        <div className="mx-auto mt-6 max-w-md md:mx-0">
          <div className="mb-1 flex justify-between text-xs font-bold text-white/60">
            <span>Tiến độ hành trình</span>
            <span>{done}/{enabled.length}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-neon to-fpt-orange transition-all duration-700" style={{ width: `${(100 * done) / enabled.length}%` }} />
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {!loaded &&
          [0, 1, 2].map((i) => <div key={i} className="glass h-[480px] animate-pulse rounded-3xl" />)}
        {games.map((g, i) => (
          <GameCard key={g.id} game={g} index={i} best={player?.bests[g.id]} />
        ))}
      </div>

      <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
        {player?.allDone && (
          <Button size="lg" onClick={() => router.push("/journey")}>🏆 TỔNG KẾT HÀNH TRÌNH</Button>
        )}
        <Button variant="ghost" onClick={() => setLeadOpen(true)}>🎁 Nhận tư vấn & ưu đãi</Button>
        <Button variant="ghost" onClick={() => router.push("/leaderboard")}>🏅 Bảng xếp hạng</Button>
      </div>
      <LeadForm open={leadOpen} onClose={() => setLeadOpen(false)} />
    </section>
  );
}
