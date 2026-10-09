import { jsPDF } from 'jspdf';
import { MaintenanceRecord, ExtraWork } from '../types';
import { formatDateOnly } from './brasiliaTime';

/**
 * Loads an image from a URL or base64 and converts it to a clean data URL for jsPDF
 */
async function getCleanImageDataUrl(url: string): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith('data:image/')) return url;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width || 400;
        canvas.height = img.height || 300;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } else {
          resolve(null);
        }
      } catch (e) {
        console.warn('Canvas conversion failed (likely CORS), skipping image in PDF:', e);
        resolve(null);
      }
    };
    img.onerror = () => {
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * Generates a PDF for a single Maintenance Record
 * Follows exact user specification:
 * "salvar em PDF com a imagem a esquerda e o enunciado a direita com a data abaixo"
 */
export async function generateRecordPDF(record: MaintenanceRecord): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Header background bar
  doc.setFillColor(15, 76, 129); // Professional Deep Navy/Teal
  doc.rect(0, 0, pageWidth, 26, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('ESTADO DO PARANÁ | NRE MARINGÁ - MANUTENÇÃO ESCOLAR', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(220, 235, 250);
  doc.text(`SEED/PR & Parceria Empresa Privada | Protocolo: ${record.id}`, margin, 19);

  // School Information Banner
  doc.setFillColor(243, 246, 250);
  doc.setDrawColor(210, 220, 235);
  doc.roundedRect(margin, 30, pageWidth - margin * 2, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(20, 40, 70);
  doc.text(`ESCOLA: ${record.schoolName}`, margin + 4, 38);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(90, 100, 120);
  doc.text(`Código Escolar: ${record.schoolCode}  |  Registrado por: ${record.authorName} (${record.createdByRole.toUpperCase()})`, margin + 4, 45);

  // Core content box (Left: Image, Right: Enunciado + Prazo + Detalhes)
  const contentTop = 54;
  const contentHeight = 105;
  const contentWidth = pageWidth - margin * 2;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(200, 210, 225);
  doc.roundedRect(margin, contentTop, contentWidth, contentHeight, 2, 2, 'FD');

  // Left Section: Image (approx 78mm width, 85mm height)
  const imgX = margin + 4;
  const imgY = contentTop + 6;
  const imgW = 75;
  const imgH = 65;

  // Placeholder frame for photo
  doc.setFillColor(240, 243, 248);
  doc.setDrawColor(180, 195, 215);
  doc.rect(imgX, imgY, imgW, imgH, 'FD');

  try {
    const dataUrl = await getCleanImageDataUrl(record.photoUrl);
    if (dataUrl) {
      doc.addImage(dataUrl, 'JPEG', imgX, imgY, imgW, imgH);
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(130, 140, 155);
      doc.text('[Foto da Ocorrência Anexada]', imgX + 16, imgY + 32);
    }
  } catch {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(130, 140, 155);
    doc.text('[Foto da Ocorrência Anexada]', imgX + 16, imgY + 32);
  }

  // Caption under photo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 115, 130);
  doc.text('REGISTRO FOTOGRÁFICO DO PONTO DE ATENÇÃO', imgX, imgY + imgH + 6);

  // Right Section: Enunciado & Prazo
  const rightX = imgX + imgW + 8;
  const rightW = contentWidth - imgW - 16;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 76, 129);
  doc.text('ENUNCIADO / PONTO QUE REQUER ATENÇÃO:', rightX, contentTop + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  const titleLines = doc.splitTextToSize(record.title, rightW);
  doc.text(titleLines, rightX, contentTop + 14);

  const titleHeight = (titleLines.length * 5);
  let nextY = contentTop + 16 + titleHeight;

  if (record.description) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(80, 90, 110);
    doc.text('DETALHAMENTO:', rightX, nextY);
    nextY += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(60, 65, 75);
    const descLines = doc.splitTextToSize(record.description, rightW);
    doc.text(descLines, rightX, nextY);
    nextY += (descLines.length * 4.5) + 3;
  }

  // Prazo e Metadados ao lado da foto
  doc.setFillColor(248, 250, 253);
  doc.setDrawColor(220, 230, 240);
  doc.roundedRect(rightX, nextY, rightW, 30, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(180, 40, 20);
  doc.text(`PRAZO LIMITE: ${formatDateOnly(record.deadline)}`, rightX + 3, nextY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 60, 75);
  doc.text(`Categoria: ${record.category}`, rightX + 3, nextY + 14);
  doc.text(`Nível de Urgência: ${record.urgency.toUpperCase()}`, rightX + 3, nextY + 20);

  // Status Badge
  const statusColor = record.status === 'realizado' ? [34, 139, 34] : record.status === 'nao_realizado' ? [190, 30, 30] : [210, 130, 10];
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(`STATUS: ${record.status.toUpperCase().replace('_', ' ')}`, rightX + 3, nextY + 26);

  // Date Below the image and statement
  const dateBannerY = contentTop + contentHeight + 4;
  doc.setFillColor(240, 245, 252);
  doc.setDrawColor(200, 215, 235);
  doc.roundedRect(margin, dateBannerY, contentWidth, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 60, 100);
  doc.text(`DATA E HORA DO REGISTRO (OFICIAL BRASÍLIA):`, margin + 4, dateBannerY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 70, 90);
  doc.text(`${record.formattedDateTimeBrasilia}`, margin + 4, dateBannerY + 11);

  // If there is resolution from Coordenação (Devolutiva)
  let footerStartY = dateBannerY + 18;
  if (record.resolution) {
    const resH = 45;
    doc.setFillColor(250, 252, 255);
    doc.setDrawColor(180, 210, 230);
    doc.roundedRect(margin, footerStartY, contentWidth, resH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 76, 129);
    doc.text('DEVOLUTIVA DA COORDENAÇÃO / EMPRESA PARCEIRA:', margin + 4, footerStartY + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    const resStatusText = record.resolution.status === 'realizado' ? '[ X ] REALIZADO COM SUCESSO' : '[ X ] NÃO REALIZADO';
    doc.setTextColor(record.resolution.status === 'realizado' ? 34 : 180, record.resolution.status === 'realizado' ? 139 : 30, 34);
    doc.text(resStatusText, margin + 4, footerStartY + 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(50, 50, 50);
    doc.text(`Data/Hora Conclusão: ${record.resolution.resolvedTimeBrasilia || record.resolution.resolvedDate} | Responsável: ${record.resolution.resolvedBy}`, margin + 4, footerStartY + 20);

    const notes = doc.splitTextToSize(`Observações: ${record.resolution.notes || 'Sem observações adicionais.'}`, contentWidth - 10);
    doc.text(notes, margin + 4, footerStartY + 26);

    if (record.resolution.newDeadlineIfUnresolved) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(190, 40, 20);
      doc.text(`Novo Prazo Reprogramado: ${formatDateOnly(record.resolution.newDeadlineIfUnresolved)}`, margin + 4, footerStartY + 38);
    }

    footerStartY += resH + 4;
  }

  // Drive Link & Footer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 110, 125);
  doc.text(`Pasta Oficial no Google Drive: ${record.driveUrl}`, margin, pageHeight - 12);
  doc.text('Documento gerado automaticamente pelo Sistema de Manutenção - Estado do Paraná & NRE Maringá', margin, pageHeight - 8);

  const cleanSchoolName = record.schoolName.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`PARANA_NRE_MARINGA_${cleanSchoolName}_${record.id}.pdf`);
}

/**
 * Generates summary PDF for multiple records
 */
export async function generateSchoolReportPDF(schoolName: string, records: MaintenanceRecord[]): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  doc.setFillColor(15, 76, 129);
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('ESTADO DO PARANÁ | NRE MARINGÁ - RELATÓRIO CONSOLIDADO', margin, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Unidade: ${schoolName} | Total de Ocorrências: ${records.length}`, margin, 18);

  let currentY = 32;

  for (let i = 0; i < records.length; i++) {
    const rec = records[i];
    if (currentY > 240) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFillColor(248, 250, 253);
    doc.setDrawColor(215, 225, 240);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 44, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 76, 129);
    doc.text(`#${i + 1} - ${rec.title.substring(0, 80)}`, margin + 3, currentY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(60, 70, 85);
    doc.text(`Prazo: ${formatDateOnly(rec.deadline)} | Categoria: ${rec.category} | Urgência: ${rec.urgency.toUpperCase()}`, margin + 3, currentY + 14);
    doc.text(`Data/Hora (Brasília): ${rec.formattedDateTimeBrasilia}`, margin + 3, currentY + 20);
    doc.text(`Autor: ${rec.authorName} (${rec.createdByRole})`, margin + 3, currentY + 26);

    const stColor = rec.status === 'realizado' ? [34, 139, 34] : [200, 100, 10];
    doc.setTextColor(stColor[0], stColor[1], stColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(`Status: ${rec.status.toUpperCase().replace('_', ' ')}`, margin + 3, currentY + 33);

    if (rec.resolution?.notes) {
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(80, 80, 80);
      doc.text(`Devolutiva: ${rec.resolution.notes.substring(0, 70)}...`, margin + 3, currentY + 39);
    }

    currentY += 50;
  }

  doc.save(`PARANA_NRE_MARINGA_Relatorio_${schoolName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}

/**
  * Generates PDF for a single Extra Work or Plan Work
  */
export async function generateExtraWorkSinglePDF(work: ExtraWork): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Header background bar (Deep Emerald/Navy)
  doc.setFillColor(13, 92, 70); // Deep Forest Green / SEED Paraná style
  doc.rect(0, 0, pageWidth, 26, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('ESTADO DO PARANÁ | NRE MARINGÁ - TRABALHO EXECUTADO', margin, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(210, 245, 230);
  const typeLabel = work.workType === 'plano_asg' 
    ? 'PLANO DE TRABALHO ASG' 
    : work.workType === 'conforme_plano' 
    ? 'CONFORME PLANO DE TRABALHO' 
    : 'MANUTENÇÃO EXTRA / NÃO PROGRAMADA';
  doc.text(`Tipo: ${typeLabel} | ID Registro: ${work.id}`, margin, 18);

  // School & Contractor Info Card
  doc.setFillColor(242, 248, 245);
  doc.setDrawColor(180, 220, 205);
  doc.roundedRect(margin, 30, pageWidth - margin * 2, 28, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 60, 45);
  doc.text(`ESCOLA: ${work.schoolName} (Cód: ${work.schoolCode})`, margin + 4, 37);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 80, 75);
  doc.text(`Empresa Executora: ${work.contractorName}`, margin + 4, 43);
  doc.text(`Responsável Técnico: ${work.responsibleTechnician} | Data Conclusão: ${formatDateOnly(work.completedDate)} (${work.completedTimeBrasilia})`, margin + 4, 49);
  doc.text(`Registrado por: ${work.registeredByName} (${work.registeredByRole.toUpperCase()}) | Categoria: ${work.category}`, margin + 4, 55);

  // Main Work Details Box
  const contentTop = 62;
  const contentWidth = pageWidth - margin * 2;

  // Title Box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(200, 215, 210);
  doc.roundedRect(margin, contentTop, contentWidth, 32, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 60, 45);
  doc.text('OBJETO DA INTERVENÇÃO:', margin + 4, contentTop + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 40, 40);
  const splitTitle = doc.splitTextToSize(work.title, contentWidth - 8);
  doc.text(splitTitle, margin + 4, contentTop + 12);

  if (work.costEstimate) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(13, 92, 70);
    doc.text(`Valor/Custo Estimado: ${work.costEstimate}`, margin + 4, contentTop + 27);
  }

  // Description Box
  const descTop = contentTop + 36;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(200, 215, 210);
  doc.roundedRect(margin, descTop, contentWidth, 38, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 60, 45);
  doc.text('DESCRIÇÃO DETALHADA DOS SERVIÇOS EXECUTADOS:', margin + 4, descTop + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 60, 60);
  const splitDesc = doc.splitTextToSize(work.description, contentWidth - 8);
  doc.text(splitDesc.slice(0, 5), margin + 4, descTop + 12);

  if (work.observations) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(80, 95, 90);
    doc.text(`Obs: ${work.observations.substring(0, 110)}`, margin + 4, descTop + 33);
  }

  // Photos Section (Foto Antes & Foto Depois / Conclusão)
  const photosTop = descTop + 42;
  const photoBoxWidth = work.photoBeforeUrl ? (contentWidth - 6) / 2 : contentWidth;
  const photoBoxHeight = 85;

  if (work.photoBeforeUrl) {
    // Foto Antes (Left)
    doc.setFillColor(245, 247, 250);
    doc.setDrawColor(200, 210, 220);
    doc.roundedRect(margin, photosTop, photoBoxWidth, photoBoxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(80, 90, 100);
    doc.text('REGISTRO ANTERIOR / SITUAÇÃO INICIAL:', margin + 3, photosTop + 6);

    const imgBeforeData = await getCleanImageDataUrl(work.photoBeforeUrl);
    if (imgBeforeData) {
      try {
        doc.addImage(imgBeforeData, 'JPEG', margin + 3, photosTop + 9, photoBoxWidth - 6, photoBoxHeight - 12);
      } catch (e) {
        console.warn('Could not add before image to PDF:', e);
      }
    }

    // Foto Depois / Conclusão (Right)
    const rightPhotoX = margin + photoBoxWidth + 6;
    doc.setFillColor(240, 250, 245);
    doc.setDrawColor(160, 220, 190);
    doc.roundedRect(rightPhotoX, photosTop, photoBoxWidth, photoBoxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(13, 92, 70);
    doc.text('COMPROVAÇÃO DA EXECUÇÃO / TRABALHO CONCLUÍDO:', rightPhotoX + 3, photosTop + 6);

    const imgAfterData = await getCleanImageDataUrl(work.photoAfterUrl);
    if (imgAfterData) {
      try {
        doc.addImage(imgAfterData, 'JPEG', rightPhotoX + 3, photosTop + 9, photoBoxWidth - 6, photoBoxHeight - 12);
      } catch (e) {
        console.warn('Could not add after image to PDF:', e);
      }
    }
  } else {
    // Single Big Photo Conclusão
    doc.setFillColor(240, 250, 245);
    doc.setDrawColor(160, 220, 190);
    doc.roundedRect(margin, photosTop, contentWidth, photoBoxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(13, 92, 70);
    doc.text('COMPROVAÇÃO FOTOGRÁFICA DO TRABALHO CONCRETIZADO:', margin + 4, photosTop + 6);

    const imgAfterData = await getCleanImageDataUrl(work.photoAfterUrl);
    if (imgAfterData) {
      try {
        doc.addImage(imgAfterData, 'JPEG', margin + (contentWidth - 120) / 2, photosTop + 9, 120, photoBoxHeight - 12);
      } catch (e) {
        console.warn('Could not add single after image to PDF:', e);
      }
    }
  }

  // Footer & Drive
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 110, 125);
  doc.text(`Pasta Oficial no Google Drive: ${work.driveUrl}`, margin, pageHeight - 12);
  doc.text('Laudo de Trabalho Concretizado - Estado do Paraná & NRE Maringá | Sistema de Manutenção', margin, pageHeight - 8);

  const cleanSchoolName = work.schoolName.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`PARANA_TRABALHO_EXTRA_${cleanSchoolName}_${work.id}.pdf`);
}

/**
 * Generates consolidated report for multiple Extra Works
 */
export async function generateExtraWorksReportPDF(schoolName: string, works: ExtraWork[]): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  doc.setFillColor(13, 92, 70);
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('ESTADO DO PARANÁ | NRE MARINGÁ - TRABALHOS EXTRAS CONCRETIZADOS', margin, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(220, 245, 235);
  doc.text(`Unidade / Abrangência: ${schoolName} | Total de Trabalhos Concretizados: ${works.length}`, margin, 18);

  let currentY = 32;

  for (let i = 0; i < works.length; i++) {
    const w = works[i];
    if (currentY > 235) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFillColor(246, 251, 248);
    doc.setDrawColor(180, 220, 200);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 48, 2, 2, 'FD');

    const typeBadge = w.workType === 'plano_asg'
      ? '[PLANO ASG]'
      : w.workType === 'conforme_plano'
      ? '[CONFORME PLANO]'
      : '[MANUTENÇÃO EXTRA]';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(13, 92, 70);
    doc.text(`#${i + 1} ${typeBadge} - ${w.title.substring(0, 75)}`, margin + 3, currentY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(50, 65, 60);
    doc.text(`Escola: ${w.schoolName} (Cód: ${w.schoolCode}) | Categoria: ${w.category}`, margin + 3, currentY + 14);
    doc.text(`Data Conclusão: ${formatDateOnly(w.completedDate)} (${w.completedTimeBrasilia}) | Empresa: ${w.contractorName}`, margin + 3, currentY + 20);
    doc.text(`Responsável Técnico: ${w.responsibleTechnician} | Cadastrado por: ${w.registeredByName}`, margin + 3, currentY + 26);
    
    if (w.costEstimate) {
      doc.text(`Custo: ${w.costEstimate}`, margin + 3, currentY + 32);
    }

    doc.setFont('helvetica', 'italic');
    doc.setTextColor(70, 80, 80);
    doc.text(`Serviço: ${w.description.substring(0, 95)}...`, margin + 3, currentY + 38);

    if (w.observations) {
      doc.text(`Obs: ${w.observations.substring(0, 90)}...`, margin + 3, currentY + 44);
    }

    currentY += 54;
  }

  doc.save(`PARANA_Relatorio_Trabalhos_Extras_${schoolName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}

/**
 * Generates official PDF report filtered by custom date range
 */
export async function generateDateFilteredReportPDF(
  scopeTitle: string,
  dateRangeText: string,
  records: MaintenanceRecord[],
  extraWorks: ExtraWork[] = []
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Header background bar (Governo do Paraná / SEED Style)
  doc.setFillColor(15, 76, 129); // Deep Blue / Navy
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Green accent bar
  doc.setFillColor(34, 139, 34);
  doc.rect(0, 28, pageWidth, 3, 'F');

  // Header text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('ESTADO DO PARANÁ | SECRETARIA DE ESTADO DA EDUCAÇÃO - SEED/PR', margin, 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(230, 245, 255);
  doc.text('NRE MARINGÁ - LAUDO OFICIAL DE MANUTENÇÃO ESCOLAR POR PERÍODO', margin, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(210, 235, 255);
  doc.text(`Abrangência: ${scopeTitle}  |  ${dateRangeText}`, margin, 24);

  // Statistics Summary Cards Box
  const summaryY = 36;
  doc.setFillColor(245, 248, 252);
  doc.setDrawColor(200, 220, 240);
  doc.roundedRect(margin, summaryY, pageWidth - margin * 2, 24, 2, 2, 'FD');

  const realizadosCount = records.filter(r => r.status === 'realizado').length;
  const naoRealizadosCount = records.filter(r => r.status === 'nao_realizado').length;
  const pendentesCount = records.filter(r => r.status === 'pendente' || r.status === 'em_andamento').length;
  const totalItems = records.length + extraWorks.length;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 76, 129);
  doc.text(`RESUMO CONSOLIDADO DO PERÍODO (${dateRangeText}):`, margin + 4, summaryY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(40, 50, 65);
  doc.text(`• Total de Solicitações/Itens: ${records.length}`, margin + 4, summaryY + 14);
  doc.text(`• Realizados: ${realizadosCount}`, margin + 60, summaryY + 14);
  doc.text(`• Não Realizados: ${naoRealizadosCount}`, margin + 105, summaryY + 14);
  doc.text(`• Pendentes: ${pendentesCount}`, margin + 150, summaryY + 14);

  if (extraWorks.length > 0) {
    doc.text(`• Trabalhos Extras/Plano Concretizados: ${extraWorks.length}`, margin + 4, summaryY + 20);
  }

  let currentY = summaryY + 30;

  // Section 1: Maintenance Records
  if (records.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 76, 129);
    doc.text(`1. OCORRÊNCIAS E SOLICITAÇÕES (${records.length} ITENS):`, margin, currentY);
    currentY += 6;

    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      if (currentY > 235) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFillColor(252, 253, 255);
      doc.setDrawColor(215, 225, 235);
      doc.roundedRect(margin, currentY, pageWidth - margin * 2, 44, 2, 2, 'FD');

      // Title & School
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(20, 40, 70);
      doc.text(`#${i + 1} - ${rec.title.substring(0, 80)}`, margin + 3, currentY + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(60, 70, 85);
      doc.text(`Escola: ${rec.schoolName} (Cód: ${rec.schoolCode})  |  Categoria: ${rec.category}  |  Urgência: ${rec.urgency.toUpperCase()}`, margin + 3, currentY + 13);
      doc.text(`Data Registro (Brasília): ${rec.formattedDateTimeBrasilia}  |  Prazo Limite: ${formatDateOnly(rec.deadline)}  |  Autor: ${rec.authorName}`, margin + 3, currentY + 19);

      // Status
      const isRealizado = rec.status === 'realizado';
      const isNaoRealizado = rec.status === 'nao_realizado';
      if (isRealizado) {
        doc.setTextColor(34, 139, 34);
        doc.setFont('helvetica', 'bold');
        doc.text('STATUS: [ X ] REALIZADO', margin + 3, currentY + 26);
      } else if (isNaoRealizado) {
        doc.setTextColor(190, 40, 20);
        doc.setFont('helvetica', 'bold');
        doc.text('STATUS: [ X ] NÃO REALIZADO', margin + 3, currentY + 26);
      } else {
        doc.setTextColor(200, 120, 10);
        doc.setFont('helvetica', 'bold');
        doc.text(`STATUS: ${rec.status.toUpperCase()}`, margin + 3, currentY + 26);
      }

      if (rec.resolution) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(50, 60, 70);
        const resText = `Devolutiva: ${rec.resolution.notes || 'Sem observações'} (Téc: ${rec.resolution.resolvedBy || '-'} em ${rec.resolution.resolvedTimeBrasilia || '-'})`;
        doc.text(doc.splitTextToSize(resText, pageWidth - margin * 2 - 8).slice(0, 2), margin + 3, currentY + 32);
        
        if (rec.resolution.newDeadlineIfUnresolved) {
          doc.setTextColor(190, 40, 20);
          doc.setFont('helvetica', 'bold');
          doc.text(`Novo Prazo: ${formatDateOnly(rec.resolution.newDeadlineIfUnresolved)}`, margin + 3, currentY + 41);
        }
      }

      currentY += 49;
    }
  }

  // Section 2: Extra Works Concretizados
  if (extraWorks.length > 0) {
    if (currentY > 220) {
      doc.addPage();
      currentY = 20;
    } else {
      currentY += 6;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(13, 92, 70);
    doc.text(`2. TRABALHOS EXTRAS E OBRAS DO PLANO CONCRETIZADOS (${extraWorks.length} ITENS):`, margin, currentY);
    currentY += 6;

    for (let j = 0; j < extraWorks.length; j++) {
      const w = extraWorks[j];
      if (currentY > 235) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFillColor(246, 252, 248);
      doc.setDrawColor(180, 220, 200);
      doc.roundedRect(margin, currentY, pageWidth - margin * 2, 44, 2, 2, 'FD');

      const typeBadge = w.workType === 'plano_asg'
        ? '[PLANO ASG]'
        : w.workType === 'conforme_plano'
        ? '[CONFORME PLANO]'
        : '[MANUTENÇÃO EXTRA]';
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(13, 92, 70);
      doc.text(`#${j + 1} ${typeBadge} - ${w.title.substring(0, 75)}`, margin + 3, currentY + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(50, 65, 60);
      doc.text(`Escola: ${w.schoolName}  |  Categoria: ${w.category}  |  Conclusão: ${formatDateOnly(w.completedDate)} (${w.completedTimeBrasilia})`, margin + 3, currentY + 13);
      doc.text(`Empresa: ${w.contractorName}  |  Responsável: ${w.responsibleTechnician}  |  Custo: ${w.costEstimate || 'N/I'}`, margin + 3, currentY + 19);

      doc.setFont('helvetica', 'italic');
      doc.setTextColor(60, 70, 70);
      const splitDesc = doc.splitTextToSize(w.description, pageWidth - margin * 2 - 8);
      doc.text(splitDesc.slice(0, 2), margin + 3, currentY + 26);

      currentY += 49;
    }
  }

  // Footer
  const cleanScope = scopeTitle.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`LAUDO_MANUTENCAO_${cleanScope}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
