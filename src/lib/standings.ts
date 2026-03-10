import { TournamentConfig, Team } from "./types";

export interface TeamStats {
  teamId: string;
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export function calculateStandings(config: TournamentConfig, sportId: string): TeamStats[] {
  const sport = config.sports.find(s => s.id === sportId);
  if (!sport) return [];

  const stats: Record<string, TeamStats> = {};

  // Initialize all teams
  config.teams.forEach(team => {
    stats[team.id] = {
      teamId: team.id,
      name: team.name,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0
    };
  });

  // Process finished matches
  config.matches.filter(m => m.sportId === sportId && m.status === "finished").forEach(match => {
    const statA = stats[match.teamAId];
    const statB = stats[match.teamBId];

    if (!statA || !statB) return;

    statA.played++;
    statB.played++;

    statA.goalsFor += match.scoreA;
    statA.goalsAgainst += match.scoreB;
    statA.goalDifference = statA.goalsFor - statA.goalsAgainst;

    statB.goalsFor += match.scoreB;
    statB.goalsAgainst += match.scoreA;
    statB.goalDifference = statB.goalsFor - statB.goalsAgainst;

    if (match.scoreA > match.scoreB) {
        statA.won++;
        statB.lost++;
        statA.points += (sport.scoring.winPoints || 3);
        statB.points += (sport.scoring.lossPoints || 0);
    } else if (match.scoreA < match.scoreB) {
        statB.won++;
        statA.lost++;
        statB.points += (sport.scoring.winPoints || 3);
        statA.points += (sport.scoring.lossPoints || 0);
    } else {
        statA.drawn++;
        statB.drawn++;
        statA.points += (sport.scoring.drawPoints || 1);
        statB.points += (sport.scoring.drawPoints || 1);
    }
  });

  return Object.values(stats).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });
}
