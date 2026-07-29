import { useState, useMemo } from 'react';
import type { DictionaryEntry, Category, Status, ProgressEntry } from '../types/dictionary';
import { isMastered } from '../lib/spacedRepetition';
import Filters from '../components/Filters';
import ProgressBar from '../components/ProgressBar';
import type { SortOption } from '../components/Filters';

interface WordsProps {
  entries: DictionaryEntry[];
  progress: Record<number, ProgressEntry>;
  onProgressUpdate: (entryId: number, rating: 'dont-know' | 'hard' | 'good' | 'easy') => void;
  onGoToPractice?: (options?: { ids?: number[]; mode?: 'flashcard' }) => void;
  initialStatus?: string;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  new: { label: 'Новое', className: 'badge-new' },
  learning: { label: 'В процессе', className: 'badge-learning' },
  review: { label: 'На повторении', className: 'badge-learning' },
  mastered: { label: 'Освоено', className: 'badge-mastered' },
};

const CATEGORY_LABELS: Record<string, string> = {
  office: 'Офис',
  official: 'Официальный',
  it_ai: 'IT и ИИ',
  general: 'Общее',
};

export default function Words({ entries, progress, onProgressUpdate, onGoToPractice, initialStatus }: WordsProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [feedback, setFeedback] = useState<Record<number, 'dont-know' | 'hard' | 'good' | 'easy' | null>>({});
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [status, setStatus] = useState<Status | ''>((initialStatus as Status) || '');
  const [difficulty, setDifficulty] = useState<number | ''>('');
  const [sort, setSort] = useState<SortOption>('alpha');

  const words = useMemo(() => entries.filter(e => e.type === 'word'), [entries]);

  const masteredCount = useMemo(
    () => words.filter(e => {
      const p = progress[e.id];
      return p && isMastered(p);
    }).length,
    [words, progress]
  );

  const learningCount = useMemo(
    () => words.filter(e => {
      const p = progress[e.id];
      return p && (p.reviewStatus === 'learning' || p.reviewStatus === 'review');
    }).length,
    [words, progress]
  );

  const hardCount = useMemo(
    () => words.filter(e => {
      const p = progress[e.id];
      if (!p || p.attempts === 0) return false;
      if (p.reviewStatus === 'mastered') return false;
      const accuracy = p.correctAnswers / p.attempts;
      return accuracy < 0.5 || p.knowledgeLevel <= 1 || p.wrongAnswers >= 2;
    }).length,
    [words, progress]
  );

  const newCount = words.length - masteredCount - learningCount;

  const filtered = useMemo(() => {
    let result = [...words];

    if (search === '__hard__') {
      result = result.filter(e => {
        const p = progress[e.id];
        if (!p || p.attempts === 0) return false;
        if (p.reviewStatus === 'mastered') return false;
        const accuracy = p.correctAnswers / p.attempts;
        return accuracy < 0.5 || p.knowledgeLevel <= 1 || p.wrongAnswers >= 2;
      });
    } else if (search) {
      const q = search.toLowerCase();
      result = result.filter(e =>
        e.kz.toLowerCase().includes(q) || e.ru.toLowerCase().includes(q)
      );
    }
    if (category) result = result.filter(e => e.category === category);
    if (status === 'learning') {
      result = result.filter(e => {
        const rs = progress[e.id]?.reviewStatus;
        return rs === 'learning' || rs === 'review';
      });
    } else if (status) {
      result = result.filter(e => e.status === status || progress[e.id]?.reviewStatus === status);
    }
    if (difficulty) result = result.filter(e => e.difficulty === difficulty);

    switch (sort) {
      case 'alpha':
        result.sort((a, b) => a.kz.localeCompare(b.kz));
        break;
      case 'difficulty':
        result.sort((a, b) => b.difficulty - a.difficulty);
        break;
      case 'date':
        result.sort((a, b) => {
          const pa = progress[a.id]?.lastReviewedAt;
          const pb = progress[b.id]?.lastReviewedAt;
          if (!pa && !pb) return 0;
          if (!pa) return 1;
          if (!pb) return -1;
          return pb.localeCompare(pa);
        });
        break;
    }

    return result;
  }, [words, search, category, status, difficulty, sort, progress]);

  const handleStatusChange = (entry: DictionaryEntry, rating: 'dont-know' | 'hard' | 'good' | 'easy') => {
    onProgressUpdate(entry.id, rating);
    setFeedback(prev => ({ ...prev, [entry.id]: rating }));
    setTimeout(() => setFeedback(prev => ({ ...prev, [entry.id]: null })), 800);
  };

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Слова</h1>
          <div className="flex items-center gap-2">
            <button className="sm:hidden btn btn-ghost text-xs py-1 px-2" onClick={() => setSidebarOpen(!sidebarOpen)}>
              Статистика
            </button>
            <div className="text-sm text-[var(--color-text-secondary)]">
              Освоено: <span className="font-bold text-[var(--color-primary)]">{masteredCount}</span> / {words.length}
            </div>
          </div>
        </div>

        <ProgressBar value={masteredCount} max={words.length} showPercent />

        <Filters
          search={search} onSearchChange={setSearch}
          category={category} onCategoryChange={setCategory}
          status={status} onStatusChange={setStatus}
          difficulty={difficulty} onDifficultyChange={setDifficulty}
          sort={sort} onSortChange={setSort}
        />

        <div className="flex gap-2 flex-wrap">
            <button
              className="btn btn-primary text-sm"
              onClick={() => {
                const notMastered = words.filter(e => {
                  const p = progress[e.id];
                  return !p || p.reviewStatus !== 'mastered';
                });
                if (notMastered.length > 0) {
                  onGoToPractice?.({ ids: notMastered.slice(0, 10).map(e => e.id), mode: 'flashcard' });
                }
              }}
            >
              Учить
            </button>
            <button
              className="btn btn-warning text-sm"
              onClick={() => {
                const hard = words.filter(e => {
                  const p = progress[e.id];
                  if (!p || p.attempts === 0) return false;
                  if (p.reviewStatus === 'mastered') return false;
                  const accuracy = p.correctAnswers / p.attempts;
                  return accuracy < 0.5 || p.knowledgeLevel <= 1 || p.wrongAnswers >= 2;
                });
                onGoToPractice?.({ ids: hard.map(e => e.id), mode: 'flashcard' });
              }}
            >
              Повторить сложные
            </button>
            {filtered.length > 0 && (
              <button
                className="btn btn-ghost text-sm"
                onClick={() => onGoToPractice?.({ ids: filtered.map(e => e.id), mode: 'flashcard' })}
              >
                Тренировать ({filtered.length})
              </button>
            )}
          </div>

        <div className="space-y-3">
          {filtered.map(entry => {
            const p = progress[entry.id];
            const statusInfo = p ? (STATUS_LABELS[p.reviewStatus] || STATUS_LABELS.new) : { label: 'Не изучено', className: 'badge-new' };
            const fb = feedback[entry.id];
            const fbClass = fb === 'good' || fb === 'easy' ? 'ring-2 ring-green-400' : fb === 'dont-know' ? 'ring-2 ring-red-400' : fb === 'hard' ? 'ring-2 ring-orange-400' : '';
            return (
              <div key={entry.id} className={`card card-hover transition-all duration-300 ${fbClass} ${fb ? 'scale-[1.02]' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-bold">{entry.kz}</h3>
                    <p className="text-[var(--color-text-secondary)]">{entry.ru}</p>
                  </div>
                  <div className="flex gap-1 items-center">
                    <span className={statusInfo.className + ' badge'}>{statusInfo.label}</span>
                    <span className="badge">{'★'.repeat(entry.difficulty)}{'☆'.repeat(5 - entry.difficulty)}</span>
                  </div>
                </div>

                {(entry.example_kz || entry.example_ru) && (
                  <div className="mt-2 p-3 rounded-lg bg-[var(--color-bg)] text-sm">
                    {entry.example_kz && <p className="italic">{entry.example_kz}</p>}
                    {entry.example_ru && <p className="text-[var(--color-text-secondary)]">{entry.example_ru}</p>}
                  </div>
                )}

                {(fb === 'good' || fb === 'easy') && (
                  <div className="mt-2 text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
                    ✓ Запомнил
                  </div>
                )}
                {fb === 'dont-know' && (
                  <div className="mt-2 text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
                    ✗ Нужно повторить
                  </div>
                )}
                {fb === 'hard' && (
                  <div className="mt-2 text-xs font-medium text-orange-600 dark:text-orange-400 flex items-center gap-1">
                    ⚠ Добавлен в сложные
                  </div>
                )}

                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="badge">{CATEGORY_LABELS[entry.category] || entry.category}</span>
                  {entry.tags.map(tag => (
                    <span key={tag} className="badge text-xs">{tag}</span>
                  ))}
                </div>

                <div className="flex gap-2 mt-3">
                  <button className="btn btn-danger text-xs py-1.5 px-3" onClick={() => handleStatusChange(entry, 'dont-know')}>
                    Не знаю
                  </button>
                  <button className="btn btn-warning text-xs py-1.5 px-3" onClick={() => handleStatusChange(entry, 'hard')}>
                    Повторить
                  </button>
                  <button className="btn btn-success text-xs py-1.5 px-3" onClick={() => handleStatusChange(entry, 'good')}>
                    Знаю
                  </button>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="card text-center text-[var(--color-text-secondary)] py-8">
              Слова не найдены
            </div>
          )}
        </div>
      </div>

      <div className={`${sidebarOpen ? 'fixed inset-0 z-50 flex items-start justify-end p-4 bg-black/30' : 'hidden'} sm:block sm:w-64 flex-shrink-0`} onClick={e => { if (e.target === e.currentTarget) setSidebarOpen(false); }}>
        <div className="card space-y-4 sm:sticky sm:top-20 w-full max-w-xs sm:max-w-none" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Статистика</h3>
            <button className="sm:hidden text-sm text-[var(--color-text-secondary)]" onClick={() => setSidebarOpen(false)}>✕</button>
          </div>

          <div className="space-y-3">
            <button className="w-full p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-left cursor-pointer hover:brightness-95 dark:hover:brightness-110 transition-all" onClick={() => { setDifficulty(''); setSearch(''); setStatus('learning'); }}>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{learningCount}</div>
              <div className="text-sm text-blue-700 dark:text-blue-300">В процессе</div>
            </button>

            <button className="w-full p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-left cursor-pointer hover:brightness-95 dark:hover:brightness-110 transition-all" onClick={() => { setStatus(''); setDifficulty(''); setSearch('__hard__'); }}>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{hardCount}</div>
              <div className="text-sm text-orange-700 dark:text-orange-300">Вызывают сложности</div>
            </button>

            <button className="w-full p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-left cursor-pointer hover:brightness-95 dark:hover:brightness-110 transition-all" onClick={() => { setDifficulty(''); setSearch(''); setStatus('mastered'); }}>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{masteredCount}</div>
              <div className="text-sm text-green-700 dark:text-green-300">Точно знаю</div>
            </button>

            <button className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-left cursor-pointer hover:brightness-95 dark:hover:brightness-110 transition-all" onClick={() => { setDifficulty(''); setSearch(''); setStatus('new'); }}>
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{newCount}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Новые</div>
            </button>
          </div>

          <div className="text-xs text-[var(--color-text-secondary)] text-center pt-2 border-t border-[var(--color-border)]">
            Всего: {words.length} слов
          </div>
        </div>
      </div>
    </div>
  );
}
