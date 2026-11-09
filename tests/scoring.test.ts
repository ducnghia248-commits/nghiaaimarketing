import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_CONFIGS, maxScoreOf } from "../src/lib/games/defs";
import {
  hitRegion, needleAngle, plausibleElapsed, scoreAnswer, scoreFindDiff, scoreStop, signedDeviation,
} from "../src/lib/games/scoring";

const ps = DEFAULT_CONFIGS["perfect-stop"];

test("needleAngle: quay đúng tốc độ, đúng chiều, chuẩn hóa 0–360", () => {
  assert.equal(needleAngle(0, 1, 180, 1000), 180);
  assert.equal(needleAngle(10, -1, 90, 1000), 280);
  assert.equal(needleAngle(350, 1, 20, 1000), 10);
  assert.ok(Math.abs(needleAngle(0, 1, 140, 2571.4285714) - 0) < 1e-6 || Math.abs(needleAngle(0, 1, 140, 2571.4285714) - 360) < 1e-6);
});

test("signedDeviation: dương = nhấn muộn theo chiều quay", () => {
  assert.equal(signedDeviation(105, 100, 1), 5);
  assert.equal(signedDeviation(95, 100, 1), -5);
  assert.equal(signedDeviation(95, 100, -1), 5);
  assert.equal(signedDeviation(2, 358, 1), 4); // qua mốc 0°
});

test("scoreStop: đúng tâm = tối đa, trong vùng 50–100%, sát vùng ≤20%, ngoài = 0", () => {
  assert.deepEqual(scoreStop(0, 30, 150, ps), { verdict: "perfect", score: 150 });
  assert.deepEqual(scoreStop(1.5, 30, 150, ps), { verdict: "perfect", score: 150 });
  const edge = scoreStop(15, 30, 150, ps);
  assert.equal(edge.verdict, "zone");
  assert.equal(edge.score, 75);
  const mid = scoreStop(8, 30, 150, ps);
  assert.ok(mid.score > 75 && mid.score < 150);
  const near = scoreStop(20, 30, 150, ps);
  assert.equal(near.verdict, "near");
  assert.ok(near.score > 0 && near.score <= 30);
  assert.deepEqual(scoreStop(60, 30, 150, ps), { verdict: "miss", score: 0 });
  assert.deepEqual(scoreStop(null, 30, 150, ps), { verdict: "timeout", score: 0 });
});

test("scoreStop: điểm giảm đơn điệu theo độ lệch", () => {
  let prev = Infinity;
  for (let d = 0; d <= 50; d += 0.5) {
    const s = scoreStop(d, 30, 150, ps).score;
    assert.ok(s <= prev, `điểm tăng bất thường tại ${d}°`);
    prev = s;
  }
});

test("plausibleElapsed: chặn thời điểm nhấn 'trong tương lai' và trễ bất thường", () => {
  assert.ok(plausibleElapsed(2000, 2100, 10000));
  assert.ok(!plausibleElapsed(2600, 2100, 10000)); // client báo lớn hơn thời gian thực
  assert.ok(!plausibleElapsed(1000, 9000, 10000)); // lệch quá xa
  assert.ok(!plausibleElapsed(-5, 100, 10000));
  assert.ok(!plausibleElapsed(11000, 11000, 10000));
});

test("scoreAnswer: sai = 0, đúng = điểm cơ bản + thưởng tốc độ", () => {
  const q = DEFAULT_CONFIGS.quiz;
  assert.equal(scoreAnswer(false, 100, q), 0);
  assert.equal(scoreAnswer(true, 0, q), q.pointsCorrect + q.speedBonusMax);
  assert.equal(scoreAnswer(true, q.timePerQuestionSec * 1000, q), q.pointsCorrect);
  assert.equal(scoreAnswer(true, 999999, q), q.pointsCorrect);
});

test("hitRegion: tọa độ chuẩn hóa, có dung sai chạm, bỏ qua vùng đã tìm", () => {
  const regions = [{ id: "a", x: 0.25, y: 0.5, r: 0.05, label: "" }, { id: "b", x: 0.8, y: 0.2, r: 0.04, label: "" }];
  assert.equal(hitRegion(regions, 0.25, 0.5, 800, 600, new Set()), "a");
  assert.equal(hitRegion(regions, 0.25 + 0.06, 0.5, 800, 600, new Set()), "a"); // trong dung sai chạm
  assert.equal(hitRegion(regions, 0.25 + 0.08, 0.5, 800, 600, new Set()), null);
  assert.equal(hitRegion(regions, 0.25, 0.5, 800, 600, new Set(["a"])), null);
  assert.equal(hitRegion(regions, 0.8, 0.2, 800, 600, new Set()), "b");
});

test("scoreFindDiff: thưởng thời gian chỉ khi tìm đủ, phạt click sai vượt mức miễn phạt & gợi ý", () => {
  const c = DEFAULT_CONFIGS["find-diff"];
  const full = scoreFindDiff({ found: 5, total: 5, wrong: 0, hints: 0, remainingSec: 40 }, c);
  assert.equal(full.score, 5 * c.pointsPerDiff + 40 * c.timeBonusPerSec);
  const partial = scoreFindDiff({ found: 3, total: 5, wrong: 0, hints: 0, remainingSec: 40 }, c);
  assert.equal(partial.timeBonus, 0);
  const penal = scoreFindDiff({ found: 5, total: 5, wrong: c.freeWrongClicks + 2, hints: 1, remainingSec: 0 }, c);
  assert.equal(penal.score, 5 * c.pointsPerDiff - 2 * c.wrongClickPenalty - c.hintPenalty);
  assert.equal(scoreFindDiff({ found: 0, total: 5, wrong: 50, hints: 2, remainingSec: 0 }, c).score, 0);
});

test("maxScoreOf khớp cấu hình mặc định", () => {
  assert.equal(maxScoreOf("perfect-stop", ps), 100 + 150 + 200 + 50);
  assert.equal(maxScoreOf("quiz", DEFAULT_CONFIGS.quiz), 8 * 75);
  assert.equal(maxScoreOf("find-diff", DEFAULT_CONFIGS["find-diff"], 5), 5 * 60 + 90 * 2);
});
