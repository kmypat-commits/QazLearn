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
export type ParagraphCategory = 'general' | 'office' | 'official' | 'it_ai' | 'route';
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

export type ParagraphDirection = 'ru_kz' | 'kz_ru';

export type ParagraphEntryStatus = 'new' | 'learning' | 'hard' | 'mastered';

export interface ParagraphEntry {
  id: string;
  title: string;
  ruText: string;
  kzText: string;
  alternativeKz: string[];
  alternativeRu: string[];
  category: ParagraphCategory;
  difficulty: number;
  keyWords: string[];
  grammarFocus: string[];
  constructorBlocksKz: string[];
  constructorBlocksRu: string[];
  explanation: string;
  status: ParagraphEntryStatus;
  source: string;
  tags: string[];
}

export interface ParagraphAttempt {
  paragraphId: string;
  direction: ParagraphDirection;
  userAnswer: string;
  createdAt: string;
  usedHints: number;
  revealedAnswer: boolean;
  errors: ParagraphError[];
}

export type ParagraphErrorType =
  | 'spelling'
  | 'vocabulary'
  | 'accusative'
  | 'genitive'
  | 'dative'
  | 'ablative'
  | 'possessive'
  | 'verb_form'
  | 'participle'
  | 'converb'
  | 'word_order'
  | 'collocation'
  | 'missing_word'
  | 'extra_word'
  | 'punctuation';

export interface ParagraphError {
  id: string;
  paragraphId: string;
  sentenceIndex: number;
  userFragment: string;
  correctFragment: string;
  errorType: ParagraphErrorType;
  explanation: string;
  ruleId?: string;
  repeatCount: number;
  status: 'new' | 'learning' | 'repeated' | 'mastered';
  createdAt: string;
  lastRepeatedAt?: string;
}

export interface ParagraphProgress {
  id: string;
  attempts: number;
  correctSentences: number;
  partialSentences: number;
  totalErrors: number;
  usedHints: number;
  status: ParagraphEntryStatus;
  lastAttemptAt: string | null;
  draft: string;
  isHard: boolean;
}

export type Page =
  | 'dashboard'
  | 'words'
  | 'phrases'
  | 'rules'
  | 'paragraphs'
  | 'practice'
  | 'paragraphErrors'
  | 'progress'
  | 'import';
