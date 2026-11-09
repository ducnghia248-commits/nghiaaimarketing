import { z } from "zod";

/** Định nghĩa dùng chung cho client & server (không import gì của server). */
export const GAME_IDS = ["perfect-stop", "quiz", "find-diff"] as const;
export type GameId = (typeof GAME_IDS)[number];

export const GAME_ROUTES: Record<GameId, string> = {
  "perfect-stop": "/play/perfect-stop",
  quiz: "/play/quiz",
  "find-diff": "/play/find-difference",
};

// ---------------- Cấu hình từng game (Admin chỉnh được) ----------------

export const perfectStopLevel = z.object({
  label: z.string().min(1).max(30),
  /** tốc độ kim, độ/giây */
  speed: z.number().min(30).max(720),
  /** độ rộng vùng mục tiêu, độ */
  zoneWidth: z.number().min(4).max(120),
  /** điểm tối đa của vòng */
  points: z.number().int().min(0).max(1000),
});

export const perfectStopConfig = z.object({
  levels: z.array(perfectStopLevel).min(1).max(6),
  roundTimeLimitSec: z.number().min(3).max(30),
  /** sai số được tính là PERFECT (độ) */
  perfectToleranceDeg: z.number().min(0.2).max(10),
  completionBonus: z.number().int().min(0).max(1000),
});
export type PerfectStopConfig = z.infer<typeof perfectStopConfig>;

export const quizConfig = z.object({
  questionCount: z.number().int().min(5).max(10),
  timePerQuestionSec: z.number().int().min(5).max(60),
  pointsCorrect: z.number().int().min(0).max(1000),
  speedBonusMax: z.number().int().min(0).max(1000),
  /** lọc theo độ khó: mixed | easy | medium | hard */
  difficulty: z.enum(["mixed", "easy", "medium", "hard"]),
});
export type QuizConfig = z.infer<typeof quizConfig>;

export const findDiffConfig = z.object({
  timeLimitSec: z.number().int().min(20).max(300),
  pointsPerDiff: z.number().int().min(0).max(1000),
  /** điểm thưởng cho mỗi giây còn lại khi hoàn thành */
  timeBonusPerSec: z.number().min(0).max(50),
  /** số lần click sai miễn phạt */
  freeWrongClicks: z.number().int().min(0).max(50),
  wrongClickPenalty: z.number().int().min(0).max(500),
  maxHints: z.number().int().min(0).max(10),
  hintPenalty: z.number().int().min(0).max(500),
});
export type FindDiffConfig = z.infer<typeof findDiffConfig>;

export const configSchemas = {
  "perfect-stop": perfectStopConfig,
  quiz: quizConfig,
  "find-diff": findDiffConfig,
} as const;

export type GameConfigMap = {
  "perfect-stop": PerfectStopConfig;
  quiz: QuizConfig;
  "find-diff": FindDiffConfig;
};

export const DEFAULT_CONFIGS: GameConfigMap = {
  "perfect-stop": {
    levels: [
      { label: "Dễ", speed: 140, zoneWidth: 48, points: 100 },
      { label: "Trung bình", speed: 220, zoneWidth: 30, points: 150 },
      { label: "Khó", speed: 320, zoneWidth: 18, points: 200 },
    ],
    roundTimeLimitSec: 10,
    perfectToleranceDeg: 1.5,
    completionBonus: 50,
  },
  quiz: {
    questionCount: 8,
    timePerQuestionSec: 15,
    pointsCorrect: 50,
    speedBonusMax: 25,
    difficulty: "mixed",
  },
  "find-diff": {
    timeLimitSec: 90,
    pointsPerDiff: 60,
    timeBonusPerSec: 2,
    freeWrongClicks: 3,
    wrongClickPenalty: 10,
    maxHints: 2,
    hintPenalty: 30,
  },
};

/** Điểm tối đa lý thuyết của mỗi game theo cấu hình. */
export function maxScoreOf(gameId: GameId, cfg: unknown, diffCount = 5): number {
  if (gameId === "perfect-stop") {
    const c = cfg as PerfectStopConfig;
    return c.levels.reduce((s, l) => s + l.points, 0) + c.completionBonus;
  }
  if (gameId === "quiz") {
    const c = cfg as QuizConfig;
    return c.questionCount * (c.pointsCorrect + c.speedBonusMax);
  }
  const c = cfg as FindDiffConfig;
  return Math.round(diffCount * c.pointsPerDiff + c.timeLimitSec * c.timeBonusPerSec);
}

