import { Match, Player, Team } from "./types";

interface SumulaData {
  match: Match;
  teamA: Team;
  teamB: Team;
  playersA: Player[];
  playersB: Player[];
  allPlayers?: Player[]; // full roster for resolving playerInId in substitutions
  tournamentName: string;
  sportName: string;
  closedBy?: string;
}

function getPlayerGoals(player: Player, match: Match, half: 1 | 2): number {
  const events = match.events.filter(e => e.playerId === player.id && e.type === "goal");
  const halfTimeEvent = match.events.find(e => e.type === "end" && e.observation?.includes("1o Tempo"));
  const halfTimeMinute = halfTimeEvent ? halfTimeEvent.matchTime : (half === 1 ? 99 : 0);
  if (half === 1) return events.filter(e => e.matchTime <= halfTimeMinute).length;
  return events.filter(e => e.matchTime > halfTimeMinute).length;
}

function getPlayerYellowCards(player: Player, match: Match): number {
  return match.events.filter(e => e.playerId === player.id && e.type === "card_yellow").length;
}

function getPlayerRedCards(player: Player, match: Match): number {
  return match.events.filter(e => e.playerId === player.id && e.type === "card_red").length;
}

function wasSubstituted(player: Player, match: Match): string {
  const subEvent = match.events.find(e => e.type === "substitution" && e.playerId === player.id);
  if (subEvent) return `↕ ${subEvent.matchTime}'`;
  const subIn = match.events.find(e => e.type === "substitution" && e.playerInId === player.id);
  if (subIn) return `↑ ${subIn.matchTime}'`;
  return "";
}

function playerRow(player: Player, match: Match, idx: number, isStarter: boolean): string {
  const g1 = getPlayerGoals(player, match, 1) || "";
  const g2 = getPlayerGoals(player, match, 2) || "";
  const am = getPlayerYellowCards(player, match) || "";
  const ve = getPlayerRedCards(player, match) || "";
  const sub = wasSubstituted(player, match);
  const bg = idx % 2 === 1 ? "#e8e8e8" : "#ffffff";
  const starterMark = isStarter ? "" : "<em style='color:#555;font-size:8px;'>(res)</em> ";
  return `
    <tr style="background:${bg};">
      <td style="border:1px solid #333;padding:2px 4px;text-align:center;width:28px;">${player.number ?? ""}</td>
      <td style="border:1px solid #333;padding:2px 4px;width:160px;">${starterMark}${player.name} ${sub ? `<span style='font-size:8px;color:#666;'>${sub}</span>` : ""}</td>
      <td style="border:1px solid #333;padding:2px 4px;text-align:center;width:22px;">${g1}</td>
      <td style="border:1px solid #333;padding:2px 4px;text-align:center;width:22px;">${g2}</td>
      <td style="border:1px solid #333;padding:2px 4px;text-align:center;width:22px;">${am}</td>
      <td style="border:1px solid #333;padding:2px 4px;text-align:center;width:22px;"></td>
      <td style="border:1px solid #333;padding:2px 4px;text-align:center;width:22px;">${ve}</td>
    </tr>`;
}

function emptyRow(idx: number): string {
  const bg = idx % 2 === 1 ? "#e8e8e8" : "#ffffff";
  return `
    <tr style="background:${bg};height:18px;">
      <td style="border:1px solid #333;"></td>
      <td style="border:1px solid #333;"></td>
      <td style="border:1px solid #333;"></td>
      <td style="border:1px solid #333;"></td>
      <td style="border:1px solid #333;"></td>
      <td style="border:1px solid #333;"></td>
      <td style="border:1px solid #333;"></td>
    </tr>`;
}

