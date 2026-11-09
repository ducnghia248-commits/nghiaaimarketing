"use client";
import { useEffect, useState } from "react";
import { Btn, Card, Notice, PageTitle } from "@/components/admin/AdminShell";
import { api, compressImage, uploadMedia } from "@/lib/client/admin-utils";
import { maxScoreOf, type GameId } from "@/lib/games/defs";

type Game = {
  id: GameId; name: string; tagline: string; description: string; rules: string[]; estimatedTime: string;
  enabled: boolean; sortOrder: number; coverMediaId: number | null; config: Record<string, unknown>; updatedAt: string;
};

const FIELDS: Record<string, { key: string; label: string; step?: number; hint?: string }[]> = {
  "perfect-stop": [
    { key: "roundTimeLimitSec", label: "Thời gian mỗi vòng (giây)" },
    { key: "perfectToleranceDeg", label: "Sai số tính PERFECT (độ)", step: 0.1 },
    { key: "completionBonus", label: "Điểm thưởng hoàn thành" },
  ],
  quiz: [
    { key: "questionCount", label: "Số câu mỗi lượt (5–10)" },
    { key: "timePerQuestionSec", label: "Thời gian mỗi câu (giây)" },
    { key: "pointsCorrect", label: "Điểm mỗi câu đúng" },
    { key: "speedBonusMax", label: "Thưởng tốc độ tối đa / câu" },
  ],
  "find-diff": [
    { key: "timeLimitSec", label: "Thời gian giới hạn (giây)" },
    { key: "pointsPerDiff", label: "Điểm mỗi điểm khác biệt" },
    { key: "timeBonusPerSec", label: "Thưởng mỗi giây còn lại", step: 0.5 },
    { key: "freeWrongClicks", label: "Số lần click sai miễn phạt" },
    { key: "wrongClickPenalty", label: "Trừ điểm mỗi click sai" },
    { key: "maxHints", label: "Số lần gợi ý tối đa" },
    { key: "hintPenalty", label: "Trừ điểm mỗi lần gợi ý" },
  ],
};

export default function GamesAdmin() {
  const [games, setGames] = useState<Game[]>([]);
  const [err, setErr] = useState("");
  useEffect(() => {
    api<{ games: Game[] }>("/api/admin/games").then((r) => setGames(r.games)).catch((e) => setErr(e.message));
  }, []);
  return (
    <>
      <PageTitle title="Quản lý 3 trò chơi" desc="Bật/tắt, đổi tên, luật chơi, thời gian, điểm thưởng, độ khó và hình đại diện. Thay đổi có hiệu lực ngay cho lượt chơi mới." />
      {err && <Notice kind="error">{err}</Notice>}
      <div className="space-y-5">
        {games.map((g) => <GameEditor key={g.id} initial={g} />)}
      </div>
    </>
  );
}