export const DEFAULT_GAMES: {
  id: GameId;
  name: string;
  tagline: string;
  description: string;
  rules: string[];
  estimatedTime: string;
  sortOrder: number;
}[] = [
  {
    id: "perfect-stop",
    name: "PERFECT STOP",
    tagline: "Thử tài dừng chuẩn xác",
    description: "Canh đúng khoảnh khắc, nhấn DỪNG để kim năng lượng dừng ngay tâm vùng mục tiêu.",
    rules: [
      "Kim chỉ thị quay liên tục quanh vòng năng lượng.",
      "Nhấn nút DỪNG (hoặc phím Space) khi kim chạm vùng mục tiêu phát sáng.",
      "Dừng càng gần tâm vùng mục tiêu, điểm càng cao. Dừng đúng tâm: PERFECT!",
      "3 vòng chơi: Dễ → Trung bình → Khó, tốc độ tăng và vùng mục tiêu hẹp dần.",
    ],
    estimatedTime: "~45 giây",
    sortOrder: 1,
  },
  {
    id: "quiz",
    name: "FPT SMART QUIZ",
    tagline: "Thử thách kiến thức FPT",
    description: "Trả lời nhanh các câu hỏi vui về Internet, WiFi, Camera, Smart Home và FPT Play.",
    rules: [
      "Mỗi lượt có nhiều câu hỏi, mỗi câu có thời gian giới hạn.",
      "Chọn đáp án đúng để được cộng điểm, trả lời càng nhanh thưởng càng nhiều.",
      "Trả lời sai sẽ được xem đáp án đúng và giải thích ngắn.",
    ],
    estimatedTime: "~90 giây",
    sortOrder: 2,
  },
  {
    id: "find-diff",
    name: "FIND THE DIFFERENCE",
    tagline: "Tìm điểm khác biệt",
    description: "Quan sát hai bức tranh ngôi nhà công nghệ và tìm ra tất cả điểm khác nhau.",
    rules: [
      "Chạm/click vào vị trí khác nhau trên một trong hai hình.",
      "Tìm đủ các điểm khác biệt trước khi hết giờ.",
      "Click sai nhiều lần hoặc dùng gợi ý sẽ bị trừ điểm thưởng.",
      "Hoàn thành càng nhanh, điểm thưởng thời gian càng cao.",
    ],
    estimatedTime: "~60–90 giây",
    sortOrder: 3,
  },
];

// ---------------- Huy hiệu ----------------
export const BADGES = {
  "tan-binh": { name: "Tân binh công nghệ", desc: "Hoàn thành trò chơi đầu tiên", icon: "🚀" },
  "bac-thay-phan-xa": { name: "Bậc thầy phản xạ", desc: "Đạt PERFECT hoặc ≥ 70% điểm Perfect Stop", icon: "⚡" },
  "cao-thu-wifi": { name: "Cao thủ WiFi", desc: "Trả lời đúng ≥ 80% câu hỏi FPT Smart Quiz", icon: "📶" },
  "mat-than": { name: "Mắt thần công nghệ", desc: "Tìm đủ điểm khác biệt trước khi hết giờ", icon: "🔍" },
  "nha-vo-dich": { name: "Nhà vô địch FPT", desc: "Hoàn thành cả 3 trò chơi", icon: "🏆" },
} as const;
export type BadgeId = keyof typeof BADGES;

// ---------------- Dữ liệu biểu mẫu ----------------
export const PRODUCTS = [
  { id: "internet", label: "Internet" },
  { id: "wifi", label: "WiFi" },
  { id: "camera", label: "FPT Camera" },
  { id: "smarthome", label: "Smart Home" },
  { id: "fptplay", label: "FPT Play" },
] as const;

export const QUESTION_PRODUCTS = [...PRODUCTS, { id: "general", label: "Chung" }] as const;

export const NEEDS = [
  { id: "explore", label: "Tìm hiểu" },
  { id: "consult", label: "Cần tư vấn" },
  { id: "install", label: "Đăng ký lắp đặt" },
] as const;

export const QUESTION_TYPES = [
  { id: "mcq", label: "Trắc nghiệm nhanh" },
  { id: "fill", label: "Điền vào chỗ trống" },
  { id: "product", label: "Kiến thức sản phẩm" },
] as const;

export const DIFFICULTIES = [
  { id: "easy", label: "Dễ" },
  { id: "medium", label: "Trung bình" },
  { id: "hard", label: "Khó" },
] as const;

/** 34 tỉnh/thành phố sau sắp xếp đơn vị hành chính (hiệu lực 01/07/2025). */
export const PROVINCES = [
  "TP. Hà Nội", "TP. Hồ Chí Minh", "TP. Hải Phòng", "TP. Đà Nẵng", "TP. Cần Thơ", "TP. Huế",
  "An Giang", "Bắc Ninh", "Cà Mau", "Cao Bằng", "Đắk Lắk", "Điện Biên", "Đồng Nai", "Đồng Tháp",
  "Gia Lai", "Hà Tĩnh", "Hưng Yên", "Khánh Hòa", "Lai Châu", "Lâm Đồng", "Lạng Sơn", "Lào Cai",
  "Nghệ An", "Ninh Bình", "Phú Thọ", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị", "Sơn La", "Tây Ninh",
  "Thái Nguyên", "Thanh Hóa", "Tuyên Quang", "Vĩnh Long",
] as const;

export const CONSENT_TEXT =
  "Tôi đồng ý để FPT Telecom sử dụng họ tên, số điện thoại và khu vực tôi cung cấp nhằm liên hệ tư vấn sản phẩm/dịch vụ tôi quan tâm.";

/** Đồng ý khi đăng ký tham gia (bắt buộc trước khi chơi). */
export const REGISTER_CONSENT_TEXT =
  "Tôi đồng ý cung cấp họ tên, số điện thoại để tham gia chương trình, nhận thông báo kết quả/quà tặng và được FPT Telecom liên hệ tư vấn sản phẩm, dịch vụ.";

/** Tên hiển thị công khai từ họ tên + SĐT, không lộ dữ liệu cá nhân: "Minh ***678". */
export function publicName(fullName: string, phone: string) {
  const given = fullName.trim().split(/\s+/).pop() || "Bạn";
  return `${given} ***${phone.slice(-3)}`;
}

export const PHONE_RE = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
export function normalizePhone(p: string) {
  const s = p.replace(/[\s.\-()]/g, "");
  return s.startsWith("+84") ? "0" + s.slice(3) : s;
}
