"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { GameIntro } from "@/components/game/GameIntro";
import { ResultPanel } from "@/components/game/ResultPanel";
import { usePlayer } from "@/components/PlayerProvider";
import { RobotGuide, type RobotMood } from "@/components/Robot";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/client/api";
import { burst } from "@/lib/client/confetti";
import { sfx, vibrate } from "@/lib/client/sound";
import type { GameResult } from "@/lib/client/types";
import { needleAngle } from "@/lib/games/scoring";

type Start = { sessionId: string; levels: { label: string; points: number }[]; roundTimeLimitSec: number; maxScore: number };
type Round = { round: number; totalRounds: number; label: string; speed: number; zoneWidth: number; points: number; target: number; start: number; dir: 1 | -1; timeLimitSec: number };
type Verdict = "perfect" | "zone" | "near" | "miss" | "timeout";
type StopRes = { round: number; stopAngle: number | null; deviation: number | null; verdict: Verdict; gained: number; score: number; finished: boolean; result?: GameResult };

const C = 160, R = 128;
const pt = (a: number, r = R) => {
  const rad = (a * Math.PI) / 180;
  return [C + r * Math.sin(rad), C - r * Math.cos(rad)] as const;
};
function arcPath(center: number, width: number, r = R) {
  const a0 = center - width / 2, a1 = center + width / 2;
  const [x0, y0] = pt(a0, r), [x1, y1] = pt(a1, r);
  return `M${x0} ${y0} A${r} ${r} 0 ${width > 180 ? 1 : 0} 1 ${x1} ${y1}`;
}

const VERDICT: Record<Verdict, { title: string; color: string; mood: RobotMood }> = {
  perfect: { title: "PERFECT!", color: "text-fpt-green", mood: "cheer" },
  zone: { title: "TRONG VÙNG!", color: "text-neon", mood: "happy" },
  near: { title: "SÁT VÙNG", color: "text-fpt-orange-light", mood: "think" },
  miss: { title: "TRƯỢT RỒI", color: "text-rose-300", mood: "sad" },
  timeout: { title: "HẾT GIỜ", color: "text-rose-300", mood: "sad" },
};

