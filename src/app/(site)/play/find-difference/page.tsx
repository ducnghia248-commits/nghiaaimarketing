"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { GameIntro } from "@/components/game/GameIntro";
import { ResultPanel } from "@/components/game/ResultPanel";
import { usePlayer } from "@/components/PlayerProvider";
import { RobotGuide } from "@/components/Robot";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/client/api";
import { burst } from "@/lib/client/confetti";
import { sfx, vibrate } from "@/lib/client/sound";
import type { GameResult } from "@/lib/client/types";

type Puzzle = { id: number; title: string; theme: string; leftUrl: string; rightUrl: string; width: number; height: number; total: number };
type Start = { sessionId: string; puzzle: Puzzle; timeLimitSec: number; maxHints: number; maxScore: number };
type Region = { id: string; x: number; y: number; r: number; label: string };
type ClickRes = { hit: Region | null; already?: boolean; found: number; wrong: number; finished: boolean; result?: GameResult };
type Miss = { key: number; x: number; y: number; side: 0 | 1 };

export default function FindDifferencePage() {
  const { games, requireRegistration } = usePlayer();
  const game = games.find((g) => g.id === "find-diff");
  const [phase, setPhase] = useState<"intro" | "playing" | "reveal" | "result">("intro");
  const [session, setSession] = useState<Start | null>(null);
  const [found, setFound] = useState<Region[]>([]);
  const [wrong, setWrong] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hint, setHint] = useState<{ x: number; y: number; r: number } | null>(null);
  const [misses, setMisses] = useState<Miss[]>([]);
  const [secLeft, setSecLeft] = useState(0);
  const [result, setResult] = useState<GameResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const [loadedImgs, setLoadedImgs] = useState(0);
  const deadline = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const sessionRef = useRef<Start | null>(null);
  const finishing = useRef(false);

  const finishWith = useCallback((r: GameResult) => {
    if (timer.current) clearInterval(timer.current);
    setResult(r);
    const d = r.details as { found: number; total: number };
    if (d.found === d.total) {
      setPhase("result");
    } else {
      setPhase("reveal");
      sfx.wrong();
    }
  }, []);

  const finish = useCallback(async () => {
    const s = sessionRef.current;
    if (!s || finishing.current) return;
    finishing.current = true;
    try {
      const r = await api<{ result: GameResult }>("/api/play/action", { sessionId: s.sessionId, action: "finish" });
      finishWith(r.result);
    } catch (e) {
      setError((e as Error).message);
      setPhase("intro");
    }
  }, [finishWith]);

  const start = async () => {
    const qs = new URLSearchParams(window.location.search);
    const isPreview = qs.get("preview") === "1";
    // admin chơi thử không cần đăng ký
    if (!isPreview && !(await requireRegistration())) return;
    setBusy(true);
    setError("");
    try {
      setPreview(isPreview);
      const s = await api<Start>("/api/play/start", {
        gameId: "find-diff",
        ...(isPreview && qs.get("puzzle") ? { preview: true, puzzleId: Number(qs.get("puzzle")) } : {}),
      });
      sessionRef.current = s;
      finishing.current = false;
      setSession(s);
      setFound([]);
      setWrong(0);
      setHintsUsed(0);
      setHint(null);
      setMisses([]);
      setResult(null);
      setLoadedImgs(0);
      setPhase("playing");
      sfx.start();
      deadline.current = performance.now() + s.timeLimitSec * 1000;
      setSecLeft(s.timeLimitSec);
      if (timer.current) clearInterval(timer.current);
      timer.current = setInterval(() => {
        const left = Math.max(0, Math.ceil((deadline.current - performance.now()) / 1000));
        setSecLeft(left);
        if (left <= 10 && left > 0) sfx.tick();
        if (left <= 0) {
          if (timer.current) clearInterval(timer.current);
          void finish();
        }
      }, 250);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  const onPick = (side: 0 | 1) => (e: React.MouseEvent<HTMLDivElement>) => {
    if (phase !== "playing" || !sessionRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const sessionId = sessionRef.current.sessionId;
    // xếp hàng các lần chạm để máy chủ xử lý tuần tự
    queue.current = queue.current.then(async () => {
      if (finishing.current) return;
      try {
        const r = await api<ClickRes>("/api/play/action", { sessionId, action: "click", x, y });
        if (r.hit) {
          setFound((f) => [...f, r.hit!]);
          setHint(null);
          sfx.good();
          vibrate(25);
          burst(e.clientX / window.innerWidth, e.clientY / window.innerHeight, 0.35);
        } else if (!r.already) {
          const key = Date.now() + Math.random();
          setMisses((m) => [...m, { key, x, y, side }]);
          setTimeout(() => setMisses((m) => m.filter((k) => k.key !== key)), 900);
          sfx.wrong();
          vibrate(90);
        }
        setWrong(r.wrong);
        if (r.finished && r.result) {
          finishing.current = true;
          finishWith(r.result);
        }
      } catch (err) {
        setError((err as Error).message);
      }
    });
  };

  const askHint = async () => {
    const s = sessionRef.current;
    if (!s) return;
    try {
      const r = await api<{ hint: { x: number; y: number; r: number }; hintsUsed: number }>("/api/play/action", { sessionId: s.sessionId, action: "hint" });
      setHint(r.hint);
      setHintsUsed(r.hintsUsed);
      setTimeout(() => setHint(null), 3500);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  if (phase === "result" && result) {
    const d = result.details as { found: number; total: number; wrong: number; hints: number; timeBonus: number };
    return (
      <ResultPanel
        result={result}
        onReplay={start}
        achievements={[
          { label: "Điểm khác biệt", value: `${d.found}/${d.total}` },
          { label: "Thưởng thời gian", value: `+${d.timeBonus}` },
          { label: "Click sai / Gợi ý", value: `${d.wrong} / ${d.hints}` },
        ]}
      />
    );
  }

  if (phase === "intro" || !session)
    return <GameIntro id="find-diff" game={game} onStart={start} busy={busy} error={error} robotText="Quan sát thật kỹ: màu sắc, đồ vật, chi tiết nhỏ… đều có thể khác nhau đấy!" />;

  const p = session.puzzle;
  const allRegions = phase === "reveal" ? ((result?.details as { regions: Region[] })?.regions ?? []) : [];
  const missed = allRegions.filter((r) => !found.some((f) => f.id === r.id));
  const urgent = secLeft <= 10;

  const pane = (side: 0 | 1) => (
    <div
      onClick={onPick(side)}
      className="relative w-full cursor-crosshair select-none overflow-hidden rounded-2xl border-2 border-neon/40 bg-white shadow-[0_0_30px_rgba(34,211,238,.25)]"
      style={{ aspectRatio: `${p.width} / ${p.height}`, touchAction: "manipulation" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={side === 0 ? p.leftUrl : p.rightUrl}
        alt={side === 0 ? "Hình gốc" : "Hình cần tìm điểm khác"}
        draggable={false}
        onLoad={() => setLoadedImgs((n) => n + 1)}
        className="pointer-events-none absolute inset-0 h-full w-full object-fill"
      />
      <span className="absolute left-2 top-2 rounded-md bg-ink/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">{side === 0 ? "Hình A" : "Hình B"}</span>
      {found.map((r) => (
        <motion.span
          key={r.id}
          initial={{ scale: 2.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 12 }}
          className="pointer-events-none absolute rounded-full border-[3px] border-fpt-orange shadow-[0_0_16px_#f07629,inset_0_0_12px_rgba(243,112,33,.6)]"
          style={{ left: `${r.x * 100}%`, top: `${r.y * 100}%`, width: `${r.r * 200}%`, aspectRatio: "1", x: "-50%", y: "-50%" }}
        />
      ))}
      {missed.map((r) => (
        <span key={r.id} className="pointer-events-none absolute animate-pulse rounded-full border-[3px] border-dashed border-rose-400"
          style={{ left: `${r.x * 100}%`, top: `${r.y * 100}%`, width: `${r.r * 200}%`, aspectRatio: "1", transform: "translate(-50%,-50%)" }} />
      ))}
      {hint && (
        <span className="pointer-events-none absolute animate-pulse rounded-full border-4 border-neon bg-neon/15"
          style={{ left: `${hint.x * 100}%`, top: `${hint.y * 100}%`, width: `${hint.r * 200}%`, aspectRatio: "1", transform: "translate(-50%,-50%)" }} />
      )}
      <AnimatePresence>
        {misses.filter((m) => m.side === side).map((m) => (
          <motion.span key={m.key} initial={{ scale: 0.4, opacity: 1 }} animate={{ scale: 1.2, opacity: 1 }} exit={{ opacity: 0 }}
            className="pointer-events-none absolute grid h-9 w-9 place-items-center rounded-full bg-rose-500/80 text-lg font-black text-white"
            style={{ left: `${m.x * 100}%`, top: `${m.y * 100}%`, x: "-50%", y: "-50%" }}>
            ✕
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-3 pb-10 pt-3 sm:px-4">
      {preview && <div className="mb-2 rounded-xl bg-fpt-orange/20 px-3 py-1.5 text-center text-xs font-bold text-fpt-orange-light">CHẾ ĐỘ XEM TRƯỚC (Admin) — kết quả được đánh dấu dữ liệu demo</div>}
      <div className="glass flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-bold uppercase tracking-[0.18em] text-neon">{p.theme || "Tìm điểm khác biệt"}</div>
          <div className="truncate text-base font-black sm:text-lg">{p.title}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] font-bold uppercase text-white/50">Đã tìm</div>
          <div className="text-xl font-black tabular-nums text-fpt-orange-light">{found.length}/{p.total}</div>
        </div>
        <div className={`text-center ${urgent ? "animate-pulse text-rose-300" : ""}`}>
          <div className="text-[10px] font-bold uppercase text-white/50">Thời gian</div>
          <div className="text-xl font-black tabular-nums">{Math.floor(secLeft / 60)}:{String(secLeft % 60).padStart(2, "0")}</div>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <Button size="sm" variant="blue" onClick={askHint} disabled={phase !== "playing" || hintsUsed >= session.maxHints} className="flex-1 sm:flex-none">
            💡 GỢI Ý ({session.maxHints - hintsUsed})
          </Button>
          <Button size="sm" variant="ghost" onClick={start} className="flex-1 sm:flex-none">↻ CHƠI LẠI</Button>
        </div>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.div className="h-full rounded-full bg-gradient-to-r from-fpt-orange to-fpt-green" animate={{ width: `${(100 * found.length) / p.total}%` }} />
      </div>

      <div className="relative mt-3 grid gap-3 sm:grid-cols-2">
        {pane(0)}
        {pane(1)}
        {loadedImgs < 2 && <div className="absolute inset-0 grid place-items-center rounded-2xl bg-ink/60 text-sm font-bold">Đang tải hình…</div>}
      </div>

      {error && <p className="mt-3 rounded-xl bg-rose-500/15 px-4 py-2 text-sm font-semibold text-rose-200">{error}</p>}

      <div className="mt-4 flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
        <RobotGuide
          size={66}
          mood={phase === "reveal" ? "sad" : found.length >= p.total - 1 ? "cheer" : wrong > 3 ? "think" : "happy"}
          text={
            phase === "reveal" ? "Hết giờ! Các vòng đỏ là những điểm bạn chưa tìm thấy." :
            wrong > 3 && hintsUsed < session.maxHints ? "Khó quá? Thử dùng GỢI Ý nhé!" :
            found.length === 0 ? "Chạm vào điểm khác nhau trên một trong hai hình." :
            `Tuyệt! Còn ${p.total - found.length} điểm nữa thôi!`
          }
        />
        {phase === "reveal" && <Button size="lg" onClick={() => setPhase("result")}>XEM KẾT QUẢ 🏁</Button>}
      </div>
    </div>
  );
}
