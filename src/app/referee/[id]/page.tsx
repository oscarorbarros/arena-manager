
"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTournament } from "@/lib/context";
import { useAuth } from "@/lib/auth-context";
import {
    ArrowLeft, Play, Pause, Goal, AlertTriangle, ShieldAlert, FileText,
    CheckCircle, Clock, Hash, Trophy, StopCircle, X
} from "lucide-react";
import { MatchPeriod, isMatchInInjuryTime } from "@/lib/types";
import { generateAndPrintSumula } from "@/lib/sumula-pdf";

export default function MatchInterface() {
    const params = useParams();
    const router = useRouter();
    const { config, updateMatch, addMatchEvent, updateMatchWithEvent } = useTournament();
    const { user } = useAuth();

    const matchId = params.id as string;
    const match = config.matches.find(m => m.id === matchId);

    // Local state for modals/forms
    const [activeModal, setActiveModal] = useState<"goal" | "card" | "sumula" | "penalties" | "substitution" | null>(null);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [selectedCardType, setSelectedCardType] = useState<"yellow" | "red" | null>(null);
    const [sumulaText, setSumulaText] = useState("");
    const [woModalOpen, setWoModalOpen] = useState(false);
    const [annulModal, setAnnulModal] = useState({ isOpen: false, type: "goal" as "goal" | "penalty", teamId: "" });
    const [annulReason, setAnnulReason] = useState("");
    const [subPlayerOut, setSubPlayerOut] = useState<string | null>(null);
    const [penaltyCapture, setPenaltyCapture] = useState<{ teamId: string, scored: boolean } | null>(null);
    const [timer, setTimer] = useState(0);

    // Sync Sumula text
    useEffect(() => {
        if (match?.observations) setSumulaText(match.observations);
    }, [match?.observations]);

    // Robust Timer Logic
    useEffect(() => {
        if (match && match.status !== "finished") {
            const h = (e: any) => { e.preventDefault(); e.returnValue = ""; };
            window.addEventListener("beforeunload", h);
            return () => window.removeEventListener("beforeunload", h);
        }
    }, [match?.status]);

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

    if (!match) return <div className="p-8 text-white">Carregando partida...</div>;
    if (config.status !== "active") return <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-8 text-center"><ShieldAlert className="w-16 h-16 text-yellow-200 mb-4" /><h1 className="text-2xl font-bold text-yellow-200">Torneio não iniciado</h1><p className="text-gray-400 mt-2">Aguarde o início do torneio no painel de controle.</p></div>;

    const sport = config.sports.find(s => s.id === match.sportId);
    const teamA = config.teams.find(t => t.id === match.teamAId);
    const teamB = config.teams.find(t => t.id === match.teamBId);

    const playersA = config.players?.filter(p => p.teamId === teamA?.id) || [];
    const playersB = config.players?.filter(p => p.teamId === teamB?.id) || [];

    // Config Rules - Prioritize matchSettings (from Config Page) then rules
    const matchDuration = config.matchSettings?.duration || config.rules?.matchDuration || 20;
    const allowInjuryTime = config.rules?.allowInjuryTime ?? true;
    const isKnockout = match.stage !== "group";
    const allowExtraTime = config.rules?.knockout?.allowExtraTime ?? true;
    const extraTimeDuration = config.matchSettings?.extraTime || config.rules?.knockout?.extraTimeDuration || 5;
    const allowPenalties = config.rules?.knockout?.allowPenalties ?? true;

    // Injury Time Check
    const elapsedMinutes = Math.floor(timer / 60);
    let isOvertime = false;

    // Logic to detect if we are in injury time based on current period
    // If the user set 1 minute total, then each half is 0.5 mins.
    // If we assume matchDuration is TOTAL time for both halves:
    const halfDuration = matchDuration / 2;

    if (match.period === 'first_half') isOvertime = elapsedMinutes >= halfDuration;
    else if (match.period === 'second_half') isOvertime = elapsedMinutes >= matchDuration;
    else if (match.period === 'extra_first') isOvertime = elapsedMinutes >= (matchDuration + extraTimeDuration);
    else if (match.period === 'extra_second') isOvertime = elapsedMinutes >= (matchDuration + (extraTimeDuration * 2));

    // Helper to count cards for a player in this match
    const hasPlayedExtraTime = match.events.some(e => e.type === "end" && e.observation && e.observation.includes("Fim Prorrog"));
    const getPlayerCardStatus = (playerId: string) => {
        const yellowCards = match.events.filter(e => e.playerId === playerId && e.type === "card_yellow").length;
        const redCards = match.events.filter(e => e.playerId === playerId && e.type === "card_red").length;
        return { yellowCards, redCards, isExpelled: redCards > 0 || yellowCards >= 2 };
    };

    const togglePause = () => {
        if (match.status === "live") {
            const now = Date.now();
            const sessionTime = Math.floor((now - (match.startTime || now)) / 1000);
            updateMatch(matchId, {
                status: "paused",
                elapsedSeconds: (match.elapsedSeconds || 0) + sessionTime,
                startTime: undefined
            });
            addMatchEvent(matchId, { type: "end", timestamp: Date.now(), matchTime: timer, observation: "Partida Pausada" });
        } else {
            updateMatch(matchId, {
                status: "live",
                startTime: Date.now()
            });
            addMatchEvent(matchId, { type: "start", timestamp: Date.now(), matchTime: timer, observation: "Partida Retomada" });
        }
    };

    // Match State Machine
    const startMatch = () => {
        updateMatch(matchId, { status: "live", startTime: Date.now(), period: 'first_half', elapsedSeconds: 0 });
        addMatchEvent(matchId, { type: "start", timestamp: Date.now(), matchTime: 0, observation: "Início do 1º Tempo" });
    };

    const endFirstHalf = () => {
        if (!confirm("Encerrar o 1º Tempo?")) return;
        updateMatchWithEvent(matchId, { status: "paused", startTime: undefined, period: "half_time" }, { type: "end", observation: "Fim do 1o Tempo" });
    };

    const startSecondHalf = () => {
        // Ensure timer starts at correct time for 2nd half (e.g. 20min)
        const startSeconds = matchDuration * 60;
        const currentSeconds = match.elapsedSeconds || 0;
        const newSeconds = Math.max(currentSeconds, startSeconds);

        updateMatch(matchId, { status: "live", startTime: Date.now(), period: 'second_half', elapsedSeconds: newSeconds });
        addMatchEvent(matchId, { type: "start", timestamp: Date.now(), matchTime: newSeconds, observation: "Início do 2º Tempo" });
    };

    const endSecondHalf = () => {
        if (!confirm("Encerrar o 2º Tempo?")) return;
        updateMatchWithEvent(matchId, { status: "paused", startTime: undefined, period: "full_time" }, { type: "end", observation: "Fim do 2o Tempo" });
    };

    const startExtraFirst = () => {
        const startSeconds = matchDuration * 2 * 60;
        const currentSeconds = match.elapsedSeconds || 0;
        const newSeconds = Math.max(currentSeconds, startSeconds);

        updateMatch(matchId, { status: "live", startTime: Date.now(), period: 'extra_first', elapsedSeconds: newSeconds });
        addMatchEvent(matchId, { type: "start", timestamp: Date.now(), matchTime: newSeconds, observation: "Início Prorrogação (1º T)" });
    };

    const endExtraFirst = () => {
        updateMatchWithEvent(matchId, { status: "paused", startTime: undefined, period: "extra_half_time" }, { type: "end", observation: "Fim Prorrogacao (1o T)" });
    };

    const startExtraSecond = () => {
        const startSeconds = (matchDuration * 2 * 60) + (extraTimeDuration * 60);
        const currentSeconds = match.elapsedSeconds || 0;
        const newSeconds = Math.max(currentSeconds, startSeconds);

        updateMatch(matchId, { status: "live", startTime: Date.now(), period: 'extra_second', elapsedSeconds: newSeconds });
        addMatchEvent(matchId, { type: "start", timestamp: Date.now(), matchTime: newSeconds, observation: "Início Prorrogação (2º T)" });
    };

    const endExtraSecond = () => {
        updateMatchWithEvent(matchId, { status: "paused", startTime: undefined, period: "full_time" }, { type: "end", observation: "Fim Prorrog (2o T)" });
    };

    const startPenalties = () => {
        updateMatch(matchId, { status: "paused", period: 'penalties' });
        addMatchEvent(matchId, { type: "start", timestamp: Date.now(), matchTime: timer, observation: "Início dos Pênaltis" });
        setActiveModal("penalties");
    };

    const handlePause = (obs: string, nextPeriod: MatchPeriod) => {
        const now = Date.now();
        const sessionTime = Math.floor((now - (match.startTime || now)) / 1000);
        const finalElapsed = (match.elapsedSeconds || 0) + sessionTime;

        updateMatch(matchId, {
            status: "paused",
            elapsedSeconds: finalElapsed,
            startTime: undefined,
            period: nextPeriod
        });
        addMatchEvent(matchId, { type: "end", timestamp: now, matchTime: finalElapsed, observation: obs });
    };

    const finishMatch = () => {
        if (!confirm("Tem certeza que deseja FINALIZAR a partida?")) return;
        const responsibleName = user?.name || user?.email || "Árbitro";
        updateMatch(matchId, { status: "finished", startTime: undefined, closedBy: responsibleName });
        addMatchEvent(matchId, { type: "end", timestamp: Date.now(), matchTime: timer, observation: `Partida Encerrada por ${responsibleName}` });
        // Don't redirect immediately so they can download the sumula
    };


    const handleWO = (winnerId: string) => {
        if (!confirm("Confirmar W.O.? O placar será definido como 3x0 e a partida encerrada.")) return;

        const isTeamA = winnerId === teamA?.id;

        updateMatch(matchId, {
            status: "finished",
            scoreA: isTeamA ? 3 : 0,
            scoreB: isTeamA ? 0 : 3,
            startTime: undefined,
            period: "full_time",
            isWalkover: true
        });

        addMatchEvent(matchId, {
            type: "end",
            timestamp: Date.now(),
            matchTime: 0,
            observation: `W.O. - Vitoria de ${isTeamA ? (teamA?.name || 'Time A') : (teamB?.name || 'Time B')}`
        });

        setWoModalOpen(false);
        router.push("/admin");
    };
    // Penalty Logic
    const handlePenaltyScore = (teamId: string, scored: boolean, playerId?: string) => {
        const penaltyEvents = match.events.filter(e => e.type === 'penalty_goal' || e.type === 'penalty_miss');
        const shotsCount = penaltyEvents.length;
        if (!match.firstPenaltyTeamId) { alert('Escolha quem começa primeiro!'); return; }
        
        const isTeamA = teamId === teamA?.id;
        const currentA = match.penaltiesA || 0;
        const currentB = match.penaltiesB || 0;

        let newScoreA = currentA;
        let newScoreB = currentB;

        if (scored) {
            if (isTeamA) newScoreA++;
            else newScoreB++;
        }

        const player = config.players?.find(p => p.id === playerId);
        const eventType = scored ? "penalty_goal" : "penalty_miss";
        const playerSuffix = player ? ` (${player.name})` : "";
        const obs = `Pênalti ${scored ? "Convertido" : "Perdido"}${playerSuffix} - ${isTeamA ? (teamA?.name || "Time A") : (teamB?.name || "Time B")}`;

        addMatchEvent(matchId, {
            type: eventType,
            teamId,
            playerId,
            value: 0,
            timestamp: Date.now(),
            matchTime: timer,
            observation: obs
        });

        if (scored) {
            updateMatch(matchId, { penaltiesA: newScoreA, penaltiesB: newScoreB });
        }
        setPenaltyCapture(null);
    };

    const handleAnnulGoal = () => {
        if (!annulReason) { alert("Informe o motivo!"); return; }
        const isTeamA = annulModal.teamId === teamA?.id;
        updateMatch(matchId, {
            scoreA: isTeamA ? Math.max(0, match.scoreA - 1) : match.scoreA,
            scoreB: !isTeamA ? Math.max(0, match.scoreB - 1) : match.scoreB
        });
        addMatchEvent(matchId, { type: "info", teamId: annulModal.teamId, observation: "GOL ANULADO: " + annulReason });
        setAnnulModal({ ...annulModal, isOpen: false });
        setAnnulReason("");
    };

    const handleAnnulPenalty = () => {
        if (!annulReason) { alert("Informe o motivo!"); return; }
        const penaltyEvents = match.events.filter(e => e.type === "penalty_goal" || e.type === "penalty_miss");
        if (penaltyEvents.length === 0) return;
        const lastPenalty = penaltyEvents[penaltyEvents.length - 1];
        const isTeamA = lastPenalty.teamId === teamA?.id;

        addMatchEvent(matchId, { type: "info", teamId: lastPenalty.teamId, observation: "PÊNALTI ANULADO: " + annulReason + " (Repetir)" });

        if (lastPenalty.type === "penalty_goal") {
            updateMatch(matchId, {
                penaltiesA: isTeamA ? Math.max(0, (match.penaltiesA || 0) - 1) : match.penaltiesA,
                penaltiesB: !isTeamA ? Math.max(0, (match.penaltiesB || 0) - 1) : match.penaltiesB
            });
        }

        const newEvents = match.events.filter(e => e.id !== lastPenalty.id);
        updateMatch(matchId, { events: newEvents });
        setAnnulModal({ ...annulModal, isOpen: false });
        setAnnulReason("");
    };
    const openGoalModal = (teamId: string) => {
        if (match.status !== "live" && match.period !== "penalties") {
            alert("A partida precisa estar em andamento (AO VIVO) para registrar gols.");
            return;
        }
        setSelectedTeamId(teamId);
        setActiveModal("goal");
    };

    const openCardModal = (teamId: string) => {
        setSelectedTeamId(teamId);
        setSelectedCardType(null);
        setActiveModal("card");
    };

    const handleGoal = (playerId?: string) => {
        if (!selectedTeamId) return;
        const player = config.players?.find(p => p.id === playerId);
        const description = player ? `Gol de ${player.name}` : "Gol (Atleta não identificado)";

        addMatchEvent(matchId, { type: "goal", teamId: selectedTeamId, playerId, value: 1, observation: description, matchTime: timer, timestamp: Date.now() });
        setActiveModal(null);
    };

    const handleCard = (playerId?: string) => {
        if (!selectedTeamId || !selectedCardType) return;

        let description = "";
        if (playerId) {
            const player = config.players?.find(p => p.id === playerId);
            const cardName = selectedCardType === "yellow" ? "Cartão Amarelo" : "Cartão Vermelho";
            description = player ? `${cardName} para ${player.name}` : `${cardName} (Banco/Comissão)`;
        } else {
            const cardName = selectedCardType === "yellow" ? "Cartão Amarelo" : "Cartão Vermelho";
            description = `${cardName} (Banco/Comissão)`;
        }

        addMatchEvent(matchId, {
            type: selectedCardType === "yellow" ? "card_yellow" : "card_red",
            teamId: selectedTeamId,
            playerId,
            value: 0,
            observation: description,
            matchTime: timer,
            timestamp: Date.now()
        });
        setActiveModal(null);
        setSelectedCardType(null);
    };

    const addSumulaToTimeline = () => {
        if (!sumulaText.trim()) return;
        addMatchEvent(matchId, {
            type: "info",
            timestamp: Date.now(),
            matchTime: timer,
            observation: sumulaText
        });
        setSumulaText("");
        setActiveModal(null);
    };

    const saveSumula = () => {
        updateMatch(matchId, { observations: sumulaText });
        alert("Súmula salva!");
        setActiveModal(null);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const getPeriodLabel = () => {
        switch (match.period) {
            case 'first_half': return "1º Tempo";
            case 'half_time': return "Intervalo";
            case 'second_half': return "2º Tempo";
            case 'full_time': return "Fim de Jogo (Aguardando)";
            case 'extra_first': return "Prorrogação (1º T)";
            case 'extra_half_time': return "Intervalo Prorrogação";
            case 'extra_second': return "Prorrogação (2º T)";
            case 'penalties': return "Pênaltis";
            default: return "Partida não iniciada";
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col font-sans">
            <header className="p-4 bg-green-700 border-b border-green-800 flex items-center justify-between sticky top-0 z-10">
                <button onClick={() => router.back()} className="text-gray-400 hover:text-white"><ArrowLeft /></button>
                <div className="text-center">
                    <h1 className="text-xs font-mono text-white font-black font-black uppercase tracking-widest mb-1">{"STAFF v1.2" + " • " + sport?.name} • {getPeriodLabel()}</h1>
                    <div className={`text-4xl font-black font-mono transition-colors ${match.status === "paused" ? "text-yellow-200" :
                            match.status === "finished" ? "text-red-500" :
                                isOvertime ? "text-amber-200 animate-pulse" : "text-white"
                        }`}>
                        {formatTime(timer)}
                    </div>
                    <button
                        onClick={() => setActiveModal("sumula")}
                        className="mt-2 flex items-center justify-center gap-2 px-4 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-full text-xs font-bold text-gray-400 hover:text-white transition-all mx-auto"
                    >
                        <FileText className="w-3 h-3" /> SÚMULA
                    </button>
                </div>
                <div className="flex gap-2">

                </div>
            </header>

            {/* Controls Bar */}
            <div className="bg-gray-900 border-b border-gray-800 p-2 overflow-x-auto">
                <div className="flex justify-center gap-2 min-w-max">
                    {match.status === 'scheduled' && (
                        <button onClick={startMatch} className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-bold flex items-center gap-2">
                            <Play className="w-4 h-4" /> Iniciar 1º Tempo
                        </button>
                    )}

                    {match.period === 'first_half' && match.status === 'live' && (
                        <button onClick={endFirstHalf} className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg font-bold flex items-center gap-2">
                            <StopCircle className="w-4 h-4" /> Fim 1º Tempo
                        </button>
                    )}

                    {match.period === 'half_time' && (
                        <button onClick={startSecondHalf} className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-bold flex items-center gap-2">
                            <Play className="w-4 h-4" /> Iniciar 2º Tempo
                        </button>
                    )}

                    {match.period === 'second_half' && match.status === 'live' && (
                        <button onClick={endSecondHalf} className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg font-bold flex items-center gap-2">
                            <StopCircle className="w-4 h-4" /> Fim 2º Tempo
                        </button>
                    )}

                    {['first_half', 'second_half', 'extra_first', 'extra_second'].includes(match.period || '') && match.status === 'live' && (
                        <button onClick={togglePause} className="px-4 py-2 bg-gray-800 border border-gray-600 hover:bg-gray-700 rounded-lg font-bold flex items-center gap-2 text-yellow-200">
                            <Pause className="w-4 h-4" /> Pausar
                        </button>
                    )}
                    {['first_half', 'second_half', 'extra_first', 'extra_second'].includes(match.period || '') && match.status === 'paused' && (
                        <button onClick={togglePause} className="px-4 py-2 bg-green-900/40 border border-green-600 hover:bg-green-900/60 rounded-lg font-bold flex items-center gap-2 text-white">
                            <Play className="w-4 h-4" /> Retomar
                        </button>
                    )}

                    {/* End of Regular Time Controls */}
                    {match.period === 'full_time' && match.status !== 'finished' && (
                        <>
                            {(match.scoreA !== match.scoreB || !isKnockout) && (
                                <button onClick={finishMatch} className="px-6 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-bold flex items-center gap-2 animate-pulse">
                                    <CheckCircle className="w-4 h-4" /> Encerrar Partida
                                </button>
                            )}

                            {match.scoreA === match.scoreB && isKnockout && (
                                <div className="flex gap-2">
                                    {allowExtraTime && !hasPlayedExtraTime && (<button onClick={startExtraFirst} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-bold flex items-center gap-2">
                                        <Clock className="w-4 h-4" /> Iniciar 1º Tempo Prorrogação
                                    </button>
                                    )}
                                    {allowPenalties && (
                                        <button onClick={startPenalties} className="px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg font-bold flex items-center gap-2">
                                            <Hash className="w-4 h-4" /> Ir para Pênaltis
                                        </button>
                                    )}
                                    <button onClick={finishMatch} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold flex items-center gap-2 text-xs">
                                        Encerrar (Empate)
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {/* Extra Time Controls */}
                    {match.period === 'extra_first' && match.status === 'live' && (
                        <button onClick={endExtraFirst} className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg font-bold flex items-center gap-2">
                            <StopCircle className="w-4 h-4" /> Fim 1º Tempo Prorrogação
                        </button>
                    )}
                    {match.period === 'extra_half_time' && (
                        <button onClick={startExtraSecond} className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-bold flex items-center gap-2">
                            <Play className="w-4 h-4" /> Iniciar 2º Tempo Prorrogação
                        </button>
                    )}
                    {match.period === 'extra_second' && match.status === 'live' && (
                        <button onClick={endExtraSecond} className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg font-bold flex items-center gap-2">
                            <StopCircle className="w-4 h-4" /> Fim 2º Tempo Prorrogação
                        </button>
                    )}

                    {/* Penalty State Only Button */}
                    {match.period === 'penalties' && match.status !== 'finished' && (
                        <div className="flex gap-2">
                            <button onClick={() => setActiveModal("penalties")} className="px-6 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg font-bold flex items-center gap-2">
                                <Hash className="w-4 h-4" /> Gerenciar Pênaltis
                            </button>
                            <button onClick={finishMatch} className="px-6 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-bold flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" /> Finalizar Disputa
                            </button>
                        </div>
                    )}

                </div>
            </div>

            {/* === FINISHED MATCH OVERLAY === */}
            {match.status === 'finished' && (
                <div className="fixed inset-0 bg-gray-950/95 z-50 flex flex-col items-center justify-center gap-6 backdrop-blur">
                    <div className="text-green-400 text-6xl">🏆</div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-widest">Partida Encerrada</h2>
                    <div className="text-5xl font-black font-mono text-white">
                        {match.scoreA} <span className="text-gray-500 text-3xl">×</span> {match.scoreB}
                    </div>
                    <div className="text-gray-400 text-sm">{teamA?.name} &nbsp;×&nbsp; {teamB?.name}</div>
                    {match.closedBy && (
                        <div className="text-gray-500 text-xs mt-1">Encerrada por: <strong className="text-gray-300">{match.closedBy}</strong></div>
                    )}
                    <div className="flex gap-3 mt-4 flex-wrap justify-center">
                        <button
                            onClick={() => generateAndPrintSumula({
                                match,
                                teamA: teamA!,
                                teamB: teamB!,
                                playersA,
                                playersB,
                                tournamentName: config.name,
                                sportName: sport?.name || "Futebol",
                                closedBy: match.closedBy
                            })}
                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-2 text-sm shadow-lg shadow-emerald-900/30"
                        >
                            📄 Baixar Súmula (PDF)
                        </button>
                        <button
                            onClick={() => router.push(user?.role === "admin" ? "/admin" : "/")}
                            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl flex items-center gap-2 text-sm border border-gray-700"
                        >
                            ← Voltar ao Painel
                        </button>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-auto p-4 md:p-6 space-y-8">

                <div className="flex justify-around items-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <div className="w-20 h-20 md:w-28 md:h-28 bg-gray-800 rounded-full flex items-center justify-center text-3xl font-bold border-4 border-blue-600 shadow-lg shadow-blue-900/30">
                                {teamA?.logo || "A"}
                            </div>
                        </div>
                        <h2 className="font-bold text-lg leading-tight max-w-[120px] text-center">{teamA?.name}</h2>
                        {match.status !== "finished" && (
                            <button onClick={() => handleWO(teamA?.id || "")} className="mt-2 text-xs font-bold bg-gray-800 text-gray-500 hover:bg-red-900/50 hover:text-red-200 px-3 py-1 rounded border border-gray-700 hover:border-red-800 transition-colors">
                                Declarar W.O.
                            </button>
                        )}
                        <div className="flex flex-col items-center">
                            <div className="text-6xl font-black tracking-tighter tabular-nums text-white drop-shadow-2xl">{match.scoreA}</div>
                            {(match.penaltiesA !== undefined || match.period === 'penalties') && (
                                <div className="flex flex-col items-center mt-2 px-4 py-1.5 bg-gray-900 rounded-lg border border-gray-800 shadow-inner">
                                    <div className="text-2xl text-yellow-200 font-mono font-bold leading-none">{match.penaltiesA || 0}</div>
                                    <div className="text-[9px] text-white font-black font-black uppercase tracking-widest mt-0.5 font-bold">Pênaltis</div>
                                </div>
                            )}
                        </div>
                        {match.status !== "finished" && match.status !== "scheduled" && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                {match.status === "live" ? (
                                    <>
                                        <button onClick={() => setAnnulModal({ isOpen: true, type: "goal", teamId: match.teamAId })} className="col-span-2 py-2 text-xs font-black bg-red-600/20 text-red-400 border border-red-600/50 rounded-lg hover:bg-red-600/40 uppercase transition-all mb-1">ANULAR ÚLTIMO GOL</button>
                                        <button onClick={() => openGoalModal(match.teamAId)} className="p-3 bg-blue-600 rounded-lg hover:bg-blue-500 flex justify-center text-white"><span className="text-2xl leading-none drop-shadow-md filter drop-shadow-lg">⚽</span></button>
                                        <button onClick={() => openCardModal(match.teamAId)} className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 flex justify-center text-yellow-200 border border-gray-700"><AlertTriangle className="w-6 h-6" /></button>
                                    </>
                                ) : (
                                    <div className="col-span-2 px-3 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-[10px] text-gray-500 uppercase font-bold text-center mb-1">
                                        Gols/Cartões bloqueados (Inicie o tempo)
                                    </div>
                                )}
                                <button onClick={() => { setSelectedTeamId(match.teamAId); setSubPlayerOut(null); setActiveModal("substitution"); }} className="col-span-2 py-2 text-xs font-black bg-cyan-600/20 text-cyan-300 border border-cyan-600/50 rounded-lg hover:bg-cyan-600/40 uppercase transition-all">🔄 Substituição</button>
                            </div>
                        )}
                    </div>

                    <div className="text-gray-700 text-4xl font-black opacity-30">X</div>

                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <div className="w-20 h-20 md:w-28 md:h-28 bg-gray-800 rounded-full flex items-center justify-center text-3xl font-bold border-4 border-red-600 shadow-lg shadow-red-900/30">
                                {teamB?.logo || "B"}
                            </div>
                        </div>
                        <h2 className="font-bold text-lg leading-tight max-w-[120px] text-center">{teamB?.name}</h2>
                        {match.status !== "finished" && (
                            <button onClick={() => handleWO(teamB?.id || "")} className="mt-2 text-xs font-bold bg-gray-800 text-gray-500 hover:bg-red-900/50 hover:text-red-200 px-3 py-1 rounded border border-gray-700 hover:border-red-800 transition-colors">
                                Declarar W.O.
                            </button>
                        )}
                        <div className="flex flex-col items-center">
                            <div className="text-6xl font-black tracking-tighter tabular-nums text-white drop-shadow-2xl">{match.scoreB}</div>
                            {(match.penaltiesB !== undefined || match.period === 'penalties') && (
                                <div className="flex flex-col items-center mt-2 px-4 py-1.5 bg-gray-900 rounded-lg border border-gray-800 shadow-inner">
                                    <div className="text-2xl text-yellow-200 font-mono font-bold leading-none">{match.penaltiesB || 0}</div>
                                    <div className="text-[9px] text-white font-black font-black uppercase tracking-widest mt-0.5 font-bold">Pênaltis</div>
                                </div>
                            )}
                        </div>
                        {match.status !== "finished" && match.status !== "scheduled" && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                {match.status === "live" ? (
                                    <>
                                        <button onClick={() => setAnnulModal({ isOpen: true, type: "goal", teamId: match.teamBId })} className="col-span-2 py-2 text-xs font-black bg-red-600/20 text-red-400 border border-red-600/50 rounded-lg hover:bg-red-600/40 uppercase transition-all mb-1">ANULAR ÚLTIMO GOL</button>
                                        <button onClick={() => openGoalModal(match.teamBId)} className="p-3 bg-red-600 rounded-lg hover:bg-red-500 flex justify-center text-white"><span className="text-2xl leading-none drop-shadow-md filter drop-shadow-lg">⚽</span></button>
                                        <button onClick={() => openCardModal(match.teamBId)} className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 flex justify-center text-yellow-200 border border-gray-700"><AlertTriangle className="w-6 h-6" /></button>
                                    </>
                                ) : (
                                    <div className="col-span-2 px-3 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-[10px] text-gray-500 uppercase font-bold text-center mb-1">
                                        Gols/Cartões bloqueados (Inicie o tempo)
                                    </div>
                                )}
                                <button onClick={() => { setSelectedTeamId(match.teamBId); setSubPlayerOut(null); setActiveModal("substitution"); }} className="col-span-2 py-2 text-xs font-black bg-cyan-600/20 text-cyan-300 border border-cyan-600/50 rounded-lg hover:bg-cyan-600/40 uppercase transition-all">🔄 Substituição</button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="max-w-4xl mx-auto w-full px-4 mb-12">
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
                        <div className="p-3 border-b border-gray-800 bg-gray-800/50 flex justify-between items-center">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Linha do Tempo</h3>
                            <span className="text-xs text-gray-600">{match.events.length} eventos</span>
                        </div>
                        <div className="p-4 space-y-4 max-h-60 overflow-y-auto">
                            {[...match.events].reverse().map((event, i) => (
                                <div key={i} className="flex gap-4 animate-in slide-in-from-left-2">
                                    <div className="flex flex-col items-center">
                                        <div className="h-full w-px bg-gray-800 mb-1" />
                                        <span className="text-xs font-mono text-white bg-gray-800 px-1 border border-gray-800 rounded">
                                            {event.matchTime}'
                                        </span>
                                        <div className="h-full w-px bg-gray-800 mt-1" />
                                    </div>
                                    <div className="flex-1 bg-gray-800/30 p-3 rounded-lg border border-gray-800 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {event.type === "info" && <div className="p-1.5"><FileText className="w-4 h-4 text-blue-400" /></div>}
                                            {event.type === "goal" && <div className="p-1.5 bg-transparent text-xl leading-none">⚽</div>}
                                            {event.type === "substitution" && <div className="p-1.5 text-xl leading-none">🔄</div>}
                                            {event.type.includes("card") && <div className={`p-1.5 rounded-full ${event.type === "card_yellow" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-500"}`}><ShieldAlert className="w-4 h-4" /></div>}
                                            {event.type === "start" && <Play className="w-4 h-4 text-white" />}
                                            {event.type === "end" && <StopCircle className="w-4 h-4 text-yellow-200" />}
                                            <div>
                                                <div className="text-sm font-medium text-gray-200">{event.observation}</div>
                                                <div className="text-xs text-gray-500">{event.teamId === match.teamAId ? teamA?.name : event.teamId === match.teamBId ? teamB?.name : ""}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {activeModal === "penalties" && (
                    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
                        <div className="bg-gray-900 rounded-xl w-full max-w-2xl border border-gray-800 shadow-2xl animate-in zoom-in-95 duration-200">
                            {/* HEADER */}
                            <div className="p-6 text-center border-b border-gray-800 bg-gray-900/50">
                                <h3 className="text-2xl font-bold flex justify-center items-center gap-2 mb-2 text-yellow-200">
                                    <Trophy className="w-6 h-6" /> Disputa de Pênaltis
                                </h3>
                                <div className="flex justify-center items-center gap-12 text-6xl font-mono font-black mt-4 tracking-tighter">
                                    <div className="flex flex-col items-center">
                                        <span className="text-white drop-shadow-lg">{match.penaltiesA || 0}</span>
                                        <span className="text-xs text-gray-500 font-sans mt-2 uppercase tracking-widest font-bold">{teamA?.name}</span>
                                    </div>
                                    <span className="text-gray-700 font-light flex flex-col justify-start pb-8">:</span>
                                    <div className="flex flex-col items-center">
                                        <span className="text-white drop-shadow-lg">{match.penaltiesB || 0}</span>
                                        <span className="text-xs text-gray-500 font-sans mt-2 uppercase tracking-widest font-bold">{teamB?.name}</span>
                                    </div>
                                </div>
                            </div>

                            {/* VISUALIZATION */}
                            <div className="px-4 py-8 bg-black/30 border-b border-gray-800 overflow-x-auto">
                                {(() => {
                                    const shotsConfig = config.rules?.knockout?.penaltiesInitialCount || 5;
                                    const eventsA = match.events.filter(e => e.teamId === match.teamAId && (e.type === "penalty_goal" || e.type === "penalty_miss" || (e.type === "card_red" && e.observation?.includes("Pênalti"))));
                                    const eventsB = match.events.filter(e => e.teamId === match.teamBId && (e.type === "penalty_goal" || e.type === "penalty_miss" || (e.type === "card_red" && e.observation?.includes("Pênalti"))));

                                    const maxShots = Math.max(shotsConfig, eventsA.length + 1, eventsB.length + 1);
                                    const slots = Array.from({ length: maxShots }, (_, i) => i);

                                    return (
                                        <div className="space-y-4 min-w-max mx-auto px-4">
                                            {/* Team A Row */}
                                            <div className="flex items-center gap-4">
                                                <div className="w-32 text-right text-xs font-bold text-gray-400 truncate">{teamA?.name}</div>
                                                <div className="flex gap-2">
                                                    {slots.map(i => {
                                                        const event = eventsA[i];
                                                        const isGoal = event?.type === "penalty_goal" || (event?.type === "goal" && event?.value === 0 && event?.observation?.includes("Pênalti"));
                                                        const isMiss = event?.type === "penalty_miss" || event?.type === "card_red";

                                                        if (isGoal) return <div key={i} className="w-10 h-10 flex items-center justify-center bg-green-500 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.5)] text-lg animate-in zoom-in spin-in-12" title="Gol">⚽</div>;
                                                        if (isMiss) return <div key={i} className="w-10 h-10 flex items-center justify-center bg-red-600 rounded-lg shadow-lg text-white font-bold text-xl animate-in zoom-in" title="Perdeu">X</div>;
                                                        return <div key={i} className="w-10 h-10 border-2 border-dashed border-gray-700/50 rounded-lg bg-gray-800/20" />
                                                    })}
                                                </div>
                                            </div>

                                            {/* Team B Row */}
                                            <div className="flex items-center gap-4">
                                                <div className="w-32 text-right text-xs font-bold text-gray-400 truncate">{teamB?.name}</div>
                                                <div className="flex gap-2">
                                                    {slots.map(i => {
                                                        const event = eventsB[i];
                                                        const isGoal = event?.type === "penalty_goal" || (event?.type === "goal" && event?.value === 0 && event?.observation?.includes("Pênalti"));
                                                        const isMiss = event?.type === "penalty_miss" || event?.type === "card_red";

                                                        if (isGoal) return <div key={i} className="w-10 h-10 flex items-center justify-center bg-green-500 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.5)] text-lg animate-in zoom-in spin-in-12" title="Gol">⚽</div>;
                                                        if (isMiss) return <div key={i} className="w-10 h-10 flex items-center justify-center bg-red-600 rounded-lg shadow-lg text-white font-bold text-xl animate-in zoom-in" title="Perdeu">X</div>;
                                                        return <div key={i} className="w-10 h-10 border-2 border-dashed border-gray-700/50 rounded-lg bg-gray-800/20" />
                                                    })}
                                                </div>
                                            </div>

                                            <div className="text-center text-[10px] text-gray-500 font-mono pt-2">
                                                {maxShots > shotsConfig ? "PENALTIS ALTERNADOS (MORTE SÚBITA)" : `Série Regular: ${shotsConfig} cobrancas`}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* TURN SELECT */}
                            {!match.firstPenaltyTeamId && (<div className="p-8 bg-gray-950 border-y border-gray-800 text-center"><div className="text-white font-black text-xl uppercase tracking-tighter mb-6">Quem inicia as cobranças?</div><div className="flex gap-4 max-w-lg mx-auto"><button onClick={() => updateMatch(matchId, { firstPenaltyTeamId: teamA?.id })} className="flex-1 p-6 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl border-b-4 border-blue-800 transition-all uppercase">{teamA?.name || 'Time A'}</button><button onClick={() => updateMatch(matchId, { firstPenaltyTeamId: teamB?.id })} className="flex-1 p-6 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl border-b-4 border-red-800 transition-all uppercase">{teamB?.name || 'Time B'}</button></div></div>)}
                            {/* CONTROLS */}
                            <div className="p-8 grid grid-cols-2 gap-8 bg-gray-900">
                                <div className="space-y-3 p-4 bg-gray-950/30 rounded-xl border border-gray-800/50">
                                    <div className="text-center text-xs font-bold mb-2 text-gray-400 uppercase tracking-widest">{teamA?.name}</div>
                                    <button disabled={!!match.firstPenaltyTeamId && (match.events.filter(e => e.type === 'penalty_goal' || e.type === 'penalty_miss').length % 2 === 0 ? match.firstPenaltyTeamId !== teamA?.id : match.firstPenaltyTeamId === teamA?.id)} onClick={() => setPenaltyCapture({ teamId: match.teamAId, scored: true })} className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 disabled:opacity-20 disabled:grayscale transition-all hover:from-green-500 hover:to-emerald-500 hover:shadow-lg hover:translate-y-[-2px] active:translate-y-[1px] transition-all rounded-xl text-white font-black text-lg shadow-green-900/20">
                                        GOL
                                    </button>
                                    <button disabled={!!match.firstPenaltyTeamId && (match.events.filter(e => e.type === 'penalty_goal' || e.type === 'penalty_miss').length % 2 === 0 ? match.firstPenaltyTeamId !== teamA?.id : match.firstPenaltyTeamId === teamA?.id)} onClick={() => setPenaltyCapture({ teamId: match.teamAId, scored: false })} className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-600 disabled:opacity-20 disabled:grayscale transition-all hover:from-red-500 hover:to-rose-500 hover:shadow-lg hover:translate-y-[-2px] active:translate-y-[1px] transition-all rounded-xl text-white font-black text-lg shadow-red-900/20 opacity-90">
                                        PERDEU (X)
                                    </button>
                                </div>
                                <div className="space-y-3 p-4 bg-gray-950/30 rounded-xl border border-gray-800/50">
                                    <div className="text-center text-xs font-bold mb-2 text-gray-400 uppercase tracking-widest">{teamB?.name}</div>
                                    <button disabled={!!match.firstPenaltyTeamId && (match.events.filter(e => e.type === 'penalty_goal' || e.type === 'penalty_miss').length % 2 === 0 ? match.firstPenaltyTeamId !== teamB?.id : match.firstPenaltyTeamId === teamB?.id)} onClick={() => setPenaltyCapture({ teamId: match.teamBId, scored: true })} className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 disabled:opacity-20 disabled:grayscale transition-all hover:from-green-500 hover:to-emerald-500 hover:shadow-lg hover:translate-y-[-2px] active:translate-y-[1px] transition-all rounded-xl text-white font-black text-lg shadow-green-900/20">
                                        GOL
                                    </button>
                                    <button disabled={!!match.firstPenaltyTeamId && (match.events.filter(e => e.type === 'penalty_goal' || e.type === 'penalty_miss').length % 2 === 0 ? match.firstPenaltyTeamId !== teamB?.id : match.firstPenaltyTeamId === teamB?.id)} onClick={() => setPenaltyCapture({ teamId: match.teamBId, scored: false })} className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-600 disabled:opacity-20 disabled:grayscale transition-all hover:from-red-500 hover:to-rose-500 hover:shadow-lg hover:translate-y-[-2px] active:translate-y-[1px] transition-all rounded-xl text-white font-black text-lg shadow-red-900/20 opacity-90">
                                        PERDEU (X)
                                    </button>
                                </div>
                            </div>

                            {/* Penalty Atleta Selection */}
                            {penaltyCapture && (
                                <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4">
                                    <div className="bg-gray-900 rounded-2xl w-full max-w-sm border-2 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                                        <div className="p-5 border-b border-gray-800 flex justify-between items-center">
                                            <h3 className="text-lg font-bold text-white uppercase tracking-tighter">
                                                {penaltyCapture.scored ? "⚽ Quem marcou?" : "❌ Quem perdeu?"}
                                            </h3>
                                            <button onClick={() => setPenaltyCapture(null)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
                                        </div>
                                        <div className="p-4 grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto">
                                            {(penaltyCapture.teamId === teamA?.id ? playersA : playersB).map(player => (
                                                <button key={player.id} onClick={() => handlePenaltyScore(penaltyCapture.teamId, penaltyCapture.scored, player.id)} className="p-3 bg-gray-800 hover:bg-emerald-900/30 rounded-xl text-left flex items-center gap-3 border border-gray-700 hover:border-emerald-500/50 transition-all group">
                                                    <div className="w-8 h-8 rounded-lg bg-gray-950 flex items-center justify-center font-bold text-sm text-emerald-500 border border-gray-800 group-hover:border-emerald-500/30">{player.number}</div>
                                                    <div className="truncate text-sm font-bold text-gray-200 group-hover:text-emerald-400">{player.name}</div>
                                                </button>
                                            ))}
                                            <button onClick={() => handlePenaltyScore(penaltyCapture.teamId, penaltyCapture.scored, undefined)} className="col-span-2 p-3 border-2 border-dashed border-gray-800 text-gray-600 hover:bg-gray-800/50 hover:text-gray-400 rounded-xl text-xs font-bold uppercase transition-all">Não identificado</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="p-4 bg-gray-950 flex justify-center border-t border-gray-800 rounded-b-xl">
                                <div className="flex gap-4 w-full px-4">
                                    <button onClick={() => setAnnulModal({ isOpen: true, type: "penalty", teamId: "" })} className="flex-1 py-3 text-red-500 text-xs font-bold uppercase tracking-widest border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"><ShieldAlert className="w-4 h-4" /> Anular Cobranca</button>
                                    <button onClick={() => { finishMatch(); if (match.period === "penalties") updateMatch(matchId, { status: "finished" }); }} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-widest rounded-lg shadow-lg hover:shadow-red-900/30 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]">
                                        <CheckCircle className="w-4 h-4" /> Encerrar Disputa
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeModal === "goal" && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-end md:items-center justify-center p-4">
                        <div className="bg-gray-900 rounded-xl w-full max-w-sm border border-gray-800 animate-in slide-in-from-bottom-10 md:zoom-in-95">
                            <div className="p-4 border-b border-gray-800"><h3 className="text-lg font-bold text-white flex items-center gap-2"><span className="text-2xl mr-2">⚽</span> Quem fez o gol?</h3></div>
                            <div className="p-4 grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto">
                                {(selectedTeamId === teamA?.id ? playersA : playersB).map(player => (
                                    <button key={player.id} onClick={() => handleGoal(player.id)} className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-left flex items-center gap-3 border border-gray-700 hover:border-gray-500 transition-all">
                                        <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center font-bold text-sm text-gray-400 border border-gray-700">{player.number}</div>
                                        <div className="truncate text-sm font-medium">{player.name}</div>
                                    </button>
                                ))}
                                <button onClick={() => handleGoal(undefined)} className="col-span-2 p-3 border border-dashed border-gray-700 text-gray-500 hover:bg-gray-800 rounded-lg text-sm">Não identificado / Gol Contra</button>
                            </div>
                            <button onClick={() => setActiveModal(null)} className="w-full p-4 text-center text-gray-500 hover:text-white border-t border-gray-800">Cancelar</button>
                        </div>
                    </div>
                )}

                {activeModal === "substitution" && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-end md:items-center justify-center p-4">
                        <div className="bg-gray-900 rounded-xl w-full max-w-sm border border-gray-800 animate-in slide-in-from-bottom-10 md:zoom-in-95">
                            <div className="p-4 border-b border-gray-800">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <span className="text-2xl mr-1">🔄</span>
                                    {!subPlayerOut ? "Quem SAI?" : "Quem ENTRA?"}
                                </h3>
                                {subPlayerOut && (
                                    <p className="text-xs text-cyan-400 mt-1">
                                        Saindo: <strong>{(selectedTeamId === teamA?.id ? playersA : playersB).find(p => p.id === subPlayerOut)?.name}</strong>
                                    </p>
                                )}
                            </div>
                            <div className="p-4 grid grid-cols-2 gap-2 max-h-[55vh] overflow-y-auto">
                                {(selectedTeamId === teamA?.id ? playersA : playersB)
                                    .filter(p => subPlayerOut ? p.id !== subPlayerOut : true)
                                    .map(player => (
                                        <button
                                            key={player.id}
                                            onClick={() => {
                                                if (!subPlayerOut) {
                                                    setSubPlayerOut(player.id);
                                                } else {
                                                    // Register substitution: playerOut = subPlayerOut, playerIn = player.id
                                                    const playerOut = (selectedTeamId === teamA?.id ? playersA : playersB).find(p => p.id === subPlayerOut);
                                                    const playerIn = player;
                                                    const obs = `Substituição: ${playerOut?.name ?? "?"} ↔ ${playerIn.name}`;
                                                    addMatchEvent(matchId, {
                                                        type: "substitution",
                                                        teamId: selectedTeamId!,
                                                        playerId: subPlayerOut,       // who went OUT
                                                        playerInId: playerIn.id,      // who came IN
                                                        observation: obs,
                                                        matchTime: timer,
                                                        timestamp: Date.now()
                                                    });
                                                    setSubPlayerOut(null);
                                                    setActiveModal(null);
                                                }
                                            }}
                                            className={`p-3 rounded-lg text-left flex items-center gap-3 border transition-all ${!subPlayerOut && player.isStarter
                                                    ? "bg-green-900/30 border-green-700 hover:bg-green-900/50"
                                                    : "bg-gray-800 border-gray-700 hover:bg-gray-700 hover:border-gray-500"
                                                }`}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center font-bold text-sm text-gray-400 border border-gray-700 shrink-0">{player.number}</div>
                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-medium">{player.name}</div>
                                                {player.isStarter && <div className="text-[10px] text-green-400">Titular</div>}
                                            </div>
                                        </button>
                                    ))}
                            </div>
                            <div className="flex border-t border-gray-800">
                                {subPlayerOut && (
                                    <button onClick={() => setSubPlayerOut(null)} className="flex-1 p-4 text-center text-yellow-400 hover:text-white text-sm font-bold border-r border-gray-800">
                                        ← Voltar
                                    </button>
                                )}
                                <button onClick={() => { setActiveModal(null); setSubPlayerOut(null); }} className="flex-1 p-4 text-center text-gray-500 hover:text-white text-sm">
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeModal === "card" && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-end md:items-center justify-center p-4">
                        <div className="bg-gray-900 rounded-xl w-full max-w-sm border border-gray-800 animate-in slide-in-from-bottom-10 md:zoom-in-95">
                            {!selectedCardType ? (
                                <div className="p-6 grid grid-cols-2 gap-4">
                                    <button onClick={() => setSelectedCardType("yellow")} className="p-6 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/50 rounded-xl flex flex-col items-center gap-2 text-yellow-400"><div className="w-8 h-12 bg-yellow-500 rounded-sm shadow-lg shadow-yellow-900/50" /><span className="font-bold">Amarelo</span></button>
                                    <button onClick={() => setSelectedCardType("red")} className="p-6 bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 rounded-xl flex flex-col items-center gap-2 text-red-400"><div className="w-8 h-12 bg-red-600 rounded-sm shadow-lg shadow-red-900/50" /><span className="font-bold">Vermelho</span></button>
                                </div>
                            ) : (
                                <>
                                    <div className="p-4 border-b border-gray-800"><h3 className="text-lg font-bold text-white">Para quem é o cartão?</h3></div>
                                    <div className="p-4 grid grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto">
                                        {(selectedTeamId === teamA?.id ? playersA : playersB).map(player => {
                                            const { yellowCards, isExpelled } = getPlayerCardStatus(player.id);
                                            return (
                                                <button
                                                    key={player.id}
                                                    onClick={() => handleCard(player.id)}
                                                    disabled={isExpelled}
                                                    className={`p-3 rounded-lg text-left flex items-center gap-3 border transition-all relative overflow-hidden
                                            ${isExpelled ? "bg-red-900/20 border-red-900/40 opacity-50 cursor-not-allowed" :
                                                            yellowCards === 1 ? "bg-yellow-900/20 border-yellow-500/50 hover:bg-yellow-900/30" :
                                                                "bg-gray-800 border-gray-700 hover:bg-gray-700"}
                                        `}
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center font-bold text-sm text-gray-400 border border-gray-700">{player.number}</div>
                                                    <div className="truncate text-sm font-medium">{player.name}</div>
                                                    {yellowCards === 1 && !isExpelled && (
                                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-6 bg-yellow-500 rounded-sm shadow shadow-black" title="Tem 1 Amarelo" />
                                                    )}
                                                    {isExpelled && (
                                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500 font-bold text-xs uppercase">Expulso</div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                        <button onClick={() => handleCard(undefined)} className="col-span-2 p-3 text-gray-500 hover:bg-gray-800 rounded-lg text-sm border border-dashed border-gray-700">Comissão Técnica / Banco</button>
                                    </div>
                                </>
                            )}
                            <button onClick={() => { setActiveModal(null); setSelectedCardType(null); }} className="w-full p-4 text-center text-gray-500 hover:text-white border-t border-gray-800">Cancelar</button>
                        </div>
                    </div>
                )}

                {activeModal === "sumula" && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                        <div className="bg-gray-900 rounded-xl w-full max-w-2xl border border-gray-800 animate-in zoom-in-95">
                            <div className="p-4 border-b border-gray-800"><h3 className="text-lg font-bold text-white flex items-center gap-2"><FileText className="text-blue-400" /> Súmula / Ocorrências</h3></div>
                            <div className="p-4"><textarea value={sumulaText} onChange={e => setSumulaText(e.target.value)} className="w-full h-64 bg-gray-950 border border-gray-700 rounded-lg p-4 text-white focus:ring-2 focus:ring-blue-500 font-mono text-sm leading-relaxed" placeholder="Relate as ocorrências..." /></div>
                            <div className="p-4 border-t border-gray-800 flex justify-end gap-2 bg-gray-950/30">
                                <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-gray-500 hover:text-white">Cancelar</button>
                                <button onClick={addSumulaToTimeline} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-sm">Adicionar à Linha do Tempo</button>
                            </div>
                        </div>
                    </div>
                )}
                {woModalOpen && (
                    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
                        <div className="bg-gray-800 rounded-xl w-full max-w-sm p-6 border border-gray-700">
                            <h3 className="text-xl font-bold text-white mb-4 text-center">Declarar W.O.</h3>
                            <p className="text-gray-400 text-center mb-6 text-sm">Selecione o time vencedor. O placar sera ajustado par 3x0 e a partida encerrada.</p>

                            <div className="space-y-3">
                                <button
                                    onClick={() => handleWO(teamA?.id || "")}
                                    className="w-full p-4 bg-blue-600/20 border border-blue-500/50 hover:bg-blue-600/40 rounded-lg text-blue-400 font-bold"
                                >
                                    Vitoria {teamA?.name} (3x0)
                                </button>
                                <button
                                    onClick={() => handleWO(teamB?.id || "")}
                                    className="w-full p-4 bg-red-600/20 border border-red-500/50 hover:bg-red-600/40 rounded-lg text-red-400 font-bold"
                                >
                                    Vitoria {teamB?.name} (3x0)
                                </button>
                                <button
                                    onClick={() => setWoModalOpen(false)}
                                    className="w-full p-3 text-gray-500 hover:text-white mt-2"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {annulModal.isOpen && (
                    <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4">
                        <div className="bg-gray-900 rounded-xl w-full max-w-sm p-6 border border-red-900/50 shadow-2xl animate-in zoom-in-95 duration-200">
                            <h3 className="text-xl font-bold text-white mb-2 text-center flex items-center justify-center gap-2">
                                <ShieldAlert className="text-red-500" /> JUSTIFICAR ANULACAO
                            </h3>
                            <p className="text-gray-400 text-sm mb-4 text-center">
                                Diga o motivo da anulacao do {annulModal.type === "goal" ? "gol" : "penalti"}:
                            </p>
                            <textarea value={annulReason} onChange={e => setAnnulReason(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl p-4 text-white mb-4 h-32 focus:ring-2 focus:ring-red-500 outline-none resize-none" placeholder="Ex: Impedimento, falta, erro na cobranca..." />
                            <div className="flex gap-3">
                                <button onClick={() => { setAnnulModal({ ...annulModal, isOpen: false }); setAnnulReason(""); }} className="flex-1 py-3 text-gray-500 font-bold hover:text-white transition-colors">VOLTAR</button>
                                <button onClick={annulModal.type === "goal" ? handleAnnulGoal : handleAnnulPenalty} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl shadow-lg shadow-red-900/20 transition-all uppercase">CONFIRMAR</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}