function GameEditor({ initial }: { initial: Game }) {
  const [g, setG] = useState(initial);
  const [rulesText, setRulesText] = useState(initial.rules.join("\n"));
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const cfg = g.config as Record<string, unknown>;
  const setCfg = (k: string, v: unknown) => setG({ ...g, config: { ...cfg, [k]: v } });

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await api<{ game: Game }>(`/api/admin/games/${g.id}`, {
        name: g.name, tagline: g.tagline, description: g.description, estimatedTime: g.estimatedTime, enabled: g.enabled,
        sortOrder: g.sortOrder, coverMediaId: g.coverMediaId, config: g.config,
        rules: rulesText.split("\n").map((s) => s.trim()).filter(Boolean),
      }, "PUT");
      setG(r.game);
      setMsg({ kind: "ok", text: "Đã lưu cấu hình." });
    } catch (e) {
      setMsg({ kind: "error", text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const uploadCover = async (file: File) => {
    try {
      const c = await compressImage(file, 800);
      const m = await uploadMedia(c.file);
      setG({ ...g, coverMediaId: m.id });
    } catch (e) {
      setMsg({ kind: "error", text: (e as Error).message });
    }
  };

  let maxScore: number | string = "—";
  try {
    maxScore = maxScoreOf(g.id, g.config);
  } catch {}
  const levels = (cfg.levels as { label: string; speed: number; zoneWidth: number; points: number }[] | undefined) ?? [];

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs">{g.id}</span>
          <h2 className="text-lg font-black">{g.name}</h2>
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${g.enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>{g.enabled ? "Đang bật" : "Đang tắt"}</span>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={g.enabled} onChange={(e) => setG({ ...g, enabled: e.target.checked })} /> Bật game
          </label>
          <span className="text-sm text-slate-500">Điểm tối đa: <b>{maxScore}</b></span>
          <Btn onClick={save} disabled={busy}>{busy ? "Đang lưu…" : "Lưu"}</Btn>
        </div>
      </div>
      {msg && <div className="mt-3"><Notice kind={msg.kind}>{msg.text}</Notice></div>}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <L label="Tên trò chơi"><input value={g.name} onChange={(e) => setG({ ...g, name: e.target.value })} className="w-full" /></L>
          <L label="Khẩu hiệu"><input value={g.tagline} onChange={(e) => setG({ ...g, tagline: e.target.value })} className="w-full" /></L>
          <L label="Mô tả ngắn"><textarea rows={2} value={g.description} onChange={(e) => setG({ ...g, description: e.target.value })} className="w-full" /></L>
          <L label="Luật chơi (mỗi dòng một ý)"><textarea rows={5} value={rulesText} onChange={(e) => setRulesText(e.target.value)} className="w-full" /></L>
          <div className="grid grid-cols-2 gap-3">
            <L label="Thời gian dự kiến"><input value={g.estimatedTime} onChange={(e) => setG({ ...g, estimatedTime: e.target.value })} className="w-full" /></L>
            <L label="Thứ tự hiển thị"><input type="number" value={g.sortOrder} onChange={(e) => setG({ ...g, sortOrder: Number(e.target.value) })} className="w-full" /></L>
          </div>
          <L label="Hình đại diện thẻ game (tùy chọn)">
            <div className="flex items-center gap-3">
              {g.coverMediaId ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/api/media/${g.coverMediaId}`} alt="" className="h-14 rounded border" />
              ) : <span className="text-xs text-slate-400">Đang dùng minh họa mặc định</span>}
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])} className="text-xs" />
              {g.coverMediaId && <button onClick={() => setG({ ...g, coverMediaId: null })} className="text-xs text-rose-600">Bỏ ảnh</button>}
            </div>
          </L>
        </div>
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-600">Thiết lập luật & điểm</h3>
          <div className="grid grid-cols-2 gap-3">
            {FIELDS[g.id].map((f) => (
              <L key={f.key} label={f.label}>
                <input type="number" step={f.step ?? 1} value={Number(cfg[f.key] ?? 0)} onChange={(e) => setCfg(f.key, Number(e.target.value))} className="w-full" />
              </L>
            ))}
            {g.id === "quiz" && (
              <L label="Độ khó câu hỏi">
                <select value={String(cfg.difficulty)} onChange={(e) => setCfg("difficulty", e.target.value)} className="w-full">
                  <option value="mixed">Trộn lẫn</option><option value="easy">Dễ</option><option value="medium">Trung bình</option><option value="hard">Khó</option>
                </select>
              </L>
            )}
          </div>
          {g.id === "perfect-stop" && (
            <div>
              <h3 className="mb-2 text-sm font-bold text-slate-600">Các vòng / cấp độ (tăng dần độ khó)</h3>
              <table>
                <thead><tr><th>Tên</th><th>Tốc độ (°/s)</th><th>Vùng mục tiêu (°)</th><th>Điểm</th><th /></tr></thead>
                <tbody>
                  {levels.map((l, i) => (
                    <tr key={i}>
                      {(["label", "speed", "zoneWidth", "points"] as const).map((k) => (
                        <td key={k}>
                          <input
                            type={k === "label" ? "text" : "number"}
                            value={l[k]}
                            onChange={(e) => {
                              const next = levels.map((x, j) => (j === i ? { ...x, [k]: k === "label" ? e.target.value : Number(e.target.value) } : x));
                              setCfg("levels", next);
                            }}
                            className="w-full min-w-16"
                          />
                        </td>
                      ))}
                      <td><button onClick={() => setCfg("levels", levels.filter((_, j) => j !== i))} disabled={levels.length <= 1} className="text-rose-600 disabled:opacity-30">✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {levels.length < 6 && (
                <button onClick={() => setCfg("levels", [...levels, { label: "Siêu khó", speed: 400, zoneWidth: 12, points: 250 }])} className="mt-2 text-sm font-semibold text-[#1369b4]">+ Thêm vòng</button>
              )}
            </div>
          )}
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-400">Cập nhật lần cuối: {new Date(g.updatedAt).toLocaleString("vi-VN")}</p>
    </Card>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-slate-600">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}
