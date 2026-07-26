import { useState, useEffect, useCallback } from 'react';
import type { GrammarRule } from '../../types/dictionary';
import { parseGrammarRulesCsv } from '../../lib/grammarRules';

interface Question {
  type: 'ending' | 'assemble' | 'translate' | 'variant' | 'insert';
  rule: GrammarRule;
  prompt: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

interface Props {
  ruleIds: string[];
  onExit: () => void;
  onOpenRule: (id: string) => void;
}

export default function RulePractice({ ruleIds, onExit, onOpenRule }: Props) {
  const [rules, setRules] = useState<GrammarRule[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [done, setDone] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    fetch('/data/kazakh_grammar_rules.csv')
      .then(r => r.text())
      .then(text => {
        const parsed = parseGrammarRulesCsv(text);
        const filtered = parsed.filter(r => ruleIds.includes(r.id));
        setRules(filtered);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [ruleIds]);

  const generateQuestions = useCallback((rules: GrammarRule[]): Question[] => {
    const result: Question[] = [];
    for (const rule of rules) {
      const examples = rule.examples;
      if (examples.length === 0) continue;

      for (let i = 0; i < Math.min(examples.length, 3); i++) {
        const ex = examples[i];
        const type = (['ending', 'assemble', 'translate', 'variant', 'insert'] as const)[i % 5];
        
        if (type === 'ending') {
          const lastWord = ex.kz.split(/\s+/).pop() || '';
          const prompt = ex.kz.replace(lastWord, '___');
          const options = extractEndings(rule.formula);
          result.push({
            type, rule, prompt: `${prompt}\n\n${ex.ru}`,
            options: options.length > 0 ? options : ['-атын', '-етін', '-йтын', '-йтін'],
            correctAnswer: lastWord,
            explanation: `Правильное окончание: ${lastWord}. ${rule.shortRuleRu}`,
          });
        } else if (type === 'assemble') {
          result.push({
            type, rule,
            prompt: `Соберите: ${ex.ru}`,
            correctAnswer: ex.kz,
            explanation: `Правильный вариант: ${ex.kz}. ${rule.shortRuleRu}`,
          });
        } else if (type === 'translate') {
          result.push({
            type, rule,
            prompt: `Переведите: ${ex.ru}`,
            correctAnswer: ex.kz,
            explanation: `Правильный перевод: ${ex.kz}. ${rule.shortRuleRu}`,
          });
        } else if (type === 'variant') {
          const wrongVariants = generateWrongVariants(ex.kz, rule);
          const options = [ex.kz, ...wrongVariants].sort(() => Math.random() - 0.5);
          result.push({
            type, rule,
            prompt: `Выберите правильный вариант:\n\n${ex.ru}`,
            options,
            correctAnswer: ex.kz,
            explanation: `Правильный вариант: ${ex.kz}. ${rule.shortRuleRu}`,
          });
        } else if (type === 'insert') {
          const parts = ex.kz.split(/\s+/);
          const blankIdx = Math.floor(parts.length / 2);
          const correct = parts[blankIdx];
          parts[blankIdx] = '______';
          const prompt = `Вставьте пропущенное слово:\n\n${parts.join(' ')}\n\n${ex.ru}`;
          result.push({
            type, rule, prompt,
            options: [correct, ...generateDistractors(correct, rule)].sort(() => Math.random() - 0.5),
            correctAnswer: correct,
            explanation: `Правильный ответ: ${correct}. ${rule.shortRuleRu}`,
          });
        }
      }
    }
    return result.sort(() => Math.random() - 0.5);
  }, []);

  useEffect(() => {
    if (loaded && rules.length > 0) {
      const qs = generateQuestions(rules);
      setQuestions(qs);
    }
  }, [loaded, rules, generateQuestions]);

  const currentQuestion = questions[currentIndex];

  const handleSelect = (answer: string) => {
    if (answered) return;
    setSelectedAnswer(answer);
    setAnswered(true);
    setShowExplanation(true);
    if (answer === currentQuestion.correctAnswer) {
      setCorrectCount(prev => prev + 1);
    } else {
      setWrongCount(prev => prev + 1);
    }
  };

  const handleNext = () => {
    setShowExplanation(false);
    setSelectedAnswer(null);
    setAnswered(false);
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setDone(true);
    }
  };

  if (!loaded) {
    return <div className="text-center py-10 text-[var(--color-text-secondary)]">Загрузка заданий...</div>;
  }

  if (rules.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-[var(--color-text-secondary)] mb-4">Правила не найдены</p>
        <button className="btn btn-ghost" onClick={onExit}>Назад</button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-4">
        <div className="card">
          <h2 className="text-2xl font-bold mb-2">Практика правил завершена!</h2>
          <div className="text-5xl font-bold text-[var(--color-primary)] my-4">
            {correctCount}/{correctCount + wrongCount}
          </div>
          <p className="text-[var(--color-text-secondary)]">Правильно: {correctCount}</p>
          <p className="text-[var(--color-text-secondary)] mb-4">Ошибок: {wrongCount}</p>
          <div className="flex gap-2 justify-center">
            <button className="btn btn-primary" onClick={() => { setDone(false); setCurrentIndex(0); setCorrectCount(0); setWrongCount(0); const qs = generateQuestions(rules); setQuestions(qs); }}>
              Повторить
            </button>
            <button className="btn btn-ghost" onClick={onExit}>Завершить</button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="text-center py-10">
        <p className="text-[var(--color-text-secondary)] mb-4">Нет заданий для выбранных правил</p>
        <button className="btn btn-ghost" onClick={onExit}>Назад</button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="text-center text-sm text-[var(--color-text-secondary)]">
        {currentIndex + 1} / {questions.length}
        <span className="mx-2">·</span>
        Правильно: {correctCount}
        <span className="mx-2">·</span>
        Ошибок: {wrongCount}
      </div>

      <div className="card">
        <div className="text-xs font-semibold text-[var(--color-primary)] mb-1">{currentQuestion.type === 'ending' ? 'Выберите окончание' : currentQuestion.type === 'assemble' ? 'Соберите словосочетание' : currentQuestion.type === 'translate' ? 'Перевод' : currentQuestion.type === 'variant' ? 'Выберите вариант' : 'Вставьте форму'}</div>
        <h2 className="text-lg font-bold mb-1">{currentQuestion.rule.titleRu}</h2>
        <div className="text-sm text-[var(--color-text-secondary)] mb-4">{currentQuestion.rule.titleKz}</div>
        <div className="text-base leading-relaxed whitespace-pre-line mb-4">{currentQuestion.prompt}</div>

        {currentQuestion.options ? (
          <div className="space-y-2">
            {currentQuestion.options.map((opt, i) => {
              let cls = 'w-full text-left px-4 py-3 rounded-xl border border-[var(--color-border)] text-sm font-medium transition-all hover:bg-black/5 dark:hover:bg-white/5';
              if (answered) {
                if (opt === currentQuestion.correctAnswer) cls = 'w-full text-left px-4 py-3 rounded-xl border-2 border-[var(--color-success)] bg-[var(--color-success)]/5 text-sm font-medium';
                else if (opt === selectedAnswer) cls = 'w-full text-left px-4 py-3 rounded-xl border-2 border-[var(--color-danger)] bg-[var(--color-danger)]/5 text-sm font-medium';
                else cls = 'w-full text-left px-4 py-3 rounded-xl border border-[var(--color-border)] text-sm font-medium opacity-40';
              }
              return (
                <button key={i} className={cls} onClick={() => handleSelect(opt)} disabled={answered}>
                  {opt}
                </button>
              );
            })}
          </div>
        ) : (
          <div>
            <div className="border border-[var(--color-border)] rounded-xl p-3 mb-3">
              <p className="text-sm text-[var(--color-text-secondary)] mb-2">Введите ответ:</p>
              <div className="text-sm font-mono bg-[var(--color-bg)] p-3 rounded-lg">
                {currentQuestion.correctAnswer}
              </div>
            </div>
            {!answered && (
              <button className="btn btn-primary w-full" onClick={() => handleSelect(currentQuestion.correctAnswer)}>
                Показать ответ
              </button>
            )}
          </div>
        )}

        {showExplanation && (
          <div className="mt-4 p-3 rounded-xl bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20">
            <p className="text-sm">
              {selectedAnswer === currentQuestion.correctAnswer ? '✓ ' : '✗ '}
              {currentQuestion.explanation}
            </p>
            <button className="text-xs text-[var(--color-primary)] mt-1 underline" onClick={() => onOpenRule(currentQuestion.rule.id)}>
              Открыть правило
            </button>
          </div>
        )}
      </div>

      {answered && (
        <button className="btn btn-primary w-full" onClick={handleNext}>
          {currentIndex + 1 < questions.length ? 'Далее' : 'Завершить'}
        </button>
      )}
    </div>
  );
}

function extractEndings(formula: string): string[] {
  const endings = formula.match(/-[а-яөүұңғқәіӘІӨҰҮҢҒҚ]+/g) || [];
  return [...new Set(endings)];
}

function generateWrongVariants(correct: string, rule: GrammarRule): string[] {
  const words = rule.examples.map(e => e.kz).filter(w => w !== correct);
  return words.slice(0, 3);
}

function generateDistractors(correct: string, rule: GrammarRule): string[] {
  const all = rule.examples.map(e => e.kz.split(/\s+/)).flat();
  const filtered = all.filter(w => w !== correct && w.length > 2);
  return [...new Set(filtered)].slice(0, 3);
}
