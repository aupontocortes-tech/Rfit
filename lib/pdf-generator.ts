import { jsPDF } from "jspdf";
import type { AssessmentData } from "./body-assessment-types";

// Normalises height to cm regardless of whether user typed metres or centimetres
function normalizarAlturaCm(altura: number): number {
  if (!Number.isFinite(altura) || altura <= 0) return 0;
  return altura <= 3 ? altura * 100 : altura;
}

function textRight(doc: jsPDF, str: string, xRight: number, y: number) {
  doc.text(str, xRight, y, { align: "right" });
}

// Draws a high-quality pie chart on a hidden <canvas> and returns its PNG data URL
function criarImagemGraficoPizza(
  massaMagra: number,
  massaGorda: number,
  percentualGordura: number
): string {
  const scale = 3;
  const W = 320,
    H = 220;
  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);

  ctx.clearRect(0, 0, W, H);

  const cx = 100,
    cy = 105,
    r = 82;
  const percentualMagra = 100 - percentualGordura;

  const startMagra = -Math.PI / 2;
  const endMagra = startMagra + (percentualMagra / 100) * 2 * Math.PI;

  const gradMagra = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, 0, cx, cy, r);
  gradMagra.addColorStop(0, "#86efac");
  gradMagra.addColorStop(1, "#15803d");
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, r, startMagra, endMagra);
  ctx.closePath();
  ctx.fillStyle = gradMagra;
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.stroke();

  const gradGorda = ctx.createRadialGradient(cx + r * 0.2, cy - r * 0.2, 0, cx, cy, r);
  gradGorda.addColorStop(0, "#fde68a");
  gradGorda.addColorStop(1, "#b45309");
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, r, endMagra, startMagra + 2 * Math.PI);
  ctx.closePath();
  ctx.fillStyle = gradGorda;
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (percentualMagra > 6) {
    const midMagra = startMagra + (percentualMagra / 100) * Math.PI;
    const lx = cx + r * 0.6 * Math.cos(midMagra);
    const ly = cy + r * 0.6 * Math.sin(midMagra);
    ctx.font = `bold 13px Arial`;
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 3;
    ctx.fillText(`${percentualMagra.toFixed(1)}%`, lx, ly);
    ctx.shadowBlur = 0;
  }

  if (percentualGordura > 4) {
    const midGorda = endMagra + ((100 - percentualMagra) / 100) * Math.PI;
    const lx = cx + r * 0.6 * Math.cos(midGorda);
    const ly = cy + r * 0.6 * Math.sin(midGorda);
    ctx.font = `bold 13px Arial`;
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 3;
    ctx.fillText(`${percentualGordura.toFixed(1)}%`, lx, ly);
    ctx.shadowBlur = 0;
  }

  const lx = 200,
    ly0 = 72;
  ctx.textAlign = "left";
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#22c55e";
  roundRect(ctx, lx, ly0, 14, 14, 3);
  ctx.font = "bold 11px Arial";
  ctx.fillStyle = "#1e1e1e";
  ctx.fillText("Massa Magra", lx + 18, ly0 + 7);
  ctx.font = "11px Arial";
  ctx.fillStyle = "#555555";
  ctx.fillText(`${massaMagra.toFixed(2)} kg`, lx + 18, ly0 + 22);

  ctx.fillStyle = "#f59e0b";
  roundRect(ctx, lx, ly0 + 42, 14, 14, 3);
  ctx.font = "bold 11px Arial";
  ctx.fillStyle = "#1e1e1e";
  ctx.fillText("Massa Gorda", lx + 18, ly0 + 49);
  ctx.font = "11px Arial";
  ctx.fillStyle = "#555555";
  ctx.fillText(`${massaGorda.toFixed(2)} kg`, lx + 18, ly0 + 64);

  return canvas.toDataURL("image/png");
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

