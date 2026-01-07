export interface VocabWord {
  id: string;
  kr: string;
  en: string[];
  level: VocabLevel;
}

export type VocabLevel = 'A' | 'B' | 'C' | 'D' | 'MISC';
