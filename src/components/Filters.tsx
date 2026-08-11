import { useMemo } from 'react';
import type { Category, Status } from '../types/dictionary';

interface FiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  category: Category | '';
  onCategoryChange: (val: Category | '') => void;
  status: Status | '';
  onStatusChange: (val: Status | '') => void;
  difficulty: number | '';
  onDifficultyChange: (val: number | '') => void;
  sort: SortOption;
  onSortChange: (val: SortOption) => void;
  type?: 'word' | 'phrase';
  categoryOptions?: string[];
}

export type SortOption = 'alpha' | 'difficulty' | 'date';

const DEFAULT_CATEGORY_LABELS: Record<string, string> = {
  office: 'Офис',
  official: 'Официально-деловой',
  it_ai: 'IT и ИИ',
  general: 'Общее',
};

const statuses: { value: Status | ''; label: string }[] = [
  { value: '', label: 'Все статусы' },
  { value: 'new', label: 'Новые' },
  { value: 'learning', label: 'В процессе' },
  { value: 'mastered', label: 'Освоено' },
];

export default function Filters({
  search, onSearchChange,
  category, onCategoryChange,
  status, onStatusChange,
  difficulty, onDifficultyChange,
  sort, onSortChange,
  categoryOptions,
}: FiltersProps) {
  const categories = useMemo(() => {
    const seen = new Set<string>();
    return [
      { value: '', label: 'Все категории' },
      ...(categoryOptions && categoryOptions.length > 0 ? categoryOptions : Object.keys(DEFAULT_CATEGORY_LABELS))
        .filter(c => {
          if (seen.has(c)) return false;
          seen.add(c);
          return true;
        })
        .map(c => ({ value: c, label: DEFAULT_CATEGORY_LABELS[c] || c })),
    ];
  }, [categoryOptions]);  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        placeholder="Поиск по казахскому или русскому..."
        className="w-full p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
      />

      <div className="flex flex-wrap gap-2">
        <select
          value={category}
          onChange={e => onCategoryChange(e.target.value as Category | '')}
          className="px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          {categories.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>

        <select
          value={status}
          onChange={e => onStatusChange(e.target.value as Status | '')}
          className="px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          {statuses.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <select
          value={difficulty}
          onChange={e => onDifficultyChange(e.target.value ? parseInt(e.target.value) : '')}
          className="px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          <option value="">Вся сложность</option>
          {[1, 2, 3, 4, 5].map(d => (
            <option key={d} value={d}>{'★'.repeat(d)}{'☆'.repeat(5 - d)}</option>
          ))}
        </select>

        <select
          value={sort}
          onChange={e => onSortChange(e.target.value as SortOption)}
          className="px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          <option value="alpha">По алфавиту</option>
          <option value="difficulty">По сложности</option>
          <option value="date">По дате изучения</option>
        </select>
      </div>
    </div>
  );
}
