import { TournamentConfig, SportConfig, DEFAULT_CONFIG } from "./types";

export function generateTournamentConfig(prompt: string): Partial<TournamentConfig> {
  const lowerPrompt = prompt.toLowerCase();
  const sports: SportConfig[] = [];

  // Mock AI Logic - Keyword Matching
  if (lowerPrompt.includes("futsal") || lowerPrompt.includes("futebol")) {
    sports.push({
      id: "futsal_" + Date.now(),
      name: "Futsal",
      type: "team",
      playersOnField: 5,
      scoring: { type: "goals", winPoints: 3, drawPoints: 1, lossPoints: 0 },
      matchDuration: 40
    });
  }

  if (lowerPrompt.includes("volei") || lowerPrompt.includes("vôlei") || lowerPrompt.includes("volleyball")) {
    sports.push({
      id: "volei_" + Date.now(),
      name: "Vôlei",
      type: "team",
      playersOnField: 6,
      scoring: { type: "sets", winPoints: 2, lossPoints: 1, setPoints: 25 },
      matchDuration: 90 // avg
    });
  }
  
  if (lowerPrompt.includes("basquete") || lowerPrompt.includes("basketball")) {
      sports.push({
          id: "basquete_" + Date.now(),
          name: "Basquete",
          type: "team",
          playersOnField: 5,
          scoring: { type: "points", winPoints: 2, lossPoints: 1 },
          matchDuration: 40
      });
  }

  // If no sport detected, default to Futsal
  if (sports.length === 0) {
     sports.push({
      id: "gen_" + Date.now(),
      name: "Esporte Genérico",
      type: "team",
      scoring: { type: "goals", winPoints: 3 },
     });
  }

  return {
    name: "Torneio Gerado por IA",
    sports: sports,
    teams: [], // AI could generate placeholder teams too if requested
    matches: []
  };
}
