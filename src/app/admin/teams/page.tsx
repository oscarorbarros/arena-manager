"use client";
import React, { useState } from "react";
import { useTournament } from "@/lib/context";
import { Users, Plus, Trash2, ClipboardPaste, UserPlus, Shield } from "lucide-react";
import { User, Team, Player } from "@/lib/types";
import { useAudit } from "@/lib/audit-context";
import { useRouter } from "next/navigation";

export default function AdminTeamsPage() {
  const { config, setConfig } = useTournament();
  const { logAction } = useAudit();
  const router = useRouter();
  
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [manualTeamName, setManualTeamName] = useState("");
  const [importTab, setImportTab] = useState<"teams" | "athletes">("teams");
  const [importText, setImportText] = useState("");

    const handleClearUsers = () => {
    if (confirm("Deseja excluir TODOS os usuários delegados?")) {
        setConfig(prev => ({
            ...prev,
            users: (prev.users || []).filter(u => u.role !== "delegate")
        }));
        logAction("clear_users", `Removeu todos os usuários delegados.`);
        alert("Usuários delegados removidos.");
    }
  };

  const handleClearTeams = () => {
    if (confirm("ATENÇÃO: Isso excluirá TODOS os times e atletas cadastrados. Deseja continuar?")) {
        setConfig(prev => ({
            ...prev,
            teams: [],
            players: [],
            matches: [] // Must clear matches as they depend on teams
        }));
        logAction("clear_teams", "Removeu TODOS os times em massa.");
        alert("Todos os times foram removidos.");
    }
  };
  
const handleDelete = (e: React.MouseEvent, teamId: string) => {
    e.stopPropagation();
    if (confirm("Tem certeza que deseja excluir este time?")) {
        const teamToRemove = config.teams.find(t => t.id === teamId);
        setConfig(prev => ({
            ...prev,
            teams: prev.teams.filter(t => t.id !== teamId)
        }));
        if(teamToRemove) logAction("delete_team", `Removeu o time: ${teamToRemove.name}`);
    }
  };

  const handleImport = () => {
      const lines = importText.split("\n").filter(l => l.trim().length > 0);
      let count = 0;

      if (importTab === "teams") {
          const newUsers: User[] = [];
          const newTeams: Team[] = [];
          let skipped = 0;

          lines.forEach(line => {
             if (line.toUpperCase().includes("FORMATO:")) return;
             const parts = line.split(",").map(s => s.trim());
             // MUST have exactly 4 fields and email must contain @
             // This prevents accidentally importing a player CSV as teams
             if (parts.length < 4) {
                 console.warn(`Linha ignorada (formato inválido, ${parts.length} campos): ${line}`);
                 return;
             }
             
             const [chiefName, email, teamName, group] = parts;

             // Validate email — must contain @
             if (!email.includes('@')) {
                 console.warn(`Linha ignorada (email inválido: "${email}"): ${line}`);
                 return;
             }
             
             // Check duplicates in Config and also in the lines being processed
             let userId = crypto.randomUUID();
             const existingUser = config.users?.find(u => u.email.toLowerCase() === email.toLowerCase());
             if (existingUser) {
                 userId = existingUser.id;
             } else {
                 newUsers.push({
                     id: userId,
                     name: chiefName,
                     email: email,
                     password: "123456",
                     role: "delegate"
                 });
             }

             const existingTeam = config.teams?.find(t => t.name.toLowerCase() === teamName.toLowerCase());
             if (existingTeam) {
                 skipped++;
                 return;
             }

             newTeams.push({
                 id: crypto.randomUUID(),
                 name: teamName,
                 group: group || "A",
                 delegationChiefId: userId,
                 logo: teamName.charAt(0).toUpperCase(),
                 stats: { points: 0, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0 }
             });
             count++;
          });

          if (count > 0) {
              setConfig(prev => ({
                  ...prev,
                  users: [...(prev.users || []), ...newUsers],
                  teams: [...prev.teams, ...newTeams]
              }));
              logAction("import_teams", `Importou em massa ${count} times. (${skipped} ignorados)`);
              alert(`Importado: ${count} novos times. ${skipped > 0 ? `(${skipped} times já existiam e foram ignorados)` : ''}`);
          } else if (skipped > 0) {
              alert(`Todos os ${skipped} times copiados já existem no sistema!\n\nNenhum time novo foi processado.`);
              return;
          }

      } else {
          // Import Athletes
          const newPlayers: Player[] = [];
          let skippedPlayers = 0;
          let notFoundTeams = 0;
          
          lines.forEach(line => {
              if (line.toUpperCase().includes("FORMATO:")) return; // ignora a linha de ajuda
              const parts = line.split(",").map(s => s.trim());
              if (parts.length < 2) return;

              const [teamName, playerName, number] = parts;
              
              // Find Team Case-Insensitive
              const team = config.teams.find(t => t.name.toLowerCase() === teamName.toLowerCase());
              
              if (team) {
                  // Check if player already exists in the team (by name and number)
                  const existingPlayer = config.players?.find(p => p.teamId === team.id && p.name.toLowerCase() === playerName.toLowerCase());
                  if (existingPlayer) {
                      skippedPlayers++;
                      return;
                  }

                  newPlayers.push({
                      id: crypto.randomUUID(),
                      teamId: team.id,
                      name: playerName,
                      number: parseInt(number) || 0,
                      position: "Meio-Campo",
                      stats: { goals: 0, yellowCards: 0, redCards: 0, matchesPlayed: 0 }
                  });
                  count++;
              } else {
                  notFoundTeams++;
              }
          });

          if (count > 0) {
              setConfig(prev => ({
                  ...prev,
                  players: [...(prev.players || []), ...newPlayers]
              }));
              logAction("import_players", `Importou em massa ${count} atletas.`);
              alert(`Importado: ${count} atletas. ${skippedPlayers > 0 ? `(${skippedPlayers} ignorados pois já existiam)` : ''}`);
          } else if (skippedPlayers > 0 || notFoundTeams > 0) {
              alert(`Nenhum atleta novo! ${skippedPlayers} já existiam. ${notFoundTeams > 0 ? `\n\nATENÇÃO: ${notFoundTeams} atletas não puderam ser importados porque seus Times não foram encontrados. (Você já importou os Times?)` : ''}`);
              return;
          }
      }

      if (count === 0) {
          alert("Nenhum dado válido processado.\n\nVerifique se o texto colado está no formato correto separado por vírgulas ou se os dados já existem no sistema.");
      } else {
          setImportText("");
          setIsImportOpen(false);
      }
  };

  return (
    <div className="text-black max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="text-black" />
            Gerenciar Times
        </h1>
        <button 
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg text-sm font-bold transition-colors"
        >
            <ClipboardPaste className="w-4 h-4" />
            Importação em Massa
        </button>
        <button 
            onClick={() => setIsManualOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-colors ml-2"
        >
            <Plus className="w-4 h-4" />
            Novo Time
        </button>

        {config.teams.length > 0 && <button 
            onClick={() => {
              if (confirm("ATENÇÃO: Isso excluirá TODOS os times, atletas E usuários delegados cadastrados. Use isto para limpar uma importação errada. Deseja continuar?")) {
                setConfig(prev => ({
                    ...prev,
                    teams: [],
                    players: [],
                    users: (prev.users || []).filter(u => u.role !== "delegate"),
                    matches: prev.matches.filter(m => false) // clear all matches
                }));
                logAction("clear_all", "Limpou todos os times, atletas e delegados.");
                alert("Limpeza completa realizada. Times, atletas e delegados removidos.");
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg text-sm font-bold transition-colors shadow-lg ml-2"
        >
            <Trash2 className="w-4 h-4" />
            Limpar Tudo
        </button>}
      </div>

      {config.teams.length === 0 ? (
          <div className="p-12 text-center bg-emerald-50/60 shadow-premium border border-emerald-200/60 rounded-xl border border-emerald-200/60 text-black">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Nenhum time cadastrado.</p>
              <p className="text-sm">Use o botão "Importação em Massa" para começar.</p>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {config.teams.map(team => (
                  <div 
                    key={team.id} 
                    onClick={() => router.push(`/admin/teams/${team.id}`)}
                    className="bg-emerald-50/60 shadow-premium border border-emerald-200/60 rounded-xl p-5 border border-emerald-200/60 flex items-center justify-between group hover:border-emerald-300 hover:bg-gray-750 transition-all cursor-pointer shadow-lg"
                  >
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-emerald-50/50 rounded-full flex items-center justify-center font-bold text-xl border border-emerald-200 group-hover:border-emerald-300 transition-colors">
                              {team.logo || team.name.charAt(0)}
                          </div>
                          <div>
                              <h3 className="font-bold text-lg group-hover:text-black transition-colors">{team.name}</h3>
                              <p className="text-xs text-black group-hover:text-black">Grupo {team.group || "-"} • Clique para editar</p>
                          </div>
                      </div>
                      <button 
                        onClick={(e) => handleDelete(e, team.id)}
                        className="p-2 text-black hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors z-10"
                        title="Excluir Time"
                      >
                          <Trash2 className="w-5 h-5" />
                      </button>
                  </div>
              ))}
          </div>
      )}

      {/* Import Modal */}
      {isImportOpen && (
          <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-emerald-50/60 shadow-premium border border-emerald-200/60 rounded-xl w-full max-w-2xl p-6 border border-emerald-200/60 flex flex-col h-[80vh]">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-xl flex items-center gap-2">
                          <ClipboardPaste className="w-5 h-5 text-green-400" /> Importação Rápida
                      </h3>
                      <button onClick={() => setIsImportOpen(false)} className="text-black hover:text-black">✕</button>
                  </div>

                  <div className="flex gap-4 border-b border-emerald-200/60 mb-4">
                      <button 
                        onClick={() => setImportTab("teams")}
                        className={`pb-2 px-2 font-bold flex items-center gap-2 border-b-2 transition-colors ${importTab === "teams" ? "border-emerald-300 text-black" : "border-transparent text-black"}`}
                      >
                          <Shield className="w-4 h-4" /> Times e Chefes
                      </button>
                      <button 
                        onClick={() => setImportTab("athletes")}
                        className={`pb-2 px-2 font-bold flex items-center gap-2 border-b-2 transition-colors ${importTab === "athletes" ? "border-green-500 text-green-400" : "border-transparent text-black"}`}
                      >
                          <UserPlus className="w-4 h-4" /> Atletas
                      </button>
                  </div>

                  <div className="flex-1 bg-emerald-50/50 rounded-lg p-4 border border-emerald-200/60 mb-4 flex flex-col">
                      <div className="text-xs text-white mb-2 font-mono bg-emerald-900 text-white shadow-md/5 p-2 rounded">
                          {importTab === "teams" 
                            ? "FORMATO: NomeChefe, Email, NomeTime, Grupo (Ex: João, joao@email.com, Falcons, A)" 
                            : "FORMATO: NomeTime, NomeAtleta, Numero (Ex: Falcons, Neymar, 10)"}
                      </div>
                      {importTab === "teams" && (
                        <div className="mb-2 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-700 font-semibold">
                          ⚠️ ATENÇÃO: Use esta aba APENAS para importar TIMES. Para importar jogadores, use a aba "Atletas".
                          O Email do chefe de delegação é obrigatório e deve conter @.
                        </div>
                      )}
                      <textarea 
                        className="flex-1 w-full bg-transparent outline-none font-mono text-sm resize-none text-black"
                        placeholder="Cole seus dados aqui..."
                        value={importText}
                        onChange={e => setImportText(e.target.value)}
                      />
                  </div>

                  <div className="flex justify-end gap-2">
                      <button onClick={() => setIsImportOpen(false)} className="px-4 py-2 text-black hover:text-black">Cancelar</button>
                      <button 
                        onClick={handleImport}
                        disabled={!importText}
                        className="px-6 py-2 bg-[#059669] text-white hover:bg-emerald-700 rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          Processar Importação
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Manual Team Modal */}
      {isManualOpen && (
          <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-emerald-50/60 shadow-premium border border-emerald-200/60 rounded-xl w-full max-w-md p-6 border border-emerald-200/60">
                  <h3 className="font-bold text-xl mb-4">Criar Novo Time</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-black uppercase mb-1">Nome do Time</label>
                          <input 
                            value={manualTeamName} 
                            onChange={e => setManualTeamName(e.target.value)}
                            className="w-full bg-white border border-emerald-200/60 rounded-lg p-3 text-black outline-none focus:border-emerald-500"
                            placeholder="Ex: Falcons FC"
                          />
                      </div>
                      <div className="flex justify-end gap-2 p-4">
                          <button onClick={() => setIsManualOpen(false)} className="px-4 py-2 text-black">Cancelar</button>
                          <button 
                            onClick={() => {
                                if (!manualTeamName.trim()) return;
                                setConfig(prev => ({
                                    ...prev,
                                    teams: [...prev.teams, { 
                                        id: crypto.randomUUID(), 
                                        name: manualTeamName, 
                                        group: "A",
                                        stats: { points: 0, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0 }
                                    }]
                                }));
                                logAction("create_team", `Criou o time manualmente: ${manualTeamName}`);
                                setManualTeamName("");
                                setIsManualOpen(false);
                            }}
                            className="px-6 py-2 bg-emerald-600 text-white hover:bg-emerald-700 text-white rounded font-bold"
                          >
                              Criar Time
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}

