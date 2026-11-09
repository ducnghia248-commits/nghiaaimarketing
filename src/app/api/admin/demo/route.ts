import { z } from "zod";
import { getDb } from "@/lib/db";
import { audit, requireAdmin } from "@/lib/server/admin";
import { clearDemo, seedDemo } from "@/lib/server/demo";
import { handle, ok, readJson } from "@/lib/server/http";

const body = z.object({ action: z.enum(["seed", "clear"]) });

export const POST = handle(async (req: Request) => {
  const admin = await requireAdmin("admin");
  const { action } = body.parse(await readJson(req));
  const db = await getDb();
  const result = action === "seed" ? await seedDemo(db) : await clearDemo(db);
  await audit(admin, action === "seed" ? "seed-demo" : "clear-demo", "demo-data", null, undefined, result);
  return ok(result);
});
