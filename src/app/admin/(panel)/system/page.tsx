"use client";
import { useEffect, useState } from "react";
import { Btn, Card, Notice, PageTitle, useAdmin } from "@/components/admin/AdminShell";
import { api, fmtDate } from "@/lib/client/admin-utils";

type Log = { id: number; username: string; action: string; entity: string; entityId: string | null; before: unknown; after: unknown; createdAt: string };

export default function SystemAdmin() {
  const admin = useAdmin();
  const [logs, setLogs] = useState<Log[]>([]);
  const [open, setOpen] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "error" | "warn"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const load = () => api<{ logs: Log[] }>("/api/admin/audit").then((r) => setLogs(r.logs)).catch((e) => setMsg({ kind: "error", text: e.message }));
  useEffect(() => {
    if (admin.role === "admin") void load();
  }, [admin.role]);
  if (admin.role !== "admin") return <Notice kind="error">Chỉ quản trị viên được truy cập.</Notice>;

  const demo = async (action: "seed" | "clear") => {
    if (action === "clear" && !confirm("Xóa TOÀN BỘ dữ liệu demo? Dữ liệu thực tế không bị ảnh hưởng.")) return;
    setBusy(true);
    try {
      const r = await api<Record<string, number>>("/api/admin/demo", { action });
      setMsg({ kind: "ok", text: action === "seed" ? `Đã tạo dữ liệu DEMO: ${r.players} người chơi, ${r.sessions} lượt chơi, ${r.leads} khách hàng.` : `Đã xóa ${r.players} người chơi demo và dữ liệu liên quan.` });
      await load();
    } catch (e) {
      setMsg({ kind: "error", text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageTitle title="Dữ liệu & nhật ký hệ thống" />
      {msg && <div className="mb-3"><Notice kind={msg.kind}>{msg.text}</Notice></div>}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-bold">Dữ liệu DEMO</h2>
          <p className="mt-1 text-sm text-slate-500">Tạo dữ liệu mẫu để trình diễn Dashboard. Mọi bản ghi demo được đánh dấu riêng, không lên bảng xếp hạng công khai và bị loại khỏi thống kê mặc định.</p>
          <div className="mt-3 flex gap-2">
            <Btn variant="orange" onClick={() => demo("seed")} disabled={busy}>Tạo 120 người chơi demo</Btn>
            <Btn variant="danger" onClick={() => demo("clear")} disabled={busy}>Xóa dữ liệu demo</Btn>
          </div>
        </Card>
        <Card>
          <h2 className="font-bold">Sao lưu dữ liệu</h2>
          <p className="mt-1 text-sm text-slate-500">Tải bản sao lưu toàn bộ CSDL (JSON). Khôi phục bằng lệnh <code className="rounded bg-slate-100 px-1">npm run db:restore -- &lt;file&gt;</code>. Production nên kết hợp <code className="rounded bg-slate-100 px-1">pg_dump</code> định kỳ.</p>
          <a href="/api/admin/backup" className="mt-3 inline-block rounded-lg bg-[#1369b4] px-3.5 py-2 text-sm font-semibold text-white">⬇ Tải bản sao lưu</a>
        </Card>
      </div>
      <Card className="mt-4 overflow-x-auto p-0">
        <div className="border-b p-3 font-bold">Lịch sử thay đổi cấu hình (500 gần nhất)</div>
        <table>
          <thead><tr><th>Thời gian</th><th>Người thực hiện</th><th>Hành động</th><th>Đối tượng</th><th>Chi tiết</th></tr></thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="whitespace-nowrap text-xs">{fmtDate(l.createdAt)}</td>
                <td className="font-semibold">{l.username}</td>
                <td>{l.action}</td>
                <td>{l.entity}{l.entityId ? ` #${l.entityId}` : ""}</td>
                <td>
                  {(l.before != null || l.after != null) && (
                    <button onClick={() => setOpen(open === l.id ? null : l.id)} className="text-xs font-semibold text-[#1369b4]">{open === l.id ? "Ẩn" : "Xem"}</button>
                  )}
                  {open === l.id && (
                    <div className="mt-2 grid max-w-3xl gap-2 md:grid-cols-2">
                      <pre className="max-h-60 overflow-auto rounded bg-slate-50 p-2 text-[11px]">{JSON.stringify(l.before, null, 1)}</pre>
                      <pre className="max-h-60 overflow-auto rounded bg-emerald-50 p-2 text-[11px]">{JSON.stringify(l.after, null, 1)}</pre>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