function teamTable(team: Team, players: Player[], match: Match): string {
  const MIN_ROWS = 15;
  // Sort: starters first, then subs
  const starters = players.filter(p => p.isStarter);
  const subs = players.filter(p => !p.isStarter);
  const sorted = [...starters, ...subs];

  let rows = "";
  // Separator row between starters and subs if both exist
  sorted.forEach((p, i) => {
    if (i === starters.length && starters.length > 0 && subs.length > 0) {
      rows += `<tr><td colspan="7" style="border:1px solid #333;background:#bbb;padding:1px 4px;font-size:8px;font-style:italic;color:#333;">— Reservas —</td></tr>`;
    }
    rows += playerRow(p, match, i, p.isStarter ?? false);
  });
  for (let i = sorted.length; i < MIN_ROWS; i++) { rows += emptyRow(i); }

  return `
    <table style="width:100%;border-collapse:collapse;font-size:10px;">
      <thead>
        <tr style="background:#ccc;">
          <td colspan="7" style="border:1px solid #333;padding:3px 4px;font-weight:bold;">Associação: ${team.name}</td>
        </tr>
        <tr style="background:#ddd;font-weight:bold;text-align:center;font-size:9px;">
          <td style="border:1px solid #333;padding:2px;">Nº</td>
          <td style="border:1px solid #333;padding:2px;">Nome completo</td>
          <td style="border:1px solid #333;padding:2px;">1ºT</td>
          <td style="border:1px solid #333;padding:2px;">2ºT</td>
          <td style="border:1px solid #333;padding:2px;">AM</td>
          <td style="border:1px solid #333;padding:2px;">AZ</td>
          <td style="border:1px solid #333;padding:2px;">VE</td>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function matchTimeline(match: Match, allPlayers: Player[], teamA: Team, teamB: Team): string {
  const significantEvents = match.events.filter(e => 
    ["goal", "card_yellow", "card_red", "penalty_goal", "penalty_miss", "start", "end"].includes(e.type)
  );
  
  if (significantEvents.length === 0) return "";

  const rows = significantEvents.map(e => {
    const player = e.playerId ? allPlayers.find(p => p.id === e.playerId) : null;
    const team = e.teamId ? (e.teamId === teamA.id ? teamA : teamB) : null;
    
    let icon = "•";
    let detail = "";
    
    if (e.type === "goal") { icon = "⚽"; detail = `GOL - ${player?.name || "Atleta"}`; }
    else if (e.type === "card_yellow") { icon = "🟨"; detail = `CARTÃO AMARELO - ${player?.name || "Atleta"}`; }
    else if (e.type === "card_red") { icon = "🟥"; detail = `CARTÃO VERMELHO - ${player?.name || "Atleta"}`; }
    else if (e.type === "penalty_goal") { icon = "🎯"; detail = `PÊNALTI CONVERTIDO - ${player?.name || "Atleta"}`; }
    else if (e.type === "penalty_miss") { icon = "❌"; detail = `PÊNALTI PERDIDO - ${player?.name || "Atleta"}`; }
    else if (e.type === "start" || e.type === "end") { icon = "⏱️"; detail = e.observation || ""; }

    const teamTag = team ? `<span style="font-size:8px;color:#666;margin-left:4px;">(${team.name})</span>` : "";

    return `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding:3px;text-align:center;width:40px;font-weight:bold;">${e.matchTime}'</td>
        <td style="padding:3px;width:30px;text-align:center;">${icon}</td>
        <td style="padding:3px;">${detail}${teamTag}</td>
      </tr>
    `;
  }).join("");

  return `
    <div style="margin-top:14px;">
      <div style="font-weight:bold;text-align:center;border:1px solid #000;padding:4px;background:#ddd;font-size:10px;">LINHA DO TEMPO DA PARTIDA</div>
      <table style="width:100%;border-collapse:collapse;font-size:9px;border:1px solid #000;">
        <tbody style="background:#fff;">${rows}</tbody>
      </table>
    </div>
  `;
}

function substitutionsList(match: Match, allPlayers: Player[]): string {
  const subEvents = match.events.filter(e => e.type === "substitution");
  if (subEvents.length === 0) return "";

  const rows = subEvents.map(e => {
    const out = allPlayers.find(p => p.id === e.playerId)?.name ?? "?";
    const inn = allPlayers.find(p => p.id === e.playerInId)?.name ?? "?";
    return `<li>${e.matchTime}' — <strong>${out}</strong> ↔ <strong>${inn}</strong> (${e.observation ?? ""})</li>`;
  }).join("");

  return `
    <div style="margin-top:8px;font-size:10px;">
      <strong>Substituições:</strong>
      <ul style="margin-left:16px;">${rows}</ul>
    </div>`;
}

