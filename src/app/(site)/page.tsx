"use client";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { usePlayer } from "@/components/PlayerProvider";
import { Hero } from "@/components/three/Hero";
import { Button } from "@/components/ui/Button";
import { sfx } from "@/lib/client/sound";

const PRODUCTS = ["Internet cáp quang", "WiFi 6 / WiFi 7", "FPT Camera", "Smart Home", "FPT Play"];

export default function Landing() {
  const router = useRouter();
  const { branding, track, player, games, requireRegistration } = usePlayer();
  const [leaving, setLeaving] = useState(false);

  const start = async () => {
    track("start_click");
    if (!(await requireRegistration())) return;
    sfx.start();
    setLeaving(true);
    const qs = typeof window !== "undefined" ? window.location.search : "";
    setTimeout(() => router.push("/play" + qs), 380);
  };

  const enabledCount = games.filter((g) => g.enabled).length || 3;

  return (
    <motion.section
      animate={leaving ? { opacity: 0, scale: 1.04, filter: "blur(8px)" } : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.38 }}
      className="mx-auto grid min-h-[calc(100dvh-3.5rem)] max-w-6xl grid-cols-1 items-center gap-4 px-4 pb-10 pt-4 lg:grid-cols-2 lg:gap-8"
    >
      <div className="order-2 text-center lg:order-1 lg:text-left">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-neon">
          <span className="h-2 w-2 animate-pulse rounded-full bg-fpt-green" /> {enabledCount} mini game · không cần tải app
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="mb-3">
          <Logo size="lg" />
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
          className="text-[2.8rem] font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
          <span className="sr-only">FPT Telecom – </span>
          <span className="text-gradient neon-text">PLAY &amp; WIN</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="mx-auto mt-4 max-w-md text-lg font-semibold text-white/80 lg:mx-0 sm:text-xl">
          Chơi hết mình – Khám phá công nghệ – <span className="text-fpt-orange-light">Nhận quà từ FPT.</span>
        </motion.p>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.42, type: "spring" }}
          className="relative mt-8 inline-block">
          <span className="absolute inset-0 rounded-2xl bg-fpt-orange/60 animate-pulse-ring" aria-hidden />
          <Button size="xl" onClick={start} silent className="relative min-w-[260px]">
            ▶ BẮT ĐẦU CHƠI
          </Button>
        </motion.div>
        {player && player.totalScore > 0 && (
          <p className="mt-4 text-sm text-white/60">
            Chào mừng trở lại, <b className="text-white">{player.nickname}</b> — tổng điểm của bạn: <b className="text-fpt-orange-light">{player.totalScore}</b>
          </p>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-2 lg:justify-start">
          {PRODUCTS.map((p) => (
            <span key={p} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/70">{p}</span>
          ))}
        </div>
      </div>

      <div className="relative order-1 h-[46vh] min-h-[300px] w-full lg:order-2 lg:h-[560px]">
        <Hero modelUrl={branding.heroModelUrl} />
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.9 }}
          className="glass pointer-events-none absolute left-1 top-1 max-w-[220px] rounded-2xl rounded-bl-sm px-4 py-3 text-sm font-semibold leading-snug sm:left-4 sm:top-4"
        >
          Xin chào! Mình là <b className="text-neon">Robot AI</b> của FPT. Cùng chơi và nhận quà nhé! 🎁
        </motion.div>
      </div>
    </motion.section>
  );
}
