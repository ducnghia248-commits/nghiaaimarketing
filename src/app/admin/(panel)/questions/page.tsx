"use client";
import { useEffect, useMemo, useState } from "react";
import { Btn, Card, Notice, PageTitle } from "@/components/admin/AdminShell";
import { api, compressImage, downloadCSV, downloadXLSX, uploadMedia } from "@/lib/client/admin-utils";
import { DIFFICULTIES, QUESTION_PRODUCTS, QUESTION_TYPES } from "@/lib/games/defs";

type Q = {
  id: number; type: string; product: string; difficulty: string; question: string; options: string[];
  correctIndex: number; explanation: string; imageMediaId: number | null; active: boolean;
};
const empty = (): Omit<Q, "id"> => ({ type: "mcq", product: "internet", difficulty: "easy", question: "", options: ["", "", "", ""], correctIndex: 0, explanation: "", imageMediaId: null, active: true });
const lbl = (arr: readonly { id: string; label: string }[], id: string) => arr.find((x) => x.id === id)?.label ?? id;

const IMPORT_COLUMNS = [
  { key: "type", label: "loai (mcq|fill|product)" },
  { key: "product", label: "san_pham (internet|wifi|camera|smarthome|fptplay|general)" },
  { key: "difficulty", label: "do_kho (easy|medium|hard)" },
  { key: "question", label: "cau_hoi" },
  { key: "A", label: "dap_an_A" },
  { key: "B", label: "dap_an_B" },
  { key: "C", label: "dap_an_C" },
  { key: "D", label: "dap_an_D" },
  { key: "correct", label: "dap_an_dung (A|B|C|D)" },
  { key: "explanation", label: "giai_thich" },
];

