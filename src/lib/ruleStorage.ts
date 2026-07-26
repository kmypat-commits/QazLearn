import type { RuleProgress } from '../types/dictionary';

const KEY = 'qazlearn_rule_progress';

export function loadRuleProgress(): Record<string, RuleProgress> {
  try {
    const data = localStorage.getItem(KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export function saveRuleProgress(progress: Record<string, RuleProgress>): void {
  localStorage.setItem(KEY, JSON.stringify(progress));
}

export function setRuleStatus(id: string, status: RuleProgress['status']): void {
  const all = loadRuleProgress();
  all[id] = { id, status, lastReviewedAt: new Date().toISOString() };
  saveRuleProgress(all);
}

export function getRuleStatus(id: string): RuleProgress | null {
  const all = loadRuleProgress();
  return all[id] || null;
}
