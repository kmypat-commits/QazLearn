import { useState, useCallback } from 'react';

interface SpoilerTextProps {
  children: string;
  label?: string;
}

export default function SpoilerText({ children, label = 'Показать перевод' }: SpoilerTextProps) {
  const [revealed, setRevealed] = useState(false);

  const handleToggle = useCallback(() => {
    setRevealed(prev => !prev);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  }, [handleToggle]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        role="button"
        tabIndex={0}
        aria-label={revealed ? 'Скрыть перевод' : label}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className="select-none cursor-pointer text-center transition-all duration-300"
      >
        {revealed ? (
          <span className="text-lg font-medium text-[var(--color-text)] transition-opacity duration-300">
            {children}
          </span>
        ) : (
          <span
            className="text-lg tracking-widest text-[var(--color-text-secondary)] blur-[2px] hover:blur-none transition-all duration-300"
            aria-hidden="true"
          >
            {'★'.repeat(Math.max(4, Math.min(12, children.length)))}
          </span>
        )}
      </div>
      <span className="text-xs text-[var(--color-text-secondary)] select-none">
        {revealed ? 'Скрыть перевод' : 'Нажмите на звёздочки, чтобы открыть перевод'}
      </span>
    </div>
  );
}
