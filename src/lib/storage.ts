import type { DictionaryEntry, ProgressEntry, KnowledgeLevel } from '../types/dictionary';

const KEYS = {
  dictionary: 'qazlearn_dictionary',
  progress: 'qazlearn_progress',
  settings: 'qazlearn_settings',
  streak: 'qazlearn_streak',
  dailyStats: 'qazlearn_daily_stats',
  theme: 'qazlearn_theme',
};

export function loadDictionary(): DictionaryEntry[] {
  try {
    const data = localStorage.getItem(KEYS.dictionary);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveDictionary(entries: DictionaryEntry[]): void {
  localStorage.setItem(KEYS.dictionary, JSON.stringify(entries));
}

export function loadProgress(): Record<number, ProgressEntry> {
  try {
    const data = localStorage.getItem(KEYS.progress);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export function saveProgress(progress: Record<number, ProgressEntry>): void {
  localStorage.setItem(KEYS.progress, JSON.stringify(progress));
}

export function getOrCreateProgress(
  entryId: number,
  progressMap: Record<number, ProgressEntry>
): ProgressEntry {
  if (progressMap[entryId]) return progressMap[entryId];
  const entry: ProgressEntry = {
    id: entryId,
    attempts: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    lastReviewedAt: null,
    nextReviewAt: null,
    knowledgeLevel: 0 as KnowledgeLevel,
    reviewStatus: 'new',
    consecutiveCorrect: 0,
  };
  progressMap[entryId] = entry;
  return entry;
}

export function loadStreak(): number {
  try {
    return parseInt(localStorage.getItem(KEYS.streak) || '0');
  } catch {
    return 0;
  }
}

export function saveStreak(streak: number): void {
  localStorage.setItem(KEYS.streak, streak.toString());
}

export function updateStreak(): number {
  const today = new Date().toDateString();
  const last = localStorage.getItem('qazlearn_last_active');
  let streak = loadStreak();

  if (last === today) return streak;

  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (last === yesterday) {
    streak++;
  } else if (last !== today) {
    streak = 1;
  }

  localStorage.setItem('qazlearn_last_active', today);
  saveStreak(streak);
  return streak;
}

export interface DailyStats {
  date: string;
  correct: number;
  wrong: number;
}

export function loadDailyStats(): DailyStats {
  try {
    const data = localStorage.getItem(KEYS.dailyStats);
    const parsed = data ? JSON.parse(data) : null;
    const today = new Date().toDateString();
    if (parsed && parsed.date === today) return parsed;
    return { date: today, correct: 0, wrong: 0 };
  } catch {
    return { date: new Date().toDateString(), correct: 0, wrong: 0 };
  }
}

export function saveDailyStats(stats: DailyStats): void {
  localStorage.setItem(KEYS.dailyStats, JSON.stringify(stats));
}

export function recordAnswer(correct: boolean): void {
  const stats = loadDailyStats();
  if (correct) stats.correct++;
  else stats.wrong++;
  saveDailyStats(stats);
}

export function loadTheme(): 'light' | 'dark' {
  try {
    const val = localStorage.getItem(KEYS.theme);
    if (val === 'dark' || val === 'light') return val;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function saveTheme(theme: 'light' | 'dark'): void {
  localStorage.setItem(KEYS.theme, theme);
}

export function resetAllData(): void {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k));
}

export function exportWithProgress(
  entries: DictionaryEntry[],
  progress: Record<number, ProgressEntry>
): string {
  return JSON.stringify({ entries, progress }, null, 2);
}
