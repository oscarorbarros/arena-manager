"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTournament } from "@/lib/context";
import { ArrowLeft, Clock, Goal, ShieldAlert, MonitorPlay } from "lucide-react";

export default function PublicMatchPage() {
    const params = useParams();
    const router = useRouter();
    const { config, setConfig, setNews } = useTournament();

    const matchId = params.id as string;
    const match = config.matches.find(m => m.id === matchId);

    // Timer State for Live Matches
    const [timer, setTimer] = useState(0);

    useEffect(() => {
        if (!match) return;
        const updateTimer = () => {
            if (match.status === "live" && match.startTime) {
                const now = Date.now();
                const currentSession = Math.floor((now - match.startTime) / 1000);
                setTimer((match.elapsedSeconds || 0) + currentSession);
            } else {
                setTimer(match.elapsedSeconds || 0);
            }
        };
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [match?.status, match?.startTime, match?.elapsedSeconds]);

    useEffect(() => {
        // Auto-refresh data every 5 seconds for live matches and events
        const interval = setInterval(async () => {
            try {
                const cacheBuster = `?t=${Date.now()}`;
                const [configRes, newsRes] = await Promise.all([
                    fetch('/api/config' + cacheBuster, { cache: 'no-store' }),
                    fetch('/api/news' + cacheBuster, { cache: 'no-store' })
                ]);
                if (configRes.ok && newsRes.ok) {
                    const srvConfig = await configRes.json();
                    const srvNews = await newsRes.json();
                    if (srvConfig && Object.keys(srvConfig).length > 0) {
                        setConfig((prev: any) => ({ ...prev, ...srvConfig }));
                        if (srvNews) setNews(srvNews);
                    }
                }
            } catch (e) {
                // ignore
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [setConfig, setNews]);

    if (!match) return <div className="min-h-screen bg-emerald-50/60 flex items-center justify-center text-white">Partida não encontrada.</div>;

    const sport = config.sports.find(s => s.id === match.sportId);
    const teamA = config.teams.find(t => t.id === match.teamAId);
    const teamB = config.teams.find(t => t.id === match.teamBId);
    const penaltyScoreA = match.events.filter(e => e.teamId === match.teamAId && e.type === "penalty_goal").length;
    const penaltyScoreB = match.events.filter(e => e.teamId === match.teamBId && e.type === "penalty_goal").length;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="min-h-screen bg-white font-sans pb-12">
            {/* Header / Scoreboard */}
            <div className="bg-[#059669] text-white font-bold shadow-xl relative overflow-hidden pb-12">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

                <div className="max-w-4xl mx-auto px-4 py-6 relative z-10">
                    <button onClick={() => router.push("/")} className="mb-6 flex items-center gap-2 text-white hover:text-white transition-colors font-bold text-sm bg-black/20 px-3 py-1 rounded-full w-fit">
                        <ArrowLeft className="w-4 h-4" /> Voltar
                    </button>

                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white font-black mb-6 bg-black/20 px-4 py-1.5 rounded-full shadow-sm border border-white/10">
                            <MonitorPlay className="w-3 h-3" />
                            {sport?.name || "Esporte"} • {match.group ? `Grupo ${match.group}` : match.round}
                        </div>

                        <div className="flex w-full justify-between items-center max-w-3xl">
                            {/* Team A */}
                            <div className="flex flex-col items-center flex-1 group">
                                <div className="w-20 h-20 md:w-32 md:h-32 bg-white rounded-full flex items-center justify-center text-4xl md:text-5xl font-bold text-[#06aa48] shadow-2xl mb-4 border-4 border-white transform group-hover:scale-105 transition-transform duration-300">
                                    {teamA?.logo || "A"}
                                </div>
                                <h1 className="text-xl md:text-3xl font-black text-center leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">{teamA?.name}</h1>
                            </div>

                            {/* Score */}
                            <div className="flex flex-col items-center px-4 md:px-8 shrink-0">
                                {match.status === "live" && (
                                    <div className="mb-3 flex items-center gap-2 text-white bg-red-600 px-3 py-1 rounded-full font-bold text-xs uppercase animate-pulse shadow-lg">
                                        <div className="w-2 h-2 bg-white rounded-full" /> Ao Vivo
                                    </div>
                                )}
                                {match.status === "finished" && (
                                    <div className="mb-3 text-white bg-emerald-900 text-white shadow-md/5 px-3 py-1 rounded-full font-bold text-xs uppercase border border-white/10">Encerrado</div>
                                )}

                                <div className="flex flex-col items-center">
                                    <div className="flex items-center gap-6 text-5xl md:text-8xl font-black tabular-nums tracking-tighter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                                        <span>{match.scoreA}</span>
                                        <span className="opacity-40 text-3xl md:text-5xl">x</span>
                                        <span>{match.scoreB}</span>
                                    </div>

                                    {(match.period === "penalties" || (penaltyScoreA > 0 || penaltyScoreB > 0)) && (
                                        <div className="flex flex-col items-center mt-4 animate-in fade-in zoom-in slide-in-from-top-2">
                                            <div className="bg-yellow-400 text-yellow-900 px-6 py-2 rounded-full font-bold text-xl md:text-2xl shadow-lg border-2 border-yellow-200 tabular-nums flex items-center gap-4">
                                                <span>({penaltyScoreA})</span>
                                                <span className="text-yellow-800 text-[10px] uppercase font-black tracking-widest border border-yellow-600/30 px-2 py-0.5 rounded bg-yellow-500/10">P\u00caNALTIS</span>
                                                <span>({penaltyScoreB})</span>
                                            </div>

                                            <div className="bg-black/50 rounded-xl p-4 mt-4 w-full max-w-md mx-auto backdrop-blur-sm border border-white/10 flex justify-between items-start gap-8">
                                                {/* Team A Penalties */}
                                                <div className="flex gap-2 justify-end items-center flex-1 flex-wrap">
                                                    {match.events.filter(e => e.teamId === match.teamAId && (e.type === "penalty_goal" || e.type === "penalty_miss")).map((e, i) => (
                                                        <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-lg ${e.type === "penalty_goal" ? "bg-green-600 text-white border-2 border-green-400" : "bg-red-600 border-2 border-red-400"}`} title={e.type === "penalty_goal" ? "Gol" : "Perdeu"}>{i + 1}</div>
                                                    ))}
                                                </div>
                                                {/* Team B Penalties */}
                                                <div className="flex gap-2 justify-start items-center flex-1 flex-wrap">
                                                    {match.events.filter(e => e.teamId === match.teamBId && (e.type === "penalty_goal" || e.type === "penalty_miss")).map((e, i) => (
                                                        <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-lg ${e.type === "penalty_goal" ? "bg-green-600 text-white border-2 border-green-400" : "bg-red-600 border-2 border-red-400"}`} title={e.type === "penalty_goal" ? "Gol" : "Perdeu"}>{i + 1}</div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {(() => {
                                    const matchDuration = config.matchSettings?.duration || config.rules?.matchDuration || 20;
                                    const extraTimeDuration = config.matchSettings?.extraTime || config.rules?.knockout?.extraTimeDuration || 5;
                                    const elapsedMinutes = Math.floor(timer / 60);
                                    let isOvertime = false;

                                    const halfDuration = matchDuration / 2;

                                    if (match.period === 'first_half') isOvertime = elapsedMinutes >= halfDuration;
                                    else if (match.period === 'second_half') isOvertime = elapsedMinutes >= matchDuration;
                                    else if (match.period === 'extra_first') isOvertime = elapsedMinutes >= (matchDuration + extraTimeDuration);
                                    else if (match.period === 'extra_second') isOvertime = elapsedMinutes >= (matchDuration + (extraTimeDuration * 2));

                                    const isLive = match.status === "live";

                                    return (
                                        <div className="flex flex-col items-center">
                                            <div className={`mt-4 font-mono font-bold text-xl md:text-2xl tracking-widest ${isOvertime && isLive ? "text-amber-200 animate-pulse" : (isLive ? "text-white" : "opacity-80")}`}>

                                                {formatTime(timer)}
                                            </div>
                                            {isOvertime && isLive && (
                                                <div className="text-[10px] uppercase font-black tracking-widest text-red-500 bg-amber-900/40 px-2 py-0.5 rounded mt-1 animate-pulse border border-red-500/30">
                                                    Acréscimos
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Team B */}
                            <div className="flex flex-col items-center flex-1 group">
                                <div className="w-20 h-20 md:w-32 md:h-32 bg-white rounded-full flex items-center justify-center text-4xl md:text-5xl font-bold text-[#06aa48] shadow-2xl mb-4 border-4 border-white transform group-hover:scale-105 transition-transform duration-300">
                                    {teamB?.logo || "B"}
                                </div>
                                <h1 className="text-xl md:text-3xl font-black text-center leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">{teamB?.name}</h1>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-3xl mx-auto px-4 -mt-12 relative z-20">
                <div className="bg-white rounded-2xl shadow-xl border border-emerald-50 overflow-hidden">
                    <div className="p-4 border-b border-emerald-50 bg-emerald-50/60/50 flex items-center gap-2 font-bold text-white uppercase text-xs tracking-wider">
                        <Clock className="w-4 h-4 text-[#06aa48]" />
                        Linha do Tempo
                    </div>

                    <div className="p-6 md:p-8">
                        {match.events.length === 0 ? (
                            <div className="text-center py-16 flex flex-col items-center gap-4">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-white">
                                    <MonitorPlay className="w-8 h-8" />
                                </div>
                                <div className="text-white/60 font-medium">Nenhum lance registrado ainda.</div>
                            </div>
                        ) : (
                            <div className="space-y-0 relative">
                                {/* Vertical Line */}
                                <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-emerald-100/30"></div>

                                {[...match.events].reverse().map((event, i) => (
                                    <div key={i} className="flex gap-6 relative group animate-in slide-in-from-left-4 fade-in duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                                        {/* Time Bubble */}
                                        <div className="relative z-10 w-12 flex-shrink-0 flex flex-col items-center">
                                            <div className="w-12 h-12 rounded-full bg-white border-4 border-emerald-50 flex items-center justify-center font-mono font-bold text-sm text-black shadow-sm group-hover:border-[#06aa48] transition-colors">
                                                {event.matchTime}'
                                            </div>
                                        </div>

                                        {/* Event Card */}
                                        <div className="flex-1 pb-8">
                                            {(() => {
                                                let bgClass = "bg-white border-emerald-50";
                                                let iconClass = "bg-white/10 text-white";
                                                let textClass = "text-white";
                                                let Icon = Clock;
                                                let label = "Informação";
                                                let showTeam = false;

                                                if (event.type === "goal" || event.type === "penalty_goal") {
                                                    bgClass = "bg-green-50/50 border-green-100";
                                                    iconClass = "bg-green-100 text-green-600";
                                                    textClass = "text-black font-black";
                                                    Icon = Goal;
                                                    label = "GOOOOL!";
                                                    showTeam = true;
                                                } else if (event.type === "card_red") {
                                                    bgClass = "bg-red-50/50 border-red-100";
                                                    iconClass = "bg-red-100 text-red-600";
                                                    textClass = "text-black font-black";
                                                    Icon = ShieldAlert;
                                                    label = "Cartão Vermelho";
                                                    showTeam = true;
                                                } else if (event.type === "card_yellow") {
                                                    bgClass = "bg-yellow-50/50 border-yellow-100";
                                                    iconClass = "bg-yellow-100 text-yellow-600";
                                                    textClass = "text-black font-black";
                                                    Icon = ShieldAlert;
                                                    label = "Cartão Amarelo";
                                                    showTeam = true;
                                                } else if (event.type === "penalty_miss") {
                                                    bgClass = "bg-red-50/50 border-red-100";
                                                    iconClass = "bg-red-100 text-red-600";
                                                    textClass = "text-black font-black";
                                                    Icon = ShieldAlert;
                                                    label = "Pênalti Perdido";
                                                    showTeam = true;
                                                } else if (event.type === "start" || event.type === "end" || event.type === "info") {
                                                    bgClass = "bg-[#059669] text-white border-emerald-300";
                                                    iconClass = "bg-white/10 text-white";
                                                    textClass = "text-white";
                                                    Icon = Clock;
                                                    label = event.observation || "Informação";
                                                }

                                                return (
                                                    <div className={`p-5 rounded-xl border flex items-start gap-4 shadow-sm transition-all hover:shadow-md ${bgClass}`}>
                                                        <div className={`p-3 rounded-full shrink-0 ${iconClass}`}>
                                                            <Icon className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <div className={`font-black uppercase tracking-wide text-sm mb-1 ${textClass}`}>
                                                                {label}
                                                            </div>
                                                            {(event.observation && event.observation !== label) && (
                                                                <div className={`font-extrabold text-lg leading-tight ${(event.type === 'start' || event.type === 'end' || event.type === 'info') ? "text-white" : "text-black"}`}>
                                                                    {event.observation}
                                                                </div>
                                                            )}
                                                            {showTeam && event.teamId && (
                                                                <div className="text-xs font-bold uppercase mt-2 text-white/60 flex items-center gap-1">
                                                                    {event.teamId === match.teamAId ? <span className="text-[#06aa48]">{teamA?.name}</span> : <span className="text-[#06aa48]">{teamB?.name}</span>}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

