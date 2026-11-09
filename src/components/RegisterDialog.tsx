"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/client/api";
import type { PlayerSummary } from "@/lib/client/types";
import { PHONE_RE, PROVINCES, REGISTER_CONSENT_TEXT, normalizePhone } from "@/lib/games/defs";
import { Robot } from "./Robot";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";

const field =
  "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base font-semibold outline-none transition focus:border-neon focus:bg-white/10";

/** Đăng ký thông tin bắt buộc trước khi chơi: Họ tên + SĐT (+ Tỉnh/TP tùy chọn) và đồng ý điều khoản. */
export function RegisterDialog({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: (p: PlayerSummary) => void }) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) setErr("");
  }, [open]);

  const nameOk = fullName.trim().length >= 2;
  const phoneOk = PHONE_RE.test(normalizePhone(phone));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setErr("");
    if (!nameOk) return setErr("Vui lòng nhập họ và tên.");
    if (!phoneOk) return setErr("Số điện thoại chưa đúng (10 số, bắt đầu bằng 03/05/07/08/09).");
    if (!consent) return setErr("Vui lòng tick đồng ý để tham gia chương trình.");
    setBusy(true);
    try {
      const r = await api<{ player: PlayerSummary }>("/api/register", { fullName, phone, province, consent: true, website });
      onDone(r.player);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Đăng ký tham gia">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="flex items-center gap-3 rounded-2xl bg-fpt-blue/20 p-3">
          <Robot mood="wave" size={56} />
          <p className="text-sm font-semibold leading-snug text-white/85">
            Điền thông tin để bắt đầu chơi, lưu điểm và <b className="text-fpt-orange-light">nhận quà từ FPT</b>!
          </p>
        </div>
        <label className="block">
          <span className="mb-1 block text-sm font-bold">Họ và tên *</span>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" maxLength={60} placeholder="Nguyễn Văn A"
            className={`${field} ${touched && !nameOk ? "border-rose-400" : ""}`} autoFocus />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-bold">Số điện thoại *</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" maxLength={20} placeholder="09xx xxx xxx"
            className={`${field} ${(touched || phone.length >= 10) && !phoneOk ? "border-rose-400" : ""}`} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-bold">Tỉnh/Thành phố <span className="font-normal text-white/50">(không bắt buộc)</span></span>
          <select value={province} onChange={(e) => setProvince(e.target.value)} className={`${field} [&>option]:text-black`}>
            <option value="">— Chọn —</option>
            {PROVINCES.map((p) => <option key={p}>{p}</option>)}
          </select>
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-fpt-orange" />
          <span className="text-xs leading-relaxed text-white/75">
            {REGISTER_CONSENT_TEXT} Thông tin được bảo mật, không công khai trên bảng xếp hạng và không chia sẻ cho bên thứ ba.
          </span>
        </label>
        <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} className="absolute -left-[9999px] h-0 w-0 opacity-0" aria-hidden />
        {err && <p className="rounded-xl bg-rose-500/15 px-4 py-2 text-sm font-semibold text-rose-200">{err}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? "Đang lưu…" : "▶ VÀO CHƠI NGAY"}
        </Button>
      </form>
    </Modal>
  );
}
