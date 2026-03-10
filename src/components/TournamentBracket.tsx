import React from 'react';
import { Match, Team } from '@/lib/types';
import { Trophy, Shield, ChevronRight } from 'lucide-react';

interface TournamentBracketProps {
    matches: Match[];
    teams: Team[];
}

export function TournamentBracket({ matches, teams }: TournamentBracketProps) {
    const knockoutMatches = matches.filter(m => m.stage === "knockout");
    if (knockoutMatches.length === 0) return (
        <div className="bg-emerald-50/50/50 p-12 rounded-2xl text-center border-2 border-dashed border-emerald-100">
            <Shield className="w-16 h-16 text-black mx-auto mb-4" />
            <h3 className="text-xl font-bold text-black mb-2">Mata-Mata não iniciado</h3>
            <p className="text-black">Aguarde o encerramento da fase de grupos.</p>
        </div>
    );

    const roundsMap: Record<string, Match[]> = {};
    const roundOrder = ["Oitavas", "Quartas", "Semi-Final", "Final"];
    
    knockoutMatches.forEach(m => {
        const r = m.round || "Mata-Mata";
        if (!roundsMap[r]) roundsMap[r] = [];
        roundsMap[r].push(m);
    });

    const presentRounds = roundOrder.filter(r => roundsMap[r] && roundsMap[r].length > 0);

    const getTeamName = (id: string) => teams.find(t => t.id === id)?.name || "A definir";
    
    const getScore = (m: Match, side: 'A' | 'B') => {
        if (m.status === 'scheduled') return '-';
        const score = side === 'A' ? m.scoreA : m.scoreB;
        const pen = side === 'A' ? m.penaltiesA : m.penaltiesB;
        if (pen !== undefined) return <span className="flex items-center gap-1">{score} <span className="text-[10px] text-orange-400">({pen})</span></span>;
        return score;
    };

    const getWinnerId = (m: Match) => {
        if (m.status !== 'finished') return null;
        if (m.scoreA > m.scoreB) return m.teamAId;
        if (m.scoreB > m.scoreA) return m.teamBId;
        if ((m.penaltiesA || 0) > (m.penaltiesB || 0)) return m.teamAId;
        return m.teamBId;
    }

    return (
        <div className="w-full overflow-x-auto pb-8 custom-scrollbar">
            <div className="flex gap-8 md:gap-16 min-w-max px-8 py-12 justify-center items-center bg-gradient-to-br from-blue-950/30 to-gray-900/30 rounded-2xl border border-emerald-100/50 relative">
                
                {presentRounds.map((roundName, colIndex) => {
                    const isFinal = roundName === "Final";
                    return (
                        <div key={roundName} className="flex flex-col justify-center gap-8 relative z-10">
                            <div className="text-center font-black text-black/50 uppercase tracking-[0.2em] text-xs absolute -top-16 w-full left-0">
                                {roundName}
                            </div>
                            
                            {roundsMap[roundName].map((match, i) => {
                                const winnerId = getWinnerId(match);
                                return (
                                    <div key={match.id} className={`
                                        w-64 bg-emerald-50/50 rounded-lg overflow-hidden border transition-all duration-300 relative group
                                        ${isFinal ? 'border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.1)] scale-110' : 'border-emerald-100 hover:border-emerald-200 shadow-lg'}
                                    `}>
                                        {/* Time A */}
                                        <div className={`flex justify-between items-center p-3 border-b border-emerald-100/50 transition-colors ${winnerId === match.teamAId ? 'bg-gradient-to-r from-green-900/20 to-transparent' : ''}`}>
                                            <div className={`font-bold text-sm truncate flex items-center gap-2 ${winnerId === match.teamAId ? 'text-emerald-700 font-black' : 'text-black font-black'}`}>
                                                {winnerId === match.teamAId && <ChevronRight className="w-3 h-3" />}
                                                {getTeamName(match.teamAId)}
                                            </div>
                                            <div className="font-mono font-bold text-black bg-emerald-50/30 px-2 py-0.5 rounded text-xs min-w-[24px] text-center">
                                                {getScore(match, 'A')}
                                            </div>
                                        </div>

                                        {/* Time B */}
                                        <div className={`flex justify-between items-center p-3 transition-colors ${winnerId === match.teamBId ? 'bg-gradient-to-r from-green-900/20 to-transparent' : ''}`}>
                                            <div className={`font-bold text-sm truncate flex items-center gap-2 ${winnerId === match.teamBId ? 'text-emerald-700 font-black' : 'text-black font-black'}`}>
                                                {winnerId === match.teamBId && <ChevronRight className="w-3 h-3" />}
                                                {getTeamName(match.teamBId)}
                                            </div>
                                            <div className="font-mono font-bold text-black bg-emerald-50/30 px-2 py-0.5 rounded text-xs min-w-[24px] text-center">
                                                {getScore(match, 'B')}
                                            </div>
                                        </div>

                                        {match.status === 'live' && (
                                            <div className="absolute top-2 right-2 flex items-center gap-1">
                                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_red]" />
                                                <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider">Ao Vivo</span>
                                            </div>
                                        )}
                                        
                                        {/* Connector Line (simplified visual) */}
                                        {colIndex < presentRounds.length - 1 && (
                                            <div className="hidden md:block absolute top-1/2 -right-8 w-8 h-[2px] bg-white shadow-premium border border-emerald-100" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}

                {/* Champion Announcement */}
                {knockoutMatches.some(m => m.round === "Final" && m.status === "finished") && (
                    <div className="flex flex-col items-center animate-in zoom-in slide-in-from-left-8 duration-700 delay-300 ml-8">
                        <div className="relative">
                            <Trophy className="w-24 h-24 text-yellow-400 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)] animate-bounce" />
                            <div className="absolute inset-0 bg-yellow-500/20 blur-3xl rounded-full" />
                        </div>
                        <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 text-center uppercase tracking-widest mt-4 drop-shadow-sm">
                            {getTeamName(getWinnerId(knockoutMatches.find(m => m.round === "Final")!) || "")}
                        </div>
                        <div className="text-xs text-yellow-600/80 font-bold mt-2 uppercase tracking-[0.3em] border-t border-yellow-600/30 pt-2 w-full text-center">
                            Grande Campeão
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
