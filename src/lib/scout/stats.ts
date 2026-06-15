import type { Tables } from "@/integrations/supabase/types";
import { POSITIONS, SHOT_TYPES, RESULTS, ZONES, type Zone } from "@/lib/scout/constants";

export type Shot = Tables<"shots">;

export type Stats = {
  total: number;
  defesas: number;
  gols: number;
  trave: number;
  fora: number;
  eficiencia: number;
};

export function computeStats(shots: Shot[]): Stats {
  const total = shots.length;
  const defesas = shots.filter((s) => s.result === "defesa").length;
  const gols = shots.filter((s) => s.result === "gol").length;
  const trave = shots.filter((s) => s.result === "trave").length;
  const fora = shots.filter((s) => s.result === "fora").length;
  const eficiencia = total > 0 ? (defesas / total) * 100 : 0;
  return { total, defesas, gols, trave, fora, eficiencia };
}

export function statsByShotType(shots: Shot[]) {
  return SHOT_TYPES.map((t) => {
    const subset = shots.filter((s) => s.shot_type === t.value);
    const s = computeStats(subset);
    return { key: t.value, label: t.label, ...s };
  });
}

export function statsByPosition(shots: Shot[]) {
  return POSITIONS.map((p) => {
    const subset = shots.filter((s) => s.position === p.value);
    const s = computeStats(subset);
    return { key: p.value, label: p.label, ...s };
  });
}

export function statsByPlayer(shots: Shot[]) {
  const map = new Map<number, { arremessos: number; gols: number; defesas: number }>();
  for (const s of shots) {
    if (s.player_number == null) continue;
    const cur = map.get(s.player_number) ?? { arremessos: 0, gols: 0, defesas: 0 };
    cur.arremessos += 1;
    if (s.result === "gol") cur.gols += 1;
    if (s.result === "defesa") cur.defesas += 1;
    map.set(s.player_number, cur);
  }
  return Array.from(map.entries())
    .map(([numero, v]) => ({ numero, ...v }))
    .sort((a, b) => b.arremessos - a.arremessos);
}

export function heatmapBy(shots: Shot[], filter?: (s: Shot) => boolean) {
  const counts: Partial<Record<Zone, number>> = {};
  for (const s of shots) {
    if (filter && !filter(s)) continue;
    if (!ZONES.includes(s.zone as Zone)) continue;
    counts[s.zone as Zone] = (counts[s.zone as Zone] ?? 0) + 1;
  }
  return counts;
}

export const RESULT_DEFS = RESULTS;
