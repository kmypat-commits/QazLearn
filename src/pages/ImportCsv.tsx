import { useState, useRef } from 'react';
import type { DictionaryEntry } from '../types/dictionary';
import { parseCsv, validateCsv, mergeEntries, entriesToCsv } from '../lib/csv';

interface ImportCsvProps {
  entries: DictionaryEntry[];
  onImport: (entries: DictionaryEntry[]) => void;
}

export default function ImportCsv({ entries, onImport }: ImportCsvProps) {
  const [preview, setPreview] = useState<DictionaryEntry[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<{ added: number; updated: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const validationErrors = validateCsv(text);
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setPreview(null);
        return;
      }
      try {
        const parsed = parseCsv(text);
        setErrors([]);
        setPreview(parsed);
        setImportResult(null);
      } catch (err: any) {
        setErrors([err.message || 'Ошибка парсинга CSV']);
        setPreview(null);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleImport = () => {
    if (!preview || preview.length === 0) return;
    const { merged, added, updated } = mergeEntries(entries, preview);
    onImport(merged);
      setImportResult({ added, updated });
      setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleExport = () => {
    const csv = entriesToCsv(entries);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kazakh_dictionary_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    if (confirm('Вы уверены? Весь прогресс и данные будут удалены.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Импорт / Экспорт CSV</h1>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Импорт CSV</h2>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          onChange={handleFile}
          className="block w-full text-sm text-[var(--color-text-secondary)]
            file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0
            file:text-sm file:font-medium file:bg-[var(--color-primary)] file:text-white
            hover:file:bg-[var(--color-primary-hover)]"
        />
        <p className="text-xs text-[var(--color-text-secondary)] mt-2">
          Поддерживается UTF-8. Обязательные колонки: id, type, kz, ru
        </p>
      </div>

      {errors.length > 0 && (
        <div className="card border border-red-300 dark:border-red-700">
          <h3 className="font-semibold text-[var(--color-danger)] mb-2">Ошибки:</h3>
          <ul className="list-disc list-inside text-sm">
            {errors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
        </div>
      )}

      {preview && preview.length > 0 && (
        <div className="card">
          <h3 className="font-semibold mb-2">
            Предварительный просмотр: {preview.length} записей
          </h3>
          <div className="max-h-60 overflow-y-auto text-sm mb-3 border border-[var(--color-border)] rounded-xl">
            <table className="w-full">
              <thead className="sticky top-0 bg-[var(--color-surface)]">
                <tr className="border-b border-[var(--color-border)]">
                  <th className="text-left p-2">Тип</th>
                  <th className="text-left p-2">Казахский</th>
                  <th className="text-left p-2">Русский</th>
                  <th className="text-left p-2">Категория</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 20).map((e, i) => (
                  <tr key={i} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="p-2">{e.type === 'word' ? 'Слово' : 'Фраза'}</td>
                    <td className="p-2">{e.kz}</td>
                    <td className="p-2">{e.ru}</td>
                    <td className="p-2">{e.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 20 && (
              <p className="text-xs text-center text-[var(--color-text-secondary)] p-2">
                ...и ещё {preview.length - 20} записей
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={handleImport}>
              Импортировать
            </button>
            <button className="btn btn-ghost" onClick={() => { setPreview(null); }}>
              Отмена
            </button>
          </div>
        </div>
      )}

      {importResult && (
        <div className="card border border-[var(--color-success)]">
          <h3 className="font-semibold text-[var(--color-success)] mb-2">Импорт завершён</h3>
          <p className="text-sm">Добавлено: {importResult.added}</p>
          <p className="text-sm">Обновлено: {importResult.updated}</p>
        </div>
      )}

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Экспорт</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-3">
          Экспортировать текущий словарь вместе с прогрессом
        </p>
        <button className="btn btn-primary" onClick={handleExport}>
          Скачать CSV
        </button>
      </div>

      <div className="card border border-red-300 dark:border-red-700">
        <h2 className="text-lg font-semibold mb-3 text-[var(--color-danger)]">Сброс данных</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-3">
          Полностью удалить все данные и прогресс. Действие необратимо.
        </p>
        <button className="btn btn-danger" onClick={handleReset}>
          Сбросить всё
        </button>
      </div>
    </div>
  );
}
