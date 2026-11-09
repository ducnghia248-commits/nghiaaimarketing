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
import { QUESTION_PRODUCTS, QUESTION_TYPES } from "@/lib/games/defs";

type Start = { sessionId: string; total: number; timePerQuestionSec: number; maxScore: number };
type Q = {
  index: number; total: number; timeLimitSec: number; remainingMs: number; score: number;
  question: { id: number; type: string; product: string; difficulty: string; text: string; options: string[]; imageUrl: string | null };
};
type Feedback = { correct: boolean; timeout: boolean; correctChoice: number; explanation: string; gained: number; score: number; finished: boolean; result?: GameResult };

const LETTERS = ["A", "B", "C", "D"];

export default function QuizPage() {
  const { games, requireRegistration } = usePlayer();
  const game = games.find((g) => g.id === "quiz");
  const [phase, setPhase] = useState<"intro" | "question" | "feedback" | "result">("intro");
  const [session, setSession] = useState<Start | null>(null);
  const [q, setQ] = useState<Q | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [fb, setFb] = useState<Feedback | null>(null);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<GameResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [secLeft, setSecLeft] = useState(0);
  const deadline = useRef(0);
  const raf = useRef(0);
  const ringRef = useRef<SVGCircleElement>(null);
  const answered = useRef(false);
  const sessionRef = useRef<Start | null>(null);
  const qRef = useRef<Q | null>(null);

  const answer = useCallback(async (choice: number | null) => {
    const s = sessionRef.current, cur = qRef.current;
    if (!s || !cur || answered.current) return;
    answered.current = true;
    cancelAnimationFrame(raf.current);
    setPicked(choice);
    try {
      const f = await api<Feedback>("/api/play/action", { sessionId: s.sessionId, action: "answer", index: cur.index, choice });
      setFb(f);
      setScore(f.score);
      setPhase("feedback");
      if (f.correct) {
        sfx.good();
        burst(0.5, 0.6, 0.6);
      } else {
        sfx.wrong();
        vibrate(120);
      }
      if (f.finished && f.result) setResult(f.result);
    } catch (e) {
      setError((e as Error).message);
      setPhase("intro");
    }
  }, []);

  const tick = useCallback(() => {
    const cur = qRef.current;
    if (!cur || answered.current) return;
    const left = Math.max(0, deadline.current - performance.now());
    const frac = left / (cur.timeLimitSec * 1000);
    if (ringRef.current) ringRef.current.style.strokeDashoffset = String(113.1 * (1 - frac));
    const s = Math.ceil(left / 1000);
    setSecLeft((p) => (p !== s ? s : p));
    if (left <= 0) {
      void answer(null);
      return;
    }
    raf.current = requestAnimationFrame(tick);
  }, [answer]);

  const loadNext = useCallback(async () => {
    const s = sessionRef.current;
    if (!s) return;
    try {
      const n = await api<Q>("/api/play/action", { sessionId: s.sessionId, action: "next" });
      qRef.current = n;
      setQ(n);
      setPicked(null);
      setFb(null);
      answered.current = false;
      deadline.current = performance.now() + n.remainingMs;
      setSecLeft(Math.ceil(n.remainingMs / 1000));
      if (ringRef.current) ringRef.current.style.strokeDashoffset = String(113.1 * (1 - n.remainingMs / (n.timeLimitSec * 1000)));
      setPhase("question");
      raf.current = requestAnimationFrame(tick);
    } catch (e) {
      setError((e as Error).message);
      setPhase("intro");
    }
  }, [tick]);

  const start = async () => {
    if (!(await requireRegistration())) return;
    setBusy(true);
    setError("");
    try {
      const s = await api<Start>("/api/play/start", { gameId: "quiz" });
      sessionRef.current = s;
      setSession(s);
      setScore(0);
      setResult(null);
      sfx.start();
      await loadNext();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  if (phase === "result" && result) {
    const d = result.details as { correct: number; total: number; avgAnswerMs: number };
    return (
      <ResultPanel
        result={result}
        onReplay={start}
        achievements={[
          { label: "Trả lời đúng", value: `${d.correct}/${d.total}` },
          { label: "TB mỗi câu", value: `${(d.avgAnswerMs / 1000).toFixed(1)} giây` },
        ]}
      />
    );
  }

  if (phase === "intro" || !session || !q)
    return <GameIntro id="quiz" game={game} onStart={start} busy={busy} error={error} robotText="Trả lời càng nhanh, điểm thưởng càng cao. Sẵn sàng chưa?" />;

  const typeLabel = QUESTION_TYPES.find((t) => t.id === q.question.type)?.label;
  const productLabel = QUESTION_PRODUCTS.find((p) => p.id === q.question.product)?.label;
  const progress = ((q.index + (phase === "feedback" ? 1 : 0)) / q.total) * 100;
  const blank = q.question.type === "fill" && q.question.text.includes("___");
  const parts = blank ? q.question.text.split("___") : null;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-10 pt-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex justify-between text-xs font-bold text-white/60">
            <span>Câu {q.index + 1}/{q.total}</span>
            <span className="text-fpt-orange-light">{score} điểm</span>
          </div>
          <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/10">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-neon to-fpt-blue-light" animate={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="relative grid h-14 w-14 place-items-center">
          <svg viewBox="0 0 40 40" className="absolute inset-0 -rotate-90">
            <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="3.5" />
            <circle ref={ringRef} cx="20" cy="20" r="18" fill="none" stroke={secLeft <= 5 ? "#f43f5e" : "#22d3ee"} strokeWidth="3.5" strokeLinecap="round" strokeDasharray="113.1" strokeDashoffset="0" />
          </svg>
          <span className={`text-lg font-black tabular-nums ${secLeft <= 5 && phase === "question" ? "text-rose-300" : ""}`}>{phase === "question" ? secLeft : "✓"}</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={q.index} initial={{ opacity: 0, x: 40, rotateY: -12 }} animate={{ opacity: 1, x: 0, rotateY: 0 }} exit={{ opacity: 0, x: -40 }}
          transition={{ type: "spring", damping: 22 }} style={{ perspective: 1000 }}>
          <div className="glass relative mt-5 overflow-hidden rounded-3xl p-5 text-center sm:p-7">
            <div className="flex flex-wrap justify-center gap-2 text-[11px] font-bold uppercase tracking-wider">
              <span className="rounded-full bg-fpt-blue/40 px-2.5 py-1">{typeLabel}</span>
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-white/70">{productLabel}</span>
            </div>
            {q.question.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={q.question.imageUrl} alt="" className="mx-auto mt-4 max-h-44 rounded-2xl object-contain" />
            )}
            <h2 className="mt-4 text-xl font-extrabold leading-snug sm:text-2xl">
              {parts ? (
                <>
                  {parts[0]}
                  <span className={`mx-1 inline-block min-w-16 rounded-lg border-b-4 px-2 ${fb ? "border-fpt-green bg-fpt-green/20 text-fpt-green" : "border-neon bg-neon/10 text-neon"}`}>
                    {fb ? q.question.options[fb.correctChoice] : "?"}
                  </span>
                  {parts.slice(1).join("___")}
                </>
              ) : (
                q.question.text
              )}
            </h2>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {q.question.options.map((opt, i) => {
              const isCorrect = fb && i === fb.correctChoice;
              const isWrongPick = fb && picked === i && !fb.correct;
              const state = isCorrect ? "correct" : isWrongPick ? "wrong" : fb ? "dim" : picked === i ? "picked" : "idle";
              return (
                <motion.button
                  key={i}
                  disabled={phase !== "question" || picked !== null}
                  onClick={() => {
                    sfx.click();
                    void answer(i);
                  }}
                  initial={{ opacity: 0, y: 16 }}
                  animate={state === "wrong" ? { opacity: 1, y: 0, x: [0, -8, 8, -5, 5, 0] } : { opacity: state === "dim" ? 0.45 : 1, y: 0 }}
                  transition={{ delay: fb ? 0 : 0.08 * i }}
                  whileHover={phase === "question" ? { y: -4, rotateX: 6, scale: 1.015 } : {}}
                  whileTap={phase === "question" ? { scale: 0.97, y: 2 } : {}}
                  className={`relative flex min-h-[64px] items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-[15px] font-bold shadow-[0_10px_0_-2px_rgba(0,0,0,.35)] transition-colors sm:text-base
                    ${state === "correct" ? "border-fpt-green bg-fpt-green/25 shadow-[0_0_30px_rgba(34,197,94,.45)]" : ""}
                    ${state === "wrong" ? "border-rose-400 bg-rose-500/20" : ""}
                    ${state === "picked" ? "border-neon bg-neon/20 shadow-[0_0_25px_rgba(34,211,238,.4)]" : ""}
                    ${state === "idle" || state === "dim" ? "border-white/10 bg-white/[.06] hover:border-neon/60" : ""}`}
                >
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-black ${state === "correct" ? "bg-fpt-green text-white" : state === "wrong" ? "bg-rose-500 text-white" : "bg-neon text-ink"}`}>
                    {state === "correct" ? "✓" : state === "wrong" ? "✕" : LETTERS[i]}
                  </span>
                  <span className="flex-1">{opt}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-5 min-h-[120px]">
        {phase === "feedback" && fb ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <RobotGuide
              size={74}
              mood={fb.correct ? "cheer" : fb.timeout ? "think" : "sad"}
              text={
                <>
                  <span className={`block text-base font-black ${fb.correct ? "text-fpt-green" : "text-rose-300"}`}>
                    {fb.correct ? `Chính xác! +${fb.gained}` : fb.timeout ? "Hết giờ mất rồi!" : "Chưa đúng rồi!"}
                  </span>
                  {fb.explanation && <span className="mt-1 block font-medium text-white/85">{fb.explanation}</span>}
                </>
              }
              className="flex-1"
            />
            <Button size="lg" variant={fb.finished ? "primary" : "blue"} onClick={() => (fb.finished ? setPhase("result") : void loadNext())} className="sm:min-w-[220px]">
              {fb.finished ? "XEM KẾT QUẢ 🏁" : "CÂU TIẾP THEO →"}
            </Button>
          </motion.div>
        ) : (
          <RobotGuide size={64} mood="think" text={secLeft <= 5 ? "Nhanh lên nào! ⏰" : "Đọc kỹ câu hỏi nhé!"} />
        )}
      </div>
    </div>
  );
}
