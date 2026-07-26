import type { DictionaryEntry, ProgressEntry } from '../types/dictionary';
import { isMastered, needsReview } from '../lib/spacedRepetition';
import { loadStreak, loadDailyStats } from '../lib/storage';
import ProgressBar from '../components/ProgressBar';

interface ProgressViewProps {
  entries: DictionaryEntry[];
  progress: Record<number, ProgressEntry>;
  onNavigate: (page: 'words' | 'phrases' | 'practice', filter?: { status?: string; ids?: number[] }) => void;
}

const GOALS = [
  {
    label: '300 активных слов',
    target: 300,
    deadline: '31 августа 2026',
    date: new Date('2026-08-31'),
  },
  {
    label: '800 активных слов',
    target: 800,
    deadline: '31 декабря 2026',
    date: new Date('2026-12-31'),
  },
  {
    label: '1500 активных слов',
    target: 1500,
    deadline: '31 мая 2027',
    date: new Date('2027-05-31'),
  },
];

export default function ProgressView({ entries, progress, onNavigate }: ProgressViewProps) {
  const words = entries.filter(e => e.type === 'word');
  const phrases = entries.filter(e => e.type === 'phrase');

  const masteredWords = words.filter(e => {
    const p = progress[e.id];
    return p && isMastered(p);
  }).length;

  const masteredPhrases = phrases.filter(e => {
    const p = progress[e.id];
    return p && isMastered(p);
  }).length;

  const dueForReview = entries.filter(e => {
    const p = progress[e.id];
    return p && needsReview(p) && p.reviewStatus !== 'mastered';
  }).length;

  const streak = loadStreak();
  const dailyStats = loadDailyStats();
  const todayCorrect = dailyStats.correct;
  const todayWrong = dailyStats.wrong;
  const totalAnswered = todayCorrect + todayWrong;
  const accuracy = totalAnswered > 0 ? Math.round((todayCorrect / totalAnswered) * 100) : 0;

  const totalLearning = entries.filter(e => {
    const p = progress[e.id];
    return p && (p.reviewStatus === 'learning' || p.reviewStatus === 'review');
  }).length;

  const totalNew = entries.filter(e => {
    const p = progress[e.id];
    return !p || p.reviewStatus === 'new';
  }).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button className="card card-hover text-center" onClick={() => onNavigate('words')}>
          <div className="text-2xl font-bold text-[var(--color-primary)]">{words.length}</div>
          <div className="text-xs text-[var(--color-text-secondary)]">Всего слов</div>
        </button>
        <button className="card card-hover text-center" onClick={() => onNavigate('words', { status: 'mastered' })}>
          <div className="text-2xl font-bold text-[var(--color-success)]">{masteredWords}</div>
          <div className="text-xs text-[var(--color-text-secondary)]">Освоено слов</div>
        </button>
        <button className="card card-hover text-center" onClick={() => onNavigate('phrases')}>
          <div className="text-2xl font-bold text-[var(--color-primary)]">{phrases.length}</div>
          <div className="text-xs text-[var(--color-text-secondary)]">Всего фраз</div>
        </button>
        <button className="card card-hover text-center" onClick={() => onNavigate('phrases', { status: 'mastered' })}>
          <div className="text-2xl font-bold text-[var(--color-success)]">{masteredPhrases}</div>
          <div className="text-xs text-[var(--color-text-secondary)]">Освоено фраз</div>
        </button>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Ежедневная статистика</h2>
        <div className="grid grid-cols-3 gap-3 text-center">
          <button onClick={() => onNavigate('practice', { ids: entries.filter(e => { const p = progress[e.id]; return p && needsReview(p) && p.reviewStatus !== 'mastered'; }).map(e => e.id) })}>
            <div className="text-xl font-bold text-[var(--color-primary)]">{dueForReview}</div>
            <div className="text-xs text-[var(--color-text-secondary)]">На сегодня</div>
          </button>
          <div>
            <div className="text-xl font-bold">{todayCorrect}</div>
            <div className="text-xs text-[var(--color-text-secondary)]">Правильно</div>
          </div>
          <div>
            <div className="text-xl font-bold text-[var(--color-warning)]">{accuracy}%</div>
            <div className="text-xs text-[var(--color-text-secondary)]">Точность</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Серия дней</h2>
        <div className="text-center">
          <div className="text-5xl font-bold text-[var(--color-warning)] mb-2">{streak}</div>
          <p className="text-sm text-[var(--color-text-secondary)]">дней подряд</p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Распределение слов по статусам</h2>
        <div className="space-y-2">
          <button className="w-full text-left" onClick={() => onNavigate('words', { status: 'mastered' })}>
            <ProgressBar value={masteredWords} max={Math.max(words.length, 1)} label={`Освоено: ${masteredWords}`} color="var(--color-success)" />
          </button>
          <button className="w-full text-left" onClick={() => onNavigate('words', { status: 'learning' })}>
            <ProgressBar value={totalLearning} max={Math.max(words.length, 1)} label={`В процессе: ${totalLearning}`} color="var(--color-warning)" />
          </button>
          <button className="w-full text-left" onClick={() => onNavigate('words', { status: 'new' })}>
            <ProgressBar value={totalNew} max={Math.max(words.length, 1)} label={`Новых: ${totalNew}`} color="var(--color-primary)" />
          </button>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Цели</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-3">
          Цели считаются только по уникальным словам (type=word)
        </p>
        <div className="space-y-4">
          {GOALS.map(goal => {
            const remaining = goal.target - masteredWords;
            const isReached = masteredWords >= goal.target;
            const daysLeft = Math.ceil((goal.date.getTime() - Date.now()) / 86400000);
            return (
              <div key={goal.label} className="p-4 rounded-xl border border-[var(--color-border)]">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="font-medium">{goal.label}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      до {goal.deadline}
                      {daysLeft > 0 ? ` (осталось ${daysLeft} дн.)` : ''}
                    </p>
                  </div>
                  <span className={`badge ${isReached ? 'badge-mastered' : 'badge-new'}`}>
                    {isReached ? 'Достигнута' : `${masteredWords}/${goal.target}`}
                  </span>
                </div>
                <ProgressBar
                  value={masteredWords}
                  max={goal.target}
                  showPercent
                  color={isReached ? 'var(--color-success)' : 'var(--color-primary)'}
                />
                {!isReached && remaining > 0 && daysLeft > 0 && (
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                    Нужно учить по {Math.ceil(remaining / daysLeft)} слов(а) в день
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Статистика по категориям</h2>
        <div className="space-y-2">
          {['office', 'official', 'it_ai', 'general'].map(cat => {
            const catEntries = entries.filter(e => e.category === cat);
            const mastered = catEntries.filter(e => {
              const p = progress[e.id];
              return p && isMastered(p);
            }).length;
            return (
              <div key={cat} className="flex justify-between items-center text-sm py-1">
                <span className="capitalize">{cat === 'it_ai' ? 'IT и ИИ' : cat === 'office' ? 'Офис' : cat === 'official' ? 'Официально-деловой' : 'Общее'}</span>
                <span className="text-[var(--color-text-secondary)]">
                  <span className="font-medium text-[var(--color-success)]">{mastered}</span> / {catEntries.length}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
