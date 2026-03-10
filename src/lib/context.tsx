"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { TournamentConfig, DEFAULT_CONFIG, Match, MatchEvent } from "./types";
import { generateMatchReport, NewsStory, generateChampionNews } from "./news-engine";
import { TournamentEngine } from "./tournament-engine";

interface TournamentContextType {
  config: TournamentConfig;
  news: NewsStory[];
  setConfig: React.Dispatch<React.SetStateAction<TournamentConfig>>;
  setNews: React.Dispatch<React.SetStateAction<NewsStory[]>>;
  updateMatch: (matchId: string, updates: Partial<Match>) => void;
  updateMatchWithEvent: (matchId: string, updates: Partial<Match>, eventData?: Omit<MatchEvent, "id" | "timestamp" | "matchTime">) => void;
  addMatchEvent: (matchId: string, event: Omit<MatchEvent, "id" | "timestamp" | "matchTime">) => void;
  resetTournament: () => void;
  generateNextStage: () => void;
  deleteNews: (id: string) => void;
  deleteAllNews: () => void;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export function TournamentProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<TournamentConfig>(DEFAULT_CONFIG);
  const [news, setNews] = useState<NewsStory[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const generatingPhase = React.useRef(false);

  useEffect(() => {
    
    const loadFromStorage = async () => {
        // Try to load from server FIRST
        try {
            const hostname = window.location.hostname;
            const configRes = await fetch(`http://${hostname}:3001/api/config`);
            const newsRes = await fetch(`http://${hostname}:3001/api/news`);
            
            if (configRes.ok && newsRes.ok) {
                const srvConfig = await configRes.json();
                const srvNews = await newsRes.json();
                
                if (srvConfig && Object.keys(srvConfig).length > 0) {
                    console.log("?? Data loaded from Server");
                    setConfig(srvConfig);
                    if (srvNews) setNews(srvNews);
                    setIsLoaded(true);
                    return;
                }
            }
        } catch (e) {
            console.warn("?? Server API not available, falling back to LocalStorage", e);
        }

        // Fallback to LocalStorage
        const savedConfig = localStorage.getItem("tournament_config");
        const savedNews = localStorage.getItem("tournament_news");
        
        if (savedConfig) {
            try { 
                const parsed = JSON.parse(savedConfig);
                if (!parsed.users) parsed.users = DEFAULT_CONFIG.users;
                if (!parsed.teams) parsed.teams = [];
                if (!parsed.matches) parsed.matches = [];
                setConfig(parsed); 
            } catch (e) { console.error(e); }
        }
        if (savedNews) {
            try { setNews(JSON.parse(savedNews)); } catch (e) { console.error(e); }
        }
        setIsLoaded(true);
    };


    const handleStorage = (e: StorageEvent) => {
        if (e.key === "tournament_config" || e.key === "tournament_news") {
            loadFromStorage();
        }
    };

    loadFromStorage();
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("tournament_config", JSON.stringify(config));
      fetch(`http://${window.location.hostname}:3001/api/config`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(config) }).catch(() => {});
    }
  }, [config, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      console.log("?? Context: Salvando notícias no localStorage. Total:", news.length);
      localStorage.setItem("tournament_news", JSON.stringify(news));
      fetch(`http://${window.location.hostname}:3001/api/news`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(news) }).catch(() => {});
    }
  }, [news, isLoaded]);

  // Manual Generation & Sanitization
  const generateNextStage = () => {
    if (config.status !== "active") return;
    
    const groupMatches = config.matches.filter(m => m.stage === "group");
    const knockoutMatches = config.matches.filter(m => m.stage === "knockout");
    
    if (groupMatches.length > 0 && knockoutMatches.length === 0) {
        const allFinished = groupMatches.every(m => m.status === "finished");
        
        if (allFinished) {
            console.log("Gerando Mata-Mata...");
            try {
                const newKnockout = TournamentEngine.generateKnockoutBracket(
                    config.teams, 
                    config.matches, 
                    config.sports[0].id, 
                    config.structure?.qualifiersPerGroup || 2, 
                    config.structure?.wildcards || 0
                );

                if (newKnockout.length > 0) {
                    const newsItem: NewsStory = {
                        id: crypto.randomUUID(),
                        headline: "Fase de Grupos Encerrada! Mata-Mata Definido",
                        matchId: "announcement_" + Date.now(),
                        timestamp: Date.now(),
                        body: `A fase de grupos chegou ao fim! ${newKnockout.length} jogos foram definidos para a proxima fase (${newKnockout[0].round}). Confira a tabela atualizada!`,
                        imageUrl: "/news-knockout.jpg"
                    };

                    setConfig(prev => ({
                        ...prev,
                        matches: [...prev.matches, ...newKnockout]
                    }));
                    setNews(prev => [newsItem, ...prev]);
                    alert("Mata-mata gerado com sucesso!");
                }
            } catch (e) {
                console.error("Erro ao gerar mata-mata:", e);
                alert("Erro ao gerar mata-mata.");
            }
        } else {
            alert("Ainda existem jogos da fase de grupos pendentes.");
        }
    } else if (knockoutMatches.length > 0) {
        // Check active round
        const activeMatches = knockoutMatches.filter(m => m.status !== "finished");
        
        if (activeMatches.length > 0) {
            alert("Ainda existem jogos pendentes na fase atual.");
            return;
        }

        // All finished. Generate next round.
        // Identify the latest round and generate subsequent one
        const currentRounds = new Set(knockoutMatches.map(m => m.round));
        // If Final exists, tournament over
        if (currentRounds.has("Final") && knockoutMatches.find(m => m.round === "Final" && m.status === "finished")) {
             alert("Torneio Encerrado! Campeão Definido.");
             return;
        }

        try {
            // Find winners of the last added matches (latest round)
            // But how do we distinguish rounds if we just have a flat list?
            // Rely on `TournamentEngine` strict round logic or creation time.
            const nextRound = TournamentEngine.generateNextKnockoutRound(config.teams, config.matches);
            
            if (nextRound.length > 0) {
                 const newsItem: NewsStory = {
                        id: crypto.randomUUID(),
                        headline: `${nextRound[0].round} Definida!`,
                        matchId: "announcement_" + Date.now(),
                        timestamp: Date.now(),
                        body: `A fase de ${nextRound[0].round} do mata-mata foi definida. Confira os confrontos!`,
                        imageUrl: "/news-knockout.jpg"
                 };
                 
                 setConfig(prev => ({
                     ...prev,
                     matches: [...prev.matches, ...nextRound]
                 }));
                 setNews(prev => [newsItem, ...prev]);
                 alert(`Próxima fase gerada: ${nextRound[0].round}`);
            } else {
                 alert("Não foi possível gerar a próxima fase (Verifique se há vencedores definidos).");
            }
        } catch (e) {
            console.error(e);
            alert("Erro ao avançar fase.");
        }
    }
  };

  // Dedup Sanitizer (Runs once on load/change to fix duplicates)
  useEffect(() => {
      if (!isLoaded || config.matches.length === 0) return;

      const knockoutMatches = config.matches.filter(m => m.stage === "knockout");
      if (knockoutMatches.length > 0) {
          const uniqueKeys = new Set();
          const duplicates = [];

          knockoutMatches.forEach(m => {
              // Create a unique signature for the match (Stage + Teams)
              // Sort teams to ensure A vs B is same as B vs A if logic allowed (but here order matters for seeds)
              // Actually for duplicates created by re-running generated logic, they will be identical copies with different IDs
              // But teamAId and teamBId will be same.
              const key = `${m.round}-${m.teamAId}-${m.teamBId}`; 
              if (uniqueKeys.has(key)) {
                  duplicates.push(m.id);
              } else {
                  uniqueKeys.add(key);
              }
          });

          if (duplicates.length > 0) {
              console.warn(`Removing ${duplicates.length} duplicate knockout matches.`);
              setConfig(prev => ({
                  ...prev,
                  matches: prev.matches.filter(m => !duplicates.includes(m.id))
              }));
          }
      }
  }, [isLoaded, config.matches.length]); // Runs when matches change

