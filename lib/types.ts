export type ExerciseType =
  | 'gap' | 'write' | 'paradigm' | 'tf' | 'choice'
  | 'match' | 'reorder' | 'model' | 'free' | 'personal';

export interface GapItem { html: string; gaps: number; answers: string[] }
export interface WriteItem { html: string; answers: string[]; ipaNote?: string }
export interface TFItem { html: string; answer: boolean; note: string }
export interface ChoiceItem { html: string; answer: string }
export interface MatchItem { left: string; letter: string; right: string }
export interface ReorderItem { tokens: string[]; answer: string }
export interface PlainItem { html: string }

export interface Exercise {
  id: string;
  type: ExerciseType;
  title: string;            // html
  noteHtml: string;         // html ('' if none)
  keyHtml: string;          // answer-key html for model reveals
  items: (GapItem | WriteItem | TFItem | ChoiceItem | MatchItem | ReorderItem | PlainItem)[];
  pairs?: Record<string, string>;  // match: 1-based index → letter
  options?: string[];              // choice categories
  ipa?: boolean;                   // IPA-lenient checking (EX 1.1)
  caps?: boolean;                  // stressed-syllable CAPS checking (EX 1.3)
  oral?: boolean;                  // free exercises that ask to speak aloud
}

export type UnitBlock =
  | { kind: 'html'; html: string }
  | { kind: 'exercise'; ex: Exercise };

export interface Unit {
  num: number;
  title: string;       // html
  blocks: UnitBlock[];
  exerciseIds: string[];
}

export interface GlossaryRow { ca: string; ipa: string; en: string; unit: number }

export interface MockData {
  introNote: string;                 // html
  script: string;
  p1items: string[];
  p1answers: { val: boolean; note: string }[];
  p2notice: string;
  p2aItems: string[];
  p2aKeyHtml: string;
  p2bItems: MatchItem[];
  p2bPairs: Record<string, string>;
  p3form: string[];                  // html with ___ placeholders
  p3bTask: string;                   // html
  p3bModel: string;                  // html
  p4qs: string[];
  p4role: string;                    // html
  p4mark: string;                    // html
  p4model: string;                   // html
  p4roleModel: string;               // html
}

export interface Course {
  counts: { units: number; exercises: number; glossary: number };
  introHtml: string;
  ipaGuideHtml: string;
  examInfoHtml: string;
  units: Unit[];
  glossary: GlossaryRow[];
  checklist: string[];               // html per item
  checklistFootHtml: string;
  citeHtml: string;
  mock: MockData;
}
