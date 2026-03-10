# -*- coding: utf-8 -*-
import os
path = "src/app/referee/[id]/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()
t_push = "updates.events.push({"
# We need to replace updates.events.push because updates.events is filtered from match.events which is immutable or we need to spread it first
r_push = "updates.events = [...newEvents, {"
if t_push in content:
    # The logic was updates.events = newEvents before, so updates.events IS newEvents array.
    # But to be safe, we should construct it properly
    pass
# Actually the issue might be that updates.events is used in updateMatch but we are pushing to it before calling updateMatch?
# Ah, updates.events = newEvents creates a reference to the filtered array. Pushing to it is fine if it is a new array.
# filter() returns a new array. So pushing to it is valid JS.
# The problem might be the updates object structure.
# Let us ensure the event object is fully correct.
t_block = """      // Log justification\n      updates.events.push({\n          type: "info",\n          timestamp: Date.now(),\n          matchTime: timer,\n          observation: `CORRE\u00c7\u00c3O P\u00caNALTI: ${undoJustification}`\n      });\n\n      updateMatch(matchId, updates);"""
r_block = """      // Log justification\n      const correctionEvent = {\n          id: crypto.randomUUID(),\n          type: "info" as MatchEventType,\n          timestamp: Date.now(),\n          matchTime: timer,\n          observation: `CORRE\u00c7\u00c3O P\u00caNALTI: ${undoJustification}`\n      };\n      \n      updates.events = [...newEvents, correctionEvent];\n      updateMatch(matchId, updates);"""
if "updates.events.push" in content:
    content = content.replace(t_block, r_block)
with open(path, "w", encoding="utf-8") as f:
    f.write(content)
