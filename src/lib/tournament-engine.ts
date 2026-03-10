import { Team, Match, TournamentConfig } from "./types";

interface TeamStats {
    teamId: string;
    points: number;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
}

export class TournamentEngine {
    
    // 1. Sorteio de Grupos (DinÃ¢mico)
    static drawGroups(teams: Team[], numGroups: number = 4): Team[] {
        const groups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"].slice(0, numGroups);
        const shuffled = [...teams].sort(() => Math.random() - 0.5);
        
        return shuffled.map((team, index) => ({
            ...team,
            group: groups[index % groups.length]
        }));
    }

    // 2. Gerar Partidas da Fase de Grupos
    static generateGroupMatches(teams: Team[], sportId: string): Match[] {
        const matches: Match[] = [];
        const teamsByGroup = teams.reduce((acc, team) => {
            if (!team.group) return acc;
            if (!acc[team.group]) acc[team.group] = [];
            acc[team.group].push(team);
            return acc;
        }, {} as Record<string, Team[]>);

        Object.entries(teamsByGroup).forEach(([group, groupTeams]) => {
            // Round Robin: Everyone plays everyone once
            for (let i = 0; i < groupTeams.length; i++) {
                for (let j = i + 1; j < groupTeams.length; j++) {
                    matches.push({
                        id: crypto.randomUUID(),
                        sportId,
                        teamAId: groupTeams[i].id,
                        teamBId: groupTeams[j].id,
                        status: "scheduled",
                        scoreA: 0,
                        scoreB: 0,
                        events: [],
                        stage: "group",
                        group: group,
                        round: "Fase de Grupos"
                    });
                }
            }
        });

        return matches;
    }

    // 3. Calcular ClassificaÃ§Ã£o (GenÃ©rico para Ranking)
    static calculateStandings(teams: Team[], matches: Match[], tieBreakerOrder: string[] = ['points', 'wins', 'goalDifference', 'goalsFor', 'headToHead']): Record<string, TeamStats[]> {
        const stats: Record<string, TeamStats> = {};
        teams.forEach(team => {
            stats[team.id] = {
                teamId: team.id,
                points: 0, played: 0, won: 0, drawn: 0, lost: 0, 
                goalsFor: 0, goalsAgainst: 0, goalDifference: 0
            };
        });

        matches.filter(m => m.status === "finished" && m.stage === "group").forEach(match => {
            const statA = stats[match.teamAId];
            const statB = stats[match.teamBId];
            if (!statA || !statB) return;

            statA.played++; statB.played++;
            statA.goalsFor += match.scoreA; statA.goalsAgainst += match.scoreB;
            statB.goalsFor += match.scoreB; statB.goalsAgainst += match.scoreA;
            statA.goalDifference = statA.goalsFor - statA.goalsAgainst;
            statB.goalDifference = statB.goalsFor - statB.goalsAgainst;

            if (match.scoreA > match.scoreB) {
                statA.points += 3; statA.won++; statB.lost++;
            } else if (match.scoreB > match.scoreA) {
                statB.points += 3; statB.won++; statA.lost++;
            } else {
                statA.points += 1; statA.drawn++;
                statB.points += 1; statB.drawn++;
            }
        });

        const grouped: Record<string, TeamStats[]> = {};
        
        // Helper Sort
                const sortStats = (a: TeamStats, b: TeamStats) => {
            for (const criteria of tieBreakerOrder) {
                let diff = 0;
                if (criteria === 'points') diff = b.points - a.points;
                else if (criteria === 'wins') diff = b.won - a.won;
                else if (criteria === 'goalDifference') diff = b.goalDifference - a.goalDifference;
                else if (criteria === 'goalsFor') diff = b.goalsFor - a.goalsFor;
                else if (criteria === 'headToHead') {
                    const match = matches.find(m => (m.teamAId === a.teamId && m.teamBId === b.teamId) || (m.teamBId === a.teamId && m.teamAId === b.teamId));
                    if (match && match.status === 'finished') {
                         if (match.scoreA > match.scoreB) diff = match.teamAId === a.teamId ? -1 : 1;
                         else if (match.scoreB > match.scoreA) diff = match.teamBId === a.teamId ? -1 : 1;
                    }
                }
                if (diff !== 0) return diff;
            }
            return 0;
        };

        teams.forEach(team => {
            if (!team.group) return;
            if (!grouped[team.group]) grouped[team.group] = [];
            grouped[team.group].push(stats[team.id]);
        });

        Object.keys(grouped).forEach(g => {
            grouped[g].sort(sortStats);
        });

        return grouped;
    }

