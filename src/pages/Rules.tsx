import { useState, useMemo, useEffect } from 'react';
import type { GrammarRule, RuleProgress } from '../types/dictionary';
import { parseGrammarRulesCsv, searchRules } from '../lib/grammarRules';
import { loadRuleProgress as loadLocal, setRuleStatus as setLocal } from '../lib/ruleStorage';
import { isSupabaseConfigured } from '../lib/supabase';
import * as db from '../lib/db';
import RulesSidebar from '../components/rules/RulesSidebar';
import RuleCard from '../components/rules/RuleCard';

interface Props {
  onGoToPractice: (options?: { ruleIds?: string[] }) => void;
}

export default function Rules({ onGoToPractice }: Props) {
  const [rules, setRules] = useState<GrammarRule[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [ruleProgress, setRuleProgress] = useState<Record<string, any>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/data/kazakh_grammar_rules.csv')
      .then(r => r.text())
      .then(async text => {
        const parsed = parseGrammarRulesCsv(text);
        setRules(parsed);
        const prog = isSupabaseConfigured() ? await db.loadRuleProgress() : loadLocal();
        setRuleProgress(prog);
        setLoaded(true);
        if (parsed.length > 0) setSelectedId(parsed[0].id);
      })
      .catch(err => {
        console.error('Failed to load grammar rules:', err);
        setLoaded(true);
      });
  }, []);

  const categories = useMemo(() => {
    const set = new Set(rules.map(r => r.category));
    return Array.from(set).sort();
  }, [rules]);

  const filtered = useMemo(() => {
    let result = rules;
    if (query) result = searchRules(rules, query);
    if (categoryFilter) result = result.filter(r => r.category === categoryFilter);
    if (levelFilter) result = result.filter(r => r.level === levelFilter);
    return result;
  }, [rules, query, categoryFilter, levelFilter]);

  const selectedRule = useMemo(() => rules.find(r => r.id === selectedId) || null, [rules, selectedId]);

  const learnedIds = useMemo(() => {
    const s = new Set<string>();
    for (const [id, p] of Object.entries(ruleProgress)) {
      if (p.status === 'learned') s.add(id);
    }
    return s;
  }, [ruleProgress]);

  const reviewIds = useMemo(() => {
    const s = new Set<string>();
    for (const [id, p] of Object.entries(ruleProgress)) {
      if (p.status === 'review') s.add(id);
    }
    return s;
  }, [ruleProgress]);

  const handleSetStatus = (id: string, status: 'learned' | 'review') => {
    const entry: RuleProgress = { id, status, lastReviewedAt: new Date().toISOString() };
    setLocal(id, status);
    db.saveRuleProgressEntry(id, entry);
    setRuleProgress(prev => ({ ...prev, [id]: entry }));
  };

  const handleGoToPractice = (ids: string[]) => {
    onGoToPractice({ ruleIds: ids });
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[var(--color-text-secondary)]">Загрузка правил...</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] -mx-4">
      <div className="w-80 lg:w-96 shrink-0 border-r border-[var(--color-border)] overflow-hidden flex flex-col">
        <RulesSidebar
          rules={filtered}
          selectedId={selectedId}
          onSelect={setSelectedId}
          query={query}
          onQueryChange={setQuery}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          levelFilter={levelFilter}
          onLevelFilterChange={setLevelFilter}
          categories={categories}
          learnedIds={learnedIds}
          reviewIds={reviewIds}
        />
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {selectedRule ? (
          <RuleCard
            rule={selectedRule}
            progress={ruleProgress[selectedRule.id] || null}
            onSetStatus={handleSetStatus}
            onGoToPractice={handleGoToPractice}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-[var(--color-text-secondary)]">Выберите правило из списка</p>
          </div>
        )}
      </div>
    </div>
  );
}
