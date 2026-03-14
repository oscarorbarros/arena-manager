import { TournamentConfig } from "./types";

export function generateAndPrintTournamentReport(config: TournamentConfig): void {
  const teams = config.teams || [];
  const matches = config.matches || [];
  const players = config.players || [];

  const finishedMatches = matches.filter(m => m.status === 'finished');
  
  // Goals
  let totalGoals = 0;
  finishedMatches.forEach(m => {
    totalGoals += (m.scoreA || 0) + (m.scoreB || 0);
  });

  // Top Scorers
  const goalCounts: Record<string, number> = {};
  finishedMatches.forEach(m => {
    m.events?.forEach(e => {
       if (e.type === "goal" && e.playerId) {
           goalCounts[e.playerId] = (goalCounts[e.playerId] || 0) + (e.value || 1);
       }
    });
  });

  const topScorers = Object.entries(goalCounts)
        .map(([id, goals]) => {
            const player = players.find(p => p.id === id);
            const team = teams.find(t => t.id === player?.teamId);
            return { name: player?.name || "Desconhecido", team: team?.name || "-", goals };
        })
        .sort((a, b) => b.goals - a.goals)
        .slice(0, 5);

  const dateStr = new Date().toLocaleDateString("pt-BR");
  
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Relatório do Torneio – ${config.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, sans-serif; }
    body { padding: 40px; color: #333; }
    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
    .title { font-size: 24px; font-weight: bold; text-transform: uppercase; margin-bottom: 10px; }
    .subtitle { font-size: 14px; color: #666; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 16px; font-weight: bold; background: #eee; padding: 8px; border-left: 4px solid #059669; margin-bottom: 15px; }
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
    .stat-box { border: 1px solid #ddd; padding: 15px; text-align: center; border-radius: 8px; }
    .stat-value { font-size: 28px; font-weight: bold; color: #059669; margin-bottom: 5px; }
    .stat-label { font-size: 12px; color: #777; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px;}
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background: #f9f9f9; font-weight: bold; }
    tr:nth-child(even) { background: #fefefe; }
    .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">RELATÓRIO OFICIAL DO TORNEIO</div>
    <div class="subtitle">${config.name} • Gerado em ${dateStr}</div>
  </div>

  <div class="section">
    <div class="section-title">Estatísticas Gerais</div>
    <div class="stats-grid">
      <div class="stat-box">
        <div class="stat-value">${teams.length}</div>
        <div class="stat-label">Equipes Participantes</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${finishedMatches.length}</div>
        <div class="stat-label">Partidas Realizadas</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${totalGoals}</div>
        <div class="stat-label">Gols Marcados</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Delegação / Equipes Inscritas</div>
    <table>
      <thead>
        <tr>
          <th width="50%">Nome da Equipe</th>
          <th width="50%">Localidade / Sede</th>
        </tr>
      </thead>
      <tbody>
        ${teams.map(t => `<tr><td><strong>${t.name}</strong></td><td>${t.group ? `Grupo ${t.group}` : "–"}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Top 5 Artilharia</div>
    ${topScorers.length > 0 ? `
    <table>
      <thead>
        <tr>
          <th width="10%">Pos</th>
          <th width="40%">Atleta</th>
          <th width="30%">Equipe</th>
          <th width="20%">Gols</th>
        </tr>
      </thead>
      <tbody>
        ${topScorers.map((ts, i) => `<tr><td>${i+1}º</td><td><strong>${ts.name}</strong></td><td>${ts.team}</td><td style="font-weight:bold; color:#059669;">${ts.goals}</td></tr>`).join('')}
      </tbody>
    </table>
    ` : `<p style="font-size: 12px; color: #777;">Nenhum gol registrado com autoria identificada.</p>`}
  </div>

  <div class="footer">
    Documento gerado pelo sistema Arena Manager.<br/>
    Comissão Organizadora – ${config.name}
  </div>

  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`;

  const printWindow = window.open("", "_blank", "width=800,height=900");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
