"use client";
import React, { useState } from "react";
import { useTournament } from "@/lib/context";
import { useAudit } from "@/lib/audit-context";
import { Player, PlayerPosition } from "@/lib/types";
import { Save, UserPlus } from "lucide-react";

export function AthleteForm({ onClose, initialTeamId }: { onClose: () => void, initialTeamId?: string }) {
  const { config, setConfig } = useTournament();
  const { logAction } = useAudit();
  
  const [name, setName] = useState("");
  const [teamId, setTeamId] = useState(initialTeamId || "");
  const [number, setNumber] = useState("10");
  const [position, setPosition] = useState<PlayerPosition>("Meio-Campo");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId) return alert("Selecione um time!");

    const newPlayer: Player = {
        id: crypto.randomUUID(),
        name,
        teamId,
        number: parseInt(number),
        position,
        stats: { goals: 0, yellowCards: 0, redCards: 0, matchesPlayed: 0 }
    };

    setConfig(prev => ({
        ...prev,
        players: [...(prev.players || []), newPlayer]
    }));

    const teamName = config.teams.find(t => t.id === teamId)?.name;
    logAction("create_athlete", `Atleta cadastrado: ${name} (${teamName})`);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <label className="block text-sm font-medium text-gray-700">Nome do Atleta</label>
            <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-2 border rounded mt-1"
                placeholder="Ex: Joãozinho"
                required
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700">Time</label>
            <select 
                value={teamId}
                onChange={e => setTeamId(e.target.value)}
                className="w-full p-2 border rounded mt-1 bg-white"
                disabled={!!initialTeamId}
            >
                <option value="">Selecione...</option>
                {config.teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                ))}
            </select>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Número</label>
                <input 
                    type="number" 
                    value={number}
                    onChange={e => setNumber(e.target.value)}
                    className="w-full p-2 border rounded mt-1"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Posição</label>
                <select 
                    value={position}
                    onChange={e => setPosition(e.target.value as PlayerPosition)}
                    className="w-full p-2 border rounded mt-1 bg-white"
                >
                    <option value="Goleiro">Goleiro</option>
                    <option value="Zagueiro">Zagueiro</option>
                    <option value="Meio-Campo">Meia</option>
                    <option value="Atacante">Atacante</option>
                </select>
            </div>
        </div>

        <button type="submit" className="w-full bg-green-600 text-white p-2 rounded flex items-center justify-center gap-2 hover:bg-green-700">
            <UserPlus className="w-4 h-4" />
            Cadastrar Atleta
        </button>
    </form>
  );
}
