"use client";
import React from "react";
import Link from "next/link";
import { useTournament } from "@/lib/context";
import { useAudit } from "@/lib/audit-context";
import { useAuth } from "@/lib/auth-context";
import { TournamentEngine } from "@/lib/tournament-engine";
import { MOCK_TEAMS, MOCK_PLAYERS } from "@/lib/mock-data";
import { Users, Trophy, Newspaper, RefreshCw, Trash2, Database, Clock, FileText, ArrowRight } from "lucide-react";

export default function AdminDashboard() {
  const { config, setConfig, news, generateNextStage } = useTournament();
  const { logAction } = useAudit();
  const { user, logout } = useAuth();
  
  const stats = [
    { label: "Esportes Ativos", value: config.sports.length, icon: Trophy, color: "text-amber-600" },
    { label: "Equipes", value: config.teams.length, icon: Users, color: "text-black" },
    { label: "Atletas", value: config.players?.length || 0, icon: Users, color: "text-green-400" },
    { label: "Noticias Geradas", value: news.length, icon: Newspaper, color: "text-emerald-700" },
  ];

  const standings = TournamentEngine.calculateStandings(config.teams, config.matches, config.tieBreakers);
  const upcomingMatches = config.matches.filter(m => m.status !== "finished").sort((a,b) => (a.startTime || 0) - (b.startTime || 0));

  const handleSeed = () => {
    if (!confirm("Isso apagara todos os dados atuais e inserira dados de teste. Continuar?")) return;
    
    setConfig(prev => ({
        ...prev,
        teams: MOCK_TEAMS,
        players: MOCK_PLAYERS,
        matches: []
    }));
    logAction("seed_data", "Dados de teste (Mock) inseridos no sistema.");
    alert("Dados de teste carregados com sucesso!");
  };

  const getTeamName = (id: string) => config.teams.find(t => t.id === id)?.name || "???";

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 text-black">
      <header className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-700 to-teal-500">
                {config.name || "Painel Administrativo"}
            </h1>
            <p className="text-black">Visao geral do torneio e atalhos rapidos</p>
        </div>
        <div className="flex gap-2">
            <Link href="/admin/sync" className="flex items-center gap-2 px-4 py-2 bg-yellow-600/10 border border-yellow-600/30 text-yellow-600 hover:bg-yellow-600 hover:text-white rounded-lg text-sm font-bold transition-all shadow-sm">
                <Database className="w-4 h-4" />
                Sincronizar Offline
            </Link>
            <Link href="/" target="_blank" className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-500 rounded-lg text-sm font-bold transition-colors shadow-lg">
                <Newspaper className="w-4 h-4" />
                Ver Site Público
            </Link>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
            <div key={i} className="bg-emerald-50/60 shadow-premium border border-emerald-200/60 p-6 rounded-xl border border-emerald-200/60 hover:border-emerald-200 transition-all">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-lg bg-emerald-50/50 ${stat.color}`}>
                        <stat.icon className="w-6 h-6" />
                    </div>
                </div>
                <div className="text-2xl md:text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-black">{stat.label}</div>
            </div>
        ))}
      </div>

      {/* EMERGENCY KNOCKOUT GENERATOR */}
      {(user?.role === "admin" || user?.role === "organization_member") && config.status === "active" && config.matches.filter(m => m.stage === "knockout").length === 0 && config.matches.filter(m => m.stage === "group" && m.status === "finished").length === config.matches.filter(m => m.stage === "group").length && config.matches.filter(m => m.stage === "group").length > 0 && (
          <button 
              onClick={generateNextStage}
              className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-xl shadow-green-900/30 animate-pulse"
          >
              <Trophy className="w-6 h-6" /> GERAR MATA-MATA AGORA
          </button>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Standings */}
          <div className="bg-emerald-50/60 shadow-premium border border-emerald-200/60 rounded-xl border border-emerald-200/60 p-6 flex flex-col">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Trophy className="text-yellow-500" /> Classificacao
            </h2>
            <div className="flex-1 overflow-y-auto max-h-[400px] space-y-6 custom-scrollbar pr-2">
                {Object.keys(standings).length === 0 && <p className="text-black text-center py-8">Nenhum grupo formado ainda.</p>}
                
                {Object.entries(standings).map(([group, teams]) => (
                    <div key={group} className="bg-white shadow-sm border border-emerald-50 rounded-lg overflow-hidden border border-emerald-200/60">
                        <div className="bg-emerald-200/40 px-4 py-2 text-xs font-bold text-black uppercase font-black flex justify-between">
                            <span>Grupo {group}</span>
                            <span className="tracking-widest">P  J  V  SG</span>
                        </div>
                        <div className="divide-y divide-emerald-100">
                            {teams.map((stats, idx) => {
                                const team = config.teams.find(t => t.id === stats.teamId);
                                return (
                                    <div key={stats.teamId} className="px-4 py-2 flex items-center justify-between hover:bg-emerald-100/30 transition-colors text-sm">
                                        <div className="flex items-center gap-3">
                                            <span className={`font-mono font-bold w-4 ${idx < (config.structure?.qualifiersPerGroup || 2) ? 'text-green-400' : 'text-black'}`}>{idx + 1}</span>
                                            <span className="font-medium truncate max-w-[120px]">{team?.name}</span>
                                        </div>
                                        <div className="flex gap-3 font-mono text-black">
                                            <span className="text-black font-bold w-4 text-center">{stats.points}</span>
                                            <span className="w-4 text-center">{stats.played}</span>
                                            <span className="w-4 text-center">{stats.won}</span>
                                            <span className="w-6 text-center">{stats.goalDifference}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
          </div>

          {/* Upcoming Matches */}
          <div className="bg-emerald-50/60 shadow-premium border border-emerald-200/60 rounded-xl border border-emerald-200/60 p-6 flex flex-col">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Clock className="text-black" /> Proximos Jogos / Sumulas
            </h2>
            <div className="flex-1 overflow-y-auto max-h-[400px] space-y-3 custom-scrollbar pr-2">
                {upcomingMatches.length === 0 && <p className="text-black text-center py-8">Nenhum jogo agendado.</p>}
                
                {upcomingMatches.map(match => (
                    <div key={match.id} className="bg-emerald-50/50 rounded-lg p-3 border border-emerald-200/60 hover:border-emerald-300/50 transition-colors group">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-mono text-black uppercase bg-emerald-50/60 shadow-premium border border-emerald-200/60 px-2 py-0.5 rounded">Grupo {match.group || match.round}</span>
                            <div className={`w-2 h-2 rounded-full ${match.status === 'live' ? 'bg-red-500 animate-pulse' : 'bg-gray-600'}`} />
                        </div>
                        
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-right w-1/3 font-bold truncate">{getTeamName(match.teamAId)}</span>
                            <div className="px-3 py-1 bg-emerald-900 shadow-md rounded font-mono font-bold text-white">
                                {match.scoreA} x {match.scoreB}
                            </div>
                            <span className="text-left w-1/3 font-bold truncate">{getTeamName(match.teamBId)}</span>
                        </div>

                        <Link 
                            href={`/referee/${match.id}`}
                            className="flex items-center justify-center gap-2 w-full py-2 bg-[#059669] hover:bg-[#047857] rounded text-sm font-bold text-white transition-colors group-hover:shadow-lg shadow-emerald-900/10"
                        >
                            <FileText className="w-4 h-4" /> Abrir Sumula
                        </Link>
                    </div>
                ))}
            </div>
             <div className="mt-4 pt-4 border-t border-emerald-200/60 text-center">
                <Link href="/admin/matches" className="text-sm text-black hover:text-black flex items-center justify-center gap-1">
                    Ver todas as partidas <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
          </div>
      </div>
    </div>
  );
}