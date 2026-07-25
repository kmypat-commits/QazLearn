import { useState, useCallback, useEffect } from 'react';
import type { DictionaryEntry, Direction, AnswerRating, PracticeMode } from '../types/dictionary';
import Flashcard from '../components/Flashcard';
import ScratchReveal from '../components/ScratchReveal';
import PracticeInput from '../components/PracticeInput';

interface PracticeProps {
  entries: DictionaryEntry[];
  onProgressUpdate: (entryId: number, rating: 'dont-know' | 'hard' | 'good' | 'easy') => void;
  filterIds?: number[];
  initialMode?: PracticeMode;
}

export default function Practice({ entries, onProgressUpdate, filterIds, initialMode }: PracticeProps) {
  const [mode, setMode] = useState<PracticeMode>(initialMode || 'flashcard');
  const [direction, setDirection] = useState<Direction>('kz-ru');
  const [sessionSize, setSessionSize] = useState<number>(10);
  const [onlyDifficult, setOnlyDifficult] = useState(false);
  const [onlyErrors, setOnlyErrors] = useState(false);
  const [shuffled, setShuffled] = useState(true);

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

  const startSession = useCallback(() => {
    let pool = entries;

    if (filterIds && filterIds.length > 0) {
      pool = pool.filter(e => filterIds.includes(e.id));
    }

    if (onlyDifficult) {
      pool = pool.filter(e => e.difficulty >= 3);
    }

    if (onlyErrors) {
      pool = pool.filter(e => errorEntries.includes(e.id));
    }

    if (shuffled) {
      pool = [...pool].sort(() => Math.random() - 0.5);
    }

    const size = sessionSize === 0 ? pool.length : Math.min(sessionSize, pool.length);
    const selected = pool.slice(0, size);

    setSessionEntries(selected);
    setCurrentIndex(0);
    setSessionCorrect(0);
    setSessionWrong(0);
    setSessionDone(false);
    setChoiceAnswered(false);
    setSelectedChoice(null);
    setArrangedWords([]);
  }, [entries, onlyDifficult, onlyErrors, shuffled, sessionSize, errorEntries]);

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
    if (!entry) return;
    const userPhrase = arrangedWords.join(' ');
    const correct = userPhrase.toLowerCase() === entry.kz.toLowerCase();
    handleInputAnswer(correct);
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
            <input type="checkbox" checked={shuffled} onChange={e => setShuffled(e.target.checked)} />
            Перемешать
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
                  className="px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-white text-sm"
                  onClick={() => handlePhraseWordClick(word, false)}
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
                className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-sm hover:bg-[var(--color-border)]"
                onClick={() => handlePhraseWordClick(word, true)}
              >
                {word}
              </button>
            ))}
          </div>

          <button
            className="btn btn-primary w-full"
            onClick={handlePhraseCheck}
            disabled={arrangedWords.length === 0}
          >
            Проверить
          </button>
        </div>
      )}
    </div>
  );
}
