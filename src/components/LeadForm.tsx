"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { api } from "@/lib/client/api";
import { CONSENT_TEXT, NEEDS, PHONE_RE, PRODUCTS, PROVINCES, normalizePhone } from "@/lib/games/defs";
import { usePlayer } from "./PlayerProvider";
import { Robot } from "./Robot";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";

const field = "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 font-semibold outline-none transition focus:border-neon focus:bg-white/10";

/**
 * Biểu mẫu nhận tư vấn — tự nguyện, có thể bỏ qua.
 * Họ tên & SĐT chỉ hiện ra (và chỉ được lưu) khi khách hàng tick đồng ý được FPT liên hệ.
 */
export function LeadForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [consent, setConsent] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState("");
  const [area, setArea] = useState("");
  const [products, setProducts] = useState<string[]>([]);
  const [need, setNeed] = useState("consult");
  const [website, setWebsite] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const phoneOk = PHONE_RE.test(normalizePhone(phone));
  const { player } = usePlayer();
  const registered = Boolean(player?.registered);
  const toggle = (id: string) => setProducts((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!province) return setErr("Vui lòng chọn Tỉnh/Thành phố.");
    if (!products.length) return setErr("Vui lòng chọn ít nhất 1 sản phẩm quan tâm.");
    if (consent && !registered && fullName.trim().length < 2) return setErr("Vui lòng nhập họ và tên.");
    if (consent && !registered && !phoneOk) return setErr("Số điện thoại chưa đúng định dạng (VD: 0912 345 678).");
    setBusy(true);
    try {
      await api("/api/leads", {
        consent,
        fullName: consent ? fullName : undefined,
        phone: consent ? phone : undefined,
        province, area, products, need, website,
      });
      setDone(true);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    onClose();
    setTimeout(() => setDone(false), 300);
  };

  return (
    <Modal open={open} onClose={close} title={done ? undefined : "Nhận tư vấn & ưu đãi từ FPT"} wide>
      {done ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <Robot mood="cheer" size={120} />
          <h3 className="text-2xl font-black">Cảm ơn bạn! 🎉</h3>
          <p className="max-w-sm text-white/75">
            {consent || registered ? "Chuyên viên FPT Telecom sẽ liên hệ tư vấn cho bạn trong thời gian sớm nhất." : "FPT đã ghi nhận nhu cầu của bạn (ẩn danh)."}
          </p>
          <Button onClick={close} size="lg" className="mt-2">TIẾP TỤC CHƠI</Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <p className="text-sm text-white/65">Không bắt buộc — bạn có thể bỏ qua và tiếp tục chơi bất cứ lúc nào.</p>

          <div>
            <div className="mb-2 text-sm font-bold">Sản phẩm quan tâm *</div>
            <div className="flex flex-wrap gap-2">
              {PRODUCTS.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => toggle(p.id)}
                  aria-pressed={products.includes(p.id)}
                  className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                    products.includes(p.id) ? "border-neon bg-neon/20 text-white" : "border-white/15 bg-white/5 text-white/75 hover:bg-white/10"
                  }`}
                >
                  {products.includes(p.id) ? "✓ " : ""}{p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-bold">Tỉnh/Thành phố *</span>
              <select value={province} onChange={(e) => setProvince(e.target.value)} className={`${field} [&>option]:text-black`}>
                <option value="">— Chọn —</option>
                {PROVINCES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-bold">Khu vực lắp đặt (nếu có)</span>
              <input value={area} onChange={(e) => setArea(e.target.value)} maxLength={120} placeholder="Phường/Xã, Quận/Huyện" className={field} />
            </label>
          </div>

          <div>
            <div className="mb-2 text-sm font-bold">Nhu cầu</div>
            <div className="grid grid-cols-3 gap-2">
              {NEEDS.map((n) => (
                <button type="button" key={n.id} onClick={() => setNeed(n.id)} aria-pressed={need === n.id}
                  className={`rounded-xl border px-2 py-2.5 text-sm font-bold transition ${need === n.id ? "border-fpt-orange bg-fpt-orange/20" : "border-white/15 bg-white/5 text-white/75"}`}>
                  {n.label}
                </button>
              ))}
            </div>
          </div>

          {registered ? (
            <div className="rounded-2xl border border-fpt-green/40 bg-fpt-green/10 p-4 text-sm">
              FPT sẽ liên hệ tư vấn qua thông tin bạn đã đăng ký: <b>{player?.fullName}</b> · <b>{player?.phoneMasked}</b>
            </div>
          ) : (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs leading-relaxed text-white/60">
              <b className="text-white/80">Mục đích thu thập dữ liệu:</b> FPT Telecom chỉ sử dụng thông tin bạn cung cấp để liên hệ tư vấn sản phẩm/dịch vụ bạn quan tâm,
              không công khai và không chia sẻ cho bên thứ ba. Nếu không đồng ý, chúng tôi chỉ ghi nhận nhu cầu ẩn danh (không lưu họ tên, số điện thoại).
            </p>
            <label className="mt-3 flex cursor-pointer items-start gap-3">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-fpt-orange" />
              <span className="text-sm font-semibold">{CONSENT_TEXT}</span>
            </label>
          </div>
          )}

          <AnimatePresence initial={false}>
            {consent && !registered && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="grid gap-3 pt-1 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-sm font-bold">Họ và tên *</span>
                    <input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={80} autoComplete="name" className={field} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-bold">Số điện thoại *</span>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" maxLength={20} placeholder="09xx xxx xxx"
                      className={`${field} ${phone && !phoneOk ? "border-rose-400" : ""}`} />
                    {phone && !phoneOk && <span className="mt-1 block text-xs text-rose-300">Số điện thoại di động Việt Nam gồm 10 số, bắt đầu bằng 03/05/07/08/09.</span>}
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* trường bẫy bot */}
          <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} className="absolute -left-[9999px] h-0 w-0 opacity-0" aria-hidden />

          {err && <p className="rounded-xl bg-rose-500/15 px-4 py-2 text-sm font-semibold text-rose-200">{err}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button type="button" variant="ghost" onClick={close} className="sm:flex-1">Bỏ qua</Button>
            <Button type="submit" disabled={busy} className="sm:flex-[2]">
              {busy ? "Đang gửi…" : consent || registered ? "GỬI ĐĂNG KÝ TƯ VẤN" : "GỬI NHU CẦU (ẨN DANH)"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
