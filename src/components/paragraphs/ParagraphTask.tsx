import { useState, useCallback, useEffect, useRef } from 'react';
import type { ParagraphEntry, ParagraphDirection } from '../../types/dictionary';
import ParagraphAnswerInput from './ParagraphAnswerInput';
import SpoilerText from './SpoilerText';
import ParagraphResult from './ParagraphResult';

const DRAFTS_KEY = 'qazlearn_paragraph_drafts';

function loadDraft(id: string): string {
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    if (!raw) return '';
    const drafts: Record<string, string> = JSON.parse(raw);
    return drafts[id] || '';
  } catch {
    return '';
  }
}

function saveDraft(id: string, value: string): void {
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    const drafts: Record<string, string> = raw ? JSON.parse(raw) : {};
    if (value.trim()) {
      drafts[id] = value;
    } else {
      delete drafts[id];
    }
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  } catch {
    /* ignore */
  }
}

function removeDraft(id: string): void {
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    if (!raw) return;
    const drafts: Record<string, string> = JSON.parse(raw);
    delete drafts[id];
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  } catch {
    /* ignore */
  }
}

type AssessmentRating = 'correct' | 'partial' | 'many-errors';

interface HintLevel {
  label: string;
  key: string;
  content: string;
}

interface ParagraphTaskProps {
  entry: ParagraphEntry;
  direction: ParagraphDirection | 'mixed';
  onComplete: (result: {
    userAnswer: string;
    correctText: string;
    sentences: {
      source: string;
      user: string;
      correct: string;
      errors: {
        userFragment: string;
        correctFragment: string;
        type: string;
        explanation: string;
      }[];
    }[];
    totalCorrect: number;
    totalPartial: number;
    totalErrors: number;
    errorTypes: { type: string; count: number }[];
  }) => void;
  onNext: () => void;
}

