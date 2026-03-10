"use client";
import React, { useState, useEffect } from "react";
import { useTournament } from "@/lib/context";
import { useAuth, canConfigureTournament } from "@/lib/auth-context";
import { TournamentEngine } from "@/lib/tournament-engine";
import { 
  Save, Wand2, Settings, AlertTriangle, Play, CheckCircle, 
  RefreshCw, Trophy, ArrowLeft, Eye, ChevronRight, ChevronLeft, 
  Users, Calendar, CheckSquare, XCircle, FileText, Info, Trash2, Plus, ArrowRight,
  Clock, ListOrdered, Shield, ArrowUp, ArrowDown
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const MOCK_TEAMS_LIST = [
  "Flamengo", "Vasco", "Botafogo", "Fluminense", "Corinthians", "Palmeiras", "São Paulo", "Santos",
  "Grêmio", "Inter", "Atlético-MG", "Cruzeiro", "Bahia", "Vitória", "Fortaleza", "Ceará",
  "Sport", "Náutico", "Santa Cruz", "Paysandu", "Remo", "Goiás", "Vila Nova", "Coritiba",
  "Athletico-PR", "Avaí", "Figueirense", "Chapecoense", "Criciúma", "Juventude", "Ponte Preta", "Guarani",
  "ABC", "América-MG", "Atlético-GO", "Bragantino", "Cuiabá", "Londrina", "Operário", "Sampaio Corrêa"
];

const TIE_BREAKER_LABELS: Record<string, string> = {
    "wins": "Número de Vitórias",
    "goalDiff": "Saldo de Gols",
    "goalsFor": "Gols Pró",
    "headToHead": "Confronto Direto",
    "redCards": "Menos Cartões Vermelhos",
    "yellowCards": "Menos Cartões Amarelos"
};

export default function ConfigPage() {
  const { config, setConfig, resetTournament } = useTournament();
  const { user } = useAuth();
  const router = useRouter();
  const hasPermission = canConfigureTournament(user, config);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
      if (!config.matchSettings) {
          setConfig((prev: any) => ({
              ...prev,
              matchSettings: { duration: 20, extraTime: 5, breakTime: 5 },
              tieBreakers: ["wins", "goalDiff", "goalsFor", "headToHead"],
              format: "hybrid" 
          }));
      }
  }, []);

  if (!hasPermission) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center text-black">
              <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-xl">
                  <h1 className="text-2xl font-bold text-red-400 mb-2">Acesso Restrito</h1>
                  <p className="text-black">Apenas Administradores podem configurar as regras do torneio.</p>
                  <button onClick={() => router.push("/admin")} className="mt-4 px-4 py-2 bg-emerald-200/50 hover:bg-gray-600 rounded text-black">Voltar</button>
              </div>
          </div>
      );
  }

  if (config.status !== "setup") {
      return <ActiveTournamentView config={config} setConfig={setConfig} resetTournament={resetTournament} router={router} />;
  }

  const nextStep = () => setCurrentStep(p => p + 1);
  const prevStep = () => setCurrentStep(p => p - 1);

  return (
    <div className="min-h-screen bg-white text-black p-4 md:p-8 font-sans">
        <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-emerald-200/60">
                <div className="flex items-center gap-3">
                    <Settings className="w-8 h-8 text-black" />
                    <h1 className="text-2xl font-bold">Configuração do Torneio</h1>
                </div>
                {currentStep > 0 && (
                     <div className="flex items-center gap-2 text-sm text-black">
                          Passo <span className="text-white font-bold">{currentStep}</span> de 4
                     </div>
                )}
            </div>
            <div className="bg-white shadow-sm border border-emerald-50 rounded-xl border border-emerald-200/60 p-6 min-h-[600px]">
                {currentStep === 0 && <WelcomeStep onStart={() => setCurrentStep(1)} />}
                {currentStep === 1 && <ConfigFormStep config={config} setConfig={setConfig} onNext={nextStep} onCancel={() => setCurrentStep(0)} />}
                {currentStep === 2 && <TeamsStep config={config} setConfig={setConfig} onNext={nextStep} onBack={prevStep} />}
                {currentStep === 3 && <MatchGenStep config={config} setConfig={setConfig} onNext={nextStep} onBack={prevStep} />}
                {currentStep === 4 && <FinalStep config={config} setConfig={setConfig} onBack={prevStep} router={router} />}
            </div>
            {currentStep > 0 && (
                <div className="mt-8 flex justify-center gap-2">
                    {[1,2,3,4].map(step => (
                        <div key={step} className={`h-2 w-12 rounded-full transition-colors ${step <= currentStep ? "bg-[#059669] text-white" : "bg-white shadow-premium border border-emerald-200/50"}`} />
                    ))}
                </div>
            )}
        </div>
    </div>
  );
}

