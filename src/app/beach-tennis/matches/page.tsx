"use client";
import React, { useState } from "react";
import { useBT } from "@/lib/bt-context";
import { BTCategory, BTMatchPhase, BTMatch, CATEGORY_LABELS, PHASE_LABELS, getSetTarget } from "@/lib/bt-types";
import { Plus, Play, X, Zap } from "lucide-react";
import Link from "next/link";

export default function BTMatchesPage() {
  const { config, setConfig, generateGroupMatches, updatePairStats, registerWalkover } = useBT();
  const [newModal, setNewModal] = useState(false);
  const [filterCat, setFilterCat] = useState<BTCategory | 'all'>('all');
  const [filterPhase, setFilterPhase] = useState<BTMatchPhase | 'all'>('all');

  // New match form
  const [mCat, setMCat] = useState<BTCategory>('masculine');
  const [mPhase, setMPhase] = useState<BTMatchPhase>('group');
  const [mPairA, setMPairA] = useState('');
  const [mPairB, setMPairB] = useState('');
  const [mGroup, setMGroup] = useState('A');
  const [mCourt, setMCourt] = useState('');
  const [mTime, setMTime] = useState('');

  const addMatch = (e: React.FormEvent) => {
    e.preventDefault();
    const target = getSetTarget(mPhase);
    const match: BTMatch = {
      id: crypto.randomUUID(),
      pairAId: mPairA,
      pairBId: mPairB,
      category: mCat,
      phase: mPhase,
      group: mGroup,
      court: mCourt || undefined,
      scheduledTime: mTime || undefined,
      status: 'scheduled',
      gamesA: 0, gamesB: 0,
      setTarget: target,
      inTiebreak: false,
      tiebreakA: 0, tiebreakB: 0,
      substitutionsA: 0, substitutionsB: 0,
      events: [],
    };
    setConfig(prev => ({ ...prev, matches: [...prev.matches, match] }));
    setMPairA(''); setMPairB(''); setMCourt(''); setMTime('');
    setNewModal(false);
  };

  const getPairLabel = (pairId: string) => {
    const pair = config.pairs.find(p => p.id === pairId);
    if (!pair) return "—";
    const p1 = config.players.find(p => p.id === pair.player1Id)?.name?.split(' ')[0] ?? '?';
    const p2 = config.players.find(p => p.id === pair.player2Id)?.name?.split(' ')[0] ?? '?';
    const team = config.teams.find(t => t.id === pair.teamId)?.name ?? '';
    return `${p1}/${p2} (${team})`;
  };

  const deleteMatch = (id: string) => {
    if (confirm("Excluir esta partida?")) setConfig(prev => ({ ...prev, matches: prev.matches.filter(m => m.id !== id) }));
  };

  const filteredMatches = config.matches.filter(m => {
    const pair = config.pairs.find(p => p.id === m.pairAId);
    const catOk = filterCat === 'all' || m.category === filterCat;
    const phaseOk = filterPhase === 'all' || m.phase === filterPhase;
    return catOk && phaseOk;
  });

  const catPairs = (cat: BTCategory) => config.pairs.filter(p => p.category === cat);

  const statusBadge = (status: string) => {
    if (status === 'finished') return "bg-gray-100 text-gray-500";
    if (status === 'in_progress') return "bg-green-100 text-green-700 animate-pulse";
    return "bg-blue-50 text-blue-500";
  };
  const statusLabel = (status: string) => {
    if (status === 'finished') return "Finalizada";
    if (status === 'in_progress') return "Ao Vivo";
    return "Agendada";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Partidas</h1>
          <p className="text-gray-500 text-sm mt-1">{config.matches.length} partidas · {config.matches.filter(m => m.status === 'finished').length} finalizadas</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={updatePairStats} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200">
            🔄 Atualizar Classificação
          </button>
          <button onClick={() => setNewModal(true)} className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 flex items-center gap-2 shadow-lg shadow-orange-200">
            <Plus className="w-4 h-4" /> Nova Partida
          </button>
        </div>
      </div>

      {/* Auto-generate group matches */}
      {config.pairs.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <Zap className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold text-orange-800">Gerar Partidas Automaticamente</h3>
          </div>
          <p className="text-sm text-orange-700 mb-4">Gera todas as partidas da fase de grupos (todos contra todos) por categoria.</p>
          <div className="flex flex-wrap gap-2">
            {(['masculine', 'feminine', 'mixed'] as BTCategory[]).map(cat => (
              catPairs(cat).length >= 2 && (
                <button
                  key={cat}
                  onClick={() => { generateGroupMatches(cat, 'group'); }}
                  className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors"
                >
                  {CATEGORY_LABELS[cat]} — Fase de Grupos
                </button>
              )
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <select value={filterCat} onChange={e => setFilterCat(e.target.value as any)} className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400">
          <option value="all">Todas categorias</option>
          <option value="masculine">Masculino</option>
          <option value="feminine">Feminino</option>
          <option value="mixed">Misto</option>
        </select>
        <select value={filterPhase} onChange={e => setFilterPhase(e.target.value as any)} className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400">
          <option value="all">Todas fases</option>
          <option value="group">Fase de Grupos</option>
          <option value="quarterfinal">Quartas de Final</option>
          <option value="semifinal">Semifinal</option>
          <option value="final">Final</option>
        </select>
      </div>

      {/* Match list */}
      {filteredMatches.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <div className="text-5xl mb-3">🎾</div>
          <p className="text-gray-500 font-medium">Nenhuma partida. Crie manualmente ou gere automaticamente pela fase de grupos.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMatches.map(match => {
            const pairA = config.pairs.find(p => p.id === match.pairAId);
            const pairB = config.pairs.find(p => p.id === match.pairBId);
            return (
              <div key={match.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Meta */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusBadge(match.status)}`}>{statusLabel(match.status)}</span>
                      <span className="text-xs px-2 py-0.5 bg-orange-50 text-orange-700 rounded-full font-medium">{CATEGORY_LABELS[match.category]}</span>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{PHASE_LABELS[match.phase]}</span>
                      {match.group && <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">Grupo {match.group}</span>}
                      {match.court && <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full">Quadra {match.court}</span>}
                    </div>

                    {/* Score */}
                    <div className="flex items-center gap-4">
                      <div className={`flex-1 text-right font-bold ${match.winner === 'A' ? 'text-green-700' : 'text-gray-700'}`}>
                        <div className="text-sm">{getPairLabel(match.pairAId)}</div>
                      </div>
                      <div className="text-center">
                        {match.status === 'scheduled' ? (
                          <div className="text-gray-400 font-bold text-xl">vs</div>
                        ) : (
                          <div className="font-black text-2xl text-gray-900">
                            {match.inTiebreak
                              ? `${match.gamesA}({${match.tiebreakA}}) – ${match.gamesB}({${match.tiebreakB}})`
                              : `${match.gamesA} – ${match.gamesB}`
                            }
                          </div>
                        )}
                        {match.isWalkover && <div className="text-xs text-red-400 font-bold">W.O.</div>}
                        <div className="text-xs text-gray-400">Set alvo: {match.setTarget}</div>
                      </div>
                      <div className={`flex-1 font-bold ${match.winner === 'B' ? 'text-green-700' : 'text-gray-700'}`}>
                        <div className="text-sm">{getPairLabel(match.pairBId)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 shrink-0">
                    {match.status !== 'finished' && (
                      <Link
                        href={`/beach-tennis/referee/${match.id}`}
                        className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-colors"
                      >
                        <Play className="w-3.5 h-3.5" /> Arbitrar
                      </Link>
                    )}
                    <button
                      onClick={() => deleteMatch(match.id)}
                      className="px-3 py-2 bg-gray-100 text-gray-500 rounded-xl text-xs font-bold hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New match modal */}
      {newModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 sticky top-0 bg-white">
              <h3 className="font-black text-lg">🎾 Nova Partida</h3>
              <button onClick={() => setNewModal(false)} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={addMatch} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Categoria</label>
                  <select className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm" value={mCat} onChange={e => { setMCat(e.target.value as BTCategory); setMPairA(''); setMPairB(''); }}>
                    <option value="masculine">Masculino</option>
                    <option value="feminine">Feminino</option>
                    <option value="mixed">Misto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Fase</label>
                  <select className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm" value={mPhase} onChange={e => setMPhase(e.target.value as BTMatchPhase)}>
                    <option value="group">Fase de Grupos</option>
                    <option value="quarterfinal">Quartas</option>
                    <option value="semifinal">Semifinal</option>
                    <option value="final">Final</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Grupo</label>
                  <select className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm" value={mGroup} onChange={e => setMGroup(e.target.value)}>
                    {['A','B','C','D'].map(g => <option key={g} value={g}>Grupo {g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Quadra (opcional)</label>
                  <input className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm" value={mCourt} onChange={e => setMCourt(e.target.value)} placeholder="Ex: 1" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Dupla A</label>
                <select className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm" value={mPairA} onChange={e => setMPairA(e.target.value)} required>
                  <option value="">Selecione...</option>
                  {config.pairs.filter(p => p.category === mCat).map(p => <option key={p.id} value={p.id}>{getPairLabel(p.id)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Dupla B</label>
                <select className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm" value={mPairB} onChange={e => setMPairB(e.target.value)} required>
                  <option value="">Selecione...</option>
                  {config.pairs.filter(p => p.category === mCat && p.id !== mPairA).map(p => <option key={p.id} value={p.id}>{getPairLabel(p.id)}</option>)}
                </select>
              </div>
              <div className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3">
                Set alvo: <strong>{mPhase === 'semifinal' || mPhase === 'final' ? '8 games (Art. 23)' : '6 games (Art. 22)'}</strong>. Tie-break a 7 pontos em caso de empate.
              </div>
              <button type="submit" disabled={!mPairA || !mPairB} className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 disabled:opacity-50">
                Criar Partida
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
