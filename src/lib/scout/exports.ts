import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Shot } from "./stats";
import { computeStats, statsByShotType, statsByPosition, statsByPlayer } from "./stats";
import { positionLabel, resultLabel, shotTypeLabel } from "./constants";

type Game = {
  team_name: string;
  opponent: string;
  game_date: string;
  goalkeeper_name: string;
  competition?: string | null;
  category?: string | null;
};

function rowsForShots(shots: Shot[]) {
  return shots.map((s) => ({
    Data: new Date(s.created_at).toLocaleString("pt-BR"),
    Tempo: s.game_time ?? "",
    "Nº Jogador": s.player_number ?? "",
    Posição: positionLabel(s.position),
    "Tipo de arremesso": shotTypeLabel(s.shot_type),
    Zona: s.zone,
    Resultado: resultLabel(s.result),
    "Mão dominante": s.dominant_hand ?? "",
  }));
}

export function exportCSV(game: Game, shots: Shot[]) {
  const rows = rowsForShots(shots);
  const ws = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(ws);
  download(new Blob([csv], { type: "text/csv;charset=utf-8" }), filename(game, "csv"));
}

export function exportXLSX(game: Game, shots: Shot[]) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rowsForShots(shots)), "Arremessos");

  const stats = computeStats(shots);
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet([
      { Métrica: "Total de arremessos", Valor: stats.total },
      { Métrica: "Defesas", Valor: stats.defesas },
      { Métrica: "Gols sofridos", Valor: stats.gols },
      { Métrica: "Trave", Valor: stats.trave },
      { Métrica: "Fora", Valor: stats.fora },
      { Métrica: "Eficiência (%)", Valor: stats.eficiencia.toFixed(1) },
    ]),
    "Resumo",
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      statsByShotType(shots).map((r) => ({
        Situação: r.label,
        Arremessos: r.total,
        Defesas: r.defesas,
        Gols: r.gols,
        "Eficiência (%)": r.eficiencia.toFixed(1),
      })),
    ),
    "Por situação",
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      statsByPlayer(shots).map((r) => ({
        Nº: r.numero,
        Arremessos: r.arremessos,
        Gols: r.gols,
        Defesas: r.defesas,
      })),
    ),
    "Por jogador",
  );

  XLSX.writeFile(wb, filename(game, "xlsx"));
}

export function exportPDF(game: Game, shots: Shot[]) {
  const doc = new jsPDF();
  const stats = computeStats(shots);
  doc.setFontSize(16);
  doc.text("Relatório de Scout — GoalScout", 14, 16);
  doc.setFontSize(10);
  doc.text(
    [
      `${game.team_name} vs ${game.opponent}`,
      `Data: ${new Date(game.game_date + "T00:00").toLocaleDateString("pt-BR")}`,
      `Goleiro: ${game.goalkeeper_name}`,
      game.competition ? `Competição: ${game.competition}` : "",
      game.category ? `Categoria: ${game.category}` : "",
    ]
      .filter(Boolean)
      .join("    "),
    14,
    24,
  );

  autoTable(doc, {
    startY: 32,
    head: [["Métrica", "Valor"]],
    body: [
      ["Total de arremessos", String(stats.total)],
      ["Defesas", String(stats.defesas)],
      ["Gols sofridos", String(stats.gols)],
      ["Trave", String(stats.trave)],
      ["Fora", String(stats.fora)],
      ["Eficiência", `${stats.eficiencia.toFixed(1)}%`],
    ],
    headStyles: { fillColor: [14, 42, 71] },
  });

  autoTable(doc, {
    head: [["Situação", "Arremessos", "Defesas", "Gols", "Eficiência"]],
    body: statsByShotType(shots).map((r) => [
      r.label,
      r.total,
      r.defesas,
      r.gols,
      `${r.eficiencia.toFixed(1)}%`,
    ]),
    headStyles: { fillColor: [14, 42, 71] },
  });

  autoTable(doc, {
    head: [["Posição", "Arremessos", "Defesas", "Gols", "Eficiência"]],
    body: statsByPosition(shots).map((r) => [
      r.label,
      r.total,
      r.defesas,
      r.gols,
      `${r.eficiencia.toFixed(1)}%`,
    ]),
    headStyles: { fillColor: [14, 42, 71] },
  });

  autoTable(doc, {
    head: [["Nº jogador", "Arremessos", "Gols", "Defesas"]],
    body: statsByPlayer(shots).map((r) => [r.numero, r.arremessos, r.gols, r.defesas]),
    headStyles: { fillColor: [14, 42, 71] },
  });

  doc.save(filename(game, "pdf"));
}

function filename(game: Game, ext: string) {
  const date = game.game_date;
  const safe = (s: string) => s.replace(/[^a-z0-9-_]+/gi, "-");
  return `scout_${safe(game.team_name)}_vs_${safe(game.opponent)}_${date}.${ext}`;
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
