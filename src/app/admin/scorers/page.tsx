"use client";
import React from "react";
import { useTournament } from "@/lib/context";
import { Trophy, Medal } from "lucide-react";

export default function AdminScorersPage() {
    const { config } = useTournament();

    const players = config.players || [];
    const topScorers = [...players]
        .filter(p => (p.stats?.goals || 0) > 0)
        .sort((a, b) => (b.stats?.goals || 0) - (a.stats?.goals || 0));

    const getTeamName = (teamId: string) => {
        return config.teams.find(t => t.id === teamId)?.name || "Desconhecido";
    };

    return (
        <div className="text-black max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Trophy className="text-emerald-600" />
                    Ranking de Artilheiros
                </h1>
            </div>

            {topScorers.length === 0 ? (
                <div className="p-12 text-center bg-emerald-50/60 border border-emerald-200/60 rounded-xl text-black">
                    <p className="text-lg text-emerald-800">Nenhum jogador marcou gols ainda.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-md border border-emerald-200/60 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-emerald-100/50 text-emerald-900 border-b border-emerald-200/60">
                                <th className="p-4 font-bold text-center w-16">Pos</th>
                                <th className="p-4 font-bold">Jogador</th>
                                <th className="p-4 font-bold">Time</th>
                                <th className="p-4 font-bold text-center">Gols</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topScorers.map((player, index) => (
                                <tr key={player.id} className="border-b border-emerald-100 hover:bg-emerald-50/30 transition-colors">
                                    <td className="p-4 text-center font-bold">
                                        {index === 0 && <Medal className="w-5 h-5 text-yellow-500 mx-auto" />}
                                        {index === 1 && <Medal className="w-5 h-5 text-gray-400 mx-auto" />}
                                        {index === 2 && <Medal className="w-5 h-5 text-amber-700 mx-auto" />}
                                        {index > 2 && <span className="text-gray-500">{index + 1}º</span>}
                                    </td>
                                    <td className="p-4 font-medium">{player.name}</td>
                                    <td className="p-4 text-sm text-gray-600">{getTeamName(player.teamId)}</td>
                                    <td className="p-4 text-center font-black text-xl text-emerald-700">{player.stats?.goals || 0}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
