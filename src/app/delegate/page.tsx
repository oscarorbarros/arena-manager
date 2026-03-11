"use client";
import React, { useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTournament } from "@/lib/context";
import { useRouter } from "next/navigation";
import { Users, Shirt, AlertCircle, X, Plus, Upload, KeyRound } from "lucide-react";
import { TeamForm } from "@/components/forms/TeamForm";
import { AthleteForm } from "@/components/forms/AthleteForm";
import { Player } from "@/lib/types";

export default function DelegateDashboard() {
  const { user, logout } = useAuth();
  const { config, setConfig } = useTournament();
  const router = useRouter();
  
  const [activeModal, setActiveModal] = useState<"team" | "athlete" | "password" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newPassword, setNewPassword] = useState("");

  if (!user || user.role !== "delegate") {
      // router.push("/login"); 
  }
  
  // Find my team — multiple strategies to handle ID mismatches
  // 1. Exact match by delegationChiefId === user.id
  // 2. Find user in config.users by email, then match by that user's id
  // 3. Match by name (last resort)
  const configUser = config.users?.find(u => u.email === user?.email);
  const effectiveUserId = configUser?.id || user?.id;
  
  const myTeam = 
    config.teams.find(t => t.delegationChiefId === user?.id) ||
    config.teams.find(t => t.delegationChiefId === effectiveUserId) ||
    config.teams.find(t => {
      const chief = config.users?.find(u => u.id === t.delegationChiefId);
      return chief?.name === user?.name || chief?.email === user?.email;
    });

  const myPlayers = config.players?.filter(p => p.teamId === myTeam?.id) || [];


  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !myTeam) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          const text = event.target?.result as string;
          if (!text) return;

          // Simple CSV Parser: Name,Number,Position
          const lines = text.split("\n");
          const newPlayers: Player[] = [];
          
          lines.forEach((line, index) => {
              if (index === 0 && line.toLowerCase().includes("nome")) return; // Skip header
              const [name, number, position] = line.split(",").map(s => s.trim());
              
              if (name && number) {
                  newPlayers.push({
                      id: crypto.randomUUID(),
                      teamId: myTeam.id,
                      name,
                      number: parseInt(number) || 0,
                      position: position as any || "Meio-Campo",
                      stats: { goals: 0, yellowCards: 0, redCards: 0, matchesPlayed: 0 }
                  });
              }
          });

          if (newPlayers.length > 0) {
              if (confirm(`Encontrados ${newPlayers.length} atletas. Deseja importar?`)) {
                  setConfig(prev => ({
                      ...prev,
                      players: [...(prev.players || []), ...newPlayers]
                  }));
                  alert("Importação concluída com sucesso!");
              }
          } else {
              alert("Nenhum atleta encontrado ou formato inválido (Nome,Número,Posição).");
          }
      };
      reader.readAsText(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleChangePassword = (e: React.FormEvent) => {
      e.preventDefault();
      if (newPassword.length < 4) return alert("Senha muito curta!");
      
      setConfig(prev => ({
          ...prev,
          users: prev.users?.map(u => u.id === user?.id ? { ...u, password: newPassword } : u) || []
      }));
      
      alert("Senha alterada com sucesso!");
      setActiveModal(null);
      setNewPassword("");
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white">
                    <Users className="w-5 h-5" />
                </div>
                Painel da Delegação
            </h1>
            <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-600">Olá, {user?.name}</span>
                <button onClick={() => setActiveModal("password")} className="text-gray-500 hover:text-blue-600" title="Alterar Senha">
                    <KeyRound className="w-4 h-4" />
                </button>
                <button onClick={logout} className="text-red-500 text-sm hover:underline">Sair</button>
            </div>
        </div>
      </header>
      
      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-4 h-fit">
            <h2 className="font-semibold text-gray-700">Ações Rápidas</h2>
            
            {!myTeam ? (
                <button 
                    onClick={() => setActiveModal("team")}
                    className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-700 transition-colors text-left"
                >
                    <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
                        <Plus className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-bold text-sm">Criar Minha Equipe</div>
                        <div className="text-xs opacity-75">Registre seu time no torneio</div>
                    </div>
                </button>
            ) : (
                <>
                    <button 
                        onClick={() => setActiveModal("athlete")}
                        className="flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg text-green-700 transition-colors text-left"
                    >
                        <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="font-bold text-sm">Cadastrar Atletas</div>
                            <div className="text-xs opacity-75">Adicionar jogadores ao elenco</div>
                        </div>
                    </button>

                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-3 p-3 bg-cyan-50 hover:bg-cyan-100 rounded-lg text-cyan-700 transition-colors text-left"
                    >
                        <div className="w-10 h-10 bg-cyan-200 rounded-full flex items-center justify-center">
                            <Upload className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="font-bold text-sm">Importar CSV</div>
                            <div className="text-xs opacity-75">Nome, Numero, Posicao</div>
                        </div>
                    </button>
                    <input 
                        type="file" 
                        accept=".csv" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileUpload}
                    />
                </>
            )}
            
            {/* Other buttons placeholder... */}
        </div>

        {/* Team Status */}
        <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h2 className="font-semibold text-gray-700 mb-4">Minha Equipe</h2>
                
                {!myTeam ? (
                    <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                        <p className="text-gray-500">Nenhuma equipe vinculada ainda.</p>
                        <p className="text-sm text-gray-400 mt-2">Clique em "Criar Minha Equipe" para começar.</p>
                    </div>
                ) : (
                    <div>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-3xl shadow-inner">
                                {myTeam.logo}
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold">{myTeam.name}</h3>
                                <p className="text-sm text-gray-500">Grupo {myTeam.group} • {myPlayers.length} Atletas</p>
                            </div>
                        </div>
                        
                        {/* Captain Selection */}
                        {myPlayers.length > 0 && (
                            <div className="mb-5 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-xl">🏅</span>
                                    <h4 className="font-bold text-sm text-yellow-800 uppercase tracking-wide">Capitão do Time</h4>
                                </div>
                                {myTeam.captainId ? (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-yellow-500 text-lg">⭐</span>
                                            <span className="font-bold text-gray-800">
                                                {myPlayers.find(p => p.id === myTeam.captainId)?.name ?? "Jogador não encontrado"}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => setConfig(prev => ({
                                                ...prev,
                                                teams: prev.teams.map(t => t.id === myTeam!.id ? { ...t, captainId: undefined } : t)
                                            }))}
                                            className="text-xs text-red-500 hover:text-red-700 font-bold"
                                        >
                                            Remover capitão
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-xs text-yellow-700 mb-2">Selecione o capitão:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {myPlayers.map(p => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => setConfig(prev => ({
                                                        ...prev,
                                                        teams: prev.teams.map(t => t.id === myTeam!.id ? { ...t, captainId: p.id } : t)
                                                    }))}
                                                    className="px-3 py-1.5 bg-white border border-yellow-300 hover:bg-yellow-100 rounded-lg text-xs font-medium text-gray-700 transition-colors"
                                                >
                                                    {p.number} — {p.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Roster List with Starter Toggle */}

                        <div className="space-y-2">
                            {myPlayers.length === 0 && <p className="text-gray-400 text-sm italic">Nenhum atleta cadastrado.</p>}
                            
                            {myPlayers.length > 0 && (
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                                        Elenco — defina os titulares para a súmula
                                    </p>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                        myPlayers.filter(p => p.isStarter).length === 0 
                                            ? "bg-gray-100 text-gray-500"
                                            : myPlayers.filter(p => p.isStarter).length > 5 
                                                ? "bg-green-100 text-green-700" 
                                                : "bg-yellow-100 text-yellow-700"
                                    }`}>
                                        {myPlayers.filter(p => p.isStarter).length} titular(es)
                                    </span>
                                </div>
                            )}

                            {myPlayers.map(player => (
                                <div key={player.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                                    player.isStarter 
                                        ? "bg-green-50 border-green-300" 
                                        : "bg-gray-50 border-gray-100"
                                }`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                            player.isStarter ? "bg-green-200 text-green-800" : "bg-gray-200 text-gray-600"
                                        }`}>
                                            {player.number}
                                        </div>
                                        <div>
                                            <span className="font-medium text-sm">{player.name}</span>
                                            <span className="ml-2 text-xs text-gray-400">{player.position}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                            player.isStarter 
                                                ? "bg-green-200 text-green-800" 
                                                : "bg-gray-200 text-gray-600"
                                        }`}>
                                            {player.isStarter ? "✓ Titular" : "Reserva"}
                                        </span>
                                        <button
                                            onClick={() => {
                                                setConfig(prev => ({
                                                    ...prev,
                                                    players: (prev.players || []).map(p =>
                                                        p.id === player.id ? { ...p, isGoalkeeper: !p.isGoalkeeper } : p
                                                    )
                                                }));
                                            }}
                                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors border ${
                                                player.isGoalkeeper 
                                                    ? "bg-blue-100 text-blue-700 border-blue-300" 
                                                    : "bg-white text-gray-500 border-gray-200 hover:bg-blue-50"
                                            }`}
                                        >
                                            {player.isGoalkeeper ? "🧤 Goleiro" : "Goleiro?"}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setConfig(prev => ({
                                                    ...prev,
                                                    players: (prev.players || []).map(p =>
                                                        p.id === player.id ? { ...p, isStarter: !p.isStarter } : p
                                                    )
                                                }));
                                            }}
                                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                                                player.isStarter 
                                                    ? "bg-red-100 text-red-600 hover:bg-red-200" 
                                                    : "bg-green-100 text-green-700 hover:bg-green-200"
                                            }`}
                                        >
                                            {player.isStarter ? "Remover Titular" : "Escalar"}
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm(`Excluir ${player.name}?`)) {
                                                    setConfig(prev => ({
                                                        ...prev,
                                                        players: (prev.players || []).filter(p => p.id !== player.id)
                                                    }));
                                                }
                                            }}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                            title="Excluir atleta"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
      </main>

      {/* Modal Overlay */}
      {activeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h3 className="font-bold text-lg">
                          {activeModal === "team" ? "Nova Equipe" : activeModal === "athlete" ? "Novo Atleta" : "Alterar Senha"}
                      </h3>
                      <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-gray-200 rounded-full">
                          <X className="w-5 h-5 text-gray-500" />
                      </button>
                  </div>
                  <div className="p-6">
                      {activeModal === "team" && <TeamForm onClose={() => setActiveModal(null)} />}
                      {activeModal === "athlete" && <AthleteForm onClose={() => setActiveModal(null)} initialTeamId={myTeam?.id} />}
                      {activeModal === "password" && (
                          <form onSubmit={handleChangePassword} className="space-y-4">
                              <div>
                                  <label className="block text-sm font-medium text-gray-700">Nova Senha</label>
                                  <input 
                                    type="password" 
                                    className="w-full p-2 border rounded mt-1" 
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    placeholder="Mínimo 4 caracteres"
                                    required
                                  />
                              </div>
                              <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 font-bold">
                                  Salvar Nova Senha
                              </button>
                          </form>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
