"use client";
import { useEffect, useState } from "react";
import { Btn, Card, Notice, PageTitle, useAdmin } from "@/components/admin/AdminShell";
import { FilterBar } from "@/components/admin/FilterBar";
import { api, defaultFilters, downloadCSV, downloadXLSX, filterQS, fmtDate, type Filters } from "@/lib/client/admin-utils";
import { NEEDS, PRODUCTS } from "@/lib/games/defs";

type Lead = {
  id: number; full_name: string | null; phone: string | null; province: string; area: string; products: string[]; need: string;
  consent: boolean; consent_at: string | null; campaign_code: string | null; source: string; status: string; is_demo: boolean; created_at: string;
  nickname: string | null; total_score: number;
};
const SOURCE: Record<string, string> = { register: "Đăng ký chơi", consult: "Yêu cầu tư vấn" };
const STATUS: Record<string, string> ={ new: "Mới", contacted: "Đã liên hệ", done: "Hoàn tất" };
const COLS = [
  { key: "created_at", label: "Thời gian" }, { key: "source", label: "Nguồn" }, { key: "full_name", label: "Họ tên" }, { key: "phone", label: "Số điện thoại" },
  { key: "province", label: "Tỉnh/TP" }, { key: "area", label: "Khu vực" }, { key: "products", label: "Sản phẩm quan tâm" },
  { key: "need", label: "Nhu cầu" }, { key: "consent", label: "Đồng ý liên hệ" }, { key: "campaign_code", label: "Chiến dịch" },
  { key: "nickname", label: "Người chơi" }, { key: "total_score", label: "Tổng điểm" }, { key: "status", label: "Trạng thái" }, { key: "is_demo", label: "Demo" },
];
const lbl = (arr: readonly { id: string; label: string }[], id: string) => arr.find((x) => x.id === id)?.label ?? id;

export default function LeadsAdmin() {
  const admin = useAdmin();
  const [f, setF] = useState<Filters>(defaultFilters);
  const [consentOnly, setConsentOnly] = useState(true);
  const [rows, setRows] = useState<Lead[] | null>(null);
  const [err, setErr] = useState("");
  const qs = (extra: Record<string, string> = {}) => filterQS(f, { ...(consentOnly ? { consent: "1" } : {}), ...extra });
  const load = () => api<{ leads: Lead[] }>(`/api/admin/leads?${qs()}`).then((r) => setRows(r.leads)).catch((e) => setErr(e.message));
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f, consentOnly]);

  if (admin.role !== "admin") return <Notice kind="error">Chỉ quản trị viên được xem dữ liệu khách hàng.</Notice>;

  const setStatus = async (id: number, status: string) => {
    await api(`/api/admin/leads/${id}`, { status }, "PATCH");
    setRows((r) => r?.map((x) => (x.id === id ? { ...x, status } : x)) ?? null);
  };
  const exp = async (kind: "csv" | "xlsx") => {
    const r = await api<{ leads: Lead[] }>(`/api/admin/leads?${qs({ export: "1" })}`);
    const data = r.leads.map((l) => ({
      ...l, created_at: fmtDate(l.created_at), products: l.products.map((p) => lbl(PRODUCTS, p)).join(", "),
      need: lbl(NEEDS, l.need), status: STATUS[l.status] ?? l.status, source: SOURCE[l.source] ?? l.source,
    }));
    if (kind === "csv") downloadCSV(data, COLS, "khach-hang-tu-van");
    else await downloadXLSX(data, COLS, "khach-hang-tu-van");
  };

  return (
    <>
      <PageTitle title="Khách hàng đăng ký tư vấn" desc="Dữ liệu cá nhân — chỉ dùng để liên hệ tư vấn đúng mục đích đã thông báo. Mọi lần xuất file được ghi nhật ký." />
      <FilterBar value={f} onChange={setF}>
        <label className="flex items-center gap-2 text-xs font-bold text-slate-600"><input type="checkbox" checked={consentOnly} onChange={(e) => setConsentOnly(e.target.checked)} /> Chỉ khách đồng ý liên hệ</label>
        <Btn variant="ghost" onClick={() => exp("csv")}>Xuất CSV</Btn>
        <Btn variant="ghost" onClick={() => exp("xlsx")}>Xuất Excel</Btn>
      </FilterBar>
      {err && <Notice kind="error">{err}</Notice>}
      <Card className="overflow-x-auto p-0">
        <table>
          <thead><tr><th>Thời gian</th><th>Nguồn</th><th>Họ tên</th><th>SĐT</th><th>Khu vực</th><th>Sản phẩm</th><th>Nhu cầu</th><th>Chiến dịch</th><th>Điểm</th><th>Trạng thái</th></tr></thead>
          <tbody>
            {rows?.map((l) => (
              <tr key={l.id}>
                <td className="whitespace-nowrap text-xs">{fmtDate(l.created_at)}</td>
                <td><span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold ${l.source === "register" ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800"}`}>{SOURCE[l.source] ?? l.source}</span></td>
                <td className="font-semibold">{l.full_name ?? <i className="font-normal text-slate-400">ẩn danh</i>}{l.is_demo && <span className="ml-1 rounded bg-amber-100 px-1 text-[10px] font-bold text-amber-800">DEMO</span>}</td>
                <td className="whitespace-nowrap font-mono">{l.phone ?? "—"}</td>
                <td>{l.province}<div className="text-xs text-slate-500">{l.area}</div></td>
                <td className="text-xs">{l.products.map((p) => lbl(PRODUCTS, p)).join(", ")}</td>
                <td>{lbl(NEEDS, l.need)}</td>
                <td>{l.campaign_code ?? "—"}</td>
                <td>{l.total_score}</td>
                <td>
                  <select value={l.status} onChange={(e) => setStatus(l.id, e.target.value)} className="text-xs">
                    {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {rows && !rows.length && <tr><td colSpan={10} className="py-8 text-center text-slate-400">Chưa có khách hàng trong khoảng thời gian này.</td></tr>}
          </tbody>
        </table>
      </Card>
    </>
  );
}
