import { useState, useEffect, useCallback, type ReactNode } from 'react';
import type { DictionaryEntry, ProgressEntry, AnswerRating, PracticeMode, Page } from './types/dictionary';
import { parseCsv } from './lib/csv';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import {
  loadDictionary, saveDictionary,
  loadProgress as loadProgressLocal, saveProgress as saveProgressLocal,
  getOrCreateProgress,
  loadTheme, saveTheme,
  updateStreak as updateStreakLocal, recordAnswer as recordAnswerLocal,
} from './lib/storage';
import * as db from './lib/db';
import { updateProgress, needsReview } from './lib/spacedRepetition';
import Dashboard from './pages/Dashboard';
import Words from './pages/Words';
import Phrases from './pages/Phrases';
import Rules from './pages/Rules';
import Practice from './pages/Practice';
import ProgressView from './pages/Progress';
import ImportCsv from './pages/ImportCsv';
import Auth from './pages/Auth';
import csvRaw from './assets/kazakh_learning_dictionary.csv?raw';

const NAV_SECTIONS: { label: string; items: { id: Page; label: string; icon: string }[] }[] = [
  {
    label: 'Обучение',
    items: [
      { id: 'dashboard', label: 'Обзор', icon: 'grid' },
      { id: 'words', label: 'Слова', icon: 'book' },
      { id: 'phrases', label: 'Фразы', icon: 'message' },
      { id: 'rules', label: 'Правила', icon: 'document' },
      { id: 'practice', label: 'Практика', icon: 'play' },
    ],
  },
  {
    label: 'Статистика',
    items: [
      { id: 'progress', label: 'Прогресс', icon: 'chart' },
    ],
  },
  {
    label: 'Данные',
    items: [
      { id: 'import', label: 'Импорт CSV', icon: 'upload' },
    ],
  },
];

const PAGE_TITLES: Record<Page, string> = {
  dashboard: 'Обзор',
  words: 'Слова',
  phrases: 'Фразы',
  rules: 'Правила',
  practice: 'Практика',
  progress: 'Прогресс',
  import: 'Импорт CSV',
};

