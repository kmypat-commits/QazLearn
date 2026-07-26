import type { DictionaryEntry, Category, Status } from '../types/dictionary';

export function parseCsv(text: string): DictionaryEntry[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  const header = lines[0].split(',').map(h => h.trim());
  const required = ['id', 'type', 'kz', 'ru', 'category', 'status', 'difficulty'];
  const missing = required.filter(r => !header.includes(r));
  if (missing.length > 0) {
    throw new Error(`Отсутствуют обязательные колонки: ${missing.join(', ')}`);
  }

  const idIdx = header.indexOf('id');
  const typeIdx = header.indexOf('type');
  const kzIdx = header.indexOf('kz');
  const ruIdx = header.indexOf('ru');
  const exampleKzIdx = header.indexOf('example_kz');
  const exampleRuIdx = header.indexOf('example_ru');
  const categoryIdx = header.indexOf('category');
  const statusIdx = header.indexOf('status');
  const difficultyIdx = header.indexOf('difficulty');
  const sourceIdx = header.indexOf('source');
  const tagsIdx = header.indexOf('tags');

  const entries: DictionaryEntry[] = [];
  const seenIds = new Set<number>();

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < required.length) continue;

    const type = cols[typeIdx]?.trim().toLowerCase();
    if (type !== 'word' && type !== 'phrase') continue;

    const id = parseInt(cols[idIdx]?.trim()) || i;
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    const entry: DictionaryEntry = {
      id,
      type: type as 'word' | 'phrase',
      kz: cols[kzIdx]?.trim() || '',
      ru: cols[ruIdx]?.trim() || '',
      example_kz: exampleKzIdx >= 0 ? cols[exampleKzIdx]?.trim() || '' : '',
      example_ru: exampleRuIdx >= 0 ? cols[exampleRuIdx]?.trim() || '' : '',
      category: (cols[categoryIdx]?.trim() as Category) || 'general',
      status: (cols[statusIdx]?.trim() as Status) || 'new',
      difficulty: parseInt(cols[difficultyIdx]?.trim()) || 1,
      source: sourceIdx >= 0 ? cols[sourceIdx]?.trim() || '' : '',
      tags: tagsIdx >= 0 ? cols[tagsIdx]?.trim().split(';').map(t => t.trim()).filter(Boolean) : [],
    };

    if (entry.kz && entry.ru) {
      entries.push(entry);
    }
  }

  return entries;
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

export function validateCsv(text: string): string[] {
  const errors: string[] = [];
  const lines = text.trim().split('\n');
  if (lines.length < 2) {
    errors.push('CSV должен содержать заголовок и хотя бы одну строку');
    return errors;
  }

  const header = lines[0].split(',').map(h => h.trim());
  const required = ['id', 'type', 'kz', 'ru'];
  for (const col of required) {
    if (!header.includes(col)) {
      errors.push(`Отсутствует обязательная колонка: "${col}"`);
    }
  }

  if (errors.length > 0) return errors;

  const idIdx = header.indexOf('id');
  const ids = new Set<number>();
  const duplicates = new Set<string>();
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length <= idIdx) continue;
    const idStr = cols[idIdx]?.trim();
    if (!idStr) continue;
    const id = parseInt(idStr);
    if (isNaN(id)) continue;
    if (ids.has(id) && !duplicates.has(idStr)) {
      duplicates.add(idStr);
      errors.push(`Обнаружен дубликат id "${idStr}" — строка ${i + 1}`);
    }
    ids.add(id);
  }

  return errors;
}

export function mergeEntries(
  existing: DictionaryEntry[],
  incoming: DictionaryEntry[]
): { merged: DictionaryEntry[]; added: number; updated: number } {
  const map = new Map<string, DictionaryEntry>();
  for (const e of existing) {
    map.set(`${e.type}|${e.kz}`, e);
  }

  let added = 0;
  let updated = 0;

  for (const e of incoming) {
    const key = `${e.type}|${e.kz}`;
    if (map.has(key)) {
      const existing_entry = map.get(key)!;
      map.set(key, { ...existing_entry, ...e, id: existing_entry.id });
      updated++;
    } else {
      e.id = map.size + 1;
      map.set(key, e);
      added++;
    }
  }

  return { merged: Array.from(map.values()), added, updated };
}

export function entriesToCsv(entries: DictionaryEntry[]): string {
  const header = 'id,type,kz,ru,example_kz,example_ru,category,status,difficulty,source,tags';
  const lines = entries.map(e => {
    const tags = e.tags.join(';');
    return `${e.id},${e.type},${escapeField(e.kz)},${escapeField(e.ru)},${escapeField(e.example_kz)},${escapeField(e.example_ru)},${e.category},${e.status},${e.difficulty},${escapeField(e.source)},${escapeField(tags)}`;
  });
  return [header, ...lines].join('\n');
}

function escapeField(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}
