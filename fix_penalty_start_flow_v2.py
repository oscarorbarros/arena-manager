# -*- coding: utf-8 -*-
import os
path = "src/app/referee/[id]/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()
t2 = """  const handlePenaltyStart = (teamId: string) => {
      updateMatch(matchId, { firstPenaltyTeamId: teamId, status: "paused", period: "penalties" });
      addMatchEvent(matchId, { type: "start", timestamp: Date.now(), matchTime: timer, observation: "Início dos Pênaltis" });
      setActiveModal("penalties");
  };"""
r2 = """  const handlePenaltyStart = (teamId: string) => {
      updateMatch(matchId, { firstPenaltyTeamId: teamId, status: "paused", period: "penalties" });
      // Event already logged by startPenalties
      setActiveModal("penalties");
  };"""
if t1 in content:
    content = content.replace(t1, r1)
if t2 in content:
    content = content.replace(t2, r2)
with open(path, "w", encoding="utf-8") as f:
    f.write(content)
