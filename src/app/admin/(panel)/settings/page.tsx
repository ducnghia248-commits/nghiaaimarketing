"use client";
import { useEffect, useState } from "react";
import { Btn, Card, Notice, PageTitle } from "@/components/admin/AdminShell";
import { api, compressImage, uploadMedia } from "@/lib/client/admin-utils";

type Branding = { logoMediaId: number | null; heroModelMediaId: number | null };

export default function SettingsAdmin() {
  const [b, setB] = useState<Branding | null>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  useEffect(() => {
    api<{ branding: Branding }>("/api/admin/settings").then((r) => setB(r.branding)).catch((e) => setMsg({ kind: "error", text: e.message }));
  }, []);
  if (!b) return null;

  const save = async (next: Branding) => {
    try {
      await api("/api/admin/settings", next, "PUT");
      setB(next);
      setMsg({ kind: "ok", text: "Đã cập nhật. Tải lại trang game để thấy thay đổi." });
    } catch (e) {
      setMsg({ kind: "error", text: (e as Error).message });
    }
  };
  const upLogo = async (f: File) => {
    try {
      const c = f.type === "image/png" ? { file: f } : await compressImage(f, 600, 0.92);
      const m = await uploadMedia(c.file);
      await save({ ...b, logoMediaId: m.id });
    } catch (e) {
      setMsg({ kind: "error", text: (e as Error).message });
    }
  };
  const upModel = async (f: File) => {
    try {
      const m = await uploadMedia(f);
      await save({ ...b, heroModelMediaId: m.id });
    } catch (e) {
      setMsg({ kind: "error", text: (e as Error).message });
    }
  };

  return (
    <>
      <PageTitle title="Thương hiệu & tài nguyên 3D" desc="Thay logo và mô hình 3D chính thức mà không cần sửa code." />
      {msg && <div className="mb-3"><Notice kind={msg.kind}>{msg.text}</Notice></div>}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-bold">Logo FPT Telecom</h2>
          <p className="mt-1 text-sm text-slate-500">Mặc định đang dùng logo placeholder dạng chữ. Tải logo chính thức (PNG nền trong suốt, cao ≥ 72px).</p>
          <div className="mt-3 flex items-center gap-4 rounded-lg bg-[#071240] p-4">
            {b.logoMediaId ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/media/${b.logoMediaId}`} alt="logo" className="h-10" />
            ) : <span className="text-sm text-white/70">(placeholder)</span>}
          </div>
          <div className="mt-3 flex items-center gap-3 text-sm">
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => e.target.files?.[0] && upLogo(e.target.files[0])} />
            {b.logoMediaId && <Btn variant="ghost" onClick={() => save({ ...b, logoMediaId: null })}>Dùng lại placeholder</Btn>}
          </div>
        </Card>
        <Card>
          <h2 className="font-bold">Mô hình 3D Landing Page (.glb)</h2>
          <p className="mt-1 text-sm text-slate-500">
            Mặc định là Router WiFi minh họa dựng bằng Three.js. Tải mô hình Router/thiết bị chính thức định dạng GLB (≤ 12MB, khuyến nghị &lt; 3MB, đã nén Draco/Meshopt sẽ không được hỗ trợ — dùng GLB thường).
            Mô hình được tự căn giữa và co giãn vừa khung.
          </p>
          <div className="mt-3 text-sm">Trạng thái: {b.heroModelMediaId ? <b className="text-emerald-700">Đang dùng mô hình tải lên (#{b.heroModelMediaId})</b> : <b>Router minh họa mặc định</b>}</div>
          <div className="mt-3 flex items-center gap-3 text-sm">
            <input type="file" accept=".glb,model/gltf-binary" onChange={(e) => e.target.files?.[0] && upModel(e.target.files[0])} />
            {b.heroModelMediaId && <Btn variant="ghost" onClick={() => save({ ...b, heroModelMediaId: null })}>Dùng lại mặc định</Btn>}
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <h2 className="font-bold">Hình đại diện từng game & hình Tìm điểm khác biệt</h2>
          <p className="mt-1 text-sm text-slate-500">Quản lý tại <a href="/admin/games" className="font-semibold text-[#1369b4]">Quản lý game</a> (ảnh thẻ game) và <a href="/admin/puzzles" className="font-semibold text-[#1369b4]">Tìm điểm khác biệt</a> (cặp hình theo chiến dịch).</p>
        </Card>
      </div>
    </>
  );
}