export default function App() {
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [progress, setProgress] = useState<Record<number, ProgressEntry>>({});
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [menuOpen, setMenuOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [practiceFilter, setPracticeFilter] = useState<{ ids?: number[]; mode?: PracticeMode; ruleIds?: string[] }>({});
  const [pageFilter, setPageFilter] = useState<{ status?: string }>({});

  useEffect(() => {
    const savedTheme = loadTheme();
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  useEffect(() => {
    async function init() {
      if (isSupabaseConfigured()) {
        const { data: { session } } = await supabase.auth.getSession();
        setAuthed(!!session);

        supabase.auth.onAuthStateChange((_event, session) => {
          setAuthed(!!session);
        });
      } else {
        setAuthed(true);
      }
      setAuthChecking(false);
    }
    init();
  }, []);

  useEffect(() => {
    if (!authed) return;

    async function loadData() {
      const dict = loadDictionary();
      let prog = loadProgressLocal();

      if (isSupabaseConfigured()) {
        const remote = await db.loadProgress();
        if (Object.keys(remote).length > 0) {
          prog = remote;
        }
      }

      if (dict.length > 0) {
        setEntries(dict);
        setProgress(prog);
      } else {
        try {
          const parsed = parseCsv(csvRaw);
          setEntries(parsed);
          saveDictionary(parsed);
        } catch (err) {
          console.error('Failed to parse CSV:', err);
        }
      }
      setLoaded(true);

      if (isSupabaseConfigured()) {
        await db.updateStreak();
      } else {
        updateStreakLocal();
      }
    }
    loadData();
  }, [authed]);

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
      const updated = updateProgress({ ...prog }, rating);
      newProgress[entryId] = updated;
      saveProgressLocal(newProgress);
      db.saveProgressEntry(entryId, updated);
      if (rating === 'good' || rating === 'easy') {
        recordAnswerLocal(true);
        db.recordAnswer(true);
      } else {
        recordAnswerLocal(false);
        db.recordAnswer(false);
      }
      if (isSupabaseConfigured()) {
        db.updateStreak();
      } else {
        updateStreakLocal();
      }
      return newProgress;
    });
  }, []);

  const handleImport = useCallback((newEntries: DictionaryEntry[]) => {
    setEntries(newEntries);
    saveDictionary(newEntries);
  }, []);

  const goToPractice = useCallback((options?: { ids?: number[]; mode?: PracticeMode; ruleIds?: string[] }) => {
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

  const navigateTo = useCallback((page: Page) => {
    setCurrentPage(page);
    if (page === 'practice') setPracticeFilter({});
    setMenuOpen(false);
  }, []);

  const dueForReview = entries.filter(e => {
    const p = progress[e.id];
    return p && needsReview(p) && p.reviewStatus !== 'mastered';
  }).length;

  const renderIcon = (icon: string) => {
    const paths: Record<string, ReactNode> = {
      grid: <><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"/></>,
      book: <><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"/></>,
      message: <><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"/></>,
      document: <><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/></>,
      play: <><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"/></>,
      chart: <><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"/></>,
      upload: <><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"/></>,
    };
    return <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">{paths[icon]}</svg>;
  };

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-2">QazLearn</div>
          <p className="text-[var(--color-text-secondary)]">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!authed) {
    return <Auth onAuthSuccess={() => setAuthed(true)} />;
  }

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
    <div className="min-h-screen flex">
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]/50">
        <div className="p-5 border-b border-[var(--color-border)]">
          <button className="flex items-center gap-2 text-lg font-bold" onClick={() => navigateTo('dashboard')}>
            <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"></path>
            </svg>
            <span className="font-extrabold tracking-tight">QazLearn</span>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-5">
          {NAV_SECTIONS.map(section => (
            <div key={section.label}>
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-secondary)]">{section.label}</p>
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                      onClick={() => navigateTo(item.id)}
                    >
                      {renderIcon(item.icon)}
                      <span>{item.label}</span>
                      {item.id === 'practice' && dueForReview > 0 && (
                        <span className="ml-auto w-5 h-5 rounded-full bg-[var(--color-warning)] text-white text-[10px] font-bold flex items-center justify-center">{dueForReview}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-[var(--color-border)]">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-black/5 dark:hover:bg-white/5 transition-all"
          >
            {theme === 'light' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            )}
            <span>{theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-50 bg-[var(--color-surface)]/80 backdrop-blur-md border-b border-[var(--color-border)]/50">
          <div className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[var(--color-text-secondary)]"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/></svg>
                )}
              </button>
              <h1 className="text-lg font-bold tracking-tight">{PAGE_TITLES[currentPage]}</h1>
            </div>
            <div className="flex items-center gap-2">
              {dueForReview > 0 && currentPage !== 'practice' && (
                <button
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--color-warning)]/10 text-[var(--color-warning)]"
                  onClick={() => navigateTo('practice')}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-warning)] animate-pulse" />
                  <span>{dueForReview}</span>
                </button>
              )}
              <button
                className="lg:hidden p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[var(--color-text-secondary)]"
                onClick={toggleTheme}
              >
                {theme === 'light' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                )}
              </button>
            </div>
          </div>

          {menuOpen && (
            <div className="lg:hidden border-t border-[var(--color-border)]/50 bg-[var(--color-surface)]/95 backdrop-blur-md max-h-[80vh] overflow-y-auto">
              <div className="px-4 py-3 space-y-4">
                {NAV_SECTIONS.map(section => (
                  <div key={section.label}>
                    <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-secondary)]">{section.label}</p>
                    <div className="space-y-0.5">
                      {section.items.map(item => {
                        const isActive = currentPage === item.id;
                        return (
                          <button
                            key={item.id}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                              isActive
                                ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                                : 'text-[var(--color-text-secondary)] hover:bg-black/5 dark:hover:bg-white/5'
                            }`}
                            onClick={() => navigateTo(item.id)}
                          >
                            {renderIcon(item.icon)}
                            <span>{item.label}</span>
                            {item.id === 'practice' && dueForReview > 0 && (
                              <span className="ml-auto w-5 h-5 rounded-full bg-[var(--color-warning)] text-white text-[10px] font-bold flex items-center justify-center">{dueForReview}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </header>

        <main className="flex-1 px-4 py-6 overflow-y-auto">
          {currentPage === 'dashboard' && <Dashboard entries={entries} progress={progress} onGoToPractice={goToPractice} onNavigate={(p) => setCurrentPage(p as Page)} />}
          {currentPage === 'words' && <Words key={pageFilter.status || 'all'} entries={entries} progress={progress} onProgressUpdate={handleProgressUpdate} onGoToPractice={goToPractice} initialStatus={pageFilter.status as any} />}
          {currentPage === 'phrases' && <Phrases key={pageFilter.status || 'all'} entries={entries} progress={progress} onProgressUpdate={handleProgressUpdate} onGoToPractice={goToPractice} initialStatus={pageFilter.status as any} />}
          {currentPage === 'rules' && <Rules onGoToPractice={goToPractice} />}
          {currentPage === 'practice' && <Practice key={JSON.stringify(practiceFilter)} entries={entries} progress={progress} onProgressUpdate={handleProgressUpdate} filterIds={practiceFilter.ids} initialMode={practiceFilter.mode} ruleIds={practiceFilter.ruleIds} />}
          {currentPage === 'progress' && <ProgressView entries={entries} progress={progress} onNavigate={goToPage} />}
          {currentPage === 'import' && <ImportCsv entries={entries} onImport={handleImport} />}
        </main>
      </div>
    </div>
  );
}
