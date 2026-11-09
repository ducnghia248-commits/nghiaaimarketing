import {
  pgTable, serial, text, integer, boolean, timestamp, jsonb, customType, primaryKey, index, bigserial,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer; driverData: Buffer | Uint8Array }>({
  dataType() {
    return "bytea";
  },
  fromDriver(v) {
    return Buffer.from(v as Uint8Array);
  },
});

/** Chiến dịch marketing (link/QR). Người chơi vào bằng ?c=CODE. */
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  active: boolean("active").notNull().default(true),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  /** Giới hạn số lượt chơi mỗi game / người / ngày. null = không giới hạn. */
  playLimitPerDay: integer("play_limit_per_day"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Cấu hình 3 trò chơi. id cố định: perfect-stop | quiz | find-diff */
export const games = pgTable("games", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  tagline: text("tagline").notNull(),
  description: text("description").notNull(),
  rules: jsonb("rules").$type<string[]>().notNull(),
  estimatedTime: text("estimated_time").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  coverMediaId: integer("cover_media_id"),
  config: jsonb("config").$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const players = pgTable("players", {
  id: text("id").primaryKey(),
  nickname: text("nickname").notNull(),
  /** Thông tin đăng ký bắt buộc trước khi chơi (có đồng ý của khách hàng). */
  fullName: text("full_name"),
  phone: text("phone"),
  province: text("province"),
  registeredAt: timestamp("registered_at", { withTimezone: true }),
  campaignCode: text("campaign_code"),
  isDemo: boolean("is_demo").notNull().default(false),
  ipHash: text("ip_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
});

export const playSessions = pgTable(
  "play_sessions",
  {
    id: text("id").primaryKey(),
    playerId: text("player_id").notNull(),
    gameId: text("game_id").notNull(),
    campaignCode: text("campaign_code"),
    status: text("status").notNull().default("active"), // active | completed
    state: jsonb("state").$type<Record<string, unknown>>().notNull(),
    version: integer("version").notNull().default(0),
    score: integer("score").notNull().default(0),
    maxScore: integer("max_score").notNull().default(0),
    durationMs: integer("duration_ms"),
    details: jsonb("details").$type<Record<string, unknown>>(),
    isDemo: boolean("is_demo").notNull().default(false),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [
    index("sessions_player_idx").on(t.playerId),
    index("sessions_completed_idx").on(t.status, t.completedAt),
  ],
);

export const playerBadges = pgTable(
  "player_badges",
  {
    playerId: text("player_id").notNull(),
    badge: text("badge").notNull(),
    earnedAt: timestamp("earned_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.playerId, t.badge] })],
);

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // mcq | fill | product
  product: text("product").notNull(), // internet | wifi | camera | smarthome | fptplay | general
  difficulty: text("difficulty").notNull(), // easy | medium | hard
  question: text("question").notNull(),
  options: jsonb("options").$type<string[]>().notNull(),
  correctIndex: integer("correct_index").notNull(),
  explanation: text("explanation").notNull().default(""),
  imageMediaId: integer("image_media_id"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DiffRegion = { id: string; x: number; y: number; r: number; label: string };

export const puzzles = pgTable("puzzles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  theme: text("theme").notNull().default(""),
  leftUrl: text("left_url").notNull(),
  rightUrl: text("right_url").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  /** Tọa độ chuẩn hóa: x,y ∈ [0,1] theo chiều rộng/cao ảnh; r tính theo tỉ lệ chiều rộng. */
  regions: jsonb("regions").$type<DiffRegion[]>().notNull(),
  active: boolean("active").notNull().default(true),
  /** null = dùng cho mọi chiến dịch */
  campaignCode: text("campaign_code"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  mime: text("mime").notNull(),
  filename: text("filename").notNull(),
  size: integer("size").notNull(),
  data: bytea("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  playerId: text("player_id"),
  /** Họ tên / SĐT chỉ được lưu khi khách hàng tick đồng ý được liên hệ. */
  fullName: text("full_name"),
  phone: text("phone"),
  province: text("province").notNull(),
  area: text("area").notNull().default(""),
  products: jsonb("products").$type<string[]>().notNull(),
  need: text("need").notNull(), // explore | consult | install
  consent: boolean("consent").notNull().default(false),
  consentText: text("consent_text"),
  consentAt: timestamp("consent_at", { withTimezone: true }),
  campaignCode: text("campaign_code"),
  /** register = đăng ký trước khi chơi · consult = gửi yêu cầu tư vấn */
  source: text("source").notNull().default("consult"),
  status: text("status").notNull().default("new"), // new | contacted | done
  isDemo: boolean("is_demo").notNull().default(false),
  ipHash: text("ip_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const events = pgTable(
  "events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    type: text("type").notNull(), // visit | start_click
    visitorId: text("visitor_id").notNull(),
    playerId: text("player_id"),
    campaignCode: text("campaign_code"),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("events_type_time_idx").on(t.type, t.createdAt)],
);

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull(), // admin | editor
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  before: jsonb("before"),
  after: jsonb("after"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
