"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useTournament } from "@/lib/context";
import { Match, Team, Venue } from "@/lib/types";
import { generateMatchReport } from "@/lib/news-engine";
import { Plus, Trash2, Trophy, X, Zap, PlayCircle, FileText, Calendar, MapPin, Clock, RefreshCw } from "lucide-react";
import { useAudit } from "@/lib/audit-context";

export default function AdminMatchesPage() {
  const { config, setConfig, setNews, generateNextStage, updateMatch } = useTournament();
  const { logAction } = useAudit();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Venue States
  const [isVenueModalOpen, setIsVenueModalOpen] = useState(false);
  const [newVenueName, setNewVenueName] = useState("");

  // Schedule States
  const [scheduleModalMatch, setScheduleModalMatch] = useState<Match | null>(null);
  const [scheduleForm, setScheduleForm] = useState({ date: "", time: "", venueId: "" });

  const [filter, setFilter] = useState<"all" | "live" | "finished" | "scheduled">("all");

  const getTeamName = (id: string) => config.teams.find(t => t.id === id)?.name || "???";
  const getVenueName = (id?: string) => config.venues?.find(v => v.id === id)?.name || "Local nÃ£o definido";

  // --- CRUD Matches ---
  const handleCreate = (e: React.FormEvent) => {
      e.preventDefault();
      setIsModalOpen(false);
  };
  
  // --- Simulation ---
  const handleSimulate = (matchId: string) => {
      const match = config.matches.find(m => m.id === matchId);
      if (!match) return;

      const scoreA = Math.floor(Math.random() * 5);
      const scoreB = Math.floor(Math.random() * 5);
      
      // Use updateMatch to trigger automatic phase progression
      updateMatch(matchId, { 
          scoreA, 
          scoreB, 
          status: "finished" as const, 
          startTime: Date.now() 
      });
      logAction("simulate_match", `Simulou a partida ${getTeamName(match.teamAId)} x ${getTeamName(match.teamBId)} (${scoreA}x${scoreB})`);
// News generation handled automatically by updateMatch context
  };

  const handleSimulateAll = () => {
      if (!confirm("Tem certeza? Isso simulará TODAS as partidas pendentes.")) return;
      config.matches.filter(m => m.status !== "finished").forEach(m => handleSimulate(m.id));
      logAction("simulate_all_matches", "Simulou todas as partidas pendentes.");
  };

  const handleDelete = (id: string) => {
      if (!confirm("Excluir partida?")) return;
      const matchToRemove = config.matches.find(m => m.id === id);
      setConfig(prev => ({ ...prev, matches: prev.matches.filter(m => m.id !== id) }));
      logAction("delete_match", `Removeu a partida de ID: ${id}`);
  };

  // --- Venues Logic ---
  const handleAddVenue = () => {
      if (!newVenueName.trim()) return;
      const newVenue: Venue = { id: crypto.randomUUID(), name: newVenueName };
      setConfig(prev => ({ ...prev, venues: [...(prev.venues || []), newVenue] }));
      logAction("create_venue", `Cadastrou o local de jogo: ${newVenueName}`);
      setNewVenueName("");
  };

  const handleDeleteVenue = (id: string) => {
     if (!confirm("Remover local?")) return;
     const venueToRemove = config.venues?.find(v => v.id === id);
     setConfig(prev => ({ ...prev, venues: (prev.venues || []).filter(v => v.id !== id) }));
     logAction("delete_venue", `Removeu local de jogo: ${venueToRemove?.name}`);
  };

  // --- Scheduling Logic ---
  const openScheduleModal = (match: Match) => {
      setScheduleModalMatch(match);
      const date = match.scheduledTime ? new Date(match.scheduledTime).toISOString().split('T')[0] : "";
      const time = match.scheduledTime ? new Date(match.scheduledTime).toTimeString().substring(0,5) : "";
      setScheduleForm({ date, time, venueId: match.venueId || "" });
  };

  const saveSchedule = () => {
      if (!scheduleModalMatch) return;
      
      let scheduledTime = undefined;
      if (scheduleForm.date) {
          const dateStr = scheduleForm.time ? `${scheduleForm.date}T${scheduleForm.time}` : `${scheduleForm.date}T12:00`;
          scheduledTime = new Date(dateStr).getTime();
      }

      setConfig(prev => ({
          ...prev,
          matches: prev.matches.map(m => m.id === scheduleModalMatch.id ? { 
              ...m, 
              venueId: scheduleForm.venueId || undefined, 
              scheduledTime 
          } : m)
      }));
      logAction("schedule_match", `Agendou a partida ${getTeamName(scheduleModalMatch.teamAId)} x ${getTeamName(scheduleModalMatch.teamBId)} para ${scheduleForm.date} às ${scheduleForm.time} no local ${getVenueName(scheduleForm.venueId)}`);
      setScheduleModalMatch(null);
  };


  const handleRemoveDuplicates = () => {
      const knockoutMatches = config.matches.filter(m => m.stage === "knockout");
      const uniqueMatches = new Map();
      const toRemove: any[] = [];
      
      knockoutMatches.forEach(m => {
          const key = `${m.round}-${m.teamAId}-${m.teamBId}`;
          if (uniqueMatches.has(key)) {
              // Keep the older one (first created), remove duplicates
              toRemove.push(m.id);
          } else {
              uniqueMatches.set(key, m);
          }
      });
      
      if (toRemove.length > 0) {
          if (confirm(`Foram encontradas ${toRemove.length} partidas duplicadas. Deseja removê-las?`)) {
              setConfig(prev => ({
                  ...prev,
                  matches: prev.matches.filter(m => !toRemove.includes(m.id))
              }));
              logAction("remove_duplicates", `Removeu ${toRemove.length} partidas duplicadas do sistema.`);
              alert(`${toRemove.length} partidas duplicadas removidas com sucesso!`);
          }
      } else {
          alert("Nenhuma partida duplicada encontrada!");
      }
  };

  const filteredMatches = config.matches.filter(m => {
      if (filter === "all") return true;
      if (filter === "live") return m.status === "live";
      if (filter === "finished") return m.status === "finished";
      if (filter === "scheduled") return m.status === "scheduled";
      return true;
  });

  
      return (
    <div className="p-4 md:p-8 text-black min-h-screen pb-24">
        <header className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                    <Trophy className="text-yellow-500" />
                    Gerenciar Partidas
                </h1>
                <p className="text-black">Agende, simule e controle os jogos do torneio</p>
            </div>
            <div className="flex flex-wrap gap-2">
                <button 
                    onClick={() => setIsVenueModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#059669] hover:bg-[#059669] rounded-lg text-white font-bold transition-all"
                    title="Cadastrar locais de jogo"
                >
                    <MapPin className="w-4 h-4" /> Locais de Jogo
                </button>
                
                <button 
                    onClick={handleRemoveDuplicates}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg text-white font-bold transition-all"
                    title="Remover partidas duplicadas"
                >
                    <RefreshCw className="w-4 h-4" /> Limpar Duplicadas
                </button>
                
                <button 
                    onClick={handleSimulateAll}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-800 rounded-lg text-white font-bold transition-all"
                    title="Simular TODAS as partidas pendentes"
                >
                    <Zap className="w-4 h-4" /> Simular Todas
                </button>
                
                <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-green-500 rounded-lg text-white font-bold transition-all">
                    <Plus className="w-4 h-4" /> Nova Partida
                </button>
            </div>
        </header>

        <div className="space-y-4">
            {filteredMatches.length === 0 && (
                <div className="text-center py-12 bg-emerald-50/60 shadow-premium border border-emerald-200/60/50 rounded-xl border border-emerald-200/60/50 border-dashed">
                    <Trophy className="w-12 h-12 text-black mx-auto mb-3" />
                    <p className="text-black">Nenhuma partida encontrada</p>
                </div>
            )}

            {filteredMatches.map(match => (
                <div key={match.id} className="bg-white rounded-xl p-6 flex flex-col md:flex-row items-center justify-between border border-emerald-200/60 shadow-premium hover:border-gray-500 transition-all group">
                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 flex-1">
                        <div className="w-full md:w-64 flex flex-col items-center justify-center gap-2 mb-3 md:mb-0">
                            <div className="flex flex-wrap items-center justify-center gap-2">
                                <span className={`text-xs font-bold uppercase px-2 py-1 rounded border ${match.status === 'live' ? 'bg-red-900/30 text-red-400 border-red-800 animate-pulse' : match.status === 'finished' ? 'bg-emerald-100 text-black border-emerald-200' : 'bg-emerald-500 text-black border-emerald-600'}`}>
                                    {match.status === 'live' ? 'AO VIVO' : match.status === 'finished' ? 'ENCERRADA' : 'AGENDADA'}
                                </span>
                                
                                <span className="text-xs font-bold text-white bg-[#059669] text-white/20 px-2 py-1 rounded border border-emerald-300/50 whitespace-nowrap">
                                    {match.stage === "group" ? `Grupo ${match.group}` : match.round}
                                </span>

                                <span className="text-[10px] font-mono text-black bg-emerald-50/50 px-1.5 py-1 rounded border border-emerald-200/60">
                                    #{config.matches.findIndex(m => m.id === match.id) + 1}
                                </span>
                            </div>
                            {(match.scheduledTime || match.venueId) && (
                                <div className="flex flex-col items-center mt-2 text-xs text-black">
                                    {match.scheduledTime && (
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(match.scheduledTime).toLocaleDateString()} {new Date(match.scheduledTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    )}
                                    {match.venueId && (
                                        <span className="flex items-center gap-1 text-emerald-700">
                                            <MapPin className="w-3 h-3" />
                                            {getVenueName(match.venueId)}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2 md:gap-4 flex-1 justify-center w-full">
                            <span className="font-bold text-lg text-black text-right w-1/3 truncate">{getTeamName(match.teamAId)}</span>
                            <div className="bg-emerald-900 shadow-md px-6 py-2 rounded-lg font-mono font-bold text-2xl min-w-[100px] text-center text-white shadow-lg">
                                {match.scoreA} x {match.scoreB}
                            </div>
                            <span className="font-bold text-lg text-black text-left w-1/3 truncate">{getTeamName(match.teamBId)}</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openScheduleModal(match)} className="p-2 text-black hover:text-yellow-400 transition-colors bg-emerald-200/40/50 rounded hover:bg-emerald-200/40" title="Agendar / Local">
                            <Calendar className="w-5 h-5" />
                        </button>
                        <Link href={`/referee/${match.id}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-green-500 text-white rounded-lg text-xs font-bold uppercase transition-all shadow-lg hover:shadow-green-500/20 tracking-wider order-first" title="Jogar / Arbitrar">
                            <PlayCircle className="w-4 h-4 fill-white/20" /> PLAY
                        </Link>
                        <button onClick={() => alert("Súmula PDF em breve!")} className="p-2 text-black hover:text-black transition-colors" title="Baixar Súmula PDF">
                            <FileText className="w-5 h-5" />
                        </button>
                        {match.status !== "finished" && (
                            <button onClick={() => handleSimulate(match.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase transition-all shadow-md" title="Simular Resultado">
                                <Zap className="w-3 h-3" /> Simular
                            </button>
                        )}
                        <button onClick={() => handleDelete(match.id)} className="p-2 text-black hover:text-red-400 transition-colors" title="Excluir Partida">
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            ))}
        </div>

        {isVenueModalOpen && (
            <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-md p-8 border border-emerald-200/60 shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-xl flex items-center gap-2"><MapPin className="text-emerald-700" /> Locais de Jogo</h3>
                        <button onClick={() => setIsVenueModalOpen(false)}><X className="text-black hover:text-black" /></button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-6">
                        <input 
                            className="flex-1 bg-emerald-50/50 border border-emerald-200 rounded-lg p-3 text-black focus:border-emerald-500 outline-none"
                            placeholder="Nome do Local (ex: Campo 1)"
                            value={newVenueName}
                            onChange={e => setNewVenueName(e.target.value)}
                        />
                        <button onClick={handleAddVenue} className="px-4 py-2 bg-[#059669] hover:bg-[#059669] rounded font-bold text-white">+</button>
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {(config.venues || []).length === 0 && <p className="text-black text-center">Nenhum local cadastrado.</p>}
                        {(config.venues || []).map(Venue => (
                            <div key={Venue.id} className="flex justify-between items-center bg-emerald-50/50 p-3 rounded">
                                <span>{Venue.name}</span>
                                <button onClick={() => handleDeleteVenue(Venue.id)} className="text-red-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        ))}
                </div>
            </div>
          </div>
        )}

        {scheduleModalMatch && (
            <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-md p-8 border border-emerald-200/60 shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-xl flex items-center gap-2"><Calendar className="text-yellow-500" /> Agendar Partida</h3>
                        <button onClick={() => setScheduleModalMatch(null)}><X className="text-black hover:text-black" /></button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-black mb-1">Data</label>
                            <input 
                                type="date" 
                                className="w-full bg-emerald-50/50 border border-emerald-200/60/50 rounded p-2"
                                value={scheduleForm.date}
                                onChange={e => setScheduleForm({...scheduleForm, date: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-black mb-1">Horario</label>
                            <input 
                                type="time" 
                                className="w-full bg-emerald-50/50 border border-emerald-200/60/50 rounded p-2"
                                value={scheduleForm.time}
                                onChange={e => setScheduleForm({...scheduleForm, time: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-black mb-1">Local</label>
                            <select 
                                className="w-full bg-emerald-50/50 border border-emerald-200/60/50 rounded p-2"
                                value={scheduleForm.venueId}
                                onChange={e => setScheduleForm({...scheduleForm, venueId: e.target.value})}
                            >
                                <option value="">Selecione um local...</option>
                                {(config.venues || []).map(v => (
                                    <option key={v.id} value={v.id}>{v.name}</option>
                                ))}
                            </select>
                            
                            <div className="mt-3 pt-3 border-t border-emerald-200/60/50">
                                <label className="block text-sm text-black mb-2">Ou cadastre um novo local:</label>
                                <div className="flex flex-wrap gap-2">
                                    <input 
                                        className="flex-1 bg-emerald-50/50 border border-emerald-200 rounded-lg p-3 text-black focus:border-emerald-500 outline-none text-sm"
                                        placeholder="Nome do novo local"
                                        value={newVenueName}
                                        onChange={e => setNewVenueName(e.target.value)}
                                        onKeyPress={e => e.key === "Enter" && handleAddVenue()}
                                    />
                                    <button 
                                        onClick={handleAddVenue} 
                                        className="px-4 py-2 bg-[#059669] hover:bg-[#059669] rounded font-bold text-white text-sm flex items-center gap-1"
                                        title="Adicionar local"
                                    >
                                        <Plus className="w-4 h-4" /> Adicionar
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <button onClick={saveSchedule} className="w-full py-3 bg-emerald-600 hover:bg-green-500 rounded font-bold text-white mt-4">
                            Salvar Agendamento
                        </button>
                </div>
            </div>
          </div>
        )}
    </div>
  );
}











