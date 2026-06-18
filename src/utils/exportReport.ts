import { jsPDF } from 'jspdf';
import type { Room, Source, Receiver, SimulationResponse, SoundFieldHeatmap, Wall } from '../../shared/types';
import { COLORS } from '../../shared/constants';

interface ExportData {
  room: Room;
  sources: Source[];
  receivers: Receiver[];
  simulationResult: SimulationResponse | null;
  heatmaps: SoundFieldHeatmap[];
  walls: Wall[];
}

function getHeatColor(t: number): { r: number; g: number; b: number } {
  const colors = [
    { t: 0.0, r: 0, g: 0, b: 139 },
    { t: 0.2, r: 0, g: 100, b: 255 },
    { t: 0.4, r: 0, g: 255, b: 255 },
    { t: 0.6, r: 0, g: 255, b: 100 },
    { t: 0.8, r: 255, g: 255, b: 0 },
    { t: 1.0, r: 255, g: 50, b: 0 },
  ];
  for (let i = 0; i < colors.length - 1; i++) {
    if (t <= colors[i + 1].t) {
      const range = colors[i + 1].t - colors[i].t;
      const f = (t - colors[i].t) / range;
      return {
        r: Math.round(colors[i].r + f * (colors[i + 1].r - colors[i].r)),
        g: Math.round(colors[i].g + f * (colors[i + 1].g - colors[i].g)),
        b: Math.round(colors[i].b + f * (colors[i + 1].b - colors[i].b)),
      };
    }
  }
  return { r: 255, g: 50, b: 0 };
}

