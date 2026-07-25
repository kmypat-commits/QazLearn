import { useState } from 'react';
import type { DictionaryEntry, Direction, AnswerRating } from '../types/dictionary';

interface FlashcardProps {
  entry: DictionaryEntry;
  direction: Direction;
  onAnswer: (rating: AnswerRating) => void;
  total: number;
  current: number;
}

export default function Flashcard({ entry, direction, onAnswer, total, current }: FlashcardProps) {
  const [flipped, setFlipped] = useState(false);

  const frontText = direction === 'kz-ru' ? entry.kz : entry.ru;
  const backText = direction === 'kz-ru' ? entry.ru : entry.kz;
  const backExample = direction === 'kz-ru' ? entry.example_ru : entry.example_kz;
  const backExampleText = direction === 'kz-ru' ? entry.example_kz : entry.example_ru;

  const handleFlip = () => setFlipped(true);

  const handleRate = (rating: AnswerRating) => {
    setFlipped(false);
    onAnswer(rating);
  };

  return (
    <div className="perspective w-full max-w-lg mx-auto">
      <div
        onClick={!flipped ? handleFlip : undefined}
        className="relative w-full min-h-[280px]"
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 0.5s',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        <div
          className="absolute inset-0 backface-hidden card flex flex-col items-center justify-center text-center"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="badge mb-3">{direction === 'kz-ru' ? 'қаз → рус' : 'рус → қаз'}</div>
          <h2 className="text-2xl font-bold mb-2">{frontText}</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">Нажмите, чтобы перевернуть</p>
          {entry.example_kz && (
            <div className="mt-3 text-sm text-[var(--color-text-secondary)] italic max-w-xs">
              {entry.example_kz}
            </div>
          )}
          {entry.example_ru && (
            <div className="text-sm text-[var(--color-text-secondary)] max-w-xs">
              {entry.example_ru}
            </div>
          )}
          <div className="mt-4 text-xs text-[var(--color-text-secondary)]">
            {current + 1} / {total}
          </div>
        </div>

        <div
          className="absolute inset-0 backface-hidden card flex flex-col items-center justify-center text-center"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <h2 className="text-2xl font-bold mb-3">{backText}</h2>
          {entry.example_kz && (
            <div className="mb-1 text-sm text-[var(--color-text-secondary)] italic">
              {backExampleText}
            </div>
          )}
          {entry.example_ru && (
            <div className="mb-4 text-sm text-[var(--color-text-secondary)]">
              {backExample}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap justify-center mt-3">
        <button className="btn btn-danger py-3 px-5 text-base flex-1 sm:flex-none" onClick={() => handleRate('dont-know')}>
          Не знаю
        </button>
        <button className="btn btn-warning py-3 px-5 text-base flex-1 sm:flex-none" onClick={() => handleRate('hard')}>
          Сложно
        </button>
        <button className="btn btn-success py-3 px-5 text-base flex-1 sm:flex-none" onClick={() => handleRate('good')}>
          Знаю
        </button>
      </div>
    </div>
  );
}
