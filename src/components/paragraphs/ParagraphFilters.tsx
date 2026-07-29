import { useCallback } from 'react';
import type { ParagraphDirection } from '../../types/dictionary';

interface ParagraphFiltersProps {
  direction: ParagraphDirection | 'mixed';
  onDirectionChange: (d: ParagraphDirection | 'mixed') => void;
  category: string;
  onCategoryChange: (c: string) => void;
  difficulty: number | '';
  onDifficultyChange: (d: number | '') => void;
  status: string;
  onStatusChange: (s: string) => void;
  onlyNew: boolean;
  onOnlyNewChange: (b: boolean) => void;
  onlyHard: boolean;
  onOnlyHardChange: (b: boolean) => void;
  onlyErrors: boolean;
  onOnlyErrorsChange: (b: boolean) => void;
  randomOrder: boolean;
  onRandomOrderChange: (b: boolean) => void;
  errorTypes: { type: string; count: number }[];
}

const categories: { value: string; label: string }[] = [
  { value: '', label: 'Все категории' },
  { value: 'general', label: 'Общее' },
  { value: 'office', label: 'Офис' },
  { value: 'official', label: 'Официально-деловой' },
  { value: 'it_ai', label: 'IT и ИИ' },
  { value: 'route', label: 'Маршруты' },
];

const statuses: { value: string; label: string }[] = [
  { value: '', label: 'Все статусы' },
  { value: 'new', label: 'Новые' },
  { value: 'learning', label: 'В процессе' },
  { value: 'hard', label: 'Сложные' },
  { value: 'mastered', label: 'Освоено' },
];

export default function ParagraphFilters({
  direction,
  onDirectionChange,
  category,
  onCategoryChange,
  difficulty,
  onDifficultyChange,
  status,
  onStatusChange,
  onlyNew,
  onOnlyNewChange,
  onlyHard,
  onOnlyHardChange,
  onlyErrors,
  onOnlyErrorsChange,
  randomOrder,
  onRandomOrderChange,
  errorTypes,
}: ParagraphFiltersProps) {
  const handleDirectionChange = useCallback((d: ParagraphDirection | 'mixed') => {
    onDirectionChange(d);
  }, [onDirectionChange]);

  const handleCategoryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onCategoryChange(e.target.value);
  }, [onCategoryChange]);

  const handleDifficultyChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onDifficultyChange(e.target.value ? parseInt(e.target.value) : '');
  }, [onDifficultyChange]);

  const handleStatusChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onStatusChange(e.target.value);
  }, [onStatusChange]);

  const topErrorTypes = errorTypes
    .filter(et => et.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 p-1 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)]">
        <button
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
            direction === 'ru_kz'
              ? 'bg-[var(--color-primary)] text-white shadow-sm'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-black/5 dark:hover:bg-white/5'
          }`}
          onClick={() => handleDirectionChange('ru_kz')}
        >
          Русский → Казахский
        </button>
        <button
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
            direction === 'kz_ru'
              ? 'bg-[var(--color-primary)] text-white shadow-sm'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-black/5 dark:hover:bg-white/5'
          }`}
          onClick={() => handleDirectionChange('kz_ru')}
        >
          Казахский → Русский
        </button>
        <button
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
            direction === 'mixed'
              ? 'bg-[var(--color-primary)] text-white shadow-sm'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-black/5 dark:hover:bg-white/5'
          }`}
          onClick={() => handleDirectionChange('mixed')}
        >
          Смешанный
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={category}
          onChange={handleCategoryChange}
          className="px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          {categories.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>

        <select
          value={difficulty}
          onChange={handleDifficultyChange}
          className="px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          <option value="">Вся сложность</option>
          {[1, 2, 3, 4, 5].map(d => (
            <option key={d} value={d}>{'★'.repeat(d)}{'☆'.repeat(5 - d)}</option>
          ))}
        </select>

        <select
          value={status}
          onChange={handleStatusChange}
          className="px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          {statuses.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <span className="relative">
            <input
              type="checkbox"
              checked={onlyNew}
              onChange={e => onOnlyNewChange(e.target.checked)}
              className="sr-only peer"
            />
            <span className="block w-9 h-5 rounded-full bg-[var(--color-border)] peer-checked:bg-[var(--color-primary)] transition-colors duration-200" />
            <span className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-4" />
          </span>
          <span className="text-[var(--color-text-secondary)]">Только новые</span>
        </label>

        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <span className="relative">
            <input
              type="checkbox"
              checked={onlyHard}
              onChange={e => onOnlyHardChange(e.target.checked)}
              className="sr-only peer"
            />
            <span className="block w-9 h-5 rounded-full bg-[var(--color-border)] peer-checked:bg-[var(--color-warning)] transition-colors duration-200" />
            <span className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-4" />
          </span>
          <span className="text-[var(--color-text-secondary)]">Только сложные</span>
        </label>

        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <span className="relative">
            <input
              type="checkbox"
              checked={onlyErrors}
              onChange={e => onOnlyErrorsChange(e.target.checked)}
              className="sr-only peer"
            />
            <span className="block w-9 h-5 rounded-full bg-[var(--color-border)] peer-checked:bg-[var(--color-danger)] transition-colors duration-200" />
            <span className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-4" />
          </span>
          <span className="text-[var(--color-text-secondary)]">С ошибками</span>
        </label>

        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <span className="relative">
            <input
              type="checkbox"
              checked={randomOrder}
              onChange={e => onRandomOrderChange(e.target.checked)}
              className="sr-only peer"
            />
            <span className="block w-9 h-5 rounded-full bg-[var(--color-border)] peer-checked:bg-[var(--color-primary)] transition-colors duration-200" />
            <span className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-4" />
          </span>
          <span className="text-[var(--color-text-secondary)]">Случайный порядок</span>
        </label>
      </div>

      {topErrorTypes.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-[var(--color-text-secondary)] font-medium mr-1">Частые ошибки:</span>
          {topErrorTypes.map(et => (
            <span
              key={et.type}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--color-danger)]/10 text-[var(--color-danger)]"
            >
              {et.type}
              <span className="font-bold">{et.count}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
