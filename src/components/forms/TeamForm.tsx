"use client";
import React, { useState } from "react";
import { useTournament } from "@/lib/context";
import { useAuth } from "@/lib/auth-context";
import { useAudit } from "@/lib/audit-context";
import { Team } from "@/lib/types";
import { Save, Shield } from "lucide-react";

export function TeamForm({ onClose }: { onClose: () => void }) {
  const { config, setConfig } = useTournament();
  const { user } = useAuth();
  const { logAction } = useAudit();
  
  const [name, setName] = useState("");
  const [logo, setLogo] = useState(""); // URL or emoji for now
  const [group, setGroup] = useState("A");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newTeam: Team = {
        id: crypto.randomUUID(),
        name,
        logo: logo || "🛡️",
        delegationChiefId: user?.role === "delegate" ? user.id : undefined,
        group,
        stats: { points: 0, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0 }
    };

    setConfig(prev => ({
        ...prev,
        teams: [...prev.teams, newTeam]
    }));

    logAction("create_team", `Time criado: ${name} (Grupo ${group})`);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <label className="block text-sm font-medium text-gray-700">Nome da Equipe</label>
            <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-2 border rounded mt-1"
                placeholder="Ex: Águias da Bola"
                required
            />
        </div>
        
        <div>
            <label className="block text-sm font-medium text-gray-700">Logo (Emoji ou URL)</label>
            <input 
                type="text" 
                value={logo}
                onChange={e => setLogo(e.target.value)}
                className="w-full p-2 border rounded mt-1"
                placeholder="🛡️"
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700">Grupo Inicial</label>
            <select 
                value={group}
                onChange={e => setGroup(e.target.value)}
                className="w-full p-2 border rounded mt-1 bg-white"
            >
                <option value="A">Grupo A</option>
                <option value="B">Grupo B</option>
                <option value="C">Grupo C</option>
                <option value="D">Grupo D</option>
            </select>
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded flex items-center justify-center gap-2 hover:bg-blue-700">
            <Save className="w-4 h-4" />
            Salvar Equipe
        </button>
    </form>
  );
}
