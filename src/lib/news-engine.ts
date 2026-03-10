import { Match, Team, SportConfig } from "./types";

export interface NewsStory {
    id: string;
    headline: string;
    body: string;
    matchId: string;
    timestamp: number;
    imageUrl?: string;
    tags?: string[];
}

export function generateMatchReport(match: Match, sport: SportConfig, teamA: Team, teamB: Team): NewsStory {
    const winner = match.scoreA > match.scoreB ? teamA : (match.scoreB > match.scoreA ? teamB : 
                   (match.penaltiesA !== undefined && match.penaltiesB !== undefined && match.penaltiesA > match.penaltiesB) ? teamA : 
                   (match.penaltiesA !== undefined && match.penaltiesB !== undefined && match.penaltiesB > match.penaltiesA) ? teamB : null);
    const loser = winner === teamA ? teamB : teamA;
    const scoreDiff = Math.abs(match.scoreA - match.scoreB);

    // Analyze Events
    const goals = match.events.filter(e => e.type === "goal");
    const cards = match.events.filter(e => e.type.includes("card"));

    // Find MVP (Most goals)
    const playerGoals: Record<string, number> = {};
    goals.forEach(g => {
        if (g.playerId) playerGoals[g.playerId] = (playerGoals[g.playerId] || 0) + 1;
    });

    // Get top scorer
    const topScorerId = Object.keys(playerGoals).reduce((a, b) => playerGoals[a] > playerGoals[b] ? a : b, "");
    const topScorerCount = playerGoals[topScorerId] || 0;

    const topScorerEvent = goals.find(g => g.playerId === topScorerId);
    const topScorerName = topScorerEvent?.observation?.replace("Gol de ", "") || "O destaque";

    let headline = "";
    let body = "";
    const tags = ["pós-jogo", sport.name];

    // --- HEADLINE GENERATION ---
    // Detect Knockout Stage
    const isKnockout = match.stage === "knockout";
    const roundName = match.round || "Mata-Mata";
    const penaltyText = (match.penaltiesA !== undefined && match.penaltiesB !== undefined) 
        ? ` (Pênaltis: ${match.penaltiesA} x ${match.penaltiesB})`
        : "";

    if (!winner) {
        if (match.scoreA === 0) {
            headline = `Tudo igual! ${teamA.name} e ${teamB.name} não saem do zero.`;
            body = `Em um jogo de defesas fortes, nenhuma das equipes conseguiu balançar as redes. O empate de 0 a 0 reflete o equilíbrio do confronto válido pelo grupo ${match.group || "único"}.`;
        } else {
            headline = `Jogo eletrizante! ${teamA.name} e ${teamB.name} empatam em ${match.scoreA} a ${match.scoreB}.`;
            body = `Uma partida cheia de alternativas terminou com um empate justo. As duas equipes buscaram o gol o tempo todo e protagonizaram um belo espetáculo.`;
        }
    } else {
        if (isKnockout) {
            // SPECIAL FINAL LOGIC
            if (roundName === "Final") {
                 headline = `🏆 É CAMPEÃO! ${winner.name} vence ${loser.name} e conquista o título!`;
                 body = `Em uma final emocionante, o ${winner.name} sagrou-se o grande campeão! `;
                 
                 if (penaltyText) {
                    headline += penaltyText;
                    body += `Após um empate tenso no tempo normal (${match.scoreA} a ${match.scoreB}), a decisão foi para os pênaltis, onde a estrela do ${winner.name} brilhou, vencendo por ${Math.max(match.penaltiesA||0, match.penaltiesB||0)} a ${Math.min(match.penaltiesA||0, match.penaltiesB||0)}. Haja coração! `;
                 } else {
                    body += `Com uma vitória convincente de ${Math.max(match.scoreA, match.scoreB)} a ${Math.min(match.scoreA, match.scoreB)}, a equipe levanta a taça com méritos. `;
                 }
                 tags.push("CAMPEAO", "FINAL", "TITULO");
            } else {
                headline = `${roundName}: ${winner.name} elimina ${loser.name}${penaltyText}!`;
                body = `Em um jogo decisivo pela fase de ${roundName}, o ${winner.name} levou a melhor sobre o ${loser.name}. `;
    
                if (penaltyText) {
                    body += `Após empate de ${match.scoreA} a ${match.scoreB} no tempo normal, a decisão foi para os pênaltis, onde o ${winner.name} venceu por ${Math.max(match.penaltiesA||0, match.penaltiesB||0)} a ${Math.min(match.penaltiesA||0, match.penaltiesB||0)}. Haja coração!`;
                    tags.push("penaltis", "classificacao");
                } else {
                     body += `Com o placar de ${Math.max(match.scoreA, match.scoreB)} a ${Math.min(match.scoreA, match.scoreB)}, a equipe garante sua vaga na próxima fase.`;
                }
                tags.push(roundName, "eliminatoria");
            }
        } else {
            if (scoreDiff >= 3) {
                headline = `Atropelo! ${winner.name} goleia ${loser.name} por ${Math.max(match.scoreA, match.scoreB)} a ${Math.min(match.scoreA, match.scoreB)}.`;
                body = `Sem dar chances ao azar, o ${winner.name} dominou o ${loser.name} do início ao fim.`;
                tags.push("goleada");
            } else if (scoreDiff === 1) {
                headline = `No sufoco! ${winner.name} vence ${loser.name} por ${Math.max(match.scoreA, match.scoreB)} a ${Math.min(match.scoreA, match.scoreB)}.`;
                body = `Foi com emoção até o fim! O ${winner.name} precisou suar a camisa para segurar a pressão do ${loser.name} e garantir os 3 pontos.`;
            } else {
                headline = `${winner.name} vence ${loser.name} e segue firme no campeonato.`;
                body = `Com uma atuação segura, o ${winner.name} bateu o ${loser.name} pelo placar de ${Math.max(match.scoreA, match.scoreB)} a ${Math.min(match.scoreA, match.scoreB)}.`;
            }
        }
    }

    // --- BODY ENRICHMENT ---
    if (topScorerCount >= 3) {
        body += ` O nome do jogo foi ${topScorerName}, que pediu música e marcou 3 gols!`;
        tags.push("hat-trick");
    } else if (topScorerCount === 2) {
        body += ` Destaque para ${topScorerName}, que balançou as redes duas vezes.`;
    }

    // Add Goal Highlights
    if (goals.length > 0) {
         const allScorers = Object.keys(playerGoals).map(id => {
             const evt = goals.find(g => g.playerId === id);
             const name = evt?.observation?.replace("Gol de ", "") || "Desconhecido";
             const count = playerGoals[id];
             return count > 1 ? `${name} (${count})` : name;
         });
         
         body += `\n\nQuem marcou: ${allScorers.join(", ")}.`;
    }

    if (cards.length > 2) {
        body += ` A partida foi tensa, com a arbitragem precisando distribuir ${cards.length} cartões para controlar os ânimos.`;
    }

    return {
        id: crypto.randomUUID(),
        headline,
        body,
        matchId: match.id,
        timestamp: Date.now(),
        tags
    };
}

