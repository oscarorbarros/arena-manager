"use client";
import { useBT } from "@/lib/bt-context";
import { CATEGORY_LABELS, BTCategory, PHASE_LABELS } from "@/lib/bt-types";
import Link from "next/link";
import { Trophy, Users, Play, CheckCircle, Clock } from "lucide-react";

export default function BeachTennisDashboard() {
  const { config, updatePairStats } = useBT();

  const totalPairs = config.pairs.length;
  const totalMatches = config.matches.length;
  const finishedMatches = config.matches.filter(m => m.status === 'finished').length;
  const inProgressMatches = config.matches.filter(m => m.status === 'in_progress').length;

  const categories: BTCategory[] = ['masculine', 'feminine', 'mixed'];

  const recentMatches = [...config.matches]
    .filter(m => m.status === 'finished')
    .slice(-5)
    .reverse();

  const getPairName = (pairId: string) => {
    const pair = config.pairs.find(p => p.id === pairId);
    if (!pair) return "Dupla";
    const p1 = config.players.find(p => p.id === pair.player1Id);
    const p2 = config.players.find(p => p.id === pair.player2Id);
    return `${p1?.name?.split(' ')[0] ?? '?'} / ${p2?.name?.split(' ')[0] ?? '?'}`;
  };

  const getTeamName = (pairId: string) => {
    const pair = config.pairs.find(p => p.id === pairId);
    if (!pair) return "";
    return config.teams.find(t => t.id === pair.teamId)?.name ?? "";
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">🎾 {config.name}</h1>
          <p className="text-gray-500 mt-1">Painel de controle do torneio de Beach Tennis</p>
        </div>
        <div className="flex gap-3">
          <button onClick={updatePairStats} className="px-4 py-2 bg-orange-100 text-orange-700 border border-orange-200 rounded-xl text-sm font-bold hover:bg-orange-200 transition-colors">
            🔄 Atualizar Classificação
          </button>
          <Link href="/beach-tennis/matches" className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200">
            + Nova Partida
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Duplas", value: totalPairs, icon: Users, color: "bg-orange-50 text-orange-600 border-orange-100" },
          { label: "Partidas", value: totalMatches, icon: Trophy, color: "bg-blue-50 text-blue-600 border-blue-100" },
          { label: "Em Jogo", value: inProgressMatches, icon: Play, color: "bg-green-50 text-green-600 border-green-100" },
          { label: "Finalizadas", value: finishedMatches, icon: CheckCircle, color: "bg-gray-50 text-gray-600 border-gray-100" },
        ].map(card => (
          <div key={card.label} className={`p-5 rounded-2xl border ${card.color} flex items-center gap-4`}>
            <card.icon className="w-8 h-8 opacity-80" />
            <div>
              <p className="text-3xl font-black">{card.value}</p>
              <p className="text-xs font-medium opacity-70">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Category breakdown */}
      <div className="grid md:grid-cols-3 gap-4">
        {categories.map(cat => {
          const catPairs = config.pairs.filter(p => p.category === cat);
          const catMatches = config.matches.filter(m => {
            const pair = config.pairs.find(p => p.id === m.pairAId);
            return pair?.category === cat;
          });
          const done = catMatches.filter(m => m.status === 'finished').length;
          return (
            <div key={cat} className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
              <h3 className="font-bold text-gray-700 mb-3">{CATEGORY_LABELS[cat]}</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Duplas</span><strong>{catPairs.length}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Partidas</span><strong>{catMatches.length}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Realizadas</span><strong>{done}/{catMatches.length}</strong>
                </div>
              </div>
              {catMatches.length > 0 && (
                <div className="mt-3 bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-orange-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${catMatches.length > 0 ? (done / catMatches.length) * 100 : 0}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Standings per category */}
      {categories.map(cat => {
        const catPairs = config.pairs
          .filter(p => p.category === cat)
          .sort((a, b) => {
            if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
            if (b.stats.gameDifference !== a.stats.gameDifference) return b.stats.gameDifference - a.stats.gameDifference;
            return b.stats.gamesFor - a.stats.gamesFor;
          });
        if (catPairs.length === 0) return null;
        return (
          <div key={cat} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-800">{CATEGORY_LABELS[cat]} — Classificação</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-2 text-left">#</th>
                    <th className="px-4 py-2 text-left">Dupla</th>
                    <th className="px-4 py-2 text-center">PTS</th>
                    <th className="px-4 py-2 text-center">J</th>
                    <th className="px-4 py-2 text-center">V</th>
                    <th className="px-4 py-2 text-center">D</th>
                    <th className="px-4 py-2 text-center">GF</th>
                    <th className="px-4 py-2 text-center">GC</th>
                    <th className="px-4 py-2 text-center">SG</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {catPairs.map((pair, idx) => {
                    const p1 = config.players.find(p => p.id === pair.player1Id);
                    const p2 = config.players.find(p => p.id === pair.player2Id);
                    const team = config.teams.find(t => t.id === pair.teamId);
                    return (
                      <tr key={pair.id} className={idx < 2 ? "bg-green-50/50" : ""}>
                        <td className="px-4 py-3 font-bold text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900 text-sm">
                            {p1?.name?.split(' ')[0]} / {p2?.name?.split(' ')[0]}
                          </div>
                          <div className="text-xs text-gray-400">{team?.name}</div>
                        </td>
                        <td className="px-4 py-3 text-center font-black text-orange-600">{pair.stats.points}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{pair.stats.played}</td>
                        <td className="px-4 py-3 text-center text-green-600 font-bold">{pair.stats.won}</td>
                        <td className="px-4 py-3 text-center text-red-500">{pair.stats.lost}</td>
                        <td className="px-4 py-3 text-center">{pair.stats.gamesFor}</td>
                        <td className="px-4 py-3 text-center">{pair.stats.gamesAgainst}</td>
                        <td className="px-4 py-3 text-center font-bold">{pair.stats.gameDifference > 0 ? `+${pair.stats.gameDifference}` : pair.stats.gameDifference}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Recent matches */}
      {recentMatches.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-bold text-gray-800">Resultados Recentes</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {recentMatches.map(m => (
              <div key={m.id} className="p-4 flex items-center justify-between">
                <div className="text-sm">
                  <span className={`font-bold ${m.winner === 'A' ? 'text-green-700' : 'text-gray-500'}`}>{getPairName(m.pairAId)}</span>
                  <span className="mx-2 text-gray-400">vs</span>
                  <span className={`font-bold ${m.winner === 'B' ? 'text-green-700' : 'text-gray-500'}`}>{getPairName(m.pairBId)}</span>
                </div>
                <div className="text-right">
                  <div className="font-black text-lg text-gray-800">{m.gamesA} – {m.gamesB}</div>
                  {m.isWalkover && <div className="text-xs text-red-400">W.O.</div>}
                  <div className="text-xs text-gray-400">{CATEGORY_LABELS[m.category]}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {config.pairs.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <div className="text-6xl mb-4">🎾</div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">Nenhuma dupla cadastrada</h3>
          <p className="text-gray-500 mb-4">Comece cadastrando os times e as duplas</p>
          <Link href="/beach-tennis/teams" className="px-6 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors inline-block">
            Cadastrar Duplas →
          </Link>
        </div>
      )}
    </div>
  );
}
