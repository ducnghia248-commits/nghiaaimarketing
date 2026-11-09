"use client";
import Link from "next/link";
import { useState } from "react";
import { setSound, useSoundEnabled } from "@/lib/client/sound";
import { Logo } from "./Logo";
import { NicknameDialog } from "./NicknameDialog";
import { usePlayer } from "./PlayerProvider";

export function Header() {
  const sound = useSoundEnabled();
  const { player } = usePlayer();
  const [nickOpen, setNickOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-ink/60 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4">
        <Link href="/" aria-label="Trang chủ">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1.5 sm:gap-2">
          {player && (
            <button
              onClick={() => setNickOpen(true)}
              className="glass hidden max-w-[160px] items-center gap-1.5 truncate rounded-full px-3 py-1.5 text-xs font-bold sm:flex"
              title="Đổi tên hiển thị"
            >
              <span className="truncate">{player.nickname}</span>
              <span className="text-fpt-orange-light">{player.totalScore}đ</span>
            </button>
          )}
          <Link href="/leaderboard" className="glass rounded-full px-3 py-1.5 text-xs font-bold hover:bg-white/15" title="Bảng xếp hạng">
            🏆 <span className="hidden sm:inline">Xếp hạng</span>
          </Link>
          <button
            onClick={() => setSound(!sound)}
            className="glass grid h-8 w-8 place-items-center rounded-full text-sm hover:bg-white/15"
            aria-label={sound ? "Tắt âm thanh" : "Bật âm thanh"}
            title={sound ? "Tắt âm thanh" : "Bật âm thanh"}
          >
            {sound ? "🔊" : "🔇"}
          </button>
        </nav>
      </div>
      <NicknameDialog open={nickOpen} onClose={() => setNickOpen(false)} />
    </header>
  );
}
