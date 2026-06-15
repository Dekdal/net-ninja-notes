export const POSITIONS = [
  { value: "ponta_esq", label: "Ponta Esquerda", short: "PE" },
  { value: "ponta_dir", label: "Ponta Direita", short: "PD" },
  { value: "armador_esq", label: "Armador Esquerdo", short: "AE" },
  { value: "armador_cen", label: "Armador Central", short: "AC" },
  { value: "armador_dir", label: "Armador Direito", short: "AD" },
  { value: "pivo", label: "Pivô", short: "PV" },
] as const;

export const SHOT_TYPES = [
  { value: "6m", label: "6 metros" },
  { value: "7m", label: "7 metros" },
  { value: "9m", label: "9 metros" },
  { value: "contra_ataque", label: "Contra-ataque" },
  { value: "ponta", label: "Ponta" },
] as const;

export const RESULTS = [
  { value: "gol", label: "Gol", color: "bg-destructive text-destructive-foreground" },
  { value: "defesa", label: "Defesa", color: "bg-success text-success-foreground" },
  { value: "trave", label: "Trave", color: "bg-warning text-warning-foreground" },
  { value: "fora", label: "Fora", color: "bg-muted text-foreground" },
] as const;

export const ZONES = [
  "A1", "A2", "A3",
  "B1", "B2", "B3",
  "C1", "C2", "C3",
] as const;

export type Zone = (typeof ZONES)[number];
export type Position = (typeof POSITIONS)[number]["value"];
export type ShotType = (typeof SHOT_TYPES)[number]["value"];
export type ShotResult = (typeof RESULTS)[number]["value"];

export const positionLabel = (v: string) =>
  POSITIONS.find((p) => p.value === v)?.label ?? v;
export const shotTypeLabel = (v: string) =>
  SHOT_TYPES.find((p) => p.value === v)?.label ?? v;
export const resultLabel = (v: string) =>
  RESULTS.find((p) => p.value === v)?.label ?? v;
