# -*- coding: utf-8 -*-
import os
path = "src/app/referee/[id]/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()
t2 = """  const handlePenaltyStart = (teamId: string) => {\\n      updateMatch(matchId, { firstPenaltyTeamId: teamId, status: "paused", period: "penalties" });\\n      addMatchEvent(matchId, { type: "start", timestamp: Date.now(), matchTime: timer, observation: "Início dos Pênaltis" });\\n      setActiveModal("penalties");\\n  };"""
r2 = """  const handlePenaltyStart = (teamId: string) => {\\n      updateMatch(matchId, { firstPenaltyTeamId: teamId, status: "paused", period: "penalties" });\\n      // Event already logged by startPenalties\\n      setActiveModal("penalties");\\n  };"""
if t1 in content:
    content = content.replace(t1, r1)
if t2 in content:
    content = content.replace(t2, r2)
with open(path, "w", encoding="utf-8") as f:
    f.write(content)
