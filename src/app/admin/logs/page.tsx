"use client";
import React from "react";
import { useAudit } from "@/lib/audit-context";
import { Clock } from "lucide-react";

export default function AdminLogsPage() {
    const { logs } = useAudit();

    const formatDate = (ts: number) => {
        const d = new Date(ts);
        return `${d.toLocaleDateString("pt-BR")} ${d.toLocaleTimeString("pt-BR")}`;
    };

    return (
        <div className="text-black max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Clock className="text-emerald-600" />
                    Logs de Usuários
                </h1>
            </div>

            {logs.length === 0 ? (
                <div className="p-12 text-center bg-emerald-50/60 border border-emerald-200/60 rounded-xl text-black">
                    <p className="text-lg text-emerald-800">Nenhum log registrado ainda.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-md border border-emerald-200/60 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-emerald-100/50 text-emerald-900 border-b border-emerald-200/60">
                                <th className="p-4 font-bold">Data / Hora</th>
                                <th className="p-4 font-bold">Usuário</th>
                                <th className="p-4 font-bold">Ação</th>
                                <th className="p-4 font-bold">Detalhes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id} className="border-b border-emerald-100 hover:bg-emerald-50/30 transition-colors">
                                    <td className="p-4 text-sm text-gray-600">
                                        {formatDate(log.timestamp)}
                                    </td>
                                    <td className="p-4 text-sm font-medium">{log.userId}</td>
                                    <td className="p-4 text-sm font-bold text-emerald-700">{log.action}</td>
                                    <td className="p-4 text-sm text-gray-700">{log.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