export function generatePDF(data: AssessmentData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const gutter = 6;
  const colLeftX = margin;
  const colLeftW = (pageWidth - 2 * margin - gutter) / 2;
  const colRightX = colLeftX + colLeftW + gutter;
  const colRightW = colLeftW;

  const innerPad = 4;
  const rowH = 5;
  const titleBarH = 7;

  const gold: [number, number, number] = [180, 150, 50];
  const black: [number, number, number] = [30, 30, 30];
  const gray: [number, number, number] = [110, 110, 110];
  const lightGray: [number, number, number] = [235, 235, 235];
  const green: [number, number, number] = [34, 197, 94];
  const darkGreen: [number, number, number] = [21, 128, 61];
  const white: [number, number, number] = [255, 255, 255];

  const alturaCm = normalizarAlturaCm(data.cliente.altura);
  const alturaM = alturaCm / 100;

  // Colunas fixas – esquerda (dobras / protocolo)
  const L_labelX = colLeftX + innerPad;
  const L_valRight = colLeftX + colLeftW - innerPad - 9;
  const L_unitX = colLeftX + colLeftW - innerPad;

  // Colunas fixas – direita: medidas gerais (nome | valor | unidade)
  const Rg_labelX = colRightX + innerPad;
  const Rg_valRight = colRightX + colRightW - innerPad - 9;
  const Rg_unitX = colRightX + colRightW - innerPad;

  // Colunas fixas – direita: Nome | Direito | Esquerdo (valores alinhados à direita)
  const Rb_dirRight = colRightX + colRightW * 0.62;
  const Rb_esqRight = colRightX + colRightW - innerPad;

  let y = 14;

  // ── Cabeçalho ─────────────────────────────────────────────────
  doc.setFillColor(22, 22, 22);
  doc.rect(0, 0, pageWidth, 30, "F");

  doc.setFillColor(...gold);
  doc.rect(margin, y - 3, 5, 18, "F");

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...gold);
  doc.text("RFIT", margin + 9, y + 8);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...gray);
  doc.text("Avaliação Corporal Profissional", margin + 9, y + 13);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...white);
  doc.text(`AVALIADO: ${data.cliente.nome.toUpperCase()}`, pageWidth - margin, y + 3, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 200, 200);
  doc.text(`DATA: ${data.cliente.dataAvaliacao}`, pageWidth - margin, y + 9, { align: "right" });
  if (data.cliente.avaliador) {
    doc.text(`AVALIADOR: ${data.cliente.avaliador}`, pageWidth - margin, y + 15, { align: "right" });
  }

  y = 36;

  // Faixa título – largura total (mantém identidade)
  doc.setFillColor(...gold);
  doc.rect(margin, y, pageWidth - margin * 2, titleBarH, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...black);
  doc.text("Composição Corporal", pageWidth / 2, y + 5, { align: "center" });

  const yAfterTitle = y + titleBarH + 3;
  let yLeft = yAfterTitle;
  let yRight = yAfterTitle;

  // ── Esquerda: peso / altura ───────────────────────────────────
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...black);
  doc.text("Peso atual:", L_labelX, yLeft);
  doc.setFont("helvetica", "bold");
  textRight(doc, `${data.cliente.peso.toFixed(1)}`, L_valRight, yLeft);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...gray);
  doc.text("kg", L_unitX, yLeft, { align: "right" });

  yLeft += 6;
  doc.setTextColor(...black);
  doc.setFont("helvetica", "normal");
  doc.text("Altura:", L_labelX, yLeft);
  doc.setFont("helvetica", "bold");
  textRight(doc, `${alturaM.toFixed(2)}`, L_valRight, yLeft);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...gray);
  doc.text("m", L_unitX, yLeft, { align: "right" });

  yLeft += 7;

  // IMC + TMB só na coluna esquerda (evita sobreposição na coluna direita)
  if (data.resultados) {
    const boxH = 14;
    const gap = 3;
    const halfW = (colLeftW - innerPad * 2 - gap) / 2;
    const boxY = yLeft;
    const imcX = colLeftX + innerPad;

    doc.setDrawColor(...gray);
    doc.setLineWidth(0.3);
    doc.setFillColor(...lightGray);
    doc.roundedRect(imcX, boxY, halfW, boxH, 1.5, 1.5, "FD");

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...black);
    doc.text(`IMC: ${data.resultados.imc.toFixed(1)}`, imcX + halfW / 2, boxY + 5.5, { align: "center" });
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...gray);
    const clsLines = doc.splitTextToSize(data.resultados.classificacaoIMC, halfW - 3);
    doc.text(clsLines, imcX + halfW / 2, boxY + 10, { align: "center" });

    const tmbX = imcX + halfW + gap;
    doc.setFillColor(...gold);
    doc.roundedRect(tmbX, boxY, halfW, boxH, 1.5, 1.5, "F");

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...black);
    doc.text(`TMB: ${data.resultados.tmb.toFixed(0)} kcal`, tmbX + halfW / 2, boxY + 5.5, { align: "center" });
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    const tmbSub = doc.splitTextToSize("Taxa Metabólica Basal", halfW - 2);
    doc.text(tmbSub, tmbX + halfW / 2, boxY + 10.5, { align: "center" });

    yLeft = boxY + boxH + 5;
  }

  // ── Direita: Perímetros (mesma altura inicial alinhada ao bloco esquerdo) ──
  doc.setFillColor(...gold);
  doc.rect(colRightX, yRight, colRightW, titleBarH, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...black);
  doc.text("Perímetros", colRightX + colRightW / 2, yRight + 5, { align: "center" });

  yRight += titleBarH + 4;

  // Subseção: medidas gerais
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...black);
  doc.text("Medidas gerais", colRightX + innerPad, yRight);
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.5);
  doc.line(colRightX + innerPad, yRight + 1.5, colRightX + colRightW - innerPad, yRight + 1.5);
  yRight += 5;

  const troncoMedidas = [
    { label: "Ombro", value: data.medidas.ombro },
    { label: "Pescoço", value: data.medidas.pescoco },
    { label: "Tórax Relaxado", value: data.medidas.toraxRelaxado },
    { label: "Tórax Inspirado", value: data.medidas.toraxInspirado },
    { label: "Abdome", value: data.medidas.abdome },
    { label: "Cintura", value: data.medidas.cintura },
    { label: "Quadril", value: data.medidas.quadril },
  ];

  doc.setFontSize(8.5);
  troncoMedidas.forEach((item, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(248, 248, 248);
      doc.rect(colRightX + innerPad, yRight - 3.2, colRightW - innerPad * 2, rowH, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...black);
    doc.text(item.label, Rg_labelX, yRight);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...black);
    textRight(doc, item.value > 0 ? item.value.toFixed(2) : "–", Rg_valRight, yRight);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...gray);
    doc.text("cm", Rg_unitX, yRight, { align: "right" });
    yRight += rowH;
  });

  yRight += 4;

  // Subseção: membros – tabela Nome | Direito | Esquerdo
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...black);
  doc.text("Medidas direito / esquerdo", colRightX + innerPad, yRight);
  doc.setDrawColor(...gold);
  doc.line(colRightX + innerPad, yRight + 1.5, colRightX + colRightW - innerPad, yRight + 1.5);
  yRight += 5;

  doc.setFillColor(248, 248, 248);
  doc.rect(colRightX + innerPad, yRight - 3, colRightW - innerPad * 2, rowH + 0.5, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...black);
  doc.text("Nome", Rg_labelX, yRight);
  textRight(doc, "Direito", Rb_dirRight, yRight);
  textRight(doc, "Esquerdo", Rb_esqRight, yRight);
  yRight += rowH;

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...gray);
  doc.text("(cm)", Rg_labelX, yRight);
  textRight(doc, "(cm)", Rb_dirRight, yRight);
  textRight(doc, "(cm)", Rb_esqRight, yRight);
  yRight += rowH;

  const membrosMedidas = [
    { label: "Antebraço", dir: data.medidas.antebracoDireito, esq: data.medidas.antebracoEsquerdo },
    { label: "Braço Relaxado", dir: data.medidas.bracoRelaxadoDireito, esq: data.medidas.bracoRelaxadoEsquerdo },
    { label: "Braço Contraído", dir: data.medidas.bracoContraidoDireito, esq: data.medidas.bracoContraidoEsquerdo },
    { label: "Coxa", dir: data.medidas.coxaDireita, esq: data.medidas.coxaEsquerda },
    { label: "Panturrilha", dir: data.medidas.panturrilhaDireita, esq: data.medidas.panturrilhaEsquerda },
  ];

  doc.setFontSize(8.5);
  membrosMedidas.forEach((item, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(248, 248, 248);
      doc.rect(colRightX + innerPad, yRight - 3.2, colRightW - innerPad * 2, rowH, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...black);
    doc.text(item.label, Rg_labelX, yRight);
    doc.setFont("helvetica", "bold");
    textRight(doc, item.dir > 0 ? item.dir.toFixed(2) : "–", Rb_dirRight, yRight);
    textRight(doc, item.esq > 0 ? item.esq.toFixed(2) : "–", Rb_esqRight, yRight);
    yRight += rowH;
  });

  yRight += 5;

  // ── Blocos de resultado (largura = coluna direita, padding uniforme) ──
  const boxPad = 5;
  const rcqBoxH = 18;
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.8);
  doc.setFillColor(255, 251, 235);
  doc.roundedRect(colRightX, yRight, colRightW, rcqBoxH, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...black);
  doc.text("Relação Cintura × Quadril (RCQ):", colRightX + boxPad, yRight + 6);

  if (data.resultados && data.resultados.rcq > 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    const rcqLine = `${data.resultados.rcq.toFixed(2)}  –  ${data.resultados.classificacaoRCQ}`;
    const rcqSplit = doc.splitTextToSize(rcqLine, colRightW - boxPad * 2);
    doc.text(rcqSplit, colRightX + boxPad, yRight + 13);
  }

  yRight += rcqBoxH + 5;

  if (data.resultados) {
    const fatBoxH = 24;
    doc.setDrawColor(...green);
    doc.setLineWidth(0.5);
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(colRightX, yRight, colRightW, fatBoxH, 2, 2, "FD");

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkGreen);
    doc.text("% Gordura Corporal:", colRightX + boxPad, yRight + 7);

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(`${data.resultados.percentualGordura.toFixed(1)}%`, colRightX + boxPad, yRight + 16);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...gray);
    const clsFat = doc.splitTextToSize(data.resultados.classificacaoGordura, colRightW - boxPad * 2);
    doc.text(clsFat, colRightX + boxPad, yRight + 21);

    yRight += fatBoxH + 4;
  }

  // ── Esquerda: Dobras (largura fixa colLeftW) ───────────────────
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...black);
  doc.text("Dobras Cutâneas", L_labelX, yLeft);
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.5);
  doc.line(L_labelX, yLeft + 1.5, colLeftX + colLeftW - innerPad, yLeft + 1.5);
  yLeft += 5;

  const dobrasData = [
    { label: "Subescapular", value: data.dobras.subescapular },
    { label: "Bicipital", value: data.dobras.biceps ?? 0 },
    { label: "Tricipital", value: data.dobras.triceps },
    { label: "Axilar-média", value: data.dobras.axilarMedia },
    { label: "Supra-ilíaca", value: data.dobras.supraIliaca },
    { label: "Peitoral", value: data.dobras.peitoral },
    { label: "Abdominal", value: data.dobras.abdomen },
    { label: "Coxa", value: data.dobras.coxa },
    { label: "Panturrilha", value: data.dobras.panturrilha ?? 0 },
  ];

  doc.setFontSize(8.5);
  dobrasData.forEach((item, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(248, 248, 248);
      doc.rect(colLeftX + innerPad, yLeft - 3.2, colLeftW - innerPad * 2, rowH, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...black);
    doc.text(item.label, L_labelX, yLeft);
    doc.setFont("helvetica", "bold");
    textRight(doc, item.value > 0 ? item.value.toFixed(2) : "–", L_valRight, yLeft);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...gray);
    doc.text("mm", L_unitX, yLeft, { align: "right" });
    yLeft += rowH;
  });

  yLeft += 3;

  // Protocolo Pollock
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...black);
  doc.text("Protocolo POLLOCK – 7 DOBRAS", L_labelX, yLeft);
  doc.setDrawColor(...gold);
  doc.line(L_labelX, yLeft + 1.5, colLeftX + colLeftW - innerPad, yLeft + 1.5);
  yLeft += 5;

  if (data.resultados) {
    const meta = data.resultados.metaPercentual;
    const pollockData = [
      { label: "% Gordura ideal", value: `${meta.min} – ${meta.max}`, unit: "%" },
      { label: "% Gordura atual", value: data.resultados.percentualGordura.toFixed(2), unit: "%" },
      { label: "Massa Magra", value: data.resultados.massaMagra.toFixed(2), unit: "kg" },
      { label: "Massa Gorda", value: data.resultados.massaGorda.toFixed(2), unit: "kg" },
    ];

    doc.setFontSize(8.5);
    pollockData.forEach((item, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(248, 248, 248);
        doc.rect(colLeftX + innerPad, yLeft - 3.2, colLeftW - innerPad * 2, rowH, "F");
      }
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...black);
      doc.text(item.label, L_labelX, yLeft);
      doc.setFont("helvetica", "bold");
      textRight(doc, item.value, L_valRight, yLeft);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...gray);
      doc.text(item.unit, L_unitX, yLeft, { align: "right" });
      yLeft += rowH;
    });
  }

  yLeft += 3;

  // Gráfico – largura = coluna esquerda
  if (data.resultados) {
    try {
      const chartImgData = criarImagemGraficoPizza(
        data.resultados.massaMagra,
        data.resultados.massaGorda,
        data.resultados.percentualGordura
      );
      const chartW = colLeftW;
      const chartH = chartW * (220 / 320);
      doc.addImage(chartImgData, "PNG", colLeftX, yLeft, chartW, chartH);
      yLeft += chartH + 4;
    } catch {
      // canvas indisponível
    }
  }

  // Rodapé
  const footerY = pageHeight - 22;

  doc.setFillColor(245, 245, 245);
  doc.rect(margin, footerY - 2, pageWidth - margin * 2, 14, "F");
  doc.setDrawColor(...lightGray);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2);

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...gray);
  const footerText =
    "A análise da composição corporal é a quantificação dos principais componentes estruturais do corpo humano. O tamanho e a forma corporais são determinados basicamente pela carga genética e formam a base sobre a qual são dispostos, em proporções variadas, os três maiores componentes estruturais do corpo humano: osso, músculo e gordura.";
  const splitFooter = doc.splitTextToSize(footerText, pageWidth - margin * 2 - 20);
  doc.text(splitFooter, margin + 2, footerY + 3);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...gold);
  doc.text("RFIT", pageWidth - margin, pageHeight - 8, { align: "right" });

  return doc;
}

export function downloadPDF(data: AssessmentData): void {
  const doc = generatePDF(data);
  const fileName = `rfit_${data.cliente.nome.replace(/\s+/g, "_")}_${data.cliente.dataAvaliacao.replace(/\//g, "-")}.pdf`;
  doc.save(fileName);
}

export function sharePDF(data: AssessmentData): void {
  const doc = generatePDF(data);
  const pdfBlob = doc.output("blob");

  if (navigator.share && navigator.canShare) {
    const file = new File([pdfBlob], `rfit_${data.cliente.nome}.pdf`, { type: "application/pdf" });
    navigator.share({
      files: [file],
      title: "Rfit - Avaliação Corporal",
      text: `Avaliação Corporal de ${data.cliente.nome}`,
    }).catch(console.error);
  } else {
    downloadPDF(data);
  }
}

export function printPDF(data: AssessmentData): void {
  const doc = generatePDF(data);
  const pdfDataUri = doc.output("datauristring");
  const printWindow = window.open(pdfDataUri);
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}
