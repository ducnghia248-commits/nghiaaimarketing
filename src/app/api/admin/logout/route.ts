import { clearAdminCookie } from "@/lib/server/admin";
import { handle, ok } from "@/lib/server/http";

export const POST = handle(async () => {
  await clearAdminCookie();
  return ok({ ok: true });
});
