import { useState, useMemo, useCallback } from 'react';
import type { ParagraphEntry, ParagraphDirection, ParagraphProgress, ParagraphError, ParagraphErrorType } from '../types/dictionary';
import { loadParagraphEntries, loadParagraphProgress, loadParagraphErrors, addParagraphError, getParagraphProgress, updateParagraphProgress } from '../lib/paragraphs/storage';
import * as db from '../lib/db';
import { isSupabaseConfigured } from '../lib/supabase';
import ParagraphFilters from '../components/paragraphs/ParagraphFilters';
import ParagraphTask from '../components/paragraphs/ParagraphTask';
import ParagraphConstructor from '../components/paragraphs/ParagraphConstructor';

type ViewMode = 'practice' | 'constructor';

export default function Paragraphs() {
  const [entries] = useState<ParagraphEntry[]>(() => loadParagraphEntries());
  const [progress, setProgress] = useState<Record<string, ParagraphProgress>>(() => loadParagraphProgress());
  const [viewMode, setViewMode] = useState<ViewMode>('practice');
  const [direction, setDirection] = useState<ParagraphDirection | 'mixed'>('mixed');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState<number | ''>('');
  const [status, setStatus] = useState('');
  const [onlyNew, setOnlyNew] = useState(false);
  const [onlyHard, setOnlyHard] = useState(false);
  const [onlyErrors, setOnlyErrors] = useState(false);
  const [randomOrder, setRandomOrder] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [key, setKey] = useState(0);
  const errors = useMemo(() => loadParagraphErrors(), [key]);

  const filtered = useMemo(() => {
    let result = [...entries];

    if (category) result = result.filter(e => e.category === category);
    if (difficulty !== '') result = result.filter(e => e.difficulty === difficulty);
    if (status) result = result.filter(e => (progress[e.id]?.status || 'new') === status);
    if (onlyNew) result = result.filter(e => !progress[e.id] || progress[e.id].status === 'new');
    if (onlyHard) result = result.filter(e => progress[e.id]?.isHard);
    if (onlyErrors) {
      const errorParagraphIds = new Set(errors.map(e => e.paragraphId));
      result = result.filter(e => errorParagraphIds.has(e.id));
    }
    if (randomOrder) result = [...result].sort(() => Math.random() - 0.5);

    return result;
  }, [entries, progress, errors, category, difficulty, status, onlyNew, onlyHard, onlyErrors, randomOrder]);

  const currentEntry = filtered[currentIndex] || null;

  const errorsByType = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of errors) {
      map.set(e.errorType, (map.get(e.errorType) || 0) + 1);
    }
    return Array.from(map.entries()).map(([type, count]) => ({ type, count }));
  }, [errors]);

  const handleComplete = useCallback((result: {
    userAnswer: string;
    correctText: string;
    sentences: { source: string; user: string; correct: string; errors: { userFragment: string; correctFragment: string; type: string; explanation: string }[] }[];
    totalCorrect: number;
    totalPartial: number;
    totalErrors: number;
    errorTypes: { type: string; count: number }[];
  }) => {
    if (!currentEntry) return;

    const current = getParagraphProgress(currentEntry.id);
    const updated: Partial<ParagraphProgress> = {
      attempts: current.attempts + 1,
      correctSentences: current.correctSentences + result.totalCorrect,
      partialSentences: current.partialSentences + result.totalPartial,
      totalErrors: current.totalErrors + result.totalErrors,
      status: result.totalErrors === 0 ? 'mastered' : result.totalPartial > 0 ? 'learning' : 'hard',
      lastAttemptAt: new Date().toISOString(),
      draft: '',
    };
    updateParagraphProgress(currentEntry.id, updated);
    setProgress(loadParagraphProgress());
    if (isSupabaseConfigured()) {
      db.saveUserData('paragraphProgress', loadParagraphProgress());
      db.saveUserData('paragraphErrors', loadParagraphErrors());
    }

    for (const sentence of result.sentences) {
      for (const err of sentence.errors) {
        if (!err.type || !err.userFragment) continue;
        const errorEntry: ParagraphError = {
          id: `${currentEntry.id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          paragraphId: currentEntry.id,
          sentenceIndex: sentence.source.length,
          userFragment: err.userFragment,
          correctFragment: err.correctFragment,
          errorType: err.type as ParagraphErrorType,
          explanation: err.explanation,
          repeatCount: 1,
          status: 'new',
          createdAt: new Date().toISOString(),
        };
        addParagraphError(errorEntry);
      }
    }

    setCompletedCount(c => c + 1);
    setKey(k => k + 1);
  }, [currentEntry]);

  const handleNext = useCallback(() => {
    if (currentIndex + 1 < filtered.length) {
      setCurrentIndex(i => i + 1);
      setKey(k => k + 1);
    } else {
      setCurrentIndex(0);
      setKey(k => k + 1);
    }
  }, [currentIndex, filtered.length]);

  const handleConstructorCorrect = useCallback(() => {
    setCompletedCount(c => c + 1);
  }, []);

  const handleResetProgress = useCallback(() => {
    if (confirm('Сбросить прогресс по всем абзацам?')) {
      localStorage.removeItem('qazlearn_paragraph_progress');
      setProgress({});
      setKey(k => k + 1);
    }
  }, []);

  if (entries.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Абзацы</h1>
        <div className="card text-center py-12">
          <p className="text-[var(--color-text-secondary)] mb-3">
            Нет загруженных абзацев
          </p>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Импортируйте CSV с абзацами на странице Импорт CSV
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Абзацы</h1>
        <div className="flex gap-1 p-1 rounded-full bg-black/5 dark:bg-white/5">
          <button
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${viewMode === 'practice' ? 'bg-[var(--color-surface)] shadow-xs' : 'text-[var(--color-text-secondary)]'}`}
            onClick={() => setViewMode('practice')}
          >
            Практика
          </button>
          <button
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${viewMode === 'constructor' ? 'bg-[var(--color-surface)] shadow-xs' : 'text-[var(--color-text-secondary)]'}`}
            onClick={() => setViewMode('constructor')}
          >
            Конструктор
          </button>
        </div>
      </div>

      {filtered.length > 0 && viewMode === 'practice' && (
        <p className="text-sm text-[var(--color-text-secondary)]">
          {filtered.length} абзацев • Завершено: {completedCount}
        </p>
      )}

      <ParagraphFilters
        direction={direction}
        onDirectionChange={setDirection}
        category={category}
        onCategoryChange={setCategory}
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
        status={status}
        onStatusChange={setStatus}
        onlyNew={onlyNew}
        onOnlyNewChange={setOnlyNew}
        onlyHard={onlyHard}
        onOnlyHardChange={setOnlyHard}
        onlyErrors={onlyErrors}
        onOnlyErrorsChange={setOnlyErrors}
        randomOrder={randomOrder}
        onRandomOrderChange={setRandomOrder}
        errorTypes={errorsByType}
      />

      {viewMode === 'practice' && currentEntry && (
        <ParagraphTask
          key={key}
          entry={currentEntry}
          direction={direction}
          onComplete={handleComplete}
          onNext={handleNext}
        />
      )}

      {viewMode === 'constructor' && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map(entry => (
            <div key={entry.id} className="card">
              <h3 className="font-medium mb-3">{entry.title}</h3>
              <ParagraphConstructor
                blocksKz={entry.constructorBlocksKz}
                correctOrder={entry.constructorBlocksKz}
                kzText={entry.kzText}
                onCorrect={handleConstructorCorrect}
                onIncorrect={() => {}}
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between">
        <button className="btn btn-ghost text-sm" onClick={handleResetProgress}>
          Сбросить прогресс
        </button>
      </div>
    </div>
  );
}
