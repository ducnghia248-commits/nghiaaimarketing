"use client";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Btn, Card, Notice, PageTitle } from "@/components/admin/AdminShell";
import { api } from "@/lib/client/admin-utils";

type Campaign = {
  id?: number; code: string; name: string; description: string; active: boolean;
  startsAt: string | null; endsAt: string | null; playLimitPerDay: number | null;
};
const blank = (): Campaign => ({ code: "", name: "", description: "", active: true, startsAt: null, endsAt: null, playLimitPerDay: null });
const toLocal = (v: string | null) => (v ? new Date(v).toISOString().slice(0, 16) : "");

export default function CampaignsAdmin() {
  const [list, setList] = useState<Campaign[]>([]);
  const [edit, setEdit] = useState<Campaign | null>(null);
  const [qr, setQr] = useState<{ code: string; url: string; img: string } | null>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const load = () => api<{ campaigns: Campaign[] }>("/api/admin/campaigns").then((r) => setList(r.campaigns)).catch((e) => setMsg({ kind: "error", text: e.message }));
  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    if (!edit) return;
    try {
      const body = { ...edit, startsAt: edit.startsAt || null, endsAt: edit.endsAt || null };
      delete (body as { id?: number }).id;
      if (edit.id) await api(`/api/admin/campaigns/${edit.id}`, body, "PUT");
      else await api("/api/admin/campaigns", body);
      setEdit(null);
      setMsg({ kind: "ok", text: "Đã lưu chiến dịch." });
      await load();
    } catch (e) {
      setMsg({ kind: "error", text: (e as Error).message });
    }
  };
  const remove = async (c: Campaign) => {
    if (!confirm(`Xóa chiến dịch ${c.code}? (dữ liệu chơi đã ghi nhận vẫn được giữ)`)) return;
    await api(`/api/admin/campaigns/${c.id}`, undefined, "DELETE");
    await load();
  };
  const showQr = async (c: Campaign) => {
    const url = `${window.location.origin}/?c=${encodeURIComponent(c.code)}`;
    const img = await QRCode.toDataURL(url, { width: 512, margin: 2, color: { dark: "#071240", light: "#ffffff" } });
    setQr({ code: c.code, url, img });
  };

  return (
    <>
      <PageTitle title="Chiến dịch & mã QR" desc="Mỗi chiến dịch có link/QR riêng (Facebook, TikTok, sự kiện, cửa hàng) để thống kê và giới hạn lượt chơi." actions={<Btn onClick={() => setEdit(blank())}>+ Tạo chiến dịch</Btn>} />
      {msg && <div className="mb-3"><Notice kind={msg.kind}>{msg.text}</Notice></div>}
      {edit && (
        <Card className="mb-4 border-blue-300">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="text-xs font-semibold text-slate-600">Mã (in hoa, không dấu)<input value={edit.code} onChange={(e) => setEdit({ ...edit, code: e.target.value.toUpperCase() })} className="mt-1 w-full" placeholder="VD: BOOTH-HN-2026" /></label>
            <label className="text-xs font-semibold text-slate-600 md:col-span-2">Tên chiến dịch<input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className="mt-1 w-full" /></label>
            <label className="text-xs font-semibold text-slate-600">Bắt đầu<input type="datetime-local" value={toLocal(edit.startsAt)} onChange={(e) => setEdit({ ...edit, startsAt: e.target.value ? new Date(e.target.value).toISOString() : null })} className="mt-1 w-full" /></label>
            <label className="text-xs font-semibold text-slate-600">Kết thúc<input type="datetime-local" value={toLocal(edit.endsAt)} onChange={(e) => setEdit({ ...edit, endsAt: e.target.value ? new Date(e.target.value).toISOString() : null })} className="mt-1 w-full" /></label>
            <label className="text-xs font-semibold text-slate-600">Giới hạn lượt chơi / game / người / ngày<input type="number" min={1} value={edit.playLimitPerDay ?? ""} onChange={(e) => setEdit({ ...edit, playLimitPerDay: e.target.value ? Number(e.target.value) : null })} className="mt-1 w-full" placeholder="Không giới hạn" /></label>
            <label className="text-xs font-semibold text-slate-600 md:col-span-2">Mô tả<input value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} className="mt-1 w-full" /></label>
            <label className="flex items-end gap-2 pb-2 text-sm font-semibold"><input type="checkbox" checked={edit.active} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} /> Đang hoạt động</label>
          </div>
          <div className="mt-4 flex gap-2"><Btn onClick={save}>Lưu</Btn><Btn variant="ghost" onClick={() => setEdit(null)}>Hủy</Btn></div>
        </Card>
      )}
      {qr && (
        <Card className="mb-4 flex flex-wrap items-center gap-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr.img} alt={`QR ${qr.code}`} className="h-44 w-44 rounded border" />
          <div className="space-y-2 text-sm">
            <div className="font-bold">QR chiến dịch {qr.code}</div>
            <code className="block rounded bg-slate-100 px-2 py-1">{qr.url}</code>
            <div className="flex gap-2">
              <Btn variant="ghost" onClick={() => navigator.clipboard.writeText(qr.url)}>Sao chép link</Btn>
              <a href={qr.img} download={`qr-${qr.code}.png`} className="rounded-lg bg-[#1369b4] px-3.5 py-2 text-sm font-semibold text-white">Tải QR (PNG)</a>
              <Btn variant="ghost" onClick={() => setQr(null)}>Đóng</Btn>
            </div>
          </div>
        </Card>
      )}
      <Card className="overflow-x-auto p-0">
        <table>
          <thead><tr><th>Mã</th><th>Tên</th><th>Thời gian</th><th>Giới hạn/ngày</th><th>Trạng thái</th><th /></tr></thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id}>
                <td className="font-mono font-bold">{c.code}</td>
                <td>{c.name}<div className="text-xs text-slate-500">{c.description}</div></td>
                <td className="text-xs">{c.startsAt ? new Date(c.startsAt).toLocaleString("vi-VN") : "—"} → {c.endsAt ? new Date(c.endsAt).toLocaleString("vi-VN") : "—"}</td>
                <td>{c.playLimitPerDay ?? "∞"}</td>
                <td><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${c.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200"}`}>{c.active ? "Hoạt động" : "Tạm dừng"}</span></td>
                <td className="whitespace-nowrap font-semibold">
                  <button onClick={() => showQr(c)} className="mr-3 text-[#f07629]">QR / Link</button>
                  <button onClick={() => setEdit(c)} className="mr-3 text-[#1369b4]">Sửa</button>
                  <button onClick={() => remove(c)} className="text-rose-600">Xóa</button>
                </td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan={6} className="py-8 text-center text-slate-400">Chưa có chiến dịch. Người chơi truy cập link gốc vẫn được ghi nhận (không gắn chiến dịch).</td></tr>}
          </tbody>
        </table>
      </Card>
    </>
  );
}
