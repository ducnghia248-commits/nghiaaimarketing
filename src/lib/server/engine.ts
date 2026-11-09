import { and, eq, sql } from "drizzle-orm";
import { getDb, rows, schema, type DB } from "../db";
import {
  BADGES, GAME_IDS, configSchemas, maxScoreOf,
  type BadgeId, type FindDiffConfig, type GameId, type PerfectStopConfig, type QuizConfig,
} from "../games/defs";
import {
  hitRegion, needleAngle, norm360, plausibleElapsed, scoreAnswer, scoreFindDiff, scoreStop, signedDeviation,
  type StopVerdict,
} from "../games/scoring";
import { HttpError } from "./http";
import { activeCampaign, currentCampaignCode, type Player } from "./player";
import { randomId } from "./security";

type Session = typeof schema.playSessions.$inferSelect;

// ---------------- Trạng thái phiên chơi (chỉ lưu ở máy chủ) ----------------
type PsRound = {
  label: string; speed: number; zoneWidth: number; points: number;
  target: number; start: number; dir: 1 | -1;
  issuedAt: number | null;
  result: null | { elapsedMs: number | null; stopAngle: number | null; deviation: number | null; verdict: StopVerdict; score: number };
};
type PsState = { cfg: PerfectStopConfig; rounds: PsRound[] };

type QuizAnswer = { qid: number; choice: number | null; correct: boolean; score: number; elapsedMs: number };
type QuizState = { cfg: QuizConfig; qids: number[]; perms: number[][]; current: number; servedAt: number | null; answers: QuizAnswer[] };

type DiffState = { cfg: FindDiffConfig; puzzleId: number; found: string[]; wrong: number; hints: number; hinted: string[] };

export type GameResult = {
  sessionId: string;
  gameId: GameId;
  gameName: string;
  score: number;
  maxScore: number;
  durationMs: number;
  details: Record<string, unknown>;
  newBadges: BadgeId[];
  summary: PlayerSummary;
};

