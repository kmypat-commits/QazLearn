import ErrorExplanation from './ErrorExplanation';

interface SentenceComparisonProps {
  index: number;
  source: string;
  user: string;
  correct: string;
  errors: {
    userFragment: string;
    correctFragment: string;
    type: string;
    explanation: string;
  }[];
}

function highlightDifferences(text: string, fragments: string[], highlightClass: string): (string | React.ReactNode)[] {
  if (fragments.length === 0) return [text];

  const parts: (string | React.ReactNode)[] = [];
  let remaining = text;

  for (const frag of fragments) {
    const idx = remaining.toLowerCase().indexOf(frag.toLowerCase());
    if (idx === -1) {
      continue;
    }
    if (idx > 0) {
      parts.push(remaining.slice(0, idx));
    }
    parts.push(
      <span key={`${frag}-${idx}`} className={highlightClass}>
        {remaining.slice(idx, idx + frag.length)}
      </span>
    );
    remaining = remaining.slice(idx + frag.length);
  }

  if (remaining.length > 0) {
    parts.push(remaining);
  }

  return parts.length > 0 ? parts : [text];
}

export default function SentenceComparison({
  index,
  source,
  user,
  correct,
  errors,
}: SentenceComparisonProps) {
  const userErrorFragments = errors.map(e => e.userFragment).filter(Boolean);
  const correctErrorFragments = errors.map(e => e.correctFragment).filter(Boolean);

  const isCorrect = errors.length === 0;

  return (
    <div className={`card space-y-3 ${isCorrect ? 'border-l-4 border-l-[var(--color-success)]' : 'border-l-4 border-l-[var(--color-warning)]'}`}>
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
          Предложение {index + 1}
        </span>
        {isCorrect ? (
          <span className="text-xs font-medium text-[var(--color-success)]">✓ Верно</span>
        ) : (
          <span className="text-xs font-medium text-[var(--color-danger)]">✗ {errors.length} {errors.length === 1 ? 'ошибка' : 'ошибки'}</span>
        )}
      </div>

      <div className="text-sm text-[var(--color-text-secondary)] italic leading-relaxed p-3 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)]">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] block mb-1">Исходный текст</span>
        {source}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-danger)] block mb-1">Ответ пользователя</span>
          <p className="text-sm leading-relaxed">
            {userErrorFragments.length > 0
              ? highlightDifferences(user, userErrorFragments, 'bg-[var(--color-danger)]/20 text-[var(--color-danger)] rounded px-0.5')
              : user}
          </p>
        </div>

        <div className="p-3 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-success)] block mb-1">Правильный вариант</span>
          <p className="text-sm leading-relaxed">
            {correctErrorFragments.length > 0
              ? highlightDifferences(correct, correctErrorFragments, 'bg-[var(--color-success)]/20 text-[var(--color-success)] rounded px-0.5')
              : correct}
          </p>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] block">
            Разбор ошибок
          </span>
          {errors.map((err, i) => (
            <ErrorExplanation key={i} error={err} />
          ))}
        </div>
      )}
    </div>
  );
}
