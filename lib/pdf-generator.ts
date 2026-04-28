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

/** Desenha um gráfico de pizza 3D diretamente no jsPDF (sem canvas) */
function desenharGrafico3D(
  doc: jsPDF,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  depth: number,
  percentualGordura: number,
  massaMagra: number,
  massaGorda: number,
  green: [number, number, number],
  orange: [number, number, number],
  black: [number, number, number],
  gray: [number, number, number]
) {
  const percentualMagra = 100 - percentualGordura;

  // Converte ângulo (0° = topo) para radianos do SVG/canvas
  const toRad = (angle: number) => (angle - 90) * (Math.PI / 180);

  const pt = (angle: number, rxi = rx, ryi = ry) => ({
    x: cx + rxi * Math.cos(toRad(angle)),
    y: cy + ryi * Math.sin(toRad(angle)),
  });

  const endAngleMagra = (percentualMagra / 100) * 360;

  // ── Sombra base ──────────────────────────────────────────────
  doc.setFillColor(200, 200, 200);
  doc.setDrawColor(200, 200, 200);
  doc.ellipse(cx, cy + depth + 2, rx * 0.98, ry * 0.35, "F");

  // ── Parede 3D (espessura) – apenas arco frontal (90° a 270°) ──
  const wallSegs = [
    { start: Math.max(0, 90),        end: Math.min(endAngleMagra, 270),  color: [21, 128, 61]  as [number,number,number] },
    { start: Math.max(endAngleMagra, 90), end: 270,                       color: [161, 98, 7]   as [number,number,number] },
  ];

  for (const seg of wallSegs) {
    if (seg.start >= seg.end) continue;
    const steps = Math.ceil((seg.end - seg.start) / 6);
    for (let i = 0; i < steps; i++) {
      const a1 = seg.start + (seg.end - seg.start) * (i / steps);
      const a2 = seg.start + (seg.end - seg.start) * ((i + 1) / steps);
      const p1 = pt(a1);
      const p2 = pt(a2);
      const darkness = 0.6 + 0.4 * ((a2 - 90) / 180);
      doc.setFillColor(
        Math.round(seg.color[0] * darkness),
        Math.round(seg.color[1] * darkness),
        Math.round(seg.color[2] * darkness)
      );
      doc.setDrawColor(seg.color[0], seg.color[1], seg.color[2]);
      doc.lines(
        [
          [p2.x - p1.x, p2.y - p1.y],
          [0, depth],
          [p1.x - p2.x, 0],
          [0, -depth],
        ],
        p1.x, p1.y, [1, 1], "F", true
      );
    }
  }

  // ── Fatia Massa Magra (verde) ───────────────────────────────
  doc.setFillColor(...green);
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.4);
  {
    const steps = Math.max(60, Math.ceil(endAngleMagra / 3));
    const pts: [number, number][] = [[cx, cy]];
    for (let i = 0; i <= steps; i++) {
      const angle = (endAngleMagra * i) / steps;
      const p = pt(angle);
      pts.push([p.x, p.y]);
    }
    pts.push([cx, cy]);
    doc.setFillColor(...green);
    doc.lines(
      pts.slice(1).map((p, idx) => [p[0] - pts[idx][0], p[1] - pts[idx][1]] as [number, number]),
      pts[0][0], pts[0][1], [1, 1], "FD", true
    );
  }

  // ── Fatia Massa Gorda (laranja) ─────────────────────────────
  {
    const steps = Math.max(60, Math.ceil((360 - endAngleMagra) / 3));
    const pts: [number, number][] = [[cx, cy]];
    for (let i = 0; i <= steps; i++) {
      const angle = endAngleMagra + ((360 - endAngleMagra) * i) / steps;
      const p = pt(angle);
      pts.push([p.x, p.y]);
    }
    pts.push([cx, cy]);
    doc.setFillColor(...orange);
    doc.lines(
      pts.slice(1).map((p, idx) => [p[0] - pts[idx][0], p[1] - pts[idx][1]] as [number, number]),
      pts[0][0], pts[0][1], [1, 1], "FD", true
    );
  }

  // ── Borda do contorno da elipse ──────────────────────────────
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.5);
  doc.ellipse(cx, cy, rx, ry, "S");

  // ── Labels percentuais dentro das fatias ─────────────────────
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);

  if (percentualMagra > 5) {
    const midMagra = endAngleMagra / 2;
    const lp = pt(midMagra, rx * 0.58, ry * 0.58);
    doc.text(`${percentualMagra.toFixed(1)}%`, lp.x, lp.y, { align: "center", baseline: "middle" });
  }
  if (percentualGordura > 4) {
    const midGorda = endAngleMagra + (360 - endAngleMagra) / 2;
    const lp = pt(midGorda, rx * 0.58, ry * 0.58);
    doc.text(`${percentualGordura.toFixed(1)}%`, lp.x, lp.y, { align: "center", baseline: "middle" });
  }

  // ── Legenda ──────────────────────────────────────────────────
  const legX = cx + rx + 5;
  const legY = cy - 10;

  doc.setFillColor(...green);
  doc.rect(legX, legY, 5, 5, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...black);
  doc.text("Massa Magra", legX + 7, legY + 4);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...gray);
  doc.text(`${massaMagra.toFixed(2)} kg`, legX + 7, legY + 9);

  doc.setFillColor(...orange);
  doc.rect(legX, legY + 14, 5, 5, "F");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...black);
  doc.text("Massa Gorda", legX + 7, legY + 18);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...gray);
  doc.text(`${massaGorda.toFixed(2)} kg`, legX + 7, legY + 23);
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

  // ── Gráfico de pizza 3D (nativo jsPDF) ─────────────────────
  if (data.resultados) {
    const orange: [number, number, number] = [230, 130, 20];
    const chartCX = colLeftX + colLeftW * 0.42;
    const chartCY = yLeft + 22;
    const chartRX = colLeftW * 0.34;
    const chartRY = colLeftW * 0.20;
    const chartDepth = 8;

    desenharGrafico3D(
      doc,
      chartCX, chartCY,
      chartRX, chartRY, chartDepth,
      data.resultados.percentualGordura,
      data.resultados.massaMagra,
      data.resultados.massaGorda,
      green, orange, black, gray
    );

    yLeft = chartCY + chartRY + chartDepth + 18;
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

/** Abre o PDF em nova aba para visualização (blob URL). Retorna false se o pop-up foi bloqueado. */
export function viewPDF(data: AssessmentData): boolean {
  const doc = generatePDF(data);
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (!win) {
    URL.revokeObjectURL(url);
    return false;
  }
  setTimeout(() => URL.revokeObjectURL(url), 600_000);
  return true;
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
