"use client";
import React, { useRef } from "react";
import Link from "next/link";
import { useTournament } from "@/lib/context";
import { useAuth } from "@/lib/auth-context";
import { Clock, Play, CheckCircle, Upload, FileSpreadsheet, Download } from "lucide-react";
import { User, Team } from "@/lib/types";

export default function RefereeDashboard() {
  const { config, setConfig } = useTournament();
  const { logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Group matches
  const liveMatches = config.matches.filter(m => m.status === "live");
  const scheduledMatches = config.matches.filter(m => m.status === "scheduled");
  const finishedMatches = config.matches.filter(m => m.status === "finished");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          const text = event.target?.result as string;
          if (!text) return;

          // CSV Parser: DelegateName,Email,TeamName,Group
          const lines = text.split("\n");
          let newUsers: User[] = [];
          let newTeams: Team[] = [];
          
          lines.forEach((line, index) => {
              if (index === 0 && line.toLowerCase().includes("email")) return; // Skip header
              const [delegateName, email, teamName, group] = line.split(",").map(s => s.trim());
              
              if (delegateName && email && teamName) {
                  const newUserId = crypto.randomUUID();
                  
                  // Create User
                  newUsers.push({
                      id: newUserId,
                      name: delegateName,
                      email: email,
                      password: "123456", // Default password
                      role: "delegate"
                  });

                  // Create Team linked to User
                  newTeams.push({
                      id: crypto.randomUUID(),
                      name: teamName,
                      group: group || "A",
                      delegationChiefId: newUserId,
                      logo: "🛡️",
                      stats: { points: 0, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0 }
                  });
              }
          });

          if (newUsers.length > 0) {
              if (confirm(`Importar ${newUsers.length} delegados e times?`)) {
                  setConfig(prev => ({
                      ...prev,
                      users: [...(prev.users || []), ...newUsers],
                      teams: [...prev.teams, ...newTeams]
                  }));
                  alert("Importação concluída com sucesso!");
              }
          } else {
              alert("Nenhum dado válido encontrado. Formato: Nome,Email,Time,Grupo");
          }
      };
      reader.readAsText(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadTemplate = (e: React.MouseEvent) => {
     e.preventDefault();
     const csv = "NomeChefe,Email,NomeTime,Grupo\nJoao Silva,joao@time.com,Falcons FC,A\nMaria Souza,maria@time.com,Leoes da Serra,B";
     const blob = new Blob([csv], { type: 'text/csv' });
     const url = window.URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = "template_delegados_times.csv";
     a.click();
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto min-h-screen bg-gray-900 text-gray-100">
      <header className="mb-8 flex justify-between items-end">
        <div>
            <h1 className="text-2xl font-bold text-white mb-2">Painel do Árbitro / Staff</h1>
            <p className="text-gray-400 text-sm">Gerencie partidas e registros</p>
        </div>
        <div className="flex gap-2">
             <button onClick={logout} className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-400">Sair</button>
             <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white hover:bg-green-700 rounded text-sm font-bold transition-colors"
             >
                 <Upload className="w-4 h-4" /> Importar Delegados
             </button>
             <button 
                onClick={downloadTemplate}
                className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
                title="Baixar Modelo CSV"
             >
                 <Download className="w-4 h-4" />
             </button>
             <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
        </div>
      </header>
      
      <div className="space-y-8">
        {/* Live Matches */}
        {liveMatches.length > 0 && (
            <section>
                <h2 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Em Andamento
                </h2>
                <div className="grid gap-4">
                    {liveMatches.map(match => (
                        <MatchCard key={match.id} match={match} />
                    ))}
                </div>
            </section>
        )}

        {/* Scheduled Matches */}
        <section>
            <h2 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Agendadas
            </h2>
            <div className="grid gap-4">
                 {/* Temporary: Add "New Match" button for demo if no matches exist */}
                 {config.sports.length > 0 && scheduledMatches.length === 0 && liveMatches.length === 0 && (
                     <div className="p-6 bg-gray-800 rounded-lg text-center border border-dashed border-gray-700">
                        <p className="text-gray-400 mb-4">Nenhuma partida agendada.</p>
                        <p className="text-xs text-gray-500">
                            (Em um app real, o admin agendaria. Para demo, clique abaixo)
                        </p>
                        <MockCreateMatchButton />
                     </div>
                 )}
                 
                 {scheduledMatches.map(match => (
                    <MatchCard key={match.id} match={match} />
                 ))}
            </div>
        </section>

        {/* Finished */}
        {finishedMatches.length > 0 && (
            <section>
                 <h2 className="text-lg font-semibold text-gray-500 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Encerradas
                </h2>
                 <div className="grid gap-4 opacity-75">
                    {finishedMatches.map(match => (
                        <MatchCard key={match.id} match={match} />
                    ))}
                 </div>
            </section>
        )}
      </div>
    </div>
  );
}

function MatchCard({ match }: { match: any }) {
    return (
        <Link href={`/referee/${match.id}`} className="block group">
            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 hover:border-gray-500 transition-colors flex justify-between items-center">
                <div>
                     <span className="text-xs font-mono text-gray-500 uppercase">{match.sportId.split("_")[0]}</span>
                     <div className="flex items-center gap-4 mt-2">
                        <span className="text-lg font-bold">{match.scoreA}</span>
                        <span className="text-sm text-gray-400">vs</span>
                        <span className="text-lg font-bold">{match.scoreB}</span>
                     </div>
                </div>
                <div className="bg-blue-600/10 p-2 rounded-full group-hover:bg-blue-600/20 transition-colors">
                    <Play className="w-5 h-5 text-blue-400" />
                </div>
            </div>
        </Link>
    );
}

function MockCreateMatchButton() {
    const { config, setConfig } = useTournament();
  const { logout } = useAuth();

    const createQuickMatch = () => {
        if (config.sports.length === 0) return alert("Crie uma configuração primeiro!");
        
        const sport = config.sports[0];
        const newMatch = {
            id: crypto.randomUUID(),
            sportId: sport.id,
            teamAId: "t1",
            teamBId: "t2",
            status: "scheduled",
            scoreA: 0,
            scoreB: 0,
            events: []
        } as any;
        
        setConfig({
            ...config,
            matches: [...config.matches, newMatch]
        });
    };

    return (
        <button 
            onClick={createQuickMatch}
            className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white transition-colors"
        >
            + Criar Partida Rápida (Demo)
        </button>
    );
}



