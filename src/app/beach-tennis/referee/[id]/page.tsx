"use client";
import React, { useState, useEffect } from "react";
import { useBT } from "@/lib/bt-context";
import { useAuth } from "@/lib/auth-context";
import { useParams, useRouter } from "next/navigation";
import { CATEGORY_LABELS, PHASE_LABELS } from "@/lib/bt-types";
import { Play, StopCircle, ArrowLeft, Download } from "lucide-react";

export default function BTRefereePage() {
  const { id } = useParams<{ id: string }>();
  const { config, addGame, addTiebreakPoint, startMatch, finishMatch, registerWalkover, setConfig } = useBT();
  const { user } = useAuth();
  const router = useRouter();

  const match = config.matches.find(m => m.id === id);

  const [showWoModal, setShowWoModal] = useState(false);
  const [timer, setTimer] = useState(0);

  // Timer
  useEffect(() => {
    if (!match || match.status !== 'in_progress') return;
    const t = setInterval(() => setTimer(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [match?.status]);

  if (!match) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-5xl mb-4">🎾</div>
          <h2 className="text-2xl font-bold">Partida não encontrada</h2>
          <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-orange-500 rounded-xl text-sm font-bold">Voltar</button>
        </div>
      </div>
    );
  }

  const pairA = config.pairs.find(p => p.id === match.pairAId);
  const pairB = config.pairs.find(p => p.id === match.pairBId);

  const getPairName = (pairId: string, short = false) => {
    const pair = config.pairs.find(p => p.id === pairId);
    if (!pair) return "—";
    const p1 = config.players.find(p => p.id === pair.player1Id)?.name ?? '?';
    const p2 = config.players.find(p => p.id === pair.player2Id)?.name ?? '?';
    if (short) return `${p1.split(' ')[0]}/${p2.split(' ')[0]}`;
    return `${p1} / ${p2}`;
  };

  const teamName = (pairId: string) => {
    const pair = config.pairs.find(p => p.id === pairId);
    return config.teams.find(t => t.id === pair?.teamId)?.name ?? '';
  };

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const handleSubstitution = (side: 'A' | 'B') => {
    const subs = side === 'A' ? match.substitutionsA : match.substitutionsB;
    if (subs >= 2) { alert("Limite de 2 substituições por partida atingido (Art. 21 §2)"); return; }

    const pair = side === 'A' ? pairA : pairB;
    if (!pair?.reserveId) { alert("Esta dupla não tem atleta reserva cadastrado."); return; }

    setConfig(prev => ({
      ...prev,
      matches: prev.matches.map(m => m.id !== match.id ? m : {
        ...m,
        substitutionsA: side === 'A' ? m.substitutionsA + 1 : m.substitutionsA,
        substitutionsB: side === 'B' ? m.substitutionsB + 1 : m.substitutionsB,
        events: [...m.events, {
          id: crypto.randomUUID(),
          type: 'substitution' as const,
          pairId: side === 'A' ? match.pairAId : match.pairBId,
          timestamp: Date.now(),
          observation: `Substituição ${side === 'A' ? 'Dupla A' : 'Dupla B'} (${subs + 1}/2)`
        }]
      })
    }));
  };

  // Finished overlay
  
  const exportMatchOffline = () => {
    if (!match) return;
    const matchData = { ...match, exportedAt: new Date().toISOString(), isOfflineBackup: true };
    const blob = new Blob([JSON.stringify(matchData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ArenaManager_BKP_BT_${getPairName(match.pairAId, true)}_vs_${getPairName(match.pairBId, true)}.json`.replace(/[\s\/]+/g, '_');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (match.status === 'finished') {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6 text-white p-6">
        <div className="text-6xl">🏆</div>
        <h2 className="text-3xl font-black uppercase tracking-widest text-green-400">Partida Encerrada</h2>
        <div className="text-center">
          <div className={`text-2xl font-bold mb-1 ${match.winner === 'A' ? 'text-green-400' : 'text-gray-400'}`}>{getPairName(match.pairAId)}</div>
          <div className="text-6xl font-black font-mono my-3">
            {match.inTiebreak
              ? `${match.gamesA}({${match.tiebreakA}}) – ${match.gamesB}({${match.tiebreakB}})`
              : `${match.gamesA} – ${match.gamesB}`}
          </div>
          <div className={`text-2xl font-bold mt-1 ${match.winner === 'B' ? 'text-green-400' : 'text-gray-400'}`}>{getPairName(match.pairBId)}</div>
          {match.isWalkover && <div className="text-red-400 font-bold mt-2">W.O.</div>}
        </div>
        <p className="text-gray-500 text-sm">{CATEGORY_LABELS[match.category]} · {PHASE_LABELS[match.phase]}</p>
        <div className="flex gap-3">
          <button onClick={() => router.push('/beach-tennis/matches')} className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl text-sm border border-gray-700">
            ← Voltar às Partidas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white flex items-center gap-2 text-sm">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <div className="text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wide">🎾 Beach Tennis — Arbitragem</div>
          <div className="text-xs text-orange-400 font-bold">{CATEGORY_LABELS[match.category]} · {PHASE_LABELS[match.phase]}</div>
        </div>
        <div className="text-right flex items-center justify-end gap-3">
          {match.status === 'in_progress' && (
            <div className="font-mono text-green-400 text-sm font-bold">{formatTime(timer)}</div>
          )}
          <button title="Baixar Backup Offline" onClick={exportMatchOffline} className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded-full text-gray-400 hover:text-emerald-400 transition-colors">
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Score board */}
      <div className="bg-gray-900 border-b border-gray-800 p-6">
        <div className="flex justify-around items-center max-w-2xl mx-auto">
          {/* Pair A */}
          <div className="flex flex-col items-center gap-2 text-center flex-1">
            <div className={`text-4xl font-black ${match.winner === 'A' ? 'text-green-400' : 'text-white'}`}>
              {match.gamesA}
            </div>
            <div className="font-bold text-sm text-gray-300">{getPairName(match.pairAId, true)}</div>
            <div className="text-xs text-gray-500">{teamName(match.pairAId)}</div>
            {match.inTiebreak && (
              <div className="text-orange-400 font-bold text-lg">TB: {match.tiebreakA}</div>
            )}
            <div className="text-xs text-gray-600">Sub: {match.substitutionsA}/2</div>
          </div>

          {/* Center */}
          <div className="flex flex-col items-center gap-2 px-6">
            <div className="text-gray-600 text-2xl font-black">×</div>
            <div className="text-xs text-gray-500 text-center">
              {match.inTiebreak ? 'TIE-BREAK' : `Alvo: ${match.setTarget} games`}
            </div>
            {match.court && <div className="text-xs text-purple-400">Quadra {match.court}</div>}
          </div>

          {/* Pair B */}
          <div className="flex flex-col items-center gap-2 text-center flex-1">
            <div className={`text-4xl font-black ${match.winner === 'B' ? 'text-green-400' : 'text-white'}`}>
              {match.gamesB}
            </div>
            <div className="font-bold text-sm text-gray-300">{getPairName(match.pairBId, true)}</div>
            <div className="text-xs text-gray-500">{teamName(match.pairBId)}</div>
            {match.inTiebreak && (
              <div className="text-orange-400 font-bold text-lg">TB: {match.tiebreakB}</div>
            )}
            <div className="text-xs text-gray-600">Sub: {match.substitutionsB}/2</div>
          </div>
        </div>

        {match.inTiebreak && (
          <div className="text-center mt-4 bg-orange-500/10 border border-orange-500/30 rounded-xl p-3">
            <span className="text-orange-400 font-black text-sm">🔥 TIE-BREAK — Primeiro a 7 pontos (diferença mínima de 2)</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex-1 p-4 md:p-6">
        {match.status === 'scheduled' ? (
          <div className="flex justify-center py-8">
            <button
              onClick={() => startMatch(match.id)}
              className="flex items-center gap-3 px-10 py-5 bg-green-600 hover:bg-green-500 text-white font-black text-lg rounded-2xl shadow-xl shadow-green-900/40 transition-all hover:scale-105"
            >
              <Play className="w-7 h-7" /> INICIAR PARTIDA
            </button>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Game / Tiebreak scoring */}
            {!match.inTiebreak ? (
              <div>
                <h3 className="text-center text-xs text-gray-500 uppercase tracking-wide mb-4">Game para</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => addGame(match.id, 'A')}
                    className="flex flex-col items-center justify-center gap-2 p-6 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-lg transition-all active:scale-95 shadow-lg shadow-blue-900/40"
                  >
                    <span className="text-3xl">🎾</span>
                    <span>Game para A</span>
                    <span className="text-sm font-normal opacity-70">{getPairName(match.pairAId, true)}</span>
                  </button>
                  <button
                    onClick={() => addGame(match.id, 'B')}
                    className="flex flex-col items-center justify-center gap-2 p-6 bg-red-600 hover:bg-red-500 rounded-2xl font-black text-lg transition-all active:scale-95 shadow-lg shadow-red-900/40"
                  >
                    <span className="text-3xl">🎾</span>
                    <span>Game para B</span>
                    <span className="text-sm font-normal opacity-70">{getPairName(match.pairBId, true)}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-center text-xs text-orange-400 uppercase tracking-wide mb-4 font-bold">🔥 Ponto no TIE-BREAK para</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => addTiebreakPoint(match.id, 'A')}
                    className="flex flex-col items-center justify-center gap-2 p-6 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-lg transition-all active:scale-95 shadow-lg shadow-blue-900/40"
                  >
                    <span className="text-3xl font-black">{match.tiebreakA}</span>
                    <span>Ponto A</span>
                    <span className="text-sm font-normal opacity-70">{getPairName(match.pairAId, true)}</span>
                  </button>
                  <button
                    onClick={() => addTiebreakPoint(match.id, 'B')}
                    className="flex flex-col items-center justify-center gap-2 p-6 bg-red-600 hover:bg-red-500 rounded-2xl font-black text-lg transition-all active:scale-95 shadow-lg shadow-red-900/40"
                  >
                    <span className="text-3xl font-black">{match.tiebreakB}</span>
                    <span>Ponto B</span>
                    <span className="text-sm font-normal opacity-70">{getPairName(match.pairBId, true)}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Substitutions */}
            <div>
              <h3 className="text-center text-xs text-gray-500 uppercase tracking-wide mb-3">Substituições (máx. 2 por dupla)</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleSubstitution('A')}
                  disabled={match.substitutionsA >= 2 || !pairA?.reserveId}
                  className="py-3 px-4 bg-cyan-800/30 border border-cyan-700/40 text-cyan-300 rounded-xl text-sm font-bold hover:bg-cyan-700/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  🔄 Sub. Dupla A ({match.substitutionsA}/2)
                </button>
                <button
                  onClick={() => handleSubstitution('B')}
                  disabled={match.substitutionsB >= 2 || !pairB?.reserveId}
                  className="py-3 px-4 bg-cyan-800/30 border border-cyan-700/40 text-cyan-300 rounded-xl text-sm font-bold hover:bg-cyan-700/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  🔄 Sub. Dupla B ({match.substitutionsB}/2)
                </button>
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowWoModal(true)}
                className="flex-1 py-3 bg-yellow-600/20 border border-yellow-600/40 text-yellow-400 rounded-xl text-sm font-bold hover:bg-yellow-600/30"
              >
                W.O. (Walkover)
              </button>
              <button
                onClick={() => { if (confirm("Encerrar partida?")) finishMatch(match.id, user?.name); }}
                className="flex-1 py-3 bg-red-600/20 border border-red-600/40 text-red-400 rounded-xl text-sm font-bold hover:bg-red-600/30 flex items-center justify-center gap-2"
              >
                <StopCircle className="w-4 h-4" /> Encerrar
              </button>
            </div>

            {/* Timeline */}
            {match.events.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Histórico</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {[...match.events].reverse().map((ev, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-gray-400">
                      <span className="text-lg">
                        {ev.type === 'game_A' || ev.type === 'game_B' ? '🎾' :
                         ev.type.startsWith('tiebreak') ? '🔥' :
                         ev.type === 'start' ? '▶' :
                         ev.type === 'end' ? '■' :
                         ev.type === 'substitution' ? '🔄' :
                         ev.type === 'wo' ? '❌' : '•'}
                      </span>
                      <span>{ev.observation ?? (
                        ev.type === 'game_A' ? `Game Dupla A (${ev.gameNumber}°)` :
                        ev.type === 'game_B' ? `Game Dupla B (${ev.gameNumber}°)` :
                        ev.type === 'tiebreak_point_A' ? `Ponto Tie-break Dupla A` :
                        ev.type === 'tiebreak_point_B' ? `Ponto Tie-break Dupla B` :
                        ev.type === 'start' ? 'Partida iniciada' :
                        ev.type === 'end' ? 'Partida encerrada' : ev.type
                      )}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* WO Modal */}
      {showWoModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-sm p-6">
            <h3 className="text-lg font-black text-white mb-4">❌ W.O. — Qual dupla vence?</h3>
            <p className="text-gray-400 text-sm mb-6">Art. 27 §único: placar adotado de 6 a 0 para o vencedor.</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { registerWalkover(match.id, 'A'); setShowWoModal(false); }} className="p-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500">
                Dupla A<br/><span className="text-xs font-normal">{getPairName(match.pairAId, true)}</span>
              </button>
              <button onClick={() => { registerWalkover(match.id, 'B'); setShowWoModal(false); }} className="p-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-500">
                Dupla B<br/><span className="text-xs font-normal">{getPairName(match.pairBId, true)}</span>
              </button>
            </div>
            <button onClick={() => setShowWoModal(false)} className="w-full mt-3 py-2 text-gray-500 text-sm hover:text-white">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
