"use client";
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTournament } from "@/lib/context";
import { ArrowLeft, Save, Trash2, Users, Shirt, History } from "lucide-react";
import { AthleteForm } from "@/components/forms/AthleteForm";

export default function TeamDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { config, setConfig } = useTournament();
  
  const teamId = params.id as string;
  const team = config.teams.find(t => t.id === teamId);
  const athletes = config.players?.filter(p => p.teamId === teamId) || [];
  
  const [formData, setFormData] = useState({
      name: team?.name || "",
      logo: team?.logo || "",
      group: team?.group || "A"
  });
  
  const [isAthleteModalOpen, setIsAthleteModalOpen] = useState(false);

  if (!team) return <div className="p-8 text-white">Time não encontrado. <button onClick={() => router.back()} className="underline">Voltar</button></div>;

  const handleUpdate = (e: React.FormEvent) => {
      e.preventDefault();
      setConfig(prev => ({
          ...prev,
          teams: prev.teams.map(t => t.id === teamId ? { ...t, ...formData } : t)
      }));
      alert("Time atualizado!");
  };

  const handleDeleteAthlete = (athleteId: string) => {
      if (confirm("Remover este atleta do time?")) {
          setConfig(prev => ({
              ...prev,
              players: prev.players?.filter(p => p.id !== athleteId)
          }));
      }
  };

  return (
    <div className="text-white max-w-5xl mx-auto p-4">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Left Col: Team Settings */}
            <div className="space-y-6">
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Shirt className="w-5 h-5 text-purple-400" />
                        Detalhes do Time
                    </h2>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Nome</label>
                            <input 
                                type="text" 
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                className="w-full bg-gray-900 border border-gray-600 rounded p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Logo (Emoji/URL)</label>
                            <input 
                                type="text" 
                                value={formData.logo}
                                onChange={e => setFormData({...formData, logo: e.target.value})}
                                className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-center text-2xl"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Grupo</label>
                            <select 
                                value={formData.group}
                                onChange={e => setFormData({...formData, group: e.target.value})}
                                className="w-full bg-gray-900 border border-gray-600 rounded p-2"
                            >
                                {["A","B","C","D","E","F","G","H"].map(g => (
                                    <option key={g} value={g}>Grupo {g}</option>
                                ))}
                            </select>
                        </div>
                        <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded font-bold flex items-center justify-center gap-2">
                            <Save className="w-4 h-4" /> Salvar Alterações
                        </button>
                    </form>
                </div>
            </div>

            {/* Right Col: Roster */}
            <div className="md:col-span-2 space-y-6">
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Users className="w-5 h-5 text-green-400" />
                            Elenco ({athletes.length})
                        </h2>
                        <button 
                            onClick={() => setIsAthleteModalOpen(true)}
                            className="px-3 py-1 bg-green-600 text-white hover:bg-green-500 rounded text-sm font-bold"
                        >
                            + Adicionar Atleta
                        </button>
                    </div>

                    <div className="space-y-2">
                        {athletes.length === 0 && <p className="text-gray-500 text-sm">Nenhum atleta cadastrado.</p>}
                        {athletes.map(player => (
                            <div key={player.id} className="flex items-center justify-between p-3 bg-gray-900 rounded border border-gray-700">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center font-bold text-gray-400 text-sm border border-gray-600">
                                        {player.number}
                                    </div>
                                    <div>
                                        <div className="font-bold">{player.name}</div>
                                        <div className="text-xs text-gray-500">{player.position}</div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleDeleteAthlete(player.id)}
                                    className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>

        {/* Modal */}
        {isAthleteModalOpen && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl w-full max-w-md p-6 text-gray-900">
                    <h3 className="font-bold text-lg mb-4">Adicionar Atleta</h3>
                    <AthleteForm onClose={() => setIsAthleteModalOpen(false)} initialTeamId={teamId} />
                    <button onClick={() => setIsAthleteModalOpen(false)} className="mt-4 w-full py-2 bg-gray-200 hover:bg-gray-300 rounded font-bold">Cancelar</button>
                </div>
            </div>
        )}
    </div>
  );
}