    // 4. Gerar Mata-Mata com Wildcards (Ãndice TÃ©cnico)
    static generateKnockoutBracket(
        teams: Team[], 
        matches: Match[], 
        sportId: string, 
        qualifiersPerGroup: number = 2,
        wildcardsCount: number = 0
    ): Match[] {
        const standings = this.calculateStandings(teams, matches);
        const groupKeys = Object.keys(standings).sort(); 
        const knockoutMatches: Match[] = [];
        
        // Helper to create match
        const create = (tA: string, tB: string, r: string, obs: string) => ({
            id: crypto.randomUUID(),
            sportId,
            teamAId: tA,
            teamBId: tB,
            status: "scheduled" as const,
            scoreA: 0,
            scoreB: 0,
            events: [],
            stage: "knockout" as const,
            round: r,
            observations: obs
        });

        // 1. CROSSOVER LOGIC (A1 vs B2, B1 vs A2)
        // Only applies if we have even pairs of groups (2, 4, 8) and standard qualifiers
        if (groupKeys.length >= 2 && groupKeys.length % 2 === 0 && qualifiersPerGroup === 2 && wildcardsCount === 0) {
             const totalQualified = groupKeys.length * 2;
             const roundName = totalQualified === 16 ? "Oitavas" : totalQualified === 8 ? "Quartas" : totalQualified === 4 ? "Semi-Final" : "Final";

             for (let i = 0; i < groupKeys.length; i += 2) {
                 const g1 = groupKeys[i];
                 const g2 = groupKeys[i+1];
                 const s1 = standings[g1];
                 const s2 = standings[g2];
                 
                 // 1st of G1 vs 2nd of G2
                 if (s1?.[0] && s2?.[1]) {
                     knockoutMatches.push(create(s1[0].teamId, s2[1].teamId, roundName, `${g1}#1 vs ${g2}#2`));
                 }
                 // 1st of G2 vs 2nd of G1
                 if (s2?.[0] && s1?.[1]) {
                     knockoutMatches.push(create(s2[0].teamId, s1[1].teamId, roundName, `${g2}#1 vs ${g1}#2`));
                 }
             }
        } 
        // 2. GLOBAL SEED FALLBACK (Best vs Worst)
        else {
             let qualifiedStats: TeamStats[] = [];
             Object.values(standings).forEach(groupStats => {
                groupStats.slice(0, qualifiersPerGroup).forEach(stat => qualifiedStats.push(stat));
             });
             
             // Wildcards logic
             let candidatesStats: TeamStats[] = [];
             if (wildcardsCount > 0) {
                 // collect candidates... (skipping complex logic for brevity, assuming standard flow)
                  Object.values(standings).forEach(groupStats => {
                     groupStats.slice(qualifiersPerGroup).forEach(stat => candidatesStats.push(stat));
                  });
                  candidatesStats.sort((a,b) => b.points - a.points);
                  qualifiedStats.push(...candidatesStats.slice(0, wildcardsCount));
             }

             qualifiedStats.sort((a, b) => {
                if (b.points !== a.points) return b.points - a.points;
                return b.goalDifference - a.goalDifference;
             });

             const total = qualifiedStats.length;
             const roundName = total === 16 ? "Oitavas" : total === 8 ? "Quartas" : total === 4 ? "Semi-Final" : "Final";

             for (let i = 0; i < total / 2; i++) {
                 const high = qualifiedStats[i];
                 const low = qualifiedStats[total - 1 - i];
                 knockoutMatches.push(create(high.teamId, low.teamId, roundName, `Seed #${i+1} x #${total-i}`));
             }
        }

        return knockoutMatches;
    }
    
