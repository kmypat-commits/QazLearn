import { useState, useRef, useEffect } from 'react';
import type { DictionaryEntry } from '../types/dictionary';
import { compareAnswers, findEndingErrors } from '../lib/answerComparison';

interface PracticeInputProps {
  entry: DictionaryEntry;
  direction: 'kz-ru' | 'ru-kz';
  onAnswer: (correct: boolean) => void;
  onSkip: () => void;
}

export default function PracticeInput({ entry, direction, onAnswer, onSkip }: PracticeInputProps) {
  const [userInput, setUserInput] = useState('');
  const [checked, setChecked] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof compareAnswers> | null>(null);
  const [endingErrors, setEndingErrors] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const promptText = direction === 'kz-ru' ? entry.kz : entry.ru;
  const correctAnswer = direction === 'kz-ru' ? entry.ru : entry.kz;

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [entry]);

  useEffect(() => {
    setChecked(false);
    setResult(null);
    setEndingErrors([]);
    setUserInput('');
  }, [entry]);

  const handleCheck = () => {
    const comparison = compareAnswers(userInput, correctAnswer);
    const endings = findEndingErrors(userInput, correctAnswer);
    setResult(comparison);
    setEndingErrors(endings);
    setChecked(true);
    onAnswer(comparison.isCorrect);
  };

  const handleNext = () => {
    setChecked(false);
    setResult(null);
    setEndingErrors([]);
    setUserInput('');
    onSkip();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !checked) handleCheck();
    if (e.key === 'Enter' && checked) handleNext();
  };

  return (
    <div className="card w-full max-w-lg mx-auto">
      <h2 className="text-xl font-semibold mb-2">Переведите:</h2>
      <p className="text-2xl font-bold mb-4">{promptText}</p>

      <input
        ref={inputRef}
        type="text"
        value={userInput}
        onChange={e => setUserInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={checked}
        placeholder={direction === 'kz-ru' ? 'Введите перевод на русском...' : 'Введите перевод на казахском...'}
        className="w-full p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
      />

      {!checked && (
        <div className="flex gap-2 mt-3">
          <button className="btn btn-primary flex-1" onClick={handleCheck} disabled={!userInput.trim()}>
            Проверить
          </button>
          <button className="btn btn-ghost" onClick={onSkip}>Пропустить</button>
        </div>
      )}

      {checked && result && (
        <div className="mt-4 p-4 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)]">
          <p className="text-sm text-[var(--color-text-secondary)] mb-2">Правильный ответ:</p>
          <p className="text-lg font-semibold">{correctAnswer}</p>

          {!result.isCorrect && (
            <div className="mt-2">
              {result.errors.length > 0 && (
                <div className="mt-2 text-sm">
                  <p className="font-medium text-[var(--color-warning)] mb-1">Отличающиеся символы (выделены):</p>
                  <div className="flex flex-wrap gap-1">
                    {result.normalizedUser.split('').map((char, i) => {
                      const isDiff = result.errors.some(e => e.index === i);
                      return (
                        <span
                          key={i}
                          className={isDiff ? 'bg-[var(--color-danger)]/20 text-[var(--color-danger)] px-1 rounded' : ''}
                        >
                          {char}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {endingErrors.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium text-sm text-[var(--color-warning)] mb-1">Ошибки в окончаниях:</p>
                  <ul className="text-sm list-disc list-inside">
                    {endingErrors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {result.isCorrect && (
            <p className="mt-2 text-[var(--color-success)] font-medium">Правильно!</p>
          )}

          <button className="btn btn-primary mt-3 w-full" onClick={handleNext}>
            Далее
          </button>
        </div>
      )}
    </div>
  );
}
