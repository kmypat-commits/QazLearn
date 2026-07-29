import SentenceComparison from './SentenceComparison';

interface ParagraphResultProps {
  sourceText: string;
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
  errorTypes: {
    type: string;
    count: number;
  }[];
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

const errorColors: Record<string, string> = {
  spelling: 'var(--color-warning)',
  vocabulary: 'var(--color-primary)',
  word_order: 'var(--color-warning)',
  collocation: 'var(--color-warning)',
  missing_word: 'var(--color-danger)',
  extra_word: 'var(--color-warning)',
  punctuation: 'var(--color-text-secondary)',
};

export default function ParagraphResult({
  sourceText,
  userAnswer,
  correctText,
  sentences,
  totalCorrect,
  totalPartial,
  totalErrors,
  errorTypes,
}: ParagraphResultProps) {
  const sortedErrorTypes = [...errorTypes].sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      <div className="card space-y-3">
        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Исходный текст</h3>
        <p className="text-base leading-relaxed">{sourceText}</p>
      </div>

      <div className="card space-y-3">
        <h3 className="text-sm font-semibold text-[var(--color-danger)] uppercase tracking-wider">Ответ пользователя</h3>
        <p className="text-base leading-relaxed">{userAnswer}</p>
      </div>

      <div className="card space-y-3">
        <h3 className="text-sm font-semibold text-[var(--color-success)] uppercase tracking-wider">Правильный вариант</h3>
        <p className="text-base leading-relaxed">{correctText}</p>
      </div>

      {sentences.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Разбор по предложениям</h3>
          {sentences.map((s, i) => (
            <SentenceComparison
              key={i}
              index={i}
              source={s.source}
              user={s.user}
              correct={s.correct}
              errors={s.errors}
            />
          ))}
        </div>
      )}

      <div className="card space-y-4">
        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Итоговая статистика</h3>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-xl bg-[var(--color-success)]/5 border border-[var(--color-success)]/20">
            <div className="text-2xl font-bold text-[var(--color-success)]">{totalCorrect}</div>
            <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">Без ошибок</div>
          </div>
          <div className="p-3 rounded-xl bg-[var(--color-warning)]/5 border border-[var(--color-warning)]/20">
            <div className="text-2xl font-bold text-[var(--color-warning)]">{totalPartial}</div>
            <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">Частично</div>
          </div>
          <div className="p-3 rounded-xl bg-[var(--color-danger)]/5 border border-[var(--color-danger)]/20">
            <div className="text-2xl font-bold text-[var(--color-danger)]">{totalErrors}</div>
            <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">Ошибок</div>
          </div>
        </div>

        {sortedErrorTypes.length > 0 && (
          <div>
            <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-2">
              Типы ошибок
            </span>
            <div className="flex flex-wrap gap-2">
              {sortedErrorTypes.map(et => (
                <span
                  key={et.type}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: `${(errorColors[et.type] || 'var(--color-text-secondary)')}18`,
                    color: errorColors[et.type] || 'var(--color-text-secondary)',
                  }}
                >
                  {errorTypeLabels[et.type] || et.type}
                  <span className="font-bold">{et.count}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