export type PlayerSummary = {
  playerId: string;
  nickname: string;
  registered: boolean;
  fullName: string | null;
  /** chỉ trả về dạng che: 09xxxxx678 */
  phoneMasked: string | null;
  bests: Partial<Record<GameId, { score: number; maxScore: number; plays: number }>>;
  totalScore: number;
  completedGames: GameId[];
  allDone: boolean;
  badges: BadgeId[];
  rank: number | null;
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function loadGame(db: DB, gameId: GameId) {
  const [g] = await db.select().from(schema.games).where(eq(schema.games.id, gameId));
  if (!g) throw new HttpError(404, "Không tìm thấy trò chơi.");
  return g;
}

// =====================================================================
// BẮT ĐẦU LƯỢT CHƠI
// =====================================================================
export async function startSession(player: Player, gameId: GameId, opts: { puzzleId?: number; preview?: boolean } = {}) {
  const db = await getDb();
  const game = await loadGame(db, gameId);
  if (!game.enabled && !opts.preview) throw new HttpError(403, "Trò chơi này đang tạm dừng.");
  // Bắt buộc đăng ký họ tên + SĐT trước khi chơi (trừ admin chơi thử)
  if (!player.registeredAt && !opts.preview) throw new HttpError(428, "REGISTER_REQUIRED");
  const campaignCode = await currentCampaignCode(db);

  // Giới hạn lượt chơi theo chiến dịch
  const campaign = await activeCampaign(db, campaignCode);
  if (campaign?.playLimitPerDay && !opts.preview) {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    const [{ n }] = await rows<{ n: number }>(
      db,
      sql`select count(*)::int as n from play_sessions where player_id = ${player.id} and game_id = ${gameId} and started_at >= ${since.toISOString()}`,
    );
    if (n >= campaign.playLimitPerDay) {
      throw new HttpError(429, `Bạn đã dùng hết ${campaign.playLimitPerDay} lượt chơi hôm nay cho trò chơi này. Hẹn gặp lại ngày mai!`);
    }
  }

  const cfgParsed = configSchemas[gameId].parse(game.config);
  let state: Record<string, unknown>;
  let publicData: Record<string, unknown>;
  let maxScore: number;

  if (gameId === "perfect-stop") {
    const cfg = cfgParsed as PerfectStopConfig;
    const rounds: PsRound[] = cfg.levels.map((l) => ({ ...l, target: 0, start: 0, dir: 1, issuedAt: null, result: null }));
    state = { cfg, rounds } satisfies PsState;
    maxScore = maxScoreOf(gameId, cfg);
    publicData = { levels: cfg.levels.map((l) => ({ label: l.label, points: l.points })), roundTimeLimitSec: cfg.roundTimeLimitSec };
  } else if (gameId === "quiz") {
    const cfg = cfgParsed as QuizConfig;
    const all = await db.select({ id: schema.questions.id, difficulty: schema.questions.difficulty, n: schema.questions.options })
      .from(schema.questions).where(eq(schema.questions.active, true));
    const preferred = cfg.difficulty === "mixed" ? all : all.filter((q) => q.difficulty === cfg.difficulty);
    const rest = all.filter((q) => !preferred.includes(q));
    const picked = [...shuffle(preferred), ...shuffle(rest)].slice(0, cfg.questionCount);
    if (picked.length < 3) throw new HttpError(503, "Ngân hàng câu hỏi chưa đủ dữ liệu. Vui lòng quay lại sau.");
    state = {
      cfg, qids: picked.map((q) => q.id), perms: picked.map((q) => shuffle(q.n.map((_, i) => i))),
      current: 0, servedAt: null, answers: [],
    } satisfies QuizState;
    const effCfg = { ...cfg, questionCount: picked.length };
    maxScore = maxScoreOf(gameId, effCfg);
    publicData = { total: picked.length, timePerQuestionSec: cfg.timePerQuestionSec };
  } else {
    const cfg = cfgParsed as FindDiffConfig;
    let puzzle: typeof schema.puzzles.$inferSelect | undefined;
    if (opts.puzzleId && opts.preview) {
      [puzzle] = await db.select().from(schema.puzzles).where(eq(schema.puzzles.id, opts.puzzleId));
    } else {
      const list = await db.select().from(schema.puzzles).where(eq(schema.puzzles.active, true));
      const forCampaign = list.filter((p) => p.campaignCode && p.campaignCode === campaignCode);
      const pool = (forCampaign.length ? forCampaign : list.filter((p) => !p.campaignCode)).filter((p) => p.regions.length > 0);
      puzzle = pool[Math.floor(Math.random() * pool.length)];
    }
    if (!puzzle) throw new HttpError(503, "Chưa có bộ hình ảnh nào được kích hoạt.");
    state = { cfg, puzzleId: puzzle.id, found: [], wrong: 0, hints: 0, hinted: [] } satisfies DiffState;
    maxScore = maxScoreOf(gameId, cfg, puzzle.regions.length);
    publicData = {
      puzzle: {
        id: puzzle.id, title: puzzle.title, theme: puzzle.theme, leftUrl: puzzle.leftUrl, rightUrl: puzzle.rightUrl,
        width: puzzle.width, height: puzzle.height, total: puzzle.regions.length,
      },
      timeLimitSec: cfg.timeLimitSec,
      maxHints: cfg.maxHints,
    };
  }

  const id = randomId();
  await db.insert(schema.playSessions).values({
    id, playerId: player.id, gameId, campaignCode, state, maxScore, isDemo: Boolean(opts.preview) || player.isDemo,
  });
  return { sessionId: id, gameId, name: game.name, maxScore, ...publicData };
}

// =====================================================================
// THAO TÁC TRONG LƯỢT CHƠI
// =====================================================================
export async function sessionAction(player: Player, sessionId: string, action: string, payload: Record<string, unknown>) {
  const db = await getDb();
  const [s] = await db.select().from(schema.playSessions).where(eq(schema.playSessions.id, sessionId));
  if (!s || s.playerId !== player.id) throw new HttpError(404, "Không tìm thấy lượt chơi.");
  if (s.status !== "active") throw new HttpError(409, "Lượt chơi đã kết thúc.");

  const gameId = s.gameId as GameId;
  const ctx = { db, s, player };
  if (gameId === "perfect-stop") return perfectStopAction(ctx, action, payload);
  if (gameId === "quiz") return quizAction(ctx, action, payload);
  if (gameId === "find-diff") return diffAction(ctx, action, payload);
  throw new HttpError(400, "Trò chơi không hợp lệ.");
}

type Ctx = { db: DB; s: Session; player: Player };

/** Cập nhật trạng thái với khóa lạc quan (chống gửi trùng/đồng thời). */
async function saveState(ctx: Ctx, state: unknown, extra: Partial<Session> = {}) {
  const res = await ctx.db
    .update(schema.playSessions)
    .set({ state: state as Record<string, unknown>, version: ctx.s.version + 1, ...extra })
    .where(and(eq(schema.playSessions.id, ctx.s.id), eq(schema.playSessions.version, ctx.s.version)))
    .returning({ id: schema.playSessions.id });
  if (res.length === 0) throw new HttpError(409, "Thao tác bị trùng, vui lòng thử lại.");
}

// ---------------- PERFECT STOP ----------------
async function perfectStopAction(ctx: Ctx, action: string, payload: Record<string, unknown>) {
  const st = ctx.s.state as unknown as PsState;
  const idx = st.rounds.findIndex((r) => !r.result);
  if (idx < 0) throw new HttpError(409, "Đã hoàn thành tất cả các vòng.");
  const round = st.rounds[idx];
  const now = Date.now();

  if (action === "round") {
    if (round.issuedAt) {
      // Yêu cầu lại vòng đang chạy (tải lại trang) => vòng cũ tính là hết giờ để không thể "chọn lại" mục tiêu.
      round.result = { elapsedMs: null, stopAngle: null, deviation: null, verdict: "timeout", score: 0 };
      return finishOrSave(ctx, st, idx);
    }
    round.dir = Math.random() < 0.5 ? 1 : -1;
    round.target = Math.round(rand(0, 360) * 10) / 10;
    round.start = norm360(round.target - round.dir * rand(120, 270));
    round.issuedAt = now;
    await saveState(ctx, st);
    return {
      round: idx, totalRounds: st.rounds.length, label: round.label, speed: round.speed, zoneWidth: round.zoneWidth,
      points: round.points, target: round.target, start: round.start, dir: round.dir, timeLimitSec: st.cfg.roundTimeLimitSec,
    };
  }

  if (action === "stop") {
    if (payload.round !== idx || !round.issuedAt) throw new HttpError(409, "Vòng chơi không khớp.");
    const limitMs = st.cfg.roundTimeLimitSec * 1000;
    const serverElapsed = now - round.issuedAt;
    const raw = payload.elapsedMs;
    let elapsedMs: number | null = typeof raw === "number" ? raw : null;
    if (elapsedMs != null && !plausibleElapsed(elapsedMs, serverElapsed, limitMs)) elapsedMs = null;

    if (elapsedMs == null) {
      round.result = { elapsedMs: null, stopAngle: null, deviation: null, verdict: "timeout", score: 0 };
    } else {
      const stopAngle = needleAngle(round.start, round.dir, round.speed, elapsedMs);
      const dev = signedDeviation(stopAngle, round.target, round.dir);
      const { verdict, score } = scoreStop(Math.abs(dev), round.zoneWidth, round.points, st.cfg);
      round.result = { elapsedMs: Math.round(elapsedMs), stopAngle: +stopAngle.toFixed(2), deviation: +dev.toFixed(2), verdict, score };
    }
    return finishOrSave(ctx, st, idx);
  }
  throw new HttpError(400, "Thao tác không hợp lệ.");
}

async function finishOrSave(ctx: Ctx, st: PsState, idx: number) {
  const r = st.rounds[idx].result!;
  const total = st.rounds.reduce((s, x) => s + (x.result?.score ?? 0), 0);
  const base = { round: idx, stopAngle: r.stopAngle, deviation: r.deviation, verdict: r.verdict, gained: r.score, score: total };
  if (st.rounds.every((x) => x.result)) {
    const bonus = st.cfg.completionBonus;
    const finalScore = total + bonus;
    const perfects = st.rounds.filter((x) => x.result?.verdict === "perfect").length;
    const details = {
      completionBonus: bonus,
      perfects,
      rounds: st.rounds.map((x) => ({ label: x.label, verdict: x.result!.verdict, deviation: x.result!.deviation, score: x.result!.score, points: x.points })),
    };
    const badges: BadgeId[] = [];
    if (perfects > 0 || finalScore >= 0.7 * ctx.s.maxScore) badges.push("bac-thay-phan-xa");
    const result = await completeSession(ctx, st, finalScore, details, badges);
    return { ...base, finished: true, result };
  }
  await saveState(ctx, st);
  return { ...base, finished: false };
}

// ---------------- QUIZ ----------------
async function quizAction(ctx: Ctx, action: string, payload: Record<string, unknown>) {
  const st = ctx.s.state as unknown as QuizState;
  const now = Date.now();
  const limitMs = st.cfg.timePerQuestionSec * 1000;
  if (st.current >= st.qids.length) throw new HttpError(409, "Đã trả lời hết câu hỏi.");
  const qid = st.qids[st.current];
  const [q] = await ctx.db.select().from(schema.questions).where(eq(schema.questions.id, qid));
  if (!q) throw new HttpError(410, "Câu hỏi không còn tồn tại.");
  const perm = st.perms[st.current];

  if (action === "next") {
    if (st.servedAt == null) {
      st.servedAt = now;
      await saveState(ctx, st);
    }
    return {
      index: st.current,
      total: st.qids.length,
      question: {
        id: q.id, type: q.type, product: q.product, difficulty: q.difficulty, text: q.question,
        options: perm.map((i) => q.options[i]),
        imageUrl: q.imageMediaId ? `/api/media/${q.imageMediaId}` : null,
      },
      timeLimitSec: st.cfg.timePerQuestionSec,
      remainingMs: Math.max(0, limitMs - (now - st.servedAt)),
      score: st.answers.reduce((s, a) => s + a.score, 0),
    };
  }

  if (action === "answer") {
    if (payload.index !== st.current || st.servedAt == null) throw new HttpError(409, "Câu hỏi không khớp.");
    const elapsedMs = now - st.servedAt;
    let choice = typeof payload.choice === "number" && payload.choice >= 0 && payload.choice < perm.length ? payload.choice : null;
    if (elapsedMs > limitMs + 1500) choice = null; // quá giờ (đã tính trễ mạng)
    const correct = choice != null && perm[choice] === q.correctIndex;
    const gained = scoreAnswer(correct, elapsedMs, st.cfg);
    st.answers.push({ qid, choice, correct, score: gained, elapsedMs });
    st.current += 1;
    st.servedAt = null;
    const total = st.answers.reduce((s, a) => s + a.score, 0);
    const base = {
      correct, timeout: choice == null, correctChoice: perm.indexOf(q.correctIndex), explanation: q.explanation, gained, score: total,
    };
    if (st.current >= st.qids.length) {
      const correctCount = st.answers.filter((a) => a.correct).length;
      const details = {
        correct: correctCount,
        total: st.qids.length,
        avgAnswerMs: Math.round(st.answers.reduce((s, a) => s + Math.min(a.elapsedMs, limitMs), 0) / st.answers.length),
      };
      const badges: BadgeId[] = correctCount / st.qids.length >= 0.8 ? ["cao-thu-wifi"] : [];
      const result = await completeSession(ctx, st, total, details, badges);
      return { ...base, finished: true, result };
    }
    await saveState(ctx, st);
    return { ...base, finished: false };
  }
  throw new HttpError(400, "Thao tác không hợp lệ.");
}

// ---------------- FIND THE DIFFERENCE ----------------
async function diffAction(ctx: Ctx, action: string, payload: Record<string, unknown>) {
  const st = ctx.s.state as unknown as DiffState;
  const [pz] = await ctx.db.select().from(schema.puzzles).where(eq(schema.puzzles.id, st.puzzleId));
  if (!pz) throw new HttpError(410, "Bộ hình ảnh không còn tồn tại.");
  const total = pz.regions.length;
  const elapsedMs = Date.now() - ctx.s.startedAt.getTime();
  const limitMs = st.cfg.timeLimitSec * 1000;
  const remainingSec = Math.max(0, (limitMs - elapsedMs) / 1000);
  const timeUp = elapsedMs > limitMs + 2000;

  const finish = async () => {
    const sc = scoreFindDiff({ found: st.found.length, total, wrong: st.wrong, hints: st.hints, remainingSec }, st.cfg);
    const details = { found: st.found.length, total, wrong: st.wrong, hints: st.hints, remainingSec: Math.floor(remainingSec), ...sc, regions: pz.regions };
    // click bừa không được huy hiệu: phải tìm đủ, còn thời gian và còn điểm sau khi trừ phạt
    const badges: BadgeId[] = st.found.length === total && remainingSec > 0 && sc.score > 0 ? ["mat-than"] : [];
    return completeSession(ctx, st, sc.score, details, badges);
  };

  if (action === "click") {
    if (timeUp) return { hit: null, found: st.found.length, wrong: st.wrong, finished: true, result: await finish() };
    const x = Number(payload.x), y = Number(payload.y);
    if (!(x >= 0 && x <= 1 && y >= 0 && y <= 1)) throw new HttpError(400, "Tọa độ không hợp lệ.");
    const id = hitRegion(pz.regions, x, y, pz.width, pz.height, new Set(st.found));
    const already = !id && hitRegion(pz.regions, x, y, pz.width, pz.height, new Set()) != null;
    if (id) st.found.push(id);
    else if (!already) st.wrong += 1; // chạm lại điểm đã tìm thì không phạt
    const region = id ? pz.regions.find((r) => r.id === id)! : null;
    const base = { hit: region, already, found: st.found.length, wrong: st.wrong };
    if (st.found.length === total) return { ...base, finished: true, result: await finish() };
    await saveState(ctx, st);
    return { ...base, finished: false };
  }

  if (action === "hint") {
    if (timeUp) return { finished: true, result: await finish() };
    if (st.hints >= st.cfg.maxHints) throw new HttpError(409, "Bạn đã dùng hết lượt gợi ý.");
    const remaining = pz.regions.filter((r) => !st.found.includes(r.id));
    const pick = remaining.find((r) => !st.hinted.includes(r.id)) ?? remaining[0];
    if (!pick) throw new HttpError(409, "Không còn điểm nào để gợi ý.");
    st.hints += 1;
    st.hinted.push(pick.id);
    await saveState(ctx, st);
    // gợi ý vùng lân cận (không lộ chính xác tâm) — vòng tròn lớn hơn bao quanh điểm khác biệt
    const jitter = pick.r * 0.6;
    return {
      hint: { x: pick.x + rand(-jitter, jitter), y: pick.y + (rand(-jitter, jitter) * pz.width) / pz.height, r: pick.r * 2.4 },
      hintsUsed: st.hints, finished: false,
    };
  }

  if (action === "finish") {
    return { finished: true, result: await finish() };
  }
  throw new HttpError(400, "Thao tác không hợp lệ.");
}

// =====================================================================
// KẾT THÚC LƯỢT CHƠI, HUY HIỆU, TỔNG KẾT
// =====================================================================
async function completeSession(ctx: Ctx, state: unknown, score: number, details: Record<string, unknown>, gameBadges: BadgeId[]): Promise<GameResult> {
  const now = new Date();
  const durationMs = now.getTime() - ctx.s.startedAt.getTime();
  const finalScore = Math.max(0, Math.min(Math.round(score), ctx.s.maxScore));
  await saveState(ctx, state, { status: "completed", score: finalScore, details, durationMs, completedAt: now });

  let newBadges: BadgeId[] = [];
  if (!ctx.s.isDemo) {
    const candidates: BadgeId[] = ["tan-binh", ...gameBadges];
    const enabledGames = await ctx.db.select({ id: schema.games.id }).from(schema.games).where(eq(schema.games.enabled, true));
    const done = await rows<{ game_id: string }>(
      ctx.db,
      sql`select distinct game_id from play_sessions where player_id = ${ctx.player.id} and status = 'completed' and is_demo = false`,
    );
    const doneSet = new Set(done.map((d) => d.game_id));
    if (enabledGames.length > 0 && enabledGames.every((g) => doneSet.has(g.id))) candidates.push("nha-vo-dich");
    const inserted = await ctx.db
      .insert(schema.playerBadges)
      .values(candidates.map((badge) => ({ playerId: ctx.player.id, badge })))
      .onConflictDoNothing()
      .returning({ badge: schema.playerBadges.badge });
    newBadges = inserted.map((b) => b.badge as BadgeId);
  }

  const [game] = await ctx.db.select({ name: schema.games.name }).from(schema.games).where(eq(schema.games.id, ctx.s.gameId));
  return {
    sessionId: ctx.s.id,
    gameId: ctx.s.gameId as GameId,
    gameName: game?.name ?? ctx.s.gameId,
    score: finalScore,
    maxScore: ctx.s.maxScore,
    durationMs,
    details,
    newBadges,
    summary: await playerSummary(ctx.db, ctx.player),
  };
}

export async function playerSummary(db: DB, player: Player): Promise<PlayerSummary> {
  const best = await rows<{ game_id: GameId; best: number; max_score: number; plays: number }>(
    db,
    sql`select game_id, max(score)::int as best, max(max_score)::int as max_score, count(*)::int as plays
        from play_sessions where player_id = ${player.id} and status = 'completed' and is_demo = false group by game_id`,
  );
  const bests: PlayerSummary["bests"] = {};
  for (const b of best) bests[b.game_id] = { score: b.best, maxScore: b.max_score, plays: b.plays };
  const totalScore = best.reduce((s, b) => s + b.best, 0);
  const badges = await db.select({ badge: schema.playerBadges.badge }).from(schema.playerBadges).where(eq(schema.playerBadges.playerId, player.id));
  const enabled = await db.select({ id: schema.games.id }).from(schema.games).where(eq(schema.games.enabled, true));
  const completedGames = GAME_IDS.filter((g) => bests[g]);
  let rank: number | null = null;
  if (totalScore > 0) {
    const [r] = await rows<{ n: number }>(
      db,
      sql`with b as (select player_id, game_id, max(score) as best from play_sessions
                     where status = 'completed' and is_demo = false group by player_id, game_id),
               t as (select player_id, sum(best) as total from b group by player_id)
          select count(*)::int as n from t where total > ${totalScore}`,
    );
    rank = r.n + 1;
  }
  return {
    playerId: player.id,
    nickname: player.nickname,
    registered: Boolean(player.registeredAt),
    fullName: player.fullName,
    phoneMasked: player.phone ? player.phone.slice(0, 2) + "xxxxx" + player.phone.slice(-3) : null,
    bests,
    totalScore,
    completedGames,
    allDone: enabled.length > 0 && enabled.every((g) => bests[g.id as GameId]),
    badges: badges.map((b) => b.badge as BadgeId).filter((b) => b in BADGES),
    rank,
  };
}