export default function PerfectStopPage() {
  const { games, requireRegistration } = usePlayer();
  const game = games.find((g) => g.id === "perfect-stop");
  const [phase, setPhase] = useState<"intro" | "countdown" | "running" | "roundResult" | "result">("intro");
  const [session, setSession] = useState<Start | null>(null);
  const [roundIdx, setRoundIdx] = useState(0);
  const [round, setRound] = useState<Round | null>(null);
  const [count, setCount] = useState(3);
  const [res, setRes] = useState<StopRes | null>(null);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<GameResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);

  const needleRef = useRef<SVGGElement>(null);
  const timerRef = useRef<HTMLDivElement>(null);
  const t0 = useRef(0);
  const raf = useRef(0);
  const stopped = useRef(true);
  const roundRef = useRef<Round | null>(null);
  const sessionRef = useRef<Start | null>(null);

  const setNeedle = (angle: number) => needleRef.current?.setAttribute("transform", `rotate(${angle} ${C} ${C})`);

  const sendStop = useCallback(async (elapsedMs: number | null) => {
    const r = roundRef.current, s = sessionRef.current;
    if (!r || !s) return;
    try {
      const out = await api<StopRes>("/api/play/action", { sessionId: s.sessionId, action: "stop", round: r.round, elapsedMs });
      setRes(out);
      setScore(out.score);
      setPhase("roundResult");
      if (out.verdict === "perfect") {
        sfx.perfect();
        burst(0.5, 0.45, 1.2);
        vibrate([40, 40, 80]);
      } else if (out.verdict === "zone") sfx.good();
      else sfx.wrong();
      if (out.finished && out.result) setResult(out.result);
    } catch (e) {
      setError((e as Error).message);
      setPhase("intro");
    }
  }, []);

  const loop = useCallback(() => {
    const r = roundRef.current;
    if (!r || stopped.current) return;
    const elapsed = performance.now() - t0.current;
    setNeedle(needleAngle(r.start, r.dir, r.speed, elapsed));
    const left = Math.max(0, 1 - elapsed / (r.timeLimitSec * 1000));
    if (timerRef.current) timerRef.current.style.transform = `scaleX(${left})`;
    if (elapsed >= r.timeLimitSec * 1000) {
      stopped.current = true;
      void sendStop(null);
      return;
    }
    raf.current = requestAnimationFrame(loop);
  }, [sendStop]);

  const requestRound = useCallback(async () => {
    const s = sessionRef.current;
    if (!s) return;
    try {
      const r = await api<Round>("/api/play/action", { sessionId: s.sessionId, action: "round" });
      roundRef.current = r;
      setRound(r);
      setRes(null);
      setPhase("running");
      setNeedle(r.start);
      stopped.current = false;
      t0.current = performance.now(); // kim bắt đầu chạy ngay khi nhận thông số vòng
      raf.current = requestAnimationFrame(loop);
    } catch (e) {
      setError((e as Error).message);
      setPhase("intro");
    }
  }, [loop]);

  const countdownThen = useCallback((idx: number) => {
    setRoundIdx(idx);
    setPhase("countdown");
    if (timerRef.current) timerRef.current.style.transform = "scaleX(1)";
    setCount(3);
    sfx.tick();
    let n = 3;
    const id = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearInterval(id);
        sfx.start();
        void requestRound();
      } else {
        setCount(n);
        sfx.tick();
      }
    }, 650);
  }, [requestRound]);

  const start = async () => {
    if (!(await requireRegistration())) return;
    setBusy(true);
    setError("");
    try {
      const s = await api<Start>("/api/play/start", { gameId: "perfect-stop" });
      sessionRef.current = s;
      setSession(s);
      setScore(0);
      setResult(null);
      countdownThen(0);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  /** Ghi nhận chính xác thời điểm nhấn: dùng timeStamp của sự kiện (cùng gốc thời gian với performance.now()). */
  const press = useCallback((eventTs?: number) => {
    const r = roundRef.current;
    if (!r || stopped.current) return;
    const now = performance.now();
    const ts = eventTs && eventTs > t0.current && eventTs <= now + 1 ? eventTs : now;
    stopped.current = true;
    cancelAnimationFrame(raf.current);
    const elapsed = ts - t0.current;
    setNeedle(needleAngle(r.start, r.dir, r.speed, elapsed));
    sfx.stop();
    vibrate(35);
    setShake(true);
    setTimeout(() => setShake(false), 450);
    void sendStop(elapsed);
  }, [sendStop]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.code === "Space" || e.code === "Enter") && phase === "running") {
        e.preventDefault();
        press(e.timeStamp);
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [phase, press]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  if (phase === "result" && result) {
    const d = result.details as { perfects: number; rounds: { verdict: Verdict }[] };
    const inZone = d.rounds.filter((r) => r.verdict === "perfect" || r.verdict === "zone").length;
    return (
      <ResultPanel
        result={result}
        onReplay={start}
        achievements={[
          { label: "Số lần PERFECT", value: `${d.perfects}/${d.rounds.length}` },
          { label: "Dừng trong vùng", value: `${inZone}/${d.rounds.length}` },
        ]}
      />
    );
  }

  if (phase === "intro" || !session)
    return <GameIntro id="perfect-stop" game={game} onStart={start} busy={busy} error={error} robotText="Mẹo: hãy quan sát nhịp quay của kim một vòng trước khi nhấn nhé!" />;

  const total = session.levels.length;
  const level = session.levels[roundIdx];
  const zoneVisible = round && phase !== "countdown";
  const v = res ? VERDICT[res.verdict] : null;
  const late = res?.deviation != null && res.deviation > 0;
  const showStopMarker = phase === "roundResult" && res?.stopAngle != null;

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 pb-10 pt-4">
      <div className="flex w-full items-center justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-neon">Vòng {roundIdx + 1}/{total}</div>
          <div className="text-xl font-black">{level?.label}</div>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Điểm</div>
          <motion.div key={score} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className="text-3xl font-black tabular-nums text-fpt-orange-light">{score}</motion.div>
        </div>
      </div>
      <div className="mt-2 flex w-full gap-1.5">
        {session.levels.map((l, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i < roundIdx || (i === roundIdx && phase === "roundResult") ? "bg-fpt-orange" : i === roundIdx ? "bg-neon" : "bg-white/15"}`} />
        ))}
      </div>
      {/* thanh đếm ngược */}
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div ref={timerRef} className="h-full origin-left rounded-full bg-gradient-to-r from-fpt-green via-neon to-fpt-orange" />
      </div>

      {/* vòng năng lượng 3D */}
      <div className="relative mt-4 w-full max-w-[380px]" style={{ perspective: 900 }}>
        <div className={`relative ${shake ? "animate-shake" : ""}`} style={{ transform: "rotateX(16deg)", transformStyle: "preserve-3d" }}>
          <svg viewBox="0 0 320 320" className="w-full drop-shadow-[0_25px_40px_rgba(10,92,216,.45)]">
            <defs>
              <radialGradient id="ps-core" cx="50%" cy="45%" r="60%">
                <stop offset="0" stopColor="#13235e" />
                <stop offset="1" stopColor="#040a22" />
              </radialGradient>
              <filter id="ps-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <circle cx={C} cy={C} r={152} fill="none" stroke="rgba(34,211,238,.15)" strokeWidth="2" strokeDasharray="4 8" />
            <circle cx={C} cy={C} r={R} fill="url(#ps-core)" stroke="#1e3a8a" strokeWidth="24" />
            {Array.from({ length: 36 }, (_, i) => {
              const [x0, y0] = pt(i * 10, R - 18), [x1, y1] = pt(i * 10, R - (i % 3 === 0 ? 28 : 23));
              return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke="rgba(255,255,255,.25)" strokeWidth={i % 3 === 0 ? 2 : 1} />;
            })}
            {zoneVisible && round && (
              <g filter="url(#ps-glow)">
                <path d={arcPath(round.target, round.zoneWidth)} fill="none" stroke="#f07629" strokeWidth="24" strokeLinecap="butt" opacity={res?.verdict === "perfect" ? 1 : 0.92}>
                  {res?.verdict === "perfect" && <animate attributeName="stroke" values="#f07629;#22c55e;#f07629" dur="0.6s" repeatCount="3" />}
                </path>
                <path d={arcPath(round.target, Math.max(1.2, round.zoneWidth * 0.12))} fill="none" stroke="#fff" strokeWidth="24" />
                {(() => {
                  const [x0, y0] = pt(round.target, R + 20), [x1, y1] = pt(round.target, R - 20);
                  return <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="#fff" strokeWidth="2" strokeDasharray="3 3" />;
                })()}
              </g>
            )}
            {showStopMarker && res?.stopAngle != null && (() => {
              const [x, y] = pt(res.stopAngle, R);
              return <circle cx={x} cy={y} r="9" fill="#22d3ee" stroke="#fff" strokeWidth="3" filter="url(#ps-glow)" />;
            })()}
            <g ref={needleRef} transform={`rotate(${round?.start ?? 0} ${C} ${C})`} filter="url(#ps-glow)">
              <line x1={C} y1={C} x2={C} y2={C - R - 14} stroke="#22d3ee" strokeWidth="6" strokeLinecap="round" />
              <circle cx={C} cy={C - R} r="7" fill="#fff" />
            </g>
            <circle cx={C} cy={C} r="30" fill="#1369b4" stroke="#fff" strokeWidth="3" />
            <g fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
              <path d={`M${C - 9} ${C + 2} q9 -8 18 0`} />
              <path d={`M${C - 15} ${C - 5} q15 -14 30 0`} opacity=".6" />
              <circle cx={C} cy={C + 7} r="2" fill="#fff" />
            </g>
          </svg>

          <AnimatePresence>
            {phase === "countdown" && (
              <motion.div key={count} initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
                className="absolute inset-0 grid place-items-center text-8xl font-black text-white neon-text">
                {count}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-4 min-h-[118px] w-full">
        <AnimatePresence mode="wait">
          {phase === "roundResult" && res && v ? (
            <motion.div key="res" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-center">
              <div className={`text-4xl font-black ${v.color}`}>{v.title}</div>
              <div className="mt-1 text-sm font-semibold text-white/75">
                {res.deviation != null ? <>Lệch <b className="text-white">{Math.abs(res.deviation).toFixed(1)}°</b> so với tâm mục tiêu · </> : null}
                <b className="text-fpt-orange-light">+{res.gained} điểm</b>
              </div>
              {res.verdict !== "perfect" && res.verdict !== "timeout" && res.deviation != null && (
                <div className="mt-1 text-xs text-white/60">Gợi ý: hãy nhấn {late ? "sớm" : "muộn"} hơn một chút.</div>
              )}
              <div className="mt-4">
                {res.finished ? (
                  <Button size="lg" onClick={() => setPhase("result")} className="w-full">XEM KẾT QUẢ 🏁</Button>
                ) : (
                  <Button size="lg" variant="blue" onClick={() => countdownThen(roundIdx + 1)} className="w-full">VÒNG TIẾP THEO →</Button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div key="btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  press(e.timeStamp);
                }}
                disabled={phase !== "running"}
                className="group relative h-28 w-full select-none rounded-[2rem] bg-gradient-to-b from-fpt-orange-light to-fpt-orange text-4xl font-black tracking-widest text-white orange-glow transition active:translate-y-1 active:scale-[0.98] disabled:opacity-40"
                style={{ touchAction: "manipulation" }}
              >
                <span className="absolute inset-x-6 top-2 h-1/3 rounded-full bg-white/25 blur-sm" />
                DỪNG!
              </button>
              <p className="mt-2 text-center text-xs text-white/50">Nhấn nút hoặc phím Space</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-2 self-start">
        <RobotGuide
          size={70}
          mood={v ? v.mood : "idle"}
          text={
            phase === "countdown" ? "Chuẩn bị… tập trung nào!" :
            phase === "running" ? "Canh đúng vùng màu cam nhé!" :
            res?.verdict === "perfect" ? "Chuẩn không cần chỉnh! 🎯" :
            res?.verdict === "zone" ? "Tốt lắm, rất gần tâm rồi!" : "Bình tĩnh, vòng sau sẽ tốt hơn!"
          }
        />
      </div>
    </div>
  );
}
