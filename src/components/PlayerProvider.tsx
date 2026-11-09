"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { api } from "@/lib/client/api";
import type { Branding, PlayerSummary, PublicGame } from "@/lib/client/types";
import { RegisterDialog } from "./RegisterDialog";

type Ctx = {
  games: PublicGame[];
  branding: Branding;
  player: PlayerSummary | null;
  loaded: boolean;
  refresh: () => Promise<void>;
  setPlayer: (p: PlayerSummary) => void;
  track: (type: "visit" | "start_click") => void;
  requireRegistration: () => Promise<boolean>;
};

const PlayerCtx = createContext<Ctx | null>(null);

function visitorId() {
  try {
    let v = localStorage.getItem("pw_vid");
    if (!v) {
      v = crypto.randomUUID();
      localStorage.setItem("pw_vid", v);
    }
    return v;
  } catch {
    return "anon-" + Math.random().toString(36).slice(2, 12);
  }
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [games, setGames] = useState<PublicGame[]>([]);
  const [branding, setBranding] = useState<Branding>({ logoUrl: null, heroModelUrl: null });
  const [player, setPlayer] = useState<PlayerSummary | null>(null);
  const [loaded, setLoaded] = useState(false);
  const tracked = useRef(false);

  const refresh = useCallback(async () => {
    const [g, p] = await Promise.all([
      api<{ games: PublicGame[]; branding: Branding }>("/api/games"),
      api<{ player: PlayerSummary | null }>("/api/player"),
    ]);
    setGames(g.games);
    setBranding(g.branding);
    setPlayer(p.player);
    setLoaded(true);
  }, []);

  const track = useCallback((type: "visit" | "start_click") => {
    const campaign = new URLSearchParams(window.location.search).get("c") || undefined;
    void api("/api/track", { type, visitorId: visitorId(), campaign }).catch(() => {});
  }, []);

  useEffect(() => {
    void refresh().catch(() => setLoaded(true));
    if (!tracked.current) {
      tracked.current = true;
      let first = true;
      try {
        first = !sessionStorage.getItem("pw_visit");
        sessionStorage.setItem("pw_visit", "1");
      } catch {}
      const hasCampaign = new URLSearchParams(window.location.search).has("c");
      if (first || hasCampaign) track("visit");
    }
  }, [refresh, track]);

  // Đăng ký bắt buộc: mở form, trả về true khi người chơi đã đăng ký xong
  const [regOpen, setRegOpen] = useState(false);
  const pending = useRef<((ok: boolean) => void) | null>(null);
  const playerRef = useRef(player);
  playerRef.current = player;
  const requireRegistration = useCallback((): Promise<boolean> => {
    if (playerRef.current?.registered) return Promise.resolve(true);
    return new Promise((resolve) => {
      pending.current = resolve;
      setRegOpen(true);
    });
  }, []);
  const closeReg = (ok: boolean) => {
    setRegOpen(false);
    pending.current?.(ok);
    pending.current = null;
  };

  return (
    <PlayerCtx.Provider value={{ games, branding, player, loaded, refresh, setPlayer, track, requireRegistration }}>
      {children}
      <RegisterDialog
        open={regOpen}
        onClose={() => closeReg(false)}
        onDone={(p) => {
          setPlayer(p);
          playerRef.current = p;
          closeReg(true);
        }}
      />
    </PlayerCtx.Provider>
  );
}

export function usePlayer() {
  const c = useContext(PlayerCtx);
  if (!c) throw new Error("usePlayer must be used within PlayerProvider");
  return c;
}
