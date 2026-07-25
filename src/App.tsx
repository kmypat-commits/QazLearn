import { useState, useEffect, useCallback } from 'react';
import type { DictionaryEntry, ProgressEntry, AnswerRating, PracticeMode } from './types/dictionary';
import { parseCsv } from './lib/csv';
import {
  loadDictionary, saveDictionary,
  loadProgress, saveProgress,
  getOrCreateProgress,
  loadTheme, saveTheme,
  updateStreak, recordAnswer,
} from './lib/storage';
import { updateProgress, needsReview } from './lib/spacedRepetition';
import Dashboard from './pages/Dashboard';
import Words from './pages/Words';
import Phrases from './pages/Phrases';
import Practice from './pages/Practice';
import ProgressView from './pages/Progress';
import ImportCsv from './pages/ImportCsv';
import csvRaw from './assets/kazakh_learning_dictionary.csv?raw';

type Page = 'dashboard' | 'words' | 'phrases' | 'practice' | 'progress' | 'import';

const NAV_ITEMS: { id: Page; label: string }[] = [
  { id: 'dashboard', label: 'Обзор' },
  { id: 'words', label: 'Слова' },
  { id: 'phrases', label: 'Фразы' },
  { id: 'practice', label: 'Практика' },
  { id: 'progress', label: 'Прогресс' },
  { id: 'import', label: 'Импорт CSV' },
];

export default function App() {
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [progress, setProgress] = useState<Record<number, ProgressEntry>>({});
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [menuOpen, setMenuOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [practiceFilter, setPracticeFilter] = useState<{ ids?: number[]; mode?: PracticeMode }>({});

  useEffect(() => {
    const savedTheme = loadTheme();
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');

    const dict = loadDictionary();
    const prog = loadProgress();

    if (dict.length > 0) {
      setEntries(dict);
      setProgress(prog);
      setLoaded(true);
    } else {
      try {
        const parsed = parseCsv(csvRaw);
        setEntries(parsed);
        saveDictionary(parsed);
      } catch (err) {
        console.error('Failed to parse CSV:', err);
      }
      setLoaded(true);
    }

    updateStreak();
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    saveTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  const handleProgressUpdate = useCallback((entryId: number, rating: AnswerRating) => {
    setProgress(prev => {
      const newProgress = { ...prev };
      const prog = getOrCreateProgress(entryId, newProgress);
      newProgress[entryId] = updateProgress({ ...prog }, rating);
      saveProgress(newProgress);

      if (rating === 'good' || rating === 'easy') {
        recordAnswer(true);
      } else {
        recordAnswer(false);
      }

      updateStreak();
      return newProgress;
    });
  }, []);

  const handleImport = useCallback((newEntries: DictionaryEntry[]) => {
    setEntries(newEntries);
    saveDictionary(newEntries);
  }, []);

  const goToPractice = useCallback((options?: { ids?: number[]; mode?: PracticeMode }) => {
    setPracticeFilter(options || {});
    setCurrentPage('practice');
  }, []);

  const dueForReview = entries.filter(e => {
    const p = progress[e.id];
    return p && needsReview(p) && p.reviewStatus !== 'mastered';
  }).length;

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-2">QazLearn</div>
          <p className="text-[var(--color-text-secondary)]">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
        <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <button className="text-lg font-bold" onClick={() => setCurrentPage('dashboard')}>
            QazLearn
          </button>

          <div className="hidden sm:flex items-center gap-1">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                  currentPage === item.id
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]'
                }`}
                onClick={() => setCurrentPage(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {dueForReview > 0 && (
              <button
                className="hidden sm:flex items-center gap-1 text-sm text-[var(--color-warning)]"
                onClick={() => setCurrentPage('practice')}
              >
                <span className="w-2 h-2 rounded-full bg-[var(--color-warning)]" />
                {dueForReview}
              </button>
            )}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-[var(--color-border)] transition-colors text-lg"
              title={theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <button
              className="sm:hidden p-2 rounded-xl hover:bg-[var(--color-border)]"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="sm:hidden border-t border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="px-4 py-2 space-y-1">
              {NAV_ITEMS.map(item => (
                <button
                  key={item.id}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium ${
                    currentPage === item.id
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'text-[var(--color-text-secondary)]'
                  }`}
                  onClick={() => { setCurrentPage(item.id); setMenuOpen(false); }}
                >
                  {item.label}
                </button>
              ))}
              {dueForReview > 0 && (
                <div className="px-3 py-2 text-sm text-[var(--color-warning)]">
                  🔄 {dueForReview} на повторение
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {currentPage === 'dashboard' && <Dashboard entries={entries} progress={progress} onGoToPractice={goToPractice} onNavigate={(p) => setCurrentPage(p as Page)} />}
        {currentPage === 'words' && <Words entries={entries} progress={progress} onProgressUpdate={handleProgressUpdate} onGoToPractice={goToPractice} />}
        {currentPage === 'phrases' && <Phrases entries={entries} progress={progress} onProgressUpdate={handleProgressUpdate} onGoToPractice={goToPractice} />}

        {currentPage === 'practice' && <Practice key={JSON.stringify(practiceFilter)} entries={entries} onProgressUpdate={handleProgressUpdate} filterIds={practiceFilter.ids} initialMode={practiceFilter.mode} />}
        {currentPage === 'progress' && <ProgressView entries={entries} progress={progress} />}
        {currentPage === 'import' && <ImportCsv entries={entries} onImport={handleImport} />}
      </main>
    </div>
  );
}
