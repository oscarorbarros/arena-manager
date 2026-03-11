"use client";
import React, { useEffect, useState } from "react";
import { useTournament } from "@/lib/context";
import { TournamentEngine } from "@/lib/tournament-engine";
import { Clock, TrendingUp, Trophy, ChevronRight, Newspaper } from "lucide-react";

export default function PublicPortal() {
  const { config, news, setConfig, setNews } = useTournament();
  
  // Computed Data
  const matches = config.matches.sort((a,b) => (b.startTime || 0) - (a.startTime || 0));
  const liveMatches = matches.filter(m => m.status === "live");
  const pastMatches = matches.filter(m => m.status === "finished").slice(0, 5);
  const standings = TournamentEngine.calculateStandings(config.teams, config.matches);

  const [now, setNow] = useState(Date.now());

  // 1-second update for the real-time scoreboard ticker
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
      // Auto-refresh data every 15 seconds for live matches and news (use ?t=cache_buster)
      const interval = setInterval(async () => {
          try {
              const cacheBuster = `?t=${Date.now()}`;
              const [configRes, newsRes] = await Promise.all([
                  fetch('/api/config' + cacheBuster),
                  fetch('/api/news' + cacheBuster)
              ]);
              if (configRes.ok && newsRes.ok) {
                  const srvConfig = await configRes.json();
                  const srvNews = await newsRes.json();
                  if (srvConfig && Object.keys(srvConfig).length > 0) {
                      setConfig(prev => ({...prev, ...srvConfig}));
                      if (srvNews) setNews(srvNews);
                  }
              }
          } catch (e) {
              console.warn("Auto-refresh skipped due to network");
          }
      }, 15000);
      return () => clearInterval(interval);
  }, [setConfig, setNews]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins}'`;
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      
      {/* 1. Breaking News Bar / Header */}
      <header className="bg-[#06aa48] text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="bg-white text-black font-black italic px-2 py-0.5 rounded transform -skew-x-12 text-sm md:text-xl">
                    O2R<span className="font-light">SPORTS</span>
                </div>
            </div>
            <div className="text-xs md:text-sm font-medium opacity-90 hidden md:block">
                O seu portal de esportes em tempo real
            </div>
            <button className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition">
                Login
            </button>
        </div>
      </header>

      {/* 2. Live Match Ticker */}
      {liveMatches.length > 0 && (
          <div className="bg-gray-900 text-white overflow-x-auto">
              <div className="max-w-7xl mx-auto flex gap-4 p-4">
                  {liveMatches.map(match => {
                       const teamA = config.teams.find(t => t.id === match.teamAId);
                       const teamB = config.teams.find(t => t.id === match.teamBId);
                       const timer = match.startTime ? Math.floor((now - match.startTime) / 1000) + (match.elapsedSeconds || 0) : (match.elapsedSeconds || 0);

                       return (
                           <div key={match.id} className="flex-shrink-0 w-64 bg-gray-800 rounded-lg p-3 border border-gray-700 relative overflow-hidden group hover:border-[#06aa48] transition-colors cursor-pointer">
                               <div className="absolute top-0 left-0 w-1 h-full bg-[#06aa48] animate-pulse" />
                               <div className="flex justify-between items-center mb-2 text-xs text-gray-400 font-mono">
                                   <span className="text-red-500 font-bold flex items-center gap-1">
                                       <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" /> AO VIVO
                                   </span>
                                   <span>{formatTime(timer)}</span>
                               </div>
                               <div className="flex justify-between items-center mb-1">
                                   <div className="flex items-center gap-2">
                                       <span className="font-bold text-lg">{match.scoreA}</span>
                                       <span className="text-sm truncate max-w-[80px]">{teamA?.name}</span>
                                   </div>
                               </div>
                               <div className="flex justify-between items-center">
                                   <div className="flex items-center gap-2">
                                       <span className="font-bold text-lg">{match.scoreB}</span>
                                       <span className="text-sm truncate max-w-[80px]">{teamB?.name}</span>
                                   </div>
                               </div>
                           </div>
                       );
                  })}
              </div>
          </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 3. Main News Feed (Left - 2 Cols) */}
        <section className="lg:col-span-2 space-y-8">
            <h2 className="text-2xl font-bold border-l-4 border-[#06aa48] pl-3 flex items-center gap-2 text-gray-800">
                <Newspaper className="w-6 h-6" />
                Últimas Notícias
            </h2>

            {news.length === 0 ? (
                <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
                    Ainda não há notícias. Os jogos começarão em breve!
                </div>
            ) : (
                <div className="grid gap-6">
                    {news.map((story, i) => (
                        <article key={story.id} className={`group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 ${i === 0 ? 'md:grid md:grid-cols-2 block' : 'block'}`}>
                            <div className={`bg-gray-200 relative overflow-hidden w-full ${i === 0 ? 'h-56 md:h-full md:min-h-[300px]' : 'h-48'}`}>
                                {/* GE-style image, using absolute to fill the container */}
                                {story.imageUrl ? (
                                    <img src={story.imageUrl} alt={story.headline} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#06aa48]/20 to-blue-500/20" />
                                )}
                                
                                <div className="absolute bottom-2 left-2 flex gap-1 z-10">
                                    {story.tags?.map(tag => (
                                        <span key={tag} className="text-[10px] uppercase font-bold bg-[#06aa48] text-white px-2 py-0.5 rounded shadow">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="p-4 md:p-6 block">
                                <div>
                                    <div className="text-[10px] md:text-xs text-gray-500 font-bold uppercase mb-2 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(story.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        <span className="mx-1">•</span>
                                        <span className="text-[#06aa48]">O2R Sports</span>
                                    </div>
                                    <h3 className={`font-bold text-gray-900 group-hover:text-[#06aa48] transition-colors ${i === 0 ? 'text-xl md:text-3xl leading-tight mb-2 md:mb-3' : 'text-lg mb-2'}`}>
                                        {story.headline}
                                    </h3>
                                    <p className={`text-gray-600 leading-relaxed ${i === 0 ? 'text-sm md:text-base line-clamp-3' : 'text-sm line-clamp-2'}`}>
                                        {story.body}
                                    </p>
                                </div>
                                <div className="mt-4 flex items-center text-[#06aa48] font-bold text-xs md:text-sm group/link cursor-pointer">
                                    Leia mais <ChevronRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>

        {/* 4. Sidebar (Standings & Results) */}
        <aside className="space-y-8">
            
            {/* Standings Widget */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        Classificação
                    </h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {/* Render Group A only for demo lightness, or tabs later */}
                    {Object.entries(standings).map(([group, teams]) => (
                        <div key={group} className="pb-2">
                             <div className="bg-gray-100 px-4 py-1 text-xs font-bold text-gray-500 uppercase">Grupo {group}</div>
                             <table className="w-full text-sm">
                                <thead className="text-xs text-gray-400 border-b border-gray-100">
                                    <tr>
                                        <th className="pl-4 py-2 text-left font-normal w-6">#</th>
                                        <th className="py-2 text-left font-normal">Time</th>
                                        <th className="pr-4 py-2 text-right font-normal">Pts</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teams.map((stats, idx) => {
                                        const team = config.teams.find(t => t.id === stats.teamId);
                                        return (
                                            <tr key={stats.teamId} className="hover:bg-gray-50">
                                                <td className={`pl-4 py-2 font-mono text-xs ${idx < 2 ? 'text-[#06aa48]' : 'text-gray-400'}`}>
                                                    {idx + 1}
                                                </td>
                                                <td className="py-2 font-medium truncate max-w-[120px]">
                                                    {team?.name}
                                                </td>
                                                <td className="pr-4 py-2 text-right font-bold text-gray-700">
                                                    {stats.points}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                             </table>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Results Widget */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                        Últimos Resultados
                    </h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {pastMatches.length === 0 && <div className="p-4 text-xs text-gray-500 text-center">Nenhum resultado ainda.</div>}
                    {pastMatches.map(match => {
                        const teamA = config.teams.find(t => t.id === match.teamAId);
                        const teamB = config.teams.find(t => t.id === match.teamBId);
                        return (
                            <div key={match.id} className="p-3 flex items-center justify-between hover:bg-gray-50">
                                <span className="text-xs font-medium text-gray-600 w-1/3 text-right truncate">{teamA?.name}</span>
                                <div className="px-2 font-mono font-bold text-sm bg-gray-100 rounded">
                                    {match.scoreA} <span className="text-gray-400 text-xs mx-0.5">x</span> {match.scoreB}
                                </div>
                                <span className="text-xs font-medium text-gray-600 w-1/3 text-left truncate">{teamB?.name}</span>
                            </div>
                        )
                    })}
                </div>
            </div>

        </aside>

      </main>
    </div>
  );
}
