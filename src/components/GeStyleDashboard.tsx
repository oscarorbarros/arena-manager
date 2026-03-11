import React, { useState } from 'react';
import { Match, Team, TournamentConfig } from '@/lib/types';
import { TournamentBracket } from './TournamentBracket';
import { ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GeStyleDashboardProps {
    config: TournamentConfig;
}

export function GeStyleDashboard({ config }: GeStyleDashboardProps) {
    const [activeTab, setActiveTab] = useState<'group' | 'knockout'>('group');

    const getGroupStandings = (groupIndex: number) => {
        const groupLetter = String.fromCharCode(65 + groupIndex);
        const groupTeams = config.teams.filter(t => t.group === groupLetter);
        
        const standings = groupTeams.map(team => {
            const matches = config.matches.filter(m => 
                m.stage === 'group' && (m.teamAId === team.id || m.teamBId === team.id) && m.status === 'finished'
            );
            
            let points = 0, wins = 0, draws = 0, losses = 0, gp = 0, gc = 0;
            
            matches.forEach(m => {
                const isA = m.teamAId === team.id;
                const scoreFor = isA ? m.scoreA : m.scoreB;
                const scoreAgainst = isA ? m.scoreB : m.scoreA;
                
                gp += scoreFor;
                gc += scoreAgainst;
                
                if (scoreFor > scoreAgainst) { wins++; points += 3; }
                else if (scoreFor === scoreAgainst) { draws++; points += 1; }
                else losses++;
            });
            
            return { ...team, points, wins, draws, losses, gp, gc, sg: gp - gc, matches: matches.length };
        });
        
        return standings.sort((a, b) => 
            b.points - a.points || b.wins - a.wins || b.sg - a.sg || b.gp - a.gp
        );
    };

    const getRecentMatches = () => {
        const finished = config.matches.filter(m => m.stage === 'group' && m.status === 'finished').sort((a, b) => (b.scheduledTime || 0) - (a.scheduledTime || 0));
        const scheduled = config.matches.filter(m => m.stage === 'group' && (m.status === 'scheduled' || m.status === 'live')).sort((a, b) => (a.scheduledTime || 0) - (b.scheduledTime || 0));
        return [...scheduled, ...finished].slice(0, 10);
    };

    const getTeam = (id: string) => config.teams.find(t => t.id === id);

    return (
        <div className="bg-white min-h-screen text-black font-sans">
            <div className="bg-white border-b border-emerald-200/60 py-4 mb-8 sticky top-0 z-30 shadow-sm">
                <div className="container mx-auto px-4 flex justify-between items-center">
                    <button 
                        onClick={() => setActiveTab('group')}
                        className={`text-sm font-bold uppercase tracking-widest px-4 py-2 rounded transition-colors flex items-center gap-2 ${ activeTab === 'group' ? 'text-green-600 bg-emerald-50/60 border border-green-200' : 'text-black hover:text-[#059669]' }`}
                    >
                        <ChevronLeft className="w-4 h-4" /> Primeira Fase
                    </button>
                    
                    <h1 className="text-xl font-black uppercase tracking-tighter text-center flex-1 text-black">
                        {activeTab === 'group' ? 'CLASSIFICACAO & JOGOS' : 'FASE FINAL (MATA-MATA)'}
                    </h1>

                    <button 
                        onClick={() => setActiveTab('knockout')}
                        className={`text-sm font-bold uppercase tracking-widest px-4 py-2 rounded transition-colors flex items-center gap-2 ${ activeTab === 'knockout' ? 'text-green-600 bg-emerald-50/60 border border-green-200' : 'text-black hover:text-[#059669]' }`}
                    >
                        Mata-Mata <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="container mx-auto px-4 pb-12">
                {activeTab === 'group' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-left-4 duration-500">
                        <div className="lg:col-span-2 space-y-8">
                            <h2 className="text-2xl font-bold border-l-4 border-green-500 pl-4 mb-6 text-black uppercase font-black tracking-tight">Tabela de Classificacao</h2>
                            
                            {Array.from({ length: config.structure?.groupsCount || 0 }).map((_, i) => (
                                <div key={i} className="bg-white rounded-lg shadow-sm border border-emerald-200/60 overflow-hidden mb-8">
                                    <div className="bg-emerald-50/60 px-6 py-3 border-b border-emerald-200/60 text-xs font-bold text-black uppercase flex justify-between tracking-wider">
                                        <span>GRUPO {String.fromCharCode(65+i)}</span>
                                        <span>PONTOS CORRIDOS</span>
                                    </div>
                                    <table className="w-full text-sm">
                                        <thead className="bg-white text-black text-[10px] uppercase font-bold border-b border-emerald-50">
                                            <tr>
                                                <th className="pl-6 py-4 text-left w-12">POS</th>
                                                <th className="text-left py-4">Equipe</th>
                                                <th className="w-10 text-center py-4 text-black" title="Pontos">P</th>
                                                <th className="w-10 text-center py-4" title="Jogos">J</th>
                                                <th className="w-10 text-center py-4" title="Vitorias">V</th>
                                                <th className="w-10 text-center py-4" title="Empates">E</th>
                                                <th className="w-10 text-center py-4" title="Derrotas">D</th>
                                                <th className="w-10 text-center py-4" title="Gols Pro">GP</th>
                                                <th className="w-10 text-center py-4" title="Gols Contra">GC</th>
                                                <th className="w-10 text-center py-4" title="Saldo de Gols">SG</th>
                                                <th className="w-12 text-center py-4 pr-4" title="Aproveitamento">%</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {getGroupStandings(i).map((team, idx) => (
                                                <tr key={team.id} className={`border-b border-emerald-50 hover:bg-emerald-100/30/40 transition-colors ${ idx < (config.structure?.qualifiersPerGroup || 2 || 2) ? 'bg-green-50/30' : '' }`}>
                                                    <td className={`pl-6 py-4 font-bold text-xs ${ idx < (config.structure?.qualifiersPerGroup || 2 || 2) ? 'text-emerald-700' : 'text-black' }`}>{idx + 1}</td>
                                                    <td className="font-bold text-black py-4">{team.name}</td>
                                                    <td className="text-center font-black bg-white text-black py-4">{team.points}</td>
                                                    <td className="text-center text-black py-4">{team.matches}</td>
                                                    <td className="text-center text-black py-4">{team.wins}</td>
                                                    <td className="text-center text-black py-4">{team.draws}</td>
                                                    <td className="text-center text-black py-4">{team.losses}</td>
                                                    <td className="text-center text-black py-4">{team.gp}</td>
                                                    <td className="text-center text-black py-4">{team.gc}</td>
                                                    <td className="text-center text-black font-bold py-4">{team.sg}</td>
                                                    <td className="text-center text-xs text-black py-4 pr-4">{Math.round((team.points / (team.matches * 3 || 1)) * 100)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ))}
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-emerald-200/60 h-fit sticky top-24">
                            <div className="p-6 border-b border-emerald-200/60 flex justify-between items-center bg-emerald-50/60">
                                <h2 className="text-lg font-bold text-black uppercase font-black tracking-tight">Ultimos Jogos</h2>
                                <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-1 rounded border border-green-200 uppercase tracking-wider">Resultados</span>
                            </div>
                            <div className="divide-y divide-gray-100 max-h-[800px] overflow-y-auto custom-scrollbar">
                                {getRecentMatches().map(match => (
                                    <div key={match.id} className="p-6 hover:bg-emerald-100/30/40 transition-colors group">
                                        <div className="text-[10px] uppercase font-bold text-black mb-3 flex justify-between tracking-wide">
                                            <span className="truncate max-w-[150px]">{match.venueId || "Local a definir"}</span>
                                            <span>{match.scheduledTime ? format(match.scheduledTime, "dd/MM - HH:mm", { locale: ptBR }) : "A definir"}</span>
                                        </div>
                                        
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex-1 flex items-center justify-end gap-3 text-right">
                                                <span className="font-bold text-black text-sm md:text-base leading-tight uppercase tracking-tight">{getTeam(match.teamAId)?.name}</span>
                                                <div className="w-8 h-8 bg-emerald-100/30 rounded-full flex-shrink-0 border-2 border-white shadow-sm flex items-center justify-center text-[8px] font-black text-black overflow-hidden">
                                                    {getTeam(match.teamAId)?.name.substring(0,2)}
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-center min-w-[60px]">
                                                {match.status === 'scheduled' ? (
                                                     <span className="text-xs font-bold text-black bg-white px-3 py-1 rounded-full border border-emerald-200/60">VS</span>
                                                ) : (
                                                    <div className="text-xl font-black text-black tracking-tighter bg-emerald-50/60 px-4 py-1 rounded-lg border border-emerald-50 shadow-inner">
                                                        {match.scoreA} <span className="text-black mx-1 font-light">x</span> {match.scoreB}
                                                    </div>
                                                )}
                                                {match.status === 'live' && <span className="text-[9px] text-red-500 font-bold uppercase mt-1 animate-pulse tracking-widest">• Ao Vivo</span>}
                                                {match.status === 'finished' && <span className="text-[9px] text-green-600 font-bold uppercase mt-2 tracking-widest border-t border-emerald-50 pt-1 w-full text-center">Encerrado</span>}
                                            </div>

                                            <div className="flex-1 flex items-center justify-start gap-3 text-left">
                                                <div className="w-8 h-8 bg-emerald-100/30 rounded-full flex-shrink-0 border-2 border-white shadow-sm flex items-center justify-center text-[8px] font-black text-black overflow-hidden">
                                                    {getTeam(match.teamBId)?.name.substring(0,2)}
                                                </div>
                                                <span className="font-bold text-black text-sm md:text-base leading-tight uppercase tracking-tight">{getTeam(match.teamBId)?.name}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-4 text-center opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                                            <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest cursor-pointer hover:underline flex items-center justify-center gap-1">
                                                {match.status === 'finished' ? "Ver Detalhes da Partida" : "Acompanhar em Tempo Real"} <ChevronRight className="w-3 h-3" />
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {getRecentMatches().length === 0 && (
                                    <div className="p-12 text-center text-black text-sm bg-emerald-50/60/50">Nenhum jogo recente ou agendado.</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'knockout' && (
                    <div className="animate-in slide-in-from-right-4 duration-500 min-h-screen">
                         <h2 className="text-2xl font-bold border-l-4 border-yellow-500 pl-4 mb-8 text-black uppercase font-black tracking-tight">Chaveamento Final</h2>
                         
                         <div className="bg-emerald-50/50 rounded-xl p-4 shadow-2xl mb-12 border border-emerald-200/60">
                             <TournamentBracket matches={config.matches} teams={config.teams} />
                         </div>

                         <div className="space-y-8 max-w-5xl mx-auto">
                            {["Oitavas", "Quartas", "Semi-Final", "Final"].reverse().map(round => {
                                const matches = config.matches.filter(m => m.stage === 'knockout' && m.round === round);
                                if (matches.length === 0) return null;

                                return (
                                    <div key={round} className="bg-white rounded-lg shadow-sm border border-emerald-200/60 overflow-hidden">
                                        <div className="bg-emerald-50/60 text-black px-6 py-4 font-black uppercase flex items-center gap-2 tracking-widest text-sm border-b border-emerald-200/60">
                                            <Trophy className="w-4 h-4 text-yellow-500" />
                                            {round}
                                        </div>
                                        <div className="divide-y divide-gray-100">
                                            {matches.map(m => (
                                                <div key={m.id} className="p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-emerald-100/30/40 transition-colors group">
                                                    <div className="text-[10px] text-black font-bold uppercase w-full md:w-32 text-center md:text-left leading-relaxed">
                                                        <span className="text-black block mb-1">{m.venueId || "Estadio"}</span>
                                                        {m.scheduledTime ? format(m.scheduledTime, "dd/MM - HH:mm", { locale: ptBR }) : "A definir"}
                                                    </div>
                                                    
                                                    <div className="flex-1 flex items-center justify-center gap-4 md:gap-12 w-full">
                                                        <div className="flex items-center gap-4 flex-1 justify-end">
                                                            <span className="font-black text-black text-right uppercase tracking-tight text-lg">{getTeam(m.teamAId)?.name}</span>
                                                            <div className="w-10 h-10 bg-white rounded-full border-2 border-white shadow-sm flex items-center justify-center font-black text-black">
                                                                {getTeam(m.teamAId)?.name.substring(0,2)}
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="relative group-hover:scale-110 transition-transform duration-300">
                                                            <div className="bg-white px-6 py-2 rounded-lg text-2xl font-black text-black min-w-[120px] text-center shadow-inner border border-emerald-200/60 tracking-tighter">
                                                                {m.status === 'scheduled' ? <span className="text-black text-base">VS</span> : (
                                                                    <>
                                                                        {m.scoreA} <span className="text-black mx-1 font-light text-base">x</span> {m.scoreB}
                                                                    </>
                                                                )}
                                                            </div>
                                                            {(m.penaltiesA !== undefined) && (
                                                                <div className="absolute -bottom-6 w-full text-center text-[10px] text-orange-600 font-mono font-bold bg-orange-50 px-1 rounded border border-orange-100">
                                                                    PENALTIS: {m.penaltiesA} - {m.penaltiesB}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-4 flex-1 justify-start">
                                                            <div className="w-10 h-10 bg-white rounded-full border-2 border-white shadow-sm flex items-center justify-center font-black text-black">
                                                                {getTeam(m.teamBId)?.name.substring(0,2)}
                                                            </div>
                                                            <span className="font-black text-black text-left uppercase tracking-tight text-lg">{getTeam(m.teamBId)?.name}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="w-full md:w-32 text-center md:text-right">
                                                         {m.venueId && <div className="md:hidden text-xs text-center text-black mb-2">{m.venueId}</div>}
                                                         
                                                         {m.status === 'finished' && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-3 py-1 font-bold rounded-full border border-green-100 uppercase tracking-widest inline-block">Encerrado</span>}
                                                         {m.status === 'live' && <span className="text-[10px] font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100 uppercase animate-pulse tracking-widest inline-block">Em Andamento</span>}
                                                         {m.status === 'scheduled' && <span className="text-[10px] font-bold text-black bg-emerald-50/60 px-3 py-1 rounded-full border border-emerald-50 uppercase tracking-widest inline-block">Agendado</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                         </div>
                    </div>
                )}
            </div>
        </div>
    );
}