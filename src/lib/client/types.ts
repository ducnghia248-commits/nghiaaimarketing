import type { BadgeId, GameId } from "../games/defs";

export type PublicGame = {
  id: GameId;
  name: string;
  tagline: string;
  description: string;
  rules: string[];
  estimatedTime: string;
  enabled: boolean;
  maxScore: number;
  coverUrl: string | null;
};

export type Branding = { logoUrl: string | null; heroModelUrl: string | null };

export type PlayerSummary = {
  playerId: string;
  nickname: string;
  registered: boolean;
  fullName: string | null;
  phoneMasked: string | null;
  bests: Partial<Record<GameId, { score: number; maxScore: number; plays: number }>>;
  totalScore: number;
  completedGames: GameId[];
  allDone: boolean;
  badges: BadgeId[];
  rank: number | null;
};

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
