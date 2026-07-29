import type { ParagraphEntry, ParagraphProgress, ParagraphError } from '../../types/dictionary';

const KEYS = {
  paragraphs: 'qazlearn_paragraphs',
  progress: 'qazlearn_paragraph_progress',
  errors: 'qazlearn_paragraph_errors',
  drafts: 'qazlearn_paragraph_drafts',
};

const defaultProgress: Omit<ParagraphProgress, 'id'> = {
  attempts: 0,
  correctSentences: 0,
  partialSentences: 0,
  totalErrors: 0,
  usedHints: 0,
  status: 'new',
  lastAttemptAt: null,
  draft: '',
  isHard: false,
};

export function loadParagraphEntries(): ParagraphEntry[] {
  try {
    const data = localStorage.getItem(KEYS.paragraphs);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveParagraphEntries(entries: ParagraphEntry[]): void {
  localStorage.setItem(KEYS.paragraphs, JSON.stringify(entries));
}

export function loadParagraphProgress(): Record<string, ParagraphProgress> {
  try {
    const data = localStorage.getItem(KEYS.progress);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export function saveParagraphProgress(progress: Record<string, ParagraphProgress>): void {
  localStorage.setItem(KEYS.progress, JSON.stringify(progress));
}

export function getParagraphProgress(id: string): ParagraphProgress {
  const all = loadParagraphProgress();
  if (all[id]) return all[id];
  return { id, ...defaultProgress };
}

export function updateParagraphProgress(id: string, updates: Partial<ParagraphProgress>): void {
  const all = loadParagraphProgress();
  const current = all[id] || { id, ...defaultProgress };
  all[id] = { ...current, ...updates };
  saveParagraphProgress(all);
}

export function loadParagraphErrors(): ParagraphError[] {
  try {
    const data = localStorage.getItem(KEYS.errors);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveParagraphErrors(errors: ParagraphError[]): void {
  localStorage.setItem(KEYS.errors, JSON.stringify(errors));
}

export function addParagraphError(error: ParagraphError): void {
  const errors = loadParagraphErrors();
  errors.push(error);
  saveParagraphErrors(errors);
}

export function loadParagraphDrafts(): Record<string, string> {
  try {
    const data = localStorage.getItem(KEYS.drafts);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export function saveParagraphDraft(id: string, draft: string): void {
  const drafts = loadParagraphDrafts();
  drafts[id] = draft;
  localStorage.setItem(KEYS.drafts, JSON.stringify(drafts));
}

export function getParagraphDraft(id: string): string | null {
  const drafts = loadParagraphDrafts();
  return drafts[id] ?? null;
}