function renderHeatmapToCanvas(heatmap: SoundFieldHeatmap): string {
  const gridU = heatmap.gridSize.u;
  const gridV = heatmap.gridSize.v;
  const w = gridU * 10;
  const h = gridV * 10;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.createImageData(w, h);

  const energies: number[][] = [];
  let minDb = Infinity;
  let maxDb = -Infinity;
  for (let v = 0; v < gridV; v++) {
    energies[v] = [];
    for (let u = 0; u < gridU; u++) {
      const db = heatmap.points[v * gridU + u]?.db ?? -120;
      energies[v][u] = db;
      if (db > maxDb) maxDb = db;
      if (db < minDb) minDb = db;
    }
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = (x / w) * (gridU - 1);
      const v = (y / h) * (gridV - 1);
      const u0 = Math.floor(u);
      const v0 = Math.floor(v);
      const u1 = Math.min(u0 + 1, gridU - 1);
      const v1 = Math.min(v0 + 1, gridV - 1);
      const uFrac = u - u0;
      const vFrac = v - v0;

      const e00 = energies[v0]?.[u0] ?? -120;
      const e10 = energies[v0]?.[u1] ?? -120;
      const e01 = energies[v1]?.[u0] ?? -120;
      const e11 = energies[v1]?.[u1] ?? -120;
      const db = e00 * (1 - uFrac) * (1 - vFrac) + e10 * uFrac * (1 - vFrac) + e01 * (1 - uFrac) * vFrac + e11 * uFrac * vFrac;

      const normalized = maxDb !== minDb ? Math.max(0, Math.min(1, (db - minDb) / (maxDb - minDb))) : 0.5;
      const color = getHeatColor(normalized);
      const idx = (y * w + x) * 4;
      imageData.data[idx] = color.r;
      imageData.data[idx + 1] = color.g;
      imageData.data[idx + 2] = color.b;
      imageData.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

function captureThreeCanvas(): string | null {
  const canvases = document.querySelectorAll('canvas');
  for (const c of canvases) {
    if (c.width > 300 && c.height > 300) {
      return c.toDataURL('image/png');
    }
  }
  return null;
}

export async function exportReport(data: ExportData): Promise<void> {
  const { room, sources, receivers, simulationResult, heatmaps } = data;
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageW = 210;
  const margin = 15;
  const lineH = 6;
  let y = margin;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(0, 51, 102);
  pdf.text('室内声学仿真报告', pageW / 2, y, { align: 'center' });
  y += 10;

  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`生成时间: ${new Date().toLocaleString('zh-CN')}`, pageW / 2, y, { align: 'center' });
  y += 12;

  pdf.setDrawColor(0, 180, 220);
  pdf.setLineWidth(0.5);
  pdf.line(margin, y, pageW - margin, y);
  y += 8;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(0, 51, 102);
  pdf.text('1. 场景参数', margin, y);
  y += 8;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(60, 60, 60);

  const roomType = room.type === 'box' ? '长方体' : 'L型';
  pdf.text(`房间类型: ${roomType}`, margin, y); y += lineH;
  pdf.text(`尺寸: ${room.dimensions.width}m x ${room.dimensions.height}m x ${room.dimensions.depth}m`, margin, y); y += lineH;
  if (room.type === 'l-shape') {
    pdf.text(`延伸: ${room.dimensions.lExtension || 4}m x ${room.dimensions.lWidth || 4}m`, margin, y); y += lineH;
  }
  pdf.text(`声源数量: ${sources.length}`, margin, y); y += lineH;
  sources.forEach((s, i) => {
    pdf.text(`  声源${i + 1}: (${s.position.x.toFixed(1)}, ${s.position.y.toFixed(1)}, ${s.position.z.toFixed(1)}), 功率: ${s.power}dB`, margin, y);
    y += lineH;
  });
  pdf.text(`接收点数量: ${receivers.length}`, margin, y); y += lineH;
  receivers.forEach((r, i) => {
    pdf.text(`  接收点${i + 1}: (${r.position.x.toFixed(1)}, ${r.position.y.toFixed(1)}, ${r.position.z.toFixed(1)}), 半径: ${r.radius}m`, margin, y);
    y += lineH;
  });

  y += 4;
  pdf.line(margin, y, pageW - margin, y);
  y += 8;

  if (simulationResult) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(0, 51, 102);
    pdf.text('2. 声学参数', margin, y);
    y += 8;

    const ap = simulationResult.acousticParams;
    const stats = simulationResult.stats;

    const paramData = [
      ['参数', '数值', '说明'],
      ['RT60', `${ap.rt60.toFixed(2)} s`, '混响时间 (60dB衰减)'],
      ['RT30', `${ap.rt30.toFixed(2)} s`, '混响时间 (30dB衰减)'],
      ['T20', `${ap.t20.toFixed(2)} s`, '早期混响时间'],
      ['C50', `${ap.c50.toFixed(1)} dB`, '清晰度指数'],
      ['D50', `${ap.d50.toFixed(1)} %`, '语言清晰度'],
    ];

    const colW = [(pageW - margin * 2) * 0.25, (pageW - margin * 2) * 0.25, (pageW - margin * 2) * 0.5];
    let ty = y;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setFillColor(0, 51, 102);
    pdf.setTextColor(255, 255, 255);
    pdf.rect(margin, ty - 4, colW[0] + colW[1] + colW[2], lineH + 2, 'F');
    paramData[0].forEach((cell, ci) => {
      let x = margin;
      for (let i = 0; i < ci; i++) x += colW[i];
      pdf.text(cell, x + 2, ty);
    });
    ty += lineH;

    pdf.setFont('helvetica', 'normal');
    for (let ri = 1; ri < paramData.length; ri++) {
      pdf.setFillColor(ri % 2 === 0 ? 245 : 255, 245, 245);
      pdf.setTextColor(60, 60, 60);
      pdf.rect(margin, ty - 4, colW[0] + colW[1] + colW[2], lineH + 2, 'F');
      paramData[ri].forEach((cell, ci) => {
        let x = margin;
        for (let i = 0; i < ci; i++) x += colW[i];
        pdf.text(cell, x + 2, ty);
      });
      ty += lineH;
    }
    y = ty + 4;

    pdf.setFontSize(10);
    pdf.setTextColor(60, 60, 60);
    pdf.text(`总射线数: ${stats.totalRays}    有效射线: ${stats.effectiveRays}    计算耗时: ${stats.computeTime}ms`, margin, y);
    y += 10;
  }

  pdf.line(margin, y, pageW - margin, y);
  y += 8;

  const threeCanvas = captureThreeCanvas();
  if (threeCanvas) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(0, 51, 102);
    pdf.text('3. 3D场景截图', margin, y);
    y += 8;

    const imgW = pageW - margin * 2;
    const imgH = imgW * 0.5;
    pdf.addImage(threeCanvas, 'PNG', margin, y, imgW, imgH);
    y += imgH + 8;
  }

  if (heatmaps.length > 0) {
    pdf.line(margin, y, pageW - margin, y);
    y += 8;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(0, 51, 102);
    pdf.text('4. 声场云图 (热力图)', margin, y);
    y += 8;

    for (const heatmap of heatmaps) {
      if (y + 80 > 280) {
        pdf.addPage();
        y = margin;
      }

      pdf.setFontSize(11);
      pdf.setTextColor(60, 60, 60);
      const wallLabel = heatmap.wallId === 'floor' || heatmap.wallId.includes('floor') ? '地面' :
                         heatmap.wallId === 'ceiling' || heatmap.wallId.includes('ceiling') ? '天花板' :
                         `墙面 (${heatmap.wallId})`;
      pdf.text(`${wallLabel} 声场分布`, margin, y);
      y += 6;

      const heatmapImg = renderHeatmapToCanvas(heatmap);
      const hw = 80;
      const hh = 80;
      pdf.addImage(heatmapImg, 'PNG', margin, y, hw, hh);

      pdf.setFontSize(8);
      pdf.text(`范围: ${heatmap.minDb.toFixed(1)} ~ ${heatmap.maxDb.toFixed(1)} dB`, margin + hw + 5, y + 20);
      pdf.text(`分辨率: ${heatmap.gridSize.u}x${heatmap.gridSize.v}`, margin + hw + 5, y + 28);
      y += hh + 8;
    }
  }

  pdf.line(margin, y, pageW - margin, y);
  y += 8;

  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text('本报告由室内声学仿真辅助工具自动生成，仅供参考。', pageW / 2, y, { align: 'center' });

  pdf.save(`声学仿真报告_${new Date().toISOString().slice(0, 10)}.pdf`);
}