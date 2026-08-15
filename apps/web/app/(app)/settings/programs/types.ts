export type ProgramTypeValue = "GROUP" | "INDIVIDUAL" | "BABIES" | "ADULTS" | "OTHER";

export interface LevelItem {
  id: string;
  name: string;
  sortOrder: number;
}

export interface ProgramItem {
  id: string;
  name: string;
  type: ProgramTypeValue;
  levels: LevelItem[];
}

export const PROGRAM_TYPE_LABELS: Record<ProgramTypeValue, string> = {
  GROUP: "Grupal",
  INDIVIDUAL: "Individual",
  BABIES: "Bebes",
  ADULTS: "Adultos",
  OTHER: "Otro",
};