export default function ParagraphTask({
  entry,
  direction,
  onComplete,
  onNext,
}: ParagraphTaskProps) {
  const [userInput, setUserInput] = useState(() => loadDraft(entry.id));
  const [checked, setChecked] = useState(false);
  const [result, setResult] = useState<{
    userAnswer: string; correctText: string;
    sentences: { source: string; user: string; correct: string; errors: { userFragment: string; correctFragment: string; type: string; explanation: string }[] }[];
    totalCorrect: number; totalPartial: number; totalErrors: number;
    errorTypes: { type: string; count: number }[];
  } | null>(null);
  const [activeHint, setActiveHint] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<AssessmentRating | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const actualDirection: ParagraphDirection = direction === 'mixed'
    ? (Math.random() > 0.5 ? 'ru_kz' : 'kz_ru')
    : direction;

  const sourceText = actualDirection === 'ru_kz' ? entry.ruText : entry.kzText;
  const correctText = actualDirection === 'ru_kz' ? entry.kzText : entry.ruText;

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [entry.id]);

  useEffect(() => {
    if (!checked) {
      saveDraft(entry.id, userInput);
    }
  }, [userInput, checked, entry.id]);

  useEffect(() => {
    setChecked(false);
    setResult(null);
    setActiveHint(null);
    setAssessment(null);
    setHintsUsed(0);
    setUserInput(loadDraft(entry.id));
  }, [entry.id]);

  const handleInputChange = useCallback((value: string) => {
    setUserInput(value);
  }, []);

  const handleCheck = useCallback(() => {
    if (!userInput.trim()) return;

    const userSentences = userInput
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(Boolean);
    const correctSentences = correctText
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(Boolean);
    const sourceSentences = sourceText
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(Boolean);

    const sentences = correctSentences.map((correctSent, idx) => {
      const userSent = userSentences[idx] || '';
      const sourceSent = sourceSentences[idx] || '';

      const errors: {
        userFragment: string;
        correctFragment: string;
        type: string;
        explanation: string;
      }[] = [];

      const userWords = userSent.split(/\s+/).filter(Boolean);
      const correctWords = correctSent.split(/\s+/).filter(Boolean);

      const maxLen = Math.max(userWords.length, correctWords.length);
      for (let wi = 0; wi < maxLen; wi++) {
        const uw = userWords[wi] || '';
        const cw = correctWords[wi] || '';

        if (uw.toLowerCase() !== cw.toLowerCase()) {
          let errorType = 'vocabulary';
          let explanation = '';

          if (uw.length > 0 && cw.length > 0) {
            const uwNorm = uw.toLowerCase().replace(/[,.!?;:()"'«»-]/g, '');
            const cwNorm = cw.toLowerCase().replace(/[,.!?;:()"'«»-]/g, '');

            if (uwNorm !== cwNorm) {
              if (uwNorm.length > 2 && cwNorm.length > 2 && uwNorm.slice(0, -2) === cwNorm.slice(0, -2)) {
                errorType = 'spelling';
                explanation = `Возможно, ошибка в окончании: "${uw}" вместо "${cw}"`;
              } else if (cw.includes('-') && !uw.includes('-')) {
                errorType = 'spelling';
                explanation = `В слове "${cw}" используется дефис. Проверьте написание.`;
              } else {
                errorType = 'vocabulary';
                explanation = `Неверное слово: "${uw}" вместо "${cw}"`;
              }
            }
          } else if (uw.length === 0) {
            errorType = 'missing_word';
            explanation = `Пропущено слово: "${cw}"`;
          } else {
            errorType = 'extra_word';
            explanation = `Лишнее слово: "${uw}"`;
          }

          errors.push({
            userFragment: uw || '—',
            correctFragment: cw || '—',
            type: errorType,
            explanation,
          });
        }
      }

      return {
        source: sourceSent,
        user: userSent,
        correct: correctSent,
        errors,
      };
    });

    let totalCorrect = 0;
    let totalPartial = 0;
    let totalErrors = 0;
    const errorTypeMap = new Map<string, number>();

    for (const s of sentences) {
      if (s.errors.length === 0) {
        totalCorrect++;
      } else {
        totalPartial++;
        totalErrors += s.errors.length;
      }
      for (const e of s.errors) {
        errorTypeMap.set(e.type, (errorTypeMap.get(e.type) || 0) + 1);
      }
    }

    const errorTypes = Array.from(errorTypeMap.entries()).map(([type, count]) => ({ type, count }));

    const fullResult = {
      userAnswer: userInput,
      correctText,
      sentences,
      totalCorrect,
      totalPartial,
      totalErrors,
      errorTypes,
    };

    setResult(fullResult);
    setChecked(true);
    removeDraft(entry.id);
    onComplete(fullResult);
  }, [userInput, correctText, sourceText, onComplete, entry.id]);

  const handleClear = useCallback(() => {
    setUserInput('');
    setActiveHint(null);
    removeDraft(entry.id);
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const handleReset = useCallback(() => {
    setChecked(false);
    setResult(null);
    setActiveHint(null);
    setAssessment(null);
    setUserInput(loadDraft(entry.id));
    if (inputRef.current) inputRef.current.focus();
  }, [entry.id]);

  const handleAssessment = useCallback((rating: AssessmentRating) => {
    setAssessment(rating);
  }, []);

  const handleRevealAnswer = useCallback(() => {
    setUserInput(correctText);
    setHintsUsed(prev => prev + 1);
  }, [correctText]);

  const handleHintToggle = useCallback((key: string) => {
    setActiveHint(prev => prev === key ? null : key);
    if (activeHint !== key) {
      setHintsUsed(prev => prev + 1);
    }
  }, [activeHint]);

  const hints: HintLevel[] = [
    {
      label: 'Ключевые слова',
      key: 'keywords',
      content: entry.keyWords.length > 0
        ? entry.keyWords.join(', ')
        : 'Нет ключевых слов для этого упражнения',
    },
    {
      label: 'Структура',
      key: 'structure',
      content: entry.grammarFocus.length > 0
        ? entry.grammarFocus.join(', ')
        : 'Нет подсказок по структуре для этого упражнения',
    },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="badge">{actualDirection === 'ru_kz' ? 'рус → қаз' : 'қаз → рус'}</span>
            {entry.difficulty > 0 && (
              <span className="text-xs text-[var(--color-text-secondary)]">
                {'★'.repeat(entry.difficulty)}{'☆'.repeat(5 - entry.difficulty)}
              </span>
            )}
          </div>
          <span className="text-xs text-[var(--color-text-secondary)]">{entry.category}</span>
        </div>

        <h2 className="text-lg font-semibold mb-3">{entry.title}</h2>

        <div className="p-4 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] block mb-2">
            {actualDirection === 'ru_kz' ? 'Исходный текст (русский)' : 'Исходный текст (казахский)'}
          </span>
          <p className="text-base leading-relaxed whitespace-pre-line">{sourceText}</p>
        </div>
      </div>

      {!checked && (
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
            Ваш перевод
          </h3>

          <ParagraphAnswerInput
            value={userInput}
            onChange={handleInputChange}
            placeholder={
              actualDirection === 'ru_kz'
                ? 'Введите перевод на казахском...'
                : 'Введите перевод на русском...'
            }
          />

          <div className="flex flex-wrap gap-2">
            <button
              className="btn btn-primary flex-1 sm:flex-none"
              onClick={handleCheck}
              disabled={!userInput.trim()}
            >
              Проверить
            </button>
            <button className="btn btn-ghost" onClick={handleClear}>
              Очистить
            </button>
            <button className="btn btn-ghost" onClick={handleReset}>
              Сбросить
            </button>
            <button className="btn btn-ghost" onClick={handleRevealAnswer}>
              Показать перевод
            </button>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider block">
              Подсказки
            </span>
            {hints.map(hint => (
              <div key={hint.key}>
                <button
                  className="flex items-center gap-2 text-sm font-medium text-[var(--color-primary)] hover:underline"
                  onClick={() => handleHintToggle(hint.key)}
                >
                  <svg
                    className={`w-3.5 h-3.5 transition-transform ${activeHint === hint.key ? 'rotate-90' : ''}`}
                    fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                  {hint.label}
                </button>
                {activeHint === hint.key && (
                  <div className="mt-1.5 p-3 rounded-lg bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 text-sm leading-relaxed animate-fade-in">
                    {hint.content}
                  </div>
                )}
              </div>
            ))}
            <div className="pt-1">
              <SpoilerText label="Показать перевод">
                {correctText}
              </SpoilerText>
            </div>
          </div>
        </div>
      )}

      {checked && result && (
        <div className="space-y-4">
          <ParagraphResult
            sourceText={sourceText}
            userAnswer={result.userAnswer}
            correctText={result.correctText}
            sentences={result.sentences}
            totalCorrect={result.totalCorrect}
            totalPartial={result.totalPartial}
            totalErrors={result.totalErrors}
            errorTypes={result.errorTypes}
          />

          {!assessment && (
            <div className="card space-y-3">
              <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                Самооценка
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  className="flex-1 sm:flex-none btn btn-success"
                  onClick={() => handleAssessment('correct')}
                >
                  Правильно
                </button>
                <button
                  className="flex-1 sm:flex-none btn btn-warning"
                  onClick={() => handleAssessment('partial')}
                >
                  Почти правильно
                </button>
                <button
                  className="flex-1 sm:flex-none btn btn-danger"
                  onClick={() => handleAssessment('many-errors')}
                >
                  Много ошибок
                </button>
              </div>
            </div>
          )}

          {assessment && (
            <div className="card space-y-3 text-center">
              <p className="text-sm text-[var(--color-text-secondary)]">
                {assessment === 'correct' && 'Отлично! Продолжайте в том же духе.'}
                {assessment === 'partial' && 'Неплохо! Обратите внимание на ошибки.'}
                {assessment === 'many-errors' && 'Попробуйте ещё раз, чтобы закрепить материал.'}
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {assessment === 'many-errors' && (
                  <button className="btn btn-primary" onClick={handleReset}>
                    Попробовать снова
                  </button>
                )}
                <button className="btn btn-ghost" onClick={onNext}>
                  Следующий абзац
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
