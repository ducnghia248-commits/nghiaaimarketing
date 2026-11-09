"use client";
import { useEffect, useState } from "react";
import { Card, Notice, PageTitle } from "@/components/admin/AdminShell";
import { FilterBar } from "@/components/admin/FilterBar";
import { api, defaultFilters, filterQS, type Filters } from "@/lib/client/admin-utils";
import { NEEDS, PRODUCTS } from "@/lib/games/defs";

type Stats = {
  filters: { includeDemo: boolean; from: string; to: string };
  demoRecords: number;
  traffic: { visits: number; visitors: number; starters: number };
  play: { players: number; started: number; completed: number };
  startRate: number | null;
  completionRate: number | null;
  perGame: { game_id: string; started: number; completed: number; avg_score: number | null; avg_pct: number | null; avg_ms: number | null }[];
  playersAllThree: number;
  leads: { total: number; consented: number; registered: number; consult: number };
  products: { product: string; n: number }[];
  needs: { need: string; n: number }[];
  provinces: { province: string; n: number }[];
  daily: { day: string; visits: number; sessions: number; completed: number; leads: number }[];
};

const GAME_NAMES: Record<string, string> = { "perfect-stop": "Perfect Stop", quiz: "FPT Smart Quiz", "find-diff": "Find the Difference" };
const label = (arr: readonly { id: string; label: string }[], id: string) => arr.find((x) => x.id === id)?.label ?? id;

