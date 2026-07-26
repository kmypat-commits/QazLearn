import { useState, useCallback, useEffect } from 'react';
import type { DictionaryEntry, Direction, AnswerRating, PracticeMode, ProgressEntry } from '../types/dictionary';
import Flashcard from '../components/Flashcard';
import ScratchReveal from '../components/ScratchReveal';
import PracticeInput from '../components/PracticeInput';

interface PracticeProps {
  entries: DictionaryEntry[];
  progress: Record<number, ProgressEntry>;
  onProgressUpdate: (entryId: number, rating: 'dont-know' | 'hard' | 'good' | 'easy') => void;
  filterIds?: number[];
  initialMode?: PracticeMode;
}

export default function Practice({ entries, progress, onProgressUpdate, filterIds, initialMode }: PracticeProps) {
  const [mode, setMode] = useState<PracticeMode>(initialMode || 'flashcard');
  const [direction, setDirection] = useState<Direction>('kz-ru');
  const [sessionSize, setSessionSize] = useState<number>(10);
  const [onlyDifficult, setOnlyDifficult] = useState(false);
  const [onlyErrors, setOnlyErrors] = useState(false);
  const [smartSelect, setSmartSelect] = useState(true);

  const [sessionEntries, setSessionEntries] = useState<DictionaryEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionWrong, setSessionWrong] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);
  const [errorEntries, setErrorEntries] = useState<number[]>([]);

  const [choiceOptions, setChoiceOptions] = useState<{ text: string; correct: boolean }[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [choiceAnswered, setChoiceAnswered] = useState(false);

  const [scrambledWords, setScrambledWords] = useState<string[]>([]);
  const [arrangedWords, setArrangedWords] = useState<string[]>([]);
  const [phraseChecked, setPhraseChecked] = useState(false);
  const [phraseCorrect, setPhraseCorrect] = useState(false);

  const startSession = useCallback(() => {
    let pool = entries;

    if (filterIds && filterIds.length > 0) {
      pool = pool.filter(e => filterIds.includes(e.id));
    }

    if (onlyErrors) {
      pool = pool.filter(e => errorEntries.includes(e.id));
    }

    let difficult: DictionaryEntry[] = [];
    let rest: DictionaryEntry[] = [];
    if (onlyDifficult) {
      difficult = pool.filter(e => {
        const p = progress[e.id];
        if (!p || p.attempts === 0) return false;
        const accuracy = p.correctAnswers / p.attempts;
        return accuracy < 0.5 || p.knowledgeLevel <= 1 || p.wrongAnswers >= 2;
      });
      rest = pool.filter(e => !difficult.includes(e));
    }

    const mainPool = onlyDifficult ? difficult : pool;

    function weightedDraw(arr: DictionaryEntry[], count: number): DictionaryEntry[] {
      const pool = [...arr];
      const result: DictionaryEntry[] = [];
      for (let n = 0; n < count && pool.length > 0; n++) {
        const weights = pool.map(e => {
          const p = progress[e.id];
          return p ? (1 / (p.knowledgeLevel + 1)) + (p.wrongAnswers / Math.max(p.attempts, 1)) : 1;
        });
        const total = weights.reduce((s, w) => s + w, 0);
        let r = Math.random() * total;
        for (let i = 0; i < pool.length; i++) {
          r -= weights[i];
          if (r <= 0) {
            result.push(pool[i]);
            pool.splice(i, 1);
            break;
          }
        }
      }
      return result;
    }

    const targetSize = sessionSize === 0 ? mainPool.length : Math.min(sessionSize, mainPool.length);
    let selected: DictionaryEntry[];

    if (smartSelect) {
      selected = weightedDraw(mainPool, targetSize);
    } else {
      mainPool.sort(() => Math.random() - 0.5);
      selected = mainPool.slice(0, targetSize);
    }

    if (selected.length < targetSize) {
      rest.sort(() => Math.random() - 0.5);
      selected = [...selected, ...rest.slice(0, targetSize - selected.length)];
    }

    setSessionEntries(selected);
    setCurrentIndex(0);
    setSessionCorrect(0);
    setSessionWrong(0);
    setSessionDone(false);
    setChoiceAnswered(false);
    setSelectedChoice(null);
    setArrangedWords([]);
    setPhraseChecked(false);
    setPhraseCorrect(false);
  }, [entries, onlyDifficult, onlyErrors, smartSelect, sessionSize, errorEntries, progress]);

  useEffect(() => {
    startSession();
  }, []);

  useEffect(() => {
    if (mode === 'choice' && sessionEntries[currentIndex]) {
      generateChoices(sessionEntries[currentIndex]);
    }
    if (mode === 'phrase-build' && sessionEntries[currentIndex]) {
      setupPhraseBuild(sessionEntries[currentIndex]);
    }
  }, [currentIndex, mode, sessionEntries]);

  const generateChoices = (entry: DictionaryEntry) => {
    const correct = entry.ru;
    const sameCategory = entries.filter(
      e => e.category === entry.category && e.id !== entry.id
    );
    const wrongOptions = sameCategory
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(e => e.ru);

    const options = [
      { text: correct, correct: true },
      ...wrongOptions.map(text => ({ text, correct: false })),
    ].sort(() => Math.random() - 0.5);

    setChoiceOptions(options);
    setSelectedChoice(null);
    setChoiceAnswered(false);
  };

  const setupPhraseBuild = (entry: DictionaryEntry) => {
    const words = entry.kz.split(/\s+/).filter(Boolean);
    setScrambledWords([...words].sort(() => Math.random() - 0.5));
    setArrangedWords([]);
    setPhraseChecked(false);
    setPhraseCorrect(false);
  };

  const handleAnswer = (rating: AnswerRating) => {
    const entry = sessionEntries[currentIndex];
    if (!entry) return;

    onProgressUpdate(entry.id, rating);

    if (rating === 'dont-know') {
      setSessionWrong(prev => prev + 1);
      setErrorEntries(prev => [...new Set([...prev, entry.id])]);
    } else {
      setSessionCorrect(prev => prev + 1);
    }

    goNext();
  };

  const goNext = () => {
    if (currentIndex + 1 < sessionEntries.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setSessionDone(true);
    }
  };

  const handleInputAnswer = (correct: boolean) => {
    const entry = sessionEntries[currentIndex];
    if (!entry) return;

    if (correct) {
      onProgressUpdate(entry.id, 'good');
      setSessionCorrect(prev => prev + 1);
    } else {
      onProgressUpdate(entry.id, 'dont-know');
      setSessionWrong(prev => prev + 1);
      setErrorEntries(prev => [...new Set([...prev, entry.id])]);
    }
  };

  const handleChoiceSelect = (index: number) => {
    if (choiceAnswered) return;
    setSelectedChoice(index);
    setChoiceAnswered(true);

    const correct = choiceOptions[index].correct;
    handleInputAnswer(correct);
    setTimeout(() => goNext(), 1500);
  };

  const handlePhraseWordClick = (word: string, fromScrambled: boolean) => {
    if (fromScrambled) {
      setScrambledWords(prev => prev.filter(w => w !== word));
      setArrangedWords(prev => [...prev, word]);
    } else {
      setArrangedWords(prev => prev.filter(w => w !== word));
      setScrambledWords(prev => [...prev, word]);
    }
  };

  const handlePhraseCheck = () => {
    const entry = sessionEntries[currentIndex];
    if (!entry || phraseChecked) return;
    const userPhrase = arrangedWords.join(' ');
    const correct = userPhrase.toLowerCase() === entry.kz.toLowerCase();
    setPhraseChecked(true);
    setPhraseCorrect(correct);
    handleInputAnswer(correct);
    setTimeout(() => goNext(), 1500);
  };

  const finishSession = () => {
    setSessionEntries([]);
    setSessionDone(false);
  };

  const handleScratchRating = (rating: 'dont-know' | 'almost' | 'remembered') => {
    const mapped: AnswerRating = rating === 'dont-know' ? 'dont-know' : rating === 'almost' ? 'hard' : 'good';
    handleAnswer(mapped);
  };

  const currentEntry = sessionEntries[currentIndex];

  if (sessionDone) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-4">
        <div className="card">
          <h2 className="text-2xl font-bold mb-2">Сессия завершена!</h2>
          <div className="text-5xl font-bold text-[var(--color-primary)] my-4">
            {sessionCorrect}/{sessionCorrect + sessionWrong}
          </div>
          <p className="text-[var(--color-text-secondary)] mb-1">
            Правильно: {sessionCorrect}
          </p>
          <p className="text-[var(--color-text-secondary)] mb-4">
            Ошибок: {sessionWrong}
          </p>
          <div className="flex gap-2 justify-center">
            <button className="btn btn-primary" onClick={startSession}>
              Повторить сессию
            </button>
            <button className="btn btn-ghost" onClick={() => { setOnlyErrors(true); startSession(); }}>
              Ошибочные ({errorEntries.length})
            </button>
            <button className="btn btn-danger" onClick={finishSession}>
              Завершить
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentEntry) {
    return (
      <div className="max-w-lg mx-auto text-center">
        <div className="card">
          <p className="text-[var(--color-text-secondary)]">Нет карточек для изучения</p>
          <button className="btn btn-primary mt-3" onClick={startSession}>Начать</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="card">
        <h1 className="text-xl font-bold mb-2">Практика</h1>
        <div className="flex flex-wrap gap-2 mb-3">
          <select
            value={mode}
            onChange={e => setMode(e.target.value as PracticeMode)}
            className="px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm"
          >
            <option value="flashcard">Переворачивающиеся карточки</option>
            <option value="scratch">Скрытый перевод</option>
            <option value="input-kz">Русский → казахский</option>
            <option value="input-ru">Казахский → русский</option>
            <option value="choice">Выбор ответа</option>
            <option value="phrase-build">Собрать фразу</option>
          </select>

          <select
            value={direction}
            onChange={e => setDirection(e.target.value as Direction)}
            className="px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm"
          >
            <option value="kz-ru">Казахский → русский</option>
            <option value="ru-kz">Русский → казахский</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2 mb-2">
          <select
            value={sessionSize}
            onChange={e => setSessionSize(parseInt(e.target.value))}
            className="px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-sm"
          >
            <option value={5}>5 карточек</option>
            <option value={10}>10 карточек</option>
            <option value={20}>20 карточек</option>
            <option value={0}>Все</option>
          </select>

          <label className="flex items-center gap-1 text-sm cursor-pointer">
            <input type="checkbox" checked={smartSelect} onChange={e => setSmartSelect(e.target.checked)} />
            Умный подбор
          </label>
          <label className="flex items-center gap-1 text-sm cursor-pointer">
            <input type="checkbox" checked={onlyDifficult} onChange={e => setOnlyDifficult(e.target.checked)} />
            Сложные
          </label>

          {errorEntries.length > 0 && (
            <label className="flex items-center gap-1 text-sm cursor-pointer">
              <input type="checkbox" checked={onlyErrors} onChange={e => setOnlyErrors(e.target.checked)} />
              Ошибки ({errorEntries.length})
            </label>
          )}

          <button className="btn btn-ghost text-xs py-1 px-3" onClick={startSession}>
            Обновить
          </button>
        </div>

        <div className="text-sm text-[var(--color-text-secondary)] text-center">
          {currentIndex + 1} / {sessionEntries.length}
          <span className="mx-2">·</span>
          Правильно: {sessionCorrect}
          <span className="mx-2">·</span>
          Ошибок: {sessionWrong}
        </div>
      </div>

      {mode === 'flashcard' && (
        <Flashcard
          key={currentEntry.id}
          entry={currentEntry}
          direction={direction}
          onAnswer={handleAnswer}
          total={sessionEntries.length}
          current={currentIndex}
        />
      )}

      {mode === 'scratch' && (
        <ScratchReveal
          key={currentEntry.id}
          kz={currentEntry.kz}
          ru={currentEntry.ru}
          exampleKz={currentEntry.example_kz}
          exampleRu={currentEntry.example_ru}
          direction={direction}
          onRate={handleScratchRating}
        />
      )}

      {(mode === 'input-kz' || mode === 'input-ru') && (
        <PracticeInput
          key={currentEntry.id}
          entry={currentEntry}
          direction={mode === 'input-kz' ? 'ru-kz' : 'kz-ru'}
          onAnswer={handleInputAnswer}
          onSkip={goNext}
        />
      )}

      {mode === 'choice' && (
        <div key={currentEntry.id} className="card">
          <h2 className="text-xl font-bold mb-1 text-center">{currentEntry.kz}</h2>
          <p className="text-sm text-[var(--color-text-secondary)] text-center mb-4">
            Выберите правильный перевод
          </p>
          <div className="space-y-2">
            {choiceOptions.map((opt, i) => {
              let btnClass = 'btn btn-ghost w-full text-left py-3 px-4 text-base';
              if (choiceAnswered) {
                if (opt.correct) btnClass = 'btn btn-success w-full text-left py-3 px-4 text-base';
                else if (selectedChoice === i) btnClass = 'btn btn-danger w-full text-left py-3 px-4 text-base';
                else btnClass = 'btn btn-ghost w-full text-left py-3 px-4 text-base opacity-50';
              }
              return (
                <button
                  key={i}
                  className={btnClass}
                  onClick={() => handleChoiceSelect(i)}
                  disabled={choiceAnswered}
                >
                  {opt.text}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {mode === 'phrase-build' && (
        <div className="card">
          <h2 className="text-xl font-bold mb-1 text-center">Соберите фразу</h2>
          <p className="text-sm text-[var(--color-text-secondary)] text-center mb-4">
            {currentEntry.ru}
          </p>

          <div className="flex flex-wrap gap-2 justify-center min-h-[60px] p-3 mb-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]">
            {arrangedWords.length === 0 ? (
              <span className="text-[var(--color-text-secondary)] text-sm">Нажимайте на слова, чтобы собрать фразу</span>
            ) : (
              arrangedWords.map((word, i) => (
                <button
                  key={i}
                  className={`px-3 py-1.5 rounded-lg text-white text-sm ${
                    phraseChecked
                      ? phraseCorrect
                        ? 'bg-[var(--color-success)]'
                        : word !== currentEntry.kz.split(/\s+/)[i]
                          ? 'bg-[var(--color-danger)]'
                          : 'bg-[var(--color-primary)]'
                      : 'bg-[var(--color-primary)]'
                  }`}
                  onClick={() => !phraseChecked && handlePhraseWordClick(word, false)}
                >
                  {word}
                </button>
              ))
            )}
          </div>

          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {scrambledWords.map((word, i) => (
              <button
                key={i}
                className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-sm hover:bg-[var(--color-border)] disabled:opacity-30 disabled:cursor-not-allowed"
                onClick={() => handlePhraseWordClick(word, true)}
                disabled={phraseChecked}
              >
                {word}
              </button>
            ))}
          </div>

          {phraseChecked ? (
            <div className={`text-center font-semibold ${phraseCorrect ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
              {phraseCorrect ? '✓ Правильно!' : `✗ ${currentEntry.kz}`}
            </div>
          ) : (
            <button
              className="btn btn-primary w-full"
              onClick={handlePhraseCheck}
              disabled={arrangedWords.length === 0}
            >
              Проверить
            </button>
          )}
        </div>
      )}
    </div>
  );
}
