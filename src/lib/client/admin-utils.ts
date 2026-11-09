"use client";
import { api } from "./api";

/** Nén ảnh phía trình duyệt sang WebP (giữ nét, giảm dung lượng) trước khi tải lên. */
export async function compressImage(file: File, maxW = 1600, quality = 0.86): Promise<{ file: File; width: number; height: number }> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxW / bmp.width);
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  c.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
  const blob: Blob = await new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Không nén được ảnh"))), "image/webp", quality));
  return { file: new File([blob], file.name.replace(/\.\w+$/, "") + ".webp", { type: "image/webp" }), width: w, height: h };
}

export async function uploadMedia(file: File): Promise<{ id: number; url: string }> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/media", { method: "POST", body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Tải lên thất bại");
  return data;
}

function download(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/** CSV UTF-8 có BOM — mở trực tiếp bằng Excel không lỗi font tiếng Việt. */
export function downloadCSV(rows: Record<string, unknown>[], columns: { key: string; label: string }[], name: string) {
  const esc = (v: unknown) => {
    const s = v == null ? "" : Array.isArray(v) ? v.join("; ") : v instanceof Date ? v.toISOString() : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [columns.map((c) => esc(c.label)).join(","), ...rows.map((r) => columns.map((c) => esc(r[c.key])).join(","))].join("\r\n");
  download(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }), name + ".csv");
}

export async function downloadXLSX(rows: Record<string, unknown>[], columns: { key: string; label: string }[], name: string) {
  const { default: writeXlsxFile } = await import("write-excel-file");
  const data = [
    columns.map((c) => ({ value: c.label, fontWeight: "bold" as const })),
    ...rows.map((r) =>
      columns.map((c) => {
        const v = r[c.key];
        if (typeof v === "number") return { type: Number, value: v };
        if (typeof v === "boolean") return { type: String, value: v ? "Có" : "Không" };
        return { type: String, value: v == null ? "" : Array.isArray(v) ? v.join("; ") : String(v) };
      }),
    ),
  ];
  // thư viện tự tải file xuống khi có fileName
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await writeXlsxFile(data as any, { columns: columns.map(() => ({ width: 22 })), fileName: name + ".xlsx" } as any);
}

export const fmtDate = (v: unknown) => (v ? new Date(v as string).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "");

export function todayVN(offsetDays = 0) {
  return new Date(Date.now() + 7 * 3600_000 + offsetDays * 86400_000).toISOString().slice(0, 10);
}

export type Filters = { from: string; to: string; campaign: string; demo: boolean };
export const defaultFilters = (): Filters => ({ from: todayVN(-29), to: todayVN(), campaign: "", demo: false });
export const filterQS = (f: Filters, extra: Record<string, string> = {}) =>
  new URLSearchParams({ from: f.from, to: f.to, ...(f.campaign ? { campaign: f.campaign } : {}), ...(f.demo ? { demo: "1" } : {}), ...extra }).toString();

export { api };