export default function Dashboard() {
  const [f, setF] = useState<Filters>(defaultFilters);
  const [s, setS] = useState<Stats | null>(null);
  const [err, setErr] = useState("");
  const [metric, setMetric] = useState<"visits" | "sessions" | "completed" | "leads">("sessions");

  useEffect(() => {
    setErr("");
    api<Stats>(`/api/admin/stats?${filterQS(f)}`).then(setS).catch((e) => setErr(e.message));
  }, [f]);

  return (
    <>
      <PageTitle title="Dashboard thống kê" desc="Số liệu chiến dịch Mini Game theo thời gian thực (giờ Việt Nam)." />
      <FilterBar value={f} onChange={setF} />
      {err && <Notice kind="error">{err}</Notice>}
      {s && f.demo && <div className="mb-3"><Notice kind="warn">⚠ Đang HIỂN THỊ CẢ DỮ LIỆU DEMO — số liệu không phản ánh thực tế.</Notice></div>}
      {s && !f.demo && s.demoRecords > 0 && <div className="mb-3"><Notice>Số liệu bên dưới là dữ liệu THỰC TẾ (đã loại {s.demoRecords} người chơi demo).</Notice></div>}
      {!s && !err && <div className="h-64 animate-pulse rounded-xl bg-slate-200" />}
      {s && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
            <Kpi label="Lượt truy cập" value={s.traffic.visits} sub={`${s.traffic.visitors} khách truy cập`} />
            <Kpi label="Tổng người chơi" value={s.play.players} />
            <Kpi label="Tổng lượt chơi" value={s.play.started} sub={`${s.play.completed} hoàn thành`} />
            <Kpi label="Tỷ lệ bắt đầu chơi" value={s.startRate == null ? "—" : `${s.startRate}%`} sub="bấm Bắt đầu / khách truy cập" />
            <Kpi label="Tỷ lệ hoàn thành" value={s.completionRate == null ? "—" : `${s.completionRate}%`} sub="lượt hoàn thành / lượt chơi" />
            <Kpi label="Hoàn thành cả 3 game" value={s.playersAllThree} />
            <Kpi label="Khách đăng ký (tên + SĐT)" value={s.leads.registered} accent />
            <Kpi label="Khách để lại thông tin" value={s.leads.total} sub="đăng ký + khảo sát nhu cầu" />
            <Kpi label="Đồng ý nhận tư vấn" value={s.leads.consented} />
            <Kpi label="Gửi yêu cầu tư vấn" value={s.leads.consult} sub="đã chọn sản phẩm / nhu cầu" />
          </div>

          <Card>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-bold">Diễn biến theo ngày</h2>
              <div className="flex gap-1 text-xs">
                {([["sessions", "Lượt chơi"], ["completed", "Hoàn thành"], ["visits", "Truy cập"], ["leads", "Khách hàng"]] as const).map(([k, l]) => (
                  <button key={k} onClick={() => setMetric(k)} className={`rounded-md px-2.5 py-1 font-semibold ${metric === k ? "bg-[#1369b4] text-white" : "border border-slate-300"}`}>{l}</button>
                ))}
              </div>
            </div>
            <DailyBars data={fillDays(s.daily, s.filters.from, s.filters.to)} metric={metric} />
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h2 className="mb-3 font-bold">Lượt chơi từng game</h2>
              <table>
                <thead><tr><th>Game</th><th>Lượt chơi</th><th>Hoàn thành</th><th>Điểm TB</th><th>% điểm TB</th><th>Thời gian TB</th></tr></thead>
                <tbody>
                  {["perfect-stop", "quiz", "find-diff"].map((g) => {
                    const r = s.perGame.find((x) => x.game_id === g);
                    return (
                      <tr key={g}>
                        <td className="font-semibold">{GAME_NAMES[g]}</td>
                        <td>{r?.started ?? 0}</td>
                        <td>{r?.completed ?? 0}</td>
                        <td>{r?.avg_score ?? "—"}</td>
                        <td>{r?.avg_pct != null ? `${r.avg_pct}%` : "—"}</td>
                        <td>{r?.avg_ms != null ? `${Math.round(r.avg_ms / 1000)}s` : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
            <Card>
              <h2 className="mb-3 font-bold">Phân bố nhu cầu sản phẩm</h2>
              <HBars rows={s.products.map((p) => ({ label: label(PRODUCTS, p.product), n: p.n }))} />
              <h3 className="mb-2 mt-5 text-sm font-bold text-slate-600">Nhu cầu</h3>
              <HBars rows={s.needs.map((p) => ({ label: label(NEEDS, p.need), n: p.n }))} />
            </Card>
          </div>
          <Card>
            <h2 className="mb-3 font-bold">Phân bố khách hàng theo khu vực (Top 15)</h2>
            <HBars rows={s.provinces.map((p) => ({ label: p.province, n: p.n }))} />
          </Card>
        </div>
      )}
    </>
  );
}

function Kpi({ label, value, sub, accent }: { label: string; value: number | string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? "border-orange-200 bg-orange-50" : "border-slate-200 bg-white"}`}>
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-black tabular-nums text-slate-900">{typeof value === "number" ? value.toLocaleString("vi-VN") : value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-slate-500">{sub}</div>}
    </div>
  );
}

/** Thanh ngang một màu (độ lớn), nhãn & giá trị bằng màu chữ. */
function HBars({ rows }: { rows: { label: string; n: number }[] }) {
  if (!rows.length) return <p className="text-sm text-slate-400">Chưa có dữ liệu.</p>;
  const max = Math.max(...rows.map((r) => r.n));
  return (
    <div className="space-y-1.5">
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[130px_1fr_40px] items-center gap-2 text-sm" title={`${r.label}: ${r.n}`}>
          <span className="truncate text-slate-700">{r.label}</span>
          <div className="h-3 rounded-full bg-slate-100">
            <div className="h-3 rounded-full bg-[#1369b4]" style={{ width: `${(100 * r.n) / max}%` }} />
          </div>
          <span className="text-right font-semibold tabular-nums text-slate-800">{r.n}</span>
        </div>
      ))}
    </div>
  );
}

/** Bổ sung các ngày không phát sinh dữ liệu (giá trị 0) để trục thời gian liên tục. */
function fillDays(data: Stats["daily"], from: string, to: string): Stats["daily"] {
  const map = new Map(data.map((d) => [d.day, d]));
  const out: Stats["daily"] = [];
  for (let t = new Date(from + "T00:00:00Z").getTime(), end = new Date(to + "T00:00:00Z").getTime(); t <= end && out.length < 400; t += 86400_000) {
    const day = new Date(t).toISOString().slice(0, 10);
    out.push(map.get(day) ?? { day, visits: 0, sessions: 0, completed: 0, leads: 0 });
  }
  return out;
}

function DailyBars({ data, metric }: { data: Stats["daily"]; metric: "visits" | "sessions" | "completed" | "leads" }) {
  const [hover, setHover] = useState<number | null>(null);
  if (!data.length) return <p className="py-10 text-center text-sm text-slate-400">Chưa có dữ liệu trong khoảng thời gian này.</p>;
  const max = Math.max(1, ...data.map((d) => d[metric]));
  const h = hover != null ? data[hover] : null;
  return (
    <div>
      <div className="mb-1 h-5 text-xs text-slate-600">
        {h ? <><b>{h.day}</b>: {h[metric].toLocaleString("vi-VN")}</> : <span className="text-slate-400">Rê chuột lên cột để xem chi tiết · Tối đa {max}</span>}
      </div>
      <div className="flex h-44 items-end gap-[2px] border-b border-slate-300">
        {data.map((d, i) => (
          <div key={d.day} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className="flex h-full flex-1 items-end" title={`${d.day}: ${d[metric]}`}>
            <div className={`w-full rounded-t ${hover === i ? "bg-[#f07629]" : "bg-[#1369b4]"}`} style={{ height: `${(100 * d[metric]) / max}%`, minHeight: d[metric] ? 2 : 0 }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-slate-500">
        <span>{data[0].day}</span>
        <span>{data[data.length - 1].day}</span>
      </div>
    </div>
  );
}
