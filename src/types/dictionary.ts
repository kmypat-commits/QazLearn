export interface DictionaryEntry {
  id: number;
  type: 'word' | 'phrase';
  kz: string;
  ru: string;
  example_kz: string;
  example_ru: string;
  category: Category;
  status: Status;
  difficulty: number;
  source: string;
  tags: string[];
}

export type Category = 'office' | 'official' | 'it_ai' | 'general';
export type Status = 'new' | 'learning' | 'mastered';
export type KnowledgeLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface ProgressEntry {
  id: number;
  attempts: number;
  correctAnswers: number;
  wrongAnswers: number;
  lastReviewedAt: string | null;
  nextReviewAt: string | null;
  knowledgeLevel: KnowledgeLevel;
  reviewStatus: 'new' | 'learning' | 'review' | 'mastered';
  consecutiveCorrect: number;
}

export type Direction = 'kz-ru' | 'ru-kz';

export type PracticeMode =
  | 'flashcard'
  | 'scratch'
  | 'input-kz'
  | 'input-ru'
  | 'choice'
  | 'phrase-build';

export type AnswerRating = 'dont-know' | 'hard' | 'good' | 'easy';

export interface SessionStats {
  total: number;
  current: number;
  correct: number;
  wrong: number;
}

export interface GrammarRule {
  id: string;
  titleRu: string;
  titleKz: string;
  category: string;
  level: string;
  shortRuleRu: string;
  formation: string;
  formula: string;
  examples: { kz: string; ru: string }[];
  noteRu: string;
  tags: string[];
}

export type RuleStatus = 'new' | 'learned' | 'review';

export interface RuleProgress {
  id: string;
  status: RuleStatus;
  lastReviewedAt: string | null;
}

export type Page =
  | 'dashboard'
  | 'words'
  | 'phrases'
  | 'rules'
  | 'practice'
  | 'progress'
  | 'import';
