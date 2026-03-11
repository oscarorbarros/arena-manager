export type SportType = 'team' | 'individual';
export type ScoringType = 'goals' | 'points' | 'sets';

export interface SportConfig {
  id: string;
  name: string;
  type: SportType;
  playersOnField?: number;
  scoring: {
    type: ScoringType;
    winPoints?: number;
    drawPoints?: number;
    lossPoints?: number;
    setPoints?: number;
  };
  matchDuration?: number;
}

export interface Team {
  id: string;
  name: string;
  logo?: string;
  delegationChiefId?: string; // Links to a User with role 'delegate'
  group?: string; // 'A', 'B', etc.
  stats?: {
      points: number;
      played: number;
      won: number;
      drawn: number;
      lost: number;
      goalsFor: number;
      goalsAgainst: number;
      goalDifference: number;
  };
}

export type PlayerPosition = "Goleiro" | "Zagueiro" | "Meio-Campo" | "Atacante";

export interface Venue {
  id: string;
  name: string;
}

export interface Player {
  id: string;
  name: string;
  teamId: string;
  number?: number;
  position?: PlayerPosition;
  photoUrl?: string;
  isStarter?: boolean; // Defined by delegation chief before the match
  stats?: {
      goals: number;
      yellowCards: number;
      redCards: number;
      matchesPlayed: number;
  };
}

export interface MatchEvent {
  id: string;
  type: 'goal' | 'point' | 'set' | 'card_yellow' | 'card_red' | 'start' | 'end' | 'half_time' | 'injury' | 'info' | 'penalty_goal' | 'penalty_miss' | 'substitution';
  teamId?: string;
  playerId?: string;     // Player who scored / got card / came OUT in substitution
  playerInId?: string;  // Player who came IN (substitution only)
  timestamp: number;
  matchTime: number;
  value?: number;
  observation?: string;
}

export type MatchPeriod = 'first_half' | 'half_time' | 'second_half' | 'full_time' | 'extra_first' | 'extra_half_time' | 'extra_second' | 'penalties';

export interface Match {
  id: string;
  sportId: string;
  teamAId: string;
  teamBId: string;
  status: 'scheduled' | 'live' | 'paused' | 'finished';
  period?: MatchPeriod; // PerÃ­odo atual da partida
  scoreA: number;
  scoreB: number;
  penaltiesA?: number; // Placar nos pÃªnaltis
  penaltiesB?: number; // Placar nos pÃªnaltis
  startTime?: number;
  scheduledTime?: number;
  venueId?: string;
  isWalkover?: boolean; // Timestamp of when the current "live" segment started
  elapsedSeconds?: number; // Total seconds played before the current segment
  events: MatchEvent[];
  observations?: string; // Sumula
  stage?: 'group' | 'knockout';
  round?: string; // "Rodada 1", "Quartas", "Semi"
  group?: string; // "A", "B"
  firstPenaltyTeamId?: string; // ID of the team that kicks first in penalties
  closedBy?: string; // Name of the user who ended the match (for sumula)
}

// Auth & Users
export type UserRole = "admin" | "organization_member" | "delegate" | "journalist" | "public" | "president" | "referee" | null;

export interface User {
    id: string;
    name: string;
    email: string;
    password?: string; // Mock password
    role: UserRole;
    teamId?: string; // For Delegation Chiefs
}

export interface TournamentConfig {
  name: string;
  type: "hybrid" | "knockout"; // hybrid = Grupos -> Mata-Mata; knockout = Mata-Mata direto
  format?: "hybrid" | "knockout" | "groups";
  status: 'setup' | 'active' | 'finished';
  sports: SportConfig[];
  teams: Team[];
  players?: Player[];
  venues: Venue[]; // Central repository of players
  matches: Match[];
  users: User[];
  matchSettings?: {
      duration: number;
      extraTime: number;
      breakTime: number;
  };
  tieBreakers?: string[];
  structure?: {
      groupsCount: number;
      qualifiersPerGroup: number;
      teamsPerGroup?: number;
      wildcards?: number;
  };
  rules?: {
    homeAndAway: boolean;
    matchDuration?: number; // Tempo de jogo em minutos (ex: 20)
    allowInjuryTime?: boolean; // Se permite acrÃ©scimos apÃ³s o tempo regulamentar
    tiebreaker: {
      primary: 'points';
      secondary: 'goals_scored' | 'goal_difference' | 'head_to_head';
    };
    knockout?: {
      allowExtraTime?: boolean; // Permite prorrogaÃ§Ã£o em caso de empate
      extraTimeDuration?: number; // DuraÃ§Ã£o de cada tempo da prorrogaÃ§Ã£o (ex: 5 min)
      allowPenalties?: boolean; // Permite disputa de pÃªnaltis
      penaltiesInitialCount?: number; // Quantos pÃªnaltis cada time bate inicialmente (ex: 5)
      penaltiesAlternateOnly?: boolean; // Se true, sÃ³ alternado; se false, bate todos primeiro depois alternado
    };
  };
  preview?: {
    groups: Record<string, Team[]>;
    matches: Match[];
    generatedAt: number;
    confirmedBy?: string;
  };
  presidentId?: string;
}

export const DEFAULT_CONFIG: TournamentConfig = {
  name: "Torneio Exemplo",
  type: "hybrid",
  status: "setup",
  sports: [
    {
      id: "futsal",
      name: "Futsal",
      type: "team",
      playersOnField: 5,
      scoring: { type: "goals", winPoints: 3, drawPoints: 1, lossPoints: 0 },
      matchDuration: 40
    },
    {
      id: "volei",
      name: "Volei",
      type: "team",
      playersOnField: 6,
      scoring: { type: "sets", winPoints: 2, lossPoints: 1 },
    }
  ],
  teams: [],
  players: [],
  venues: [],
  matches: [],
  users: [
      { id: "admin", name: "Administrador", email: "admin@arena.com", password: "123", role: "admin" },
      { id: "ref1", name: "Juiz Exemplo", email: "juiz@arena.com", password: "123", role: "referee" }
  ]
};

// Audit
export interface AuditLog {
    id: string;
    userId: string;
    action: string;
    details: string;
    timestamp: number;
}

// Helper function to check if match is in injury time
export function isMatchInInjuryTime(elapsedMinutes: number, matchDuration: number = 20, allowInjuryTime: boolean = true): boolean {
  if (!allowInjuryTime) return false;
  return elapsedMinutes >= matchDuration;
}

// Helper function to format match time with injury time indicator
export function formatMatchTime(elapsedMinutes: number, matchDuration: number = 20, allowInjuryTime: boolean = true): string {
  const isInjuryTime = isMatchInInjuryTime(elapsedMinutes, matchDuration, allowInjuryTime);
  
  if (isInjuryTime) {
    const injuryMinutes = elapsedMinutes - matchDuration;
    return `${matchDuration}+${injuryMinutes}'`;
  }
  
  return `${elapsedMinutes}'`;
}





