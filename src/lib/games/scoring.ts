/**
 * Thuật toán tính điểm thuần (không phụ thuộc server/DB) — dùng chung cho máy chủ & kiểm thử.
 * Máy chủ là nơi DUY NHẤT quyết định điểm; client chỉ hiển thị.
 */
import type { DiffRegion } from "../db/schema";
import type { FindDiffConfig, PerfectStopConfig, QuizConfig } from "./defs";

// ---------------- PERFECT STOP ----------------
export const norm360 = (a: number) => ((a % 360) + 360) % 360;

/** Góc kim (độ, 0 = 12 giờ, chiều kim đồng hồ dương) tại thời điểm elapsedMs. */
export function needleAngle(startAngle: number, dir: 1 | -1, speed: number, elapsedMs: number) {
  return norm360(startAngle + dir * speed * (elapsedMs / 1000));
}

/** Độ lệch có dấu trong [-180, 180): dương = kim đã vượt qua tâm theo chiều chuyển động (nhấn muộn). */
export function signedDeviation(stopAngle: number, targetCenter: number, dir: 1 | -1) {
  const d = norm360(stopAngle - targetCenter + 180) - 180;
  return d * dir;
}

export type StopVerdict = "perfect" | "zone" | "near" | "miss" | "timeout";

export function scoreStop(absDev: number | null, zoneWidth: number, points: number, cfg: Pick<PerfectStopConfig, "perfectToleranceDeg">) {
  if (absDev == null) return { verdict: "timeout" as StopVerdict, score: 0 };
  const half = zoneWidth / 2;
  const tol = Math.min(cfg.perfectToleranceDeg, half);
  if (absDev <= tol) return { verdict: "perfect" as StopVerdict, score: points };
  if (absDev <= half) {
    // trong vùng: 50% → 100% tuyến tính theo khoảng cách tới tâm
    const t = (absDev - tol) / Math.max(half - tol, 0.0001);
    return { verdict: "zone" as StopVerdict, score: Math.round(points * (1 - 0.5 * t)) };
  }
  const NEAR = 20;
  if (absDev <= half + NEAR) {
    // sát vùng: tối đa 20% điểm, giảm dần về 0
    return { verdict: "near" as StopVerdict, score: Math.round(points * 0.2 * (1 - (absDev - half) / NEAR)) };
  }
  return { verdict: "miss" as StopVerdict, score: 0 };
}

/**
 * Kiểm tra thời điểm nhấn do client báo có hợp lệ với đồng hồ máy chủ:
 * - không thể nhấn "trong tương lai" (lớn hơn thời gian thực đã trôi qua kể từ khi máy chủ phát vòng chơi),
 * - không trễ quá giới hạn mạng cho phép.
 */
export function plausibleElapsed(elapsedMs: number, serverElapsedMs: number, limitMs: number, maxLatencyMs = 4000) {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return false;
  if (elapsedMs > limitMs + 250) return false;
  if (elapsedMs > serverElapsedMs + 150) return false;
  if (serverElapsedMs - elapsedMs > maxLatencyMs) return false;
  return true;
}

// ---------------- QUIZ ----------------
export function scoreAnswer(correct: boolean, elapsedMs: number, cfg: Pick<QuizConfig, "timePerQuestionSec" | "pointsCorrect" | "speedBonusMax">) {
  if (!correct) return 0;
  const limit = cfg.timePerQuestionSec * 1000;
  const remain = Math.max(0, Math.min(1, 1 - elapsedMs / limit));
  return cfg.pointsCorrect + Math.round(cfg.speedBonusMax * remain);
}

// ---------------- FIND THE DIFFERENCE ----------------
/** Dung sai chạm (theo tỉ lệ chiều rộng ảnh) để thao tác ngón tay trên điện thoại dễ trúng. */
export const TOUCH_TOLERANCE = 0.015;

export function hitRegion(regions: DiffRegion[], x: number, y: number, width: number, height: number, exclude: Set<string>) {
  let best: { id: string; d: number } | null = null;
  for (const r of regions) {
    if (exclude.has(r.id)) continue;
    const dx = (r.x - x) * width;
    const dy = (r.y - y) * height;
    const d = Math.hypot(dx, dy);
    const limit = (r.r + TOUCH_TOLERANCE) * width;
    if (d <= limit && (!best || d < best.d)) best = { id: r.id, d };
  }
  return best?.id ?? null;
}

export function scoreFindDiff(
  p: { found: number; total: number; wrong: number; hints: number; remainingSec: number },
  cfg: FindDiffConfig,
) {
  const base = p.found * cfg.pointsPerDiff;
  const timeBonus = p.found === p.total ? Math.round(Math.max(0, p.remainingSec) * cfg.timeBonusPerSec) : 0;
  const wrongPenalty = Math.max(0, p.wrong - cfg.freeWrongClicks) * cfg.wrongClickPenalty;
  const hintPenalty = p.hints * cfg.hintPenalty;
  const score = Math.max(0, base + timeBonus - wrongPenalty - hintPenalty);
  return { score, base, timeBonus, wrongPenalty, hintPenalty };
}
