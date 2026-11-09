"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/client/api";
import type { PlayerSummary } from "@/lib/client/types";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";
import { usePlayer } from "./PlayerProvider";

export function NicknameDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { player, setPlayer } = usePlayer();
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) {
      setName(player?.nickname.startsWith("Người chơi #") ? "" : player?.nickname ?? "");
      setErr("");
    }
  }, [open, player]);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const r = await api<{ player: PlayerSummary }>("/api/player", { nickname: name }, "PATCH");
      setPlayer(r.player);
      onClose();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open={open} onClose={onClose} title="Tên hiển thị trên bảng xếp hạng">
      <form onSubmit={save} className="space-y-4">
        <p className="text-sm text-white/70">Chỉ tên hiển thị được công khai. Không cần số điện thoại hay thông tin cá nhân.</p>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={24}
          placeholder="VD: Cao thủ WiFi"
          className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-lg font-bold outline-none focus:border-neon"
        />
        {err && <p className="text-sm font-semibold text-rose-300">{err}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={busy || name.trim().length < 2}>
          {busy ? "Đang lưu…" : "LƯU TÊN"}
        </Button>
      </form>
    </Modal>
  );
}
