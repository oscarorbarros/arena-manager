// Beach Tennis Module Types — CBBT Rules
export type BTCategory = 'masculine' | 'feminine' | 'mixed';
export type BTMatchPhase = 'group' | 'quarterfinal' | 'semifinal' | 'final';
export type BTMatchStatus = 'scheduled' | 'in_progress' | 'finished';

export interface BTTeam { // Institution / Campus
  id: string;
  name: string;
  logo?: string;
}

export interface BTPlayer {
  id: string;
  name: string;
  gender: 'M' | 'F';
  teamId: string;
}

export interface BTPair { // Dupla — 2 players + 1 reserva (Art. 19)
  id: string;
  teamId: string;
  player1Id: string;
  player2Id: string;
  reserveId?: string;
  category: BTCategory;
  group?: string;
  stats: {
    points: number;
    played: number;
    won: number;
    lost: number;
    wo: number;
    gamesFor: number;
    gamesAgainst: number;
    gameDifference: number;
  };
}

export type BTEventType =
  | 'start' | 'end'
  | 'game_A' | 'game_B'
  | 'tiebreak_point_A' | 'tiebreak_point_B'
  | 'substitution' | 'wo' | 'info';

export interface BTEvent {
  id: string;
  type: BTEventType;
  pairId?: string;
  playerId?: string;
  playerInId?: string;
  timestamp: number;
  gameNumber?: number;
  observation?: string;
}

export interface BTMatch {
  id: string;
  pairAId: string;
  pairBId: string;
  category: BTCategory;
  phase: BTMatchPhase;
  group?: string;
  round?: string;
  court?: string;
  scheduledTime?: string;
  status: BTMatchStatus;

  // Scoring (Art. 22-23)
  gamesA: number;
  gamesB: number;
  setTarget: number;  // 6 for groups/quarters, 8 for semis/final

  // Tie-break (triggered at setTarget - setTarget, e.g. 6-6 or 8-8, to 7 pts)
  inTiebreak: boolean;
  tiebreakA: number;
  tiebreakB: number;

  // Result
  winner?: 'A' | 'B';
  isWalkover?: boolean;

  // Substitutions — max 2 per team per match (Art. 21 §2)
  substitutionsA: number;
  substitutionsB: number;

  events: BTEvent[];
}

export interface BTConfig {
  name: string;
  status: 'setup' | 'active' | 'finished';
  season?: string;
  teams: BTTeam[];
  players: BTPlayer[];
  pairs: BTPair[];
  matches: BTMatch[];
}

export const DEFAULT_BT_CONFIG: BTConfig = {
  name: "Torneio de Beach Tennis",
  status: 'setup',
  teams: [],
  players: [],
  pairs: [],
  matches: [],
};

// Helpers
export const CATEGORY_LABELS: Record<BTCategory, string> = {
  masculine: '🔵 Masculino',
  feminine: '🔴 Feminino',
  mixed: '🟡 Misto',
};

export const PHASE_LABELS: Record<BTMatchPhase, string> = {
  group: 'Fase de Grupos',
  quarterfinal: 'Quartas de Final',
  semifinal: 'Semifinal',
  final: 'Final',
};

export function getSetTarget(phase: BTMatchPhase): number {
  // Art. 22: groups/quarters = 6 games; Art. 23: semis/final = 8 games
  return phase === 'semifinal' || phase === 'final' ? 8 : 6;
}

export function checkMatchWinner(match: BTMatch): 'A' | 'B' | null {
  const t = match.setTarget;
  const a = match.gamesA;
  const b = match.gamesB;

  if (match.inTiebreak) {
    // Tie-break: first to 7 points
    if (match.tiebreakA >= 7 && match.tiebreakA - match.tiebreakB >= 2) return 'A';
    if (match.tiebreakB >= 7 && match.tiebreakB - match.tiebreakA >= 2) return 'B';
    return null;
  }

  if (a >= t && a - b >= 1 && !(a === t && b === t)) return 'A';
  if (b >= t && b - a >= 1 && !(a === t && b === t)) return 'B';
  return null;
}

export function isTiebreakTriggered(match: BTMatch): boolean {
  return match.gamesA === match.setTarget && match.gamesB === match.setTarget;
}
