import { useState } from 'react';

interface ScratchRevealProps {
  kz: string;
  ru: string;
  exampleKz?: string;
  exampleRu?: string;
  onRate: (rating: 'dont-know' | 'almost' | 'remembered') => void;
}

export default function ScratchReveal({ kz, ru, exampleKz, exampleRu, onRate }: ScratchRevealProps) {
  const [revealed, setRevealed] = useState(false);
  const [rated, setRated] = useState(false);

  const handleReveal = () => {
    if (!revealed) setRevealed(true);
  };

  const handleRate = (rating: 'dont-know' | 'almost' | 'remembered') => {
    setRated(true);
    onRate(rating);
  };

  return (
    <div className="card w-full max-w-lg mx-auto text-center">
      <h2 className="text-2xl font-bold mb-6">{kz}</h2>

      <div
        onClick={handleReveal}
        className="relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-6 min-h-[80px] flex items-center justify-center cursor-pointer select-none"
      >
        {!revealed ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-[var(--color-mask)] to-[var(--color-mask)] backdrop-blur-sm transition-all duration-500 hover:backdrop-blur-none">
            <span className="text-sm text-white font-medium">Нажмите, чтобы открыть перевод</span>
          </div>
        ) : (
          <div className="scratch-reveal w-full">
            <p className="text-xl font-semibold">{ru}</p>
          </div>
        )}
      </div>

      {revealed && !rated && (
        <div className="mt-6 animate-fade-in">
          {exampleKz && (
            <p className="text-sm text-[var(--color-text-secondary)] italic mb-1">{exampleKz}</p>
          )}
          {exampleRu && (
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">{exampleRu}</p>
          )}

          <div className="flex gap-2 flex-wrap justify-center">
            <button className="btn btn-danger text-sm py-2 px-3" onClick={() => handleRate('dont-know')}>
              Не вспомнил
            </button>
            <button className="btn btn-warning text-sm py-2 px-3" onClick={() => handleRate('almost')}>
              Почти вспомнил
            </button>
            <button className="btn btn-success text-sm py-2 px-3" onClick={() => handleRate('remembered')}>
              Вспомнил
            </button>
          </div>
          <button className="btn btn-ghost mt-3 text-sm" onClick={() => setRevealed(false)}>
            Скрыть снова
          </button>
        </div>
      )}

      {rated && (
        <p className="mt-4 text-sm text-[var(--color-text-secondary)]">Переход к следующей карточке...</p>
      )}
    </div>
  );
}
