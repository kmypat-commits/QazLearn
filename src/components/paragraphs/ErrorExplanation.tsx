

interface ErrorExplanationProps {
  error: {
    userFragment: string;
    correctFragment: string;
    type: string;
    explanation: string;
    ruleId?: string;
  };
}

const errorTypeLabels: Record<string, string> = {
  spelling: 'Орфография',
  vocabulary: 'Лексика',
  accusative: 'В.п. (аккузатив)',
  genitive: 'Р.п. (генитив)',
  dative: 'Д.п. (датив)',
  ablative: 'Исх.п. (аблатив)',
  possessive: 'Притяжательность',
  verb_form: 'Форма глагола',
  participle: 'Причастие',
  converb: 'Деепричастие',
  word_order: 'Порядок слов',
  collocation: 'Сочетаемость',
  missing_word: 'Пропущено слово',
  extra_word: 'Лишнее слово',
  punctuation: 'Пунктуация',
};

const errorTypeColors: Record<string, string> = {
  spelling: 'var(--color-warning)',
  vocabulary: 'var(--color-primary)',
  accusative: 'var(--color-danger)',
  genitive: 'var(--color-danger)',
  dative: 'var(--color-danger)',
  ablative: 'var(--color-danger)',
  possessive: 'var(--color-danger)',
  verb_form: 'var(--color-primary)',
  participle: 'var(--color-primary)',
  converb: 'var(--color-primary)',
  word_order: 'var(--color-warning)',
  collocation: 'var(--color-warning)',
  missing_word: 'var(--color-danger)',
  extra_word: 'var(--color-warning)',
  punctuation: 'var(--color-text-secondary)',
};

export default function ErrorExplanation({ error }: ErrorExplanationProps) {
  const typeColor = errorTypeColors[error.type] || 'var(--color-text-secondary)';
  const typeLabel = errorTypeLabels[error.type] || error.type;

  return (
    <div className="flex flex-col gap-2 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
          style={{ backgroundColor: `${typeColor}18`, color: typeColor }}
        >
          {typeLabel}
        </span>
        {error.ruleId && (
          <span className="text-[11px] text-[var(--color-primary)] font-medium">
            Правило: {error.ruleId}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1.5 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-[var(--color-text-secondary)] text-xs shrink-0">Вы написали:</span>
          <span className="line-through text-[var(--color-danger)] font-medium">
            {error.userFragment}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[var(--color-text-secondary)] text-xs shrink-0">Правильно:</span>
          <span className="text-[var(--color-success)] font-medium">
            {error.correctFragment}
          </span>
        </div>
      </div>

      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
        {error.explanation}
      </p>
    </div>
  );
}