export default function QuestionsAdmin() {
  const [list, setList] = useState<Q[]>([]);
  const [edit, setEdit] = useState<(Omit<Q, "id"> & { id?: number }) | null>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "error" | "warn"; text: string } | null>(null);
  const [q, setQ] = useState("");
  const [fp, setFp] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => api<{ questions: Q[] }>("/api/admin/questions").then((r) => setList(r.questions)).catch((e) => setMsg({ kind: "error", text: e.message }));
  useEffect(() => {
    void load();
  }, []);

  const shown = useMemo(
    () => list.filter((x) => (!fp || x.product === fp) && (!q || x.question.toLowerCase().includes(q.toLowerCase()))),
    [list, q, fp],
  );

  const save = async () => {
    if (!edit) return;
    setBusy(true);
    try {
      const body = { ...edit, options: edit.options.map((o) => o.trim()).filter(Boolean) };
      delete (body as { id?: number }).id;
      if (edit.id) await api(`/api/admin/questions/${edit.id}`, body, "PUT");
      else await api("/api/admin/questions", body);
      setEdit(null);
      setMsg({ kind: "ok", text: "Đã lưu câu hỏi." });
      await load();
    } catch (e) {
      setMsg({ kind: "error", text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Xóa câu hỏi này?")) return;
    try {
      await api(`/api/admin/questions/${id}`, undefined, "DELETE");
      await load();
    } catch (e) {
      setMsg({ kind: "error", text: (e as Error).message });
    }
  };

  const toggle = async (x: Q) => {
    const { id, ...rest } = x;
    await api(`/api/admin/questions/${id}`, { ...rest, active: !x.active }, "PUT");
    await load();
  };

  /** Nhập hàng loạt từ Excel (.xlsx) hoặc CSV theo file mẫu. */
  const importFile = async (file: File) => {
    setMsg(null);
    try {
      let rows: string[][];
      if (file.name.toLowerCase().endsWith(".csv")) {
        rows = parseCSV((await file.text()).replace(/^﻿/, ""));
      } else {
        const { default: readXlsxFile } = await import("read-excel-file");
        rows = (await readXlsxFile(file)).map((r) => r.map((c) => (c == null ? "" : String(c))));
      }
      const data = rows.slice(1).filter((r) => r.some((c) => c.trim())).map((r) => {
        const opts = [r[4], r[5], r[6], r[7]].map((s) => (s || "").trim()).filter(Boolean);
        const correctLetter = (r[8] || "A").trim().toUpperCase();
        return {
          type: (r[0] || "mcq").trim(), product: (r[1] || "general").trim(), difficulty: (r[2] || "easy").trim(),
          question: (r[3] || "").trim(), options: opts, correctIndex: Math.max(0, "ABCD".indexOf(correctLetter)),
          explanation: (r[9] || "").trim(), imageMediaId: null, active: true,
        };
      });
      const res = await api<{ imported: number; errors: { row: number; error: string }[] }>("/api/admin/questions/import", { rows: data });
      setMsg({
        kind: res.errors.length ? "warn" : "ok",
        text: `Đã nhập ${res.imported} câu hỏi.` + (res.errors.length ? ` ${res.errors.length} dòng lỗi: ` + res.errors.slice(0, 5).map((e) => `dòng ${e.row} (${e.error})`).join("; ") : ""),
      });
      await load();
    } catch (e) {
      setMsg({ kind: "error", text: (e as Error).message });
    }
  };

  const exportRows = list.map((x) => ({
    type: x.type, product: x.product, difficulty: x.difficulty, question: x.question,
    A: x.options[0], B: x.options[1], C: x.options[2] ?? "", D: x.options[3] ?? "", correct: "ABCD"[x.correctIndex], explanation: x.explanation,
  }));

  return (
    <>
      <PageTitle
        title="Ngân hàng câu hỏi FPT Smart Quiz"
        desc={`${list.filter((x) => x.active).length} câu đang dùng / ${list.length} câu. Mỗi lượt chơi lấy ngẫu nhiên từ các câu đang bật.`}
        actions={
          <>
            <Btn variant="ghost" onClick={() => downloadXLSX([], IMPORT_COLUMNS, "mau-nhap-cau-hoi")}>⬇ File mẫu Excel</Btn>
            <label className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold hover:bg-slate-50">
              ⬆ Nhập Excel/CSV
              <input type="file" accept=".xlsx,.csv" className="hidden" onChange={(e) => { if (e.target.files?.[0]) void importFile(e.target.files[0]); e.target.value = ""; }} />
            </label>
            <Btn variant="ghost" onClick={() => downloadCSV(exportRows, IMPORT_COLUMNS, "cau-hoi")}>Xuất CSV</Btn>
            <Btn onClick={() => setEdit(empty())}>+ Thêm câu hỏi</Btn>
          </>
        }
      />
      {msg && <div className="mb-3"><Notice kind={msg.kind}>{msg.text}</Notice></div>}

      {edit && (
        <Card className="mb-4 border-blue-300">
          <h2 className="mb-3 font-bold">{edit.id ? `Sửa câu hỏi #${edit.id}` : "Thêm câu hỏi mới"}</h2>
          <div className="grid gap-3 md:grid-cols-4">
            <Sel label="Dạng" value={edit.type} opts={QUESTION_TYPES} onChange={(v) => setEdit({ ...edit, type: v })} />
            <Sel label="Sản phẩm" value={edit.product} opts={QUESTION_PRODUCTS} onChange={(v) => setEdit({ ...edit, product: v })} />
            <Sel label="Độ khó" value={edit.difficulty} opts={DIFFICULTIES} onChange={(v) => setEdit({ ...edit, difficulty: v })} />
            <label className="flex items-end gap-2 pb-2 text-sm font-semibold"><input type="checkbox" checked={edit.active} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} /> Đang dùng</label>
          </div>
          <label className="mt-3 block text-xs font-semibold text-slate-600">
            Câu hỏi {edit.type === "fill" && <span className="font-normal text-slate-400">(dùng ___ để đánh dấu chỗ trống)</span>}
            <textarea rows={2} value={edit.question} onChange={(e) => setEdit({ ...edit, question: e.target.value })} className="mt-1 w-full" />
          </label>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <label key={i} className={`flex items-center gap-2 rounded-lg border p-2 ${edit.correctIndex === i ? "border-emerald-400 bg-emerald-50" : "border-slate-200"}`}>
                <input type="radio" name="correct" checked={edit.correctIndex === i} onChange={() => setEdit({ ...edit, correctIndex: i })} title="Đáp án đúng" />
                <b className="w-4">{"ABCD"[i]}</b>
                <input value={edit.options[i] ?? ""} onChange={(e) => { const o = [...edit.options]; o[i] = e.target.value; setEdit({ ...edit, options: o }); }} className="flex-1" placeholder={i < 2 ? "bắt buộc" : "tùy chọn"} />
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs text-slate-500">Chọn ô tròn để đặt đáp án đúng. Thứ tự đáp án sẽ được xáo trộn khi chơi.</p>
          <label className="mt-3 block text-xs font-semibold text-slate-600">
            Giải thích ngắn (hiện khi trả lời)
            <textarea rows={2} value={edit.explanation} onChange={(e) => setEdit({ ...edit, explanation: e.target.value })} className="mt-1 w-full" />
          </label>
          <div className="mt-3 flex items-center gap-3 text-xs font-semibold text-slate-600">
            Ảnh minh họa:
            {edit.imageMediaId ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/media/${edit.imageMediaId}`} alt="" className="h-12 rounded border" />
            ) : <span className="font-normal text-slate-400">không có</span>}
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                const c = await compressImage(f, 900);
                const m = await uploadMedia(c.file);
                setEdit({ ...edit, imageMediaId: m.id });
              } catch (err) {
                setMsg({ kind: "error", text: (err as Error).message });
              }
            }} />
            {edit.imageMediaId && <button onClick={() => setEdit({ ...edit, imageMediaId: null })} className="text-rose-600">Bỏ ảnh</button>}
          </div>
          <div className="mt-4 flex gap-2">
            <Btn onClick={save} disabled={busy}>{busy ? "Đang lưu…" : "Lưu câu hỏi"}</Btn>
            <Btn variant="ghost" onClick={() => setEdit(null)}>Hủy</Btn>
          </div>
        </Card>
      )}

      <Card className="overflow-x-auto p-0">
        <div className="flex flex-wrap gap-2 border-b p-3">
          <input placeholder="Tìm câu hỏi…" value={q} onChange={(e) => setQ(e.target.value)} className="min-w-60 flex-1" />
          <select value={fp} onChange={(e) => setFp(e.target.value)}>
            <option value="">Mọi sản phẩm</option>
            {QUESTION_PRODUCTS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>
        <table>
          <thead><tr><th>#</th><th>Câu hỏi</th><th>Đáp án đúng</th><th>Dạng</th><th>Sản phẩm</th><th>Độ khó</th><th>Trạng thái</th><th /></tr></thead>
          <tbody>
            {shown.map((x) => (
              <tr key={x.id} className={x.active ? "" : "opacity-50"}>
                <td>{x.id}</td>
                <td className="max-w-md">{x.question}{x.imageMediaId && " 🖼️"}</td>
                <td className="font-semibold text-emerald-700">{x.options[x.correctIndex]}</td>
                <td>{lbl(QUESTION_TYPES, x.type)}</td>
                <td>{lbl(QUESTION_PRODUCTS, x.product)}</td>
                <td>{lbl(DIFFICULTIES, x.difficulty)}</td>
                <td><button onClick={() => toggle(x)} className={`rounded-full px-2 py-0.5 text-xs font-bold ${x.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200"}`}>{x.active ? "Bật" : "Tắt"}</button></td>
                <td className="whitespace-nowrap">
                  <button onClick={() => setEdit({ ...x })} className="mr-3 font-semibold text-[#1369b4]">Sửa</button>
                  <button onClick={() => remove(x.id)} className="font-semibold text-rose-600">Xóa</button>
                </td>
              </tr>
            ))}
            {!shown.length && <tr><td colSpan={8} className="py-8 text-center text-slate-400">Không có câu hỏi.</td></tr>}
          </tbody>
        </table>
      </Card>
    </>
  );
}

function Sel({ label, value, opts, onChange }: { label: string; value: string; opts: readonly { id: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <label className="block text-xs font-semibold text-slate-600">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full">
        {opts.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
    </label>
  );
}

/** CSV parser tối giản hỗ trợ dấu ngoặc kép, dấu phẩy hoặc chấm phẩy. */
function parseCSV(text: string): string[][] {
  const sep = (text.split("\n")[0].match(/;/g)?.length ?? 0) > (text.split("\n")[0].match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [], cell = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') inQ = false;
      else cell += c;
    } else if (c === '"') inQ = true;
    else if (c === sep) { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
