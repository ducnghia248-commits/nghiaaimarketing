"use client";
import { useEffect, useState } from "react";
import { Btn, Card, Notice, PageTitle } from "@/components/admin/AdminShell";
import { api, compressImage, uploadMedia } from "@/lib/client/admin-utils";

type Region = { id: string; x: number; y: number; r: number; label: string };
type Puzzle = {
  id?: number; title: string; theme: string; leftUrl: string; rightUrl: string; width: number; height: number;
  regions: Region[]; active: boolean; campaignCode: string | null;
};
const blank = (): Puzzle => ({ title: "", theme: "", leftUrl: "", rightUrl: "", width: 0, height: 0, regions: [], active: true, campaignCode: null });

export default function PuzzlesAdmin() {
  const [list, setList] = useState<Puzzle[]>([]);
  const [edit, setEdit] = useState<Puzzle | null>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "error" | "warn"; text: string } | null>(null);
  const load = () => api<{ puzzles: Puzzle[] }>("/api/admin/puzzles").then((r) => setList(r.puzzles)).catch((e) => setMsg({ kind: "error", text: e.message }));
  useEffect(() => {
    void load();
  }, []);

  const toggle = async (p: Puzzle) => {
    const { id, ...rest } = p;
    await api(`/api/admin/puzzles/${id}`, pick({ ...rest, active: !p.active }), "PUT");
    await load();
  };
  const remove = async (p: Puzzle) => {
    if (!confirm(`Xóa bộ hình "${p.title}"?`)) return;
    await api(`/api/admin/puzzles/${p.id}`, undefined, "DELETE");
    await load();
  };

  return (
    <>
      <PageTitle
        title="Quản lý FIND THE DIFFERENCE"
        desc="Tải cặp hình, đặt tọa độ vùng khác biệt (tự động thích ứng mọi kích thước màn hình), xem trước và gán theo chiến dịch."
        actions={<Btn onClick={() => setEdit(blank())}>+ Thêm bộ hình</Btn>}
      />
      {msg && <div className="mb-3"><Notice kind={msg.kind}>{msg.text}</Notice></div>}
      {edit ? (
        <Editor
          initial={edit}
          onCancel={() => setEdit(null)}
          onSaved={async () => {
            setEdit(null);
            setMsg({ kind: "ok", text: "Đã lưu bộ hình." });
            await load();
          }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => (
            <Card key={p.id} className={p.active ? "" : "opacity-60"}>
              <div className="grid grid-cols-2 gap-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.leftUrl} alt="" className="w-full rounded border" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.rightUrl} alt="" className="w-full rounded border" />
              </div>
              <div className="mt-2 flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold">{p.title}</div>
                  <div className="text-xs text-slate-500">
                    {p.regions.length} điểm khác · {p.theme || "—"} · {p.campaignCode ? `Chiến dịch ${p.campaignCode}` : "Mọi chiến dịch"}
                  </div>
                </div>
                <button onClick={() => toggle(p)} className={`rounded-full px-2 py-0.5 text-xs font-bold ${p.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200"}`}>{p.active ? "Bật" : "Tắt"}</button>
              </div>
              <div className="mt-3 flex gap-3 text-sm font-semibold">
                <button onClick={() => setEdit(p)} className="text-[#1369b4]">Sửa vùng</button>
                <a href={`/play/find-difference?preview=1&puzzle=${p.id}`} target="_blank" className="text-[#f07629]">Chơi thử ↗</a>
                <button onClick={() => remove(p)} className="ml-auto text-rose-600">Xóa</button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

const pick = (p: Omit<Puzzle, "id">) => ({
  title: p.title, theme: p.theme, leftUrl: p.leftUrl, rightUrl: p.rightUrl, width: p.width, height: p.height,
  regions: p.regions, active: p.active, campaignCode: p.campaignCode || null,
});

function Editor({ initial, onCancel, onSaved }: { initial: Puzzle; onCancel: () => void; onSaved: () => void }) {
  const [p, setP] = useState<Puzzle>(initial);
  const [sel, setSel] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");

  const upload = async (side: "left" | "right", file: File) => {
    setErr("");
    try {
      const c = await compressImage(file, 1600, 0.88);
      if (side === "right" && p.width && (Math.abs(c.width / c.height - p.width / p.height) > 0.01)) {
        throw new Error("Hai hình phải có cùng tỉ lệ khung hình.");
      }
      const m = await uploadMedia(c.file);
      setP((x) => side === "left" ? { ...x, leftUrl: m.url, width: c.width, height: c.height } : { ...x, rightUrl: m.url, ...(x.width ? {} : { width: c.width, height: c.height }) });
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const addAt = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    const hit = p.regions.find((g) => Math.hypot((g.x - x) * p.width, (g.y - y) * p.height) <= g.r * p.width);
    if (hit) return setSel(hit.id);
    const id = `d${Date.now().toString(36)}`;
    setP({ ...p, regions: [...p.regions, { id, x: +x.toFixed(4), y: +y.toFixed(4), r: 0.04, label: "" }] });
    setSel(id);
  };
  const upd = (id: string, patch: Partial<Region>) => setP({ ...p, regions: p.regions.map((g) => (g.id === id ? { ...g, ...patch } : g)) });

  const autoDetect = async () => {
    setInfo("Đang phân tích hai hình…");
    try {
      const found = await detectDifferences(p.leftUrl, p.rightUrl);
      setP({ ...p, regions: found.map((f, i) => ({ id: `auto${i + 1}`, ...f, label: "" })) });
      setInfo(`Đã gợi ý ${found.length} vùng khác biệt — hãy kiểm tra và tinh chỉnh trước khi lưu.`);
    } catch (e) {
      setInfo("");
      setErr((e as Error).message);
    }
  };

  const save = async () => {
    setBusy(true);
    setErr("");
    try {
      if (p.id) await api(`/api/admin/puzzles/${p.id}`, pick(p), "PUT");
      else await api("/api/admin/puzzles", pick(p));
      onSaved();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const ready = p.leftUrl && p.rightUrl && p.width;
  const selected = p.regions.find((g) => g.id === sel);

  const overlay = (editable: boolean) =>
    p.regions.map((g, i) => (
      <span key={g.id}
        className={`pointer-events-none absolute grid place-items-center rounded-full border-[3px] text-xs font-black ${g.id === sel ? "border-[#f07629] bg-orange-400/20 text-[#f07629]" : "border-cyan-400 bg-cyan-400/10 text-cyan-600"}`}
        style={{ left: `${g.x * 100}%`, top: `${g.y * 100}%`, width: `${g.r * 200}%`, aspectRatio: "1", transform: "translate(-50%,-50%)" }}>
        {editable ? i + 1 : ""}
      </span>
    ));

  return (
    <Card>
      <div className="grid gap-3 md:grid-cols-4">
        <label className="text-xs font-semibold text-slate-600 md:col-span-2">Tên bộ hình<input value={p.title} onChange={(e) => setP({ ...p, title: e.target.value })} className="mt-1 w-full" /></label>
        <label className="text-xs font-semibold text-slate-600">Chủ đề<input value={p.theme} onChange={(e) => setP({ ...p, theme: e.target.value })} className="mt-1 w-full" placeholder="VD: WiFi, FPT Camera" /></label>
        <label className="text-xs font-semibold text-slate-600">Mã chiến dịch (để trống = mọi chiến dịch)<input value={p.campaignCode ?? ""} onChange={(e) => setP({ ...p, campaignCode: e.target.value || null })} className="mt-1 w-full" /></label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
        <label className="font-semibold">Hình A (gốc): <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => e.target.files?.[0] && upload("left", e.target.files[0])} /></label>
        <label className="font-semibold">Hình B (khác biệt): <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => e.target.files?.[0] && upload("right", e.target.files[0])} /></label>
        <label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={p.active} onChange={(e) => setP({ ...p, active: e.target.checked })} /> Đang dùng</label>
      </div>
      <p className="mt-1 text-xs text-slate-500">Ảnh được tự động nén sang WebP (≤1600px) để tải nhanh mà vẫn sắc nét. Hai hình cần cùng kích thước.</p>
      {err && <div className="mt-3"><Notice kind="error">{err}</Notice></div>}
      {info && <div className="mt-3"><Notice>{info}</Notice></div>}

      {ready && (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Btn variant="orange" onClick={autoDetect}>✨ Tự động dò vùng khác biệt</Btn>
            <span className="text-sm text-slate-500">hoặc <b>click lên Hình A</b> để thêm vùng; click vào vùng có sẵn để chọn.</span>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div onClick={addAt} className="relative cursor-crosshair overflow-hidden rounded-lg border" style={{ aspectRatio: `${p.width}/${p.height}` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.leftUrl} alt="" className="pointer-events-none absolute inset-0 h-full w-full" />
              {overlay(true)}
            </div>
            <div className="relative overflow-hidden rounded-lg border" style={{ aspectRatio: `${p.width}/${p.height}` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.rightUrl} alt="" className="pointer-events-none absolute inset-0 h-full w-full" />
              {overlay(false)}
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_320px]">
            <table>
              <thead><tr><th>#</th><th>Mô tả</th><th>x</th><th>y</th><th>Bán kính</th><th /></tr></thead>
              <tbody>
                {p.regions.map((g, i) => (
                  <tr key={g.id} onClick={() => setSel(g.id)} className={`cursor-pointer ${g.id === sel ? "bg-orange-50" : ""}`}>
                    <td className="font-bold">{i + 1}</td>
                    <td><input value={g.label} onChange={(e) => upd(g.id, { label: e.target.value })} placeholder="VD: Ăng-ten router" className="w-full" /></td>
                    <td className="tabular-nums">{g.x.toFixed(3)}</td>
                    <td className="tabular-nums">{g.y.toFixed(3)}</td>
                    <td className="tabular-nums">{g.r.toFixed(3)}</td>
                    <td><button onClick={(e) => { e.stopPropagation(); setP({ ...p, regions: p.regions.filter((x) => x.id !== g.id) }); }} className="text-rose-600">✕</button></td>
                  </tr>
                ))}
                {!p.regions.length && <tr><td colSpan={6} className="py-6 text-center text-slate-400">Chưa có vùng khác biệt nào.</td></tr>}
              </tbody>
            </table>
            {selected && (
              <div className="rounded-lg border p-3 text-sm">
                <div className="font-bold">Tinh chỉnh vùng #{p.regions.indexOf(selected) + 1}</div>
                {(["x", "y"] as const).map((k) => (
                  <label key={k} className="mt-2 block text-xs font-semibold">{k.toUpperCase()}: {selected[k].toFixed(3)}
                    <input type="range" min={0} max={1} step={0.001} value={selected[k]} onChange={(e) => upd(selected.id, { [k]: Number(e.target.value) })} className="w-full p-0" />
                  </label>
                ))}
                <label className="mt-2 block text-xs font-semibold">Bán kính: {selected.r.toFixed(3)}
                  <input type="range" min={0.01} max={0.2} step={0.002} value={selected.r} onChange={(e) => upd(selected.id, { r: Number(e.target.value) })} className="w-full p-0" />
                </label>
              </div>
            )}
          </div>
        </>
      )}
      <div className="mt-5 flex gap-2">
        <Btn onClick={save} disabled={busy || !ready || !p.title || !p.regions.length}>{busy ? "Đang lưu…" : "Lưu bộ hình"}</Btn>
        <Btn variant="ghost" onClick={onCancel}>Hủy</Btn>
        {p.id && <a href={`/play/find-difference?preview=1&puzzle=${p.id}`} target="_blank" className="ml-auto self-center text-sm font-semibold text-[#f07629]">Chơi thử (bản đã lưu) ↗</a>}
      </div>
    </Card>
  );
}

/** So sánh điểm ảnh hai hình (thu nhỏ) để gợi ý các vùng khác biệt. */
async function detectDifferences(leftUrl: string, rightUrl: string) {
  const load = (src: string) => new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error("Không đọc được hình"));
    i.src = src;
  });
  const [a, b] = await Promise.all([load(leftUrl), load(rightUrl)]);
  const W = 240, H = Math.round((W * (a.naturalHeight || a.height)) / (a.naturalWidth || a.width));
  const px = (img: HTMLImageElement) => {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(img, 0, 0, W, H);
    return ctx.getImageData(0, 0, W, H).data;
  };
  const da = px(a), db = px(b);
  const CELL = 4, cw = Math.ceil(W / CELL), ch = Math.ceil(H / CELL);
  const cells = new Uint8Array(cw * ch);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const d = Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]);
      if (d > 70) cells[Math.floor(y / CELL) * cw + Math.floor(x / CELL)]++;
    }
  const mask = cells.map((n) => (n >= 3 ? 1 : 0));
  const seen = new Uint8Array(cw * ch);
  const out: { x: number; y: number; r: number }[] = [];
  for (let s = 0; s < mask.length; s++) {
    if (!mask[s] || seen[s]) continue;
    const stack = [s];
    seen[s] = 1;
    let minX = 1e9, minY = 1e9, maxX = -1, maxY = -1, n = 0;
    while (stack.length) {
      const c = stack.pop()!;
      const cx = c % cw, cy = Math.floor(c / cw);
      n++;
      minX = Math.min(minX, cx); maxX = Math.max(maxX, cx); minY = Math.min(minY, cy); maxY = Math.max(maxY, cy);
      for (let dy = -2; dy <= 2; dy++)
        for (let dx = -2; dx <= 2; dx++) {
          const nx = cx + dx, ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= cw || ny >= ch) continue;
          const k = ny * cw + nx;
          if (mask[k] && !seen[k]) { seen[k] = 1; stack.push(k); }
        }
    }
    if (n < 2) continue;
    const x = ((minX + maxX + 1) / 2) * CELL / W, y = ((minY + maxY + 1) / 2) * CELL / H;
    const r = Math.max(0.025, Math.min(0.15, (Math.max((maxX - minX + 1) * CELL, ((maxY - minY + 1) * CELL)) / 2 / W) * 1.2));
    out.push({ x: +x.toFixed(4), y: +y.toFixed(4), r: +r.toFixed(4) });
  }
  return out.sort((p, q) => q.r - p.r).slice(0, 15);
}
