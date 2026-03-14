"use client";
import React, { useRef, useState } from "react";
import { useTournament } from "@/lib/context";
import { useRouter } from "next/navigation";
import { Upload, ArrowLeft, CheckCircle, AlertTriangle } from "lucide-react";

export default function SyncOfflinePage() {
    const { config, setConfig } = useTournament();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target?.result as string);
                
                // Beach tennis or soccer/society checking
                if (!data.id || (!data.teamAId && !data.pairAId)) {
                    throw new Error("Arquivo inválido: formato não reconhecido.");
                }

                // Update the match in config
                setConfig((prev: any) => {
                    const matchIndex = prev.matches.findIndex((m: any) => m.id === data.id);
                    if (matchIndex === -1) {
                         throw new Error("Partida não encontrada no torneio atual.");
                    }
                    
                    const newMatches = [...prev.matches];
                    newMatches[matchIndex] = {
                        ...newMatches[matchIndex],
                        ...data,
                        isOfflineBackup: undefined,
                        exportedAt: undefined
                    };

                    return { ...prev, matches: newMatches };
                });

                setStatus("success");
                setMessage("Sincronização concluída com sucesso! Os dados foram atualizados no sistema.");
            } catch (err: any) {
                setStatus("error");
                setMessage(`Erro: ${err.message || 'Falha ao processar o arquivo. Verifique se é um backup offline válido.'}`);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="min-h-screen bg-white text-black py-12 px-6">
            <div className="max-w-2xl mx-auto w-full">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-black mb-8 font-bold">
                    <ArrowLeft className="w-5 h-5" /> Voltar
                </button>

                <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-emerald-50">
                    <h1 className="text-3xl font-black mb-2 text-[#059669] flex items-center gap-3 tracking-tight">
                        <Upload strokeWidth={3} className="w-8 h-8" /> Sincronizar Backup Offline
                    </h1>
                    <p className="text-gray-500 mb-8 border-b border-gray-100 pb-6 text-sm">
                        Faça o upload do arquivo de backup (<strong>.json</strong>) gerado durante a partida sem internet. As informações irão preencher a súmula com tempos e placares.
                    </p>

                    <div 
                        className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-emerald-200 rounded-2xl bg-emerald-50/30 hover:bg-emerald-50 transition-colors cursor-pointer group" 
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
                            <Upload className="w-10 h-10" />
                        </div>
                        <span className="font-black text-gray-800 text-xl tracking-tight">Anexar Backup de Partida</span>
                        <span className="text-sm font-bold text-gray-400 mt-2 bg-white px-3 py-1 shadow-sm rounded-full">arquivo .json</span>
                        <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileUpload} />
                    </div>

                    {status === "success" && (
                        <div className="mt-8 p-5 bg-green-50/80 border border-green-200 text-green-800 rounded-xl flex items-start gap-4 animate-in fade-in slide-in-from-bottom-4 shadow-sm">
                            <CheckCircle className="w-6 h-6 flex-shrink-0 text-green-600 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-lg leading-none mb-2">Sucesso na Sincronização!</h3>
                                <p className="text-sm opacity-90">{message}</p>
                            </div>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="mt-8 p-5 bg-red-50/80 border border-red-200 text-red-800 rounded-xl flex items-start gap-4 animate-in fade-in slide-in-from-bottom-4 shadow-sm">
                            <AlertTriangle className="w-6 h-6 flex-shrink-0 text-red-600 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-lg leading-none mb-2">Erro ao Ler Arquivo</h3>
                                <p className="text-sm opacity-90">{message}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

