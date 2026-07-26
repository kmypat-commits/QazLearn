import type { GrammarRule } from '../types/dictionary';

export function parseGrammarRulesCsv(csvText: string): GrammarRule[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  const idIdx = headers.indexOf('id');
  const titleRuIdx = headers.indexOf('title_ru');
  const titleKzIdx = headers.indexOf('title_kz');
  const categoryIdx = headers.indexOf('category');
  const levelIdx = headers.indexOf('level');
  const shortRuleRuIdx = headers.indexOf('short_rule_ru');
  const formationIdx = headers.indexOf('formation');
  const formulaIdx = headers.indexOf('formula');
  const noteRuIdx = headers.indexOf('note_ru');
  const tagsIdx = headers.indexOf('tags');

  const exampleFields = ['example_1_kz','example_1_ru','example_2_kz','example_2_ru','example_3_kz','example_3_ru','example_4_kz','example_4_ru','example_5_kz','example_5_ru'];
  const exampleIdxs = exampleFields.map(f => headers.indexOf(f));

  const rules: GrammarRule[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length <= idIdx) continue;

    const examples: { kz: string; ru: string }[] = [];
    for (let j = 0; j < 5; j++) {
      const kzIdx = exampleIdxs[j * 2];
      const ruIdx = exampleIdxs[j * 2 + 1];
      if (kzIdx >= 0 && ruIdx >= 0 && cols[kzIdx] && cols[ruIdx]) {
        examples.push({ kz: cols[kzIdx].trim(), ru: cols[ruIdx].trim() });
      }
    }

    rules.push({
      id: cols[idIdx]?.trim() || '',
      titleRu: cols[titleRuIdx]?.trim() || '',
      titleKz: cols[titleKzIdx]?.trim() || '',
      category: cols[categoryIdx]?.trim() || '',
      level: cols[levelIdx]?.trim() || '',
      shortRuleRu: cols[shortRuleRuIdx]?.trim() || '',
      formation: cols[formationIdx]?.trim() || '',
      formula: cols[formulaIdx]?.trim() || '',
      examples,
      noteRu: cols[noteRuIdx]?.trim() || '',
      tags: cols[tagsIdx]?.trim() ? cols[tagsIdx].split(';').map(t => t.trim()) : [],
    });
  }

  return rules;
}

export function validateGrammarRulesCsv(csvText: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    return { valid: false, errors: ['CSV пуст или содержит только заголовки'] };
  }

  const headers = parseCsvLine(lines[0]);
  const required = ['id', 'title_ru', 'title_kz', 'category', 'level', 'short_rule_ru', 'formation', 'formula'];
  const missing = required.filter(r => !headers.includes(r));
  if (missing.length > 0) {
    errors.push(`Отсутствуют обязательные колонки: ${missing.join(', ')}`);
    return { valid: false, errors };
  }

  const ids = new Set<string>();
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const id = cols[headers.indexOf('id')]?.trim();
    if (!id) {
      errors.push(`Строка ${i + 1}: отсутствует id`);
      continue;
    }
    if (ids.has(id)) {
      errors.push(`Строка ${i + 1}: дубликат id "${id}"`);
    }
    ids.add(id);
  }

  return { valid: errors.length === 0, errors };
}

export function getRulesByCategory(rules: GrammarRule[]): Record<string, GrammarRule[]> {
  const grouped: Record<string, GrammarRule[]> = {};
  for (const rule of rules) {
    if (!grouped[rule.category]) grouped[rule.category] = [];
    grouped[rule.category].push(rule);
  }
  return grouped;
}

export function getRulesByLevel(rules: GrammarRule[], level: string): GrammarRule[] {
  return rules.filter(r => r.level === level);
}

export function searchRules(rules: GrammarRule[], query: string): GrammarRule[] {
  const q = query.toLowerCase();
  return rules.filter(r =>
    r.titleRu.toLowerCase().includes(q) ||
    r.titleKz.toLowerCase().includes(q) ||
    r.shortRuleRu.toLowerCase().includes(q) ||
    r.examples.some(e => e.kz.toLowerCase().includes(q) || e.ru.toLowerCase().includes(q)) ||
    r.tags.some(t => t.toLowerCase().includes(q))
  );
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
