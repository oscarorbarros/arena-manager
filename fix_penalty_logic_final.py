# -*- coding: utf-8 -*-
lines = []
with open("src/app/referee/[id]/page.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()
new_lines = []
in_start_penalties = False
in_handle_penalty_start = False
for line in lines:
    if "const startPenalties = () => {" in line:
        in_start_penalties = True
        new_lines.append(line)
        continue
    if "const handlePenaltyStart = (teamId: string) => {" in line:
        in_handle_penalty_start = True
        new_lines.append(line)
        continue
    if in_start_penalties:
            in_start_penalties = False
        if "};" in line:
            in_start_penalties = False
    if in_handle_penalty_start:
        if "addMatchEvent" in line and "Início dos Pênaltis" in line:
            # Comment out or skip
            line = "// " + line
        if "};" in line:
            in_handle_penalty_start = False
    new_lines.append(line)
with open("src/app/referee/[id]/page.tsx", "w", encoding="utf-8") as f:
    f.writelines(new_lines)
