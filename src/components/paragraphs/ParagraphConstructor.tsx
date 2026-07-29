import { useState, useCallback } from 'react';

type ConstructorMode = 'sentence' | 'blocks';

function splitSentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/).filter(Boolean);
}

function splitWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

interface ParagraphConstructorProps {
  blocksKz: string[];
  correctOrder: string[];
  kzText: string;
  onCorrect: () => void;
  onIncorrect: (wrongBlocks: string[]) => void;
}

function shuffleArray<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function ParagraphConstructor({
  blocksKz,
  correctOrder,
  kzText,
  onCorrect,
  onIncorrect,
}: ParagraphConstructorProps) {
  const [mode, setMode] = useState<ConstructorMode>('sentence');

  const sentenceBlocks = blocksKz.length > 0 && blocksKz[0].length < kzText.length * 0.8
    ? blocksKz
    : splitSentences(kzText);
  const wordBlocks = splitWords(kzText);

  const allBlocks = mode === 'sentence' ? sentenceBlocks : wordBlocks;
  const order = mode === 'sentence' ? correctOrder : wordBlocks;

  const [available, setAvailable] = useState<string[]>(() => shuffleArray(allBlocks));
  const [placed, setPlaced] = useState<string[]>([]);
  const [wrongIndices, setWrongIndices] = useState<Set<number>>(new Set());
  const [checked, setChecked] = useState(false);
  const [success, setSuccess] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const resetGame = useCallback(() => {
    setAvailable([...allBlocks].sort(() => Math.random() - 0.5));
    setPlaced([]);
    setWrongIndices(new Set());
    setChecked(false);
    setSuccess(false);
    setDraggedItem(null);
  }, [allBlocks]);

  const handlePlaceBlock = useCallback((block: string) => {
    if (checked) return;
    setAvailable(prev => prev.filter(b => b !== block));
    setPlaced(prev => [...prev, block]);
    setWrongIndices(new Set());
  }, [checked]);

  const handleRemoveBlock = useCallback((index: number) => {
    if (checked) return;
    setPlaced(prev => {
      const block = prev[index];
      setAvailable(av => [...av, block]);
      return prev.filter((_, i) => i !== index);
    });
    setWrongIndices(new Set());
  }, [checked]);

  const handleMoveUp = useCallback((index: number) => {
    if (checked || index === 0) return;
    setPlaced(prev => {
      const arr = [...prev];
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      return arr;
    });
    setWrongIndices(new Set());
  }, [checked]);

  const handleMoveDown = useCallback((index: number) => {
    if (checked || index === placed.length - 1) return;
    setPlaced(prev => {
      const arr = [...prev];
      [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
      return arr;
    });
    setWrongIndices(new Set());
  }, [checked, placed.length]);

  const handleDragStart = useCallback((block: string) => {
    setDraggedItem(block);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDropOnPlaced = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (!draggedItem || checked) return;
    setDraggedItem(null);

    const inPlaced = placed.includes(draggedItem);
    if (inPlaced) {
      setPlaced(prev => {
        const arr = [...prev];
        const fromIdx = arr.indexOf(draggedItem);
        arr.splice(fromIdx, 1);
        arr.splice(index, 0, draggedItem);
        return arr;
      });
    } else {
      setAvailable(prev => prev.filter(b => b !== draggedItem));
      setPlaced(prev => {
        const arr = [...prev];
        arr.splice(index, 0, draggedItem);
        return arr;
      });
    }
    setWrongIndices(new Set());
  }, [draggedItem, checked, placed]);

  const handleDropOnAvailable = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedItem || checked) return;
    setDraggedItem(null);
    const inAvailable = available.includes(draggedItem);
    if (!inAvailable) {
      setPlaced(prev => prev.filter(b => b !== draggedItem));
      setAvailable(prev => [...prev, draggedItem]);
    }
    setWrongIndices(new Set());
  }, [draggedItem, checked, available]);

  const handleCheck = useCallback(() => {
    setChecked(true);
    const wrong: string[] = [];
    const indices = new Set<number>();

    for (let i = 0; i < placed.length; i++) {
      if (i >= order.length || placed[i] !== order[i]) {
        wrong.push(placed[i]);
        indices.add(i);
      }
    }

    setWrongIndices(indices);

    if (wrong.length === 0 && placed.length === order.length) {
      setSuccess(true);
      onCorrect();
    } else {
      onIncorrect(wrong);
    }
  }, [placed, order, onCorrect, onIncorrect]);

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 p-0.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)]">
          <button
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              mode === 'sentence' ? 'bg-[var(--color-primary)] text-white shadow-sm' : 'text-[var(--color-text-secondary)]'
            }`}
            onClick={() => setMode('sentence')}
          >
            Предложения
          </button>
          <button
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              mode === 'blocks' ? 'bg-[var(--color-primary)] text-white shadow-sm' : 'text-[var(--color-text-secondary)]'
            }`}
            onClick={() => setMode('blocks')}
          >
            Слова
          </button>
        </div>
        <button className="btn btn-ghost text-xs py-1 px-3" onClick={resetGame}>
          Сбросить
        </button>
      </div>

      <div
        className="min-h-[60px] p-3 rounded-xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-bg)] flex flex-wrap gap-2"
        onDragOver={handleDragOver}
        onDrop={handleDropOnAvailable}
      >
        <span className="w-full text-xs text-[var(--color-text-secondary)] font-medium mb-1">
          Доступные блоки
        </span>
        {available.length === 0 && (
          <span className="text-xs text-[var(--color-text-secondary)] italic">Все блоки использованы</span>
        )}
        {available.map(block => (
          <div
            key={block}
            draggable={!checked}
            onDragStart={() => handleDragStart(block)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-medium cursor-grab active:cursor-grabbing select-none hover:border-[var(--color-primary)] transition-colors"
            onClick={() => handlePlaceBlock(block)}
          >
            <svg className="w-3 h-3 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
            </svg>
            {block}
          </div>
        ))}
      </div>

      <div
        className="min-h-[80px] p-3 rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col gap-1.5"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDropOnPlaced(e, placed.length)}
      >
        <span className="text-xs text-[var(--color-text-secondary)] font-medium mb-1">
          Ваш порядок
        </span>
        {placed.length === 0 && (
          <span className="text-xs text-[var(--color-text-secondary)] italic">
            Перетащите или нажмите на блоки, чтобы расположить их в правильном порядке
          </span>
        )}
        {placed.map((block, index) => {
          const isWrong = wrongIndices.has(index);
          return (
            <div
              key={`${block}-${index}`}
              draggable={!checked}
              onDragStart={() => handleDragStart(block)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDropOnPlaced(e, index)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                isWrong
                  ? 'border-[var(--color-danger)] bg-[var(--color-danger)]/10 text-[var(--color-danger)]'
                  : checked && !isWrong
                    ? 'border-[var(--color-success)] bg-[var(--color-success)]/5 text-[var(--color-success)]'
                    : 'border-[var(--color-border)] bg-[var(--color-bg)]'
              }`}
            >
              <span className="w-5 h-5 flex items-center justify-center rounded-full bg-[var(--color-border)] text-xs font-bold text-[var(--color-text-secondary)]">
                {index + 1}
              </span>
              <span className="flex-1">{block}</span>
              <div className="flex items-center gap-0.5">
                <button
                  className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-[var(--color-text-secondary)] disabled:opacity-20"
                  onClick={() => handleMoveUp(index)}
                  disabled={checked || index === 0}
                  aria-label="Переместить вверх"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                  </svg>
                </button>
                <button
                  className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-[var(--color-text-secondary)] disabled:opacity-20"
                  onClick={() => handleMoveDown(index)}
                  disabled={checked || index === placed.length - 1}
                  aria-label="Переместить вниз"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                <button
                  className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-[var(--color-text-secondary)] disabled:opacity-20"
                  onClick={() => handleRemoveBlock(index)}
                  disabled={checked}
                  aria-label="Удалить блок"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {!checked ? (
        <button
          className="btn btn-primary w-full"
          onClick={handleCheck}
          disabled={placed.length === 0}
        >
          Проверить
        </button>
      ) : (
        <div className="space-y-2">
          {success ? (
            <div className="p-4 rounded-xl bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 text-center animate-fade-in">
              <div className="text-2xl mb-1">✓</div>
              <p className="text-[var(--color-success)] font-semibold">Правильно!</p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 text-center animate-fade-in">
              <p className="text-[var(--color-danger)] font-semibold mb-1">
                {wrongIndices.size} {wrongIndices.size === 1 ? 'блок' : 'блоков'} расположены неверно
              </p>
              <p className="text-xs text-[var(--color-text-secondary)]">Красным выделены неправильные позиции</p>
            </div>
          )}
          <button className="btn btn-ghost w-full" onClick={resetGame}>
            Попробовать снова
          </button>
        </div>
      )}
    </div>
  );
}
