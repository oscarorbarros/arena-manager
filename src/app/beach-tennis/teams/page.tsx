"use client";
import React, { useState } from "react";
import { useBT } from "@/lib/bt-context";
import { BTCategory, BTPlayer, BTPair, BTTeam, CATEGORY_LABELS } from "@/lib/bt-types";
import { Plus, Trash2, X, Users } from "lucide-react";

type Modal = 'team' | 'player' | 'pair' | null;

export default function BTTeamsPage() {
  const { config, setConfig } = useBT();
  const [modal, setModal] = useState<Modal>(null);
  const [selectedTeam, setSelectedTeam] = useState<string>('');

  // Team form
  const [teamName, setTeamName] = useState('');
  const [teamLogo, setTeamLogo] = useState('🏫');

  // Player form
  const [playerName, setPlayerName] = useState('');
  const [playerGender, setPlayerGender] = useState<'M' | 'F'>('M');
  const [playerTeam, setPlayerTeam] = useState('');

  // Pair form
  const [pairTeam, setPairTeam] = useState('');
  const [pairCategory, setPairCategory] = useState<BTCategory>('masculine');
  const [pairGroup, setPairGroup] = useState('A');
  const [pairP1, setPairP1] = useState('');
  const [pairP2, setPairP2] = useState('');
  const [pairReserve, setPairReserve] = useState('');

  const addTeam = (e: React.FormEvent) => {
    e.preventDefault();
    const team: BTTeam = { id: crypto.randomUUID(), name: teamName, logo: teamLogo };
    setConfig(prev => ({ ...prev, teams: [...prev.teams, team] }));
    setTeamName(''); setTeamLogo('🏫'); setModal(null);
  };

  const addPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    const player: BTPlayer = { id: crypto.randomUUID(), name: playerName, gender: playerGender, teamId: playerTeam };
    setConfig(prev => ({ ...prev, players: [...prev.players, player] }));
    setPlayerName(''); setModal(null);
  };

  const addPair = (e: React.FormEvent) => {
    e.preventDefault();
    const pair: BTPair = {
      id: crypto.randomUUID(),
      teamId: pairTeam,
      player1Id: pairP1,
      player2Id: pairP2,
      reserveId: pairReserve || undefined,
      category: pairCategory,
      group: pairGroup,
      stats: { points: 0, played: 0, won: 0, lost: 0, wo: 0, gamesFor: 0, gamesAgainst: 0, gameDifference: 0 }
    };
    setConfig(prev => ({ ...prev, pairs: [...prev.pairs, pair] }));
    setPairP1(''); setPairP2(''); setPairReserve(''); setModal(null);
  };

  const deleteTeam = (id: string) => {
    if (!confirm("Excluir time e seus jogadores?")) return;
    setConfig(prev => ({
      ...prev,
      teams: prev.teams.filter(t => t.id !== id),
      players: prev.players.filter(p => p.teamId !== id),
      pairs: prev.pairs.filter(p => p.teamId !== id),
    }));
  };
  const deletePlayer = (id: string) => setConfig(prev => ({ ...prev, players: prev.players.filter(p => p.id !== id) }));
  const deletePair = (id: string) => setConfig(prev => ({ ...prev, pairs: prev.pairs.filter(p => p.id !== id) }));

  const teamPlayers = (teamId: string) => config.players.filter(p => p.teamId === teamId);
  const teamPairs = (teamId: string) => config.pairs.filter(p => p.teamId === teamId);
  const getPairPlayerNames = (pair: BTPair) => {
    const p1 = config.players.find(p => p.id === pair.player1Id)?.name ?? '?';
    const p2 = config.players.find(p => p.id === pair.player2Id)?.name ?? '?';
    return `${p1} / ${p2}`;
  };

  const availableTeamPlayers = config.players.filter(p => p.teamId === pairTeam);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Times & Duplas</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie instituições, atletas e duplas por categoria</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setModal('team')} className="px-4 py-2 bg-gray-800 text-white rounded-xl text-sm font-bold hover:bg-gray-700 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Time/Instituição
          </button>
          <button onClick={() => setModal('player')} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Atleta
          </button>
          <button onClick={() => setModal('pair')} className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 flex items-center gap-2 shadow-lg shadow-orange-200">
            <Plus className="w-4 h-4" /> Dupla
          </button>
        </div>
      </div>

      {/* Teams */}
      {config.teams.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum time cadastrado. Comece adicionando uma instituição.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {config.teams.map(team => (
            <div key={team.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              {/* Team header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{team.logo}</span>
                  <div>
                    <h3 className="font-black text-lg text-gray-900">{team.name}</h3>
                    <p className="text-xs text-gray-500">{teamPlayers(team.id).length} atletas · {teamPairs(team.id).length} duplas</p>
                  </div>
                </div>
                <button onClick={() => deleteTeam(team.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Players */}
              <div className="p-5">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Atletas</h4>
                {teamPlayers(team.id).length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Nenhum atleta</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {teamPlayers(team.id).map(p => (
                      <div key={p.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{p.gender === 'M' ? '👨' : '👩'}</span>
                          <span className="text-sm font-medium truncate">{p.name}</span>
                        </div>
                        <button onClick={() => deletePlayer(p.id)} className="p-0.5 text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pairs */}
                {teamPairs(team.id).length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Duplas</h4>
                    <div className="space-y-2">
                      {teamPairs(team.id).map(pair => (
                        <div key={pair.id} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-100 rounded-xl">
                          <div>
                            <div className="font-bold text-sm text-gray-900">{getPairPlayerNames(pair)}</div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {CATEGORY_LABELS[pair.category]} · Grupo {pair.group}
                              {pair.reserveId && ` · Reserva: ${config.players.find(p => p.id === pair.reserveId)?.name}`}
                            </div>
                          </div>
                          <button onClick={() => deletePair(pair.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== MODALS ===== */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="font-black text-lg">
                {modal === 'team' ? '🏫 Novo Time/Instituição' :
                 modal === 'player' ? '👤 Novo Atleta' : '🎾 Nova Dupla'}
              </h3>
              <button onClick={() => setModal(null)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5">
              {modal === 'team' && (
                <form onSubmit={addTeam} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nome</label>
                    <input className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400" value={teamName} onChange={e => setTeamName(e.target.value)} required placeholder="Ex: Campus Recife" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Emoji/Logo</label>
                    <input className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400" value={teamLogo} onChange={e => setTeamLogo(e.target.value)} placeholder="🏫" />
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600">Adicionar</button>
                </form>
              )}

              {modal === 'player' && (
                <form onSubmit={addPlayer} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nome Completo</label>
                    <input className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400" value={playerName} onChange={e => setPlayerName(e.target.value)} required placeholder="Nome do atleta" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Gênero</label>
                    <select className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400" value={playerGender} onChange={e => setPlayerGender(e.target.value as 'M' | 'F')}>
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Instituição</label>
                    <select className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400" value={playerTeam} onChange={e => setPlayerTeam(e.target.value)} required>
                      <option value="">Selecione...</option>
                      {config.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">Adicionar Atleta</button>
                </form>
              )}

              {modal === 'pair' && (
                <form onSubmit={addPair} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Instituição</label>
                    <select className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400" value={pairTeam} onChange={e => setPairTeam(e.target.value)} required>
                      <option value="">Selecione...</option>
                      {config.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Categoria</label>
                      <select className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400" value={pairCategory} onChange={e => setPairCategory(e.target.value as BTCategory)}>
                        <option value="masculine">Masculino</option>
                        <option value="feminine">Feminino</option>
                        <option value="mixed">Misto</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Grupo</label>
                      <select className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400" value={pairGroup} onChange={e => setPairGroup(e.target.value)}>
                        {['A','B','C','D'].map(g => <option key={g} value={g}>Grupo {g}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Atleta 1 (Titular)</label>
                    <select className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400" value={pairP1} onChange={e => setPairP1(e.target.value)} required>
                      <option value="">Selecione...</option>
                      {availableTeamPlayers.map(p => <option key={p.id} value={p.id}>{p.name} ({p.gender})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Atleta 2 (Titular)</label>
                    <select className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400" value={pairP2} onChange={e => setPairP2(e.target.value)} required>
                      <option value="">Selecione...</option>
                      {availableTeamPlayers.filter(p => p.id !== pairP1).map(p => <option key={p.id} value={p.id}>{p.name} ({p.gender})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Reserva (opcional)</label>
                    <select className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400" value={pairReserve} onChange={e => setPairReserve(e.target.value)}>
                      <option value="">Sem reserva</option>
                      {availableTeamPlayers.filter(p => p.id !== pairP1 && p.id !== pairP2).map(p => <option key={p.id} value={p.id}>{p.name} ({p.gender})</option>)}
                    </select>
                  </div>
                  <button type="submit" disabled={!pairTeam || !pairP1 || !pairP2} className="w-full py-2.5 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 disabled:opacity-50">Criar Dupla</button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
