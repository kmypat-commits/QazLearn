import { useState, useMemo, useCallback } from 'react';
import type { ParagraphError } from '../types/dictionary';
import { loadParagraphErrors, saveParagraphErrors } from '../lib/paragraphs/storage';
import * as db from '../lib/db';
import { isSupabaseConfigured } from '../lib/supabase';
import ErrorExplanation from '../components/paragraphs/ErrorExplanation';

const ERROR_TYPE_LABELS: Record<string, string> = {
  spelling: 'Орфография',
  vocabulary: 'Лексика',
  accusative: 'Винительный падеж',
  genitive: 'Родительный падеж',
  dative: 'Дательный падеж',
  ablative: 'Исходный падеж',
  possessive: 'Притяжательное окончание',
  verb_form: 'Форма глагола',
  participle: 'Причастие',
  converb: 'Форма -ып/-іп/-п',
  word_order: 'Порядок слов',
  collocation: 'Устойчивая связка',
  missing_word: 'Пропущенное слово',
  extra_word: 'Лишнее слово',
  punctuation: 'Пунктуация',
};

export default function ParagraphErrors() {
  const [errors, setErrors] = useState<ParagraphError[]>(() => loadParagraphErrors());
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [onlyRepeated, setOnlyRepeated] = useState(false);

  const typeCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of errors) {
      map.set(e.errorType, (map.get(e.errorType) || 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [errors]);

  const filtered = useMemo(() => {
    let result = errors;
    if (filterType) result = result.filter(e => e.errorType === filterType);
    if (filterStatus) result = result.filter(e => e.status === filterStatus);
    if (searchDate) result = result.filter(e => e.createdAt.startsWith(searchDate));
    if (onlyRepeated) result = result.filter(e => e.repeatCount > 1);
    return result;
  }, [errors, filterType, filterStatus, searchDate, onlyRepeated]);

  const todayErrors = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return errors.filter(e => e.createdAt.startsWith(today));
  }, [errors]);

  const uniqueErrors = useMemo(() => {
    const seen = new Set<string>();
    for (const e of errors) {
      seen.add(`${e.userFragment}|${e.correctFragment}`);
    }
    return seen.size;
  }, [errors]);

  const masteredErrors = useMemo(() => {
    return errors.filter(e => e.status === 'mastered').length;
  }, [errors]);

  const repeatedPairs = useMemo(() => {
    const pairs = new Map<string, { user: string; correct: string; count: number; type: string }>();
    for (const e of errors) {
      const key = `${e.userFragment}|${e.correctFragment}`;
      const existing = pairs.get(key);
      if (existing) {
        existing.count++;
      } else {
        pairs.set(key, { user: e.userFragment, correct: e.correctFragment, count: 1, type: e.errorType });
      }
    }
    return Array.from(pairs.values()).filter(p => p.count > 1).sort((a, b) => b.count - a.count);
  }, [errors]);

  const handleMarkMastered = useCallback((errorId: string) => {
    const updated = errors.map(e =>
      e.id === errorId ? { ...e, status: 'mastered' as const } : e
    );
    setErrors(updated);
    saveParagraphErrors(updated);
    if (isSupabaseConfigured()) {
      db.saveUserData('paragraphErrors', updated);
    }
  }, [errors]);

  if (errors.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Мои ошибки</h1>
        <div className="card text-center py-12">
          <p className="text-[var(--color-text-secondary)]">Ошибок пока нет</p>
          <p className="text-sm text-[var(--color-text-secondary)] mt-2">
            Начните практику абзацев — ошибки будут сохраняться здесь
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Мои ошибки</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card text-center">
          <div className="text-2xl font-bold text-[var(--color-primary)]">{errors.length}</div>
          <div className="text-xs text-[var(--color-text-secondary)]">Всего ошибок</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-[var(--color-warning)]">{uniqueErrors}</div>
          <div className="text-xs text-[var(--color-text-secondary)]">Уникальных</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-[var(--color-danger)]">{todayErrors.length}</div>
          <div className="text-xs text-[var(--color-text-secondary)]">За сегодня</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-[var(--color-success)]">{masteredErrors}</div>
          <div className="text-xs text-[var(--color-text-secondary)]">Исправлено</div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Типы ошибок</h2>
        <div className="flex flex-wrap gap-2">
          {typeCounts.map(([type, count]) => (
            <button
              key={type}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${filterType === type ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]'}`}
              onClick={() => setFilterType(filterType === type ? '' : type)}
            >
              {ERROR_TYPE_LABELS[type] || type} ({count})
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Повторяющиеся ошибки</h2>
        {repeatedPairs.length === 0 ? (
          <p className="text-sm text-[var(--color-text-secondary)]">Повторяющихся ошибок нет</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {repeatedPairs.slice(0, 10).map((pair, i) => (
              <div key={i} className="flex justify-between items-center text-sm p-2 rounded-lg bg-black/5 dark:bg-white/5">
                <div>
                  <span className="line-through text-[var(--color-danger)]">{pair.user}</span>
                  {' → '}
                  <span className="text-[var(--color-success)]">{pair.correct}</span>
                </div>
                <span className="text-[var(--color-text-secondary)]">×{pair.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-transparent text-sm outline-none"
        >
          <option value="">Все типы</option>
          {typeCounts.map(([type]) => (
            <option key={type} value={type}>{ERROR_TYPE_LABELS[type] || type}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-transparent text-sm outline-none"
        >
          <option value="">Все статусы</option>
          <option value="new">Новые</option>
          <option value="learning">В процессе</option>
          <option value="repeated">Повторяющиеся</option>
          <option value="mastered">Исправлено</option>
        </select>

        <input
          type="date"
          value={searchDate}
          onChange={e => setSearchDate(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-transparent text-sm outline-none"
        />

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={onlyRepeated}
            onChange={e => setOnlyRepeated(e.target.checked)}
            className="rounded"
          />
          Только повторяющиеся
        </label>
      </div>

      <div className="text-sm text-[var(--color-text-secondary)]">
        Показано: {filtered.length} из {errors.length}
      </div>

      <div className="space-y-3">
        {filtered.map(error => (
          <div key={error.id} className="card space-y-2">
            <ErrorExplanation
              error={{
                userFragment: error.userFragment,
                correctFragment: error.correctFragment,
                type: error.errorType,
                explanation: error.explanation,
                ruleId: error.ruleId,
              }}
            />
            <div className="flex justify-between items-center text-sm">
              <span className={`badge ${
                error.status === 'mastered' ? 'badge-mastered' :
                error.status === 'repeated' ? 'badge-warning' :
                'badge-new'
              }`}>
                {error.status === 'mastered' ? 'Исправлено' :
                 error.status === 'repeated' ? 'Повторяется' :
                 error.status === 'learning' ? 'В процессе' : 'Новая'}
              </span>
              <span className="text-[var(--color-text-secondary)]">
                Повторений: {error.repeatCount}
              </span>
              {error.status !== 'mastered' && (
                <button
                  className="btn btn-ghost text-xs"
                  onClick={() => handleMarkMastered(error.id)}
                >
                  Исправлено
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