/*   // Match Reports Logic
  useEffect(() => {
    if (!isLoaded) return;

    config.matches.forEach(match => {
        if (match.status === "finished") {
             // Check if news already exists strictly by matchId
             const exists = news.some(n => n.matchId === match.id);
             
             if (!exists) {
                 const sport = config.sports.find(s => s.id === match.sportId);
                 const teamA = config.teams.find(t => t.id === match.teamAId);
                 const teamB = config.teams.find(t => t.id === match.teamBId);
                 
                 if (sport && teamA && teamB) {
                    const story = generateMatchReport(match, sport, teamA, teamB);
                    setNews(prev => [story, ...prev]);
                 }
             }
        }
    });
  }, [config.matches, isLoaded]); */

  // AUTOMATIC PHASE PROGRESSION - DISABLED TO PREVENT LOOPS
  // Will trigger manually after each match finishes instead


  const checkAndGenerateNextPhase = React.useCallback(() => {
    if (config.status !== "active" || generatingPhase.current) return;
    
    const groupMatches = config.matches.filter(m => m.stage === "group");
    const knockoutMatches = config.matches.filter(m => m.stage === "knockout");
    
    // Case 1: All group matches finished, no knockout exists yet
    if (groupMatches.length > 0 && knockoutMatches.length === 0) {
        const allGroupFinished = groupMatches.every(m => m.status === "finished");
        
        if (allGroupFinished) {
            console.log("🏆 Fase de Grupos finalizada. Gerando Mata-Mata automaticamente...");
            generatingPhase.current = true;
            
            try {
                const newKnockout = TournamentEngine.generateKnockoutBracket(
                    config.teams, 
                    config.matches, 
                    config.sports[0].id, 
                    config.structure?.qualifiersPerGroup || 2, 
                    config.structure?.wildcards || 0
                );

                if (newKnockout.length > 0) {
                    // Get standings to show who qualified
                    const standings = TournamentEngine.calculateStandings(config.teams, groupMatches);
                    const groupKeys = Object.keys(standings).sort();
                    
                    let qualifiedList = "";
                    groupKeys.forEach(group => {
                        const top = standings[group].slice(0, config.structure?.qualifiersPerGroup || 2);
                        qualifiedList += `\n**Grupo ${group}:**\n`;
                        top.forEach((standing, idx) => {
                            const team = config.teams.find(t => t.id === standing.teamId);
                            qualifiedList += `${idx + 1}º - ${team?.name || "?"} (${standing.points} pts, ${standing.wins}V ${standing.draws}E ${standing.losses}D, SG: ${standing.goalDifference})\n`;
                        });
                    });
                    
                    // List matchups
                    let matchupsList = `\n**Confrontos de ${newKnockout[0].round}:**\n`;
                    newKnockout.forEach((match, idx) => {
                        const teamA = config.teams.find(t => t.id === match.teamAId);
                        const teamB = config.teams.find(t => t.id === match.teamBId);
                        matchupsList += `Jogo ${idx + 1}: ${teamA?.name || "?"} x ${teamB?.name || "?"}\n`;
                        if (match.observations) {
                            matchupsList += `   _(${match.observations})_\n`;
                        }
                    });
                    
                    const newsItem: NewsStory = {
                        id: crypto.randomUUID(),
                        headline: "🔥 Fase de Grupos Encerrada! Classificados Definidos",
                        matchId: "announcement_" + Date.now(),
                        timestamp: Date.now(),
                        body: `A fase de grupos chegou ao fim! Veja quem se classificou e os confrontos da próxima fase:\n${qualifiedList}\n${matchupsList}\n\nQue comecem os jogos eliminatórios! 🏆`,
                        imageUrl: "/news-knockout.jpg"
                    };

                    setConfig(prev => ({
                        ...prev,
                        matches: [...prev.matches, ...newKnockout]
                    }));
                    setNews(prev => [newsItem, ...prev]);
                    console.log(`✅ ${newKnockout[0].round} gerada com ${newKnockout.length} jogos`);
                }
            } catch (e) {
                console.error("❌ Erro ao gerar mata-mata:", e);
            } finally {
                setTimeout(() => { generatingPhase.current = false; }, 2000);
            }
        }
    }
    
    // Case 2: Knockout phase progression
    else if (knockoutMatches.length > 0) {
        const rounds = ["Oitavas", "Quartas", "Semi-Final", "Final"];
        const currentRounds = new Set(knockoutMatches.map(m => m.round));
        
        // Check if Final is finished
        if (currentRounds.has("Final")) {
            const finalMatch = knockoutMatches.find(m => m.round === "Final");
            if (finalMatch?.status === "finished") {
                console.log("🏆 CAMPEÃO DEFINIDO! Torneio encerrado.");
                
                // GENERATE CHAMPION NEWS
                const winnerId = finalMatch.scoreA > finalMatch.scoreB ? finalMatch.teamAId : 
                                 (finalMatch.scoreB > finalMatch.scoreA ? finalMatch.teamBId : 
                                 ((finalMatch.penaltiesA ?? 0) > (finalMatch.penaltiesB ?? 0) ? finalMatch.teamAId : finalMatch.teamBId));
                
                const winner = config.teams.find(t => t.id === winnerId);
                
                // Check if news already exists
                const exists = news.some(n => n.matchId.startsWith("champion_"));
                if (winner && !exists) {
                     const championNews = generateChampionNews(winner.name);
                     setNews(prev => [championNews, ...prev]);
                     // alert(`🏆 PARABÉNS ${winner.name}! CAMPEÃO DO TORNEIO!`);
                }

                return;
            }
        }
        
        // Find the latest active round
        let latestRound = "";
        for (let i = rounds.length - 1; i >= 0; i--) {
            if (currentRounds.has(rounds[i])) {
                latestRound = rounds[i];
                break;
            }
        }
        
        if (!latestRound) return;
        
        const currentRoundMatches = knockoutMatches.filter(m => m.round === latestRound);
        const allFinished = currentRoundMatches.every(m => m.status === "finished");
        
        const currentRoundIndex = rounds.indexOf(latestRound);
        const nextRoundName = rounds[currentRoundIndex + 1];
        const nextRoundExists = currentRounds.has(nextRoundName);
        
        console.log(`DEBUG: allFinished=${allFinished}, nextRoundExists=${nextRoundExists}, latestRound=${latestRound}`);
        if (allFinished && !nextRoundExists && latestRound !== "Final") {
            console.log(`🎯 ${latestRound} finalizada. Gerando ${nextRoundName} automaticamente...`);
            generatingPhase.current = true;
            
            try {
                const nextRound = TournamentEngine.generateNextKnockoutRound(config.teams, config.matches);
                
                if (nextRound.length > 0) {
                    // List winners from previous round
                    let winnersList = `\n**Classificados de ${latestRound}:**\n`;
                    const winners: string[] = [];
                    currentRoundMatches.forEach(m => {
                        const winnerId = m.scoreA > m.scoreB ? m.teamAId : m.scoreB > m.scoreA ? m.teamBId : m.teamAId;
                        winners.push(winnerId);
                        const winner = config.teams.find(t => t.id === winnerId);
                        const loser = config.teams.find(t => t.id === (winnerId === m.teamAId ? m.teamBId : m.teamAId));
                        winnersList += `✅ ${winner?.name || "?"} ${m.scoreA} x ${m.scoreB} ${loser?.name || "?"}\n`;
                    });
                    
                    // List next matchups
                    let matchupsList = `\n**Confrontos de ${nextRound[0].round}:**\n`;
                    nextRound.forEach((match, idx) => {
                        const teamA = config.teams.find(t => t.id === match.teamAId);
                        const teamB = config.teams.find(t => t.id === match.teamBId);
                        matchupsList += `🏆 Jogo ${idx + 1}: ${teamA?.name || "?"} x ${teamB?.name || "?"}\n`;
                    });
                    
                    const newsItem: NewsStory = {
                        id: crypto.randomUUID(),
                        headline: `⚡ ${nextRound[0].round} Definida!`,
                        matchId: "announcement_" + Date.now(),
                        timestamp: Date.now(),
                        body: `${latestRound} encerrada! Veja quem avançou e os confrontos da próxima fase:\n${winnersList}\n${matchupsList}\n\nA competição está cada vez mais acirrada! 🔥`,
                        imageUrl: "/news-knockout.jpg"
                    };
                    
                    setConfig(prev => ({
                        ...prev,
                        matches: [...prev.matches, ...nextRound]
                    }));
                    setNews(prev => [newsItem, ...prev]);
                    console.log(`✅ ${nextRound[0].round} gerada com ${nextRound.length} jogos`);
                }
            } catch (e) {
                console.error("❌ Erro ao gerar próxima fase:", e);
            } finally {
                setTimeout(() => { generatingPhase.current = false; }, 2000);
            }
        }
    }
  }, [config.matches, config.teams, config.sports, config.structure, config.status]);

  const updateMatch = (matchId: string, updates: Partial<Match>) => {
    setConfig(prev => {
      const updatedMatches = prev.matches.map(m => m.id === matchId ? { ...m, ...updates } : m);
      return { ...prev, matches: updatedMatches };
    });
    
    // Check if match was just finished and trigger phase progression
    if (updates.status === "finished") {
      // Manual News Generation (Moved here to allow deletion)
      const fullMatch = config.matches.find(m => m.id === matchId);
      if (fullMatch) {
           const updatedMatch = { ...fullMatch, ...updates };
           const sport = config.sports.find(s => s.id === updatedMatch.sportId);
           const teamA = config.teams.find(t => t.id === updatedMatch.teamAId);
           const teamB = config.teams.find(t => t.id === updatedMatch.teamBId);
           
           if (sport && teamA && teamB) {
                const story = generateMatchReport(updatedMatch, sport, teamA, teamB);
                setNews(prev => [story, ...prev]);
           }
      }

      setTimeout(() => {
        checkAndGenerateNextPhase();
      }, 1500);
    }
  };


  const updateMatchWithEvent = (matchId: string, updates: Partial<Match>, eventData?: Omit<MatchEvent, "id" | "timestamp" | "matchTime">) => {
    setConfig(prev => {
        const match = prev.matches.find(m => m.id === matchId);
        if (!match) return prev;

        const updatedMatch = { ...match, ...updates };

        if (eventData) {
            let elapsed = match.elapsedSeconds || 0;
            if (match.status === "live" && match.startTime) {
                elapsed += Math.floor((Date.now() - match.startTime) / 1000);
            }
            const currentMatchTime = Math.floor(elapsed / 60);

            const newEvent: MatchEvent = {
                ...eventData,
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                matchTime: currentMatchTime
            };
            updatedMatch.events = [...updatedMatch.events, newEvent];
        }

        return {
            ...prev,
            matches: prev.matches.map(m => m.id === matchId ? updatedMatch : m)
        };
    });

    if (updates.status === "finished") {
        const fullMatch = config.matches.find(m => m.id === matchId);
        if (fullMatch) {
            const updatedMatch = { ...fullMatch, ...updates };
            const sport = config.sports.find(s => s.id === updatedMatch.sportId);
            const teamA = config.teams.find(t => t.id === updatedMatch.teamAId);
            const teamB = config.teams.find(t => t.id === updatedMatch.teamBId);
            
            if (sport && teamA && teamB) {
                 const story = generateMatchReport(updatedMatch, sport, teamA, teamB);
                 setNews(prev => [story, ...prev]);
            }
        }
        setTimeout(() => { checkAndGenerateNextPhase(); }, 1500);
    }
  };

  const addMatchEvent = (matchId: string, eventData: Omit<MatchEvent, "id" | "timestamp" | "matchTime">) => {
    setConfig(prev => {
        const match = prev.matches.find(m => m.id === matchId);
        if (!match) return prev;
        
        let elapsed = match.elapsedSeconds || 0;
        if (match.status === "live" && match.startTime) {
            elapsed += Math.floor((Date.now() - match.startTime) / 1000);
        }
        const currentMatchTime = Math.floor(elapsed / 60);

        const newEvent: MatchEvent = {
            ...eventData,
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            matchTime: currentMatchTime
        };

        let newScoreA = match.scoreA;
        let newScoreB = match.scoreB;
        
        if (eventData.type === "goal" || (eventData.type === "point" && eventData.value && eventData.value > 0)) {
             if (eventData.teamId === match.teamAId) newScoreA += (eventData.value !== undefined ? eventData.value : 1);
             if (eventData.teamId === match.teamBId) newScoreB += (eventData.value !== undefined ? eventData.value : 1);
        } else if (eventData.value && eventData.value < 0) {
             if (eventData.teamId === match.teamAId) newScoreA += eventData.value;
             if (eventData.teamId === match.teamBId) newScoreB += eventData.value;
        }

        return {
            ...prev,
            matches: prev.matches.map(m => m.id === matchId ? {
                ...m,
                scoreA: Math.max(0, newScoreA),
                scoreB: Math.max(0, newScoreB),
                events: [...m.events, newEvent]
            } : m)
        };
    });
  };

  const deleteNews = (id: string) => {
      setNews(prev => {
          const updated = prev.filter(n => n.id !== id);
          localStorage.setItem("tournament_news", JSON.stringify(updated));
          return updated;
      });
  };

  const deleteAllNews = () => {
      console.log("DeleteAll triggered in Context");
      setNews([]);
      localStorage.setItem("tournament_news", JSON.stringify([]));
  };

  const resetTournament = () => {
    setConfig(DEFAULT_CONFIG);
    setNews([]);
    localStorage.removeItem("tournament_config");
    localStorage.removeItem("tournament_news");
  };


  // MONITOR MATCHES AND AUTO-GENERATE PHASES
  useEffect(() => {
    if (!isLoaded || config.status !== "active" || generatingPhase.current) return;
    
    const groupMatches = config.matches.filter(m => m.stage === "group");
    const knockoutMatches = config.matches.filter(m => m.stage === "knockout");
    
    // Check if ALL group matches are finished but no knockout exists
    if (groupMatches.length > 0 && knockoutMatches.length === 0) {
        const finishedCount = groupMatches.filter(m => m.status === "finished").length;
        const totalCount = groupMatches.length;
        
        console.log(`📊 Grupo: ${finishedCount}/${totalCount} partidas finalizadas`);
        
        if (finishedCount === totalCount) {
            console.log("🎯 TODAS as partidas de grupo finalizadas! Disparando geração automática...");
            // Trigger after delay
            setTimeout(() => {
                checkAndGenerateNextPhase();
            }, 2000);
        }
    }
    
    // Check knockout progression
    else if (knockoutMatches.length > 0) {
        const rounds = ["Oitavas", "Quartas", "Semi-Final", "Final"];
        const currentRounds = new Set(knockoutMatches.map(m => m.round));
        
        // Find latest active round
        let latestRound = "";
        for (let i = rounds.length - 1; i >= 0; i--) {
            if (currentRounds.has(rounds[i])) {
                latestRound = rounds[i];
                break;
            }
        }
        
        if (latestRound && latestRound !== "Final") {
            const currentRoundMatches = knockoutMatches.filter(m => m.round === latestRound);
            const finishedCount = currentRoundMatches.filter(m => m.status === "finished").length;
            const totalCount = currentRoundMatches.length;
            
            console.log(`📊 ${latestRound}: ${finishedCount}/${totalCount} partidas finalizadas`);
            
            const nextRoundIndex = rounds.indexOf(latestRound) + 1;
            const nextRound = rounds[nextRoundIndex];
            const nextExists = currentRounds.has(nextRound);
            
            if (finishedCount === totalCount && !nextExists) {
                console.log(`🎯 TODAS as partidas de ${latestRound} finalizadas! Disparando geração automática...`);
                setTimeout(() => {
                    checkAndGenerateNextPhase();
                }, 2000);
            }
        }
    }
  }, [config.matches.map(m => m.status).join(","), isLoaded, config.status]);

  if (!isLoaded) return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Carregando Arena...</div>;

  return (
    <TournamentContext.Provider value={{ config, news, setConfig, setNews, updateMatch, updateMatchWithEvent, addMatchEvent, resetTournament, generateNextStage, deleteNews, deleteAllNews }}>
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament() {
  const context = useContext(TournamentContext);
  if (context === undefined) {
    throw new Error("useTournament must be used within a TournamentProvider");
  }
  return context;
}
