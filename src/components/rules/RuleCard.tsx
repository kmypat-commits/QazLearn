import type { GrammarRule, RuleProgress } from '../../types/dictionary';

interface Props {
  rule: GrammarRule;
  progress: RuleProgress | null;
  onSetStatus: (id: string, status: 'learned' | 'review') => void;
  onGoToPractice: (ids: string[]) => void;
}

export default function RuleCard({ rule, progress, onSetStatus, onGoToPractice }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold">{rule.titleRu}</h2>
        <p className="text-lg text-[var(--color-text-secondary)]">{rule.titleKz}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="badge badge-learning">{rule.category}</span>
        <span className="badge">Уровень {rule.level}</span>
        {rule.tags.map(t => <span key={t} className="badge">{t}</span>)}
      </div>

      <div className="card">
        <p className="text-[var(--color-text)]">{rule.shortRuleRu}</p>
      </div>

      {rule.formation && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Как образуется</h3>
          <div className="card">
            <p>{rule.formation}</p>
          </div>
        </div>
      )}

      {rule.formula && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Формула</h3>
          <div className="card bg-[var(--color-primary)]/5 border-2 border-[var(--color-primary)]/20">
            <p className="text-center text-lg font-mono font-semibold text-[var(--color-primary)]">{rule.formula}</p>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-2">Примеры</h3>
        <div className="space-y-2">
          {rule.examples.map((ex, i) => (
            <div key={i} className="card py-3 px-4">
              <p className="font-medium text-[var(--color-text)]">{ex.kz}</p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">{ex.ru}</p>
            </div>
          ))}
        </div>
      </div>

      {rule.noteRu && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Примечание</h3>
          <div className="card bg-[var(--color-warning)]/5 border border-[var(--color-warning)]/20">
            <p className="text-sm">{rule.noteRu}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 pt-2">
        {progress?.status !== 'learned' && (
          <button className="btn btn-success" onClick={() => onSetStatus(rule.id, 'learned')}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5"/></svg>
            Изучено
          </button>
        )}
        {progress?.status !== 'review' && (
          <button className="btn btn-warning" onClick={() => onSetStatus(rule.id, 'review')}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"/></svg>
            Повторить позже
          </button>
        )}
        <button className="btn btn-primary" onClick={() => onGoToPractice([rule.id])}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342"/></svg>
            Перейти к практике
          </button>
      </div>
    </div>
  );
}