function WelcomeStep({ onStart }: { onStart: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center h-full py-12 text-center space-y-8">
            <div className="bg-[#059669] text-white/10 p-8 rounded-full ring-1 ring-emerald-500/30">
                <Wand2 className="w-16 h-16 text-black" />
            </div>
            <div>
                <h2 className="text-3xl font-bold mb-3">Bem-vindo ao Configurador</h2>
                <p className="text-black max-w-md mx-auto">Vamos configurar as regras, tempos, formato e times do seu campeonato.</p>
            </div>
            <button onClick={onStart} className="px-8 py-4 bg-[#059669] hover:bg-emerald-100/300 text-white rounded-xl font-bold text-lg flex items-center gap-3 transition-all shadow-lg shadow-emerald-900/10 hover:scale-105">
                Começar Configuração <ArrowRight className="w-5 h-5" />
            </button>
        </div>
    );
}

function ConfigFormStep({ config, setConfig, onNext, onCancel }: any) {
    const [form, setForm] = useState({
        name: config.name || "Novo Torneio",
        format: config.format || "hybrid",
        groupsCount: config.structure?.groupsCount || 4,
        teamsPerGroup: config.structure?.teamsPerGroup || 4,
        qualifiersPerGroup: config.structure?.qualifiersPerGroup || 2,
        duration: config.matchSettings?.duration || 20,
        extraTime: config.matchSettings?.extraTime || 5,
        tieBreakers: config.tieBreakers || ["wins", "goalDiff", "goalsFor", "headToHead"]
    });

    const moveTieBreaker = (index: number, direction: -1 | 1) => {
        const newItems = [...form.tieBreakers];
        if (index + direction < 0 || index + direction >= newItems.length) return;
        [newItems[index], newItems[index + direction]] = [newItems[index + direction], newItems[index]];
        setForm({ ...form, tieBreakers: newItems });
    };

    const handleNext = () => {
        setConfig((prev: any) => ({
            ...prev,
            name: form.name,
            format: form.format,
            tieBreakers: form.tieBreakers,
            matchSettings: {
                duration: Number(form.duration),
                extraTime: Number(form.extraTime),
                breakTime: 5
            },
            structure: { 
                ...prev.structure, 
                groupsCount: Number(form.groupsCount), 
                teamsPerGroup: Number(form.teamsPerGroup), 
                qualifiersPerGroup: Number(form.qualifiersPerGroup) 
            }
        }));
        onNext();
    };

    return (
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
            <div className="space-y-6">
                <div>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-black">
                        <Settings className="w-5 h-5" /> Geral e Formato
                    </h3>
                    <div className="space-y-4 bg-white shadow-sm border border-emerald-50 p-4 rounded-xl border border-emerald-200/60">
                        <div>
                            <label className="block text-xs font-bold text-black uppercase mb-1">Nome do Torneio</label>
                            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-white border border-emerald-200/60 rounded-lg p-3 text-black focus:border-emerald-300 outline-none transition-colors" />
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-black uppercase mb-2">Formato de Disputa</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'groups', label: 'Pontos Corridos' },
                                    { id: 'hybrid', label: 'Grupos + Mata' },
                                    { id: 'knockout', label: 'Eliminatória' }
                                ].map(fmt => (
                                    <button 
                                        key={fmt.id}
                                        onClick={() => setForm({...form, format: fmt.id})}
                                        className={`p-2 rounded-lg text-xs font-bold border transition-all ${form.format === fmt.id ? 'bg-[#059669] border-emerald-300 text-white' : 'bg-emerald-50/50 border-emerald-200/60 text-white hover:bg-white shadow-premium border border-emerald-200/50'}`}
                                    >
                                        {fmt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                         {form.format !== 'knockout' && (
                            <div className="grid grid-cols-3 gap-4">
                                <NumberInput label="Grupos" value={form.groupsCount} onChange={v => setForm({...form, groupsCount: v})} min={1} max={8} />
                                <NumberInput label="Times/Grupo" value={form.teamsPerGroup} onChange={v => setForm({...form, teamsPerGroup: v})} min={2} max={10} />
                                <NumberInput label="Classificados" value={form.qualifiersPerGroup} onChange={v => setForm({...form, qualifiersPerGroup: v})} min={1} max={form.teamsPerGroup - 1} />
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-400">
                        <Clock className="w-5 h-5" /> Tempo de Jogo
                    </h3>
                    <div className="grid grid-cols-2 gap-4 bg-white shadow-sm border border-emerald-50 p-4 rounded-xl border border-emerald-200/60">
                        <NumberInput label="Minutos (Normal)" value={form.duration} onChange={v => setForm({...form, duration: v})} min={5} max={90} step={5} />
                        <NumberInput label="Minutos (Prorrogação)" value={form.extraTime} onChange={v => setForm({...form, extraTime: v})} min={0} max={30} step={5} />
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                 <div>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-black">
                        <ListOrdered className="w-5 h-5" /> Critérios de Desempate
                    </h3>
                    <div className="bg-white shadow-sm border border-emerald-50 p-4 rounded-xl border border-emerald-200/60 space-y-2">
                        <p className="text-xs text-black mb-2">Arraste ou use as setas para definir a prioridade.</p>
                        {form.tieBreakers.map((crit, idx) => (
                            <div key={crit} className="flex items-center justify-between bg-white border border-emerald-200/60 p-2 rounded-lg">
                                <span className="text-sm font-medium">{TIE_BREAKER_LABELS[crit] || crit}</span>
                                <div className="flex gap-1">
                                    <button onClick={() => moveTieBreaker(idx, -1)} disabled={idx === 0} className="p-1 hover:bg-white shadow-premium border border-emerald-200/50 rounded disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
                                    <button onClick={() => moveTieBreaker(idx, 1)} disabled={idx === form.tieBreakers.length - 1} className="p-1 hover:bg-white shadow-premium border border-emerald-200/50 rounded disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                 <div className="bg-[#059669] text-white/10 border border-emerald-300/20 p-4 rounded-xl mt-auto">
                    <div className="flex items-start gap-3">
                         <Info className="w-6 h-6 text-black flex-shrink-0 mt-1" />
                         <div>
                             <h4 className="font-bold text-black">Resumo da Estrutura</h4>
                             <p className="text-xs text-black mt-1 leading-relaxed">
                                 {form.format === 'knockout' ? (
                                     "Torneio eliminatório direto. Os times se enfrentam e quem perder sai."
                                 ) : (
                                     `Serão ${form.groupsCount} grupos com ${form.teamsPerGroup} times cada. Classificam-se os ${form.qualifiersPerGroup} melhores de cada grupo.`
                                 )}
                             </p>
                             <div className="mt-2 text-xs font-mono bg-blue-950/50 p-2 rounded border border-emerald-300/50">
                                 Min. Times: {form.format === 'knockout' ? "4" : form.groupsCount * form.teamsPerGroup}
                             </div>
                         </div>
                    </div>
                </div>

                <div className="flex justify-between pt-8 border-t border-emerald-200/60 mt-auto">
                    <button onClick={onCancel} className="px-6 py-3 text-black hover:text-black font-medium">Cancelar</button>
                    <button onClick={handleNext} className="px-8 py-3 bg-[#059669] text-white hover:bg-emerald-100/300 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/10">
                        Continuar <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function TeamsStep({ config, setConfig, onNext, onBack }: any) {
    const [newTeam, setNewTeam] = useState("");
    let totalNeeded = 0;
    if (config.format === 'knockout') {
        const currentLen = config.teams.length;
        totalNeeded = Math.pow(2, Math.ceil(Math.log2(Math.max(currentLen, 2))));
        if (totalNeeded < 4) totalNeeded = 4;
    } else {
        totalNeeded = (config.structure?.groupsCount || 4) * (config.structure?.teamsPerGroup || 4);
    }
    const currentCount = config.teams.length;
    const addTeam = () => {
        if (!newTeam.trim()) return;
        setConfig((prev: any) => ({ ...prev, teams: [...prev.teams, { id: crypto.randomUUID(), name: newTeam, group: null, stats: {} }] }));
        setNewTeam("");
    };
    const removeTeam = (id: string) => setConfig((prev: any) => ({ ...prev, teams: prev.teams.filter((t: any) => t.id !== id) }));
    const autoGenerate = () => {
        const needed = totalNeeded - currentCount;
        if (needed <= 0) return;
        const newTeams = Array(needed).fill(0).map((_, i) => ({ id: crypto.randomUUID(), name: `Time ${currentCount + i + 1}`, group: null }));
        let mockIndex = 0;
        const finalTeams = newTeams.map(t => {
            const name = MOCK_TEAMS_LIST[mockIndex % MOCK_TEAMS_LIST.length] + (mockIndex >= MOCK_TEAMS_LIST.length ? " " + Math.ceil(mockIndex/30) : "");
            mockIndex++;
            return { ...t, name };
        });
        setConfig((prev: any) => ({ ...prev, teams: [...prev.teams, ...finalTeams] }));
    };
    return (
        <div className="space-y-6 max-w-4xl mx-auto h-[500px] flex flex-col">
            <div className="flex justify-between items-center">
                <div>
                     <h2 className="text-2xl font-bold">Cadastro de Times</h2>
                     <p className="text-black text-sm">Target: {totalNeeded} equipes para o formato {config.format === 'knockout' ? 'Mata-Mata' : 'Grupos'}</p>
                </div>
                <div className={`text-2xl font-bold ${currentCount >= totalNeeded ? 'text-green-500' : 'text-yellow-500'}`}>
                    {currentCount} / {totalNeeded}
                </div>
            </div>
            <div className="flex gap-2">
                <input value={newTeam} onChange={e => setNewTeam(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTeam()} placeholder="Nome do time..." className="flex-1 bg-white border border-emerald-200/60 rounded-lg p-3 outline-none focus:border-emerald-300" />
                <button onClick={addTeam} className="px-4 py-3 bg-white shadow-premium border border-emerald-200/50 hover:bg-emerald-200/50 rounded-lg"><Plus className="w-5 h-5" /></button>
                <button onClick={autoGenerate} className="px-4 py-3 bg-emerald-800 text-white/30 text-white border border-emerald-400/30 hover:bg-emerald-800 text-white/50 rounded-lg font-bold flex items-center gap-2"><Wand2 className="w-4 h-4" /> Auto</button>
            </div>
            <div className="flex-1 overflow-y-auto bg-white/50 rounded-lg border border-emerald-200/60 p-2 grid grid-cols-2 md:grid-cols-3 gap-2 content-start">
                {config.teams.map((team: any) => (
                    <div key={team.id} className="flex justify-between items-center p-3 bg-emerald-50/50 rounded border border-emerald-200/60 animate-in fade-in"><span className="font-medium truncate">{team.name}</span><button onClick={() => removeTeam(team.id)} className="text-black hover:text-red-500"><XCircle className="w-4 h-4" /></button></div>
                ))}
            </div>
            <div className="flex justify-between pt-4 border-t border-emerald-200/60">
                <button onClick={onBack} className="px-6 py-3 text-black hover:text-black flex items-center gap-2"><ChevronLeft className="w-4 h-4" /> Voltar</button>
                <button onClick={onNext} disabled={currentCount < 2} className="px-8 py-3 bg-[#059669] text-white hover:bg-emerald-100/300 disabled:opacity-50 rounded-lg font-bold flex items-center gap-2">Próximo <ChevronRight className="w-4 h-4" /></button>
            </div>
        </div>
    );
}

function MatchGenStep({ config, setConfig, onNext, onBack }: any) {
    const isGenerated = config.matches && config.matches.length > 0;
    const generate = () => {
        let teamsToUse = config.teams;
        let matches = [];
        if (config.format === 'knockout') {
             const groupsCount = config.structure?.groupsCount || 1;
             teamsToUse = TournamentEngine.drawGroups(config.teams, groupsCount);
             matches = TournamentEngine.generateGroupMatches(teamsToUse, "futsal");
        } else {
             const groupsCount = config.structure?.groupsCount || 4;
             teamsToUse = TournamentEngine.drawGroups(config.teams, groupsCount);
             matches = TournamentEngine.generateGroupMatches(teamsToUse, "futsal");
        }
        setConfig((prev: any) => ({ ...prev, teams: teamsToUse, matches: matches }));
    };
    return (
        <div className="space-y-8 max-w-2xl mx-auto text-center py-8">
            <h2 className="text-2xl font-bold">Gerar Tabela de Jogos</h2>
            {!isGenerated ? (
                <div className="space-y-4">
                    <p className="text-black">Tudo pronto! Clique abaixo para realizar o sorteio e gerar os confrontos.</p>
                    <button onClick={generate} className="px-8 py-6 bg-gradient-to-r from-emerald-700 to-teal-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-bold text-xl flex items-center justify-center gap-4 w-full shadow-xl shadow-emerald-900/10 hover:scale-[1.02] transition-all"><Wand2 className="w-8 h-8" /> SORTEAR E GERAR</button>
                </div>
            ) : (
                <div className="space-y-6">
                     <div className="bg-green-500/10 p-6 rounded-xl border border-green-500/30 inline-block mb-4"><CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-2" /><h3 className="text-xl font-bold text-green-400">Tabela Gerada!</h3><p className="text-green-200/70">{config.matches.length} partidas criadas.</p></div>
                     <button onClick={generate} className="px-6 py-3 bg-white shadow-premium border border-emerald-200/50 hover:bg-emerald-200/50 rounded-lg text-sm text-black flex items-center justify-center gap-2 mx-auto"><RefreshCw className="w-4 h-4" /> Refazer Sorteio</button>
                </div>
            )}
            <div className="flex justify-between pt-8 border-t border-emerald-200/60 mt-8 w-full">
                <button onClick={onBack} className="px-6 py-3 text-black hover:text-black flex items-center gap-2"><ChevronLeft className="w-4 h-4" /> Voltar</button>
                <button onClick={onNext} disabled={!isGenerated} className="px-8 py-3 bg-[#059669] text-white hover:bg-emerald-100/300 disabled:opacity-50 rounded-lg font-bold flex items-center gap-2">Finalizar <ChevronRight className="w-4 h-4" /></button>
            </div>
        </div>
    );
}

function FinalStep({ config, setConfig, onBack, router }: any) {
    const [confirming, setConfirming] = useState(false);
    const handleStart = () => setConfirming(true);
    const confirmStart = () => {
         setConfig((prev: any) => ({ ...prev, status: "active" }));
         router.push("/admin");
    };
    return (
        <div className="text-center space-y-8 max-w-2xl mx-auto py-8">
            <h2 className="text-3xl font-bold text-black">Pronto para Iniciar!</h2>
            <div className="bg-white border border-emerald-200/60 p-8 rounded-2xl grid grid-cols-3 gap-8">
                <div><div className="text-black text-sm uppercase">Times</div><div className="text-3xl font-bold text-green-400">{config.teams.length}</div></div>
                <div><div className="text-black text-sm uppercase">Partidas</div><div className="text-3xl font-bold text-black">{config.matches.length}</div></div>
                <div><div className="text-black text-sm uppercase">Duração</div><div className="text-3xl font-bold text-black">{config.matchSettings?.duration || 20}'</div></div>
            </div>
            {!confirming ? (
                <button onClick={handleStart} className="w-full py-5 bg-green-600 text-white hover:bg-green-500 rounded-xl font-bold text-2xl flex items-center justify-center gap-3 shadow-lg shadow-green-900/30 animate-pulse hover:animate-none transition-all">
                    <Play className="w-8 h-8 fill-current" /> INICIAR CAMPEONATO
                </button>
            ) : (
                <div className="bg-green-900/20 border border-green-500/50 p-6 rounded-xl space-y-4 animate-in fade-in zoom-in">
                    <h3 className="text-xl font-bold text-green-400">Confirmar Início?</h3>
                    <p className="text-black">As configurações serão bloqueadas e o torneio ficará visível para todos.</p>
                    <div className="flex gap-4 justify-center">
                        <button onClick={() => setConfirming(false)} className="px-6 py-3 bg-white shadow-premium border border-emerald-200/50 rounded font-bold">Cancelar</button>
                        <button onClick={confirmStart} className="px-8 py-3 bg-green-600 text-white hover:bg-green-500 rounded font-bold shadow-lg flex items-center gap-2"><CheckCircle className="w-5 h-5"/> Confirmar e Iniciar</button>
                    </div>
                </div>
            )}
             {!confirming && <button onClick={onBack} className="text-black hover:text-black flex items-center justify-center gap-1 mx-auto"><ChevronLeft className="w-4 h-4" /> Voltar para revisão</button>}
        </div>
    );
}

function ActiveTournamentView({ config, setConfig, resetTournament, router }: any) {
    const [showModal, setShowModal] = React.useState(false);
    const [showEndConfirm, setShowEndConfirm] = React.useState(false);
    const handleEnd = () => setShowEndConfirm(true);
    const confirmEnd = () => { setConfig((prev: any) => ({ ...prev, status: "finished" })); setShowEndConfirm(false); };
    const handleStartFresh = () => { resetTournament(); setShowModal(false); setConfig((prev: any) => ({ ...prev, status: "setup" })); };
    const handleKeepTeams = () => { setConfig((prev: any) => ({ ...prev, matches: [], status: "setup" })); setShowModal(false); };
    return (
        <div className="min-h-screen bg-white text-black p-8 flex flex-col items-center justify-center">
            <div className="max-w-2xl w-full text-center space-y-8">
                <h1 className="text-4xl font-bold">{config.status === "active" ? "Torneio Ativo" : "Torneio Finalizado"}</h1>
                <div className="flex gap-4 justify-center">
                    <Link href="/admin" className="px-6 py-3 bg-white shadow-premium border border-emerald-200/50 hover:bg-emerald-200/50 rounded-lg font-bold">Voltar</Link>
                    {config.status === "active" && <button onClick={handleEnd} className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-lg font-bold">Encerrar</button>}
                    {config.status === "finished" && <button onClick={() => setShowModal(true)} className="px-6 py-3 bg-green-600 text-white hover:bg-green-500 rounded-lg font-bold">Novo Torneio</button>}
                </div>
                {showModal && (
                    <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-md flex items-center justify-center z-50">
                        <div className="bg-emerald-50/50 p-8 rounded-xl border border-emerald-200/60 max-w-md w-full mx-4 space-y-6">
                            <h3 className="text-2xl font-bold">Novo Torneio</h3>
                            <div className="space-y-3">
                                <button onClick={handleKeepTeams} className="w-full px-6 py-4 bg-yellow-600/20 text-amber-600 rounded-lg font-bold">Manter Times</button>
                                <button onClick={handleStartFresh} className="w-full px-6 py-4 bg-red-600/20 text-red-400 rounded-lg font-bold">Zerar Tudo</button>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-full px-4 py-2 text-black">Cancelar</button>
                        </div>
                    </div>
                )}
                {showEndConfirm && (
                    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
                        <div className="bg-emerald-50/50 p-8 rounded-xl border border-red-500/50 max-w-md w-full mx-4 space-y-6">
                            <h3 className="text-2xl font-bold text-black">Encerrar Torneio?</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => setShowEndConfirm(false)} className="px-4 py-3 bg-white shadow-premium border border-emerald-200/50 rounded-lg text-black">Cancelar</button>
                                <button onClick={confirmEnd} className="px-4 py-3 bg-red-600 text-black rounded-lg font-bold">Confirmar</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function ActivityIcon() { return <Play className="w-12 h-12 text-green-500" />; }
function NumberInput({ value, onChange, min = 0, max = 100, step = 1, label }: { value: number, onChange: (val: number) => void, min?: number, max?: number, step?: number, label?: string }) {
    return (
        <div className="flex flex-col gap-1">
            {label && <label className="text-xs font-bold text-black uppercase">{label}</label>}
            <div className="flex items-center gap-0 bg-white border border-emerald-200/60 rounded-lg overflow-hidden">
                <button onClick={() => onChange(Math.max(min, value - step))} className="px-3 py-2 bg-emerald-50/50 hover:bg-white shadow-premium border border-emerald-200/50 text-black font-bold border-r border-emerald-200/60">-</button>
                <input 
                    type="number" 
                    value={value} 
                    onChange={e => onChange(Number(e.target.value))}
                    className="w-12 text-center bg-white text-black text-sm font-bold p-2 outline-none appearance-none"
                />
                <button onClick={() => onChange(Math.min(max, value + step))} className="px-3 py-2 bg-emerald-50/50 hover:bg-white shadow-premium border border-emerald-200/50 text-black font-bold border-l border-emerald-200/60">+</button>
            </div>
        </div>
    );
}