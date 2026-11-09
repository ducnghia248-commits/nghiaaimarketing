"use client";
import { useEffect, useState } from "react";
import { Btn, Card, Notice, PageTitle } from "@/components/admin/AdminShell";
import { FilterBar } from "@/components/admin/FilterBar";
import { api, defaultFilters, downloadCSV, downloadXLSX, filterQS, fmtDate, type Filters } from "@/lib/client/admin-utils";
import { BADGES, type BadgeId } from "@/lib/games/defs";

type P = {
  id: string; nickname: string; campaign_code: string | null; is_demo: boolean; created_at: string; last_played: string;
  plays: number; games_done: number; total: number; badges: string | null; has_lead: boolean;
};
const COLS = [
  { key: "nickname", label: "Tên hiển thị" }, { key: "campaign_code", label: "Chiến dịch" }, { key: "created_at", label: "Tham gia lúc" },
  { key: "last_played", label: "Chơi gần nhất" }, { key: "plays", label: "Số lượt chơi" }, { key: "games_done", label: "Số game hoàn thành" },
  { key: "total", label: "Tổng điểm" }, { key: "badges", label: "Huy hiệu" }, { key: "has_lead", label: "Đăng ký tư vấn" }, { key: "is_demo", label: "Dữ liệu demo" },
];

export default function PlayersAdmin() {
  const [f, setF] = useState<Filters>(defaultFilters);
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<P[] | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      api<{ players: P[] }>(`/api/admin/players?${filterQS(f, q ? { q } : {})}`).then((r) => setRows(r.players)).catch((e) => setErr(e.message));
    }, 250);
    return () => clearTimeout(t);
  }, [f, q]);

  const exp = async (kind: "csv" | "xlsx") => {
    const r = await api<{ players: P[] }>(`/api/admin/players?${filterQS(f, { export: "1", ...(q ? { q } : {}) })}`);
    const data = r.players.map((p) => ({
      ...p, created_at: fmtDate(p.created_at), last_played: fmtDate(p.last_played),
      badges: (p.badges ?? "").split(",").filter(Boolean).map((b) => BADGES[b as BadgeId]?.name ?? b).join(", "),
    }));
    if (kind === "csv") downloadCSV(data, COLS, "nguoi-tham-gia");
    else await downloadXLSX(data, COLS, "nguoi-tham-gia");
  };

  return (
    <>
      <PageTitle title="Người tham gia" desc="Người chơi ẩn danh (chỉ tên hiển thị), điểm số và thành tích." />
      <FilterBar value={f} onChange={setF}>
        <Btn variant="ghost" onClick={() => exp("csv")}>Xuất CSV</Btn>
        <Btn variant="ghost" onClick={() => exp("xlsx")}>Xuất Excel</Btn>
      </FilterBar>
      {err && <Notice kind="error">{err}</Notice>}
      <Card className="overflow-x-auto p-0">
        <div className="border-b p-3"><input placeholder="Tìm theo tên hiển thị…" value={q} onChange={(e) => setQ(e.target.value)} className="w-full max-w-sm" /></div>
        <table>
          <thead><tr>{COLS.slice(0, 9).map((c) => <th key={c.key}>{c.label}</th>)}</tr></thead>
          <tbody>
            {rows?.map((p) => (
              <tr key={p.id}>
                <td className="font-semibold">{p.nickname}{p.is_demo && <span className="ml-1 rounded bg-amber-100 px-1 text-[10px] font-bold text-amber-800">DEMO</span>}</td>
                <td>{p.campaign_code ?? "—"}</td>
                <td className="text-xs">{fmtDate(p.created_at)}</td>
                <td className="text-xs">{fmtDate(p.last_played)}</td>
                <td>{p.plays}</td>
                <td>{p.games_done}/3</td>
                <td className="font-bold">{p.total}</td>
                <td>{(p.badges ?? "").split(",").filter(Boolean).map((b) => <span key={b} title={BADGES[b as BadgeId]?.name}>{BADGES[b as BadgeId]?.icon}</span>)}</td>
                <td>{p.has_lead ? "✅" : ""}</td>
              </tr>
            ))}
            {rows && !rows.length && <tr><td colSpan={9} className="py-8 text-center text-slate-400">Chưa có người chơi trong khoảng thời gian này.</td></tr>}
          </tbody>
        </table>
      </Card>
    </>
  );
}
