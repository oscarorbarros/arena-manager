# -*- coding: utf-8 -*-
path = "src/app/referee/[id]/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()
new_lines = []
for line in lines:
        # This heuristic of looking back is tricky. Let us just use specific line replacement if we can, or state machine.
        pass
# State Machine Approach
in_handle = False
for line in lines:
    if "const startPenalties = () => {" in line:
        in_start_penalties = True
    if "const handlePenaltyStart = (teamId: string) => {" in line:
        in_handle = True
        in_start_penalties = False
    if in_handle and "addMatchEvent" in line and "Início dos Pênaltis" in line:
        line = "// " + line
    if in_handle and "};" in line:
        in_handle = False
    if in_start_penalties and "};" in line:
        in_start_penalties = False
    new_lines.append(line)
with open(path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)
