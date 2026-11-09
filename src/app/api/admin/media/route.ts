import { getDb, schema } from "@/lib/db";
import { audit, requireAdmin } from "@/lib/server/admin";
import { HttpError, handle, ok } from "@/lib/server/http";

const ALLOWED: Record<string, number> = {
  "image/webp": 3 * 1024 * 1024,
  "image/png": 3 * 1024 * 1024,
  "image/jpeg": 3 * 1024 * 1024,
  "model/gltf-binary": 12 * 1024 * 1024,
};

/** Tải lên ảnh (đã được client nén sang WebP) hoặc mô hình 3D .glb. Lưu trong CSDL. */
export const POST = handle(async (req: Request) => {
  const admin = await requireAdmin();
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw new HttpError(400, "Thiếu file.");
  let mime = file.type;
  if (!mime && file.name.toLowerCase().endsWith(".glb")) mime = "model/gltf-binary";
  if (file.name.toLowerCase().endsWith(".glb")) mime = "model/gltf-binary";
  const max = ALLOWED[mime];
  if (!max) throw new HttpError(415, "Chỉ hỗ trợ ảnh PNG/JPEG/WebP hoặc mô hình .glb.");
  if (file.size > max) throw new HttpError(413, `File quá lớn (tối đa ${Math.round(max / 1024 / 1024)}MB).`);
  const data = Buffer.from(await file.arrayBuffer());
  // kiểm tra chữ ký file để chống giả mạo định dạng
  const sig = data.subarray(0, 12);
  const isPng = sig[0] === 0x89 && sig[1] === 0x50;
  const isJpg = sig[0] === 0xff && sig[1] === 0xd8;
  const isWebp = sig.toString("ascii", 0, 4) === "RIFF" && sig.toString("ascii", 8, 12) === "WEBP";
  const isGlb = sig.toString("ascii", 0, 4) === "glTF";
  const okSig = { "image/png": isPng, "image/jpeg": isJpg, "image/webp": isWebp, "model/gltf-binary": isGlb }[mime];
  if (!okSig) throw new HttpError(415, "Nội dung file không khớp định dạng.");
  const db = await getDb();
  const [m] = await db
    .insert(schema.media)
    .values({ mime, filename: file.name.slice(0, 120), size: data.length, data })
    .returning({ id: schema.media.id });
  await audit(admin, "upload", "media", m.id, undefined, { filename: file.name, mime, size: data.length });
  return ok({ id: m.id, url: `/api/media/${m.id}` });
});
