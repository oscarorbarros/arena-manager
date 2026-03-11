"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  BTConfig, DEFAULT_BT_CONFIG, BTMatch, BTEvent, BTEventType,
  BTPair, BTMatchPhase, BTCategory, getSetTarget, checkMatchWinner, isTiebreakTriggered
} from "./bt-types";

interface BTContextType {
  config: BTConfig;
  setConfig: React.Dispatch<React.SetStateAction<BTConfig>>;
  addGame: (matchId: string, winnerSide: 'A' | 'B') => void;
  addTiebreakPoint: (matchId: string, winnerSide: 'A' | 'B') => void;
  startMatch: (matchId: string) => void;
  finishMatch: (matchId: string, closedBy?: string) => void;
  registerWalkover: (matchId: string, winnerSide: 'A' | 'B') => void;
  updatePairStats: () => void;
  generateGroupMatches: (category: BTCategory, phase?: BTMatchPhase) => void;
}

const BTContext = createContext<BTContextType | undefined>(undefined);

export function BTProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<BTConfig>(DEFAULT_BT_CONFIG);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from server (Supabase) or localStorage
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/beach-tennis');
        if (res.ok) {
          const data = await res.json();
          if (data && Object.keys(data).length > 0) {
            setConfig({ ...DEFAULT_BT_CONFIG, ...data });
            setIsLoaded(true);
            return;
          }
        }
      } catch {
        // Server not available
      }
      // Fallback: localStorage
      const saved = localStorage.getItem('bt_config');
      if (saved) {
        try { setConfig({ ...DEFAULT_BT_CONFIG, ...JSON.parse(saved) }); } catch { /* noop */ }
      }
      setIsLoaded(true);
    };
    load();
  }, []);

  // Save on every change
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('bt_config', JSON.stringify(config));
    fetch('/api/beach-tennis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    }).catch(() => {});
  }, [config, isLoaded]);

  const addEvent = (matchId: string, type: BTEventType, extras: Partial<BTEvent> = {}) => {
    setConfig(prev => ({
      ...prev,
      matches: prev.matches.map(m => {
        if (m.id !== matchId) return m;
        const event: BTEvent = {
          id: crypto.randomUUID(),
          type,
          timestamp: Date.now(),
          ...extras,
        };
        return { ...m, events: [...m.events, event] };
      })
    }));
  };

  const addGame = (matchId: string, winnerSide: 'A' | 'B') => {
    setConfig(prev => {
      const matches = prev.matches.map(m => {
        if (m.id !== matchId || m.status !== 'in_progress') return m;
        if (m.inTiebreak) return m; // tiebreak is handled separately

        const updated: BTMatch = {
          ...m,
          gamesA: winnerSide === 'A' ? m.gamesA + 1 : m.gamesA,
          gamesB: winnerSide === 'B' ? m.gamesB + 1 : m.gamesB,
          events: [...m.events, {
            id: crypto.randomUUID(),
            type: winnerSide === 'A' ? 'game_A' : 'game_B',
            timestamp: Date.now(),
            gameNumber: m.gamesA + m.gamesB + 1,
          }]
        };

        // Check tiebreak trigger
        if (isTiebreakTriggered(updated)) {
          return { ...updated, inTiebreak: true } as BTMatch;
        }

        // Check match winner
        const winner = checkMatchWinner(updated);
        if (winner) {
          return { ...updated, status: 'finished' as const, winner } as BTMatch;
        }

        return updated;
      }) as BTMatch[];

      return { ...prev, matches };
    });
  };

  const addTiebreakPoint = (matchId: string, winnerSide: 'A' | 'B') => {
    setConfig(prev => {
      const matches = prev.matches.map(m => {
        if (m.id !== matchId || !m.inTiebreak) return m;

        const updated: BTMatch = {
          ...m,
          tiebreakA: winnerSide === 'A' ? m.tiebreakA + 1 : m.tiebreakA,
          tiebreakB: winnerSide === 'B' ? m.tiebreakB + 1 : m.tiebreakB,
          events: [...m.events, {
            id: crypto.randomUUID(),
            type: winnerSide === 'A' ? 'tiebreak_point_A' : 'tiebreak_point_B',
            timestamp: Date.now(),
          }]
        };

        const winner = checkMatchWinner(updated);
        if (winner) {
          return { ...updated, status: 'finished' as const, winner };
        }

        return updated;
      }) as BTMatch[];

      return { ...prev, matches };
    });
  };

  const startMatch = (matchId: string) => {
    setConfig(prev => ({
      ...prev,
      matches: prev.matches.map(m => m.id === matchId
        ? { ...m, status: 'in_progress', events: [...m.events, { id: crypto.randomUUID(), type: 'start', timestamp: Date.now() }] }
        : m
      )
    }));
  };

  const finishMatch = (matchId: string, closedBy?: string) => {
    setConfig(prev => ({
      ...prev,
      matches: prev.matches.map(m => {
        if (m.id !== matchId) return m;
        const winner = m.winner || (m.gamesA > m.gamesB ? 'A' : 'B');
        return {
          ...m,
          status: 'finished',
          winner,
          events: [...m.events, {
            id: crypto.randomUUID(),
            type: 'end',
            timestamp: Date.now(),
            observation: closedBy ? `Encerrado por: ${closedBy}` : undefined
          }]
        };
      })
    }));
  };

  const registerWalkover = (matchId: string, winnerSide: 'A' | 'B') => {
    // Art. 27 §único: WxO placar 6x0
    setConfig(prev => ({
      ...prev,
      matches: prev.matches.map(m => m.id !== matchId ? m : {
        ...m,
        status: 'finished',
        isWalkover: true,
        winner: winnerSide,
        gamesA: winnerSide === 'A' ? 6 : 0,
        gamesB: winnerSide === 'B' ? 6 : 0,
        events: [...m.events, { id: crypto.randomUUID(), type: 'wo', timestamp: Date.now(), observation: `W x O — ${winnerSide === 'A' ? 'Dupla A' : 'Dupla B'} venceu` }]
      })
    }));
  };

  const updatePairStats = () => {
    setConfig(prev => {
      const pairStats: Record<string, BTPair['stats']> = {};
      prev.pairs.forEach(p => {
        pairStats[p.id] = { points: 0, played: 0, won: 0, lost: 0, wo: 0, gamesFor: 0, gamesAgainst: 0, gameDifference: 0 };
      });

      prev.matches.filter(m => m.status === 'finished').forEach(m => {
        const a = pairStats[m.pairAId];
        const b = pairStats[m.pairBId];
        if (!a || !b) return;

        a.played++; b.played++;
        a.gamesFor += m.gamesA; a.gamesAgainst += m.gamesB;
        b.gamesFor += m.gamesB; b.gamesAgainst += m.gamesA;
        a.gameDifference = a.gamesFor - a.gamesAgainst;
        b.gameDifference = b.gamesFor - b.gamesAgainst;

        if (m.isWalkover) {
          if (m.winner === 'A') { a.won++; a.points += 3; b.wo++; }
          else { b.won++; b.points += 3; a.wo++; }
        } else if (m.winner === 'A') {
          a.won++; a.points += 3; b.lost++; b.points += 1;
        } else {
          b.won++; b.points += 3; a.lost++; a.points += 1;
        }
      });

      return {
        ...prev,
        pairs: prev.pairs.map(p => pairStats[p.id] ? { ...p, stats: pairStats[p.id] } : p)
      };
    });
  };

  const generateGroupMatches = (category: BTCategory, phase: BTMatchPhase = 'group') => {
    const target = getSetTarget(phase);
    const pairs = config.pairs.filter(p => p.category === category && p.group);
    
    // Group by letter
    const groups: Record<string, BTPair[]> = {};
    pairs.forEach(p => {
      if (!p.group) return;
      if (!groups[p.group]) groups[p.group] = [];
      groups[p.group].push(p);
    });

    const newMatches: BTMatch[] = [];
    Object.entries(groups).forEach(([group, gpairs]) => {
      // All vs all within group
      for (let i = 0; i < gpairs.length; i++) {
        for (let j = i + 1; j < gpairs.length; j++) {
          newMatches.push({
            id: crypto.randomUUID(),
            pairAId: gpairs[i].id,
            pairBId: gpairs[j].id,
            category,
            phase,
            group,
            status: 'scheduled',
            gamesA: 0, gamesB: 0,
            setTarget: target,
            inTiebreak: false,
            tiebreakA: 0, tiebreakB: 0,
            substitutionsA: 0, substitutionsB: 0,
            events: [],
          });
        }
      }
    });

    if (newMatches.length > 0) {
      setConfig(prev => ({ ...prev, matches: [...prev.matches, ...newMatches] }));
    }
  };

  return (
    <BTContext.Provider value={{
      config, setConfig,
      addGame, addTiebreakPoint,
      startMatch, finishMatch, registerWalkover,
      updatePairStats, generateGroupMatches,
    }}>
      {children}
    </BTContext.Provider>
  );
}

export function useBT() {
  const ctx = useContext(BTContext);
  if (!ctx) throw new Error("useBT must be used within BTProvider");
  return ctx;
}
