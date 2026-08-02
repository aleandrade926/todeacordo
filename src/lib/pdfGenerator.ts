import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ConsensusObject, MeetingSession } from '../types';

export const generatePDF = (meeting: MeetingSession, consensus: ConsensusObject) => {
  const doc = new jsPDF();
  
  const dateObj = new Date(meeting.started_at);
  const dateStr = dateObj.toLocaleDateString('pt-BR');
  const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  
  // Cores da Marca
  const brandColor: [number, number, number] = [79, 70, 229]; // Indigo-600
  const textColor: [number, number, number] = [51, 65, 85]; // Slate-700
  const headingColor: [number, number, number] = [30, 41, 59]; // Slate-800

  // Cabeçalho
  doc.setFillColor(...brandColor);
  doc.rect(0, 0, 210, 20, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('ToDeAcordo', 14, 13);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Termo de Entendimento Mútuo', 200 - doc.getTextWidth('Termo de Entendimento Mútuo'), 13);

  let currentY = 35;

  // Título da Reunião
  doc.setTextColor(...headingColor);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  const title = meeting.title || 'Reunião sem título';
  doc.text(title, 14, currentY);
  currentY += 10;

  // Metadados
  doc.setTextColor(...textColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Data: ${dateStr} às ${timeStr}`, 14, currentY);
  currentY += 6;
  if (meeting.participants && meeting.participants.length > 0) {
    doc.text(`Participantes: ${meeting.participants.join(', ')}`, 14, currentY);
  }
  currentY += 15;

  // Função auxiliar para desenhar blocos
  const drawSection = (title: string, items: any[]) => {
    if (!items || items.length === 0) return;
    
    doc.setTextColor(...brandColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, currentY);
    currentY += 4;
    
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.line(14, currentY, 196, currentY);
    currentY += 6;

    const formattedData = items.map(item => [item.text || item]);

    autoTable(doc, {
      startY: currentY,
      body: formattedData,
      theme: 'plain',
      styles: {
        fontSize: 10,
        textColor: textColor,
        cellPadding: 3,
        overflow: 'linebreak'
      },
      columnStyles: {
        0: { cellWidth: 180 }
      },
      didDrawCell: (data) => {
        // Desenhar um bullet point customizado
        if (data.column.index === 0 && data.cell.section === 'body') {
          doc.setFillColor(...brandColor);
          doc.circle(16, data.cell.y + 5, 1, 'F');
          data.cell.x += 4; // Indent text
        }
      },
      margin: { left: 14 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;
  };

  drawSection('Pontos Acordados', consensus.agreements || []);
  drawSection('Decisões Tomadas', consensus.decisions || []);
  drawSection('Obrigações e Pendências', consensus.obligations || []);

  // Assinaturas
  if (meeting.participants && meeting.participants.length > 0 && currentY < 250) {
    currentY += 10;
    doc.setTextColor(...headingColor);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Declaração de Acordo', 14, currentY);
    currentY += 6;
    
    doc.setTextColor(...textColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Os participantes abaixo declaram estar de acordo com os termos extraídos desta sessão.', 14, currentY);
    currentY += 20;

    const participantCount = meeting.participants.length;
    
    meeting.participants.forEach((participant, index) => {
      // Check page break
      if (currentY > 270) {
        doc.addPage();
        currentY = 20;
      }
      
      const isRightCol = index % 2 !== 0;
      const xPos = isRightCol ? 110 : 14;
      
      doc.setDrawColor(...headingColor);
      doc.line(xPos, currentY, xPos + 75, currentY);
      doc.text(participant, xPos, currentY + 5);
      
      if (isRightCol || index === participantCount - 1) {
        currentY += 25;
      }
    });
  }

  // Rodapé
  const pageCount = (doc as any).internal.getNumberOfPages();
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // Slate-400
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Gerado por ToDeAcordo AI em ${new Date().toLocaleString('pt-BR')} - Página ${i} de ${pageCount}`,
      105,
      285,
      { align: 'center' }
    );
  }

  // Salvar
  const safeTitle = (meeting.title || 'acordo').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`todeacordo_${safeTitle}_${dateStr.replace(/\//g, '')}.pdf`);
};