export function generateAndPrintSumula(data: SumulaData): void {
  const { match, teamA, teamB, playersA, playersB, tournamentName, sportName, closedBy } = data;
  const allPlayers = data.allPlayers ?? [...playersA, ...playersB];

  const now = new Date(match.events[match.events.length - 1]?.timestamp || Date.now());
  const dateStr = now.toLocaleDateString("pt-BR");
  const timeStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const observations = match.observations || "(Sem ocorrências registradas)";
  const subsHtml = substitutionsList(match, allPlayers);

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Súmula – ${teamA.name} x ${teamB.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11px; background: #fff; color: #000; padding: 16px; }
    h1 { font-size: 14px; text-align: center; font-weight: bold; margin-bottom: 4px; border-bottom: 2px solid #000; padding-bottom: 6px; }
    .subtitle { text-align: center; font-size: 11px; margin-bottom: 10px; }
    .teams-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px; }
    .result-box { border: 2px solid #000; text-align: center; padding: 8px; font-weight: bold; font-size: 14px; margin: 8px auto; width: 240px; }
    .result-label { font-size: 10px; font-weight: bold; text-transform: uppercase; margin-bottom: 2px; text-align:center; }
    .sig-row { display: flex; justify-content: space-between; margin-top: 12px; font-size: 10px; }
    .sig-item { flex: 1; border-top: 1px solid #000; padding-top: 3px; margin: 0 10px; text-align: center; }
    .obs-section { margin-top: 14px; }
    .obs-title { font-weight: bold; text-align: center; border: 1px solid #000; padding: 4px; background: #ddd; }
    .obs-lines { border: 1px solid #000; padding: 6px; min-height: 100px; font-size: 10px; white-space: pre-wrap; line-height: 1.9; background: repeating-linear-gradient(transparent, transparent 18px, #ccc 18px, #ccc 19px); }
    .footer-sig { display: flex; justify-content: space-between; margin-top: 16px; font-size: 10px; }
    .footer-sig div { flex: 1; border-top: 1px solid #000; margin: 0 20px; text-align: center; padding-top: 3px; }
    @media print { body { padding: 4mm; } }
  </style>
</head>
<body>
  <h1>ARENA MANAGER – SÚMULA DE ${sportName.toUpperCase()}</h1>
  <div class="subtitle">Campeonato: <strong>${tournamentName}</strong> &nbsp;|&nbsp; Fase: <strong>${match.round || "Fase de Grupos"}</strong> &nbsp;|&nbsp; Grupo: <strong>${match.group || "–"}</strong></div>

  <div class="teams-grid">
    ${teamTable(teamA, playersA, match)}
    ${teamTable(teamB, playersB, match)}
  </div>

  ${subsHtml}
  ${matchTimeline(match, allPlayers, teamA, teamB)}

  <div class="result-label" style="margin-top:10px;">Resultado Final</div>
  <div class="result-box">${teamA.name} &nbsp; ${match.scoreA} × ${match.scoreB} &nbsp; ${teamB.name}</div>

  <div class="sig-row">
    <div class="sig-item">Capitão (${teamA.name})</div>
    <div style="text-align:center;font-size:10px;padding-top:10px;">
      <strong>Local do Jogo</strong><br/>
      <span style="display:block;margin-top:6px;">____/____/______</span>
      <span style="font-size:9px;">Data: ${dateStr} &nbsp; Hora: ${timeStr}</span>
    </div>
    <div class="sig-item">Capitão (${teamB.name})</div>
  </div>

  <div class="obs-section" style="margin-top:14px;">
    <div class="obs-title">RELATÓRIO / OCORRÊNCIAS DA PARTIDA</div>
    <div class="obs-lines">${observations.replace(/\n/g, "<br/>")}</div>
  </div>

  <div class="footer-sig">
    <div>Responsável: <strong>${closedBy || "–"}</strong></div>
    <div>Assinatura: _____________________________</div>
  </div>

  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`;

  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
