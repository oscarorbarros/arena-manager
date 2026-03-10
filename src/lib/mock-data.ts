import { Team, Player } from "./types";

export const MOCK_TEAMS: Team[] = [
    { id: "t1", name: "Águias FC", group: "A", logo: "🦅", delegationChiefId: "del_1", stats: { points: 0, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0 } },
    { id: "t2", name: "Leões da Vila", group: "A", logo: "🦁", stats: { points: 0, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0 } },
    { id: "t3", name: "Tubarões", group: "B", logo: "🦈", stats: { points: 0, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0 } },
    { id: "t4", name: "Lobos", group: "B", logo: "🐺", stats: { points: 0, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0 } },
    { id: "t5", name: "Falcões", group: "C", logo: "🦅", stats: { points: 0, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0 } },
    { id: "t6", name: "Cobras", group: "C", logo: "🐍", stats: { points: 0, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0 } },
    { id: "t7", name: "Panteras", group: "D", logo: "🐆", stats: { points: 0, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0 } },
    { id: "t8", name: "Ursos", group: "D", logo: "🐻", stats: { points: 0, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0 } },
];

export const MOCK_PLAYERS: Player[] = [
    { id: "p1", name: "Carlos Silva", teamId: "t1", number: 10, position: "Atacante", stats: { goals: 0, yellowCards: 0, redCards: 0, matchesPlayed: 0 } },
    { id: "p2", name: "Marcos Lima", teamId: "t1", number: 1, position: "Goleiro", stats: { goals: 0, yellowCards: 0, redCards: 0, matchesPlayed: 0 } },
    { id: "p3", name: "Pedro Santos", teamId: "t2", number: 7, position: "Meio-Campo", stats: { goals: 0, yellowCards: 0, redCards: 0, matchesPlayed: 0 } },
    { id: "p4", name: "João Souza", teamId: "t3", number: 9, position: "Atacante", stats: { goals: 0, yellowCards: 0, redCards: 0, matchesPlayed: 0 } },
];