    // 5. Gerar Mata-Mata Direto
    static generateDirectKnockoutMatches(teams: Team[], sportId: string): Match[] {
        if (teams.length < 2) return [];
        
        const shuffled = [...teams].sort(() => Math.random() - 0.5);
        const matches: Match[] = [];
        const count = shuffled.length;
        const roundName = count <= 2 ? "Final" : count <= 4 ? "Semi-Final" : count <= 8 ? "Quartas" : "Mata-Mata";

        for (let i = 0; i < Math.floor(count / 2); i++) {
            matches.push({
                id: crypto.randomUUID(),
                sportId,
                teamAId: shuffled[i * 2].id,
                teamBId: shuffled[i * 2 + 1].id,
                status: "scheduled",
                scoreA: 0,
                scoreB: 0,
                events: [],
                stage: "knockout",
                round: roundName,
                observations: "Sorteio Direto " + (i+1)
            });
        }
        return matches;
    }
    
    // 6. Gerar PrÃ³xima Fase do Mata-Mata
    static generateNextKnockoutRound(teams: Team[], matches: Match[]): Match[] {
        // Filter knockout matches
        const koMatches = matches.filter(m => m.stage === "knockout");
        if (koMatches.length === 0) return [];
        
        // Find the latest round
        // We can sort by creation time (implicitly index) or explicit round name.
        // Let`s use the round name logic to determine depth.
        const roundOrder = ["Oitavas", "Quartas", "Semi-Final", "Final"];
        
        // Group by round
        const roundsFound = new Set(koMatches.map(m => m.round));
        let lastRound = "";
        
        // Find the "deepest" round that exists
        for (const r of roundOrder) {
            if (roundsFound.has(r)) lastRound = r;
        }
        
        if (!lastRound) {
             // Fallback if custom round names
             lastRound = koMatches[koMatches.length - 1].round || "";
        }
        
        // Get matches of that round
        const currentRoundMatches = koMatches.filter(m => m.round === lastRound);
        
        // Check if all finished
        if (currentRoundMatches.some(m => m.status !== "finished")) {
             return []; // Still playing
        }
        
        // Determine winners
        const winners: string[] = [];
        currentRoundMatches.forEach(m => {
             // Determine winner with Penalties consideration
             if (m.scoreA > m.scoreB) {
                 winners.push(m.teamAId);
             } else if (m.scoreB > m.scoreA) {
                 winners.push(m.teamBId);
             } else {
                 // Draw - Check Penalties
                 const pA = m.penaltiesA || 0;
                 const pB = m.penaltiesB || 0;
                 
                 if (pA > pB) winners.push(m.teamAId);
                 else if (pB > pA) winners.push(m.teamBId);
                 else {
                     // Still draw? Default to A (should not happen in proper penalty shootout)
                     winners.push(m.teamAId); 
                 }
             }
        });
        
        if (winners.length < 2) return []; // Final finished
        
        // Generate Next Round
        const nextMatches: Match[] = [];
        const nextRoundName = winners.length === 2 ? "Final" : winners.length === 4 ? "Semi-Final" : winners.length === 8 ? "Quartas" : "Mata-Mata";
        
        // Pair 1 vs 2, 3 vs 4
        for (let i = 0; i < winners.length; i += 2) {
             nextMatches.push({
                id: crypto.randomUUID(),
                sportId: currentRoundMatches[0].sportId,
                teamAId: winners[i],
                teamBId: winners[i+1],
                status: "scheduled",
                scoreA: 0,
                scoreB: 0,
                events: [],
                stage: "knockout",
                round: nextRoundName,
                observations: `Vencedor Jogo ${i+1} x Jogo ${i+2}`
            });
        }
        
        return nextMatches;
    }
}



