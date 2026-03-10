# -*- coding: utf-8 -*-
path = "src/app/referee/[id]/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()
content = content.replace(t_start, r_start)
t_handle = """  const handlePenaltyStart = (teamId: string) => {
      updateMatch(matchId, { firstPenaltyTeamId: teamId, status: "paused", period: "penalties" });
      addMatchEvent(matchId, { type: "start", timestamp: Date.now(), matchTime: timer, observation: "Início dos Pênaltis" });
      setActiveModal("penalties");
  };"""
r_handle = """  const handlePenaltyStart = (teamId: string) => {
      updateMatch(matchId, { firstPenaltyTeamId: teamId, status: "paused", period: "penalties" });
      setActiveModal("penalties");
  };"""
content = content.replace(t_handle, r_handle)
t_min = """                            <button onClick={() => setActiveModal(null)} className="flex-1 py-3 text-gray-500 hover:text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-800 rounded-lg transition-colors border border-transparent hover:border-gray-700">
                                Minimizar
                            </button>"""
content = content.replace(t_min, "")
with open(path, "w", encoding="utf-8") as f:
    f.write(content)
