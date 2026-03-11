import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TournamentConfig, Match, Team } from './types';
import { TournamentEngine } from './tournament-engine';

export function generateTournamentReport(config: TournamentConfig) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(config.name, pageWidth / 2, 20, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Relatorio Final - ${new Date().toLocaleDateString()}`, pageWidth / 2, 30, { align: "center" });

    // 2. Winner (if finished)
    if (config.status === 'finished') {
        const finalMatch = config.matches.find(m => m.round === 'Final' || m.round === 'Mata-Mata' || (m.stage === 'knockout' && config.matches.filter(k => k.stage === 'knockout').indexOf(m) === config.matches.filter(k => k.stage === 'knockout').length - 1));
        
        if (finalMatch && finalMatch.status === 'finished') {
            let winnerId = "";
            if (finalMatch.scoreA > finalMatch.scoreB) winnerId = finalMatch.teamAId;
            else if (finalMatch.scoreB > finalMatch.scoreA) winnerId = finalMatch.teamBId;
            else if (finalMatch.penaltiesA !== undefined && finalMatch.penaltiesB !== undefined) {
                 winnerId = finalMatch.penaltiesA > finalMatch.penaltiesB ? finalMatch.teamAId : finalMatch.teamBId;
            }

            const champion = config.teams.find(t => t.id === winnerId);
            
            if (champion) {
                doc.setFontSize(16);
                doc.setTextColor(0, 150, 0);
                doc.text(`CAMPEAO: ${champion.name}`, pageWidth / 2, 45, { align: "center" });
                doc.setTextColor(0, 0, 0);
            }
        }
    }

    let yPos = 60;

    // 3. Standings (Group Stage)
    if (config.type === 'hybrid') {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Classificacao Fase de Grupos", 14, yPos);
        yPos += 10;

        const standings = TournamentEngine.calculateStandings(config.teams, config.matches, config.tieBreakers);
        
        Object.entries(standings).forEach(([groupName, stats]) => {
            doc.setFontSize(12);
            doc.text(`Grupo ${groupName}`, 14, yPos);
            yPos += 5;

            const tableData = stats.map((s, index) => [
                index + 1,
                config.teams.find(t => t.id === s.teamId)?.name || 'Time',
                s.points,
                s.won,
                s.drawn,
                s.lost,
                s.goalDifference
            ]);

            autoTable(doc, {
                startY: yPos,
                head: [['#', 'Time', 'Pts', 'V', 'E', 'D', 'SG']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [41, 128, 185] },
                margin: { top: 10 }
            });

            yPos = (doc as any).lastAutoTable.finalY + 15;
            
            if (yPos > 250) { doc.addPage(); yPos = 20; }
        });
    }

    // 4. Matches List
    if (yPos > 240) { doc.addPage(); yPos = 20; }
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Todos os Jogos", 14, yPos);
    yPos += 10;

    const allMatches = config.matches.sort((a, b) => (a.scheduledTime || 0) - (b.scheduledTime || 0));

    const matchesData = allMatches.map(m => {
        const teamA = config.teams.find(t => t.id === m.teamAId)?.name || 'Definir';
        const teamB = config.teams.find(t => t.id === m.teamBId)?.name || 'Definir';
        let score = 'vs';
        
        if (m.status === 'finished') {
            score = `${m.scoreA} x ${m.scoreB}`;
            if (m.penaltiesA !== undefined) {
                score += ` (${m.penaltiesA}-${m.penaltiesB} pen)`;
            }
        } else if (m.status === 'live') {
            score = `${m.scoreA} x ${m.scoreB} (Ao Vivo)`;
        }

        return [
            m.stage === 'group' ? `Grupo ${m.group}` : m.round || 'Mata-Mata',
            teamA,
            score,
            teamB
        ];
    });

    autoTable(doc, {
        startY: yPos,
        head: [['Fase', 'Mandante', 'Placar', 'Visitante']],
        body: matchesData,
        theme: 'grid',
        headStyles: { fillColor: [52, 73, 94] }
    });

    // Save
    doc.save(`relatorio_${config.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
}
