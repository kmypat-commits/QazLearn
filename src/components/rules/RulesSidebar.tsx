import type { GrammarRule } from '../../types/dictionary';

interface Props {
  rules: GrammarRule[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  query: string;
  onQueryChange: (q: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (c: string) => void;
  levelFilter: string;
  onLevelFilterChange: (l: string) => void;
  categories: string[];
  learnedIds: Set<string>;
  reviewIds: Set<string>;
}

export default function RulesSidebar({
  rules, selectedId, onSelect, query, onQueryChange,
  categoryFilter, onCategoryFilterChange, levelFilter, onLevelFilterChange,
  categories, learnedIds, reviewIds,
}: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="space-y-3 p-4 border-b border-[var(--color-border)]">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="text" value={query} onChange={e => onQueryChange(e.target.value)} placeholder="Поиск правил..." className="w-full pl-9 pr-3 py-2 text-sm rounded-xl" />
        </div>
        <select value={categoryFilter} onChange={e => onCategoryFilterChange(e.target.value)} className="w-full text-sm rounded-xl">
          <option value="">Все категории</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={levelFilter} onChange={e => onLevelFilterChange(e.target.value)} className="w-full text-sm rounded-xl">
          <option value="">Все уровни</option>
          <option value="1">Уровень 1</option>
          <option value="2">Уровень 2</option>
          <option value="3">Уровень 3</option>
        </select>
      </div>
      <div className="flex-1 overflow-y-auto">
        {rules.length === 0 && (
          <div className="p-4 text-sm text-[var(--color-text-secondary)] text-center">Ничего не найдено</div>
        )}
        {rules.map(rule => {
          const isSelected = rule.id === selectedId;
          const isLearned = learnedIds.has(rule.id);
          const isReview = reviewIds.has(rule.id);
          return (
            <button
              key={rule.id}
              className={`w-full text-left px-4 py-3 border-b border-[var(--color-border)]/50 transition-all hover:bg-black/5 dark:hover:bg-white/5 ${
                isSelected ? 'bg-[var(--color-primary)]/5 border-l-2 border-l-[var(--color-primary)]' : ''
              }`}
              onClick={() => onSelect(rule.id)}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold text-[var(--color-primary)]">{rule.category}</span>
                {isLearned && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-success)]/10 text-[var(--color-success)]">✓</span>}
                {isReview && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-warning)]/10 text-[var(--color-warning)]">↻</span>}
              </div>
              <div className="text-sm font-medium leading-snug">{rule.titleRu}</div>
              <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">{rule.shortRuleRu.slice(0, 60)}{rule.shortRuleRu.length > 60 ? '...' : ''}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
