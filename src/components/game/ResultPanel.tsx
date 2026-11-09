"use client";
import { animate, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fmtMs } from "@/lib/client/api";
import { fireworks } from "@/lib/client/confetti";
import { sfx } from "@/lib/client/sound";
import type { GameResult } from "@/lib/client/types";
import { BADGES } from "@/lib/games/defs";
import { LeadForm } from "../LeadForm";
import { NicknameDialog } from "../NicknameDialog";
import { usePlayer } from "../PlayerProvider";
import { Robot } from "../Robot";
import { Button } from "../ui/Button";

/** Màn hình tổng kết sau mỗi lượt chơi. */
export function ResultPanel({ result, onReplay, achievements }: { result: GameResult; onReplay: () => void; achievements: { label: string; value: string }[] }) {
  const router = useRouter();
  const { setPlayer } = usePlayer();
  const [shown, setShown] = useState(0);
  const [leadOpen, setLeadOpen] = useState(false);
  const [nickOpen, setNickOpen] = useState(false);
  const pct = result.maxScore ? result.score / result.maxScore : 0;
  const mood = pct >= 0.7 ? "cheer" : pct >= 0.35 ? "happy" : "think";
  const s = result.summary;

  useEffect(() => {
    setPlayer(result.summary);
    const c = animate(0, result.score, { duration: 1.2, ease: "easeOut", onUpdate: (v) => setShown(Math.round(v)) });
    if (pct >= 0.5 || result.newBadges.length) {
      fireworks(pct >= 0.8 ? 3000 : 1600);
      sfx.win();
    } else sfx.good();
    return () => c.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.sessionId]);

  const title = pct >= 0.8 ? "XUẤT SẮC!" : pct >= 0.5 ? "RẤT TỐT!" : pct >= 0.25 ? "KHÁ LẮM!" : "CỐ LÊN NHÉ!";
  const robotText =
    pct >= 0.8 ? "Đỉnh cao! Bạn đúng là cao thủ công nghệ!" :
    pct >= 0.5 ? "Làm tốt lắm! Thử lại để phá kỷ lục nhé!" :
    pct >= 0.25 ? "Khá lắm! Luyện thêm chút nữa là thành cao thủ!" : "Không sao cả, thử lại lần nữa bạn sẽ làm tốt hơn!";
  const defaultNick = s.nickname.startsWith("Người chơi #");

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <motion.div initial={{ opacity: 0, scale: 0.92, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", damping: 18 }}
        className="glass relative overflow-hidden rounded-3xl p-6 text-center sm:p-8">
        <div className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-64 w-64 rounded-full bg-fpt-orange/25 blur-3xl" />
        <div className="relative flex flex-col items-center">
          <Robot mood={mood} size={104} />
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.25em] text-neon">{result.gameName}</p>
          <h2 className="text-3xl font-black sm:text-4xl">{title}</h2>
          <p className="mt-1 text-sm font-semibold text-white/70">{robotText}</p>
          <div className="mt-4 text-6xl font-black tabular-nums text-gradient sm:text-7xl">{shown}</div>
          <div className="text-sm font-bold text-white/60">/ {result.maxScore} điểm</div>
        </div>

        <div className="relative mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Stat label="Thời gian" value={fmtMs(result.durationMs)} />
          {achievements.map((a) => <Stat key={a.label} {...a} />)}
          <Stat label="Tổng điểm hành trình" value={`${s.totalScore}`} highlight />
          {s.rank && <Stat label="Hạng hiện tại" value={`#${s.rank}`} highlight />}
        </div>

        {result.newBadges.length > 0 && (
          <div className="relative mt-6">
            <p className="mb-2 text-sm font-bold text-fpt-orange-light">Huy hiệu mới!</p>
            <div className="flex flex-wrap justify-center gap-3">
              {result.newBadges.map((b, i) => (
                <motion.div key={b} initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.6 + i * 0.25, type: "spring" }}
                  className="flex items-center gap-2 rounded-2xl border border-fpt-orange/50 bg-fpt-orange/15 px-4 py-2">
                  <span className="text-2xl">{BADGES[b].icon}</span>
                  <span className="text-left">
                    <span className="block text-sm font-black">{BADGES[b].name}</span>
                    <span className="block text-[11px] text-white/60">{BADGES[b].desc}</span>
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {defaultNick && (
          <button onClick={() => setNickOpen(true)} className="relative mt-5 text-sm font-bold text-neon underline-offset-4 hover:underline">
            ✏️ Đặt tên hiển thị để lên bảng xếp hạng
          </button>
        )}

        <div className="relative mt-6 grid gap-2 sm:grid-cols-3">
          <Button onClick={onReplay} size="lg">↻ CHƠI LẠI</Button>
          <Button variant="blue" size="lg" onClick={() => router.push("/play")}>CHƠI GAME KHÁC</Button>
          <Button variant="ghost" size="lg" onClick={() => router.push("/")}>VỀ TRANG CHỦ</Button>
        </div>
        {s.allDone && (
          <Button size="lg" className="relative mt-3 w-full" variant="primary" onClick={() => router.push("/journey")}>
            🏆 XEM TỔNG KẾT HÀNH TRÌNH ({s.completedGames.length}/3)
          </Button>
        )}
        <button onClick={() => setLeadOpen(true)} className="relative mt-5 text-sm font-semibold text-white/70 hover:text-white">
          🎁 Nhận tư vấn & ưu đãi Internet, WiFi, Camera từ FPT →
        </button>
      </motion.div>
      <LeadForm open={leadOpen} onClose={() => setLeadOpen(false)} />
      <NicknameDialog open={nickOpen} onClose={() => setNickOpen(false)} />
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl px-3 py-3 ${highlight ? "bg-fpt-blue/30" : "bg-black/25"}`}>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-white/50">{label}</div>
      <div className="mt-0.5 text-lg font-black">{value}</div>
    </div>
  );
}
