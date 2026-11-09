"use client";
import { useEffect, useState } from "react";
import { api, todayVN, type Filters } from "@/lib/client/admin-utils";

/** Bộ lọc theo thời gian, chiến dịch và dữ liệu demo — dùng chung cho các trang thống kê/danh sách. */
export function FilterBar({ value, onChange, children }: { value: Filters; onChange: (f: Filters) => void; children?: React.ReactNode }) {
  const [campaigns, setCampaigns] = useState<{ code: string; name: string }[]>([]);
  useEffect(() => {
    api<{ campaigns: { code: string; name: string }[] }>("/api/admin/campaigns").then((r) => setCampaigns(r.campaigns)).catch(() => {});
  }, []);
  const preset = (days: number) => onChange({ ...value, from: todayVN(-(days - 1)), to: todayVN() });
  return (
    <div className="mb-4 flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white p-3">
      <label className="text-xs font-semibold text-slate-500">
        Từ ngày
        <input type="date" value={value.from} onChange={(e) => onChange({ ...value, from: e.target.value })} className="mt-0.5 block" />
      </label>
      <label className="text-xs font-semibold text-slate-500">
        Đến ngày
        <input type="date" value={value.to} onChange={(e) => onChange({ ...value, to: e.target.value })} className="mt-0.5 block" />
      </label>
      <div className="flex gap-1">
        {[[1, "Hôm nay"], [7, "7 ngày"], [30, "30 ngày"]].map(([d, l]) => (
          <button key={d} onClick={() => preset(d as number)} className="rounded-md border border-slate-300 px-2 py-1.5 text-xs font-semibold hover:bg-slate-50">{l}</button>
        ))}
      </div>
      <label className="text-xs font-semibold text-slate-500">
        Chiến dịch
        <select value={value.campaign} onChange={(e) => onChange({ ...value, campaign: e.target.value })} className="mt-0.5 block">
          <option value="">Tất cả</option>
          {campaigns.map((c) => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
        </select>
      </label>
      <label className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-bold ${value.demo ? "bg-amber-100 text-amber-800" : "text-slate-600"}`}>
        <input type="checkbox" checked={value.demo} onChange={(e) => onChange({ ...value, demo: e.target.checked })} />
        Bao gồm dữ liệu DEMO
      </label>
      <div className="ml-auto flex gap-2">{children}</div>
    </div>
  );
}
