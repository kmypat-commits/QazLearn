import ProgressBar from '../components/ProgressBar';
import FeaturesCards from '../components/ui/feature-shader-cards';
import type { DictionaryEntry, ProgressEntry, PracticeMode } from '../types/dictionary';
import { needsReview, isMastered } from '../lib/spacedRepetition';
import { loadStreak, loadDailyStats } from '../lib/storage';

interface DashboardProps {
  entries: DictionaryEntry[];
  progress: Record<number, ProgressEntry>;
  onGoToPractice: (options?: { ids?: number[]; mode?: PracticeMode }) => void;
  onNavigate?: (page: string) => void;
}

export default function Dashboard({ entries, progress, onGoToPractice, onNavigate }: DashboardProps) {
  const streak = loadStreak();
  const dailyStats = loadDailyStats();

  const words = entries.filter(e => e.type === 'word');
  const phrases = entries.filter(e => e.type === 'phrase');

  const totalWords = words.length;
  const masteredWords = words.filter(e => {
    const p = progress[e.id];
    return p && isMastered(p);
  }).length;

  const totalPhrases = phrases.length;
  const masteredPhrases = phrases.filter(e => {
    const p = progress[e.id];
    return p && isMastered(p);
  }).length;

  const dueForReview = entries.filter(e => {
    const p = progress[e.id];
    return p && needsReview(p) && p.reviewStatus !== 'mastered';
  }).length;

  const dueIds = entries
    .filter(e => {
      const p = progress[e.id];
      return p && needsReview(p) && p.reviewStatus !== 'mastered';
    })
    .map(e => e.id);

  const todayCorrect = dailyStats.correct;
  const todayWrong = dailyStats.wrong;
  const totalAnswered = todayCorrect + todayWrong;
  const accuracy = totalAnswered > 0 ? Math.round((todayCorrect / totalAnswered) * 100) : 0;

  const hardWords = words.filter(e => e.difficulty >= 3).length;
  const progressHard = words.filter(e => {
    const p = progress[e.id];
    if (!p || p.attempts === 0) return false;
    if (p.reviewStatus === 'mastered') return false;
    const accuracy = p.correctAnswers / p.attempts;
    return accuracy < 0.5 || p.knowledgeLevel <= 1 || p.wrongAnswers >= 2;
  }).map(e => e.id);

  const categoryLabels: Record<string, string> = {
    office: 'Офисная лексика',
    official: 'Официально-деловая',
    it_ai: 'IT и ИИ',
    general: 'Общая',
  };

  return (
    <>
      <div className="max-w-2xl mx-auto space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card text-center card-hover" onClick={() => onGoToPractice({ ids: dueIds, mode: 'flashcard' })}>
          <div className="text-2xl font-bold text-[var(--color-primary)]">{dueForReview}</div>
          <div className="text-xs text-[var(--color-text-secondary)]">На повторение</div>
        </div>
        <div className="card text-center card-hover">
          <div className="text-2xl font-bold text-[var(--color-warning)]">{streak}</div>
          <div className="text-xs text-[var(--color-text-secondary)]">Дней подряд</div>
        </div>
        <div className="card text-center card-hover">
          <div className="text-2xl font-bold text-[var(--color-success)]">{accuracy}%</div>
          <div className="text-xs text-[var(--color-text-secondary)]">Точность</div>
        </div>
        <div className="card text-center card-hover" onClick={() => onNavigate?.('progress')}>
          <div className="text-2xl font-bold">{masteredWords}</div>
          <div className="text-xs text-[var(--color-text-secondary)]">Освоено слов</div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Быстрые действия</h2>
        <div className="grid grid-cols-2 gap-3">
          <button className="btn btn-primary" onClick={() => onGoToPractice({ mode: 'flashcard' })}>
            Продолжить обучение
          </button>
          <button className="btn btn-success" onClick={() => onNavigate?.('words')}>
            Новые слова
          </button>
          <button className="btn btn-warning" onClick={() => onGoToPractice({ ids: progressHard, mode: 'flashcard' })}>
            Повторить сложные
          </button>
          <button className="btn btn-ghost" onClick={() => onNavigate?.('phrases')}>
            Практика фраз
          </button>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Сегодня на повторение</h2>
        {dueForReview > 0 ? (
          <>
            <p className="text-[var(--color-text-secondary)] mb-3">
              У вас {dueForReview} карточек для повторения сегодня
            </p>
            <button className="btn btn-primary text-sm" onClick={() => onGoToPractice({ ids: dueIds, mode: 'flashcard' })}>
              Повторить ({dueForReview})
            </button>
          </>
        ) : (
          <p className="text-[var(--color-text-secondary)] mb-3">На сегодня всё! Отличная работа.</p>
        )}
        <ProgressBar value={todayCorrect} max={Math.max(todayCorrect + todayWrong, 1)} label="Сегодня" showPercent />
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Прогресс обучения</h2>
        <div className="space-y-3">
          <ProgressBar value={masteredWords} max={Math.max(totalWords, 1)} label={`Слова: ${masteredWords}/${totalWords}`} color="var(--color-primary)" />
          <ProgressBar value={masteredPhrases} max={Math.max(totalPhrases, 1)} label={`Фразы: ${masteredPhrases}/${totalPhrases}`} color="var(--color-success)" />
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Категории</h2>
        <div className="space-y-2">
          {Object.entries(categoryLabels).map(([key, label]) => {
            const count = entries.filter(e => e.category === key).length;
            const mastered = entries.filter(e => {
              const p = progress[e.id];
              return e.category === key && p && isMastered(p);
            }).length;
            return (
              <div key={key} className="flex justify-between items-center text-sm">
                <span>{label}</span>
                <span className="text-[var(--color-text-secondary)]">{mastered}/{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Сложные слова (уровень 3+)</h2>
        <p className="text-[var(--color-text-secondary)] mb-2">
          В словаре {hardWords} слов повышенной сложности
        </p>
        <button className="btn btn-warning text-sm" onClick={() => onGoToPractice({ ids: entries.filter(e => e.type === 'word' && e.difficulty >= 3).map(e => e.id), mode: 'flashcard' })}>
          Повторить сложные
        </button>
      </div>
      </div>

      <FeaturesCards />
    </>
  );
}