// --- NEW GENERATORS ---

export function generateKnockoutNews(matches: Match[], roundName: string, teams: Team[]): NewsStory {
    const getTeamName = (id: string) => teams.find(t => t.id === id)?.name || "Equipe";
    
    // Build story about upcoming matches
    const matchups = matches.map(m => `${getTeamName(m.teamAId)} x ${getTeamName(m.teamBId)}`).join("\n- ");

    return {
        id: crypto.randomUUID(),
        headline: `Definidos os confrontos das ${roundName}!`,
        body: `A temperatura subiu! A fase de ${roundName} está definida e promete fortes emoções. Confira os duelos:\n\n- ${matchups}\n\nQuem avançará para a próxima fase?`,
        matchId: "round_" + Date.now(),
        timestamp: Date.now(),
        tags: ["mata-mata", roundName, "decisao"]
    };
}

export function generateFinalNews(match: Match, teams: Team[]): NewsStory {
    const teamA = teams.find(t => t.id === match.teamAId)?.name;
    const teamB = teams.find(t => t.id === match.teamBId)?.name;

    return {
        id: crypto.randomUUID(),
        headline: `A GRANDE FINAL ESTÁ DEFINIDA: ${teamA} x ${teamB}!`,
        body: `O momento mais aguardado chegou! ${teamA} e ${teamB} venceram seus desafios e estão na Grande Final. \n\nAtaques poderosos, defesas sólidas e muita raça trouxeram essas equipes até aqui. Agora, é tudo ou nada. Quem levantará a taça?\n\nNão perca esse confronto histórico!`,
        matchId: match.id,
        timestamp: Date.now(),
        tags: ["FINAL", "imperdivel", "decisao"]
    };
}

export function generateChampionNews(winnerName: string): NewsStory {
    return {
        id: crypto.randomUUID(),
        headline: `🏆 É CAMPEÃO! ${winnerName} conquista o título! 🏆`,
        body: `A festa é do ${winnerName}! Após uma campanha brilhante, a equipe superou todos os adversários e levantou o troféu de campeão.\n\nCom méritos, garra e talento, o ${winnerName} escreve seu nome na história do campeonato. Parabéns aos jogadores, comissão técnica e torcida!\n\nQue venha o próximo torneio!`,
        matchId: "champion_" + Date.now(),
        timestamp: Date.now(),
        tags: ["CAMPEAO", "titulo", "conquista", "historia"]
    };
}
