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
  const [pageFilter, setPageFilter] = useState<{ status?: string }>({});

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

  const goToPage = useCallback((page: Page, filter?: { status?: string; ids?: number[] }) => {
    if (page === 'practice') {
      setPracticeFilter({ ids: filter?.ids });
    } else {
      setPageFilter(filter || {});
    }
    setCurrentPage(page);
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
      <header className="sticky top-0 z-50 bg-[var(--color-surface)]/80 backdrop-blur-md border-b border-[var(--color-border)]/50">
        <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <button className="text-lg font-bold tracking-tight text-[var(--color-text)] flex items-center gap-1.5 transition-opacity hover:opacity-80" onClick={() => setCurrentPage('dashboard')}>
            <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"></path>
            </svg>
            <span className="font-extrabold">QazLearn</span>
          </button>

          <div className="hidden sm:flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-full">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
                  currentPage === item.id
                    ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                }`}
                onClick={() => setCurrentPage(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {dueForReview > 0 && (
              <button
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--color-warning)]/10 text-[var(--color-warning)]"
                onClick={() => setCurrentPage('practice')}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-warning)] animate-pulse" />
                <span>{dueForReview}</span>
              </button>
            )}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] flex items-center justify-center"
              title={theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
            >
              {theme === 'light' ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
              )}
            </button>
            <button
              className="sm:hidden p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] flex items-center justify-center"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="sm:hidden border-t border-[var(--color-border)]/50 bg-[var(--color-surface)]/95 backdrop-blur-md">
            <div className="px-4 py-3 space-y-1">
              {NAV_ITEMS.map(item => (
                <button
                  key={item.id}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                    currentPage === item.id
                      ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                  onClick={() => { setCurrentPage(item.id); setMenuOpen(false); }}
                >
                  {item.label}
                </button>
              ))}
              {dueForReview > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-[var(--color-warning)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-warning)]" />
                  {dueForReview} на повторение
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {currentPage === 'dashboard' && <Dashboard entries={entries} progress={progress} onGoToPractice={goToPractice} onNavigate={(p) => setCurrentPage(p as Page)} />}
        {currentPage === 'words' && <Words key={pageFilter.status || 'all'} entries={entries} progress={progress} onProgressUpdate={handleProgressUpdate} onGoToPractice={goToPractice} initialStatus={pageFilter.status as any} />}
        {currentPage === 'phrases' && <Phrases key={pageFilter.status || 'all'} entries={entries} progress={progress} onProgressUpdate={handleProgressUpdate} onGoToPractice={goToPractice} initialStatus={pageFilter.status as any} />}

        {currentPage === 'practice' && <Practice key={JSON.stringify(practiceFilter)} entries={entries} progress={progress} onProgressUpdate={handleProgressUpdate} filterIds={practiceFilter.ids} initialMode={practiceFilter.mode} />}
        {currentPage === 'progress' && <ProgressView entries={entries} progress={progress} onNavigate={goToPage} />}
        {currentPage === 'import' && <ImportCsv entries={entries} onImport={handleImport} />}
      </main>
    </div>
  );
}
