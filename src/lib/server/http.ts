import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { clientIp, rateLimit } from "./security";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const ok = (data: unknown, init?: ResponseInit) => NextResponse.json(data, init);

/** Bọc handler: chuẩn hóa lỗi thành JSON { error }. */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
      if (e instanceof ZodError) {
        const first = e.issues[0];
        return NextResponse.json({ error: `Dữ liệu không hợp lệ: ${first?.path.join(".")} ${first?.message}` }, { status: 400 });
      }
      console.error(e);
      return NextResponse.json({ error: "Lỗi máy chủ, vui lòng thử lại." }, { status: 500 });
    }
  };
}

export function limitOrThrow(req: Request, name: string, limit: number, windowMs: number) {
  if (!rateLimit(`${name}:${clientIp(req)}`, limit, windowMs)) {
    throw new HttpError(429, "Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.");
  }
}

export async function readJson(req: Request): Promise<unknown> {
  const ct = req.headers.get("content-type") || "";
  if (!ct.includes("application/json")) throw new HttpError(415, "Yêu cầu phải là JSON.");
  try {
    return await req.json();
  } catch {
    throw new HttpError(400, "JSON không hợp lệ.");
  }
}
