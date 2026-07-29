import type {
  ParagraphEntry,
  ParagraphCategory,
  ParagraphEntryStatus,
} from '../../types/dictionary';

const requiredColumns = [
  'id', 'title', 'ru_text', 'kz_text', 'category', 'difficulty',
];

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

function splitSemicolon(val: string): string[] {
  return val
    .split(';')
    .map(s => s.trim())
    .filter(Boolean);
}

export function normalizeParagraphText(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

export function splitParagraphIntoSentences(text: string): string[] {
  const sentences: string[] = [];
  const re = /[^.!?]*[.!?]/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    sentences.push(match[0].trim());
  }
  const remainder = text.replace(re, '').trim();
  if (remainder) sentences.push(remainder);
  return sentences.filter(Boolean);
}

export function shuffleConstructorBlocks(blocks: string[]): string[] {
  const arr = [...blocks];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function parseParagraphsCsv(text: string): ParagraphEntry[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  const header = lines[0].split(',').map(h => h.trim());
  const missing = requiredColumns.filter(r => !header.includes(r));
  if (missing.length > 0) {
    throw new Error(`Отсутствуют обязательные колонки: ${missing.join(', ')}`);
  }

  const idx = (col: string) => header.indexOf(col);
  const idIdx = idx('id');
  const titleIdx = idx('title');
  const ruTextIdx = idx('ru_text');
  const kzTextIdx = idx('kz_text');
  const alternativeKzIdx = idx('alternative_kz');
  const alternativeRuIdx = idx('alternative_ru');
  const categoryIdx = idx('category');
  const difficultyIdx = idx('difficulty');
  const keyWordsIdx = idx('key_words');
  const grammarFocusIdx = idx('grammar_focus');
  const constructorBlocksKzIdx = idx('constructor_blocks_kz');
  const constructorBlocksRuIdx = idx('constructor_blocks_ru');
  const explanationIdx = idx('explanation');
  const statusIdx = idx('status');
  const sourceIdx = idx('source');
  const tagsIdx = idx('tags');

  const entries: ParagraphEntry[] = [];
  const seenIds = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < requiredColumns.length) continue;

    const id = cols[idIdx]?.trim();
    if (!id || seenIds.has(id)) continue;
    seenIds.add(id);

    const category = cols[categoryIdx]?.trim() as ParagraphCategory;
    const validCategories: ParagraphCategory[] = ['general', 'office', 'official', 'it_ai', 'route'];
    if (!validCategories.includes(category)) continue;

    const difficulty = parseInt(cols[difficultyIdx]?.trim()) || 1;

    const title = normalizeParagraphText(cols[titleIdx] || '');
    const ruText = normalizeParagraphText(cols[ruTextIdx] || '');
    const kzText = normalizeParagraphText(cols[kzTextIdx] || '');
    if (!title || !ruText || !kzText) continue;

    const status = cols[statusIdx]?.trim() as ParagraphEntryStatus || 'new';
    const validStatuses: ParagraphEntryStatus[] = ['new', 'learning', 'hard', 'mastered'];
    const finalStatus = validStatuses.includes(status) ? status : 'new';

    const entry: ParagraphEntry = {
      id,
      title,
      ruText,
      kzText,
      alternativeKz: alternativeKzIdx >= 0 ? splitSemicolon(cols[alternativeKzIdx]) : [],
      alternativeRu: alternativeRuIdx >= 0 ? splitSemicolon(cols[alternativeRuIdx]) : [],
      category,
      difficulty,
      keyWords: keyWordsIdx >= 0 ? splitSemicolon(cols[keyWordsIdx]) : [],
      grammarFocus: grammarFocusIdx >= 0 ? splitSemicolon(cols[grammarFocusIdx]) : [],
      constructorBlocksKz: constructorBlocksKzIdx >= 0 ? splitSemicolon(cols[constructorBlocksKzIdx]) : [],
      constructorBlocksRu: constructorBlocksRuIdx >= 0 ? splitSemicolon(cols[constructorBlocksRuIdx]) : [],
      explanation: explanationIdx >= 0 ? cols[explanationIdx]?.trim() || '' : '',
      status: finalStatus,
      source: sourceIdx >= 0 ? cols[sourceIdx]?.trim() || '' : '',
      tags: tagsIdx >= 0 ? splitSemicolon(cols[tagsIdx]) : [],
    };

    entries.push(entry);
  }

  return entries;
}

export function validateParagraphsCsv(text: string): string[] {
  const errors: string[] = [];
  const lines = text.trim().split('\n');
  if (lines.length < 2) {
    errors.push('CSV должен содержать заголовок и хотя бы одну строку');
    return errors;
  }

  const header = lines[0].split(',').map(h => h.trim());
  for (const col of requiredColumns) {
    if (!header.includes(col)) {
      errors.push(`Отсутствует обязательная колонка: "${col}"`);
    }
  }

  if (errors.length > 0) return errors;

  const idIdx = header.indexOf('id');
  const categoryIdx = header.indexOf('category');
  const ids = new Set<string>();
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length <= idIdx) continue;
    const idStr = cols[idIdx]?.trim();
    if (!idStr) continue;
    if (ids.has(idStr)) {
      errors.push(`Обнаружен дубликат id "${idStr}" — строка ${i + 1}`);
    }
    ids.add(idStr);

    if (categoryIdx >= 0 && cols[categoryIdx]?.trim()) {
      const validCategories: ParagraphCategory[] = ['general', 'office', 'official', 'it_ai', 'route'];
      if (!validCategories.includes(cols[categoryIdx]?.trim() as ParagraphCategory)) {
        errors.push(`Недопустимая категория "${cols[categoryIdx]?.trim()}" — строка ${i + 1}`);
      }
    }
  }

  return errors;
}

export function mergeParagraphEntries(
  existing: ParagraphEntry[],
  incoming: ParagraphEntry[]
): { merged: ParagraphEntry[]; added: number; updated: number } {
  const map = new Map<string, ParagraphEntry>();
  for (const e of existing) {
    map.set(e.id, e);
  }

  let added = 0;
  let updated = 0;

  for (const e of incoming) {
    if (map.has(e.id)) {
      const existingEntry = map.get(e.id)!;
      map.set(e.id, { ...existingEntry, ...e, id: existingEntry.id });
      updated++;
    } else {
      map.set(e.id, e);
      added++;
    }
  }

  return { merged: Array.from(map.values()), added, updated };
}
