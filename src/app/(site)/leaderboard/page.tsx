"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { usePlayer } from "@/components/PlayerProvider";
import { Robot } from "@/components/Robot";
import { api } from "@/lib/client/api";

type Entry = { rank: number; nickname: string; total: number; games: number; isMe: boolean };
const PERIODS = [
  { id: "day", label: "Hôm nay" },
  { id: "week", label: "Tuần này" },
  { id: "all", label: "Tất cả" },
];

export default function LeaderboardPage() {
  const { player } = usePlayer();
  const [period, setPeriod] = useState("week");
  const [campaign, setCampaign] = useState("");
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [campaigns, setCampaigns] = useState<{ code: string; name: string }[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    setEntries(null);
    const qs = new URLSearchParams({ period, ...(campaign ? { campaign } : {}) });
    api<{ entries: Entry[]; campaigns: { code: string; name: string }[] }>(`/api/leaderboard?${qs}`)
      .then((r) => {
        setEntries(r.entries);
        setCampaigns(r.campaigns);
      })
      .catch((e) => setError(e.message));
  }, [period, campaign]);

  const podium = entries?.slice(0, 3) ?? [];
  const order = [1, 0, 2].map((i) => podium[i]).filter(Boolean);

  return (
    <section className="mx-auto max-w-3xl px-4 pb-16 pt-6">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-neon">Bảng xếp hạng</p>
        <h1 className="mt-1 text-3xl font-black sm:text-4xl">Top cao thủ PLAY & WIN</h1>
        <p className="mt-2 text-sm text-white/60">Xếp hạng theo tổng điểm cao nhất của 3 game. Chỉ hiển thị tên hiển thị — không công khai dữ liệu cá nhân.</p>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {PERIODS.map((p) => (
          <button key={p.id} onClick={() => setPeriod(p.id)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${period === p.id ? "bg-fpt-blue text-white blue-glow" : "glass text-white/70 hover:text-white"}`}>
            {p.label}
          </button>
        ))}
        {campaigns.length > 0 && (
          <select value={campaign} onChange={(e) => setCampaign(e.target.value)} className="glass rounded-full px-4 py-2 text-sm font-bold [&>option]:text-black">
            <option value="">Mọi chiến dịch</option>
            {campaigns.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        )}
      </div>

      {error && <p className="mt-6 text-center text-rose-300">{error}</p>}
      {!entries && !error && <div className="glass mt-8 h-64 animate-pulse rounded-3xl" />}
      {entries && entries.length === 0 && (
        <div className="mt-10 flex flex-col items-center gap-3 text-center text-white/70">
          <Robot mood="think" size={110} />
          Chưa có ai trên bảng xếp hạng trong khoảng thời gian này. Hãy là người đầu tiên!
        </div>
      )}

      {entries && entries.length > 0 && (
        <>
          <div className="mt-10 flex items-end justify-center gap-3">
            {order.map((e) => {
              const h = e.rank === 1 ? "h-36" : e.rank === 2 ? "h-28" : "h-20";
              const c = e.rank === 1 ? "from-yellow-300 to-fpt-orange" : e.rank === 2 ? "from-slate-200 to-slate-400" : "from-amber-600 to-amber-800";
              return (
                <motion.div key={e.rank} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 * e.rank }} className="flex w-28 flex-col items-center sm:w-36">
                  <div className="text-3xl">{["🥇", "🥈", "🥉"][e.rank - 1]}</div>
                  <div className={`mt-1 w-full truncate text-center text-sm font-black ${e.isMe ? "text-neon" : ""}`}>{e.nickname}</div>
                  <div className="text-xs font-bold text-fpt-orange-light">{e.total}đ</div>
                  <div className={`mt-2 w-full rounded-t-2xl bg-gradient-to-b ${c} ${h} grid place-items-start justify-center pt-2 text-2xl font-black text-ink/80`}>{e.rank}</div>
                </motion.div>
              );
            })}
          </div>
          <ol className="glass mt-0 divide-y divide-white/5 overflow-hidden rounded-3xl">
            {entries.slice(3).map((e) => (
              <li key={e.rank} className={`flex items-center gap-3 px-4 py-3 ${e.isMe ? "bg-neon/10" : ""}`}>
                <span className="w-8 text-center font-black text-white/50">{e.rank}</span>
                <span className="flex-1 truncate font-bold">{e.nickname}{e.isMe && <span className="ml-2 text-xs text-neon">(bạn)</span>}</span>
                <span className="text-xs text-white/50">{e.games}/3 game</span>
                <span className="w-16 text-right font-black text-fpt-orange-light">{e.total}</span>
              </li>
            ))}
          </ol>
          {player?.rank && !entries.some((e) => e.isMe) && (
            <p className="mt-4 text-center text-sm text-white/70">Hạng toàn thời gian của bạn: <b className="text-neon">#{player.rank}</b> · {player.totalScore} điểm</p>
          )}
        </>
      )}
    </section>
  );
}
